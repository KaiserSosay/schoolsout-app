// Phase 5.0 Calendar View — pure date helpers used by the month grid.
// All functions operate on YYYY-MM-DD strings for SSR-safety and
// timezone neutrality (closures are stored as `date` columns, not
// timestamps — there is no notion of "Memorial Day in UTC").

export type ISODate = string; // YYYY-MM-DD

export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isoToParts(iso: ISODate): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map((s) => Number(s));
  return { y, m, d };
}

export function partsToISO(y: number, m: number, d: number): ISODate {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month1: number): number {
  // month1 is 1-based (1..12).
  return new Date(year, month1, 0).getDate();
}

export function dayOfWeek(iso: ISODate): number {
  // 0 = Sunday … 6 = Saturday. Build a Date at noon UTC to avoid
  // local-tz drift around DST boundaries.
  const { y, m, d } = isoToParts(iso);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function addDays(iso: ISODate, days: number): ISODate {
  const { y, m, d } = isoToParts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return partsToISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function diffDays(a: ISODate, b: ISODate): number {
  const aP = isoToParts(a);
  const bP = isoToParts(b);
  const aT = Date.UTC(aP.y, aP.m - 1, aP.d, 12);
  const bT = Date.UTC(bP.y, bP.m - 1, bP.d, 12);
  return Math.round((aT - bT) / 86_400_000);
}

export function isInRange(iso: ISODate, start: ISODate, end: ISODate): boolean {
  return iso >= start && iso <= end;
}

// Build a 6-row × 7-col grid of ISO dates that contains the given month.
// Returns 42 cells. Rows are aligned to the locale's first day of week
// (Sunday for en-US, Monday for es-US — caller passes weekStart).
export function buildMonthGridCells(
  year: number,
  month1: number,
  weekStart: 0 | 1 = 0,
): { cells: ISODate[]; firstOfMonth: ISODate; lastOfMonth: ISODate } {
  const firstOfMonth = partsToISO(year, month1, 1);
  const lastDay = daysInMonth(year, month1);
  const lastOfMonth = partsToISO(year, month1, lastDay);

  const firstDow = dayOfWeek(firstOfMonth);
  // How many leading cells we need before day 1 to land in the right column.
  const leading = (firstDow - weekStart + 7) % 7;

  const cells: ISODate[] = [];
  // Leading days from the previous month.
  for (let i = leading; i > 0; i--) {
    cells.push(addDays(firstOfMonth, -i));
  }
  // The full month.
  for (let d = 1; d <= lastDay; d++) {
    cells.push(partsToISO(year, month1, d));
  }
  // Trailing days from the next month — pad to 42 cells.
  while (cells.length < 42) {
    cells.push(addDays(lastOfMonth, cells.length - leading - lastDay + 1));
  }
  return { cells, firstOfMonth, lastOfMonth };
}

// Locale-correct weekday short names for the header row.
export function weekdayShortNames(
  locale: string,
  weekStart: 0 | 1 = 0,
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Pick a known reference week: 2024-01-07 was a Sunday.
  const ref = new Date(Date.UTC(2024, 0, 7, 12));
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ref);
    d.setUTCDate(ref.getUTCDate() + i + weekStart);
    out.push(fmt.format(d));
  }
  return out;
}

export function monthLabel(year: number, month1: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month1 - 1, 15, 12)));
}

export function longDateLabel(iso: ISODate, locale: string): string {
  const { y, m, d } = isoToParts(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

// "in 12 days", "today", "tomorrow", "12 days ago".
export function relativeDays(target: ISODate, today: ISODate): number {
  return diffDays(target, today);
}
