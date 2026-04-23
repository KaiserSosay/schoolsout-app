import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

// DECISION: Admin is English-only (skip ES). Rasheid is the single admin
// during MVP — we'll translate when we grow past one admin.
//
// Phase 2.5: consolidated to one surface at /admin. Tabs live inside the
// page via ?tab= query param. This layout just enforces auth and renders
// the outer frame (title + "← App" exit link).
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireAdminPage({ redirectTo: `/${locale}` });

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-cream-border pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
              ADMIN
            </p>
            <h1 className="text-2xl font-black text-ink">
              School&apos;s Out! operations
            </h1>
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
        {children}
      </div>
    </main>
  );
}
