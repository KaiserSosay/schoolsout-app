import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { ClosureDetailView } from '@/components/app/ClosureDetailView';

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

  const { data: matchingCamps } = await admin
    .from('camps')
    .select('id, slug, name, ages_min, ages_max, price_tier, categories, neighborhood, verified, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, logistics_verified, phone')
    .lte('ages_min', wantMax)
    .gte('ages_max', wantMin)
    .order('is_featured', { ascending: false })
    .limit(12);

  // DECISION: We fetch a broader pool (up to 12) then split into
  // session-overlap vs age-only-fallback. Age-only matches carry a
  // sessions_unknown flag so the UI can disclose "call camp to confirm".
  const campIds = (matchingCamps ?? []).map((c) => c.id);
  const { data: sessions } = campIds.length
    ? await admin
        .from('camp_sessions')
        .select('id, camp_id, start_date, end_date')
        .in('camp_id', campIds)
    : { data: [] as Array<{ id: string; camp_id: string; start_date: string; end_date: string }> };

  const sessionsByCamp: Record<string, Array<{ start_date: string; end_date: string }>> = {};
  for (const s of sessions ?? []) {
    const arr = sessionsByCamp[s.camp_id] ?? [];
    arr.push({ start_date: s.start_date, end_date: s.end_date });
    sessionsByCamp[s.camp_id] = arr;
  }

  const annotatedCamps = (matchingCamps ?? []).map((c) => {
    const sList = sessionsByCamp[c.id] ?? [];
    if (sList.length === 0) {
      return { ...c, sessions_unknown: true, session_match: false };
    }
    const hit = sList.some(
      (s) => s.start_date <= closure.end_date && s.end_date >= closure.start_date,
    );
    return { ...c, sessions_unknown: false, session_match: hit };
  });

  // Keep camps with no sessions OR a session overlap; cap at 3 for display.
  const displayCamps = annotatedCamps
    .filter((c) => c.sessions_unknown || c.session_match)
    .slice(0, 3);

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
      }}
      camps={displayCamps}
    />
  );
}
