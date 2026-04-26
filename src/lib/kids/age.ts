// Hybrid grade + birth-date kid model. Grade stays as the friendly
// user-input ("Noah's in 2nd"); birth_month + birth_year are the source
// of truth for age computation. Mom's Option 3 pick from
// docs/plans/grade-age-investigation-2026-04-26.md.

export function computeKidAge(
  birthMonth: number,
  birthYear: number,
  today: Date = new Date(),
): number {
  // Use UTC accessors so the result is deterministic regardless of the
  // server's local timezone. For a Miami-only product this rarely
  // matters, but tests should pass without the TZ env hack.
  const todayMonth = today.getUTCMonth() + 1;
  const todayYear = today.getUTCFullYear();
  let age = todayYear - birthYear;
  if (todayMonth < birthMonth) age -= 1;
  return age;
}

export type AgeRange = '4-6' | '7-9' | '10-13' | '14+';

export function ageToAgeRange(age: number): AgeRange {
  if (age <= 6) return '4-6';
  if (age <= 9) return '7-9';
  if (age <= 13) return '10-13';
  return '14+';
}

const GRADE_TO_AGE: Record<string, number> = {
  PreK3: 3,
  PreK4: 4,
  K: 5,
  '1': 6,
  '2': 7,
  '3': 8,
  '4': 9,
  '5': 10,
  '6': 11,
  '7': 12,
  '8': 13,
  '9': 14,
  '10': 15,
  '11': 16,
  '12': 17,
};

// Sanity-check / display-fallback when birth_month + birth_year are not
// yet populated for an existing kid. Returns 0 for unknown grades so
// callers can branch on `expected > 0` and skip the age line entirely.
export function gradeToExpectedAge(grade: string): number {
  return GRADE_TO_AGE[grade] ?? 0;
}
