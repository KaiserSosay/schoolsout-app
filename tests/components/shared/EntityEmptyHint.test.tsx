import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import enMessages from '@/i18n/messages/en.json';

const pushMock = vi.fn();
let currentSearch = '';
let currentPathname = '/en/camps';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

import { EntityEmptyHint } from '@/components/shared/EntityEmptyHint';

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = '';
  currentPathname = '/en/camps';
});

function wrap(props: Parameters<typeof EntityEmptyHint>[0]) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <EntityEmptyHint {...props} />
    </NextIntlClientProvider>,
  );
}

describe('EntityEmptyHint — camps namespace', () => {
  it('renders the title and recovery hint', () => {
    wrap({
      hasSearchTerm: true,
      i18nNamespace: 'camps.filters.empty',
      testId: 'camps-empty-hint',
    });
    expect(screen.getByTestId('camps-empty-hint')).toHaveTextContent(/No camps match/i);
    expect(screen.getByTestId('camps-empty-hint')).toHaveTextContent(/clearing filters/i);
  });

  it('clearing filters pushes the bare path', async () => {
    currentSearch = 'q=frost&cats=STEM';
    wrap({
      hasSearchTerm: true,
      i18nNamespace: 'camps.filters.empty',
      testId: 'camps-empty-hint',
    });
    fireEvent.click(screen.getByRole('button', { name: /clearing filters/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/en/camps'));
  });

  it('clearing search keeps the other params', async () => {
    currentSearch = 'q=frost&cats=STEM';
    wrap({
      hasSearchTerm: true,
      i18nNamespace: 'camps.filters.empty',
      testId: 'camps-empty-hint',
    });
    fireEvent.click(screen.getByRole('button', { name: /searching by name instead/i }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/en/camps?cats=STEM'),
    );
  });

  it('renders the search hint as plain text when there is no search term', () => {
    wrap({
      hasSearchTerm: false,
      i18nNamespace: 'camps.filters.empty',
      testId: 'camps-empty-hint',
    });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('EntityEmptyHint — schools namespace', () => {
  it('renders the schools-specific title and body from the supplied namespace', () => {
    currentPathname = '/en/schools';
    wrap({
      hasSearchTerm: true,
      i18nNamespace: 'public.schoolsIndex.empty',
      testId: 'schools-empty-hint',
    });
    expect(screen.getByTestId('schools-empty-hint')).toHaveTextContent(/No schools match/i);
  });

  it('clearing filters from schools pushes /en/schools', async () => {
    currentPathname = '/en/schools';
    currentSearch = 'q=coral&type=public';
    wrap({
      hasSearchTerm: true,
      i18nNamespace: 'public.schoolsIndex.empty',
      testId: 'schools-empty-hint',
    });
    fireEvent.click(screen.getByRole('button', { name: /clearing filters/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/en/schools'));
  });
});
