import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampFilters } from '@/components/app/CampFilters';
import { ModeProvider } from '@/components/app/ModeProvider';
import messages from '@/i18n/messages/en.json';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => '/en/app/camps',
  useSearchParams: () => new URLSearchParams(),
}));

function wrap(active: string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeProvider>
        <CampFilters active={active} />
      </ModeProvider>
    </NextIntlClientProvider>,
  );
}

describe('CampFilters', () => {
  beforeEach(() => push.mockReset());

  it('marks active chips as aria-pressed=true', () => {
    wrap(['STEM']);
    const stem = screen.getByRole('button', { name: 'STEM' });
    expect(stem.getAttribute('aria-pressed')).toBe('true');
    const art = screen.getByRole('button', { name: 'Art' });
    expect(art.getAttribute('aria-pressed')).toBe('false');
  });

  it('adds a category to the URL when tapped', () => {
    wrap([]);
    fireEvent.click(screen.getByRole('button', { name: 'STEM' }));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toBe('/en/app/camps?categories=STEM');
  });

  it('removes a category from the URL when tapped again', () => {
    wrap(['STEM']);
    fireEvent.click(screen.getByRole('button', { name: 'STEM' }));
    expect(push).toHaveBeenCalledWith('/en/app/camps');
  });

  it('appends additional categories as a comma-separated list', () => {
    wrap(['STEM']);
    fireEvent.click(screen.getByRole('button', { name: 'Art' }));
    const target = push.mock.calls[0][0] as string;
    expect(target.startsWith('/en/app/camps?categories=')).toBe(true);
    const csv = new URL('http://x' + target).searchParams.get('categories') ?? '';
    const parts = csv.split(',');
    expect(parts.sort()).toEqual(['Art', 'STEM']);
  });
});
