'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';

// DECISION: Needs at least one closure to render. When empty we return null —
// the ParentDashboard shows the ReminderBanner/WishlistSection regardless, so
// there's no "empty up next" card. Cleaner than an empty-state placeholder.
export function UpNextCard({
  closure,
  schoolName,
  locale,
}: {
  closure: Closure;
  schoolName: string | null;
  locale: string;
}) {
  const t = useTranslations('app.dashboard.upNext');
  const diff = Math.max(0, daysUntil(closure.start_date));

  const start = new Date(closure.start_date + 'T00:00:00');
  const end = new Date(closure.end_date + 'T00:00:00');
  const dayCount =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const dateLabel =
    dayCount > 1 ? `${fmt.format(start)} – ${fmt.format(end)}` : fmt.format(start);

  const daysOff =
    dayCount === 1 ? t('dayOff', { count: 1 }) : t('daysOff', { count: dayCount });

  return (
    <section
      data-testid="upnext-card"
      className="rounded-3xl bg-ink p-6 text-cream shadow-lg md:p-8"
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gold">
        <span aria-hidden>⏰</span>
        <span>{t('label')}</span>
      </div>
      <h2
        className="mt-2 text-[28px] leading-tight text-white md:text-[32px]"
        style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
      >
        {closure.name}
      </h2>
      {schoolName ? (
        <p className="mt-1 text-sm text-white/70">{schoolName}</p>
      ) : null}
      <p className="mt-1 text-sm text-white/70">{dateLabel}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
          {daysOff}
        </span>
        <span className="inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">
          {t('daysAway', { count: diff })}
        </span>
      </div>
      <Link
        href={`/${locale}/app/closures/${closure.id}`}
        className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-cta-yellow hover:underline"
      >
        {t('viewDetails')}
      </Link>
    </section>
  );
}
