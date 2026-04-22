'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

// DECISION: Bottom nav is fixed on mobile, hidden on md+ desktop where a side/
// top nav makes more sense. Suppressed entirely on /onboarding so first-run
// users focus on the form without tab chrome suggesting the app is ready.
const tabs = [
  { key: 'calendar', href: (l: string) => `/${l}/app/calendar`, emoji: '📅' },
  { key: 'camps',    href: (l: string) => `/${l}/app/camps`,    emoji: '🎪' },
  { key: 'saved',    href: (l: string) => `/${l}/app/saved`,    emoji: '⭐' },
  { key: 'inbox',    href: (l: string) => `/${l}/app/inbox`,    emoji: '📥' },
] as const;

export function BottomNav({ locale }: { locale: string }) {
  const t = useTranslations('app.bottomNav');
  const pathname = usePathname() ?? '';

  if (pathname.endsWith('/onboarding')) return null;

  return (
    <nav
      aria-label="App sections"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-cream-border bg-cream/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {tabs.map(({ key, href, emoji }) => {
          const targetHref = href(locale);
          const active = pathname === targetHref || pathname.startsWith(targetHref + '/');
          return (
            <li key={key} className="flex-1">
              <Link
                href={targetHref}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ' +
                  (active ? 'text-brand-purple' : 'text-muted hover:text-ink')
                }
              >
                <span aria-hidden className="text-xl leading-none">
                  {emoji}
                </span>
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
