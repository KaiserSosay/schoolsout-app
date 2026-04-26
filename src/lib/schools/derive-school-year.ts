// Derive the U.S. academic-year label for a closure's start date.
//
//   Aug 1 - Dec 31  →  'YYYY-(YYYY+1)'   e.g. Sep 7 2025 → '2025-2026'
//   Jan 1 - Jul 31  →  '(YYYY-1)-YYYY'   e.g. Mar 22 2026 → '2025-2026'
//
// 2026-04-26 incident: the iCal sync was inserting closures with
// school_year=NULL because this helper didn't exist. The renderer
// bucketed all NULL rows into a __UNKNOWN__ section that surfaced as
// gibberish on Palmer Trinity's page. Fix 1 of the iCal hardening
// pass: every iCal row gets school_year set at insert time.
//
// Pure. Accepts a string (YYYY-MM-DD, optionally with time) or Date.

export function deriveSchoolYear(startDate: string | Date): string {
  const d = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1-12
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}
