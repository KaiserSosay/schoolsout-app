import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

const bodySchema = z.object({ closure_id: z.string().guid() });

// DECISION: "Reject" deletes the row rather than flipping to 'rejected'.
// Keeps the table small and avoids a permanent junk pile of AI drafts we
// never want to surface. If we later want an audit log we can soft-delete via
// a separate `closures_audit` table.
export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const db = createServiceSupabase();
  const { error } = await db.from('closures').delete().eq('id', parsed.data.closure_id);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
