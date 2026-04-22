import { describe, it, expect } from 'vitest';
import { haversineMiles, formatMiles } from '@/lib/distance';

describe('haversineMiles', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMiles(25.7434, -80.27, 25.7434, -80.27)).toBeCloseTo(0, 5);
  });

  it('computes Coral Gables → Downtown Miami ≈ 5.1 mi', () => {
    // Coral Gables 25.7434, -80.2700 → Downtown Miami 25.7617, -80.1918
    const d = haversineMiles(25.7434, -80.27, 25.7617, -80.1918);
    expect(d).toBeGreaterThan(4.5);
    expect(d).toBeLessThan(5.7);
  });

  it('is symmetric', () => {
    const a = haversineMiles(25.7434, -80.27, 25.6112, -80.3996);
    const b = haversineMiles(25.6112, -80.3996, 25.7434, -80.27);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('formatMiles', () => {
  it('formats sub-mile with one decimal', () => {
    expect(formatMiles(0.37)).toBe('0.4 mi');
  });
  it('formats <10 mi with one decimal', () => {
    expect(formatMiles(5.14)).toBe('5.1 mi');
  });
  it('formats ≥10 mi as integer', () => {
    expect(formatMiles(12.6)).toBe('13 mi');
  });
});
