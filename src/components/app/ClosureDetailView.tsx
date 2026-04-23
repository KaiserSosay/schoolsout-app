'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from '@/components/app/ModeProvider';
import { daysUntil, countdownColor } from '@/lib/countdown';
import { PlanThisDayWizard, type WizardKid, type WizardInitialPlan } from '@/components/app/PlanThisDayWizard';
import { AppBreadcrumb } from '@/components/app/AppBreadcrumb';

type Closure = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  school_name: string;
  school_id?: string | null;
  status?: 'ai_draft' | 'verified' | 'rejected';
  source?: string | null;
  source_url?: string | null;
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

export type FamilyActivity = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: 'outdoor' | 'indoor' | 'event' | 'beach' | 'park' | 'museum' | 'playspace' | 'nature' | 'library' | 'cultural' | 'market';
  ages_min: number;
  ages_max: number;
  cost_tier: 'free' | '$' | '$$' | '$$$';
  cost_note: string | null;
  neighborhood: string | null;
  website_url: string | null;
  weather_preference: 'any' | 'indoor_preferred' | 'outdoor_preferred';
  distance_miles: number | null;
};

function durationDays(start: string, end: string): number {
  return daysUntil(end, new Date(start + 'T00:00:00Z')) + 1;
}

// Public verification pill on the closure detail — honest disclosure per
// UX_PRINCIPLES.md rule #4. Green for admin-verified rows with a source
// URL, amber for AI drafts still awaiting review, muted fallback.
function VerificationPill({
  status,
  sourceUrl,
  isKids,
}: {
  status: 'ai_draft' | 'verified' | 'rejected';
  sourceUrl: string | null;
  isKids: boolean;
}) {
  if (status === 'verified') {
    const base = isKids
      ? 'bg-emerald-500/20 text-emerald-200'
      : 'bg-emerald-100 text-emerald-900';
    const label = sourceUrl ? '✓ Verified from source' : '✓ Verified';
    return (
      <div className="mt-2 inline-flex items-center gap-2">
        <span className={'rounded-full px-3 py-1 text-xs font-bold ' + base}>
          {label}
        </span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className={
              'text-xs font-semibold underline ' +
              (isKids ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink')
            }
          >
            view PDF
          </a>
        ) : null}
      </div>
    );
  }
  if (status === 'ai_draft') {
    const cls = isKids
      ? 'bg-amber-500/20 text-amber-200'
      : 'bg-amber-100 text-amber-900';
    return (
      <span className={'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ' + cls}>
        ⚠ Pending school verification
      </span>
    );
  }
  const cls = isKids ? 'bg-white/10 text-white/70' : 'bg-ink/10 text-muted';
  return (
    <span className={'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ' + cls}>
      — Unverified source
    </span>
  );
}

// Open-Meteo WMO weather codes we consider "rainy" enough to prefer indoor.
// Source: https://open-meteo.com/en/docs — codes 51–67 (drizzle, rain, freezing rain),
// 80–82 (rain showers), 95–99 (thunderstorm).
function isRainyCode(code: number | undefined): boolean {
  if (typeof code !== 'number') return false;
  if (code >= 51 && code <= 67) return true;
  if (code >= 80 && code <= 82) return true;
  if (code >= 95 && code <= 99) return true;
  return false;
}

function categoryEmoji(cat: FamilyActivity['category']): string {
  switch (cat) {
    case 'beach': return '🏖️';
    case 'park': return '🌳';
    case 'museum': return '🏛️';
    case 'nature': return '🌿';
    case 'outdoor': return '☀️';
    case 'indoor': return '🏠';
    case 'event': return '🎉';
    case 'playspace': return '🎡';
    case 'library': return '📚';
    case 'cultural': return '🎭';
    case 'market': return '🧺';
  }
}

export function ClosureDetailView({
  locale,
  closure,
  camps,
  activities = [],
  whyText = null,
  initialPlan = null,
  wizardKids = [],
}: {
  locale: string;
  closure: Closure;
  camps: Camp[];
  activities?: FamilyActivity[];
  whyText?: string | null;
  initialPlan?: WizardInitialPlan | null;
  wizardKids?: WizardKid[];
}) {
  const { mode } = useMode();
  const t = useTranslations();
  const isKids = mode === 'kids';

  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [plan, setPlan] = useState<WizardInitialPlan | null>(initialPlan);
  const [mergedKids, setMergedKids] = useState<WizardKid[]>(wizardKids);

  // Merge server kid_profiles (ordinal + age_range + school_id) with
  // localStorage so-kids (name + grade) so the wizard can render names
  // while the server never stores them (except via user_plans explicit opt-in).
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('so-kids') : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ name?: string; grade?: string }>;
      if (!Array.isArray(parsed)) return;
      setMergedKids(
        wizardKids.map((k, i) => ({
          ...k,
          name: parsed[i]?.name ?? k.name,
          grade: parsed[i]?.grade ?? k.grade,
        })),
      );
    } catch {
      // ignore malformed localStorage
    }
  }, [wizardKids]);

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
        <AppBreadcrumb
          href={`/${locale}/app/calendar`}
          where={t('app.nav.calendar')}
        />

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
          <VerificationPill
            status={closure.status ?? 'ai_draft'}
            sourceUrl={closure.source_url ?? null}
            isKids={isKids}
          />
        </header>

        {whyText ? (
          <section className={cardClass + ' space-y-2'}>
            <p className={'text-xs font-bold uppercase tracking-widest ' + (isKids ? 'text-cta-yellow' : 'text-brand-purple')}>
              {t('app.closure.why.heading')}
            </p>
            <p className={'text-sm leading-relaxed ' + (isKids ? 'text-white/90' : 'text-ink')}>
              {whyText}
            </p>
          </section>
        ) : null}

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

        {!isKids && (
          plan ? (
            <section
              className="flex flex-wrap items-center gap-2 rounded-2xl bg-white border border-cream-border px-4 py-3"
              data-testid="plan-pill"
            >
              <span className="flex-1 font-semibold text-ink">{t('app.planThisDay.saved')}</span>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-full border border-ink/20 font-semibold text-ink hover:bg-ink/5"
              >
                {t('app.planThisDay.edit')}
              </button>
            </section>
          ) : (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="w-full h-14 rounded-2xl bg-gold text-ink font-bold text-lg hover:-translate-y-0.5 transition"
              data-testid="plan-trigger"
            >
              ✨ {t('app.planThisDay.trigger')}
            </button>
          )
        )}

        <section className="space-y-3">
          <h2 className={'text-xl font-bold ' + (isKids ? 'text-white' : 'text-ink')}>
            {t('app.closure.camps.title')}
          </h2>
          {camps.length === 0 && (
            <div className={cardClass + ' space-y-2'}>
              <p className={'text-sm ' + (isKids ? 'text-white/90' : 'text-ink')}>
                {t('app.closure.integrity.none')}
              </p>
              <p className={'text-xs ' + (isKids ? 'text-white/60' : 'text-muted')}>
                {t('app.closure.integrity.browseActivities')}
              </p>
            </div>
          )}
          {camps.length > 0 && camps.length < 3 && (
            <p className={'text-xs italic ' + (isKids ? 'text-white/60' : 'text-muted')}>
              {t('app.closure.integrity.fewerThan', { count: camps.length })}
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

        {activities.length > 0 ? (
          <section className="space-y-3">
            <h2 className={'text-xl font-bold ' + (isKids ? 'text-white' : 'text-ink')}>
              {t('app.closure.activities.heading')}
            </h2>
            <p className={'text-sm ' + (isKids ? 'text-white/70' : 'text-muted')}>
              {weather && 'code' in weather && isRainyCode(weather.code)
                ? t('app.closure.activities.indoorPreferred')
                : t('app.closure.activities.outdoorPreferred')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {activities
                .slice()
                .sort((a, b) => {
                  // Weather-aware ordering:
                  //   rainy → indoor_preferred first, then any, then outdoor_preferred
                  //   sunny → outdoor_preferred first, then any, then indoor_preferred
                  const rainy = weather && 'code' in weather && isRainyCode(weather.code);
                  const weightOf = (w: FamilyActivity['weather_preference']) => {
                    if (rainy) {
                      return w === 'indoor_preferred' ? 0 : w === 'any' ? 1 : 2;
                    }
                    return w === 'outdoor_preferred' ? 0 : w === 'any' ? 1 : 2;
                  };
                  const w = weightOf(a.weather_preference) - weightOf(b.weather_preference);
                  if (w !== 0) return w;
                  const da = a.distance_miles ?? Number.POSITIVE_INFINITY;
                  const db = b.distance_miles ?? Number.POSITIVE_INFINITY;
                  return da - db;
                })
                .slice(0, 6)
                .map((a) => (
                  <a
                    key={a.id}
                    href={a.website_url ?? '#'}
                    target={a.website_url ? '_blank' : undefined}
                    rel={a.website_url ? 'noopener noreferrer' : undefined}
                    className={'block transition hover:-translate-y-0.5 ' + cardClass}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden="true">{categoryEmoji(a.category)}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className={'font-bold ' + (isKids ? 'text-white' : 'text-ink')}>
                          {a.name}
                        </p>
                        <p className={'text-xs ' + (isKids ? 'text-white/70' : 'text-muted')}>
                          Ages {a.ages_min}–{a.ages_max} · {a.cost_tier === 'free' ? 'Free' : a.cost_tier}
                          {a.neighborhood && ` · ${a.neighborhood}`}
                          {a.distance_miles != null && ` · 📍 ${a.distance_miles < 10 ? a.distance_miles.toFixed(1) : Math.round(a.distance_miles)} mi`}
                        </p>
                        {a.description && (
                          <p className={'text-xs ' + (isKids ? 'text-white/60' : 'text-muted')}>
                            {a.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          </section>
        ) : null}

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

      {!isKids && (
        <PlanThisDayWizard
          locale={locale}
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          closure={{
            id: closure.id,
            name: closure.name,
            start_date: closure.start_date,
            school_id: closure.school_id ?? null,
          }}
          kids={mergedKids}
          initialPlan={plan}
          onSaved={(planId) =>
            setPlan((prev) => ({
              id: planId,
              plan_type: prev?.plan_type ?? 'coverage',
            }))
          }
          onRemoved={() => setPlan(null)}
        />
      )}
    </main>
  );
}
