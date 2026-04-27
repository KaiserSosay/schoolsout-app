#!/usr/bin/env tsx
/**
 * Dry-run preview for migration 052_camp_categories_canonical.sql.
 *
 * Reads PROD camp categories, computes what migration 052 would change
 * in-memory using the same lib (`src/lib/camps/categories.ts`) the
 * migration's CASE block was generated from, and prints:
 *
 *   1. Total camps with ANY category change
 *   2. Total camps that would have categories REMOVED ENTIRELY
 *      (should be 0 — the migration only adds + replaces, never empties)
 *   3. Total tags the migration would normalize/fold (count of legacy
 *      values touched across the whole table)
 *   4. A sample of 5–10 actual before/after diffs across diverse camps
 *
 * NEVER writes to prod. Apply the actual migration via:
 *
 *     pnpm exec supabase db push --include-all
 *
 * after reviewing this dry-run's output.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Source: .deploy-secrets/env.sh
 *
 * Same dry-run discipline as scripts/import-schools-research.ts.
 */

import { createClient } from '@supabase/supabase-js';
import {
  CANONICAL_CATEGORIES,
  DEPRECATED_TAGS,
  LEGACY_TO_CANONICAL,
  normalizeCategories,
} from '@/lib/camps/categories';

// Per-camp Section A name-keyword adds — must stay in lockstep with
// supabase/migrations/052_camp_categories_canonical.sql Phase 2.
// (Sync test in tests/lib/migration-052-sync.test.ts asserts every slug
// here appears in the migration SQL and vice versa.)
const SECTION_A_ADDS: Array<{ tag: string; slugs: string[] }> = [
  {
    tag: 'tennis',
    slugs: [
      'ale-tennis-academy-summer-camp-doral',
      'flamingo-park-tennis-center-summer-camp',
      'miami-beach-tennis-academy-summer-camp',
      'neighborhood-tennis-summer-camp-at-kirk-munroe',
      'palmetto-bay-tennis-summer-camp',
      'fort-lauderdale-tennis-and-sports-summer-camp',
    ],
  },
  {
    tag: 'dance',
    slugs: [
      'dance-and-crafts-summer-camp-at-pinecrest-gardens',
      'miami-city-ballet-children-s-summer-dance',
      'miami-lakes-dance-soccer-summer-camp',
      'toddler-summer-camp-with-pinecrest-dance-project',
    ],
  },
  {
    tag: 'golf',
    slugs: [
      'club-kids-at-the-coral-gables-golf-country-club',
      'golf-academy-of-south-florida-half-day-summer-camp',
      'pembroke-pines-golf-school-summer-camp',
    ],
  },
  {
    tag: 'sailing',
    slugs: [
      'fort-lauderdale-sailing-summer-camp',
      'miami-youth-sailing-foundation-summer-camp',
    ],
  },
  {
    tag: 'basketball',
    slugs: ['coral-gables-basketball-summer-camp', 'pinecrest-basketball-summer-camp'],
  },
  {
    tag: 'soccer',
    slugs: ['miami-lakes-dance-soccer-summer-camp'],
  },
];

const SECTION_B_ADDS: Array<{ tag: string; slugs: string[] }> = [
  {
    tag: 'culinary',
    slugs: ['camp-carrollton', 'machane-miami', 'miami-country-day-school-summer-camp'],
  },
  {
    tag: 'sailing',
    slugs: ['camp-carrollton', 'shake-a-leg-miami-summer-camp'],
  },
  {
    tag: 'outdoor',
    slugs: [
      'camp-steamology-at-museum-of-discovery-and-science',
      'camp-tamarac',
      'o-b-johnson-park-summer-camp',
      'tidal-cove',
    ],
  },
  {
    tag: 'tennis',
    slugs: ['pembroke-pines-sports-specialty-camps'],
  },
];

type CampRow = {
  id: string;
  slug: string;
  name: string;
  categories: string[];
};

function projectMigrationFor(camp: CampRow): string[] {
  // 1. Phase 1 + Phase 3 via the lib (lowercase + synonym + folds)
  let out = normalizeCategories(camp.categories ?? []);
  // 2. Phase 2 — per-camp adds (Section A + revised Section B)
  for (const block of [...SECTION_A_ADDS, ...SECTION_B_ADDS]) {
    if (block.slugs.includes(camp.slug)) {
      const set = new Set(out);
      set.add(block.tag);
      out = Array.from(set).sort();
    }
  }
  return out;
}

function diff(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const a = new Set(before);
  const b = new Set(after);
  return {
    added: [...b].filter((x) => !a.has(x)).sort(),
    removed: [...a].filter((x) => !b.has(x)).sort(),
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      '[dry-run] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    );
    console.error('[dry-run] try: source .deploy-secrets/env.sh && pnpm exec tsx scripts/dry-run-canonical-categories.ts');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('camps')
    .select('id, slug, name, categories')
    .order('slug');
  if (error) {
    console.error('[dry-run] fetch failed:', error.message);
    process.exit(1);
  }

  const camps = (data ?? []) as CampRow[];
  console.log(`[dry-run] read ${camps.length} camps from prod\n`);

  // === Stat 1: camps with ANY change =====================================
  let changedCamps = 0;
  let emptied = 0;
  let legacyTagsTouched = 0;
  const diffs: Array<{
    slug: string;
    name: string;
    before: string[];
    after: string[];
    added: string[];
    removed: string[];
  }> = [];

  for (const camp of camps) {
    const before = (camp.categories ?? []).slice();
    const after = projectMigrationFor(camp);
    const beforeSig = JSON.stringify([...before].sort());
    const afterSig = JSON.stringify([...after].sort());
    if (beforeSig !== afterSig) {
      changedCamps += 1;
      const d = diff(before, after);
      diffs.push({ slug: camp.slug, name: camp.name, before, after, ...d });
    }
    if (after.length === 0 && before.length > 0) emptied += 1;
    // Count legacy tags: any cat in `before` that isn't in CANONICAL_CATEGORIES
    // OR is in DEPRECATED_TAGS, OR has a casing diff to its mapped form.
    for (const cat of before) {
      const mapped = LEGACY_TO_CANONICAL[cat];
      if (mapped !== undefined && mapped !== cat) {
        legacyTagsTouched += 1;
      } else if (DEPRECATED_TAGS.has(cat)) {
        legacyTagsTouched += 1;
      } else if (!CANONICAL_CATEGORIES.has(cat)) {
        // Unknown — would be lower()'d by Phase 1
        if (cat !== cat.toLowerCase()) legacyTagsTouched += 1;
      }
    }
  }

  // === Print summary =====================================================
  console.log('=================================================');
  console.log('  Migration 052 — Dry-Run Preview');
  console.log('=================================================');
  console.log(`  Total camps in prod:               ${camps.length}`);
  console.log(`  Camps with ANY change:             ${changedCamps}`);
  console.log(`  Camps that would be EMPTIED:       ${emptied}  (must be 0)`);
  console.log(`  Legacy tags normalized/folded:     ${legacyTagsTouched}`);
  console.log('=================================================\n');

  if (emptied > 0) {
    console.error(`[dry-run] FAIL — ${emptied} camps would lose ALL categories. Inspect above.`);
    process.exit(1);
  }

  // === Sample diffs: 10 across diverse buckets ===========================
  // Sort by amount of change (more interesting cases first).
  const sample = diffs
    .map((d) => ({ ...d, magnitude: d.added.length + d.removed.length }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10);

  console.log('Sample diffs (top 10 by magnitude of change):\n');
  for (const d of sample) {
    console.log(`  ${d.slug}`);
    console.log(`    name:    ${d.name}`);
    console.log(`    before:  ${JSON.stringify(d.before)}`);
    console.log(`    after:   ${JSON.stringify(d.after)}`);
    if (d.added.length) console.log(`    +added:  ${d.added.join(', ')}`);
    if (d.removed.length) console.log(`    -removed: ${d.removed.join(', ')}`);
    console.log();
  }

  console.log('Apply for real with: pnpm exec supabase db push --include-all');
}

main().catch((err) => {
  console.error('[dry-run] unhandled error:', err);
  process.exit(1);
});
