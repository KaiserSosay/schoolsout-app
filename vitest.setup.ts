import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship with matchMedia. Many new UX-polish components use
// `window.matchMedia('(prefers-reduced-motion: reduce)')` to short-circuit
// animations — stub it here so tests don't throw.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
