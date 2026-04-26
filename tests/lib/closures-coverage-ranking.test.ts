import { describe, it, expect } from 'vitest';
import { rankCampsForClosure } from '@/lib/closures/coverage-ranking';

const CAMPS = [
  { id: 'a', name: 'Camp A' },
  { id: 'b', name: 'Camp B' },
  { id: 'c', name: 'Camp C' },
  { id: 'd', name: 'Camp D' },
];

describe('rankCampsForClosure', () => {
  it('keeps SQL order when no coverage rows exist', () => {
    const out = rankCampsForClosure(CAMPS, [], 6);
    expect(out.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(out.every((c) => c.is_open_this_closure === false)).toBe(true);
  });

  it('floats explicitly-open camps to the top, in their original order', () => {
    const out = rankCampsForClosure(
      CAMPS,
      [
        { camp_id: 'c', is_open: true },
        { camp_id: 'a', is_open: true },
      ],
      6,
    );
    // Both 'a' and 'c' are open; 'a' is earlier in the SQL list so it leads.
    expect(out.map((c) => c.id)).toEqual(['a', 'c', 'b', 'd']);
    expect(out.find((c) => c.id === 'a')?.is_open_this_closure).toBe(true);
    expect(out.find((c) => c.id === 'c')?.is_open_this_closure).toBe(true);
    expect(out.find((c) => c.id === 'b')?.is_open_this_closure).toBe(false);
  });

  it('drops explicitly-closed camps entirely', () => {
    const out = rankCampsForClosure(
      CAMPS,
      [
        { camp_id: 'b', is_open: false },
        { camp_id: 'd', is_open: false },
      ],
      6,
    );
    expect(out.map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('respects the limit cap', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}` }));
    const out = rankCampsForClosure(many, [], 6);
    expect(out.length).toBe(6);
  });

  it('open camps still float to the top when the limit would exclude them', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}` }));
    const out = rankCampsForClosure(
      many,
      [{ camp_id: 'c19', is_open: true }],
      3,
    );
    // c19 is open → first; remaining 2 slots filled by c0, c1.
    expect(out.map((c) => c.id)).toEqual(['c19', 'c0', 'c1']);
  });
});
