import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

const schema = z.object({
  camp_name:    z.string().min(2).max(200),
  website:      z.string().url().max(500),
  ages:         z.string().min(1).max(50),
  neighborhood: z.string().min(2).max(100),
  email:        z.string().email().max(320),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const db = createServiceSupabase();
  const { error } = await db.from('camp_applications').insert(parsed.data);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  // DECISION: Notify Rasheid so he can respond personally. Phase 1 cold-start —
  // the first 10 camp operators are hand-sold as Launch Partners (FREE, 90 days
  // Featured). Featured is $29/mo after the MAU/sub unlock gate.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! Applications <hello@schoolsout.net>",
        to: 'rkscarlett@gmail.com',
        subject: `New camp application: ${parsed.data.camp_name}`,
        html: `<p><strong>${parsed.data.camp_name}</strong> applied to be featured.</p>
               <p>Website: <a href="${parsed.data.website}">${parsed.data.website}</a><br>
               Ages: ${parsed.data.ages}<br>
               Neighborhood: ${parsed.data.neighborhood}<br>
               Email: <a href="mailto:${parsed.data.email}">${parsed.data.email}</a></p>
               <p>Review in Supabase &rarr; camp_applications.</p>`,
      });
    } catch {
      // DECISION: Don't fail the request if the notification email bounces.
      // The row is already in Supabase; Rasheid can review it there.
    }
  }

  return NextResponse.json({ ok: true });
}
