// Phase 3.0 — Item 3.3: featured-aware distance sort.
//
// The Featured badge is honest only if it slightly lifts the camp inside
// the user's existing browse — not if it dumps featured camps in their
// own section. The compromise: at the same "distance bucket" (within
// 0.5 mi of each other), featured wins; otherwise raw distance wins.
//
// For non-distance sorts (price, name) featured is irrelevant — we sort
// by the requested key and let `is_featured DESC` from the DB query
// already handle the within-tie ordering.

const DISTANCE_BUCKET_MI = 0.5;

export type SortableCamp = {
  distance_miles?: number | null;
  is_featured?: boolean | null;
  featured_until?: string | null;
};

function isCurrentlyFeatured(c: SortableCamp, now: number): boolean {
  if (!c.is_featured) return false;
  if (!c.featured_until) return false;
  return new Date(c.featured_until).getTime() > now;
}

export function sortByDistanceWithFeatured<T extends SortableCamp>(
  camps: T[],
  now: number = Date.now(),
): T[] {
  return [...camps].sort((a, b) => {
    const ad = a.distance_miles ?? Number.POSITIVE_INFINITY;
    const bd = b.distance_miles ?? Number.POSITIVE_INFINITY;
    const sameBucket = Math.abs(ad - bd) < DISTANCE_BUCKET_MI;
    if (sameBucket) {
      const af = isCurrentlyFeatured(a, now) ? 1 : 0;
      const bf = isCurrentlyFeatured(b, now) ? 1 : 0;
      if (af !== bf) return bf - af;
    }
    return ad - bd;
  });
}
