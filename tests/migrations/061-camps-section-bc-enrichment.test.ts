import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 061 — DevClawd Section B + C camps
// enrichment (53 taglines + 8 logos). We don't apply against a real
// DB in CI; these checks lock in the R5 gap-fill shape, the exact slug
// list, the exclusion list (5 Deering placeholder logos), and the
// verification block.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/061_camps_section_bc_enrichment.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

const TAGLINE_SLUGS = [
  // Section B (47 medium-confidence)
  'alexander-montessori-ludlam',
  'alexander-montessori-old-cutler',
  'alexander-montessori-palmetto-bay',
  'alexander-montessori-red-road',
  'camp-curiosity-ehmann',
  'camp-manatee-at-greynolds-park',
  'camp-palmetto-bay-at-coral-reef-park',
  'camp-shemesh',
  'camp-victory-at-vista-view-park',
  'city-of-aventura-art-camp',
  'city-of-aventura-general-camp',
  'city-of-aventura-sports-camp',
  'city-of-aventura-stem-camp',
  'city-of-hialeah-creative-learning-play-summer-camp',
  'city-of-homestead-summer-camp-2026',
  'crandon-tennis',
  'cutler-bay-careers-in-stem-summer-camp',
  'cutler-bay-summer-camp',
  'davis-fencing',
  'deering-estate-expedition',
  'deering-fall',
  'deering-mini',
  'deering-spring',
  'deering-winter',
  'flamingo-park-multi-sport-camp',
  'flamingo-park-tennis-center-summer-camp',
  'hollywood-m-o-s-t-camp',
  'ingalls-park-teen-summer-camp',
  'key-biscayne-community-center-summer-camp',
  'kla-academy-summer',
  'la-piazza-academy-summer-camp',
  'machane-miami',
  'miami-youth-sailing-foundation-summer-camp',
  'moonlighter-fablab',
  'neighborhood-tennis-summer-camp-at-kirk-munroe',
  'o-b-johnson-park-summer-camp',
  'oakland-park-summer-camp',
  'pembroke-pines-art-camp',
  'pembroke-pines-drama-camp',
  'pembroke-pines-early-development-center-summer-camp',
  'riviera-day-camp',
  'riviera-junior-camp',
  'scott-rakow-youth-center-kayaking-summer-camp',
  'south-miami-one-day',
  'south-miami-spring',
  'south-miami-winter',
  'stars-summer-camp-at-evelyn-greer-park',
  // Section C (6 low-confidence)
  'camp-discover-at-fiu',
  'camp-explore-at-fiu',
  'camp-gulliver',
  'club-p-l-a-y-summer-camp',
  'coconut-grove-montessori-summer-camp',
  'epiphany-lutheran-nursery-school-summer-camp',
];

const LOGO_SLUGS = [
  'alexander-montessori-ludlam',
  'alexander-montessori-old-cutler',
  'alexander-montessori-palmetto-bay',
  'alexander-montessori-red-road',
  'camp-curiosity-ehmann',
  'camp-shemesh',
  'camp-discover-at-fiu',
  'camp-explore-at-fiu',
];

// Slugs explicitly NOT in this migration (per the source prompt's
// anti-goal list, carried forward from migration 060).
const FORBIDDEN_SLUGS = ['wise-choice-fiu', 'wise-choice-um'];

// Deering Estate variants get taglines but NOT logo writes — DevClawd
// suggested the same dev-subdomain "placeholder-logo" URL for all five.
const DEERING_NO_LOGO = [
  'deering-estate-expedition',
  'deering-fall',
  'deering-mini',
  'deering-spring',
  'deering-winter',
];

// Other Section B/C camps that get taglines but no logo — DevClawd
// found no usable logo URL for them.
const TAGLINE_ONLY_NO_LOGO = [
  ...DEERING_NO_LOGO,
  'camp-manatee-at-greynolds-park',
  'camp-palmetto-bay-at-coral-reef-park',
  'camp-victory-at-vista-view-park',
  'city-of-aventura-art-camp',
  'city-of-aventura-general-camp',
  'city-of-aventura-sports-camp',
  'city-of-aventura-stem-camp',
  'city-of-hialeah-creative-learning-play-summer-camp',
  'city-of-homestead-summer-camp-2026',
  'crandon-tennis',
  'cutler-bay-careers-in-stem-summer-camp',
  'cutler-bay-summer-camp',
  'davis-fencing',
  'flamingo-park-multi-sport-camp',
  'flamingo-park-tennis-center-summer-camp',
  'hollywood-m-o-s-t-camp',
  'ingalls-park-teen-summer-camp',
  'key-biscayne-community-center-summer-camp',
  'kla-academy-summer',
  'la-piazza-academy-summer-camp',
  'machane-miami',
  'miami-youth-sailing-foundation-summer-camp',
  'moonlighter-fablab',
  'neighborhood-tennis-summer-camp-at-kirk-munroe',
  'o-b-johnson-park-summer-camp',
  'oakland-park-summer-camp',
  'pembroke-pines-art-camp',
  'pembroke-pines-drama-camp',
  'pembroke-pines-early-development-center-summer-camp',
  'riviera-day-camp',
  'riviera-junior-camp',
  'scott-rakow-youth-center-kayaking-summer-camp',
  'south-miami-one-day',
  'south-miami-spring',
  'south-miami-winter',
  'stars-summer-camp-at-evelyn-greer-park',
  'camp-gulliver',
  'club-p-l-a-y-summer-camp',
  'coconut-grove-montessori-summer-camp',
  'epiphany-lutheran-nursery-school-summer-camp',
];

describe('migration 061 — Section B + C camps enrichment', () => {
  it('updates exactly 53 taglines (one UPDATE per slug)', () => {
    for (const slug of TAGLINE_SLUGS) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET tagline = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(SQL, `tagline UPDATE for slug ${slug}`).toMatch(re);
    }
    expect(TAGLINE_SLUGS.length).toBe(53);
  });

  it('updates exactly 8 logos (one UPDATE per slug)', () => {
    for (const slug of LOGO_SLUGS) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET logo_url = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(SQL, `logo UPDATE for slug ${slug}`).toMatch(re);
    }
    expect(LOGO_SLUGS.length).toBe(8);
  });

  it('every tagline UPDATE is R5-compliant (gap-fill, never overwrite)', () => {
    const updates =
      SQL.match(/UPDATE camps SET tagline =[\s\S]*?(?=;)/gi) ?? [];
    expect(updates.length).toBeGreaterThanOrEqual(53);
    for (const u of updates) {
      expect(
        u,
        "tagline UPDATE must guard on `tagline IS NULL OR tagline = ''`",
      ).toMatch(/tagline IS NULL OR tagline = ''/);
    }
  });

  it('every logo_url UPDATE is R5-compliant (gap-fill, never overwrite)', () => {
    const updates =
      SQL.match(/UPDATE camps SET logo_url =[\s\S]*?(?=;)/gi) ?? [];
    expect(updates.length).toBeGreaterThanOrEqual(8);
    for (const u of updates) {
      expect(
        u,
        "logo_url UPDATE must guard on `logo_url IS NULL OR logo_url = ''`",
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

  it('Deering Estate variants get tagline updates but NOT logo updates (placeholder URL excluded)', () => {
    for (const slug of DEERING_NO_LOGO) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Confirm tagline update exists.
      const taglineRe = new RegExp(
        `UPDATE camps SET tagline = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(SQL, `${slug} should have a tagline UPDATE`).toMatch(taglineRe);
      // Confirm logo update does NOT exist.
      const logoRe = new RegExp(
        `UPDATE camps SET logo_url = [^;]*WHERE slug = '${escaped}'`,
      );
      expect(
        SQL,
        `${slug} must NOT get a logo_url UPDATE (placeholder dev URL)`,
      ).not.toMatch(logoRe);
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

  it('does not write the dev.deeringestate.org placeholder URL in any UPDATE', () => {
    // The URL may appear in the SQL comment block (describing what we
    // excluded), but must NEVER appear inside a SET logo_url = '...' value.
    const logoSets =
      SQL.match(/SET logo_url = '([^']+)'/g)?.map((m) =>
        m.replace(/SET logo_url = '/, '').replace(/'$/, ''),
      ) ?? [];
    for (const u of logoSets) {
      expect(u, `placeholder URL must not be applied: ${u}`).not.toMatch(
        /dev\.deeringestate\.org.*placeholder-logo/,
      );
    }
  });

  it('does not DELETE, DROP, ALTER, or INSERT any rows', () => {
    expect(SQL).not.toMatch(/DELETE\s+FROM/i);
    expect(SQL).not.toMatch(/DROP\s+(?:COLUMN|TABLE|TYPE)/i);
    expect(SQL).not.toMatch(/ALTER\s+TABLE/i);
    expect(SQL).not.toMatch(/INSERT\s+INTO\s+camps/i);
  });

  it('only writes to tagline and logo_url columns on the camps table', () => {
    const sets = SQL.match(/UPDATE camps SET (\w+)\s*=/gi) ?? [];
    for (const s of sets) {
      const col = s.replace(/UPDATE camps SET /i, '').replace(/\s*=$/, '');
      expect(['tagline', 'logo_url']).toContain(col);
    }
  });

  it('verification block reports counts for both taglines and logos', () => {
    expect(SQL).toMatch(/Camps with taglines populated:.*\/ 53/);
    expect(SQL).toMatch(/Camps with logo_url populated:.*\/ 8/);
  });

  it('logo URLs are all https:// — no http or relative paths', () => {
    const urls =
      SQL.match(/SET logo_url = '([^']+)'/g)?.map((m) =>
        m.replace(/SET logo_url = '/, '').replace(/'$/, ''),
      ) ?? [];
    expect(urls.length).toBe(8);
    for (const u of urls) {
      expect(u, `logo URL must use https://, got: ${u}`).toMatch(/^https:\/\//);
    }
  });

  it('Frost Science logo is shared across the 3 Frost partnership camps', () => {
    const FROST_LOGO =
      'https://www.frostscience.org/wp-content/themes/frost-science/images/logo_frost.png';
    const frostCamps = [
      'camp-curiosity-ehmann',
      'camp-discover-at-fiu',
      'camp-explore-at-fiu',
    ];
    for (const slug of frostCamps) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET logo_url = '${FROST_LOGO.replace(
          /[/.]/g,
          '\\$&',
        )}'\\s+WHERE slug = '${escaped}'`,
      );
      expect(SQL, `${slug} should use the shared Frost Science logo`).toMatch(
        re,
      );
    }
  });

  it('Alexander Montessori logo is shared across all 4 location slugs', () => {
    const ALEX_LOGO = 'https://www.alexandermontessori.com/uploaded/images/logo.png';
    const alexCamps = [
      'alexander-montessori-ludlam',
      'alexander-montessori-old-cutler',
      'alexander-montessori-palmetto-bay',
      'alexander-montessori-red-road',
    ];
    for (const slug of alexCamps) {
      const escaped = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(
        `UPDATE camps SET logo_url = '${ALEX_LOGO.replace(
          /[/.]/g,
          '\\$&',
        )}'\\s+WHERE slug = '${escaped}'`,
      );
      expect(
        SQL,
        `${slug} should use the shared Alexander Montessori logo`,
      ).toMatch(re);
    }
  });
});
