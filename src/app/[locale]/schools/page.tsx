import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { SchoolsIndexFilters } from '@/components/public/SchoolsIndexFilters';
import { publicPageMetadata, breadcrumbListJsonLd, JsonLdScripts } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  neighborhood: string | null;
  city: string | null;
  is_mdcps: boolean | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.schoolsIndex' });
  return publicPageMetadata({
    locale,
    path: '/schools',
    title: `${t('title')} | School's Out!`,
    description: t('subtitle'),
  });
}

function csv(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const raw = Array.isArray(v) ? v.join(',') : v;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export default async function PublicSchoolsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'public.schoolsIndex' });

  const activeTypes = csv(sp.type);
  const activeHoods = csv(sp.hood);
  const pageNum = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  const svc = createServiceSupabase();
  // Fetch the full set first so we can compute distinct neighborhoods + total
  // count without a second round trip. ~316 rows is cheap; if this scales
  // past a few thousand we can split into a count() + filtered fetch.
  //
  // DECISION: try the rich select (with migration-022 columns) first; fall
  // back to the lean shape on an "unknown column" error so an un-migrated
  // staging DB still renders the page (just without the type/hood badges).
  let allRows: SchoolRow[] = [];
  const richResp = await svc
    .from('schools')
    .select('id, slug, name, type, neighborhood, city, is_mdcps')
    .eq('closed_permanently', false)
    .order('name');
  if (richResp.error) {
    const lean = await svc
      .from('schools')
      .select('id, slug, name, type, city')
      .order('name');
    allRows = ((lean.data ?? []) as Array<Omit<SchoolRow, 'neighborhood' | 'is_mdcps'>>).map((r) => ({
      ...r,
      neighborhood: null,
      is_mdcps: null,
    }));
  } else {
    allRows = (richResp.data ?? []) as SchoolRow[];
  }

  const hoods = Array.from(
    new Set(allRows.map((r) => r.neighborhood).filter((h): h is string => Boolean(h))),
  ).sort();

  const filtered = allRows.filter((r) => {
    if (activeTypes.length && (!r.type || !activeTypes.includes(r.type))) return false;
    if (activeHoods.length && (!r.neighborhood || !activeHoods.includes(r.neighborhood))) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(pageNum, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const slice = filtered.slice(offset, offset + PAGE_SIZE);

  const ldItems = [
    breadcrumbListJsonLd([
      { name: 'Home', href: `/${locale}` },
      { name: t('title'), href: `/${locale}/schools` },
    ]),
  ];

  return (
    <>
      <JsonLdScripts items={ldItems} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-6">
          <h1
            className="text-2xl font-black text-ink md:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            {t('subtitle')}
          </p>
        </header>

        <div className="mb-5">
          <SchoolsIndexFilters
            hoods={hoods}
            activeTypes={activeTypes}
            activeHoods={activeHoods}
          />
        </div>

        <p className="mb-3 text-sm text-muted" data-testid="schools-count">
          {activeTypes.length === 0 && activeHoods.length === 0
            ? t('count.total', { n: filtered.length })
            : t('count.filtered', {
                filtered: filtered.length,
                total: allRows.length,
              })}
        </p>

        {slice.length === 0 ? (
          <p className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-muted">
            {t('empty')}
          </p>
        ) : (
          <ul
            data-testid="schools-list"
            className="grid grid-cols-1 gap-2 md:grid-cols-2"
          >
            {slice.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${locale}/schools/${s.slug}`}
                  className="flex flex-col gap-0.5 rounded-2xl border border-cream-border bg-white px-4 py-3 transition-colors hover:border-brand-purple/40"
                >
                  <p className="text-sm font-black text-ink">{s.name}</p>
                  <p className="text-xs text-muted">
                    {[s.type ? t(`filters.types.${s.type}`, { default: s.type }) : null, s.neighborhood ?? s.city]
                      .filter(Boolean)
                      .join(' · ')}
                    {s.is_mdcps ? ' · ' + t('mdcpsBadge') : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <Pagination
            locale={locale}
            page={safePage}
            totalPages={totalPages}
            params={sp}
          />
        ) : null}
      </main>
    </>
  );
}

function Pagination({
  locale,
  page,
  totalPages,
  params,
}: {
  locale: string;
  page: number;
  totalPages: number;
  params: SearchParams;
}) {
  function hrefFor(p: number): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === 'page') continue;
      if (Array.isArray(v)) qs.set(k, v.join(','));
      else if (typeof v === 'string') qs.set(k, v);
    }
    if (p > 1) qs.set('page', String(p));
    const suffix = qs.toString();
    return suffix ? `/${locale}/schools?${suffix}` : `/${locale}/schools`;
  }
  return (
    <nav
      aria-label="Pagination"
      data-testid="schools-pagination"
      className="mt-6 flex items-center justify-center gap-3 text-sm"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex min-h-9 items-center rounded-full border border-cream-border bg-white px-3 py-1.5 font-bold text-ink hover:border-brand-purple/40"
          rel="prev"
        >
          ← Prev
        </Link>
      ) : null}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex min-h-9 items-center rounded-full border border-cream-border bg-white px-3 py-1.5 font-bold text-ink hover:border-brand-purple/40"
          rel="next"
        >
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
