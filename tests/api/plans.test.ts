import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();

// --- GET chain ---
const getChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
};
getChain.select.mockImplementation(() => getChain);
getChain.eq.mockImplementation(() => getChain);

// --- POST upsert chain ---
const upsertChain = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { id: 'plan-id-1', created_at: 'now', updated_at: 'now' },
    error: null,
  }),
};
upsertChain.select.mockImplementation(() => upsertChain);
const upsertFn = vi.fn(() => upsertChain);

// --- DELETE chain ---
const deleteChain = {
  eq: vi.fn(),
};
// Chain: delete().eq('user_id', ...).eq('closure_id', ...) returns a resolved promise.
deleteChain.eq.mockImplementation(() => ({
  eq: () => Promise.resolve({ data: [], error: null }),
}));

const activityInsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

const fromMock = vi.fn((table: string) => {
  if (table === 'user_plans') {
    return {
      select: getChain.select,
      eq: getChain.eq,
      maybeSingle: getChain.maybeSingle,
      upsert: upsertFn,
      delete: () => deleteChain,
    };
  }
  if (table === 'kid_activity') {
    return { insert: activityInsertMock };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  getChain.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  upsertChain.single.mockReset().mockResolvedValue({
    data: { id: 'plan-id-1', created_at: 'now', updated_at: 'now' },
    error: null,
  });
  upsertFn.mockClear();
  activityInsertMock.mockReset().mockResolvedValue({ data: [], error: null });
  fromMock.mockClear();
});

const CLOSURE = '00000000-0000-0000-0000-000000000001';

describe('POST /api/plans', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/plans/route');
    const res = await POST(new Request('http://localhost/api/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ closure_id: CLOSURE, plan_type: 'coverage' }),
    }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const { POST } = await import('@/app/api/plans/route');
    const res = await POST(new Request('http://localhost/api/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ closure_id: 'not-a-uuid', plan_type: 'bogus' }),
    }));
    expect(res.status).toBe(400);
  });

  it('upserts idempotently (same closure + user)', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const { POST } = await import('@/app/api/plans/route');
    const res = await POST(new Request('http://localhost/api/plans', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        closure_id: CLOSURE,
        plan_type: 'coverage',
        kid_names: ['Noah'],
        camp_ids: [],
        activity_ids: [],
      }),
    }));
    expect(res.status).toBe(200);
    expect(upsertFn).toHaveBeenCalledOnce();
    const args = upsertFn.mock.calls[0];
    expect(args[1]).toMatchObject({ onConflict: 'user_id,closure_id' });
  });
});

describe('GET /api/plans', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET(new Request(`http://localhost/api/plans?closure_id=${CLOSURE}`));
    expect(res.status).toBe(401);
  });

  it('returns 404 when no plan exists', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    getChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET(new Request(`http://localhost/api/plans?closure_id=${CLOSURE}`));
    expect(res.status).toBe(404);
  });

  it('returns the plan when one exists', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    getChain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'p1',
        closure_id: CLOSURE,
        plan_type: 'mix',
        kid_names: ['Noah'],
        camps: [],
        activities: [],
      },
      error: null,
    });
    const { GET } = await import('@/app/api/plans/route');
    const res = await GET(new Request(`http://localhost/api/plans?closure_id=${CLOSURE}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.id).toBe('p1');
    expect(body.plan.plan_type).toBe('mix');
  });
});

describe('DELETE /api/plans', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { DELETE } = await import('@/app/api/plans/route');
    const res = await DELETE(new Request(`http://localhost/api/plans?closure_id=${CLOSURE}`, { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });

  it('removes plan for signed-in user', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const { DELETE } = await import('@/app/api/plans/route');
    const res = await DELETE(new Request(`http://localhost/api/plans?closure_id=${CLOSURE}`, { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });
});
