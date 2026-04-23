import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { FamilyCalendarStrip } from '@/components/app/FamilyCalendarStrip';
import messages from '@/i18n/messages/en.json';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app',
}));

const closures = [
  {
    id: 'closure-memorial',
    name: 'Memorial Day',
    start_date: '2026-05-25',
    end_date: '2026-05-25',
    emoji: '🇺🇸',
    schoolName: 'The Growing Place',
  },
  {
    id: 'closure-summer',
    name: 'Summer Break',
    start_date: '2026-06-08',
    end_date: '2026-08-16',
    emoji: '☀️',
    schoolName: null,
  },
] as never;

function renderStrip() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FamilyCalendarStrip closures={closures} locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('FamilyCalendarStrip', () => {
  it('wraps each closure card in a Link with the detail page href', () => {
    renderStrip();
    const memorial = screen.getByRole('link', { name: /Open Memorial Day/ });
    expect(memorial.getAttribute('href')).toBe('/en/app/closures/closure-memorial');
    const summer = screen.getByRole('link', { name: /Open Summer Break/ });
    expect(summer.getAttribute('href')).toBe('/en/app/closures/closure-summer');
  });

  it('applies a focus-visible ring + hover-shadow class for a11y', () => {
    const { container } = renderStrip();
    const links = container.querySelectorAll('a');
    for (const a of Array.from(links)) {
      expect(a.className).toMatch(/focus-visible:ring/);
      expect(a.className).toMatch(/hover:shadow-md/);
    }
  });
});
