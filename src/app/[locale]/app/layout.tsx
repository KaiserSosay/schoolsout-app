import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { ModeProvider } from '@/components/app/ModeProvider';
import { AppHeader } from '@/components/app/AppHeader';
import { BottomNav } from '@/components/app/BottomNav';

export const dynamic = 'force-dynamic';

// DECISION: Auth guard at the layout level. Any un-authed user who browses
// /en/app or deeper gets bounced to /{locale} (the marketing page). We also
// pre-load `display_name` here so the header can greet by initial without a
// second round-trip.
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}`);

  const { data: userRow } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <ModeProvider>
      <AppHeader
        locale={locale}
        email={user.email ?? ''}
        displayName={userRow?.display_name ?? null}
      />
      <main className="pb-24 md:pb-12">{children}</main>
      <BottomNav locale={locale} />
    </ModeProvider>
  );
}
