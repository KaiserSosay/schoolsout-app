import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

const statusEnum = z.enum(['pending', 'approved', 'rejected', 'all']);
const querySchema = z.object({ status: statusEnum.default('pending') });

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });

  const db = createServiceSupabase();
  let q = db
    .from('camp_applications')
    .select('id, camp_name, website, ages, neighborhood, email, status, created_at, reviewed_at, notes')
    .order('created_at', { ascending: false });
  if (parsed.data.status !== 'all') {
    q = q.eq('status', parsed.data.status);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}
