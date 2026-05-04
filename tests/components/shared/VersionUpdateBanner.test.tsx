import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VersionUpdateBanner } from '@/components/shared/VersionUpdateBanner';
import messages from '@/i18n/messages/en.json';

const STORAGE_KEY = 'so-update-dismissed-build';

// jsdom 29 in this project ships a partial localStorage (no .clear /
// .removeItem) — same pattern as tests/components/app/ModeProvider.test.tsx:
// stub a full Storage backed by a Map per test.
type Store = Map<string, string>;
let store: Store;

function installLocalStorageStub() {
  store = new Map<string, string>();
  const storageStub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storageStub,
  });
}

function renderBanner() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <VersionUpdateBanner />
    </NextIntlClientProvider>,
  );
}

function mockFetchVersion(buildId: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ buildId, ts: Date.now() }),
  });
}

beforeEach(() => {
  installLocalStorageStub();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  cleanup();
});

describe('VersionUpdateBanner', () => {
  it('does not render when bundle and server build ids match', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', 'abc123');
    vi.stubGlobal('fetch', mockFetchVersion('abc123'));

    renderBanner();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/version',
        expect.objectContaining({ cache: 'no-store' }),
      );
    });
    expect(screen.queryByTestId('version-update-banner')).not.toBeInTheDocument();
  });

  it('renders the banner when bundle and server build ids differ', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', 'old-sha-aaa');
    vi.stubGlobal('fetch', mockFetchVersion('new-sha-bbb'));

    renderBanner();

    await waitFor(() => {
      expect(screen.getByTestId('version-update-banner')).toBeInTheDocument();
    });
    expect(screen.getByText(/New version available/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Refresh/i }),
    ).toBeInTheDocument();
  });

  it('short-circuits in dev — never fetches when bundle build id is "dev"', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', 'dev');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    renderBanner();

    await Promise.resolve();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('version-update-banner')).not.toBeInTheDocument();
  });

  it('hides the banner and persists the build id when dismissed', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', 'old-sha-aaa');
    vi.stubGlobal('fetch', mockFetchVersion('new-sha-bbb'));

    renderBanner();

    await waitFor(() => {
      expect(screen.getByTestId('version-update-banner')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Dismiss update notice/i }),
    );

    expect(screen.queryByTestId('version-update-banner')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('new-sha-bbb');
  });

  it('does not re-show after a re-mount for a build the user already dismissed', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'new-sha-bbb');
    vi.stubEnv('NEXT_PUBLIC_BUILD_ID', 'old-sha-aaa');
    vi.stubGlobal('fetch', mockFetchVersion('new-sha-bbb'));

    renderBanner();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('version-update-banner')).not.toBeInTheDocument();
  });
});
