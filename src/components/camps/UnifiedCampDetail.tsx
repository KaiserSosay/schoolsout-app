'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from '@/components/app/ModeProvider';
import { SaveCampButton } from '@/components/app/SaveCampButton';
import { AppBreadcrumb } from '@/components/app/AppBreadcrumb';
import { CampDescription } from '@/components/camps/CampDescription';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';

// One detail view shared by /{locale}/camps/{slug} and
// /{locale}/app/camps/{slug}. Both modes show the SAME fact grid (per Q6 —
// data-shape divergence fix), so a parent who signs in never loses
// information they could see logged-out.
//
// Internally split into PublicDetail / AppDetail so React's rules-of-hooks
// stay happy: useMode() is only called inside <AppDetail> (the public pages
// don't mount ModeProvider).
//
// The bottom signup CTA, the JSON-LD output, and the back-link styling all
// live in the parent server pages — those are mode-specific concerns the
// unified component deliberately doesn't touch (JSON-LD especially: regress
// SEO and we can't tell from page metrics for weeks).

export type UnifiedCampDetailMode = 'public' | 'app';

// Structured-field shapes mirror the JSONB contracts in
// supabase/migrations/054_camps_structured_fields.sql. All optional —
// silent-skip on the render side when null/empty (R6 trust posture: no
// "TBD" placeholders, no empty section headers).
export type CampSession = {
  label: string | null;
  start_date: string | null;
  end_date: string | null;
  weekly_themes: string[] | null;
  notes: string | null;
};

export type CampPricingTier = {
  label: string | null;
  hours: string | null;
  session_price_cents: number | null;
  both_sessions_price_cents: number | null;
  weekly_price_cents: number | null;
  notes: string | null;
};

export type CampFee = {
  label: string | null;
  amount_cents: number | null;
  refundable: boolean | null;
  notes: string | null;
};

export type CampEnrollmentWindow = {
  opens_at: string | null;
  closes_at: string | null;
  status: 'open' | 'closed' | 'until_full' | null;
};

export type UnifiedCampDetailCamp = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_url?: string | null;
  ages_min: number | null;
  ages_max: number | null;
  price_tier: '$' | '$$' | '$$$' | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  categories: string[] | null;
  website_url: string | null;
  image_url: string | null;
  neighborhood: string | null;
  phone: string | null;
  address: string | null;
  hours_start: string | null;
  hours_end: string | null;
  registration_url: string | null;
  registration_deadline: string | null;
  verified: boolean;
  last_verified_at: string | null;
  // Structured fields (mig054). Optional on the type so existing call
  // sites that haven't extended their SELECT compile cleanly.
  sessions?: CampSession[] | null;
  pricing_tiers?: CampPricingTier[] | null;
  activities?: string[] | null;
  fees?: CampFee[] | null;
  enrollment_window?: CampEnrollmentWindow | null;
  what_to_bring?: string[] | null;
  lunch_policy?: string | null;
  extended_care_policy?: string | null;
};

function formatTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const [hRaw, mRaw = '0'] = hhmm.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${h12}${period}`
    : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function formatPrice(
  minCents: number | null,
  maxCents: number | null,
): string | null {
  if (minCents == null && maxCents == null) return null;
  const fmt = (c: number) => `$${Math.round(c / 100)}`;
  if (minCents != null && maxCents != null && minCents !== maxCents) {
    return `${fmt(minCents)} – ${fmt(maxCents)}`;
  }
  return fmt((minCents ?? maxCents) as number);
}

export function UnifiedCampDetail(props: {
  camp: UnifiedCampDetailCamp;
  mode: UnifiedCampDetailMode;
  locale: string;
  isSaved?: boolean;
  isAdmin?: boolean;
}) {
  if (props.mode === 'public') {
    return (
      <PublicDetail
        camp={props.camp}
        locale={props.locale}
        isAdmin={props.isAdmin ?? false}
      />
    );
  }
  return (
    <AppDetail
      camp={props.camp}
      locale={props.locale}
      isSaved={props.isSaved ?? false}
      isAdmin={props.isAdmin ?? false}
    />
  );
}

// Pill that links admins from a camp detail page to the wired edit form.
// Same shape across public + app modes so admin muscle memory is identical
// regardless of which surface they land on.
function AdminEditPill({
  campSlug,
  campName,
  locale,
  className,
}: {
  campSlug: string;
  campName: string;
  locale: string;
  className: string;
}) {
  const t = useTranslations('camps.actions');
  return (
    <Link
      href={`/${locale}/admin/camps/${campSlug}/edit`}
      data-testid="camp-detail-admin-edit"
      aria-label={t('editAdmin', { name: campName })}
      className={
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-sm hover:bg-amber-200 ' +
        className
      }
    >
      <span aria-hidden>🛡️</span>
      <span>{t('edit')}</span>
    </Link>
  );
}

// ----- shared fact grid -----------------------------------------------------

function FactGrid({
  camp,
  locale,
  mode,
}: {
  camp: UnifiedCampDetailCamp;
  locale: string;
  mode: UnifiedCampDetailMode;
}) {
  const t = useTranslations('public.campDetail');
  const price = formatPrice(camp.price_min_cents, camp.price_max_cents);
  const startFmt = formatTime(camp.hours_start);
  const endFmt = formatTime(camp.hours_end);

  // App mode keeps the dark-on-light fact tile in parent mode; kid mode is
  // handled by the AppDetail wrapper which sets its own classes around this.
  const labelCls =
    mode === 'app'
      ? 'text-[11px] font-black uppercase tracking-wider text-muted'
      : 'text-[11px] font-black uppercase tracking-wider text-muted';
  const valueCls =
    mode === 'app'
      ? 'mt-1 text-sm font-bold text-ink'
      : 'mt-1 text-sm font-bold text-ink';

  return (
    <section
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      data-testid="unified-camp-detail-facts"
    >
      {camp.ages_min != null && camp.ages_max != null ? (
        <Fact label={t('agesLabel')} labelCls={labelCls} valueCls={valueCls}>
          {camp.ages_min}–{camp.ages_max}
        </Fact>
      ) : null}
      {price ? (
        <Fact label={t('priceLabel')} labelCls={labelCls} valueCls={valueCls}>
          {price}
        </Fact>
      ) : null}
      {startFmt && endFmt ? (
        <Fact label={t('hoursLabel')} labelCls={labelCls} valueCls={valueCls}>
          {startFmt}–{endFmt}
        </Fact>
      ) : null}
      {camp.address ? (
        <Fact label={t('addressLabel')} labelCls={labelCls} valueCls={valueCls}>
          {camp.address}
        </Fact>
      ) : null}
      {camp.registration_deadline ? (
        <Fact
          label={t('registerDeadlineLabel')}
          labelCls={labelCls}
          valueCls={valueCls}
        >
          {new Date(camp.registration_deadline).toLocaleDateString(
            locale === 'es' ? 'es-US' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' },
          )}
        </Fact>
      ) : null}
    </section>
  );
}

function Fact({
  label,
  children,
  labelCls,
  valueCls,
}: {
  label: string;
  children: React.ReactNode;
  labelCls: string;
  valueCls: string;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <p className={valueCls}>{children}</p>
    </div>
  );
}

// ----- public mode ----------------------------------------------------------

function PublicDetail({
  camp,
  locale,
  isAdmin,
}: {
  camp: UnifiedCampDetailCamp;
  locale: string;
  isAdmin: boolean;
}) {
  const t = useTranslations('public.campDetail');
  const tApp = useTranslations('public.camps');
  const tBadge = useTranslations('camps.religiousBadge');
  const isReligious = (camp.categories ?? []).includes('religious');
  const completeness = computeCompleteness({
    ...camp,
    // computeCompleteness expects a CompletenessCampShape — pass through the
    // fields we have. Missing fields just lower the score.
  });
  const band = bandFor(completeness.score);
  const lastVerifiedDate = camp.last_verified_at
    ? new Date(camp.last_verified_at).toLocaleDateString(
        locale === 'es' ? 'es-US' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' },
      )
    : null;

  return (
    <>
      <Link
        href={`/${locale}/camps`}
        className="mb-3 inline-flex text-xs font-bold text-brand-purple hover:underline"
        data-testid="unified-camp-detail-back-link"
      >
        {t('back')}
      </Link>

      <article
        className="relative overflow-hidden rounded-3xl border border-cream-border bg-white"
        data-testid="unified-camp-detail-public"
      >
        {(() => {
          // hero_url is the Phase B admin-uploaded hero. Fall back to the
          // older image_url column for any camp that already has one (none
          // today, but the cascade keeps us safe for future imports), then
          // to the gradient.
          const hero = camp.hero_url ?? camp.image_url ?? null;
          if (hero) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero}
                alt={camp.name}
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
                data-testid="camp-detail-hero-image"
              />
            );
          }
          return (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-purple via-purple-600 to-blue-600" />
          );
        })()}

        {/* Disabled save star — same shape as the logged-in functional
            button, in the same top-right corner. Per Q1 ghost-UI consistency
            with the listing card. */}
        <button
          type="button"
          disabled
          aria-label={tApp('signInToSave')}
          title={tApp('signInToSave')}
          className="absolute right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl text-muted opacity-60 shadow-sm"
          data-testid="public-camp-detail-disabled-save"
        >
          <span aria-hidden>☆</span>
        </button>

        {isAdmin ? (
          <AdminEditPill
            campSlug={camp.slug}
            campName={camp.name}
            locale={locale}
            className="absolute right-20 top-7"
          />
        ) : null}

        <div className="space-y-5 p-5 md:p-7">
          <header className="space-y-1">
            <h1
              className="text-2xl font-black text-ink md:text-3xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {camp.name}
            </h1>
            {camp.tagline ? (
              <p
                className="text-base font-semibold leading-snug text-ink/80 md:text-lg"
                data-testid="camp-detail-tagline"
              >
                {camp.tagline}
              </p>
            ) : null}
            {camp.neighborhood ? (
              <p className="text-sm text-muted">{camp.neighborhood}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <EnrollmentStatusPill
                window={camp.enrollment_window}
                locale={locale}
              />
              {isReligious ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-cream-border bg-white px-2 py-0.5 text-[11px] font-bold text-ink"
                  title={tBadge('tooltip')}
                  aria-label={tBadge('label')}
                  data-testid="camp-detail-religious-badge"
                >
                  <span aria-hidden="true">🙏</span>
                  {tBadge('label')}
                </span>
              ) : null}
            </div>
            {camp.categories && camp.categories.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {camp.categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full bg-purple-soft px-2 py-0.5 text-[11px] font-bold text-brand-purple"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <FactGrid camp={camp} locale={locale} mode="public" />

          {camp.description ? (
            <section>
              <CampDescription description={camp.description} />
            </section>
          ) : null}

          <StructuredFieldsSection camp={camp} locale={locale} />

          <section className="flex flex-wrap gap-2">
            {camp.website_url ? (
              <a
                href={camp.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2 text-sm font-black text-white hover:bg-ink/90"
              >
                {t('visit')} ↗
              </a>
            ) : null}
            {camp.phone ? (
              <a
                href={`tel:${camp.phone.replace(/[^+\d]/g, '')}`}
                className="inline-flex min-h-11 items-center rounded-full border border-cream-border bg-white px-5 py-2 text-sm font-black text-ink hover:border-brand-purple/40"
              >
                {t('call', { phone: camp.phone })}
              </a>
            ) : null}
          </section>

          <section
            className={
              'rounded-2xl px-4 py-3 text-xs ' +
              (lastVerifiedDate
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-amber-200 bg-amber-50 text-amber-900')
            }
            data-testid="unified-camp-detail-verified-banner"
          >
            {lastVerifiedDate
              ? t('verifiedSource', { date: lastVerifiedDate })
              : t('verifiedUnknown')}
          </section>

          {band !== 'complete' ? (
            <p className="text-xs text-muted">{t('limitedDisclaimer')}</p>
          ) : null}
        </div>
      </article>
    </>
  );
}

// ----- app mode -------------------------------------------------------------

function AppDetail({
  camp,
  locale,
  isSaved,
  isAdmin,
}: {
  camp: UnifiedCampDetailCamp;
  locale: string;
  isSaved: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations('public.campDetail');
  const tCamps = useTranslations('app.camps');
  const tNav = useTranslations('app.nav');
  const tBadge = useTranslations('camps.religiousBadge');
  const { mode } = useMode();
  const isParents = mode === 'parents';
  const isReligious = (camp.categories ?? []).includes('religious');

  const cardCls = isParents
    ? 'border border-cream-border bg-white'
    : 'border border-white/10 bg-white/10 backdrop-blur';
  const nameCls = isParents ? 'text-ink' : 'text-white';
  const mutedCls = isParents ? 'text-muted' : 'text-white/70';
  const catPillCls = isParents
    ? 'bg-purple-soft text-brand-purple'
    : 'bg-white/20 text-white';
  const warnCls = isParents
    ? 'border border-cream-border bg-white text-muted'
    : 'border border-white/20 bg-white/10 text-white/70';
  const lastVerifiedDate = camp.last_verified_at
    ? new Date(camp.last_verified_at).toLocaleDateString(
        locale === 'es' ? 'es-US' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' },
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <AppBreadcrumb href={`/${locale}/app/camps`} where={tNav('camps')} />

      <div
        className={'relative mt-4 overflow-hidden rounded-3xl ' + cardCls}
        data-testid="unified-camp-detail-app"
      >
        {(() => {
          const hero = camp.hero_url ?? camp.image_url ?? null;
          if (hero) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero}
                alt={camp.name}
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
                data-testid="camp-detail-hero-image"
              />
            );
          }
          return (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-purple via-purple-600 to-blue-600" />
          );
        })()}

        {isAdmin ? (
          <AdminEditPill
            campSlug={camp.slug}
            campName={camp.name}
            locale={locale}
            className="absolute right-4 top-4"
          />
        ) : null}

        <div className="space-y-5 p-5 md:p-7">
          <div>
            <h1
              className={'text-2xl font-black md:text-3xl ' + nameCls}
              style={{ letterSpacing: '-0.02em' }}
            >
              {camp.name}
            </h1>
            {camp.tagline ? (
              <p
                className={
                  'mt-1 text-base font-semibold leading-snug md:text-lg ' +
                  (isParents ? 'text-ink/80' : 'text-white/85')
                }
                data-testid="camp-detail-tagline"
              >
                {camp.tagline}
              </p>
            ) : null}
            {camp.neighborhood ? (
              <p className={'mt-1 text-sm ' + mutedCls}>📍 {camp.neighborhood}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <EnrollmentStatusPill
                window={camp.enrollment_window}
                locale={locale}
                darkMode={!isParents}
              />
              {isReligious ? (
                <span
                  className={
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                    (isParents
                      ? 'border border-cream-border bg-white text-ink'
                      : 'border border-white/20 bg-white/10 text-white')
                  }
                  title={tBadge('tooltip')}
                  aria-label={tBadge('label')}
                  data-testid="camp-detail-religious-badge"
                >
                  <span aria-hidden="true">🙏</span>
                  {tBadge('label')}
                </span>
              ) : null}
            </div>
            {camp.categories && camp.categories.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {camp.categories.map((c) => (
                  <span
                    key={c}
                    className={
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ' +
                      catPillCls
                    }
                  >
                    {c}
                  </span>
                ))}
                {!camp.verified ? (
                  <span
                    className={
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ' +
                      warnCls
                    }
                  >
                    ⚠ {tCamps('pendingVerification')}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <FactGrid camp={camp} locale={locale} mode="app" />

          {camp.description ? (
            <CampDescription description={camp.description} darkMode={!isParents} />
          ) : null}

          <StructuredFieldsSection
            camp={camp}
            locale={locale}
            darkMode={!isParents}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <SaveCampButton
              campId={camp.id}
              campName={camp.name}
              initiallySaved={isSaved}
              fullWidth
            />

            {camp.website_url ? (
              <a
                href={`/api/camps/${camp.slug}/visit`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-black text-ink transition-colors hover:brightness-105"
              >
                {tCamps('visitWebsite')} ↗
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={
                  'flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ' +
                  (isParents
                    ? 'border border-cream-border bg-ink/5 text-muted'
                    : 'border border-white/20 bg-white/5 text-white/50')
                }
              >
                {tCamps('websiteComingSoon')}
              </button>
            )}
          </div>

          {camp.phone ? (
            <a
              href={`tel:${camp.phone.replace(/[^+\d]/g, '')}`}
              className={
                'inline-flex min-h-11 items-center rounded-full border px-5 py-2 text-sm font-black ' +
                (isParents
                  ? 'border-cream-border bg-white text-ink hover:border-brand-purple/40'
                  : 'border-white/20 bg-white/10 text-white hover:border-white/40')
              }
              data-testid="unified-camp-detail-call"
            >
              {t('call', { phone: camp.phone })}
            </a>
          ) : null}

          <section
            className={
              'rounded-2xl px-4 py-3 text-xs ' +
              (lastVerifiedDate
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-amber-200 bg-amber-50 text-amber-900')
            }
            data-testid="unified-camp-detail-verified-banner"
          >
            {lastVerifiedDate
              ? t('verifiedSource', { date: lastVerifiedDate })
              : t('verifiedUnknown')}
          </section>
        </div>
      </div>
    </div>
  );
}

// ----- structured fields ----------------------------------------------------

// Per R6 trust posture: every block is silent-skip on null/empty data.
// No "TBD" placeholders, no empty section headers, no "Pricing not
// published" filler — those would erode parent trust on camps where the
// operator hasn't filled in this surface yet.
function StructuredFieldsSection({
  camp,
  locale,
  darkMode = false,
}: {
  camp: UnifiedCampDetailCamp;
  locale: string;
  darkMode?: boolean;
}) {
  const t = useTranslations('public.campDetail.structured');

  const sessions = (camp.sessions ?? []).filter(
    (s) => s.label || s.start_date || s.end_date,
  );
  const pricingTiers = (camp.pricing_tiers ?? []).filter(
    (p) =>
      p.label ||
      p.session_price_cents != null ||
      p.weekly_price_cents != null ||
      p.both_sessions_price_cents != null,
  );
  const activities = (camp.activities ?? []).filter(Boolean);
  const fees = (camp.fees ?? []).filter((f) => f.label || f.amount_cents != null);
  const whatToBring = (camp.what_to_bring ?? []).filter(Boolean);
  const lunchPolicy = camp.lunch_policy?.trim();
  const extendedCarePolicy = camp.extended_care_policy?.trim();

  const anyVisible =
    sessions.length > 0 ||
    pricingTiers.length > 0 ||
    activities.length > 0 ||
    fees.length > 0 ||
    whatToBring.length > 0 ||
    !!lunchPolicy ||
    !!extendedCarePolicy;
  if (!anyVisible) return null;

  const headingCls = darkMode
    ? 'text-sm font-black text-white'
    : 'text-sm font-black text-ink';
  const bodyCls = darkMode ? 'text-sm text-white/85' : 'text-sm text-ink/85';
  const subtleCls = darkMode ? 'text-xs text-white/60' : 'text-xs text-muted';
  const cardCls = darkMode
    ? 'rounded-2xl border border-white/10 bg-white/5 p-3'
    : 'rounded-2xl border border-cream-border bg-cream/40 p-3';
  const tablePillCls = darkMode
    ? 'bg-white/15 text-white'
    : 'bg-purple-soft text-brand-purple';
  const dateLocale = locale === 'es' ? 'es-US' : 'en-US';

  function fmtDateRange(start: string | null, end: string | null): string | null {
    const fmt = (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(dateLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return fmt(start);
    if (end) return fmt(end);
    return null;
  }

  function fmtPrice(cents: number | null): string | null {
    if (cents == null) return null;
    return `$${Math.round(cents / 100)}`;
  }

  return (
    <div
      className="space-y-5"
      data-testid="camp-detail-structured"
    >
      {sessions.length > 0 ? (
        <section data-testid="camp-detail-sessions">
          <h3 className={headingCls}>{t('sessions.heading')}</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {sessions.map((s, i) => {
              const range = fmtDateRange(s.start_date, s.end_date);
              const themes = (s.weekly_themes ?? []).filter(Boolean);
              return (
                <div key={i} className={cardCls}>
                  <p className={'font-bold ' + (darkMode ? 'text-white' : 'text-ink')}>
                    {s.label ?? `#${i + 1}`}
                  </p>
                  {range ? <p className={subtleCls}>{range}</p> : null}
                  {themes.length > 0 ? (
                    <>
                      <p className={'mt-2 ' + subtleCls}>{t('sessions.weekly')}</p>
                      <ul className={'mt-1 list-disc pl-4 ' + bodyCls}>
                        {themes.map((th, j) => (
                          <li key={j}>{th}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {s.notes ? (
                    <p className={'mt-2 italic ' + subtleCls}>{s.notes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {pricingTiers.length > 0 ? (
        <section data-testid="camp-detail-pricing">
          <h3 className={headingCls}>{t('pricing.heading')}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={subtleCls + ' text-left'}>
                  <th className="py-1.5 pr-3 font-bold">{t('pricing.option')}</th>
                  <th className="py-1.5 pr-3 font-bold">{t('pricing.hours')}</th>
                  <th className="py-1.5 pr-3 font-bold">{t('pricing.session')}</th>
                  <th className="py-1.5 pr-3 font-bold">{t('pricing.both')}</th>
                  <th className="py-1.5 font-bold">{t('pricing.weekly')}</th>
                </tr>
              </thead>
              <tbody>
                {pricingTiers.map((p, i) => (
                  <tr
                    key={i}
                    className={
                      'border-t ' +
                      (darkMode ? 'border-white/10' : 'border-cream-border')
                    }
                  >
                    <td className={'py-1.5 pr-3 font-bold ' + (darkMode ? 'text-white' : 'text-ink')}>
                      {p.label ?? `#${i + 1}`}
                    </td>
                    <td className={'py-1.5 pr-3 ' + bodyCls}>{p.hours ?? '—'}</td>
                    <td className={'py-1.5 pr-3 ' + bodyCls}>
                      {fmtPrice(p.session_price_cents) ?? '—'}
                    </td>
                    <td className={'py-1.5 pr-3 ' + bodyCls}>
                      {fmtPrice(p.both_sessions_price_cents) ?? '—'}
                    </td>
                    <td className={'py-1.5 ' + bodyCls}>
                      {fmtPrice(p.weekly_price_cents) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activities.length > 0 ? (
        <section data-testid="camp-detail-activities">
          <h3 className={headingCls}>{t('activities.heading')}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activities.map((a) => (
              <span
                key={a}
                className={
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                  tablePillCls
                }
              >
                {a}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {whatToBring.length > 0 ? (
        <section data-testid="camp-detail-what-to-bring">
          <h3 className={headingCls}>{t('whatToBring.heading')}</h3>
          <ul className={'mt-1 list-disc pl-5 ' + bodyCls}>
            {whatToBring.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {lunchPolicy ? (
        <section data-testid="camp-detail-lunch">
          <h3 className={headingCls}>{t('lunch.heading')}</h3>
          <p className={'mt-1 ' + bodyCls}>{lunchPolicy}</p>
        </section>
      ) : null}

      {extendedCarePolicy ? (
        <section data-testid="camp-detail-extended-care">
          <h3 className={headingCls}>{t('extendedCare.heading')}</h3>
          <p className={'mt-1 ' + bodyCls}>{extendedCarePolicy}</p>
        </section>
      ) : null}

      {fees.length > 0 ? (
        <details
          className={
            'rounded-2xl border p-3 ' +
            (darkMode
              ? 'border-white/10 bg-white/5'
              : 'border-cream-border bg-cream/40')
          }
          data-testid="camp-detail-fees"
        >
          <summary
            className={'cursor-pointer ' + headingCls}
            style={{ listStyle: 'none' }}
          >
            {t('fees.heading')}
          </summary>
          <ul className={'mt-2 space-y-1 ' + bodyCls}>
            {fees.map((f, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className={'font-bold ' + (darkMode ? 'text-white' : 'text-ink')}>
                    {f.label ?? '—'}
                  </span>
                  {f.refundable === false ? (
                    <span className={'ml-2 ' + subtleCls}>({t('fees.nonRefundable')})</span>
                  ) : f.refundable === true ? (
                    <span className={'ml-2 ' + subtleCls}>({t('fees.refundable')})</span>
                  ) : null}
                  {f.notes ? <span className={'ml-2 italic ' + subtleCls}>{f.notes}</span> : null}
                </span>
                <span className={darkMode ? 'text-white' : 'text-ink'}>
                  {fmtPrice(f.amount_cents) ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

// Small status pill rendered near the top of the detail header. Silent
// when the camp has no enrollment_window data (R6).
function EnrollmentStatusPill({
  window,
  locale,
  darkMode = false,
}: {
  window: CampEnrollmentWindow | null | undefined;
  locale: string;
  darkMode?: boolean;
}) {
  const t = useTranslations('public.campDetail.structured.enrollment');
  if (!window) return null;
  const dateLocale = locale === 'es' ? 'es-US' : 'en-US';
  const now = new Date();
  const opensAt = window.opens_at ? new Date(window.opens_at) : null;
  const closesAt = window.closes_at ? new Date(window.closes_at) : null;

  // Pre-open: show "Opens {date}" with the future opens_at.
  if (opensAt && opensAt.getTime() > now.getTime()) {
    const fmt = opensAt.toLocaleDateString(dateLocale, {
      month: 'short',
      day: 'numeric',
    });
    return (
      <span
        className={
          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ' +
          (darkMode
            ? 'border border-white/20 bg-white/10 text-white'
            : 'border border-amber-200 bg-amber-50 text-amber-900')
        }
        data-testid="camp-detail-enrollment-pill"
      >
        ⏳ {t('opens', { date: fmt })}
      </span>
    );
  }

  // Explicitly closed (status='closed' or closes_at is past).
  const isClosed =
    window.status === 'closed' ||
    (closesAt && closesAt.getTime() < now.getTime());
  if (isClosed) {
    return (
      <span
        className={
          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ' +
          (darkMode
            ? 'border border-white/20 bg-white/10 text-white/70'
            : 'border border-cream-border bg-white text-muted')
        }
        data-testid="camp-detail-enrollment-pill"
      >
        ✗ {t('closed')}
      </span>
    );
  }

  // Open. "Until full" if status says so, else plain "Open".
  const isUntilFull = window.status === 'until_full';
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ' +
        (darkMode
          ? 'border border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
          : 'border border-emerald-200 bg-emerald-50 text-emerald-900')
      }
      data-testid="camp-detail-enrollment-pill"
    >
      ✓ {isUntilFull ? t('untilFull') : t('open')}
    </span>
  );
}
