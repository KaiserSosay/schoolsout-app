import { render, screen, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KidActivityFeed } from '@/components/app/KidActivityFeed';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app',
}));

// Feed polls /api/kid-activity every 30s. Return ok=false so the initial
// prop wins — otherwise the poll's empty response would overwrite the
// SSR data before we can assert on it.
const fetchMock = vi.fn().mockResolvedValue({
  ok: false,
  json: async () => ({}),
});
beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  // jsdom lacks localStorage in isolation
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
});

function renderFeed(initial: Parameters<typeof KidActivityFeed>[0]['initial']) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>
        <KidActivityFeed initial={initial} locale="en" />
      </ModeProvider>
    </NextIntlClientProvider>,
  );
}

describe('KidActivityFeed', () => {
  it('renders closure activity row as a link to the closure detail', async () => {
    await act(async () => {
      renderFeed([
        {
          id: 'a1',
          action: 'viewed_closure',
          target_id: 'closure-1',
          target_name: 'Memorial Day',
          created_at: new Date().toISOString(),
        },
      ] as never);
    });
    const link = await screen.findByRole('link');
    expect(link.getAttribute('href')).toBe('/en/app/closures/closure-1');
    expect(link.textContent).toContain('Memorial Day');
  });

  it('renders camp activity WITH metadata.slug as a link to /app/camps/{slug}', async () => {
    await act(async () => {
      renderFeed([
        {
          id: 'a2',
          action: 'saved_camp',
          target_id: 'camp-1',
          target_name: 'Frost Science',
          created_at: new Date().toISOString(),
          metadata: { slug: 'frost-science' },
        },
      ] as never);
    });
    const link = await screen.findByRole('link');
    expect(link.getAttribute('href')).toBe('/en/app/camps/frost-science');
  });

  it('renders camp activity WITHOUT slug as plain text, no link', async () => {
    await act(async () => {
      renderFeed([
        {
          id: 'a3',
          action: 'viewed_camp',
          target_id: 'camp-old',
          target_name: 'Legacy Camp',
          created_at: new Date().toISOString(),
        },
      ] as never);
    });
    // No link element for this activity row.
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/Legacy Camp/)).toBeInTheDocument();
  });
});
