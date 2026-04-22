'use client';

import { useTranslations } from 'next-intl';
import type { Closure } from '@/lib/closures';
import { daysUntil } from '@/lib/countdown';
import { useMode } from './ModeContext';

function formatDateRange(start: string, end: string, locale: string) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  if (start === end) return fmt.format(s);
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

export function DashboardPreview({
  closures,
  locale,
}: {
  closures: Closure[];
  locale: string;
}) {
  const t = useTranslations('landing.dashboard');
  const { mode } = useMode();

  const nextClosure = closures[0] ?? null;
  const closureCount = closures.length;
  const daysToNext = nextClosure ? daysUntil(nextClosure.start_date) : null;

  const stat = (label: string, value: React.ReactNode) => (
    <div
      className={
        'rounded-2xl p-5 transition-colors ' +
        (mode === 'parents'
          ? 'bg-white border border-cream-border'
          : 'bg-white/10 backdrop-blur border border-white/10')
      }
    >
      <div
        className={
          'text-xs uppercase tracking-wider font-bold ' +
          (mode === 'parents' ? 'text-muted' : 'text-white/60')
        }
      >
        {label}
      </div>
      <div
        className={
          'mt-2 editorial-h1 text-3xl md:text-4xl ' +
          (mode === 'parents' ? 'text-ink' : 'text-white')
        }
      >
        {value}
      </div>
    </div>
  );

  // DECISION: Kids/saved camps have no real data yet. Show "—" instead of a
  // fake number. Once the dashboard (Phase 3) exists, these read from a real
  // source. Honesty rule: no fabrication.
  const kidsLabel = '—';
  const savedCampsLabel = '—';

  let nextBreakValue: React.ReactNode;
  if (daysToNext == null) {
    nextBreakValue = '—';
  } else if (daysToNext <= 0) {
    nextBreakValue = t('today');
  } else if (daysToNext === 1) {
    nextBreakValue = t('tomorrow');
  } else {
    nextBreakValue = (
      <>
        {daysToNext}
        <span
          className={
            'editorial-body text-base md:text-lg font-semibold ml-2 ' +
            (mode === 'parents' ? 'text-muted' : 'text-white/60')
          }
        >
          {t('stats.nextBreakUnit')}
        </span>
      </>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 -mt-2 md:-mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stat(t('stats.kids'), kidsLabel)}
        {stat(t('stats.nextBreakIn'), nextBreakValue)}
        {stat(t('stats.closures'), closureCount || '—')}
        {stat(t('stats.savedCamps'), savedCampsLabel)}
      </div>

      {/* Dark "Up next" panel — accent stays dark-gradient in BOTH modes */}
      <div className="mt-4 rounded-2xl p-5 md:p-6 bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
        <div className="text-xs uppercase tracking-wider font-bold text-white/60 md:w-24">
          {t('upNextLabel')}
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          {nextClosure ? (
            <>
              <span className="text-2xl" aria-hidden="true">
                {nextClosure.emoji}
              </span>
              <span className="font-bold text-lg truncate">{nextClosure.name}</span>
              <span className="text-white/60">·</span>
              <span className="text-white/80 text-sm">
                {formatDateRange(nextClosure.start_date, nextClosure.end_date, locale)}
              </span>
              {daysToNext != null && daysToNext > 1 && (
                <>
                  <span className="text-white/60">·</span>
                  <span className="text-white/80 text-sm">
                    {t('inDays', { days: daysToNext })}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-white/70 text-sm">{t('empty')}</span>
          )}
        </div>
      </div>
    </section>
  );
}
