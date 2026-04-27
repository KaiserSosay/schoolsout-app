import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampSortControl } from '@/components/camps/CampSortControl';
import { ModeProvider } from '@/components/app/ModeProvider';
import enMessages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/en/camps',
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = '';
});

function wrap(ui: React.ReactNode, opts: { withModeProvider: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {opts.withModeProvider ? <ModeProvider>{ui}</ModeProvider> : ui}
    </NextIntlClientProvider>,
  );
}

describe('CampSortControl — public mode', () => {
  it('renders all three sort buttons', () => {
    wrap(
      <CampSortControl mode="public" activeSort="name" />,
      { withModeProvider: false },
    );
    expect(screen.getByRole('button', { name: /Distance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Price/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Name$/i })).toBeInTheDocument();
  });

  it('disables Distance with the sign-in tooltip + 🔒 indicator', () => {
    wrap(
      <CampSortControl mode="public" activeSort="name" />,
      { withModeProvider: false },
    );
    const distance = screen.getByRole('button', { name: /Distance/i });
    expect(distance).toBeDisabled();
    expect(distance).toHaveAttribute('aria-disabled', 'true');
    expect(distance).toHaveAttribute(
      'title',
      'Sign in to sort by distance from your home',
    );
    expect(distance.textContent).toContain('🔒');
  });

  it('clicking Distance does NOT push to the URL', async () => {
    wrap(
      <CampSortControl mode="public" activeSort="name" />,
      { withModeProvider: false },
    );
    fireEvent.click(screen.getByRole('button', { name: /Distance/i }));
    // Disabled — no router.push expected.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('clicking Price pushes ?sort=price', async () => {
    wrap(
      <CampSortControl mode="public" activeSort="name" />,
      { withModeProvider: false },
    );
    fireEvent.click(screen.getByRole('button', { name: /Price/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(pushMock.mock.calls[0][0]).toContain('sort=price');
  });

  it('does NOT render the From-origin selector or setAddress hint', () => {
    wrap(
      <CampSortControl mode="public" activeSort="name" />,
      { withModeProvider: false },
    );
    expect(screen.queryByLabelText(/From/i)).toBeNull();
    expect(screen.queryByTestId('camp-distance-unavailable')).toBeNull();
  });
});

describe('CampSortControl — app mode', () => {
  const fromOptions = [
    { id: 'school:1', label: 'TGP', latitude: 25.7, longitude: -80.2 },
  ];

  it('Distance is enabled when distanceAvailable=true', () => {
    wrap(
      <CampSortControl
        mode="app"
        activeSort="name"
        fromOptions={fromOptions}
        activeFromId={null}
        distanceAvailable={true}
      />,
      { withModeProvider: true },
    );
    const distance = screen.getByRole('button', { name: /Distance/i });
    expect(distance).not.toBeDisabled();
  });

  it('Distance is disabled when distanceAvailable=false; setAddress hint shows', () => {
    wrap(
      <CampSortControl
        mode="app"
        activeSort="name"
        fromOptions={[]}
        activeFromId={null}
        distanceAvailable={false}
      />,
      { withModeProvider: true },
    );
    const distance = screen.getByRole('button', { name: /Distance/i });
    expect(distance).toBeDisabled();
    expect(screen.getByTestId('camp-distance-unavailable')).toBeInTheDocument();
  });

  it('renders the From selector when activeSort=distance', () => {
    wrap(
      <CampSortControl
        mode="app"
        activeSort="distance"
        fromOptions={fromOptions}
        activeFromId="school:1"
        distanceAvailable={true}
      />,
      { withModeProvider: true },
    );
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
  });
});
