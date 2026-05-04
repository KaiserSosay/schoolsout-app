'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { isInRange, longDateLabel, relativeDays } from '@/lib/calendar/dates';
import {
  deriveClosureType,
  styleForClosureType,
} from '@/lib/calendar/closure-type';
import { reasonFor } from '@/lib/closure-reasons';
import type { CalendarClosure, CalendarKid } from '@/lib/calendar/types';
import { colorForKidOrdinal } from '@/lib/calendar/kid-colors';

export function DayDetailSheet({
  iso,
  today,
  locale,
  closure,
  kids,
  onClose,
}: {
  iso: string;
  today: string;
  locale: string;
  closure: CalendarClosure | null;
  kids: CalendarKid[];
  onClose: () => void;
}) {
  const t = useTranslations('calendar');
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Focus management — when the sheet opens, focus the close button.
  // Escape closes the sheet.
  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const days = relativeDays(iso, today);
  const closureType = closure
    ? deriveClosureType(closure.name, closure.closure_type ?? null)
    : null;
  const style = closureType ? styleForClosureType(closureType) : null;

  // Affected kids when /app/calendar passes them.
  const affectedKids = closure
    ? kids.filter(
        (k) =>
          closure.school_id === k.schoolId &&
          isInRange(iso, closure.start_date, closure.end_date),
      )
    : [];

  const reason = closure ? reasonFor(closure.name) : null;

  return (
    <>
      <button
        type="button"
        aria-label={t('sheetClose')}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm motion-safe:animate-[fadeIn_200ms_ease-out]"
        data-testid="day-detail-backdrop"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-heading"
        data-testid="day-detail-sheet"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-cream-border bg-cream p-5 shadow-2xl motion-safe:animate-[slideUp_300ms_ease-out] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md md:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-cream-border md:hidden" />
        <header className="flex items-start justify-between gap-3">
          <div>
            {closure ? (
              <p
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ' +
                  (style ? `${style.cellBg} ${style.cellText}` : '')
                }
              >
                <span aria-hidden>{closure.emoji}</span>
                {t(`closureType.${closureType ?? 'other'}`)}
              </p>
            ) : (
              <p className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-900">
                {t('inSession')}
              </p>
            )}
            <h2
              id="day-detail-heading"
              className="mt-2 text-xl font-black text-ink md:text-2xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {closure ? closure.name : t('schoolInSession')}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {longDateLabel(iso, locale)}
              {' · '}
              {days === 0
                ? t('today')
                : days > 0
                  ? t('inDays', { count: days })
                  : t('daysAgo', { count: Math.abs(days) })}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label={t('sheetClose')}
            onClick={onClose}
            className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full border border-cream-border bg-white text-ink hover:bg-cream"
          >
            ✕
          </button>
        </header>

        {affectedKids.length > 0 ? (
          <p className="mt-4 text-sm text-ink">
            <span className="font-black">{t('affects')}</span>{' '}
            {affectedKids.map((k, idx) => {
              const c = colorForKidOrdinal(k.ordinal);
              return (
                <span
                  key={k.id}
                  className="ml-1 inline-flex items-center gap-1 align-middle"
                >
                  <span
                    aria-hidden
                    className={`inline-block h-2.5 w-2.5 rounded-full ${c.bg}`}
                  />
                  {t('kidShort', { n: k.ordinal })}
                  {idx < affectedKids.length - 1 ? ',' : ''}
                </span>
              );
            })}
          </p>
        ) : null}

        {closure && reason ? (
          <section className="mt-4 rounded-2xl border border-cream-border bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted">
              {t('whyClosed')}
            </p>
            <p className="mt-1 text-sm text-ink">{reason}</p>
          </section>
        ) : null}

        {closure ? (
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/${locale}/app/closures/${closure.id}`}
              className="min-h-11 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-black text-cream hover:bg-ink/90"
            >
              {t('viewFullDetails')} →
            </Link>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-cream-border bg-white p-4 text-sm text-muted">
            {t('inSessionBody')}
          </p>
        )}
      </aside>
    </>
  );
}
