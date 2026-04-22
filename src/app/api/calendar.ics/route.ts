import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { buildIcs, type IcsClosure } from '@/lib/ics';

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return new NextResponse('unauthorized', { status: 401 });

  // Schools tied to this user's kid profiles
  const { data: profiles } = await sb
    .from('kid_profiles')
    .select('school_id')
    .eq('user_id', user.id);

  // DECISION: avoid `[...new Set()]` spread — tsconfig has no explicit target
  // so TS falls back to ES5 iteration rules and rejects Set spread. Use a
  // plain dedup with reduce() instead.
  const rawIds = (profiles ?? []).map((p) => p.school_id).filter(Boolean) as string[];
  const schoolIds = rawIds.reduce<string[]>((acc, id) => (acc.includes(id) ? acc : acc.concat(id)), []);

  // DECISION: If the user has no kids yet, we still return a valid (empty)
  // calendar so calendar apps don't error out. Use a sentinel UUID in the .in()
  // call so the WHERE school_id IN () doesn't blow up on empty arrays.
  const idsForQuery = schoolIds.length ? schoolIds : ['00000000-0000-0000-0000-000000000000'];

  const { data: closures } = await sb
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji')
    .in('school_id', idsForQuery)
    .eq('status', 'verified')
    .gte('start_date', new Date().toISOString().slice(0, 10))
    .order('start_date', { ascending: true });

  const ics = buildIcs((closures ?? []) as IcsClosure[]);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="schoolsout-calendar.ics"',
      'Cache-Control': 'private, no-store',
    },
  });
}
