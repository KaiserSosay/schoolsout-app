import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANONICAL_CATEGORIES,
  DEPRECATED_TAGS,
  LEGACY_TO_CANONICAL,
} from '@/lib/camps/categories';

// Lockstep test: ensures the migration's Phase 1 CASE block, Phase 3 fold
// rewrites, and Phase 2 per-camp slug lists stay in sync with the
// canonical categories lib + the dry-run script's slug arrays.
//
// If anyone edits one without the other, this test fails — the migration
// must always reflect the same vocabulary the runtime code uses.

const ROOT = join(__dirname, '..', '..');

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

const migrationSql = read('supabase/migrations/052_camp_categories_canonical.sql');
const dryRunTs = read('scripts/dry-run-canonical-categories.ts');

describe('migration 052 — synonym map sync', () => {
  it('every legacy synonym key from the lib appears in the migration CASE block', () => {
    // For each `from` key in LEGACY_TO_CANONICAL, the migration's Phase 1
    // CASE block should mention the literal token in some `cat IN (...)`
    // arm. We extract all literal strings inside `cat IN (` clauses and
    // assert each `from` is present.
    const inClauses = migrationSql.match(/cat IN \([^)]*\)/g) ?? [];
    const literals = new Set<string>();
    for (const clause of inClauses) {
      for (const m of clause.matchAll(/'([^']+)'/g)) {
        literals.add(m[1]);
      }
    }
    for (const key of Object.keys(LEGACY_TO_CANONICAL)) {
      expect(
        literals.has(key),
        `LEGACY_TO_CANONICAL key "${key}" missing from migration 052 CASE block`,
      ).toBe(true);
    }
  });

  it('every CASE-block target value is canonical', () => {
    // Extract THEN literals (right side of each WHEN). Each must be in
    // CANONICAL_CATEGORIES.
    const thenMatches = migrationSql.match(/THEN '([^']+)'/g) ?? [];
    for (const m of thenMatches) {
      const value = m.match(/THEN '([^']+)'/)![1];
      expect(
        CANONICAL_CATEGORIES.has(value),
        `migration 052 CASE block produces non-canonical "${value}"`,
      ).toBe(true);
    }
  });
});

describe('migration 052 — deprecated-tag fold sync', () => {
  it('every deprecated tag has a Phase 3 fold rewrite', () => {
    // Every deprecated tag should appear in a Phase 3 `array_remove(
    // categories, '<tag>')` invocation.
    for (const tag of DEPRECATED_TAGS) {
      const pattern = new RegExp(`array_remove\\(categories,\\s*'${tag}'\\)`);
      expect(
        pattern.test(migrationSql),
        `migration 052 missing Phase 3 fold for deprecated tag "${tag}"`,
      ).toBe(true);
    }
  });

  it('Phase 4 verification rejects every deprecated tag', () => {
    // The verify block must list every deprecated tag in its
    // `c IN (...)` exception clause.
    const verifyMatch = migrationSql.match(
      /WHERE\s+c\s+IN\s*\(([^)]+)\)\s*\)\s*;\s*RAISE NOTICE 'verify: camps with deprecated tags/,
    );
    expect(verifyMatch, 'migration 052 missing deprecated-tag verify block').toBeTruthy();
    const verifiedTags = new Set<string>();
    for (const m of verifyMatch![1].matchAll(/'([^']+)'/g)) {
      verifiedTags.add(m[1]);
    }
    for (const tag of DEPRECATED_TAGS) {
      expect(
        verifiedTags.has(tag),
        `migration 052 verify block missing deprecated tag "${tag}"`,
      ).toBe(true);
    }
  });
});

describe('migration 052 — Section A/B slug lockstep with dry-run script', () => {
  // Pull all WHERE slug IN (...) blocks from the migration and compare
  // against the dry-run script's hard-coded slug arrays. The two SHOULD
  // contain the same slugs (in different forms — SQL literals vs JS
  // string array entries).

  function extractSlugsFromSql(sql: string): Set<string> {
    const out = new Set<string>();
    for (const m of sql.matchAll(/WHERE slug IN \(([^)]+)\)/g)) {
      for (const lit of m[1].matchAll(/'([^']+)'/g)) {
        out.add(lit[1]);
      }
    }
    return out;
  }

  function extractSlugsFromTs(ts: string): Set<string> {
    // Pull every string literal inside a `slugs: [ ... ]` array literal.
    const out = new Set<string>();
    for (const arr of ts.matchAll(/slugs:\s*\[([^\]]+)\]/g)) {
      for (const lit of arr[1].matchAll(/'([^']+)'/g)) {
        out.add(lit[1]);
      }
    }
    return out;
  }

  it('migration slugs and dry-run slugs are identical sets', () => {
    const sqlSlugs = extractSlugsFromSql(migrationSql);
    const tsSlugs = extractSlugsFromTs(dryRunTs);

    const onlyInSql = [...sqlSlugs].filter((s) => !tsSlugs.has(s)).sort();
    const onlyInTs = [...tsSlugs].filter((s) => !sqlSlugs.has(s)).sort();

    expect(
      onlyInSql,
      `slugs in migration but not in dry-run script: ${onlyInSql.join(', ')}`,
    ).toEqual([]);
    expect(
      onlyInTs,
      `slugs in dry-run script but not in migration: ${onlyInTs.join(', ')}`,
    ).toEqual([]);
  });

  it('migration touches at least 25 distinct camps (Section A: ~21 + Section B: ~10 with overlap)', () => {
    const sqlSlugs = extractSlugsFromSql(migrationSql);
    expect(sqlSlugs.size).toBeGreaterThanOrEqual(25);
  });
});

describe('migration 052 — idempotency contract', () => {
  it('uses array_agg(DISTINCT ...) so re-runs are no-ops', () => {
    const matches = migrationSql.match(/array_agg\(DISTINCT/g) ?? [];
    // Phase 1 (1) + Phase 2 (10 buckets) + Phase 3 (7 folds) ≈ 18 calls
    expect(matches.length).toBeGreaterThanOrEqual(15);
  });

  it('Phase 1 UPDATE includes IS DISTINCT FROM guard so unchanged rows are not rewritten', () => {
    expect(migrationSql).toContain('IS DISTINCT FROM');
  });
});
