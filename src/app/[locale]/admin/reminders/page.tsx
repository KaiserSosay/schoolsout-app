import { createServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type SubRow = {
  school_id: string;
  age_range: string;
};

type SchoolRow = { id: string; name: string };

type SendRow = {
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
};

function buildLast30(): Map<string, { sent: number; opened: number; clicked: number }> {
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

export default async function AdminRemindersPage() {
  const db = createServiceSupabase();
  const [subsResp, sendsResp, schoolsResp] = await Promise.all([
    db
      .from('reminder_subscriptions')
      .select('school_id, age_range, enabled')
      .eq('enabled', true),
    db.from('reminder_sends').select('sent_at, opened_at, clicked_at'),
    db.from('schools').select('id, name'),
  ]);

  const subs = (subsResp.data ?? []) as SubRow[];
  const sends = (sendsResp.data ?? []) as SendRow[];
  const schools = new Map<string, string>();
  for (const s of (schoolsResp.data ?? []) as SchoolRow[]) schools.set(s.id, s.name);

  const bySchool = new Map<string, number>();
  const byAgeRange: Record<string, number> = {};
  for (const s of subs) {
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

  const buckets = buildLast30();
  const d30ms = Date.now() - 30 * 24 * 3600 * 1000;
  for (const s of sends) {
    const t = Date.parse(s.sent_at);
    if (!Number.isFinite(t) || t < d30ms) continue;
    const k = s.sent_at.slice(0, 10);
    const b = buckets.get(k);
    if (!b) continue;
    b.sent += 1;
    if (s.opened_at) b.opened += 1;
    if (s.clicked_at) b.clicked += 1;
  }
  const daily = Array.from(buckets.entries()).map(([date, b]) => ({ date, ...b }));
  const maxBar = Math.max(1, ...daily.map((d) => d.sent));

  const totalSent = sends.length;
  const totalOpened = sends.filter((s) => s.opened_at).length;
  const totalClicked = sends.filter((s) => s.clicked_at).length;
  const openPct = totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0;
  const clickPct = totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-ink">Reminders</h2>
        <p className="text-xs font-bold text-muted">
          Active subscriptions + 30-day send/open/click timeline.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Active subscriptions" value={subs.length.toLocaleString()} />
        <Stat label="Sent all-time" value={totalSent.toLocaleString()} />
        <Stat label="Open rate" value={`${openPct}%`} />
        <Stat label="Click rate" value={`${clickPct}%`} />
      </section>

      <section className="rounded-2xl border border-cream-border bg-white p-5">
        <h3 className="text-sm font-black text-ink">Subscriptions by school</h3>
        <table className="mt-3 w-full text-xs">
          <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
            <tr className="border-b border-cream-border">
              <th className="p-2">School</th>
              <th className="p-2 text-right">Active subs</th>
            </tr>
          </thead>
          <tbody>
            {bySchoolList.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-3 text-center text-muted">
                  No subscriptions yet.
                </td>
              </tr>
            ) : null}
            {bySchoolList.map((s) => (
              <tr key={s.school_id} className="border-b border-cream-border">
                <td className="p-2 text-ink">{s.school_name}</td>
                <td className="p-2 text-right font-bold text-ink">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-cream-border bg-white p-5">
        <h3 className="text-sm font-black text-ink">Subscriptions by age range</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(byAgeRange).length === 0 ? (
            <p className="text-xs text-muted">No data yet.</p>
          ) : null}
          {Object.entries(byAgeRange).map(([age, count]) => (
            <span
              key={age}
              className="rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-black text-brand-purple"
            >
              {age}: {count}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cream-border bg-white p-5">
        <h3 className="text-sm font-black text-ink">Last 30 days — sent / opened / clicked</h3>
        <p className="text-xs font-bold text-muted">
          Three bars per day. CSS only — no chart library.
        </p>
        <div className="mt-4 flex h-48 items-end gap-1">
          {daily.map((d) => {
            const sh = (d.sent / maxBar) * 100;
            const oh = (d.opened / maxBar) * 100;
            const ch = (d.clicked / maxBar) * 100;
            return (
              <div key={d.date} className="flex flex-1 min-w-0 flex-col items-center justify-end gap-0.5">
                <div
                  className="flex w-full items-end justify-center gap-0.5"
                  style={{ height: '100%' }}
                  title={`${d.date} · sent ${d.sent} · opened ${d.opened} · clicked ${d.clicked}`}
                >
                  <span className="block w-1/3 rounded-t bg-brand-purple/80" style={{ height: `${sh}%` }} />
                  <span className="block w-1/3 rounded-t bg-emerald-500/70" style={{ height: `${oh}%` }} />
                  <span className="block w-1/3 rounded-t bg-gold" style={{ height: `${ch}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-3 text-[10px] font-bold text-muted">
          <span><span className="inline-block h-2 w-3 align-middle bg-brand-purple/80" /> sent</span>
          <span><span className="inline-block h-2 w-3 align-middle bg-emerald-500/70" /> opened</span>
          <span><span className="inline-block h-2 w-3 align-middle bg-gold" /> clicked</span>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cream-border bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  );
}
