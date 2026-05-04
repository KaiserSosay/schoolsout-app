'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

// VersionUpdateBanner — small dismissible chip that appears when the
// server's deployed build ID drifts from the build ID baked into this
// page's JS bundle. Solves the "PWA tab open for days, deploy went
// out, user is still on yesterday's code" case without a service
// worker. Honest scope: this only helps users running THIS code or
// later — older bundles don't have the check and can only refresh by
// closing+reopening the PWA.
//
// How it works:
//   - On mount, read the bundle's NEXT_PUBLIC_BUILD_ID.
//   - Poll GET /api/version on visibility-change-to-visible and every
//     5 minutes while visible.
//   - On mismatch: show a chip. Dismiss writes the seen build ID to
//     localStorage so we don't pester for the same version twice.
//   - Refresh button hard-reloads with a ?v=<ts> cache-buster, which
//     forces a fresh HTML fetch even if the browser cached the page.

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min while visible
const STORAGE_KEY = 'so-update-dismissed-build';

function getBundleBuildId(): string {
  // process.env.NEXT_PUBLIC_BUILD_ID is inlined at build time by the
  // env block in next.config.mjs.
  return process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
}

async function fetchServerBuildId(signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch('/api/version', {
      cache: 'no-store',
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: string };
    return typeof data.buildId === 'string' ? data.buildId : null;
  } catch {
    return null;
  }
}

export function VersionUpdateBanner() {
  const t = useTranslations('versionBanner');
  const [serverBuild, setServerBuild] = useState<string | null>(null);
  const [dismissedBuild, setDismissedBuild] = useState<string | null>(null);
  const bundleBuild = useRef<string>(getBundleBuildId());

  const checkVersion = useCallback((signal: AbortSignal) => {
    fetchServerBuildId(signal).then((id) => {
      if (id) setServerBuild(id);
    });
  }, []);

  useEffect(() => {
    // Read the dismissal flag once on mount so we can suppress the
    // banner for a build the user already chose to ignore.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDismissedBuild(raw);
    } catch {
      /* private mode — ignore */
    }

    // Skip the entire mechanism in dev — buildId is just 'dev' and
    // there's nothing to compare.
    if (bundleBuild.current === 'dev') return;

    const ac = new AbortController();
    checkVersion(ac.signal);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkVersion(ac.signal);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkVersion(ac.signal);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      ac.abort();
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [checkVersion]);

  const mismatched =
    serverBuild !== null &&
    serverBuild !== bundleBuild.current &&
    serverBuild !== dismissedBuild;

  if (!mismatched) return null;

  const onDismiss = () => {
    try {
      if (serverBuild) window.localStorage.setItem(STORAGE_KEY, serverBuild);
    } catch {
      /* ignore */
    }
    setDismissedBuild(serverBuild);
  };

  const onRefresh = () => {
    // Cache-buster query string forces a fresh HTML fetch even if
    // the browser HTTP cache had a stale copy. Preserves any existing
    // query params the user was on.
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.href = url.toString();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="version-update-banner"
      className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-cream-border bg-ink px-3 py-2 text-cream shadow-lg motion-safe:animate-[slideUp_300ms_ease-out] md:left-auto md:right-6 md:translate-x-0"
    >
      <span aria-hidden className="text-base">✨</span>
      <span className="text-xs font-bold md:text-sm">{t('headline')}</span>
      <button
        type="button"
        onClick={onRefresh}
        className="min-h-9 inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-black text-ink hover:bg-gold/90"
      >
        {t('refresh')}
      </button>
      <button
        type="button"
        aria-label={t('dismissAria')}
        onClick={onDismiss}
        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-full text-cream/80 hover:text-cream"
      >
        ✕
      </button>
    </div>
  );
}
