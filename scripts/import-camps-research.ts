#!/usr/bin/env tsx
/**
 * Import 96 researched Miami camps from
 * data/camps/miami-research-2026-04-23.json into the camps table.
 *
 * Rules (per spec, Phase 2.7 data drop):
 *  1. Upsert by slug. Same slug → keep created_at, update fields.
 *  2. Never overwrite a non-null existing value with a research null.
 *  3. Set verified=true, data_source='research-2026-04-23',
 *     last_verified_at=now() on every imported row.
 *  4. Price: dollars → cents (×100).
 *  5. Categories: validate; skip invalid values with console.warn.
 *  6. Derive city from address "..., <city>, FL <zip>".
 *  7. Sessions → JSONB as-is; also set next_session_start_date = min of
 *     session.start_date where session.type === 'summer'.
 *  8. out_of_primary_coverage = true for ZIPs outside Miami-Dade core
 *     (Hallandale Beach 33009, Tamarac 33321, Sunrise 33351).
 *  9. needs_review = true for Camp Matecumbe (hurricane recovery flag).
 * 10. Slug dedup with neighborhood tag on collision.
 * 11. Dry-run mode via --dry-run.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Source: .deploy-secrets/env.sh.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry-run');
const JSON_PATH = join(
  process.cwd(),
  'data',
  'camps',
  'miami-research-2026-04-23.json',
);
const DATA_SOURCE = 'research-2026-04-23';

// Known out-of-primary-coverage ZIPs (Miami-Dade core is roughly 33xxx,
// but these three are in Broward — spec says include them with flag).
const OUT_OF_PRIMARY_ZIPS = new Set(['33009', '33321', '33351']);

// Camp-Matecumbe flag — hurricane recovery per research note.
const NEEDS_REVIEW_NAMES = new Set(['Camp Matecumbe']);

// Source-of-truth allowlist. Combined with the canonical-vocabulary lib
// at `src/lib/camps/categories.ts` — research JSON tags must either be in
// this allowlist (legacy raw forms accepted from older datasets) OR map
// through `LEGACY_TO_CANONICAL` to a canonical category.
//
// Stage 2 (2026-04-27) note: the prior `CATEGORY_CANONICAL: { stem: 'STEM' }`
// map that uppercased `stem` on import was REMOVED — it was the source of
// the prod casing-duplicate bug. Future imports go through the lib's
// `normalizeCategories()` which is lowercase-only.
const VALID_CATEGORIES_LOWER = new Set([
  'sports',
  'soccer',
  'swim',
  'tennis',
  'basketball',
  'art',
  'arts',
  'theater',
  'music',
  'dance',
  'stem',
  'nature',
  'general',
  'summer',
  'winter_break',
  'spring_break',
  'short_break',
  'one_day',
  'indoor',
  'outdoor',
  'active',
  'animals',
  'water',
  'cultural',
  'academic',
  'fencing',
  'golf',
  'sailing',
  'maker',
  'religious',
  'preschool',
]);

type ResearchCamp = {
  name: string;
  operator_name?: string | null;
  description?: string | null;
  website_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  age_min?: number | null;
  age_max?: number | null;
  categories?: string[] | null;
  hours_core_start?: string | null;
  hours_core_end?: string | null;
  has_before_care?: boolean | null;
  before_care_start?: string | null;
  has_after_care?: boolean | null;
  after_care_end?: string | null;
  lunch_included?: boolean | null;
  price_min_per_week_usd?: number | null;
  price_max_per_week_usd?: number | null;
  price_notes?: string | null;
  sessions?: Array<{
    type?: string;
    start_date?: string;
    end_date?: string;
    [k: string]: unknown;
  }> | null;
  registration_url?: string | null;
  registration_deadline?: string | null;
  single_day_available?: boolean | null;
  breaks_covered?: string[] | null;
  scholarships_available?: boolean | null;
  special_needs_friendly?: boolean | null;
  accreditations?: string[] | null;
  licensing?: string | null;
  capacity?: number | null;
  verification?: {
    primary_source_url?: string | null;
    verified_fields?: string[] | null;
    unverified_fields?: string[] | null;
    research_notes?: string | null;
  };
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function cityFromAddress(addr: string | null | undefined): string | null {
  if (!addr) return null;
  // "1855 NE 135th Street, North Miami, FL 33181" → "North Miami"
  const m = addr.match(/,\s*([^,]+?),\s*FL\s*\d{5}/i);
  return m ? m[1].trim() : null;
}

function zipFromAddress(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const m = addr.match(/FL\s*(\d{5})/i);
  return m ? m[1] : null;
}

// Validate against the local allowlist, then route through the canonical
// lib so the output is fold-applied (animals→nature, water→swim+outdoor,
// etc.) and lowercase-only.
import {
  CANONICAL_CATEGORIES,
  LEGACY_TO_CANONICAL,
  applyFolds,
} from '@/lib/camps/categories';

function normalizeCategories(cats: string[] | null | undefined): {
  kept: string[];
  dropped: string[];
} {
  const dropped: string[] = [];
  const stage1: string[] = [];
  for (const raw of cats ?? []) {
    const trimmed = raw.trim();
    // Try the legacy synonym map first (handles STEM→stem, Art→arts,
    // History→cultural, etc.)
    const mapped = LEGACY_TO_CANONICAL[trimmed];
    if (mapped !== undefined) {
      stage1.push(mapped);
      continue;
    }
    // Then try a canonical match (lowercase + underscored whitespace).
    const lower = trimmed.toLowerCase().replace(/\s+/g, '_');
    if (CANONICAL_CATEGORIES.has(lower)) {
      stage1.push(lower);
      continue;
    }
    // Reject anything we don't recognize (R6 spirit — allowlist, not
    // blocklist). Legacy raw forms still in the allowlist for back-compat
    // with older research datasets:
    if (VALID_CATEGORIES_LOWER.has(lower)) {
      // Folds catch the deprecated tags (animals/water/active/etc.) below.
      stage1.push(lower);
      continue;
    }
    dropped.push(raw);
  }
  // Apply Q1 folds + dedup + sort via the lib.
  return { kept: applyFolds(stage1), dropped };
}

// camps.price_tier is NOT NULL in the schema. Derive from the per-week
// dollar range when it's available; fall back to '$$' (middle tier) when
// research gave no price at all.
function deriveTier(
  minUsd: number | null | undefined,
  maxUsd: number | null | undefined,
): '$' | '$$' | '$$$' {
  const usd = maxUsd ?? minUsd;
  if (usd == null) return '$$';
  if (usd < 250) return '$';
  if (usd <= 500) return '$$';
  return '$$$';
}

function nextSummerStart(
  sessions: ResearchCamp['sessions'],
): string | null {
  const summer = (sessions ?? [])
    .filter((s) => (s.type ?? '').toLowerCase() === 'summer')
    .map((s) => s.start_date)
    .filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (!summer.length) return null;
  summer.sort();
  return summer[0];
}

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — source .deploy-secrets/env.sh first.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ExistingRow = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
};

// Fuzzy name-match key: drop "Summer Camp"/"Summer"/"Camp" suffixes, collapse
// whitespace + punctuation. Helps match "Frost Science Summer Camp" (research)
// to existing "Frost Science Summer Camp" (stored but with slug frost-science-summer).
function nameKey(n: string): string {
  return n
    .toLowerCase()
    .replace(/\bsummer camp\b/g, '')
    .replace(/\bday camp\b/g, '')
    .replace(/\bcamp\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const raw = readFileSync(JSON_PATH, 'utf8');
  const research: ResearchCamp[] = JSON.parse(raw);
  console.log(`Loaded ${research.length} research entries.`);

  const db = supaAdmin();
  const { data: existingRows } = await db
    .from('camps')
    .select('*');
  const existingRowsArr = (existingRows ?? []) as ExistingRow[];
  const existingBySlug = new Map<string, ExistingRow>();
  const existingByNameKey = new Map<string, ExistingRow>();
  for (const row of existingRowsArr) {
    existingBySlug.set(row.slug, row);
    existingByNameKey.set(nameKey(row.name), row);
  }

  // Compute slugs with collision disambiguation.
  const slugCounts = new Map<string, number>();
  const slugs: string[] = [];
  for (const c of research) {
    let s = slugify(c.name);
    const existingCount = (slugCounts.get(s) ?? 0) + 1;
    if (existingCount > 1) {
      // Append neighborhood tag, or campus tag, or numeric suffix.
      const tag = slugify(c.neighborhood ?? 'alt') || `v${existingCount}`;
      s = `${s}-${tag}`;
    }
    slugCounts.set(s, (slugCounts.get(s) ?? 0) + 1);
    slugs.push(s);
  }

  const reports = {
    insert: 0,
    update: 0,
    preservedFields: 0,
    validationErrors: [] as string[],
    droppedCategories: [] as Array<{ camp: string; dropped: string[] }>,
    byNeighborhood: new Map<string, number>(),
    byCategory: new Map<string, number>(),
  };

  const inserts: Record<string, unknown>[] = [];
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];

  const skipped: string[] = [];
  for (let i = 0; i < research.length; i++) {
    const c = research[i];
    const slug = slugs[i];

    // camps.ages_min / ages_max are NOT NULL. Rather than invent fake ages
    // when the research couldn't confirm them (e.g., MOCA's art camp), skip
    // and log — these need manual review, not fabrication. Existing rows
    // with real ages are never touched by this path.
    if (c.age_min == null || c.age_max == null) {
      skipped.push(`${c.name} (missing age_min/age_max)`);
      continue;
    }

    const { kept: cats, dropped } = normalizeCategories(c.categories);
    if (dropped.length) {
      reports.droppedCategories.push({ camp: c.name, dropped });
    }

    // Build row fields. Null-safe.
    const city = cityFromAddress(c.address);
    const zip = zipFromAddress(c.address);
    const outOfPrimary = zip ? OUT_OF_PRIMARY_ZIPS.has(zip) : false;
    const needsReview = NEEDS_REVIEW_NAMES.has(c.name);
    const nextSumStart = nextSummerStart(c.sessions ?? null);

    const price_min_cents =
      c.price_min_per_week_usd != null
        ? Math.round(c.price_min_per_week_usd * 100)
        : null;
    const price_max_cents =
      c.price_max_per_week_usd != null
        ? Math.round(c.price_max_per_week_usd * 100)
        : null;

    const row: Record<string, unknown> = {
      slug,
      name: c.name,
      price_tier: deriveTier(c.price_min_per_week_usd, c.price_max_per_week_usd),
      operator_name: c.operator_name ?? null,
      description: c.description ?? null,
      website_url: c.website_url ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      neighborhood: c.neighborhood ?? null,
      city,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
      ages_min: c.age_min ?? null,
      ages_max: c.age_max ?? null,
      categories: cats,
      hours_start: c.hours_core_start ?? null,
      hours_end: c.hours_core_end ?? null,
      // before_care_offered + after_care_offered are NOT NULL in the schema;
      // coerce research nulls to false (default "no"). If a camp actually
      // does offer care, research-provided true will win.
      before_care_offered: c.has_before_care ?? false,
      before_care_start: c.before_care_start ?? null,
      after_care_offered: c.has_after_care ?? false,
      after_care_end: c.after_care_end ?? null,
      lunch_included: c.lunch_included ?? null,
      price_min_cents,
      price_max_cents,
      price_notes: c.price_notes ?? null,
      sessions: c.sessions ?? [],
      next_session_start_date: nextSumStart,
      registration_url: c.registration_url ?? null,
      registration_deadline: c.registration_deadline ?? null,
      single_day_available: c.single_day_available ?? null,
      breaks_covered: c.breaks_covered ?? [],
      scholarships_available: c.scholarships_available ?? null,
      special_needs_friendly: c.special_needs_friendly ?? null,
      accreditations: c.accreditations ?? [],
      licensing: c.licensing ?? null,
      capacity: c.capacity ?? null,
      out_of_primary_coverage: outOfPrimary,
      needs_review: needsReview,
      data_source: DATA_SOURCE,
      data_source_url: c.verification?.primary_source_url ?? null,
      data_source_notes: c.verification?.research_notes ?? null,
      verified_fields: c.verification?.verified_fields ?? [],
      missing_fields: c.verification?.unverified_fields ?? [],
      verified: true,
      last_verified_at: new Date().toISOString(),
    };

    if (c.neighborhood) {
      reports.byNeighborhood.set(
        c.neighborhood,
        (reports.byNeighborhood.get(c.neighborhood) ?? 0) + 1,
      );
    }
    for (const cat of cats) {
      reports.byCategory.set(cat, (reports.byCategory.get(cat) ?? 0) + 1);
    }

    // Match by slug first, then by fuzzy-name key (handles the "Frost Science
    // Summer" vs "Frost Science Summer Camp" slug divergence between the
    // existing seed and the research data).
    let exist = existingBySlug.get(slug);
    if (!exist) {
      const nk = nameKey(c.name);
      if (nk) exist = existingByNameKey.get(nk);
    }
    // Preserve the existing slug so we don't create a duplicate row with a
    // new slug pointing at the same identity.
    if (exist) row.slug = exist.slug as string;
    if (!exist) {
      inserts.push(row);
      reports.insert++;
    } else {
      // Never overwrite non-null existing values with research nulls.
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === 'slug') continue;
        const existingVal = (exist as Record<string, unknown>)[k];
        if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
          // research gave us nothing. If existing has data, preserve it.
          if (existingVal !== null && existingVal !== undefined) {
            reports.preservedFields++;
            continue;
          }
          // else: both null — write null (no-op but keeps contract)
          patch[k] = v;
          continue;
        }
        patch[k] = v;
      }
      // Always bump these metadata fields
      patch.data_source = DATA_SOURCE;
      patch.last_verified_at = new Date().toISOString();
      patch.verified = true;
      updates.push({ id: exist.id, patch });
      reports.update++;
    }
  }

  // Print report.
  console.log('\n=== Dry-run report ===');
  console.log(`Inserts planned:            ${reports.insert}`);
  console.log(`Updates planned:            ${reports.update}`);
  console.log(`Skipped (missing required fields): ${skipped.length}`);
  for (const s of skipped) console.log(`  - ${s}`);
  console.log(`Preserved fields (null from research, existing kept): ${reports.preservedFields}`);
  if (reports.validationErrors.length) {
    console.log(`Validation errors (${reports.validationErrors.length}):`);
    for (const e of reports.validationErrors) console.log('  -', e);
  }
  if (reports.droppedCategories.length) {
    console.log(`Dropped categories (${reports.droppedCategories.length} camps):`);
    for (const d of reports.droppedCategories.slice(0, 8)) {
      console.log(`  - ${d.camp}: ${d.dropped.join(', ')}`);
    }
    if (reports.droppedCategories.length > 8) {
      console.log(`  ... and ${reports.droppedCategories.length - 8} more`);
    }
  }
  console.log('By neighborhood:');
  for (const [k, v] of Array.from(reports.byNeighborhood.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.toString().padStart(3)}  ${k}`);
  }
  console.log('By category:');
  for (const [k, v] of Array.from(reports.byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.toString().padStart(3)}  ${k}`);
  }

  if (DRY) {
    console.log('\n--dry-run: no DB writes.');
    return;
  }

  console.log('\nApplying...');
  // Inserts in chunks of 25 for Supabase row limit friendliness
  const CHUNK = 25;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const chunk = inserts.slice(i, i + CHUNK);
    const { error } = await db.from('camps').insert(chunk);
    if (error) {
      console.error(`Insert chunk ${i / CHUNK} failed:`, error.message);
      throw error;
    }
    console.log(`  inserted chunk ${i / CHUNK + 1} of ${Math.ceil(inserts.length / CHUNK)}`);
  }
  for (const u of updates) {
    const { error } = await db.from('camps').update(u.patch).eq('id', u.id);
    if (error) {
      console.error(`Update ${u.id} failed:`, error.message);
      throw error;
    }
  }
  console.log('\nImport complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
