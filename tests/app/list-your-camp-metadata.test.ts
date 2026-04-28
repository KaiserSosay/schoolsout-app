import { describe, it, expect, vi } from 'vitest';
import enMessages from '@/i18n/messages/en.json';
import esMessages from '@/i18n/messages/es.json';

// jsdom test environment trips next-intl's client-context guard, so stub the
// server-side translator with the actual message bundles for this metadata
// smoke test.
vi.mock('next-intl/server', () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: string;
    namespace: string;
  }) => {
    const all = (locale === 'es' ? esMessages : enMessages) as Record<
      string,
      unknown
    >;
    const ns = namespace
      .split('.')
      .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], all) as Record<
      string,
      string
    >;
    return (key: string) => ns[key];
  },
}));

import { generateMetadata } from '@/app/[locale]/list-your-camp/page';

// Goal 3 of the bilingual-site work: every public page that has an EN/ES
// counterpart must declare hreflang alternates so Google can rank the right
// locale for Spanish-language searches like "lista tu campamento Miami."
describe('list-your-camp generateMetadata', () => {
  it('returns hreflang alternates for both locales (EN current)', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toBe(
      'https://schoolsout.net/en/list-your-camp',
    );
    expect(langs['es-US']).toBe(
      'https://schoolsout.net/es/list-your-camp',
    );
    expect(langs['x-default']).toBe(
      'https://schoolsout.net/en/list-your-camp',
    );
    expect(meta.alternates?.canonical).toBe(
      'https://schoolsout.net/en/list-your-camp',
    );
  });

  it('flips canonical to the ES URL when locale is es', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'es' }),
    });
    expect(meta.alternates?.canonical).toBe(
      'https://schoolsout.net/es/list-your-camp',
    );
  });
});
