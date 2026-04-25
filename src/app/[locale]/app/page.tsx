import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getUpcomingClosures, type Closure } from '@/lib/closures';
import { DashboardRouter } from '@/components/app/DashboardRouter';

export const dynamic = 'force-dynamic';

type Camp = {
  id: string;
  slug: string;
  name: string;
  price_tier: '$' | '$$' | '$$$';
  ages_min: number;
  ages_max: number;
  categories: string[];
  website_url: string | null;
  neighborhood: string | null;
};

type RawSave = {
  id: string;
  camp: Camp | Camp[] | null;
};

export default async function AppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}`);

  // DECISION: If there are no kid_profiles yet we bounce to /onboarding. This
  // is a belt-and-braces check in addition to the auth callback — a user who
  // deletes cookies and lands here directly still funnels through onboarding.
  const { count: kidCount } = await sb
    .from('kid_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((kidCount ?? 0) === 0) redirect(`/${locale}/app/onboarding`);

  const [profilesResp, savesResp, activityResp, userResp, subsCountResp] = await Promise.all([
    sb
      .from('kid_profiles')
      .select('id, school_id, age_range, ordinal, schools(id, name, district, type, calendar_status)')
      .eq('user_id', user.id)
      .order('ordinal'),
    sb
      .from('saved_camps')
      .select(
        'id, created_at, camp:camps(id, slug, name, price_tier, ages_min, ages_max, categories, website_url, neighborhood)',
        { count: 'exact' },
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    sb
      .from('kid_activity')
      .select('id, action, target_name, target_id, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    sb.from('users').select('display_name').eq('id', user.id).maybeSingle(),
    // Phase 3.0 / Item 3.9: powers the new-device kid-name reminder
    // banner. We only show the banner when a returning user has reminder
    // subscriptions on file but their localStorage is empty (typical of
    // a sign-in from a fresh device). Count-only HEAD select keeps the
    // payload tiny.
    sb
      .from('reminder_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('enabled', true),
  ]);

  type JoinedSchool = {
    id: string;
    name: string;
    district: string | null;
    type: string | null;
    calendar_status:
      | 'verified_multi_year'
      | 'verified_current'
      | 'ai_draft'
      | 'needs_research'
      | 'unavailable';
  };
  const profilesRaw = (profilesResp.data ?? []) as Array<{
    id: string;
    school_id: string;
    age_range: string;
    ordinal: number;
    // supabase returns joined row as object OR array depending on relation inference
    schools: JoinedSchool | JoinedSchool[] | null;
  }>;
  const profiles = profilesRaw.map((p) => ({
    id: p.id,
    school_id: p.school_id,
    age_range: p.age_range,
    ordinal: p.ordinal,
    schools: Array.isArray(p.schools) ? (p.schools[0] ?? null) : p.schools,
  }));

  // Pull upcoming closures across every school this user's kids attend.
  const schoolIds = Array.from(new Set(profiles.map((p) => p.school_id)));
  const schoolNameById = new Map<string, string>();
  for (const p of profiles) {
    if (p.schools?.name) schoolNameById.set(p.school_id, p.schools.name);
  }

  // DECISION: parallel fetch + swallow per-school errors. If one school fails
  // to load we still render the others.
  const perSchool = await Promise.all(
    schoolIds.map(async (id) => {
      try {
        const rows = await getUpcomingClosures(id);
        return rows.map((c) => ({
          ...c,
          schoolName: schoolNameById.get(id) ?? null,
        }));
      } catch {
        return [] as Array<Closure & { schoolName: string | null }>;
      }
    }),
  );
  const closures = perSchool
    .flat()
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const rawSaves = (savesResp.data ?? []) as RawSave[];
  const saves = rawSaves.map((s) => ({
    id: s.id,
    camp: Array.isArray(s.camp) ? (s.camp[0] ?? null) : s.camp,
  }));
  const savesCount = savesResp.count ?? saves.length;

  // Load this user's upcoming plans + join linked camps for deadline info.
  type PlanRow = {
    id: string;
    closure_id: string;
    plan_type: 'coverage' | 'activities' | 'mix';
    kid_names: string[];
    camps: string[];
    registered: boolean;
  };
  const today = new Date().toISOString().slice(0, 10);
  const { data: planRows } = await sb
    .from('user_plans')
    .select('id, closure_id, plan_type, kid_names, camps, registered')
    .eq('user_id', user.id);

  const plans: import('@/components/app/PlansSummary').PlanCard[] = [];
  if (planRows && planRows.length > 0) {
    const closureIds = Array.from(new Set(planRows.map((p) => p.closure_id)));
    const allCampIds = Array.from(
      new Set((planRows as PlanRow[]).flatMap((p) => p.camps ?? [])),
    );
    const [closuresResp, campsResp] = await Promise.all([
      sb
        .from('closures')
        .select('id, name, start_date, emoji')
        .in('id', closureIds)
        .gte('start_date', today),
      allCampIds.length
        ? sb
            .from('camps')
            .select('id, name, registration_deadline, registration_url')
            .in('id', allCampIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; registration_deadline: string | null; registration_url: string | null }> }),
    ]);
    const closureById = new Map(
      (closuresResp.data ?? []).map((c) => [c.id as string, c as { id: string; name: string; start_date: string; emoji: string }]),
    );
    type CampRow = {
      id: string;
      name: string;
      registration_deadline: string | null;
      registration_url: string | null;
    };
    const campById = new Map(
      (campsResp.data as CampRow[] | null ?? []).map((c) => [c.id, c]),
    );
    for (const p of planRows as PlanRow[]) {
      const c = closureById.get(p.closure_id);
      if (!c) continue; // past closure — skip
      const linkedCamps = (p.camps ?? [])
        .map((id) => campById.get(id))
        .filter(Boolean) as CampRow[];
      const campNames = linkedCamps.map((c) => c.name);
      const deadlines = linkedCamps
        .map((c) => c.registration_deadline)
        .filter((d): d is string => Boolean(d))
        .sort();
      const registrationUrl =
        linkedCamps.find((c) => c.registration_url)?.registration_url ?? null;
      // One card per kid if kid_names present, else one anonymous card.
      const names = p.kid_names.length > 0 ? p.kid_names : ['Your kid'];
      for (const kid of names) {
        plans.push({
          plan_id: p.id,
          closure: {
            id: c.id,
            name: c.name,
            start_date: c.start_date,
            emoji: c.emoji,
          },
          kid_name: kid,
          plan_type: p.plan_type,
          camp_names: campNames,
          registration_deadline: deadlines[0] ?? null,
          registration_url: registrationUrl,
          registered: p.registered,
        });
      }
    }
    plans.sort((a, b) =>
      a.closure.start_date.localeCompare(b.closure.start_date),
    );
  }

  const userHasSubscriptions = (subsCountResp.count ?? 0) > 0;

  return (
    <DashboardRouter
      locale={locale}
      displayName={userResp.data?.display_name ?? null}
      profiles={profiles}
      closures={closures}
      saves={saves}
      savesCount={savesCount}
      activity={activityResp.data ?? []}
      plans={plans}
      userHasSubscriptions={userHasSubscriptions}
    />
  );
}
