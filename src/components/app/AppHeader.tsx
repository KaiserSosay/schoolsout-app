'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { UserMenuItems } from './UserMenu';
import { NotificationsDrawer } from './NotificationsDrawer';

// Mobile-only top bar. Logo left, bell + avatar right. 56px tall.
// No mode toggle / PWA / language / gear here — those live in the user menu.
// Hidden on md+ because the desktop SideNav is the chrome.
export function AppHeader({
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
  const tExit = useTranslations('app.dashboard.exitKidLock');
  const tNav = useTranslations('app.nav');
  const { mode, isKidLocked, exitKidLock } = useMode();
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Close menu on route change.
  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  // DECISION (Phase 3.0 / Item 1.8): rely on the backdrop's onClick + the
  // pathname-change effect above to close the menu. A previous window-level
  // `mousedown` listener fired BEFORE the synthetic `click` on each menu Link
  // in iOS Safari (touchstart → touchend → mousedown → click), unmounting the
  // sheet between mousedown and click and swallowing the navigation. The
  // backdrop's onClick covers all "tap outside" cases since it sits inset-0
  // over the screen at z-40 (menu is z-50).

  const initial =
    (displayName?.trim().charAt(0) || email.charAt(0) || 'P').toUpperCase();

  const shell =
    mode === 'parents'
      ? 'bg-cream/92 backdrop-blur-xl border-b border-cream-border'
      : 'bg-purple-deep/80 backdrop-blur border-b border-white/10';
  const logoCls = mode === 'parents' ? 'text-ink' : 'text-white';
  const iconBtnCls =
    mode === 'parents'
      ? 'bg-white border border-cream-border hover:border-brand-purple/40 text-ink'
      : 'border border-white/30 bg-white/10 hover:bg-white/20 text-white';

  return (
    <>
      <header
        className={'sticky top-0 z-40 md:hidden transition-colors ' + shell}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link
            href={`/${locale}/app`}
            className={'text-lg font-black tracking-tight ' + logoCls}
            style={{ fontWeight: 900 }}
          >
            School&apos;s Out<span className="text-gold">!</span>
          </Link>

          <div className="flex items-center gap-2">
            {isKidLocked ? (
              <button
                type="button"
                onClick={exitKidLock}
                className="inline-flex h-11 items-center rounded-full border border-white/30 px-3 text-xs font-bold text-white hover:bg-white/10"
              >
                {tExit('label')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setBellOpen(true)}
                  aria-label={tNav('notifications')}
                  className={
                    'flex h-11 w-11 items-center justify-center rounded-full text-base transition-colors ' +
                    iconBtnCls
                  }
                >
                  🔔
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={tNav('openUserMenu')}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple text-base font-black text-white hover:bg-brand-purple/90"
                  >
                    {initial}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile user-menu sheet. Mounted outside header so scroll-locking
          and the backdrop don't fight the sticky-header stacking context. */}
      {menuOpen && !isKidLocked ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="fixed inset-x-0 top-14 z-50 mx-auto w-full max-w-md overflow-hidden rounded-b-3xl border border-cream-border bg-white shadow-2xl md:hidden"
          >
            <UserMenuItems
              locale={locale}
              email={email}
              displayName={displayName}
              isAdmin={isAdmin}
              onAction={() => setMenuOpen(false)}
            />
          </div>
        </>
      ) : null}

      <NotificationsDrawer open={bellOpen} onClose={() => setBellOpen(false)} />
    </>
  );
}
