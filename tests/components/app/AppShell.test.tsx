import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BottomNav } from '@/components/app/BottomNav';
import { SideNav } from '@/components/app/SideNav';
import { AppHeader } from '@/components/app/AppHeader';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

// Stub next/navigation so usePathname returns what each test sets.
let mockPathname = '/en/app';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mockPathname,
}));

// Supabase browser client is loaded by UserMenuItems (signOut) and the
// NotificationsDrawer. Stub it so the tests don't require a real client.
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabase: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
    from: () => ({
      select: () => ({
        order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
      }),
    }),
  }),
}));

// jsdom stub for localStorage (ModeProvider reads it on mount).
let store: Map<string, string>;
beforeEach(() => {
  store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
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

function renderWithIntl(node: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>{node}</ModeProvider>
    </NextIntlClientProvider>,
  );
}

describe('app/BottomNav', () => {
  it('renders five tabs in order', () => {
    mockPathname = '/en/app';
    renderWithIntl(<BottomNav locale="en" />);
    // Labels are uppercased via CSS, but the text content stays as in JSON.
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Camps')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('marks the active tab with aria-current based on pathname', () => {
    mockPathname = '/en/app/saved';
    const { container } = renderWithIntl(<BottomNav locale="en" />);
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.getAttribute('href')).toBe('/en/app/saved');
  });

  it('keeps Home tab inactive when on a sub-route under /app', () => {
    mockPathname = '/en/app/camps';
    const { container } = renderWithIntl(<BottomNav locale="en" />);
    const active = container.querySelector('[aria-current="page"]');
    // Home = /en/app, should NOT match when we're at /en/app/camps.
    expect(active?.getAttribute('href')).toBe('/en/app/camps');
  });

  it('hides itself on onboarding to keep the form distraction-free', () => {
    mockPathname = '/en/app/onboarding';
    const { container } = renderWithIntl(<BottomNav locale="en" />);
    expect(container.querySelector('nav')).toBeNull();
  });
});

describe('app/SideNav', () => {
  it('renders logo, nav items, and user block', () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );
    // logo wordmark
    expect(screen.getAllByText(/School's Out/).length).toBeGreaterThan(0);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('parent@example.com')).toBeInTheDocument();
    expect(screen.getByText('Got an idea?')).toBeInTheDocument();
  });

  it('does NOT show the Admin link in the user menu when isAdmin is false', async () => {
    mockPathname = '/en/app';
    const { container } = renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );
    const userTrigger = Array.from(
      container.querySelectorAll('button[aria-haspopup="menu"]'),
    ).find((b) => !b.hasAttribute('aria-label')) as
      | HTMLButtonElement
      | undefined;
    await act(async () => {
      userTrigger!.click();
    });
    expect(screen.queryByRole('link', { name: /^admin$/i })).toBeNull();
  });

  it('shows the Admin link in the user menu when isAdmin is true', async () => {
    mockPathname = '/en/app';
    const { container } = renderWithIntl(
      <SideNav
        locale="en"
        email="rasheid@example.com"
        displayName="Rasheid"
        isAdmin
      />,
    );
    const userTrigger = Array.from(
      container.querySelectorAll('button[aria-haspopup="menu"]'),
    ).find((b) => !b.hasAttribute('aria-label')) as
      | HTMLButtonElement
      | undefined;
    await act(async () => {
      userTrigger!.click();
    });
    const link = screen.getByRole('link', { name: /^admin$/i });
    expect(link.getAttribute('href')).toBe('/en/admin');
  });

  it('opens the user menu popover on avatar-block click', async () => {
    mockPathname = '/en/app';
    const { container } = renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );

    // Menu items are not in the DOM before open.
    expect(screen.queryByText('Log out')).toBeNull();

    // LanguageToggleMobile also has aria-haspopup="menu", so pick the one
    // without an aria-label — that's the user block.
    const userTrigger = Array.from(
      container.querySelectorAll('button[aria-haspopup="menu"]'),
    ).find((b) => !b.hasAttribute('aria-label')) as
      | HTMLButtonElement
      | undefined;
    expect(userTrigger).toBeDefined();
    expect(userTrigger!.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      userTrigger!.click();
    });

    expect(userTrigger!.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Log out')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders the notifications bell button', () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );
    const bell = screen.getByRole('button', { name: /open notifications/i });
    expect(bell).toBeInTheDocument();
    expect(bell.getAttribute('aria-haspopup')).toBe('dialog');
    expect(bell.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the NotificationsDrawer when the bell is clicked', async () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );

    // Drawer dialog is not mounted until the bell is clicked.
    expect(screen.queryByRole('dialog')).toBeNull();

    const bell = screen.getByRole('button', { name: /open notifications/i });
    await act(async () => {
      bell.click();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(bell.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the NotificationsDrawer when the close button is clicked', async () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <SideNav locale="en" email="parent@example.com" displayName="Ada" />,
    );

    const bell = screen.getByRole('button', { name: /open notifications/i });
    await act(async () => {
      bell.click();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const close = screen.getByRole('button', { name: /^close$/i });
    await act(async () => {
      fireEvent.click(close);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(bell.getAttribute('aria-expanded')).toBe('false');
  });

});

describe('app/AppHeader', () => {
  it('opens the mobile user menu sheet when avatar is tapped', async () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <AppHeader locale="en" email="parent@example.com" displayName={null} />,
    );

    expect(screen.queryByText('Log out')).toBeNull();

    const avatar = screen.getByRole('button', { name: /open menu/i });
    await act(async () => {
      fireEvent.click(avatar);
    });
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('renders a bell icon for notifications', () => {
    mockPathname = '/en/app';
    renderWithIntl(
      <AppHeader locale="en" email="parent@example.com" displayName={null} />,
    );
    expect(
      screen.getByRole('button', { name: /notifications/i }),
    ).toBeInTheDocument();
  });
});
