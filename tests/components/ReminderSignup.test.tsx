import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderSignup } from '@/components/ReminderSignup';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ReminderSignup schoolId="school-123" locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('ReminderSignup', () => {
  it('submits email + school_id + age_range + consent to /api/reminders/subscribe', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText('parent@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByLabelText(/I'm a parent/i));
    fireEvent.click(screen.getByRole('button', { name: /Remind me/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders/subscribe',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ email: 'a@b.com', school_id: 'school-123', age_range: 'all', locale: 'en' });
  });

  it('does not submit if consent unchecked', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText('parent@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Remind me/i }));
    await new Promise((r) => setTimeout(r, 50));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
