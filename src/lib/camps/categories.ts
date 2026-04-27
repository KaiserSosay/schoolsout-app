// Canonical camp-category vocabulary — the single source of truth for both
// the database normalization migration (`supabase/migrations/052_*.sql`) and
// any client-side / script-side category-handling code.
//
// The DB column `public.camps.categories` is `text[]` (NOT an enum — see
// migration 003), so this module's `CANONICAL_CATEGORIES` set is the
// contract a future enum MIGHT enforce. Until then, this file + the migration
// + the test that compares the two are the contract.
//
// Design decisions captured in
//   docs/plans/camp-categories-stage-2-plan-2026-04-27.md
// (Q1: orphan folds; Q2: season-tag deferral; Q3: religious filter+badge).

/**
 * The 21 categories that survive the canonical migration. All lowercase.
 * Camps may carry any subset of these tags. Any tag NOT in this set is
 * considered legacy and should be normalized via `normalizeCategories`.
 */
export const CANONICAL_CATEGORIES: ReadonlySet<string> = new Set([
  // Core breadth (high count)
  'sports',
  'general',
  'arts',
  'outdoor',
  'stem',
  'nature',
  'swim',
  'academic',
  // Cultural + lifestyle
  'cultural',
  'preschool',
  'religious',
  // Performing arts (sub-genre under arts, but tagged independently)
  'music',
  'theater',
  'dance',
  // Sub-genre sports + activities
  'tennis',
  'sailing',
  'culinary',
  'golf',
  // Below-threshold sub-genres — kept in vocabulary for searchability via
  // URL params, but no UI pill (see `categoryThresholdOk`)
  'soccer',
  'basketball',
  'fencing',
  // Season + session-shape markers (kept as categories for now per Q2;
  // schema-level `season` / `session_type` column deferred to Phase 4.x)
  'summer',
  'winter_break',
  'spring_break',
  'short_break',
  'one_day',
]);

/**
 * Tags that have been folded into other categories. Any camp still carrying
 * one of these post-migration is a bug — Phase 4 of migration 052 verifies
 * this set is empty and raises if any remain.
 *
 * The fold target is documented inline; `applyFolds` is the runtime impl.
 */
export const DEPRECATED_TAGS: ReadonlySet<string> = new Set([
  'animals', // → nature
  'water', //   → swim + outdoor (dual-tag)
  'active', //  → sports
  'indoor', //  → sports
  'adventure', // → outdoor
  'maker', //   → stem
]);

/**
 * Synonym + casing normalization. Maps every legacy raw form (the various
 * casings + plurals + folded labels we found in mig013/mig051/research) to
 * its canonical lowercase form.
 *
 * The migration's Phase 1 SQL CASE block is generated from this same map —
 * see the sync test in `tests/lib/camp-categories.test.ts` for the lockstep
 * check.
 */
export const LEGACY_TO_CANONICAL: Readonly<Record<string, string>> = {
  // STEM family
  STEM: 'stem',
  STEAM: 'stem',
  stem: 'stem',
  // Sports — proper-noun casings from mig013
  Sports: 'sports',
  sports: 'sports',
  // Soccer / Basketball / Tennis (proper noun + lowercase)
  Soccer: 'soccer',
  soccer: 'soccer',
  Tennis: 'tennis',
  tennis: 'tennis',
  Basketball: 'basketball',
  basketball: 'basketball',
  // Swim — picks up `Swimming` and `swimming` plural variants
  Swim: 'swim',
  swim: 'swim',
  Swimming: 'swim',
  swimming: 'swim',
  // Arts — singular `Art`/`art` collapses to plural
  Art: 'arts',
  art: 'arts',
  Arts: 'arts',
  arts: 'arts',
  // Theater / Music / Dance
  Theater: 'theater',
  theater: 'theater',
  Music: 'music',
  music: 'music',
  Dance: 'dance',
  dance: 'dance',
  // Nature
  Nature: 'nature',
  nature: 'nature',
  // History (mig013 used this for Vizcaya/Deering historical-museum camps;
  // folds into cultural)
  History: 'cultural',
  Cultural: 'cultural',
  cultural: 'cultural',
};

/**
 * Apply the Q1 orphan-fold rules. Drops deprecated tags, ensures their
 * parent (or parents — `water` dual-tags both swim AND outdoor) is present,
 * and keeps `fencing` while ensuring it's also tagged `sports` (the only
 * fold rule that doesn't drop the source tag).
 *
 * Returns a deduplicated, sorted array.
 */
export function applyFolds(cats: readonly string[]): string[] {
  const s = new Set(cats);
  if (s.has('animals')) {
    s.delete('animals');
    s.add('nature');
  }
  if (s.has('water')) {
    s.delete('water');
    s.add('swim');
    s.add('outdoor');
  }
  if (s.has('active')) {
    s.delete('active');
    s.add('sports');
  }
  if (s.has('indoor')) {
    s.delete('indoor');
    s.add('sports');
  }
  if (s.has('adventure')) {
    s.delete('adventure');
    s.add('outdoor');
  }
  if (s.has('maker')) {
    s.delete('maker');
    s.add('stem');
  }
  if (s.has('fencing')) {
    // Keep fencing; ensure sports is also present
    s.add('sports');
  }
  return Array.from(s).sort();
}

/**
 * Full normalization pipeline: legacy/casing rewrite → fold → dedup → sort.
 * Unknown tags fall through unchanged (SQL Phase 1's `ELSE lower(cat)` does
 * the same — preserves data we can't classify rather than dropping it).
 */
export function normalizeCategories(raw: readonly string[]): string[] {
  const rewritten = new Set<string>();
  for (const cat of raw) {
    const mapped = LEGACY_TO_CANONICAL[cat];
    rewritten.add(mapped ?? cat.toLowerCase());
  }
  return applyFolds(Array.from(rewritten));
}

/**
 * Threshold gate for whether a category should appear as a UI filter pill.
 * Per Q1: "any category with fewer than 3 camps doesn't get its own UI
 * pill." Camps still carry the tag for URL-based searches.
 */
export const UI_PILL_MIN_COUNT = 3;

export function categoryThresholdOk(count: number): boolean {
  return count >= UI_PILL_MIN_COUNT;
}

/**
 * The 18 categories that survive the threshold rule AND are intentionally
 * surfaced in the UI. Used by `CampsFilterBar` (commit 5) and by tests that
 * verify the rendered pill list matches the canonical decision.
 *
 * Order matches the visual order in the filter row: core breadth first,
 * then cultural/lifestyle, then performing arts, then sub-genres.
 */
export const UI_PILL_CATEGORIES: readonly string[] = [
  // Core breadth
  'sports',
  'general',
  'arts',
  'outdoor',
  'stem',
  'nature',
  'swim',
  'academic',
  // Cultural + lifestyle
  'cultural',
  'preschool',
  'religious',
  // Performing arts
  'music',
  'theater',
  'dance',
  // Sub-genres (each ≥4 camps post-revisions)
  'tennis',
  'sailing',
  'culinary',
  'golf',
];
