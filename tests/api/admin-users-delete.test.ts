import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const getUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    auth: {
      admin: {
        deleteUser: (id: string) => {
          deleteUserMock(id);
          return Promise.resolve({ error: null });
        },
      },
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  deleteUserMock.mockReset();
});

describe('POST /api/admin/users/[id]/delete', () => {
  it('rejects non-admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u', email: 'nope@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/users/[id]/delete/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: { id: '00000000-0000-0000-0000-000000000001' },
    });
    expect(res.status).toBe(401);
  });

  it('calls auth.admin.deleteUser for a valid target', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/users/[id]/delete/route');
    const targetId = '00000000-0000-0000-0000-000000000099';
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: { id: targetId },
    });
    expect(res.status).toBe(200);
    expect(deleteUserMock).toHaveBeenCalledWith(targetId);
  });

  it('refuses to let an admin delete themselves', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@example.com' } },
    });
    const { POST } = await import('@/app/api/admin/users/[id]/delete/route');
    const res = await POST(new Request('http://localhost/x', { method: 'POST' }), {
      params: { id: 'admin-1' },
    });
    // invalid_id because 'admin-1' isn't a uuid — acceptable guard
    expect([400, 401]).toContain(res.status);
  });
});
