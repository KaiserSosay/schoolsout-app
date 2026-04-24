import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';
import {
  publicPageMetadata,
  breadcrumbListJsonLd,
  campJsonLd,
  JsonLdScripts,
  SITE_URL,
} from '@/lib/seo';

// Public camp detail at /{locale}/camps/{slug}. No auth. No SaveCampButton,
// no Plan-this-day wizard. Shows what a parent googling the camp wants:
// who, where, when, how much, how to register. Plus a sign-up CTA.

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const svc = createServiceSupabase();
  const { data } = await svc
    .from('camps')
    .select('name, description, neighborhood, ages_min, ages_max, image_url')
    .eq('slug', slug)
    .maybeSingle();
  const camp = data as {
    name: string;
    description: string | null;
    neighborhood: string | null;
    ages_min: number | null;
    ages_max: number | null;
    image_url: string | null;
  } | null;
  if (!camp) return publicPageMetadata({ locale, path: `/camps/${slug}`, title: "Camp | School's Out!", description: '' });
  const agePart =
    camp.ages_min != null && camp.ages_max != null
      ? ` Ages ${camp.ages_min}–${camp.ages_max}.`
      : '';
  const neighborhoodPart = camp.neighborhood ? ` ${camp.neighborhood}, Miami.` : ' Miami.';
  const desc =
    (camp.description ?? camp.name) + `.${agePart}${neighborhoodPart} Human-reviewed by School's Out!`;
  const trimmed = desc.length > 160 ? desc.slice(0, 157) + '…' : desc;
  return publicPageMetadata({
    locale,
    path: `/camps/${slug}`,
    title: `${camp.name} — Miami Summer Camps 2026 | School's Out!`,
    description: trimmed,
    image: camp.image_url ?? `${SITE_URL}/og/camp/${slug}`,
  });
}

type CampFull = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
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

export default async function PublicCampDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'public.campDetail' });
  const svc = createServiceSupabase();
  const { data } = await svc
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, price_min_cents, price_max_cents, categories, website_url, image_url, neighborhood, phone, address, hours_start, hours_end, registration_url, registration_deadline, verified, last_verified_at',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!data) notFound();
  const camp = data as CampFull;

  const completeness = computeCompleteness(camp);
  const band = bandFor(completeness.score);
  const price = formatPrice(camp.price_min_cents, camp.price_max_cents);
  const startFmt = formatTime(camp.hours_start);
  const endFmt = formatTime(camp.hours_end);
  const lastVerifiedDate = camp.last_verified_at
    ? new Date(camp.last_verified_at).toLocaleDateString(
        locale === 'es' ? 'es-US' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' },
      )
    : null;

  const ldItems = [
    campJsonLd({
      name: camp.name,
      description: camp.description,
      url: `${SITE_URL}/${locale}/camps/${camp.slug}`,
      imageUrl: camp.image_url,
      address: camp.address,
      phone: camp.phone,
      websiteUrl: camp.website_url,
      priceMinCents: camp.price_min_cents,
      priceMaxCents: camp.price_max_cents,
      agesMin: camp.ages_min,
      agesMax: camp.ages_max,
    }),
    breadcrumbListJsonLd([
      { name: 'Home', href: `/${locale}` },
      { name: 'Camps', href: `/${locale}/camps` },
      { name: camp.name, href: `/${locale}/camps/${camp.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLdScripts items={ldItems} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <Link
          href={`/${locale}/camps`}
          className="mb-3 inline-flex text-xs font-bold text-brand-purple hover:underline"
        >
          {t('back')}
        </Link>

        <article className="overflow-hidden rounded-3xl border border-cream-border bg-white">
          {camp.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={camp.image_url}
              alt={camp.name}
              loading="lazy"
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-purple via-purple-600 to-blue-600" />
          )}

          <div className="space-y-5 p-5 md:p-7">
            <header className="space-y-1">
              <h1
                className="text-2xl font-black text-ink md:text-3xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {camp.name}
              </h1>
              {camp.neighborhood ? (
                <p className="text-sm text-muted">{camp.neighborhood}</p>
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

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {camp.ages_min != null && camp.ages_max != null ? (
                <Fact label={t('agesLabel')}>
                  {camp.ages_min}–{camp.ages_max}
                </Fact>
              ) : null}
              {price ? <Fact label={t('priceLabel')}>{price}</Fact> : null}
              {startFmt && endFmt ? (
                <Fact label={t('hoursLabel')}>
                  {startFmt}–{endFmt}
                </Fact>
              ) : null}
              {camp.address ? (
                <Fact label={t('addressLabel')}>{camp.address}</Fact>
              ) : null}
              {camp.registration_deadline ? (
                <Fact label={t('registerDeadlineLabel')}>
                  {new Date(camp.registration_deadline).toLocaleDateString(
                    locale === 'es' ? 'es-US' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' },
                  )}
                </Fact>
              ) : null}
            </section>

            {camp.description ? (
              <section>
                <p className="text-sm text-ink/80 md:text-base">
                  {camp.description}
                </p>
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

        <section className="mt-8 rounded-3xl border border-cream-border bg-ink p-6 text-white md:p-8">
          <h2 className="text-lg font-black md:text-xl">
            {t('ctaSignup.heading')}
          </h2>
          <p className="mt-1 text-sm text-white/80">{t('ctaSignup.sub')}</p>
          <Link
            href={`/${locale}#signup`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
          >
            {t('ctaSignup.button')}
          </Link>
        </section>
      </main>
    </>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-ink">{children}</p>
    </div>
  );
}
