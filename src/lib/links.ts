// Centralized URL helpers. Import these everywhere instead of
// hard-coding `/${locale}/app/...` strings — one place to change routing
// if we ever restructure.

export const closureHref = (locale: string, id: string) =>
  `/${locale}/app/closures/${id}`;

export const campHref = (locale: string, slug: string) =>
  `/${locale}/app/camps/${slug}`;

export const appHomeHref = (locale: string) => `/${locale}/app`;
export const planAheadHref = (locale: string) => `/${locale}/app/plan-ahead`;

// Shared focus-ring class for every tappable Link in the app.
// Keeps keyboard navigation visible without cluttering individual components.
export const focusRing =
  'focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:outline-none';
