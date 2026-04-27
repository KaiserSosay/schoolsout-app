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
// 5+ school-confirmed closures = "verified" (covers the major federal
// holidays + breaks). Federal-holiday-derived rows (source='federal_
// holiday_calendar') are deliberately NOT counted toward this threshold
// since they aren't school-confirmed — counting them would let 5
// derived rows alone promote a year to "verified," exactly the false-
// positive class R6 was written to prevent.
// 1-4 school-confirmed rows OR any federal-holiday rows = "partial".
const VERIFIED_THRESHOLD = 5;

export type YearCoverageStatus = 'verified' | 'partial' | 'unavailable';

export type YearCoverage = {
  year: string;
  status: YearCoverageStatus;
  closureCount: number;
  // Subset of closureCount that is school-confirmed (NOT
  // federal-holiday-derived). This is the count that drives the
  // 'verified' threshold.
  schoolConfirmedCount: number;
  // Subset of closureCount sourced from the federal holiday calendar.
  // The CoverageBanner uses this to render the "we have federal
  // holidays for this year" variant when there's no real calendar.
  federalHolidayCount: number;
  position: 'current' | 'next';
  // True when this year's school year is functionally over (June or July).
  // The renderer uses this to flip a "{year} school year has ended" copy
  // instead of acting like it's still the active calendar.
  isEnded: boolean;
};

export function computeYearCoverage(
  closures: Array<{
    school_year?: string | null;
    status?: string | null;
    source?: string | null;
  }>,
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

  type Tally = {
    closureCount: number;
    federalHolidayCount: number;
  };
  const tallies = new Map<string, Tally>();
  for (const c of closures) {
    const sy = c.school_year;
    if (!sy || typeof sy !== 'string') continue;
    if (!SCHOOL_YEAR_RE.test(sy)) continue;
    const t = tallies.get(sy) ?? { closureCount: 0, federalHolidayCount: 0 };
    t.closureCount += 1;
    if (c.source === 'federal_holiday_calendar') t.federalHolidayCount += 1;
    tallies.set(sy, t);
  }
  const empty: Tally = { closureCount: 0, federalHolidayCount: 0 };

  return [
    coverageFor(currentYear, tallies.get(currentYear) ?? empty, 'current', currentEnded),
    coverageFor(nextYear, tallies.get(nextYear) ?? empty, 'next', false),
  ];
}

function coverageFor(
  year: string,
  tally: { closureCount: number; federalHolidayCount: number },
  position: 'current' | 'next',
  isEnded: boolean,
): YearCoverage {
  const schoolConfirmedCount = tally.closureCount - tally.federalHolidayCount;
  let status: YearCoverageStatus;
  if (schoolConfirmedCount >= VERIFIED_THRESHOLD) status = 'verified';
  else if (tally.closureCount > 0) status = 'partial';
  else status = 'unavailable';
  return {
    year,
    status,
    closureCount: tally.closureCount,
    schoolConfirmedCount,
    federalHolidayCount: tally.federalHolidayCount,
    position,
    isEnded,
  };
}
