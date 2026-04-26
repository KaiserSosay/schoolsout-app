import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/en/app',
}));

const signOutMock = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabase: () => ({ auth: { signOut: signOutMock } }),
}));

vi.mock('@/components/app/PwaInstallButton', () => ({
  PwaInstallButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

import { ModeProvider } from '@/components/app/ModeProvider';
import { UserMenuItems } from '@/components/app/UserMenu';

function renderMenu(onAction = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>
        <UserMenuItems
          locale="en"
          email="parent@example.com"
          displayName="Parent"
          onAction={onAction}
        />
      </ModeProvider>
    </NextIntlClientProvider>,
  );
}

describe('UserMenuItems', () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    signOutMock.mockClear();
  });

  it('renders a "Log out of all devices" button alongside the regular log out', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /^log out$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /log out of all devices/i })).toBeTruthy();
  });

  it('opens a confirmation dialog when "Log out of all devices" is clicked', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /log out of all devices/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/log out everywhere\?/i)).toBeTruthy();
  });

  it('cancel closes the dialog without signing out', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /log out of all devices/i }));
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('confirm calls signOut with scope: "global" and redirects', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /log out of all devices/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, sign me out/i }));
    await waitFor(() => expect(signOutMock).toHaveBeenCalled());
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'global' });
    expect(pushMock).toHaveBeenCalledWith('/en');
  });

  it('regular log out still calls signOut without a scope', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /^log out$/i }));
    await waitFor(() => expect(signOutMock).toHaveBeenCalled());
    expect(signOutMock).toHaveBeenCalledWith();
  });
});
