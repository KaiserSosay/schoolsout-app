import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');

// Each table+filter combination has a distinct expected count. The mock
// records every query the helper makes and returns the matching count from
// the fixture below — that lets us assert "the pill count for X matches the
// row count the corresponding tab loader would render" without a real DB.
type Fixture = {
  feature_requests: { all: number };
  camp_applications: { all: number };
  schools: { needs_research_or_ai_draft: number };
  closures: { ai_draft: number };
  camps: {
    broken_websites: number;
    missing_logistics: number;
    data_quality_distinct: number;
  };
  users: number;
  school_requests: { all: number };
};

let fixture: Fixture;

function makeBuilder(table: string) {
  let websiteStatus: string | null = null;
  let verified: boolean | null = null;
  let logisticsVerified: boolean | null = null;
  let calendarStatusIn: string[] | null = null;
  let closureStatus: string | null = null;
  let dqOr: boolean = false;

  const builder: {
    select: () => typeof builder;
    eq: (col: string, val: unknown) => typeof builder;
    in: (col: string, vals: string[]) => typeof builder;
    or: (clause: string) => typeof builder;
    then: <T>(
      onFulfilled: (r: { count: number; error: null }) => T,
      onRejected?: (e: unknown) => T,
    ) => Promise<T>;
  } = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      if (col === 'website_status' && val === 'broken') websiteStatus = 'broken';
      if (col === 'verified' && val === true) verified = true;
      if (col === 'logistics_verified' && val === false) logisticsVerified = false;
      if (col === 'status' && val === 'ai_draft') closureStatus = 'ai_draft';
      return builder;
    },
    in: (col: string, vals: string[]) => {
      if (col === 'calendar_status') calendarStatusIn = vals;
      return builder;
    },
    or: () => {
      dqOr = true;
      return builder;
    },
    then: <T>(
      onFulfilled: (r: { count: number; error: null }) => T,
    ): Promise<T> => {
      let count = 0;
      if (table === 'feature_requests') count = fixture.feature_requests.all;
      else if (table === 'camp_applications') count = fixture.camp_applications.all;
      else if (table === 'schools' && calendarStatusIn) {
        count = fixture.schools.needs_research_or_ai_draft;
      } else if (table === 'closures' && closureStatus === 'ai_draft') {
        count = fixture.closures.ai_draft;
      } else if (table === 'camps' && websiteStatus === 'broken') {
        count = fixture.camps.broken_websites;
      } else if (
        table === 'camps' &&
        verified === true &&
        logisticsVerified === false
      ) {
        count = fixture.camps.missing_logistics;
      } else if (table === 'camps' && verified === true && dqOr) {
        count = fixture.camps.data_quality_distinct;
      } else if (table === 'users') count = fixture.users;
      else if (table === 'school_requests') count = fixture.school_requests.all;
      return Promise.resolve({ count, error: null }).then(onFulfilled);
    },
  };
  return builder;
}

const dbMock = {
  from: (table: string) => makeBuilder(table),
} as unknown as Parameters<
  typeof import('@/lib/admin/pill-counts').computePillCounts
>[0];

describe('computePillCounts', () => {
  beforeEach(() => {
    fixture = {
      feature_requests: { all: 12 },
      camp_applications: { all: 5 },
      schools: { needs_research_or_ai_draft: 3 },
      closures: { ai_draft: 4 },
      camps: {
        broken_websites: 7,
        missing_logistics: 50,
        data_quality_distinct: 22,
      },
      users: 200,
      school_requests: { all: 9 },
    };
  });

  it('feature requests pill counts ALL rows (no status filter)', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.featureRequests).toBe(12);
  });

  it('camp requests pill counts ALL camp_applications (no status filter)', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.campRequests).toBe(5);
  });

  it('calendar reviews pill = schools needing review + ai_draft closures', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.calendarReviews).toBe(3 + 4);
  });

  it('integrity warnings pill = broken websites + missing logistics (matches the panel sections)', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.integrityWarnings).toBe(7 + 50);
  });

  it('school requests pill counts ALL school_requests (no status filter)', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.schoolRequests).toBe(9);
  });

  it('data quality pill = DISTINCT verified camps with any issue, not the sum of overlapping buckets', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.dataQuality).toBe(22);
  });

  it('users pill is total user count', async () => {
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(dbMock);
    expect(counts.users).toBe(200);
  });

  it('returns zero for tables that throw (schema-defensive — survives missing migration)', async () => {
    type ThrowingBuilder = {
      select: () => ThrowingBuilder;
      eq: () => ThrowingBuilder;
      in: () => ThrowingBuilder;
      or: () => ThrowingBuilder;
      then: <T>(
        _onFulfilled: unknown,
        onRejected: (e: Error) => T,
      ) => Promise<T>;
    };
    const tb: ThrowingBuilder = {
      select: () => tb,
      eq: () => tb,
      in: () => tb,
      or: () => tb,
      then: <T>(_: unknown, onRejected: (e: Error) => T) =>
        Promise.reject(new Error('relation does not exist')).catch(onRejected),
    };
    const throwingDb = {
      from: () => tb,
    } as unknown as Parameters<
      typeof import('@/lib/admin/pill-counts').computePillCounts
    >[0];
    const { computePillCounts } = await import('@/lib/admin/pill-counts');
    const counts = await computePillCounts(throwingDb);
    expect(counts).toEqual({
      featureRequests: 0,
      campRequests: 0,
      calendarReviews: 0,
      integrityWarnings: 0,
      users: 0,
      schoolRequests: 0,
      dataQuality: 0,
    });
  });
});
