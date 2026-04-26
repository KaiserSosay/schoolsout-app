import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/en/sign-in',
}));

import { SignInForm } from '@/components/public/SignInForm';

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, isReturning: true }),
  }) as unknown as typeof fetch;
  // Reset localStorage so the tab pref doesn't leak between tests.
  try {
    localStorage.clear();
  } catch {
    /* noop */
  }
});

function wrap(next = '/en/app') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SignInForm locale="en" next={next} />
    </NextIntlClientProvider>,
  );
}

describe('SignInForm', () => {
  it('renders the email field with autofocus and tabIndex 1', () => {
    wrap();
    const input = screen.getByLabelText(/Your email/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.tabIndex).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it('submits the email + locale + next to /api/auth/sign-in', async () => {
    wrap('/en/app/camps/frost-science');
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: 'a@b.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send me a link/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/sign-in',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const body = JSON.parse(
      (global.fetch as unknown as { mock: { calls: unknown[][] } }).mock
        .calls[0][1] && (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body).toMatchObject({
      email: 'a@b.com',
      locale: 'en',
      next: '/en/app/camps/frost-science',
    });
  });

  it('shows the success pane after a successful submit', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send me a link/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/Check your email/i),
    );
  });

  it('shows an inline error if email is empty', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /Send me a link/i }));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Please enter your email/i);
  });

  it('renders both magic-link and password tabs', () => {
    wrap();
    expect(screen.getByRole('tab', { name: /Email me a link/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Use my password/i })).toBeInTheDocument();
  });

  it('shows the password input when the password tab is selected', () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /Use my password/i }));
    expect(screen.getByLabelText(/Your password/i)).toBeInTheDocument();
  });

  it('POSTs to /api/auth/sign-in-with-password on password submit and pushes next on success', async () => {
    wrap('/en/app/camps/frost');
    fireEvent.click(screen.getByRole('tab', { name: /Use my password/i }));
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Your password/i), {
      target: { value: 'miamicoralgables' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/sign-in-with-password',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/en/app/camps/frost'));
  });

  it('shows the friendly fallback when password is wrong (401)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_credentials' }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /Use my password/i }));
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Your password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    await waitFor(() =>
      expect(screen.getByText(/that password didn't work/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /send a magic link instead/i }),
    ).toBeInTheDocument();
  });

  it('the friendly fallback button switches back to the magic-link tab', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /Use my password/i }));
    fireEvent.change(screen.getByLabelText(/Your email/i), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Your password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    const switchBtn = await screen.findByRole('button', {
      name: /send a magic link instead/i,
    });
    fireEvent.click(switchBtn);
    expect(
      (
        screen.getByRole('tab', { name: /Email me a link/i }) as HTMLButtonElement
      ).getAttribute('aria-selected'),
    ).toBe('true');
  });
});
