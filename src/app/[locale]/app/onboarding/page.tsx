import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { OnboardingForm, type School } from '@/components/app/OnboardingForm';

export const dynamic = 'force-dynamic';

// DECISION: If the user already has kid_profiles rows, they've completed
// onboarding — bounce to /app. Prevents a "re-onboard" edge case where a
// returning user lands here via a stale link.
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}`);

  const { count } = await sb
    .from('kid_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((count ?? 0) > 0) redirect(`/${locale}/app`);

  const [{ data: schools }, { data: me }] = await Promise.all([
    sb.from('schools').select('id, name').order('name', { ascending: true }),
    sb.from('users').select('display_name').eq('id', user.id).maybeSingle(),
  ]);

  const t = await getTranslations({ locale, namespace: 'app.onboarding' });

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6 md:py-16">
      <header className="mb-8">
        <h1
          className="text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted">{t('subtitle')}</p>
      </header>
      <OnboardingForm
        schools={(schools ?? []) as School[]}
        locale={locale}
        initialName={me?.display_name ?? null}
      />
    </div>
  );
}
