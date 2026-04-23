import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { PlanAheadClient, type PlanAheadClosure, type KidEntry } from '@/components/app/PlanAheadClient';

export const dynamic = 'force-dynamic';

// Batch planner for the next 6 months of verified upcoming closures.
// Rather than force parents through the 3-screen wizard 8 times, this
// view shows one row per closure with a chip per kid and a progress bar.
// Chips link straight to the closure detail page (which already hosts
// the wizard) — inline wizard embedding is a nice-to-have left for a
// follow-up pass.
export default async function PlanAheadPage({
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

  // Kid profiles — age_range + ordinal only (names stay in localStorage).
  const { data: profiles } = await sb
    .from('kid_profiles')
    .select('id, age_range, ordinal, school_id')
    .eq('user_id', user.id)
    .order('ordinal');
  const kids: KidEntry[] = (profiles ?? []).map((p) => ({
    id: p.id as string,
    age_range: p.age_range as string,
    ordinal: p.ordinal as number,
    school_id: p.school_id as string | null,
  }));

  // Next 6 months of verified closures across the user's kids' schools.
  const schoolIds = Array.from(new Set(kids.map((k) => k.school_id).filter(Boolean)));
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsOut = new Date();
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
  const horizon = sixMonthsOut.toISOString().slice(0, 10);

  const { data: closureRows } = schoolIds.length
    ? await sb
        .from('closures')
        .select('id, school_id, name, start_date, end_date, emoji, schools(name)')
        .in('school_id', schoolIds as string[])
        .eq('status', 'verified')
        .gte('start_date', today)
        .lte('start_date', horizon)
        .order('start_date', { ascending: true })
    : { data: [] };

  const closures: PlanAheadClosure[] = (closureRows ?? []).map((c) => {
    const schoolsRel = c.schools as
      | { name: string | null }
      | Array<{ name: string | null }>
      | null;
    const schoolName = Array.isArray(schoolsRel)
      ? schoolsRel[0]?.name ?? null
      : (schoolsRel?.name ?? null);
    return {
      id: c.id as string,
      school_id: c.school_id as string,
      school_name: schoolName,
      name: c.name as string,
      start_date: c.start_date as string,
      end_date: c.end_date as string,
      emoji: c.emoji as string,
    };
  });

  // Existing plans for those closures.
  const { data: planRows } = closures.length
    ? await sb
        .from('user_plans')
        .select('id, closure_id, kid_names, registered')
        .eq('user_id', user.id)
        .in(
          'closure_id',
          closures.map((c) => c.id),
        )
    : { data: [] };

  // kidNames source — localStorage on the client enriches, but we still
  // need a server-side deterministic list for the per-kid chips. Derive
  // "Kid 1" / "Kid 2" labels from ordinal; PlanAheadClient will swap in
  // real names at mount via the same so-kids localStorage pattern used
  // by the wizard.
  const kidLabels = kids.map((k) => ({
    id: k.id,
    age_range: k.age_range,
    ordinal: k.ordinal,
    school_id: k.school_id,
    fallback_name: `Kid ${k.ordinal + 1}`,
  }));

  const plans = (planRows ?? []).map((p) => ({
    plan_id: p.id as string,
    closure_id: p.closure_id as string,
    kid_names: (p.kid_names as string[]) ?? [],
    registered: (p.registered as boolean) ?? false,
  }));

  return (
    <PlanAheadClient
      locale={locale}
      closures={closures}
      kids={kidLabels}
      plans={plans}
    />
  );
}
