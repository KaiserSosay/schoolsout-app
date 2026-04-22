import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/app/SettingsClient';
import type { School } from '@/components/app/KidForm';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  school_id: string;
  age_range: '4-6' | '7-9' | '10-12' | '13+';
  ordinal: number;
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.settings' });

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}`);

  const [{ data: schools }, { data: me }, { data: profiles }] = await Promise.all([
    sb.from('schools').select('id, name').order('name', { ascending: true }),
    sb.from('users').select('display_name').eq('id', user.id).maybeSingle(),
    sb
      .from('kid_profiles')
      .select('id, school_id, age_range, ordinal')
      .eq('user_id', user.id)
      .order('ordinal', { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          {t('eyebrow')}
        </div>
        <h1
          className="mt-1 text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
      </header>
      <SettingsClient
        locale={locale}
        displayName={me?.display_name ?? null}
        schools={(schools ?? []) as School[]}
        profiles={(profiles ?? []) as ProfileRow[]}
      />
    </div>
  );
}
