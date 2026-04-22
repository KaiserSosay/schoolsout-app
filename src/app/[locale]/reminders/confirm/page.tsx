import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// DECISION: Backward-compat forwarder. Emails already sent (pre-fix) have a
// confirm link that lands on this page. We forward any incoming `code`,
// `token_hash`, or `type` params to /auth/callback so the session exchange
// happens there and the user ends up on /reminders/confirmed.
export default async function LegacyConfirmForwarder({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') qs.set(k, v);
    else if (Array.isArray(v) && v.length > 0) qs.set(k, v[0]!);
  }
  if (!qs.has('next')) qs.set('next', `/${locale}/reminders/confirmed`);

  redirect(`/auth/callback?${qs.toString()}`);
}
