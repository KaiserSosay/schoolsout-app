import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Round-3 mom-test fix: TGP's curated closure set lives at
// docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.extracted.json
// and is the source of truth that migration 035 hand-mirrors. These
// tests pin the contents so a future edit can't silently drop a
// closure or shift a date and have the migration drift out of sync.

const SIDECAR = join(
  __dirname,
  '..',
  '..',
  'docs',
  'plans',
  'calendar-pdfs',
  'the-growing-place-calendar-2025-2026.extracted.json',
);

type Closure = {
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  closed_for_students: boolean;
  is_early_release: boolean;
  confidence: 'high' | 'medium' | 'low';
};

function load(): { closures: Closure[]; schoolYear: string; source: string } {
  return JSON.parse(readFileSync(SIDECAR, 'utf8'));
}

describe('TGP calendar sidecar (the-growing-place-calendar-2025-2026.extracted.json)', () => {
  it('has 17 high-confidence closures for the 2026-27 academic year', () => {
    const data = load();
    expect(data.schoolYear).toBe('2026-2027');
    expect(data.closures.length).toBe(17);
    expect(data.closures.every((c) => c.confidence === 'high')).toBe(true);
  });

  it('starts with First Day of School on 2026-08-18 and ends on Last Day 2027-05-27', () => {
    const closures = load().closures;
    const sorted = [...closures].sort((a, b) =>
      a.start_date.localeCompare(b.start_date),
    );
    expect(sorted[0]).toMatchObject({
      name: 'First Day of School',
      start_date: '2026-08-18',
      category: 'first_day',
    });
    expect(sorted[sorted.length - 1]).toMatchObject({
      start_date: '2027-05-27',
      category: 'last_day',
    });
  });

  it('includes the four major breaks (Thanksgiving, Christmas, Spring) with the right date ranges', () => {
    const c = load().closures;
    const breakOf = (substr: string) =>
      c.find((x) => x.name.includes(substr) && x.category === 'break');
    expect(breakOf('Thanksgiving')).toMatchObject({
      start_date: '2026-11-23',
      end_date: '2026-11-27',
    });
    expect(breakOf('Christmas')).toMatchObject({
      start_date: '2026-12-21',
      end_date: '2027-01-01',
    });
    expect(breakOf('Spring')).toMatchObject({
      start_date: '2027-03-22',
      end_date: '2027-03-26',
    });
  });

  it('includes Easter Monday (Methodist-affiliated heuristic)', () => {
    const c = load().closures;
    const easter = c.find((x) => x.category === 'religious_holiday');
    expect(easter).toBeDefined();
    expect(easter!.name.toLowerCase()).toContain('easter');
    expect(easter!.start_date).toBe('2027-03-29');
  });

  it('marks every noon-dismissal as is_early_release: true with closed_for_students: false', () => {
    const earlies = load().closures.filter(
      (c) => c.category === 'early_release',
    );
    expect(earlies.length).toBe(4);
    expect(earlies.every((c) => c.is_early_release === true)).toBe(true);
    expect(earlies.every((c) => c.closed_for_students === false)).toBe(true);
  });

  it('does NOT include any PTG events (carnival, dance, water day, movie night, field day)', () => {
    const c = load().closures;
    const banned = ['ptg', 'carnival', 'dance', 'water day', 'movie night', 'field day', 'egg hunt'];
    for (const closure of c) {
      const lower = closure.name.toLowerCase();
      for (const word of banned) {
        expect(lower.includes(word)).toBe(false);
      }
    }
  });
});
