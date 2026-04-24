import type { MetadataRoute } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';

// Evaluated at request time so the DB read doesn't require build-time env
// and so fresh camps/closures land in the sitemap without a redeploy.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL = 'https://schoolsout.net';

type CampRow = { slug: string; updated_at?: string | null };
type ClosureRow = { id: string; created_at?: string | null };
type SchoolRow = { slug: string; created_at?: string | null };

// Phase 2.7 Goal 4: dynamic sitemap covering every public URL.
// Locale duplication is intentional: search engines treat /en/... and
// /es/... as separate canonical pages (via alternates.languages in each
// page's metadata).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const svc = createServiceSupabase();
  const [{ data: camps }, { data: closures }, { data: schools }] = await Promise.all([
    svc
      .from('camps')
      .select('slug, updated_at')
      .eq('verified', true)
      .neq('website_status', 'broken'),
    svc
      .from('closures')
      .select('id, created_at')
      .eq('status', 'verified'),
    svc.from('schools').select('slug, created_at'),
  ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of ['en', 'es']) {
    // Locale home
    entries.push({
      url: `${SITE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    });
    // Directory indexes
    entries.push({
      url: `${SITE_URL}/${locale}/camps`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
    entries.push({
      url: `${SITE_URL}/${locale}/breaks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
    // Supporting pages
    for (const p of ['about', 'list-your-camp', 'how-we-verify', 'privacy', 'terms']) {
      entries.push({
        url: `${SITE_URL}/${locale}/${p}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.4,
      });
    }
    // Per-camp detail
    for (const c of (camps ?? []) as CampRow[]) {
      entries.push({
        url: `${SITE_URL}/${locale}/camps/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
    // Per-closure detail
    for (const cl of (closures ?? []) as ClosureRow[]) {
      entries.push({
        url: `${SITE_URL}/${locale}/breaks/${cl.id}`,
        lastModified: cl.created_at ? new Date(cl.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
    // Per-school
    for (const s of (schools ?? []) as SchoolRow[]) {
      if (!s.slug) continue;
      entries.push({
        url: `${SITE_URL}/${locale}/schools/${s.slug}`,
        lastModified: s.created_at ? new Date(s.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }
  return entries;
}
