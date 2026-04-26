'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  groupClosuresByYear,
  spansYearBoundary,
  type ClosureForGrouping,
} from '@/lib/schools/group-closures-by-year';
import { publicClosureHref, focusRing } from '@/lib/links';

// Renders a school's closure list with two pieces of clarity the brief
// asked for after Mom's 2026-04-26 test:
//
//   1. Year clarity. The first row of each calendar year inlines its
//      year ("Tue, Aug 18, 2026"). When the list crosses Dec → Jan a
//      soft horizontal divider with the new year sits between rows.
//      Multi-day breaks that span a boundary (Christmas Break) get
//      both years inlined in their date label so a parent doesn't have
//      to mentally infer the second year.
//
//   2. Past closures collapse. End_date < today rows fold behind a
//      "Show past breaks" toggle. If there are no past rows, the toggle
//      doesn't render. If everything is past, a "year ended" message
//      replaces the list.
//
// Today is computed server-side and threaded in so the helper stays pure
// and the component stays testable.

export type SchoolCalendarListClosure = ClosureForGrouping & {
  id: string;
  name: string;
  emoji: string;
  status: string;
  category?: string | null;
};

export function SchoolCalendarList({
  locale,
  closures,
  today,
  schoolName,
  schoolYearLabel,
  variant = 'verified',
}: {
  locale: string;
  closures: SchoolCalendarListClosure[];
  today: string;
  schoolName: string;
  // Used in the "year ended" message when every closure is past, e.g.
  // "2025–2026" — same value as the page eyebrow's yearsLabel.
  schoolYearLabel: string;
  // 'verified' uses the white-card style; 'unofficial' uses the
  // cream-card style (matches the existing "Confirmed dates" section
  // for unverified schools that have at least one extracted date).
  variant?: 'verified' | 'unofficial';
}) {
  const t = useTranslations('public.school');
  const tCal = useTranslations('public.school.calendarList');
  const [showPast, setShowPast] = useState(false);

  const { past, byYear } = groupClosuresByYear(closures, today);
  const upcomingCount = Array.from(byYear.values()).reduce(
    (n, arr) => n + arr.length,
    0,
  );

  // Edge case: every closure is past. The school year is over for this
  // page; nudge the parent to come back later instead of showing nothing.
  if (closures.length > 0 && upcomingCount === 0) {
    return (
      <p
        data-testid="school-calendar-year-ended"
        className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-muted"
      >
        {tCal('yearEnded', {
          years: schoolYearLabel || 'current',
          schoolName,
        })}
      </p>
    );
  }

  const cardCls =
    variant === 'verified'
      ? 'border-cream-border bg-white'
      : 'border-cream-border bg-cream';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p data-testid="upcoming-count" className="font-bold">
          ✓ {tCal('upcomingCount', { count: upcomingCount })}
          {past.length > 0 ? (
            <>
              {' '}
              <span className="font-normal text-muted">
                ({tCal('pastCount', { count: past.length })})
              </span>
            </>
          ) : null}
        </p>
        {past.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
            aria-controls="school-calendar-past"
            className="font-bold text-brand-purple hover:underline"
          >
            {showPast ? tCal('hidePast') : tCal('showPast')}
          </button>
        ) : null}
      </div>

      {showPast && past.length > 0 ? (
        <ul id="school-calendar-past" className="space-y-2 opacity-80">
          {past.map((c) => (
            <li key={c.id}>
              <ClosureRow
                closure={c}
                locale={locale}
                cardCls={cardCls + ' border-dashed'}
                showYearBecauseFirstInGroup={false}
                pastPill={tCal('pastPill')}
                statusLabel={
                  c.status === 'verified' ? t('verified') : t('pending')
                }
                muted
              />
            </li>
          ))}
        </ul>
      ) : null}

      {Array.from(byYear.entries()).map(([year, rows], yearIdx) => (
        <div key={year} className="space-y-2">
          {yearIdx > 0 ? (
            <div
              role="separator"
              aria-label={tCal('yearDivider', { year })}
              className="flex items-center gap-3 py-1 text-xs font-bold text-muted"
            >
              <span aria-hidden className="h-px flex-1 border-t border-dashed border-cream-border" />
              <span className="rounded-full border border-cream-border bg-white px-3 py-0.5 tabular-nums">
                {tCal('yearDivider', { year })}
              </span>
              <span aria-hidden className="h-px flex-1 border-t border-dashed border-cream-border" />
            </div>
          ) : null}
          <ul className="space-y-2">
            {rows.map((c, rowIdx) => (
              <li key={c.id}>
                <ClosureRow
                  closure={c}
                  locale={locale}
                  cardCls={cardCls}
                  // Inline the year on the first row of each year group so
                  // the very first list item also reads unambiguously.
                  showYearBecauseFirstInGroup={rowIdx === 0}
                  pastPill={null}
                  statusLabel={
                    c.status === 'verified' ? t('verified') : t('pending')
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ClosureRow({
  closure,
  locale,
  cardCls,
  showYearBecauseFirstInGroup,
  pastPill,
  statusLabel,
  muted = false,
}: {
  closure: SchoolCalendarListClosure;
  locale: string;
  cardCls: string;
  showYearBecauseFirstInGroup: boolean;
  pastPill: string | null;
  statusLabel: string;
  muted?: boolean;
}) {
  const dateLabel = formatRangeWithYearWhenNeeded({
    start: closure.start_date,
    end: closure.end_date,
    locale,
    inlineFirstYear: showYearBecauseFirstInGroup,
  });
  const titleCls = muted
    ? 'text-sm font-black text-muted'
    : 'text-sm font-black text-ink';
  return (
    <Link
      href={publicClosureHref(locale, closure.id)}
      aria-label={`Open ${closure.name} on ${dateLabel}`}
      className={
        'group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-[border-color,box-shadow] duration-[var(--duration-micro)] ease-[var(--ease-premium)] hover:border-brand-purple/40 hover:shadow-sm ' +
        cardCls +
        ' ' +
        focusRing
      }
    >
      <div>
        <p className={titleCls}>
          {closure.emoji} {closure.name}
          {pastPill ? (
            <span className="ml-2 rounded-full bg-cream-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              {pastPill}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted">{dateLabel}</p>
      </div>
      <span className="flex items-center gap-2">
        <span
          className={
            'rounded-full px-2 py-0.5 text-[11px] font-bold ' +
            (closure.status === 'verified'
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-amber-100 text-amber-900')
          }
        >
          {statusLabel}
        </span>
        <span
          aria-hidden
          className="text-muted transition-transform duration-[var(--duration-micro)] ease-[var(--ease-premium)] group-hover:translate-x-0.5 group-hover:text-brand-purple"
        >
          →
        </span>
      </span>
    </Link>
  );
}

function formatRangeWithYearWhenNeeded({
  start,
  end,
  locale,
  inlineFirstYear,
}: {
  start: string;
  end: string;
  locale: string;
  inlineFirstYear: boolean;
}): string {
  const intl = locale === 'es' ? 'es-US' : 'en-US';
  const dShort = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(intl, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  const dWithYear = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(intl, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  const spans = startYear !== endYear;

  if (start === end) {
    return inlineFirstYear ? dWithYear(start) : dShort(start);
  }

  if (spans) {
    // Both years explicitly visible — Mom shouldn't have to infer that
    // "Fri, Jan 1" is in the next year when the start was "Mon, Dec 21".
    return `${dWithYear(start)} — ${dWithYear(end)}`;
  }

  // Same-year multi-day range. If this is the first row of its year
  // group, anchor the year on the start date; otherwise short form.
  return inlineFirstYear
    ? `${dWithYear(start)} — ${dShort(end)}`
    : `${dShort(start)} — ${dShort(end)}`;
}

// Re-exported for tests that want to call the formatter directly.
export const _testing = { formatRangeWithYearWhenNeeded, spansYearBoundary };
