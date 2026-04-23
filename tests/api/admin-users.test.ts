import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const getUserMock = vi.fn();
const ilikeCalls: string[] = [];

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'users') {
        // Chainable: select().order().ilike?().range()
        const users = [
          {
            id: 'u1',
            email: 'parent1@example.com',
            display_name: 'P One',
            preferred_language: 'en',
            role: 'parent',
            coppa_consent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            last_seen_at: null,
          },
        ];
        const builder = {
          select: () => builder,
          order: () => builder,
          ilike: (_col: string, pattern: string) => {
            ilikeCalls.push(pattern);
            return builder;
          },
          range: () =>
            Promise.resolve({ data: users, count: users.length, error: null }),
        };
        return builder;
      }
      // kid_profiles, reminder_subscriptions, saved_camps hydrate
      const b = {
        select: () => b,
        in: () => b,
        eq: () => b,
        then: (onF: (r: unknown) => unknown, onR?: (e: unknown) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(onF, onR),
      };
      return b;
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  ilikeCalls.length = 0;
});

describe('GET /api/admin/users', () => {
  it('rejects non-admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u', email: 'nope@example.com' } },
    });
    const { GET } = await import('@/app/api/admin/users/route');
    const res = await GET(new Request('http://localhost/api/admin/users'));
    expect(res.status).toBe(403);
  });

  it('returns users with hydrated counts', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { GET } = await import('@/app/api/admin/users/route');
    const res = await GET(new Request('http://localhost/api/admin/users?limit=10&offset=0'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBe(1);
    expect(body.users[0]).toHaveProperty('kidCount');
    expect(body.users[0]).toHaveProperty('ageRanges');
    expect(body.users[0]).toHaveProperty('activeReminders');
    expect(body.users[0]).toHaveProperty('savedCamps');
    expect(body.total).toBe(1);
  });

  it('applies email search as ilike pattern', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { GET } = await import('@/app/api/admin/users/route');
    await GET(new Request('http://localhost/api/admin/users?search=parent'));
    expect(ilikeCalls.some((p) => p.includes('parent'))).toBe(true);
  });
});
