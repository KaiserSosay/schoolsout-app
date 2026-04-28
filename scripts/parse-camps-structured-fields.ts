#!/usr/bin/env tsx
// Phase B prep — heuristic extractor that proposes structured-field
// values for every camp in the research JSON + the 3 hand-curated
// launch partners (305 Mini Chefs, Wise Choice, TGP). Output is a
// markdown doc, NOT SQL — Rasheid reviews and applies field-by-field
// in the morning.
//
// This script:
//   1. Reads data/camps/miami-research-2026-04-23.json (96 camps)
//   2. Synthesizes structured fields from the existing JSON columns
//      (price_min_per_week_usd, sessions[], has_before_care, etc.)
//   3. Adds heuristic regex passes against `description` for tagline,
//      activities, what_to_bring, lunch_policy, extended_care_policy
//   4. Tags each camp's confidence per field + overall
//   5. Emits docs/plans/camp-structured-fields-proposal-2026-04-27.md
//
// NOT a database writer. No UPDATE statements. No LLM calls.
//
// Run: pnpm exec tsx scripts/parse-camps-structured-fields.ts

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type ResearchSession = {
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  type?: string | null;
};

type ResearchCamp = {
  name: string;
  operator_name?: string | null;
  description: string | null;
  website_url?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  categories?: string[];
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
  sessions?: ResearchSession[] | null;
  registration_url?: string | null;
  registration_deadline?: string | null;
};

type Confidence = 'high' | 'medium' | 'low' | 'none';

type Proposal = {
  slug: string;
  name: string;
  source: 'research-json' | 'manual-curated';
  description_excerpt: string;
  tagline: { value: string | null; confidence: Confidence };
  sessions: { value: unknown[]; confidence: Confidence };
  pricing_tiers: { value: unknown[]; confidence: Confidence };
  activities: { value: string[]; confidence: Confidence };
  fees: { value: unknown[]; confidence: Confidence };
  enrollment_window: { value: unknown | null; confidence: Confidence };
  what_to_bring: { value: string[]; confidence: Confidence };
  lunch_policy: { value: string | null; confidence: Confidence };
  extended_care_policy: { value: string | null; confidence: Confidence };
  overall_confidence: Confidence;
  notes: string[];
};

// ---------- Slug helper (mirrors scripts/import-camps-research.ts) ----------
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------- Heuristic extractors ----------
function extractTagline(description: string | null, name: string): string | null {
  if (!description) return null;
  // First sentence — split on the first period followed by space + capital,
  // or the first newline. Cap at 160 chars.
  const trimmed = description.trim();
  if (trimmed.length === 0) return null;
  const firstSentenceMatch = trimmed.match(/^([^\n]{20,180}?[.!?])(?:\s|$)/);
  if (firstSentenceMatch) {
    const tag = firstSentenceMatch[1].trim();
    // If it just repeats the camp name, skip.
    if (tag.toLowerCase() === name.toLowerCase()) return null;
    return tag;
  }
  // Fallback: first 140 chars + ellipsis if longer.
  return trimmed.length > 140 ? trimmed.slice(0, 140).trim() + '…' : trimmed;
}

const ACTIVITY_KEYWORDS = [
  'arts & crafts', 'arts and crafts', 'arts',
  'sports', 'soccer', 'tennis', 'basketball', 'football', 'volleyball',
  'baseball', 'sailing', 'paddleboarding', 'surfing', 'rowing', 'kayaking',
  'swim', 'swimming', 'water play', 'water games',
  'STEM', 'science', 'lab', 'robotics', 'coding', 'engineering',
  'music', 'dance', 'theater', 'drama', 'singing',
  'cooking', 'culinary', 'baking',
  'nature', 'ecology', 'gardening', 'environmental',
  'field trips', 'in-house field trips', 'excursions',
  'chess', 'fitness', 'yoga', 'martial arts',
  'storytelling', 'reading', 'writing',
  'animals', 'zoo', 'aquarium', 'planetarium',
  'birthday parties', 'parties',
];

function extractActivities(description: string | null): string[] {
  if (!description) return [];
  const lower = description.toLowerCase();
  const found = new Set<string>();
  for (const kw of ACTIVITY_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      // Normalize: "arts & crafts" / "arts and crafts" → "Arts & Crafts"
      const display = kw
        .split(' ')
        .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
        .replace(/\bAnd\b/g, '&');
      found.add(display);
    }
  }
  return Array.from(found).slice(0, 8); // Cap at 8.
}

function extractWhatToBring(description: string | null): string[] {
  if (!description) return [];
  const items = new Set<string>();
  const patterns = [
    /\b(?:bring|send) (?:a |your |their )?([a-z][a-z\s]{2,30}?)(?:\.|,|;|\)|\b(?:from|for|to|each|every|daily)\b)/gi,
    /\bsupplies?:?\s*([^.\n]{5,80})/gi,
    /\b(?:pack|wear)\s+(?:a |your |their )?([a-z][a-z\s]{2,30}?)(?:\.|,|;|\)|\b(?:for|to|each|every|daily)\b)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(description)) !== null) {
      const item = m[1].trim().toLowerCase();
      if (item.length < 3 || item.length > 30) continue;
      // Filter generic words.
      if (/^(this|that|these|those|the|a|an|some|any)$/i.test(item)) continue;
      items.add(item);
    }
  }
  return Array.from(items).slice(0, 6);
}

function extractLunchPolicy(
  description: string | null,
  lunch_included: boolean | null | undefined,
): string | null {
  if (lunch_included === true) return 'Lunch provided';
  if (lunch_included === false && description) {
    const m = description.match(/\b(lunch[^.]*\.)/i);
    if (m) return m[1].trim();
    return 'Lunch from home';
  }
  if (description) {
    const m = description.match(/\b(lunch[^.]{5,100}\.)/i);
    if (m) return m[1].trim();
  }
  return null;
}

function extractExtendedCarePolicy(camp: ResearchCamp): string | null {
  const parts: string[] = [];
  if (camp.has_before_care === true) {
    const start = camp.before_care_start ? ` from ${camp.before_care_start}` : '';
    parts.push(`Before-care${start}`);
  } else if (camp.has_before_care === false) {
    parts.push('No before-care');
  }
  if (camp.has_after_care === true) {
    const end = camp.after_care_end ? ` until ${camp.after_care_end}` : '';
    parts.push(`After-care${end}`);
  } else if (camp.has_after_care === false) {
    parts.push('No after-care');
  }
  if (parts.length === 0 && camp.description) {
    if (/before[\s-]?care|aftercare|after[\s-]?care/i.test(camp.description)) {
      const m = camp.description.match(
        /([^.\n]{0,80}(?:before[\s-]?care|after[\s-]?care|aftercare)[^.\n]{0,100}\.)/i,
      );
      if (m) return m[1].trim();
    }
    return null;
  }
  return parts.length ? parts.join('; ') : null;
}

function buildSessions(camp: ResearchCamp): unknown[] {
  if (!camp.sessions || camp.sessions.length === 0) return [];
  return camp.sessions
    .filter((s) => s && (s.name || s.start_date || s.end_date))
    .map((s) => ({
      label: s.name ?? null,
      start_date: s.start_date ?? null,
      end_date: s.end_date ?? null,
      weekly_themes: [],
      notes: null,
    }));
}

function buildPricingTiers(camp: ResearchCamp): unknown[] {
  const min = camp.price_min_per_week_usd;
  const max = camp.price_max_per_week_usd;
  if (min == null && max == null) return [];
  // Single tier with a weekly band — admin can split into half/full
  // day later if applicable.
  return [
    {
      label: 'Weekly',
      hours: null,
      session_price_cents: null,
      both_sessions_price_cents: null,
      weekly_price_cents: max != null ? max * 100 : (min != null ? min * 100 : null),
      notes: camp.price_notes ?? null,
    },
  ];
}

function buildEnrollmentWindow(camp: ResearchCamp): unknown | null {
  if (!camp.registration_deadline) return null;
  return {
    opens_at: null,
    closes_at: camp.registration_deadline,
    status: 'open',
  };
}

// ---------- Per-camp scorer ----------
function scoreConfidence(p: Proposal): Confidence {
  // Tagline + activities are easy; pricing + sessions vary.
  const filledFields = [
    p.tagline.value,
    p.sessions.value.length > 0,
    p.pricing_tiers.value.length > 0,
    p.activities.value.length > 0,
    p.lunch_policy.value,
    p.extended_care_policy.value,
  ].filter(Boolean).length;
  if (filledFields >= 5) return 'high';
  if (filledFields >= 3) return 'medium';
  if (filledFields >= 1) return 'low';
  return 'none';
}

// ---------- Manual proposals for the 3 rich launch partners ----------
const MANUAL_PROPOSALS: Proposal[] = [
  {
    slug: 'the-growing-place-summer-camp',
    name: 'The Growing Place Summer Camp 2026',
    source: 'manual-curated',
    description_excerpt:
      "Stomp, chomp, and ROAR your way into a dino-mite summer adventure!",
    tagline: {
      value: "Stomp, chomp, and ROAR your way into a dino-mite summer.",
      confidence: 'high',
    },
    sessions: {
      value: [
        {
          label: 'Session One',
          start_date: '2026-06-15',
          end_date: '2026-07-02',
          weekly_themes: [
            'How Do Dinosaurs Play with Their Friends?',
            'How Do Dinosaurs Say I Love You?',
            'How Do Dinosaurs Choose Their Pets?',
          ],
          notes: 'No camp June 19 + July 3',
        },
        {
          label: 'Session Two',
          start_date: '2026-07-06',
          end_date: '2026-07-24',
          weekly_themes: [
            'How Do Dinosaurs Say Happy Birthday?',
            'How Do Dinosaurs Eat Their Food?',
            'How Do Dinosaurs Say Good Night?',
          ],
          notes: null,
        },
      ],
      confidence: 'high',
    },
    pricing_tiers: {
      value: [
        {
          label: 'Half-day',
          hours: '9:00 AM – 12:30 PM',
          session_price_cents: 70000,
          both_sessions_price_cents: 130000,
          weekly_price_cents: 28500,
          notes: null,
        },
        {
          label: 'Full-day',
          hours: '9:00 AM – 3:00 PM',
          session_price_cents: 80000,
          both_sessions_price_cents: 150000,
          weekly_price_cents: 31500,
          notes: null,
        },
      ],
      confidence: 'high',
    },
    activities: {
      value: [
        'Arts & Crafts',
        'Cooking',
        'STEM Lab',
        'Music & Movement',
        'Water Play',
        'In-house Field Trips',
      ],
      confidence: 'high',
    },
    fees: {
      value: [
        {
          label: 'Registration fee',
          amount_cents: 15000,
          refundable: false,
          notes: null,
        },
        {
          label: 'Security fee',
          amount_cents: 15000,
          refundable: false,
          notes: null,
        },
        {
          label: 'Camp tuition deposit',
          amount_cents: null,
          refundable: false,
          notes: '50% of tuition, non-transferable',
        },
      ],
      confidence: 'high',
    },
    enrollment_window: {
      value: {
        opens_at: '2026-04-02T15:00:00Z',
        closes_at: null,
        status: 'until_full',
      },
      confidence: 'high',
    },
    what_to_bring: {
      value: ['lunch (or order via Our Lunches)', 'water bottle', 'swim clothes'],
      confidence: 'medium',
    },
    lunch_policy: {
      value: 'Lunch from home or order via Our Lunches. Pizza Friday every week. Morning snack included.',
      confidence: 'high',
    },
    extended_care_policy: {
      value: 'Early Morning Care 8:00–8:45 AM, $40/week (pre-registration required, no drop-ins).',
      confidence: 'high',
    },
    overall_confidence: 'high',
    notes: [
      'Source: TGP 2026 flyer, transcribed in migration 053.',
      'Methodist-affiliated venue (First United Methodist Church of Coral Gables).',
      'DCF License C11MD0470.',
    ],
  },
  {
    slug: '305-mini-chefs',
    name: '305 Mini Chefs',
    source: 'manual-curated',
    description_excerpt:
      'Kids cooking classes, camps, and after-school programs teaching culinary skills across Miami-Dade County.',
    tagline: {
      value: 'Mobile culinary education across Miami-Dade — savor the flavor of 305.',
      confidence: 'medium',
    },
    sessions: { value: [], confidence: 'none' },
    pricing_tiers: {
      value: [],
      confidence: 'none',
    },
    activities: {
      value: ['Cooking', 'Culinary classes', 'Birthday parties'],
      confidence: 'high',
    },
    fees: { value: [], confidence: 'none' },
    enrollment_window: { value: null, confidence: 'none' },
    what_to_bring: { value: [], confidence: 'none' },
    lunch_policy: { value: null, confidence: 'none' },
    extended_care_policy: { value: null, confidence: 'none' },
    overall_confidence: 'low',
    notes: [
      '2026 summer-camp pricing not published online — call (786) 509-7509 to confirm.',
      'Mobile program — operates at George Washington Carver Elementary, I-Prep Academy, and partner schools.',
      'Sessions / fees / extended-care all NULL until operator publishes 2026 schedule.',
    ],
  },
  {
    slug: 'wise-choice-summer-camp',
    name: 'Wise Choice Summer Camp',
    source: 'manual-curated',
    description_excerpt:
      "Miami's trusted summer camp with 22+ years of experience at university campuses including UM and FIU.",
    tagline: {
      value: '22+ years across 5 Miami campuses — swimming, field trips, electives.',
      confidence: 'high',
    },
    sessions: {
      value: [{ label: 'Summer 2026', start_date: null, end_date: null, weekly_themes: [], notes: null }],
      confidence: 'low',
    },
    pricing_tiers: {
      value: [],
      confidence: 'none',
    },
    activities: {
      value: ['Swimming', 'Field Trips', 'Art', 'Chess', 'Dance', 'Fitness', 'Music', 'STEM', 'Outdoor Sports'],
      confidence: 'high',
    },
    fees: {
      value: [
        { label: 'Registration fee', amount_cents: 7900, refundable: false, notes: null },
        { label: 'Weekly deposit', amount_cents: 10000, refundable: true, notes: 'Applied to tuition' },
      ],
      confidence: 'high',
    },
    enrollment_window: { value: null, confidence: 'none' },
    what_to_bring: { value: [], confidence: 'none' },
    lunch_policy: {
      value: 'Lunch optional via Our Lunches app, or send from home. Snacks $1-$2 available at camp.',
      confidence: 'high',
    },
    extended_care_policy: { value: null, confidence: 'none' },
    overall_confidence: 'medium',
    notes: [
      '5 locations (UM Hillel, FIU, Albizu, BridgePrep, Keys Gate Charter) — multi-row split deferred.',
      '4-year-olds accepted if turning 5 before August.',
      'Per-week pricing not in description — pricing_tiers left empty.',
    ],
  },
];

// ---------- Main ----------
function processResearchCamp(c: ResearchCamp): Proposal {
  const slug = toSlug(c.name);
  const description = c.description ?? '';
  const sessionsValue = buildSessions(c);
  const pricingValue = buildPricingTiers(c);
  const activitiesValue = extractActivities(description);
  const enrollmentValue = buildEnrollmentWindow(c);
  const lunchValue = extractLunchPolicy(description, c.lunch_included ?? null);
  const extendedCareValue = extractExtendedCarePolicy(c);
  const taglineValue = extractTagline(description, c.name);
  const whatToBringValue = extractWhatToBring(description);

  const p: Proposal = {
    slug,
    name: c.name,
    source: 'research-json',
    description_excerpt: description.slice(0, 200),
    tagline: { value: taglineValue, confidence: taglineValue ? 'high' : 'none' },
    sessions: {
      value: sessionsValue,
      confidence: sessionsValue.length > 0 ? 'medium' : 'none',
    },
    pricing_tiers: {
      value: pricingValue,
      confidence:
        pricingValue.length > 0
          ? c.price_max_per_week_usd != null && c.price_max_per_week_usd > 0
            ? 'high'
            : 'medium'
          : 'none',
    },
    activities: {
      value: activitiesValue,
      confidence:
        activitiesValue.length >= 3 ? 'high' : activitiesValue.length > 0 ? 'medium' : 'none',
    },
    fees: { value: [], confidence: 'none' },
    enrollment_window: {
      value: enrollmentValue,
      confidence: enrollmentValue ? 'medium' : 'none',
    },
    what_to_bring: {
      value: whatToBringValue,
      confidence: whatToBringValue.length > 0 ? 'low' : 'none',
    },
    lunch_policy: {
      value: lunchValue,
      confidence:
        c.lunch_included != null ? 'high' : lunchValue ? 'low' : 'none',
    },
    extended_care_policy: {
      value: extendedCareValue,
      confidence:
        c.has_before_care != null || c.has_after_care != null
          ? 'high'
          : extendedCareValue
            ? 'low'
            : 'none',
    },
    overall_confidence: 'none',
    notes: [],
  };

  // Notes for ambiguity.
  if (whatToBringValue.length > 0) {
    p.notes.push(
      'what_to_bring extracted via regex pass — spot-check before applying (false positives common).',
    );
  }
  if (c.price_min_per_week_usd != null && c.price_min_per_week_usd === 0) {
    p.notes.push('Reported price of $0 — verify or override.');
  }
  if (sessionsValue.length === 1 && !(sessionsValue[0] as ResearchSession).start_date) {
    p.notes.push('Session row has no dates — research source said "Summer 2026" generically.');
  }

  p.overall_confidence = scoreConfidence(p);
  return p;
}

function fmtConf(c: Confidence): string {
  return c === 'high' ? '🟢' : c === 'medium' ? '🟡' : c === 'low' ? '🟠' : '⚪';
}

function renderProposal(p: Proposal): string {
  const lines: string[] = [];
  lines.push(`### ${p.name} (\`${p.slug}\`)`);
  lines.push('');
  lines.push(`**Source:** ${p.source} · **Overall confidence:** ${fmtConf(p.overall_confidence)} ${p.overall_confidence}`);
  lines.push('');
  if (p.description_excerpt) {
    lines.push('**Description excerpt:**');
    lines.push('> ' + p.description_excerpt.replace(/\n/g, ' ').slice(0, 200));
    lines.push('');
  }
  lines.push('**Proposed structured fields:**');
  lines.push('');
  lines.push(`- ${fmtConf(p.tagline.confidence)} **tagline:** ${p.tagline.value ? `"${p.tagline.value}"` : '_null_'}`);
  lines.push(
    `- ${fmtConf(p.sessions.confidence)} **sessions:** ${p.sessions.value.length === 0 ? '_empty_' : `\`${JSON.stringify(p.sessions.value)}\``}`,
  );
  lines.push(
    `- ${fmtConf(p.pricing_tiers.confidence)} **pricing_tiers:** ${p.pricing_tiers.value.length === 0 ? '_empty_' : `\`${JSON.stringify(p.pricing_tiers.value)}\``}`,
  );
  lines.push(
    `- ${fmtConf(p.activities.confidence)} **activities:** ${p.activities.value.length === 0 ? '_empty_' : p.activities.value.map((a) => `\`${a}\``).join(', ')}`,
  );
  lines.push(
    `- ${fmtConf(p.fees.confidence)} **fees:** ${p.fees.value.length === 0 ? '_empty_' : `\`${JSON.stringify(p.fees.value)}\``}`,
  );
  lines.push(
    `- ${fmtConf(p.enrollment_window.confidence)} **enrollment_window:** ${p.enrollment_window.value ? `\`${JSON.stringify(p.enrollment_window.value)}\`` : '_null_'}`,
  );
  lines.push(
    `- ${fmtConf(p.what_to_bring.confidence)} **what_to_bring:** ${p.what_to_bring.value.length === 0 ? '_empty_' : p.what_to_bring.value.map((a) => `\`${a}\``).join(', ')}`,
  );
  lines.push(
    `- ${fmtConf(p.lunch_policy.confidence)} **lunch_policy:** ${p.lunch_policy.value ? `"${p.lunch_policy.value}"` : '_null_'}`,
  );
  lines.push(
    `- ${fmtConf(p.extended_care_policy.confidence)} **extended_care_policy:** ${p.extended_care_policy.value ? `"${p.extended_care_policy.value}"` : '_null_'}`,
  );
  if (p.notes.length > 0) {
    lines.push('');
    lines.push('**Notes:**');
    for (const n of p.notes) lines.push(`- ${n}`);
  }
  lines.push('');
  return lines.join('\n');
}

function main(): void {
  const root = process.cwd();
  const jsonPath = path.join(root, 'data/camps/miami-research-2026-04-23.json');
  const research: ResearchCamp[] = JSON.parse(readFileSync(jsonPath, 'utf8'));

  const proposals: Proposal[] = [];
  for (const c of research) {
    proposals.push(processResearchCamp(c));
  }
  for (const m of MANUAL_PROPOSALS) {
    proposals.push(m);
  }

  // Group by overall confidence.
  const sectionA = proposals.filter((p) => p.overall_confidence === 'high');
  const sectionB = proposals.filter((p) => p.overall_confidence === 'medium');
  const sectionC = proposals.filter((p) => p.overall_confidence === 'low');
  const sectionD = proposals.filter((p) => p.overall_confidence === 'none');

  const out: string[] = [];
  out.push('# Camp Structured Fields Proposal — 2026-04-27');
  out.push('');
  out.push(
    '_Generated overnight by `scripts/parse-camps-structured-fields.ts` as Goal 2 of the Phase B prep run. **No production data was modified.** Migration 054 (which adds the columns these fields populate) is committed but not yet applied._',
  );
  out.push('');
  out.push('## Summary');
  out.push('');
  out.push(`- Total camps analyzed: ${proposals.length}`);
  out.push(`- Section A (high confidence — most fields parsed cleanly): **${sectionA.length}**`);
  out.push(`- Section B (medium confidence — some fields ambiguous): **${sectionB.length}**`);
  out.push(`- Section C (low confidence — minimal extraction): **${sectionC.length}**`);
  out.push(`- Section D (no extraction — description too thin): **${sectionD.length}**`);
  out.push('');
  out.push('### Confidence legend');
  out.push('');
  out.push('- 🟢 high · 🟡 medium · 🟠 low · ⚪ none/null');
  out.push('');
  out.push('### How to use this doc');
  out.push('');
  out.push('1. Apply migration 054 (`pnpm exec supabase db push --include-all`).');
  out.push('2. Skim Section A — those camps are batch-approvable. Stage 2 prompt can synthesize a UPDATE migration from the JSON values shown.');
  out.push('3. Read Section B per-camp — most have one or two fields needing your eye.');
  out.push('4. Section C + D camps stay null on the new structured fields until a human or operator fills them in via the admin form (Phase B continued).');
  out.push('');
  out.push('---');
  out.push('');
  out.push(`## Section A — High confidence (${sectionA.length} camps)`);
  out.push('');
  for (const p of sectionA) out.push(renderProposal(p));
  out.push(`## Section B — Medium confidence (${sectionB.length} camps)`);
  out.push('');
  for (const p of sectionB) out.push(renderProposal(p));
  out.push(`## Section C — Low confidence (${sectionC.length} camps)`);
  out.push('');
  for (const p of sectionC) out.push(renderProposal(p));
  out.push(`## Section D — No extraction (${sectionD.length} camps)`);
  out.push('');
  out.push(
    '_These camps had descriptions too thin for any heuristic to extract structured fields. Tagline alone may still be present — but no sessions, pricing, activities, fees, etc. Operator self-edit (Phase B) is the right path for these._',
  );
  out.push('');
  for (const p of sectionD) out.push(renderProposal(p));

  const outPath = path.join(root, 'docs/plans/camp-structured-fields-proposal-2026-04-27.md');
  writeFileSync(outPath, out.join('\n'));
  console.log(`Wrote ${outPath}`);
  console.log(`Sections: A=${sectionA.length} B=${sectionB.length} C=${sectionC.length} D=${sectionD.length}`);
}

main();
