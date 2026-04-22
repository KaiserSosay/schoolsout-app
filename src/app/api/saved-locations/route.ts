import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

// DECISION: A user can have multiple saved locations (Home, Work, Grandma's…).
// Exactly one is marked primary — enforced by the `saved_locations_one_primary`
// partial unique index on `(user_id) where is_primary = true`. To keep that
// invariant when a client flips the primary, we first clear all rows for this
// user to `is_primary = false`, then set the target to true. Two UPDATEs in
// sequence; a concurrent write from the same user could in theory race but
// RLS + a single-tab reality makes that a non-issue for now.

const postSchema = z.object({
  label: z.string().trim().min(1).max(80),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  is_primary: z.boolean().optional(),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('saved_locations')
    .select('id, label, latitude, longitude, is_primary, created_at')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ locations: data ?? [] });
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

  // DECISION: If the caller passes is_primary: true OR this is the user's
  // first saved location (no other rows), we force primary = true.
  const { count } = await sb
    .from('saved_locations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const wasFirst = (count ?? 0) === 0;
  const shouldBePrimary = parsed.data.is_primary === true || wasFirst;

  if (shouldBePrimary) {
    const { error: clearErr } = await sb
      .from('saved_locations')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);
    if (clearErr) {
      return NextResponse.json({ error: 'db_error', detail: clearErr.message }, { status: 500 });
    }
  }

  const { data, error } = await sb
    .from('saved_locations')
    .insert({
      user_id: user.id,
      label: parsed.data.label,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      is_primary: shouldBePrimary,
    })
    .select('id, label, latitude, longitude, is_primary')
    .single();

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}
