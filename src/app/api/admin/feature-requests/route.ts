import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

const statusEnum = z.enum([
  'new',
  'acknowledged',
  'in_progress',
  'shipped',
  'wont_do',
  'all',
]);
const querySchema = z.object({
  status: statusEnum.default('new'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const db = createServiceSupabase();
  let q = db
    .from('feature_requests')
    .select(
      'id, user_id, email, category, body, page_path, locale, status, admin_response, admin_responded_at, created_at, users(display_name, email)',
    )
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.status !== 'all') {
    q = q.eq('status', parsed.data.status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ requests: data ?? [] });
}
