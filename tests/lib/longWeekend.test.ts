import { describe, it, expect } from 'vitest';
import { detectLongWeekend, detectBridgeDay } from '@/lib/longWeekend';

describe('detectLongWeekend — single day', () => {
  it('Monday holiday → 3 days off', () => {
    const r = detectLongWeekend({ start_date: '2026-05-25', end_date: '2026-05-25' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.kind).toBe('three_day');
    expect(r.dayCount).toBe(3);
  });

  it('Friday holiday → 3 days off', () => {
    // 2025-11-14 is a Friday
    const r = detectLongWeekend({ start_date: '2025-11-14', end_date: '2025-11-14' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.kind).toBe('three_day');
    expect(r.dayCount).toBe(3);
  });

  it('Tuesday in isolation → NOT a long weekend', () => {
    // 2025-09-23 is a Tuesday (M-DCPS teacher planning day)
    const r = detectLongWeekend({ start_date: '2025-09-23', end_date: '2025-09-23' });
    expect(r.isLongWeekend).toBe(false);
  });

  it('Wednesday holiday → NOT a long weekend', () => {
    const r = detectLongWeekend({ start_date: '2025-11-12', end_date: '2025-11-12' });
    expect(r.isLongWeekend).toBe(false);
  });
});

describe('detectLongWeekend — multi-day', () => {
  it('Thanksgiving Recess Mon-Fri → 9 days off with surrounding weekends', () => {
    // 2025-11-24 (Mon) → 2025-11-28 (Fri) = 5-day span + Sat/Sun prior + Sat/Sun after
    const r = detectLongWeekend({ start_date: '2025-11-24', end_date: '2025-11-28' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.kind).toBe('extended');
    expect(r.dayCount).toBe(9); // 5 days + 2 (prior weekend) + 2 (following weekend)
  });

  it('Spring Recess Mon-Fri → 9 days off', () => {
    const r = detectLongWeekend({ start_date: '2026-03-23', end_date: '2026-03-27' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.dayCount).toBe(9);
  });

  it('Winter Recess 12 days → long with following weekend', () => {
    // 2025-12-22 Mon → 2026-01-02 Fri = 12 days span
    const r = detectLongWeekend({ start_date: '2025-12-22', end_date: '2026-01-02' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.kind).toBe('extended');
    expect(r.dayCount).toBeGreaterThanOrEqual(14);
  });

  it('two-day closure Mon-Tue → 4 days off (Sat/Sun/Mon/Tue)', () => {
    const r = detectLongWeekend({ start_date: '2026-01-19', end_date: '2026-01-20' });
    expect(r.isLongWeekend).toBe(true);
    expect(r.dayCount).toBe(4);
  });
});

describe('detectBridgeDay', () => {
  it('Tuesday after a Monday holiday → 4-day weekend', () => {
    // Hypothetical: Monday is federal holiday, Tuesday is teacher planning day
    const monday = { start_date: '2026-09-07', end_date: '2026-09-07' };
    const tuesday = { start_date: '2026-09-08', end_date: '2026-09-08' };
    const bridge = detectBridgeDay(tuesday, [monday]);
    expect(bridge).not.toBeNull();
    expect(bridge!.kind).toBe('four_day_bridge');
    expect(bridge!.dayCount).toBe(4);
  });

  it('Tuesday without prior-Monday holiday → null', () => {
    const tuesday = { start_date: '2026-09-08', end_date: '2026-09-08' };
    expect(detectBridgeDay(tuesday, [])).toBeNull();
  });

  it('Wednesday-only closure → null regardless of siblings', () => {
    const wednesday = { start_date: '2025-11-12', end_date: '2025-11-12' };
    const tuesday = { start_date: '2025-11-11', end_date: '2025-11-11' };
    expect(detectBridgeDay(wednesday, [tuesday])).toBeNull();
  });
});
