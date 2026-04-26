import { render, screen } from '@testing-library/react';
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

const TGP_2026_27: SchoolCalendarListClosure[] = [
  { id: 'a', name: 'First Day of School',  start_date: '2026-08-18', end_date: '2026-08-18', emoji: '🍎', status: 'verified' },
  { id: 'b', name: 'Labor Day',            start_date: '2026-09-07', end_date: '2026-09-07', emoji: '🇺🇸', status: 'verified' },
  { id: 'c', name: 'Christmas Break',      start_date: '2026-12-21', end_date: '2027-01-01', emoji: '🎄', status: 'verified' },
  { id: 'd', name: 'Teacher Work Day',     start_date: '2027-01-04', end_date: '2027-01-04', emoji: '📋', status: 'verified' },
  { id: 'e', name: 'MLK Day',              start_date: '2027-01-18', end_date: '2027-01-18', emoji: '✊🏿', status: 'verified' },
  { id: 'f', name: 'Last Day of School',   start_date: '2027-05-27', end_date: '2027-05-27', emoji: '🎓', status: 'verified' },
];

function wrap(closures: SchoolCalendarListClosure[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolCalendarList
        locale="en"
        closures={closures}
        today="2026-04-26"
        schoolName="The Growing Place"
        schoolYearLabel="2026–2027"
      />
    </NextIntlClientProvider>,
  );
}

describe('SchoolCalendarList — year clarity', () => {
  it('renders a year-divider separator with role="separator" between calendar years', () => {
    wrap(TGP_2026_27);
    const separators = screen.getAllByRole('separator');
    // 2026 → 2027 boundary = one divider. (No divider before the first year.)
    expect(separators.length).toBe(1);
    expect(separators[0].getAttribute('aria-label')).toBe('2027');
  });

  it('shows the year inline on the FIRST row of each year group ("Tue, Aug 18, 2026" + "Mon, Jan 4, 2027")', () => {
    wrap(TGP_2026_27);
    // First row of 2026 group: First Day of School on Aug 18, 2026
    const firstRow = screen.getByLabelText(/Open First Day of School on/i);
    expect(firstRow.getAttribute('aria-label')).toMatch(/Aug 18, 2026/);
    // First row of 2027 group: Teacher Work Day on Jan 4, 2027
    const firstOf2027 = screen.getByLabelText(/Open Teacher Work Day on/i);
    expect(firstOf2027.getAttribute('aria-label')).toMatch(/Jan 4, 2027/);
  });

  it('does NOT inline year on subsequent rows within the same year group', () => {
    wrap(TGP_2026_27);
    // Labor Day is the 2nd row in 2026 — should be short form (no year)
    const laborDay = screen.getByLabelText(/Open Labor Day on/i);
    expect(laborDay.getAttribute('aria-label')).not.toMatch(/2026/);
  });

  it('renders Christmas Break (year-boundary spanner) with BOTH years visible', () => {
    wrap(TGP_2026_27);
    const christmas = screen.getByLabelText(/Open Christmas Break on/i);
    const label = christmas.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/Dec 21, 2026/);
    expect(label).toMatch(/Jan 1, 2027/);
  });

  it('does NOT render any divider when all closures are in one year', () => {
    const oneYear = TGP_2026_27.filter((c) => c.start_date.startsWith('2026'));
    wrap(oneYear);
    expect(screen.queryAllByRole('separator')).toEqual([]);
  });
});
