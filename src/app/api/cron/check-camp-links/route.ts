// Link-checker cron — runs weekly via vercel.json, HEAD-requests every camp's website_url,
// and flips camps.website_status based on the result. Flagged broken camps get hidden from
// public lists in /api/camps and /app/closures/[id] (see integrity filter).
//
// Phase 2.7 Goal 6 additions:
//   - Also pokes last_verified_at so the 90-day stale-data banner resets
//     on successful re-checks (matches the reverify cadence in the
//     /how-we-verify page).
//   - Emails a weekly digest to ADMIN_NOTIFY_EMAIL so Rasheid sees drift
//     without having to check the admin dashboard.

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

function authorize(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${env.CRON_SECRET}`;
}

async function checkOne(url: string): Promise<'ok' | 'broken' | 'timeout'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // Some sites reject HEAD — fall back to GET with a small range to avoid downloading the full page.
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'SchoolsOut-LinkChecker/1.0 (+https://schoolsout.net)' },
      });
    } catch {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'SchoolsOut-LinkChecker/1.0 (+https://schoolsout.net)', Range: 'bytes=0-0' },
      });
    }
    if (res.status >= 200 && res.status < 400) return 'ok';
    return 'broken';
  } catch (err) {
    if ((err as Error).name === 'AbortError') return 'timeout';
    return 'broken';
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const { data: camps } = await db
    .from('camps')
    .select('id, slug, website_url')
    .not('website_url', 'is', null);

  const summary = { checked: 0, ok: 0, broken: 0, timeout: 0, skipped: 0 };
  const brokenCamps: Array<{ name: string; slug: string; url: string }> = [];

  for (const c of camps ?? []) {
    if (!c.website_url) { summary.skipped++; continue; }
    const status = await checkOne(c.website_url);
    summary.checked++;
    summary[status]++;
    const patch: Record<string, unknown> = {
      website_status: status,
      website_last_verified_at: new Date().toISOString(),
    };
    // Goal 6: advance last_verified_at on OK to reset the stale-data
    // banner window. Leave it alone on broken/timeout so operators see
    // how long the listing has been quietly broken.
    if (status === 'ok') patch.last_verified_at = new Date().toISOString();
    await db.from('camps').update(patch).eq('id', c.id);
    if (status === 'broken' || status === 'timeout') {
      brokenCamps.push({
        name: (c as unknown as { name?: string }).name ?? c.slug,
        slug: c.slug,
        url: c.website_url,
      });
    }
  }

  // Weekly digest. Fire-and-forget — don't fail the cron if email send
  // flakes; the stats are in the JSON response too.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const brokenList = brokenCamps.length
        ? brokenCamps.map((c) => `<li><strong>${c.name}</strong> — <a href="${c.url}">${c.url}</a> (slug: ${c.slug})</li>`).join('')
        : '<li>Nothing broken. 🎉</li>';
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: env.ADMIN_NOTIFY_EMAIL,
        subject: `Weekly camp re-verify — ${summary.ok}/${summary.checked} OK, ${summary.broken + summary.timeout} flagged`,
        html: `
<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #FBF8F1; color: #1A1A1A; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 12px;">Weekly camp re-verify digest</h1>
    <p style="margin: 0 0 8px;">Checked <strong>${summary.checked}</strong> camps:
      ${summary.ok} OK, ${summary.broken} broken, ${summary.timeout} timeout, ${summary.skipped} skipped (no website).</p>
    <h2 style="font-size: 16px; margin: 16px 0 4px;">Flagged this week</h2>
    <ul style="font-size: 14px; line-height: 1.5;">${brokenList}</ul>
    <p style="margin: 16px 0 0; font-size: 12px; color: #71717A;">
      Details in <a href="${env.APP_URL}/en/admin?tab=integrity">/admin?tab=integrity</a>.
    </p>
  </body>
</html>`,
      });
    } catch (err) {
      console.error('[cron] weekly digest send failed', err);
    }
  }

  return NextResponse.json({ ...summary, brokenCount: brokenCamps.length });
}
