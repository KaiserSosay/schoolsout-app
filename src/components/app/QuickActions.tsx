'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: Manage (+ Add a school) and Family (Invite co-parent) aren't built
// yet — a lightweight "coming soon" toast keeps the buttons discoverable
// without fabricating functionality. Sync + Plan link to real routes today.
export function QuickActions({ locale }: { locale: string }) {
  const t = useTranslations('app.dashboard.quickActions');
  const [toast, setToast] = useState<string | null>(null);

  const showSoon = (key: 'manage' | 'family') => {
    setToast(t(`${key}.soon`));
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <section className="relative">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => showSoon('manage')}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {t('manage.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
            {t('manage.action')}
          </div>
        </button>

        <button
          type="button"
          onClick={() => showSoon('family')}
          className="rounded-2xl border border-cream-border bg-white p-4 text-left transition-colors hover:border-brand-purple/40"
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-muted">
            {t('family.label')}
          </div>
          <div className="mt-1 text-sm font-black text-ink">
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
