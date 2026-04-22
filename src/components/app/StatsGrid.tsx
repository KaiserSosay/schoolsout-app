'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';
import { CountUp } from '@/components/CountUp';

// DECISION: Stats grid gets a 4-card stagger (80ms step) on mount, each using
// the shared animate-fade-up keyframe. Numeric values animate with CountUp
// for a subtle roll-up — reduced-motion users see final values immediately.
// The "next break in" tile keeps the em dash when we have no closures —
// never a fabricated number.
export function StatsGrid({
  kidCount,
  closures,
  savesCount,
}: {
  kidCount: number;
  closures: Closure[];
  savesCount: number;
}) {
  const t = useTranslations('app.dashboard.stats');
  const nextBreak = closures[0];
  const nextDays = nextBreak ? Math.max(0, daysUntil(nextBreak.start_date)) : null;

  type Cell =
    | { key: string; label: string; value: string; numeric?: never }
    | { key: string; label: string; numeric: number; suffix?: string };

  const cells: Cell[] = [
    { key: 'kids', label: t('kids'), numeric: kidCount },
    nextDays === null
      ? { key: 'nextBreakIn', label: t('nextBreakIn'), value: '—' }
      : { key: 'nextBreakIn', label: t('nextBreakIn'), numeric: nextDays, suffix: 'd' },
    { key: 'closures', label: t('closures'), numeric: closures.length },
    { key: 'saved', label: t('saved'), numeric: savesCount },
  ];

  return (
    <div
      data-testid="stats-grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {cells.map((c, i) => (
        <div
          key={c.key}
          data-stat={c.key}
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
          className="animate-fade-up rounded-2xl border border-cream-border bg-white p-4 shadow-sm"
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
        </div>
      ))}
    </div>
  );
}
