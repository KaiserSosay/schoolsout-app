import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { PageViewLogger } from '@/components/public/PageViewLogger';
import { publicPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.howItWorks' });
  return publicPageMetadata({
    locale,
    path: '/how-it-works',
    title: t('title') + " | School's Out!",
    description: t('subtitle'),
  });
}

// Phase 2.7.1 stub — "How it works" referenced by the footer.
// Three short sections. The detailed pitch lives on the landing page; this
// route is a search/share target with a standalone URL.
export default async function PublicHowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.howItWorks' });
  const steps = ['step1', 'step2', 'step3'] as const;
  return (
    <>
      <PageViewLogger path={`/${locale}/how-it-works`} locale={locale} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <h1 className="editorial-h1 text-3xl md:text-4xl text-ink">{t('title')}</h1>
          <p className="mt-2 text-muted">{t('subtitle')}</p>
        </header>

        <ol className="space-y-4">
          {steps.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-cream-border bg-white p-6 md:p-8"
            >
              <h2 className="text-lg font-bold text-ink">{t(`${key}.title`)}</h2>
              <p className="mt-2 text-sm text-ink/70">{t(`${key}.body`)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/90 transition-colors"
          >
            {t('cta')}
          </Link>
        </div>
      </main>
    </>
  );
}
