'use client';

import { useTranslations } from 'next-intl';
import { daysUntil, countdownColor } from '@/lib/countdown';
import { weatherForDate } from '@/lib/weather';
import type { Closure } from '@/lib/closures';
import type { Mode } from './ModeToggle';

const kidsGradients = [
  'from-purple-600 to-purple-900',
  'from-red-500 to-red-900',
  'from-blue-500 to-blue-900',
];

const parentsBorders = [
  'border-l-purple-500',
  'border-l-red-500',
  'border-l-blue-500',
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

function scrollToHero() {
  const el = document.getElementById('hero-email');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLInputElement).focus({ preventScroll: true });
  }
}

export function ClosuresGrid({
  closures,
  mode,
  locale,
}: {
  closures: Closure[];
  mode: Mode;
  locale: string;
}) {
  const t = useTranslations('home');

  const countdownLabel = (days: number) => {
    if (days === 0) return t('countdown.today');
    if (days === 1) return t('countdown.tomorrow');
    return t('countdown.days', { days });
  };

  const colorClassKids: Record<'emerald' | 'amber' | 'gray', string> = {
    emerald: 'bg-emerald-400/25 text-emerald-100',
    amber: 'bg-amber-400/25 text-amber-100',
    gray: 'bg-white/15 text-white/85',
  };
  const colorClassParents: Record<'emerald' | 'amber' | 'gray', string> = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    gray: 'bg-slate-100 text-slate-700',
  };

  if (closures.length === 0) {
    return (
      <section className="mt-10">
        <h2
          className={
            'text-2xl font-bold mb-4 ' +
            (mode === 'kids' ? 'text-white' : 'text-slate-900')
          }
        >
          {t('closures.title')}
        </h2>
        <p className={mode === 'kids' ? 'text-white/70' : 'text-slate-600'}>
          {t('closures.empty')}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2
        className={
          'text-2xl font-bold mb-6 ' +
          (mode === 'kids' ? 'text-white' : 'text-slate-900')
        }
      >
        {t('closures.title')}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {closures.map((c, i) => {
          const days = daysUntil(c.start_date);
          const color = countdownColor(days);
          const weather = weatherForDate(c.start_date);
          const weatherLabel =
            locale === 'es' ? weather.label.es : weather.label.en;

          const cardCommon =
            'text-left rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-yellow animate-fade-up w-full';
          const kidsClass = `bg-gradient-to-br ${kidsGradients[i % 3]} text-white shadow-lg`;
          const parentsClass = `bg-white text-slate-900 border border-slate-200 border-l-4 ${parentsBorders[i % 3]} shadow-sm`;

          return (
            <button
              key={c.id}
              type="button"
              onClick={scrollToHero}
              aria-label={`${c.name} — ${t('closures.ctaSignup')}`}
              className={
                cardCommon +
                ' ' +
                (mode === 'kids' ? kidsClass : parentsClass)
              }
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <span
                  className={
                    'px-3 py-1 rounded-full text-xs font-bold ' +
                    (mode === 'kids'
                      ? colorClassKids[color]
                      : colorClassParents[color])
                  }
                >
                  {countdownLabel(days)}
                </span>
              </div>
              <h3 className="text-xl font-bold leading-tight">{c.name}</h3>
              <p
                className={
                  'text-sm ' +
                  (mode === 'kids' ? 'text-white/85' : 'text-slate-600')
                }
              >
                {formatDateRange(c.start_date, c.end_date, locale)}
              </p>
              <div className="flex items-center gap-2 mt-auto pt-2">
                <span
                  className={
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ' +
                    (mode === 'kids'
                      ? 'bg-white/15 text-white/90'
                      : 'bg-slate-100 text-slate-700')
                  }
                  title={`High ${weather.highF}°F / Low ${weather.lowF}°F`}
                >
                  <span aria-hidden="true">{weather.icon}</span>
                  <span>
                    {weather.highF}° · {weatherLabel}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
