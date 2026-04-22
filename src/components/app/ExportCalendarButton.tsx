'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

export function ExportCalendarButton() {
  const t = useTranslations('app.calendar');
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <a
      href="/api/calendar.ics"
      download="schoolsout.ics"
      className={
        'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-colors ' +
        (isParents
          ? 'bg-ink text-cream hover:bg-ink/90'
          : 'bg-cta-yellow text-purple-deep hover:brightness-105')
      }
    >
      <span aria-hidden>📥</span>
      <span>{t('export')}</span>
    </a>
  );
}
