import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import {
  UnifiedCampCard,
  type UnifiedCampCardCamp,
} from '@/components/camps/UnifiedCampCard';
import { CampSortControl, type FromOption } from '@/components/app/CampSortControl';
import { AppPageHeader } from '@/components/app/AppPageHeader';
import { CampCount } from '@/components/camps/CampCount';
import { CampsFilterBar } from '@/components/camps/CampsFilterBar';
import { EntityEmptyHint } from '@/components/shared/EntityEmptyHint';
import { applyFilters, hasActiveFilters, parseFiltersFromRecord } from '@/lib/camps/filters';
import { sortByDistanceWithFeatured } from '@/lib/camps/sort';
import { haversineMiles } from '@/lib/distance';
import { neighborhoodCentroid } from '@/lib/neighborhoods';

export const dynamic = 'force-dynamic';

type CampRow = UnifiedCampCardCamp & {
  description: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  before_care_price_cents?: number | null;
  after_care_price_cents?: number | null;
  closed_on_holidays?: boolean;
  website_url?: string | null;
  image_url?: string | null;
  created_at?: string;
  // DECISION (Phase 3.0 / Item 1.9): set when a camp's distance was
  // computed from its neighborhood centroid rather than its own lat/lng.
  // The CampCard renders a leading "~" so parents see the approximation.
  distance_approximate?: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CampsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'app.camps' });

  const filters = parseFiltersFromRecord(sp);
  const sortRaw = typeof sp.sort === 'string' ? sp.sort : null;
  const sortParam =
    sortRaw === 'price' || sortRaw === 'name' || sortRaw === 'distance' ? sortRaw : null;

  // DECISION: use service role for camps read (public) and authed client for
  // the user's saved set + schools (RLS-protected). Parallel to shave latency.
  const svc = createServiceSupabase();
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const [campsResp, savesResp, profilesResp, savedLocsResp] = await Promise.all([
    // INTEGRITY FILTER — UX_PRINCIPLES.md #2. Public camps listing only shows
    // admin-reviewed camps whose websites haven't been flagged broken.
    svc
      .from('camps')
      .select(
        'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, featured_until, last_verified_at, verified, address, latitude, longitude, hours_start, hours_end, before_care_offered, before_care_start, before_care_price_cents, after_care_offered, after_care_end, after_care_price_cents, closed_on_holidays, phone, logistics_verified, website_status, website_last_verified_at, price_min_cents, price_max_cents, registration_url, registration_deadline',
      )
      .eq('verified', true)
      .neq('website_status', 'broken')
      .order('is_featured', { ascending: false })
      .order('name'),
    user
      ? sb.from('saved_camps').select('camp_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { camp_id: string }[] }),
    user
      ? sb.from('kid_profiles').select('school_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { school_id: string }[] }),
    // saved_locations — RLS-protected, requires user.
    user
      ? sb.from('saved_locations').select('id, label, latitude, longitude, is_primary').eq('user_id', user.id)
      : Promise.resolve({ data: [] as Array<{ id: string; label: string; latitude: number | string; longitude: number | string; is_primary: boolean }> }),
  ]);

  const rows = (campsResp.data ?? []) as CampRow[];
  const savedSet = new Set(
    (savesResp.data ?? []).map((s) => (s as { camp_id: string }).camp_id),
  );

  // Build "from" options: dedup schools by ID and append saved_locations.
  const schoolIds = Array.from(
    new Set(
      ((profilesResp.data ?? []) as Array<{ school_id: string }>)
        .map((p) => p.school_id)
        .filter(Boolean),
    ),
  );
  const fromOptions: FromOption[] = [];
  if (schoolIds.length) {
    const { data: schools } = await svc
      .from('schools')
      .select('id, name, latitude, longitude, neighborhood')
      .in('id', schoolIds);
    for (const s of (schools ?? []) as Array<{
      id: string;
      name: string;
      latitude: number | string | null;
      longitude: number | string | null;
      neighborhood: string | null;
    }>) {
      const lat = s.latitude != null ? Number(s.latitude) : null;
      const lng = s.longitude != null ? Number(s.longitude) : null;
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        fromOptions.push({
          id: `school:${s.id}`,
          label: s.name,
          latitude: lat,
          longitude: lng,
        });
        continue;
      }
      // DECISION (Phase 3.0 / Item 1.9): fall back to neighborhood centroid
      // when the school's own coordinates aren't populated. Better than
      // sinking the option entirely — the user can still sort by distance
      // (approximate). The fromOption itself doesn't carry an "approximate"
      // flag because the resulting camp distances are flagged per-camp
      // anyway, and the parent picks one origin at a time.
      const centroid = neighborhoodCentroid(s.neighborhood);
      if (centroid) {
        fromOptions.push({
          id: `school:${s.id}`,
          label: s.name,
          latitude: centroid.lat,
          longitude: centroid.lng,
        });
      }
    }
  }
  for (const loc of (savedLocsResp.data ?? []) as Array<{ id: string; label: string; latitude: number | string; longitude: number | string; is_primary: boolean }>) {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    fromOptions.push({
      id: `loc:${loc.id}`,
      label: loc.label,
      latitude: lat,
      longitude: lng,
    });
  }

  const distanceAvailable = fromOptions.length > 0;
  const activeSort: 'distance' | 'price' | 'name' =
    sortParam && (sortParam !== 'distance' || distanceAvailable) ? sortParam : 'name';

  // Resolve origin for distance sort
  let originLat: number | null = null;
  let originLng: number | null = null;
  let activeFromId: string | null =
    typeof sp.from_id === 'string' ? sp.from_id : null;
  if (activeSort === 'distance') {
    const fromLat = typeof sp.from_lat === 'string' ? Number(sp.from_lat) : NaN;
    const fromLng = typeof sp.from_lng === 'string' ? Number(sp.from_lng) : NaN;
    if (Number.isFinite(fromLat) && Number.isFinite(fromLng)) {
      originLat = fromLat;
      originLng = fromLng;
    } else if (fromOptions[0]) {
      originLat = fromOptions[0].latitude;
      originLng = fromOptions[0].longitude;
      activeFromId = fromOptions[0].id;
    }
  }

  const filtered = applyFilters(rows, filters);
  const active = hasActiveFilters(filters);

  // Annotate with distance.
  // DECISION (Phase 3.0 / Item 1.9): for camps without their own lat/lng but
  // WITH a neighborhood, compute distance from the neighborhood centroid and
  // flag the result as approximate. Only camps with neither lat/lng nor a
  // recognized neighborhood drop out of the distance sort (they sink to the
  // bottom via Number.POSITIVE_INFINITY in the comparator below).
  const annotated = filtered.map((c) => {
    if (originLat == null || originLng == null) return c;
    const lat = c.latitude != null ? Number(c.latitude) : null;
    const lng = c.longitude != null ? Number(c.longitude) : null;
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        ...c,
        distance_miles: Number(haversineMiles(originLat, originLng, lat, lng).toFixed(2)),
        distance_approximate: false,
      };
    }
    const centroid = neighborhoodCentroid(c.neighborhood);
    if (centroid) {
      return {
        ...c,
        distance_miles: Number(
          haversineMiles(originLat, originLng, centroid.lat, centroid.lng).toFixed(2),
        ),
        distance_approximate: true,
      };
    }
    return c;
  });

  // Sort
  let sorted = annotated;
  if (activeSort === 'distance') {
    sorted = sortByDistanceWithFeatured(annotated);
  } else if (activeSort === 'price') {
    const rank: Record<string, number> = { $: 1, $$: 2, $$$: 3 };
    sorted = [...annotated].sort(
      (a, b) =>
        (rank[a.price_tier ?? ''] ?? 99) - (rank[b.price_tier ?? ''] ?? 99),
    );
  }

  const hoods = Array.from(
    new Set(rows.map((r) => r.neighborhood).filter((h): h is string => Boolean(h))),
  ).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <AppPageHeader
        eyebrow="PLAN"
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="mb-5">
        <CampSortControl
          fromOptions={fromOptions}
          activeSort={activeSort}
          activeFromId={activeFromId}
          distanceAvailable={distanceAvailable}
        />
      </div>

      <div className="mb-5">
        {/* DECISION: Same shared bar as /camps. matchEnabled is wired to a
            URL ?match=1 param but the chip stays hidden until the underlying
            kid-age match logic ships (per COPPA, kid ages live client-side
            so this needs a client-side overlay rather than a server filter). */}
        <CampsFilterBar mode="app" hoods={hoods} matchEnabled={false} />
      </div>

      <div className="mb-3">
        <CampCount filtered={sorted.length} total={rows.length} hasFilters={active} />
      </div>

      {sorted.length === 0 ? (
        <EntityEmptyHint
          hasSearchTerm={Boolean(filters.q)}
          i18nNamespace="camps.filters.empty"
          testId="camps-empty-hint"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((camp) => (
            <li key={camp.id}>
              <UnifiedCampCard
                camp={camp}
                mode="app"
                isSaved={savedSet.has(camp.id)}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
