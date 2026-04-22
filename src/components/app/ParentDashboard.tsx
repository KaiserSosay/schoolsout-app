'use client';

import { useTranslations } from 'next-intl';
import type { Closure } from '@/lib/closures';
import { StatsGrid } from './StatsGrid';
import { UpNextCard } from './UpNextCard';
import { FamilyCalendarStrip } from './FamilyCalendarStrip';
import { ReminderBanner } from './ReminderBanner';
import { WishlistSection } from './WishlistSection';
import { QuickActions } from './QuickActions';
import { KidActivityFeed } from './KidActivityFeed';

type ClosureWithSchool = Closure & { schoolName: string | null };

type Profile = {
  id: string;
  school_id: string;
  age_range: string;
  ordinal: number;
  schools?: { id: string; name: string } | null;
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
}: {
  locale: string;
  displayName: string | null;
  profiles: Profile[];
  closures: ClosureWithSchool[];
  saves: Save[];
  savesCount: number;
  activity: Activity[];
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

      <StatsGrid
        kidCount={profiles.length}
        closures={closures}
        savesCount={savesCount}
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

      <KidActivityFeed initial={activity} locale={locale} />
    </div>
  );
}
