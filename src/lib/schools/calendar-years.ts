// Derive a display label for the academic-year span a school's closures
// cover. The DB stores `school_year` as `YYYY-YYYY` with a hyphen; the UI
// shows it with an en-dash (and joins multiple years with " · ").
//
// This was added 2026-04-26 after a mom-test caught the school detail page
// hardcoding "2025-2026" in the eyebrow + meta title even when the actual
// closures were for 2026-2027. The fix is to derive the label from the
// data instead of baking it into i18n.

const SCHOOL_YEAR_RE = /^(\d{4})-(\d{4})$/;

export function yearsLabelForClosures(
  closures: Array<{ school_year?: string | null }>,
): string {
  const valid = new Set<string>();
  for (const c of closures) {
    const raw = c.school_year;
    if (!raw || typeof raw !== 'string') continue;
    const m = raw.match(SCHOOL_YEAR_RE);
    if (!m) continue;
    valid.add(`${m[1]}–${m[2]}`);
  }
  if (valid.size === 0) return '';
  return Array.from(valid).sort().join(' · ');
}
