import { describe, it, expect } from 'vitest';
import {
  statusBadge,
  statusTranslationKey,
  isSchoolVerified,
} from '@/lib/school-status';

describe('statusBadge', () => {
  it('returns positive intent for verified statuses', () => {
    expect(statusBadge('verified_multi_year').intent).toBe('positive');
    expect(statusBadge('verified_current').intent).toBe('positive');
  });
  it('returns pending/unknown/error for the rest', () => {
    expect(statusBadge('ai_draft').intent).toBe('pending');
    expect(statusBadge('needs_research').intent).toBe('unknown');
    expect(statusBadge('unavailable').intent).toBe('error');
  });
});

describe('statusTranslationKey', () => {
  it('maps to expected keys', () => {
    expect(statusTranslationKey('verified_multi_year')).toBe('verifiedMultiYear');
    expect(statusTranslationKey('needs_research')).toBe('needsResearch');
  });
});

describe('isSchoolVerified', () => {
  it('only verified_current and verified_multi_year count', () => {
    expect(isSchoolVerified('verified_current')).toBe(true);
    expect(isSchoolVerified('verified_multi_year')).toBe(true);
    expect(isSchoolVerified('ai_draft')).toBe(false);
    expect(isSchoolVerified('needs_research')).toBe(false);
    expect(isSchoolVerified('unavailable')).toBe(false);
  });
});
