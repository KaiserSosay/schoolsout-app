import { describe, it, expect } from 'vitest';
import {
  appHomeHref,
  campHref,
  closureHref,
  planAheadHref,
  publicClosureHref,
} from '@/lib/links';

// Phase 3.0 overnight C2 — Item 3.4 lifts the public-vs-app split into
// the helpers so the school-detail page can import a single function
// instead of inlining the path. This test guards against the two
// helpers ever pointing at the same route by accident.

describe('link helpers', () => {
  it('closureHref points at the auth-gated dashboard route', () => {
    expect(closureHref('en', 'abc')).toBe('/en/app/closures/abc');
    expect(closureHref('es', 'def')).toBe('/es/app/closures/def');
  });

  it('publicClosureHref points at the anonymous-friendly /breaks route', () => {
    expect(publicClosureHref('en', 'abc')).toBe('/en/breaks/abc');
    expect(publicClosureHref('es', 'def')).toBe('/es/breaks/def');
  });

  it('the two closure helpers do NOT collide', () => {
    // If someone refactors closureHref by accident, this catches it
    // before a public school page leaks anonymous traffic into /app/.
    expect(closureHref('en', 'x')).not.toBe(publicClosureHref('en', 'x'));
  });

  it('campHref / appHomeHref / planAheadHref unchanged', () => {
    expect(campHref('en', 'frost-science')).toBe('/en/app/camps/frost-science');
    expect(appHomeHref('en')).toBe('/en/app');
    expect(planAheadHref('en')).toBe('/en/app/plan-ahead');
  });
});
