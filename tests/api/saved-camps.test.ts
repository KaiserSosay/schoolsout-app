import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();

// Per-test thenable chains.
const savedListChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
};
const campLookupChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Camp X' }, error: null }),
};
const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });
const deleteChain = {
  eq: vi.fn().mockReturnThis(),
};
const activityInsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

const fromMock = vi.fn((table: string) => {
  if (table === 'saved_camps') {
    return {
      select: savedListChain.select,
      eq: savedListChain.eq,
      order: savedListChain.order,
      upsert: upsertMock,
      delete: () => ({
        eq: (col1: string, val1: string) => ({
          eq: (col2: string, val2: string) => {
            deleteChain.eq(col1, val1, col2, val2);
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    };
  }
  if (table === 'camps') {
    return {
      select: campLookupChain.select,
      eq: campLookupChain.eq,
      maybeSingle: campLookupChain.maybeSingle,
    };
  }
  if (table === 'kid_activity') {
    return { insert: activityInsertMock };
  }
  return {};
});

// Make saved_camps chain properly chainable by returning same object and supporting await at end.
savedListChain.select.mockImplementation(() => savedListChain);
savedListChain.eq.mockImplementation(() => savedListChain);
campLookupChain.select.mockImplementation(() => campLookupChain);
campLookupChain.eq.mockImplementation(() => campLookupChain);

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  savedListChain.order.mockReset().mockResolvedValue({ data: [], error: null });
  campLookupChain.maybeSingle.mockReset().mockResolvedValue({ data: { name: 'Camp X' }, error: null });
  upsertMock.mockReset().mockResolvedValue({ data: [], error: null });
  activityInsertMock.mockReset().mockResolvedValue({ data: [], error: null });
  deleteChain.eq.mockReset();
  fromMock.mockClear();
});

describe('GET /api/saved-camps', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/saved-camps/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns saved camps for signed-in user', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    savedListChain.order.mockResolvedValueOnce({
      data: [{ camp_id: 'c1', created_at: '2026-01-01', camp: { id: 'c1', slug: 'a', name: 'A' } }],
      error: null,
    });
    const { GET } = await import('@/app/api/saved-camps/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(body.camps[0].slug).toBe('a');
  });
});

describe('POST /api/saved-camps', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/saved-camps/route');
    const res = await POST(new Request('http://localhost/api/saved-camps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ camp_id: '00000000-0000-0000-0000-000000000001', saved: true }),
    }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/saved-camps/route');
    const res = await POST(new Request('http://localhost/api/saved-camps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ camp_id: 'not-a-uuid', saved: 'yes' }),
    }));
    expect(res.status).toBe(400);
  });

  it('saves a camp and logs activity', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/saved-camps/route');
    const res = await POST(new Request('http://localhost/api/saved-camps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ camp_id: '00000000-0000-0000-0000-000000000001', saved: true }),
    }));
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledOnce();
    expect(activityInsertMock).toHaveBeenCalledOnce();
    expect(activityInsertMock.mock.calls[0][0]).toMatchObject({
      action: 'saved_camp',
      target_id: '00000000-0000-0000-0000-000000000001',
    });
  });

  it('unsaves a camp and logs unsaved_camp activity', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/saved-camps/route');
    const res = await POST(new Request('http://localhost/api/saved-camps', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ camp_id: '00000000-0000-0000-0000-000000000001', saved: false }),
    }));
    expect(res.status).toBe(200);
    expect(activityInsertMock).toHaveBeenCalledOnce();
    expect(activityInsertMock.mock.calls[0][0]).toMatchObject({ action: 'unsaved_camp' });
  });
});
