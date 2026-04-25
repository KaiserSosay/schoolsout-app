import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';
import type { CompletenessCampShape } from '@/lib/camps/completeness';

// Server-rendered public camp card. Shares the same camp shape as the
// app CampCard but:
//   - no SaveCampButton (public / unauth)
//   - no distance label (no user home)
//   - "Sign in to save" tooltip replaces the heart icon
//   - links to the PUBLIC detail page /{locale}/camps/{slug}
//   - inline completeness line for transparency (plain text; the
//     CampCompletenessBadge "help us verify" button is app-only because
//     the feature-request modal is mounted inside the locale layout, and
//     we want to keep the public card fully server-rendered.)

export type PublicCampCard = CompletenessCampShape & {
  id: string;
  slug: string;
  name: string;
  price_tier?: '$' | '$$' | '$$$' | null;
  neighborhood?: string | null;
  verified?: boolean;
  last_verified_at?: string | null;
  is_featured?: boolean;
  featured_until?: string | null;
};

const VERIFIED_FRESHNESS_MS = 90 * 24 * 60 * 60 * 1000;

function isFreshlyVerified(c: PublicCampCard, now: number): boolean {
  if (!c.verified) return false;
  if (!c.last_verified_at) return false;
  return now - new Date(c.last_verified_at).getTime() < VERIFIED_FRESHNESS_MS;
}

function isCurrentlyFeatured(c: PublicCampCard, now: number): boolean {
  if (!c.is_featured) return false;
  if (!c.featured_until) return false;
  return new Date(c.featured_until).getTime() > now;
}

export async function PublicCampCard({
  camp,
  locale,
}: {
  camp: PublicCampCard;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'public.camps' });
  const tApp = await getTranslations({ locale, namespace: 'app.camps' });
  const tCat = await getTranslations({ locale, namespace: 'app.camps.completeness.field' });
  const { score, missing } = computeCompleteness(camp);
  const band = bandFor(score);
  const pills = (camp.categories ?? []).slice(0, 2);
  const now = Date.now();
  const showVerified = isFreshlyVerified(camp, now);
  const showFeatured = isCurrentlyFeatured(camp, now);
  return (
    <article className="relative rounded-2xl border border-cream-border bg-white p-4 transition-shadow hover:shadow-md">
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
          <span
            aria-label={t('signInToSave')}
            title={t('signInToSave')}
            className="shrink-0 select-none text-xs text-muted"
          >
            🔒
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
        {showVerified || showFeatured ? (
          <div className="flex flex-wrap gap-1.5">
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
                  fields: missing
                    .slice(0, 3)
                    .map((m) => tCat(m))
                    .join(', '),
                })}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
