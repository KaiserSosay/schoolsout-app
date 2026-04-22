'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: MANAGE links to /{locale}/app/settings. FAMILY actually triggers
// navigator.share() now — with a clipboard fallback — replacing the old "coming
// soon" toast. SYNC downloads .ics. PLAN links to /camps. Nothing here is a
// dead tap.
export function QuickActions({ locale }: { locale: string }) {
  const t = useTranslations('app.dashboard.quickActions');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFamilyClick() {
    if (busy) return;
    setBusy(true);
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/app`
        : '';
    const shareData = {
      title: t('family.shareTitle'),
      text: t('family.shareText'),
      url,
    };
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share(shareData);
        setBusy(false);
        return;
      }
    } catch {
      /* user cancelled native sheet — fall through to clipboard */
    }
    // Clipboard fallback
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(url);
        setToast(t('family.copied'));
      } else {
        setToast(t('family.copyFailed'));
      }
    } catch {
      setToast(t('family.copyFailed'));
    }
    setTimeout(() => setToast(null), 2200);
    setBusy(false);
  }

  return (
    <section className="relative">
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${locale}/app/settings`}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40 min-h-11"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {t('manage.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t('manage.action')}
          </div>
        </Link>

        <button
          type="button"
          onClick={onFamilyClick}
          disabled={busy}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40 min-h-11 disabled:opacity-60"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple/80">
            {t('family.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t('family.action')}
          </div>
        </button>

        <a
          href="/api/calendar.ics"
          download="schoolsout.ics"
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40 min-h-11"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {t('sync.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t('sync.action')}
          </div>
        </a>

        <Link
          href={`/${locale}/app/camps`}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40 min-h-11"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {t('plan.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t('plan.action')}
          </div>
        </Link>
      </div>

      {toast ? (
        <div
          role="status"
          className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </section>
  );
}
