import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const getUserMock = vi.fn();

// --- Helpers to build a thenable chain ---
// A "thenable" object is any chainable that ends with .then when awaited.
// We use a proxy-like stub where each chained method returns itself, and the
// final resolved value is controlled via `__resolve`.
function makeChain(resolve: { data: unknown; error?: unknown; count?: number }) {
  const api: Record<string, unknown> = {};
  const self = api;
  const methods = ['select', 'eq', 'order', 'gte', 'lte', 'in', 'update', 'insert', 'delete'];
  for (const m of methods) {
    api[m] = vi.fn(() => self);
  }
  // Await on `self` resolves through .then (thenable pattern).
  (api as unknown as { then: (cb: (v: typeof resolve) => unknown) => unknown }).then = (cb) =>
    Promise.resolve(resolve).then(cb);
  // Specific terminal methods
  api.single = vi.fn().mockResolvedValue(resolve);
  api.maybeSingle = vi.fn().mockResolvedValue(resolve);
  return api;
}

let listChain = makeChain({ data: [], error: null });
let countChain = makeChain({ data: null, error: null, count: 0 });
let clearChain = makeChain({ data: null, error: null });
let insertChain = makeChain({
  data: {
    id: '11111111-1111-1111-1111-111111111111',
    label: 'Home',
    latitude: 25.7,
    longitude: -80.2,
    is_primary: true,
  },
  error: null,
});

const fromMock = vi.fn(() => ({
  select: (args?: unknown, opts?: { count?: string; head?: boolean }) => {
    if (opts && opts.head) return countChain;
    return listChain;
  },
  update: () => clearChain,
  insert: () => insertChain,
  delete: () => ({
    eq: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
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
  listChain = makeChain({ data: [], error: null });
  countChain = makeChain({ data: null, error: null, count: 0 });
  clearChain = makeChain({ data: null, error: null });
  insertChain = makeChain({
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      label: 'Home',
      latitude: 25.7,
      longitude: -80.2,
      is_primary: true,
    },
    error: null,
  });
});

describe('GET /api/saved-locations', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/saved-locations/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns the signed-in user locations', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    listChain = makeChain({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          label: 'Home',
          latitude: 25.7,
          longitude: -80.2,
          is_primary: true,
          created_at: '2026-04-21',
        },
      ],
      error: null,
    });
    const { GET } = await import('@/app/api/saved-locations/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.locations).toHaveLength(1);
    expect(body.locations[0].label).toBe('Home');
  });
});

describe('POST /api/saved-locations', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await import('@/app/api/saved-locations/route');
    const res = await POST(
      new Request('http://localhost/api/saved-locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'Home', latitude: 25.7, longitude: -80.2 }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/saved-locations/route');
    const res = await POST(
      new Request('http://localhost/api/saved-locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ latitude: 'nope' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('inserts and marks first location primary', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    const { POST } = await import('@/app/api/saved-locations/route');
    const res = await POST(
      new Request('http://localhost/api/saved-locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'Home', latitude: 25.7, longitude: -80.2 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.is_primary).toBe(true);
    expect(body.label).toBe('Home');
  });
});
