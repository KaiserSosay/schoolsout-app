'use client';

import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';

// Wraps every /app/* route. Mobile: top bar + bottom tabs. Desktop: sidebar
// only (no top bar). Keeping this client-side lets the mobile menu + bell
// drawer + mode toggle stay interactive without per-page `'use client'`.
export function AppShell({
  locale,
  email,
  displayName,
  isAdmin = false,
  children,
}: {
  locale: string;
  email: string;
  displayName: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex md:min-h-screen">
      <SideNav
        locale={locale}
        email={email}
        displayName={displayName}
        isAdmin={isAdmin}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader
          locale={locale}
          email={email}
          displayName={displayName}
          isAdmin={isAdmin}
        />
        <main className="animate-page-in flex-1 pb-24 md:pb-12">{children}</main>
        <BottomNav locale={locale} />
      </div>
    </div>
  );
}
