import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messages from '@/i18n/messages/en.json';

vi.mock('@/lib/confetti', () => ({ celebrate: vi.fn() }));
import { celebrate } from '@/lib/confetti';

import { SetPasswordForm } from '@/components/app/SetPasswordForm';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  }) as unknown as typeof fetch;
});

function wrap(currentlyHasPassword = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SetPasswordForm currentlyHasPassword={currentlyHasPassword} />
    </NextIntlClientProvider>,
  );
}

describe('SetPasswordForm', () => {
  it('renders the "Set" copy when the user has no password', () => {
    wrap(false);
    expect(screen.getByText(/Set a password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Set password$/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Change" copy when the user already has a password', () => {
    wrap(true);
    expect(screen.getByText(/Change your password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Update password$/i }),
    ).toBeInTheDocument();
  });

  it('shows tooShort error and skips fetch when password < 8 chars', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Use at least 8 characters/i,
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows mismatch error when confirm differs from password', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'longenoughpassword' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /two passwords don't match/i,
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('POSTs to /api/auth/set-password and shows success on 200', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        /Password set/i,
      ),
    );
    const fetchMock = global.fetch as unknown as {
      mock: { calls: Parameters<typeof fetch>[] };
    };
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/set-password');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ password: 'a-good-password' });
  });

  it('fires celebrate() when the password set succeeds', async () => {
    vi.mocked(celebrate).mockClear();
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() => expect(celebrate).toHaveBeenCalled());
  });

  it('shows commonPassword error when API responds 400 with too_common', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'too_common' }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /too common/i,
      ),
    );
  });

  it('shows generic error when API responds with an unknown error code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'update_failed' }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Something went wrong/i,
      ),
    );
  });

  it('shows network error when fetch throws', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('boom')) as unknown as typeof fetch;
    wrap();
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: 'a-good-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Couldn't reach/i),
    );
  });

  it('clears the password fields after a successful submit', async () => {
    wrap();
    const newPw = screen.getByLabelText(/^New password$/i) as HTMLInputElement;
    const confirm = screen.getByLabelText(
      /^Confirm new password$/i,
    ) as HTMLInputElement;
    fireEvent.change(newPw, { target: { value: 'a-good-password' } });
    fireEvent.change(confirm, { target: { value: 'a-good-password' } });
    fireEvent.click(screen.getByRole('button', { name: /^Set password$/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument(),
    );
    expect(newPw.value).toBe('');
    expect(confirm.value).toBe('');
  });
});
