import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';
import { yearsLabelForClosures } from '@/lib/schools/calendar-years';

// Mom-test 2026-04-26: TGP page header read "OFFICIAL 2025-2026 CALENDAR"
// while the actual closures in the DB were all 2026-2027. Fix is to derive
// the year from closure rows' school_year and feed it into i18n keys with
// a {years} placeholder. These tests pin the contract:
//
//   1. The new *WithYears keys exist for every frame variant in EN + ES.
//   2. They contain a {years} placeholder so the substitution wires up.
//   3. The no-year fallback keys also exist for the empty-closures case.
//   4. Single-year, multi-year, and zero-year helper outputs match the
//      brief's expected display rules.

function dig(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, seg) => {
    if (
      acc &&
      typeof acc === 'object' &&
      seg in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[seg];
    }
    return undefined;
  }, obj);
}

const yearKeys = [
  'verifiedFrame.eyebrowWithYears',
  'verifiedFrame.eyebrowMdcpsWithYears',
  'unofficialFrame.titleMainWithYears',
  'unofficialFrame.h1WithYears',
];
const noYearKeys = [
  'verifiedFrame.eyebrow',
  'verifiedFrame.eyebrowMdcps',
  'unofficialFrame.titleMain',
  'unofficialFrame.h1',
];

describe('school detail page — years-label i18n contract', () => {
  for (const { name, messages } of [
    { name: 'en', messages: en },
    { name: 'es', messages: es },
  ]) {
    it(`has all *WithYears keys for ${name} with a {years} placeholder`, () => {
      const ns = dig(messages, 'public.school');
      for (const key of yearKeys) {
        const val = dig(ns, key);
        expect(typeof val, `public.school.${key} missing in ${name}`).toBe(
          'string',
        );
        expect(
          (val as string).includes('{years}'),
          `public.school.${key} in ${name} must keep {years} placeholder`,
        ).toBe(true);
      }
    });

    it(`has all no-year fallback keys for ${name} (no {years} placeholder)`, () => {
      const ns = dig(messages, 'public.school');
      for (const key of noYearKeys) {
        const val = dig(ns, key);
        expect(typeof val, `public.school.${key} missing in ${name}`).toBe(
          'string',
        );
        expect(
          (val as string).includes('{years}'),
          `public.school.${key} in ${name} must NOT contain {years} placeholder`,
        ).toBe(false);
      }
    });

    it(`removed every hardcoded "2025–2026" / "2025-2026" from ${name}`, () => {
      const ns = dig(messages, 'public.school');
      // Stringify the school namespace and assert no hardcoded year span
      // sneaks back in. Catches a future edit that "fixes typos" by
      // reverting the placeholder.
      const json = JSON.stringify(ns);
      expect(json.includes('2025–2026')).toBe(false);
      expect(json.includes('2025-2026')).toBe(false);
      expect(json.includes('2026–2027')).toBe(false);
      expect(json.includes('2026-2027')).toBe(false);
    });
  }
});

describe('yearsLabelForClosures — covers brief\'s three cases', () => {
  it('single-year: 17 closures all stamped 2026-2027 → "2026–2027"', () => {
    const closures = Array.from({ length: 17 }, () => ({
      school_year: '2026-2027',
    }));
    expect(yearsLabelForClosures(closures)).toBe('2026–2027');
  });

  it('multi-year: a school with both 2025-2026 and 2026-2027 closures → "2025–2026 · 2026–2027"', () => {
    const closures = [
      { school_year: '2026-2027' },
      { school_year: '2025-2026' },
      { school_year: '2026-2027' },
      { school_year: '2025-2026' },
    ];
    expect(yearsLabelForClosures(closures)).toBe('2025–2026 · 2026–2027');
  });

  it('no-closures: empty list → empty string (placeholder path takes over)', () => {
    expect(yearsLabelForClosures([])).toBe('');
  });
});
