'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useMode } from './ModeProvider';
import { PwaInstallButton } from './PwaInstallButton';

// DECISION: AppHeader is chrome only — logo, mode toggle, language, user menu.
// The per-page greeting ("Welcome back, Rasheid") lives inside the dashboard
// itself so it can paint immediately from server-fetched data.
export function AppHeader({
  locale,
  email,
  displayName,
}: {
  locale: string;
  email: string;
  displayName: string | null;
}) {
  const t = useTranslations('app.header');
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const shellParents = 'bg-cream/92 backdrop-blur-xl border-b border-cream-border';
  const shellKids    = 'bg-purple-deep/70 backdrop-blur-xl border-b border-white/10';
  const shell = mode === 'parents' ? shellParents : shellKids;

  // DECISION: the toggle label advertises the OTHER mode — i.e. in Parent mode
  // it says "Kid Mode →" because tapping flips to kid mode. Mirrors the pattern
  // used across native toggles (Edit ↔ Done, Play ↔ Pause).
  const toggleLabel = mode === 'parents' ? t('kidMode') : t('parentMode');

  const otherLocale = locale === 'en' ? 'es' : 'en';
  // swap /en or /es prefix with the other locale, preserving the rest of the path.
  const localePath = pathname.replace(/^\/(en|es)(?=\/|$)/, `/${otherLocale}`);

  const initial =
    (displayName?.trim().charAt(0) || email.charAt(0) || 'P').toUpperCase();

  const signOut = async () => {
    try {
      const sb = createBrowserSupabase();
      await sb.auth.signOut();
    } finally {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  return (
    <header className={'sticky top-0 z-40 transition-colors ' + shell}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link
          href={`/${locale}/app`}
          className={
            'text-xl font-black tracking-tight md:text-2xl ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
          style={{ fontWeight: 900 }}
        >
          School&apos;s Out<span className="text-gold">!</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setMode(mode === 'parents' ? 'kids' : 'parents')}
            className={
              'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
              (mode === 'parents'
                ? 'bg-ink/5 text-ink hover:bg-ink/10'
                : 'bg-white/10 text-white hover:bg-white/20')
            }
          >
            {toggleLabel}
          </button>

          <Link
            href={localePath}
            className={
              'hidden md:inline-flex rounded-full px-2 py-1 text-xs font-bold transition-colors ' +
              (mode === 'parents'
                ? 'text-muted hover:text-ink'
                : 'text-white/60 hover:text-white')
            }
            aria-label={otherLocale.toUpperCase()}
          >
            {otherLocale.toUpperCase()}
          </Link>

          <PwaInstallButton label={t('installApp')} />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-colors ' +
                (mode === 'parents'
                  ? 'bg-brand-purple text-white hover:bg-brand-purple/90'
                  : 'bg-cta-yellow text-purple-deep hover:brightness-105')
              }
              aria-label={email}
            >
              {initial}
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-11 w-52 overflow-hidden rounded-2xl border border-cream-border bg-white shadow-xl"
              >
                <div className="border-b border-cream-border px-3 py-2">
                  <div className="truncate text-xs font-bold text-ink">
                    {displayName ?? t('signedIn')}
                  </div>
                  <div className="truncate text-[11px] text-muted">{email}</div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  role="menuitem"
                  className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-cream"
                >
                  {t('signOut')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
