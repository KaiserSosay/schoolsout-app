import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/test',
}));

import {
  SchoolCalendarList,
  type SchoolCalendarListClosure,
} from '@/components/schools/SchoolCalendarList';

const TGP_LIKE: SchoolCalendarListClosure[] = [
  // 5 past breaks (relative to today=2026-04-26)
  { id: 'p1', name: 'Labor Day',         start_date: '2025-09-01', end_date: '2025-09-01', emoji: '🇺🇸', status: 'verified' },
  { id: 'p2', name: 'Veterans Day',      start_date: '2025-11-11', end_date: '2025-11-11', emoji: '🇺🇸', status: 'verified' },
  { id: 'p3', name: 'Thanksgiving',      start_date: '2025-11-24', end_date: '2025-11-28', emoji: '🦃', status: 'verified' },
  { id: 'p4', name: 'Christmas Break',   start_date: '2025-12-22', end_date: '2026-01-02', emoji: '🎄', status: 'verified' },
  { id: 'p5', name: 'MLK Day',           start_date: '2026-01-19', end_date: '2026-01-19', emoji: '✊🏿', status: 'verified' },
  // 12 upcoming
  { id: 'u1',  name: 'Spring Break',      start_date: '2026-03-23', end_date: '2026-03-27', emoji: '🌸', status: 'verified' },
  { id: 'u2',  name: 'Last Day',          start_date: '2026-05-29', end_date: '2026-05-29', emoji: '🎓', status: 'verified' },
  { id: 'u3',  name: 'First Day',         start_date: '2026-08-18', end_date: '2026-08-18', emoji: '🍎', status: 'verified' },
  { id: 'u4',  name: 'Labor Day',         start_date: '2026-09-07', end_date: '2026-09-07', emoji: '🇺🇸', status: 'verified' },
  { id: 'u5',  name: 'Veterans Day',      start_date: '2026-11-11', end_date: '2026-11-11', emoji: '🇺🇸', status: 'verified' },
  { id: 'u6',  name: 'Thanksgiving',      start_date: '2026-11-23', end_date: '2026-11-27', emoji: '🦃', status: 'verified' },
  { id: 'u7',  name: 'Christmas Break',   start_date: '2026-12-21', end_date: '2027-01-01', emoji: '🎄', status: 'verified' },
  { id: 'u8',  name: 'Teacher Work Day',  start_date: '2027-01-04', end_date: '2027-01-04', emoji: '📋', status: 'verified' },
  { id: 'u9',  name: 'MLK Day',           start_date: '2027-01-18', end_date: '2027-01-18', emoji: '✊🏿', status: 'verified' },
  { id: 'u10', name: 'Presidents Day',    start_date: '2027-02-15', end_date: '2027-02-15', emoji: '🎩', status: 'verified' },
  { id: 'u11', name: 'Spring Break 2027', start_date: '2027-03-22', end_date: '2027-03-26', emoji: '🌸', status: 'verified' },
  { id: 'u12', name: 'Easter Monday',     start_date: '2027-03-29', end_date: '2027-03-29', emoji: '🐰', status: 'verified' },
];

function renderList(
  closures = TGP_LIKE,
  today = '2026-04-26',
  schoolYearLabel = '2025–2026 · 2026–2027',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolCalendarList
        locale="en"
        closures={closures}
        today={today}
        schoolName="The Growing Place"
        schoolYearLabel={schoolYearLabel}
      />
    </NextIntlClientProvider>,
  );
}

describe('SchoolCalendarList — past-breaks collapse', () => {
  it('hides past breaks by default and shows the "Show past breaks" toggle', () => {
    renderList();
    // Past closures are NOT in the document yet; only the upcoming title-words are.
    // (6 past = 5 fixture rows tagged "past" + Spring Break 2026 which ends
    // 2026-03-27, before today 2026-04-26.)
    expect(screen.getByTestId('upcoming-count')).toHaveTextContent(
      /Showing 11 upcoming breaks/i,
    );
    expect(screen.getByText(/6 past breaks hidden/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show past breaks/i }),
    ).toBeInTheDocument();
  });

  it('clicking "Show past breaks" reveals them above upcoming + flips button label', () => {
    renderList();
    const toggle = screen.getByRole('button', { name: /show past breaks/i });
    fireEvent.click(toggle);
    expect(
      screen.getByRole('button', { name: /hide past breaks/i }),
    ).toBeInTheDocument();
    // Past list is keyed via the expanded id="school-calendar-past"
    const pastList = document.getElementById('school-calendar-past');
    expect(pastList).toBeTruthy();
    // At least one of the past row names must be visible now.
    expect(
      screen.getAllByText(/MLK Day/i).length,
    ).toBeGreaterThan(0);
  });

  it('aria-expanded reflects the open/closed state', () => {
    renderList();
    const toggle = screen.getByRole('button', { name: /show past breaks/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('does NOT render the toggle when there are no past closures', () => {
    const upcomingOnly = TGP_LIKE.filter((c) => c.start_date >= '2026-04-26');
    renderList(upcomingOnly);
    expect(
      screen.queryByRole('button', { name: /show past breaks/i }),
    ).toBeNull();
    expect(screen.queryByText(/past breaks hidden/i)).toBeNull();
  });

  it('renders the year-ended message when EVERY closure is past', () => {
    const allPast = TGP_LIKE.filter((c) => c.end_date < '2026-04-26');
    renderList(allPast, '2026-04-26', '2025–2026');
    expect(screen.getByTestId('school-calendar-year-ended')).toHaveTextContent(
      /2025–2026 school year has ended/i,
    );
  });
});
