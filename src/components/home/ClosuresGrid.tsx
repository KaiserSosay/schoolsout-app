'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';
import { WeatherChip } from './WeatherChip';

const kidsGradients = [
  'from-purple-600 to-purple-900',
  'from-red-500 to-red-900',
  'from-blue-500 to-blue-900',
];

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

function formatStartChip(start: string, locale: string) {
  const s = new Date(start + 'T00:00:00Z');
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return fmt.format(s);
}

export function ClosuresGrid({
  closures,
  locale,
}: {
  closures: Closure[];
  locale: string;
}) {
  const t = useTranslations('landing.nextDaysOff');
  const td = useTranslations('landing.dashboard');
  const { mode } = useMode();

  const countdown = (days: number) => {
    if (days <= 0) return td('today');
    if (days === 1) return td('tomorrow');
    return td('inDays', { days });
  };

  const shown = closures.slice(0, 3);

  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className={
            'editorial-h1 mt-3 text-3xl md:text-5xl max-w-3xl text-balance ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          {t('title')}
        </h2>
        <p
          className={
            'editorial-body mt-3 max-w-2xl ' +
            (mode === 'parents' ? 'text-muted' : 'text-white/70')
          }
        >
          {t('subtitle')}
        </p>

        {shown.length === 0 ? (
          <p
            className={
              'mt-10 ' + (mode === 'parents' ? 'text-muted' : 'text-white/70')
            }
          >
            {t('empty')}
          </p>
        ) : (
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {shown.map((c, i) => {
              const days = daysUntil(c.start_date);
              const kidsCard = `bg-gradient-to-br ${kidsGradients[i % 3]} text-white shadow-lg`;
              const parentsCard = 'bg-white text-ink border border-cream-border';

              return (
                <article
                  key={c.id}
                  className={
                    'rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 animate-fade-up ' +
                    (mode === 'parents' ? parentsCard : kidsCard)
                  }
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ' +
                        (mode === 'parents'
                          ? 'bg-gold text-ink'
                          : 'bg-white/20 text-white')
                      }
                    >
                      {formatStartChip(c.start_date, locale)}
                    </span>
                    <span className="text-4xl" aria-hidden="true">
                      {c.emoji}
                    </span>
                  </div>
                  <h3
                    className={
                      'editorial-h1 text-xl md:text-2xl leading-tight ' +
                      (mode === 'parents' ? 'text-ink' : 'text-white')
                    }
                  >
                    {c.name}
                  </h3>
                  <p
                    className={
                      'editorial-body text-sm ' +
                      (mode === 'parents' ? 'text-muted' : 'text-white/80')
                    }
                  >
                    {formatDateRange(c.start_date, c.end_date, locale)}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-2 flex-wrap">
                    <span
                      className={
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ' +
                        (mode === 'parents'
                          ? 'bg-purple-soft text-brand-purple'
                          : 'bg-white/15 text-white/90')
                      }
                    >
                      {countdown(days)}
                    </span>
                    <WeatherChip date={c.start_date} locale={locale} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
