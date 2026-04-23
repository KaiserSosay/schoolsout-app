import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

// DECISION: PM-authored COPPA exception. kid_names TEXT[] lives here (and
// NOWHERE else) as plaintext strings the parent explicitly chose to save so
// a shareable plan link can render "Noah's coverage for Memorial Day" to a
// co-parent. Deletable via DELETE /api/plans. See migration 008 + PROGRESS.md.

const planType = z.enum(['coverage', 'activities', 'mix']);

const postSchema = z.object({
  closure_id: z.guid(),
  plan_type: planType,
  // Optional. Parent can save a plan without handing over names.
  kid_names: z.array(z.string().min(1).max(60)).max(10).default([]),
  camp_ids: z.array(z.guid()).max(20).default([]),
  activity_ids: z.array(z.guid()).max(20).default([]),
});

export async function GET(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const closureId = url.searchParams.get('closure_id');
  if (!closureId) return NextResponse.json({ error: 'missing_closure_id' }, { status: 400 });

  const closureParsed = z.guid().safeParse(closureId);
  if (!closureParsed.success) return NextResponse.json({ error: 'invalid_closure_id' }, { status: 400 });

  const { data, error } = await sb
    .from('user_plans')
    .select('id, closure_id, plan_type, kid_names, camps, activities, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('closure_id', closureId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ plan: data });
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

  const { closure_id, plan_type, kid_names, camp_ids, activity_ids } = parsed.data;

  const { data, error } = await sb
    .from('user_plans')
    .upsert(
      {
        user_id: user.id,
        closure_id,
        plan_type,
        kid_names,
        camps: camp_ids,
        activities: activity_ids,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,closure_id' },
    )
    .select('id, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  // Best-effort activity log
  await sb
    .from('kid_activity')
    .insert({
      user_id: user.id,
      action: 'saved_plan',
      target_id: closure_id,
      target_name: `plan:${plan_type}`,
    })
    .then(() => undefined);

  return NextResponse.json({ id: data.id, created_at: data.created_at, updated_at: data.updated_at });
}

export async function DELETE(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const closureId = url.searchParams.get('closure_id');
  if (!closureId) return NextResponse.json({ error: 'missing_closure_id' }, { status: 400 });

  const closureParsed = z.guid().safeParse(closureId);
  if (!closureParsed.success) return NextResponse.json({ error: 'invalid_closure_id' }, { status: 400 });

  const { error } = await sb
    .from('user_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('closure_id', closureId);

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
