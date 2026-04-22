import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveCampButton } from '@/components/app/SaveCampButton';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/camps',
  useSearchParams: () => new URLSearchParams(),
}));

function wrap(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('SaveCampButton', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, saved: true }),
    }) as unknown as typeof fetch;
  });

  it('POSTs /api/saved-camps with the camp_id + next saved state', async () => {
    wrap(
      <SaveCampButton
        campId="00000000-0000-0000-0000-000000000abc"
        campName="Frost"
        initiallySaved={false}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(btn);

    await waitFor(() => {
      const mock = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(mock.mock.calls.length).toBe(1);
    });

    const mock = global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    };
    const [url, init] = mock.mock.calls[0];
    expect(url).toBe('/api/saved-camps');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      camp_id: '00000000-0000-0000-0000-000000000abc',
      saved: true,
    });
  });

  it('optimistically flips to saved=true immediately on click', async () => {
    wrap(
      <SaveCampButton
        campId="00000000-0000-0000-0000-000000000abc"
        campName="Frost"
        initiallySaved={false}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn);
    // After the click, the label + aria-pressed should flip without waiting
    // for fetch to resolve.
    await waitFor(() => {
      const after = screen.getByRole('button');
      expect(after.getAttribute('aria-pressed')).toBe('true');
    });
  });

  it('rolls back to unsaved on a 401 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    }) as unknown as typeof fetch;

    wrap(
      <SaveCampButton
        campId="00000000-0000-0000-0000-000000000abc"
        campName="Frost"
        initiallySaved={false}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(btn);
    await waitFor(() => {
      const after = screen.getByRole('button');
      expect(after.getAttribute('aria-pressed')).toBe('false');
    });
  });
});
