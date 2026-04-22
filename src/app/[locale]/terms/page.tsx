import { getTranslations } from 'next-intl/server';

export default async function Terms() {
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <h1>{t('nav.terms')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted terms of service before launch.</p>
    </main>
  );
}
