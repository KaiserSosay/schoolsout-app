// Link-checker cron — runs weekly via vercel.json, HEAD-requests every camp's website_url,
// and flips camps.website_status based on the result. Flagged broken camps get hidden from
// public lists in /api/camps and /app/closures/[id] (see integrity filter).

import { NextResponse } from 'next/server';
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

  for (const c of camps ?? []) {
    if (!c.website_url) { summary.skipped++; continue; }
    const status = await checkOne(c.website_url);
    summary.checked++;
    summary[status]++;
    await db
      .from('camps')
      .update({ website_status: status, website_last_verified_at: new Date().toISOString() })
      .eq('id', c.id);
  }

  return NextResponse.json({ ...summary });
}
