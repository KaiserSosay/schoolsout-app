// Decision helper: should this school's public page render with the
// "verified" frame (Verified by Miami-Dade Public Schools / verified
// from official source) or the "unofficial" frame (we're working on
// it; help us verify)?
//
// Rule:
//   - is_mdcps = true → verified (district fan-out gives us real dates)
//   - calendar_status in (verified_multi_year, verified_current) → verified
//   - everything else → unofficial
//
// `unofficial_disclaimer_dismissed_at` is the per-school override for
// when a school admin has asked us to drop the "unofficial" framing
// even though our own status enum hasn't caught up yet. Treat a non-NULL
// timestamp as a forced verified frame.

export type SchoolCalendarStatus =
  | 'verified_multi_year'
  | 'verified_current'
  | 'ai_draft'
  | 'needs_research'
  | 'unavailable'
  // tolerate string from the DB without panic
  | (string & {});

export type SchoolFraming = {
  isVerified: boolean;
  // Reason is only used by tests + the admin tab — not user-facing copy.
  reason: 'mdcps' | 'verified_status' | 'admin_dismissed' | 'unofficial';
};

export function deriveSchoolFraming(input: {
  is_mdcps: boolean | null | undefined;
  calendar_status: SchoolCalendarStatus | null | undefined;
  unofficial_disclaimer_dismissed_at?: string | null;
}): SchoolFraming {
  if (input.unofficial_disclaimer_dismissed_at) {
    return { isVerified: true, reason: 'admin_dismissed' };
  }
  if (input.is_mdcps) {
    return { isVerified: true, reason: 'mdcps' };
  }
  if (
    input.calendar_status === 'verified_multi_year' ||
    input.calendar_status === 'verified_current'
  ) {
    return { isVerified: true, reason: 'verified_status' };
  }
  return { isVerified: false, reason: 'unofficial' };
}
