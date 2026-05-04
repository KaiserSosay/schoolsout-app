import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const config = {
  // Bake the deployed git SHA into both the client bundle and the server
  // env so the client can compare its built-in build ID against the live
  // /api/version response. Falls back to 'dev' for local builds where
  // Vercel hasn't injected the env. Bumped on every deploy by Vercel.
  env: {
    NEXT_PUBLIC_BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'dev',
  },
};

export default withNextIntl(config);
