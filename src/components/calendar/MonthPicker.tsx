'use client';

import { useTranslations } from 'next-intl';
import { monthLabel } from '@/lib/calendar/dates';

export function MonthPicker({
  year,
  month1,
  locale,
  onPrev,
  onNext,
  onToday,
}: {
  year: number;
  month1: number;
  locale: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const t = useTranslations('calendar');
  const label = monthLabel(year, month1, locale);

  return (
    <div
      data-testid="month-picker"
      className="flex items-center justify-between gap-3"
    >
      <button
        type="button"
        aria-label={t('prevMonth')}
        onClick={onPrev}
        className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full border border-cream-border bg-white text-ink hover:bg-cream"
      >
        ◀
      </button>
      <h2
        aria-live="polite"
        className="text-base font-black text-ink md:text-lg"
        style={{ letterSpacing: '-0.01em' }}
      >
        {label}
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className="min-h-9 inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-black text-ink hover:bg-gold/90"
        >
          {t('today')}
        </button>
        <button
          type="button"
          aria-label={t('nextMonth')}
          onClick={onNext}
          className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full border border-cream-border bg-white text-ink hover:bg-cream"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
