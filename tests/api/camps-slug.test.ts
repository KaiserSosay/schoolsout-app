import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const maybeSingleMock = vi.fn();
const fromMock = vi.fn(() => ({
  select: () => ({
    eq: () => ({
      maybeSingle: maybeSingleMock,
    }),
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  maybeSingleMock.mockReset();
  fromMock.mockClear();
});

describe('GET /api/camps/[slug]', () => {
  it('returns the camp on happy path', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: 'c1', slug: 'frost-science-summer-camp', name: 'Frost Science' },
      error: null,
    });
    const { GET } = await import('@/app/api/camps/[slug]/route');
    const res = await GET(new Request('http://localhost/api/camps/frost-science-summer-camp'), {
      params: { slug: 'frost-science-summer-camp' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camp.slug).toBe('frost-science-summer-camp');
  });

  it('returns 404 when not found', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const { GET } = await import('@/app/api/camps/[slug]/route');
    const res = await GET(new Request('http://localhost/api/camps/nope'), { params: { slug: 'nope' } });
    expect(res.status).toBe(404);
  });
});
