import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { ModeProvider } from '@/components/app/ModeProvider';
import { AppShell } from '@/components/app/AppShell';

export const dynamic = 'force-dynamic';

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
      <AppShell
        locale={locale}
        email={user.email ?? ''}
        displayName={userRow?.display_name ?? null}
      >
        {children}
      </AppShell>
    </ModeProvider>
  );
}
