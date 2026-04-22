import { createServerSupabase } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function ConfirmPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations();
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      {user
        ? <h1 className="text-2xl font-bold">✅ {t('reminderSignup.success')}</h1>
        : <h1 className="text-2xl font-bold">⚠️ {t('reminderSignup.error')}</h1>}
    </main>
  );
}
