import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messages from '@/i18n/messages/en.json';
import { SchoolCalendarSubmissionForm } from '@/components/public/SchoolCalendarSubmissionForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/schools/the-growing-place',
}));

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ id: 'sub-1', domain_verified: false }),
  }) as unknown as typeof fetch;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolCalendarSubmissionForm
        schoolSlug="the-growing-place"
        schoolName="The Growing Place"
      />
    </NextIntlClientProvider>,
  );
}

describe('SchoolCalendarSubmissionForm', () => {
  it('renders collapsed by default with the CTA link', () => {
    wrap();
    expect(screen.getByTestId('calendar-submission-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('submission-email')).toBeNull();
  });

  it('expands the form on CTA click', () => {
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    expect(screen.getByTestId('submission-email')).toBeInTheDocument();
    expect(screen.getByTestId('submission-updates')).toBeInTheDocument();
  });

  it('POSTs the submission and shows the success panel', async () => {
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    fireEvent.change(screen.getByTestId('submission-email'), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.click(screen.getByTestId('submission-role-parent'));
    fireEvent.change(screen.getByTestId('submission-updates'), {
      target: { value: 'Spring break is March 23-27, 2026.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send to school's out!/i }));
    await waitFor(() =>
      expect(screen.getByTestId('calendar-submission-success')).toBeInTheDocument(),
    );
    expect(screen.getByText(/got it!/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/schools/the-growing-place/calendar-submissions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows the domain-verified note in the success state when API returns true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'sub-1', domain_verified: true }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    fireEvent.change(screen.getByTestId('submission-email'), {
      target: { value: 'principal@thegrowingplace.school' },
    });
    fireEvent.click(screen.getByTestId('submission-role-principal'));
    fireEvent.change(screen.getByTestId('submission-updates'), {
      target: { value: 'New PDF attached.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send to school's out!/i }));
    await waitFor(() =>
      expect(screen.getByTestId('calendar-submission-success')).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/email matches.*the growing place/i),
    ).toBeInTheDocument();
  });

  it('shows the error panel on a non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'db_error' }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    fireEvent.change(screen.getByTestId('submission-email'), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.click(screen.getByTestId('submission-role-parent'));
    fireEvent.change(screen.getByTestId('submission-updates'), {
      target: { value: 'Spring break is March 23-27.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send to school's out!/i }));
    await waitFor(() =>
      expect(screen.getByTestId('submission-error')).toBeInTheDocument(),
    );
  });

  it('shows the rate-limit error on 429', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rate_limited' }),
    }) as unknown as typeof fetch;
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    fireEvent.change(screen.getByTestId('submission-email'), {
      target: { value: 'mom@example.com' },
    });
    fireEvent.click(screen.getByTestId('submission-role-parent'));
    fireEvent.change(screen.getByTestId('submission-updates'), {
      target: { value: 'spam' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send to school's out!/i }));
    await waitFor(() =>
      expect(screen.getByText(/slow down/i)).toBeInTheDocument(),
    );
  });

  it('disables submit until email + role + updates all set', () => {
    wrap();
    fireEvent.click(screen.getByTestId('calendar-submission-cta'));
    const submit = screen.getByRole('button', { name: /send to school's out!/i });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId('submission-email'), {
      target: { value: 'a@b.com' },
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('submission-role-parent'));
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId('submission-updates'), {
      target: { value: 'something' },
    });
    expect((submit as HTMLButtonElement).disabled).toBe(false);
  });
});
