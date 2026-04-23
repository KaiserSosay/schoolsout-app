import { getTranslations } from 'next-intl/server';
import { ListYourCampForm } from '@/components/ListYourCampForm';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'listYourCamp' });
  return { title: t('meta.title'), description: t('meta.description') };
}

export default async function ListYourCampPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'listYourCamp' });
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
    </main>
  );
}
