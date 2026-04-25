'use client';

// Returning-on-new-device privacy reminder.
//
// Phase 3.0 / Item 3.9. When a parent signs in successfully and lands at
// /app but their localStorage `so-kids` is empty AND they have at least
// one enabled reminder subscription on file, show a small banner
// explaining that kid names are local-only by design (COPPA) and offer
// to add them in Settings/Family.
//
// The banner self-suppresses for 30 days after dismissal (per ground
// rule: don't be naggy, parents are tired).

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const KIDS_KEY = 'so-kids';
const DISMISSED_KEY = 'so-new-device-banner-dismissed-at';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function NewDeviceKidReminderBanner({
  userHasSubscriptions,
  locale,
  // override hooks for tests — production callers should leave these alone.
  storageKey = KIDS_KEY,
  dismissedKey = DISMISSED_KEY,
  ttlMs = DISMISS_TTL_MS,
}: {
  userHasSubscriptions: boolean;
  locale: string;
  storageKey?: string;
  dismissedKey?: string;
  ttlMs?: number;
}) {
  const t = useTranslations('app.dashboard.newDeviceBanner');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userHasSubscriptions) return;
    try {
      const raw = localStorage.getItem(storageKey);
      const kids = raw ? (JSON.parse(raw) as unknown[]) : [];
      if (Array.isArray(kids) && kids.length > 0) return;
      const dismissedAt = localStorage.getItem(dismissedKey);
      if (dismissedAt) {
        const ts = parseInt(dismissedAt, 10);
        if (Number.isFinite(ts) && Date.now() - ts < ttlMs) return;
      }
      setVisible(true);
    } catch {
      // localStorage may throw in private mode / sandboxed iframes — fail
      // closed: don't show the banner.
    }
  }, [userHasSubscriptions, storageKey, dismissedKey, ttlMs]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissedKey, String(Date.now()));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <aside
      role="status"
      data-testid="new-device-banner"
      className="relative rounded-3xl border-l-4 border-brand-purple bg-cream px-5 py-4 pr-12 md:px-6"
    >
      <p className="text-sm font-black text-ink md:text-base">
        <span aria-hidden className="mr-1">
          👋
        </span>
        {t('heading')}
      </p>
      <p className="mt-2 text-sm text-ink/80">{t('body')}</p>
      <Link
        href={`/${locale}/app/family`}
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:bg-ink/90"
      >
        {t('cta')}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('dismissAriaLabel')}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"
      >
        ✕
      </button>
    </aside>
  );
}
