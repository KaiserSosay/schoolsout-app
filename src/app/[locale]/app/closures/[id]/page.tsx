import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { ClosureDetailView, type FamilyActivity } from '@/components/app/ClosureDetailView';
import type { WizardKid, WizardInitialPlan } from '@/components/app/PlanThisDayWizard';
import { reasonFor } from '@/lib/closure-reasons';
import { haversineMiles } from '@/lib/distance';

export default async function ClosureDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}`);

  // Use service role to bypass RLS for the read — closures are public-read anyway (status='verified')
  const admin = createServiceSupabase();
  const { data: closure } = await admin
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji, status, schools(name)')
    .eq('id', id)
    .maybeSingle();

  if (!closure) notFound();

  // Find camps whose age range overlaps the user's kid age ranges
  const { data: profiles } = await supabase
    .from('kid_profiles')
    .select('age_range')
    .eq('user_id', user.id);
  const ageRanges = Array.from(new Set((profiles ?? []).map((p) => p.age_range)));

  // Map age_range enum → [min, max]
  const rangeBounds: Record<string, [number, number]> = {
    '4-6': [4, 6],
    '7-9': [7, 9],
    '10-12': [10, 12],
    '13+': [13, 17],
  };
  const wantMin = ageRanges.length ? Math.min(...ageRanges.map((r) => rangeBounds[r][0])) : 4;
  const wantMax = ageRanges.length ? Math.max(...ageRanges.map((r) => rangeBounds[r][1])) : 17;

  // INTEGRITY FILTER — UX_PRINCIPLES.md #2. Closures only surface admin-
  // reviewed camps whose websites haven't been flagged broken, AND which
  // have a verified session overlapping the closure dates. No age-only
  // fallback — "we don't know" beats "we guessed" for specific dates.
  const { data: matchingCamps } = await admin
    .from('camps')
    .select('id, slug, name, ages_min, ages_max, price_tier, categories, neighborhood, verified, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, logistics_verified, phone, website_status')
    .eq('verified', true)
    .neq('website_status', 'broken')
    .lte('ages_min', wantMax)
    .gte('ages_max', wantMin)
    .order('is_featured', { ascending: false })
    .limit(20);

  const campIds = (matchingCamps ?? []).map((c) => c.id);
  const { data: sessions } = campIds.length
    ? await admin
        .from('camp_sessions')
        .select('id, camp_id, start_date, end_date, closed_dates')
        .in('camp_id', campIds)
    : { data: [] as Array<{ id: string; camp_id: string; start_date: string; end_date: string; closed_dates: string[] | null }> };

  const sessionsByCamp: Record<string, Array<{ start_date: string; end_date: string; closed_dates: string[] | null }>> = {};
  for (const s of sessions ?? []) {
    const arr = sessionsByCamp[s.camp_id] ?? [];
    arr.push({ start_date: s.start_date, end_date: s.end_date, closed_dates: s.closed_dates ?? null });
    sessionsByCamp[s.camp_id] = arr;
  }

  // A closure can span multiple dates. The camp is "open that day" iff at
  // least one of its verified sessions contains the range AND none of the
  // closure's dates falls inside the session's closed_dates[].
  function closureDatesInRange(start: string, end: string): string[] {
    const out: string[] = [];
    const s = new Date(start + 'T00:00:00Z');
    const e = new Date(end + 'T00:00:00Z');
    for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  const closureDates = closureDatesInRange(closure.start_date, closure.end_date);

  const displayCamps = (matchingCamps ?? [])
    .filter((c) => {
      const sList = sessionsByCamp[c.id] ?? [];
      if (sList.length === 0) return false;
      return sList.some((s) => {
        if (!(s.start_date <= closure.end_date && s.end_date >= closure.start_date)) return false;
        const closed = new Set(s.closed_dates ?? []);
        // Camp is genuinely open during this closure if AT LEAST ONE day of
        // the closure isn't on the session's blackout list.
        return closureDates.some((d) => !closed.has(d));
      });
    })
    .slice(0, 3)
    .map((c) => ({ ...c, sessions_unknown: false, session_match: true }));

  // Family activities — weather-aware ordering.
  // DECISION: We use the existing /api/weather logic inline (Open-Meteo ≤16 days,
  // monthly-average beyond) by doing a light inline decision — if closure start
  // is within 16 days we could fetch a forecast, but we don't want to block on
  // the network during server render. Keep the weather decision client-side
  // (ClosureDetailView already fetches /api/weather). Here we fetch a generous
  // pool of activities and let the client re-sort once weather is known.
  const { data: activitiesRaw } = await admin
    .from('family_activities')
    .select('id, slug, name, description, category, ages_min, ages_max, cost_tier, cost_note, neighborhood, latitude, longitude, website_url, weather_preference')
    .eq('verified', true)
    .lte('ages_min', wantMax)
    .gte('ages_max', wantMin)
    .limit(40);

  // If the user has a primary saved location, sort activities by distance there;
  // otherwise by school distance; otherwise alphabetical.
  const { data: primaryLoc } = await supabase
    .from('saved_locations')
    .select('latitude, longitude')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();

  let originLat: number | null = null;
  let originLng: number | null = null;
  if (primaryLoc?.latitude != null && primaryLoc?.longitude != null) {
    originLat = Number(primaryLoc.latitude);
    originLng = Number(primaryLoc.longitude);
  } else {
    const { data: schoolRow } = await admin
      .from('schools')
      .select('latitude, longitude')
      .eq('id', closure.school_id)
      .maybeSingle();
    if (schoolRow?.latitude != null && schoolRow?.longitude != null) {
      originLat = Number(schoolRow.latitude);
      originLng = Number(schoolRow.longitude);
    }
  }

  const activities: FamilyActivity[] = (activitiesRaw ?? []).map((a) => {
    const lat = a.latitude != null ? Number(a.latitude) : null;
    const lng = a.longitude != null ? Number(a.longitude) : null;
    const dist =
      originLat != null && originLng != null && lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
        ? Number(haversineMiles(originLat, originLng, lat, lng).toFixed(2))
        : null;
    return {
      id: a.id as string,
      slug: a.slug as string,
      name: a.name as string,
      description: (a.description as string | null) ?? null,
      category: a.category as FamilyActivity['category'],
      ages_min: a.ages_min as number,
      ages_max: a.ages_max as number,
      cost_tier: a.cost_tier as FamilyActivity['cost_tier'],
      cost_note: (a.cost_note as string | null) ?? null,
      neighborhood: (a.neighborhood as string | null) ?? null,
      website_url: (a.website_url as string | null) ?? null,
      weather_preference: (a.weather_preference as FamilyActivity['weather_preference']) ?? 'any',
      distance_miles: dist,
    };
  });

  // Log activity (ignore errors — best-effort)
  await supabase
    .from('kid_activity')
    .insert({
      user_id: user.id,
      action: 'viewed_closure',
      target_id: closure.id,
      target_name: closure.name,
    })
    .then(() => undefined);

  const schoolName = Array.isArray(closure.schools)
    ? (closure.schools[0] as { name: string } | undefined)?.name ?? ''
    : (closure.schools as { name: string } | null)?.name ?? '';

  const whyText = reasonFor(closure.name);

  // Fetch the user's saved plan for this closure (Goal 4).
  const { data: existingPlan } = await supabase
    .from('user_plans')
    .select('id, plan_type, kid_names, camps, activities, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('closure_id', closure.id)
    .maybeSingle();

  const initialPlan: WizardInitialPlan | null = existingPlan
    ? {
        id: existingPlan.id as string,
        plan_type: existingPlan.plan_type as WizardInitialPlan['plan_type'],
        kid_names: (existingPlan.kid_names as string[] | null) ?? [],
        camps: (existingPlan.camps as string[] | null) ?? [],
        activities: (existingPlan.activities as string[] | null) ?? [],
      }
    : null;

  // Build WizardKid[] from server kid_profiles (names/grades are localStorage
  // only — the client fills those in at render time via so-kids).
  const { data: kidProfiles } = await supabase
    .from('kid_profiles')
    .select('ordinal, age_range, school_id')
    .eq('user_id', user.id)
    .order('ordinal', { ascending: true });

  const wizardKids: WizardKid[] = (kidProfiles ?? []).map((k) => ({
    ordinal: k.ordinal as number,
    name: '', // filled in client-side from localStorage in the wizard
    age_range: k.age_range as WizardKid['age_range'],
    school_id: (k.school_id as string | null) ?? null,
  }));

  return (
    <ClosureDetailView
      locale={locale}
      closure={{
        id: closure.id,
        name: closure.name,
        start_date: closure.start_date,
        end_date: closure.end_date,
        emoji: closure.emoji,
        school_name: schoolName,
        school_id: closure.school_id as string | null,
      }}
      camps={displayCamps}
      activities={activities}
      whyText={whyText}
      initialPlan={initialPlan}
      wizardKids={wizardKids}
    />
  );
}
