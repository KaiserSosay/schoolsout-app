import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/the-growing-place',
}));

import {
  SchoolCalendarSections,
  type SchoolCalendarSectionsClosure,
} from '@/components/schools/SchoolCalendarSections';

// TGP shape as of 2026-04-26 (Mom's case): 17 verified closures all
// stamped school_year='2026-2027'. The current school year (2025-2026)
// has zero rows. The page MUST surface that gap honestly.
const TGP_2026_27: SchoolCalendarSectionsClosure[] = [
  { id: '1',  name: 'First Day of School',           start_date: '2026-08-18', end_date: '2026-08-18', emoji: '🍎', status: 'verified', school_year: '2026-2027' },
  { id: '2',  name: 'School Closed for Labor Day',   start_date: '2026-09-07', end_date: '2026-09-07', emoji: '🇺🇸', status: 'verified', school_year: '2026-2027' },
  { id: '3',  name: 'Professional Development',      start_date: '2026-10-09', end_date: '2026-10-09', emoji: '📋', status: 'verified', school_year: '2026-2027' },
  { id: '4',  name: 'School Closed for Veterans Day',start_date: '2026-11-11', end_date: '2026-11-11', emoji: '🇺🇸', status: 'verified', school_year: '2026-2027' },
  { id: '5',  name: 'Thanksgiving Break',            start_date: '2026-11-23', end_date: '2026-11-27', emoji: '🦃', status: 'verified', school_year: '2026-2027' },
  { id: '6',  name: 'Christmas Break',               start_date: '2026-12-21', end_date: '2027-01-01', emoji: '🎄', status: 'verified', school_year: '2026-2027' },
  { id: '7',  name: 'Teacher Work Day',              start_date: '2027-01-04', end_date: '2027-01-04', emoji: '📋', status: 'verified', school_year: '2026-2027' },
  { id: '8',  name: 'School Closed for MLK Day',     start_date: '2027-01-18', end_date: '2027-01-18', emoji: '✊🏿', status: 'verified', school_year: '2026-2027' },
  { id: '9',  name: 'Professional Development (Feb)',start_date: '2027-02-12', end_date: '2027-02-12', emoji: '📋', status: 'verified', school_year: '2026-2027' },
  { id: '10', name: 'School Closed for Presidents Day', start_date: '2027-02-15', end_date: '2027-02-15', emoji: '🎩', status: 'verified', school_year: '2026-2027' },
  { id: '11', name: 'Spring Break',                  start_date: '2027-03-22', end_date: '2027-03-26', emoji: '🌸', status: 'verified', school_year: '2026-2027' },
  { id: '12', name: 'School Closed for Easter Monday', start_date: '2027-03-29', end_date: '2027-03-29', emoji: '🐰', status: 'verified', school_year: '2026-2027' },
  { id: '13', name: 'Last Day of School',            start_date: '2027-05-27', end_date: '2027-05-27', emoji: '🎓', status: 'verified', school_year: '2026-2027' },
];

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolCalendarSections
        locale="en"
        closures={TGP_2026_27}
        today="2026-04-26"
        schoolName="The Growing Place"
        schoolSlug="the-growing-place"
        schoolYearLabel="2026–2027"
      />
    </NextIntlClientProvider>,
  );
}

describe('Mom\'s TGP case — only 2026-2027 closures, current year missing', () => {
  it('renders the current-missing coverage banner with the email-PDF CTA', () => {
    wrap();
    expect(
      screen.getByTestId('coverage-banner-current-missing'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /email us your school's pdf/i }),
    ).toBeInTheDocument();
  });

  it('renders ONE school-year section labeled "2026-2027 (next school year)"', () => {
    wrap();
    expect(
      screen.getByTestId('school-year-section-2026-2027'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('school-year-section-2025-2026'),
    ).toBeNull();
    expect(screen.getByText(/2026-2027 \(next school year\)/i)).toBeInTheDocument();
  });

  it('NEVER shows a date that the system isn\'t 100% sure about (no fabricated 2025-2026 entries)', () => {
    wrap();
    // No 2025-2026 dates should be invented — the banner explains the gap
    // instead. The closure list itself should only contain 2026-27 rows.
    const yearBlock = screen.getByTestId('school-year-section-2026-2027');
    expect(yearBlock.textContent).toContain('First Day of School');
    expect(yearBlock.textContent).toContain('Last Day of School');
  });
});
