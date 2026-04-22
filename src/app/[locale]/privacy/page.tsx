import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <p>
        <Link href={`/${locale}`} className="text-white/70 no-underline hover:text-white">
          ← School&apos;s Out!
        </Link>
      </p>
      <h1>{t('nav.privacyPolicy')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted privacy policy before launch. Required before collecting email signups in production.</p>
      <p>This app does not store children&apos;s names, exact ages, or specific schools on the server. Parents provide an email to receive school-closure reminders. Kid profile data (if any) lives only in the parent&apos;s browser.</p>
    </main>
  );
}
