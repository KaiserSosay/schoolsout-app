import { getTranslations } from 'next-intl/server';
import { ListYourCampForm } from '@/components/ListYourCampForm';
import { publicPageMetadata } from '@/lib/seo';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'listYourCamp' });
  return publicPageMetadata({
    locale,
    path: '/list-your-camp',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function ListYourCampPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'listYourCamp' });
  const bulletKeys = ['now', 'price', 'verify', 'direct'] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10 text-center">
        <p className="text-xs font-black uppercase tracking-wider text-brand-purple">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-ink md:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted">{t('subtitle')}</p>
      </header>
      <ListYourCampForm />
      <section
        id="why"
        className="mt-16 rounded-3xl border border-cream-border bg-white p-6 md:p-10"
        aria-labelledby="why-list-heading"
      >
        <h2
          id="why-list-heading"
          className="text-2xl font-black tracking-tight text-ink md:text-3xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('whySection.title')}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/85">
          {t('whySection.p1')}
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink/85">
          {t('whySection.p2')}
        </p>
        <ul className="mt-6 space-y-3">
          {bulletKeys.map((k) => (
            <li key={k} className="flex gap-3 text-sm text-ink/90">
              <span aria-hidden className="text-brand-purple">
                ✓
              </span>
              <span>{t(`whySection.bullets.${k}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-base font-black text-brand-purple">
          {t('whySection.kicker')}
        </p>
      </section>
    </main>
  );
}
