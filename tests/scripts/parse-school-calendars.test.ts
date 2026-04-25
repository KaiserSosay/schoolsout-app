// Tests for scripts/parse-school-calendars.ts.
//
// Covers the pure helpers: closure-keyword filtering, ICS parsing,
// inline-date detection (Gulliver 26-27 "Important Dates" table format),
// label cleanup, and category inference. The integration end (parsePdf via
// pdftotext, sidecar resolution, migration emission) is exercised by
// running the script directly against docs/plans/calendar-pdfs/ — this file
// only locks the parsing primitives.

import { describe, it, expect } from 'vitest';
import {
  categorize,
  looksLikeClosure,
  parseIcsString,
  parseInlineDates,
  stripTrailingNumbers,
} from '../../scripts/parse-school-calendars';

describe('looksLikeClosure', () => {
  it('matches obvious closures', () => {
    expect(looksLikeClosure('No School: Labor Day')).toBe(true);
    expect(looksLikeClosure('Thanksgiving Break')).toBe(true);
    expect(looksLikeClosure('Yom Kippur Holiday')).toBe(true);
    expect(looksLikeClosure('First Day of School')).toBe(true);
  });
  it('rejects non-closure school events', () => {
    expect(looksLikeClosure('Holiday Concert')).toBe(false); // 'concert' negative
    expect(looksLikeClosure('Spring Musical Production')).toBe(false);
    expect(looksLikeClosure('Open House')).toBe(false);
    expect(looksLikeClosure('Soccer Game')).toBe(false);
  });
  it('rejects bare unrelated strings', () => {
    expect(looksLikeClosure('Spirit Week')).toBe(false);
    expect(looksLikeClosure('PTA Meeting')).toBe(false);
  });
});

describe('categorize', () => {
  it('tags federal holidays', () => {
    expect(categorize('Memorial Day').category).toBe('federal_holiday');
    expect(categorize('No School: Labor Day').category).toBe(
      'federal_holiday',
    );
    expect(categorize('Martin Luther King Jr. Day').category).toBe(
      'federal_holiday',
    );
  });
  it('tags Jewish holidays as religious_holiday', () => {
    expect(categorize('Yom Kippur').category).toBe('religious_holiday');
    expect(categorize('Passover Break').category).toBe('religious_holiday');
    expect(categorize('Simchat Torah').category).toBe('religious_holiday');
  });
  it('flags early dismissal correctly', () => {
    expect(categorize('Early Dismissal: 11:30 a.m.').isEarlyRelease).toBe(
      true,
    );
    expect(
      categorize('Early Dismissal: 11:30 a.m.').closedForStudents,
    ).toBe(false);
    expect(categorize('1 PM Dismissal').isEarlyRelease).toBe(true);
  });
  it('treats full closures as closed_for_students', () => {
    expect(categorize('No School: Labor Day').closedForStudents).toBe(true);
    expect(categorize('Winter Break').closedForStudents).toBe(true);
  });
});

describe('parseIcsString', () => {
  const SAMPLE = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'UID:abc',
    'DTSTART;VALUE=DATE:20251124',
    'DTEND;VALUE=DATE:20251129',
    'SUMMARY:Thanksgiving Break',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:def',
    'DTSTART;VALUE=DATE:20260119',
    'DTEND;VALUE=DATE:20260120',
    'SUMMARY:Martin Luther King Jr. Day - No School',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:ghi',
    'DTSTART;VALUE=DATE:20260201',
    'DTEND;VALUE=DATE:20260202',
    'SUMMARY:Open House',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  it('extracts closure VEVENTs only', () => {
    const { closures } = parseIcsString(SAMPLE);
    expect(closures.map((c) => c.name)).toEqual([
      'Thanksgiving Break',
      'Martin Luther King Jr. Day - No School',
    ]);
  });

  it('subtracts one day from DTEND (ICS exclusive end → inclusive)', () => {
    const { closures } = parseIcsString(SAMPLE);
    const tg = closures.find((c) => c.name.includes('Thanksgiving'))!;
    expect(tg.start_date).toBe('2025-11-24');
    expect(tg.end_date).toBe('2025-11-28'); // Nov 24-28, not 24-29
  });

  it('handles single-day events without collapsing to a negative range', () => {
    const { closures } = parseIcsString(SAMPLE);
    const mlk = closures.find((c) => c.name.includes('Martin'))!;
    expect(mlk.start_date).toBe('2026-01-19');
    expect(mlk.end_date).toBe('2026-01-19');
  });
});

describe('parseInlineDates', () => {
  it('matches "Month Day, Year"', () => {
    const r = parseInlineDates(
      'Labor Day-No School        September 7, 2026',
      '2026-2027',
    );
    expect(r).toHaveLength(1);
    expect(r[0].start).toBe('2026-09-07');
    expect(r[0].end).toBe('2026-09-07');
  });

  it('matches a "Month Day-Day, Year" range', () => {
    const r = parseInlineDates(
      'Spring Break-School Closed     March 22-26, 2027',
      '2026-2027',
    );
    expect(r).toHaveLength(1);
    expect(r[0].start).toBe('2027-03-22');
    expect(r[0].end).toBe('2027-03-26');
  });

  it('matches a cross-month "Month Day, Year-Month Day, Year" range', () => {
    const r = parseInlineDates(
      'Winter Break- School Closed   Dec 21, 2026-Jan 1, 2027',
      '2026-2027',
    );
    expect(r).toHaveLength(1);
    expect(r[0].start).toBe('2026-12-21');
    expect(r[0].end).toBe('2027-01-01');
  });

  it('returns multiple matches for two-column rows (positional indices)', () => {
    // Two side-by-side "Important Dates" tables on the same pdftotext line.
    const r = parseInlineDates(
      'Labor Day-No School    September 7, 2026     End of Q2     January 13, 2027',
      '2026-2027',
    );
    expect(r).toHaveLength(2);
    expect(r[0].start).toBe('2026-09-07');
    expect(r[1].start).toBe('2027-01-13');
    // Indices ordered left → right
    expect(r[0].index).toBeLessThan(r[1].index);
  });
});

describe('stripTrailingNumbers', () => {
  it('strips contaminated trailing day-number sequences', () => {
    expect(
      stripTrailingNumbers('First Day of School 11 12 13 14 15 16 17'),
    ).toBe('First Day of School');
  });
  it('strips leading day-number prefixes', () => {
    expect(
      stripTrailingNumbers('11 12 13 14 First Day of School'),
    ).toBe('First Day of School');
  });
  it('keeps single in-name numbers untouched', () => {
    // "Class of 2026" / "Trimester 2" / "Gr 10-11" should NOT get stripped.
    expect(stripTrailingNumbers('Class of 2026 Graduation')).toBe(
      'Class of 2026 Graduation',
    );
  });
  it("falls back to original when stripping leaves nothing", () => {
    expect(stripTrailingNumbers('1 2 3')).toBe('1 2 3');
  });
});
