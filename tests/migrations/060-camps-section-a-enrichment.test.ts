import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 060 — DevClawd Section A camps
// enrichment (28 taglines + 13 logos). We don't apply against a real
// DB in CI; these checks lock in the R5 gap-fill shape, the exact
// slug list, and the verification block.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/060_camps_section_a_enrichment.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

const TAGLINE_SLUGS = [
  'ale-tennis-academy-summer-camp-doral',
  'all-kids-included-youth-arts-creative-arts-summer-camp',
  'belen-jesuit-summer-camp',
  'camp-black-bear-at-a-d-barnes-park-nature-center',
  'camp-carrollton',
  'camp-chameleon-at-markham-park',
  'camp-j-miami-at-alper-jcc',
  'camp-kadima-at-david-posnack-jcc',
  'camp-nova-at-nsu-university-school',
  'camp-steamology-at-museum-of-discovery-and-science',
  'camp-tamarac',
  'code-ninjas-aventura-summer-camp',
  'crandon-golf-academy',
  'deering-estate-eco',
  'fairchild-gardens-camp',
  'fiu-theatre-summer-camp',
  'hollywood-jr-beach-lifeguard-program',
  'id-tech-camps-at-university-of-miami',
  'jungle-island',
  'miami-childrens-museum-one-day',
  'miami-country-day-school-summer-camp',
  'pine-crest-summer-camp',
  'ransom-everglades-sports',
  'school-of-rock-coconut-grove-summer-music-camps',
  'shake-a-leg-miami-summer-camp',
  'snapology-of-miami-beach-summer-camp',
  'south-miami-city',
  'ymca-sfl-day-off',
];

const LOGO_SLUGS = [
  'ale-tennis-academy-summer-camp-doral',
  'belen-jesuit-summer-camp',
  'camp-carrollton',
  'camp-chameleon-at-markham-park',
  'camp-j-miami-at-alper-jcc',
  'camp-kadima-at-david-posnack-jcc',
  'camp-nova-at-nsu-university-school',
  'camp-steamology-at-museum-of-discovery-and-science',
  'crandon-golf-academy',
  'jungle-island',
  'school-of-rock-coconut-grove-summer-music-camps',
  'shake-a-leg-miami-summer-camp',
  'ymca-sfl-day-off',
];

// Slugs explicitly NOT in this migration (per the source prompt's
// anti-goal list). If any of these accidentally land in the SQL the
// test fails — protects against future re-imports drifting in.
const FORBIDDEN_SLUGS = ['wise-choice-fiu', 'wise-choice-um'];

// Logo slugs explicitly skipped due to unreliable URLs (favicon /
// dev-server / placeholder filenames per source prompt). They get
// taglines but must NOT get logo writes.
const TAGLINE_ONLY_NO_LOGO = [
  'deering-estate-eco',
  'miami-country-day-school-summer-camp',
  'miami-childrens-museum-one-day',
  'all-kids-included-youth-arts-creative-arts-summer-camp',
  'camp-black-bear-at-a-d-barnes-park-nature-center',
  'camp-tamarac',
  'code-ninjas-aventura-summer-camp',
  'fairchild-gardens-camp',
  'fiu-theatre-summer-camp',
  'hollywood-jr-beach-lifeguard-program',
  'id-tech-camps-at-university-of-miami',
  'pine-crest-summer-camp',
  'ransom-everglades-sports',
  'snapology-of-miami-beach-summer-camp',
  'south-miami-city',
];

describe('migration 060 — Section A camps enrichment', () => {
  it('updates exactly 28 taglines (one UPDATE per slug)', () => {
    for (const slug of TAGLINE_SLUGS) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET tagline = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(SQL, `tagline UPDATE for slug ${slug}`).toMatch(re);
    }
  });

  it('updates exactly 13 logos (one UPDATE per slug)', () => {
    for (const slug of LOGO_SLUGS) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET logo_url = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(SQL, `logo UPDATE for slug ${slug}`).toMatch(re);
    }
  });

  it('every tagline UPDATE is R5-compliant (gap-fill, never overwrite)', () => {
    const updates =
      SQL.match(/UPDATE camps SET tagline =[\s\S]*?(?=;)/gi) ?? [];
    expect(updates.length).toBeGreaterThanOrEqual(28);
    for (const u of updates) {
      expect(
        u,
        'tagline UPDATE must guard on `tagline IS NULL OR tagline = \'\'`',
      ).toMatch(/tagline IS NULL OR tagline = ''/);
    }
  });

  it('every logo_url UPDATE is R5-compliant (gap-fill, never overwrite)', () => {
    const updates =
      SQL.match(/UPDATE camps SET logo_url =[\s\S]*?(?=;)/gi) ?? [];
    expect(updates.length).toBeGreaterThanOrEqual(13);
    for (const u of updates) {
      expect(
        u,
        'logo_url UPDATE must guard on `logo_url IS NULL OR logo_url = \'\'`',
      ).toMatch(/logo_url IS NULL OR logo_url = ''/);
    }
  });

  it('does not target forbidden slugs (wise-choice-fiu / wise-choice-um)', () => {
    for (const slug of FORBIDDEN_SLUGS) {
      expect(
        SQL,
        `forbidden slug ${slug} must not appear in UPDATEs`,
      ).not.toMatch(new RegExp(`slug = '${slug}'`));
    }
  });

  it('camps in the tagline-only list never get a logo_url write', () => {
    for (const slug of TAGLINE_ONLY_NO_LOGO) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET logo_url = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(
        SQL,
        `${slug} should be in the tagline list but NOT get a logo_url UPDATE`,
      ).not.toMatch(re);
    }
  });

  it('does not DELETE, DROP, ALTER, or INSERT any rows', () => {
    expect(SQL).not.toMatch(/DELETE\s+FROM/i);
    expect(SQL).not.toMatch(/DROP\s+(?:COLUMN|TABLE|TYPE)/i);
    expect(SQL).not.toMatch(/ALTER\s+TABLE/i);
    expect(SQL).not.toMatch(/INSERT\s+INTO\s+camps/i);
  });

  it('only writes to tagline and logo_url columns on the camps table', () => {
    // Catch a stray SET that touches any other column. We allow SET
    // tagline = ... and SET logo_url = ... only.
    const sets =
      SQL.match(/UPDATE camps SET (\w+)\s*=/gi) ?? [];
    for (const s of sets) {
      const col = s.replace(/UPDATE camps SET /i, '').replace(/\s*=$/, '');
      expect(['tagline', 'logo_url']).toContain(col);
    }
  });

  it('verification block raises if either count is short', () => {
    expect(SQL).toMatch(/Section A tagline gap-fill incomplete/);
    expect(SQL).toMatch(/Section A logo gap-fill incomplete/);
    // Both verifies use the canonical 28 / 13 numbers.
    expect(SQL).toMatch(/expected 28 populated/);
    expect(SQL).toMatch(/expected 13 populated/);
  });

  it('logo URLs are all https:// — no http or relative paths', () => {
    const urls =
      SQL.match(/SET logo_url = '([^']+)'/g)?.map((m) =>
        m.replace(/SET logo_url = '/, '').replace(/'$/, ''),
      ) ?? [];
    expect(urls.length).toBe(13);
    for (const u of urls) {
      expect(u, `logo URL must use https://, got: ${u}`).toMatch(/^https:\/\//);
    }
  });
});
