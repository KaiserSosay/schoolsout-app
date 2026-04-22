import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
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
  if (!user || !isAdminEmail(user.email)) redirect(`/${locale}`);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-cream-border pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
              ADMIN
            </p>
            <h1 className="text-2xl font-black text-ink">School&apos;s Out! review</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-bold">
            <Link
              href={`/${locale}/admin/calendar-review`}
              className="rounded-full border border-cream-border bg-white px-3 py-1.5 hover:border-brand-purple/40"
            >
              Calendar review
            </Link>
            <Link
              href={`/${locale}/admin/camp-review`}
              className="rounded-full border border-cream-border bg-white px-3 py-1.5 hover:border-brand-purple/40"
            >
              Camp review
            </Link>
            <Link
              href={`/${locale}/app`}
              className="rounded-full border border-cream-border bg-white px-3 py-1.5 hover:border-brand-purple/40"
            >
              ← App
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
