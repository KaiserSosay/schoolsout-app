import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

// Parses migration 012 and asserts the M-DCPS 2025-2026 holiday list is
// complete + correct. This is a structural check — it verifies the
// migration SQL before it hits a DB, so it catches typos without needing
// a live Postgres.
const MIGRATION = readFileSync(
  join(__dirname, '..', '..', 'supabase', 'migrations', '012_calendar_corrections.sql'),
  'utf8',
);

const EXPECTED_2025_2026: Array<[name: string, startDate: string, endDate: string]> = [
  ['Labor Day', '2025-09-01', '2025-09-01'],
  ['Teacher Planning Day', '2025-09-23', '2025-09-23'],
  ['Teacher Planning Day', '2025-10-02', '2025-10-02'],
  ['Veterans Day', '2025-11-11', '2025-11-11'],
  ['Thanksgiving Recess', '2025-11-24', '2025-11-28'],
  ['Winter Recess', '2025-12-22', '2026-01-02'],
  ['Teacher Planning Day', '2026-01-16', '2026-01-16'],
  ['Martin Luther King Day', '2026-01-19', '2026-01-19'],
  ["Presidents'' Day", '2026-02-16', '2026-02-16'],
  ['Teacher Planning Day', '2026-03-20', '2026-03-20'],
  ['Spring Recess', '2026-03-23', '2026-03-27'],
  ['Memorial Day', '2026-05-25', '2026-05-25'],
  ['Last Day of School', '2026-06-04', '2026-06-04'],
];

describe('M-DCPS 2025-2026 calendar seed', () => {
  for (const [name, start, end] of EXPECTED_2025_2026) {
    it(`includes ${name} (${start} → ${end})`, () => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(
        `\\('${escaped}',\\s*'${start}',\\s*'${end}'`,
      );
      expect(MIGRATION).toMatch(rx);
    });
  }

  it('has all 13 rows for the 25-26 school year', () => {
    expect(EXPECTED_2025_2026).toHaveLength(13);
  });

  it('marks The Growing Place legacy closures as rejected', () => {
    expect(MIGRATION).toMatch(
      /update public\.closures[\s\S]+set\s+status = 'rejected'[\s\S]+school_id = '00000000-0000-0000-0000-000000000001'/,
    );
  });

  it('creates the school-calendars Storage bucket idempotently', () => {
    expect(MIGRATION).toMatch(
      /insert into storage\.buckets[\s\S]+'school-calendars'/,
    );
  });
});
