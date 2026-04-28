import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

// POST /api/admin/camps/[slug]/toggle-launch-partner
// Flip is_launch_partner. If turning ON, set launch_partner_until = now + 90d.
// If turning OFF, clear launch_partner_until.
//
// Keyed by slug (migrated from [id] in 2026-04-28 build-fix commit).

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const paramSchema = z.object({ slug: z.string().regex(SLUG_RE) });

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const p = paramSchema.safeParse({ slug: params.slug });
  if (!p.success) return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });

  const db = createServiceSupabase();
  const { data: current, error: getErr } = await db
    .from('camps')
    .select('id, is_launch_partner')
    .eq('slug', p.data.slug)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: 'db_error', detail: getErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const turningOn = !current.is_launch_partner;
  const until = turningOn ? new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString() : null;

  const { data, error } = await db
    .from('camps')
    .update({ is_launch_partner: turningOn, launch_partner_until: until })
    .eq('slug', p.data.slug)
    .select('id, is_launch_partner, launch_partner_until')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, camp: data });
}
