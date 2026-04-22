import { getTranslations } from 'next-intl/server';
import { InboxEmpty } from '@/components/app/InboxEmpty';

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
      <header className="mb-5">
        <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          MESSAGES
        </div>
        <h1
          className="mt-1 text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
      </header>
      <InboxEmpty />
    </div>
  );
}
