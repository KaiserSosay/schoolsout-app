import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const postSchema = z.object({
  camp_id: z.string().guid(),
  saved: z.boolean(),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('saved_camps')
    .select('camp_id, created_at, camp:camps(id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, verified)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  const camps = (data ?? []).map((row) => row.camp).filter(Boolean);
  return NextResponse.json({ camps });
}

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { camp_id, saved } = parsed.data;

  // Look up camp name for activity log (reads pass RLS — "anyone reads camps").
  const { data: camp } = await sb
    .from('camps')
    .select('name, slug')
    .eq('id', camp_id)
    .maybeSingle();
  const campName = camp?.name ?? 'camp';
  const campSlug = camp?.slug as string | undefined;

  if (saved) {
    const { error } = await sb
      .from('saved_camps')
      .upsert({ user_id: user.id, camp_id }, { onConflict: 'user_id,camp_id' });
    if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

    await sb.from('kid_activity').insert({
      user_id: user.id,
      action: 'saved_camp',
      target_id: camp_id,
      target_name: campName,
      metadata: campSlug ? { slug: campSlug } : null,
    });
  } else {
    const { error } = await sb.from('saved_camps').delete().eq('user_id', user.id).eq('camp_id', camp_id);
    if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

    await sb.from('kid_activity').insert({
      user_id: user.id,
      action: 'unsaved_camp',
      target_id: camp_id,
      target_name: campName,
      metadata: campSlug ? { slug: campSlug } : null,
    });
  }

  return NextResponse.json({ ok: true, saved });
}
