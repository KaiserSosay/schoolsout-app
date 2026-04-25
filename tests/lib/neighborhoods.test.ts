import { describe, it, expect } from 'vitest';
import {
  NEIGHBORHOOD_CENTROIDS,
  neighborhoodCentroid,
} from '@/lib/neighborhoods';
import researchCamps from '../../data/camps/miami-research-2026-04-23.json';

// DECISION (Phase 3.0 / Item 1.9 follow-up): a camp whose neighborhood isn't
// in the lookup falls to the bottom of the distance sort. That's a quiet
// failure mode — parents would never know the sort is misranking. This test
// guards against regression: any camp neighborhood in the committed research
// JSON must resolve to a centroid.

type ResearchCamp = { neighborhood?: string | null };
const camps = (
  Array.isArray(researchCamps)
    ? (researchCamps as ResearchCamp[])
    : ((researchCamps as { camps?: ResearchCamp[] }).camps ?? [])
);

describe('neighborhoodCentroid', () => {
  it('resolves every distinct neighborhood from the camps research import', () => {
    const distinct = Array.from(
      new Set(camps.map((c) => c.neighborhood).filter((h): h is string => Boolean(h))),
    ).sort();
    const unresolved = distinct.filter((h) => neighborhoodCentroid(h) === null);
    expect(unresolved).toEqual([]);
  });

  it('is case- and whitespace-insensitive', () => {
    const aPin = NEIGHBORHOOD_CENTROIDS['Coral Gables'];
    expect(neighborhoodCentroid('Coral Gables')).toEqual(aPin);
    expect(neighborhoodCentroid('coral gables')).toEqual(aPin);
    expect(neighborhoodCentroid('  CORAL GABLES  ')).toEqual(aPin);
  });

  it('returns null for unknown neighborhoods', () => {
    expect(neighborhoodCentroid('Nowhereville')).toBeNull();
    expect(neighborhoodCentroid(null)).toBeNull();
    expect(neighborhoodCentroid(undefined)).toBeNull();
    expect(neighborhoodCentroid('')).toBeNull();
  });

  // DECISION (Phase 3.0 overnight C1): live-prod regression guard.
  // Skips silently in CI / contributor environments without DB creds; runs
  // when SUPABASE creds are exported (so a maintainer can fail fast on
  // gaps before deploying). Uses the public /api/camps response — no
  // service-role key needed. Two neighborhoods are intentionally excluded
  // per docs/neighborhoods-pending-2026-04-25.md: "South Miami-Dade"
  // (regional descriptor, deferred for data-side cleanup) and "Various"
  // (multi-location marker — by design has no centroid).
  const INTENTIONAL_UNRESOLVED = new Set(['South Miami-Dade', 'Various']);

  describe.runIf(process.env.RUN_PROD_NEIGHBORHOODS === '1')(
    'live prod /api/camps neighborhoods (RUN_PROD_NEIGHBORHOODS=1)',
    () => {
      it('every prod neighborhood resolves to a centroid (or is documented)', async () => {
        const res = await fetch('https://schoolsout.net/api/camps');
        expect(res.ok).toBe(true);
        const body = (await res.json()) as
          | { camps?: Array<{ neighborhood?: string | null }> }
          | Array<{ neighborhood?: string | null }>;
        const list = Array.isArray(body) ? body : (body.camps ?? []);
        const distinct = Array.from(
          new Set(list.map((c) => c.neighborhood).filter((h): h is string => Boolean(h))),
        );
        const unresolved = distinct.filter(
          (h) => neighborhoodCentroid(h) === null && !INTENTIONAL_UNRESOLVED.has(h),
        );
        expect(unresolved).toEqual([]);
      }, 15_000);
    },
  );
});
