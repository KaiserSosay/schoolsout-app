import { render, screen, fireEvent, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureRequestModal } from '@/components/FeatureRequestModal';
import messages from '@/i18n/messages/en.json';

function renderModal(props: { isLoggedIn: boolean; presetEmail?: string | null }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FeatureRequestModal {...props} />
    </NextIntlClientProvider>,
  );
}

async function openModal() {
  await act(async () => {
    window.dispatchEvent(new CustomEvent('so-open-feature-request'));
  });
}

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('FeatureRequestModal', () => {
  it('stays closed until the event fires', () => {
    renderModal({ isLoggedIn: false });
    expect(screen.queryByText(/Got an idea\?/)).toBeNull();
  });

  it('opens on so-open-feature-request and shows all 4 category chips', async () => {
    renderModal({ isLoggedIn: false });
    await openModal();
    expect(screen.getAllByText(/Got an idea\? Tell me\./)[0]).toBeInTheDocument();
    expect(screen.getByText(/💡 Idea/)).toBeInTheDocument();
    expect(screen.getByText(/🐛 Something's broken/)).toBeInTheDocument();
    expect(screen.getByText(/❤️ A thing I love/)).toBeInTheDocument();
    expect(screen.getByText(/❓ Question/)).toBeInTheDocument();
  });

  it('shows an email field when not logged in, hides it when logged in', async () => {
    const { unmount } = renderModal({ isLoggedIn: false });
    await openModal();
    expect(screen.getByLabelText(/Your email/)).toBeInTheDocument();
    unmount();

    renderModal({ isLoggedIn: true, presetEmail: 'parent@example.com' });
    await openModal();
    expect(screen.queryByLabelText(/Your email/)).toBeNull();
  });

  it('caps the body at 500 characters with a live counter', async () => {
    renderModal({ isLoggedIn: true });
    await openModal();
    const textarea = screen.getByPlaceholderText(/What would make School's Out!/);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'x'.repeat(600) } });
    });
    expect(screen.getByText('500 / 500')).toBeInTheDocument();
  });

  it('posts to /api/feature-requests and swaps to thank-you state', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: 'fr-x' }) });
    renderModal({ isLoggedIn: true, presetEmail: 'parent@example.com' });
    await openModal();
    const textarea = screen.getByPlaceholderText(/What would make School's Out!/);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'this is an idea' } });
    });
    const submit = screen.getByRole('button', { name: /Send to Noah/ });
    await act(async () => {
      fireEvent.click(submit);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/feature-requests',
      expect.objectContaining({ method: 'POST' }),
    );
    const bodyStr = fetchMock.mock.calls[0][1].body as string;
    const parsed = JSON.parse(bodyStr);
    expect(parsed.body).toBe('this is an idea');
    expect(parsed.category).toBe('idea');

    expect(screen.getByText(/Got it\./)).toBeInTheDocument();
  });
});
