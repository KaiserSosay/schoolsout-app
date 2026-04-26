import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

type Ctx = { user: { id: string; email: string } | null };
const serverCtx: Ctx = { user: null };
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: serverCtx.user } }) },
  }),
}));

const upsertMock = vi.fn();
const fromMock = vi.fn((_table: string) => ({
  upsert: (rows: unknown, opts: unknown) => upsertMock(rows, opts),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  serverCtx.user = null;
  upsertMock.mockReset();
  upsertMock.mockResolvedValue({ error: null });
  fromMock.mockClear();
});

async function call(body: unknown) {
  const { POST } = await import('@/app/api/schools/notify-me/route');
  return POST(
    new Request('http://localhost/api/schools/notify-me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

describe('POST /api/schools/notify-me', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await call({ school_id: 'school-1' });
    expect(res.status).toBe(401);
  });

  it('rejects missing school_id with 400', async () => {
    serverCtx.user = { id: 'user-1', email: 'p@example.com' };
    const res = await call({});
    expect(res.status).toBe(400);
  });

  it('upserts a (user_id, school_id) row for an authenticated parent', async () => {
    serverCtx.user = { id: 'user-1', email: 'p@example.com' };
    const res = await call({ school_id: 'school-uuid-tgp' });
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [rows, opts] = upsertMock.mock.calls[0];
    expect(rows).toEqual([
      expect.objectContaining({
        user_id: 'user-1',
        school_id: 'school-uuid-tgp',
      }),
    ]);
    expect(opts).toMatchObject({
      onConflict: 'user_id,school_id',
      ignoreDuplicates: true,
    });
  });

  it('returns 500 if the DB upsert errors', async () => {
    serverCtx.user = { id: 'user-1', email: 'p@example.com' };
    upsertMock.mockResolvedValueOnce({
      error: { message: 'relation does not exist' },
    });
    const res = await call({ school_id: 'school-uuid-tgp' });
    expect(res.status).toBe(500);
  });

  it('returns 400 on malformed JSON', async () => {
    serverCtx.user = { id: 'user-1', email: 'p@example.com' };
    const res = await call('not-json');
    expect(res.status).toBe(400);
  });
});
