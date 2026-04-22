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

  const [profilesResp, savesResp, activityResp, userResp] = await Promise.all([
    sb
      .from('kid_profiles')
      .select('id, school_id, age_range, ordinal, schools(id, name)')
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
  ]);

  const profilesRaw = (profilesResp.data ?? []) as Array<{
    id: string;
    school_id: string;
    age_range: string;
    ordinal: number;
    // supabase returns joined row as object OR array depending on relation inference
    schools: { id: string; name: string } | { id: string; name: string }[] | null;
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

  return (
    <DashboardRouter
      locale={locale}
      displayName={userResp.data?.display_name ?? null}
      profiles={profiles}
      closures={closures}
      saves={saves}
      savesCount={savesCount}
      activity={activityResp.data ?? []}
    />
  );
}
