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

// Bucket names match the prod schema enum (kid_profiles.age_range,
// reminder_subscriptions.age_range). The boundary at age 14 is the
// 9th-grade entry point; ages 10-13 are middle school. The bucket
// LABEL is "10-12" (legacy from the schema's first cut) but it
// actually catches ages 10, 11, 12, AND 13 — same span the older
// grade-derived helper used. Intentional naming, not a typo.
export type AgeRange = '4-6' | '7-9' | '10-12' | '13+';

export function ageToAgeRange(age: number): AgeRange {
  if (age <= 6) return '4-6';
  if (age <= 9) return '7-9';
  if (age <= 13) return '10-12';
  return '13+';
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

// Display helper for kid-card surfaces (family page, plan wizard).
//   - birth_month + birth_year set    → "Age 8"
//   - grade-only fallback             → "~Age 7" (tilde flags estimate)
//   - neither / partial / unknown     → ""        (caller decides whether
//                                                  to render at all)
//
// Returns a trimmed display string, no localization (the caller wraps it
// in any layout the page wants — the format is data-driven and English-
// y today; if/when we localize, the "Age" word goes through next-intl).
export function displayKidAge(
  kid: {
    birth_month: number | null | undefined;
    birth_year: number | null | undefined;
    grade: string;
  },
  today: Date = new Date(),
): string {
  if (kid.birth_month && kid.birth_year) {
    const age = computeKidAge(kid.birth_month, kid.birth_year, today);
    return `Age ${age}`;
  }
  const expected = gradeToExpectedAge(kid.grade);
  if (expected > 0) return `~Age ${expected}`;
  return '';
}
