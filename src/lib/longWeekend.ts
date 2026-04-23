// Long-weekend detection for closures. Pure function with no deps so it
// runs in both server and client contexts (calendar strip + detail page).
//
// Rules:
//   - Single Monday off → Sat/Sun/Mon 3-day weekend
//   - Single Friday off → Fri/Sat/Sun 3-day weekend
//   - Single Tuesday off immediately after a Monday holiday → "bridge day",
//     4-day weekend with a known prior holiday
//   - Multi-day closure spanning Friday → Monday or longer → include
//     natural weekends adjacent to the range
//
// "Day count" returned is the total consecutive days off including the
// weekend days the kid won't be in school anyway.

export type LongWeekend = {
  isLongWeekend: boolean;
  dayCount: number;          // total consecutive days off, weekends included
  kind: 'three_day' | 'four_day_bridge' | 'extended' | null;
  label: string;             // "Long weekend — 3 days off"
};

// Day-of-week: 0 = Sunday ... 6 = Saturday (UTC-normalized so the caller's
// local TZ doesn't flip a Monday into a Sunday).
function dow(isoDate: string): number {
  return new Date(isoDate + 'T00:00:00Z').getUTCDay();
}

function addDaysISO(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function detectLongWeekend(closure: {
  start_date: string;
  end_date: string;
}): LongWeekend {
  const start = closure.start_date;
  const end = closure.end_date;
  const startDow = dow(start);
  const endDow = dow(end);

  // Total span of the closure itself (inclusive).
  const startTs = Date.parse(start + 'T00:00:00Z');
  const endTs = Date.parse(end + 'T00:00:00Z');
  const spanDays = Math.round((endTs - startTs) / 86_400_000) + 1;

  if (spanDays >= 3) {
    // Multi-day closure — long weekend by definition. Count attached
    // weekends on either end.
    let extra = 0;
    if (startDow === 1) extra += 2;            // Mon → tack Sat+Sun before
    if (startDow === 6) extra += 1;            // Sat → Sun is free day after anyway
    if (endDow === 5) extra += 2;              // Fri → tack Sat+Sun after
    return {
      isLongWeekend: true,
      dayCount: spanDays + extra,
      kind: 'extended',
      label: `🏖️ Long weekend — ${spanDays + extra} days off`,
    };
  }

  if (spanDays === 1) {
    // Single-day closure.
    if (startDow === 1) {
      // Monday → Sat + Sun + Mon = 3 days off
      return {
        isLongWeekend: true,
        dayCount: 3,
        kind: 'three_day',
        label: '🏖️ Long weekend — 3 days off',
      };
    }
    if (startDow === 5) {
      // Friday → Fri + Sat + Sun = 3 days off
      return {
        isLongWeekend: true,
        dayCount: 3,
        kind: 'three_day',
        label: '🏖️ Long weekend — 3 days off',
      };
    }
    // Tuesday-bridge detection handled by the multi-closure helper below.
  }

  if (spanDays === 2) {
    // Two-day closure covers a natural weekend boundary already — count
    // as long weekend if it straddles Fri-Sat or Sun-Mon.
    if (endDow === 5 || startDow === 1) {
      return {
        isLongWeekend: true,
        dayCount: 2 + 2,
        kind: 'extended',
        label: '🏖️ Long weekend — 4 days off',
      };
    }
  }

  return {
    isLongWeekend: false,
    dayCount: spanDays,
    kind: null,
    label: '',
  };
}

// Multi-closure variant: if a single-day Tuesday closure has a Monday
// closure in the list one day prior, that's a bridge — return 4 days off.
// Caller supplies the sibling closure list; function doesn't fetch.
export function detectBridgeDay(
  closure: { start_date: string; end_date: string },
  siblings: ReadonlyArray<{ start_date: string; end_date: string }>,
): LongWeekend | null {
  const startDow = dow(closure.start_date);
  if (startDow !== 2) return null;
  if (closure.start_date !== closure.end_date) return null;
  const prior = addDaysISO(closure.start_date, -1);
  const hasMondayHoliday = siblings.some(
    (s) => s.start_date <= prior && s.end_date >= prior,
  );
  if (!hasMondayHoliday) return null;
  return {
    isLongWeekend: true,
    dayCount: 4,
    kind: 'four_day_bridge',
    label: '🏖️ Bridge day — 4-day weekend',
  };
}
