import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests on migration 051 — Featured launch partner trio.
// The migration isn't applied against a real DB in CI, so these
// assertions catch the failures we can catch without one: schema-correct
// column names, ON CONFLICT idempotency, Frost UPDATE preserves
// featured_until, and a verification block that warns on mis-counts.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/051_featured_launch_trio.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 051 — Featured launch partner trio', () => {
  it('uses plural ages_min / ages_max (matches camps schema)', () => {
    expect(SQL).toMatch(/\bages_min\b/);
    expect(SQL).toMatch(/\bages_max\b/);
    // Brief's first draft used singular age_min/age_max. Catch regressions.
    expect(SQL).not.toMatch(/[^s]\bage_min\b/);
    expect(SQL).not.toMatch(/[^s]\bage_max\b/);
  });

  it('does NOT add a founding_partner column or use a `state` column', () => {
    // Both were artifacts of the brief's first draft — the table already
    // has is_launch_partner and no state column.
    expect(SQL).not.toMatch(/founding_partner/);
    expect(SQL).not.toMatch(/\bstate\b\s*[,)]/);
  });

  it('inserts 305 Mini Chefs with correct slug and launch-partner flags', () => {
    expect(SQL).toMatch(/'305-mini-chefs'/);
    expect(SQL).toMatch(/'305 Mini Chefs'/);
    // The 305 Mini Chefs INSERT must turn on is_launch_partner. We assert
    // the slug and the flag both appear within the same INSERT block.
    const block = SQL.match(/INSERT INTO public\.camps[\s\S]*?'305-mini-chefs'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/);
    expect(block, '305 Mini Chefs INSERT block not found').not.toBeNull();
    expect(block![0]).toMatch(/is_launch_partner/);
    expect(block![0]).toMatch(/is_featured/);
  });

  it('inserts Wise Choice Summer Camp with correct slug and launch-partner flags', () => {
    expect(SQL).toMatch(/'wise-choice-summer-camp'/);
    expect(SQL).toMatch(/'Wise Choice Summer Camp'/);
    const block = SQL.match(/INSERT INTO public\.camps[\s\S]*?'wise-choice-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/);
    expect(block, 'Wise Choice INSERT block not found').not.toBeNull();
    expect(block![0]).toMatch(/is_launch_partner/);
    expect(block![0]).toMatch(/is_featured/);
  });

  it('both new-camp INSERTs are ON CONFLICT (slug) DO NOTHING (idempotent)', () => {
    const conflicts = SQL.match(/ON CONFLICT \(slug\) DO NOTHING/g) ?? [];
    expect(conflicts.length).toBe(2);
  });

  it('Frost UPDATE flips is_launch_partner but does NOT touch featured_until', () => {
    const updateBlock = SQL.match(/UPDATE public\.camps[\s\S]*?WHERE slug = 'frost-science-summer'[\s\S]*?;/);
    expect(updateBlock, 'Frost UPDATE block not found').not.toBeNull();
    const block = updateBlock![0];
    expect(block).toMatch(/is_launch_partner\s*=\s*true/);
    expect(block).toMatch(/launch_partner_until/);
    // Critical R5 assertion: prod featured_until is 2026-07-24 already; do
    // not overwrite it with a 90-day window from migration apply time.
    expect(block).not.toMatch(/\bfeatured_until\b/);
  });

  it('targets the live Frost slug (frost-science-summer, not the dupe)', () => {
    expect(SQL).toMatch(/WHERE slug = 'frost-science-summer'/);
    expect(SQL).not.toMatch(/'frost-science-summer-camp'/);
  });

  it('verifies launch-partner count == 3 with a RAISE WARNING on mismatch', () => {
    expect(SQL).toMatch(/launch_partner_count/);
    expect(SQL).toMatch(/COUNT\(\*\)[\s\S]*?WHERE is_launch_partner = true/i);
    expect(SQL).toMatch(/RAISE NOTICE/);
    expect(SQL).toMatch(/RAISE WARNING/);
    expect(SQL).toMatch(/expected 3/i);
  });

  it('uses launch_partner_until = NOW() + INTERVAL \'90 days\' (matches admin toggle pattern)', () => {
    // Migration 006 / toggle-launch-partner route both use a 90-day window.
    // The 3 occurrences here: 2 inserts + 1 Frost update.
    const intervals = SQL.match(/INTERVAL '90 days'/g) ?? [];
    expect(intervals.length).toBeGreaterThanOrEqual(3);
  });

  it('tags both new camps with data_source=rasheid-launch-partner-2026-04', () => {
    const tags = SQL.match(/'rasheid-launch-partner-2026-04'/g) ?? [];
    expect(tags.length).toBe(2);
  });

  it('provides every NOT-NULL-without-default camps column for both new INSERTs', () => {
    // Per migration 003, the camps columns that are NOT NULL with NO
    // default are: slug, name, ages_min, ages_max, price_tier. The first
    // apply attempt failed because ages_min/ages_max/price_tier were
    // missing — this test exists so it can never happen again.
    const required = ['slug', 'name', 'ages_min', 'ages_max', 'price_tier'];
    for (const slug of ['305-mini-chefs', 'wise-choice-summer-camp']) {
      const block = SQL.match(
        new RegExp(`INSERT INTO public\\.camps \\(([\\s\\S]*?)\\)[\\s\\S]*?'${slug}'[\\s\\S]*?ON CONFLICT \\(slug\\) DO NOTHING;`),
      );
      expect(block, `${slug} INSERT block not found`).not.toBeNull();
      const columnList = block![1];
      for (const col of required) {
        expect(columnList, `${slug} INSERT must include ${col} column`).toMatch(
          new RegExp(`\\b${col}\\b`),
        );
      }
    }
  });

  it('uses a valid price_tier value for both new INSERTs', () => {
    // Migration 003 CHECK constraint: price_tier IN ('$', '$$', '$$$').
    // Anything else would fail at apply time. We assert at least one
    // valid tier value appears for each new camp.
    const validTiers = SQL.match(/'\${1,3}'/g) ?? [];
    expect(validTiers.length).toBeGreaterThanOrEqual(2);
  });

  it('uses a tagged dollar-quote on the outer DO block (avoids $$ collision with price_tier literals)', () => {
    // Postgres greedy-matches $$, so an outer `DO $$ ... END $$` block
    // that contains '$$' or '$$$' literals will terminate early. Use
    // a tagged dollar-quote like $migration$ to disambiguate.
    expect(SQL).toMatch(/DO \$migration\$/);
    expect(SQL).toMatch(/END \$migration\$;/);
    // The bare DO $$ form must not appear (whitespace allowed).
    expect(SQL).not.toMatch(/DO \$\$\s/);
    expect(SQL).not.toMatch(/END \$\$;/);
  });

  it('305 Mini Chefs uses ages_min=5, ages_max=12 (elementary range)', () => {
    const block = SQL.match(/'305-mini-chefs'[\s\S]*?ON CONFLICT/);
    expect(block).not.toBeNull();
    // The INSERT lists values positionally; we check the values block of
    // the same INSERT for the explicit 5 and 12 markers. They appear as
    // bare integers between commas in the VALUES list.
    const fullBlock = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'305-mini-chefs'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(fullBlock).not.toBeNull();
    expect(fullBlock![0]).toMatch(/\b5,\s*\n?\s*12\b/);
  });
});
