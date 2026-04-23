import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { haversineMiles } from '@/lib/distance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// DECISION: No closure_id → return verified activities sorted alphabetically
// (still useful for the wizard in "activities only" mode without a closure
// context). With closure_id we filter by verified only, then sort by
// weather preference + distance from the user's saved primary location, or
// the closure's school as fallback.

const querySchema = z.object({
  closure_id: z.guid().optional(),
  kid_ages: z.string().optional(), // CSV of min-max age ranges, e.g. "4-6,7-9"
  weather: z.enum(['rainy', 'sunny']).optional(),
});

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  ages_min: number;
  ages_max: number;
  cost_tier: string;
  cost_note: string | null;
  neighborhood: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  website_url: string | null;
  weather_preference: 'any' | 'indoor_preferred' | 'outdoor_preferred' | null;
};

function parseAgeCSV(csv: string): { min: number; max: number } | null {
  // accept "4-6,7-9" or "4,7" etc; compute overall min/max
  if (!csv) return null;
  const nums: number[] = [];
  for (const part of csv.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (/^\d+-\d+$/.test(trimmed)) {
      const [a, b] = trimmed.split('-').map(Number);
      nums.push(a, b);
    } else if (/^\d+\+?$/.test(trimmed)) {
      nums.push(parseInt(trimmed, 10));
    }
  }
  if (nums.length === 0) return null;
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = {
    closure_id: url.searchParams.get('closure_id') ?? undefined,
    kid_ages: url.searchParams.get('kid_ages') ?? undefined,
    weather: url.searchParams.get('weather') ?? undefined,
  };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });

  const { closure_id, kid_ages, weather } = parsed.data;

  const admin = createServiceSupabase();

  let wantMin = 0;
  let wantMax = 17;
  const ageBounds = parseAgeCSV(kid_ages ?? '');
  if (ageBounds) {
    wantMin = ageBounds.min;
    wantMax = ageBounds.max;
  }

  // Resolve origin for distance sort:
  //  - Signed-in user with primary saved_location → that location
  //  - Else the closure's school coordinates
  //  - Else null (alphabetical fallback)
  let originLat: number | null = null;
  let originLng: number | null = null;

  const sb = createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: primaryLoc } = await sb
      .from('saved_locations')
      .select('latitude, longitude')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();
    if (primaryLoc?.latitude != null && primaryLoc?.longitude != null) {
      originLat = Number(primaryLoc.latitude);
      originLng = Number(primaryLoc.longitude);
    }
  }

  if ((originLat == null || originLng == null) && closure_id) {
    const { data: closure } = await admin
      .from('closures')
      .select('school_id')
      .eq('id', closure_id)
      .maybeSingle();
    if (closure?.school_id) {
      const { data: school } = await admin
        .from('schools')
        .select('latitude, longitude')
        .eq('id', closure.school_id)
        .maybeSingle();
      if (school?.latitude != null && school?.longitude != null) {
        originLat = Number(school.latitude);
        originLng = Number(school.longitude);
      }
    }
  }

  const { data, error } = await admin
    .from('family_activities')
    .select('id, slug, name, description, category, ages_min, ages_max, cost_tier, cost_note, neighborhood, latitude, longitude, website_url, weather_preference')
    .eq('verified', true)
    .lte('ages_min', wantMax)
    .gte('ages_max', wantMin)
    .limit(60);

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];

  type Annotated = Row & { distance_miles: number | null };
  const annotated: Annotated[] = rows.map((a) => {
    const lat = a.latitude != null ? Number(a.latitude) : null;
    const lng = a.longitude != null ? Number(a.longitude) : null;
    const dist =
      originLat != null && originLng != null && lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
        ? Number(haversineMiles(originLat, originLng, lat, lng).toFixed(2))
        : null;
    return { ...a, distance_miles: dist };
  });

  // Weather-aware ordering:
  //   rainy → indoor_preferred first, then any, then outdoor_preferred
  //   sunny → outdoor_preferred first, then any, then indoor_preferred
  //   else  → any first (neutral) — preserves prior distance ordering
  const weightOf = (w: Row['weather_preference']) => {
    if (weather === 'rainy') {
      return w === 'indoor_preferred' ? 0 : w === 'any' ? 1 : 2;
    }
    if (weather === 'sunny') {
      return w === 'outdoor_preferred' ? 0 : w === 'any' ? 1 : 2;
    }
    return 0;
  };

  annotated.sort((a, b) => {
    const wd = weightOf(a.weather_preference) - weightOf(b.weather_preference);
    if (wd !== 0) return wd;
    const da = a.distance_miles ?? Number.POSITIVE_INFINITY;
    const db = b.distance_miles ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ activities: annotated });
}
