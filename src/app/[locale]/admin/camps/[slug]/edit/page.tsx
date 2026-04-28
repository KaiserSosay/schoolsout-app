import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceSupabase } from '@/lib/supabase/service';
import { CampEditForm } from '@/components/admin/CampEditForm';

export const dynamic = 'force-dynamic';

// Phase B prep — admin camp edit form scaffold. The /admin layout
// already gates the route via requireAdminPage, so this server
// component just loads the camp row by slug, 404s if missing, and
// hands the data to the scaffold component. No working submit handler
// — the morning's work wires real components and form actions on top
// of this skeleton.
//
// The legacy inline-edit form in CampsAdminClient stays live; this is
// a parallel surface so Rasheid can review the field layout without
// risking the working flow.
export default async function CampEditPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Service-role read so RLS doesn't get in the way. Admin gating
  // already happened at the layout level.
  const db = createServiceSupabase();
  const { data: camp, error } = await db
    .from('camps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !camp) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-muted">
            ADMIN · CAMP EDIT
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">{camp.name}</h2>
          <p className="text-xs font-mono text-muted">{camp.slug}</p>
        </div>
        <Link
          href={`/${locale}/admin?tab=camps`}
          className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-xs font-bold hover:border-brand-purple/40"
        >
          ← Back to camps list
        </Link>
      </div>
      <CampEditForm camp={camp} />
    </div>
  );
}
