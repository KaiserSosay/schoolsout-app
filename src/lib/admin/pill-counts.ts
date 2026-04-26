import type { SupabaseClient } from '@supabase/supabase-js';
import type { PillCounts } from '@/components/admin/AdminPillStrip';

const STALE_VERIFICATION_DAYS = 60;

// Runs the same set of filters each tab's loader uses, so the pill count
// matches what the operator will see in the corresponding panel. Intent: an
// operator never lands on a tab that says "0 rows" when the pill claimed 3.
//
// Schema-defensive: school_requests and the camps data-quality columns are
// behind migrations that may not have shipped to every environment yet.
// Each individual query catches its own failure and returns count=0 so a
// missing-column error never breaks the whole admin dashboard.
export async function computePillCounts(
  db: SupabaseClient,
): Promise<PillCounts> {
  const sixtyDaysAgo = new Date(
    Date.now() - STALE_VERIFICATION_DAYS * 86400000,
  ).toISOString();

  const safeCount = async (
    p: PromiseLike<{ count: number | null }>,
  ): Promise<number> => {
    try {
      const r = await p;
      return r.count ?? 0;
    } catch {
      return 0;
    }
  };

  const [
    featureRequestsCount,
    campRequestsCount,
    schoolsNeedingReviewCount,
    aiDraftClosuresCount,
    calendarSubmissionsCount,
    brokenWebsitesCount,
    missingLogisticsCount,
    usersCount,
    schoolRequestsCount,
    dataQualityCount,
  ] = await Promise.all([
    // Feature requests panel renders ALL rows (no status filter), so the
    // pill must too. Previous version filtered status='new' and undercounted.
    safeCount(
      db.from('feature_requests').select('*', { count: 'exact', head: true }),
    ),
    // Same: camp-requests panel renders ALL applications regardless of
    // status. Previous version filtered status='pending'.
    safeCount(
      db.from('camp_applications').select('*', { count: 'exact', head: true }),
    ),
    // Calendar reviews splits into two actionable signals:
    //  1. Schools whose calendar_status is needs_research|ai_draft (blocking)
    //  2. ai_draft closures awaiting verify (also blocking)
    // We sum them; both surface in the calendar-reviews tab.
    safeCount(
      db
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .in('calendar_status', ['needs_research', 'ai_draft']),
    ),
    safeCount(
      db
        .from('closures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ai_draft'),
    ),
    // Pending calendar submissions awaiting admin triage. Counts only
    // status='pending' so the pill drops to 0 once the queue is cleared.
    // Schema-defensive: migration 043 may not be applied yet.
    safeCount(
      db
        .from('school_calendar_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ),
    // Integrity panel renders broken websites + camps with logistics_verified
    // = false. Pill counts each separately so the math matches what's
    // visible. Prior version summed without limit so the pill always ran
    // ahead of the .limit(50) panel slices.
    safeCount(
      db
        .from('camps')
        .select('*', { count: 'exact', head: true })
        .eq('website_status', 'broken'),
    ),
    safeCount(
      db
        .from('camps')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)
        .eq('logistics_verified', false),
    ),
    safeCount(
      db.from('users').select('*', { count: 'exact', head: true }),
    ),
    safeCount(
      db
        .from('school_requests')
        .select('*', { count: 'exact', head: true }),
    ),
    // Data quality counts the DISTINCT verified camps that have any
    // problem (no address OR no phone OR stale verification). Old version
    // summed the three buckets, which double-counted camps with multiple
    // gaps and overstated the work.
    safeCount(
      db
        .from('camps')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)
        .or(
          `address.is.null,address.eq.,phone.is.null,phone.eq.,last_verified_at.lt.${sixtyDaysAgo}`,
        ),
    ),
  ]);

  return {
    featureRequests: featureRequestsCount,
    campRequests: campRequestsCount,
    calendarReviews: schoolsNeedingReviewCount + aiDraftClosuresCount,
    calendarSubmissions: calendarSubmissionsCount,
    integrityWarnings: brokenWebsitesCount + missingLogisticsCount,
    users: usersCount,
    schoolRequests: schoolRequestsCount,
    dataQuality: dataQualityCount,
  };
}
