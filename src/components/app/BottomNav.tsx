'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NAV_TABS, isTabActive } from './nav-config';

// Mobile-only bottom tab bar. 5 tabs, 44px min tap target each, safe-area
// aware so iOS home-indicator doesn't clip the labels. Hidden on md+ where
// the SideNav takes over.
export function BottomNav({ locale }: { locale: string }) {
  const t = useTranslations('app.nav');
  const pathname = usePathname() ?? '';

  // Suppress on onboarding so first-run users focus on the form.
  if (pathname.endsWith('/onboarding')) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-cream-border bg-cream/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {NAV_TABS.map(({ key, emoji, href }) => {
          const target = href(locale);
          const active = isTabActive(pathname, target);
          return (
            <li key={key} className="flex-1">
              <Link
                href={target}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ' +
                  (active ? 'text-ink' : 'text-muted hover:text-ink')
                }
              >
                <span
                  aria-hidden
                  className={
                    'text-xl leading-none transition-colors ' +
                    (active ? 'grayscale-0' : 'grayscale opacity-70')
                  }
                >
                  {emoji}
                </span>
                <span className={active ? 'text-ink' : 'text-muted'}>
                  {t(key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
