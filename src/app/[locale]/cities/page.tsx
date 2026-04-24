import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { PageViewLogger } from '@/components/public/PageViewLogger';
import { publicPageMetadata } from '@/lib/seo';
import { CityRequestTrigger } from '@/components/public/CityRequestTrigger';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.cities' });
  return publicPageMetadata({
    locale,
    path: '/cities',
    title: t('title') + " | School's Out!",
    description: t('subtitle'),
  });
}

// Phase 2.7.1: stub page referenced by the footer "Browse by city" link.
// Keeps things honest: we cover one county today. Anything more than that
// has to be backed by verified calendars, not aspirational copy.
export default async function PublicCitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.cities' });
  return (
    <>
      <PageViewLogger path={`/${locale}/cities`} locale={locale} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <h1 className="editorial-h1 text-3xl md:text-4xl text-ink">{t('title')}</h1>
          <p className="mt-2 text-muted">{t('subtitle')}</p>
        </header>

        <section className="rounded-2xl border border-cream-border bg-white p-6 md:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
            {t('currentHeading')}
          </h2>
          <p className="mt-3 text-xl font-bold text-ink">{t('currentCity')}</p>
          <p className="mt-2 text-sm text-ink/70">{t('currentNote')}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-cream-border bg-cream p-6 md:p-8">
          <h2 className="text-xl font-bold text-ink">{t('requestHeading')}</h2>
          <p className="mt-2 text-sm text-ink/70">{t('requestBody')}</p>
          <div className="mt-4">
            <CityRequestTrigger
              label={t('requestCta')}
              bodyDraft={t('requestBodyDraft')}
            />
          </div>
        </section>
      </main>
    </>
  );
}
