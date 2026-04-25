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
});
