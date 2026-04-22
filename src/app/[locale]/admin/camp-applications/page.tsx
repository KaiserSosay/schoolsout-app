import { createServiceSupabase } from '@/lib/supabase/service';
import {
  CampApplicationsClient,
  type AdminCampApplication,
} from '@/components/admin/CampApplicationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCampApplicationsPage() {
  const db = createServiceSupabase();
  const { data } = await db
    .from('camp_applications')
    .select('id, camp_name, website, ages, neighborhood, email, status, created_at, reviewed_at, notes')
    .order('status', { ascending: true }) // pending → approved → rejected (enum order)
    .order('created_at', { ascending: false });
  const apps = (data ?? []) as AdminCampApplication[];

  // Explicit ordering: pending first, then approved, then rejected.
  const rank = { pending: 0, approved: 1, rejected: 2 } as const;
  apps.sort(
    (a, b) => rank[a.status] - rank[b.status] || b.created_at.localeCompare(a.created_at),
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Camp applications</h2>
        <p className="text-xs font-bold text-muted">
          Approve converts the application into a <code>camps</code> row (verified=false, logistics_verified=false). Applicant gets a Resend email either way.
        </p>
      </div>
      <CampApplicationsClient apps={apps} />
    </div>
  );
}
