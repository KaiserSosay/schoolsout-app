#!/usr/bin/env tsx
/**
 * Phase 2.7 Goal 1: Camp enrichment researcher.
 *
 * Reads camps from prod with data_completeness < 1.0 (or NULL/missing fields
 * fall through the same test), fetches each camp's own website, tries to
 * extract phone / address / hours from known patterns. Writes a Markdown
 * BEFORE/AFTER report to docs/camp-enrichment-YYYY-MM-DD.md for human
 * review.
 *
 * **Auto-apply rule (Phase 2.7 Rasheid directive):** a finding is written
 * to the DB only when ALL of the following hold:
 *   (i) the source is the camp's own canonical website domain
 *   (ii) the field being written was previously NULL
 *   (iii) the field is in { phone, address, website_url, hours_start,
 *         hours_end }  (no price, no ages — those need human eyes)
 * Anything else is listed in the report and parked for Rasheid to confirm.
 *
 * The script is explicitly additive — it never overwrites an existing
 * non-NULL value. `last_enriched_at` is set on every row the script
 * touches so the admin can track staleness.
 *
 * Dependencies: none beyond Node 18+ built-in fetch. No HTML parser
 * library — we use targeted regex patterns against normalized HTML text.
 * This is LESS accurate than a proper parser but avoids a new paid/heavy
 * dependency for a one-off script. False negatives are fine (parked for
 * human review). False positives (autowriting wrong data) are the thing
 * we must not do — each regex is conservative.
 *
 * Usage:
 *   pnpm dlx tsx scripts/enrich-camps.ts              # dry-run, writes doc only
 *   pnpm dlx tsx scripts/enrich-camps.ts --apply      # also writes safe rows to DB
 *
 * Requires env: DB_PASSWORD, PROJECT_REF (source from .deploy-secrets/env.sh)
 * + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL for writes.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

type CampRow = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  website_url: string | null;
  hours_start: string | null;
  hours_end: string | null;
};

type Finding = {
  field: 'phone' | 'address' | 'website_url' | 'hours_start' | 'hours_end';
  value: string;
  source: string; // URL the value came from
  autoApplyEligible: boolean;
  note?: string;
};

type EnrichmentRecord = {
  camp: CampRow;
  hostHost: string | null;
  findings: Finding[];
  errors: string[];
};

const APPLY = process.argv.includes('--apply');
const TODAY = new Date().toISOString().slice(0, 10);

// --- Regex patterns (conservative) ------------------------------------------

// E.164-ish + US-formatted phone numbers. Require area code.
const PHONE_RE = /(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})(?!\d)/g;

// US street address pattern: number + words + (optional words) + state abbr +
// 5-digit zip. Conservative to minimize false positives from blog copy.
// Matches things like "1101 Biscayne Blvd, Miami, FL 33132".
const ADDR_RE =
  /(\d{1,5}[-\d]*\s+[A-Z][A-Za-z0-9.\s]{3,60}(?:Blvd|Boulevard|St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Way|Pl|Place|Pkwy|Parkway|Trail|Hwy|Highway|Terrace|Court|Ct)\.?,?\s*(?:[A-Z][A-Za-z.\s]{1,30},?\s*)?(?:FL|Florida),?\s*\d{5}(?:-\d{4})?)/g;

// Hours: "9:00 AM - 3:00 PM", "9am-3pm", "8:30am to 5pm". Convert to 24h.
const HOURS_RE =
  /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/g;

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
            'SchoolsOut-enrichment/0.1 (+https://schoolsout.net/how-we-verify)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return await res.text();
    } catch {
      // swallow
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

function firstMatch<T>(
  text: string,
  re: RegExp,
  extract: (m: RegExpExecArray) => T,
): T | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  return m ? extract(m) : null;
}

async function enrichCamp(camp: CampRow): Promise<EnrichmentRecord> {
  const record: EnrichmentRecord = {
    camp,
    hostHost: hostnameOf(camp.website_url),
    findings: [],
    errors: [],
  };
  if (!camp.website_url) {
    record.errors.push('no website_url on record; skipping fetch');
    return record;
  }

  // Fetch home + common contact pages
  const candidates = [
    camp.website_url,
    new URL('/contact', camp.website_url).toString(),
    new URL('/contact-us', camp.website_url).toString(),
    new URL('/about', camp.website_url).toString(),
  ];
  const seen = new Set<string>();
  const buffer: { url: string; text: string }[] = [];
  for (const url of candidates) {
    if (seen.has(url)) continue;
    seen.add(url);
    const html = await fetchWithRetry(url);
    if (!html) continue;
    buffer.push({ url, text: stripHtml(html) });
  }
  if (buffer.length === 0) {
    record.errors.push('all fetches failed');
    return record;
  }

  const sourceHost = record.hostHost ?? '';
  const sameDomain = (fromUrl: string) =>
    hostnameOf(fromUrl) === sourceHost;

  // Phone
  if (!camp.phone) {
    for (const { url, text } of buffer) {
      const found = firstMatch(text, PHONE_RE, (m) =>
        `(${m[1]}) ${m[2]}-${m[3]}`,
      );
      if (found) {
        record.findings.push({
          field: 'phone',
          value: found,
          source: url,
          autoApplyEligible: sameDomain(url),
        });
        break;
      }
    }
  }

  // Address
  if (!camp.address) {
    for (const { url, text } of buffer) {
      const found = firstMatch(text, ADDR_RE, (m) => m[1].replace(/\s+/g, ' ').trim());
      if (found) {
        record.findings.push({
          field: 'address',
          value: found,
          source: url,
          autoApplyEligible: sameDomain(url),
        });
        break;
      }
    }
  }

  // Hours — intentionally NEVER auto-apply.
  //
  // Regex picks up the first HH:MM-HH:MM range on the page, which in
  // practice is the VENUE's open hours (e.g. museum 10am-6pm), not the
  // CAMP's session hours (typically 9am-3pm). Spot check against Frost
  // Science and Deering Estate both confirmed this: the first match is
  // museum/estate hours, not camp hours. Rather than add more fragile
  // heuristics, hours findings are always parked for human review.
  if (!camp.hours_start || !camp.hours_end) {
    for (const { url, text } of buffer) {
      const found = firstMatch(text, HOURS_RE, (m) => ({
        start: to24h(m[1], m[2], m[3]),
        end: to24h(m[4], m[5], m[6]),
      }));
      if (found) {
        if (!camp.hours_start) {
          record.findings.push({
            field: 'hours_start',
            value: found.start,
            source: url,
            autoApplyEligible: false,
            note: 'parked — regex tends to match venue hours, not camp session hours',
          });
        }
        if (!camp.hours_end) {
          record.findings.push({
            field: 'hours_end',
            value: found.end,
            source: url,
            autoApplyEligible: false,
            note: 'parked — regex tends to match venue hours, not camp session hours',
          });
        }
        break;
      }
    }
  }

  return record;
}

// --- Markdown report ---------------------------------------------------------

function writeReport(records: EnrichmentRecord[]): string {
  const outPath = join(
    process.cwd(),
    'docs',
    `camp-enrichment-${TODAY}.md`,
  );
  mkdirSync(dirname(outPath), { recursive: true });
  const lines: string[] = [];
  lines.push(`# Camp enrichment — ${TODAY}`);
  lines.push('');
  lines.push(
    `Script: \`scripts/enrich-camps.ts\` — fetches each camp's own website, `
      + `runs conservative regex against visible text, lists any finds.`,
  );
  lines.push('');
  lines.push(
    `Auto-apply policy (Rasheid, Phase 2.7 Goal 1): findings are written to prod `
      + `only when (i) source = camp's own domain, (ii) field was NULL, (iii) `
      + `field ∈ { phone, address, website_url, hours_start, hours_end }.`,
  );
  lines.push('');
  const autoCount = records
    .flatMap((r) => r.findings)
    .filter((f) => f.autoApplyEligible).length;
  const parkedCount = records
    .flatMap((r) => r.findings)
    .filter((f) => !f.autoApplyEligible).length;
  lines.push(`- **Camps processed:** ${records.length}`);
  lines.push(`- **Auto-applied findings:** ${autoCount}`);
  lines.push(`- **Parked for human review:** ${parkedCount}`);
  lines.push(
    `- **Apply mode:** ${APPLY ? '`--apply`' : 'dry-run (no DB writes)'}`,
  );
  lines.push('');

  for (const r of records) {
    lines.push(`## ${r.camp.name}`);
    lines.push(
      `- slug: \`${r.camp.slug}\`  |  website: ${r.camp.website_url ?? '—'}`,
    );
    lines.push('');
    lines.push('### Before');
    lines.push(`| Field | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| phone | ${r.camp.phone ?? '_NULL_'} |`);
    lines.push(`| address | ${r.camp.address ?? '_NULL_'} |`);
    lines.push(`| hours_start | ${r.camp.hours_start ?? '_NULL_'} |`);
    lines.push(`| hours_end | ${r.camp.hours_end ?? '_NULL_'} |`);
    lines.push('');
    if (r.errors.length) {
      lines.push('### Errors');
      for (const e of r.errors) lines.push(`- ${e}`);
      lines.push('');
    }
    if (r.findings.length === 0) {
      lines.push('_No findings._');
      lines.push('');
      continue;
    }
    lines.push('### Findings');
    lines.push(`| Field | Proposed value | Source | Auto-apply |`);
    lines.push(`|---|---|---|---|`);
    for (const f of r.findings) {
      lines.push(
        `| ${f.field} | ${f.value} | ${f.source} | ${f.autoApplyEligible ? '✅ yes' : '⏸ parked'} |`,
      );
    }
    lines.push('');
  }
  writeFileSync(outPath, lines.join('\n'));
  return outPath;
}

// --- DB access + apply -------------------------------------------------------

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

async function loadTargets(): Promise<CampRow[]> {
  const db = supaAdmin();
  const { data, error } = await db
    .from('camps')
    .select('id, slug, name, phone, address, website_url, hours_start, hours_end')
    .eq('verified', true)
    .or('phone.is.null,address.is.null,hours_start.is.null,hours_end.is.null');
  if (error) throw new Error(error.message);
  return (data ?? []) as CampRow[];
}

async function applyFindings(records: EnrichmentRecord[]) {
  const db = supaAdmin();
  for (const r of records) {
    const safe = r.findings.filter((f) => f.autoApplyEligible);
    if (safe.length === 0) continue;
    const patch: Record<string, string> = {};
    for (const f of safe) patch[f.field] = f.value;
    patch.last_enriched_at = new Date().toISOString();
    const { error } = await db.from('camps').update(patch).eq('id', r.camp.id);
    if (error) {
      r.errors.push(`apply failed: ${error.message}`);
    }
  }
}

// --- Main --------------------------------------------------------------------

async function main() {
  const targets = await loadTargets();
  console.log(`Found ${targets.length} camps with missing data.`);
  const records: EnrichmentRecord[] = [];
  for (const t of targets) {
    process.stdout.write(`- ${t.name} `);
    const r = await enrichCamp(t);
    records.push(r);
    const auto = r.findings.filter((f) => f.autoApplyEligible).length;
    const parked = r.findings.filter((f) => !f.autoApplyEligible).length;
    console.log(`[auto ${auto}, parked ${parked}${r.errors.length ? `, err ${r.errors.length}` : ''}]`);
  }
  if (APPLY) {
    await applyFindings(records);
    console.log('Applied safe findings.');
  }
  const outPath = writeReport(records);
  console.log(`\nReport: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
