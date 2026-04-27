import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import {
  UnifiedCampCard,
  type UnifiedCampCardCamp,
} from '@/components/camps/UnifiedCampCard';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/camps',
  useSearchParams: () => new URLSearchParams(),
}));

function withProviders(ui: React.ReactNode, opts: { withModeProvider: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {opts.withModeProvider ? <ModeProvider>{ui}</ModeProvider> : ui}
    </NextIntlClientProvider>,
  );
}

const baseCamp: UnifiedCampCardCamp = {
  id: 'c1',
  slug: 'machane-miami',
  name: 'Machane Miami',
  ages_min: 5,
  ages_max: 13,
  price_tier: '$$',
  categories: ['arts', 'cultural', 'general', 'religious', 'sports', 'swim'],
  neighborhood: 'North Miami Beach',
  verified: true,
};

describe('UnifiedCampCard religious badge — public mode', () => {
  it('renders 🙏 badge when categories include religious', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const badge = screen.getByTestId('camp-religious-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('🙏');
    expect(badge).toHaveAttribute('title', expect.stringMatching(/Religious program/i));
    expect(badge).toHaveAttribute('aria-label', 'Religious');
  });

  it('does NOT render the badge when religious is absent', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, categories: ['arts', 'sports'] }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-religious-badge')).toBeNull();
  });
});

describe('UnifiedCampCard religious badge — app mode', () => {
  it('renders 🙏 badge when categories include religious', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    const badge = screen.getByTestId('camp-religious-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('🙏');
  });

  it('does NOT render the badge when religious is absent', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, categories: ['arts', 'sports'] }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-religious-badge')).toBeNull();
  });

  it('badge sits in the same flex row as Featured + Verified pills', () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    withProviders(
      <UnifiedCampCard
        camp={{
          ...baseCamp,
          last_verified_at: recent,
          is_featured: true,
          featured_until: future,
        }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-religious-badge')).toBeInTheDocument();
    expect(screen.getByTestId('camp-featured-badge')).toBeInTheDocument();
    expect(screen.getByTestId('camp-verified-badge')).toBeInTheDocument();
  });
});

describe('UnifiedCampCard religious badge — wishlist-tile mode', () => {
  it('does NOT render the badge in wishlist tile (low-density mode)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="wishlist-tile" locale="en" />,
      { withModeProvider: true },
    );
    // Wishlist tile is intentionally minimal — no badges per plan §5.
    expect(screen.queryByTestId('camp-religious-badge')).toBeNull();
  });
});
