import { describe, it, expect } from 'vitest';
import {
  applyFilters,
  hasActiveFilters,
  parseFilters,
  parseFiltersFromRecord,
  serializeFilters,
  type FilterableCamp,
} from '@/lib/camps/filters';

const empty = parseFilters(new URLSearchParams(''));

const baseCamp: FilterableCamp = {
  name: 'Frost Science Summer',
  ages_min: 5,
  ages_max: 12,
  price_tier: '$$',
  categories: ['STEM', 'Nature'],
  neighborhood: 'Downtown',
  hours_start: '09:00',
  hours_end: '16:00',
  before_care_offered: false,
  before_care_start: null,
  after_care_offered: false,
  after_care_end: null,
};

describe('parseFilters', () => {
  it('returns empty defaults when no params are set', () => {
    expect(empty).toEqual({
      q: '',
      cats: [],
      fullWorkday: false,
      beforeCare: false,
      afterCare: false,
      ages: null,
      tier: [],
      hood: [],
      match: false,
    });
  });

  it('reads the new ?cats= shape', () => {
    const f = parseFilters(new URLSearchParams('cats=STEM,Sports'));
    expect(f.cats).toEqual(['STEM', 'Sports']);
  });

  it('falls back to legacy ?categories= and ?category= so old links keep working', () => {
    expect(
      parseFilters(new URLSearchParams('categories=STEM,Sports')).cats,
    ).toEqual(['STEM', 'Sports']);
    expect(parseFilters(new URLSearchParams('category=Soccer')).cats).toEqual([
      'Soccer',
    ]);
  });

  it('parses care toggles + ages band + tier + hood + match', () => {
    const f = parseFilters(
      new URLSearchParams(
        'q=Frost&full_workday=1&before_care=1&after_care=1&ages=6-9&tier=$,$$&hood=Downtown,Coral+Gables&match=1',
      ),
    );
    expect(f).toMatchObject({
      q: 'Frost',
      fullWorkday: true,
      beforeCare: true,
      afterCare: true,
      ages: '6-9',
      tier: ['$', '$$'],
      hood: ['Downtown', 'Coral Gables'],
      match: true,
    });
  });

  it('rejects unknown ages bands and unknown tiers', () => {
    const f = parseFilters(new URLSearchParams('ages=99-100&tier=£,$$$$'));
    expect(f.ages).toBeNull();
    expect(f.tier).toEqual([]);
  });
});

describe('parseFiltersFromRecord', () => {
  it('flattens array-valued search params into CSV', () => {
    const f = parseFiltersFromRecord({ tier: ['$', '$$'] });
    expect(f.tier).toEqual(['$', '$$']);
  });
});

describe('hasActiveFilters', () => {
  it('returns false for the default filter shape', () => {
    expect(hasActiveFilters(empty)).toBe(false);
  });

  it('returns true when even one filter is active', () => {
    expect(hasActiveFilters({ ...empty, fullWorkday: true })).toBe(true);
    expect(hasActiveFilters({ ...empty, q: 'hello' })).toBe(true);
    expect(hasActiveFilters({ ...empty, hood: ['x'] })).toBe(true);
  });
});

describe('applyFilters', () => {
  it('matches names case-insensitively for ?q=', () => {
    const out = applyFilters(
      [baseCamp, { ...baseCamp, name: 'Coral Gables Soccer' }],
      { ...empty, q: 'frost' },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.name).toBe('Frost Science Summer');
  });

  it('keeps only camps overlapping the cats filter', () => {
    const out = applyFilters(
      [baseCamp, { ...baseCamp, categories: ['Soccer'] }],
      { ...empty, cats: ['Soccer'] },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.categories).toEqual(['Soccer']);
  });

  it('cats filter is case-insensitive — lowercase pill matches uppercase legacy data', () => {
    // Stage 2 deploy-window guard: filter UI ships lowercase pills before
    // migration 052 finishes lowercasing prod data. Match must work for
    // both cases.
    const out = applyFilters(
      [
        { ...baseCamp, categories: ['STEM'] },
        { ...baseCamp, categories: ['Sports'] },
      ],
      { ...empty, cats: ['stem'] },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.categories).toEqual(['STEM']);
  });

  it('cats filter is case-insensitive — uppercase URL matches lowercase post-migration data', () => {
    // Mirror: someone shares a stale URL with ?cats=STEM after the
    // migration ran. Should still match.
    const out = applyFilters(
      [{ ...baseCamp, categories: ['stem'] }],
      { ...empty, cats: ['STEM'] },
    );
    expect(out).toHaveLength(1);
  });

  it('full_workday excludes camps without enough extended care', () => {
    const tightHours: FilterableCamp = {
      ...baseCamp,
      hours_start: '09:00',
      hours_end: '15:00',
    };
    const fullDay: FilterableCamp = {
      ...baseCamp,
      hours_start: '07:30',
      hours_end: '18:00',
      before_care_offered: true,
      before_care_start: '07:30',
      after_care_offered: true,
      after_care_end: '18:00',
    };
    const out = applyFilters([tightHours, fullDay], { ...empty, fullWorkday: true });
    expect(out).toHaveLength(1);
    expect(out[0]?.hours_start).toBe('07:30');
  });

  it('full_workday excludes camps with no hours data', () => {
    const noHours: FilterableCamp = {
      ...baseCamp,
      hours_start: null,
      hours_end: null,
    };
    const out = applyFilters([noHours], { ...empty, fullWorkday: true });
    expect(out).toEqual([]);
  });

  it('before_care + after_care are independent toggles', () => {
    const beforeOnly: FilterableCamp = {
      ...baseCamp,
      before_care_offered: true,
      after_care_offered: false,
    };
    const afterOnly: FilterableCamp = {
      ...baseCamp,
      before_care_offered: false,
      after_care_offered: true,
    };
    expect(
      applyFilters([beforeOnly, afterOnly], { ...empty, beforeCare: true }),
    ).toEqual([beforeOnly]);
    expect(
      applyFilters([beforeOnly, afterOnly], { ...empty, afterCare: true }),
    ).toEqual([afterOnly]);
  });

  it('ages band requires overlap with [min, max]', () => {
    const teen: FilterableCamp = { ...baseCamp, ages_min: 13, ages_max: 17 };
    const elem: FilterableCamp = { ...baseCamp, ages_min: 5, ages_max: 10 };
    const out = applyFilters([teen, elem], { ...empty, ages: '6-9' });
    expect(out).toHaveLength(1);
    expect(out[0]?.ages_min).toBe(5);
  });

  it('tier filter keeps only camps with a matching price_tier', () => {
    const cheap: FilterableCamp = { ...baseCamp, price_tier: '$' };
    const out = applyFilters([baseCamp, cheap], { ...empty, tier: ['$'] });
    expect(out).toEqual([cheap]);
  });

  it('hood filter keeps only camps in the chosen neighborhoods', () => {
    const grove: FilterableCamp = { ...baseCamp, neighborhood: 'Coconut Grove' };
    const out = applyFilters([baseCamp, grove], {
      ...empty,
      hood: ['Coconut Grove'],
    });
    expect(out).toEqual([grove]);
  });

  it('combines filters with AND', () => {
    const match: FilterableCamp = {
      ...baseCamp,
      categories: ['STEM'],
      price_tier: '$',
      ages_min: 6,
      ages_max: 9,
    };
    const wrongTier: FilterableCamp = { ...match, price_tier: '$$$' };
    const out = applyFilters([match, wrongTier], {
      ...empty,
      cats: ['STEM'],
      tier: ['$'],
      ages: '6-9',
    });
    expect(out).toEqual([match]);
  });
});

describe('serializeFilters', () => {
  it('produces a tidy URL omitting empty/falsy values', () => {
    expect(serializeFilters(empty)).toBe('');
    expect(
      serializeFilters({
        ...empty,
        q: 'frost',
        cats: ['STEM'],
        fullWorkday: true,
        ages: '6-9',
      }),
    ).toBe('q=frost&cats=STEM&full_workday=1&ages=6-9');
  });
});
