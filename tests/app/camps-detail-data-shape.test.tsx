import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Regression test for Q6: the dashboard camp-detail page must SELECT the same
// rich column set as the public camp-detail page. Before the unification,
// /app/camps/[slug] selected ~12 columns and /camps/[slug] selected 21 — Mom
// would lose hours, address, registration deadline, and price range when she
// signed in. This test fails if either page drops a column or they diverge.

const ROOT = join(__dirname, '..', '..');

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

function extractCampsSelect(file: string): string[] | null {
  // Match every .from('camps').select('...') call in the file and return the
  // LONGEST one. Both pages have a small lean SELECT inside generateMetadata
  // (just enough to render the meta title + OG image) plus the rich SELECT
  // in the page body — we want the rich one. Sorting by length keeps that
  // deterministic without coupling to file structure.
  const re = /\.from\(['"]camps['"]\)\s*\.select\(\s*['"`]([^'"`]+)['"`]/g;
  let longest: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(file)) !== null) {
    if (longest === null || m[1].length > longest.length) longest = m[1];
  }
  if (!longest) return null;
  return longest
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .sort();
}

describe('camp-detail data shape', () => {
  it('public detail (/{locale}/camps/[slug]) and dashboard detail (/{locale}/app/camps/[slug]) select the same column set', () => {
    const publicFile = read('src/app/[locale]/camps/[slug]/page.tsx');
    const appFile = read('src/app/[locale]/app/camps/[slug]/page.tsx');

    const publicCols = extractCampsSelect(publicFile);
    const appCols = extractCampsSelect(appFile);

    expect(publicCols, 'public detail page should query camps').not.toBeNull();
    expect(appCols, 'dashboard detail page should query camps').not.toBeNull();
    expect(appCols).toEqual(publicCols);
  });

  it('detail SELECT includes the columns Mom uses to plan a day', () => {
    const publicFile = read('src/app/[locale]/camps/[slug]/page.tsx');
    const cols = extractCampsSelect(publicFile);
    expect(cols).not.toBeNull();
    const required = [
      'address',
      'ages_max',
      'ages_min',
      'hours_end',
      'hours_start',
      'phone',
      'price_max_cents',
      'price_min_cents',
      'price_tier',
      'registration_deadline',
      'registration_url',
      'website_url',
    ];
    for (const col of required) {
      expect(cols, `column "${col}" missing from camp detail SELECT`).toContain(col);
    }
  });
});
