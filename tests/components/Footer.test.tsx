import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';

// Phase 2.7.1 — public-aware footer contract.
// Verifies every `footer.*` key the Footer component reads exists in
// both locales. We check i18n shape rather than mounting the component;
// the Footer is a client component that depends on NextIntlClientProvider
// and window, and a shape test catches every realistic regression.
describe('footer i18n keys', () => {
  const required = [
    'columns.explore.title',
    'columns.explore.camps',
    'columns.explore.breaks',
    'columns.explore.cities',
    'columns.explore.verify',
    'columns.camps.title',
    'columns.camps.list',
    'columns.camps.whyList',
    'columns.parents.title',
    'columns.parents.reminders',
    'columns.parents.howItWorks',
    'columns.parents.plan',
    'columns.about.title',
    'columns.about.aboutNoah',
    'columns.about.idea',
    'columns.about.privacy',
    'columns.about.terms',
    'bottom.copyright',
    'bottom.motto',
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
    { name: 'en', messages: en as Record<string, unknown> },
    { name: 'es', messages: es as Record<string, unknown> },
  ]) {
    it(`has every footer.* key in ${locale.name}`, () => {
      const ns = locale.messages.footer;
      expect(ns, `footer namespace missing in ${locale.name}`).toBeTruthy();
      for (const key of required) {
        const val = dig(ns, key);
        expect(typeof val, `footer.${key} missing or not string in ${locale.name}`).toBe('string');
        expect(
          (val as string).length,
          `footer.${key} empty in ${locale.name}`,
        ).toBeGreaterThan(0);
      }
    });
  }
});
