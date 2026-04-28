# /app/camps ↔ /camps Visual Parity Audit

**Date:** 2026-04-28
**Component:** `src/components/camps/UnifiedCampCard.tsx`
**Scope:** AUDIT ONLY — no code changes. Fix authorization deferred to morning.
**Symptom:** On `/en/app/camps`, the "Missing: …" completeness text overlaps the Featured / Verified pill row on cards that have both. Cards observed broken in screenshot: Frost Science, Wise Choice, three Alexander Montessori cards. Cards rendering correctly: 305 Mini Chefs, TGP. The public route `/en/camps` renders the same camps without overlap.

---

## 1. Diff: `mode="public"` vs `mode="app"`

Both modes are siblings inside one file. `PublicCard` is at lines 145–309. `AppCard` is at lines 313–584. `WishlistTileCard` (614–653) is structurally unrelated and not part of this bug.

| Concern | Public (`PublicCard`) | App (`AppCard`) |
|---|---|---|
| `<article>` layout | `relative rounded-2xl … p-4` (block; children stack via individual margins) | `relative flex flex-col gap-1.5 … p-4` (flex column) |
| Save affordance | Disabled `<button>` ghost star, `h-9 w-9`, `absolute right-3 top-3`, sibling of `<Link>` | Functional `SaveCampButton` size="md" → `h-11 w-11` |
| Save container | The button is the only thing absolutely positioned | A whole flex column is absolute: `<div class="absolute right-3 top-3 flex flex-col items-end gap-1.5">` containing **both** `SaveCampButton` **and** `CompletenessCorner` |
| Title-row spacer | `<span class="invisible shrink-0 text-xl">☆</span>` — ~1 character wide, reserves only horizontal space for the small ghost star | `<span aria-hidden class="invisible shrink-0 h-11 w-11" />` — 44×44 px reserved for the save button |
| Badge row (Featured / Verified / Religious / Open-this-day) | Normal-flow `<div class="flex flex-wrap gap-1.5">` **inside** `<Link>`, after ages line | Normal-flow `<div class="flex flex-wrap gap-1.5">` **inside** `<Link>`, immediately after title row (before tagline) |
| "Open this day" pill | Rendered (public-only feature) | Not rendered |
| Tagline | Inside `<Link>`, after title row, before ages | Inside `<Link>`, **after** badge row |
| Category chips | Inside `<Link>`, normal flow, after badge row → completeness text appears below them | Inside `<Link>`, normal flow, after the long stack of logistics rows |
| App-only logistics rows (distance, hours, full-workday, before/after care, no-care, care-pending, sessions-unknown) | n/a | 7 conditional `<p>` rows inside `<Link>`, between ages and pills |
| Completeness display | Plain `<p class="mt-1 text-[11px] text-muted">` rendered **inside** `<Link>` as the last child (lines 282–290). Width is constrained by the Link's flex column → wraps inside the card's content width | `<CompletenessCorner>` → `<CampCompletenessBadge>` — for `partial` band, a `<p class="mt-1 text-[11px] font-medium text-muted">`; for `limited` band, an actionable amber `<button>`. **Rendered inside the absolute top-right column**, outside the Link |
| Limited-band interactivity | Public renders limited as plain text — no action | App renders limited as a real `<button>` that fires `so-open-feature-request` (intentional app-only feature) |
| Mode awareness | Single light-on-cream skin | parents/kids — kids variant uses glassy `bg-white/10 backdrop-blur-md`, white text. Same DOM tree, just classnames |

---

## 2. Why public works and app doesn't

The bug is **one specific divergence**: where completeness text is rendered.

**Public path (works):**
```
<article relative>
  <Link flex flex-col gap-1.5>
    [title row + 1-char spacer]
    [tagline]
    [ages]
    [badge row]                ← all rows here are normal flow
    [category pills]
    [completeness <p>]         ← also normal flow, last child
  </Link>
  <button absolute right-3 top-3 h-9 w-9 />   ← only the ghost star is absolute
</article>
```
Because the completeness `<p>` is a normal-flow child of the Link's flex column, its width is bounded by the card's content width. It wraps **downward**. The only absolutely positioned element is the small (h-9) ghost star, which only sits over the title-row spacer. Nothing else collides.

**App path (broken):**
```
<article relative flex flex-col gap-1.5>
  <Link flex flex-col gap-1.5>
    [title row + 44×44 spacer]
    [badge row]                ← normal flow, full content width
    [tagline]
    [ages]
    [distance / hours / care rows…]
    [category pills]
  </Link>
  <div absolute right-3 top-3 flex flex-col items-end gap-1.5>
    <SaveCampButton h-11 w-11 />
    <CompletenessCorner>          ← partial-band <p> with NO width constraint
  </div>
</article>
```
The absolute column hosts both the save button **and** the completeness text. The completeness `<p>` has no `max-w-*`, no `whitespace-nowrap`, no truncation, no width inherited from a sized parent. With `items-end`, it right-aligns and grows leftward as content width increases. "Missing: hours, registration URL, registration deadline" produces a multi-line block whose **leftmost extent reaches into the badge-row area** of the Link below.

Crucially, the title-row spacer (`h-11 w-11`) only reserves vertical space equal to the save button. It does **not** reserve space for the completeness text below the save button. So the badge row, which is the next normal-flow child of the Link, has nothing pushing it down or rightward — it sits directly under the spacer's bottom edge, which is exactly where the completeness text now hangs.

**Why some cards look fine:**
- 305 Mini Chefs / TGP: either no Featured/Verified pills (no badge row to collide with), or completeness band is `complete` (no text rendered at all), or `<3` completeness signals are present so `CompletenessCorner` returns null (line 598 of `UnifiedCampCard.tsx`).
- Frost Science / Wise Choice / Alexander Montessori: have **both** a badge row **and** a partial-band completeness `<p>` long enough to wrap into the badge row's horizontal lane.

This is not a CSS quirk in tailwind classes or a stacking-context issue. It is a layout architecture difference: public uses one absolute element + everything else in flow; app uses an absolute element that contains an unbounded text block sized by its own content.

---

## 3. Recommended fix shape

**Smallest change for visual parity:** stop rendering completeness inside the absolute top-right column. Move `<CompletenessCorner>` out of the absolute `<div>` and render it as a normal-flow sibling **after** the `<Link>`, inside the article's existing `flex flex-col gap-1.5`. Leave only `<SaveCampButton>` in the absolute corner.

Sketch (before → after of `AppCard` lines 569–582):

```tsx
// before
      </Link>
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
        <SaveCampButton ... />
        <CompletenessCorner camp={camp} />
      </div>
    </article>

// after
      </Link>
      <CompletenessCorner camp={camp} />
      <SaveCampButton
        ...
        className="absolute right-3 top-3"   // or wrap in absolute span
      />
    </article>
```

Why this matches public:
- Public puts completeness as the last child of the Link (in flow); app puts it as the last child of the article (in flow). Both bound width to the card's content width and stack vertically.
- Public's save lives absolute at top-right; app's save still lives absolute at top-right.
- The 44×44 title-row spacer continues to protect the title; nothing else needs to dodge the save button because nothing else is absolute.

**Why CompletenessCorner has to be a sibling of `<Link>` and not inside it:** `CampCompletenessBadge` for the `limited` band renders a real `<button>`. Nesting an interactive `<button>` inside `<a>` is invalid HTML; today's code dodges that by living outside the Link. Keep that property — render the badge as a sibling of the Link, not inside it. (Public sidesteps this by rendering plain text for both bands.)

**Alternative considered (and rejected):** add `max-w-[8rem]` and `text-right` to the completeness `<p>` and keep it absolutely positioned. This would clamp horizontal growth, but creates a tall narrow text block that looks worse than public, eats vertical space the save button doesn't need, and still risks future overflow if missing-fields strings get longer (or in `es` where field names are wider). Move-out-of-absolute is the same number of edits and architecturally correct.

---

## 4. Anti-goals — what NOT to change

App mode has features public deliberately doesn't, and these are intentional. The fix must preserve all of them:

| Keep | Reason |
|---|---|
| Functional `<SaveCampButton>` (h-11 w-11) and its absolute top-right position | Save is the primary CTA on the dashboard directory; click target sized for thumbs |
| Distance line (📍) | Logged-in users have a saved address; public viewers don't |
| Hours line (⏰) and `hours.pending` fallback | Logistics density is the whole point of the app card |
| Full-workday badge (🟢) and before/after-care lines | Same — logistics density |
| `hasNoExtendedCare` and `carePending` rows | Same |
| `sessions_unknown` row | Closure-mode disclosure |
| Pending-verification ⚠ next to title | App-only honesty signal |
| `CampCompletenessBadge` actionable `limited` button | Drives feature-request submissions; public renders a plain `<p>` because the public viewer can't author corrections |
| parents/kids (`useMode()`) skin variants | Kid-mode glassy treatment is core to the dashboard's mode system |
| Title-row 44×44 invisible spacer | It's correctly sized for the save button. Don't shrink it — that would put the title under the save button on narrow grids |
| `data-testid="camp-completeness-partial"` and `camp-completeness-limited` | Tested by `tests/components/camps/UnifiedCampCard.*.test.tsx` — moving the component is fine, deleting these test ids is not |
| Public's existing layout | It works. Do not "harmonize" by changing public to match app |

The single accidental difference — completeness text living inside the absolute corner column instead of in normal flow — is the only thing that needs to change.

---

## 5. Blast radius

- **`WishlistTileCard` (lines 614–653):** Self-contained. Does not render badges, pills, completeness, distance, hours, or care rows. Renders only name + ages line + functional `SaveCampButton`. The proposed fix touches `AppCard` only — zero impact on wishlist tile.
- **`PublicCard`:** Unchanged. Works correctly; not edited.
- **`CampCompletenessBadge`:** Used only by `CompletenessCorner` in `UnifiedCampCard.tsx` (verify with grep before fix). Moving its mounting point from absolute column to normal flow does not change its props or DOM. Existing test ids (`camp-completeness-partial`, `camp-completeness-limited`) preserved.
- **Tests:** `tests/components/camps/UnifiedCampCard.test.tsx` and `UnifiedCampCard.religious-badge.test.tsx`. Tests assert presence/absence of badges and saved-state behavior, not absolute positioning. Should pass unchanged. Worth running as a smoke test after the fix.
- **Pages mounting `UnifiedCampCard mode="app"`:** any caller of `/app/camps` listing pages, the camp detail page's "related camps" surface (if any), and the dashboard wishlist (which uses `mode="wishlist-tile"` so unaffected). Verify with `grep -rn 'UnifiedCampCard' src` before merging the fix.
- **A11y:** Today the completeness text lives in a different DOM order from its visual position (it's at top-right of the card visually, last in source order via absolute placement above the link). Moving it into normal flow at the bottom of the article aligns visual and source order — strictly an improvement for screen readers.
- **i18n:** `es` strings for `partial` field names are typically wider than `en` ("horarios, URL de registro, fecha límite de inscripción"). The current bug is worse in `es`; the fix removes the failure mode entirely (text wraps inside content width).
- **Featured/Verified pill behavior:** Unchanged. They keep their current spot (badge row directly below title) — the badge row will simply no longer be obscured.

---

## 6. Open questions for the morning

1. Should app mode also render an "Open this day" pill (closure-aware) like public does? Currently public has it (line 220) and app does not. Out of scope for this fix; flag for future parity sweep.
2. Should public mode get the actionable `limited` button too? Currently public is read-only on completeness. Out of scope.
3. The CompletenessCorner suppression rule (`signals.filter(Boolean).length < 3`) is app-only — public always shows the partial/limited message when band is non-complete. Different on purpose? Probably yes (app callers may pass loose shapes), but worth a note.

---

## TL;DR

Public renders the "Missing: …" line as a normal-flow `<p>` at the bottom of the card; app renders it inside an absolutely positioned top-right column whose width grows with the text. On cards with both a Featured/Verified pill row and a multi-field missing list, the absolute completeness text overlaps the badge row. Fix: move `<CompletenessCorner>` out of the absolute `<div>` and render it as a normal-flow sibling after the `<Link>`, leaving only `<SaveCampButton>` in the absolute corner. No changes to public or wishlist-tile modes; no changes to logistics rows, save behavior, or kid-mode skin.
