'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { PwaInstallButton } from './PwaInstallButton';

// Shared menu body — mobile renders inside a full-width sheet, desktop inside
// a popover. The only difference is the outer container; the items are the
// same.
export function UserMenuItems({
  locale,
  email,
  displayName,
  onAction,
}: {
  locale: string;
  email: string;
  displayName: string | null;
  // called after any action that should close the enclosing menu
  onAction: () => void;
}) {
  const t = useTranslations('app.nav');
  const tHeader = useTranslations('app.header');
  const router = useRouter();
  const { mode, setMode } = useMode();

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

      <button
        type="button"
        onClick={signOut}
        className={itemCls + ' border-t border-cream-border text-left'}
      >
        <span aria-hidden>🚪</span>
        <span>{t('logout')}</span>
      </button>
    </div>
  );
}
