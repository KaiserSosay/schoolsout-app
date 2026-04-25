import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CityRequestForm } from '@/components/home/CityRequestForm';
import { ModeProvider } from '@/components/home/ModeContext';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>
        <CityRequestForm />
      </ModeProvider>
    </NextIntlClientProvider>,
  );
}

describe('CityRequestForm', () => {
  it('disables submit until email + city are valid', () => {
    wrap();
    const btn = screen.getByRole('button', { name: /Request my city/i });
    expect(btn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/parent@example.com/i), {
      target: { value: 'a@b.com' },
    });
    expect(btn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/City/i), {
      target: { value: 'Orlando' },
    });
    expect(btn).toBeEnabled();
  });

  it('POSTs {email, city, state} to /api/city-request', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText(/parent@example.com/i), {
      target: { value: 'city@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/City/i), {
      target: { value: 'Orlando' },
    });
    fireEvent.change(screen.getByPlaceholderText(/State/i), {
      target: { value: 'FL' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request my city/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/city-request',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ email: 'city@example.com', city: 'Orlando', state: 'FL' });
  });

  it('omits state when blank', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText(/parent@example.com/i), {
      target: { value: 'city@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/City/i), {
      target: { value: 'Orlando' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request my city/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).not.toHaveProperty('state');
  });

  // Phase 3.0 / Item 3.6 — optional school field
  it('omits school when blank (school is optional, submit still works)', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText(/parent@example.com/i), {
      target: { value: 'city@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/City/i), {
      target: { value: 'Orlando' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request my city/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).not.toHaveProperty('school');
  });

  it('includes school in POST when filled', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText(/parent@example.com/i), {
      target: { value: 'city@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/City/i), {
      target: { value: 'Orlando' },
    });
    fireEvent.change(screen.getByPlaceholderText(/What school does your kid attend/i), {
      target: { value: 'Orlando Magnet School' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Request my city/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ school: 'Orlando Magnet School' });
  });
});
