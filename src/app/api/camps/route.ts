import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { haversineMiles } from '@/lib/distance';

// DECISION: Use service role for public GET so RLS isn't a blocker even though
// the "anyone reads camps" policy would allow anon SELECT. Service role is
// simpler and avoids needing cookies for unauthenticated browsing.
const priceTier = z.enum(['$', '$$', '$$$']);
const sortKey = z.enum(['distance', 'price', 'name']);
const mustHaveValue = z.enum(['before_care', 'after_care', 'full_workday']);

const querySchema = z
  .object({
    categories: z.string().optional(),
    age: z.coerce.number().int().min(0).max(25).optional(),
    min_price: priceTier.optional(),
    max_price: priceTier.optional(),
    // New:
    closure_id: z.guid().optional(),
    sort: sortKey.optional(),
    from_lat: z.coerce.number().gte(-90).lte(90).optional(),
    from_lng: z.coerce.number().gte(-180).lte(180).optional(),
    must_have: z.string().optional(),
  })
  .refine(
    (d) =>
      d.sort !== 'distance' ||
      (typeof d.from_lat === 'number' && typeof d.from_lng === 'number'),
    { message: 'distance_sort_requires_origin' },
  );

const tierRank: Record<string, number> = { $: 1, $$: 2, $$$: 3 };

// DECISION: full-workday threshold — effective end must reach 17:30 (5:30 PM)
// and effective start must be no later than 08:00. That covers a normal 9-5
// parent commute with a 30min buffer on each end.
const FULL_WORKDAY_START = '08:00:00';
const FULL_WORKDAY_END = '17:30:00';

type CampRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  website_url: string | null;
  image_url: string | null;
  neighborhood: string | null;
  is_featured: boolean;
  verified: boolean;
  created_at: string;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean;
  before_care_start: string | null;
  before_care_price_cents: number | null;
  after_care_offered: boolean;
  after_care_end: string | null;
  after_care_price_cents: number | null;
  closed_on_holidays: boolean;
  phone: string | null;
  logistics_verified: boolean;
};

type CampSessionRow = {
  id: string;
  camp_id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  spots_available: number | null;
  booking_url: string | null;
  verified: boolean;
};

function hasFullWorkday(c: CampRow): boolean {
  const effectiveStart = c.before_care_offered && c.before_care_start ? c.before_care_start : c.hours_start;
  const effectiveEnd = c.after_care_offered && c.after_care_end ? c.after_care_end : c.hours_end;
  if (!effectiveStart || !effectiveEnd) return false;
  return effectiveStart <= FULL_WORKDAY_START && effectiveEnd >= FULL_WORKDAY_END;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = {
    categories: url.searchParams.get('categories') ?? undefined,
    age: url.searchParams.get('age') ?? undefined,
    min_price: url.searchParams.get('min_price') ?? undefined,
    max_price: url.searchParams.get('max_price') ?? undefined,
    closure_id: url.searchParams.get('closure_id') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    from_lat: url.searchParams.get('from_lat') ?? undefined,
    from_lng: url.searchParams.get('from_lng') ?? undefined,
    must_have: url.searchParams.get('must_have') ?? undefined,
  };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });

  const {
    categories,
    age,
    min_price,
    max_price,
    closure_id,
    sort,
    from_lat,
    from_lng,
    must_have,
  } = parsed.data;

  // Parse must_have CSV
  const mustHaveList: z.infer<typeof mustHaveValue>[] = [];
  if (must_have) {
    for (const raw of must_have.split(',').map((s) => s.trim()).filter(Boolean)) {
      const r = mustHaveValue.safeParse(raw);
      if (!r.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
      mustHaveList.push(r.data);
    }
  }

  const db = createServiceSupabase();
  let q = db
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, verified, created_at, address, latitude, longitude, hours_start, hours_end, before_care_offered, before_care_start, before_care_price_cents, after_care_offered, after_care_end, after_care_price_cents, closed_on_holidays, phone, logistics_verified',
    )
    .order('is_featured', { ascending: false })
    .order('verified', { ascending: false })
    .order('created_at', { ascending: false });

  if (categories) {
    const list = categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (list.length) q = q.overlaps('categories', list);
  }
  if (typeof age === 'number') {
    q = q.lte('ages_min', age).gte('ages_max', age);
  }

  // must_have pre-filters we can push to SQL
  if (mustHaveList.includes('before_care')) q = q.eq('before_care_offered', true);
  if (mustHaveList.includes('after_care')) q = q.eq('after_care_offered', true);
  // full_workday enforced in JS after we have hours_*

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  // DECISION: Price filtering done in JS — price_tier is a 3-value enum string
  // ('$','$$','$$$'), and Supabase .in() or .gte() on strings won't respect the
  // ordinal rank. Tiny row count (<1000 camps) makes this cheap.
  let camps = (data ?? []) as CampRow[];
  if (min_price) {
    const min = tierRank[min_price];
    camps = camps.filter((c) => tierRank[c.price_tier] >= min);
  }
  if (max_price) {
    const max = tierRank[max_price];
    camps = camps.filter((c) => tierRank[c.price_tier] <= max);
  }

  if (mustHaveList.includes('full_workday')) {
    camps = camps.filter(hasFullWorkday);
  }

  // --- closure_id: sessions overlap (or age-only fallback with sessions_unknown) ---
  const sessionsByCamp: Record<string, CampSessionRow[]> = {};
  let closureStart: string | null = null;
  let closureEnd: string | null = null;

  if (closure_id) {
    const { data: closure, error: cErr } = await db
      .from('closures')
      .select('id, start_date, end_date')
      .eq('id', closure_id)
      .maybeSingle();
    if (cErr) return NextResponse.json({ error: 'db_error', detail: cErr.message }, { status: 500 });
    if (!closure) return NextResponse.json({ error: 'closure_not_found' }, { status: 404 });
    closureStart = closure.start_date as string;
    closureEnd = closure.end_date as string;

    const campIds = camps.map((c) => c.id);
    if (campIds.length) {
      const { data: sessions } = await db
        .from('camp_sessions')
        .select('id, camp_id, name, start_date, end_date, spots_available, booking_url, verified')
        .in('camp_id', campIds);
      for (const s of (sessions ?? []) as CampSessionRow[]) {
        const arr = sessionsByCamp[s.camp_id] ?? [];
        arr.push(s);
        sessionsByCamp[s.camp_id] = arr;
      }
    }
  }

  // --- distance sort + annotation ---
  type Annotated = CampRow & {
    distance_miles?: number;
    sessions_unknown?: boolean;
    matching_sessions?: CampSessionRow[];
  };
  let annotated: Annotated[] = camps.map((c) => {
    const out: Annotated = { ...c };
    if (typeof from_lat === 'number' && typeof from_lng === 'number' && c.latitude != null && c.longitude != null) {
      const lat = typeof c.latitude === 'string' ? Number(c.latitude) : c.latitude;
      const lng = typeof c.longitude === 'string' ? Number(c.longitude) : c.longitude;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        out.distance_miles = Number(haversineMiles(from_lat, from_lng, lat, lng).toFixed(2));
      }
    }
    if (closure_id) {
      const sList = sessionsByCamp[c.id] ?? [];
      if (sList.length === 0) {
        out.sessions_unknown = true;
        out.matching_sessions = [];
      } else {
        const match = sList.filter((s) => {
          if (!closureStart || !closureEnd) return false;
          return s.start_date <= closureEnd && s.end_date >= closureStart;
        });
        out.matching_sessions = match;
        out.sessions_unknown = false;
      }
    }
    return out;
  });

  // If closure filter is active AND camp has sessions, keep only camps where
  // either sessions overlap OR the camp has no sessions at all (fallback).
  if (closure_id) {
    annotated = annotated.filter((c) => c.sessions_unknown || (c.matching_sessions?.length ?? 0) > 0);
  }

  if (sort === 'distance') {
    annotated = annotated.sort((a, b) => {
      const ad = a.distance_miles ?? Number.POSITIVE_INFINITY;
      const bd = b.distance_miles ?? Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  } else if (sort === 'price') {
    annotated = annotated.sort((a, b) => tierRank[a.price_tier] - tierRank[b.price_tier]);
  } else if (sort === 'name') {
    annotated = annotated.sort((a, b) => a.name.localeCompare(b.name));
  }

  return NextResponse.json({ camps: annotated });
}
