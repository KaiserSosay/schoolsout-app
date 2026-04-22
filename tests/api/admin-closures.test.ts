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
              data: { id: 'c1', school_id: 's1' },
              error: null,
            }),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'c1' },
            error: null,
          }),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn().mockResolvedValue({
                count: 0,
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      })),
    })),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
});

describe('POST /api/admin/closures/verify', () => {
  it('rejects unauthenticated callers', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/admin/closures/verify/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ closure_id: '00000000-0000-0000-0000-000000000001' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('rejects non-admin emails', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'random@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/closures/verify/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ closure_id: '00000000-0000-0000-0000-000000000001' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body for an admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'admin@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/closures/verify/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/closures/reject', () => {
  it('rejects unauthenticated callers', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/admin/closures/reject/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ closure_id: '00000000-0000-0000-0000-000000000001' }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/closures/bulk-verify', () => {
  it('rejects non-admin callers', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'random@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/closures/bulk-verify/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/bulk-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ school_id: '00000000-0000-0000-0000-000000000001' }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/closures/create', () => {
  it('rejects non-admin callers', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'random@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/closures/create/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          school_id: '00000000-0000-0000-0000-000000000001',
          name: 'Winter Break',
          start_date: '2026-12-22',
          end_date: '2027-01-05',
          emoji: '❄️',
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('validates date ordering', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'admin@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/closures/create/route');
    const res = await POST(
      new Request('http://localhost/api/admin/closures/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          school_id: '00000000-0000-0000-0000-000000000001',
          name: 'Backwards',
          start_date: '2027-01-05',
          end_date: '2026-12-22',
        }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
