import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { PublicCampCard, type PublicCampCard as PublicCampCardShape } from '@/components/public/PublicCampCard';
import {
  publicPageMetadata,
  breadcrumbListJsonLd,
  closureEventJsonLd,
  faqJsonLd,
  JsonLdScripts,
  SITE_URL,
} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const svc = createServiceSupabase();
  const { data } = await svc
    .from('closures')
    .select('name, start_date, end_date, school_id')
    .eq('id', id)
    .maybeSingle();
  const c = data as { name: string; start_date: string; end_date: string; school_id: string } | null;
  if (!c) return publicPageMetadata({ locale, path: `/breaks/${id}`, title: "Break | School's Out!", description: '' });
  const startYear = c.start_date.slice(0, 4);
  const dateStr = new Date(c.start_date + 'T00:00:00').toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  );
  return publicPageMetadata({
    locale,
    path: `/breaks/${id}`,
    title: `${c.name} ${startYear} — Miami schools closed ${dateStr} | School's Out!`,
    description: `Miami schools are closed for ${c.name} on ${dateStr}. See camp options and plan-ahead ideas. Human-reviewed by School's Out!`,
  });
}

// Public closure detail at /{locale}/breaks/{id}.
// Routed by uuid because closures.slug didn't fit the immutable-generated-
// column pattern in migration 018 — see that file's header comment.
export const dynamic = 'force-dynamic';

type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: string;
  source: string;
  school_id: string;
};
type SchoolRow = { id: string; name: string; slug: string };

function formatDate(iso: string, locale: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  );
}

function dayCount(startIso: string, endIso: string): number {
  const s = new Date(startIso + 'T00:00:00');
  const e = new Date(endIso + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default async function PublicClosureDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'public.closureDetail' });

  const svc = createServiceSupabase();
  const { data: closure } = await svc
    .from('closures')
    .select('id, name, start_date, end_date, emoji, status, source, school_id')
    .eq('id', id)
    .maybeSingle();
  if (!closure) notFound();
  const c = closure as ClosureRow;

  const [{ data: schoolData }, { data: matchedCamps }] = await Promise.all([
    svc.from('schools').select('id, name, slug').eq('id', c.school_id).maybeSingle(),
    svc
      .from('camps')
      .select(
        'id, slug, name, description, ages_min, ages_max, price_tier, categories, neighborhood, verified, is_featured, phone, address, website_url, hours_start, hours_end, price_min_cents, price_max_cents, registration_url, registration_deadline',
      )
      .eq('verified', true)
      .neq('website_status', 'broken')
      .order('is_featured', { ascending: false })
      .limit(6),
  ]);
  const school = schoolData as SchoolRow | null;
  const camps = (matchedCamps ?? []) as PublicCampCardShape[];
  const daysOff = dayCount(c.start_date, c.end_date);

  const pageUrl = `${SITE_URL}/${locale}/breaks/${c.id}`;
  const ldItems = [
    closureEventJsonLd({
      name: c.name,
      description: `${c.name} — Miami schools closed`,
      url: pageUrl,
      startDate: c.start_date,
      endDate: c.end_date,
      schoolName: school?.name ?? null,
      schoolUrl: school ? `${SITE_URL}/${locale}/schools/${school.slug}` : null,
    }),
    breadcrumbListJsonLd([
      { name: 'Home', href: `/${locale}` },
      { name: 'Breaks', href: `/${locale}/breaks` },
      { name: c.name, href: `/${locale}/breaks/${c.id}` },
    ]),
    faqJsonLd([
      {
        q: `Do Miami schools have school on ${c.name}?`,
        a: `No. Miami-area schools are closed on ${c.name}. See the per-school pages for the exact dates.`,
      },
      {
        q: 'Are camps open on teacher planning days?',
        a: 'Yes — most Miami-area summer and short-break camps explicitly run on teacher planning days. Browse the camps directory or the matched cards on this page.',
      },
      {
        q: 'How does School\'s Out! verify school closures?',
        a: 'Every closure row is sourced from the official district PDF (e.g. Miami-Dade County Public Schools) or from the school office directly. See /how-we-verify for the full posture.',
      },
    ]),
  ];

  return (
    <>
      <JsonLdScripts items={ldItems} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
        <Link
          href={`/${locale}/breaks`}
          className="mb-3 inline-flex text-xs font-bold text-brand-purple hover:underline"
        >
          {t('back')}
        </Link>

        <article className="rounded-3xl border border-cream-border bg-white p-5 md:p-7">
          <header>
            <h1
              className="text-3xl font-black text-ink md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {c.emoji} {c.name}
            </h1>
            <p className="mt-2 text-base text-muted">
              {formatDate(c.start_date, locale)}
              {c.end_date !== c.start_date
                ? ` — ${formatDate(c.end_date, locale)}`
                : ''}
              {' · '}
              {t('duration', { count: daysOff })}
            </p>
            {school ? (
              <p className="mt-1 text-sm text-muted">
                {t('affects')}{' '}
                <Link
                  href={`/${locale}/schools/${school.slug}`}
                  className="font-bold text-brand-purple hover:underline"
                >
                  {school.name}
                </Link>
              </p>
            ) : null}
          </header>

          <section
            className={
              'mt-5 rounded-2xl px-4 py-3 text-xs ' +
              (c.status === 'verified'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-amber-200 bg-amber-50 text-amber-900')
            }
          >
            {c.status === 'verified' ? t('verified') : t('pending')}
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-black text-ink">{t('camps.title')}</h2>
            <p className="text-xs text-muted">{t('camps.subtitle')}</p>
            {camps.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-cream-border bg-cream p-4 text-sm text-muted">
                {t('camps.empty')}
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {camps.map((camp) => (
                  <li key={camp.id}>
                    <PublicCampCard camp={camp} locale={locale} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8 rounded-2xl bg-ink p-5 text-white">
            <h3 className="text-base font-black">{t('cta.heading')}</h3>
            <p className="mt-1 text-sm text-white/80">{t('cta.sub')}</p>
            <Link
              href={`/${locale}#signup`}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
            >
              {t('cta.button')}
            </Link>
          </section>
        </article>
      </main>
    </>
  );
}
