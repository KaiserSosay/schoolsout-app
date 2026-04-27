# Camp Categories — Stage 2 Implementation Plan

**Date:** 2026-04-27
**Stage:** 2 of 2 — plan only; no migrations or code changes yet
**Predecessors:**
- `docs/plans/camp-categories-canonical-2026-04-27.md` (canonical vocabulary spec)
- `docs/plans/camp-recategorization-proposal-2026-04-27.md` (per-camp diffs)
- `docs/plans/camp-category-gaps-2026-04-27.md` (coverage report)

**Status:** awaiting Rasheid's approval before any migration / UI / script changes ship.

---

## Locked-in design decisions

From Stage 1 review on 2026-04-27:

### Q1 — orphan folds

| From | Action | Verb |
|---|---|---|
| `animals` | → `nature` | drop `animals`, ensure `nature` |
| `water` | → `swim` AND `outdoor` (dual-tag) | drop `water`, ensure both |
| `active` | → `sports` | drop `active`, ensure `sports` |
| `indoor` | → `sports` (also covered by active fold; drop redundancy) | drop `indoor`, ensure `sports` |
| `adventure` | → `outdoor` | drop `adventure`, ensure `outdoor` |
| `fencing` | KEEP + dual-tag `sports` | keep `fencing`, ensure `sports` |
| `maker` | → `stem` | drop `maker`, ensure `stem` |

### Q1 — UI threshold rule

Any category with fewer than **3 camps** doesn't get its own UI filter pill. Camps still carry the tag for searchability (URL `?cats=fencing` works) but no chip in the filter row. Stage 2 also adds a unit test that fails CI if a UI pill is shown for a category with `<3` camps in the canonical seed.

### Q2 — season tags

`one_day`, `winter_break`, `spring_break`, `short_break`, `summer` stay as categories for now. Schema-level `session_type` column deferred to Phase 4.x roadmap.

### Q3 — religious treatment

Both filter pill (8 camps post-revisions, ≥3 threshold met) AND card badge (🙏 emoji, top-right alongside Featured + Verified pills, label: "Religious program").

### 7 Section B strike revisions (locked)

- Strike `religious` from: `key-biscayne-aquatic-camp`, `camp-klurman-jcc`, `david-posnack-jcc-adventure-camp`
- Strike `academic` from: `alexander-montessori-old-cutler`, `alexander-montessori-palmetto-bay`, `alexander-montessori-red-road`, `coconut-grove-montessori-summer-camp`, `city-of-aventura-stem-camp`

---

## §1 — Final canonical category list

After applying Section A (25 camps), Section B with 7 strikes (10 effective camps), Q1 folds, and the Q3 religious decision. **Total: 21 categories survive.** Camp count: 136.

| Category | Final count | UI pill? | Notes |
|---|---:|---|---|
| `sports` | 70 | ✅ | Gained 2 from active+indoor fold |
| `general` | 56 | ✅ NEW | "All-around camps" — first-time pill |
| `arts` | 44 | ✅ (rename) | Was `Art` in UI; lowercase + plural |
| `outdoor` | 35 | ✅ NEW | Gained from adventure + water folds |
| `stem` | 30 | ✅ | Was `STEM` in UI; lowercase |
| `summer` | 26 | ⚠ NO | Season tag — see Q2 deferred decision |
| `nature` | 24 | ✅ | Gained from animals fold |
| `swim` | 23 | ✅ | Gained 1 from water fold (Tidal Cove) |
| `academic` | 18 | ✅ NEW | Down from 23 after 5 strikes |
| `cultural` | 10 | ✅ NEW | Includes folded `History` |
| `preschool` | 10 | ✅ NEW | Or fold into age filter — see open question |
| `music` | 9 | ✅ | |
| `theater` | 9 | ✅ | |
| `religious` | 8 | ✅ NEW | + card badge per Q3 |
| `tennis` | 8 | ✅ | Was 1 → fixed by Section A |
| `sailing` | 5 | ✅ NEW | Borderline — consider sub-genre badge |
| `coding` | 5 | ✅ NEW | Sub-genre under STEM |
| `culinary` | 4 | ✅ NEW | |
| `dance` | 4 | ✅ KEEP | Was empty (0) pre-proposal; now meets threshold |
| `golf` | 4 | ✅ NEW | |
| `one_day` | 4 | ⚠ NO | Session-type marker — see Q2 |
| `basketball` | 2 | ❌ REMOVE | Below threshold |
| `winter_break` | 2 | ❌ NO | Below threshold + season tag |
| `spring_break` | 2 | ❌ NO | Below threshold + season tag |
| `soccer` | 1 | ❌ REMOVE | Below threshold |
| `fencing` | 1 | ❌ NO | Below threshold; dual-tagged with sports per Q1 |
| `short_break` | 1 | ❌ NO | Below threshold + season tag |

**Categories DROPPED entirely (zero rows post-fold):** `animals`, `water`, `active`, `indoor`, `adventure`, `maker`. The Stage 2 migration must REPLACE these tags everywhere they appear — never just leave dangling.

---

## §2 — UI filter pills (final list + i18n keys)

The filter row in `src/components/camps/CampsFilterBar.tsx` currently shows 11 pills. Stage 2 changes that to **18 pills**:

```ts
// src/components/camps/CampsFilterBar.tsx
export const CATEGORY_KEYS = [
  // Core breadth (high count)
  'sports', 'general', 'arts', 'outdoor', 'stem', 'nature',
  'swim', 'academic',
  // Cultural + lifestyle
  'cultural', 'preschool', 'religious',
  // Performing arts (sub-genre under arts)
  'music', 'theater', 'dance',
  // Sub-genre sports + activities (each ≥4 post-revision)
  'tennis', 'sailing', 'culinary', 'golf',
] as const;
```

### i18n keys to ADD (EN + ES)

```jsonc
"app.camps.categories": {
  "general":   { "en": "All-around",  "es": "Multipropósito" },
  "outdoor":   { "en": "Outdoor",     "es": "Al aire libre" },
  "academic":  { "en": "Academic",    "es": "Académico" },
  "cultural":  { "en": "Cultural",    "es": "Cultural" },
  "preschool": { "en": "Preschool",   "es": "Preescolar" },
  "religious": { "en": "Religious",   "es": "Religioso" },
  "sailing":   { "en": "Sailing",     "es": "Vela" },
  "culinary":  { "en": "Culinary",    "es": "Culinaria" },
  "golf":      { "en": "Golf",        "es": "Golf" }
}
```

ES strings flagged for native review.

### i18n keys to RENAME

The existing keys live under `app.camps.categories.*` with PascalCase keys. Migrate to lowercase keys to match DB values:

| Old | New | Reason |
|---|---|---|
| `STEM` | `stem` | DB casing |
| `Sports` | `sports` | DB casing |
| `Swim` | `swim` | DB casing |
| `Tennis` | `tennis` | DB casing |
| `Art` | `arts` | DB key + plural |
| `Theater` | `theater` | DB casing |
| `Music` | `music` | DB casing |
| `Dance` | `dance` | DB casing |
| `Nature` | `nature` | DB casing |
| `Soccer`, `Basketball` | (delete) | Pill removed |

The label values stay the same ("STEM" still displays as "STEM" — capitalized via i18n value, not key).

---

## §3 — Pills to remove (with confirmation)

| Pill | Pre-proposal | Post-A+B + revisions + folds | Decision |
|---|---:|---:|---|
| **Soccer** | 0 | 1 | REMOVE — below 3-camp threshold |
| **Basketball** | 0 | 2 | REMOVE — below 3-camp threshold |
| **Dance** | 0 | **4** | **KEEP** — meets ≥3 threshold |

Correcting your prior message: Dance is **not** zero. The mig013 seed has 2 dance/ballet camps (`miami-city-ballet-school`, `new-world-school-of-the-arts-kids`), and the name-keyword pass picks up 2 more from the research data. Dance stays as a pill.

---

## §4 — Migration shape

**File:** `supabase/migrations/052_camp_categories_canonical.sql`

**Structure:** one DO block, three phases, idempotent on re-run.

### Phase 1 — Casing + synonym normalization (table-wide)

A single UPDATE that maps every legacy raw value to its canonical lowercase form. Uses `UNNEST` + `array_agg` so it works on Postgres `text[]` columns.

```sql
-- Phase 1: lowercase + synonym normalization for ALL camps.
-- Idempotent: a row already in canonical form is unchanged by the rewrite.
WITH normalized AS (
  SELECT
    id,
    array_agg(DISTINCT
      CASE
        WHEN cat IN ('STEM', 'STEAM', 'stem')              THEN 'stem'
        WHEN cat IN ('Sports', 'sports')                   THEN 'sports'
        WHEN cat IN ('Soccer', 'soccer')                   THEN 'soccer'
        WHEN cat IN ('Tennis', 'tennis')                   THEN 'tennis'
        WHEN cat IN ('Basketball', 'basketball')           THEN 'basketball'
        WHEN cat IN ('Swim', 'Swimming', 'swim', 'swimming') THEN 'swim'
        WHEN cat IN ('Art', 'Arts', 'art', 'arts')         THEN 'arts'
        WHEN cat IN ('Theater', 'theater')                 THEN 'theater'
        WHEN cat IN ('Music', 'music')                     THEN 'music'
        WHEN cat IN ('Dance', 'dance')                     THEN 'dance'
        WHEN cat IN ('Nature', 'nature')                   THEN 'nature'
        WHEN cat IN ('History', 'cultural', 'Cultural')    THEN 'cultural'
        ELSE lower(cat)
      END
    ) AS cats
  FROM public.camps, UNNEST(categories) AS cat
  GROUP BY id
)
UPDATE public.camps c
SET categories = n.cats
FROM normalized n
WHERE c.id = n.id;
```

**STEAM handling:** mig013 has 2 STEAM camps (`alexander-montessori-ludlam`, `cushman-school-summer`). Both already carry `arts` in their tag list, so collapsing STEAM → `stem` is safe — they end up dual-tagged `[arts, stem]` automatically.

### Phase 2 — Per-camp recategorization (Section A + revised Section B)

UPSERT-style per-camp UPDATEs for the 25 + 10 = 35 camps with concrete diffs. Format:

```sql
-- Section A example: Tennis name-keyword adds (high confidence)
UPDATE public.camps
SET categories = (
  SELECT array_agg(DISTINCT cat)
  FROM UNNEST(array_cat(categories, ARRAY['tennis']::text[])) AS cat
)
WHERE slug IN (
  'ale-tennis-academy-summer-camp-doral',
  'flamingo-park-tennis-center-summer-camp',
  'miami-beach-tennis-academy-summer-camp',
  'neighborhood-tennis-summer-camp-at-kirk-munroe',
  'palmetto-bay-tennis-summer-camp',
  'fort-lauderdale-tennis-and-sports-summer-camp'
);
```

Pattern repeated for each Section-A keyword bucket and each Section-B add. **Total: ~12 UPDATE statements**, each touching 1–8 camps.

### Phase 3 — Q1 fold rewrites

Six rewrites that drop deprecated tags and ensure their parents are present:

```sql
-- Fold animals → nature
UPDATE public.camps SET categories = (
  SELECT array_agg(DISTINCT cat)
  FROM UNNEST(array_remove(categories, 'animals') || ARRAY['nature']) AS cat
) WHERE 'animals' = ANY(categories);

-- Fold water → swim AND outdoor
UPDATE public.camps SET categories = (
  SELECT array_agg(DISTINCT cat)
  FROM UNNEST(array_remove(categories, 'water') || ARRAY['swim', 'outdoor']) AS cat
) WHERE 'water' = ANY(categories);

-- (active, indoor, adventure, maker — same shape, parent differs)
-- fencing: KEEP, just ensure sports tag
UPDATE public.camps SET categories = (
  SELECT array_agg(DISTINCT cat)
  FROM UNNEST(categories || ARRAY['sports']) AS cat
) WHERE 'fencing' = ANY(categories) AND NOT 'sports' = ANY(categories);
```

### Phase 4 — Verification

The migration's tail block runs SELECTs that the operator can eyeball:

```sql
DO $verify$
DECLARE
  cnt int;
BEGIN
  -- No legacy casing anywhere
  SELECT COUNT(*) INTO cnt FROM public.camps
  WHERE EXISTS (SELECT 1 FROM UNNEST(categories) c WHERE c <> lower(c));
  RAISE NOTICE 'camps with non-lowercase categories: %', cnt;
  IF cnt > 0 THEN RAISE EXCEPTION 'Phase 1 failed — % camps still have non-lowercase tags', cnt; END IF;

  -- No deprecated tags
  SELECT COUNT(*) INTO cnt FROM public.camps
  WHERE EXISTS (SELECT 1 FROM UNNEST(categories) c
                 WHERE c IN ('animals', 'water', 'active', 'indoor', 'adventure', 'maker'));
  RAISE NOTICE 'camps with deprecated tags: %', cnt;
  IF cnt > 0 THEN RAISE EXCEPTION 'Phase 3 failed — % camps still have deprecated tags', cnt; END IF;
END;
$verify$;
```

### Idempotency contract

Re-running the migration on already-canonical data is a no-op (each UPDATE matches zero rows because the tags it would add are already present). This matters for split prod / staging environments and for re-runs after a partial failure.

---

## §5 — Religious card badge

### Visual spec

- **Icon:** 🙏 emoji
- **Label:** "Religious program" (EN) / "Programa religioso" (ES)
- **Placement:** card top-right pill row, alongside Featured (⭐) and Verified (✓) badges
- **Render condition:** card camp has `'religious'` in its `categories` array
- **Styling:** match the existing Verified-badge visual treatment (small pill, neutral border, `text-[10px] font-bold`); the icon plus label fits comfortably in the existing badge row

### Component changes

In `src/components/camps/UnifiedCampCard.tsx`:

```tsx
// Inside the existing <BadgeRow> / pill stack in both PublicCard and AppCard:
{(camp.categories ?? []).includes('religious') ? (
  <span
    className="inline-flex items-center gap-1 rounded-full border border-cream-border bg-white px-2 py-0.5 text-[10px] font-bold text-ink"
    title={t('religiousBadge.tooltip')}
    aria-label={t('religiousBadge.label')}
    data-testid="camp-religious-badge"
  >
    <span aria-hidden="true">🙏</span>
    {t('religiousBadge.label')}
  </span>
) : null}
```

### Detail-page treatment

Same badge in the same position on `<UnifiedCampDetail>`.

### i18n keys to ADD

```jsonc
"app.camps.religiousBadge": {
  "label":   { "en": "Religious",         "es": "Religioso" },
  "tooltip": { "en": "Religious program — see camp description for details", "es": "Programa religioso — ver descripción" }
}
```

### What this badge does NOT do

- Doesn't gate visibility (religious camps are visible to everyone).
- Doesn't filter the listing (the filter pill does that).
- Doesn't claim affiliation — the badge says "this camp is a religious program," not "we endorse it." Mom can decide whether that fits her family.

---

## §6 — Three import-script bugs to fix

All in `scripts/import-camps-research.ts`.

### Bug 1 — `CATEGORY_CANONICAL` map re-uppercases `stem`

```ts
// scripts/import-camps-research.ts:~64
const CATEGORY_CANONICAL: Record<string, string> = {
  stem: 'STEM',   // ❌ Drop this entry. After Stage 2, prod is lowercase-only.
};
```

**Fix:** delete the entire map and remove the call site. The `VALID_CATEGORIES_LOWER` allowlist already enforces lowercase membership.

### Bug 2 — `religious` description-keyword rule too loose (proposal-only — tightens future re-imports)

The proposal logic in this Stage-1 analysis used the regex:

```ts
/\b(catholic|jewish|christian|synagogue|church|jcc|hebrew|torah)\b/
```

This fired on (a) camps located AT a church (false positive: Cross Bridge Church) and (b) culturally-affiliated camps that aren't religious-instruction-driven (false positive: JCC adventure camps).

**Fix:** narrow to require BOTH (a) an affiliation word AND (b) a programming-content word. The script doesn't currently apply this rule on import (research JSON arrives pre-categorized) — but if a future re-import or auto-categorization pipeline adopts the rule, it must use the tightened version:

```ts
const RELIGIOUS_AFFILIATION = /\b(catholic|jewish|christian|synagogue|jcc|yeshiva)\b/i;
const RELIGIOUS_PROGRAMMING = /\b(torah study|religious instruction|bible class|bible study|mass\b|shabbat services|chapel|hebrew school|christian education|catechism)\b/i;

function isReligious(text: string): boolean {
  return RELIGIOUS_AFFILIATION.test(text) && RELIGIOUS_PROGRAMMING.test(text);
}
```

Mere "located at church" or "JCC summer camp" without an explicit programming-content phrase should NOT add `religious`.

### Bug 3 — `academic` description-keyword rule misfires on Montessori-preschool

Same scope: not currently applied at import time, but if a future categorization pipeline adopts an academic rule, it must:

1. **Gate on `ages_min >= 5`** — preschool-age Montessori is pedagogy, not academic enrichment
2. **Require explicit phrasing** — "tutoring," "SAT prep," "academic enrichment," "homework help," "test prep," "language enrichment" — not just "Montessori"

```ts
const ACADEMIC_PHRASES = /\b(tutoring|sat prep|academic enrichment|homework help|test prep|language enrichment|reading enrichment|math enrichment)\b/i;

function isAcademic(camp: { description: string; ages_min: number }): boolean {
  if (camp.ages_min < 5) return false;
  return ACADEMIC_PHRASES.test(camp.description ?? '');
}
```

### Where the fixes land

The 3 bug fixes are pure script changes — no migration impact. Stage 2 ships them in the same PR as the migration so re-importing the research JSON later doesn't undo Stage 2's cleanup.

---

## §7 — Tests planned

### Unit / contract tests

1. **`tests/lib/camp-categories.test.ts`** — covers a new `src/lib/camps/categories.ts` module that exports:
   - `CANONICAL_CATEGORIES` (Set of 21)
   - `LEGACY_TO_CANONICAL` (synonym map used by the migration AND any client-side normalizer)
   - `applyFolds(cats: string[]): string[]` — the Q1 fold logic
   - `categoryThresholdOk(count: number): boolean` — gate for whether a UI pill should render
   - Tests assert: every legacy form maps to a canonical value; folds are deterministic; threshold rule is `count >= 3`

2. **`tests/lib/import-camps-research.test.ts`** — tests for the tightened `isReligious()` and `isAcademic()` helpers:
   - "Located at Cross Bridge Church" → NOT religious (no programming-content word)
   - "Torah study, located at synagogue" → religious (both signals)
   - "Montessori summer for ages 3" → NOT academic (age-gated)
   - "Academic enrichment for ages 8" → academic
   - These tests fail-fast if anyone re-loosens the rules

3. **`tests/components/camps/UnifiedCampCard.religious-badge.test.tsx`** — the new card-badge render test:
   - Card with `categories: ['sports', 'religious']` → badge visible with 🙏
   - Card without `religious` → no badge
   - Both modes (public + app) render the badge identically

### Integration / migration tests

4. **`tests/migrations/052-camp-categories.test.ts`** (or run via the existing migration smoke test pattern):
   - Set up a fixture camp with `categories: ['STEM', 'Animals', 'water']`
   - Apply the migration logic (Phase 1 + 3) via SQL fixture
   - Assert post-state: `categories: ['nature', 'outdoor', 'stem', 'swim']` (lowercase + folded)
   - Idempotency: re-apply, assert no change

5. **`tests/components/camps/CampsFilterBar.test.tsx`** — extend existing test:
   - Filter bar renders 18 pills (the locked list)
   - No pill renders for `soccer`, `basketball`, `animals`, `water`, `active`, `indoor`, `adventure`, `maker`
   - Each pill's i18n label resolves in EN + ES (no missing keys)

### Coverage expectation

- New tests: **~25** (covering categories module, religious/academic rules, badge render, migration smoke, filter bar)
- Existing tests touched: ~3 (UnifiedCampCard tests gain badge cases; CampsFilterBar gets the new pill list)
- Net delta: roughly +25 / 0 deletions

---

## §8 — Stage 2 execution order (preview, not commitments)

Below is the planned sequence. Each step is its own commit, pushed independently.

| # | Commit subject | Owner | Risk |
|---|---|---|---|
| 1 | `feat(camps): canonical categories module + tests` (lib + helpers, no DB / UI changes) | — | low |
| 2 | `chore(scripts): tighten import-camps-research religious + academic rules + drop CATEGORY_CANONICAL map` | — | low — script only |
| 3 | `feat(migration-052): canonical category normalization + Q1 folds` (the SQL migration) | Rasheid runs `pnpm exec supabase db push` after the commit lands | medium — touches every camp's `categories` array |
| 4 | `feat(camps): UnifiedCampCard religious badge + UnifiedCampDetail badge` (UI surface for Q3) | — | low |
| 5 | `feat(filters): CampsFilterBar pill set updated to canonical lowercase + 7 new pills + i18n` | — | medium — visible UI change |
| 6 | `docs(progress): camp-categories Stage 2 morning report` | — | low |

### R1 compliance (migration-dependent code)

The UI pill renames (commit 5) read camp data from prod. The migration (commit 3) must ship FIRST (and Rasheid must apply it via `supabase db push`) before commit 5 deploys — otherwise the new lowercase filter values would mismatch existing uppercase prod data and the Tennis filter (etc.) would return empty.

Concretely: Rasheid runs `pnpm exec supabase db push` between commits 3 and 4, confirms via `\d camps` or a sample SELECT, then proceeds.

---

## §9 — Open questions surfaced by the spec

These are NOT blockers for Stage 2 — flagging for awareness:

1. **`preschool` as filter pill OR roll into age filter?** Stage 2 ships it as a pill (matches Q3-style addition). If parent feedback later says "I always want age 2-5 camps, the pill is redundant with my age filter," fold then.
2. **`one_day` and `summer` show up as data tags but NOT as UI pills.** Until the schema-level `season` / `session_type` field ships in Phase 4.x, these tags are searchable only via URL params. Acceptable.
3. **`sailing` / `culinary` / `golf` borderline pills** — each has 4-5 camps, just clearing the threshold. If churn drops any below 3, the filter test fails CI and the pill must come out.

---

## What Stage 2 explicitly does NOT do

- ❌ No schema changes (`categories` stays `text[]`, no enum)
- ❌ No new `season` or `session_type` column
- ❌ No deletion of camp rows
- ❌ No change to `verified` flags or completeness scoring
- ❌ No re-categorization beyond the locked Sections A + revised B
- ❌ No removal of `summer` / `winter_break` / `spring_break` / `short_break` / `one_day` (those stay in the data, just not in the UI)
- ❌ No SEO / OG / JSON-LD changes
