import { describe, it, expect, vi } from 'vitest';

// camp-images helpers read NEXT_PUBLIC_SUPABASE_URL from env at module
// load time. Stub the env module before importing the helpers so the
// test doesn't require real env vars.
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  },
}));

import {
  buildPublicUrl,
  getCampLogoUrl,
  getCampHeroUrl,
  getCampLogoCandidates,
  getCampHeroCandidates,
} from '@/lib/storage/camp-images';

describe('camp-images', () => {
  describe('buildPublicUrl', () => {
    it('builds a Supabase public URL for an object in a bucket', () => {
      expect(buildPublicUrl('camp-logos', 'tgp.webp')).toBe(
        'https://example.supabase.co/storage/v1/object/public/camp-logos/tgp.webp',
      );
    });

    it('handles trailing slash on the base URL', () => {
      // Stubbed value has no trailing slash; helper should still strip
      // any future trailing slash a project URL ends with.
      expect(buildPublicUrl('camp-heroes', 'tgp.webp')).toContain(
        '/storage/v1/object/public/camp-heroes/tgp.webp',
      );
      expect(buildPublicUrl('camp-heroes', 'tgp.webp')).not.toContain('//storage');
    });
  });

  describe('getCampLogoUrl / getCampHeroUrl', () => {
    it('returns null for an empty slug', () => {
      expect(getCampLogoUrl('')).toBeNull();
      expect(getCampHeroUrl('')).toBeNull();
    });

    it('returns the webp URL by default for a real slug', () => {
      expect(getCampLogoUrl('the-growing-place-summer-camp')).toBe(
        'https://example.supabase.co/storage/v1/object/public/camp-logos/the-growing-place-summer-camp.webp',
      );
      expect(getCampHeroUrl('the-growing-place-summer-camp')).toBe(
        'https://example.supabase.co/storage/v1/object/public/camp-heroes/the-growing-place-summer-camp.webp',
      );
    });
  });

  describe('candidate lists', () => {
    it('returns logo candidates in preference order (webp first, svg last)', () => {
      const cands = getCampLogoCandidates('frost');
      expect(cands.length).toBe(5);
      expect(cands[0]).toContain('/frost.webp');
      expect(cands[cands.length - 1]).toContain('/frost.svg');
    });

    it('hero candidates do NOT include svg (raster-only buckets)', () => {
      const cands = getCampHeroCandidates('frost');
      expect(cands.every((u) => !u.endsWith('.svg'))).toBe(true);
    });

    it('returns empty array for empty slug', () => {
      expect(getCampLogoCandidates('')).toEqual([]);
      expect(getCampHeroCandidates('')).toEqual([]);
    });
  });
});
