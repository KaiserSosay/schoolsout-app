import { describe, it, expect } from 'vitest';
import { computeYearCoverage } from '@/lib/schools/year-coverage';

// "Today" anchor — April 26, 2026. April is the brief's worked example
// month, with the current school year being 2025-2026 and next being
// 2026-2027.
const APRIL_26_2026 = new Date('2026-04-26T12:00:00Z');

function many(year: string, n: number) {
  return Array.from({ length: n }, () => ({ school_year: year }));
}

describe('computeYearCoverage', () => {
  it('returns coverage for current + next school year — Aug-Dec rule', () => {
    const result = computeYearCoverage([], new Date('2026-09-15T12:00:00Z'));
    expect(result.length).toBe(2);
    expect(result[0].position).toBe('current');
    expect(result[0].year).toBe('2026-2027');
    expect(result[1].position).toBe('next');
    expect(result[1].year).toBe('2027-2028');
  });

  it('returns coverage for current + next school year — Jan-Jul rule', () => {
    const result = computeYearCoverage([], APRIL_26_2026);
    expect(result.map((r) => r.year)).toEqual(['2025-2026', '2026-2027']);
    expect(result.map((r) => r.position)).toEqual(['current', 'next']);
  });

  it('Case 1 — both years verified (>=5 closures each)', () => {
    const result = computeYearCoverage(
      [...many('2025-2026', 21), ...many('2026-2027', 17)],
      APRIL_26_2026,
    );
    expect(result[0]).toMatchObject({
      year: '2025-2026',
      status: 'verified',
      closureCount: 21,
    });
    expect(result[1]).toMatchObject({
      year: '2026-2027',
      status: 'verified',
      closureCount: 17,
    });
  });

  it('Case 2 — only current year verified (Lehrman/Ransom shape)', () => {
    const result = computeYearCoverage(
      many('2025-2026', 29),
      APRIL_26_2026,
    );
    expect(result[0]).toMatchObject({ status: 'verified', closureCount: 29 });
    expect(result[1]).toMatchObject({
      status: 'unavailable',
      closureCount: 0,
    });
  });

  it('Case 3 — only next year verified (TGP today shape — mom case)', () => {
    const result = computeYearCoverage(
      many('2026-2027', 17),
      APRIL_26_2026,
    );
    expect(result[0]).toMatchObject({
      year: '2025-2026',
      status: 'unavailable',
      closureCount: 0,
    });
    expect(result[1]).toMatchObject({
      year: '2026-2027',
      status: 'verified',
      closureCount: 17,
    });
  });

  it('Case 4 — neither year (placeholder template fires elsewhere)', () => {
    const result = computeYearCoverage([], APRIL_26_2026);
    expect(result.every((r) => r.status === 'unavailable')).toBe(true);
    expect(result.every((r) => r.closureCount === 0)).toBe(true);
  });

  it('Case 5 — current year partial (1-4 closures)', () => {
    const result = computeYearCoverage(
      many('2025-2026', 3),
      APRIL_26_2026,
    );
    expect(result[0]).toMatchObject({
      status: 'partial',
      closureCount: 3,
    });
  });

  it('Case 6 — partial threshold boundary (4 = partial, 5 = verified)', () => {
    const r4 = computeYearCoverage(many('2025-2026', 4), APRIL_26_2026);
    expect(r4[0].status).toBe('partial');
    const r5 = computeYearCoverage(many('2025-2026', 5), APRIL_26_2026);
    expect(r5[0].status).toBe('verified');
  });

  it('isEnded fires for the current school year in June and July', () => {
    const june = computeYearCoverage([], new Date('2026-06-15T12:00:00Z'));
    expect(june[0].isEnded).toBe(true);
    expect(june[1].isEnded).toBe(false);
    const july = computeYearCoverage([], new Date('2026-07-31T12:00:00Z'));
    expect(july[0].isEnded).toBe(true);
  });

  it('isEnded is false in active school months (Aug-May)', () => {
    for (const iso of [
      '2026-08-15T12:00:00Z',
      '2026-04-26T12:00:00Z',
      '2026-12-15T12:00:00Z',
      '2027-05-30T12:00:00Z',
    ]) {
      const r = computeYearCoverage([], new Date(iso));
      expect(r[0].isEnded, `expected !isEnded for ${iso}`).toBe(false);
    }
  });

  it('counts only closures that match each window (mixed-year input)', () => {
    const result = computeYearCoverage(
      [
        ...many('2025-2026', 7),
        ...many('2026-2027', 12),
        ...many('2027-2028', 99), // outside the window — ignored
        ...many('2024-2025', 50), // outside the window — ignored
      ],
      APRIL_26_2026,
    );
    expect(result[0].closureCount).toBe(7);
    expect(result[1].closureCount).toBe(12);
  });

  it('skips closures with null/missing/malformed school_year', () => {
    const result = computeYearCoverage(
      [
        { school_year: null },
        { school_year: '' },
        { school_year: 'not-a-year' },
        { school_year: '2025' },
        { school_year: '2025-2026' },
      ] as Array<{ school_year?: string | null }>,
      APRIL_26_2026,
    );
    expect(result[0].closureCount).toBe(1);
  });

  it('Aug 1 transition — goes to the new school year on the dot', () => {
    const jul31 = computeYearCoverage([], new Date('2026-07-31T23:00:00Z'));
    const aug1 = computeYearCoverage([], new Date('2026-08-01T01:00:00Z'));
    // July 31 is still in the "Jan-Jul" bucket → current is 2025-2026
    expect(jul31[0].year).toBe('2025-2026');
    // Aug 1 flips to "Aug-Dec" bucket → current is 2026-2027
    expect(aug1[0].year).toBe('2026-2027');
  });
});
