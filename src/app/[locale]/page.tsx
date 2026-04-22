import { getUpcomingClosures } from '@/lib/closures';
import { HomeClient } from '@/components/home/HomeClient';
import { createServerSupabase } from '@/lib/supabase/server';

const NOAH_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

// DECISION: force dynamic rendering so the build doesn't fail when Supabase env
// isn't set, and so real closures + countdowns are fresh on every paint.
export const dynamic = 'force-dynamic';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let closures: Awaited<ReturnType<typeof getUpcomingClosures>> = [];
  try {
    closures = await getUpcomingClosures(NOAH_SCHOOL_ID);
  } catch {
    // DECISION: swallow DB errors so the page still renders. HomeClient shows
    // skeleton/empty states when closures is empty — never fabricated data.
    closures = [];
  }

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
      schoolId={NOAH_SCHOOL_ID}
      locale={locale}
      loggedIn={loggedIn}
    />
  );
}
