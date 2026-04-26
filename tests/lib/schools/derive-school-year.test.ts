import { describe, it, expect } from 'vitest';
import { deriveSchoolYear } from '@/lib/schools/derive-school-year';

// Boundary: U.S. academic year flips on August 1. Aug-Dec → year-(year+1);
// Jan-Jul → (year-1)-year. The cliff at Jul 31 → Aug 1 is the right call
// for Miami schools (most start mid/late August).

describe('deriveSchoolYear', () => {
  it('Aug 1 flips the school year', () => {
    expect(deriveSchoolYear('2026-08-01')).toBe('2026-2027');
  });

  it('Jul 31 is the LAST day of the prior school year', () => {
    expect(deriveSchoolYear('2026-07-31')).toBe('2025-2026');
  });

  it('Sep 7 (Labor Day) → school year named for the calendar year that started', () => {
    expect(deriveSchoolYear('2025-09-07')).toBe('2025-2026');
  });

  it('Dec 31 → still the same school year', () => {
    expect(deriveSchoolYear('2025-12-31')).toBe('2025-2026');
  });

  it('Jan 1 → still the school year that started last August', () => {
    expect(deriveSchoolYear('2026-01-01')).toBe('2025-2026');
  });

  it('Mar 22 (TGP spring break) → 2025-2026', () => {
    expect(deriveSchoolYear('2026-03-22')).toBe('2025-2026');
  });

  it('Aug 18 2026 (TGP first day) → 2026-2027', () => {
    expect(deriveSchoolYear('2026-08-18')).toBe('2026-2027');
  });

  it('accepts a Date object too', () => {
    expect(deriveSchoolYear(new Date('2026-09-15T12:00:00Z'))).toBe('2026-2027');
  });

  it('handles ISO timestamps with time component', () => {
    expect(deriveSchoolYear('2026-08-01T05:00:00Z')).toBe('2026-2027');
  });

  it('handles end-of-Christmas-break boundary (Jan 1 still in same year)', () => {
    expect(deriveSchoolYear('2027-01-01')).toBe('2026-2027');
  });
});
