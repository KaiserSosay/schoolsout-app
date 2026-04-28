'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { locales, type Locale } from '@/i18n/config';

// DECISION: separate from src/components/LanguageToggleMobile.tsx (used in
// the logged-in app shell). This one swaps the locale segment IN PLACE so a
// Spanish-speaking operator on /en/list-your-camp can toggle to ES without
// being bounced back to the homepage. Logged-in toggle stays as-is —
// different surface, different ergonomics.
export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const t = useTranslations('public.topBar');
  const pathname = usePathname() ?? `/${currentLocale}`;
  const search = useSearchParams();

  const target: Locale = currentLocale === 'en' ? 'es' : 'en';
  // Replace the leading /en or /es segment. If the pathname doesn't start
  // with a known locale (shouldn't happen on a [locale]-routed page, but be
  // defensive), fall back to the locale root.
  const swapped = locales.some((l) => pathname.startsWith(`/${l}`))
    ? pathname.replace(/^\/(en|es)/, `/${target}`)
    : `/${target}`;
  const qs = search?.toString();
  const href = qs ? `${swapped}?${qs}` : swapped;

  const targetLabel = target === 'es' ? t('languageSwitchToEs') : t('languageSwitchToEn');

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={t('languageSwitchAria', { target: targetLabel })}
      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ink/30 px-3 py-1.5 text-xs font-black text-ink hover:bg-ink hover:text-white"
      data-testid="public-language-toggle"
    >
      <span aria-hidden>🌐</span>
      <span>{target.toUpperCase()}</span>
    </Link>
  );
}
