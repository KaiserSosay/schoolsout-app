import { describe, it, expect } from 'vitest';
import { sortByDistanceWithFeatured } from '@/lib/camps/sort';

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

describe('sortByDistanceWithFeatured', () => {
  it('lifts a currently-featured camp above a non-featured one in the same 0.5mi bucket', () => {
    const camps = [
      { id: 'plain', distance_miles: 1.2, is_featured: false, featured_until: null },
      { id: 'star', distance_miles: 1.4, is_featured: true, featured_until: future },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['star', 'plain']);
  });

  it('keeps raw distance order when the gap exceeds 0.5mi, even if the further camp is featured', () => {
    const camps = [
      { id: 'plain', distance_miles: 1.0, is_featured: false, featured_until: null },
      { id: 'far-star', distance_miles: 5.0, is_featured: true, featured_until: future },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['plain', 'far-star']);
  });

  it('ignores expired featured_until values', () => {
    const camps = [
      { id: 'plain', distance_miles: 1.2, is_featured: false, featured_until: null },
      { id: 'expired-star', distance_miles: 1.4, is_featured: true, featured_until: past },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['plain', 'expired-star']);
  });

  it('treats is_featured=true with a null featured_until as not featured', () => {
    const camps = [
      { id: 'plain', distance_miles: 1.2, is_featured: false, featured_until: null },
      { id: 'half-star', distance_miles: 1.4, is_featured: true, featured_until: null },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['plain', 'half-star']);
  });

  it('sorts non-featured camps in the same bucket by raw distance', () => {
    const camps = [
      { id: 'b', distance_miles: 1.4, is_featured: false, featured_until: null },
      { id: 'a', distance_miles: 1.2, is_featured: false, featured_until: null },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('puts camps with no distance at the end', () => {
    const camps = [
      { id: 'unknown', distance_miles: null, is_featured: false, featured_until: null },
      { id: 'near', distance_miles: 0.5, is_featured: false, featured_until: null },
    ];
    const sorted = sortByDistanceWithFeatured(camps);
    expect(sorted.map((c) => c.id)).toEqual(['near', 'unknown']);
  });
});
