import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { SignInForm } from '@/components/public/SignInForm';

// Dedicated sign-in surface — distinct from the homepage hero (which is the
// FIRST-TIMER signup). Top-nav "Sign in" lands here so a returning parent sees
// the email field instantly instead of marketing copy.
export const dynamic = 'force-dynamic';

const NEXT_RE = /^\/(en|es)(\/|$)/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'signIn' });
  return {
    title: `${t('heading')} | School's Out!`,
    description: t('subtitle'),
    robots: { index: false, follow: false },
  };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'signIn' });

  const safeNext = sp.next && NEXT_RE.test(sp.next) ? sp.next : `/${locale}/app`;

  // DECISION: if the user already has a session, skip the form entirely and
  // bounce them to wherever `next` points (or /app). Showing a sign-in form
  // to a signed-in user is a dead click (UX rule #1).
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) redirect(safeNext);
  } catch {
    // Auth probe failures shouldn't break the page — we just render the form.
  }

  return (
    <>
      <PublicTopBar locale={locale} />
      <main className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
        <div className="rounded-3xl border border-cream-border bg-white p-6 md:p-8">
          <h1 className="text-2xl font-black text-ink md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {t('heading')}
          </h1>
          <p className="mt-2 text-sm text-muted md:text-base">{t('subtitle')}</p>
          <div className="mt-6">
            <SignInForm locale={locale} next={safeNext} />
          </div>
        </div>
      </main>
    </>
  );
}
