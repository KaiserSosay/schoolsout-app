# Camp Categories — Canonical Vocabulary Spec

**Date:** 2026-04-27
**Stage:** 1 of 2 (proposal only — no migrations applied)
**Companion docs:** `docs/plans/camp-recategorization-proposal-2026-04-27.md`, `docs/plans/camp-category-gaps-2026-04-27.md`

---

## Source of truth

All categories on `public.camps.categories` (a `text[]` column — NOT an
enum, see `supabase/migrations/003_app_tables.sql:34`) are stored
**lowercase**. The casing convention is governed by the data sources
that write to the table:

- **Migration 013** (`013_camps_miami_seed.sql`, 38 camps) — wrote
  mixed-case literals (`'STEM'`, `'STEAM'`, `'Sports'`, `'History'`,
  …). Source of the prod casing-duplicate problem.
- **Migration 051** (`051_featured_launch_trio.sql`, 3 launch
  partners) — wrote lowercase only.
- **`scripts/import-camps-research.ts`** (the 96 research-imported
  camps) — accepts lowercase, then runs `CATEGORY_CANONICAL` to
  upper-case `stem` → `STEM` before insert. **This is the active
  bug.** Stage 2 must remove that map so re-running the script doesn't
  re-introduce the casing problem.

---

## Canonical vocabulary

The following 22 categories are the canonical set going forward.

| Category | Current count* | Status | UI pill | Notes |
|---|---|---|---|---|
| `sports` | 68 | core | yes | Umbrella over `tennis`, `soccer`, `basketball`, `golf`, `sailing`, `fencing` |
| `general` | 56 | core | yes (new) | "All-around camps" — Q2 decision: keep + add UI pill |
| `arts` | 44 | core | yes | Was `art` / `arts` / `Arts` in raw — collapsed |
| `outdoor` | 33 | core | yes | |
| `stem` | 28 | core | yes | Was `STEM` / `STEAM` / `stem` in raw |
| `nature` | 24 | core | yes | |
| `academic` | 23 | core | yes | |
| `swim` | 22 | core | yes | Was `swim` / `swimming` / `Swim` in raw |
| `maker` | 12 | core | yes | 3D printing / fab-lab / hands-on |
| `religious` | 11 | core | yes | Catholic / Jewish / Christian programs |
| `cultural` | 10 | core | yes | Was `cultural` + `History` (folded) in raw |
| `preschool` | 10 | core | yes | Age-band-driven; consider whether this belongs in age filters instead |
| `music` | 9 | core | yes | |
| `theater` | 9 | core | yes | |
| `tennis` | 8 | core | yes | Sub-genre under `sports`; previously had ZERO camps tagged |
| `coding` | 5 | core | yes | Sub-genre under `stem` |
| `sailing` | 5 | core | yes (small) | Sub-genre under `sports` |
| `culinary` | 4 | core | yes (small) | Sub-genre — cooking / chef camps |
| `dance` | 4 | core | yes (small) | Sub-genre under `arts` |
| `golf` | 4 | core | yes (small) | Sub-genre under `sports` |
| `fencing` | 1 | core | NO (yet) | Add UI pill once ≥3 camps |
| `soccer` | 1 | core | NO (yet) | Add UI pill once ≥3 camps |
| `basketball` | 2 | core | NO (yet) | Add UI pill once ≥3 camps |

\* Counts are post-proposal (after canonicalization + auto-categorization), drawn from the recategorization proposal doc.

### Categories DROPPED or merged

| Raw | Action | Reason |
|---|---|---|
| `STEM`, `STEAM` | merge → `stem` | Casing duplicate. STEAM camps that are also arts-heavy get dual-tagged; not done in proposal because the rules-based pass treats STEAM as STEM-only. Section B candidates flagged for Rasheid's review. |
| `Sports`, `Soccer`, `Tennis`, `Basketball`, `Swim`, `Swimming` | merge → lowercase | Casing duplicates from migration 013. |
| `Art`, `Arts`, `art` | merge → `arts` | Casing + plural variants. |
| `Theater`, `Music`, `Dance`, `Nature`, `Animals` | merge → lowercase | Casing duplicates. |
| `History` | merge → `cultural` | mig013 used `History` for Vizcaya / Deering historical-museum camps. Folded into `cultural`. |

### Categories FLAGGED for human decision

These have ambiguous semantics and either deserve a separate field or
deliberate retention. **Stage 1 keeps them as-is in the canonical
list**; Rasheid decides which path Stage 2 takes:

| Category | Count* | Recommendation | Rationale |
|---|---|---|---|
| `summer` | 26 | Move to a `season` column | These tag a TIME-OF-YEAR, not an activity. A camp that runs in summer AND offers swim should be findable by either filter without one polluting the other. Schema change deferred to Phase 4.x or later. |
| `winter_break` | 2 | Move to `season` | Same reasoning. |
| `spring_break` | 2 | Move to `season` | Same reasoning. |
| `short_break` | 1 | Move to `season` | Same reasoning. |
| `one_day` | 4 | Move to `session_type` | Single-day vs multi-day is a session-shape signal, not an activity. |
| `active` | 2 | Fold into `sports` | Sky Zone trampoline park (mig013); "active" reads as sports-adjacent and zero parents will search for "active." |
| `water` | 1 | Fold into `swim` | Tidal Cove (mig013); only one camp uses `water` and it's swim-pool-shaped. |
| `animals` | 4 | Fold into `nature` | Zoo Miami / Jungle Island / Seaquarium — all `nature` already; `animals` is a sub-aspect, not a separate filter parents use. |
| `indoor` | 2 | Drop entirely | Sky Zone + one other. Doesn't read as a category — reads as a feature ("rainy-day option"). If we want a "rainy-day camps" filter later, that's a separate boolean field. |
| `adventure` | 12 | Keep, but consider folding into `outdoor` | 12 is enough to keep as its own pill, but every "adventure" camp is also `outdoor`. If parents distinguish "outdoor (gentle nature)" from "adventure (zip-lines, rope courses)" then keep separate; if not, fold. **Code recommends keeping for now** — defer the fold decision to user research. |

**Stage 1 default:** keep the season tags + `active` + `water` + `animals` + `indoor` + `adventure` in the database AS-IS (R5 spirit — don't remove what's there). Stage 2 implements whichever subset Rasheid approves.

---

## UI filter pills — recommended changes

Today's filter bar (`src/components/camps/CampsFilterBar.tsx:18-30`) shows 11 category chips:

```ts
export const CATEGORY_KEYS = [
  'Sports', 'Soccer', 'Swim', 'Tennis', 'Basketball',
  'Art', 'Theater', 'Music', 'Dance',
  'STEM', 'Nature',
];
```

**Three of these (`Soccer`, `Basketball`, `Dance`) had ZERO camps tagged before the proposal — confirmed empty filters per the diagnostic.** Per shipping rule R6 (allowlist, not blocklist), an empty filter erodes trust. Stage 2 should:

### Pills to ADD

- **General** — 56 camps. Q2 decision: "All-around camps."
- **Outdoor** — 33 camps. Currently no pill; well-populated.
- **Academic** — 23 camps. Currently no pill.
- **Maker** — 12 camps. Currently no pill.
- **Religious** — 11 camps. Currently no pill. Sensitive — consider whether Mom wants a "show religious" toggle. **Flag for Rasheid: should this be opt-in via filter or always-visible badge on each card?**
- **Cultural** — 10 camps.
- **Preschool** — 10 camps. (Or: roll into the existing age filter instead — Code recommends the age filter route, since `preschool` is age-band-driven.)
- **Adventure** — 12 camps (if kept separate from outdoor).

### Pills to REMOVE (R6 compliance)

- **Soccer** — 1 camp post-proposal. Below the ≥3 threshold.
- **Basketball** — 2 camps post-proposal. Below threshold.
- **Dance** — 4 camps post-proposal. **Borderline** — Code's recommendation is to keep it as a pill since it's a recognizable kid activity that 4 camps qualify for. Or merge into `arts` umbrella.

### Pills to KEEP

- **Sports**, **Swim**, **Tennis**, **Art (→ Arts)**, **Theater**, **Music**, **STEM** — all have ≥4 camps post-proposal.

### Pills to RENAME (i18n)

- `Art` → `Arts` (matches DB key after lowercase normalization).
- `STEM` displayed as "STEM" (translation key value), DB key is `stem`. Filter component must lowercase the key for DB matching but display the translated label.

**i18n keys that would need new translations:**

```
app.camps.categories.General        # NEW
app.camps.categories.Outdoor        # NEW
app.camps.categories.Academic       # NEW
app.camps.categories.Maker          # NEW
app.camps.categories.Religious      # NEW
app.camps.categories.Cultural       # NEW
app.camps.categories.Preschool      # NEW (if kept)
app.camps.categories.Adventure      # NEW (if kept)
```

(Stage 2 owns the actual i18n + filter component changes. This list is for scoping.)

---

## Parent / child relationships

Today the filter is flat — clicking "Sports" matches camps tagged `sports` exactly. This means a tennis-only camp tagged `[tennis]` would NOT appear under "Sports" even though Mom intuitively expects it to. **Code's recommendation:** dual-tag at insert time (every `tennis` camp also gets `sports`), and keep the filter flat. This is what the recategorization proposal does — every tennis-named camp gets both `tennis` and `sports`.

| Parent | Children |
|---|---|
| `sports` | `tennis`, `soccer`, `basketball`, `golf`, `sailing`, `fencing` |
| `arts` | `theater`, `music`, `dance` (debatable — keep flat?) |
| `stem` | `coding`, `maker` (debatable — `maker` could be `arts`-adjacent) |
| `nature` | `animals` (if folded) |
| `outdoor` | `adventure` (if folded) |
| `swim` | `water` (if folded) |

**Decision for Rasheid:** dual-tag at insert (Code's recommendation, R5-spirit additive) OR introduce a runtime parent-includes-children rule in `applyFilters` (clever, but couples filter logic to a vocabulary tree that has to stay in sync with DB tags). Code recommends dual-tag.

---

## Open questions for Stage 2

1. **Fold `animals` / `water` / `active` / `indoor` into parent categories?** Or keep as orphan tags with no UI? Stage 1 default = keep.
2. **Move season markers (`summer` / `winter_break` / `spring_break` / `short_break`) to a separate `season` column?** This is a schema change — out of scope for Stage 1 and Stage 2 unification. Surface as Phase 4.x roadmap entry.
3. **`one_day` similarly — move to a `session_type` field?** Same answer.
4. **Drop the `CATEGORY_CANONICAL` map in `import-camps-research.ts`?** Yes, Stage 2 must do this. Otherwise re-running the importer reverts `stem` → `STEM`.
5. **Should `religious` be a filter pill, a card badge, or both?** Sensitive question. Code defers to Rasheid + mom-test feedback.
6. **Add `STEAM` as a separate canonical category (currently folded into `stem`)?** Two camps in mig013 use `STEAM` — both are `arts + STEM` blends. The proposal dual-tags them with `arts` + `stem`. If parents specifically want STEAM as a search term, surface a third tag. Code recommends keeping the fold.
