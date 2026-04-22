import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function AboutNoahPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('about.noah');
  return (
    <main className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink transition"
        >
          {t('back')}
        </Link>

        <header className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-tight">
            {t('title')}
          </h1>
        </header>

        <div className="bg-white border border-cream-border rounded-2xl p-6 sm:p-8 space-y-5">
          {/* TODO: Add parent-approved photo of Noah here */}
          <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep flex items-center justify-center">
            <span className="text-7xl" aria-hidden="true">🎒</span>
          </div>
          <p className="text-xs text-muted italic">{t('photoTodo')}</p>

          <p className="text-lg text-ink leading-relaxed">{t('p1')}</p>
          <p className="text-lg text-ink leading-relaxed">{t('p2')}</p>

          <blockquote className="border-l-4 border-gold pl-4 text-ink italic">
            <div className="text-xs not-italic text-muted mb-1 uppercase tracking-wide">{t('quoteLabel')}</div>
            &ldquo;{t('quote')}&rdquo;
          </blockquote>
        </div>

        <Link
          href={`/${locale}`}
          className="inline-block bg-ink text-white rounded-full px-6 py-3 font-bold"
        >
          {t('back')}
        </Link>
      </div>
    </main>
  );
}
