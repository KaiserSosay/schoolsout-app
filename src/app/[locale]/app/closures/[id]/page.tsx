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
    .select('id, slug, name, ages_min, ages_max, price_tier, categories, neighborhood, verified')
    .lte('ages_min', wantMax)
    .gte('ages_max', wantMin)
    .order('is_featured', { ascending: false })
    .limit(3);

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
      camps={matchingCamps ?? []}
    />
  );
}
