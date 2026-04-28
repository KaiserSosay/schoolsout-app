import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { confettiMock } = vi.hoisted(() => ({ confettiMock: vi.fn() }));
vi.mock('canvas-confetti', () => ({
  default: confettiMock,
}));

import { celebrate } from '@/lib/confetti';

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })),
  });
}

beforeEach(() => {
  confettiMock.mockClear();
  // Stub rAF as a no-op. celebrate() runs the first tick eagerly
  // (firing both corner bursts), then schedules the next via rAF —
  // which never runs in the test, so the loop exits cleanly.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('celebrate', () => {
  it('fires confetti from both bottom corners when reduced motion is OFF', () => {
    stubMatchMedia(false);

    celebrate();

    // The first synchronous tick fires two bursts (left + right corner);
    // subsequent ticks are queued via rAF which the stub no-ops.
    expect(confettiMock).toHaveBeenCalledTimes(2);
    const firstCall = confettiMock.mock.calls[0][0];
    const secondCall = confettiMock.mock.calls[1][0];
    expect(firstCall.origin).toEqual({ x: 0, y: 0.85 });
    expect(secondCall.origin).toEqual({ x: 1, y: 0.85 });
    expect(firstCall.disableForReducedMotion).toBe(true);
  });

  it('is a no-op when prefers-reduced-motion: reduce', () => {
    stubMatchMedia(true);
    celebrate();
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('does not throw when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    expect(() => celebrate()).not.toThrow();
  });
});
