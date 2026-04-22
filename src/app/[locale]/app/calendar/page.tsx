import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { CalendarSections } from '@/components/app/CalendarSections';
import { ExportCalendarButton } from '@/components/app/ExportCalendarButton';

export const dynamic = 'force-dynamic';

type SchoolRow = { id: string; name: string };
type ClosureRow = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: 'verified' | 'ai_draft' | 'rejected' | 'archived';
};

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.calendar' });

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // User's schools via their kid_profiles
  let userSchoolIds = new Set<string>();
  if (user) {
    const { data: profiles } = await sb
      .from('kid_profiles')
      .select('school_id')
      .eq('user_id', user.id);
    userSchoolIds = new Set(
      (profiles ?? []).map((p) => (p as { school_id: string }).school_id),
    );
  }

  // All schools + closures (service role: public reads)
  const svc = createServiceSupabase();
  const [schoolsResp, closuresResp] = await Promise.all([
    svc.from('schools').select('id, name').order('name'),
    svc
      .from('closures')
      .select('id, school_id, name, start_date, end_date, emoji, status')
      .in('status', ['verified', 'ai_draft'])
      .gte('start_date', new Date().toISOString().slice(0, 10))
      .order('start_date'),
  ]);

  const schools = (schoolsResp.data ?? []) as SchoolRow[];
  const closures = (closuresResp.data ?? []) as ClosureRow[];

  const bySchool = new Map<string, ClosureRow[]>();
  for (const c of closures) {
    const list = bySchool.get(c.school_id) ?? [];
    list.push(c);
    bySchool.set(c.school_id, list);
  }

  const sections = schools.map((s) => ({
    schoolId: s.id,
    schoolName: s.name,
    isUserSchool: userSchoolIds.has(s.id),
    closures: bySchool.get(s.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          {t('eyebrow')}
        </div>
        <h1
          className="mt-1 text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
      </header>

      <CalendarSections sections={sections} locale={locale} />

      <div className="mt-8 flex justify-center">
        <ExportCalendarButton />
      </div>
    </div>
  );
}
