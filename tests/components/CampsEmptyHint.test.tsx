import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import enMessages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/en/camps',
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { CampsEmptyHint } from '@/components/camps/CampsEmptyHint';

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = '';
});

function wrap(hasSearchTerm: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <CampsEmptyHint hasSearchTerm={hasSearchTerm} />
    </NextIntlClientProvider>,
  );
}

describe('CampsEmptyHint', () => {
  it('renders the title and recovery hint', () => {
    wrap(true);
    expect(screen.getByTestId('camps-empty-hint')).toHaveTextContent(/No camps match/i);
    expect(screen.getByTestId('camps-empty-hint')).toHaveTextContent(/clearing filters/i);
  });

  it('clearing filters pushes the bare path', async () => {
    currentSearch = 'q=frost&cats=STEM';
    wrap(true);
    fireEvent.click(screen.getByRole('button', { name: /clearing filters/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/en/camps'));
  });

  it('clearing search keeps the other params', async () => {
    currentSearch = 'q=frost&cats=STEM';
    wrap(true);
    fireEvent.click(screen.getByRole('button', { name: /searching by name instead/i }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/en/camps?cats=STEM'),
    );
  });

  it('renders the search hint as plain text when there is no search term', () => {
    wrap(false);
    // Only one button: the "clearing filters" one.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
