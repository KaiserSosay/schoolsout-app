'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';
import { CountUp } from '@/components/CountUp';

// DECISION: Every stat card is tappable — UX_PRINCIPLES.md #1 ("no dead
// clicks"). Destinations:
//   KIDS          → /app/family  (names are client-side per COPPA — page hydrates them)
//   NEXT BREAK IN → /app/closures/[id] for the soonest closure (fallback /calendar)
//   CLOSURES      → /app/calendar
//   SAVED         → /app/saved
// Stagger + CountUp are preserved from the earlier UX polish pass.
export function StatsGrid({
  kidCount,
  closures,
  savesCount,
  locale,
}: {
  kidCount: number;
  closures: Closure[];
  savesCount: number;
  locale: string;
}) {
  const t = useTranslations('app.dashboard.stats');
  const nextBreak = closures[0];
  const nextDays = nextBreak ? Math.max(0, daysUntil(nextBreak.start_date)) : null;

  type Cell =
    | { key: string; label: string; value: string; numeric?: never; href: string; ariaSuffix?: string }
    | { key: string; label: string; numeric: number; suffix?: string; href: string; ariaSuffix?: string };

  const nextHref = nextBreak
    ? `/${locale}/app/closures/${nextBreak.id}`
    : `/${locale}/app/calendar`;

  const cells: Cell[] = [
    { key: 'kids', label: t('kids'), numeric: kidCount, href: `/${locale}/app/family` },
    nextDays === null
      ? { key: 'nextBreakIn', label: t('nextBreakIn'), value: '—', href: nextHref }
      : { key: 'nextBreakIn', label: t('nextBreakIn'), numeric: nextDays, suffix: 'd', href: nextHref, ariaSuffix: nextBreak?.name },
    { key: 'closures', label: t('closures'), numeric: closures.length, href: `/${locale}/app/calendar` },
    { key: 'saved', label: t('saved'), numeric: savesCount, href: `/${locale}/app/saved` },
  ];

  return (
    <div
      data-testid="stats-grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {cells.map((c, i) => (
        <Link
          key={c.key}
          href={c.href}
          data-stat={c.key}
          aria-label={c.ariaSuffix ? `${c.label}: ${c.ariaSuffix}` : c.label}
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
          className="animate-fade-up rounded-2xl border border-cream-border bg-white p-4 shadow-sm transition-all duration-[var(--duration-micro)] ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] focus-visible:-translate-y-0.5"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {c.label}
          </div>
          <div className="mt-1 text-3xl font-black text-ink">
            {'numeric' in c && typeof c.numeric === 'number' ? (
              <CountUp to={c.numeric} suffix={c.suffix ?? ''} />
            ) : (
              c.value
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
