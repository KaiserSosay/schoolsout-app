import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { CampCount } from '@/components/camps/CampCount';
import enMessages from '@/i18n/messages/en.json';
import esMessages from '@/i18n/messages/es.json';

function wrap(
  props: Parameters<typeof CampCount>[0],
  locale: 'en' | 'es' = 'en',
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'es' ? esMessages : enMessages}
    >
      <CampCount {...props} />
    </NextIntlClientProvider>,
  );
}

describe('CampCount', () => {
  it('renders just the total when no filters are active', () => {
    wrap({ filtered: 175, total: 175, hasFilters: false });
    const node = screen.getByTestId('camp-count');
    expect(node).toHaveTextContent('175 camps');
    expect(node.textContent).not.toContain('of');
  });

  it('renders "X of N camps" when filters narrow the list', () => {
    wrap({ filtered: 25, total: 175, hasFilters: true });
    const node = screen.getByTestId('camp-count');
    expect(node).toHaveTextContent('25');
    expect(node).toHaveTextContent('of 175 camps');
  });

  it('renders the zero-state hint when filters return nothing', () => {
    wrap({ filtered: 0, total: 175, hasFilters: true });
    const node = screen.getByTestId('camp-count');
    expect(node).toHaveTextContent(/0/);
    expect(node).toHaveTextContent(/try clearing filters/i);
  });

  it('renders Spanish copy on locale=es', () => {
    wrap({ filtered: 25, total: 175, hasFilters: true }, 'es');
    expect(screen.getByTestId('camp-count')).toHaveTextContent(
      /25\s+de 175 campamentos/,
    );
  });

  it('uses singular form when total is 1', () => {
    wrap({ filtered: 1, total: 1, hasFilters: false });
    expect(screen.getByTestId('camp-count')).toHaveTextContent('1 camp');
  });
});
