import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { CalendarSections } from '@/components/app/CalendarSections';
import { ExportCalendarButton } from '@/components/app/ExportCalendarButton';
import { AppPageHeader } from '@/components/app/AppPageHeader';
import { ListOrCalendarSwitch } from '@/components/calendar/ListOrCalendarSwitch';
import type { CalendarClosure, CalendarKid } from '@/lib/calendar/types';

export const dynamic = 'force-dynamic';

import type { SchoolStatus } from '@/lib/school-status';

type SchoolRow = {
  id: string;
  name: string;
  calendar_status: SchoolStatus;
};
type ClosureRow = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: 'verified' | 'ai_draft' | 'rejected';
  closure_type?: string | null;
};

type KidProfileRow = {
  id: string;
  school_id: string;
  ordinal: number;
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

  // User's schools via their kid_profiles. Phase 5.0 calendar view also
  // needs the per-kid ordinal so the new month-grid can color-code dots.
  let userSchoolIds = new Set<string>();
  let kidProfiles: KidProfileRow[] = [];
  if (user) {
    const { data: profiles } = await sb
      .from('kid_profiles')
      .select('id, school_id, ordinal')
      .eq('user_id', user.id)
      .order('ordinal');
    kidProfiles = (profiles ?? []) as KidProfileRow[];
    userSchoolIds = new Set(kidProfiles.map((p) => p.school_id));
  }

  // All schools + closures (service role: public reads)
  const svc = createServiceSupabase();
  // Schema-defensive: try the rich select that includes closure_type
  // (migration 063), fall back to the lean select on un-migrated DBs.
  const today = new Date().toISOString().slice(0, 10);
  const [schoolsResp, richClosuresResp] = await Promise.all([
    svc.from('schools').select('id, name, calendar_status').order('name'),
    svc
      .from('closures')
      .select('id, school_id, name, start_date, end_date, emoji, status, closure_type')
      .eq('status', 'verified')
      .gte('end_date', today)
      .order('start_date'),
  ]);
  let closuresData: ClosureRow[] | null = (richClosuresResp.data ?? null) as ClosureRow[] | null;
  if (richClosuresResp.error) {
    const lean = await svc
      .from('closures')
      .select('id, school_id, name, start_date, end_date, emoji, status')
      .eq('status', 'verified')
      .gte('end_date', today)
      .order('start_date');
    closuresData = (lean.data ?? null) as ClosureRow[] | null;
  }

  const schools = (schoolsResp.data ?? []) as SchoolRow[];
  const closures = (closuresData ?? []) as ClosureRow[];

  const bySchool = new Map<string, ClosureRow[]>();
  for (const c of closures) {
    const list = bySchool.get(c.school_id) ?? [];
    list.push(c);
    bySchool.set(c.school_id, list);
  }

  const sections = schools.map((s) => ({
    schoolId: s.id,
    schoolName: s.name,
    calendarStatus: s.calendar_status,
    isUserSchool: userSchoolIds.has(s.id),
    closures: bySchool.get(s.id) ?? [],
  }));

  // Calendar-view payload — flatten the per-school closures into a
  // single CalendarClosure[] with school_name attached so the day-detail
  // sheet can show "Affects: …" labels.
  const schoolNameById = new Map<string, string>();
  for (const s of schools) schoolNameById.set(s.id, s.name);
  const calendarClosures: CalendarClosure[] = closures.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
    closure_type: (c.closure_type as CalendarClosure['closure_type']) ?? null,
    school_id: c.school_id,
    school_name: schoolNameById.get(c.school_id) ?? null,
  }));

  // CalendarKid[] for the per-kid dot/filter row. We only show kids
  // whose school is in the schools list (defensive against orphaned
  // kid_profiles that point to a school we don't know about anymore).
  const calendarKids: CalendarKid[] = kidProfiles
    .filter((k) => schoolNameById.has(k.school_id))
    .map((k) => ({
      id: k.id,
      ordinal: k.ordinal,
      schoolId: k.school_id,
      schoolName: schoolNameById.get(k.school_id) ?? '',
      displayInitial: null,
    }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <AppPageHeader eyebrow={t('eyebrow')} title={t('title')} />

      <ListOrCalendarSwitch
        defaultView="calendar"
        locale={locale}
        initialToday={today}
        closures={calendarClosures}
        kids={calendarKids}
        listChildren={<CalendarSections sections={sections} locale={locale} />}
      />

      <div className="mt-8 flex justify-center">
        <ExportCalendarButton />
      </div>
    </div>
  );
}
