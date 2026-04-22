import { createServiceSupabase } from '@/lib/supabase/service';
import {
  CampReviewClient,
  type AdminCampRow,
} from '@/components/admin/CampReviewClient';

export const dynamic = 'force-dynamic';

export default async function CampReviewPage() {
  const db = createServiceSupabase();
  const { data } = await db
    .from('camps')
    .select(
      'id, name, neighborhood, phone, address, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, latitude, longitude, logistics_verified',
    )
    .eq('logistics_verified', false)
    .order('name', { ascending: true });
  const camps = (data ?? []) as AdminCampRow[];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Camp review</h2>
        <p className="mt-1 text-sm text-muted">
          Call each camp or pull the data off their website, fill the fields,
          then <strong>Save &amp; mark verified</strong>. The public UI stops
          showing &quot;Hours pending&quot; once a camp is flipped verified.
        </p>
      </div>
      <CampReviewClient camps={camps} />
    </div>
  );
}
