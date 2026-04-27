import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';

// Contract tests for the public /schools index. The page itself is a server
// component and we don't mount it under jsdom — rendering React server
// components without a real Next runtime is fragile. Instead we lock the
// shape of the i18n messages catalog (every key the page reads) so a typo
// or a missing locale gets caught at test time.

describe('public.schoolsIndex i18n keys', () => {
  const required = [
    'title',
    'subtitle',
    'empty',
    'mdcpsBadge',
    'count.total',
    'count.filtered',
    'filters.typeLabel',
    'filters.hoodLabel',
    'filters.neighborhoodsHeader',
    'filters.neighborhoodsAriaExpand',
    'filters.neighborhoodsAriaCollapse',
    'filters.types.public',
    'filters.types.charter',
    'filters.types.magnet',
    'filters.types.private',
    'filters.types.religious',
    'filters.types.independent',
    'filters.types.preschool',
  ];
  function dig(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, seg) => {
      if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[seg];
      }
      return undefined;
    }, obj);
  }
  for (const { name, messages } of [
    { name: 'en', messages: en },
    { name: 'es', messages: es },
  ]) {
    it(`has every public.schoolsIndex.* key in ${name}`, () => {
      const ns = dig(messages, 'public.schoolsIndex');
      expect(ns, `public.schoolsIndex missing in ${name}`).toBeTruthy();
      for (const key of required) {
        const val = dig(ns, key);
        expect(typeof val, `public.schoolsIndex.${key} missing or non-string in ${name}`).toBe('string');
        expect((val as string).length, `public.schoolsIndex.${key} empty in ${name}`).toBeGreaterThan(0);
      }
    });

    it(`has the Schools footer link label in ${name}`, () => {
      expect(dig(messages, 'footer.columns.explore.schools')).toBeTruthy();
    });
  }
});
