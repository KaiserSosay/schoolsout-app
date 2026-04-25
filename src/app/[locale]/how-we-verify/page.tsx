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
  const t = await getTranslations({ locale, namespace: 'public.howWeVerify' });
  return publicPageMetadata({
    locale,
    path: '/how-we-verify',
    title: t('title') + " | School's Out!",
    description: t('subtitle'),
  });
}

// Phase 3.0 Group 2 / Item 2.4: honesty rewrite. The previous version said
// "every camp is reviewed by a human" — that wasn't fully accurate. Claude
// (an AI) does the first pass; a human reviews before publish. This page
// now says so explicitly. UX_PRINCIPLES.md #2 — no hallucinations, including
// about ourselves.
export default async function HowWeVerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.howWeVerify' });
  const simpleSections = ['promise', 'howItWorks', 'schedule', 'help'] as const;
  const sourceItems = ['camps', 'calendars', 'notVerified'] as const;
  return (
    <>
      <PageViewLogger path={`/${locale}/how-we-verify`} locale={locale} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <h1
            className="text-3xl font-black text-ink md:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 text-base text-muted">{t('subtitle')}</p>
        </header>

        <div className="space-y-6">
          <Section title={t('promise.title')} body={t('promise.body')} />
          <Section title={t('howItWorks.title')} body={t('howItWorks.body')} />

          <section className="rounded-3xl border border-cream-border bg-white p-5 md:p-6">
            <h2 className="text-lg font-black text-ink md:text-xl">
              {t('sources.title')}
            </h2>
            <ul className="mt-3 space-y-3">
              {sourceItems.map((k) => (
                <li key={k} className="text-sm text-ink/85 md:text-base">
                  <span className="font-bold text-ink">
                    {t(`sources.items.${k}.label`)}:
                  </span>{' '}
                  {t(`sources.items.${k}.body`)}
                </li>
              ))}
            </ul>
          </section>

          {simpleSections.slice(2).map((s) => (
            <Section key={s} title={t(`${s}.title`)} body={t(`${s}.body`)} />
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-cream-border bg-cream p-5 md:p-6">
          <h2 className="text-lg font-black text-ink">{t('cta.heading')}</h2>
          <p className="mt-2 text-sm text-muted">{t('cta.sub')}</p>
          <Link
            href={`/${locale}#signup`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
          >
            {t('cta.button')}
          </Link>
        </section>
      </main>
    </>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-3xl border border-cream-border bg-white p-5 md:p-6">
      <h2 className="text-lg font-black text-ink md:text-xl">{title}</h2>
      <p className="mt-2 text-sm text-ink/80 md:text-base">{body}</p>
    </section>
  );
}
