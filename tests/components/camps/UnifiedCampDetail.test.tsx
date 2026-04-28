import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import {
  UnifiedCampDetail,
  type UnifiedCampDetailCamp,
} from '@/components/camps/UnifiedCampDetail';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/camps/frost-science-summer-camp',
  useSearchParams: () => new URLSearchParams(),
}));

function withProviders(ui: React.ReactNode, opts: { withModeProvider: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {opts.withModeProvider ? <ModeProvider>{ui}</ModeProvider> : ui}
    </NextIntlClientProvider>,
  );
}

const baseCamp: UnifiedCampDetailCamp = {
  id: 'c1',
  slug: 'frost-science-summer-camp',
  name: 'Frost Science Summer Camp',
  tagline: null,
  description: 'Hands-on STEM summer programming for Miami kids.',
  ages_min: 6,
  ages_max: 12,
  price_tier: '$$',
  price_min_cents: 35000,
  price_max_cents: 35000,
  categories: ['STEM', 'Nature'],
  website_url: 'https://frost.com/summer',
  image_url: null,
  neighborhood: 'Downtown',
  phone: '305-555-0100',
  address: '1101 Biscayne Blvd, Miami, FL',
  hours_start: '09:00',
  hours_end: '17:00',
  registration_url: 'https://frost.com/signup',
  registration_deadline: '2026-05-01',
  verified: true,
  last_verified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('UnifiedCampDetail — public mode', () => {
  it('renders without ModeProvider', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.getByText('Frost Science Summer Camp')).toBeInTheDocument();
  });

  it('renders the same fact grid as the app detail (Q6 — data parity)', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const facts = screen.getByTestId('unified-camp-detail-facts');
    expect(facts).toHaveTextContent('6–12'); // ages
    expect(facts).toHaveTextContent('$350'); // price
    expect(facts).toHaveTextContent('9am–5pm'); // hours
    expect(facts).toHaveTextContent('1101 Biscayne'); // address
    expect(facts).toHaveTextContent(/(Apr 30|May 1), 2026/); // deadline (TZ-tolerant)
  });

  it('renders the disabled save star with "Sign in to save" tooltip', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const save = screen.getByTestId('public-camp-detail-disabled-save');
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('title', 'Sign in to save this camp');
    expect(save.textContent).toContain('☆');
    expect(save.textContent).not.toContain('🔒');
  });

  it('shows a back-to-camps link', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const back = screen.getByTestId('unified-camp-detail-back-link');
    expect(back).toHaveAttribute('href', '/en/camps');
  });

  it('renders a Visit website button when website_url is present', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const link = screen.getByRole('link', { name: /visit/i });
    expect(link).toHaveAttribute('href', 'https://frost.com/summer');
  });

  it('falls back to "verifiedUnknown" banner when last_verified_at is null', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, last_verified_at: null }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const banner = screen.getByTestId('unified-camp-detail-verified-banner');
    expect(banner.className).toContain('amber');
  });
});

describe('UnifiedCampDetail — app mode', () => {
  it('renders the same fact grid as public mode (Q6 — data parity)', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="app" locale="en" isSaved={false} />,
      { withModeProvider: true },
    );
    const facts = screen.getByTestId('unified-camp-detail-facts');
    // Same five facts as the public mode test above.
    expect(facts).toHaveTextContent('6–12');
    expect(facts).toHaveTextContent('$350');
    expect(facts).toHaveTextContent('9am–5pm');
    expect(facts).toHaveTextContent('1101 Biscayne');
    expect(facts).toHaveTextContent(/(Apr 30|May 1), 2026/);
  });

  it('renders the functional save button (full-width)', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="app" locale="en" isSaved={false} />,
      { withModeProvider: true },
    );
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
  });

  it('does NOT render the public disabled save or back link', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="app" locale="en" isSaved={false} />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('public-camp-detail-disabled-save')).toBeNull();
    expect(screen.queryByTestId('unified-camp-detail-back-link')).toBeNull();
  });

  it('renders a phone-call link when phone is present', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="app" locale="en" isSaved={false} />,
      { withModeProvider: true },
    );
    const callLink = screen.getByTestId('unified-camp-detail-call');
    expect(callLink).toHaveAttribute('href', 'tel:3055550100');
  });

  it('shows a "pending verification" pill when verified=false', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, verified: false }}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    expect(screen.getByText(/Pending verification/i)).toBeInTheDocument();
  });
});

describe('UnifiedCampDetail — tagline rendering', () => {
  it('renders tagline below the name in public hero when present', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, tagline: 'Hands-on STEM, every weekday.' }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const tagline = screen.getByTestId('camp-detail-tagline');
    expect(tagline).toHaveTextContent('Hands-on STEM, every weekday.');
  });

  it('renders tagline in app hero when present', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, tagline: 'Hands-on STEM, every weekday.' }}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-detail-tagline')).toHaveTextContent(
      'Hands-on STEM, every weekday.',
    );
  });

  it('does NOT render tagline element when tagline is null (public mode)', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-detail-tagline')).toBeNull();
  });

  it('does NOT render tagline element when tagline is null (app mode)', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-detail-tagline')).toBeNull();
  });
});

describe('UnifiedCampDetail — Edit pill (admin only)', () => {
  it('renders Edit pill in public mode when isAdmin=true', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="public"
        locale="en"
        isAdmin
      />,
      { withModeProvider: false },
    );
    expect(screen.getByTestId('camp-detail-admin-edit')).toBeInTheDocument();
  });

  it('renders Edit pill in app mode when isAdmin=true', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="app"
        locale="en"
        isSaved={false}
        isAdmin
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-detail-admin-edit')).toBeInTheDocument();
  });

  it('does NOT render Edit pill in public mode for non-admin viewers', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-detail-admin-edit')).toBeNull();
  });

  it('does NOT render Edit pill in app mode for non-admin viewers', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-detail-admin-edit')).toBeNull();
  });

  it('Edit pill links to /{locale}/admin/camps/{slug}/edit', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="public"
        locale="es"
        isAdmin
      />,
      { withModeProvider: false },
    );
    const link = screen.getByTestId('camp-detail-admin-edit');
    expect(link).toHaveAttribute(
      'href',
      '/es/admin/camps/frost-science-summer-camp/edit',
    );
  });

  it('Edit pill exposes an aria-label with the camp name', () => {
    withProviders(
      <UnifiedCampDetail
        camp={baseCamp}
        mode="public"
        locale="en"
        isAdmin
      />,
      { withModeProvider: false },
    );
    const link = screen.getByTestId('camp-detail-admin-edit');
    expect(link).toHaveAttribute(
      'aria-label',
      'Admin: edit Frost Science Summer Camp',
    );
  });
});
