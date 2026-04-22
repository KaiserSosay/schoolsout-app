'use client';

// DECISION: Smooth-scroll to the signup anchor, then pulse the form with a
// brand-colored glow + focus the email input. If the anchor is already in
// view or the user prefers reduced motion, skip the scroll and just pulse.
// Uses a setTimeout fallback because `scrollend` isn't on Safari < 17.
export function focusSignup(): void {
  if (typeof document === 'undefined') return;
  const anchor = document.querySelector<HTMLElement>('[data-signup-anchor]');
  const input = document.querySelector<HTMLInputElement>('[data-signup-email]');
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pulse = () => {
    anchor.classList.remove('glow-pulse');
    // force reflow so the class re-add retriggers the animation
    void anchor.offsetWidth;
    anchor.classList.add('glow-pulse');
    setTimeout(() => anchor.classList.remove('glow-pulse'), 1700);
    try {
      input?.focus({ preventScroll: true });
    } catch {
      /* focus() is synchronous — catch in case of stale DOM */
    }
  };

  if (inView || reduced) {
    pulse();
    return;
  }

  anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(pulse, 650);
}
