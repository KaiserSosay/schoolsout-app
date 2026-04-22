import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/reminders/stats
// Email engagement slice:
//   - subscriptions total, by school, by age range
//   - sends aggregated to last-30-days daily bars (sent/opened/clicked)

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildLast30Buckets(): Map<string, { sent: number; opened: number; clicked: number }> {
  const m = new Map<string, { sent: number; opened: number; clicked: number }>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    m.set(d.toISOString().slice(0, 10), { sent: 0, opened: 0, clicked: 0 });
  }
  return m;
}

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = createServiceSupabase();

  const [subsResp, sendsResp, schoolsResp] = await Promise.all([
    db
      .from('reminder_subscriptions')
      .select('id, user_id, school_id, age_range, enabled')
      .eq('enabled', true),
    db.from('reminder_sends').select('sent_at, opened_at, clicked_at'),
    db.from('schools').select('id, name'),
  ]);

  const subs = subsResp.data ?? [];
  const schools = new Map<string, string>();
  for (const s of (schoolsResp.data ?? []) as { id: string; name: string }[]) {
    schools.set(s.id, s.name);
  }

  const bySchool = new Map<string, number>();
  const byAgeRange: Record<string, number> = {};
  for (const s of subs as { school_id: string; age_range: string }[]) {
    bySchool.set(s.school_id, (bySchool.get(s.school_id) ?? 0) + 1);
    byAgeRange[s.age_range] = (byAgeRange[s.age_range] ?? 0) + 1;
  }
  const bySchoolList = Array.from(bySchool.entries())
    .map(([school_id, count]) => ({
      school_id,
      school_name: schools.get(school_id) ?? '(unknown)',
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const buckets = buildLast30Buckets();
  const d30ms = Date.now() - 30 * 24 * 3600 * 1000;
  let totalSent = 0;
  for (const s of (sendsResp.data ?? []) as {
    sent_at: string;
    opened_at: string | null;
    clicked_at: string | null;
  }[]) {
    totalSent += 1;
    const t = Date.parse(s.sent_at);
    if (!Number.isFinite(t) || t < d30ms) continue;
    const k = dayKey(s.sent_at);
    const b = buckets.get(k);
    if (!b) continue;
    b.sent += 1;
    if (s.opened_at) b.opened += 1;
    if (s.clicked_at) b.clicked += 1;
  }

  const byDayLast30 = Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    ...b,
  }));

  return NextResponse.json({
    subscriptions: {
      total: subs.length,
      bySchool: bySchoolList,
      byAgeRange,
    },
    sends: {
      total: totalSent,
      byDayLast30,
    },
  });
}
