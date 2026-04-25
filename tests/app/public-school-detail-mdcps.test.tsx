import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';

const verifiedKeys = [
  'verifiedFrame.badge',
  'verifiedFrame.mdcpsBadge',
  'verifiedFrame.sectionTitle',
];

function dig(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[seg];
    }
    return undefined;
  }, obj);
}

describe('verified school template — i18n contract', () => {
  for (const { name, messages } of [
    { name: 'en', messages: en },
    { name: 'es', messages: es },
  ]) {
    it(`has verified-frame keys in ${name}`, () => {
      const ns = dig(messages, 'public.school');
      expect(ns).toBeTruthy();
      for (const key of verifiedKeys) {
        const val = dig(ns, key);
        expect(typeof val, `public.school.${key} missing in ${name}`).toBe('string');
      }
    });
  }
});

describe('MDCPS framing', () => {
  it('is_mdcps=true wins over needs_research', () => {
    const f = deriveSchoolFraming({ is_mdcps: true, calendar_status: 'needs_research' });
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('mdcps');
  });

  it('is_mdcps=true wins over unavailable too', () => {
    expect(
      deriveSchoolFraming({ is_mdcps: true, calendar_status: 'unavailable' }).isVerified,
    ).toBe(true);
  });
});
