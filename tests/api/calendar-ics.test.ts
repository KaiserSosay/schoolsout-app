import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const getUserMock = vi.fn();

// Two separate thenable chains — profiles query (from kid_profiles) and closures query (from closures).
const profilesChain: Record<string, unknown> = {};
const closuresChain: Record<string, unknown> = {};

function makeClosuresChain(rows: unknown[]): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  const methods = ['select', 'in', 'eq', 'gte', 'order'] as const;
  for (const m of methods) c[m] = vi.fn(() => c);
  // Final order() resolves.
  c.order = vi.fn(() => Promise.resolve({ data: rows, error: null }));
  return c;
}

function makeProfilesChain(rows: unknown[]): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => Promise.resolve({ data: rows, error: null }));
  return c;
}

let profilesRows: unknown[] = [];
let closuresRows: unknown[] = [];

const fromMock = vi.fn((table: string) => {
  if (table === 'kid_profiles') return makeProfilesChain(profilesRows);
  if (table === 'closures') return makeClosuresChain(closuresRows);
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
  profilesRows = [];
  closuresRows = [];
  fromMock.mockClear();
});

describe('GET /api/calendar.ics', () => {
  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { GET } = await import('@/app/api/calendar.ics/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns a valid ICS envelope with correct headers', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    profilesRows = [{ school_id: '00000000-0000-0000-0000-000000000001' }];
    closuresRows = [
      { id: 'cl1', school_id: '00000000-0000-0000-0000-000000000001', name: 'Spring Break', start_date: '2027-03-22', end_date: '2027-03-26', emoji: '🌸' },
    ];

    const { GET } = await import('@/app/api/calendar.ics/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/calendar');
    expect(res.headers.get('Content-Disposition')).toContain('schoolsout-calendar.ics');

    const text = await res.text();
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('END:VCALENDAR');
    expect(text).toContain('BEGIN:VEVENT');
    expect(text).toContain('UID:closure-cl1@schoolsout.net');
    expect(text).toContain('DTSTART;VALUE=DATE:20270322');
    // DTEND is exclusive — 2027-03-26 inclusive -> 2027-03-27 exclusive.
    expect(text).toContain('DTEND;VALUE=DATE:20270327');
    expect(text).toContain('Spring Break');
  });

  it('returns an empty-but-valid calendar when user has no kids', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });
    profilesRows = [];
    closuresRows = [];

    const { GET } = await import('@/app/api/calendar.ics/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('END:VCALENDAR');
    expect(text).not.toContain('BEGIN:VEVENT');
  });
});
