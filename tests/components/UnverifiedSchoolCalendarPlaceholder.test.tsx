import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/the-growing-place',
}));

import { UnverifiedSchoolCalendarPlaceholder } from '@/components/public/UnverifiedSchoolCalendarPlaceholder';

function renderPlaceholder(
  props: Partial<
    React.ComponentProps<typeof UnverifiedSchoolCalendarPlaceholder>
  > = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UnverifiedSchoolCalendarPlaceholder
        locale="en"
        schoolName="The Growing Place"
        schoolSlug="the-growing-place"
        phone="(305) 446-0846"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('UnverifiedSchoolCalendarPlaceholder', () => {
  it('renders the headline naming the school', () => {
    renderPlaceholder();
    expect(
      screen.getByText(/we're still verifying.+the growing place/i),
    ).toBeTruthy();
  });

  it('shows the call-the-school link only when a phone is known', () => {
    const { rerender } = renderPlaceholder();
    expect(
      screen.getByRole('link', { name: /call.*the growing place/i }),
    ).toBeTruthy();
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <UnverifiedSchoolCalendarPlaceholder
          locale="en"
          schoolName="Mystery School"
          schoolSlug="mystery-school"
          phone={null}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.queryByRole('link', { name: /call.*mystery school/i }),
    ).toBeNull();
  });

  it('points the MDCPS-calendar link at /{locale}/breaks', () => {
    renderPlaceholder({ locale: 'en' });
    const mdcpsLink = screen.getByRole('link', {
      name: /miami-dade public schools/i,
    });
    expect(mdcpsLink.getAttribute('href')).toBe('/en/breaks');
  });

  it("shows Noah's personal note ONLY for the-growing-place slug", () => {
    renderPlaceholder({ schoolSlug: 'the-growing-place' });
    expect(screen.getByTestId('tgp-noah-note')).toBeTruthy();
  });

  it("does NOT show Noah's note for any other school", () => {
    renderPlaceholder({
      schoolSlug: 'gulliver-preparatory-school',
      schoolName: 'Gulliver',
    });
    expect(screen.queryByTestId('tgp-noah-note')).toBeNull();
  });

  it('renders an email-the-PDF action that opens the FeatureRequestModal', () => {
    renderPlaceholder();
    const btn = screen.getByRole('button', {
      name: /email us.*calendar pdf/i,
    });
    expect(btn).toBeTruthy();
  });

  it('renders a notify-me-when-verified action', () => {
    renderPlaceholder();
    const btn = screen.getByRole('button', {
      name: /notify me/i,
    });
    expect(btn).toBeTruthy();
  });
});
