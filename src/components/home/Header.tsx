'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { useMode } from './ModeContext';
import { ModeToggle } from './ModeToggle';
import { LanguageToggleMobile } from '@/components/LanguageToggleMobile';

export function Header({
  locale,
  loggedIn = false,
}: {
  locale: string;
  loggedIn?: boolean;
}) {
  const t = useTranslations('landing.header');
  const tApp = useTranslations('app.header');
  const { mode, setMode } = useMode();

  const shellParents =
    'bg-[#FBF8F1]/92 backdrop-blur-xl border-b border-cream-border';
  const shellKids =
    'bg-purple-deep/70 backdrop-blur-xl border-b border-white/10';

  const shell = mode === 'parents' ? shellParents : shellKids;

  return (
    <header className={'sticky top-0 z-40 transition-colors ' + shell}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4">
        <Link
          href={`/${locale}`}
          className={
            'editorial-h1 text-xl md:text-2xl tracking-editorial ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
          style={{ fontWeight: 900 }}
        >
          School&apos;s Out<span className="text-gold">!</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <ModeToggle mode={mode} onChange={setMode} />

          {/* Desktop (sm+): EN / ES pills */}
          <div className="hidden sm:block">
            <LocaleSwitch currentLocale={locale as Locale} mode={mode} />
          </div>

          {/* Mobile: globe dropdown */}
          <div className="sm:hidden">
            <LanguageToggleMobile
              currentLocale={locale as Locale}
              darkMode={mode === 'kids'}
            />
          </div>

          {loggedIn ? (
            <Link
              href={`/${locale}/app`}
              className={
                'inline-flex items-center whitespace-nowrap rounded-full px-4 md:px-5 py-2 md:py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ' +
                (mode === 'parents'
                  ? 'bg-ink text-white'
                  : 'bg-cta-yellow text-purple-deep')
              }
            >
              {tApp('openApp')}
            </Link>
          ) : (
            <>
              <a
                href="#signup"
                className={
                  'hidden sm:inline-flex text-sm font-bold transition-colors ' +
                  (mode === 'parents' ? 'text-ink/70 hover:text-ink' : 'text-white/80 hover:text-white')
                }
              >
                {t('signIn')}
              </a>
              <a
                href="#signup"
                className={
                  'inline-flex items-center whitespace-nowrap rounded-full px-4 md:px-5 py-2 md:py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg ' +
                  (mode === 'parents'
                    ? 'bg-ink text-white'
                    : 'bg-cta-yellow text-purple-deep')
                }
              >
                {t('startFree')}
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function LocaleSwitch({ currentLocale, mode }: { currentLocale: Locale; mode: 'parents' | 'kids' }) {
  const locales: Locale[] = ['en', 'es'];
  return (
    <div className="flex items-center gap-0.5 text-xs font-bold">
      {locales.map((loc) => {
        const active = loc === currentLocale;
        return (
          <Link
            key={loc}
            href={`/${loc}`}
            aria-current={active ? 'page' : undefined}
            className={
              'px-2 py-1 rounded-full transition-colors ' +
              (mode === 'parents'
                ? active
                  ? 'bg-ink text-white'
                  : 'text-muted hover:text-ink'
                : active
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white')
            }
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
