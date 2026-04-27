import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import enMessages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/en/schools',
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { SchoolsIndexFilters } from '@/components/public/SchoolsIndexFilters';

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = '';
});

const HOODS = [
  'Aventura',
  'Coral Gables',
  'Coconut Grove',
  'Doral',
  'Hialeah',
  'Kendall',
  'Pinecrest',
  'South Miami',
];

function wrap(props: Parameters<typeof SchoolsIndexFilters>[0]) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SchoolsIndexFilters {...props} />
    </NextIntlClientProvider>,
  );
}

describe('SchoolsIndexFilters — neighborhoods accordion', () => {
  it('renders neighborhoods collapsed by default', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: [] });
    const acc = screen.getByTestId('schools-hood-accordion') as HTMLDetailsElement;
    expect(acc).toBeInTheDocument();
    expect(acc.open).toBe(false);
  });

  it('renders the neighborhoods header with the total count', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: [] });
    const acc = screen.getByTestId('schools-hood-accordion') as HTMLDetailsElement;
    const summary = acc.querySelector('summary')!;
    expect(summary.textContent).toMatch(/Neighborhoods/);
    expect(summary.textContent).toMatch(new RegExp(`\\(${HOODS.length}\\)`));
  });

  it('shows neighborhood pills when expanded', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: [] });
    const acc = screen.getByTestId('schools-hood-accordion') as HTMLDetailsElement;
    acc.open = true;
    expect(screen.getByRole('button', { name: 'Coral Gables' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pinecrest' })).toBeInTheDocument();
  });

  it('auto-expands when a neighborhood filter is active', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: ['Coral Gables'] });
    const acc = screen.getByTestId('schools-hood-accordion') as HTMLDetailsElement;
    expect(acc.open).toBe(true);
  });

  it('keeps school-type pills always visible regardless of accordion state', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: [] });
    // Type chips render outside the <details>, so they're visible whether
    // it's collapsed or not. We assert all 7 are in the DOM.
    expect(screen.getByRole('button', { name: 'Public' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Charter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Magnet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Private' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Religious' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Independent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preschool' })).toBeInTheDocument();
  });

  it('renders no accordion when there are no neighborhoods', () => {
    wrap({ hoods: [], activeTypes: [], activeHoods: [] });
    expect(screen.queryByTestId('schools-hood-accordion')).toBeNull();
  });

  it('uses a real <summary> element for keyboard-accessible toggle', () => {
    wrap({ hoods: HOODS, activeTypes: [], activeHoods: [] });
    const acc = screen.getByTestId('schools-hood-accordion') as HTMLDetailsElement;
    const summary = acc.querySelector('summary');
    expect(summary).not.toBeNull();
  });
});
