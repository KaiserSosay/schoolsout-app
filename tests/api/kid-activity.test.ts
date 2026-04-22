import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();
const listChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
};
const insertMock = vi.fn().mockResolvedValue({ data: [], error: null });

listChain.select.mockImplementation(() => listChain);
listChain.eq.mockImplementation(() => listChain);
listChain.order.mockImplementation(() => listChain);

const fromMock = vi.fn(() => ({
  select: listChain.select,
  eq: listChain.eq,
  order: listChain.order,
  limit: listChain.limit,
  insert: insertMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  listChain.limit.mockReset().mockResolvedValue({ data: [], error: null });
  insertMock.mockReset().mockResolvedValue({ data: [], error: null });
  fromMock.mockClear();
});

describe('GET /api/kid-activity', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/kid-activity/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns activity list for signed-in user', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    listChain.limit.mockResolvedValueOnce({
      data: [{ id: 'a1', action: 'viewed_camp', target_id: null, target_name: 'Frost', metadata: {}, created_at: '2026-04-01' }],
      error: null,
    });
    const { GET } = await import('@/app/api/kid-activity/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activity).toHaveLength(1);
  });
});

describe('POST /api/kid-activity', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/kid-activity/route');
    const res = await POST(new Request('http://localhost/api/kid-activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'viewed_camp', target_name: 'x' }),
    }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/kid-activity/route');
    const res = await POST(new Request('http://localhost/api/kid-activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'invalid_action', target_name: 'x' }),
    }));
    expect(res.status).toBe(400);
  });

  it('inserts activity row on happy path', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/kid-activity/route');
    const res = await POST(new Request('http://localhost/api/kid-activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'viewed_camp', target_name: 'Frost Science', metadata: { mode: 'kid' } }),
    }));
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      user_id: 'user-1',
      action: 'viewed_camp',
      target_name: 'Frost Science',
    });
  });
});
