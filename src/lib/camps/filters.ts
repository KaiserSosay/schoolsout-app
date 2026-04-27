// Shared filter parsing + application for /camps, /app/camps, and the
// /api/camps GET endpoint. Keeping all three on one filter shape means the
// URL params, the page-side filter logic, and the API stay in sync.

export type AgeBand = '3-5' | '6-9' | '10-13' | '14+';
export type PriceTier = '$' | '$$' | '$$$';

export type CampsFilters = {
  q: string; // free-text name search (trimmed; '' if none)
  cats: string[]; // category overlap, e.g. ['STEM', 'Sports']
  fullWorkday: boolean; // covers ~8am-5:30pm with extended care
  beforeCare: boolean;
  afterCare: boolean;
  ages: AgeBand | null; // single chip, narrow band
  tier: PriceTier[]; // multi-select chips
  hood: string[]; // multi-select neighborhoods (raw strings)
  match: boolean; // app mode only — match my kids
};

export const AGE_BANDS: AgeBand[] = ['3-5', '6-9', '10-13', '14+'];
export const PRICE_TIERS: PriceTier[] = ['$', '$$', '$$$'];

export const FULL_WORKDAY_START = '08:00';
export const FULL_WORKDAY_END = '17:30';

const ageRange: Record<AgeBand, [number, number]> = {
  '3-5': [3, 5],
  '6-9': [6, 9],
  '10-13': [10, 13],
  '14+': [14, 25],
};

function parseCsv(v: string | null | undefined): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function parseBool(v: string | null | undefined): boolean {
  if (!v) return false;
  return v === '1' || v === 'true' || v === 'yes';
}

function parseTier(v: string | null | undefined): PriceTier[] {
  return parseCsv(v).filter((t): t is PriceTier =>
    (PRICE_TIERS as string[]).includes(t),
  );
}

function parseAge(v: string | null | undefined): AgeBand | null {
  if (!v) return null;
  return (AGE_BANDS as string[]).includes(v) ? (v as AgeBand) : null;
}

// Accept the new ?cats= shape AND the legacy ?categories= / ?category= shapes
// so existing shared links don't 404. The new shape wins if both are present.
function pickCats(searchParams: URLSearchParams): string[] {
  for (const key of ['cats', 'categories', 'category']) {
    const parsed = parseCsv(searchParams.get(key));
    if (parsed.length) return parsed;
  }
  return [];
}

export function parseFilters(searchParams: URLSearchParams): CampsFilters {
  return {
    q: (searchParams.get('q') ?? '').trim(),
    cats: pickCats(searchParams),
    fullWorkday: parseBool(searchParams.get('full_workday')),
    beforeCare: parseBool(searchParams.get('before_care')),
    afterCare: parseBool(searchParams.get('after_care')),
    ages: parseAge(searchParams.get('ages')),
    tier: parseTier(searchParams.get('tier')),
    hood: parseCsv(searchParams.get('hood')),
    match: parseBool(searchParams.get('match')),
  };
}

export function parseFiltersFromRecord(
  sp: Record<string, string | string[] | undefined>,
): CampsFilters {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) flat[k] = v.join(',');
    else if (typeof v === 'string') flat[k] = v;
  }
  const params = new URLSearchParams(flat);
  return parseFilters(params);
}

// Boolean — does this filter set narrow anything? Used by the count pill and
// the empty-state hint to decide whether to suggest "clear filters".
export function hasActiveFilters(f: CampsFilters): boolean {
  return (
    f.q.length > 0 ||
    f.cats.length > 0 ||
    f.fullWorkday ||
    f.beforeCare ||
    f.afterCare ||
    f.ages !== null ||
    f.tier.length > 0 ||
    f.hood.length > 0 ||
    f.match
  );
}

// Camp shape needed for filter application. Loose so both pages can pass
// their own row types as long as the relevant columns are present.
export type FilterableCamp = {
  name: string;
  ages_min?: number | null;
  ages_max?: number | null;
  price_tier?: PriceTier | null;
  categories?: string[] | null;
  neighborhood?: string | null;
  hours_start?: string | null;
  hours_end?: string | null;
  before_care_offered?: boolean | null;
  before_care_start?: string | null;
  after_care_offered?: boolean | null;
  after_care_end?: string | null;
};

function hasFullWorkday(c: FilterableCamp): boolean {
  const effectiveStart =
    c.before_care_offered && c.before_care_start ? c.before_care_start : c.hours_start;
  const effectiveEnd =
    c.after_care_offered && c.after_care_end ? c.after_care_end : c.hours_end;
  if (!effectiveStart || !effectiveEnd) return false;
  return effectiveStart <= FULL_WORKDAY_START && effectiveEnd >= FULL_WORKDAY_END;
}

export function applyFilters<T extends FilterableCamp>(
  rows: T[],
  f: CampsFilters,
): T[] {
  let out = rows;
  if (f.q) {
    const needle = f.q.toLowerCase();
    out = out.filter((c) => c.name.toLowerCase().includes(needle));
  }
  if (f.cats.length) {
    // Case-insensitive overlap. After migration 052, prod data is all
    // lowercase + matches the lowercase pill keys exactly. Before that
    // migration applies, prod still has 'STEM' / 'Sports' — the lower()
    // on both sides keeps the filter working through the deploy window.
    const wanted = new Set(f.cats.map((c) => c.toLowerCase()));
    out = out.filter((c) =>
      (c.categories ?? []).some((cat) => wanted.has(cat.toLowerCase())),
    );
  }
  if (f.fullWorkday) {
    out = out.filter(hasFullWorkday);
  }
  if (f.beforeCare) {
    out = out.filter((c) => c.before_care_offered === true);
  }
  if (f.afterCare) {
    out = out.filter((c) => c.after_care_offered === true);
  }
  if (f.ages) {
    const [lo, hi] = ageRange[f.ages];
    // Camp must overlap the band: ages_min <= hi AND ages_max >= lo.
    out = out.filter(
      (c) =>
        typeof c.ages_min === 'number' &&
        typeof c.ages_max === 'number' &&
        c.ages_min <= hi &&
        c.ages_max >= lo,
    );
  }
  if (f.tier.length) {
    out = out.filter((c) => c.price_tier != null && f.tier.includes(c.price_tier));
  }
  if (f.hood.length) {
    out = out.filter((c) => c.neighborhood != null && f.hood.includes(c.neighborhood));
  }
  return out;
}

// Build a URL-search-string from a filters object — used by the bar component
// and by tests. Keys with falsy/empty values are omitted so URLs stay tidy.
export function serializeFilters(f: CampsFilters): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.cats.length) params.set('cats', f.cats.join(','));
  if (f.fullWorkday) params.set('full_workday', '1');
  if (f.beforeCare) params.set('before_care', '1');
  if (f.afterCare) params.set('after_care', '1');
  if (f.ages) params.set('ages', f.ages);
  if (f.tier.length) params.set('tier', f.tier.join(','));
  if (f.hood.length) params.set('hood', f.hood.join(','));
  if (f.match) params.set('match', '1');
  return params.toString();
}
