import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// DECISION: Reason is surfaced for debuggability but sanitized to a single
// short string (no HTML) and capped to 200 chars so a malicious or overlong
// query param can't break the layout or enable reflected content.
function sanitizeReason(input: string | undefined | null): string | null {
  if (!input) return null;
  const s = String(input).replace(/[<>]/g, '').trim();
  if (!s) return null;
  return s.slice(0, 200);
}

export default async function ConfirmFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const { reason } = await searchParams;
  const safeReason = sanitizeReason(reason);
  const t = await getTranslations({ locale, namespace: 'landing.confirmFailed' });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl">⚠️</div>
      <h1 className="mt-6 text-3xl font-bold text-ink">{t('title')}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">{t('body')}</p>
      {safeReason ? (
        <p className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/60">
          {t('reason')}: <code className="font-mono">{safeReason}</code>
        </p>
      ) : null}
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex items-center rounded-xl bg-ink px-6 py-3 text-base font-semibold text-cream transition hover:opacity-90"
      >
        {t('tryAgain')}
      </Link>
    </main>
  );
}
