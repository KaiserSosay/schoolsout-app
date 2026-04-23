import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/metrics
// Returns the KPI hub payload: users, kids, reminders, schools, camps,
// applications, clicks, city requests, MRR.
//
// DECISION: MRR is HARD-CODED to 0 with an honest note. Do NOT fabricate.
// Revenue unlocks when Featured listings launch (per v3.1 PRD §7, 1,000 MAU
// or 500 reminder subs — whichever first). Until then the card shows $0.
//
// DECISION: camp_clicks is a fresh table — "clicks since April 22, 2026" is
// the honest framing. Historical clicks don't exist, so we don't pretend.

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const db = createServiceSupabase();
  const now = new Date();
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  // --- users ---
  const [
    usersTotal,
    usersNew7,
    usersNew30,
    usersRecent,
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', d7.toISOString()),
    db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', d30.toISOString()),
    db
      .from('users')
      .select('id, created_at')
      .gte('created_at', d7.toISOString())
      .order('created_at'),
  ]);

  // Build last 7 days by-day buckets (today + prior 6).
  const byDayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    byDayMap.set(dayKey(daysAgo(i)), 0);
  }
  for (const row of usersRecent.data ?? []) {
    const k = (row.created_at as string).slice(0, 10);
    if (byDayMap.has(k)) byDayMap.set(k, (byDayMap.get(k) ?? 0) + 1);
  }
  const last7DaysByDay = Array.from(byDayMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // --- kid profiles ---
  const { data: kidRows } = await db.from('kid_profiles').select('age_range');
  const byAgeRange: Record<string, number> = { '4-6': 0, '7-9': 0, '10-12': 0, '13+': 0 };
  for (const row of kidRows ?? []) {
    const k = row.age_range as string;
    if (k in byAgeRange) byAgeRange[k] += 1;
  }

  // --- reminders ---
  const [subsTotal, sendsAgg] = await Promise.all([
    db
      .from('reminder_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', true),
    db.from('reminder_sends').select('sent_at, opened_at, clicked_at'),
  ]);

  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  for (const s of sendsAgg.data ?? []) {
    totalSent += 1;
    if (s.opened_at) totalOpened += 1;
    if (s.clicked_at) totalClicked += 1;
  }
  const openRatePct = totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0;
  const clickRatePct = totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0;

  // --- schools ---
  const { data: schoolRows } = await db.from('schools').select('calendar_status');
  const schoolBuckets = {
    total: 0,
    verifiedCurrent: 0,
    verifiedMultiYear: 0,
    needsResearch: 0,
    aiDraft: 0,
    unavailable: 0,
  };
  for (const s of schoolRows ?? []) {
    schoolBuckets.total += 1;
    const status = s.calendar_status as string;
    if (status === 'verified_current') schoolBuckets.verifiedCurrent += 1;
    else if (status === 'verified_multi_year') schoolBuckets.verifiedMultiYear += 1;
    else if (status === 'needs_research') schoolBuckets.needsResearch += 1;
    else if (status === 'ai_draft') schoolBuckets.aiDraft += 1;
    else if (status === 'unavailable') schoolBuckets.unavailable += 1;
  }

  // --- camps ---
  const { data: campRows } = await db
    .from('camps')
    .select('verified, logistics_verified, is_launch_partner, is_featured');
  const campBuckets = {
    total: 0,
    verified: 0,
    logisticsVerified: 0,
    launchPartners: 0,
    featured: 0,
  };
  for (const c of campRows ?? []) {
    campBuckets.total += 1;
    if (c.verified) campBuckets.verified += 1;
    if (c.logistics_verified) campBuckets.logisticsVerified += 1;
    if (c.is_launch_partner) campBuckets.launchPartners += 1;
    if (c.is_featured) campBuckets.featured += 1;
  }

  // --- camp applications ---
  const { data: appRows } = await db.from('camp_applications').select('status');
  const appBuckets = { pending: 0, approved: 0, rejected: 0 };
  for (const a of appRows ?? []) {
    const s = a.status as keyof typeof appBuckets;
    if (s in appBuckets) appBuckets[s] += 1;
  }

  // --- saved camps ---
  const { count: savedCampsCount } = await db
    .from('saved_camps')
    .select('*', { count: 'exact', head: true });

  // --- camp clicks ---
  const [clicksTotal, clicks7, clicks30] = await Promise.all([
    db.from('camp_clicks').select('*', { count: 'exact', head: true }),
    db
      .from('camp_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', d7.toISOString()),
    db
      .from('camp_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', d30.toISOString()),
  ]);

  // --- city requests ---
  const { data: cityRows } = await db.from('city_requests').select('city');
  const cityCounts = new Map<string, number>();
  for (const r of cityRows ?? []) {
    const c = (r.city as string).trim();
    if (!c) continue;
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }));

  return NextResponse.json({
    generatedAt: now.toISOString(),
    users: {
      total: usersTotal.count ?? 0,
      newLast7Days: usersNew7.count ?? 0,
      newLast30Days: usersNew30.count ?? 0,
      last7DaysByDay,
    },
    kidProfiles: {
      total: kidRows?.length ?? 0,
      byAgeRange,
    },
    reminders: {
      activeSubscriptions: subsTotal.count ?? 0,
      totalSent,
      totalOpened,
      totalClicked,
      openRatePct,
      clickRatePct,
    },
    schools: schoolBuckets,
    camps: campBuckets,
    campApplications: appBuckets,
    savedCamps: savedCampsCount ?? 0,
    campClicks: {
      total: clicksTotal.count ?? 0,
      last7Days: clicks7.count ?? 0,
      last30Days: clicks30.count ?? 0,
    },
    cityRequests: {
      total: cityRows?.length ?? 0,
      topCities,
    },
    mrr: {
      cents: 0,
      note: 'Revenue launches when Featured listings unlock at 1,000 MAU (per v3.1 PRD §7).',
    },
  });
}
