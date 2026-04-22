import { getTranslations } from 'next-intl/server';
import { InboxEmpty } from '@/components/app/InboxEmpty';
import { AppPageHeader } from '@/components/app/AppPageHeader';

export const dynamic = 'force-dynamic';

export default async function InboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.inbox' });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <AppPageHeader eyebrow="MESSAGES" title={t('title')} />
      <InboxEmpty />
    </div>
  );
}
