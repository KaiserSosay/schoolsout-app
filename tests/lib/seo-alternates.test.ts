import { describe, it, expect } from 'vitest';
import { publicPageMetadata } from '@/lib/seo';

describe('publicPageMetadata — hreflang alternates', () => {
  it('returns canonical pointing at the current locale', () => {
    const meta = publicPageMetadata({
      locale: 'es',
      path: '/list-your-camp',
      title: 'X',
      description: 'Y',
    });
    expect(meta.alternates?.canonical).toBe(
      'https://schoolsout.net/es/list-your-camp',
    );
  });

  it('emits en-US, es-US, and x-default language alternates', () => {
    const meta = publicPageMetadata({
      locale: 'en',
      path: '/list-your-camp',
      title: 'X',
      description: 'Y',
    });
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toBe('https://schoolsout.net/en/list-your-camp');
    expect(langs['es-US']).toBe('https://schoolsout.net/es/list-your-camp');
    // x-default should fall back to EN per the seo helper's intent.
    expect(langs['x-default']).toBe('https://schoolsout.net/en/list-your-camp');
  });

  it('preserves the path suffix verbatim across locales', () => {
    const meta = publicPageMetadata({
      locale: 'en',
      path: '/camps/sunshine-coral-gables',
      title: 'X',
      description: 'Y',
    });
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toBe(
      'https://schoolsout.net/en/camps/sunshine-coral-gables',
    );
    expect(langs['es-US']).toBe(
      'https://schoolsout.net/es/camps/sunshine-coral-gables',
    );
  });
});
