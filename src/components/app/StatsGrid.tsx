'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';

// DECISION: Pure presentation. Accepts already-loaded props (profiles length,
// closures, savesCount) so the parent server component can stay in control
// of data fetching. If there are no closures, "next break in" shows an em
// dash — never a fabricated number.
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

  const cells = [
    { key: 'kids',         label: t('kids'),         value: String(kidCount) },
    {
      key: 'nextBreakIn',
      label: t('nextBreakIn'),
      value: nextDays === null ? '—' : `${nextDays}d`,
    },
    { key: 'closures',     label: t('closures'),     value: String(closures.length) },
    { key: 'saved',        label: t('saved'),        value: String(savesCount) },
  ];

  return (
    <div
      data-testid="stats-grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {cells.map((c) => (
        <div
          key={c.key}
          data-stat={c.key}
          className="rounded-2xl border border-cream-border bg-white p-4 shadow-sm"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {c.label}
          </div>
          <div className="mt-1 text-3xl font-black text-ink">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
