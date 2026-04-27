'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from '@/components/app/ModeProvider';
import { SaveCampButton } from '@/components/app/SaveCampButton';
import { CampCompletenessBadge } from '@/components/app/CampCompletenessBadge';
import { formatMiles } from '@/lib/distance';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';
import type { CompletenessCampShape } from '@/lib/camps/completeness';

// One camp card to rule them all. Three modes:
//   - public         compact card for /camps (logged-out directory). No save
//                    affordance other than a disabled "Sign in to save" star
//                    in the same corner the functional save lives in. URL
//                    routes to /{locale}/camps/{slug}.
//   - app            same compact shape but shows logistics density (hours,
//                    care rows, distance, completeness). Save star is
//                    functional. URL routes to /{locale}/app/camps/{slug}.
//                    Mode-aware (parents vs kids glassy variant).
//   - wishlist-tile  minimal 2-line summary for the dashboard wishlist
//                    section. Functional save star, no extras. URL routes to
//                    /{locale}/app/camps/{slug}. Always parent-styled (the
//                    dashboard wishlist tile reads as a summary, not a
//                    directory cell).
//
// Internally each mode is its own component so React's rules-of-hooks stay
// happy: useMode() is only called inside <AppCard> / <WishlistTileCard>,
// never inside <PublicCard> (the public pages don't mount ModeProvider).

export type CampCardMode = 'public' | 'app' | 'wishlist-tile';

export type UnifiedCampCardCamp = CompletenessCampShape & {
  id: string;
  slug: string;
  name: string;
  ages_min?: number | null;
  ages_max?: number | null;
  price_tier?: '$' | '$$' | '$$$' | null;
  categories?: string[] | null;
  neighborhood?: string | null;
  verified?: boolean;
  last_verified_at?: string | null;
  is_featured?: boolean;
  featured_until?: string | null;
  is_open_this_closure?: boolean;
  // App-mode enrichment (ignored elsewhere)
  description?: string | null;
  distance_miles?: number | null;
  distance_approximate?: boolean;
  hours_start?: string | null;
  hours_end?: string | null;
  before_care_offered?: boolean;
  before_care_start?: string | null;
  after_care_offered?: boolean;
  after_care_end?: string | null;
  phone?: string | null;
  logistics_verified?: boolean;
  sessions_unknown?: boolean;
  // Completeness inputs (already on CompletenessCampShape but typed loosely
  // so existing callers compile without a wider migration).
  address?: string | null;
  website_url?: string | null;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  registration_url?: string | null;
  registration_deadline?: string | null;
};

const VERIFIED_FRESHNESS_MS = 90 * 24 * 60 * 60 * 1000;

export function isFreshlyVerified(
  camp: Pick<UnifiedCampCardCamp, 'verified' | 'last_verified_at'>,
  now: number = Date.now(),
): boolean {
  if (!camp.verified) return false;
  if (!camp.last_verified_at) return false;
  return now - new Date(camp.last_verified_at).getTime() < VERIFIED_FRESHNESS_MS;
}

export function isCurrentlyFeatured(
  camp: Pick<UnifiedCampCardCamp, 'is_featured' | 'featured_until'>,
  now: number = Date.now(),
): boolean {
  if (!camp.is_featured) return false;
  if (!camp.featured_until) return false;
  return new Date(camp.featured_until).getTime() > now;
}

export function formatTime(hhmm: string): string {
  const [hRaw, mRaw = '0'] = hhmm.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h12}${period}`;
  return `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function fullWorkday(camp: UnifiedCampCardCamp): boolean {
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

export function UnifiedCampCard(props: {
  camp: UnifiedCampCardCamp;
  mode: CampCardMode;
  locale: string;
  isSaved?: boolean;
}) {
  if (props.mode === 'public') {
    return <PublicCard camp={props.camp} locale={props.locale} />;
  }
  if (props.mode === 'wishlist-tile') {
    return (
      <WishlistTileCard
        camp={props.camp}
        locale={props.locale}
        isSaved={props.isSaved ?? true}
      />
    );
  }
  return (
    <AppCard
      camp={props.camp}
      locale={props.locale}
      isSaved={props.isSaved ?? false}
    />
  );
}

// ----- public mode -----------------------------------------------------------

function PublicCard({
  camp,
  locale,
}: {
  camp: UnifiedCampCardCamp;
  locale: string;
}) {
  const t = useTranslations('public.camps');
  const tApp = useTranslations('app.camps');
  const tBadge = useTranslations('camps.religiousBadge');
  const tCat = useTranslations('app.camps.completeness.field');
  const { score, missing } = computeCompleteness(camp);
  const band = bandFor(score);
  const pills = (camp.categories ?? []).slice(0, 2);
  const isReligious = (camp.categories ?? []).includes('religious');
  const now = Date.now();
  const showVerified = isFreshlyVerified(camp, now);
  const showFeatured = isCurrentlyFeatured(camp, now);

  return (
    <article
      className="relative rounded-2xl border border-cream-border bg-white p-4 transition-shadow hover:shadow-md"
      data-testid="unified-camp-card-public"
    >
      <Link
        href={`/${locale}/camps/${camp.slug}`}
        className="flex min-w-0 flex-col gap-1.5"
        aria-label={t('viewCamp', { name: camp.name })}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className="truncate text-base font-black text-ink"
            style={{ letterSpacing: '-0.01em' }}
          >
            {camp.name}
          </h3>
          {/* Spacer reserved for the absolute-positioned save star below.
              Keeps the title from running under the disabled control. */}
          <span aria-hidden className="invisible shrink-0 text-xl">
            ☆
          </span>
        </div>
        <p className="text-xs text-muted">
          {camp.ages_min != null && camp.ages_max != null
            ? t('ages', {
                min: camp.ages_min,
                max: camp.ages_max,
                price: camp.price_tier ?? '—',
              })
            : t('agesUnknown')}
          {camp.neighborhood ? ' · ' + camp.neighborhood : ''}
        </p>
        {showVerified || showFeatured || camp.is_open_this_closure || isReligious ? (
          <div className="flex flex-wrap gap-1.5">
            {camp.is_open_this_closure ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900"
                title={
                  locale === 'es'
                    ? 'Este campamento confirmó que estará abierto este día'
                    : 'This camp confirmed they are open on this day'
                }
                aria-label={locale === 'es' ? 'Abierto este día' : 'Open this day'}
                data-testid="public-camp-open-this-day-pill"
              >
                <span aria-hidden="true">✓</span>
                {locale === 'es' ? 'Abierto este día' : 'Open this day'}
              </span>
            ) : null}
            {showFeatured ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-cta-yellow px-2 py-0.5 text-[10px] font-bold text-ink"
                title={tApp('featured.tooltip')}
                aria-label={tApp('featured.label')}
                data-testid="public-camp-featured-badge"
              >
                <span aria-hidden="true">⭐</span>
                {tApp('featured.label')}
              </span>
            ) : null}
            {showVerified ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-cream px-2 py-0.5 text-[10px] font-bold text-ink"
                title={tApp('verified.tooltip')}
                aria-label={tApp('verified.label')}
                data-testid="public-camp-verified-badge"
              >
                <span aria-hidden="true">✓</span>
                {tApp('verified.label')}
              </span>
            ) : null}
            {isReligious ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-cream-border bg-white px-2 py-0.5 text-[10px] font-bold text-ink"
                title={tBadge('tooltip')}
                aria-label={tBadge('label')}
                data-testid="camp-religious-badge"
              >
                <span aria-hidden="true">🙏</span>
                {tBadge('label')}
              </span>
            ) : null}
          </div>
        ) : null}
        {pills.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pills.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full bg-purple-soft px-2 py-0.5 text-[10px] font-bold text-brand-purple"
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
        {band !== 'complete' ? (
          <p className="mt-1 text-[11px] text-muted">
            {band === 'limited'
              ? t('limited')
              : t('partial', {
                  fields: missing.slice(0, 3).map((m) => tCat(m)).join(', '),
                })}
          </p>
        ) : null}
      </Link>
      {/* Disabled save affordance — same shape as logged-in unsaved star, but
          inert + tooltipped. Per Q1 design decision: ghost UI rather than a
          lock icon, so the click target reads "this is the save button, you
          need to sign in to use it." Not wrapped in the <Link> above so the
          tooltip surfaces even when hovering the star itself. */}
      <button
        type="button"
        disabled
        aria-label={t('signInToSave')}
        title={t('signInToSave')}
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted opacity-40"
        data-testid="public-camp-disabled-save"
      >
        <span aria-hidden>☆</span>
      </button>
    </article>
  );
}

// ----- app mode --------------------------------------------------------------

function AppCard({
  camp,
  locale,
  isSaved,
}: {
  camp: UnifiedCampCardCamp;
  locale: string;
  isSaved: boolean;
}) {
  const t = useTranslations('app.camps');
  const tBadge = useTranslations('camps.religiousBadge');
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

  const pills = (camp.categories ?? []).slice(0, 2);

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
      ? (camp.distance_approximate ? '~' : '') + formatMiles(camp.distance_miles)
      : null;

  const showVerified = isFreshlyVerified(camp);
  const showFeatured = isCurrentlyFeatured(camp);
  const isReligious = (camp.categories ?? []).includes('religious');

  return (
    <article
      className={'relative flex flex-col gap-1.5 rounded-2xl p-4 transition-colors ' + containerCls}
      data-testid="unified-camp-card-app"
    >
      <Link
        href={`/${locale}/app/camps/${camp.slug}`}
        className="flex min-w-0 flex-col gap-1.5"
        aria-label={t('viewCamp', { name: camp.name })}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
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
          {/* Spacer for the absolute-positioned save button. */}
          <span aria-hidden className="invisible shrink-0 h-11 w-11" />
        </div>

        {showVerified || showFeatured || isReligious ? (
          <div className="flex flex-wrap gap-1.5">
            {showFeatured ? (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  (mode === 'parents'
                    ? 'bg-cta-yellow text-ink'
                    : 'bg-cta-yellow text-ink')
                }
                title={t('featured.tooltip')}
                aria-label={t('featured.label')}
                data-testid="camp-featured-badge"
              >
                <span aria-hidden="true">⭐</span>
                {t('featured.label')}
              </span>
            ) : null}
            {showVerified ? (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  (mode === 'parents'
                    ? 'border border-success/40 bg-cream text-ink'
                    : 'border border-white/20 bg-white/15 text-white')
                }
                title={t('verified.tooltip')}
                aria-label={t('verified.label')}
                data-testid="camp-verified-badge"
              >
                <span aria-hidden="true">✓</span>
                {t('verified.label')}
              </span>
            ) : null}
            {isReligious ? (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  (mode === 'parents'
                    ? 'border border-cream-border bg-white text-ink'
                    : 'border border-white/20 bg-white/10 text-white')
                }
                title={tBadge('tooltip')}
                aria-label={tBadge('label')}
                data-testid="camp-religious-badge"
              >
                <span aria-hidden="true">🙏</span>
                {tBadge('label')}
              </span>
            ) : null}
          </div>
        ) : null}

        <p className={'text-xs ' + mutedCls}>
          {camp.ages_min != null && camp.ages_max != null
            ? t('ages', {
                min: camp.ages_min,
                max: camp.ages_max,
                price: camp.price_tier ?? '—',
              })
            : t('agesUnknown')}
          {camp.neighborhood ? ' · ' + camp.neighborhood : ''}
        </p>

        {distanceLabel ? (
          <p
            className={'text-xs ' + mutedCls}
            aria-label={`Distance ${distanceLabel}`}
            data-testid="camp-distance"
          >
            📍 {distanceLabel}
          </p>
        ) : null}

        {hasHours ? (
          <p className={'text-xs ' + mutedCls} data-testid="camp-hours">
            ⏰ {formatTime(camp.hours_start!)}–{formatTime(camp.hours_end!)}
          </p>
        ) : hoursPending ? (
          <p className={'text-xs italic ' + mutedCls} data-testid="camp-hours-pending">
            ⏰ {t('hours.pending')} · {t('hours.callToConfirm')}
          </p>
        ) : null}

        {showFullWorkday ? (
          <p
            className={
              'text-xs font-semibold ' +
              (mode === 'parents' ? 'text-success' : 'text-cta-yellow')
            }
            data-testid="camp-full-workday"
          >
            🟢 {t('care.fullWorkday')} ·{' '}
            {camp.before_care_offered && camp.before_care_start
              ? formatTime(camp.before_care_start)
              : formatTime(camp.hours_start!)}
            {' → '}
            {camp.after_care_offered && camp.after_care_end
              ? formatTime(camp.after_care_end)
              : formatTime(camp.hours_end!)}
          </p>
        ) : null}

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

      {/* Save + completeness anchored top-right so they stay accessible inside
          a grid cell that may be narrower than the old full-width row. */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
        <SaveCampButton
          campId={camp.id}
          campName={camp.name}
          initiallySaved={isSaved}
          size="md"
        />
        <CompletenessCorner camp={camp} />
      </div>
    </article>
  );
}

// Compute completeness inline; suppress when signals are sparse (avoid
// giving a misleading "Missing: everything" on partial shapes passed by
// callers that don't yet include the enrichment fields).
function CompletenessCorner({ camp }: { camp: UnifiedCampCardCamp }) {
  const signals: boolean[] = [
    typeof camp.phone !== 'undefined',
    typeof camp.address !== 'undefined',
    typeof camp.website_url !== 'undefined',
    typeof camp.ages_min === 'number',
    typeof camp.hours_start !== 'undefined',
    typeof camp.description !== 'undefined',
  ];
  if (signals.filter(Boolean).length < 3) return null;
  const { score, missing } = computeCompleteness(camp);
  const band = bandFor(score);
  if (band === 'complete') return null;
  return (
    <CampCompletenessBadge
      band={band}
      missing={missing}
      campName={camp.name}
      campSlug={camp.slug}
    />
  );
}

// ----- wishlist-tile mode ----------------------------------------------------

function WishlistTileCard({
  camp,
  locale,
  isSaved,
}: {
  camp: UnifiedCampCardCamp;
  locale: string;
  isSaved: boolean;
}) {
  // Wishlist tile is rendered inside <ParentDashboard> which mounts
  // ModeProvider, but the tile itself is a low-density summary surface — we
  // skip the kid-mode glassy treatment to keep the dashboard cohesive when
  // in kid mode (the wishlist would otherwise read as an out-of-place
  // light-on-light card).
  return (
    <article
      className="relative flex items-center gap-3 rounded-2xl border border-cream-border bg-white px-4 py-3 transition-colors hover:border-brand-purple/40"
      data-testid="unified-camp-card-wishlist"
    >
      <Link
        href={`/${locale}/app/camps/${camp.slug}`}
        className="flex min-w-0 flex-1 flex-col gap-0.5"
      >
        <p className="truncate text-sm font-black text-ink">{camp.name}</p>
        <p className="truncate text-xs text-muted">
          {camp.ages_min != null && camp.ages_max != null
            ? `Ages ${camp.ages_min}–${camp.ages_max}`
            : 'Ages — call to confirm'}
          {camp.price_tier ? ` · ${camp.price_tier}` : ''}
        </p>
      </Link>
      <SaveCampButton
        campId={camp.id}
        campName={camp.name}
        initiallySaved={isSaved}
        size="sm"
      />
    </article>
  );
}
