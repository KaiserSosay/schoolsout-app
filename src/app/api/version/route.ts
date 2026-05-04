import { NextResponse } from 'next/server';

// GET /api/version — returns the build ID of the currently deployed
// server. The client compares this against its own bundle's
// NEXT_PUBLIC_BUILD_ID; on mismatch the VersionUpdateBanner shows.
//
// force-dynamic + no-store: the response MUST reflect the current
// deploy, not be cached on the edge or in the browser. Otherwise a
// stale client would compare against a stale server and never see the
// mismatch.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'dev';
  return NextResponse.json(
    { buildId, ts: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    },
  );
}
