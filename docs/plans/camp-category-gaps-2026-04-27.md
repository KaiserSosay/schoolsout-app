# Camp Category Gaps — Coverage Report

**Date:** 2026-04-27
**Stage:** 1 of 2 (proposal only — no migrations applied)
**Companion docs:** `docs/plans/camp-categories-canonical-2026-04-27.md`, `docs/plans/camp-recategorization-proposal-2026-04-27.md`

---

## How this report was built

For every category, two columns:

- **pre** — case-insensitively-normalized count from the raw repo data (research JSON + migration 013 + migration 051), so casing duplicates don't double-count. This is what prod *would* look like if we just lowercased everything without applying any keyword rules.
- **post** — count after the proposal's casing normalization + name-keyword + description-keyword rules apply.

`pre` numbers don't perfectly match the prod diagnostic's "STEM: 21, swim: 17" because the diagnostic preserves casing and counts duplicates. Treat `pre` as "the floor after a pure casing fix" and `post` as "the floor after the full Stage 2 migration."

---

## Per-category counts

| Category | Pre | Post | Δ | Flag |
|---|---:|---:|---:|---|
| `sports` | 68 | 68 | +0 | 📊 ≥30 (consider subdivide later) |
| `general` | 56 | 56 | +0 | 📊 ≥30 |
| `arts` | 44 | 44 | +0 | 📊 ≥30 |
| `outdoor` | 29 | 33 | +4 | 📊 ≥30 |
| `stem` | 28 | 28 | +0 | |
| `summer` | 26 | 26 | +0 | season tag — see canonical spec |
| `nature` | 24 | 24 | +0 | |
| `academic` | 17 | 23 | +6 | |
| `swim` | 22 | 22 | +0 | |
| `maker` | 12 | 12 | +0 | |
| `adventure` | 12 | 12 | +0 | |
| `religious` | 8 | 11 | +3 | |
| `cultural` | 10 | 10 | +0 | |
| `preschool` | 10 | 10 | +0 | |
| `music` | 9 | 9 | +0 | |
| `theater` | 9 | 9 | +0 | |
| `tennis` | 1 | 8 | +7 | biggest gain — was the visible bug |
| `coding` | 5 | 5 | +0 | |
| `sailing` | 1 | 5 | +4 | |
| `culinary` | 1 | 4 | +3 | |
| `dance` | 0 | 4 | +4 | was empty filter pre-proposal |
| `golf` | 1 | 4 | +3 | |
| `animals` | 4 | 4 | +0 | fold candidate → `nature` |
| `one_day` | 4 | 4 | +0 | session-type, see canonical spec |
| `basketball` | 0 | 2 | +2 | ⚠ <3 — no UI pill |
| `winter_break` | 2 | 2 | +0 | ⚠ <3, season tag |
| `spring_break` | 2 | 2 | +0 | ⚠ <3, season tag |
| `active` | 2 | 2 | +0 | ⚠ <3 — fold candidate → `sports` |
| `indoor` | 2 | 2 | +0 | ⚠ <3 — drop candidate |
| `short_break` | 1 | 1 | +0 | ⚠ <3, season tag |
| `soccer` | 0 | 1 | +1 | ⚠ <3 — no UI pill |
| `fencing` | 1 | 1 | +0 | ⚠ <3 — no UI pill until ≥3 |
| `water` | 1 | 1 | +0 | ⚠ <3 — fold candidate → `swim` |

---

## Findings

### 1. The "empty filter pill" bug is fixed

Pre-proposal, the UI filter bar advertised five sub-genre pills with zero matching camps:

| Pill | Pre | Post | Status |
|---|---:|---:|---|
| Soccer | 0 | 1 | Still <3 — Stage 2 should remove the pill |
| Basketball | 0 | 2 | Still <3 — Stage 2 should remove the pill |
| Dance | 0 | 4 | Above 3, **keep the pill** |
| Tennis | 1 | 8 | Above 3, **keep the pill** |
| Soccer/Basketball | 0 | 1+2 | borderline — see above |

R6-style remediation: keep only pills where `post ≥ 3`. Stage 2 removes Soccer + Basketball from the UI; user-facing change is that stale empty pills disappear.

### 2. `tennis` jumped from 1 → 8 — the headline win

Tennis was the most visible categorization bug — the diagnostic showed 4+ tennis-named camps that weren't tagged with `tennis`, so the existing Tennis filter pill returned 1 result instead of the expected ~5. Post-proposal:

- `crandon-tennis` (already tagged)
- `ale-tennis-academy-summer-camp-doral` (name-keyword)
- `flamingo-park-tennis-center-summer-camp` (name-keyword)
- `miami-beach-tennis-academy-summer-camp` (name-keyword)
- `neighborhood-tennis-summer-camp-at-kirk-munroe` (name-keyword)
- `palmetto-bay-tennis-summer-camp` (name-keyword)
- `fort-lauderdale-tennis-and-sports-summer-camp` (name-keyword)
- `pembroke-pines-sports-specialty-camps` (description-keyword: program offers Tennis Camp + Soccer Camp + Golf School)

The Tennis filter pill goes from "broken" to "useful" once Stage 2 ships.

### 3. Categories ≥30 — eventual subdivision candidates

Four categories carry 30+ camps:

- `sports` (68) — already has 6 sub-genres (`tennis`, `soccer`, `basketball`, `golf`, `sailing`, `fencing`) that subdivide it where the data supports it. No urgent action.
- `general` (56) — by design a catch-all ("All-around camps"). Subdivision would defeat the purpose.
- `arts` (44) — has sub-genres `theater`, `music`, `dance`. Plus visual-arts could be a future split if camps tagged `arts` differ meaningfully (e.g., `visual_arts` vs `performing_arts`).
- `outdoor` (33) — sister to `nature`. The relationship is muddled today; defer subdivision until user research clarifies whether parents distinguish "outdoor recreation" from "nature programming."

**Stage 2 doesn't need to act on these.** Flag as Phase 4.x roadmap if subdivision becomes a UX pain point.

### 4. Categories <3 — UI pill candidates that aren't ready yet

- `basketball` (2), `soccer` (1), `fencing` (1) — sub-genre sports. Don't show UI pills until each clears ≥3.
- `active` (2), `indoor` (2), `water` (1) — fold candidates per the canonical spec.
- `short_break`, `winter_break`, `spring_break` (1–2 each) — season tags; per the canonical spec, these belong on a `season` column eventually.

### 5. Categories that gained the most absolute lift

| Category | Δ |
|---|---:|
| `tennis` | +7 |
| `academic` | +6 |
| `dance` | +4 |
| `outdoor` | +4 |
| `sailing` | +4 |
| `religious` | +3 |
| `culinary` | +3 |
| `golf` | +3 |
| `basketball` | +2 |

These are the categories where the proposal is doing the most work. If any of these gains are wrong (e.g., a camp falsely added to `religious` because the description mentions a synagogue location), it's worth scrutinizing the corresponding rows in the recategorization-proposal Section A/B before Stage 2 ships.

### 6. Categories with zero proposed change

Out of 33 categories tracked, **20 have Δ = 0** — meaning casing normalization touched their rows but no new keyword rule fired. These are mostly the well-categorized core categories from the research JSON (`nature`, `arts`, `swim`, etc.). Confidence that these are correct: high — research data was already lowercase + curated.

---

## What Stage 2 changes (preview)

Once Rasheid approves Sections A/B/C of the recategorization proposal, Stage 2 must ship:

1. **One migration** that:
   - UPDATEs each camp's `categories` array per the approved proposal
   - Normalizes casing across the whole table (lowercases everything, applies the synonyms)
   - Logs to a one-time `category_changes` audit table OR records the diff in the migration comment
2. **One code change** to `scripts/import-camps-research.ts`:
   - Remove the `CATEGORY_CANONICAL` map (delete the `stem: 'STEM'` line)
   - This stops the importer from re-introducing the casing problem on next run
3. **One UI change** to `src/components/camps/CampsFilterBar.tsx`:
   - `CATEGORY_KEYS` switches from PascalCase to lowercase
   - Add new pills (General, Outdoor, Academic, Maker, Religious, Cultural)
   - Remove empty-data pills (Soccer, Basketball)
   - Keep the borderline pills (Dance — 4 camps, on the threshold)
4. **i18n updates** to add the 6+ new pill labels in EN + ES
5. **No schema changes** — `categories` stays a `text[]`; no enum, no new column.

Stage 2 is bounded — under ~5 commits' worth of work — and is the LAST step before category data reaches a healthy steady-state.
