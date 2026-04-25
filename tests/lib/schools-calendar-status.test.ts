import { describe, it, expect } from 'vitest';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';

describe('deriveSchoolFraming', () => {
  it('treats MDCPS schools as verified, regardless of calendar_status', () => {
    expect(
      deriveSchoolFraming({ is_mdcps: true, calendar_status: 'needs_research' }),
    ).toEqual({ isVerified: true, reason: 'mdcps' });
  });

  it('treats verified_current and verified_multi_year as verified', () => {
    expect(
      deriveSchoolFraming({ is_mdcps: false, calendar_status: 'verified_current' }),
    ).toEqual({ isVerified: true, reason: 'verified_status' });
    expect(
      deriveSchoolFraming({
        is_mdcps: false,
        calendar_status: 'verified_multi_year',
      }),
    ).toEqual({ isVerified: true, reason: 'verified_status' });
  });

  it('treats ai_draft / needs_research / unavailable as unofficial', () => {
    for (const status of ['ai_draft', 'needs_research', 'unavailable'] as const) {
      expect(
        deriveSchoolFraming({ is_mdcps: false, calendar_status: status }),
      ).toEqual({ isVerified: false, reason: 'unofficial' });
    }
  });

  it('honours admin dismissal as a forced verified frame', () => {
    expect(
      deriveSchoolFraming({
        is_mdcps: false,
        calendar_status: 'needs_research',
        unofficial_disclaimer_dismissed_at: '2026-04-24T00:00:00Z',
      }),
    ).toEqual({ isVerified: true, reason: 'admin_dismissed' });
  });

  it('handles null/undefined inputs without throwing', () => {
    expect(deriveSchoolFraming({ is_mdcps: null, calendar_status: null })).toEqual({
      isVerified: false,
      reason: 'unofficial',
    });
  });
});
