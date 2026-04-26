#!/usr/bin/env tsx
/**
 * Import 316 Miami-Dade schools + 40 closures from
 *   data/schools/miami-schools-research-2026-04-24.{schools,closures}.json
 *
 * Closures arrive in three passes (per the plan):
 *   Pass A — direct closures keyed to non-district schools
 *   Pass B — the synthetic mdcps-district school's closures
 *   Pass C — fan-out: copy Pass B onto every is_mdcps=true school as
 *            derived_from_district=true rows
 *
 * Schools upsert by slug, falling back to fuzzy-name match against existing
 * seed rows (UUIDs 0000-0001 .. 0000-0010 from supabase/seed-schools-miami.sql).
 * Re-runs are idempotent: dedupe key for closures is (school_id, start_date,
 * name); existing rows are UPDATEd in place rather than re-inserted.
 *
 * Slug policy (R4 in docs/SHIPPING_RULES.md, codified 2026-04-26 after
 * the dry-run nearly clobbered TGP's prod URL): INSERTs use the research
 * slug; UPDATEs NEVER rewrite slug. URLs are promises to users — once a
 * row is in prod, its slug is immutable to this script.
 *
 * Run (default is dry-run; --apply is REQUIRED for any DB write):
 *   pnpm dlx tsx scripts/import-schools-research.ts
 *   pnpm dlx tsx scripts/import-schools-research.ts --show-updates
 *   pnpm dlx tsx scripts/import-schools-research.ts --apply
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (source
 * .deploy-secrets/env.sh first).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
// Default is dry-run unless --apply is passed. The old --dry-run flag is
// accepted as a no-op for back-compat with anyone who muscle-memories it.
const DRY = !APPLY;
const SHOW_UPDATES = process.argv.includes('--show-updates');
const DATA_DIR = join(process.cwd(), 'data', 'schools');
const SCHOOLS_PATH = join(DATA_DIR, 'miami-schools-research-2026-04-24.schools.json');
const CLOSURES_PATH = join(DATA_DIR, 'miami-schools-research-2026-04-24.closures.json');
const DATA_SOURCE = 'research-2026-04-24';

// Slug used by the synthetic district row in research.
const DISTRICT_SLUG = 'mdcps-district';

// Anchor private schools that should pin to the top of the gap-report admin
// view — Noah flagged these as the priority chase-ups (Phase 2.7+ plan
// Step 8). Stored as a constant here so the calendar gaps tab can import it.
export const ANCHOR_PRIVATE_SLUGS = [
  'gulliver-preparatory-school',
  'ransom-everglades-school',
  'cushman-school',
  'carrollton-school-of-the-sacred-heart',
  'belen-jesuit-preparatory-school',
  'miami-country-day-school',
  'westminster-christian-school',
  'basis-brickell',
  'the-growing-place-school',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResearchSchool = {
  name: string;
  short_name?: string | null;
  slug: string;
  type: string;
  grade_range_min?: string | null;
  grade_range_max?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  calendar_url?: string | null;
  district: string;
  is_mdcps?: boolean | null;
  district_calendar_slug?: string | null;
  religious_affiliation?: string | null;
  enrollment_approx?: number | null;
  verification?: {
    primary_source_url?: string | null;
    verified_fields?: string[] | null;
    unverified_fields?: string[] | null;
    calendar_status?: string | null;
    research_notes?: string | null;
  };
};

type ResearchClosure = {
  school_slug: string;
  school_year: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  day_count?: number | null;
  closed_for_students?: boolean | null;
  closed_for_staff?: boolean | null;
  is_early_release?: boolean | null;
  notes?: string | null;
  verification?: {
    source_url?: string | null;
    source_type?: string | null;
    confidence?: string | null;
  };
};

type ExistingSchool = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  district: string;
  state: string;
  type: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  calendar_status: string;
  calendar_source_url: string | null;
};

type ExistingClosure = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  source: string;
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// Match the GENERATED expression migration 018 used so we can recognize
// existing seed rows whose slugs were auto-derived from name.
export function generatedSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function nameKey(n: string): string {
  return n
    .toLowerCase()
    .replace(/\bschool\b/g, '')
    .replace(/\bacademy\b/g, '')
    .replace(/\bpreparatory\b/g, 'prep')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cityFromAddress(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const m = addr.match(/,\s*([^,]+?),\s*FL\s*\d{5}/i);
  return m ? m[1].trim() : null;
}

// Map research's calendar_status strings onto the schema enum.
//   verified + is_mdcps        → verified_multi_year (gets both years via fan-out)
//   verified + direct closures → verified_current
//   verified + no closures     → verified_current (private schools w/ partial dates)
//   pending_pdf_review         → needs_research
//   needs_pdf_review           → needs_research
//   not_available_online       → unavailable
export function mapCalendarStatus(
  raw: string | null | undefined,
  isMdcps: boolean,
): 'verified_multi_year' | 'verified_current' | 'needs_research' | 'unavailable' | 'ai_draft' {
  switch (raw) {
    case 'verified':
      return isMdcps ? 'verified_multi_year' : 'verified_current';
    case 'pending_pdf_review':
    case 'needs_pdf_review':
      return 'needs_research';
    case 'not_available_online':
      return 'unavailable';
    case 'ai_draft':
      return 'ai_draft';
    default:
      return 'needs_research';
  }
}

// Pick an emoji for a closure based on category + name. Mirrors the
// hand-curated set migration 012 used so the public UI looks consistent.
const NAME_EMOJI: Array<[RegExp, string]> = [
  [/labor day/i, '🛠️'],
  [/veterans/i, '🎖️'],
  [/thanksgiving/i, '🦃'],
  [/winter|christmas/i, '❄️'],
  [/martin luther king|mlk/i, '✊🏿'],
  [/presidents/i, '🎩'],
  [/spring/i, '🌸'],
  [/memorial day/i, '🇺🇸'],
  [/last day/i, '🎓'],
  [/first day/i, '🍎'],
  [/rosh hashanah|yom kippur|passover|hanukkah/i, '✡️'],
  [/good friday|easter/i, '✝️'],
  [/teacher|professional learning|planning/i, '📝'],
];
const CATEGORY_EMOJI: Record<string, string> = {
  first_day: '🍎',
  last_day: '🎓',
  federal_holiday: '🇺🇸',
  school_break: '🌴',
  teacher_workday: '📝',
  early_release: '⏰',
  other: '📅',
};
export function emojiForClosure(name: string, category: string): string {
  for (const [rx, em] of NAME_EMOJI) if (rx.test(name)) return em;
  return CATEGORY_EMOJI[category] ?? '📅';
}

// closures.status enum is ('ai_draft','verified','rejected'). Map confidence
// to status: high → verified, anything else → ai_draft.
export function statusFromConfidence(c: string | null | undefined): 'verified' | 'ai_draft' {
  return c === 'high' ? 'verified' : 'ai_draft';
}

// Special handling for The Growing Place School. Returns the override patch
// or null if the school isn't TGP.
export function growingPlaceOverride(slug: string): Record<string, unknown> | null {
  if (slug !== 'the-growing-place-school') return null;
  return {
    calendar_status: 'needs_research',
    data_source_notes:
      "(305) 446-0846 — Email admissions or call. Noah's school, highest priority for PDF chase-up.",
  };
}

// Early-release pattern set on every M-DCPS school. Comes from the synthetic
// district row's research_notes.
export const MDCPS_EARLY_RELEASE_PATTERN =
  'Grades 2-5 (elementary) and K-8 grades 2-8 dismiss 1 hour early every Wednesday';

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

function supaAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — source .deploy-secrets/env.sh first.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Build the patch by applying null-preservation: never overwrite a non-null
// existing value with a research null/empty.
export function buildPatch(
  row: Record<string, unknown>,
  exist: Record<string, unknown>,
  preservedKeys: { count: number; keys: string[] },
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'slug' || k === 'id') continue;
    const existingVal = exist[k];
    if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
      if (existingVal !== null && existingVal !== undefined) {
        preservedKeys.count++;
        preservedKeys.keys.push(k);
        continue;
      }
    }
    patch[k] = v;
  }
  return patch;
}

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

export function buildSchoolRow(
  s: ResearchSchool,
  now: string,
): Record<string, unknown> {
  const isMdcps = !!s.is_mdcps;
  const calStatus = mapCalendarStatus(
    s.verification?.calendar_status ?? null,
    isMdcps,
  );
  const city = cityFromAddress(s.address);
  return {
    slug: s.slug,
    name: s.name,
    short_name: s.short_name ?? null,
    type: s.type as string,
    district: s.district,
    city,
    state: 'FL',
    address: s.address ?? null,
    neighborhood: s.neighborhood ?? null,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    website: s.website ?? null,
    calendar_source_url: s.calendar_url ?? null,
    grade_range_min: s.grade_range_min ?? null,
    grade_range_max: s.grade_range_max ?? null,
    is_mdcps: isMdcps,
    district_calendar_slug: s.district_calendar_slug ?? null,
    religious_affiliation: s.religious_affiliation ?? null,
    enrollment_approx: s.enrollment_approx ?? null,
    early_release_pattern: isMdcps ? MDCPS_EARLY_RELEASE_PATTERN : null,
    calendar_status: calStatus,
    data_source: DATA_SOURCE,
    data_source_url: s.verification?.primary_source_url ?? null,
    data_source_notes: s.verification?.research_notes ?? null,
    verified_fields: s.verification?.verified_fields ?? [],
    last_verified_at: now,
  };
}

export function buildClosureRow(
  c: ResearchClosure,
  schoolId: string,
  derivedFromDistrict = false,
): Record<string, unknown> {
  const status = statusFromConfidence(c.verification?.confidence);
  const source = derivedFromDistrict
    ? 'district_calendar_fanout'
    : c.verification?.source_type ?? 'research';
  return {
    school_id: schoolId,
    name: c.name,
    start_date: c.start_date,
    end_date: c.end_date,
    emoji: emojiForClosure(c.name, c.category),
    status,
    source,
    school_year: c.school_year,
    category: c.category,
    day_count: c.day_count ?? null,
    closed_for_students: c.closed_for_students ?? true,
    closed_for_staff: c.closed_for_staff ?? null,
    is_early_release: c.is_early_release ?? false,
    notes: c.notes ?? null,
    source_url: c.verification?.source_url ?? null,
    source_type: c.verification?.source_type ?? null,
    confidence: c.verification?.confidence ?? null,
    derived_from_district: derivedFromDistrict,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type ImportReport = {
  schoolsInsert: number;
  schoolsUpdate: number;
  schoolsPreservedFields: number;
  // Count of UPDATE rows where the research slug differs from the prod
  // slug. Always logged but never acted on — see R4 (slugs are immutable).
  slugRewriteSkipped: number;
  schoolsByType: Map<string, number>;
  schoolsByStatus: Map<string, number>;
  schoolsByNeighborhood: Map<string, number>;
  closuresDirect: number;
  closuresDistrict: number;
  closuresFanout: number;
  closuresUpdated: number;
  closuresSkipped: number;
  validationErrors: string[];
};

async function main() {
  console.log(
    APPLY
      ? '\n*** --apply mode: this run WILL write to the database. ***\n'
      : '\nDry-run (default). No DB writes will be performed. Pass --apply to actually import.\n',
  );

  const schoolsRaw = JSON.parse(readFileSync(SCHOOLS_PATH, 'utf8')) as ResearchSchool[];
  const closuresRaw = JSON.parse(readFileSync(CLOSURES_PATH, 'utf8')) as ResearchClosure[];
  console.log(
    `Loaded ${schoolsRaw.length} schools + ${closuresRaw.length} closure entries.`,
  );

  const db = supaAdmin();
  const now = new Date().toISOString();

  // ---------------------- Pre-fetch existing state -------------------------
  const { data: existingSchoolsData, error: existingErr } = await db
    .from('schools')
    .select(
      'id, slug, name, city, district, state, type, phone, website, email, address, latitude, longitude, calendar_status, calendar_source_url',
    );
  if (existingErr) throw new Error(`failed to read schools: ${existingErr.message}`);
  const existingSchools = (existingSchoolsData ?? []) as ExistingSchool[];

  const bySlug = new Map<string, ExistingSchool>();
  const byNameKey = new Map<string, ExistingSchool>();
  for (const s of existingSchools) {
    if (s.slug) bySlug.set(s.slug, s);
    byNameKey.set(nameKey(s.name), s);
  }

  const report: ImportReport = {
    schoolsInsert: 0,
    schoolsUpdate: 0,
    schoolsPreservedFields: 0,
    slugRewriteSkipped: 0,
    schoolsByType: new Map(),
    schoolsByStatus: new Map(),
    schoolsByNeighborhood: new Map(),
    closuresDirect: 0,
    closuresDistrict: 0,
    closuresFanout: 0,
    closuresUpdated: 0,
    closuresSkipped: 0,
    validationErrors: [],
  };

  // ---------------------- Pass 1: schools upsert ---------------------------
  const inserts: Record<string, unknown>[] = [];
  type SchoolUpdate = {
    id: string;
    patch: Record<string, unknown>;
    existing: Record<string, unknown>;
    researchSlug: string;
    existingSlug: string | null;
    slugWouldHaveChanged: boolean;
    researchName: string;
  };
  const updates: SchoolUpdate[] = [];
  const preservedDetail: Record<string, number> = {};

  for (const s of schoolsRaw) {
    if (!s.slug || !s.name || !s.district) {
      report.validationErrors.push(`School missing required fields: ${s.name ?? '?'}`);
      continue;
    }
    const row = buildSchoolRow(s, now);

    // Apply Growing Place override (always, even on first insert).
    const tgp = growingPlaceOverride(s.slug);
    if (tgp) Object.assign(row, tgp);

    // Match: (1) by exact slug, (2) by name key, (3) by name key against the
    // research slug → existing-by-generated-slug fallback.
    let exist = bySlug.get(s.slug);
    if (!exist) exist = byNameKey.get(nameKey(s.name));
    if (!exist) exist = bySlug.get(generatedSlug(s.name));

    report.schoolsByType.set(
      s.type,
      (report.schoolsByType.get(s.type) ?? 0) + 1,
    );
    report.schoolsByStatus.set(
      row.calendar_status as string,
      (report.schoolsByStatus.get(row.calendar_status as string) ?? 0) + 1,
    );
    if (s.neighborhood) {
      report.schoolsByNeighborhood.set(
        s.neighborhood,
        (report.schoolsByNeighborhood.get(s.neighborhood) ?? 0) + 1,
      );
    }

    if (!exist) {
      inserts.push(row);
      report.schoolsInsert++;
    } else {
      const preserved = { count: 0, keys: [] as string[] };
      const patch = buildPatch(row, exist as unknown as Record<string, unknown>, preserved);
      // R4 / docs/SHIPPING_RULES.md (2026-04-26): UPDATEs NEVER rewrite slug.
      // URLs are promises to users — bookmarks, shared links, internal code
      // paths keyed on slug must not silently shift under them. INSERTs use
      // the research slug (above); UPDATEs leave the existing slug alone.
      // buildPatch already filters slug out of its output; no patch.slug
      // assignment lives here on purpose.
      report.schoolsPreservedFields += preserved.count;
      for (const k of preserved.keys) preservedDetail[k] = (preservedDetail[k] ?? 0) + 1;
      const existSlug = (exist as { slug?: string | null }).slug ?? null;
      const slugWouldHaveChanged =
        existSlug !== null && existSlug !== s.slug;
      updates.push({
        id: exist.id,
        patch,
        existing: exist as unknown as Record<string, unknown>,
        researchSlug: s.slug,
        existingSlug: existSlug,
        slugWouldHaveChanged,
        researchName: s.name,
      });
      report.schoolsUpdate++;
      if (slugWouldHaveChanged) report.slugRewriteSkipped++;
    }
  }

  // Print schools report.
  console.log('\n=== Schools ===');
  console.log(`  Insert:              ${report.schoolsInsert}`);
  console.log(`  Update:              ${report.schoolsUpdate}`);
  console.log(`  Preserved fields:    ${report.schoolsPreservedFields}`);
  console.log(
    `  Slug-rewrite skips:  ${report.slugRewriteSkipped} (R4 — slugs immutable on UPDATE)`,
  );
  console.log('  By type:');
  for (const [k, v] of [...report.schoolsByType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v.toString().padStart(4)}  ${k}`);
  }
  console.log('  By calendar_status:');
  for (const [k, v] of [...report.schoolsByStatus.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v.toString().padStart(4)}  ${k}`);
  }
  console.log('  Top 10 neighborhoods:');
  for (const [k, v] of [...report.schoolsByNeighborhood.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    console.log(`    ${v.toString().padStart(4)}  ${k}`);
  }
  if (report.validationErrors.length) {
    console.log(`  Validation errors (${report.validationErrors.length}):`);
    for (const e of report.validationErrors.slice(0, 10)) console.log('   -', e);
  }
  if (Object.keys(preservedDetail).length) {
    console.log('  Preserved-field breakdown:');
    for (const [k, v] of Object.entries(preservedDetail).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${v.toString().padStart(4)}  ${k}`);
    }
  }

  // --show-updates: per-row diff for every UPDATE candidate. Prints the
  // before/after for the fields most likely to overwrite human-curated
  // values (data_source, district, address, phone, neighborhood,
  // calendar_status). Slug is shown but flagged as preserved per R4.
  if (SHOW_UPDATES && updates.length > 0) {
    const DIFF_FIELDS = [
      'data_source',
      'district',
      'address',
      'phone',
      'neighborhood',
      'calendar_status',
    ] as const;
    console.log(`\n  --show-updates: per-row diff for ${updates.length} UPDATE candidates`);
    for (const u of updates) {
      const slugLine = u.slugWouldHaveChanged
        ? `slug: ${u.existingSlug} (research wanted "${u.researchSlug}" — SKIPPED per R4)`
        : `slug: ${u.existingSlug} (matches research)`;
      console.log(`\n  • ${u.researchName}`);
      console.log(`      ${slugLine}`);
      let changedCount = 0;
      for (const field of DIFF_FIELDS) {
        const oldVal = u.existing[field];
        const newVal = u.patch[field];
        if (newVal === undefined) continue; // patch skipped this field (preserved)
        const oldStr = oldVal === null || oldVal === undefined ? '∅' : String(oldVal);
        const newStr = newVal === null || newVal === undefined ? '∅' : String(newVal);
        if (oldStr === newStr) continue; // no actual change
        changedCount++;
        console.log(`      ${field}: ${oldStr} → ${newStr}`);
      }
      if (changedCount === 0) {
        console.log('      (no changes to inspected fields — pure preserve / metadata-only update)');
      }
    }
  }

  // ---------------------- Apply schools writes -----------------------------
  if (DRY) {
    console.log('\n--dry-run: planning closures with current DB state (no school writes).');
  } else {
    console.log('\nApplying school writes...');
    const CHUNK = 25;
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const chunk = inserts.slice(i, i + CHUNK);
      const { error } = await db.from('schools').insert(chunk);
      if (error) {
        console.error(`  insert chunk ${i / CHUNK} failed: ${error.message}`);
        throw error;
      }
    }
    for (const u of updates) {
      const { error } = await db.from('schools').update(u.patch).eq('id', u.id);
      if (error) {
        console.error(`  update ${u.id} failed: ${error.message}`);
        throw error;
      }
    }
  }

  // ---------------------- Build slug → id map ------------------------------
  // For dry-run, use the pre-fetch + pretend-inserts; for real run, re-fetch.
  let slugToId: Map<string, string>;
  if (DRY) {
    slugToId = new Map();
    for (const s of existingSchools) if (s.slug) slugToId.set(s.slug, s.id);
    // For inserts we don't have an id yet; we map by slug → '<pending>'.
    for (const r of inserts) slugToId.set(r.slug as string, '<pending-insert>');
    // For updates we know the id but the slug may have changed.
    for (const u of updates) {
      const newSlug = u.patch.slug as string | undefined;
      if (newSlug) slugToId.set(newSlug, u.id);
    }
  } else {
    const { data: refreshed, error } = await db.from('schools').select('id, slug, is_mdcps');
    if (error) throw new Error(`refresh failed: ${error.message}`);
    slugToId = new Map();
    for (const r of (refreshed ?? []) as Array<{
      id: string;
      slug: string | null;
      is_mdcps: boolean;
    }>) {
      if (r.slug) slugToId.set(r.slug, r.id);
    }
  }

  // ---------------------- Pass 2: closures ---------------------------------
  // Existing closures (post-school-write for real runs).
  const { data: existingClosuresData } = await db
    .from('closures')
    .select('id, school_id, name, start_date, end_date, status, source');
  const existingClosures = (existingClosuresData ?? []) as ExistingClosure[];
  const closureKey = (school_id: string, start_date: string, name: string) =>
    `${school_id}|${start_date}|${name}`;
  const existingClosureMap = new Map<string, ExistingClosure>();
  for (const c of existingClosures) {
    existingClosureMap.set(closureKey(c.school_id, c.start_date, c.name), c);
  }

  // Partition research closures.
  const districtClosures = closuresRaw.filter((c) => c.school_slug === DISTRICT_SLUG);
  const directClosures = closuresRaw.filter((c) => c.school_slug !== DISTRICT_SLUG);

  const closureInserts: Record<string, unknown>[] = [];
  const closureUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];

  // Pass A: direct (non-district) closures.
  for (const c of directClosures) {
    const schoolId = slugToId.get(c.school_slug);
    if (!schoolId || schoolId === '<pending-insert>') {
      report.closuresSkipped++;
      report.validationErrors.push(
        `Closure for unknown/uninserted school slug ${c.school_slug}: ${c.name} ${c.start_date}`,
      );
      continue;
    }
    const row = buildClosureRow(c, schoolId, false);
    const key = closureKey(schoolId, c.start_date, c.name);
    const exist = existingClosureMap.get(key);
    if (exist) {
      closureUpdates.push({ id: exist.id, patch: row });
      report.closuresUpdated++;
    } else {
      closureInserts.push(row);
      report.closuresDirect++;
    }
  }

  // Pass B: the synthetic district row's closures.
  const districtId = slugToId.get(DISTRICT_SLUG);
  if (!districtId) {
    throw new Error(
      `Could not resolve mdcps-district school id (slug=${DISTRICT_SLUG}). ` +
        'The synthetic district school must be in the import.',
    );
  }
  for (const c of districtClosures) {
    if (districtId === '<pending-insert>') {
      // Dry-run path: count it but skip resolution.
      report.closuresDistrict++;
      continue;
    }
    const row = buildClosureRow(c, districtId, false);
    const key = closureKey(districtId, c.start_date, c.name);
    const exist = existingClosureMap.get(key);
    if (exist) {
      closureUpdates.push({ id: exist.id, patch: row });
      report.closuresUpdated++;
    } else {
      closureInserts.push(row);
      report.closuresDistrict++;
    }
  }

  // Pass C: fan-out — copy district closures to every is_mdcps=true school.
  // Build the fan-out targets list: every research school that follows the
  // district calendar (district_calendar_slug='mdcps-district' AND
  // is_mdcps=true), excluding the synthetic district itself.
  const fanoutTargets: string[] = [];
  for (const s of schoolsRaw) {
    if (
      s.is_mdcps &&
      s.district_calendar_slug === DISTRICT_SLUG &&
      s.slug !== DISTRICT_SLUG
    ) {
      const schoolId = slugToId.get(s.slug);
      if (schoolId && schoolId !== '<pending-insert>') {
        fanoutTargets.push(schoolId);
      } else if (DRY) {
        // Dry-run: count it as a fan-out target even though the school row
        // hasn't been inserted yet. We use the slug as a stand-in id.
        fanoutTargets.push(`pending:${s.slug}`);
      }
    }
  }

  for (const targetId of fanoutTargets) {
    for (const c of districtClosures) {
      if (targetId.startsWith('pending:')) {
        // dry-run accounting only
        report.closuresFanout++;
        continue;
      }
      const row = buildClosureRow(c, targetId, true);
      const key = closureKey(targetId, c.start_date, c.name);
      const exist = existingClosureMap.get(key);
      if (exist) {
        // Don't overwrite a manual/verified closure with a fan-out row.
        if (exist.source === 'district_calendar_fanout') {
          closureUpdates.push({ id: exist.id, patch: row });
          report.closuresUpdated++;
        } else {
          report.closuresSkipped++;
        }
      } else {
        closureInserts.push(row);
        report.closuresFanout++;
      }
    }
  }

  console.log('\n=== Closures ===');
  console.log(`  Direct (non-district) inserts: ${report.closuresDirect}`);
  console.log(`  District inserts:              ${report.closuresDistrict}`);
  console.log(`  Fan-out inserts:               ${report.closuresFanout}`);
  console.log(`  Updates (existing, in-place):  ${report.closuresUpdated}`);
  console.log(`  Skipped (resolution issue):    ${report.closuresSkipped}`);
  console.log(`  Fan-out target schools:        ${fanoutTargets.length}`);

  if (DRY) {
    console.log('\n--dry-run: no DB writes performed.');
    return;
  }

  console.log('\nApplying closure writes...');
  const CHUNK = 100;
  for (let i = 0; i < closureInserts.length; i += CHUNK) {
    const chunk = closureInserts.slice(i, i + CHUNK);
    const { error } = await db.from('closures').insert(chunk);
    if (error) {
      console.error(`  closure insert chunk ${i / CHUNK} failed: ${error.message}`);
      throw error;
    }
  }
  for (const u of closureUpdates) {
    const { error } = await db.from('closures').update(u.patch).eq('id', u.id);
    if (error) {
      console.error(`  closure update ${u.id} failed: ${error.message}`);
      throw error;
    }
  }

  console.log('\nImport complete.');
}

// Skip main() when imported by tests.
const isDirect = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();
if (isDirect) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
