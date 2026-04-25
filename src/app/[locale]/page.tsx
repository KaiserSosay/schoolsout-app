import { getUpcomingClosures } from '@/lib/closures';
import { HomeClient } from '@/components/home/HomeClient';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';

const NOAH_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';
const MDCPS_DISTRICT_SLUG = 'mdcps-district';

// DECISION: force dynamic rendering so the build doesn't fail when Supabase env
// isn't set, and so real closures + countdowns are fresh on every paint.
export const dynamic = 'force-dynamic';

// DECISION: anonymous landing surfaces the M-DCPS district calendar as the
// default — most Miami parents have kids in M-DCPS, and this is what the
// dashboard pulls in too. The same school id is reused for the hero's signup
// form so the closures shown match the calendar a parent is actually
// subscribing to (UX_PRINCIPLES.md #2 — no surprises). Falls back to Noah's
// school if the district row is missing (pre-import deploys / dev seeds).
async function getLandingDefault(): Promise<{
  schoolId: string;
  closures: Awaited<ReturnType<typeof getUpcomingClosures>>;
}> {
  try {
    const svc = createServiceSupabase();
    const { data: district } = await svc
      .from('schools')
      .select('id')
      .eq('slug', MDCPS_DISTRICT_SLUG)
      .maybeSingle();
    const schoolId = district?.id ?? NOAH_SCHOOL_ID;
    const closures = await getUpcomingClosures(schoolId);
    return { schoolId, closures };
  } catch {
    return { schoolId: NOAH_SCHOOL_ID, closures: [] };
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const { schoolId, closures } = await getLandingDefault();

  // DECISION: cheap session check. When a returning user hits the marketing
  // page we swap the Sign-in/Start-free CTAs for a single "Open app →" pill.
  let loggedIn = false;
  try {
    const sb = createServerSupabase();
    const { data } = await sb.auth.getUser();
    loggedIn = Boolean(data.user);
  } catch {
    loggedIn = false;
  }

  return (
    <HomeClient
      closures={closures}
      schoolId={schoolId}
      locale={locale}
      loggedIn={loggedIn}
    />
  );
}
