import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Thanksgiving Break
DTSTART:20261125
DTEND:20261128
END:VEVENT
BEGIN:VEVENT
SUMMARY:Holiday Concert
DTSTART:20261212
DTEND:20261213
END:VEVENT
BEGIN:VEVENT
SUMMARY:Winter Break
DTSTART:20261222
DTEND:20270103
END:VEVENT
END:VCALENDAR`;

describe('syncIcalForSchool', () => {
  let upsertCalls: Array<{ table: string; rows: unknown[]; opts: unknown }>;
  let updateCalls: Array<{ table: string; values: unknown; eqId: string }>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let dbMock: Parameters<
    typeof import('@/lib/ical/sync').syncIcalForSchool
  >[0]['db'];

  beforeEach(() => {
    upsertCalls = [];
    updateCalls = [];

    dbMock = {
      from: (table: string) => ({
        upsert: (rows: unknown[], opts: unknown) => {
          upsertCalls.push({ table, rows, opts });
          return Promise.resolve({ error: null, data: null });
        },
        update: (values: unknown) => ({
          eq: (_col: string, val: string) => {
            updateCalls.push({ table, values, eqId: val });
            return Promise.resolve({ error: null });
          },
        }),
      }),
    } as unknown as typeof dbMock;

    fetchMock = vi.fn().mockResolvedValue(
      new Response(SAMPLE_ICS, { status: 200 }),
    );
  });

  it('fetches the feed, parses closures, and upserts them with school_id', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    const result = await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid-gulliver',
        slug: 'gulliver-preparatory-school',
        ical_feed_url: 'https://www.gulliverprep.org/events/?ical=1',
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.closuresUpserted).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.gulliverprep.org/events/?ical=1',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(upsertCalls).toHaveLength(1);
    const [{ table, rows, opts }] = upsertCalls;
    expect(table).toBe('closures');
    const rowList = rows as Array<{ school_id: string; name: string }>;
    expect(rowList.every((r) => r.school_id === 'school-uuid-gulliver')).toBe(
      true,
    );
    expect(rowList.map((r) => r.name)).toEqual([
      'Thanksgiving Break',
      'Winter Break',
    ]);
    // Holiday Concert is filtered out by NEGATIVE_KEYWORDS — keep this guard
    // explicit so a future loosening of the closure filter doesn't silently
    // start importing concerts as closures.
    expect(rowList.some((r) => r.name.includes('Concert'))).toBe(false);
    expect(opts).toMatchObject({ onConflict: 'school_id,start_date,name' });
  });

  it('dedupes same-(school, date) rows and keeps the strongest closure name', async () => {
    // v4.1: Palmer Trinity rendered "Labor Day" + "Labor Day - No School"
    // both as closures because the iCal feed published two events on the
    // same day. Sync now dedupes by (school_id, start_date, end_date) —
    // keeps the row with the stronger "no school"/"school closed"
    // marker, falls back to longer name on a tie, alphabetical last.
    const dupeIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Labor Day
DTSTART:20250901
DTEND:20250902
END:VEVENT
BEGIN:VEVENT
SUMMARY:Labor Day - No School
DTSTART:20250901
DTEND:20250902
END:VEVENT
END:VCALENDAR`;
    fetchMock.mockResolvedValueOnce(new Response(dupeIcs, { status: 200 }));
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    const result = await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid-x',
        slug: 'palmer-trinity-school',
        ical_feed_url: 'https://example/feed.ics',
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.closuresUpserted).toBe(1);
    const rowList = upsertCalls[upsertCalls.length - 1].rows as Array<{
      name: string;
    }>;
    expect(rowList).toHaveLength(1);
    expect(rowList[0].name).toBe('Labor Day - No School');
  });

  it('preserves different-school same-(date, name) — dedupe is per school_id', async () => {
    const { dedupeSameDate } = await import('@/lib/ical/sync');
    const out = dedupeSameDate([
      {
        school_id: 's1',
        start_date: '2025-09-01',
        end_date: '2025-09-01',
        name: 'Labor Day',
      },
      {
        school_id: 's2',
        start_date: '2025-09-01',
        end_date: '2025-09-01',
        name: 'Labor Day',
      },
    ]);
    expect(out).toHaveLength(2);
  });

  it('preserves same-name events on different dates', async () => {
    const { dedupeSameDate } = await import('@/lib/ical/sync');
    const out = dedupeSameDate([
      {
        school_id: 's1',
        start_date: '2025-08-13',
        end_date: '2025-08-13',
        name: 'First Day of School',
      },
      {
        school_id: 's1',
        start_date: '2025-08-14',
        end_date: '2025-08-14',
        name: 'First Day of School',
      },
    ]);
    expect(out).toHaveLength(2);
  });

  it('uses longer-name as the tiebreak when neither row has a strong closure signal', async () => {
    const { dedupeSameDate } = await import('@/lib/ical/sync');
    const out = dedupeSameDate([
      {
        school_id: 's1',
        start_date: '2025-09-15',
        end_date: '2025-09-15',
        name: 'Rosh Hashanah',
      },
      {
        school_id: 's1',
        start_date: '2025-09-15',
        end_date: '2025-09-15',
        name: 'Rosh Hashanah (observed)',
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Rosh Hashanah (observed)');
  });

  it('every upserted row has school_year set (no NULLs land in the DB anymore)', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid-gulliver',
        slug: 'gulliver-preparatory-school',
        ical_feed_url: 'https://example/feed.ics',
      },
    });
    const rowList = upsertCalls[0].rows as Array<{
      name: string;
      start_date: string;
      school_year: string;
    }>;
    // Thanksgiving Break starts Nov 25 2026 → academic year 2026-2027.
    // Winter Break starts Dec 22 2026 → same.
    expect(rowList.every((r) => /^\d{4}-\d{4}$/.test(r.school_year))).toBe(true);
    const thanksgiving = rowList.find((r) => r.name === 'Thanksgiving Break');
    expect(thanksgiving?.school_year).toBe('2026-2027');
  });

  it('updates the school row with last_synced_at on success', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid-gulliver',
        slug: 'gulliver-preparatory-school',
        ical_feed_url: 'https://example/feed.ics',
      },
    });
    const schoolUpdate = updateCalls.find((c) => c.table === 'schools');
    expect(schoolUpdate).toBeTruthy();
    expect(schoolUpdate!.eqId).toBe('school-uuid-gulliver');
    const v = schoolUpdate!.values as {
      ical_last_synced_at: string;
      ical_sync_error: string | null;
    };
    expect(v.ical_sync_error).toBeNull();
    expect(typeof v.ical_last_synced_at).toBe('string');
  });

  it('records ical_sync_error on HTTP failure and returns ok=false', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    const result = await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid-gulliver',
        slug: 'gulliver-preparatory-school',
        ical_feed_url: 'https://example/feed.ics',
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected !ok');
    expect(result.error).toMatch(/HTTP 500/);
    const schoolUpdate = updateCalls.find((c) => c.table === 'schools');
    expect(schoolUpdate).toBeTruthy();
    const v = schoolUpdate!.values as { ical_sync_error: string };
    expect(v.ical_sync_error).toMatch(/HTTP 500/);
    expect(upsertCalls).toHaveLength(0);
  });

  it('records ical_sync_error on fetch throw and returns ok=false', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: {
        id: 'school-uuid',
        slug: 'a',
        ical_feed_url: 'https://example/feed.ics',
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected !ok');
    expect(result.error).toMatch(/ECONNREFUSED/);
    expect(upsertCalls).toHaveLength(0);
  });

  it('treats schools with no feed URL as a no-op without touching the DB', async () => {
    const { syncIcalForSchool } = await import('@/lib/ical/sync');
    const result = await syncIcalForSchool({
      db: dbMock,
      fetch: fetchMock as unknown as typeof fetch,
      school: { id: 'school-uuid', slug: 'a', ical_feed_url: null },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.closuresUpserted).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(upsertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });
});
