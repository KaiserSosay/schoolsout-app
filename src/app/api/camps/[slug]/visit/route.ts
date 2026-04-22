import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

// GET /api/camps/[slug]/visit
// 1. Look up the camp by slug (service role).
// 2. If no website_url, redirect to the in-app detail page.
// 3. Insert a camp_clicks row (service role). Capture user_id if a session exists.
// 4. 302 to camp.website_url.
//
// DECISION: We write the click row before redirecting but do NOT block on it —
// a DB hiccup should never eat the user's tap. Fire-and-forget with a short
// try/catch.
export async function GET(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return NextResponse.redirect(new URL(`/en`, env.APP_URL));
  }

  const db = createServiceSupabase();
  const { data: camp } = await db
    .from('camps')
    .select('id, slug, website_url')
    .eq('slug', slug)
    .maybeSingle();

  if (!camp) {
    return NextResponse.redirect(new URL(`/en/app/camps`, env.APP_URL));
  }

  // Try to capture the signed-in user, if any. Anonymous clicks get null.
  let userId: string | null = null;
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const ua = req.headers.get('user-agent') ?? null;
  const referer = req.headers.get('referer') ?? null;

  // Fire-and-forget insert — do not block the redirect if it errors.
  try {
    await db.from('camp_clicks').insert({
      camp_id: camp.id,
      user_id: userId,
      user_agent: ua,
      referrer: referer,
    });
  } catch (err) {
    console.error('[visit] click insert failed', err);
  }

  // If no website, fall back to our in-app detail page.
  const target =
    camp.website_url && /^https?:\/\//i.test(camp.website_url)
      ? camp.website_url
      : new URL(`/en/app/camps/${camp.slug}`, env.APP_URL).toString();

  return NextResponse.redirect(target, 302);
}
