import Link from 'next/link';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

// DECISION: Fetch metrics server-side rather than hitting our own /api/admin/metrics
// via HTTP — we already have an auth guard at the layout level and a service
// client here. No network hop, no self-fetch quirks, faster first paint.

type Metrics = {
  generatedAt: string;
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    last7DaysByDay: Array<{ date: string; count: number }>;
  };
  kidProfiles: {
    total: number;
    byAgeRange: Record<string, number>;
  };
  reminders: {
    activeSubscriptions: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRatePct: number;
    clickRatePct: number;
  };
  schools: {
    total: number;
    verifiedCurrent: number;
    verifiedMultiYear: number;
    needsResearch: number;
    aiDraft: number;
    unavailable: number;
  };
  camps: {
    total: number;
    verified: number;
    logisticsVerified: number;
    launchPartners: number;
    featured: number;
  };
  campApplications: { pending: number; approved: number; rejected: number };
  savedCamps: number;
  campClicks: { total: number; last7Days: number; last30Days: number };
  cityRequests: {
    total: number;
    topCities: Array<{ city: string; count: number }>;
  };
  mrr: { cents: number; note: string };
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function fetchMetrics(): Promise<Metrics> {
  const db = createServiceSupabase();
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const [
    usersTotal,
    usersNew7,
    usersNew30,
    usersRecent,
    kidRows,
    subsTotal,
    sendsAgg,
    schoolRows,
    campRows,
    appRows,
    savedCampsCount,
    clicksTotal,
    clicks7,
    clicks30,
    cityRows,
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', d7.toISOString()),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', d30.toISOString()),
    db.from('users').select('id, created_at').gte('created_at', d7.toISOString()),
    db.from('kid_profiles').select('age_range'),
    db.from('reminder_subscriptions').select('*', { count: 'exact', head: true }).eq('enabled', true),
    db.from('reminder_sends').select('opened_at, clicked_at'),
    db.from('schools').select('calendar_status'),
    db.from('camps').select('verified, logistics_verified, is_launch_partner, is_featured'),
    db.from('camp_applications').select('status'),
    db.from('saved_camps').select('*', { count: 'exact', head: true }),
    db.from('camp_clicks').select('*', { count: 'exact', head: true }),
    db.from('camp_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', d7.toISOString()),
    db.from('camp_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', d30.toISOString()),
    db.from('city_requests').select('city'),
  ]);

  const byDayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) byDayMap.set(dayKey(daysAgo(i)), 0);
  for (const row of usersRecent.data ?? []) {
    const k = (row.created_at as string).slice(0, 10);
    if (byDayMap.has(k)) byDayMap.set(k, (byDayMap.get(k) ?? 0) + 1);
  }

  const byAge: Record<string, number> = { '4-6': 0, '7-9': 0, '10-12': 0, '13+': 0 };
  for (const row of kidRows.data ?? []) {
    const k = row.age_range as string;
    if (k in byAge) byAge[k] += 1;
  }

  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  for (const s of sendsAgg.data ?? []) {
    totalSent += 1;
    if (s.opened_at) totalOpened += 1;
    if (s.clicked_at) totalClicked += 1;
  }

  const schoolBuckets = {
    total: 0,
    verifiedCurrent: 0,
    verifiedMultiYear: 0,
    needsResearch: 0,
    aiDraft: 0,
    unavailable: 0,
  };
  for (const s of schoolRows.data ?? []) {
    schoolBuckets.total += 1;
    const status = s.calendar_status as string;
    if (status === 'verified_current') schoolBuckets.verifiedCurrent += 1;
    else if (status === 'verified_multi_year') schoolBuckets.verifiedMultiYear += 1;
    else if (status === 'needs_research') schoolBuckets.needsResearch += 1;
    else if (status === 'ai_draft') schoolBuckets.aiDraft += 1;
    else if (status === 'unavailable') schoolBuckets.unavailable += 1;
  }

  const campBuckets = { total: 0, verified: 0, logisticsVerified: 0, launchPartners: 0, featured: 0 };
  for (const c of campRows.data ?? []) {
    campBuckets.total += 1;
    if (c.verified) campBuckets.verified += 1;
    if (c.logistics_verified) campBuckets.logisticsVerified += 1;
    if (c.is_launch_partner) campBuckets.launchPartners += 1;
    if (c.is_featured) campBuckets.featured += 1;
  }

  const appBuckets = { pending: 0, approved: 0, rejected: 0 };
  for (const a of appRows.data ?? []) {
    const s = a.status as keyof typeof appBuckets;
    if (s in appBuckets) appBuckets[s] += 1;
  }

  const cityCounts = new Map<string, number>();
  for (const r of cityRows.data ?? []) {
    const c = (r.city as string).trim();
    if (!c) continue;
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: usersTotal.count ?? 0,
      newLast7Days: usersNew7.count ?? 0,
      newLast30Days: usersNew30.count ?? 0,
      last7DaysByDay: Array.from(byDayMap.entries()).map(([date, count]) => ({ date, count })),
    },
    kidProfiles: { total: kidRows.data?.length ?? 0, byAgeRange: byAge },
    reminders: {
      activeSubscriptions: subsTotal.count ?? 0,
      totalSent,
      totalOpened,
      totalClicked,
      openRatePct: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
      clickRatePct: totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0,
    },
    schools: schoolBuckets,
    camps: campBuckets,
    campApplications: appBuckets,
    savedCamps: savedCampsCount.count ?? 0,
    campClicks: {
      total: clicksTotal.count ?? 0,
      last7Days: clicks7.count ?? 0,
      last30Days: clicks30.count ?? 0,
    },
    cityRequests: { total: cityRows.data?.length ?? 0, topCities },
    mrr: {
      cents: 0,
      note: 'Revenue launches when Featured listings unlock at 1,000 MAU (per v3.1 PRD §7).',
    },
  };
}

// Small editorial KPI card
function Card({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'neutral' | 'alert';
}) {
  return (
    <div className="rounded-2xl border border-cream-border bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p
        className={
          'mt-1 text-2xl font-black ' + (tone === 'alert' ? 'text-red-600' : 'text-ink')
        }
        style={{ letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs font-bold text-muted">{sub}</p> : null}
    </div>
  );
}

function Bar({ pct, label, count }: { pct: number; label: string; count: number }) {
  const width = Math.max(1, Math.min(100, pct));
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] font-bold text-muted">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-cream-border">
        <span
          className="block h-full rounded-full bg-brand-purple"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-10 text-right text-[11px] font-black text-ink tabular-nums">{count}</span>
    </div>
  );
}

function SignupChart({ days }: { days: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex h-24 items-end gap-2">
      {days.map((d) => {
        const h = Math.max(2, Math.round((d.count / max) * 90));
        const label = new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', {
          weekday: 'short',
        });
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-black text-ink tabular-nums">{d.count}</span>
            <span
              className="w-full rounded-t-md bg-brand-purple/80"
              style={{ height: `${h}%` }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="text-[10px] font-bold text-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const m = await fetchMetrics();

  const ageRangeTotal =
    m.kidProfiles.byAgeRange['4-6'] +
    m.kidProfiles.byAgeRange['7-9'] +
    m.kidProfiles.byAgeRange['10-12'] +
    m.kidProfiles.byAgeRange['13+'];
  const pct = (n: number) => (ageRangeTotal === 0 ? 0 : (n / ageRangeTotal) * 100);

  const adminEmail = (env.ADMIN_EMAILS || '').split(',')[0] || '—';

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-ink">Overview</h2>
            <p className="text-xs font-bold text-muted">
              As of{' '}
              {new Date(m.generatedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              · {adminEmail}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card
            label="Users"
            value={m.users.total.toLocaleString()}
            sub={`+${m.users.newLast7Days} this week · +${m.users.newLast30Days} last 30d`}
          />
          <Card
            label="Kid profiles"
            value={m.kidProfiles.total.toLocaleString()}
            sub={`4-6: ${m.kidProfiles.byAgeRange['4-6']} · 7-9: ${m.kidProfiles.byAgeRange['7-9']} · 10-12: ${m.kidProfiles.byAgeRange['10-12']} · 13+: ${m.kidProfiles.byAgeRange['13+']}`}
          />
          <Card
            label="Reminder subs"
            value={m.reminders.activeSubscriptions.toLocaleString()}
            sub={`Open ${m.reminders.openRatePct}% · Click ${m.reminders.clickRatePct}%`}
          />
          <Card
            label="Emails sent (all-time)"
            value={m.reminders.totalSent.toLocaleString()}
            sub={`${m.reminders.totalOpened} opened · ${m.reminders.totalClicked} clicked`}
          />
          <Card
            label="Schools"
            value={`${m.schools.verifiedCurrent + m.schools.verifiedMultiYear} / ${m.schools.total}`}
            sub={`${m.schools.needsResearch} need research · ${m.schools.aiDraft} AI draft`}
          />
          <Card
            label="Camps"
            value={m.camps.total.toLocaleString()}
            sub={`${m.camps.logisticsVerified} logistics · ${m.camps.launchPartners} launch partners`}
          />
          <Card
            label="Camp applications"
            value={m.campApplications.pending}
            sub={`${m.campApplications.approved} approved · ${m.campApplications.rejected} rejected`}
            tone={m.campApplications.pending > 0 ? 'alert' : 'neutral'}
          />
          <Card
            label="Clicks (since Apr 22, 2026)"
            value={m.campClicks.last30Days.toLocaleString()}
            sub={`last 7d: ${m.campClicks.last7Days} · all-time: ${m.campClicks.total}`}
          />
          <Card
            label="Saved camps"
            value={m.savedCamps.toLocaleString()}
            sub="parent wishlists"
          />
          <Card
            label="City requests"
            value={m.cityRequests.total.toLocaleString()}
            sub={
              m.cityRequests.topCities[0]
                ? `top: ${m.cityRequests.topCities[0].city} (${m.cityRequests.topCities[0].count})`
                : 'no requests yet'
            }
          />
          <Card
            label="MRR"
            value={'$0'}
            sub="Revenue launches when Featured listings unlock at 1,000 MAU (per v3.1 PRD §7)."
          />
          <Card
            label="Featured listings"
            value={m.camps.featured}
            sub="none are paid yet — tier unlocks at 1,000 MAU"
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-cream-border bg-white p-5">
          <h3 className="text-sm font-black text-ink">New signups · last 7 days</h3>
          <p className="text-xs font-bold text-muted">
            Total: {m.users.newLast7Days}
          </p>
          <div className="mt-4">
            <SignupChart days={m.users.last7DaysByDay} />
          </div>
        </div>
        <div className="rounded-2xl border border-cream-border bg-white p-5">
          <h3 className="text-sm font-black text-ink">Age-range distribution</h3>
          <p className="text-xs font-bold text-muted">
            Across all {m.kidProfiles.total} kid profiles. No names or grades stored server-side.
          </p>
          <div className="mt-4 space-y-2">
            <Bar label="4-6" count={m.kidProfiles.byAgeRange['4-6']} pct={pct(m.kidProfiles.byAgeRange['4-6'])} />
            <Bar label="7-9" count={m.kidProfiles.byAgeRange['7-9']} pct={pct(m.kidProfiles.byAgeRange['7-9'])} />
            <Bar label="10-12" count={m.kidProfiles.byAgeRange['10-12']} pct={pct(m.kidProfiles.byAgeRange['10-12'])} />
            <Bar label="13+" count={m.kidProfiles.byAgeRange['13+']} pct={pct(m.kidProfiles.byAgeRange['13+'])} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-black text-ink">Next actions</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Link
            href={`/${locale}/admin/camp-applications`}
            className="group rounded-2xl border border-cream-border bg-white p-4 transition-colors hover:border-brand-purple"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-muted">Approvals</p>
            <p className="mt-1 text-xl font-black text-ink">
              {m.campApplications.pending} camp application{m.campApplications.pending === 1 ? '' : 's'} waiting
            </p>
            <p className="mt-1 text-xs font-bold text-brand-purple">Review now →</p>
          </Link>
          <Link
            href={`/${locale}/admin/calendar-review`}
            className="group rounded-2xl border border-cream-border bg-white p-4 transition-colors hover:border-brand-purple"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-muted">Calendar</p>
            <p className="mt-1 text-xl font-black text-ink">
              {m.schools.needsResearch + m.schools.aiDraft} school{m.schools.needsResearch + m.schools.aiDraft === 1 ? '' : 's'} need review
            </p>
            <p className="mt-1 text-xs font-bold text-brand-purple">Open calendar review →</p>
          </Link>
          <Link
            href={`/${locale}/admin/camps`}
            className="group rounded-2xl border border-cream-border bg-white p-4 transition-colors hover:border-brand-purple"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-muted">Camps</p>
            <p className="mt-1 text-xl font-black text-ink">
              {m.camps.total - m.camps.logisticsVerified} camp{m.camps.total - m.camps.logisticsVerified === 1 ? '' : 's'} need logistics
            </p>
            <p className="mt-1 text-xs font-bold text-brand-purple">Edit catalog →</p>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-cream-border bg-cream/50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-purple">
          Honest data
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
          <li>
            MRR is $0. Stripe is not connected. Featured tier unlocks at 1,000 MAU or 500 reminder subscribers per v3.1 PRD §7.
          </li>
          <li>
            Click tracking started April 22, 2026. Historical clicks are genuinely zero.
          </li>
          <li>
            Kid profiles server-side store only <code>age_range</code> + <code>school_id</code>. Names and grades live client-side per COPPA.
          </li>
          <li>
            Categories are aggregated from <code>camps.categories[]</code>. No separate categories table.
          </li>
        </ul>
      </section>
    </div>
  );
}
