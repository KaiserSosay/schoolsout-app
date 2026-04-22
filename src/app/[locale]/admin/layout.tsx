import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// DECISION: Admin is English-only (skip ES). Rasheid is the single admin
// during MVP — we'll translate when we grow past one admin.

type NavItem = { href: (locale: string) => string; label: string };
const NAV: NavItem[] = [
  { href: (l) => `/${l}/admin`, label: 'Overview' },
  { href: (l) => `/${l}/admin/users`, label: 'Users' },
  { href: (l) => `/${l}/admin/camp-applications`, label: 'Applications' },
  { href: (l) => `/${l}/admin/camps`, label: 'Camps' },
  { href: (l) => `/${l}/admin/calendar-review`, label: 'Calendar' },
  { href: (l) => `/${l}/admin/camp-review`, label: 'Logistics' },
  { href: (l) => `/${l}/admin/reminders`, label: 'Reminders' },
  { href: (l) => `/${l}/admin/city-requests`, label: 'City demand' },
  { href: (l) => `/${l}/admin/categories`, label: 'Categories' },
];

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
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-cream-border pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
              ADMIN
            </p>
            <h1 className="text-2xl font-black text-ink">School&apos;s Out! operations</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-cream-border bg-white px-3 py-1.5 text-[11px] font-bold text-muted md:inline-flex">
              Signed in as <span className="ml-1 font-black text-ink">{user.email}</span>
            </span>
            <Link
              href={`/${locale}/app`}
              className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-xs font-bold hover:border-brand-purple/40"
            >
              ← App
            </Link>
          </div>
        </header>
        <nav className="mb-6 -mx-1 flex flex-wrap gap-1.5 text-xs font-bold">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href(locale)}
              className="rounded-full border border-cream-border bg-white px-3 py-1.5 transition-colors hover:border-brand-purple/40 hover:text-brand-purple"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  );
}
