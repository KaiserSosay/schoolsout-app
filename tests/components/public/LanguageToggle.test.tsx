import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';

import { LanguageToggle } from '@/components/public/LanguageToggle';
import enMessages from '@/i18n/messages/en.json';
import esMessages from '@/i18n/messages/es.json';

// next/navigation hooks are mocked per-test so we can drive the pathname /
// search params and assert the swapped href.
const navigationMocks = vi.hoisted(() => ({
  pathname: '/en',
  search: '',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => new URLSearchParams(navigationMocks.search),
}));

function setNav(pathname: string, search = '') {
  navigationMocks.pathname = pathname;
  navigationMocks.search = search;
}

function wrap(locale: 'en' | 'es') {
  const messages = locale === 'es' ? esMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LanguageToggle currentLocale={locale} />
    </NextIntlClientProvider>,
  );
}

describe('public LanguageToggle', () => {
  it('renders an ES target on EN locale', () => {
    setNav('/en/list-your-camp');
    wrap('en');
    const link = screen.getByTestId('public-language-toggle');
    expect(link).toHaveTextContent('ES');
    expect(link).toHaveAttribute('hreflang', 'es');
    expect(link.getAttribute('aria-label')).toContain('Español');
  });

  it('renders an EN target on ES locale', () => {
    setNav('/es/list-your-camp');
    wrap('es');
    const link = screen.getByTestId('public-language-toggle');
    expect(link).toHaveTextContent('EN');
    expect(link).toHaveAttribute('hreflang', 'en');
    expect(link.getAttribute('aria-label')).toContain('English');
  });

  it('swaps the locale segment in place — preserves the rest of the path', () => {
    setNav('/en/list-your-camp');
    wrap('en');
    const link = screen.getByTestId('public-language-toggle') as HTMLAnchorElement;
    // Test against pathname so we ignore Link's resolved base URL behavior.
    const url = new URL(link.href, 'http://test.local');
    expect(url.pathname).toBe('/es/list-your-camp');
  });

  it('preserves query params when switching locales', () => {
    setNav('/en/camps', 'category=sports&age=8');
    wrap('en');
    const link = screen.getByTestId('public-language-toggle') as HTMLAnchorElement;
    const url = new URL(link.href, 'http://test.local');
    expect(url.pathname).toBe('/es/camps');
    expect(url.searchParams.get('category')).toBe('sports');
    expect(url.searchParams.get('age')).toBe('8');
  });

  it('falls back to the locale root when the pathname has no locale prefix', () => {
    setNav('/some-root-path');
    wrap('en');
    const link = screen.getByTestId('public-language-toggle') as HTMLAnchorElement;
    const url = new URL(link.href, 'http://test.local');
    expect(url.pathname).toBe('/es');
  });
});
