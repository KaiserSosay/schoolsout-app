import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <p>
        <Link href={`/${locale}`} className="text-white/70 no-underline hover:text-white">
          ← School&apos;s Out!
        </Link>
      </p>
      <h1>{t('nav.terms')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted terms of service before launch.</p>
    </main>
  );
}
