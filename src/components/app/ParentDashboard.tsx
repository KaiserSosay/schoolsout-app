'use client';

import { useTranslations } from 'next-intl';
import type { Closure } from '@/lib/closures';
import { StatsGrid } from './StatsGrid';
import { UpNextCard } from './UpNextCard';
import { FamilyCalendarStrip } from './FamilyCalendarStrip';
import { ReminderBanner } from './ReminderBanner';
import { WishlistSection } from './WishlistSection';
import { QuickActions } from './QuickActions';
import { RecentActivityFeed } from './RecentActivityFeed';
import { PlansSummary } from './PlansSummary';
import { VerifyingCalendarsCard } from './VerifyingCalendarsCard';
import { NewDeviceKidReminderBanner } from './NewDeviceKidReminderBanner';
import type { SchoolStatus } from '@/lib/school-status';

type ClosureWithSchool = Closure & { schoolName: string | null };

type Profile = {
  id: string;
  school_id: string;
  age_range: string;
  ordinal: number;
  schools?: {
    id: string;
    name: string;
    district?: string | null;
    type?: string | null;
    calendar_status?:
      | 'verified_multi_year'
      | 'verified_current'
      | 'ai_draft'
      | 'needs_research'
      | 'unavailable';
  } | null;
};

type Camp = {
  id: string;
  slug: string;
  name: string;
  price_tier: '$' | '$$' | '$$$';
  ages_min: number;
  ages_max: number;
  categories: string[];
  website_url: string | null;
  neighborhood: string | null;
};

type Save = { id: string; camp: Camp | null };

type Activity = {
  id: string;
  action: 'saved_camp' | 'unsaved_camp' | 'viewed_closure' | 'viewed_camp';
  target_id: string | null;
  target_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

export function ParentDashboard({
  locale,
  displayName,
  profiles,
  closures,
  saves,
  savesCount,
  activity,
  plans,
  userHasAppHistory,
}: {
  locale: string;
  displayName: string | null;
  profiles: Profile[];
  closures: ClosureWithSchool[];
  saves: Save[];
  savesCount: number;
  activity: Activity[];
  plans: import('./PlansSummary').PlanCard[];
  userHasAppHistory: boolean;
}) {
  const t = useTranslations('app.dashboard');

  const greeting = displayName
    ? t('greeting.returning', { name: displayName })
    : t('greeting.parentMode');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <header>
        <h1
          className="text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </header>

      <VerifyingCalendarsCard
        locale={locale}
        schools={dedupeSchools(profiles)}
      />

      <StatsGrid
        kidCount={profiles.length}
        closures={closures}
        savesCount={savesCount}
        locale={locale}
      />

      <NewDeviceKidReminderBanner
        userHasAppHistory={userHasAppHistory}
        locale={locale}
      />

      <PlansSummary
        cards={plans}
        locale={locale}
        hasUpcomingClosures={closures.length > 0}
      />

      {closures[0] ? (
        <UpNextCard
          closure={closures[0]}
          schoolName={closures[0].schoolName}
          locale={locale}
        />
      ) : null}

      <FamilyCalendarStrip closures={closures} locale={locale} />

      <ReminderBanner closure={closures[0]} locale={locale} />

      <div className="grid gap-6 md:grid-cols-2">
        <WishlistSection saves={saves} locale={locale} />
        <QuickActions locale={locale} />
      </div>

      <RecentActivityFeed initial={activity} locale={locale} />
    </div>
  );
}

function dedupeSchools(
  profiles: Profile[],
): Array<{ id: string; name: string; calendar_status: SchoolStatus }> {
  const seen = new Map<string, { id: string; name: string; calendar_status: SchoolStatus }>();
  for (const p of profiles) {
    const s = p.schools;
    if (!s || !s.calendar_status) continue;
    if (!seen.has(s.id)) {
      seen.set(s.id, {
        id: s.id,
        name: s.name,
        calendar_status: s.calendar_status as SchoolStatus,
      });
    }
  }
  return Array.from(seen.values());
}
