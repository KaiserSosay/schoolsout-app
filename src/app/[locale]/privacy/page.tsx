import { getTranslations } from 'next-intl/server';

export default async function Privacy() {
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <h1>{t('nav.privacyPolicy')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted privacy policy before launch. Required before collecting email signups in production.</p>
      <p>This app does not store children&apos;s names, exact ages, or specific schools on the server. Parents provide an email to receive school-closure reminders. Kid profile data (if any) lives only in the parent&apos;s browser.</p>
    </main>
  );
}
