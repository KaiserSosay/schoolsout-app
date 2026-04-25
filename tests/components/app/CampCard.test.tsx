import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { CampCard, type CampCardCamp } from '@/components/app/CampCard';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

// DECISION: Stub next/navigation (unused in CampCard but required by nested
// SaveCampButton useTransition hook chain when it calls any router helper).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/camps',
  useSearchParams: () => new URLSearchParams(),
}));

function wrap(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>{ui}</ModeProvider>
    </NextIntlClientProvider>,
  );
}

const baseCamp: CampCardCamp = {
  id: 'c1',
  slug: 'frost-science-summer-camp',
  name: 'Frost Science Summer Camp',
  ages_min: 6,
  ages_max: 12,
  price_tier: '$$',
  categories: ['STEM', 'Nature'],
  neighborhood: 'Downtown',
  verified: true,
};

describe('CampCard', () => {
  it('renders name, ages/price, and category pills', () => {
    wrap(<CampCard camp={baseCamp} saved={false} locale="en" />);
    expect(screen.getByText('Frost Science Summer Camp')).toBeInTheDocument();
    expect(screen.getByText(/Ages 6.*12.*\$\$/)).toBeInTheDocument();
    expect(screen.getByText('STEM')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
  });

  it('links to the camp detail page by slug', () => {
    wrap(<CampCard camp={baseCamp} saved={false} locale="en" />);
    const link = screen.getByRole('link', {
      name: /Frost Science Summer Camp/,
    });
    expect(link).toHaveAttribute(
      'href',
      '/en/app/camps/frost-science-summer-camp',
    );
  });

  it('shows a pending-verification indicator when verified=false', () => {
    wrap(
      <CampCard camp={{ ...baseCamp, verified: false }} saved={false} locale="en" />,
    );
    const warn = screen.getByLabelText('Pending verification');
    expect(warn).toBeInTheDocument();
    expect(warn.textContent).toContain('⚠');
  });

  it('omits the warning indicator when verified=true', () => {
    wrap(<CampCard camp={baseCamp} saved={false} locale="en" />);
    expect(screen.queryByLabelText('Pending verification')).toBeNull();
  });

  it('shows the Verified badge when last_verified_at is within 90 days', () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    wrap(
      <CampCard
        camp={{ ...baseCamp, last_verified_at: recent }}
        saved={false}
        locale="en"
      />,
    );
    expect(screen.getByTestId('camp-verified-badge')).toBeInTheDocument();
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
  });

  it('hides the Verified badge when last_verified_at is older than 90 days', () => {
    const stale = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    wrap(
      <CampCard
        camp={{ ...baseCamp, last_verified_at: stale }}
        saved={false}
        locale="en"
      />,
    );
    expect(screen.queryByTestId('camp-verified-badge')).toBeNull();
  });

  it('hides the Verified badge when last_verified_at is missing', () => {
    wrap(<CampCard camp={baseCamp} saved={false} locale="en" />);
    expect(screen.queryByTestId('camp-verified-badge')).toBeNull();
  });

  it('shows the Featured badge when is_featured=true and featured_until is in the future', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    wrap(
      <CampCard
        camp={{ ...baseCamp, is_featured: true, featured_until: future }}
        saved={false}
        locale="en"
      />,
    );
    expect(screen.getByTestId('camp-featured-badge')).toBeInTheDocument();
    expect(screen.getByLabelText('Featured')).toBeInTheDocument();
  });

  it('hides the Featured badge when featured_until is in the past', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    wrap(
      <CampCard
        camp={{ ...baseCamp, is_featured: true, featured_until: past }}
        saved={false}
        locale="en"
      />,
    );
    expect(screen.queryByTestId('camp-featured-badge')).toBeNull();
  });
});
