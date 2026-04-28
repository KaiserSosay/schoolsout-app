'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { PwaInstallButton } from './PwaInstallButton';
import { LanguageToggleMobile } from '@/components/LanguageToggleMobile';
import type { Locale } from '@/i18n/config';

// Shared menu body — mobile renders inside a full-width sheet, desktop inside
// a popover. The only difference is the outer container; the items are the
// same.
export function UserMenuItems({
  locale,
  email,
  displayName,
  isAdmin = false,
  onAction,
}: {
  locale: string;
  email: string;
  displayName: string | null;
  // True when users.role is 'admin' or 'superadmin'. Surfaces a quiet menu
  // entry to /admin so Rasheid doesn't have to type the URL.
  isAdmin?: boolean;
  // called after any action that should close the enclosing menu
  onAction: () => void;
}) {
  const t = useTranslations('app.nav');
  const tHeader = useTranslations('app.header');
  const tMenu = useTranslations('app.userMenu');
  const router = useRouter();
  const { mode, setMode } = useMode();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const signOut = async () => {
    try {
      const sb = createBrowserSupabase();
      await sb.auth.signOut();
    } finally {
      onAction();
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  const signOutEverywhere = async () => {
    try {
      const sb = createBrowserSupabase();
      await sb.auth.signOut({ scope: 'global' });
      showSignedOutToast(tMenu('signedOutToast'));
    } finally {
      setConfirmOpen(false);
      onAction();
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  const itemCls =
    'flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink hover:bg-cream min-h-11';

  return (
    <div className="flex flex-col">
      {/* Identity block */}
      <div className="border-b border-cream-border px-4 py-3">
        <div className="truncate text-sm font-bold text-ink">
          {displayName ?? tHeader('signedIn')}
        </div>
        <div className="truncate text-xs text-muted">{email}</div>
      </div>

      {/* Mode toggle — surfaces the kid/parent switch that used to live on
          the header top bar. Kept here to avoid cluttering the new minimal
          header; still one tap away. */}
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'parents' ? 'kids' : 'parents');
          onAction();
        }}
        className="flex items-center gap-3 border-b border-cream-border px-4 py-3 text-left text-sm font-bold text-brand-purple hover:bg-purple-soft min-h-11"
      >
        <span aria-hidden className="text-base">
          {mode === 'parents' ? '🧒' : '👪'}
        </span>
        <span>
          {mode === 'parents' ? t('switchToKidMode') : t('switchToParentMode')}
        </span>
      </button>

      <Link href={`/${locale}/app/settings`} className={itemCls} onClick={onAction}>
        <span aria-hidden>⚙️</span>
        <span>{t('settings')}</span>
      </Link>
      <Link href={`/${locale}/app/settings`} className={itemCls} onClick={onAction}>
        <span aria-hidden>👤</span>
        <span>{t('profile')}</span>
      </Link>
      <Link href={`/${locale}/app/family`} className={itemCls} onClick={onAction}>
        <span aria-hidden>👨‍👩‍👧</span>
        <span>{t('family')}</span>
      </Link>

      {/* Idea trigger — Goal 2 wires this to the FeatureRequestModal.
          For now it's a no-op so we don't ship a dead click. The element
          exists so Goal 2 only has to swap the handler. */}
      <button
        type="button"
        onClick={() => {
          onAction();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('so-open-feature-request'));
          }
        }}
        className={itemCls + ' w-full text-left'}
      >
        <span aria-hidden>💡</span>
        <span>{t('idea')}</span>
      </button>

      <div className="border-t border-cream-border" />

      {isAdmin ? (
        <Link href={`/${locale}/admin`} className={itemCls} onClick={onAction}>
          <span aria-hidden>🛡️</span>
          <span>{tMenu('adminLink')}</span>
        </Link>
      ) : null}

      <Link href={`/${locale}/about`} className={itemCls} onClick={onAction}>
        <span aria-hidden>ℹ️</span>
        <span>{t('about')}</span>
      </Link>
      <Link href={`/${locale}/privacy`} className={itemCls} onClick={onAction}>
        <span aria-hidden>🔒</span>
        <span>{t('privacy')}</span>
      </Link>
      <Link href={`/${locale}/terms`} className={itemCls} onClick={onAction}>
        <span aria-hidden>📄</span>
        <span>{t('terms')}</span>
      </Link>

      <div className="border-t border-cream-border" />

      <div className="px-4 py-2">
        <PwaInstallButton label={tHeader('installApp')} />
      </div>

      {/* Language toggle — closes the desktop/mobile parity gap from the
          2026-04-27 nav audit. Mobile users used to have to navigate to
          Settings to change language; now it lives in the shared user
          menu so both surfaces expose it. */}
      <div
        className="border-t border-cream-border px-4 py-3"
        data-testid="user-menu-language-toggle"
      >
        <LanguageToggleMobile currentLocale={locale as Locale} />
      </div>

      <button
        type="button"
        onClick={signOut}
        className={itemCls + ' border-t border-cream-border text-left'}
      >
        <span aria-hidden>🚪</span>
        <span>{t('logout')}</span>
      </button>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={itemCls + ' text-left text-muted'}
      >
        <span aria-hidden>🌐</span>
        <span>{tMenu('logOutEverywhere')}</span>
      </button>

      {confirmOpen ? (
        <LogOutEverywhereDialog
          onCancel={() => setConfirmOpen(false)}
          onConfirm={signOutEverywhere}
        />
      ) : null}
    </div>
  );
}

function LogOutEverywhereDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const tMenu = useTranslations('app.userMenu');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-out-everywhere-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl border border-cream-border bg-cream p-6 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <h2
          id="log-out-everywhere-title"
          className="text-lg font-black text-ink"
          style={{ letterSpacing: '-0.01em' }}
        >
          {tMenu('logOutEverywhereConfirm.title')}
        </h2>
        <p className="mt-3 text-sm text-ink/80">
          {tMenu('logOutEverywhereConfirm.body')}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-cream-border bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-cream"
          >
            {tMenu('logOutEverywhereConfirm.cancelButton')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg"
          >
            {tMenu('logOutEverywhereConfirm.confirmButton')}
          </button>
        </div>
      </div>
    </>
  );
}

function showSignedOutToast(msg: string) {
  if (typeof document === 'undefined') return;
  let host = document.getElementById('so-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'so-toast-host';
    host.className =
      'fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className =
    'rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg bg-ink text-white pointer-events-auto';
  el.textContent = msg;
  el.setAttribute('role', 'status');
  host.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
