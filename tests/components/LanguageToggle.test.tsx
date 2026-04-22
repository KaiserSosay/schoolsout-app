import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { LanguageToggle } from '@/components/LanguageToggle';

function wrap(locale: 'en' | 'es') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <LanguageToggle currentLocale={locale} />
    </NextIntlClientProvider>
  );
}

describe('LanguageToggle', () => {
  it('shows both locale options', () => {
    wrap('en');
    expect(screen.getByRole('link', { name: /EN/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ES/ })).toBeInTheDocument();
  });

  it('marks current locale as active', () => {
    wrap('es');
    const es = screen.getByRole('link', { name: /ES/ });
    expect(es).toHaveAttribute('aria-current', 'page');
  });
});
