import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

// POST /api/admin/camps/[id]/toggle-launch-partner
// Flip is_launch_partner. If turning ON, set launch_partner_until = now + 90d.
// If turning OFF, clear launch_partner_until.

const paramSchema = z.object({ id: z.string().guid() });

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const p = paramSchema.safeParse({ id: params.id });
  if (!p.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const db = createServiceSupabase();
  const { data: current, error: getErr } = await db
    .from('camps')
    .select('id, is_launch_partner')
    .eq('id', p.data.id)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: 'db_error', detail: getErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const turningOn = !current.is_launch_partner;
  const until = turningOn ? new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString() : null;

  const { data, error } = await db
    .from('camps')
    .update({ is_launch_partner: turningOn, launch_partner_until: until })
    .eq('id', p.data.id)
    .select('id, is_launch_partner, launch_partner_until')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, camp: data });
}
