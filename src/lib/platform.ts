// Browser/OS detection for the PWA install-instructions modal.
//
// DECISION (Phase 3.0 / Item 1.3): UA sniffing is unfortunately the right
// answer here — `beforeinstallprompt` and `navigator.standalone` only
// cover a subset of platforms, and we need to render different copy
// (different share-icon, different menu) for iOS vs Android vs desktop.
// We're not gating features on this — we're rendering instructions —
// so the brittleness of UA strings is acceptable.

export type Platform =
  | 'ios-safari'
  | 'android-chrome'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'standalone'
  | 'other';

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other';

  // Already installed → no instructions needed.
  type SafariNav = Navigator & { standalone?: boolean };
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as SafariNav).standalone === true;
  if (standalone) return 'standalone';

  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  // Safari is "Safari" without "Chrome"/"CriOS"/"FxiOS"/"EdgiOS".
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isEdge = /Edg\//.test(ua);
  const isChrome = /Chrome\//.test(ua) && !isEdge;

  if (isIos && isSafari) return 'ios-safari';
  if (isAndroid && isChrome) return 'android-chrome';
  if (!isIos && !isAndroid && isChrome) return 'desktop-chrome';
  if (isEdge) return 'desktop-edge';
  return 'other';
}
