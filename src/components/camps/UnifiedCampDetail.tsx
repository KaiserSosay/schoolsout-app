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
            {isReligious ? (
              <p className="mt-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-cream-border bg-white px-2 py-0.5 text-[11px] font-bold text-ink"
                  title={tBadge('tooltip')}
                  aria-label={tBadge('label')}
                  data-testid="camp-detail-religious-badge"
                >
                  <span aria-hidden="true">🙏</span>
                  {tBadge('label')}
                </span>
              </p>
            ) : null}
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
            {isReligious ? (
              <p className="mt-2">
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
              </p>
            ) : null}
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
