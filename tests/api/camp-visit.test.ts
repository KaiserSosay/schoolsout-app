import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const insertClick = vi.fn();
const getUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'camps') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 'camp-1',
                    slug: 'summer-fun',
                    website_url: 'https://camp.example.com/signup',
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'camp_clicks') {
        return {
          insert: (payload: Record<string, unknown>) => {
            insertClick(payload);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  insertClick.mockReset();
  getUserMock.mockReset();
});

describe('GET /api/camps/[slug]/visit', () => {
  it('redirects 302 to camp website and logs a click', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/camps/[slug]/visit/route');
    const res = await GET(
      new Request('http://localhost/api/camps/summer-fun/visit', {
        headers: { 'user-agent': 'TestAgent/1.0', referer: 'http://ref' },
      }),
      { params: { slug: 'summer-fun' } },
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://camp.example.com/signup');
    expect(insertClick).toHaveBeenCalledTimes(1);
    const payload = insertClick.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.camp_id).toBe('camp-1');
    expect(payload.user_id).toBeNull();
    expect(payload.user_agent).toBe('TestAgent/1.0');
    expect(payload.referrer).toBe('http://ref');
  });

  it('captures user_id when a session exists', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-42', email: 'p@ex.com' } },
    });
    const { GET } = await import('@/app/api/camps/[slug]/visit/route');
    const res = await GET(
      new Request('http://localhost/api/camps/summer-fun/visit'),
      { params: { slug: 'summer-fun' } },
    );
    expect(res.status).toBe(302);
    expect(insertClick).toHaveBeenCalledTimes(1);
    const payload = insertClick.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.user_id).toBe('user-42');
  });
});
