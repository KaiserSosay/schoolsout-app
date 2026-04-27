import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests on migration 045's SQL. The migration isn't
// applied against a real DB in CI (we don't run a Supabase instance
// in tests), so these assertions catch the failures we can catch
// without one: row count, exact date set, idempotency-by-construction,
// and that the verification block expects the same count.
//
// 045 is the data half of the federal-holidays pair — its companion
// 044 adds the 'derived' value to the closure_status enum. The split
// is forced by Postgres' SQLSTATE 55P04 ("unsafe use of new value")
// when ALTER TYPE ADD VALUE shares a transaction with an INSERT that
// uses the new value.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/045_tgp_federal_holidays_data.sql',
);

const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 045 — TGP 2025-2026 federal holidays (data)', () => {
  it('does NOT contain ALTER TYPE — that lives in pair migration 044', () => {
    expect(SQL).not.toMatch(/alter type/i);
  });

  it('inserts exactly 5 federal-holiday rows (the universally-observed subset)', () => {
    // Each row tuple starts with `(tgp_id, '` — a unique-enough anchor.
    const rowOpens = SQL.match(/\(tgp_id, '/g) ?? [];
    expect(rowOpens.length).toBe(5);
  });

  it('contains the 5 expected federal-holiday dates and skips the 3 variable ones', () => {
    const expectedDates = [
      '2025-09-01', // Labor Day
      '2025-11-27', // Thanksgiving Day
      '2025-12-25', // Christmas Day
      '2026-01-01', // New Year's Day
      '2026-05-25', // Memorial Day
    ];
    for (const d of expectedDates) {
      expect(SQL.includes(`'${d}'`), `missing date ${d}`).toBe(true);
    }
    // The three variable dates that were dropped per the R6 conversation
    // — TGP is PK-5 and may stay open on these. Should NOT appear.
    const droppedDates = [
      '2025-11-11', // Veterans Day
      '2026-01-19', // MLK Day
      '2026-02-16', // Presidents' Day
    ];
    for (const d of droppedDates) {
      expect(SQL.includes(`'${d}'`), `unexpected dropped date ${d}`).toBe(false);
    }
  });

  it('attributes every row with source=federal_holiday_calendar and confidence=medium', () => {
    const sourceMatches =
      SQL.match(/'federal_holiday_calendar'/g) ?? [];
    // 5 inserts + 1 reference in the verification block = 6
    expect(sourceMatches.length).toBeGreaterThanOrEqual(6);

    const confidenceMatches = SQL.match(/'medium'/g) ?? [];
    expect(confidenceMatches.length).toBe(5);
  });

  it('uses ON CONFLICT DO NOTHING so re-running the migration is idempotent', () => {
    expect(SQL).toMatch(
      /on conflict\s*\(school_id, start_date, name\)\s*do nothing/i,
    );
  });

  it('verification block asserts exactly 5 federal-holiday rows', () => {
    expect(SQL).toMatch(/inserted_count\s*!=\s*5/);
    expect(SQL).toMatch(/Expected 5 federal holiday rows/);
  });

  it('looks up TGP by slug (no hardcoded UUID — schools.id varies per env)', () => {
    expect(SQL).toMatch(/where slug = 'the-growing-place'/);
    // Defensive: errors if the school doesn't exist before any insert runs.
    expect(SQL).toMatch(/raise exception 'school slug the-growing-place not found/);
  });
});
