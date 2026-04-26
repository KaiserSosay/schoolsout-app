import { describe, it, expect } from 'vitest';
import { yearsLabelForClosures } from '@/lib/schools/calendar-years';

describe('yearsLabelForClosures', () => {
  it('returns empty string when no closures', () => {
    expect(yearsLabelForClosures([])).toBe('');
  });

  it('renders a single school_year with an en-dash', () => {
    expect(
      yearsLabelForClosures([{ school_year: '2026-2027' }]),
    ).toBe('2026–2027');
  });

  it('joins multiple distinct school_years with " · "', () => {
    expect(
      yearsLabelForClosures([
        { school_year: '2026-2027' },
        { school_year: '2025-2026' },
        { school_year: '2026-2027' },
      ]),
    ).toBe('2025–2026 · 2026–2027');
  });

  it('treats null/empty/missing school_year fields as absent', () => {
    expect(
      yearsLabelForClosures([
        { school_year: null },
        { school_year: '' },
        {},
      ] as Array<{ school_year?: string | null }>),
    ).toBe('');
  });

  it('mixes a real year alongside null entries cleanly', () => {
    expect(
      yearsLabelForClosures([
        { school_year: null },
        { school_year: '2026-2027' },
      ] as Array<{ school_year?: string | null }>),
    ).toBe('2026–2027');
  });

  it('rejects malformed school_year strings (no panic, no output)', () => {
    expect(
      yearsLabelForClosures([
        { school_year: 'not a year' },
        { school_year: '2026' },
        { school_year: '2026-2027-2028' },
      ] as Array<{ school_year?: string | null }>),
    ).toBe('');
  });

  it('sorts years chronologically in the multi-year label', () => {
    expect(
      yearsLabelForClosures([
        { school_year: '2027-2028' },
        { school_year: '2025-2026' },
        { school_year: '2026-2027' },
      ]),
    ).toBe('2025–2026 · 2026–2027 · 2027–2028');
  });
});
