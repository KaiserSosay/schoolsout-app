'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { SaveCampButton } from './SaveCampButton';
import { formatMiles } from '@/lib/distance';

// DECISION: Card is a <Link>. Save button stopPropagation's to avoid nav.
// Mode-aware: cream+border in parent mode, white/10 glass in kid mode.
// The "⚠ pending verification" indicator is deliberately small and non-loud —
// we want honest disclosure without scaring parents off unreviewed listings.
//
// Logistics rendering rule: NO FAKE DATA. When hours or care data is missing
// AND logistics_verified=false, we render "pending / call to confirm" rather
// than invent plausible hours. When logistics_verified=true AND both
// before_care_offered and after_care_offered are explicit false, we render
// "No extended care" as definitive information.

export type CampCardCamp = {
  id: string;
  slug: string;
  name: string;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  neighborhood: string | null;
  verified: boolean;
  is_featured?: boolean;
  description?: string | null;
  distance_miles?: number | null;
  hours_start?: string | null;
  hours_end?: string | null;
  before_care_offered?: boolean;
  before_care_start?: string | null;
  after_care_offered?: boolean;
  after_care_end?: string | null;
  phone?: string | null;
  logistics_verified?: boolean;
  sessions_unknown?: boolean;
};

export function formatTime(hhmm: string): string {
  // Accepts "09:00", "09:00:00", "7:30", "07:30:00" etc.
  const [hRaw, mRaw = '0'] = hhmm.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h12}${period}`;
  return `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function fullWorkday(camp: CampCardCamp): boolean {
  const effectiveStart =
    camp.before_care_offered && camp.before_care_start
      ? camp.before_care_start
      : camp.hours_start;
  const effectiveEnd =
    camp.after_care_offered && camp.after_care_end
      ? camp.after_care_end
      : camp.hours_end;
  if (!effectiveStart || !effectiveEnd) return false;
  return effectiveStart <= '08:00' && effectiveEnd >= '17:30';
}

export function CampCard({
  camp,
  saved,
  locale,
}: {
  camp: CampCardCamp;
  saved: boolean;
  locale: string;
}) {
  const t = useTranslations('app.camps');
  const { mode } = useMode();

  const containerCls =
    mode === 'parents'
      ? 'border border-cream-border bg-white hover:border-brand-purple/40'
      : 'border border-white/10 bg-white/10 backdrop-blur-md hover:border-white/30';

  const titleCls = mode === 'parents' ? 'text-ink' : 'text-white';
  const mutedCls = mode === 'parents' ? 'text-muted' : 'text-white/70';
  const pillCls =
    mode === 'parents'
      ? 'bg-purple-soft text-brand-purple'
      : 'bg-white/15 text-white';

  const pills = camp.categories.slice(0, 2);

  // Logistics row flags
  const hasHours = !!camp.hours_start && !!camp.hours_end;
  const hoursPending = !hasHours && !camp.logistics_verified;
  const hasAnyCareInfo =
    typeof camp.before_care_offered === 'boolean' ||
    typeof camp.after_care_offered === 'boolean';
  const carePending =
    !camp.logistics_verified &&
    !hasAnyCareInfo &&
    !camp.before_care_offered &&
    !camp.after_care_offered;
  const hasNoExtendedCare =
    camp.logistics_verified &&
    camp.before_care_offered === false &&
    camp.after_care_offered === false;
  const showFullWorkday = fullWorkday(camp);

  const distanceLabel =
    typeof camp.distance_miles === 'number'
      ? formatMiles(camp.distance_miles)
      : null;

  return (
    <article
      className={
        'relative flex items-center gap-4 rounded-2xl p-4 transition-colors ' +
        containerCls
      }
    >
      <Link
        href={`/${locale}/app/camps/${camp.slug}`}
        className="flex min-w-0 flex-1 flex-col gap-1.5"
        aria-label={t('viewCamp', { name: camp.name })}
      >
        <div className="flex items-center gap-2">
          <h3
            className={'truncate text-base font-black ' + titleCls}
            style={{ letterSpacing: '-0.01em' }}
          >
            {camp.name}
          </h3>
          {!camp.verified ? (
            <span
              className={'shrink-0 text-xs ' + mutedCls}
              title={t('pendingVerification')}
              aria-label={t('pendingVerification')}
            >
              ⚠
            </span>
          ) : null}
        </div>
        <p className={'text-xs ' + mutedCls}>
          {t('ages', {
            min: camp.ages_min,
            max: camp.ages_max,
            price: camp.price_tier,
          })}
          {camp.neighborhood ? ' · ' + camp.neighborhood : ''}
        </p>

        {/* Distance row — only render if we know */}
        {distanceLabel ? (
          <p
            className={'text-xs ' + mutedCls}
            aria-label={`Distance ${distanceLabel}`}
            data-testid="camp-distance"
          >
            📍 {distanceLabel}
          </p>
        ) : null}

        {/* Hours row */}
        {hasHours ? (
          <p className={'text-xs ' + mutedCls} data-testid="camp-hours">
            ⏰ {formatTime(camp.hours_start!)}–{formatTime(camp.hours_end!)}
          </p>
        ) : hoursPending ? (
          <p className={'text-xs italic ' + mutedCls} data-testid="camp-hours-pending">
            ⏰ {t('hours.pending')} · {t('hours.callToConfirm')}
          </p>
        ) : null}

        {/* Full-workday badge */}
        {showFullWorkday ? (
          <p
            className={'text-xs font-semibold ' + (mode === 'parents' ? 'text-success' : 'text-cta-yellow')}
            data-testid="camp-full-workday"
          >
            🟢 {t('care.fullWorkday')} ·{' '}
            {camp.before_care_offered && camp.before_care_start ? formatTime(camp.before_care_start) : formatTime(camp.hours_start!)}
            {' → '}
            {camp.after_care_offered && camp.after_care_end ? formatTime(camp.after_care_end) : formatTime(camp.hours_end!)}
          </p>
        ) : null}

        {/* Before-care / after-care explicit */}
        {camp.before_care_offered && camp.before_care_start ? (
          <p className={'text-xs ' + mutedCls} data-testid="camp-before-care">
            ✅ {t('care.before')} {formatTime(camp.before_care_start)}
          </p>
        ) : null}
        {camp.after_care_offered && camp.after_care_end ? (
          <p className={'text-xs ' + mutedCls} data-testid="camp-after-care">
            ✅ {t('care.after')} {formatTime(camp.after_care_end)}
          </p>
        ) : null}

        {hasNoExtendedCare ? (
          <p className={'text-xs ' + mutedCls} data-testid="camp-care-none">
            ❌ {t('care.none')}
          </p>
        ) : null}

        {carePending ? (
          <p className={'text-xs italic ' + mutedCls} data-testid="camp-care-pending">
            ℹ️ {t('care.pending')}
          </p>
        ) : null}

        {camp.sessions_unknown ? (
          <p className={'text-xs italic ' + mutedCls} data-testid="camp-sessions-unknown">
            {t('closure.sessionsPending')}
          </p>
        ) : null}

        {pills.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pills.map((c) => (
              <span
                key={c}
                className={
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  pillCls
                }
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </Link>

      <SaveCampButton
        campId={camp.id}
        campName={camp.name}
        initiallySaved={saved}
        size="md"
      />
    </article>
  );
}
