import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { PageViewLogger } from '@/components/public/PageViewLogger';
import {
  PublicCampCard,
  type PublicCampCard as PublicCampCardShape,
} from '@/components/public/PublicCampCard';
import { CampCount } from '@/components/camps/CampCount';
import { CampsFilterBar } from '@/components/camps/CampsFilterBar';
import { EntityEmptyHint } from '@/components/shared/EntityEmptyHint';
import { applyFilters, hasActiveFilters, parseFiltersFromRecord } from '@/lib/camps/filters';
import { publicPageMetadata } from '@/lib/seo';

// Public directory at /{locale}/camps — no auth required, SEO-indexable.
// Distinct from /{locale}/app/camps, which is the signed-in planner view.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.camps' });
  return publicPageMetadata({
    locale,
    path: '/camps',
    title: t('title') + " | School's Out!",
    description: t('subtitle'),
  });
}

type SearchParams = Record<string, string | string[] | undefined>;

// Public card shape extended with the care + hours columns the shared filter
// needs. PublicCampCard ignores the extras — they're only here for filtering.
type CampRow = PublicCampCardShape & {
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean | null;
  before_care_start: string | null;
  after_care_offered: boolean | null;
  after_care_end: string | null;
};

export default async function PublicCampsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'public.camps' });

  const filters = parseFiltersFromRecord(sp);

  const svc = createServiceSupabase();
  const { data } = await svc
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, neighborhood, is_featured, featured_until, last_verified_at, verified, phone, address, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, price_min_cents, price_max_cents, registration_url, registration_deadline',
    )
    .eq('verified', true)
    .neq('website_status', 'broken')
    .order('is_featured', { ascending: false })
    .order('name');

  const rows = (data ?? []) as CampRow[];
  const filtered = applyFilters(rows, filters);
  const active = hasActiveFilters(filters);
  const hoods = Array.from(
    new Set(rows.map((r) => r.neighborhood).filter((h): h is string => Boolean(h))),
  ).sort();

  return (
    <>
      <PageViewLogger path={`/${locale}/camps`} locale={locale} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* Top CTA */}
        <section className="mb-8 rounded-3xl border border-cream-border bg-white p-6 md:p-8">
          <h1
            className="text-2xl font-black text-ink md:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            {t('subtitle')}
          </p>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-cream p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-ink">
                {t('ctaTop.heading')}
              </p>
              <p className="text-xs text-muted">{t('ctaTop.sub')}</p>
            </div>
            <Link
              href={`/${locale}#signup`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
            >
              {t('ctaTop.button')}
            </Link>
          </div>
        </section>

        {/* Shared filter bar — same component the signed-in /app/camps page
            uses, minus the "Match my kids" toggle. */}
        <div className="mb-5">
          <CampsFilterBar mode="public" hoods={hoods} />
        </div>

        {/* Count indicator — total stays anchored to all verified camps so
            parents see "X of N" framing as they narrow filters. */}
        <div className="mb-3">
          <CampCount
            filtered={filtered.length}
            total={rows.length}
            hasFilters={active}
          />
        </div>

        {filtered.length === 0 ? (
          <EntityEmptyHint
            hasSearchTerm={Boolean(filters.q)}
            i18nNamespace="camps.filters.empty"
            testId="camps-empty-hint"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((camp) => (
              <li key={camp.id}>
                <PublicCampCard camp={camp} locale={locale} />
              </li>
            ))}
          </ul>
        )}

        {/* Bottom CTA — for camp operators */}
        <section className="mt-10 rounded-3xl border border-cream-border bg-ink p-6 text-white md:p-8">
          <h2 className="text-xl font-black md:text-2xl">
            {t('ctaBottom.heading')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/80">
            {t('ctaBottom.sub')}
          </p>
          <Link
            href={`/${locale}/list-your-camp`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
          >
            {t('ctaBottom.button')}
          </Link>
        </section>
      </main>
    </>
  );
}
