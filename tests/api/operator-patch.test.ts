import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();
const campLookupResult: { data: { id: string } | null } = { data: null };
const operatorLookupResult: { data: { role: string } | null } = { data: null };
const updateCamp = vi.fn();

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
          update: (patch: Record<string, unknown>) => {
            updateCamp(patch);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
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
      return {};
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  updateCamp.mockReset();
  campLookupResult.data = null;
  operatorLookupResult.data = null;
});

describe('PATCH /api/operator/[slug]', () => {
  it('404s an unauthenticated caller', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/cool-camp', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(404);
    expect(updateCamp).not.toHaveBeenCalled();
  });

  it('404s when the camp slug does not exist', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = null; // camps lookup miss
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/missing-camp', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
      { params: { slug: 'missing-camp' } },
    );
    expect(res.status).toBe(404);
  });

  it('404s when the user is not an operator for the camp', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = null;
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/cool-camp', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Hi' }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(404);
    expect(updateCamp).not.toHaveBeenCalled();
  });

  it('updates editable fields and rejects forbidden ones', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = { role: 'owner' };
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/cool-camp', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          description: 'A really fun camp.',
          phone: '305-555-0001',
          price_min_cents: 10000,
          price_max_cents: 30000,
          categories: ['sports', 'STEM'],
          // Should be silently dropped — not in the schema:
          is_featured: true,
        }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(200);
    const patch = updateCamp.mock.calls[0][0] as Record<string, unknown>;
    expect(patch.description).toBe('A really fun camp.');
    expect(patch.phone).toBe('305-555-0001');
    expect(patch.price_min_cents).toBe(10000);
    expect(patch.categories).toEqual(['sports', 'STEM']);
    expect(patch.is_featured).toBeUndefined();
  });

  it('400s when ages_max < ages_min', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = { role: 'owner' };
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/cool-camp', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ages_min: 12, ages_max: 5 }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('ages_max_lt_min');
    expect(updateCamp).not.toHaveBeenCalled();
  });

  it('400s when price_max_cents < price_min_cents', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'op@example.com' } },
    });
    campLookupResult.data = { id: 'camp-1' };
    operatorLookupResult.data = { role: 'owner' };
    const { PATCH } = await import('@/app/api/operator/[slug]/route');
    const res = await PATCH(
      new Request('http://localhost/api/operator/cool-camp', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ price_min_cents: 30000, price_max_cents: 10000 }),
      }),
      { params: { slug: 'cool-camp' } },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('price_max_lt_min');
  });
});
