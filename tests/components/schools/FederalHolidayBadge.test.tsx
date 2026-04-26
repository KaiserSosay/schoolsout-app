import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/i18n/messages/en.json';
import {
  SchoolCalendarList,
  type SchoolCalendarListClosure,
} from '@/components/schools/SchoolCalendarList';
import { SchoolCalendarSections } from '@/components/schools/SchoolCalendarSections';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/the-growing-place',
}));

const TODAY = '2026-04-26';

function row(
  partial: Partial<SchoolCalendarListClosure> & { id: string; name: string },
): SchoolCalendarListClosure {
  return {
    start_date: '2026-05-25',
    end_date: '2026-05-25',
    emoji: '🇺🇸',
    status: 'derived',
    source: 'federal_holiday_calendar',
    school_year: '2025-2026',
    ...partial,
  } as SchoolCalendarListClosure;
}

function wrap(children: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>,
  );
}

describe('SchoolCalendarList — federal-holiday-derived rows', () => {
  it('renders the 📅 Federal holiday pill instead of Verified when source=federal_holiday_calendar', () => {
    wrap(
      <SchoolCalendarList
        locale="en"
        today={TODAY}
        schoolName="The Growing Place"
        schoolYearLabel="2025-2026"
        closures={[row({ id: 'fh-1', name: 'Memorial Day - Federal Holiday' })]}
      />,
    );
    expect(
      screen.getByTestId('closure-pill-federal-holiday'),
    ).toHaveTextContent(/federal holiday/i);
    // The standard Verified pill should NOT be present for this row.
    expect(screen.queryByText(/^Verified$/)).toBeNull();
  });

  it('renders the standard Verified pill for school-confirmed rows', () => {
    wrap(
      <SchoolCalendarList
        locale="en"
        today={TODAY}
        schoolName="The Growing Place"
        schoolYearLabel="2025-2026"
        closures={[
          row({
            id: 'v-1',
            name: 'Spring Break',
            start_date: '2026-04-30',
            end_date: '2026-05-04',
            status: 'verified',
            source: 'official_pdf',
          }),
        ]}
      />,
    );
    expect(screen.queryByTestId('closure-pill-federal-holiday')).toBeNull();
    expect(screen.getByText(/^Verified$/)).toBeInTheDocument();
  });

  it('renders both pill types correctly when a school has mixed sources', () => {
    wrap(
      <SchoolCalendarList
        locale="en"
        today={TODAY}
        schoolName="The Growing Place"
        schoolYearLabel="2025-2026"
        closures={[
          row({
            id: 'v-1',
            name: 'Spring Break',
            start_date: '2026-04-30',
            end_date: '2026-05-04',
            status: 'verified',
            source: 'official_pdf',
          }),
          row({ id: 'fh-1', name: 'Memorial Day - Federal Holiday' }),
        ]}
      />,
    );
    expect(screen.getByTestId('closure-pill-federal-holiday')).toBeInTheDocument();
    expect(screen.getByText(/^Verified$/)).toBeInTheDocument();
  });
});

describe('SchoolCalendarSections — federal-holiday disclosure banner', () => {
  it('renders the disclosure banner when ANY closure has source=federal_holiday_calendar', () => {
    wrap(
      <SchoolCalendarSections
        locale="en"
        today={TODAY}
        schoolName="The Growing Place"
        schoolSlug="the-growing-place"
        closures={[
          row({
            id: 'v-1',
            name: 'Spring Break',
            start_date: '2026-04-30',
            end_date: '2026-05-04',
            status: 'verified',
            source: 'official_pdf',
          }),
          row({ id: 'fh-1', name: 'Memorial Day - Federal Holiday' }),
        ]}
      />,
    );
    expect(screen.getByTestId('federal-holiday-disclosure')).toHaveTextContent(
      /derived from the federal holiday calendar.*The Growing Place/i,
    );
  });

  it('does NOT render the disclosure banner when no closure is federal-holiday-derived', () => {
    wrap(
      <SchoolCalendarSections
        locale="en"
        today={TODAY}
        schoolName="The Growing Place"
        schoolSlug="the-growing-place"
        closures={[
          row({
            id: 'v-1',
            name: 'Spring Break',
            start_date: '2026-04-30',
            end_date: '2026-05-04',
            status: 'verified',
            source: 'official_pdf',
          }),
        ]}
      />,
    );
    expect(screen.queryByTestId('federal-holiday-disclosure')).toBeNull();
  });
});
