'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import { schoolCode } from '@/lib/school-codes';
import type { Closure } from '@/lib/closures';

type ClosureWithSchool = Closure & { schoolName: string | null };

type Profile = {
  id: string;
  school_id: string;
  age_range: string;
  ordinal: number;
  schools?: { id: string; name: string } | null;
};

type Camp = {
  id: string;
  slug: string;
  name: string;
  price_tier: '$' | '$$' | '$$$';
  ages_min: number;
  ages_max: number;
  categories: string[];
  website_url: string | null;
  neighborhood: string | null;
};

type Save = { id: string; camp: Camp | null };

type Activity = {
  id: string;
  action: 'saved_camp' | 'unsaved_camp' | 'viewed_closure' | 'viewed_camp';
  target_id: string | null;
  target_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

// DECISION: Kid Mode is deliberately loud. The hero wordmark uses the existing
// animate-gradient-pan keyframe. The three featured closure cards cycle through
// three gradient stops with staggered fade-ups. The rest-of-year accordion
// uses native <details>/<summary> — zero JS, keyboard accessible, and it
// collapses cleanly on reduced-motion.
const CARD_GRADIENTS = [
  'from-purple-600 via-purple-800 to-purple-900',
  'from-red-500 via-rose-700 to-rose-900',
  'from-blue-500 via-indigo-700 to-indigo-900',
];

function duration(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00Z').getTime();
  const e = new Date(end + 'T00:00:00Z').getTime();
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}

export function KidDashboard({
  locale,
  closures,
}: {
  locale: string;
  displayName: string | null;
  profiles: Profile[];
  closures: ClosureWithSchool[];
  saves: Save[];
  savesCount: number;
  activity: Activity[];
}) {
  const t = useTranslations('app.kid');
  const tDash = useTranslations('app.dashboard.upNext');

  const featured = closures.slice(0, 3);
  const rest = closures.slice(3);

  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      data-mode="kids"
      className="min-h-[80vh] bg-gradient-to-b from-purple-deep via-purple-mid to-blue-deep px-4 py-8 md:px-6 md:py-12"
    >
      <div className="mx-auto max-w-4xl">
        {/* Animated wordmark hero */}
        <div className="text-center">
          <h1
            data-testid="kid-wordmark"
            className="animate-gradient-pan bg-gradient-to-r from-purple-400 via-red-400 to-blue-400 bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            School&apos;s Out!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/80 md:text-base">
            {t('subtitle')}
          </p>
        </div>

        {/* Three featured closures */}
        {featured.length ? (
          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3">
            {featured.map((c, idx) => {
              const days = Math.max(0, daysUntil(c.start_date));
              const len = duration(c.start_date, c.end_date);
              const lenLabel =
                len >= 5
                  ? t('longBreak')
                  : tDash('daysOff', { count: len });
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

              const start = new Date(c.start_date + 'T00:00:00');
              const end = new Date(c.end_date + 'T00:00:00');
              const dateLabel =
                len > 1
                  ? `${fmt.format(start)} – ${fmt.format(end)}`
                  : fmt.format(start);

              return (
                <Link
                  key={c.id}
                  href={`/${locale}/app/camps`}
                  className={
                    'group animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-xl transition-transform hover:-translate-y-0.5 ' +
                    gradient
                  }
                  style={{
                    animationDelay: `${(idx + 1) * 100}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-6xl leading-none" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      {schoolCode(c.schoolName)}
                    </span>
                  </div>
                  <h2
                    className="mt-4 text-[22px] leading-tight"
                    style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
                  >
                    {c.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                      {lenLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-cta-yellow px-2.5 py-1 text-[11px] font-black text-purple-deep">
                      {tDash('daysAway', { count: days })}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/75">{dateLabel}</p>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white">
                    {t('tapHint')} →
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/80 backdrop-blur">
            <div className="text-6xl" aria-hidden>
              🎉
            </div>
            <p className="mt-3 text-base font-bold">{t('empty')}</p>
          </div>
        )}

        {/* Rest of year accordion */}
        {rest.length ? (
          <details className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-black uppercase tracking-wider text-white/90">
              <span>
                {t('restOfYear')}
                <span className="ml-2 text-white/50">({rest.length})</span>
              </span>
              <span aria-hidden className="text-white/60 transition-transform">
                ▾
              </span>
            </summary>
            <ul className="max-h-96 divide-y divide-white/10 overflow-auto">
              {rest.map((c) => {
                const days = Math.max(0, daysUntil(c.start_date));
                const start = new Date(c.start_date + 'T00:00:00');
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3 text-white"
                  >
                    <span className="text-2xl" aria-hidden>
                      {c.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{c.name}</p>
                      <p className="text-[11px] text-white/60">
                        {schoolCode(c.schoolName)} · {fmt.format(start)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/80">
                      {tDash('daysAway', { count: days })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}
