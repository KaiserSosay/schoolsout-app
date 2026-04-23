'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import { closureHref, focusRing } from '@/lib/links';
import { detectLongWeekend } from '@/lib/longWeekend';
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

  const detailHref = closureHref(locale, closure.id);
  return (
    <section
      data-testid="upnext-card"
      className="rounded-3xl bg-ink p-6 text-cream shadow-lg transition-shadow hover:shadow-xl md:p-8"
    >
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gold">
        <span aria-hidden>⏰</span>
        <span>{t('label')}</span>
      </div>
      {/* Closure name is a hyperlink — entire card not wrapped because the
          "View details" CTA at the bottom is the primary action; we don't
          want a nested-link a11y conflict. */}
      <h2 className="mt-2">
        <Link
          href={detailHref}
          className={
            'text-[28px] leading-tight text-white transition-colors hover:text-gold md:text-[32px] ' +
            focusRing
          }
          style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
        >
          {closure.name}
        </Link>
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
        {(() => {
          const lw = detectLongWeekend({
            start_date: closure.start_date,
            end_date: closure.end_date,
          });
          return lw.isLongWeekend ? (
            <span className="inline-flex items-center rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink">
              {lw.label}
            </span>
          ) : null;
        })()}
      </div>
      <Link
        href={detailHref}
        className={
          'mt-5 inline-flex items-center gap-1 text-sm font-bold text-cta-yellow hover:underline ' +
          focusRing
        }
      >
        {t('viewDetails')}
      </Link>
    </section>
  );
}
