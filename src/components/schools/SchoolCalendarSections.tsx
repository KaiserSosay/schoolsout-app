'use client';

import { useTranslations } from 'next-intl';
import { computeYearCoverage } from '@/lib/schools/year-coverage';
import { CoverageBanner } from './CoverageBanner';
import {
  SchoolCalendarList,
  type SchoolCalendarListClosure,
} from './SchoolCalendarList';

// Wrapper rendered above the previous SchoolCalendarList. Three layers:
//
//   1. A CoverageBanner that says, in plain English, what years we have
//      verified data for and what's missing. (Mom's TGP test 2026-04-26.)
//   2. One section per school_year present in the data, headed by
//      "{year} (current school year)" or "(next school year)" so a parent
//      always knows which year they're scrolling.
//   3. The existing SchoolCalendarList for each section — that's what
//      keeps the past-breaks toggle + calendar-year dividers we shipped
//      in 03f3e56.

export type SchoolCalendarSectionsClosure = SchoolCalendarListClosure & {
  school_year?: string | null;
};

export function SchoolCalendarSections({
  locale,
  closures,
  today,
  schoolName,
  schoolSlug,
  // schoolYearLabel was passed by callers for the old __unknown__ fallback.
  // After Fix 5 (2026-04-26 evening) we filter malformed school_year rows
  // entirely and label each section with its own year, so the prop is
  // legacy-only — accepted for back-compat with the page but unused.
  variant = 'verified',
}: {
  locale: string;
  closures: SchoolCalendarSectionsClosure[];
  today: string;
  schoolName: string;
  schoolSlug: string;
  schoolYearLabel?: string;
  variant?: 'verified' | 'unofficial';
}) {
  const tCov = useTranslations('public.school.yearCoverage');

  const todayDate = new Date(today + 'T12:00:00Z');
  const [currentCov, nextCov] = computeYearCoverage(closures, todayDate);

  // Group closures by school_year. Rows whose school_year is null or
  // doesn't match YYYY-YYYY are SKIPPED — they used to fall into a
  // synthetic '__unknown__' bucket that surfaced as gibberish on the
  // page (Palmer Trinity 2026-04-26 incident). The 2026-04-26 ical-
  // hardening pass set school_year on every iCal row + cleaned up the
  // existing NULLs in migration 040, so the skip path should be empty
  // in healthy data. Defensive logging so future drift is visible.
  const validYearPattern = /^\d{4}-\d{4}$/;
  const buckets = new Map<string, SchoolCalendarSectionsClosure[]>();
  let skippedMalformed = 0;
  for (const c of closures) {
    if (!c.school_year || !validYearPattern.test(c.school_year)) {
      skippedMalformed += 1;
      continue;
    }
    const arr = buckets.get(c.school_year) ?? [];
    arr.push(c);
    buckets.set(c.school_year, arr);
  }
  if (skippedMalformed > 0 && typeof console !== 'undefined') {
    console.warn(
      `[SchoolCalendarSections] Skipped ${skippedMalformed} closures with malformed school_year (school: ${schoolSlug})`,
    );
  }

  // Render order: current year first, then next, then any other years
  // present (older imports).
  const orderedKeys: string[] = [];
  for (const k of [currentCov.year, nextCov.year]) {
    if (buckets.has(k)) orderedKeys.push(k);
  }
  for (const k of Array.from(buckets.keys()).sort()) {
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }

  function headerFor(year: string): string {
    if (year === currentCov.year) {
      return tCov('yearSectionCurrent', { year });
    }
    if (year === nextCov.year) {
      return tCov('yearSectionNext', { year });
    }
    return year;
  }

  return (
    <div className="space-y-6">
      <CoverageBanner
        locale={locale}
        current={currentCov}
        next={nextCov}
        schoolName={schoolName}
        schoolSlug={schoolSlug}
      />

      {orderedKeys.map((year) => {
        const rows = buckets.get(year) ?? [];
        if (rows.length === 0) return null;
        return (
          <section
            key={year}
            data-testid={`school-year-section-${year}`}
            className="space-y-3"
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-muted">
              {headerFor(year)}
            </h3>
            <SchoolCalendarList
              locale={locale}
              closures={rows}
              today={today}
              schoolName={schoolName}
              schoolYearLabel={year}
              variant={variant}
            />
          </section>
        );
      })}
    </div>
  );
}
