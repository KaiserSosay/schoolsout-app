'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { NAV_TABS, isTabActive } from './nav-config';
import { UserMenuItems } from './UserMenu';
import { NotificationsDrawer } from './NotificationsDrawer';
import { LanguageToggleMobile } from '@/components/LanguageToggleMobile';
import type { Locale } from '@/i18n/config';

// Desktop-only left sidebar. 260px, sticky. Logo → nav → "Got an idea?"
// button → language toggle → user block at the bottom (tap to open popover).
// Hidden on mobile where BottomNav + AppHeader take over.
export function SideNav({
  locale,
  email,
  displayName,
  isAdmin = false,
}: {
  locale: string;
  email: string;
  displayName: string | null;
  isAdmin?: boolean;
}) {
  const tNav = useTranslations('app.nav');
  const { mode, isKidLocked } = useMode();
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const userBlockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userBlockRef.current && !userBlockRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const initial =
    (displayName?.trim().charAt(0) || email.charAt(0) || 'P').toUpperCase();

  const shellCls =
    mode === 'parents'
      ? 'bg-cream/95 border-r border-cream-border'
      : 'bg-purple-deep/90 border-r border-white/10';
  const textCls = mode === 'parents' ? 'text-ink' : 'text-white';
  const mutedCls = mode === 'parents' ? 'text-muted' : 'text-white/70';
  const hoverCls =
    mode === 'parents' ? 'hover:bg-purple-soft' : 'hover:bg-white/10';

  const onIdeaClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('so-open-feature-request'));
    }
  };

  return (
    <aside
      aria-label="Primary"
      className={
        'hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:w-[260px] md:shrink-0 ' +
        shellCls
      }
    >
      {/* Logo */}
      <Link
        href={`/${locale}/app`}
        className={'px-5 pt-6 pb-4 text-2xl font-black tracking-tight ' + textCls}
        style={{ fontWeight: 900 }}
      >
        School&apos;s Out<span className="text-gold">!</span>
      </Link>

      {/* Nav */}
      {!isKidLocked && (
        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="flex flex-col gap-1">
            {NAV_TABS.map(({ key, emoji, href }) => {
              const target = href(locale);
              const active = isTabActive(pathname, target);
              const activeBg =
                mode === 'parents'
                  ? 'bg-purple-soft text-brand-purple'
                  : 'bg-white/10 text-white';
              return (
                <li key={key}>
                  <Link
                    href={target}
                    aria-current={active ? 'page' : undefined}
                    className={
                      'flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-colors ' +
                      (active ? activeBg : textCls + ' ' + hoverCls)
                    }
                  >
                    <span aria-hidden className="text-xl leading-none">
                      {emoji}
                    </span>
                    <span>{tNav(key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-4 border-t border-cream-border/50" />

          {/* Notifications bell — closes the desktop gap from the
              2026-04-27 nav audit. Same NotificationsDrawer the mobile
              AppHeader uses; same useState open/close pattern. Shaped
              like a primary nav-tab row so it anchors with the
              primary-nav rhythm rather than feeling like an icon-button
              afterthought. */}
          <button
            type="button"
            onClick={() => setBellOpen(true)}
            aria-label={tNav('openNotifications')}
            aria-haspopup="dialog"
            aria-expanded={bellOpen}
            className={
              'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-colors ' +
              textCls +
              ' ' +
              hoverCls
            }
          >
            <span aria-hidden className="text-xl leading-none">🔔</span>
            <span>{tNav('notifications')}</span>
          </button>

          {/* Idea trigger — standalone, gold-outline per spec. Opens the
              FeatureRequestModal (wired in Goal 2). */}
          <button
            type="button"
            onClick={onIdeaClick}
            className={
              'mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl border-2 border-gold px-3 py-2 text-sm font-bold transition-colors ' +
              (mode === 'parents'
                ? 'text-ink hover:bg-gold/10'
                : 'text-white hover:bg-gold/20')
            }
          >
            <span aria-hidden>💡</span>
            <span>{tNav('idea')}</span>
          </button>

          {/* Admin entry — only renders when isAdmin. Lives next to the idea
              button so admins reach /admin in one click instead of opening
              the avatar popover. UserMenuItems still has its admin link for
              the avatar route. */}
          {isAdmin ? (
            <Link
              href={`/${locale}/admin`}
              data-testid="sidenav-admin-link"
              className={
                'mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl border-2 border-amber-400 px-3 py-2 text-sm font-bold transition-colors ' +
                (mode === 'parents'
                  ? 'text-ink hover:bg-amber-100'
                  : 'text-white hover:bg-amber-400/20')
              }
            >
              <span aria-hidden>🛡️</span>
              <span>{tNav('admin')}</span>
            </Link>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <LanguageToggleMobile
              currentLocale={locale as Locale}
              darkMode={mode === 'kids'}
            />
            <span className={'text-xs font-semibold ' + mutedCls}>
              {locale.toUpperCase()}
            </span>
          </div>
        </nav>
      )}

      {/* User block at bottom */}
      <div
        ref={userBlockRef}
        className={
          'relative mt-auto border-t px-3 py-3 ' +
          (mode === 'parents' ? 'border-cream-border' : 'border-white/10')
        }
      >
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={
            'flex w-full min-h-11 items-center gap-3 rounded-xl px-2 py-2 transition-colors ' +
            hoverCls
          }
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-black text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className={'truncate text-sm font-bold ' + textCls}>
              {displayName ?? email.split('@')[0]}
            </div>
            <div className={'truncate text-xs ' + mutedCls}>{email}</div>
          </div>
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-cream-border bg-white shadow-2xl"
          >
            <UserMenuItems
              locale={locale}
              email={email}
              displayName={displayName}
              isAdmin={isAdmin}
              onAction={() => setMenuOpen(false)}
            />
          </div>
        ) : null}
      </div>

      <NotificationsDrawer open={bellOpen} onClose={() => setBellOpen(false)} />
    </aside>
  );
}
