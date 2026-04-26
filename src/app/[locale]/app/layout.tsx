import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminRole } from '@/lib/auth/requireAdmin';
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

  const adminRole = await getAdminRole(user.id, user.email ?? null);

  return (
    <ModeProvider>
      <AppShell
        locale={locale}
        email={user.email ?? ''}
        displayName={userRow?.display_name ?? null}
        isAdmin={adminRole !== null}
      >
        {children}
      </AppShell>
    </ModeProvider>
  );
}
