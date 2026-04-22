import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// DECISION: The old "🎉 You're all set" dead-end page has been removed. Any
// legacy links (old emails, bookmarks) get forwarded to /{locale}/app — the
// logged-in layout will auth-guard and send them to onboarding if needed.
export default async function ConfirmedRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/app`);
}
