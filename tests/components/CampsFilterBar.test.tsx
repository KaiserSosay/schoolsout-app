import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import enMessages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/en/camps',
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { CampsFilterBar } from '@/components/camps/CampsFilterBar';

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = '';
});

afterEach(() => {
  vi.useRealTimers();
});

function wrap(props: Parameters<typeof CampsFilterBar>[0]) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <CampsFilterBar {...props} />
    </NextIntlClientProvider>,
  );
}

describe('CampsFilterBar', () => {
  it('renders the search box, category chips, and care toggles in public mode', () => {
    // Full-workday chip is feature-flagged off by default — light it up
    // here so the rest of this assertion still exercises the chip.
    vi.stubEnv('NEXT_PUBLIC_ENABLE_FULL_WORKDAY_FILTER', 'true');
    wrap({ mode: 'public', hoods: [] });
    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /STEM/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Full workday/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Before-care/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /After-care/i })).toBeInTheDocument();
    // Match-my-kids stays hidden in public mode
    expect(screen.queryByRole('button', { name: /Match my kids/i })).toBeNull();
    vi.unstubAllEnvs();
  });

  it('hides the Full-workday chip when the feature flag is off (default)', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_FULL_WORKDAY_FILTER', '');
    wrap({ mode: 'public', hoods: [] });
    expect(screen.queryByRole('button', { name: /Full workday/i })).toBeNull();
    // Sibling care toggles still render — only the data-thin one is gated.
    expect(screen.getByRole('button', { name: /Before-care/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /After-care/i })).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('shows the Match-my-kids chip in app mode when matchEnabled=true', () => {
    wrap({ mode: 'app', hoods: [], matchEnabled: true });
    expect(screen.getByRole('button', { name: /Match my kids/i })).toBeInTheDocument();
  });

  it('toggling a category chip pushes ?cats= to the URL', async () => {
    wrap({ mode: 'public', hoods: [] });
    fireEvent.click(screen.getByRole('button', { name: /STEM/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(pushMock).toHaveBeenCalledWith('/en/camps?cats=STEM');
  });

  it('care toggles push the matching boolean URL params', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_FULL_WORKDAY_FILTER', 'true');
    wrap({ mode: 'public', hoods: [] });
    fireEvent.click(screen.getByRole('button', { name: /Full workday/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(pushMock.mock.calls[0][0]).toContain('full_workday=1');
    vi.unstubAllEnvs();
  });

  it('debounces the search input by ~300ms before pushing the URL', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    wrap({ mode: 'public', hoods: [] });
    const input = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(input, { target: { value: 'fr' } });
    fireEvent.change(input, { target: { value: 'fro' } });
    fireEvent.change(input, { target: { value: 'frost' } });
    expect(pushMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
    expect(pushMock.mock.calls[0][0]).toContain('q=frost');
  });

  it('exposes the advanced drawer with ages + price + neighborhoods', () => {
    wrap({ mode: 'public', hoods: ['Coral Gables', 'Coconut Grove'] });
    fireEvent.click(screen.getByRole('button', { name: /More filters/i }));
    expect(screen.getByText(/Ages/i)).toBeInTheDocument();
    expect(screen.getByText(/Price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coral Gables' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6-9' })).toBeInTheDocument();
  });

  it('hydrates the search box from the current URL query', () => {
    currentSearch = 'q=frost';
    wrap({ mode: 'public', hoods: [] });
    expect(screen.getByPlaceholderText(/Search by name/i)).toHaveValue('frost');
  });
});
