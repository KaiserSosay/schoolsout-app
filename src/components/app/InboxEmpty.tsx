'use client';

import { useTranslations } from 'next-intl';

export function InboxEmpty() {
  const t = useTranslations('app.inbox.empty');
  return (
    <div className="rounded-3xl border border-cream-border bg-white p-8 text-center">
      <div className="text-5xl" aria-hidden>
        📥
      </div>
      <h2
        className="mt-4 text-lg font-black text-ink"
        style={{ letterSpacing: '-0.01em' }}
      >
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('body')}</p>
    </div>
  );
}
