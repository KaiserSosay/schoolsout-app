'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';

// DECISION: Only render when a closure is within the next 30 days — otherwise
// the "book now" urgency feels fake. Silent otherwise.
export function ReminderBanner({
  closure,
  locale,
}: {
  closure: Closure | undefined;
  locale: string;
}) {
  const t = useTranslations('app.dashboard.reminder');
  if (!closure) return null;

  const days = daysUntil(closure.start_date);
  if (days < 0 || days > 30) return null;

  const weeks = Math.max(1, Math.round(days / 7));
  const weekLabel = t('weeksAway', { count: weeks, name: closure.name });

  return (
    <section className="rounded-3xl bg-gold p-5 text-ink shadow-sm md:p-6">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
        <span aria-hidden>🔔</span>
        <span>{t('label')}</span>
      </div>
      <p className="mt-2 text-lg font-black md:text-xl">{weekLabel}</p>
      <p className="mt-1 text-sm text-ink/80">{t('body')}</p>
      <Link
        href={`/${locale}/app/camps`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ink hover:underline"
      >
        {t('cta')}
      </Link>
    </section>
  );
}
