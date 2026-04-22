'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from '@/components/app/ModeProvider';
import { daysUntil, countdownColor } from '@/lib/countdown';

type Closure = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  school_name: string;
};

type Camp = {
  id: string;
  slug: string;
  name: string;
  ages_min: number;
  ages_max: number;
  price_tier: string;
  categories: string[];
  neighborhood: string | null;
  verified: boolean;
  sessions_unknown?: boolean;
  session_match?: boolean;
  hours_start?: string | null;
  hours_end?: string | null;
  before_care_offered?: boolean;
  after_care_offered?: boolean;
  logistics_verified?: boolean;
  phone?: string | null;
};

type WeatherResponse =
  | { highF: number; lowF: number; code?: number; source: 'forecast' }
  | { highF: number; lowF: number; icon?: string; label?: { en: string; es: string }; source: 'monthly_average' };

function durationDays(start: string, end: string): number {
  return daysUntil(end, new Date(start + 'T00:00:00Z')) + 1;
}

export function ClosureDetailView({
  locale,
  closure,
  camps,
}: {
  locale: string;
  closure: Closure;
  camps: Camp[];
}) {
  const { mode } = useMode();
  const t = useTranslations();
  const isKids = mode === 'kids';

  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/weather?date=${closure.start_date}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d) setWeather(d); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [closure.start_date]);

  const days = daysUntil(closure.start_date);
  const duration = durationDays(closure.start_date, closure.end_date);
  const color = countdownColor(days);

  const badge =
    duration >= 30 ? 'summer'
    : duration >= 5 ? 'longBreak'
    : duration >= 3 ? 'threeDayWeekend'
    : null;

  const pageClass = isKids
    ? 'min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white px-4 py-8'
    : 'min-h-screen bg-cream text-ink px-4 py-8';

  const cardClass = isKids
    ? 'rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-6'
    : 'rounded-2xl bg-white border border-cream-border p-6';

  const countdownPill =
    color === 'emerald' ? 'bg-success/20 text-success'
    : color === 'amber' ? 'bg-amber-400/20 text-amber-700'
    : isKids ? 'bg-white/10 text-white/80' : 'bg-ink/10 text-ink';

  return (
    <main className={pageClass}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/${locale}/app/calendar`}
          className={
            'inline-flex items-center gap-2 text-sm font-semibold transition ' +
            (isKids ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink')
          }
        >
          {t('app.closure.back')}
        </Link>

        <header className="space-y-3 text-center">
          <div className="text-7xl" aria-hidden="true">{closure.emoji}</div>
          <h1
            className={
              'text-3xl sm:text-4xl font-extrabold tracking-tight ' +
              (isKids ? 'text-white' : 'text-ink')
            }
          >
            {closure.name}
          </h1>
          <p className={isKids ? 'text-white/80' : 'text-muted'}>
            {closure.school_name}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className={'px-3 py-1 rounded-full text-sm font-semibold ' + countdownPill}>
              {t('app.closure.daysAway', { count: Math.max(0, days) })}
            </span>
            <span
              className={
                'px-3 py-1 rounded-full text-sm font-semibold ' +
                (isKids ? 'bg-white/10 text-white' : 'bg-ink/10 text-ink')
              }
            >
              {t('app.closure.duration', { count: duration })}
            </span>
            {badge && (
              <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (isKids ? 'bg-cta-yellow/20 text-cta-yellow' : 'bg-gold/30 text-ink')}>
                {t(`closure.badge.${badge}`)}
              </span>
            )}
          </div>
          <p className={'text-sm ' + (isKids ? 'text-white/70' : 'text-muted')}>
            {new Date(closure.start_date).toLocaleDateString(locale)} – {new Date(closure.end_date).toLocaleDateString(locale)}
          </p>
        </header>

        <section className={cardClass + ' space-y-2'}>
          <p className={'text-xs font-bold uppercase tracking-widest ' + (isKids ? 'text-cta-yellow' : 'text-brand-purple')}>
            🌤️ {t('app.closure.weather.title')}
          </p>
          {weather ? (
            <>
              <p className={'text-2xl font-extrabold ' + (isKids ? 'text-white' : 'text-ink')}>
                {weather.highF}° / {weather.lowF}°
              </p>
              <p className={'text-sm ' + (isKids ? 'text-white/70' : 'text-muted')}>
                {weather.source === 'forecast' ? 'Forecast' : 'Monthly average'}
              </p>
            </>
          ) : (
            <div className="space-y-2" aria-label={t('app.closure.weather.loading')}>
              <div
                className={
                  'h-8 w-32 rounded-lg ' +
                  (isKids ? 'skeleton-shine' : 'skeleton-shine-cream')
                }
              />
              <div
                className={
                  'h-4 w-20 rounded-lg ' +
                  (isKids ? 'skeleton-shine' : 'skeleton-shine-cream')
                }
              />
              <span className="sr-only">{t('app.closure.weather.loading')}</span>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className={'text-xl font-bold ' + (isKids ? 'text-white' : 'text-ink')}>
            {t('app.closure.camps.title')}
          </h2>
          {camps.length === 0 && (
            <p className={'text-sm ' + (isKids ? 'text-white/70' : 'text-muted')}>
              {t('app.closure.camps.empty')}
            </p>
          )}
          {camps.length > 0 && (
            <div className="space-y-3">
              {camps.map((camp) => (
                <Link
                  key={camp.id}
                  href={`/${locale}/app/camps/${camp.slug}`}
                  className={
                    'block transition hover:-translate-y-0.5 ' +
                    cardClass
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className={'font-bold ' + (isKids ? 'text-white' : 'text-ink')}>
                        {camp.name}
                        {!camp.verified && (
                          <span className={'ml-2 text-xs font-normal ' + (isKids ? 'text-white/60' : 'text-muted')} title="Pending verification">⚠</span>
                        )}
                      </p>
                      <p className={'text-sm ' + (isKids ? 'text-white/70' : 'text-muted')}>
                        Ages {camp.ages_min}–{camp.ages_max} · {camp.price_tier}
                        {camp.neighborhood && ` · ${camp.neighborhood}`}
                      </p>
                      {camp.sessions_unknown ? (
                        <p
                          className={'text-xs italic ' + (isKids ? 'text-white/60' : 'text-muted')}
                          data-testid="closure-camp-sessions-unknown"
                        >
                          {t('app.camps.closure.sessionsPending')}
                        </p>
                      ) : null}
                    </div>
                    <span className={isKids ? 'text-white/70' : 'text-muted'}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <a
          href="/api/calendar.ics"
          download
          className={
            'block text-center rounded-full px-6 py-3 font-bold transition ' +
            (isKids
              ? 'bg-cta-yellow text-purple-deep hover:-translate-y-0.5'
              : 'bg-ink text-white hover:-translate-y-0.5')
          }
        >
          📥 {t('app.closure.addToCalendar')}
        </a>
      </div>
    </main>
  );
}
