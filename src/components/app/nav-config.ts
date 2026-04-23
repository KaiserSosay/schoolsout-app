// Shared nav tabs used by BottomNav (mobile) and SideNav (desktop).
// Keep this list small: 5 items max. Anything else goes in the user menu.
export type NavTabKey = 'home' | 'calendar' | 'camps' | 'saved' | 'family';

export type NavTab = {
  key: NavTabKey;
  emoji: string;
  href: (locale: string) => string;
};

export const NAV_TABS: readonly NavTab[] = [
  { key: 'home',     emoji: '🏠', href: (l) => `/${l}/app` },
  { key: 'calendar', emoji: '📅', href: (l) => `/${l}/app/calendar` },
  { key: 'camps',    emoji: '🏕️', href: (l) => `/${l}/app/camps` },
  { key: 'saved',    emoji: '❤️', href: (l) => `/${l}/app/saved` },
  { key: 'family',   emoji: '👤', href: (l) => `/${l}/app/family` },
] as const;

// Active-match helper. Home is special: only active on exact /app because
// every other tab also lives under /app.
export function isTabActive(pathname: string, href: string): boolean {
  if (href.endsWith('/app')) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}
