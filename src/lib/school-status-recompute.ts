import type { SupabaseClient } from '@supabase/supabase-js';

// DECISION: After an admin approves or adds closures, recompute the school's
// calendar_status honestly from the data. "Multi-year" means we have verified
// closures in two distinct school years; "current" means we have any verified
// closures; otherwise we leave it at whatever it was (we don't downgrade from
// multi_year to current if the admin happens to delete the last closure in a
// year — they'd have to explicitly trigger a downgrade path).
//
// School-year window: Aug 1 → Jul 31 of the following calendar year.

type SchoolYearWindow = { start: string; end: string; label: string };

export function schoolYearWindows(): SchoolYearWindow[] {
  // 2026-27 and 2027-28 are the two windows we care about for "multi-year"
  // verification during the Phase-1 launch horizon.
  return [
    { start: '2026-08-01', end: '2027-07-31', label: '2026-27' },
    { start: '2027-08-01', end: '2028-07-31', label: '2027-28' },
  ];
}

export async function recomputeSchoolStatus(
  db: SupabaseClient,
  school_id: string,
): Promise<'verified_multi_year' | 'verified_current' | null> {
  const windows = schoolYearWindows();
  const counts: number[] = [];
  for (const w of windows) {
    const { count } = await db
      .from('closures')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school_id)
      .eq('status', 'verified')
      .gte('start_date', w.start)
      .lte('start_date', w.end);
    counts.push(count ?? 0);
  }
  const yearsCovered = counts.filter((n) => n > 0).length;

  let next: 'verified_multi_year' | 'verified_current' | null = null;
  if (yearsCovered >= 2) next = 'verified_multi_year';
  else if (yearsCovered >= 1) next = 'verified_current';

  if (next) {
    const { error } = await db
      .from('schools')
      .update({ calendar_status: next })
      .eq('id', school_id);
    if (error) throw error;
  }
  return next;
}
