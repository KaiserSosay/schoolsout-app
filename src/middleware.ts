import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localeDetection: true,
});

export async function middleware(req: NextRequest) {
  const intlRes = intlMiddleware(req);
  const res = intlRes instanceof NextResponse ? intlRes : NextResponse.next();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () =>
          req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    // DECISION: exclude manifest.webmanifest, opengraph-image, robots.txt,
    // sitemap.xml, and PWA/SEO assets from the locale rewrite so Next.js can
    // serve them at the root instead of redirecting to /en/*.
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|opengraph-image|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
