import { headers } from 'next/headers';
import { logPageView } from '@/lib/analytics';

// Server component that fires the page-view log as a side effect of
// render. Returns null so the DOM is untouched. Headers() is the right
// place to grab IP + UA in Next 14 App Router server components.
export function PageViewLogger({
  path,
  locale,
}: {
  path: string;
  locale: string;
}) {
  const h = headers();
  // Vercel sets x-forwarded-for with the true client IP. Fall back to
  // x-real-ip, then null. Never block — logPageView swallows everything.
  const forwardedFor = h.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : h.get('x-real-ip');
  const ua = h.get('user-agent');
  const referrer = h.get('referer');
  logPageView({
    path,
    referrer: referrer,
    userAgent: ua,
    ip,
    locale,
  });
  return null;
}
