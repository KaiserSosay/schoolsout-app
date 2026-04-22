'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { locales, type Locale } from '@/i18n/config';

// DECISION: Mobile-only globe button + dropdown. Existing EN/ES pill toggle
// eats horizontal space on narrow screens, so this collapses to a single 36px
// globe. darkMode maps to Kid Mode chrome; light mode to Parent Mode chrome.
export function LanguageToggleMobile({
  currentLocale,
  darkMode = false,
}: {
  currentLocale: Locale;
  darkMode?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const labels: Record<Locale, string> = { en: 'English', es: 'Español' };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          'h-11 w-11 flex items-center justify-center rounded-full text-base ' +
          (darkMode
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-white border border-cream-border hover:border-ink')
        }
      >
        🌐
      </button>
      {open && (
        <div
          role="menu"
          className={
            'absolute right-0 mt-2 min-w-32 rounded-xl shadow-lg overflow-hidden ' +
            (darkMode
              ? 'bg-purple-deep border border-white/10'
              : 'bg-white border border-cream-border')
          }
        >
          {locales.map((loc) => {
            const isActive = loc === currentLocale;
            const activeCls = darkMode
              ? 'bg-white/10 text-white font-semibold'
              : 'bg-purple-soft text-brand-purple font-semibold';
            const inactiveCls = darkMode
              ? 'text-white/70 hover:bg-white/10'
              : 'text-ink hover:bg-cream';
            return (
              <Link
                key={loc}
                href={`/${loc}`}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                className={
                  'block px-3 py-2 text-sm ' +
                  (isActive ? activeCls : inactiveCls)
                }
                onClick={() => setOpen(false)}
              >
                {labels[loc]}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
