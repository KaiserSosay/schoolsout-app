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

type SearchParams = {
  category?: string;
};

function parseCsv(v: string | undefined): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

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

  const selected = parseCsv(sp.category);
  const svc = createServiceSupabase();
  const { data } = await svc
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, neighborhood, is_featured, verified, phone, address, hours_start, hours_end, price_min_cents, price_max_cents, registration_url, registration_deadline',
    )
    .eq('verified', true)
    .neq('website_status', 'broken')
    .order('is_featured', { ascending: false })
    .order('name');

  const rows = (data ?? []) as PublicCampCardShape[];
  const filtered = selected.length
    ? rows.filter((c) => (c.categories ?? []).some((cat) => selected.includes(cat)))
    : rows;

  // Build category chip list dynamically from the data we have.
  const allCategories = Array.from(
    new Set(rows.flatMap((r) => r.categories ?? [])),
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

        {/* Category chips */}
        {allCategories.length ? (
          <nav aria-label="Categories" className="mb-5 flex flex-wrap gap-2">
            <CategoryChip
              href={`/${locale}/camps`}
              active={selected.length === 0}
              label={t('filterAll')}
            />
            {allCategories.map((c) => (
              <CategoryChip
                key={c}
                href={`/${locale}/camps?category=${encodeURIComponent(c)}`}
                active={selected.includes(c)}
                label={c}
              />
            ))}
          </nav>
        ) : null}

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-cream-border bg-white p-8 text-center text-sm text-muted">
            {t('empty')}
          </p>
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

function CategoryChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        'inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-bold transition-colors ' +
        (active
          ? 'bg-ink text-white'
          : 'border border-cream-border bg-white text-ink hover:border-brand-purple/40')
      }
    >
      {label}
    </Link>
  );
}
