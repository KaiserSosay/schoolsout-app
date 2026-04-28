import { describe, it, expect, vi, beforeEach } from 'vitest';

// Tests for generateMetadata in /{locale}/camps/[slug]/page.tsx — verifies
// that tagline (when present) is the meta description, with description-
// derived fallback for camps that don't have a tagline yet.

type Row = {
  name: string;
  tagline: string | null;
  description: string | null;
  neighborhood: string | null;
  ages_min: number | null;
  ages_max: number | null;
  image_url: string | null;
};

let mockRow: Row | null = null;

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: mockRow, error: null }),
        }),
      }),
    }),
  }),
}));

import { generateMetadata } from '@/app/[locale]/camps/[slug]/page';

beforeEach(() => {
  mockRow = null;
});

const params = Promise.resolve({ locale: 'en', slug: 'frost-science-summer-camp' });

describe('camps/[slug] generateMetadata — tagline handling', () => {
  it('uses the tagline as meta description when present', async () => {
    mockRow = {
      name: 'Frost Science Summer Camp',
      tagline: 'Hands-on STEM, every weekday.',
      description:
        'A long markdown-formatted description that should NOT be used.',
      neighborhood: 'Downtown',
      ages_min: 6,
      ages_max: 12,
      image_url: null,
    };
    const meta = await generateMetadata({ params });
    expect(meta.description).toBe('Hands-on STEM, every weekday.');
  });

  it('falls back to composed description when tagline is null', async () => {
    mockRow = {
      name: 'Frost Science Summer Camp',
      tagline: null,
      description: 'Hands-on STEM summer programming for Miami kids',
      neighborhood: 'Downtown',
      ages_min: 6,
      ages_max: 12,
      image_url: null,
    };
    const meta = await generateMetadata({ params });
    expect(meta.description).toContain('Hands-on STEM summer programming');
    expect(meta.description).toContain('Ages 6');
    expect(meta.description).toContain('Downtown');
  });

  it('falls back to composed description when tagline is empty string', async () => {
    mockRow = {
      name: 'Frost Science Summer Camp',
      tagline: '   ',
      description: 'Some description',
      neighborhood: null,
      ages_min: null,
      ages_max: null,
      image_url: null,
    };
    const meta = await generateMetadata({ params });
    expect(meta.description).toContain('Some description');
  });

  it('uses camp.name in the composed fallback when description is also null', async () => {
    mockRow = {
      name: 'Frost Science Summer Camp',
      tagline: null,
      description: null,
      neighborhood: null,
      ages_min: null,
      ages_max: null,
      image_url: null,
    };
    const meta = await generateMetadata({ params });
    expect(meta.description).toContain('Frost Science Summer Camp');
  });

  it('truncates a long tagline with an ellipsis (matches existing 157-char + … behavior)', async () => {
    mockRow = {
      name: 'Camp X',
      tagline: 'A'.repeat(200),
      description: null,
      neighborhood: null,
      ages_min: null,
      ages_max: null,
      image_url: null,
    };
    const meta = await generateMetadata({ params });
    // Existing truncation rule: slice(0, 157) + '…' → 158 visible chars.
    expect(meta.description).toHaveLength(158);
    expect(meta.description).toMatch(/…$/);
  });
});
