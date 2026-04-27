import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 053 — TGP Summer Camp + featured swap.
// Same approach as 051: the migration isn't applied against a real DB in
// CI, so these assertions catch what we can without one — schema-correct
// column names, ON CONFLICT idempotency, the two unflagging UPDATEs, and
// a verification block that warns on mis-counts.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/053_tgp_summer_camp_and_featured_swap.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 053 — TGP Summer Camp + featured swap', () => {
  it('uses plural ages_min / ages_max (matches camps schema)', () => {
    expect(SQL).toMatch(/\bages_min\b/);
    expect(SQL).toMatch(/\bages_max\b/);
    expect(SQL).not.toMatch(/[^s]\bage_min\b/);
    expect(SQL).not.toMatch(/[^s]\bage_max\b/);
  });

  it('inserts TGP Summer Camp with the correct slug and name', () => {
    expect(SQL).toMatch(/'the-growing-place-summer-camp'/);
    expect(SQL).toMatch(/'The Growing Place Summer Camp 2026'/);
  });

  it('TGP INSERT block is ON CONFLICT (slug) DO NOTHING (idempotent)', () => {
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block, 'TGP INSERT block not found').not.toBeNull();
  });

  it('TGP INSERT carries is_featured + is_launch_partner', () => {
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/is_featured/);
    expect(block![0]).toMatch(/is_launch_partner/);
  });

  it('TGP ages_min=3, ages_max=10 (Rasheid-locked range)', () => {
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    // VALUES list lays out the integers between commas; the brief locks 3-10.
    expect(block![0]).toMatch(/\b3,\s*\n?\s*10\b/);
  });

  it('TGP categories include religious tag (Methodist-affiliated venue)', () => {
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/'religious'/);
  });

  it('TGP INSERT provides every NOT-NULL-without-default column', () => {
    // Per migration 003: slug, name, ages_min, ages_max, price_tier are
    // NOT NULL with no default. Same regression guard as 051.
    const required = ['slug', 'name', 'ages_min', 'ages_max', 'price_tier'];
    const block = SQL.match(
      /INSERT INTO public\.camps \(([\s\S]*?)\)[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    const columnList = block![1];
    for (const col of required) {
      expect(columnList, `TGP INSERT must include ${col} column`).toMatch(
        new RegExp(`\\b${col}\\b`),
      );
    }
  });

  it('TGP INSERT uses a valid price_tier value', () => {
    // CHECK constraint allows '$', '$$', '$$$' only.
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/'\${1,3}'/);
  });

  it('unflags Deering Estate Eco from featured', () => {
    const block = SQL.match(
      /UPDATE public\.camps[\s\S]*?WHERE slug = 'deering-estate-eco'[\s\S]*?;/,
    );
    expect(block, 'Deering UPDATE block not found').not.toBeNull();
    expect(block![0]).toMatch(/is_featured\s*=\s*false/);
    expect(block![0]).toMatch(/featured_until\s*=\s*NULL/);
  });

  it('unflags Miami Children’s Museum (summer) from featured', () => {
    const block = SQL.match(
      /UPDATE public\.camps[\s\S]*?WHERE slug = 'miami-childrens-museum-summer'[\s\S]*?;/,
    );
    expect(block, 'Miami CM UPDATE block not found').not.toBeNull();
    expect(block![0]).toMatch(/is_featured\s*=\s*false/);
    expect(block![0]).toMatch(/featured_until\s*=\s*NULL/);
  });

  it('does NOT touch is_launch_partner on Deering or Miami CM rows', () => {
    // R5 spirit: those rows were never launch partners; leave the flag alone.
    const deering = SQL.match(
      /UPDATE public\.camps[\s\S]*?WHERE slug = 'deering-estate-eco'[\s\S]*?;/,
    );
    const miami = SQL.match(
      /UPDATE public\.camps[\s\S]*?WHERE slug = 'miami-childrens-museum-summer'[\s\S]*?;/,
    );
    expect(deering).not.toBeNull();
    expect(miami).not.toBeNull();
    expect(deering![0]).not.toMatch(/is_launch_partner/);
    expect(miami![0]).not.toMatch(/is_launch_partner/);
  });

  it('verifies featured_count == 4 with a RAISE WARNING on mismatch', () => {
    expect(SQL).toMatch(/featured_count/);
    expect(SQL).toMatch(/COUNT\(\*\)[\s\S]*?WHERE is_featured = true/i);
    expect(SQL).toMatch(/RAISE NOTICE/);
    expect(SQL).toMatch(/RAISE WARNING/);
    expect(SQL).toMatch(/expected 4/i);
  });

  it('verifies launch_partner_count == 4 with a RAISE WARNING on mismatch', () => {
    expect(SQL).toMatch(/launch_partner_count/);
    expect(SQL).toMatch(/COUNT\(\*\)[\s\S]*?WHERE is_launch_partner = true/i);
    expect(SQL).toMatch(/4 launch partners/);
  });

  it('raises an exception if TGP insert produced no featured row', () => {
    expect(SQL).toMatch(/RAISE EXCEPTION 'TGP Summer Camp insert failed/);
  });

  it('raises an exception if the TGP school slug is missing', () => {
    // Precondition guard — tells the operator to fix schools first.
    expect(SQL).toMatch(/RAISE EXCEPTION 'The Growing Place school not found/);
    expect(SQL).toMatch(/slug = 'the-growing-place'/);
  });

  it('tags TGP with data_source=rasheid-launch-partner-2026-04', () => {
    const block = SQL.match(
      /INSERT INTO public\.camps[\s\S]*?'the-growing-place-summer-camp'[\s\S]*?ON CONFLICT \(slug\) DO NOTHING;/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/'rasheid-launch-partner-2026-04'/);
  });

  it('uses launch_partner_until = NOW() + INTERVAL \'90 days\'', () => {
    expect(SQL).toMatch(/INTERVAL '90 days'/);
  });

  it('uses a tagged dollar-quote on the outer DO block', () => {
    // Bare DO $$ would terminate at the first '$$' price_tier literal.
    expect(SQL).toMatch(/DO \$migration\$/);
    expect(SQL).toMatch(/END \$migration\$;/);
    expect(SQL).not.toMatch(/DO \$\$\s/);
    expect(SQL).not.toMatch(/END \$\$;/);
  });
});
