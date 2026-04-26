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
  schoolYearLabel,
  variant = 'verified',
}: {
  locale: string;
  closures: SchoolCalendarSectionsClosure[];
  today: string;
  schoolName: string;
  schoolSlug: string;
  schoolYearLabel: string;
  variant?: 'verified' | 'unofficial';
}) {
  const tCov = useTranslations('public.school.yearCoverage');

  const todayDate = new Date(today + 'T12:00:00Z');
  const [currentCov, nextCov] = computeYearCoverage(closures, todayDate);

  // Group closures by school_year. Closures missing school_year fall
  // through to a synthetic 'unknown' bucket that renders LAST and only
  // when present — covers any imported rows that predate migrations
  // setting school_year explicitly.
  const buckets = new Map<string, SchoolCalendarSectionsClosure[]>();
  for (const c of closures) {
    const key = c.school_year && /^\d{4}-\d{4}$/.test(c.school_year)
      ? c.school_year
      : '__unknown__';
    const arr = buckets.get(key) ?? [];
    arr.push(c);
    buckets.set(key, arr);
  }

  // Render order: current year first, then next, then any other years
  // present (older imports), then unknown bucket if any.
  const orderedKeys: string[] = [];
  for (const k of [currentCov.year, nextCov.year]) {
    if (buckets.has(k)) orderedKeys.push(k);
  }
  for (const k of Array.from(buckets.keys()).sort()) {
    if (k === '__unknown__') continue;
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }
  if (buckets.has('__unknown__')) orderedKeys.push('__unknown__');

  function headerFor(year: string): string {
    if (year === '__unknown__') return year;
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
              schoolYearLabel={year === '__unknown__' ? schoolYearLabel : year}
              variant={variant}
            />
          </section>
        );
      })}
    </div>
  );
}
