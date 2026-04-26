import { describe, it, expect } from 'vitest';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';

// Mom-test 2026-04-26 (evening): Academir Charter School East rendered
// "✓ Verified by Miami-Dade County Public Schools" with an empty
// closures list. The trust-signal-without-data is misleading. The fix
// inverts is_mdcps's "always verified" assumption: a school is only
// rendered as verified when there's at least one closure on file.

describe('deriveSchoolFraming', () => {
  it('is_mdcps=true wins over needs_research when closures exist', () => {
    const f = deriveSchoolFraming(
      { is_mdcps: true, calendar_status: 'needs_research' },
      5,
    );
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('mdcps');
  });

  it('is_mdcps=true with ZERO closures falls back to unofficial', () => {
    const f = deriveSchoolFraming(
      { is_mdcps: true, calendar_status: 'verified_multi_year' },
      0,
    );
    expect(f.isVerified).toBe(false);
    expect(f.reason).toBe('unofficial');
  });

  it('verified_current with ZERO closures also falls back to unofficial', () => {
    const f = deriveSchoolFraming(
      { is_mdcps: false, calendar_status: 'verified_current' },
      0,
    );
    expect(f.isVerified).toBe(false);
    expect(f.reason).toBe('unofficial');
  });

  it('admin-dismissed flag still wins regardless of closure count', () => {
    // Admin override is the explicit "trust me, this is verified" lever.
    // It survives the closure-count gate by design — useful for the rare
    // case where dates are coming and the admin wants to drop the
    // "unverified" framing in advance.
    const f = deriveSchoolFraming(
      {
        is_mdcps: false,
        calendar_status: 'needs_research',
        unofficial_disclaimer_dismissed_at: '2026-04-26T10:00:00Z',
      },
      0,
    );
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('admin_dismissed');
  });

  it('omitting closureCount keeps the original signature working (back-compat)', () => {
    // Helper has historically taken just the school shape. Some callers
    // may still call it that way; they should keep the old behavior.
    const f = deriveSchoolFraming({
      is_mdcps: true,
      calendar_status: 'needs_research',
    });
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('mdcps');
  });

  it('verified_multi_year + 1 closure → still verified', () => {
    const f = deriveSchoolFraming(
      { is_mdcps: false, calendar_status: 'verified_multi_year' },
      1,
    );
    expect(f.isVerified).toBe(true);
    expect(f.reason).toBe('verified_status');
  });

  it('needs_research + many closures → unofficial (status drives it, not closure count)', () => {
    // Closure count is a NECESSARY gate, not a SUFFICIENT one. A school
    // can have unverified ai_draft closures and still be rendered as
    // unofficial — the closure-count guard only catches the empty case.
    const f = deriveSchoolFraming(
      { is_mdcps: false, calendar_status: 'needs_research' },
      20,
    );
    expect(f.isVerified).toBe(false);
    expect(f.reason).toBe('unofficial');
  });
});
