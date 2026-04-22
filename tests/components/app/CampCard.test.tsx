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
});
