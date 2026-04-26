// Tests for scripts/import-schools-research.ts.
//
// Covers the pure helpers (row builders, status mapping, emoji selection,
// null-preservation patch logic) and a small structural fixture that mimics
// the plan's spec: 1 synthetic district + 2 M-DCPS + 1 private + 1
// preschool, 3 district closures + 1 direct private closure, with the
// expected fan-out behavior.

import { describe, it, expect } from 'vitest';
import {
  ANCHOR_PRIVATE_SLUGS,
  buildClosureRow,
  buildPatch,
  buildSchoolRow,
  cityFromAddress,
  emojiForClosure,
  generatedSlug,
  growingPlaceOverride,
  mapCalendarStatus,
  MDCPS_EARLY_RELEASE_PATTERN,
  nameKey,
  slugify,
  statusFromConfidence,
} from '../../scripts/import-schools-research';

const NOW = '2026-04-24T10:00:00.000Z';

describe('slugify', () => {
  it('lowercases and dashes punctuation', () => {
    expect(slugify("The Growing Place School")).toBe('the-growing-place-school');
  });
  it('collapses runs of non-alphanumerics', () => {
    expect(slugify('Foo  &&  Bar')).toBe('foo-bar');
  });
  it('trims trailing dashes', () => {
    expect(slugify('Hello!')).toBe('hello');
  });
});

describe('generatedSlug', () => {
  it('matches the migration-018 GENERATED expression (no trim)', () => {
    expect(generatedSlug('Miami Catholic Schools (diocesan)')).toBe(
      'miami-catholic-schools-diocesan-',
    );
  });
});

describe('nameKey', () => {
  it('drops school/academy and normalizes preparatory→prep', () => {
    expect(nameKey('Gulliver Preparatory School')).toBe('gulliver-prep');
    expect(nameKey('Ransom Everglades School')).toBe('ransom-everglades');
  });
});

describe('cityFromAddress', () => {
  it('extracts the city before "FL ZIP"', () => {
    expect(cityFromAddress('536 Coral Way, Coral Gables, FL 33134')).toBe('Coral Gables');
  });
  it('returns null on missing address', () => {
    expect(cityFromAddress(null)).toBeNull();
    expect(cityFromAddress(undefined)).toBeNull();
  });
});

describe('mapCalendarStatus', () => {
  it("maps 'verified' + is_mdcps to verified_multi_year", () => {
    expect(mapCalendarStatus('verified', true)).toBe('verified_multi_year');
  });
  it("maps 'verified' + non-mdcps to verified_current", () => {
    expect(mapCalendarStatus('verified', false)).toBe('verified_current');
  });
  it("maps 'pending_pdf_review' to needs_research", () => {
    expect(mapCalendarStatus('pending_pdf_review', false)).toBe('needs_research');
  });
  it("maps 'needs_pdf_review' (Growing Place) to needs_research", () => {
    expect(mapCalendarStatus('needs_pdf_review', false)).toBe('needs_research');
  });
  it("maps 'not_available_online' to unavailable", () => {
    expect(mapCalendarStatus('not_available_online', false)).toBe('unavailable');
  });
  it("defaults unknown values to needs_research", () => {
    expect(mapCalendarStatus('huh', false)).toBe('needs_research');
    expect(mapCalendarStatus(null, false)).toBe('needs_research');
  });
});

describe('emojiForClosure', () => {
  it('matches name patterns first', () => {
    expect(emojiForClosure('Thanksgiving Recess', 'school_break')).toBe('🦃');
    expect(emojiForClosure('Winter Recess', 'school_break')).toBe('❄️');
    expect(emojiForClosure('Last Day of School', 'last_day')).toBe('🎓');
    expect(emojiForClosure('Teacher Planning Day', 'teacher_workday')).toBe('📝');
  });
  it('falls back to category emoji when no name match', () => {
    expect(emojiForClosure('Random Closure', 'first_day')).toBe('🍎');
    expect(emojiForClosure('Random Closure', 'other')).toBe('📅');
  });
});

describe('statusFromConfidence', () => {
  it("maps 'high' to verified", () => {
    expect(statusFromConfidence('high')).toBe('verified');
  });
  it('maps anything else to ai_draft', () => {
    expect(statusFromConfidence('medium')).toBe('ai_draft');
    expect(statusFromConfidence('low')).toBe('ai_draft');
    expect(statusFromConfidence(null)).toBe('ai_draft');
    expect(statusFromConfidence(undefined)).toBe('ai_draft');
  });
});

describe('growingPlaceOverride', () => {
  it('returns the override patch only for the TGP slug', () => {
    const o = growingPlaceOverride('the-growing-place-school');
    expect(o).not.toBeNull();
    expect(o?.calendar_status).toBe('needs_research');
    expect(String(o?.data_source_notes)).toContain('(305) 446-0846');
    expect(String(o?.data_source_notes)).toContain("Noah");
  });
  it('returns null for any other slug', () => {
    expect(growingPlaceOverride('miami-senior-high')).toBeNull();
    expect(growingPlaceOverride('mdcps-district')).toBeNull();
  });
});

describe('ANCHOR_PRIVATE_SLUGS', () => {
  it('includes Growing Place and the named anchor privates', () => {
    expect(ANCHOR_PRIVATE_SLUGS).toContain('the-growing-place-school');
    expect(ANCHOR_PRIVATE_SLUGS).toContain('gulliver-preparatory-school');
    expect(ANCHOR_PRIVATE_SLUGS).toContain('basis-brickell');
  });
});

describe('buildSchoolRow', () => {
  it('wires the synthetic district row with verified_multi_year + early-release pattern', () => {
    const row = buildSchoolRow(
      {
        name: 'Miami-Dade County Public Schools (District Calendar)',
        slug: 'mdcps-district',
        type: 'public',
        district: 'Miami-Dade County Public Schools',
        is_mdcps: true,
        district_calendar_slug: 'mdcps-district',
        verification: { calendar_status: 'verified', primary_source_url: 'https://x' },
      },
      NOW,
    );
    expect(row.slug).toBe('mdcps-district');
    expect(row.type).toBe('public');
    expect(row.is_mdcps).toBe(true);
    expect(row.calendar_status).toBe('verified_multi_year');
    expect(row.early_release_pattern).toBe(MDCPS_EARLY_RELEASE_PATTERN);
    expect(row.state).toBe('FL');
    expect(row.data_source).toBe('research-2026-04-24');
    expect(row.last_verified_at).toBe(NOW);
  });

  it('derives city from address when present', () => {
    const row = buildSchoolRow(
      {
        name: 'Coral Gables Prep',
        slug: 'coral-gables-prep',
        type: 'charter',
        district: 'M-DCPS',
        address: '536 Coral Way, Coral Gables, FL 33134',
      },
      NOW,
    );
    expect(row.city).toBe('Coral Gables');
    expect(row.is_mdcps).toBe(false);
    expect(row.early_release_pattern).toBeNull();
  });

  it('leaves early_release_pattern null on non-mdcps schools', () => {
    const row = buildSchoolRow(
      {
        name: 'Acme Private',
        slug: 'acme-private',
        type: 'independent',
        district: 'Acme Private',
        is_mdcps: false,
      },
      NOW,
    );
    expect(row.early_release_pattern).toBeNull();
  });
});

describe('buildClosureRow', () => {
  it('builds a direct closure with status from confidence', () => {
    const row = buildClosureRow(
      {
        school_slug: 'palmer-trinity-school',
        school_year: '2025-2026',
        name: 'Labor Day',
        category: 'federal_holiday',
        start_date: '2025-09-01',
        end_date: '2025-09-01',
        verification: { source_type: 'school_pdf', confidence: 'high' },
      },
      'school-uuid',
      false,
    );
    expect(row.school_id).toBe('school-uuid');
    expect(row.status).toBe('verified');
    expect(row.derived_from_district).toBe(false);
    expect(row.source).toBe('school_pdf');
    expect(row.emoji).toBe('🛠️');
  });
  it('marks fan-out rows with derived_from_district + district source', () => {
    const row = buildClosureRow(
      {
        school_slug: 'mdcps-district',
        school_year: '2025-2026',
        name: 'Winter Recess',
        category: 'school_break',
        start_date: '2025-12-22',
        end_date: '2026-01-02',
        verification: { confidence: 'high' },
      },
      'mdcps-public-school-uuid',
      true,
    );
    expect(row.derived_from_district).toBe(true);
    expect(row.source).toBe('district_calendar_fanout');
    expect(row.school_id).toBe('mdcps-public-school-uuid');
    expect(row.status).toBe('verified');
  });
  it('defaults closed_for_students to true and is_early_release to false', () => {
    const row = buildClosureRow(
      {
        school_slug: 'foo',
        school_year: '2025-2026',
        name: 'X',
        category: 'other',
        start_date: '2025-10-10',
        end_date: '2025-10-10',
      },
      'uuid',
    );
    expect(row.closed_for_students).toBe(true);
    expect(row.is_early_release).toBe(false);
  });
});

describe('buildPatch — R5 (bulk imports fill gaps, never overwrite)', () => {
  it('preserves existing non-null phone when research has null', () => {
    const research = { phone: null };
    const exist = { phone: '305-555-1212' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.phone).toBeUndefined();
    expect(preserved.count).toBe(1);
    expect(preserved.keys).toContain('phone');
  });

  it('R5: preserves prod value even when research has fresher-looking data', () => {
    // R5 explicitly inverts the older "overwrite when research has a value"
    // behavior. Non-null prod = intentional state, automation cannot reliably
    // judge whether research is fresher / older / wronger. Always preserve.
    const research = { phone: '305-NEW' };
    const exist = { phone: '305-OLD' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.phone).toBeUndefined();
    expect(preserved.count).toBe(1);
    expect(preserved.keys).toContain('phone');
  });

  it('fills an empty prod field with research value (gap fill)', () => {
    const research = { phone: '305-NEW' };
    const exist = { phone: null };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.phone).toBe('305-NEW');
    expect(preserved.count).toBe(0);
  });

  it('fills an undefined prod field with research value', () => {
    const research = { phone: '305-NEW' };
    const exist = {} as Record<string, unknown>;
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.phone).toBe('305-NEW');
  });

  it('treats an empty array in prod as a fillable gap', () => {
    const research = { verified_fields: ['name', 'phone'] };
    const exist = { verified_fields: [] };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.verified_fields).toEqual(['name', 'phone']);
  });

  it('preserves existing arrays when research is empty array', () => {
    const research = { verified_fields: [] };
    const exist = { verified_fields: ['name', 'phone'] };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.verified_fields).toBeUndefined();
    expect(preserved.keys).toContain('verified_fields');
  });

  it('R5 exception: data_source ALWAYS takes the research value (provenance)', () => {
    // Provenance metadata is internal and benefits from being current. The
    // exception is explicit, narrow, and lives in the function default.
    const research = { data_source: 'research-2026-04-24' };
    const exist = { data_source: 'manual-curated' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.data_source).toBe('research-2026-04-24');
    expect(preserved.count).toBe(0);
  });

  it('researchManagedKeys param lets callers opt extra fields into the exception list', () => {
    const research = { phone: '305-NEW', notes: 'fresh' };
    const exist = { phone: '305-OLD', notes: 'stale' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved, new Set(['notes']));
    expect(patch.phone).toBeUndefined(); // R5 default — preserve
    expect(patch.notes).toBe('fresh'); // explicitly research-managed
  });

  it('treats a stub-string prod value as non-null (preserved) — surfaces the address-stub edge case', () => {
    // A "Coral Gables, FL" address is technically non-null but functionally
    // useless. R5 strict-mode preserves it. The dry-run output is responsible
    // for flagging stub-vs-full mismatches so an operator can decide per row.
    const research = { address: '536 Coral Way, Coral Gables, FL 33134' };
    const exist = { address: 'Coral Gables, FL' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.address).toBeUndefined();
    expect(preserved.keys).toContain('address');
  });

  it('skips slug + id keys (managed by caller)', () => {
    const research = { slug: 'new-slug', id: 'x', name: 'Y' };
    const exist = { slug: 'old-slug', id: 'y', name: 'Y' };
    const preserved = { count: 0, keys: [] as string[] };
    const patch = buildPatch(research, exist, preserved);
    expect(patch.slug).toBeUndefined();
    expect(patch.id).toBeUndefined();
    // R5: prod 'Y' is preserved even when research also has 'Y' (no-op,
    // since the values match — the patch just doesn't mention name).
    expect(patch.name).toBeUndefined();
  });
});

describe('end-to-end planning fixture', () => {
  // The plan's spec: 1 synthetic district + 2 M-DCPS schools + 1 private +
  // 1 preschool. 3 district closures + 1 private direct closure. After
  // planning: M-DCPS schools each get 3 fan-out rows; private gets 1 direct;
  // preschool gets 0; district itself gets 3.
  const schools = [
    { slug: 'district', name: 'District', type: 'public', district: 'D', is_mdcps: true,
      district_calendar_slug: 'district',
      verification: { calendar_status: 'verified' } },
    { slug: 'mdcps-a', name: 'MDCPS A', type: 'public', district: 'D', is_mdcps: true,
      district_calendar_slug: 'district',
      verification: { calendar_status: 'verified' } },
    { slug: 'mdcps-b', name: 'MDCPS B', type: 'magnet', district: 'D', is_mdcps: true,
      district_calendar_slug: 'district',
      verification: { calendar_status: 'verified' } },
    { slug: 'private-c', name: 'Private C', type: 'private', district: 'P', is_mdcps: false,
      verification: { calendar_status: 'verified' } },
    { slug: 'preschool-d', name: 'Preschool D', type: 'preschool', district: 'PS',
      is_mdcps: false,
      verification: { calendar_status: 'pending_pdf_review' } },
  ];

  it('builds district + private + preschool school rows with the right calendar_status', () => {
    const rows = schools.map((s) => buildSchoolRow(s as never, NOW));
    expect(rows[0].calendar_status).toBe('verified_multi_year'); // district
    expect(rows[1].calendar_status).toBe('verified_multi_year'); // mdcps a
    expect(rows[2].calendar_status).toBe('verified_multi_year'); // mdcps b
    expect(rows[3].calendar_status).toBe('verified_current');    // private
    expect(rows[4].calendar_status).toBe('needs_research');      // preschool
  });

  it('fan-out targets are exactly the M-DCPS schools that follow the district (3 schools, excluding the synthetic district itself)', () => {
    // Reproduce the script's filter: is_mdcps=true AND district_calendar_slug=DISTRICT
    // AND slug !== DISTRICT.
    const DISTRICT = 'district';
    const fanout = schools.filter(
      (s) => s.is_mdcps && s.district_calendar_slug === DISTRICT && s.slug !== DISTRICT,
    );
    expect(fanout.map((s) => s.slug)).toEqual(['mdcps-a', 'mdcps-b']);
  });

  it('produces 6 fan-out closures (2 schools × 3 district closures)', () => {
    const districtClosures = [
      { school_slug: 'district', school_year: '2025-2026', name: 'Labor Day',
        category: 'federal_holiday', start_date: '2025-09-01', end_date: '2025-09-01',
        verification: { confidence: 'high' } },
      { school_slug: 'district', school_year: '2025-2026', name: 'Thanksgiving Recess',
        category: 'school_break', start_date: '2025-11-24', end_date: '2025-11-28',
        verification: { confidence: 'high' } },
      { school_slug: 'district', school_year: '2025-2026', name: 'Winter Recess',
        category: 'school_break', start_date: '2025-12-22', end_date: '2026-01-02',
        verification: { confidence: 'high' } },
    ];
    const targets = ['mdcps-a-id', 'mdcps-b-id'];
    const fanoutRows: Array<Record<string, unknown>> = [];
    for (const t of targets)
      for (const c of districtClosures) fanoutRows.push(buildClosureRow(c, t, true));
    expect(fanoutRows.length).toBe(6);
    expect(fanoutRows.every((r) => r.derived_from_district === true)).toBe(true);
    expect(fanoutRows.every((r) => r.source === 'district_calendar_fanout')).toBe(true);
    expect(fanoutRows.every((r) => r.status === 'verified')).toBe(true);
    // Idempotency: running the same builder twice produces equal rows by
    // (school_id, start_date, name); the import script uses that triple as
    // the dedupe key, so duplicate inserts can't happen on re-run.
    const keys = new Set(fanoutRows.map((r) => `${r.school_id}|${r.start_date}|${r.name}`));
    expect(keys.size).toBe(6);
  });
});
