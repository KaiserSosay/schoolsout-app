import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';

type Tag = { name: string; value: string };
type WebhookBody = { type: string; data?: { tags?: Tag[] } };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as WebhookBody | null;
  if (!body?.type) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const sendId = body.data?.tags?.find((t) => t.name === 'send_id')?.value;
  if (!sendId) return NextResponse.json({ ok: true });

  const db = createServiceSupabase();
  const update =
    body.type === 'email.opened'  ? { opened_at: new Date().toISOString() } :
    body.type === 'email.clicked' ? { clicked_at: new Date().toISOString() } :
    null;
  if (update) await db.from('reminder_sends').update(update).eq('id', sendId);
  return NextResponse.json({ ok: true });
}
