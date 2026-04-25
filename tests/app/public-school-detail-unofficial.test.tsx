import { describe, it, expect } from 'vitest';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';
import { faqJsonLd, schoolJsonLd } from '@/lib/seo';

// Contract tests for the unofficial-school template. The page itself is a
// server component; we lock the i18n catalog for every key the unofficial
// branch reads, plus exercise the helpers the page calls so a regression
// shows up here.

const requiredKeys = [
  'unofficialFrame.h1',
  'unofficialFrame.title',
  'unofficialFrame.subhead',
  'unofficialFrame.confirmedTitle',
  'unofficialFrame.confirmedEmpty',
  'unofficialFrame.districtBannerTitle',
  'unofficialFrame.districtBannerBody',
  'unofficialFrame.linksTitle',
  'unofficialFrame.linksWebsite',
  'unofficialFrame.linksPhone',
  'unofficialFrame.linksAddress',
  'unofficialFrame.metaDescription',
  'helpVerify.title',
  'helpVerify.body',
  'helpVerify.emailLink',
  'helpVerify.modalTrigger',
  'helpVerify.bodyDraftPrefix',
  'faq.springBreakQ',
  'faq.springBreakAVerified',
  'faq.springBreakAUnverifiedKnown',
  'faq.springBreakAUnverifiedNone',
  'faq.nextHolidayQ',
  'faq.nextHolidayAYes',
  'faq.nextHolidayANone',
  'faq.fullCalendarQ',
  'faq.fullCalendarAWithLink',
  'faq.fullCalendarANoLink',
];

function dig(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[seg];
    }
    return undefined;
  }, obj);
}

describe('unofficial school template — i18n contract', () => {
  for (const { name, messages } of [
    { name: 'en', messages: en },
    { name: 'es', messages: es },
  ]) {
    it(`has every public.school.* key the unofficial branch reads in ${name}`, () => {
      const ns = dig(messages, 'public.school');
      expect(ns).toBeTruthy();
      for (const key of requiredKeys) {
        const val = dig(ns, key);
        expect(typeof val, `public.school.${key} missing in ${name}`).toBe('string');
        expect((val as string).length, `public.school.${key} empty in ${name}`).toBeGreaterThan(0);
      }
    });
  }
});

describe('unofficial framing decisions', () => {
  it('non-MDCPS schools with needs_research show the unofficial frame', () => {
    expect(
      deriveSchoolFraming({ is_mdcps: false, calendar_status: 'needs_research' })
        .isVerified,
    ).toBe(false);
  });

  it('non-MDCPS schools with verified_current show the verified frame', () => {
    expect(
      deriveSchoolFraming({ is_mdcps: false, calendar_status: 'verified_current' })
        .isVerified,
    ).toBe(true);
  });
});

describe('FAQPage JSON-LD shape', () => {
  it('renders three Q/A entries the spec asks for', () => {
    const ld = faqJsonLd([
      { q: 'Q1', a: 'A1' },
      { q: 'Q2', a: 'A2' },
      { q: 'Q3', a: 'A3' },
    ]);
    expect(ld['@type']).toBe('FAQPage');
    expect((ld.mainEntity as unknown[]).length).toBe(3);
    expect(((ld.mainEntity as Array<Record<string, unknown>>)[0] as Record<string, unknown>)['@type']).toBe(
      'Question',
    );
  });
});

describe('School JSON-LD shape', () => {
  it('includes telephone + sameAs when provided', () => {
    const ld = schoolJsonLd({
      name: 'The Growing Place School',
      url: 'https://schoolsout.net/en/schools/the-growing-place-school',
      district: 'Independent',
      city: 'Coral Gables',
      streetAddress: '123 Main St',
      telephone: '(305) 555-1212',
      websiteUrl: 'https://growingplaceschool.com',
    }) as Record<string, unknown>;
    expect(ld['@type']).toBe('School');
    expect(ld.telephone).toBe('(305) 555-1212');
    expect((ld.sameAs as string[])[0]).toBe('https://growingplaceschool.com');
    expect((ld.address as Record<string, unknown>).streetAddress).toBe('123 Main St');
    expect((ld.parentOrganization as Record<string, unknown>).name).toBe('Independent');
  });

  it('omits telephone + sameAs when missing', () => {
    const ld = schoolJsonLd({
      name: 'X',
      url: 'https://x.test',
      district: null,
      city: null,
    }) as Record<string, unknown>;
    expect(ld.telephone).toBeUndefined();
    expect(ld.sameAs).toBeUndefined();
    expect(ld.parentOrganization).toBeUndefined();
  });
});
