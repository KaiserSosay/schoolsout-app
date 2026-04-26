import { describe, it, expect } from 'vitest';
import {
  computeKidAge,
  ageToAgeRange,
  gradeToExpectedAge,
} from '@/lib/kids/age';

describe('computeKidAge', () => {
  it('Noah born 2017-08 → 8 on 2026-04-26', () => {
    expect(computeKidAge(8, 2017, new Date('2026-04-26T12:00:00Z'))).toBe(8);
  });

  it('Kid whose birthday is exactly today → counts as their new age', () => {
    expect(computeKidAge(4, 2020, new Date('2026-04-04T12:00:00Z'))).toBe(6);
  });

  it('Kid whose birthday is tomorrow → still old age', () => {
    expect(computeKidAge(4, 2020, new Date('2026-03-31T12:00:00Z'))).toBe(5);
  });

  it('December birthday + January today → still last-year age', () => {
    expect(computeKidAge(12, 2017, new Date('2027-01-15T12:00:00Z'))).toBe(9);
  });

  it('newborn (current month) returns 0', () => {
    expect(computeKidAge(4, 2026, new Date('2026-04-26T12:00:00Z'))).toBe(0);
  });

  it('birth month after current month, same year → -1, clamped via the month adjustment', () => {
    // Born December 2026, today June 2026 — kid not born yet. The helper
    // returns -1 in that case; the UI/migration code is responsible for
    // never collecting a future birth date in the first place.
    expect(computeKidAge(12, 2026, new Date('2026-06-15T12:00:00Z'))).toBe(-1);
  });
});

describe('ageToAgeRange', () => {
  it('maps the canonical Miami camp filter buckets', () => {
    expect(ageToAgeRange(4)).toBe('4-6');
    expect(ageToAgeRange(6)).toBe('4-6');
    expect(ageToAgeRange(7)).toBe('7-9');
    expect(ageToAgeRange(9)).toBe('7-9');
    expect(ageToAgeRange(10)).toBe('10-13');
    expect(ageToAgeRange(13)).toBe('10-13');
    expect(ageToAgeRange(14)).toBe('14+');
    expect(ageToAgeRange(17)).toBe('14+');
  });

  it("Noah (age 8, 2nd grade) ends up in '7-9' — fixes the off-by-one mom found", () => {
    // The Apr 2026 bug had 2nd grade → '4-6'. With birth_year=2017
    // birth_month=8, computeKidAge → 8, ageToAgeRange(8) → '7-9'. Right.
    const age = computeKidAge(8, 2017, new Date('2026-04-26T12:00:00Z'));
    expect(ageToAgeRange(age)).toBe('7-9');
  });

  it('handles ages below the youngest bucket gracefully', () => {
    expect(ageToAgeRange(0)).toBe('4-6');
    expect(ageToAgeRange(3)).toBe('4-6');
  });
});

describe('gradeToExpectedAge', () => {
  it('K = 5, 1 = 6, 2 = 7 (the expected US ladder)', () => {
    expect(gradeToExpectedAge('K')).toBe(5);
    expect(gradeToExpectedAge('1')).toBe(6);
    expect(gradeToExpectedAge('2')).toBe(7);
  });

  it('handles PreK3 / PreK4 distinction', () => {
    expect(gradeToExpectedAge('PreK3')).toBe(3);
    expect(gradeToExpectedAge('PreK4')).toBe(4);
  });

  it('returns 0 for unknown grades (caller decides fallback)', () => {
    expect(gradeToExpectedAge('PreK')).toBe(0);
    expect(gradeToExpectedAge('not-a-grade')).toBe(0);
    expect(gradeToExpectedAge('')).toBe(0);
  });

  it('covers high school grades 9-12', () => {
    expect(gradeToExpectedAge('9')).toBe(14);
    expect(gradeToExpectedAge('12')).toBe(17);
  });
});
