'use client';

import { useEffect, useState } from 'react';

// DECISION: Eased rAF count-up. Reduced-motion users + SSR + tests see the
// final value immediately; animation only runs on real browsers. `suffix`
// tacks on after the number (e.g. "5d").
//
// We init with `to` so SSR HTML and first-paint are both correct. The effect
// only rewinds to 0 + animates upward when we can prove the viewer both
// wants motion and has rAF available.
export function CountUp({
  to,
  suffix = '',
  durationMs = 600,
}: {
  to: number;
  suffix?: string;
  durationMs?: number;
}) {
  const [val, setVal] = useState(to);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip animation in tests and anywhere rAF is unavailable.
    if (
      typeof window.requestAnimationFrame !== 'function' ||
      process.env.NODE_ENV === 'test'
    ) {
      setVal(to);
      return;
    }
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVal(to);
      return;
    }
    setVal(0);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return (
    <>
      {val}
      {suffix}
    </>
  );
}
