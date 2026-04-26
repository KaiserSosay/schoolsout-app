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
