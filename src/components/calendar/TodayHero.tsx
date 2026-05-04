'use client';

import { useTranslations } from 'next-intl';
import { isInRange, longDateLabel, relativeDays } from '@/lib/calendar/dates';
import type { CalendarClosure } from '@/lib/calendar/types';

export function TodayHero({
  today,
  locale,
  closures,
  schoolNameFallback,
}: {
  today: string;
  locale: string;
  closures: CalendarClosure[];
  // Only used when /app/calendar passes multiple schools — in that
  // case we hide the "no school today" line if NO closure today
  // affects any of the user's schools (less noisy).
  schoolNameFallback?: string;
}) {
  const t = useTranslations('calendar');

  // Find a closure (or half day) that covers today.
  const todayClosure = closures.find((c) =>
    isInRange(today, c.start_date, c.end_date),
  );
  const isHalfDay =
    todayClosure?.closure_type === 'early_dismissal' ||
    /half[- ]day/i.test(todayClosure?.name ?? '') ||
    /early dismissal/i.test(todayClosure?.name ?? '');

  // Next upcoming break after today.
  const upcoming = closures
    .filter((c) => c.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  const daysToNext = upcoming ? relativeDays(upcoming.start_date, today) : null;

  return (
    <section
      data-testid="today-hero"
      className="rounded-3xl border border-cream-border bg-cream p-5 md:p-6"
    >
      <p className="text-[11px] font-black uppercase tracking-widest text-muted">
        {t('todayEyebrow')}
      </p>
      <h2
        className="mt-1 text-2xl font-black text-ink md:text-3xl"
        style={{ letterSpacing: '-0.02em' }}
      >
        {longDateLabel(today, locale)}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {daysToNext !== null && upcoming
          ? t('nextBreakIn', {
              count: daysToNext,
              name: upcoming.name,
            })
          : schoolNameFallback
            ? t('noUpcomingFor', { name: schoolNameFallback })
            : t('noUpcomingGeneric')}
      </p>

      {todayClosure ? (
        isHalfDay ? (
          <p
            data-testid="today-half-day-chip"
            className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-ink"
          >
            ⏰ {t('todayHalfDay', { name: todayClosure.name })}
          </p>
        ) : (
          <p
            data-testid="today-closed-chip"
            className="mt-3 inline-flex items-center rounded-full bg-brand-purple px-3 py-1 text-sm font-black text-cream"
          >
            🎉 {t('todayClosed')}
          </p>
        )
      ) : null}
    </section>
  );
}
