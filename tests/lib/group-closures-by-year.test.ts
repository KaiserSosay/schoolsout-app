import { describe, it, expect } from 'vitest';
import {
  groupClosuresByYear,
  spansYearBoundary,
} from '@/lib/schools/group-closures-by-year';

const TODAY = '2026-04-26';

function c(start: string, end?: string) {
  return { start_date: start, end_date: end ?? start };
}

describe('groupClosuresByYear', () => {
  it('all closures in one year → single group, no past', () => {
    const result = groupClosuresByYear(
      [c('2026-09-07'), c('2026-11-11'), c('2026-12-21', '2026-12-30')],
      TODAY,
    );
    expect(result.past).toEqual([]);
    expect(Array.from(result.byYear.keys())).toEqual([2026]);
    expect(result.byYear.get(2026)!.length).toBe(3);
  });

  it('closures spanning two years (TGP case) → two groups, past empty', () => {
    const result = groupClosuresByYear(
      [
        c('2026-08-18'),
        c('2026-12-21', '2027-01-01'),
        c('2027-01-04'),
        c('2027-05-27'),
      ],
      TODAY,
    );
    expect(result.past).toEqual([]);
    expect(Array.from(result.byYear.keys())).toEqual([2026, 2027]);
    expect(result.byYear.get(2026)!.length).toBe(2);
    expect(result.byYear.get(2027)!.length).toBe(2);
  });

  it('closures spanning three years → handles gracefully, sorted ascending', () => {
    const result = groupClosuresByYear(
      [
        c('2026-08-18'),
        c('2027-08-17'),
        c('2028-08-16'),
        c('2026-12-21', '2027-01-01'),
      ],
      TODAY,
    );
    expect(Array.from(result.byYear.keys())).toEqual([2026, 2027, 2028]);
  });

  it('all closures past → past populated, byYear empty', () => {
    const result = groupClosuresByYear(
      [c('2025-09-01'), c('2025-12-25', '2026-01-02'), c('2026-04-25')],
      TODAY,
    );
    expect(result.past.length).toBe(3);
    expect(result.byYear.size).toBe(0);
  });

  it('mix of past and upcoming → correct partition', () => {
    const result = groupClosuresByYear(
      [
        c('2025-12-25', '2026-01-02'),
        c('2026-04-25'),
        c('2026-09-07'),
        c('2027-01-04'),
      ],
      TODAY,
    );
    expect(result.past.length).toBe(2);
    expect(Array.from(result.byYear.keys())).toEqual([2026, 2027]);
  });

  it('year-boundary spanner that ends after today goes to its start year (not end year)', () => {
    const result = groupClosuresByYear(
      [c('2026-12-21', '2027-01-01')],
      TODAY,
    );
    expect(result.past).toEqual([]);
    expect(Array.from(result.byYear.keys())).toEqual([2026]);
    expect(result.byYear.get(2026)!.length).toBe(1);
  });

  it('exactly today is treated as upcoming (end_date < today is the past test)', () => {
    const result = groupClosuresByYear(
      [c('2026-04-26')],
      TODAY,
    );
    expect(result.past).toEqual([]);
    expect(result.byYear.get(2026)!.length).toBe(1);
  });

  it('skips rows with malformed start_date instead of crashing', () => {
    const result = groupClosuresByYear(
      [c('not-a-date'), c('2026-09-07')],
      TODAY,
    );
    expect(result.byYear.get(2026)!.length).toBe(1);
  });

  it('preserves input order within each year group', () => {
    const a = c('2026-08-18');
    const b = c('2026-09-07');
    const d = c('2026-11-11');
    const result = groupClosuresByYear([d, a, b], TODAY);
    // Helper does not sort within a year — that is the caller's job (the
    // SQL query already orders by start_date). Assert the helper preserves
    // the order so a future "let me sort here" change doesn't accidentally
    // override the SQL contract.
    expect(result.byYear.get(2026)).toEqual([d, a, b]);
  });
});

describe('spansYearBoundary', () => {
  it('returns true when start and end years differ', () => {
    expect(spansYearBoundary(c('2026-12-21', '2027-01-01'))).toBe(true);
  });

  it('returns false for a single-day closure', () => {
    expect(spansYearBoundary(c('2026-09-07'))).toBe(false);
  });

  it('returns false for a multi-day closure within one year', () => {
    expect(spansYearBoundary(c('2026-11-23', '2026-11-27'))).toBe(false);
  });

  it('returns true for an end-of-year-to-start-of-next-year break', () => {
    expect(spansYearBoundary(c('2026-12-31', '2027-01-01'))).toBe(true);
  });
});
