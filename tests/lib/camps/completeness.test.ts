import { describe, expect, it } from 'vitest';
import {
  computeCompleteness,
  bandFor,
  type CompletenessCampShape,
} from '@/lib/camps/completeness';

// Mirrors the SQL function in migration 017. 10 fields, each worth 10%.
// Keep this table in sync with calc_camp_completeness in the migration.

function full(): CompletenessCampShape {
  return {
    phone: '(305) 555-1212',
    address: '1 Example Way, Miami, FL 33101',
    website_url: 'https://example.com',
    ages_min: 5,
    ages_max: 10,
    hours_start: '09:00',
    hours_end: '15:00',
    price_min_cents: 30000,
    price_max_cents: 50000,
    description: 'A long enough description beyond forty characters to pass the threshold check.',
    categories: ['STEM'],
    registration_url: 'https://example.com/register',
    registration_deadline: '2026-05-15',
  };
}

describe('computeCompleteness', () => {
  it('scores a fully-filled camp at 1.00', () => {
    const r = computeCompleteness(full());
    expect(r.score).toBe(1.0);
    expect(r.missing).toEqual([]);
  });

  it('scores an empty shape at 0.00', () => {
    const r = computeCompleteness({});
    expect(r.score).toBe(0);
    expect(r.missing).toHaveLength(r.total);
  });

  it('counts hours as one field only if BOTH start + end present', () => {
    const partial = { ...full(), hours_end: null };
    const r = computeCompleteness(partial);
    expect(r.missing).toContain('hours');
    expect(r.score).toBe(0.9);
  });

  it('counts price as one field only if BOTH min + max present', () => {
    const partial = { ...full(), price_max_cents: null };
    const r = computeCompleteness(partial);
    expect(r.missing).toContain('price');
    expect(r.score).toBe(0.9);
  });

  it('requires description > 40 chars to count', () => {
    const partial = { ...full(), description: 'short' };
    const r = computeCompleteness(partial);
    expect(r.missing).toContain('description');
    expect(r.score).toBe(0.9);
  });

  it('treats empty categories array as missing', () => {
    const partial = { ...full(), categories: [] };
    const r = computeCompleteness(partial);
    expect(r.missing).toContain('categories');
    expect(r.score).toBe(0.9);
  });

  it('handles whitespace-only strings as missing', () => {
    const partial = { ...full(), phone: '   ' };
    const r = computeCompleteness(partial);
    expect(r.missing).toContain('phone');
    expect(r.score).toBe(0.9);
  });

  it('produces stable 2-decimal scores', () => {
    // 7/10 should be 0.70 exactly, not 0.6999…
    const partial: CompletenessCampShape = {
      phone: '1',
      address: '1',
      website_url: 'x',
      ages_min: 5,
      ages_max: 10,
      hours_start: '09:00',
      hours_end: '15:00',
      description:
        'A description that comfortably exceeds the forty-character threshold for the field to count.',
      categories: ['STEM'],
    };
    const r = computeCompleteness(partial);
    expect(r.score).toBe(0.7);
  });
});

describe('bandFor', () => {
  it('returns complete at 1.00', () => {
    expect(bandFor(1.0)).toBe('complete');
  });
  it('returns partial at the 0.70 boundary (inclusive)', () => {
    expect(bandFor(0.7)).toBe('partial');
    expect(bandFor(0.99)).toBe('partial');
  });
  it('returns limited below 0.70', () => {
    expect(bandFor(0.69)).toBe('limited');
    expect(bandFor(0.0)).toBe('limited');
  });
});
