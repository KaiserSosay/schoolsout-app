import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { CampCompletenessBadge } from '@/components/app/CampCompletenessBadge';
import messages from '@/i18n/messages/en.json';

function wrap(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('CampCompletenessBadge', () => {
  it('renders nothing when band is complete', () => {
    const { container } = wrap(
      <CampCompletenessBadge
        band="complete"
        missing={[]}
        campName="Test Camp"
        campSlug="test-camp"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a muted "Missing: ..." line when partial', () => {
    wrap(
      <CampCompletenessBadge
        band="partial"
        missing={['phone', 'hours']}
        campName="Test Camp"
        campSlug="test-camp"
      />,
    );
    const el = screen.getByTestId('camp-completeness-partial');
    expect(el).toHaveTextContent(/phone/i);
    expect(el).toHaveTextContent(/hours/i);
  });

  it('renders an actionable button when limited and dispatches the open event with preset detail', () => {
    const listener = vi.fn();
    window.addEventListener('so-open-feature-request', listener);
    try {
      wrap(
        <CampCompletenessBadge
          band="limited"
          missing={['phone', 'address', 'hours']}
          campName="Test Camp"
          campSlug="test-camp"
        />,
      );
      const btn = screen.getByTestId('camp-completeness-limited');
      expect(btn.tagName).toBe('BUTTON');
      fireEvent.click(btn);
      expect(listener).toHaveBeenCalledTimes(1);
      const evt = listener.mock.calls[0][0] as CustomEvent;
      expect(evt.detail.category).toBe('correction');
      expect(evt.detail.pagePath).toBe('/en/app/camps/test-camp');
      expect(evt.detail.bodyDraft).toMatch(/Test Camp/);
    } finally {
      window.removeEventListener('so-open-feature-request', listener);
    }
  });
});
