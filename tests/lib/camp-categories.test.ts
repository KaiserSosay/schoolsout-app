import { describe, it, expect } from 'vitest';
import {
  CANONICAL_CATEGORIES,
  DEPRECATED_TAGS,
  LEGACY_TO_CANONICAL,
  UI_PILL_CATEGORIES,
  UI_PILL_MIN_COUNT,
  applyFolds,
  categoryThresholdOk,
  normalizeCategories,
} from '@/lib/camps/categories';

describe('camp categories — canonical vocabulary', () => {
  it('has exactly 26 canonical categories (21 surviving + 5 below-threshold)', () => {
    // 18 UI pills + 3 below-threshold sub-genres + 5 season/session markers = 26
    expect(CANONICAL_CATEGORIES.size).toBe(26);
  });

  it('every canonical category is lowercase', () => {
    for (const cat of CANONICAL_CATEGORIES) {
      expect(cat).toBe(cat.toLowerCase());
    }
  });

  it('every UI pill category is canonical', () => {
    for (const cat of UI_PILL_CATEGORIES) {
      expect(CANONICAL_CATEGORIES.has(cat)).toBe(true);
    }
  });

  it('UI pill list has exactly 18 entries', () => {
    expect(UI_PILL_CATEGORIES).toHaveLength(18);
  });

  it('no deprecated tag is in the canonical set', () => {
    for (const dep of DEPRECATED_TAGS) {
      expect(CANONICAL_CATEGORIES.has(dep)).toBe(false);
    }
  });

  it('no deprecated tag is a UI pill', () => {
    for (const dep of DEPRECATED_TAGS) {
      expect(UI_PILL_CATEGORIES).not.toContain(dep);
    }
  });

  it('Soccer / Basketball / Dance UI presence matches the threshold rule', () => {
    // Below threshold post-revisions:
    expect(UI_PILL_CATEGORIES).not.toContain('soccer');
    expect(UI_PILL_CATEGORIES).not.toContain('basketball');
    // At threshold (4 camps):
    expect(UI_PILL_CATEGORIES).toContain('dance');
  });

  it('religious is both canonical and a UI pill', () => {
    expect(CANONICAL_CATEGORIES.has('religious')).toBe(true);
    expect(UI_PILL_CATEGORIES).toContain('religious');
  });
});

describe('camp categories — LEGACY_TO_CANONICAL synonym map', () => {
  it('every value is a canonical category', () => {
    for (const [from, to] of Object.entries(LEGACY_TO_CANONICAL)) {
      expect(
        CANONICAL_CATEGORIES.has(to),
        `${from} maps to "${to}" which is not canonical`,
      ).toBe(true);
    }
  });

  it('STEM and STEAM both fold to stem', () => {
    expect(LEGACY_TO_CANONICAL['STEM']).toBe('stem');
    expect(LEGACY_TO_CANONICAL['STEAM']).toBe('stem');
  });

  it('Swim / Swimming / swim / swimming all fold to swim', () => {
    expect(LEGACY_TO_CANONICAL['Swim']).toBe('swim');
    expect(LEGACY_TO_CANONICAL['Swimming']).toBe('swim');
    expect(LEGACY_TO_CANONICAL['swim']).toBe('swim');
    expect(LEGACY_TO_CANONICAL['swimming']).toBe('swim');
  });

  it('Art / Arts / art / arts all fold to arts', () => {
    expect(LEGACY_TO_CANONICAL['Art']).toBe('arts');
    expect(LEGACY_TO_CANONICAL['Arts']).toBe('arts');
    expect(LEGACY_TO_CANONICAL['art']).toBe('arts');
    expect(LEGACY_TO_CANONICAL['arts']).toBe('arts');
  });

  it('History folds to cultural (mig013 legacy)', () => {
    expect(LEGACY_TO_CANONICAL['History']).toBe('cultural');
  });

  it('does NOT contain a stem→STEM uppercase mapping (the import-script bug fix lives elsewhere; this map is canonicalize-DOWN only)', () => {
    expect(LEGACY_TO_CANONICAL['stem']).toBe('stem');
    // Anything in the map should be lowercase on the value side
    for (const value of Object.values(LEGACY_TO_CANONICAL)) {
      expect(value).toBe(value.toLowerCase());
    }
  });
});

describe('camp categories — applyFolds (Q1 orphan rules)', () => {
  it('folds animals → nature', () => {
    expect(applyFolds(['animals'])).toEqual(['nature']);
    expect(applyFolds(['animals', 'nature'])).toEqual(['nature']);
  });

  it('folds water → swim AND outdoor (dual-tag)', () => {
    expect(applyFolds(['water'])).toEqual(['outdoor', 'swim']);
    expect(applyFolds(['water', 'swim'])).toEqual(['outdoor', 'swim']);
  });

  it('folds active → sports', () => {
    expect(applyFolds(['active'])).toEqual(['sports']);
  });

  it('folds indoor → sports (same parent as active — no double-add)', () => {
    expect(applyFolds(['indoor', 'active'])).toEqual(['sports']);
  });

  it('folds adventure → outdoor', () => {
    expect(applyFolds(['adventure'])).toEqual(['outdoor']);
    expect(applyFolds(['adventure', 'outdoor'])).toEqual(['outdoor']);
  });

  it('folds maker → stem', () => {
    expect(applyFolds(['maker'])).toEqual(['stem']);
    expect(applyFolds(['maker', 'stem'])).toEqual(['stem']);
  });

  it('keeps fencing AND ensures sports (dual-tag, NOT a fold-and-drop)', () => {
    expect(applyFolds(['fencing'])).toEqual(['fencing', 'sports']);
    expect(applyFolds(['fencing', 'sports'])).toEqual(['fencing', 'sports']);
  });

  it('returns deduplicated + sorted output', () => {
    expect(applyFolds(['stem', 'arts', 'stem', 'sports', 'arts'])).toEqual([
      'arts',
      'sports',
      'stem',
    ]);
  });

  it('is idempotent on canonical input', () => {
    const canonical = ['arts', 'nature', 'sports', 'stem'];
    expect(applyFolds(canonical)).toEqual(canonical);
    expect(applyFolds(applyFolds(canonical))).toEqual(canonical);
  });

  it('does NOT drop unknown tags (preserves data we cannot classify)', () => {
    expect(applyFolds(['sports', 'unknown_xyz'])).toEqual([
      'sports',
      'unknown_xyz',
    ]);
  });
});

describe('camp categories — normalizeCategories (full pipeline)', () => {
  it('lowercases + folds in one pass — Tidal Cove example', () => {
    // Tidal Cove had ['active', 'water'] in mig013 → after Section B added
    // outdoor; here we exercise just the legacy → canonical pipeline.
    expect(normalizeCategories(['active', 'water'])).toEqual([
      'outdoor',
      'sports',
      'swim',
    ]);
  });

  it('Frost Science example — STEM + nature + summer becomes stem + nature + summer', () => {
    expect(normalizeCategories(['STEM', 'nature', 'summer'])).toEqual([
      'nature',
      'stem',
      'summer',
    ]);
  });

  it('STEAM + arts + general becomes arts + general + stem', () => {
    expect(
      normalizeCategories(['STEAM', 'arts', 'general', 'sports', 'summer']),
    ).toEqual(['arts', 'general', 'sports', 'stem', 'summer']);
  });

  it('idempotent on already-canonical input', () => {
    const canonical = ['nature', 'sports', 'stem'];
    expect(normalizeCategories(canonical)).toEqual(canonical);
  });

  it('Sky Zone example — indoor + active becomes sports', () => {
    expect(normalizeCategories(['indoor', 'active'])).toEqual(['sports']);
  });

  it('mig013 History → cultural', () => {
    expect(normalizeCategories(['Art', 'History'])).toEqual(['arts', 'cultural']);
  });
});

describe('camp categories — categoryThresholdOk', () => {
  it('UI_PILL_MIN_COUNT is 3', () => {
    expect(UI_PILL_MIN_COUNT).toBe(3);
  });

  it('returns true at or above threshold', () => {
    expect(categoryThresholdOk(3)).toBe(true);
    expect(categoryThresholdOk(4)).toBe(true);
    expect(categoryThresholdOk(100)).toBe(true);
  });

  it('returns false below threshold', () => {
    expect(categoryThresholdOk(0)).toBe(false);
    expect(categoryThresholdOk(1)).toBe(false);
    expect(categoryThresholdOk(2)).toBe(false);
  });
});
