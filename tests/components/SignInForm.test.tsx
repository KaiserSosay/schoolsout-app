import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignInForm } from '@/components/public/SignInForm';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, isReturning: true }),
  }) as unknown as typeof fetch;
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
});
