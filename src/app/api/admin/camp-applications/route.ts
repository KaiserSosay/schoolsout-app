import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const statusEnum = z.enum(['pending', 'approved', 'rejected', 'all']);
const querySchema = z.object({ status: statusEnum.default('pending') });

export async function GET(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

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
