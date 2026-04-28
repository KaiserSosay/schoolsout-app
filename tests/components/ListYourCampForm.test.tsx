import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/confetti', () => ({ celebrate: vi.fn() }));
import { celebrate } from '@/lib/confetti';

import { ListYourCampForm } from '@/components/ListYourCampForm';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as typeof fetch;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ListYourCampForm />
    </NextIntlClientProvider>,
  );
}

describe('ListYourCampForm — quality accordion', () => {
  it('renders the accordion in collapsed state by default', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    expect(acc).toBeInTheDocument();
    expect(acc.open).toBe(false);
  });

  it('reveals sessions, social, scholarships, accommodations, testimonials on expand', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;
    expect(screen.getByTestId('session-row-0')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook URL')).toBeInTheDocument();
    expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Need-based scholarships available'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Special accommodations/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Reviews or testimonials'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('photos-deferred')).toBeInTheDocument();
  });

  it('adds and removes session rows up to MAX_SESSIONS', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;
    const addBtn = screen.getByTestId('add-session');
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    expect(screen.getByTestId('session-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('session-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('session-row-2')).toBeInTheDocument();
    // remove the second row
    const removeBtn = screen.getByLabelText('Remove session 2');
    fireEvent.click(removeBtn);
    expect(screen.queryByTestId('session-row-2')).toBeNull();
  });

  it('submits a payload that includes social handles, testimonials, and a populated session', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });

    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;

    fireEvent.change(screen.getByLabelText('Instagram'), {
      target: { value: '@sunshinecamp' },
    });
    fireEvent.change(screen.getByLabelText('Reviews or testimonials'), {
      target: { value: 'Best summer ever — Parent of camper' },
    });
    fireEvent.change(screen.getByLabelText('Session name'), {
      target: { value: 'Summer Week 1' },
    });
    fireEvent.change(screen.getByLabelText('Start date'), {
      target: { value: '2026-06-08' },
    });
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2026-06-12' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(init.body);
    expect(payload.instagram_handle).toBe('@sunshinecamp');
    expect(payload.testimonials).toBe('Best summer ever — Parent of camper');
    expect(payload.sessions).toEqual([
      {
        name: 'Summer Week 1',
        start_date: '2026-06-08',
        end_date: '2026-06-12',
        age_min: null,
        age_max: null,
        capacity: null,
      },
    ]);
  });

  it('does not block submit when URL inputs hold a bare-domain value (HTML5 validation regression)', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });
    // Operator types domain without a protocol — the bug was that the
    // browser blocked submit here, so the fetch never fired.
    fireEvent.change(screen.getByLabelText(/^Website$/), {
      target: { value: 'mycamp.com' },
    });
    fireEvent.change(screen.getByLabelText(/Direct registration URL/), {
      target: { value: 'mycamp.com/signup' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    // normalizeUrl prepends https:// so the server's strict zod .url()
    // accepts the value.
    expect(payload.website).toBe('https://mycamp.com');
    expect(payload.registration_url).toBe('https://mycamp.com/signup');
  });

  it('preserves http:// and https:// URLs without double-prefixing', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    fireEvent.change(screen.getByLabelText(/^Website$/), {
      target: { value: 'https://example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Direct registration URL/), {
      target: { value: 'http://example.com/r' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.website).toBe('https://example.com');
    expect(payload.registration_url).toBe('http://example.com/r');
  });

  it('fires celebrate() when the submission succeeds', async () => {
    vi.mocked(celebrate).mockClear();
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => expect(celebrate).toHaveBeenCalled());
  });

  it('drops empty session rows from the submitted payload', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    // Don't expand the accordion — default empty session row should be dropped.
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.sessions).toEqual([]);
  });
});
