'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  buildMonthGridCells,
  isoToParts,
  isInRange,
  weekdayShortNames,
  addDays,
} from '@/lib/calendar/dates';
import type { CalendarClosure, CalendarKid } from '@/lib/calendar/types';
import { colorForKidOrdinal } from '@/lib/calendar/kid-colors';
import { DayCell } from './DayCell';

export function MonthGrid({
  year,
  month1,
  today,
  selectedISO,
  onSelect,
  closures,
  kids,
  filterKidId,
  locale,
}: {
  year: number;
  month1: number;
  today: string;
  selectedISO: string | null;
  onSelect: (iso: string) => void;
  closures: CalendarClosure[];
  kids: CalendarKid[];
  // null = "All kids overlay". A specific kid id filters down to their school.
  filterKidId: string | null;
  locale: string;
}) {
  const t = useTranslations('calendar');
  const weekStart: 0 | 1 = locale === 'es' ? 1 : 0;
  const { cells } = buildMonthGridCells(year, month1, weekStart);
  const headerNames = weekdayShortNames(locale, weekStart);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Filter closures: when a specific kid is selected, only their school.
  const relevantClosures = filterKidId
    ? closures.filter((c) => {
        const kid = kids.find((k) => k.id === filterKidId);
        if (!kid || !c.school_id) return false;
        return c.school_id === kid.schoolId;
      })
    : closures;

  // For each cell, find a closure that covers it (single representative
  // — if multiple closures overlap, pick the longest-running break first
  // because a federal holiday inside Winter Break should READ as winter
  // break in the cell).
  function closureOn(iso: string): CalendarClosure | null {
    const matches = relevantClosures.filter((c) =>
      isInRange(iso, c.start_date, c.end_date),
    );
    if (matches.length === 0) return null;
    // Prefer longest-running.
    matches.sort((a, b) => {
      const aLen = a.end_date.localeCompare(a.start_date);
      void aLen;
      const aDur =
        new Date(a.end_date + 'T12:00:00Z').getTime() -
        new Date(a.start_date + 'T12:00:00Z').getTime();
      const bDur =
        new Date(b.end_date + 'T12:00:00Z').getTime() -
        new Date(b.start_date + 'T12:00:00Z').getTime();
      return bDur - aDur;
    });
    return matches[0];
  }

  // Per-cell kid-color dots: only when /app/calendar (kids non-empty).
  function kidColorsOn(iso: string) {
    if (kids.length === 0) return [];
    if (filterKidId) return []; // already filtered to one kid; no need for dots
    const affected = new Set<string>();
    for (const c of relevantClosures) {
      if (!c.school_id) continue;
      if (!isInRange(iso, c.start_date, c.end_date)) continue;
      for (const k of kids) {
        if (k.schoolId === c.school_id) affected.add(k.id);
      }
    }
    return kids
      .filter((k) => affected.has(k.id))
      .map((k) => colorForKidOrdinal(k.ordinal));
  }

  // Keyboard navigation: left/right = ±1 day, up/down = ±7 days, Enter
  // = open detail, Home/End = first/last of week. Implemented by
  // consulting data-iso on focused cell, then focusing the next.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const iso = target?.getAttribute?.('data-iso');
      if (!iso) return;
      let nextIso: string | null = null;
      switch (e.key) {
        case 'ArrowLeft':
          nextIso = addDays(iso, -1);
          break;
        case 'ArrowRight':
          nextIso = addDays(iso, 1);
          break;
        case 'ArrowUp':
          nextIso = addDays(iso, -7);
          break;
        case 'ArrowDown':
          nextIso = addDays(iso, 7);
          break;
        case 'Enter':
        case ' ':
          // Native button click handles this — let it bubble.
          return;
        default:
          return;
      }
      e.preventDefault();
      const next = grid.querySelector<HTMLButtonElement>(
        `button[data-iso="${nextIso}"]`,
      );
      next?.focus();
    };
    grid.addEventListener('keydown', onKey);
    return () => grid.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div data-testid="month-grid" className="space-y-2">
      <div
        role="row"
        className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-muted md:text-xs"
        aria-label={t('weekdayHeaderLabel')}
      >
        {headerNames.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>
      <div
        ref={gridRef}
        role="grid"
        aria-label={t('gridAriaLabel')}
        className="grid grid-cols-7 gap-1 motion-safe:animate-[fadeIn_400ms_ease-out]"
      >
        {cells.map((iso) => {
          const { m } = isoToParts(iso);
          const isCurrentMonth = m === month1;
          const isToday = iso === today;
          const isSelected = selectedISO === iso;
          return (
            <DayCell
              key={iso}
              iso={iso}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isSelected={isSelected}
              closure={closureOn(iso)}
              kidColors={kidColorsOn(iso)}
              locale={locale}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
