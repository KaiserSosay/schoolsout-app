import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { AdminPillStrip } from '@/components/admin/AdminPillStrip';
import { computePillCounts } from '@/lib/admin/pill-counts';
import { AdminTabsNav } from '@/components/admin/AdminTabsNav';
import {
  FeatureRequestsPanel,
  type AdminFeatureRequest,
} from '@/components/admin/FeatureRequestsPanel';
import {
  CampRequestsPanel,
  type AdminCampRequest,
} from '@/components/admin/CampRequestsPanel';
import { CalendarReviewClient } from '@/components/admin/CalendarReviewClient';
import {
  CalendarSubmissionsPanel,
  type AdminCalendarSubmission,
} from '@/components/admin/CalendarSubmissionsPanel';
import {
  NotifySubscribersPanel,
  type PendingSchoolBlock,
} from '@/components/admin/NotifySubscribersPanel';
import {
  EnrichmentPanel,
  type EnrichmentCamp,
} from '@/components/admin/EnrichmentPanel';
import { UsersClient, type AdminUserRow } from '@/components/admin/UsersClient';
import {
  SchoolRequestsPanel,
  type AdminSchoolRequest,
  type SchoolOption,
} from '@/components/admin/SchoolRequestsPanel';
import {
  DataQualityPanel,
  type DataQualityData,
  type DataQualityCamp,
} from '@/components/admin/DataQualityPanel';
import type { SchoolStatus } from '@/lib/school-status';

export const dynamic = 'force-dynamic';

const VALID_TABS = [
  'feature-requests',
  'camp-requests',
  'calendar-reviews',
  'calendar-submissions',
  'enrichment',
  'integrity',
  'school-requests',
  'data-quality',
  'users',
] as const;
type Tab = (typeof VALID_TABS)[number];

function normalizeTab(raw: string | undefined): Tab {
  return (VALID_TABS as readonly string[]).includes(raw ?? '')
    ? (raw as Tab)
    : 'feature-requests';
}

async function loadSchoolRequests(): Promise<AdminSchoolRequest[]> {
  const db = createServiceSupabase();
  try {
    const { data } = await db
      .from('school_requests')
      .select(
        'id, user_id, requested_name, city, notes, status, reviewed_by, reviewed_at, linked_school_id, created_at, users(display_name, email)',
      )
      .order('created_at', { ascending: false })
      .limit(100);
    const rows = (data ?? []) as unknown as Array<
      Omit<AdminSchoolRequest, 'users'> & {
        users:
          | { display_name: string | null; email: string | null }
          | Array<{ display_name: string | null; email: string | null }>
          | null;
      }
    >;
    return rows.map((r) => ({
      ...r,
      users: Array.isArray(r.users) ? (r.users[0] ?? null) : r.users,
    }));
  } catch {
    // Migration 028 not yet applied — render empty state.
    return [];
  }
}

async function loadSchoolOptions(): Promise<SchoolOption[]> {
  const db = createServiceSupabase();
  const { data } = await db
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true })
    .limit(2000);
  return (data ?? []) as SchoolOption[];
}

// --- Per-tab data fetchers ---------------------------------------------------
async function loadFeatureRequests(): Promise<AdminFeatureRequest[]> {
  const db = createServiceSupabase();
  const { data } = await db
    .from('feature_requests')
    .select(
      'id, user_id, email, category, body, page_path, locale, status, admin_response, admin_responded_at, created_at, users(display_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Array<
    Omit<AdminFeatureRequest, 'users'> & {
      users:
        | { display_name: string | null; email: string | null }
        | Array<{ display_name: string | null; email: string | null }>
        | null;
    }
  >;
  return rows.map((r) => ({
    ...r,
    users: Array.isArray(r.users) ? (r.users[0] ?? null) : r.users,
  }));
}

async function loadCampRequests(): Promise<AdminCampRequest[]> {
  const db = createServiceSupabase();
  const { data } = await db
    .from('camp_applications')
    .select(
      'id, camp_name, website, ages, neighborhood, email, status, created_at, reviewed_at, notes, submitted_by_email, submitted_by_name, business_name, phone, address, age_min, age_max, description, categories, price_min_cents, price_max_cents, admin_notes, linked_camp_id, stripe_customer_id, stripe_subscription_id',
    )
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100);
  return (data ?? []) as AdminCampRequest[];
}

// Round-3 notify-subscribers panel data. Lists every school with at least
// one school_calendar_notifications row whose notified_at IS NULL, so the
// admin can see who is waiting before the calendar even flips. Schema-
// defensive — if migration 033 hasn't shipped, returns empty.
async function loadPendingNotifySchools(): Promise<PendingSchoolBlock[]> {
  const db = createServiceSupabase();
  try {
    const { data: pending } = await db
      .from('school_calendar_notifications')
      .select('school_id')
      .is('notified_at', null);
    const counts = new Map<string, number>();
    for (const row of (pending ?? []) as Array<{ school_id: string }>) {
      counts.set(row.school_id, (counts.get(row.school_id) ?? 0) + 1);
    }
    if (counts.size === 0) return [];
    const ids = Array.from(counts.keys());
    const { data: schools } = await db
      .from('schools')
      .select('id, slug, name, calendar_status')
      .in('id', ids);
    type S = { id: string; slug: string; name: string; calendar_status: string };
    return ((schools ?? []) as S[]).map((s) => ({
      schoolId: s.id,
      slug: s.slug,
      name: s.name,
      pendingCount: counts.get(s.id) ?? 0,
      calendarStatus: s.calendar_status,
    }));
  } catch {
    return [];
  }
}

async function loadCalendarData() {
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

  const schools = (schoolsResp.data ?? []) as SchoolRow[];
  const closures = (closuresResp.data ?? []) as ClosureRow[];

  const draftsBySchool = new Map<string, ClosureRow[]>();
  const verifiedBySchool = new Map<string, number>();
  for (const c of closures) {
    if (c.status === 'ai_draft') {
      const arr = draftsBySchool.get(c.school_id) ?? [];
      arr.push(c);
      draftsBySchool.set(c.school_id, arr);
    } else if (c.status === 'verified') {
      verifiedBySchool.set(c.school_id, (verifiedBySchool.get(c.school_id) ?? 0) + 1);
    }
  }
  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    district: s.district,
    calendar_status: s.calendar_status,
    drafts: draftsBySchool.get(s.id) ?? [],
    verifiedCount: verifiedBySchool.get(s.id) ?? 0,
  }));
}

// Phase 4.7.1 — public submissions awaiting admin triage. Domain-verified
// rows (school staff) bubble to the top so we can fast-track real-school
// updates. Schema-defensive — if migration 043 hasn't shipped, returns [].
async function loadCalendarSubmissions(): Promise<AdminCalendarSubmission[]> {
  const db = createServiceSupabase();
  try {
    const { data } = await db
      .from('school_calendar_submissions')
      .select(
        'id, school_id, submitter_email, submitter_name, submitter_role, proposed_updates, notes, domain_verified, status, reviewed_by, reviewed_at, review_notes, created_at, schools(slug, name)',
      )
      .order('domain_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    type Row = Omit<AdminCalendarSubmission, 'school'> & {
      schools:
        | { slug: string; name: string }
        | Array<{ slug: string; name: string }>
        | null;
    };
    return ((data ?? []) as unknown as Row[]).map((r) => {
      const s = Array.isArray(r.schools) ? (r.schools[0] ?? null) : r.schools;
      return {
        id: r.id,
        school_id: r.school_id,
        submitter_email: r.submitter_email,
        submitter_name: r.submitter_name,
        submitter_role: r.submitter_role,
        proposed_updates: r.proposed_updates,
        notes: r.notes,
        domain_verified: r.domain_verified,
        status: r.status,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        review_notes: r.review_notes,
        created_at: r.created_at,
        school: s,
      };
    });
  } catch {
    return [];
  }
}

async function loadUsersData() {
  const db = createServiceSupabase();
  const { data: userData, count } = await db
    .from('users')
    .select(
      'id, email, display_name, preferred_language, role, coppa_consent_at, created_at, last_seen_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(0, 49);
  type UserRow = {
    id: string;
    email: string;
    display_name: string | null;
    preferred_language: string;
    role: string;
    coppa_consent_at: string;
    created_at: string;
    last_seen_at: string | null;
  };
  const rows = (userData ?? []) as UserRow[];
  const ids = rows.map((r) => r.id);
  const [kids, subs, saves] = await Promise.all([
    ids.length
      ? db.from('kid_profiles').select('user_id, age_range').in('user_id', ids)
      : Promise.resolve({ data: [] as Array<{ user_id: string; age_range: string }> }),
    ids.length
      ? db
          .from('reminder_subscriptions')
          .select('user_id')
          .in('user_id', ids)
          .eq('enabled', true)
      : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
    ids.length
      ? db.from('saved_camps').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [] as Array<{ user_id: string }> }),
  ]);
  const kidCount = new Map<string, number>();
  const ageRangesByUser = new Map<string, Set<string>>();
  for (const k of (kids.data ?? []) as Array<{ user_id: string; age_range: string }>) {
    kidCount.set(k.user_id, (kidCount.get(k.user_id) ?? 0) + 1);
    const s = ageRangesByUser.get(k.user_id) ?? new Set();
    s.add(k.age_range);
    ageRangesByUser.set(k.user_id, s);
  }
  const reminderCount = new Map<string, number>();
  for (const r of (subs.data ?? []) as Array<{ user_id: string }>) {
    reminderCount.set(r.user_id, (reminderCount.get(r.user_id) ?? 0) + 1);
  }
  const savedCount = new Map<string, number>();
  for (const s of (saves.data ?? []) as Array<{ user_id: string }>) {
    savedCount.set(s.user_id, (savedCount.get(s.user_id) ?? 0) + 1);
  }
  const adminEmails = new Set(
    (env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const users: AdminUserRow[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    display_name: r.display_name,
    preferred_language: r.preferred_language,
    role: r.role,
    coppa_consent_at: r.coppa_consent_at,
    created_at: r.created_at,
    last_seen_at: r.last_seen_at,
    kidCount: kidCount.get(r.id) ?? 0,
    ageRanges: Array.from(ageRangesByUser.get(r.id) ?? []).sort(),
    activeReminders: reminderCount.get(r.id) ?? 0,
    savedCamps: savedCount.get(r.id) ?? 0,
    isAdmin: adminEmails.has(r.email.toLowerCase()),
  }));
  return { users, total: count ?? users.length };
}

// Data quality triage — three buckets of verified camps that need
// admin attention. All schema-defensive (missing column → empty list).
const STALE_VERIFICATION_DAYS = 60;

async function loadDataQualityData(): Promise<DataQualityData> {
  const db = createServiceSupabase();
  const sixtyDaysAgo = new Date(
    Date.now() - STALE_VERIFICATION_DAYS * 86400000,
  ).toISOString();
  const cols =
    'id, slug, name, address, phone, last_verified_at, data_completeness';
  try {
    const [noAddrResp, noPhoneResp, staleResp] = await Promise.all([
      db
        .from('camps')
        .select(cols)
        .eq('verified', true)
        .or('address.is.null,address.eq.')
        .order('name', { ascending: true })
        .limit(200),
      db
        .from('camps')
        .select(cols)
        .eq('verified', true)
        .or('phone.is.null,phone.eq.')
        .order('name', { ascending: true })
        .limit(200),
      db
        .from('camps')
        .select(cols)
        .eq('verified', true)
        .lt('last_verified_at', sixtyDaysAgo)
        .order('last_verified_at', { ascending: true, nullsFirst: true })
        .limit(200),
    ]);
    return {
      noAddress: (noAddrResp.data ?? []) as DataQualityCamp[],
      noPhone: (noPhoneResp.data ?? []) as DataQualityCamp[],
      staleVerifications: (staleResp.data ?? []) as DataQualityCamp[],
    };
  } catch {
    return { noAddress: [], noPhone: [], staleVerifications: [] };
  }
}

async function loadEnrichmentData(): Promise<EnrichmentCamp[]> {
  const db = createServiceSupabase();
  const { data } = await db
    .from('camps')
    .select(
      'id, slug, name, phone, address, website_url, ages_min, ages_max, hours_start, hours_end, price_min_cents, price_max_cents, description, categories, registration_url, registration_deadline, last_verified_at, last_enriched_at, data_completeness, missing_fields',
    )
    .eq('verified', true)
    .order('data_completeness', { ascending: true, nullsFirst: true })
    .limit(200);
  return (data ?? []) as EnrichmentCamp[];
}

async function loadIntegrityData() {
  const db = createServiceSupabase();
  const [
    brokenCamps,
    unverifiedCamps,
    sendsAgg,
    cityRows,
    clicksTotal,
    clicks7,
  ] = await Promise.all([
    db
      .from('camps')
      .select('id, name, slug, website_url, website_status, website_last_verified_at')
      .eq('website_status', 'broken')
      .limit(50),
    db
      .from('camps')
      .select('id, name, slug')
      .eq('verified', true)
      .eq('logistics_verified', false)
      .limit(50),
    db.from('reminder_sends').select('opened_at, clicked_at'),
    db.from('city_requests').select('city'),
    db.from('camp_clicks').select('*', { count: 'exact', head: true }),
    db
      .from('camp_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  for (const s of (sendsAgg.data ?? []) as Array<{
    opened_at: string | null;
    clicked_at: string | null;
  }>) {
    totalSent += 1;
    if (s.opened_at) totalOpened += 1;
    if (s.clicked_at) totalClicked += 1;
  }
  const cityCounts = new Map<string, number>();
  for (const r of (cityRows.data ?? []) as Array<{ city: string }>) {
    const c = r.city.trim();
    if (c) cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  return {
    brokenCamps: (brokenCamps.data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      website_url: string | null;
      website_status: string;
      website_last_verified_at: string | null;
    }>,
    unverifiedCamps: (unverifiedCamps.data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
    }>,
    reminders: {
      totalSent,
      totalOpened,
      totalClicked,
      openRatePct:
        totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
      clickRatePct:
        totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0,
    },
    cityRequests: { total: cityRows.data?.length ?? 0, topCities },
    clicks: { total: clicksTotal.count ?? 0, last7: clicks7.count ?? 0 },
  };
}

// --- Integrity panel (inline — system health overview) -----------------------
function IntegrityPanel({
  data,
}: {
  data: Awaited<ReturnType<typeof loadIntegrityData>>;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-black text-ink">
          Broken websites ({data.brokenCamps.length})
        </h3>
        <p className="text-xs text-muted">
          Flagged by the weekly link-checker cron. Hidden from public /api/camps.
        </p>
        {data.brokenCamps.length === 0 ? (
          <p className="mt-2 text-xs text-emerald-700">Nothing broken — good.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cream-border rounded-2xl border border-cream-border bg-white">
            {data.brokenCamps.map((c) => (
              <li key={c.id} className="px-3 py-2 text-sm">
                <span className="font-bold text-ink">{c.name}</span>{' '}
                {c.website_url ? (
                  <a
                    href={c.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-600 underline"
                  >
                    {c.website_url}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-black text-ink">
          Missing logistics ({data.unverifiedCamps.length})
        </h3>
        <p className="text-xs text-muted">
          Verified camps without logistics_verified=true. Honest disclosures still show
          on the public surface.
        </p>
        {data.unverifiedCamps.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.unverifiedCamps.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-cream-border bg-white px-3 py-1 text-xs font-semibold text-ink"
              >
                {c.name}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Emails sent" value={data.reminders.totalSent.toLocaleString()} />
        <StatCard
          label="Open rate"
          value={`${data.reminders.openRatePct}%`}
          sub={`${data.reminders.totalOpened} opened`}
        />
        <StatCard
          label="Click rate"
          value={`${data.reminders.clickRatePct}%`}
          sub={`${data.reminders.totalClicked} clicked`}
        />
        <StatCard
          label="Camp clicks (7d / total)"
          value={`${data.clicks.last7} / ${data.clicks.total}`}
        />
        <StatCard
          label="City requests"
          value={data.cityRequests.total.toString()}
          sub={
            data.cityRequests.topCities[0]
              ? `top: ${data.cityRequests.topCities[0].city} (${data.cityRequests.topCities[0].count})`
              : 'no requests yet'
          }
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-cream-border bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
      {sub ? <p className="mt-1 text-xs font-bold text-muted">{sub}</p> : null}
    </div>
  );
}

// --- Page ---------------------------------------------------------------------
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const activeTab = normalizeTab(sp.tab);
  const counts = await computePillCounts(createServiceSupabase());

  let panel: React.ReactNode = null;
  if (activeTab === 'feature-requests') {
    const rows = await loadFeatureRequests();
    panel = <FeatureRequestsPanel initialRequests={rows} />;
  } else if (activeTab === 'camp-requests') {
    const rows = await loadCampRequests();
    panel = <CampRequestsPanel initialRequests={rows} />;
  } else if (activeTab === 'calendar-reviews') {
    const blocks = await loadCalendarData();
    const pending = await loadPendingNotifySchools();
    panel = (
      <div className="space-y-6">
        <NotifySubscribersPanel schools={pending} />
        <CalendarReviewClient schools={blocks} />
      </div>
    );
  } else if (activeTab === 'calendar-submissions') {
    const rows = await loadCalendarSubmissions();
    panel = <CalendarSubmissionsPanel locale={locale} initialSubmissions={rows} />;
  } else if (activeTab === 'enrichment') {
    const camps = await loadEnrichmentData();
    panel = <EnrichmentPanel initialCamps={camps} />;
  } else if (activeTab === 'integrity') {
    const data = await loadIntegrityData();
    panel = <IntegrityPanel data={data} />;
  } else if (activeTab === 'school-requests') {
    const [rows, schools] = await Promise.all([
      loadSchoolRequests(),
      loadSchoolOptions(),
    ]);
    panel = <SchoolRequestsPanel initialRequests={rows} schools={schools} />;
  } else if (activeTab === 'data-quality') {
    const data = await loadDataQualityData();
    panel = <DataQualityPanel locale={locale} data={data} />;
  } else if (activeTab === 'users') {
    const { users, total } = await loadUsersData();
    panel = <UsersClient initialUsers={users} initialTotal={total} initialSearch={''} />;
  }

  return (
    <div className="space-y-5">
      <AdminPillStrip counts={counts} activeTab={activeTab} locale={locale} />
      <AdminTabsNav locale={locale} active={activeTab} />
      <div>{panel}</div>
    </div>
  );
}
