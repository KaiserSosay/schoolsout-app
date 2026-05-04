'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ViewToggle,
  readStoredView,
  type CalendarViewMode,
} from './ViewToggle';
import { CalendarView } from './CalendarView';
import type { CalendarClosure, CalendarKid } from '@/lib/calendar/types';

// Wrapper that lets the existing list-view markup live untouched while
// adding a [List | Calendar] toggle and the new CalendarView. Server
// renders both views as siblings; the toggle just hides one with
// display: none so SSR/CSR don't disagree.
//
// `listChildren` is whatever the page already renders for the list view.
// `closures` is the same data structured for the calendar.
export function ListOrCalendarSwitch({
  defaultView,
  locale,
  closures,
  kids,
  schoolNameFallback,
  initialToday,
  listChildren,
  toggleClassName,
}: {
  defaultView: CalendarViewMode;
  locale: string;
  closures: CalendarClosure[];
  kids?: CalendarKid[];
  schoolNameFallback?: string;
  initialToday?: string;
  listChildren: ReactNode;
  toggleClassName?: string;
}) {
  const [view, setView] = useState<CalendarViewMode>(defaultView);
  const [hydrated, setHydrated] = useState(false);

  // Honor user's stored preference once we're on the client.
  useEffect(() => {
    setView(readStoredView(defaultView));
    setHydrated(true);
  }, [defaultView]);

  return (
    <div className="space-y-4" data-testid="list-or-calendar-switch">
      <div className={`flex items-center justify-end ${toggleClassName ?? ''}`}>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Render both views and toggle visibility — keeps SSR clean and
          avoids unmount/remount flicker when the user switches. Once
          hydrated we collapse the inactive one with `hidden`. */}
      <div className={hydrated && view !== 'list' ? 'hidden' : ''}>
        {listChildren}
      </div>
      <div className={hydrated && view !== 'calendar' ? 'hidden' : ''}>
        {hydrated ? (
          <CalendarView
            locale={locale}
            closures={closures}
            kids={kids}
            schoolNameFallback={schoolNameFallback}
            initialToday={initialToday}
          />
        ) : null}
      </div>
    </div>
  );
}
