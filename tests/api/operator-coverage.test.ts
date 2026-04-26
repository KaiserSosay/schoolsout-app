import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();
const campLookupResult: { data: { id: string } | null } = { data: null };
const operatorLookupResult: { data: { role: string } | null } = { data: null };
const upsertCoverage = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => undefined, set: () => {} }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'camps') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve(campLookupResult) }),
          }),
        };
      }
      if (table === 'camp_operators') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve(operatorLookupResult) }),
            }),
          }),
        };
      }
      if (table === 'camp_closure_coverage') {
        return {
          upsert: (payload: Record<string, unknown>) => {
            upsertCoverage(payload);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  upsertCoverage.mockReset();
  campLookupResult.data = null;
  operatorLookupResult.data = null;
});

describe('PUT /api/operator/[slug]/coverage', () => {
  it('404s without auth', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { PUT } = await import(
      '@/app/api/operator/[slug]/coverage/route'
    );
    const res = await PUT(
      new Request('http://localhost/c', {
        method: 'PUT',
        body: JSON.stringify({}),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(404);
  });

  it('400s when body fails validation', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = { role: 'owner' };
    const { PUT } = await import(
      '@/app/api/operator/[slug]/coverage/route'
    );
    const res = await PUT(
      new Request('http://localhost/c', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ closure_id: 'not-a-uuid', is_open: true }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(400);
    expect(upsertCoverage).not.toHaveBeenCalled();
  });

  it('upserts a coverage row when caller is operator', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = { role: 'owner' };
    const { PUT } = await import(
      '@/app/api/operator/[slug]/coverage/route'
    );
    const res = await PUT(
      new Request('http://localhost/c', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          closure_id: '550e8400-e29b-41d4-a716-446655440000',
          is_open: false,
          notes: 'closed for the holiday',
        }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(200);
    const payload = upsertCoverage.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.camp_id).toBe('camp-1');
    expect(payload.closure_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(payload.is_open).toBe(false);
    expect(payload.notes).toBe('closed for the holiday');
    expect(payload.set_by_operator_id).toBe('u1');
  });
});
