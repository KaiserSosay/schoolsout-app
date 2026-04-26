// Partition + group closures for the school detail page list.
//
// Past closures (`end_date < today`) flow into a single bucket so the UI can
// fold them behind a "Show past breaks" toggle. Upcoming closures get
// grouped by the calendar year of their start_date so the renderer can
// drop a soft year-divider when the list crosses Dec → Jan.
//
// Closures whose date range spans a year boundary (e.g. "Christmas Break"
// Dec 21 → Jan 1) are kept in the start_date's year for grouping; the
// renderer is responsible for showing both years in the date string. That
// keeps the dataset deterministically partitioned without us having to
// pick which year a multi-day break "really belongs to."

export type ClosureForGrouping = {
  start_date: string;
  end_date: string;
};

export type GroupedClosures<T extends ClosureForGrouping> = {
  past: T[];
  byYear: Map<number, T[]>;
};

export function groupClosuresByYear<T extends ClosureForGrouping>(
  closures: T[],
  today: string,
): GroupedClosures<T> {
  const past: T[] = [];
  const byYear = new Map<number, T[]>();
  for (const c of closures) {
    if (c.end_date < today) {
      past.push(c);
      continue;
    }
    const year = parseInt(c.start_date.slice(0, 4), 10);
    if (!Number.isFinite(year)) continue;
    const arr = byYear.get(year) ?? [];
    arr.push(c);
    byYear.set(year, arr);
  }
  // Order matters for the renderer — older years first within each map iter.
  const sorted = new Map<number, T[]>();
  for (const year of Array.from(byYear.keys()).sort((a, b) => a - b)) {
    sorted.set(year, byYear.get(year)!);
  }
  return { past, byYear: sorted };
}

// True when a closure's start_date and end_date fall in different calendar
// years (e.g. "Christmas Break" Dec 21 2026 → Jan 1 2027). The list
// renderer uses this to decide whether to inline both years in the date
// label so a parent doesn't have to mentally infer the second year.
export function spansYearBoundary(c: ClosureForGrouping): boolean {
  return c.start_date.slice(0, 4) !== c.end_date.slice(0, 4);
}

// True when an academic-year section is functionally over — today is past
// the end of that school year. Used by SchoolCalendarList to decide
// whether to render the "school year has ended" message vs the "no
// verified dates yet" message when a section is empty.
//
// 2026-04-26 evening: Palmer Trinity's page falsely showed "year ended"
// in April 2026 because the previous logic fired on any empty section
// regardless of date. The U.S. school year wraps ~end of May; July 1 of
// the second year is a safe "everyone's out by now" boundary.
//
// Returns false for multi-year labels and any malformed input — only
// single-year sections like '2025-2026' can meaningfully "end."
export function shouldShowYearEnded(
  yearLabel: string,
  today: Date = new Date(),
): boolean {
  const m = yearLabel.match(/^(\d{4})-(\d{4})$/);
  if (!m) return false;
  const secondYear = parseInt(m[2], 10);
  if (!Number.isFinite(secondYear)) return false;
  const yearEndBoundary = new Date(Date.UTC(secondYear, 6, 1)); // July 1 UTC
  return today.getTime() >= yearEndBoundary.getTime();
}
