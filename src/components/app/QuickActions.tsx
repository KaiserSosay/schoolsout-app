'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: MANAGE now links to /{locale}/app/settings — real UX, not a toast.
// INVITE CO-PARENT is still Phase 2, so we keep the toast but restyle it as
// "COMING SOON" so users don't expect it to do anything yet. Sync + Plan link
// to real routes as before.
export function QuickActions({ locale }: { locale: string }) {
  const t = useTranslations('app.dashboard.quickActions');
  const [toast, setToast] = useState<string | null>(null);

  const showSoon = () => {
    setToast(t('family.soon'));
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <section className="relative">
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${locale}/app/settings`}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40"
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
          onClick={showSoon}
          className="rounded-2xl border border-dashed border-cream-border bg-white/60 p-4 text-left transition-colors hover:border-brand-purple/40"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple/70">
            {t('family.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink/70">
            {t('family.action')}
          </div>
        </button>

        <a
          href="/api/calendar.ics"
          download="schoolsout.ics"
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40"
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
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40"
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
