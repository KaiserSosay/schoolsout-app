import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampApplicationForm } from '@/components/home/CampApplicationForm';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CampApplicationForm />
    </NextIntlClientProvider>,
  );
}

function fillAll() {
  fireEvent.change(screen.getByLabelText(/Camp name/i), {
    target: { value: 'Sunshine Adventure Camp' },
  });
  fireEvent.change(screen.getByLabelText(/Website/i), {
    target: { value: 'https://example.com' },
  });
  fireEvent.change(screen.getByLabelText(/Ages served/i), {
    target: { value: '6-10' },
  });
  fireEvent.change(screen.getByLabelText(/Neighborhood/i), {
    target: { value: 'Coral Gables' },
  });
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: 'owner@example.com' },
  });
}

describe('CampApplicationForm', () => {
  it('disables submit when fields are invalid', () => {
    wrap();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Camp name/i), {
      target: { value: 'X' }, // < 2 chars
    });
    expect(screen.getByRole('button', { name: /Apply/i })).toBeDisabled();
  });

  it('enables submit once all fields are valid', () => {
    wrap();
    fillAll();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeEnabled();
  });

  it('POSTs the full payload to /api/camps/apply', async () => {
    wrap();
    fillAll();
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/camps/apply',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({
      camp_name: 'Sunshine Adventure Camp',
      website: 'https://example.com',
      ages: '6-10',
      neighborhood: 'Coral Gables',
      email: 'owner@example.com',
    });
  });

  it('rejects bad URLs client-side', () => {
    wrap();
    fillAll();
    fireEvent.change(screen.getByLabelText(/Website/i), {
      target: { value: 'not-a-url' },
    });
    expect(screen.getByRole('button', { name: /Apply/i })).toBeDisabled();
  });
});
