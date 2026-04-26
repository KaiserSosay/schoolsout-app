import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/miami-dade-county-public-schools',
}));

import {
  SchoolCalendarSections,
  type SchoolCalendarSectionsClosure,
} from '@/components/schools/SchoolCalendarSections';

// M-DCPS fixture (representing both-year-verified). Real prod has 13 +
// 8 closures across 2025-2026 and 2026-2027; the test fixture mirrors the
// shape with enough rows in each year to clear the "verified" threshold
// (>=5).
const MDCPS_BOTH: SchoolCalendarSectionsClosure[] = [
  // 6 closures in 2025-2026 (the active year as of 2026-04-26)
  { id: 'a1', name: 'MLK Day',             start_date: '2026-01-19', end_date: '2026-01-19', emoji: '✊🏿', status: 'verified', school_year: '2025-2026' },
  { id: 'a2', name: 'Presidents Day',      start_date: '2026-02-16', end_date: '2026-02-16', emoji: '🎩', status: 'verified', school_year: '2025-2026' },
  { id: 'a3', name: 'Spring Break',        start_date: '2026-03-23', end_date: '2026-03-27', emoji: '🌸', status: 'verified', school_year: '2025-2026' },
  { id: 'a4', name: 'Good Friday',         start_date: '2026-04-03', end_date: '2026-04-03', emoji: '✝️', status: 'verified', school_year: '2025-2026' },
  { id: 'a5', name: 'Memorial Day',        start_date: '2026-05-25', end_date: '2026-05-25', emoji: '🇺🇸', status: 'verified', school_year: '2025-2026' },
  { id: 'a6', name: 'Last Day of School',  start_date: '2026-05-29', end_date: '2026-05-29', emoji: '🎓', status: 'verified', school_year: '2025-2026' },
  // 6 closures in 2026-2027
  { id: 'b1', name: 'First Day of School', start_date: '2026-08-17', end_date: '2026-08-17', emoji: '🍎', status: 'verified', school_year: '2026-2027' },
  { id: 'b2', name: 'Labor Day',           start_date: '2026-09-07', end_date: '2026-09-07', emoji: '🇺🇸', status: 'verified', school_year: '2026-2027' },
  { id: 'b3', name: 'Thanksgiving Break',  start_date: '2026-11-25', end_date: '2026-11-27', emoji: '🦃', status: 'verified', school_year: '2026-2027' },
  { id: 'b4', name: 'Winter Break',        start_date: '2026-12-21', end_date: '2027-01-02', emoji: '🎄', status: 'verified', school_year: '2026-2027' },
  { id: 'b5', name: 'MLK Day',             start_date: '2027-01-18', end_date: '2027-01-18', emoji: '✊🏿', status: 'verified', school_year: '2026-2027' },
  { id: 'b6', name: 'Spring Break',        start_date: '2027-03-22', end_date: '2027-03-26', emoji: '🌸', status: 'verified', school_year: '2026-2027' },
];

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolCalendarSections
        locale="en"
        closures={MDCPS_BOTH}
        today="2026-04-26"
        schoolName="Miami-Dade County Public Schools"
        schoolSlug="miami-dade-county-public-schools"
        schoolYearLabel="2025–2026 · 2026–2027"
      />
    </NextIntlClientProvider>,
  );
}

describe('M-DCPS case — both years verified', () => {
  it('renders the both-verified success banner', () => {
    wrap();
    expect(screen.getByTestId('coverage-banner-both-verified')).toHaveTextContent(
      /Both school years verified/i,
    );
  });

  it('does NOT render the email-PDF CTA when nothing is missing', () => {
    wrap();
    expect(
      screen.queryByRole('button', { name: /email us your school's pdf/i }),
    ).toBeNull();
  });

  it('renders both school-year sections in current → next order', () => {
    const { container } = wrap();
    expect(
      screen.getByTestId('school-year-section-2025-2026'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('school-year-section-2026-2027'),
    ).toBeInTheDocument();
    // The first section in DOM order should be the current year (2025-2026).
    const sections = container.querySelectorAll(
      '[data-testid^="school-year-section-"]',
    );
    expect(sections[0].getAttribute('data-testid')).toBe(
      'school-year-section-2025-2026',
    );
    expect(sections[1].getAttribute('data-testid')).toBe(
      'school-year-section-2026-2027',
    );
  });

  it('labels the sections "(current)" and "(next)" so a parent always knows which year', () => {
    wrap();
    expect(
      screen.getByText(/2025-2026 \(current school year\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2026-2027 \(next school year\)/i),
    ).toBeInTheDocument();
  });
});
