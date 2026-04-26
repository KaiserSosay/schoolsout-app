import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'mailid' }, error: null });
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

type Ctx = { user: { id: string; email: string } | null };
const serverCtx: Ctx = { user: null };
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: serverCtx.user } }) },
  }),
}));

// Service-role mock: returns canned data per (table, filter) combination.
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
const updateRecords: Array<{ table: string; values: Row; filterId?: string; filterIn?: string[] }> = [];

function builder(table: string) {
  let pendingFilters: { col: string; vals: string[] }[] = [];
  const b: Record<string, unknown> = {};
  b.select = () => b;
  b.eq = (col: string, val: unknown) => {
    pendingFilters.push({ col, vals: [String(val)] });
    return b;
  };
  b.is = (col: string, val: unknown) => {
    pendingFilters.push({ col: col + ':is', vals: [String(val)] });
    return b;
  };
  b.in = (col: string, vals: string[]) => {
    pendingFilters.push({ col, vals });
    return b;
  };
  b.maybeSingle = async () => {
    const rows = (tables[table] ?? []).filter((r) =>
      pendingFilters.every((f) => {
        if (f.col.endsWith(':is')) return r[f.col.slice(0, -3)] === null;
        return f.vals.includes(String(r[f.col]));
      }),
    );
    return { data: rows[0] ?? null, error: null };
  };
  b.then = (onFulfilled: (r: { data: Row[]; error: null }) => unknown) => {
    const rows = (tables[table] ?? []).filter((r) =>
      pendingFilters.every((f) => {
        if (f.col.endsWith(':is')) return r[f.col.slice(0, -3)] === null;
        return f.vals.includes(String(r[f.col]));
      }),
    );
    return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
  };
  b.update = (values: Row) => {
    return {
      eq: (col: string, val: unknown) => {
        updateRecords.push({ table, values, filterId: String(val) });
        return Promise.resolve({ error: null });
      },
      in: (col: string, vals: string[]) => {
        updateRecords.push({ table, values, filterIn: vals });
        return Promise.resolve({ error: null });
      },
    };
  };
  return b;
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (t: string) => builder(t),
  }),
}));

beforeEach(() => {
  serverCtx.user = null;
  sendMock.mockClear();
  Object.keys(tables).forEach((k) => delete tables[k]);
  updateRecords.length = 0;
});

async function call(body: unknown) {
  const { POST } = await import(
    '@/app/api/admin/schools/notify-calendar-verified/route'
  );
  return POST(
    new Request('http://localhost/api/admin/schools/notify-calendar-verified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

describe('POST /api/admin/schools/notify-calendar-verified', () => {
  it('rejects unauthenticated callers (401)', async () => {
    const res = await call({ school_id: 's1' });
    expect(res.status).toBe(401);
  });

  it('rejects callers without admin role (403)', async () => {
    serverCtx.user = { id: 'u1', email: 'parent@example.com' };
    tables.users = [{ id: 'u1', role: 'parent' }];
    const res = await call({ school_id: 's1' });
    expect(res.status).toBe(403);
  });

  it('sends one email per pending subscriber and stamps notified_at', async () => {
    serverCtx.user = { id: 'admin1', email: 'admin@example.com' };
    tables.users = [
      { id: 'admin1', role: 'admin' },
      { id: 'parent1', email: 'mom@example.com', preferred_language: 'en' },
      { id: 'parent2', email: 'dad@example.com', preferred_language: 'es' },
    ];
    tables.schools = [
      { id: 's-tgp', slug: 'the-growing-place', name: 'The Growing Place' },
    ];
    tables.school_calendar_notifications = [
      { id: 'n1', school_id: 's-tgp', user_id: 'parent1', notified_at: null },
      { id: 'n2', school_id: 's-tgp', user_id: 'parent2', notified_at: null },
    ];
    const res = await call({ school_id: 's-tgp' });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { sent: number };
    expect(j.sent).toBe(2);
    expect(sendMock).toHaveBeenCalledTimes(2);
    // The Resend payload addresses each recipient individually
    const recipients = sendMock.mock.calls.map(
      (c) => (c[0] as { to: string }).to,
    );
    expect(recipients.sort()).toEqual(['dad@example.com', 'mom@example.com']);
    // notified_at update fires once with the matched row IDs
    const stamp = updateRecords.find(
      (u) => u.table === 'school_calendar_notifications' && u.filterIn,
    );
    expect(stamp).toBeTruthy();
    expect(stamp!.filterIn!.sort()).toEqual(['n1', 'n2']);
    expect(stamp!.values.notified_at).toBeTruthy();
  });

  it('treats already-stamped subscribers as no-ops (idempotent)', async () => {
    serverCtx.user = { id: 'admin1', email: 'admin@example.com' };
    tables.users = [{ id: 'admin1', role: 'admin' }];
    tables.schools = [
      { id: 's-tgp', slug: 'the-growing-place', name: 'The Growing Place' },
    ];
    tables.school_calendar_notifications = [
      { id: 'n1', school_id: 's-tgp', user_id: 'parent1', notified_at: '2026-04-26T13:00:00Z' },
    ];
    const res = await call({ school_id: 's-tgp' });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { sent: number };
    expect(j.sent).toBe(0);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the school does not exist', async () => {
    serverCtx.user = { id: 'admin1', email: 'admin@example.com' };
    tables.users = [{ id: 'admin1', role: 'admin' }];
    tables.schools = [];
    const res = await call({ school_id: 's-missing' });
    expect(res.status).toBe(404);
  });

  it('rejects invalid body with 400', async () => {
    serverCtx.user = { id: 'admin1', email: 'admin@example.com' };
    tables.users = [{ id: 'admin1', role: 'admin' }];
    const res = await call({});
    expect(res.status).toBe(400);
  });
});
