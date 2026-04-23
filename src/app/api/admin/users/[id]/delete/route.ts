import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

// POST /api/admin/users/[id]/delete
// COPPA right-to-be-forgotten. Deletes the auth.users row, which cascades
// through public.users and every table with `user_id uuid references users(id)
// on delete cascade` — kid_profiles, reminder_subscriptions, saved_camps,
// kid_activity, saved_locations, kid_access_tokens, camp_clicks (user_id
// set null on delete).
//
// DECISION: Delete via auth.admin.deleteUser() rather than public.users.
// Deleting public.users directly would orphan the auth row (auth.users has
// no FK to public.users), leaving a zombie login. auth.admin.deleteUser()
// triggers the FK cascade back to public.users.
const paramSchema = z.object({ id: z.string().guid() });

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const parsed = paramSchema.safeParse({ id: params.id });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  // Guard: don't let an admin delete themselves.
  if (parsed.data.id === user.id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { error } = await db.auth.admin.deleteUser(parsed.data.id);
  if (error) {
    return NextResponse.json(
      { error: 'delete_failed', detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
