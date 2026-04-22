import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { verifyToken } from '@/lib/tokens';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sub = url.searchParams.get('sub');
  const sig = url.searchParams.get('sig');
  if (!sub || !sig || !verifyToken(sub, sig)) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }
  const db = createServiceSupabase();
  const { error } = await db.from('reminder_subscriptions').update({ enabled: false }).eq('id', sub);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.redirect(new URL('/en', url));
}
