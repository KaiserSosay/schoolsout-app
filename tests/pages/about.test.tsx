import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';

// Minimal contract test for the About page (Goal 3).
// The page is a server component that reads `getTranslations('about')` and
// the Footer reads `landing.footer.nav.about` / `nav.about`. We verify the
// shape of the messages catalogs rather than mounting the server component.
describe('about page i18n keys', () => {
  const requiredAboutKeys = [
    'back',
    'hero.line1',
    'hero.line2Highlight',
    'hero.line3',
    'body.p1',
    'body.p2',
    'body.p3',
    'body.p4',
    'body.p5',
    'body.p6',
    'links.youtubeLabel',
    'links.youtubeTitle',
    'links.websiteLabel',
    'links.websiteTitle',
    'links.mottoLabel',
    'links.mottoTitle',
    'signature',
  ];

  function dig(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, seg) => {
      if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[seg];
      }
      return undefined;
    }, obj);
  }

  for (const locale of [
    { name: 'en', messages: en },
    { name: 'es', messages: es },
  ]) {
    it(`has every about.* key in ${locale.name}`, () => {
      const aboutNs = (locale.messages as Record<string, unknown>).about;
      expect(aboutNs, `about namespace missing in ${locale.name}`).toBeTruthy();
      for (const key of requiredAboutKeys) {
        const val = dig(aboutNs, key);
        expect(typeof val, `about.${key} missing or not string in ${locale.name}`).toBe('string');
        expect((val as string).length, `about.${key} empty in ${locale.name}`).toBeGreaterThan(0);
      }
    });

    it(`has nav.about in ${locale.name}`, () => {
      const val = dig(locale.messages, 'nav.about');
      expect(typeof val, `nav.about missing in ${locale.name}`).toBe('string');
    });

    it(`has landing.footer.nav.about in ${locale.name}`, () => {
      const val = dig(locale.messages, 'landing.footer.nav.about');
      expect(typeof val, `landing.footer.nav.about missing in ${locale.name}`).toBe('string');
    });
  }
});
