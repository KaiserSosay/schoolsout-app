import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/family',
}));

import { BirthDateSoftPrompt } from '@/components/app/BirthDateSoftPrompt';

beforeEach(() => {
  // Fresh localStorage per test
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => store.get(k) ?? null,
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => {
        store.delete(k);
      },
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
    } as Storage,
  });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  }) as unknown as typeof fetch;
});

function wrap(props: Partial<React.ComponentProps<typeof BirthDateSoftPrompt>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BirthDateSoftPrompt
        kids={[
          { id: 'k1', ordinal: 1, birth_month: null, birth_year: null },
          { id: 'k2', ordinal: 2, birth_month: 8, birth_year: 2017 },
        ]}
        nameByOrdinal={{ 1: 'Noah' }}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('BirthDateSoftPrompt', () => {
  it('renders for kids missing birth_month + birth_year', async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByTestId('birth-date-soft-prompt')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Help us match camps to Noah/i)).toBeInTheDocument();
  });

  it('does NOT render when every kid already has both fields', async () => {
    wrap({
      kids: [
        { id: 'k1', ordinal: 1, birth_month: 8, birth_year: 2017 },
        { id: 'k2', ordinal: 2, birth_month: 3, birth_year: 2020 },
      ],
    });
    // The component sets hidden=true initially, then either reveals (if
    // there are missing kids) or stays hidden. await a tick to give the
    // effect a chance to flip the state.
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('birth-date-soft-prompt')).toBeNull();
  });

  it('does NOT render when dismissed within last 30 days', async () => {
    localStorage.setItem(
      'so-birthdate-prompt-dismissed-at',
      String(Date.now() - 1000 * 60 * 60), // 1h ago
    );
    wrap();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('birth-date-soft-prompt')).toBeNull();
  });

  it('Skip-for-now sets the dismissed timestamp and unmounts', async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByTestId('birth-date-soft-prompt')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(screen.queryByTestId('birth-date-soft-prompt')).toBeNull();
    const stored = localStorage.getItem('so-birthdate-prompt-dismissed-at');
    expect(stored).toBeTruthy();
    expect(Number.isFinite(parseInt(stored!, 10))).toBe(true);
  });

  it('Save POSTs month + year to /api/kid-profiles/birth-date for the missing kid', async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByTestId('birth-date-soft-prompt')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('birth-prompt-month'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByTestId('birth-prompt-year'), {
      target: { value: '2017' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const fetchMock = global.fetch as unknown as { mock: { calls: Parameters<typeof fetch>[] } };
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/kid-profiles/birth-date');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ kid_id: 'k1', birth_month: 8, birth_year: 2017 });
  });
});
