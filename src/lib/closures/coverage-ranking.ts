// Phase 3.1: re-rank camps for a single closure based on operator-set
// coverage rows. Pure function — extracted from the closure-detail page so
// it can be unit-tested without spinning up jsdom or a Next.js runtime.
//
// Inputs:
//   camps         — already ordered by SQL (featured first, then default)
//   coverageRows  — every camp_closure_coverage row for THIS closure
//   limit         — cap on the rendered list (typically 6)
//
// Output: a list of camps with `is_open_this_closure` annotations, with
// explicitly-open camps floated to the top and explicitly-closed camps
// dropped entirely. Camps with no coverage row keep their original spot.

export type CampForRanking = {
  id: string;
  [key: string]: unknown;
};
export type CoverageRow = { camp_id: string; is_open: boolean };

export function rankCampsForClosure<T extends CampForRanking>(
  camps: T[],
  coverageRows: CoverageRow[],
  limit = 6,
): Array<T & { is_open_this_closure: boolean }> {
  const openIds = new Set(
    coverageRows.filter((r) => r.is_open === true).map((r) => r.camp_id),
  );
  const closedIds = new Set(
    coverageRows.filter((r) => r.is_open === false).map((r) => r.camp_id),
  );
  const open = camps.filter((c) => openIds.has(c.id));
  const neutral = camps.filter(
    (c) => !openIds.has(c.id) && !closedIds.has(c.id),
  );
  return [...open, ...neutral]
    .slice(0, limit)
    .map((c) => ({ ...c, is_open_this_closure: openIds.has(c.id) }));
}
