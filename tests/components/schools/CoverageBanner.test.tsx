import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import messages from '@/i18n/messages/en.json';
import { CoverageBanner } from '@/components/schools/CoverageBanner';
import type { YearCoverage } from '@/lib/schools/year-coverage';

function cov(overrides: Partial<YearCoverage>): YearCoverage {
  const closureCount = overrides.closureCount ?? 0;
  const federalHolidayCount = overrides.federalHolidayCount ?? 0;
  return {
    year: '2025-2026',
    status: 'unavailable',
    closureCount,
    schoolConfirmedCount: closureCount - federalHolidayCount,
    federalHolidayCount,
    position: 'current',
    isEnded: false,
    ...overrides,
  };
}

function wrap(current: YearCoverage, next: YearCoverage) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CoverageBanner
        locale="en"
        current={current}
        next={next}
        schoolName="The Growing Place"
        schoolSlug="the-growing-place"
      />
    </NextIntlClientProvider>,
  );
}

describe('CoverageBanner', () => {
  it('renders both-verified variant when both years are verified', () => {
    wrap(
      cov({ year: '2025-2026', status: 'verified', closureCount: 21 }),
      cov({ year: '2026-2027', status: 'verified', closureCount: 17, position: 'next' }),
    );
    expect(screen.getByTestId('coverage-banner-both-verified')).toHaveTextContent(
      /Both school years verified.*2025-2026.*2026-2027/i,
    );
  });

  it('renders current-missing variant for the TGP shape (mom case) with email-PDF CTA', () => {
    wrap(
      cov({ year: '2025-2026', status: 'unavailable', closureCount: 0 }),
      cov({ year: '2026-2027', status: 'verified', closureCount: 17, position: 'next' }),
    );
    expect(
      screen.getByTestId('coverage-banner-current-missing'),
    ).toHaveTextContent(/2026-2027 verified.*2025-2026.*aren't published/i);
    expect(
      screen.getByRole('button', { name: /email us your school's pdf/i }),
    ).toBeInTheDocument();
  });

  it('renders next-missing variant when current is verified but next has nothing', () => {
    wrap(
      cov({ year: '2025-2026', status: 'verified', closureCount: 29 }),
      cov({ year: '2026-2027', status: 'unavailable', closureCount: 0, position: 'next' }),
    );
    expect(
      screen.getByTestId('coverage-banner-next-missing'),
    ).toHaveTextContent(/2025-2026 verified.*2026-2027.*isn't published/i);
  });

  it('renders partial-current variant with a "Tell us" CTA', () => {
    wrap(
      cov({ year: '2025-2026', status: 'partial', closureCount: 3 }),
      cov({ year: '2026-2027', status: 'unavailable', closureCount: 0, position: 'next' }),
    );
    expect(
      screen.getByTestId('coverage-banner-partial-current'),
    ).toHaveTextContent(/3 verified dates.*2025-2026.*may be incomplete/i);
    expect(
      screen.getByRole('button', { name: /tell us/i }),
    ).toBeInTheDocument();
  });

  it('renders current-ended variant in summer (June/July)', () => {
    wrap(
      cov({ year: '2025-2026', status: 'verified', closureCount: 21, isEnded: true }),
      cov({ year: '2026-2027', status: 'verified', closureCount: 17, position: 'next' }),
    );
    expect(
      screen.getByTestId('coverage-banner-current-ended'),
    ).toHaveTextContent(/2025-2026 school year has ended/i);
  });

  it('renders current-federal-holidays variant when current year has only derived holidays + next is verified (TGP post-mig-044)', () => {
    wrap(
      cov({
        year: '2025-2026',
        status: 'partial',
        closureCount: 5,
        schoolConfirmedCount: 0,
        federalHolidayCount: 5,
      }),
      cov({
        year: '2026-2027',
        status: 'verified',
        closureCount: 17,
        schoolConfirmedCount: 17,
        position: 'next',
      }),
    );
    expect(
      screen.getByTestId('coverage-banner-current-federal-holidays'),
    ).toHaveTextContent(
      /2026-2027 verified.*The Growing Place.*federal holidays for 2025-2026/i,
    );
    expect(
      screen.getByRole('button', { name: /email us your school's pdf/i }),
    ).toBeInTheDocument();
  });

  it('does NOT render the federal-holidays variant when current is fully school-confirmed (mixed real + derived rows)', () => {
    // Edge case: school has 21 real + 5 federal holidays. The derived
    // count is non-zero but schoolConfirmedCount > 0, so the picker
    // should fall through to both-verified, not the bridge variant.
    wrap(
      cov({
        year: '2025-2026',
        status: 'verified',
        closureCount: 26,
        schoolConfirmedCount: 21,
        federalHolidayCount: 5,
      }),
      cov({
        year: '2026-2027',
        status: 'verified',
        closureCount: 17,
        schoolConfirmedCount: 17,
        position: 'next',
      }),
    );
    expect(
      screen.queryByTestId('coverage-banner-current-federal-holidays'),
    ).toBeNull();
    expect(screen.getByTestId('coverage-banner-both-verified')).toBeInTheDocument();
  });

  it('renders nothing when both years are unavailable (placeholder slot owns that case)', () => {
    const { container } = wrap(
      cov({ year: '2025-2026', status: 'unavailable', closureCount: 0 }),
      cov({ year: '2026-2027', status: 'unavailable', closureCount: 0, position: 'next' }),
    );
    expect(container.firstChild).toBeNull();
  });
});
