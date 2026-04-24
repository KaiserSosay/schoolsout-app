// Phase 2.7 Goal 1: TS mirror of the SQL completeness function in
// supabase/migrations/017_camps_completeness.sql.
//
// Keep the two in sync. The SQL version fires on every INSERT/UPDATE and
// populates `data_completeness` + `missing_fields` columns; this TS
// version computes on-demand for display when the stored value is stale
// (e.g. existing rows that predate migration 017's trigger). Prefer
// computing here for UI reads to avoid a backfill UPDATE against prod.

export type CompletenessCampShape = {
  phone?: string | null;
  address?: string | null;
  website_url?: string | null;
  ages_min?: number | null;
  ages_max?: number | null;
  hours_start?: string | null;
  hours_end?: string | null;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  description?: string | null;
  categories?: string[] | null;
  registration_url?: string | null;
  registration_deadline?: string | null;
};

export type CompletenessResult = {
  score: number; // 0.00 – 1.00, 2-decimal
  filled: number;
  total: number;
  missing: string[];
};

const FIELDS: Array<{
  key: string;
  has: (c: CompletenessCampShape) => boolean;
}> = [
  { key: 'phone', has: (c) => notBlank(c.phone) },
  { key: 'address', has: (c) => notBlank(c.address) },
  { key: 'website_url', has: (c) => notBlank(c.website_url) },
  {
    key: 'ages',
    has: (c) =>
      typeof c.ages_min === 'number' && typeof c.ages_max === 'number',
  },
  {
    key: 'hours',
    has: (c) => notBlank(c.hours_start) && notBlank(c.hours_end),
  },
  {
    key: 'price',
    has: (c) =>
      typeof c.price_min_cents === 'number' &&
      typeof c.price_max_cents === 'number',
  },
  {
    key: 'description',
    has: (c) => typeof c.description === 'string' && c.description.length > 40,
  },
  {
    key: 'categories',
    has: (c) => Array.isArray(c.categories) && c.categories.length > 0,
  },
  { key: 'registration_url', has: (c) => notBlank(c.registration_url) },
  { key: 'registration_deadline', has: (c) => notBlank(c.registration_deadline) },
];

function notBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function computeCompleteness(camp: CompletenessCampShape): CompletenessResult {
  const filled: string[] = [];
  const missing: string[] = [];
  for (const f of FIELDS) {
    if (f.has(camp)) filled.push(f.key);
    else missing.push(f.key);
  }
  const total = FIELDS.length;
  const score = Math.round((filled.length / total) * 100) / 100;
  return { score, filled: filled.length, total, missing };
}

// Threshold bands used by the CampCard badge:
//   score >= 1.0        → complete (no badge)
//   0.7  <= score < 1.0 → neutral: "Missing: phone, hours"
//   score < 0.7         → amber: "Limited info — help us verify"
export type CompletenessBand = 'complete' | 'partial' | 'limited';
export function bandFor(score: number): CompletenessBand {
  if (score >= 1.0) return 'complete';
  if (score >= 0.7) return 'partial';
  return 'limited';
}
