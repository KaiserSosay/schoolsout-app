import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// Lightweight header for public (non-app) pages. The app shell in
// /src/app/[locale]/app/layout.tsx has bottom tabs + sidebar for
// signed-in users; anonymous browsers see this instead.
export async function PublicTopBar({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'public.topBar' });
  const links: Array<{ label: string; href: string }> = [
    { label: t('camps'), href: `/${locale}/camps` },
    { label: t('breaks'), href: `/${locale}/breaks` },
    { label: t('listYourCamp'), href: `/${locale}/list-your-camp` },
    { label: t('about'), href: `/${locale}/about` },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-cream-border bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          href={`/${locale}`}
          className="text-base font-black text-ink md:text-lg"
          style={{ letterSpacing: '-0.01em' }}
        >
          School&rsquo;s Out!
        </Link>
        <nav aria-label={t('nav')} className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-ink/80 hover:bg-white hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {/* DECISION: Sign-in routes to the dedicated /sign-in page so
            returning parents see the email field immediately. Outline style
            so it doesn't compete with gold "Create account" CTAs elsewhere
            on the public pages. */}
        <Link
          href={`/${locale}/sign-in`}
          className="inline-flex min-h-9 items-center rounded-full border border-ink/30 px-4 py-1.5 text-xs font-black text-ink hover:bg-ink hover:text-white"
        >
          {t('signIn')}
        </Link>
      </div>
      {/* Mobile nav row */}
      <nav
        aria-label={t('navMobile')}
        className="flex gap-1 overflow-x-auto border-t border-cream-border/60 px-3 py-2 md:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-ink/80 hover:bg-white hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
