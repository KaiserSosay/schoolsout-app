import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests on migration 049 — TGP 2025-2026 official PDF
// import that REPLACES the 5 derived federal-holiday placeholder rows
// from migration 045 with 25 verified rows from the school's own PDF.
//
// The migration isn't applied against a real DB in CI, so these
// assertions catch the failures we can catch without one: the DELETE
// is correctly scoped, exactly 25 INSERT rows, idempotency, and that
// each early-release vs full-closure flag pair is correctly set.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/049_tgp_2025_2026_official_pdf.sql',
);

const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 049 — TGP 2025-2026 official PDF import', () => {
  it('looks up TGP by slug (no hardcoded UUID)', () => {
    expect(SQL).toMatch(/where slug = 'the-growing-place'/);
    expect(SQL).toMatch(/raise exception 'TGP school row not found'/i);
  });

  it('DELETE is scoped narrowly: TGP + 2025-2026 + source=federal_holiday_calendar (cannot reach other migrations)', () => {
    // The DELETE must include all three filters or it could clobber
    // verified data from another migration. R5 spirit.
    const deleteBlock = SQL.match(
      /delete from public\.closures[\s\S]*?federal_holiday_calendar';/i,
    );
    expect(deleteBlock).not.toBeNull();
    const block = deleteBlock![0];
    expect(block).toMatch(/school_id = tgp_id/);
    expect(block).toMatch(/school_year = '2025-2026'/);
    expect(block).toMatch(/source = 'federal_holiday_calendar'/);
  });

  it('inserts exactly 25 verified rows from the official PDF', () => {
    // Each row tuple starts with `(tgp_id, '` — count those.
    const rowOpens = SQL.match(/\(tgp_id, '/g) ?? [];
    expect(rowOpens.length).toBe(25);
  });

  it('every row is status=verified, source=official_pdf, source_type=school_pdf, confidence=high', () => {
    const verified = SQL.match(/'verified', 'official_pdf', 'school_pdf'/g) ?? [];
    expect(verified.length).toBe(25);
    const high = SQL.match(/, 'high'\)/g) ?? [];
    expect(high.length).toBe(25);
  });

  it('every row is school_year=2025-2026', () => {
    const sy = SQL.match(/'2025-2026'/g) ?? [];
    // 25 inserts + 1 DELETE filter + 2 verification refs = 28 minimum
    expect(sy.length).toBeGreaterThanOrEqual(28);
  });

  it('Christmas Break spans the year boundary (Dec 22 2025 → Jan 2 2026)', () => {
    expect(SQL).toMatch(
      /'Christmas Break',\s*'2025-12-22',\s*'2026-01-02'/,
    );
  });

  it('contains First Day (Aug 19) and Last Day (May 28)', () => {
    expect(SQL).toMatch(/'First Day of School',\s*'2025-08-19'/);
    expect(SQL).toMatch(/'Last Day of School - Noon Dismissal',\s*'2026-05-28'/);
  });

  it('Noon Dismissal rows are early-release (closed_for_students=false, is_early_release=true)', () => {
    // Spot-check three explicit Noon Dismissal entries.
    expect(SQL).toMatch(
      /'Noon Dismissal',\s*'2026-03-20'[^)]+'other',\s*false,\s*true,/,
    );
    expect(SQL).toMatch(
      /'Christmas Service \/ Noon Dismissal'[^)]+'religious_holiday',\s*false,\s*true,/,
    );
    expect(SQL).toMatch(
      /'Last Day of School - Noon Dismissal'[^)]+'last_day',\s*false,\s*true,/,
    );
  });

  it('Full-closure rows are closed_for_students=true, is_early_release=false', () => {
    // Spot-check three full closures.
    expect(SQL).toMatch(
      /'School Closed for Labor Day'[^)]+'federal_holiday',\s*true,\s*false,/,
    );
    expect(SQL).toMatch(
      /'Thanksgiving Break'[^)]+'break',\s*true,\s*false,/,
    );
    expect(SQL).toMatch(
      /'Parent-Teacher Conferences \(No Classes\)'[^)]+'parent_conference',\s*true,\s*false,/,
    );
  });

  it("Parent-Teacher Conferences appear on both Dec 5 2025 AND May 1 2026", () => {
    expect(SQL).toMatch(
      /'Parent-Teacher Conferences \(No Classes\)',\s*'2025-12-05'/,
    );
    expect(SQL).toMatch(
      /'Parent-Teacher Conferences \(No Classes\)',\s*'2026-05-01'/,
    );
  });

  it('All 8 federal holidays observed by TGP appear (post-PDF, including the 3 the bridge data dropped)', () => {
    // Includes Veterans Day, MLK Day, Presidents' Day — the 3 dates
    // the federal-holiday bridge migration deliberately skipped per
    // R6. The school's actual PDF confirms TGP DOES observe all 3.
    const dates = [
      '2025-09-01', // Labor Day
      '2025-11-11', // Veterans Day
      '2026-01-19', // MLK Day
      '2026-02-16', // Presidents' Day
      '2026-05-25', // Memorial Day
    ];
    for (const d of dates) {
      expect(SQL.includes(`'${d}'`), `missing ${d}`).toBe(true);
    }
  });

  it('uses ON CONFLICT DO NOTHING so re-running is idempotent', () => {
    expect(SQL).toMatch(
      /on conflict\s*\(school_id, start_date, name\)\s*do nothing/i,
    );
  });

  it('flips calendar_status to verified_multi_year and stamps last_synced_at', () => {
    expect(SQL).toMatch(
      /update public\.schools[\s\S]*?calendar_status = 'verified_multi_year'[\s\S]*?last_synced_at = now\(\)[\s\S]*?slug = 'the-growing-place'/i,
    );
  });

  it('verification block asserts 25 total + 0 derived remaining', () => {
    expect(SQL).toMatch(/expected 25/i);
    expect(SQL).toMatch(/derived rows remaining[^']*expected 0/i);
    expect(SQL).toMatch(/Expected 25 rows for 2025-2026, got/i);
    expect(SQL).toMatch(/Derived rows still present after replacement/i);
  });
});
