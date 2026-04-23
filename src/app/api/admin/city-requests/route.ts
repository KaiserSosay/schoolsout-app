import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  top: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    top: url.searchParams.get('top') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  const { top } = parsed.data;

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('city_requests')
    .select('id, email, city, state, user_agent, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  const rows = data ?? [];

  if (top) {
    const counts = new Map<string, { city: string; state: string | null; count: number }>();
    for (const r of rows as { city: string; state: string | null }[]) {
      const key = `${r.city.toLowerCase()}|${(r.state ?? '').toLowerCase()}`;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { city: r.city, state: r.state, count: 1 });
    }
    const ranked = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, top);
    return NextResponse.json({ top: ranked, totalRows: rows.length });
  }

  return NextResponse.json({ requests: rows });
}
