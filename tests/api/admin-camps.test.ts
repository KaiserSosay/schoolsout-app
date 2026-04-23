import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const getUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'c1', logistics_verified: true },
              error: null,
            }),
          })),
        })),
      })),
    })),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
});

describe('POST /api/admin/camps/update', () => {
  it('rejects unauthenticated callers', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/admin/camps/update/route');
    const res = await POST(
      new Request('http://localhost/api/admin/camps/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_id: '00000000-0000-0000-0000-000000000001',
          mark_verified: true,
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('rejects non-admin emails', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'random@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/camps/update/route');
    const res = await POST(
      new Request('http://localhost/api/admin/camps/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_id: '00000000-0000-0000-0000-000000000001',
          mark_verified: true,
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('accepts partial updates from an admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'admin@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/camps/update/route');
    const res = await POST(
      new Request('http://localhost/api/admin/camps/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_id: '00000000-0000-0000-0000-000000000001',
          phone: '305-555-1234',
          hours_start: '08:30',
          hours_end: '15:30',
          mark_verified: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.logistics_verified).toBe(true);
  });
});
