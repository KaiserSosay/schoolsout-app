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
  usePathname: () => '/en/app/camps/machane-miami',
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
  slug: 'machane-miami',
  name: 'Machane Miami',
  tagline: null,
  description: 'Jewish day camp at Yeshiva Toras Chaim Toras Emes.',
  ages_min: 5,
  ages_max: 13,
  price_tier: '$$',
  price_min_cents: null,
  price_max_cents: null,
  categories: ['arts', 'cultural', 'religious', 'sports', 'swim'],
  website_url: null,
  image_url: null,
  neighborhood: 'North Miami Beach',
  phone: null,
  address: null,
  hours_start: null,
  hours_end: null,
  registration_url: null,
  registration_deadline: null,
  verified: true,
  last_verified_at: new Date().toISOString(),
};

describe('UnifiedCampDetail religious badge — public mode', () => {
  it('renders the badge in the header when categories include religious', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const badge = screen.getByTestId('camp-detail-religious-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('🙏');
  });

  it('does NOT render when religious is absent', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, categories: ['sports', 'swim'] }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-detail-religious-badge')).toBeNull();
  });
});

describe('UnifiedCampDetail religious badge — app mode', () => {
  it('renders the badge in the header when categories include religious', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="app" locale="en" isSaved={false} />,
      { withModeProvider: true },
    );
    const badge = screen.getByTestId('camp-detail-religious-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('🙏');
  });

  it('does NOT render when religious is absent', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, categories: ['sports', 'swim'] }}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-detail-religious-badge')).toBeNull();
  });
});
