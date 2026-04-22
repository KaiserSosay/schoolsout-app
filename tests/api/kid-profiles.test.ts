import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();
const selectChain = {
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
};
const deleteChain = {
  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
};
const insertChain = {
  select: vi.fn().mockResolvedValue({ data: [{ id: 'kid-1', school_id: '00000000-0000-0000-0000-000000000001', age_range: '4-6', ordinal: 1 }], error: null }),
};

const fromMock = vi.fn(() => ({
  select: vi.fn(() => selectChain),
  delete: vi.fn(() => deleteChain),
  insert: vi.fn(() => insertChain),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  fromMock.mockClear();
  selectChain.eq.mockClear();
  selectChain.order.mockClear();
  deleteChain.eq.mockClear();
  insertChain.select.mockClear();
  selectChain.order.mockResolvedValue({ data: [], error: null });
  deleteChain.eq.mockResolvedValue({ data: [], error: null });
  insertChain.select.mockResolvedValue({ data: [], error: null });
});

describe('GET /api/kid-profiles', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/kid-profiles/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns profiles for signed-in user', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    selectChain.order.mockResolvedValueOnce({
      data: [{ id: 'kid-1', school_id: '00000000-0000-0000-0000-000000000001', age_range: '4-6', ordinal: 1, school: { name: 'TGP', district: 'Private', type: 'private' } }],
      error: null,
    });
    const { GET } = await import('@/app/api/kid-profiles/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0].age_range).toBe('4-6');
  });
});

describe('POST /api/kid-profiles', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/kid-profiles/route');
    const res = await POST(new Request('http://localhost/api/kid-profiles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profiles: [] }),
    }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/kid-profiles/route');
    const res = await POST(new Request('http://localhost/api/kid-profiles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profiles: [] }), // min(1) fails
    }));
    expect(res.status).toBe(400);
  });

  it('replaces profiles on happy path', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    insertChain.select.mockResolvedValueOnce({
      data: [{ id: 'kid-1', school_id: '00000000-0000-0000-0000-000000000001', age_range: '4-6', ordinal: 1 }],
      error: null,
    });
    const { POST } = await import('@/app/api/kid-profiles/route');
    const res = await POST(new Request('http://localhost/api/kid-profiles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profiles: [
          { school_id: '00000000-0000-0000-0000-000000000001', age_range: '4-6', ordinal: 1 },
        ],
      }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(1);
    expect(fromMock).toHaveBeenCalledWith('kid_profiles');
  });
});
