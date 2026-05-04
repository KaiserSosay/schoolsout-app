'use client';

import { useTranslations } from 'next-intl';
import type { CalendarKid } from '@/lib/calendar/types';
import { colorForKidOrdinal } from '@/lib/calendar/kid-colors';

export function KidAvatarRow({
  kids,
  selectedKidId,
  onSelect,
}: {
  kids: CalendarKid[];
  // null = "All"
  selectedKidId: string | null;
  onSelect: (kidId: string | null) => void;
}) {
  const t = useTranslations('calendar');
  if (kids.length === 0) return null;

  return (
    <div
      data-testid="kid-avatar-row"
      role="tablist"
      aria-label={t('kidFilterLabel')}
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedKidId === null}
        onClick={() => onSelect(null)}
        className={
          'min-h-9 inline-flex items-center rounded-full px-3 py-1 text-xs font-black ' +
          (selectedKidId === null
            ? 'bg-ink text-cream'
            : 'border border-cream-border bg-white text-ink')
        }
      >
        {t('allKids')}
      </button>
      {kids.map((k) => {
        const color = colorForKidOrdinal(k.ordinal);
        const initial = (k.displayInitial ?? '').slice(0, 1).toUpperCase();
        const isSel = selectedKidId === k.id;
        return (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={isSel}
            aria-label={t('kidFilterAria', { n: k.ordinal })}
            onClick={() => onSelect(k.id)}
            className={
              'min-h-9 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-black transition-colors ' +
              (isSel
                ? 'bg-ink text-cream'
                : 'border border-cream-border bg-white text-ink hover:bg-cream')
            }
          >
            <span
              aria-hidden
              className={
                'inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ' +
                color.bg +
                ' ' +
                color.text
              }
            >
              {initial || k.ordinal}
            </span>
            <span className="pr-1">{t('kidShort', { n: k.ordinal })}</span>
          </button>
        );
      })}
    </div>
  );
}
