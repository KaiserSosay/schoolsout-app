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

// DECISION: This mock is a kitchen sink — /api/admin/metrics fires ~15 parallel
// Supabase queries across many tables. We intercept each .from(<table>) call
// and return a builder whose terminal methods resolve with a sensible empty/
// zero payload, so the route runs end-to-end in isolation.
type MockBuilder = {
  select: (...args: unknown[]) => MockBuilder;
  eq: (...args: unknown[]) => MockBuilder;
  gte: (...args: unknown[]) => MockBuilder;
  order: (...args: unknown[]) => MockBuilder;
  then: Promise<{ data: unknown[]; error: null; count?: number }>['then'];
};

function builder(result: { data: unknown[]; count?: number }): MockBuilder {
  const promise = Promise.resolve({ ...result, error: null });
  const b: MockBuilder = {
    select: () => b,
    eq: () => b,
    gte: () => b,
    order: () => b,
    then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
  } as unknown as MockBuilder;
  return b;
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      // Distinct payloads per table; most are empty.
      switch (table) {
        case 'users':
          return builder({ data: [], count: 0 });
        case 'kid_profiles':
          return builder({ data: [] });
        case 'reminder_subscriptions':
          return builder({ data: [], count: 0 });
        case 'reminder_sends':
          return builder({ data: [] });
        case 'schools':
          return builder({ data: [] });
        case 'camps':
          return builder({ data: [] });
        case 'camp_applications':
          return builder({ data: [] });
        case 'saved_camps':
          return builder({ data: [], count: 0 });
        case 'camp_clicks':
          return builder({ data: [], count: 0 });
        case 'city_requests':
          return builder({ data: [] });
        default:
          return builder({ data: [], count: 0 });
      }
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
});

describe('GET /api/admin/metrics', () => {
  it('rejects unauthenticated callers', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/admin/metrics/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('rejects non-admin emails', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'nobody@example.com' } },
    });
    const { GET } = await import('@/app/api/admin/metrics/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns the full KPI shape with MRR = 0', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin1', email: 'admin@example.com' } },
    });
    const { GET } = await import('@/app/api/admin/metrics/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    // Shape checks.
    expect(body).toHaveProperty('users');
    expect(body.users).toHaveProperty('total');
    expect(body.users).toHaveProperty('newLast7Days');
    expect(body.users).toHaveProperty('newLast30Days');
    expect(Array.isArray(body.users.last7DaysByDay)).toBe(true);

    expect(body).toHaveProperty('kidProfiles');
    expect(body.kidProfiles.byAgeRange).toEqual({ '4-6': 0, '7-9': 0, '10-12': 0, '13+': 0 });

    expect(body).toHaveProperty('reminders');
    expect(body).toHaveProperty('schools');
    expect(body).toHaveProperty('camps');
    expect(body).toHaveProperty('campApplications');
    expect(body).toHaveProperty('savedCamps');
    expect(body).toHaveProperty('campClicks');
    expect(body).toHaveProperty('cityRequests');

    // Honest-data contract — MUST be zero.
    expect(body.mrr).toBeDefined();
    expect(body.mrr.cents).toBe(0);
    expect(typeof body.mrr.note).toBe('string');
    expect(body.mrr.note).toMatch(/Featured/i);
  });
});
