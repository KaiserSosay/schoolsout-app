// Compute coverage for the current school year + the next school year so
// the page can be honest about exactly which years have verified closures
// and which are gaps. Mom's TGP test on 2026-04-26 found the page showing
// 17 closures from 2026-2027 with no acknowledgment that 2025-2026 (the
// year actually in session) was missing — every visible date implied
// "we have nothing coming up." This helper exposes that gap structurally.
//
// Pure function, takes today as a parameter so timezone-edge tests stay
// deterministic. Returns exactly two entries — current and next — so the
// renderer can lay them out left-to-right or top-to-bottom without
// looping over a variable-length list.

const SCHOOL_YEAR_RE = /^\d{4}-\d{4}$/;
// 5+ closures = "verified" (covers the major federal holidays + breaks).
// 1-4 = "partial" (something's there but the calendar's incomplete).
const VERIFIED_THRESHOLD = 5;

export type YearCoverageStatus = 'verified' | 'partial' | 'unavailable';

export type YearCoverage = {
  year: string;
  status: YearCoverageStatus;
  closureCount: number;
  position: 'current' | 'next';
  // True when this year's school year is functionally over (June or July).
  // The renderer uses this to flip a "{year} school year has ended" copy
  // instead of acting like it's still the active calendar.
  isEnded: boolean;
};

export function computeYearCoverage(
  closures: Array<{ school_year?: string | null }>,
  today: Date,
): [YearCoverage, YearCoverage] {
  const month = today.getUTCMonth() + 1; // 1-12
  const year = today.getUTCFullYear();

  // Aug-Dec → school year started this calendar year.
  // Jan-Jul → school year started last calendar year.
  let currentYear: string;
  let nextYear: string;
  if (month >= 8) {
    currentYear = `${year}-${year + 1}`;
    nextYear = `${year + 1}-${year + 2}`;
  } else {
    currentYear = `${year - 1}-${year}`;
    nextYear = `${year}-${year + 1}`;
  }

  // June + July are the summer gap. The "current" school year (per the
  // Jan-Jul rule) has ended; nothing to attend until August.
  const currentEnded = month === 6 || month === 7;

  const counts = new Map<string, number>();
  for (const c of closures) {
    const sy = c.school_year;
    if (!sy || typeof sy !== 'string') continue;
    if (!SCHOOL_YEAR_RE.test(sy)) continue;
    counts.set(sy, (counts.get(sy) ?? 0) + 1);
  }

  return [
    coverageFor(currentYear, counts.get(currentYear) ?? 0, 'current', currentEnded),
    coverageFor(nextYear, counts.get(nextYear) ?? 0, 'next', false),
  ];
}

function coverageFor(
  year: string,
  closureCount: number,
  position: 'current' | 'next',
  isEnded: boolean,
): YearCoverage {
  let status: YearCoverageStatus;
  if (closureCount >= VERIFIED_THRESHOLD) status = 'verified';
  else if (closureCount > 0) status = 'partial';
  else status = 'unavailable';
  return { year, status, closureCount, position, isEnded };
}
