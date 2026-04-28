'use client';

import confetti from 'canvas-confetti';

// Fires a celebration burst from the bottom corners of the viewport for
// ~1.5 seconds. Designed for "form success" moments — operator camp
// submissions, parent calendar update submissions, password set/change.
// NOT for micro-interactions (save heart, etc.).
//
// Accessibility: skips animation entirely when the user prefers reduced
// motion. canvas-confetti's own disableForReducedMotion is also passed
// to each call as belt-and-suspenders for browsers where the
// matchMedia path is blocked (e.g., privacy modes).
//
// SSR-safe: returns immediately when window is undefined.

const DURATION_MS = 1500;
const COLORS = ['#7c3aed', '#fbbf24', '#10b981', '#06b6d4', '#ec4899'];

export function celebrate(): void {
  if (typeof window === 'undefined') return;
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (motionQuery?.matches) return;

  const end = Date.now() + DURATION_MS;

  const tick = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.85 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.85 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) {
      requestAnimationFrame(tick);
    }
  };

  tick();
}
