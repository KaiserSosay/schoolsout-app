#!/usr/bin/env tsx
/**
 * Single-purpose hours enrichment researcher.
 *
 * Picks the top 30 verified camps with NULL `hours_start` (proxy for
 * "we've never confirmed core hours"), fetches the camp's own website,
 * scans for evidence of:
 *   - hours_start  / hours_end           (core day)
 *   - before_care_offered + before_care_start
 *   - after_care_offered  + after_care_end
 *   - lunch_included                     (boolean)
 *
 * Writes findings — BEFORE / AFTER per camp, with the SOURCE URL line
 * that justified each value — to docs/camp-hours-enrichment-YYYY-MM-DD.md.
 *
 * **DOES NOT write to the database.** Per the Phase 2.7.1 enrichment
 * directive, every proposal is parked for human review. Confirmed rows
 * land in prod via supabase/migrations/023_camp_hours_enrichment.sql
 * (a series of UPDATE … WHERE slug = '…' statements).
 *
 * Same data-quality rules as scripts/enrich-camps.ts:
 *   - Source URL host must match the camp's own website host
 *   - Never overwrite a non-NULL value (script ignores rows where the
 *     target field is already set)
 *   - last_enriched_at = NOW() is set by the migration, not the script
 *
 * No new dependencies — regex on stripped HTML, same as enrich-camps.ts.
 * (cheerio would be marginally more accurate but pulls a heavy parser
 *  for a one-off script; if we keep doing these, upgrade then.)
 *
 * Usage:
 *   pnpm dlx tsx scripts/enrich-camp-hours.ts
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (source .deploy-secrets/env.sh first).
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const TODAY = new Date().toISOString().slice(0, 10);
const TARGET_COUNT = 30;

// Categories that show up most in the dataset — used by the importance
// score so general / sports / STEM camps rise to the top of the queue.
const POPULAR_CATEGORIES = new Set(['Sports', 'STEM', 'Art', 'Soccer', 'Nature']);

type CampRow = {
  id: string;
  slug: string;
  name: string;
  website_url: string | null;
  phone: string | null;
  price_min_cents: number | null;
  categories: string[] | null;
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean | null;
  before_care_start: string | null;
  after_care_offered: boolean | null;
  after_care_end: string | null;
  lunch_included: boolean | null;
  last_enriched_at: string | null;
};

type FieldKey =
  | 'hours_start'
  | 'hours_end'
  | 'before_care_offered'
  | 'before_care_start'
  | 'after_care_offered'
  | 'after_care_end'
  | 'lunch_included';

type Finding = {
  field: FieldKey;
  proposed: string | boolean;
  source: string; // URL the value came from
  evidence: string; // ~120-char snippet from the page that justifies the value
  sameDomain: boolean;
};

type EnrichmentRecord = {
  camp: CampRow;
  importance: number;
  hostHost: string | null;
  pages: { url: string; bytes: number }[];
  findings: Finding[];
  errors: string[];
};

// --- Regex ------------------------------------------------------------------

// "9:00 AM - 3:00 PM", "9am-3pm", "8:30am to 5pm". Convert to HH:MM:SS 24h.
const HOURS_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/g;

// Single time tokens for before/after care section parsing.
const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/g;

function to24h(h: string, m: string | undefined, period: string): string {
  let hh = parseInt(h, 10);
  const mm = m ? parseInt(m, 10) : 0;
  const p = period.toLowerCase();
  if (p === 'pm' && hh !== 12) hh += 12;
  if (p === 'am' && hh === 12) hh = 0;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
}

function hostnameOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function fetchWithRetry(url: string, attempts = 2): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent':
            'SchoolsOut-enrichment/0.2 (+https://schoolsout.net/how-we-verify)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return await res.text();
    } catch {
      // swallow; tried twice
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Slice a small window around `idx` so the report can quote evidence.
function snippet(text: string, idx: number, span = 140): string {
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + span);
  return text
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Field extractors -------------------------------------------------------

// Hours: a hit only counts if a CAMP keyword sits in the 80 chars BEFORE the
// time range. Without that gate, the regex happily eats museum hours, school
// district hours, contact-center hours, etc — confirmed in early dry-runs.
// Plausibility bonuses still inform ranking but never qualify a hit on their own.
const CAMP_HOUR_KEYWORDS = [
  'camp hours',
  'camp day',
  'camp runs',
  'camp program',
  'camp begins',
  'core hours',
  'core day',
  'drop-off',
  'drop off',
  'dropoff',
  'pick-up',
  'pick up',
  'pickup',
  'daily schedule',
  'session hours',
  'session runs',
  'each session',
];

// Negative anchors — if the same window contains any of these, reject. Catches
// the dominant false-positive class: school district hours, museum venue
// hours, office/contact hours bleeding into the regex window.
const NON_CAMP_NEAR = [
  'office hours',
  'contact us',
  'museum hours',
  'open hours',
  'gallery hours',
  'admission',
  'visitor hours',
  'school day',
  'elementary',
  'high school',
  'middle school',
  'monday through friday',
  'business hours',
];

function extractCoreHours(text: string): { start: string; end: string; idx: number } | null {
  const lower = text.toLowerCase();
  const matches: Array<{ start: string; end: string; idx: number; score: number }> = [];
  HOURS_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HOURS_RE.exec(text)) !== null) {
    const idx = m.index;
    const start = to24h(m[1], m[2], m[3]);
    const end = to24h(m[4], m[5], m[6]);
    if (start >= end) continue;
    if (start >= '17:00') continue; // late evening — not a camp day

    const before = lower.slice(Math.max(0, idx - 80), idx);
    const around = lower.slice(Math.max(0, idx - 80), idx + 80);

    // Hard reject: non-camp anchor in the same window.
    if (NON_CAMP_NEAR.some((kw) => around.includes(kw))) continue;

    // Hard gate: at least one camp keyword must precede the time range.
    const keyword = CAMP_HOUR_KEYWORDS.find((kw) => before.includes(kw));
    if (!keyword) continue;

    // Score is now a tie-breaker among already-qualified hits.
    let score = 2; // anchored
    if (start >= '08:00' && start <= '09:30') score += 1;
    if (end >= '14:30' && end <= '17:00') score += 1;
    matches.push({ start, end, idx, score });
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const best = matches[0]!;
  return { start: best.start, end: best.end, idx: best.idx };
}

function extractBeforeCare(
  text: string,
): { offered: true; start?: string; idx: number } | null {
  const lower = text.toLowerCase();
  const re = /(before[-\s]?care|early\s+drop[-\s]?off|early\s+arrival)/g;
  const m = re.exec(lower);
  if (!m) return null;
  const window = text.slice(Math.max(0, m.index - 20), m.index + 200);
  TIME_RE.lastIndex = 0;
  const t = TIME_RE.exec(window);
  if (t) {
    const time = to24h(t[1], t[2], t[3]);
    // Must be morning to count as before-care.
    if (time < '09:30') return { offered: true, start: time, idx: m.index };
  }
  return { offered: true, idx: m.index };
}

function extractAfterCare(
  text: string,
): { offered: true; end?: string; idx: number } | null {
  const lower = text.toLowerCase();
  const re = /(after[-\s]?care|extended\s+day|late\s+pick[-\s]?up|late\s+pickup)/g;
  const m = re.exec(lower);
  if (!m) return null;
  const window = text.slice(Math.max(0, m.index - 20), m.index + 200);
  TIME_RE.lastIndex = 0;
  let t: RegExpExecArray | null;
  let latest: string | null = null;
  while ((t = TIME_RE.exec(window)) !== null) {
    const time = to24h(t[1], t[2], t[3]);
    if (time >= '14:00' && (!latest || time > latest)) latest = time;
  }
  return latest
    ? { offered: true, end: latest, idx: m.index }
    : { offered: true, idx: m.index };
}

function extractLunch(text: string): { included: boolean; idx: number } | null {
  const lower = text.toLowerCase();
  const includedRe = /(lunch\s+(?:is\s+)?(?:included|provided)|hot\s+lunch|catered\s+lunch)/g;
  const byoRe = /(bring\s+(?:your\s+own|a)\s+lunch|byo\s+lunch|pack\s+(?:your\s+)?lunch)/g;
  const incl = includedRe.exec(lower);
  const byo = byoRe.exec(lower);
  if (incl && (!byo || incl.index < byo.index)) {
    return { included: true, idx: incl.index };
  }
  if (byo) return { included: false, idx: byo.index };
  return null;
}

// --- Per-camp pipeline ------------------------------------------------------

const CANDIDATE_PATHS = [
  '/',
  '/summer-camp',
  '/summer-camps',
  '/camps',
  '/camp',
  '/programs',
  '/program',
  '/faq',
  '/faqs',
  '/contact',
  '/contact-us',
  '/about',
];

async function enrichCamp(camp: CampRow, importance: number): Promise<EnrichmentRecord> {
  const record: EnrichmentRecord = {
    camp,
    importance,
    hostHost: hostnameOf(camp.website_url),
    pages: [],
    findings: [],
    errors: [],
  };
  if (!camp.website_url) {
    record.errors.push('no website_url on record; skipping fetch');
    return record;
  }

  const seen = new Set<string>();
  const buffer: { url: string; text: string }[] = [];
  for (const path of CANDIDATE_PATHS) {
    let url: string;
    try {
      url = new URL(path, camp.website_url).toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    const html = await fetchWithRetry(url);
    if (!html) continue;
    const text = stripHtml(html);
    record.pages.push({ url, bytes: text.length });
    buffer.push({ url, text });
    // Stop after we've banked a few hits — most camp sites pack everything
    // onto / or /summer-camp; pulling 12 pages is wasteful.
    if (buffer.length >= 5) break;
  }
  if (buffer.length === 0) {
    record.errors.push('all fetches failed');
    return record;
  }

  const sourceHost = record.hostHost ?? '';
  const sameDomain = (fromUrl: string) => hostnameOf(fromUrl) === sourceHost;

  // Hours — only propose if the field is currently NULL.
  if (!camp.hours_start || !camp.hours_end) {
    for (const { url, text } of buffer) {
      const hit = extractCoreHours(text);
      if (!hit) continue;
      if (!camp.hours_start) {
        record.findings.push({
          field: 'hours_start',
          proposed: hit.start,
          source: url,
          evidence: snippet(text, hit.idx),
          sameDomain: sameDomain(url),
        });
      }
      if (!camp.hours_end) {
        record.findings.push({
          field: 'hours_end',
          proposed: hit.end,
          source: url,
          evidence: snippet(text, hit.idx),
          sameDomain: sameDomain(url),
        });
      }
      break;
    }
  }

  // Before-care — propose only if current value is the default-false
  // (which we treat as "unconfirmed"). If a positive offer is found we
  // also propose the start time; otherwise just the boolean.
  if (camp.before_care_offered !== true) {
    for (const { url, text } of buffer) {
      const hit = extractBeforeCare(text);
      if (!hit) continue;
      record.findings.push({
        field: 'before_care_offered',
        proposed: true,
        source: url,
        evidence: snippet(text, hit.idx),
        sameDomain: sameDomain(url),
      });
      if (hit.start && !camp.before_care_start) {
        record.findings.push({
          field: 'before_care_start',
          proposed: hit.start,
          source: url,
          evidence: snippet(text, hit.idx),
          sameDomain: sameDomain(url),
        });
      }
      break;
    }
  }

  // After-care — same shape as before-care.
  if (camp.after_care_offered !== true) {
    for (const { url, text } of buffer) {
      const hit = extractAfterCare(text);
      if (!hit) continue;
      record.findings.push({
        field: 'after_care_offered',
        proposed: true,
        source: url,
        evidence: snippet(text, hit.idx),
        sameDomain: sameDomain(url),
      });
      if (hit.end && !camp.after_care_end) {
        record.findings.push({
          field: 'after_care_end',
          proposed: hit.end,
          source: url,
          evidence: snippet(text, hit.idx),
          sameDomain: sameDomain(url),
        });
      }
      break;
    }
  }

  // Lunch — propose either polarity. Skip if already set.
  if (camp.lunch_included === null) {
    for (const { url, text } of buffer) {
      const hit = extractLunch(text);
      if (!hit) continue;
      record.findings.push({
        field: 'lunch_included',
        proposed: hit.included,
        source: url,
        evidence: snippet(text, hit.idx),
        sameDomain: sameDomain(url),
      });
      break;
    }
  }

  return record;
}

// --- Markdown report --------------------------------------------------------

function fmtVal(v: string | boolean | null): string {
  if (v === null) return '_NULL_';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function writeReport(records: EnrichmentRecord[]): string {
  const outPath = join(process.cwd(), 'docs', `camp-hours-enrichment-${TODAY}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const lines: string[] = [];
  lines.push(`# Camp hours enrichment — ${TODAY}`);
  lines.push('');
  lines.push(
    `Script: \`scripts/enrich-camp-hours.ts\` — single-purpose pass that ` +
      `proposes \`hours_start\` / \`hours_end\` / \`before_care_*\` / ` +
      `\`after_care_*\` / \`lunch_included\` from each camp's own site.`,
  );
  lines.push('');
  lines.push(
    `**Read-only:** the script writes nothing to the database. Confirmed ` +
      `rows land in \`supabase/migrations/023_camp_hours_enrichment.sql\` ` +
      `as a series of \`UPDATE … WHERE slug = '…'\` statements.`,
  );
  lines.push('');
  const findingsByCamp = records.map((r) => r.findings.length);
  const totalFindings = findingsByCamp.reduce((a, b) => a + b, 0);
  const sameDomainHits = records
    .flatMap((r) => r.findings)
    .filter((f) => f.sameDomain).length;
  lines.push(`- **Camps researched:** ${records.length}`);
  lines.push(`- **Total findings:** ${totalFindings}`);
  lines.push(`- **Same-domain hits:** ${sameDomainHits} of ${totalFindings}`);
  lines.push(
    `- **Camps with at least one finding:** ` +
      `${findingsByCamp.filter((n) => n > 0).length} / ${records.length}`,
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const r of records) {
    const c = r.camp;
    lines.push(`## ${c.name}`);
    lines.push(
      `- slug: \`${c.slug}\`  |  importance: ${r.importance}  |  ` +
        `website: ${c.website_url ?? '—'}`,
    );
    lines.push(
      `- pages fetched: ` +
        (r.pages.length
          ? r.pages.map((p) => `[${p.bytes}b](${p.url})`).join(', ')
          : '_none_'),
    );
    lines.push('');
    lines.push('### Before');
    lines.push('| Field | Value |');
    lines.push('|---|---|');
    lines.push(`| hours_start | ${fmtVal(c.hours_start)} |`);
    lines.push(`| hours_end | ${fmtVal(c.hours_end)} |`);
    lines.push(`| before_care_offered | ${fmtVal(c.before_care_offered)} |`);
    lines.push(`| before_care_start | ${fmtVal(c.before_care_start)} |`);
    lines.push(`| after_care_offered | ${fmtVal(c.after_care_offered)} |`);
    lines.push(`| after_care_end | ${fmtVal(c.after_care_end)} |`);
    lines.push(`| lunch_included | ${fmtVal(c.lunch_included)} |`);
    lines.push('');
    if (r.errors.length) {
      lines.push('### Errors');
      for (const e of r.errors) lines.push(`- ${e}`);
      lines.push('');
    }
    if (r.findings.length === 0) {
      lines.push('_No proposed changes._');
      lines.push('');
      continue;
    }
    lines.push('### Proposed (after Rasheid review)');
    lines.push('| Field | Proposed | Source | Same-domain | Evidence |');
    lines.push('|---|---|---|---|---|');
    for (const f of r.findings) {
      const ev = f.evidence.replace(/\|/g, '\\|');
      lines.push(
        `| ${f.field} | ${fmtVal(f.proposed)} | ${f.source} | ` +
          `${f.sameDomain ? '✅' : '⚠ different host'} | …${ev}… |`,
      );
    }
    lines.push('');
    // Pre-write the SQL for this camp so Rasheid can paste straight into
    // the migration file after a thumbs-up.
    const same = r.findings.filter((f) => f.sameDomain);
    if (same.length) {
      lines.push('<details><summary>SQL skeleton (review before pasting)</summary>');
      lines.push('');
      lines.push('```sql');
      const sets = same.map((f) => {
        const value =
          typeof f.proposed === 'boolean'
            ? f.proposed
              ? 'true'
              : 'false'
            : `'${f.proposed}'`;
        return `  ${f.field} = ${value}`;
      });
      lines.push(`update public.camps set`);
      lines.push(sets.join(',\n') + ',');
      lines.push(`  last_enriched_at = now()`);
      lines.push(`where slug = '${c.slug}';`);
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }
  writeFileSync(outPath, lines.join('\n'));
  return outPath;
}

// --- DB access --------------------------------------------------------------

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — ' +
        'source .deploy-secrets/env.sh first.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Importance heuristic per the directive: verified=true (filtered in the
// query), has phone (operator we can reach), has price data (more useful to
// surface), and popular categories rise to the top.
function scoreImportance(c: CampRow): number {
  let s = 0;
  if (c.phone) s += 2;
  if (c.price_min_cents != null) s += 2;
  if (c.categories?.some((cat) => POPULAR_CATEGORIES.has(cat))) s += 3;
  if (c.last_enriched_at == null) s += 1;
  return s;
}

async function loadTargets(): Promise<CampRow[]> {
  const db = supaAdmin();
  const { data, error } = await db
    .from('camps')
    .select(
      'id, slug, name, website_url, phone, price_min_cents, categories, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, lunch_included, last_enriched_at',
    )
    .eq('verified', true)
    .is('hours_start', null);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CampRow[];
  return rows
    .filter((r) => Boolean(r.website_url))
    .map((r) => ({ row: r, score: scoreImportance(r) }))
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
    .slice(0, TARGET_COUNT)
    .map(({ row }) => row);
}

// --- Main -------------------------------------------------------------------

async function main() {
  const targets = await loadTargets();
  console.log(
    `Loaded ${targets.length} target camp(s) (verified=true, hours_start IS NULL).`,
  );
  const records: EnrichmentRecord[] = [];
  for (const t of targets) {
    process.stdout.write(`- ${t.name} (${t.slug}) `);
    const r = await enrichCamp(t, scoreImportance(t));
    records.push(r);
    const auto = r.findings.length;
    console.log(
      `[findings ${auto}${r.errors.length ? `, err ${r.errors.length}` : ''}]`,
    );
  }
  const outPath = writeReport(records);
  console.log(`\nReport: ${outPath}`);
  console.log('No DB writes performed. Hand the report to Rasheid for review.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
