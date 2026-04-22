'use client';

import { useTranslations } from 'next-intl';

export function ExportCalendarButton() {
  const t = useTranslations('app.calendar');
  return (
    <a
      href="/api/calendar.ics"
      download="schoolsout.ics"
      className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-cream transition-colors hover:bg-ink/90"
    >
      <span aria-hidden>📥</span>
      <span>{t('export')}</span>
    </a>
  );
}
