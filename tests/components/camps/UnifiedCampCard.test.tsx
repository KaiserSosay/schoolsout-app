import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import {
  UnifiedCampCard,
  type UnifiedCampCardCamp,
} from '@/components/camps/UnifiedCampCard';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

// Stub next/navigation — UnifiedCampCard's app/wishlist branches embed
// SaveCampButton which calls useTransition + (indirectly) hooks that touch
// router refs.
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
  slug: 'frost-science-summer-camp',
  name: 'Frost Science Summer Camp',
  ages_min: 6,
  ages_max: 12,
  price_tier: '$$',
  categories: ['STEM', 'Nature'],
  neighborhood: 'Downtown',
  verified: true,
};

describe('UnifiedCampCard — public mode', () => {
  it('renders without ModeProvider (public pages do not mount one)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    expect(screen.getByText('Frost Science Summer Camp')).toBeInTheDocument();
  });

  it('routes to /en/camps/{slug} (public detail)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const link = screen.getByRole('link', { name: /Frost Science Summer Camp/ });
    expect(link).toHaveAttribute('href', '/en/camps/frost-science-summer-camp');
  });

  it('renders a disabled save star with the "Sign in to save" tooltip — NOT a lock icon', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="public" locale="en" />,
      { withModeProvider: false },
    );
    const save = screen.getByTestId('public-camp-disabled-save');
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-label', 'Sign in to save this camp');
    expect(save).toHaveAttribute('title', 'Sign in to save this camp');
    // Star — same shape as the logged-in unsaved state.
    expect(save.textContent).toContain('☆');
    expect(save.textContent).not.toContain('🔒');
  });

  it('renders categories pills (up to 2)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, categories: ['STEM', 'Nature', 'Sports'] }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.getByText('STEM')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.queryByText('Sports')).toBeNull();
  });

  it('does NOT render hours/care/distance lines (compact mode)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{
          ...baseCamp,
          hours_start: '09:00',
          hours_end: '17:00',
          before_care_offered: true,
          before_care_start: '07:30',
          distance_miles: 2.4,
        }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-hours')).toBeNull();
    expect(screen.queryByTestId('camp-before-care')).toBeNull();
    expect(screen.queryByTestId('camp-distance')).toBeNull();
  });
});

describe('UnifiedCampCard — app mode', () => {
  it('renders name, ages/price, and category pills', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    expect(screen.getByText('Frost Science Summer Camp')).toBeInTheDocument();
    expect(screen.getByText(/Ages 6.*12.*\$\$/)).toBeInTheDocument();
    expect(screen.getByText('STEM')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
  });

  it('routes to /en/app/camps/{slug} (logged-in detail)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    const link = screen.getByRole('link', { name: /Frost Science Summer Camp/ });
    expect(link).toHaveAttribute(
      'href',
      '/en/app/camps/frost-science-summer-camp',
    );
  });

  it('shows a pending-verification ⚠ icon when verified=false', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, verified: false }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    const warn = screen.getByLabelText('Pending verification');
    expect(warn).toBeInTheDocument();
    expect(warn.textContent).toContain('⚠');
  });

  it('omits the warning indicator when verified=true', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    expect(screen.queryByLabelText('Pending verification')).toBeNull();
  });

  it('shows the Verified badge when last_verified_at is within 90 days', () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, last_verified_at: recent }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-verified-badge')).toBeInTheDocument();
  });

  it('hides the Verified badge when last_verified_at is older than 90 days', () => {
    const stale = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, last_verified_at: stale }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-verified-badge')).toBeNull();
  });

  it('shows the Featured badge when is_featured=true and featured_until is in the future', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, is_featured: true, featured_until: future }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-featured-badge')).toBeInTheDocument();
  });

  it('hides the Featured badge when featured_until is in the past', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, is_featured: true, featured_until: past }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-featured-badge')).toBeNull();
  });

  it('renders the hours line when hours_start + hours_end are present', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, hours_start: '09:00', hours_end: '17:00' }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-hours')).toBeInTheDocument();
  });

  it('renders the distance label when distance_miles is provided', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, distance_miles: 2.4 }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-distance')).toBeInTheDocument();
  });

  it('renders the functional save button (not the disabled public one)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('public-camp-disabled-save')).toBeNull();
    // The functional save button has aria-label "Save" or "Saved" depending
    // on state.
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
  });

  // Regression: partial-completeness "Missing: …" must render in normal flow
  // below the Link, NOT inside the absolute right-3 top-3 column. Living
  // inside the absolute column let the unbounded <p> wrap leftward into the
  // Featured/Verified/Religious badge row and visually overlap it. (See
  // docs/plans/app-camps-public-parity-audit-2026-04-28.md.)
  it('renders the partial-completeness text outside the absolute save container', () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    // 7/10 filled (score 0.70 → 'partial' band), 3 missing fields, plus all
    // three pill conditions true so a badge row renders above.
    const camp: UnifiedCampCardCamp = {
      ...baseCamp,
      categories: ['religious'],
      verified: true,
      last_verified_at: recent,
      is_featured: true,
      featured_until: future,
      phone: null,
      address: '123 Main St',
      website_url: 'https://example.org',
      hours_start: '09:00',
      hours_end: '17:00',
      description: 'A long enough description to count as filled past the 40-character threshold.',
      price_min_cents: 10000,
      price_max_cents: 30000,
      registration_url: null,
      registration_deadline: null,
    };
    withProviders(
      <UnifiedCampCard camp={camp} mode="app" isSaved={false} locale="en" />,
      { withModeProvider: true },
    );
    const partial = screen.getByTestId('camp-completeness-partial');
    // Walk ancestors up to the article — none should be the absolute save
    // container.
    let cursor: HTMLElement | null = partial.parentElement;
    while (cursor && cursor.getAttribute('data-testid') !== 'unified-camp-card-app') {
      expect(cursor.classList.contains('absolute')).toBe(false);
      cursor = cursor.parentElement;
    }
    // And the badge row siblings still rendered.
    expect(screen.getByTestId('camp-featured-badge')).toBeInTheDocument();
    expect(screen.getByTestId('camp-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('camp-religious-badge')).toBeInTheDocument();
  });
});

describe('UnifiedCampCard — wishlist-tile mode', () => {
  it('renders a compact 2-line summary', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="wishlist-tile" locale="en" />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('unified-camp-card-wishlist')).toBeInTheDocument();
    expect(screen.getByText('Frost Science Summer Camp')).toBeInTheDocument();
    expect(screen.getByText(/Ages 6.*12.*\$\$/)).toBeInTheDocument();
  });

  it('routes to /en/app/camps/{slug}', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="wishlist-tile" locale="en" />,
      { withModeProvider: true },
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/en/app/camps/frost-science-summer-camp',
    );
  });

  it('renders the functional save button (small)', () => {
    withProviders(
      <UnifiedCampCard camp={baseCamp} mode="wishlist-tile" locale="en" />,
      { withModeProvider: true },
    );
    // Default isSaved for wishlist-tile is true (it's a wishlist tile).
    expect(screen.getByRole('button', { name: /^Saved$/i })).toBeInTheDocument();
  });

  it('does NOT render category pills, hours, or distance', () => {
    withProviders(
      <UnifiedCampCard
        camp={{
          ...baseCamp,
          hours_start: '09:00',
          hours_end: '17:00',
          distance_miles: 2.4,
        }}
        mode="wishlist-tile"
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByText('STEM')).toBeNull();
    expect(screen.queryByTestId('camp-hours')).toBeNull();
    expect(screen.queryByTestId('camp-distance')).toBeNull();
  });
});

describe('UnifiedCampCard — tagline rendering', () => {
  const TAGLINE = 'Hands-on STEM, every weekday.';

  it('renders tagline below the name in public mode when present', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: TAGLINE }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const el = screen.getByTestId('camp-card-tagline');
    expect(el).toHaveTextContent(TAGLINE);
    expect(el.className).toContain('line-clamp-2');
  });

  it('renders tagline in app mode when present', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: TAGLINE }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    const el = screen.getByTestId('camp-card-tagline');
    expect(el).toHaveTextContent(TAGLINE);
    expect(el.className).toContain('line-clamp-2');
  });

  it('does NOT render tagline in wishlist-tile mode (intentionally minimal)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: TAGLINE }}
        mode="wishlist-tile"
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-card-tagline')).toBeNull();
    expect(screen.queryByText(TAGLINE)).toBeNull();
  });

  it('does NOT render tagline element when tagline is null (public)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: null }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-card-tagline')).toBeNull();
  });

  it('does NOT render tagline element when tagline is null (app)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: null }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-card-tagline')).toBeNull();
  });

  it('renders the full tagline text even when long (line-clamp handles truncation visually)', () => {
    const long = 'A'.repeat(250);
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, tagline: long }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const el = screen.getByTestId('camp-card-tagline');
    expect(el.textContent).toBe(long);
    expect(el.className).toContain('line-clamp-2');
  });
});

describe('UnifiedCampCard — logo avatar', () => {
  const LOGO = 'https://example.com/logo.png';

  it('renders the logo avatar in public mode when logo_url is set', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, logo_url: LOGO }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    const img = screen.getByTestId('camp-card-logo') as HTMLImageElement;
    expect(img.src).toBe(LOGO);
    // Decorative — name is right next to it.
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the logo avatar in app mode when logo_url is set', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, logo_url: LOGO }}
        mode="app"
        isSaved={false}
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.getByTestId('camp-card-logo')).toBeInTheDocument();
  });

  it('omits the logo avatar when logo_url is null (public)', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, logo_url: null }}
        mode="public"
        locale="en"
      />,
      { withModeProvider: false },
    );
    expect(screen.queryByTestId('camp-card-logo')).toBeNull();
  });

  it('omits the logo avatar in wishlist-tile mode regardless', () => {
    withProviders(
      <UnifiedCampCard
        camp={{ ...baseCamp, logo_url: LOGO }}
        mode="wishlist-tile"
        locale="en"
      />,
      { withModeProvider: true },
    );
    expect(screen.queryByTestId('camp-card-logo')).toBeNull();
  });
});
