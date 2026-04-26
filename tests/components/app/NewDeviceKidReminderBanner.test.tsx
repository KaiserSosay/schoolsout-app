import { render, screen, act, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, beforeEach } from 'vitest';
import { NewDeviceKidReminderBanner } from '@/components/app/NewDeviceKidReminderBanner';
import messages from '@/i18n/messages/en.json';

// Phase 3.0 / Item 3.9 — banner is the parent-side reassurance for the
// COPPA tradeoff (kid names local-only). Critical that it renders only
// when ALL three conditions hold: empty localStorage kids, user has any
// app history (subscription, save, plan, activity), and not dismissed in
// the last 30 days. Phase 3.5 widened "subscriptions only" to "any
// history signal" because mom signed up via the plan flow without
// subscribing to email reminders, so the old condition skipped her.

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
});

function wrap(props: Partial<React.ComponentProps<typeof NewDeviceKidReminderBanner>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NewDeviceKidReminderBanner
        userHasAppHistory
        locale="en"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('NewDeviceKidReminderBanner', () => {
  it('renders when localStorage is empty AND userHasAppHistory=true', async () => {
    await act(async () => {
      wrap();
    });
    expect(screen.getByTestId('new-device-banner')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('mom-tested copy leads with "for your family\'s privacy"', async () => {
    await act(async () => {
      wrap();
    });
    expect(
      screen.getByText(/for your family's privacy/i),
    ).toBeInTheDocument();
  });

  it('mom-tested copy reassures that everything else is preserved', async () => {
    await act(async () => {
      wrap();
    });
    // The reassurance line must mention saved camps + plans + reminders
    // are still there. If a future copy edit drops one, this fails so
    // the regression is visible before it ships.
    expect(
      screen.getByText(
        /saved camps[\s\S]*plans[\s\S]*reminders/i,
      ),
    ).toBeInTheDocument();
  });

  it('does NOT render when localStorage already has kids', async () => {
    localStorage.setItem('so-kids', JSON.stringify([{ name: 'Noah' }]));
    await act(async () => {
      wrap();
    });
    expect(screen.queryByTestId('new-device-banner')).not.toBeInTheDocument();
  });

  it('does NOT render when userHasAppHistory=false (brand new user)', async () => {
    await act(async () => {
      wrap({ userHasAppHistory: false });
    });
    expect(screen.queryByTestId('new-device-banner')).not.toBeInTheDocument();
  });

  it('does NOT render when dismissed within last 30 days', async () => {
    localStorage.setItem(
      'so-new-device-banner-dismissed-at',
      String(Date.now() - 1000 * 60 * 60), // 1h ago
    );
    await act(async () => {
      wrap();
    });
    expect(screen.queryByTestId('new-device-banner')).not.toBeInTheDocument();
  });

  it('DOES render when dismissed > 30 days ago', async () => {
    localStorage.setItem(
      'so-new-device-banner-dismissed-at',
      String(Date.now() - 31 * 24 * 60 * 60 * 1000),
    );
    await act(async () => {
      wrap();
    });
    expect(screen.getByTestId('new-device-banner')).toBeInTheDocument();
  });

  it('dismiss button sets the localStorage flag and unmounts the banner', async () => {
    await act(async () => {
      wrap();
    });
    const dismiss = screen.getByLabelText(/Dismiss new-device reminder/i);
    fireEvent.click(dismiss);
    expect(screen.queryByTestId('new-device-banner')).not.toBeInTheDocument();
    const stored = localStorage.getItem('so-new-device-banner-dismissed-at');
    expect(stored).toBeTruthy();
    expect(Number.isFinite(parseInt(stored!, 10))).toBe(true);
  });

  it('CTA links to /{locale}/app/family', async () => {
    await act(async () => {
      wrap({ locale: 'es' });
    });
    const link = screen.getByRole('link', { name: /Add my kids/i });
    expect(link.getAttribute('href')).toBe('/es/app/family');
  });
});
