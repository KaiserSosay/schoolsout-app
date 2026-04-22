import { createServiceSupabase } from '@/lib/supabase/service';
import { CalendarReviewClient } from '@/components/admin/CalendarReviewClient';
import type { SchoolStatus } from '@/lib/school-status';

export const dynamic = 'force-dynamic';

type SchoolRow = {
  id: string;
  name: string;
  district: string;
  calendar_status: SchoolStatus;
};

type ClosureRow = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: 'ai_draft' | 'verified' | 'rejected';
  source: string;
};

export default async function CalendarReviewPage() {
  const db = createServiceSupabase();
  const [schoolsResp, closuresResp] = await Promise.all([
    db
      .from('schools')
      .select('id, name, district, calendar_status')
      .order('calendar_status', { ascending: true })
      .order('name', { ascending: true }),
    db
      .from('closures')
      .select('id, school_id, name, start_date, end_date, emoji, status, source')
      .order('start_date'),
  ]);

  const schools = (schoolsResp.data ?? []) as SchoolRow[];
  const closures = (closuresResp.data ?? []) as ClosureRow[];

  const draftsBySchool = new Map<string, ClosureRow[]>();
  const verifiedCountBySchool = new Map<string, number>();
  for (const c of closures) {
    if (c.status === 'ai_draft') {
      const arr = draftsBySchool.get(c.school_id) ?? [];
      arr.push(c);
      draftsBySchool.set(c.school_id, arr);
    } else if (c.status === 'verified') {
      verifiedCountBySchool.set(
        c.school_id,
        (verifiedCountBySchool.get(c.school_id) ?? 0) + 1,
      );
    }
  }

  const blocks = schools.map((s) => ({
    id: s.id,
    name: s.name,
    district: s.district,
    calendar_status: s.calendar_status,
    drafts: draftsBySchool.get(s.id) ?? [],
    verifiedCount: verifiedCountBySchool.get(s.id) ?? 0,
  }));

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Calendar review</h2>
        <p className="mt-1 text-sm text-muted">
          Approve or reject AI draft closures. Each school&apos;s status badge
          reflects what parents see. Manually added closures always land as
          <code className="mx-1 rounded bg-cream px-1 text-xs">verified</code>.
        </p>
      </div>
      <CalendarReviewClient schools={blocks} />
    </div>
  );
}
