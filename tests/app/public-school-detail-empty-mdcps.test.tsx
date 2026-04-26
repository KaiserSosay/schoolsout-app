import { describe, it, expect } from 'vitest';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';

// Mom-test 2026-04-26 (evening): Academir Charter School East rendered
// "✓ Verified by Miami-Dade County Public Schools" with an empty list
// of closures. The trust-signal-without-data is misleading — the
// closure-count gate in deriveSchoolFraming forces the unofficial
// frame in that case. This file pins the Academir-shaped scenario.

describe('Academir-shaped fixture (M-DCPS school with empty closures)', () => {
  const academirShape = {
    is_mdcps: true,
    calendar_status: 'verified_multi_year' as const,
    unofficial_disclaimer_dismissed_at: null,
  };

  it('renders the unofficial frame when closures are empty', () => {
    const f = deriveSchoolFraming(academirShape, 0);
    expect(f.isVerified).toBe(false);
    expect(f.reason).toBe('unofficial');
  });

  it('renders the verified-by-MDCPS frame once at least one closure lands', () => {
    const f = deriveSchoolFraming(academirShape, 1);
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('mdcps');
  });
});

describe('non-MDCPS verified-status school with empty closures', () => {
  it('also falls back to unofficial when closures are empty (verified_current alone is not enough)', () => {
    const f = deriveSchoolFraming(
      { is_mdcps: false, calendar_status: 'verified_current' },
      0,
    );
    expect(f.isVerified).toBe(false);
    expect(f.reason).toBe('unofficial');
  });
});
