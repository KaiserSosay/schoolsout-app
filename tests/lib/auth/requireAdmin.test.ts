import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@test.com');

type UserStub = { id: string; email: string } | null;
const ctx: { user: UserStub; role: string | null } = { user: null, role: null };

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: ctx.user } }) },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: ctx.role ? { role: ctx.role } : null,
          }),
        }),
      }),
    }),
  }),
}));

const redirectMock = vi.fn<(url: string) => never>().mockImplementation((u) => {
  throw new Error('REDIRECT:' + u);
});
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

beforeEach(() => {
  ctx.user = null;
  ctx.role = null;
  redirectMock.mockClear();
});

describe('requireAdminPage', () => {
  it('redirects anon to locale home', async () => {
    const { requireAdminPage } = await import('@/lib/auth/requireAdmin');
    await expect(requireAdminPage({ redirectTo: '/en' })).rejects.toThrow(
      /REDIRECT:\/en/,
    );
    expect(redirectMock).toHaveBeenCalledWith('/en');
  });

  it('redirects non-admin (parent) to locale home', async () => {
    ctx.user = { id: 'u1', email: 'parent@test.com' };
    ctx.role = 'parent';
    const { requireAdminPage } = await import('@/lib/auth/requireAdmin');
    await expect(requireAdminPage()).rejects.toThrow(/REDIRECT:/);
  });

  it('redirects when role row is missing', async () => {
    ctx.user = { id: 'u1', email: 'phantom@test.com' };
    ctx.role = null;
    const { requireAdminPage } = await import('@/lib/auth/requireAdmin');
    await expect(requireAdminPage()).rejects.toThrow(/REDIRECT:/);
  });

  it('returns user+role when admin', async () => {
    ctx.user = { id: 'u1', email: 'admin@test.com' };
    ctx.role = 'admin';
    const { requireAdminPage } = await import('@/lib/auth/requireAdmin');
    const gate = await requireAdminPage();
    expect(gate.role).toBe('admin');
    expect(gate.user.id).toBe('u1');
  });

  it('returns user+role when superadmin', async () => {
    ctx.user = { id: 'u1', email: 'super@test.com' };
    ctx.role = 'superadmin';
    const { requireAdminPage } = await import('@/lib/auth/requireAdmin');
    const gate = await requireAdminPage();
    expect(gate.role).toBe('superadmin');
  });
});

describe('requireAdminApi', () => {
  it('returns 401 response for anon', async () => {
    const { requireAdminApi } = await import('@/lib/auth/requireAdmin');
    const res = await requireAdminApi();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });

  it('returns 403 for non-admin', async () => {
    ctx.user = { id: 'u1', email: 'parent@test.com' };
    ctx.role = 'parent';
    const { requireAdminApi } = await import('@/lib/auth/requireAdmin');
    const res = await requireAdminApi();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(403);
    }
  });

  it('returns ok=true for admin', async () => {
    ctx.user = { id: 'u1', email: 'admin@test.com' };
    ctx.role = 'admin';
    const { requireAdminApi } = await import('@/lib/auth/requireAdmin');
    const res = await requireAdminApi();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.role).toBe('admin');
    }
  });
});
