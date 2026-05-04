'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isInRange, isoToParts, todayISO } from '@/lib/calendar/dates';
import type { CalendarClosure, CalendarKid } from '@/lib/calendar/types';
import { TodayHero } from './TodayHero';
import { MonthPicker } from './MonthPicker';
import { MonthGrid } from './MonthGrid';
import { KidAvatarRow } from './KidAvatarRow';
import { DayDetailSheet } from './DayDetailSheet';
import { UpcomingList } from './UpcomingList';

export function CalendarView({
  locale,
  closures,
  kids = [],
  schoolNameFallback,
  initialToday,
}: {
  locale: string;
  closures: CalendarClosure[];
  kids?: CalendarKid[];
  schoolNameFallback?: string;
  // Server passes today's date so SSR matches client first paint.
  initialToday?: string;
}) {
  const t = useTranslations('calendar');
  const today = initialToday ?? todayISO();
  const { y, m } = isoToParts(today);

  const [year, setYear] = useState<number>(y);
  const [month1, setMonth1] = useState<number>(m);
  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const [filterKidId, setFilterKidId] = useState<string | null>(null);

  function onPrev() {
    if (month1 === 1) {
      setYear(year - 1);
      setMonth1(12);
    } else {
      setMonth1(month1 - 1);
    }
  }
  function onNext() {
    if (month1 === 12) {
      setYear(year + 1);
      setMonth1(1);
    } else {
      setMonth1(month1 + 1);
    }
  }
  function onToday() {
    setYear(y);
    setMonth1(m);
    setSelectedISO(today);
  }

  // The closure represented in the day detail sheet — pick whichever
  // closure covers the selected ISO. If filtering by kid, restrict to
  // that kid's school.
  const selectedClosure = useMemo<CalendarClosure | null>(() => {
    if (!selectedISO) return null;
    const candidates = closures.filter((c) =>
      isInRange(selectedISO, c.start_date, c.end_date),
    );
    if (filterKidId) {
      const kid = kids.find((k) => k.id === filterKidId);
      if (!kid) return null;
      return (
        candidates.find((c) => c.school_id === kid.schoolId) ?? null
      );
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
      const aDur =
        new Date(a.end_date + 'T12:00:00Z').getTime() -
        new Date(a.start_date + 'T12:00:00Z').getTime();
      const bDur =
        new Date(b.end_date + 'T12:00:00Z').getTime() -
        new Date(b.start_date + 'T12:00:00Z').getTime();
      return bDur - aDur;
    });
    return candidates[0];
  }, [selectedISO, closures, filterKidId, kids]);

  return (
    <div className="space-y-5" data-testid="calendar-view">
      <TodayHero
        today={today}
        locale={locale}
        closures={closures}
        schoolNameFallback={schoolNameFallback}
      />
      {kids.length > 0 ? (
        <KidAvatarRow
          kids={kids}
          selectedKidId={filterKidId}
          onSelect={setFilterKidId}
        />
      ) : null}
      <MonthPicker
        year={year}
        month1={month1}
        locale={locale}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />
      <MonthGrid
        year={year}
        month1={month1}
        today={today}
        selectedISO={selectedISO}
        onSelect={setSelectedISO}
        closures={closures}
        kids={kids}
        filterKidId={filterKidId}
        locale={locale}
      />
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted">
          {t('upcomingHeading')}
        </h3>
        <UpcomingList
          today={today}
          closures={closures}
          locale={locale}
          onSelect={setSelectedISO}
        />
      </section>
      {selectedISO ? (
        <DayDetailSheet
          iso={selectedISO}
          today={today}
          locale={locale}
          closure={selectedClosure}
          kids={kids}
          onClose={() => setSelectedISO(null)}
        />
      ) : null}
    </div>
  );
}
