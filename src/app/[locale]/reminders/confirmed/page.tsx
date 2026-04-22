import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'landing.confirmed' });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl">🎉</div>
      <h1 className="mt-6 text-3xl font-bold text-ink">{t('title')}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">{t('body')}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex items-center rounded-xl bg-ink px-6 py-3 text-base font-semibold text-cream transition hover:opacity-90"
      >
        {t('back')}
      </Link>
    </main>
  );
}
