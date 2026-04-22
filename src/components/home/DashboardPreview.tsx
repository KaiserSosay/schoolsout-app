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

  // DECISION: This block is a signed-out preview, not a live dashboard. Show
  // honest illustrative numbers with a purple eyebrow + disclaimer so there's
  // no ambiguity. A signed-in user sees their real dashboard at /app.
  const sampleKids = '2';
  const sampleNextBreak = '25d';
  const sampleClosures = '14';
  const sampleSavedCamps = '3';

  return (
    <section className="max-w-4xl mx-auto px-4 -mt-2 md:-mt-4">
      <div
        className={
          'mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ' +
          (mode === 'parents'
            ? 'bg-brand-purple/10 text-brand-purple'
            : 'bg-white/15 text-white')
        }
      >
        {t('preview.label')}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stat(t('stats.kids'), sampleKids)}
        {stat(t('stats.nextBreakIn'), sampleNextBreak)}
        {stat(t('stats.closures'), sampleClosures)}
        {stat(t('stats.savedCamps'), sampleSavedCamps)}
      </div>

      <p
        className={
          'mt-2 text-center text-xs italic editorial-body ' +
          (mode === 'parents' ? 'text-muted' : 'text-white/60')
        }
      >
        {t('preview.disclaimer')}
      </p>

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
