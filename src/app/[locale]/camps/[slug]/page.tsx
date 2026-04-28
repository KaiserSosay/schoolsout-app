import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getAdminRole } from '@/lib/auth/requireAdmin';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import {
  UnifiedCampDetail,
  type UnifiedCampDetailCamp,
} from '@/components/camps/UnifiedCampDetail';
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
    .select('name, tagline, description, neighborhood, ages_min, ages_max, image_url')
    .eq('slug', slug)
    .maybeSingle();
  const camp = data as {
    name: string;
    tagline: string | null;
    description: string | null;
    neighborhood: string | null;
    ages_min: number | null;
    ages_max: number | null;
    image_url: string | null;
  } | null;
  if (!camp) return publicPageMetadata({ locale, path: `/camps/${slug}`, title: "Camp | School's Out!", description: '' });
  // Tagline is the curated, human-written one-liner — when present it's
  // the most accurate meta description we have. The composed
  // description+ages+neighborhood string stays as the fallback so camps
  // without a tagline keep the descriptive SEO blurb that's been live.
  const composed = (() => {
    const agePart =
      camp.ages_min != null && camp.ages_max != null
        ? ` Ages ${camp.ages_min}–${camp.ages_max}.`
        : '';
    const neighborhoodPart = camp.neighborhood
      ? ` ${camp.neighborhood}, Miami.`
      : ' Miami.';
    const base = camp.description ?? camp.name;
    return base + `.${agePart}${neighborhoodPart} Human-reviewed by School's Out!`;
  })();
  const raw = camp.tagline?.trim() ? camp.tagline.trim() : composed;
  const trimmed = raw.length > 160 ? raw.slice(0, 157) + '…' : raw;
  return publicPageMetadata({
    locale,
    path: `/camps/${slug}`,
    title: `${camp.name} — Miami Summer Camps 2026 | School's Out!`,
    description: trimmed,
    image: camp.image_url ?? `${SITE_URL}/og/camp/${slug}`,
  });
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
      'id, slug, name, tagline, description, ages_min, ages_max, price_tier, price_min_cents, price_max_cents, categories, website_url, image_url, neighborhood, phone, address, hours_start, hours_end, registration_url, registration_deadline, verified, last_verified_at',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!data) notFound();
  const camp = data as UnifiedCampDetailCamp;

  // Public surface so we don't gate the page on auth, but if a signed-in
  // admin lands here we want the Edit pill to appear so they can jump
  // straight to the wired edit form.
  let isAdmin = false;
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      isAdmin = (await getAdminRole(user.id, user.email ?? null)) !== null;
    }
  } catch {
    // Cookie/auth failures here must never break public render.
  }

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
        <UnifiedCampDetail camp={camp} mode="public" locale={locale} isAdmin={isAdmin} />

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
