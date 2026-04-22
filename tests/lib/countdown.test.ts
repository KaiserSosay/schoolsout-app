import { describe, it, expect } from 'vitest';
import { countdownColor, daysUntil } from '@/lib/countdown';

describe('countdown', () => {
  it('daysUntil returns integer day delta from today', () => {
    const today = new Date('2026-04-21T12:00:00Z');
    expect(daysUntil('2026-04-28', today)).toBe(7);
    expect(daysUntil('2026-04-21', today)).toBe(0);
    expect(daysUntil('2026-04-20', today)).toBe(-1);
  });

  it('countdownColor: emerald if <=7, amber if <=30, gray otherwise', () => {
    expect(countdownColor(0)).toBe('emerald');
    expect(countdownColor(7)).toBe('emerald');
    expect(countdownColor(8)).toBe('amber');
    expect(countdownColor(30)).toBe('amber');
    expect(countdownColor(31)).toBe('gray');
  });
});
