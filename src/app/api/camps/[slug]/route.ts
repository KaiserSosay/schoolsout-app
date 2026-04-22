import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('camps')
    .select('id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, verified, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ camp: data });
}
