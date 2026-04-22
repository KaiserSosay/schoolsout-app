import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function KidTokenInvalidPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="max-w-md w-full bg-white border border-cream-border rounded-2xl p-8 text-center space-y-4">
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-extrabold text-ink">{t('kidInvalid.title')}</h1>
        <p className="text-muted">{t('kidInvalid.body')}</p>
        <Link
          href={`/${locale}`}
          className="inline-block mt-2 bg-ink text-white rounded-full px-6 py-3 font-bold"
        >
          {t('kidInvalid.back')}
        </Link>
      </div>
    </main>
  );
}
