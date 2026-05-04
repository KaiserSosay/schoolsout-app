'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { isoToParts, longDateLabel } from '@/lib/calendar/dates';
import {
  deriveClosureType,
  styleForClosureType,
} from '@/lib/calendar/closure-type';
import type { CalendarClosure } from '@/lib/calendar/types';
import type { KidColor } from '@/lib/calendar/kid-colors';

export type DayCellProps = {
  iso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  closure: CalendarClosure | null;
  // Per-school dot colors — only populated for /app/calendar with kids.
  kidColors: KidColor[];
  locale: string;
  onSelect: (iso: string) => void;
};

export const DayCell = forwardRef<HTMLButtonElement, DayCellProps>(
  function DayCell(
    { iso, isCurrentMonth, isToday, isSelected, closure, kidColors, locale, onSelect },
    ref,
  ) {
    const t = useTranslations('calendar');
    const { d } = isoToParts(iso);
    const closureType = closure
      ? deriveClosureType(closure.name, closure.closure_type ?? null)
      : null;
    const style = closureType ? styleForClosureType(closureType) : null;

    const dimmed = !isCurrentMonth;
    const ariaLabel = closure
      ? t('cellAriaClosure', {
          date: longDateLabel(iso, locale),
          name: closure.name,
          type: t(`closureType.${closureType ?? 'other'}`),
        })
      : t('cellAriaInSession', { date: longDateLabel(iso, locale) });

    const baseCls =
      'group relative flex aspect-square min-h-11 w-full select-none flex-col items-center justify-center rounded-xl text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple';
    const idleCls = closure
      ? `${style!.cellBg} ${style!.cellText}`
      : 'bg-white text-ink hover:bg-cream';
    const dimmedCls = dimmed ? 'opacity-40' : '';
    const todayCls = isToday ? 'ring-2 ring-ink' : '';
    const selectedCls = isSelected ? 'ring-2 ring-gold' : '';
    const motionCls = 'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]';

    return (
      <button
        ref={ref}
        type="button"
        role="gridcell"
        aria-label={ariaLabel}
        aria-current={isToday ? 'date' : undefined}
        data-iso={iso}
        data-testid={isToday ? 'day-cell-today' : undefined}
        data-closure={closure ? 'true' : 'false'}
        onClick={() => onSelect(iso)}
        className={`${baseCls} ${idleCls} ${dimmedCls} ${todayCls} ${selectedCls} ${motionCls}`}
      >
        <span className="text-xs font-black md:text-sm">{d}</span>
        {closure ? (
          <span
            aria-hidden
            className="text-base motion-safe:group-hover:rotate-3 md:text-lg"
          >
            {closure.emoji}
          </span>
        ) : null}
        {kidColors.length > 0 ? (
          <span
            aria-hidden
            className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5"
          >
            {kidColors.slice(0, 5).map((c, i) => (
              <span
                key={`${c.slug}-${i}`}
                className={`block h-1.5 w-1.5 rounded-full ${c.bg}`}
              />
            ))}
          </span>
        ) : null}
      </button>
    );
  },
);
