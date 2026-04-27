// Description-based auto-categorization helpers. Currently NOT wired into
// the import path — the 2026-04-23 research JSON ships pre-categorized — but
// these helpers are the canonical "if you ever auto-categorize from a
// camp's description, do it this way" answer. Locked in by tests so a
// future bulk-categorization pass can't silently re-loosen the rules.
//
// Background: Stage 1 review found two systematic false-positive classes:
//
//   1. RELIGIOUS — naive `\b(catholic|jewish|christian|synagogue|church|jcc|
//      hebrew|torah)\b` fired on camps that were merely LOCATED at a
//      religious venue (Cross Bridge Church) or culturally affiliated
//      without religious instruction (JCC adventure camps). Strikes were
//      applied to 3 camps via the migration; future imports must use
//      `isReligious()` instead.
//
//   2. ACADEMIC — naive Montessori-as-academic rule misclassified
//      preschool-age (2-6) Montessori programs. "Academic" means tutoring
//      / SAT prep / language enrichment for school-age kids — not a
//      pedagogy keyword. Strikes were applied to 4 Montessori camps +
//      1 STEM camp where `academic` was redundant; future imports must
//      use `isAcademic()`.

const RELIGIOUS_AFFILIATION =
  /\b(catholic|jewish|christian|synagogue|jcc|yeshiva|mosque|muslim|islamic|hindu|buddhist)\b/i;

// Programming-content phrases — these are what a camp DOES, not where it's
// located or whom it's culturally connected to.
const RELIGIOUS_PROGRAMMING =
  /\b(torah\s+study|religious\s+instruction|bible\s+(?:class|study)|mass\b|shabbat\s+services|chapel\s+service|hebrew\s+school|christian\s+education|catechism|qur'?an\s+study|islamic\s+studies)\b/i;

/**
 * Heuristic: would this camp's description merit a `religious` tag if
 * auto-categorized? True only when BOTH (a) a religious-affiliation word is
 * present AND (b) a programming-content phrase is present.
 *
 * "Located at Cross Bridge Church" alone → false (no programming word).
 * "Jewish day camp with Torah study" → true (both signals).
 * "Yeshiva-based summer program" → false (yeshiva is affiliation; needs a
 * programming phrase). Code in the import path would either flag for human
 * review or wait until the description gains explicit programming content.
 */
export function isReligious(description: string | null | undefined): boolean {
  if (!description) return false;
  return (
    RELIGIOUS_AFFILIATION.test(description) &&
    RELIGIOUS_PROGRAMMING.test(description)
  );
}

const ACADEMIC_PHRASES =
  /\b(tutoring|sat\s*prep|act\s*prep|academic\s+enrichment|homework\s+help|test\s+prep|language\s+enrichment|reading\s+enrichment|math\s+enrichment|writing\s+workshop|spelling\s+(?:program|club))\b/i;

/**
 * Heuristic: would this camp's description merit an `academic` tag?
 *
 * Two gates:
 * 1. `ages_min >= 5` — preschool-age Montessori is pedagogy, not academic
 *    enrichment. A 2-year-old Montessori program is preschool, full stop.
 * 2. Description must use one of the explicit ACADEMIC_PHRASES — pedagogy
 *    keywords like "Montessori" or "Reggio Emilia" alone are NOT enough.
 *
 * "Montessori summer for ages 3" → false (age-gated).
 * "Academic enrichment for ages 8" → true.
 * "STEM camp exploring science" → false (no academic phrase; STEM is
 * already its own tag and adding `academic` would dilute the academic
 * filter into "anything educational").
 */
export function isAcademic(camp: {
  description?: string | null;
  ages_min?: number | null;
}): boolean {
  if (!camp.description) return false;
  if (camp.ages_min == null || camp.ages_min < 5) return false;
  return ACADEMIC_PHRASES.test(camp.description);
}
