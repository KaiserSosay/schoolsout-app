import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  alternativesForClosure,
  renderDeepLink,
  type ExternalAlternative,
} from '@/lib/externalAlternatives';

// Freeze "today" so days-until calculations are deterministic.
const NOW = new Date('2026-04-23T12:00:00Z');
beforeAll(() => {
  // @ts-expect-error test-only monkey-patch
  globalThis._Date = Date;
  class MockDate extends Date {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) {
        super(NOW);
      } else {
        super(...(args as [number]));
      }
    }
    static now() {
      return NOW.getTime();
    }
  }
  // @ts-expect-error test-only
  globalThis.Date = MockDate;
});
afterAll(() => {
  // @ts-expect-error test-only
  globalThis.Date = globalThis._Date;
});

const alts: ExternalAlternative[] = [
  {
    id: 'sitter',
    type: 'sitter_service',
    name: 'Care.com',
    provider: 'Care.com',
    description: null,
    deep_link_template: 'https://care.com/{{zip}}?s={{start}}&e={{end}}',
    duration_days: null,
    departure_city: null,
    min_lead_days: 0,
    price_from_cents: null,
  },
  {
    id: 'cr3',
    type: 'cruise',
    name: '3n Bahamas',
    provider: 'RCL',
    description: null,
    deep_link_template: 'https://rc/{{start}}',
    duration_days: 3,
    departure_city: 'Miami',
    min_lead_days: 14,
    price_from_cents: 49900,
  },
  {
    id: 'cr4',
    type: 'cruise',
    name: '4n',
    provider: 'Celebrity',
    description: null,
    deep_link_template: 'https://celebrity/{{start}}',
    duration_days: 4,
    departure_city: 'Miami',
    min_lead_days: 30,
    price_from_cents: 79900,
  },
  {
    id: 'resort',
    type: 'resort',
    name: 'Atlantis',
    provider: 'Atlantis',
    description: null,
    deep_link_template: 'https://atlantis/',
    duration_days: 3,
    departure_city: null,
    min_lead_days: 30,
    price_from_cents: 120000,
  },
];

describe('alternativesForClosure', () => {
  it('1-day closure near-term → sitter only', () => {
    const out = alternativesForClosure(
      { start_date: '2026-05-25', end_date: '2026-05-25' },
      alts,
    );
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('sitter_service');
  });

  it('1-day closure 70+ days out → nothing (too far for sitter)', () => {
    const out = alternativesForClosure(
      { start_date: '2026-07-04', end_date: '2026-07-04' },
      alts,
    );
    expect(out).toHaveLength(0);
  });

  it('3-day closure 14+ days out → 3-night cruise + Atlantis, not the 4-night', () => {
    const out = alternativesForClosure(
      { start_date: '2026-05-25', end_date: '2026-05-27' },
      alts,
    );
    const ids = out.map((a) => a.id);
    expect(ids).toContain('cr3');
    expect(ids).not.toContain('cr4'); // 4-nighter > 3-day span
    expect(ids).toContain('resort');
  });

  it('5-day closure 30+ days out → both 3n + 4n cruises + resort', () => {
    const out = alternativesForClosure(
      { start_date: '2026-05-25', end_date: '2026-05-29' },
      alts,
    );
    const ids = out.map((a) => a.id);
    expect(ids).toContain('cr3');
    expect(ids).toContain('cr4');
    expect(ids).toContain('resort');
  });

  it('3-day closure happening tomorrow → excludes cruises with 14/30d lead', () => {
    const out = alternativesForClosure(
      { start_date: '2026-04-24', end_date: '2026-04-26' },
      alts,
    );
    expect(out).toHaveLength(0); // 1 day out < min_lead_days
  });

  it('2-day closure → nothing (spec: only 1-day sitters or 3+ day trips)', () => {
    const out = alternativesForClosure(
      { start_date: '2026-05-25', end_date: '2026-05-26' },
      alts,
    );
    expect(out).toHaveLength(0);
  });
});

describe('renderDeepLink', () => {
  it('fills zip + start + end placeholders', () => {
    const url = renderDeepLink(
      'https://care.com/{{zip}}?s={{start}}&e={{end}}',
      { zip: '33134', start: '2026-05-25', end: '2026-05-25' },
    );
    expect(url).toBe('https://care.com/33134?s=2026-05-25&e=2026-05-25');
  });

  it('empty zip substitutes empty string', () => {
    const url = renderDeepLink('https://care.com/{{zip}}', {
      zip: null,
      start: '2026-05-25',
      end: '2026-05-25',
    });
    expect(url).toBe('https://care.com/');
  });
});
