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

describe('UnifiedCampDetail — hero image', () => {
  const HERO = 'https://example.com/hero.jpg';

  it('renders hero_url when present (public mode)', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, hero_url: HERO }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const img = screen.getByTestId('camp-detail-hero-image') as HTMLImageElement;
    expect(img.src).toBe(HERO);
  });

  it('renders hero_url when present (app mode)', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, hero_url: HERO }}
        mode="app"
        locale="en"
        isSaved={false}
      />,
      { withModeProvider: true },
    );
    const img = screen.getByTestId('camp-detail-hero-image') as HTMLImageElement;
    expect(img.src).toBe(HERO);
  });

  it('falls back to image_url when hero_url is null but image_url is set', () => {
    const IMG = 'https://example.com/legacy.jpg';
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, hero_url: null, image_url: IMG }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(
      (screen.getByTestId('camp-detail-hero-image') as HTMLImageElement).src,
    ).toBe(IMG);
  });

  it('renders the gradient when both hero_url and image_url are null', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, hero_url: null, image_url: null }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-detail-hero-image')).toBeNull();
  });

  it('admin Edit pill still renders on top of the hero image', () => {
    withProviders(
      <UnifiedCampDetail
        camp={{ ...baseCamp, hero_url: HERO }}
        mode="public"
        locale="en"
        isAdmin
      />,
      { withModeProvider: false },
    );
    expect(screen.getByTestId('camp-detail-admin-edit')).toBeInTheDocument();
    expect(screen.getByTestId('camp-detail-hero-image')).toBeInTheDocument();
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

describe('UnifiedCampDetail — structured fields (R6 silent-skip on null)', () => {
  it('omits the entire section when no structured fields are populated', () => {
    withProviders(
      <UnifiedCampDetail camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-detail-structured')).toBeNull();
    expect(screen.queryByTestId('camp-detail-sessions')).toBeNull();
    expect(screen.queryByTestId('camp-detail-pricing')).toBeNull();
    expect(screen.queryByTestId('camp-detail-activities')).toBeNull();
    expect(screen.queryByTestId('camp-detail-fees')).toBeNull();
    expect(screen.queryByTestId('camp-detail-enrollment-pill')).toBeNull();
  });

  it('renders sessions cards with date range and weekly themes when present', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      sessions: [
        {
          label: 'Session One',
          start_date: '2026-06-15',
          end_date: '2026-07-02',
          weekly_themes: ['Friendship', 'Family'],
          notes: 'No camp June 19',
        },
      ],
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const section = screen.getByTestId('camp-detail-sessions');
    expect(section).toHaveTextContent('Session One');
    expect(section).toHaveTextContent('Friendship');
    expect(section).toHaveTextContent('No camp June 19');
    expect(section).toHaveTextContent(/Jun 14|Jun 15/);
  });

  it('renders pricing tiers as a table with formatted dollar amounts', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      pricing_tiers: [
        {
          label: 'Half-day',
          hours: '9am–12:30pm',
          session_price_cents: 70000,
          both_sessions_price_cents: 130000,
          weekly_price_cents: 28500,
          notes: null,
        },
      ],
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const section = screen.getByTestId('camp-detail-pricing');
    expect(section).toHaveTextContent('Half-day');
    expect(section).toHaveTextContent('$700');
    expect(section).toHaveTextContent('$1300');
    expect(section).toHaveTextContent('$285');
  });

  it('renders activities as chips and what-to-bring as bullets', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      activities: ['Arts & Crafts', 'STEM Lab'],
      what_to_bring: ['lunch', 'water bottle'],
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const acts = screen.getByTestId('camp-detail-activities');
    expect(acts).toHaveTextContent('Arts & Crafts');
    expect(acts).toHaveTextContent('STEM Lab');
    const bring = screen.getByTestId('camp-detail-what-to-bring');
    expect(bring).toHaveTextContent('lunch');
    expect(bring).toHaveTextContent('water bottle');
  });

  it('renders fees disclosure with refundable / non-refundable annotation', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      fees: [
        {
          label: 'Registration fee',
          amount_cents: 15000,
          refundable: false,
          notes: null,
        },
      ],
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const fees = screen.getByTestId('camp-detail-fees');
    expect(fees).toHaveTextContent('Registration fee');
    expect(fees).toHaveTextContent('$150');
    expect(fees).toHaveTextContent('non-refundable');
  });

  it('renders enrollment pill "Open until full" when status is until_full', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      enrollment_window: {
        opens_at: '2025-12-01T00:00:00Z',
        closes_at: null,
        status: 'until_full',
      },
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const pill = screen.getByTestId('camp-detail-enrollment-pill');
    expect(pill).toHaveTextContent('Open until full');
  });

  it('renders enrollment pill "Opens {date}" when opens_at is in the future', () => {
    const futureIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      enrollment_window: {
        opens_at: futureIso,
        closes_at: null,
        status: 'open',
      },
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const pill = screen.getByTestId('camp-detail-enrollment-pill');
    expect(pill).toHaveTextContent(/Opens/);
  });

  it('renders lunch_policy and extended_care_policy as their own sections', () => {
    const camp: UnifiedCampDetailCamp = {
      ...baseCamp,
      lunch_policy: 'Lunch from home or order via Our Lunches.',
      extended_care_policy: 'Early Morning Care 8:00–8:45 AM, $40/week.',
    };
    withProviders(
      <UnifiedCampDetail camp={camp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.getByTestId('camp-detail-lunch')).toHaveTextContent(
      'Our Lunches',
    );
    expect(screen.getByTestId('camp-detail-extended-care')).toHaveTextContent(
      'Early Morning Care',
    );
  });
});
