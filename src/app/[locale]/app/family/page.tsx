import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { FamilyClient, type FamilyKid, type FamilyClosure } from '@/components/app/FamilyClient';

export const dynamic = 'force-dynamic';

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}`);

  const { data: profiles } = await supabase
    .from('kid_profiles')
    .select(
      'id, school_id, age_range, ordinal, birth_month, birth_year, schools(id, name, district, type, calendar_status)',
    )
    .eq('user_id', user.id)
    .order('ordinal');

  const kids: FamilyKid[] = (profiles ?? []).map((p) => {
    const schoolObj = Array.isArray(p.schools)
      ? (p.schools[0] as { id: string; name: string; district: string; type: string; calendar_status: string } | undefined)
      : (p.schools as { id: string; name: string; district: string; type: string; calendar_status: string } | null);
    return {
      id: p.id as string,
      ordinal: p.ordinal as number,
      age_range: p.age_range as FamilyKid['age_range'],
      school_id: p.school_id as string,
      school_name: schoolObj?.name ?? '',
      school_district: schoolObj?.district ?? '',
      calendar_status: (schoolObj?.calendar_status ?? 'needs_research') as FamilyKid['calendar_status'],
      birth_month: (p.birth_month as number | null) ?? null,
      birth_year: (p.birth_year as number | null) ?? null,
    };
  });

  const schoolIds = Array.from(new Set(kids.map((k) => k.school_id).filter(Boolean)));
  const today = new Date().toISOString().slice(0, 10);
  let closures: FamilyClosure[] = [];
  if (schoolIds.length) {
    const { data } = await supabase
      .from('closures')
      .select('id, school_id, name, start_date, end_date, emoji')
      .in('school_id', schoolIds)
      .eq('status', 'verified')
      .gte('start_date', today)
      .order('start_date', { ascending: true });
    closures = (data ?? []) as FamilyClosure[];
  }

  return <FamilyClient locale={locale} kids={kids} closures={closures} />;
}
