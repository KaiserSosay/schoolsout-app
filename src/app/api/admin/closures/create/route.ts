import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { recomputeSchoolStatus } from '@/lib/school-status-recompute';

const bodySchema = z
  .object({
    school_id: z.string().guid(),
    name: z.string().trim().min(1).max(120),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    emoji: z.string().trim().min(1).max(8).default('📅'),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: 'end_date_before_start',
  });

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('closures')
    .insert({
      school_id: parsed.data.school_id,
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      emoji: parsed.data.emoji,
      status: 'verified',
      source: 'manual',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  try {
    const next = await recomputeSchoolStatus(db, parsed.data.school_id);
    return NextResponse.json({ ok: true, id: data.id, calendar_status: next });
  } catch (e) {
    return NextResponse.json(
      { error: 'recompute_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}
