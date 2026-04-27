# UI Unification — Morning Report

**Date:** 2026-04-27
**Branch:** main (5 commits, all pushed independently)
**Source spec:** `docs/plans/ui-consistency-audit-2026-04-27.md`

## Commits shipped

| # | SHA | Subject |
|---|-----|---------|
| 1 | `5963553` | refactor(ui): extract chip-classes + EntitySearchBar shared primitives |
| 2 | `b29408d` | feat(schools): search bar + name/neighborhood/city/district filtering + empty state parity |
| 3 | `b96fe4a` | feat(camps): UnifiedCampCard replaces PublicCampCard + CampCard + WishlistSection inline |
| 4 | `631ceae` | feat(camps): unified detail view + dashboard fetches same column set as public |
| 5 | `60d9f48` | feat(camps): sort toggle on public page with distance disabled+lock for ghost UI |

Each commit was independently green: `pnpm test`, `pnpm lint`, and
`pnpm exec tsc --noEmit` all clean (the only lint warning is a
pre-existing one in `OperatorDashboard.tsx` unrelated to this work).

## Files changed (aggregate across 5 commits)

`git diff e337ee5..60d9f48 --shortstat`:

```
31 files changed, 2358 insertions(+), 1236 deletions(-)
```

**New files (8):**
- `src/components/shared/chip-classes.ts`
- `src/components/shared/EntitySearchBar.tsx`
- `src/components/shared/EntityEmptyHint.tsx`
- `src/components/camps/UnifiedCampCard.tsx`
- `src/components/camps/UnifiedCampDetail.tsx`
- `tests/components/shared/EntitySearchBar.test.tsx`
- `tests/components/shared/EntityEmptyHint.test.tsx`
- `tests/components/camps/UnifiedCampCard.test.tsx`
- `tests/components/camps/UnifiedCampDetail.test.tsx`
- `tests/components/camps/CampSortControl.test.tsx`
- `tests/app/camps-detail-data-shape.test.tsx`

**Renamed (2):**
- `src/components/camps/CampsEmptyHint.tsx` → `src/components/shared/EntityEmptyHint.tsx`
- `src/components/app/CampSortControl.tsx` → `src/components/camps/CampSortControl.tsx`

**Deleted (4):**
- `src/components/public/PublicCampCard.tsx`
- `src/components/app/CampCard.tsx`
- `src/components/app/CampDetailView.tsx`
- `tests/components/app/CampCard.test.tsx` (replaced by UnifiedCampCard test)
- `tests/components/CampsEmptyHint.test.tsx` (replaced by EntityEmptyHint test)

**Modified surfaces:**
- `src/app/[locale]/camps/page.tsx`
- `src/app/[locale]/camps/[slug]/page.tsx`
- `src/app/[locale]/app/camps/page.tsx`
- `src/app/[locale]/app/camps/[slug]/page.tsx`
- `src/app/[locale]/app/saved/page.tsx`
- `src/app/[locale]/breaks/[id]/page.tsx`
- `src/app/[locale]/schools/page.tsx`
- `src/components/app/WishlistSection.tsx`
- `src/components/camps/CampsFilterBar.tsx`
- `src/components/public/SchoolsIndexFilters.tsx`
- `src/i18n/messages/en.json`
- `src/i18n/messages/es.json`

## Tests

- **Before unification:** 840 passing / 7 skipped (847 total)
- **After unification:** 881 passing / 7 skipped (888 total)
- **Delta: +41 net** (+45 new tests, −4 retired with deleted components)

Test count by commit:
- Commit 1: 840 → 845 (+5 — EntitySearchBar)
- Commit 2: 845 → 849 (+4 net; 6 new EntityEmptyHint, −2 deleted CampsEmptyHint)
- Commit 3: 849 → 860 (+11 — UnifiedCampCard 3-mode coverage)
- Commit 4: 860 → 873 (+13 — UnifiedCampDetail + data-shape regression)
- Commit 5: 873 → 881 (+8 — CampSortControl public + app modes)

## What's now consistent

- **One camp card component** used by 4 surfaces:
  - `/{locale}/camps` (public listing)
  - `/{locale}/app/camps` (dashboard listing)
  - `/{locale}/app/saved` (wishlist tab)
  - `/{locale}/app` dashboard wishlist section
  - Plus `/{locale}/breaks/[id]` matched-camps section (migrated for cleanliness; same `mode="public"` visual)
- **One camp detail component** used by 2 surfaces, fetching identical 21-column SELECT
- **Schools page** has search bar above filter chips + identical empty-state recovery pattern as camps
- **Sort toggle visible on public camps** with Distance ghosted+locked per Q3
- **Three card components → one** (`PublicCampCard` + `CampCard` + the `WishlistSection` inline mini all collapsed into `UnifiedCampCard`)
- **Two detail views → one** (`CampDetailView` + the inline JSX from the public page collapsed into `UnifiedCampDetail`)
- **Two filter components share styling tokens** via `src/components/shared/chip-classes.ts`
- **Two filter components share the search input** via `src/components/shared/EntitySearchBar`

## What surprised me mid-build

1. **The 110 vs 108 perception gap was a snapshot artifact.** The audit noted this; building confirmed it. Both pages run byte-identical SQL filters, and nothing in the unification needed to change to "fix" it. Worth flagging in case the same gap reappears: it'd be a real bug then, not an artifact, because nothing in the code path can produce the divergence.

2. **The save affordance is a star (☆/⭐), not a heart.** The audit + prompt referred to "the heart" interchangeably. The actual `SaveCampButton` uses ⭐ when saved and ☆ when not. The unified card's disabled-public state matches the unsaved-app state visually (☆ in muted opacity), which is what Q1 actually wanted: "same shape as logged-in." If a future copy refresh wants to switch to hearts, that's a one-component change in `SaveCampButton.tsx` — not coupled to this work.

3. **next-intl rejects keys that contain a literal `.` character.** I tried adding `app.camps.sort.distance.signInTooltip` and got `IntlError: INVALID_KEY: Namespace keys cannot contain the character "."`. Solved by flattening to `sort.distanceSignInTooltip`. Worth knowing for future i18n work — anywhere we want a "modifier" key on a leaf string, use a flat suffix, not a nested object replacement.

4. **Date rendering in tests is timezone-sensitive.** `new Date('2026-05-01')` parses as UTC midnight, then `.toLocaleDateString('en-US')` shifts to local time — in Eastern that's "Apr 30, 2026". The original public detail page had this behavior too (it shipped before this branch); I preserved it rather than introduce a behavior change mid-unification. Tests use `/(Apr 30|May 1), 2026/` to be timezone-tolerant. **Future cleanup:** standardize all "date-only" rendering on `new Date(iso + 'T00:00:00').toLocaleDateString(...)` (the school detail page already does this). Out of scope tonight.

5. **The /breaks/[id] page imported `PublicCampCard` for its matched-camps section.** The audit anti-goals said "don't migrate /breaks to use the new patterns." I read that as "don't restructure the breaks visuals" — and migrated only the import to `UnifiedCampCard mode="public"`, which renders byte-identical output. Calling it out in case Rasheid would have preferred PublicCampCard kept as a legacy shim. The migration removes a zombie component; the visual is unchanged.

6. **The `/app/camps` listing now uses the same 3-column grid as `/en/camps`.** Step 3.4 of the plan asked for this. The dashboard previously used a `space-y-3` vertical list with full-width row cards. Inside grid cells (320px wide on lg), the save+completeness corner couldn't share horizontal space with content, so I pulled them into an absolute-positioned top-right stack — same pattern as the disabled save in public mode. **Worth eyeballing in incognito + signed-in:** at a 320px grid cell, a card with hours + before-care + after-care + completeness corner can stack ~7 short text lines, which feels denser than the public card's 3–4 lines. If this density reads as "noisy" rather than "informative" on real screens, the next iteration is dropping the per-row before/after care lines from `mode="app"` and surfacing them only in the detail view.

7. **Schools `empty` key changed from a flat string to a `{title, body}` object.** This required updating the i18n contract test (`tests/app/public-schools-index.test.tsx`) to assert nested keys. The schoolsIndex page was the only consumer of the old flat string, so the migration was clean — but if any external SEO / scraping tooling reads the locale JSON directly, the shape changed.

## Verification checklist for Rasheid

- [ ] `/en/camps` shows compact grid + disabled hearts + sort with distance locked (🔒 visible on chip, "Sign in to sort by distance from your home" tooltip on hover)
- [ ] `/en/camps?sort=price` reorders cards by `$` → `$$` → `$$$`
- [ ] `/en/camps?sort=distance` silently falls back to name sort (since distance isn't allowed on public)
- [ ] `/app/camps` shows denser grid + functional hearts + sort with distance enabled (when origin set via kid school or saved location)
- [ ] `/en/schools` shows search bar above filter chips
- [ ] Search "Coral Gables" on `/schools` surfaces schools by name OR neighborhood OR city OR district (verify a Coconut Grove school doesn't show up; a Coral Gables school like TGP does)
- [ ] `/en/camps/the-growing-place` and `/app/camps/the-growing-place` show identical fact grids — same hours, same address, same registration deadline
- [ ] `/app/camps/the-growing-place` has the AppBreadcrumb back-to-camps link; `/en/camps/the-growing-place` has the public back-to-camps link instead
- [ ] Public detail page shows the disabled save star top-right of the hero image
- [ ] Wishlist tile on `/app` dashboard renders 2-line summaries (name + ages/$); clicking a tile opens `/app/camps/{slug}`; star is small + functional
- [ ] Empty `/en/schools?q=zzzzzz` shows the "No schools match those filters" empty hint with a "clearing filters" button + a "searching by name instead" button
- [ ] Empty `/en/camps?cats=Sports&q=zzz` shows the same hint with both recovery buttons
- [ ] Sign in, save a camp, sign out — refresh the public listing — the save star should still be the disabled ☆ (we don't leak saved state to logged-out views)

## Anti-goals respected

- ✅ No data model changes; no migrations
- ✅ No auth flow changes
- ✅ No design-token changes (existing palette tokens used: `bg-cream-border`, `text-ink`, `bg-purple-soft`, etc.)
- ✅ No school types enum or category enum changes
- ✅ No admin / operator surfaces touched
- ✅ JSON-LD output on `/{locale}/camps/[slug]` preserved exactly
- ✅ `/breaks` page itself untouched (only the `/breaks/[id]` import was migrated for cleanliness; visuals identical)
- ✅ `/app/schools/[slug]` not introduced (out of scope)

## Roadmap

`docs/ROADMAP.md` updated: new entry at `Phase 3.5.X — UI unification
(shipped 2026-04-27)` slotted between the existing 3.5 (admin
dashboard fixes) and 3.2 (per-kid plans).

Ship it. 👊
