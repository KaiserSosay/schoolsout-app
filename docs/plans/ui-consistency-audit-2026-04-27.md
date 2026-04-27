# UI Consistency Audit — 2026-04-27

Read-only audit of the camp / school / dashboard surfaces. Spec for the
follow-up unification prompt. No code changes were made.

---

## Executive summary

The public and dashboard camp directories already share their core
filter, count, and empty-state components (`CampsFilterBar`,
`CampCount`, `CampsEmptyHint`). Where they diverge: **the card** and
**the layout container.** The dashboard renders a horizontal-row
`<CampCard>` (`<ul className="space-y-3">`) with a save heart and
distance label; the public page renders a more compact
`<PublicCampCard>` in a 1/2/3-column grid (`grid grid-cols-1
md:grid-cols-2 lg:grid-cols-3`). Same data, different shape, different
mental model.

Schools is the larger gap: there is **no `/app/schools` directory at
all**, no search bar on `/schools`, no shared filter/card pattern with
camps, and no logged-in school detail surface. The dashboard wishlist
section uses a third (inline) card style that is neither
`PublicCampCard` nor `CampCard`. So three distinct camp-card components
exist.

The "110 vs 108" mismatch is almost certainly a **snapshot in time**
artifact — the two pages run identical SQL filters, and migration 051
(applied today) inserted exactly two new camps. Not a real divergence
bug.

---

## Per-surface breakdown

### 1. Public camps directory: `/{locale}/camps`

**Page component:** `src/app/[locale]/camps/page.tsx`
**Card component used:** `src/components/public/PublicCampCard.tsx`
**Filter component used:** `src/components/camps/CampsFilterBar.tsx` (mode="public")
**Search component used:** built into `CampsFilterBar` (the 🔍 input on row 1)
**Count component:** `src/components/camps/CampCount.tsx`
**Empty state:** `src/components/camps/CampsEmptyHint.tsx`
**Data fetched:** `camps` SELECT with `verified=true` AND `website_status<>'broken'`, ordered by `is_featured DESC, name`. Selects 22 columns including the care/hours fields the shared filter relies on.
**Auth gate:** public — uses service-role Supabase client, no user check.

**Visual elements rendered:**
- [x] Search bar (inside CampsFilterBar)
- [x] Filter pills (11 categories: Sports, Soccer, Swim, Tennis, Basketball, Art, Theater, Music, Dance, STEM, Nature)
- [x] Care toggles (Before-care, After-care; Full-workday gated behind env flag)
- [x] Advanced drawer (Ages, Price, Neighborhoods)
- [ ] Sort toggle — **NOT rendered** (no `<CampSortControl>`; default name-only via the SQL `order('name')`)
- [x] Count display via `<CampCount>` (e.g. "110 camps")
- [x] Card grid — **uniform 1/2/3-column grid**
- [ ] Save heart — replaced with 🔒 "Sign in to save" affordance
- [x] Featured badge (`⭐` cta-yellow pill, gated by `is_featured && featured_until > now`)
- [x] Verified badge (`✓` cream pill, gated by `verified && last_verified_at < 90d`)
- [ ] Distance badge — never rendered (no user origin)
- [ ] "Plan This Day" button — none
- [x] Top CTA card ("Save my spot for reminders" → `#signup`)
- [x] Bottom CTA card (camp-operator pitch → `/list-your-camp`)
- [x] Inline completeness footer — "Limited info" / "Missing: hours, address, …"

**Behaviors:**
- Default sort: SQL `is_featured DESC, name ASC` (no client toggle)
- Filter persistence: URL params (`?q=`, `?cats=`, `?ages=`, `?tier=`, `?hood=`, `?before_care=`, `?after_care=`)
- Empty state: `<CampsEmptyHint>` with "clear all filters" + "clear search" inline buttons
- Pagination: **none** — full set rendered at once (~110 rows is cheap)
- Search: 300ms debounce, then URL push

**Card structure (`PublicCampCard`):**
- Image: **no** (compact text-only card)
- Title: `text-base font-black` truncated, with 🔒 right-side "sign in to save" indicator
- Subtitle: `Ages X–Y · $$ · Neighborhood`
- Pills: up to 2 `categories` chips (`bg-purple-soft`)
- Featured/Verified/Open-this-day pills above categories
- Inline completeness line at bottom for non-complete bands

**i18n keys:**
- Page strings: `public.camps`
- Filter strings: `camps.filters` (search.label, search.placeholder, categories.label, advanced.*, …) + `app.camps.categories.*` for the 11 category labels
- Card pills: `app.camps.featured.*`, `app.camps.verified.*`, `app.camps.completeness.field.*`
- Count: `camps.count.{total,filtered,zero}`

---

### 2. Dashboard camps directory: `/{locale}/app/camps`

**Page component:** `src/app/[locale]/app/camps/page.tsx`
**Card component used:** `src/components/app/CampCard.tsx`
**Filter component used:** `src/components/camps/CampsFilterBar.tsx` (mode="app")
**Sort component used:** `src/components/app/CampSortControl.tsx` (distance / price / name + "From" origin select)
**Count component:** `src/components/camps/CampCount.tsx` (same as public)
**Empty state:** `src/components/camps/CampsEmptyHint.tsx` (same as public)
**Page header:** `src/components/app/AppPageHeader.tsx` (eyebrow=PLAN, title, subtitle)
**Data fetched:** identical `camps` filter to `/camps` (`verified=true AND website_status<>'broken'`), but a wider SELECT (35 columns including image_url, latitude/longitude, full care fields, registration_*, logistics_verified). Plus parallel auth'd reads for `saved_camps`, `kid_profiles.school_id`, `saved_locations` to power "save heart" + "From X" distance origins.
**Auth gate:** route requires login (enforced in `app/layout.tsx`); page renders even if user is null but distance/save features no-op.

**Visual elements rendered:**
- [x] Search bar (same `CampsFilterBar`)
- [x] Filter pills (same 11 categories)
- [x] Care toggles + Full-workday env-gated chip
- [x] Advanced drawer (Ages, Price, Neighborhoods)
- [x] Sort toggle (Name / Price / Distance) — **public page does NOT have this**
- [x] "From" origin selector — only when distance picked, populated from kid schools + saved_locations
- [x] Count display via `<CampCount>` (e.g. "108 camps")
- [x] Card list — **vertical full-width rows** (`<ul className="space-y-3">`), NOT a grid
- [x] Save heart on each card (`SaveCampButton` — fully functional)
- [x] Featured badge (same gating, but mode-aware styling)
- [x] Verified badge (same gating)
- [x] Distance badge (only when origin set; "~X mi" prefix when computed from neighborhood centroid)
- [ ] "Plan This Day" button — not on the listing card
- [x] Hours row (⏰), care rows (✅ before / ✅ after / ❌ none / "pending"), full-workday badge (🟢)
- [x] Pending-verification ⚠ icon next to title when `verified=false`
- [x] Completeness corner badge (`<CampCompletenessBadge>`) bottom-right when score < complete
- [ ] No Top/Bottom CTA cards (the dashboard has its own AppPageHeader instead)

**Behaviors:**
- Default sort: name (or `distance` if user has a usable origin)
- Filter persistence: same URL params as public + `?sort=`, `?from_id=`, `?from_lat=`, `?from_lng=`
- "match my kids" chip: hidden (`matchEnabled={false}` in page.tsx — feature wired but not yet shipped)
- Empty state: same `<CampsEmptyHint>`
- Pagination: none

**Card structure (`CampCard`):**
- Image: **no** (compact horizontal row card)
- Layout: `flex items-center gap-4 ... p-4` — title block on the left, save heart + completeness corner on the right
- Title: `text-base font-black` truncated, with optional ⚠ pending-verification icon
- BadgeRow above subtitle: ⭐ Featured / ✓ Verified
- Subtitle: `Ages X–Y · $$` + neighborhood
- Distance row, hours row, care rows (each as a separate small line)
- Up to 2 category pills
- Mode-aware styling — `parents` uses `bg-white border-cream-border`; `kids` uses glassy `bg-white/10`

**i18n keys:**
- Page strings: `app.camps`
- Filter strings: same `camps.filters` namespace as public
- Card pills: `app.camps.{featured,verified}.*`, `app.camps.care.*`, `app.camps.hours.*`
- Count: same `camps.count.*` namespace

**Visual divergence from public:** the same data, but rendered as
**list rows instead of a grid**, with image-less cards that are wider
and taller because they show distance, hours, before/after care, and a
save heart. The single biggest reason `/app/camps` "looks irregular"
to Rasheid: it's not irregular — it's a 1-column list, while
`/en/camps` is a 3-column grid. Different layout, same column-width
math.

---

### 3. Public camp detail: `/{locale}/camps/{slug}`

**Page component:** `src/app/[locale]/camps/[slug]/page.tsx`
**Card/view component:** **none — fully inline server-rendered JSX**
**Top bar:** `src/components/public/PublicTopBar.tsx`
**Data fetched:** `camps` SELECT by slug, no `verified`/`website_status` filter (any camp resolves by slug). Selects 22 columns + JSON-LD inputs.
**Auth gate:** public.

**Renders:**
- Top "← Back to camps" link
- Hero image (or gradient fallback) at 16:9
- Title + neighborhood + categories pills row
- 2-column "Fact" grid: Ages, Price, Hours, Address, Registration deadline
- Description paragraph
- Action buttons: "Visit website ↗" (ink) + "Call X" (white outlined)
- Verified-source banner (emerald if last_verified_at present, amber otherwise)
- "Limited info" disclaimer when completeness is partial/limited
- Bottom CTA card ("Save my spot for reminders" → `#signup`)
- JSON-LD: `Camp` schema + breadcrumbs

**No save button. No "Plan this day". No log-in nudge other than the bottom signup card.**

---

### 4. Dashboard camp detail: `/{locale}/app/camps/{slug}`

**Page component:** `src/app/[locale]/app/camps/[slug]/page.tsx`
**View component:** `src/components/app/CampDetailView.tsx`
**Data fetched:** `camps` SELECT by slug (lean — only 12 columns, no hours/care/registration). Plus auth'd `saved_camps` lookup for the save state. Fires a `kid_activity` "viewed_camp" insert.
**Auth gate:** route in `/app`, requires login.

**CampDetailView renders (mode-aware):**
- AppBreadcrumb back to `/app/camps`
- Hero image (or gradient)
- Title + neighborhood
- Pill row: Ages, Price, plus category pills
- SaveCampButton (heart, lg)
- Description
- "Visit website ↗" CTA
- ⚠ pending-verification banner when not verified

**Divergence from public detail:**
- Smaller field set (no hours, no address, no registration deadline, no phone). The dashboard detail is data-poorer than the public detail — the public page selects more columns.
- Save heart present.
- No JSON-LD (signed-in view, not SEO-indexable).
- Mode-aware styling.

This is a real bug-shaped surface area: a parent who navigates from
`/app/camps` → `/app/camps/{slug}` sees LESS information than the
public version of the same camp, including no hours and no address.

---

### 5. Public schools directory: `/{locale}/schools`

**Page component:** `src/app/[locale]/schools/page.tsx`
**Card/row component:** **inline `<Link>` rendered directly in the page** (no shared component). Class `flex flex-col gap-0.5 rounded-2xl border ... px-4 py-3`.
**Filter component used:** `src/components/public/SchoolsIndexFilters.tsx` (school-types row + neighborhoods accordion)
**Search component used:** **NONE** — confirmed.
**Data fetched:** `schools` SELECT with `closed_permanently=false`, ordered by name. Has a rich/lean fallback for un-migrated DBs. ~316 rows fetched in one shot, then in-memory filtered + paged client-side.
**Auth gate:** public.

**Visual elements rendered:**
- [ ] **Search bar — confirmed missing**
- [x] Type filter chips (public, charter, magnet, private, religious, independent, preschool)
- [x] Neighborhoods accordion (auto-opens when filter active)
- [ ] Sort toggle — none
- [x] Count display (custom inline, NOT `<CampCount>`)
- [x] Two-column grid (`grid grid-cols-1 md:grid-cols-2`) of inline cards
- [ ] No badges (no equivalent of camps' Verified/Featured pills)
- [x] Pagination (50/page) — `<Pagination>` component inline at bottom, `?page=N` URL state

**Card structure (inline):**
- Title: school name, `text-sm font-black`
- Subtitle: `{type label} · {neighborhood ?? city}` + optional ` · MDCPS` badge in copy
- No image, no pills, no save heart, no detail-link affordance beyond hover

**i18n keys:**
- Page strings: `public.schoolsIndex`
- Filter strings: `public.schoolsIndex.filters.*`
- Type labels: `public.schoolsIndex.filters.types.{public,charter,magnet,private,religious,independent,preschool}`

**Most surprising:** schools doesn't share **any** primitive with camps —
not the count widget, not the empty state, not the filter primitive.
Each filter chip styling block is duplicated wholesale between
`SchoolsIndexFilters` and `CampsFilterBar` (same `chipBase /
chipActive / chipInactive` strings, same neighborhoods-accordion
pattern).

---

### 6. Dashboard school detail: `/{locale}/app/schools/{slug}`

**Confirmed: this surface DOES NOT EXIST.** There is no
`src/app/[locale]/app/schools/` directory at all.

A logged-in user clicking a school name (from `/app` dashboard kid
cards or anywhere else) is sent to `/{locale}/schools/{slug}` — the
public detail page. The dashboard never re-frames the school in a
logged-in context.

This is a Phase decision (probably correct — schools are public
calendars, not user-owned data) but it's worth flagging that any
"unified dashboard look" for schools does not currently have a place
to land.

---

### 7. Public school detail: `/{locale}/schools/{slug}`

**Page component:** `src/app/[locale]/schools/[slug]/page.tsx`
**Calendar list component:** `src/components/schools/SchoolCalendarSections.tsx`
**Sub-components:** `UnverifiedSchoolCalendarPlaceholder`, `HelpVerifyCalendarCta`, `SchoolCalendarSubmissionForm`
**Data fetched:** `schools` SELECT by slug (rich/lean fallback) + last 13 months of `closures` for that school (limit 80). Also a small metadata-only fetch in `generateMetadata` for the year-label.
**Auth gate:** public.

**Renders:**
- PublicTopBar
- Header (eyebrow + title + district/city/state line + verified pill OR unofficial subhead)
- For verified schools: `<SchoolCalendarSections>` of closures grouped by year/month with toggle to reveal past breaks
- For unverified schools with no closures: `<UnverifiedSchoolCalendarPlaceholder>`
- For unverified schools WITH closures: a "Confirmed dates" mini-section with the same component variant=unofficial
- District-pattern banner (amber) when `follows_district_pattern=true`
- "Help us verify" CTA when not verified
- `<SchoolCalendarSubmissionForm>` (always present)
- Official-links card (website/phone/address)
- Bottom signup CTA
- JSON-LD: `School` + `FAQPage` (3 Q&A) + breadcrumbs

This page has **its own component vocabulary** — none of it is shared
with the camps detail surface, even though both are "public detail of
an entity."

---

### 8. Dashboard home — saved camps section: `/{locale}/app`

**Page component:** `src/app/[locale]/app/page.tsx`
**Saved-camps component:** `src/components/app/WishlistSection.tsx`
**Card style:** **third inline format** — neither `PublicCampCard` nor `CampCard`. A simple 2-line link row: name + "Ages X–Y · $$" subtitle, with a `→` chevron on the right.
**Data fetched:** ALL the user's `saved_camps` joined to `camps` (id, slug, name, price_tier, ages, categories, website_url, neighborhood). This data join is done at page level and passed in.

The page also renders `ParentDashboard` / `KidDashboard` / etc. with
many other sections (closures, plans, activity feed). The wishlist is
ONE section among many, and explicitly says "wishlist" rather than
"saved camps" in copy.

**Surprising finding:** `WishlistSection` is the simplest card render
of the three, and it isn't reused anywhere else. The wishlist tab
itself (`/app/saved`) uses the FULL `<CampCard>`, not this mini.

---

### 9. Public closures listing: `/{locale}/breaks`

**Page component:** `src/app/[locale]/breaks/page.tsx`
**Card/row component:** **inline `<Link>` rows** in the page (no shared component)
**Data fetched:** `closures` with `status='verified' AND start_date >= today`, limit 200. Joined manually with a `schoolById` Map.
**Auth gate:** public.

**Renders:** title + subtitle, signup CTA card, then a `<ul>` of inline rows. Each row: `{emoji} {name}` title, `{date range} · {school name}` subtitle, day-count pill on the right ("Today" / "Tomorrow" / "in 12 days"). No filter, no search.

**Detail page** at `/{locale}/breaks/[id]` exists and is presumably the
same shape; not opened in this audit.

This surface is consistent within itself but uses none of the camps
primitives.

---

### 10. Saved tab: `/{locale}/app/saved`

**Page component:** `src/app/[locale]/app/saved/page.tsx`
**Card component:** `src/components/app/CampCard.tsx` (same as `/app/camps`)
**Empty state:** `src/components/app/SavedEmpty.tsx` — bespoke, NOT `<CampsEmptyHint>`
**Data fetched:** all `saved_camps` for user, joined with the lean camp shape (no hours/care/registration).
**Auth gate:** route requires login.

**Renders:** `<AppPageHeader eyebrow="WISHLIST">`, then either the
empty state or `<ul className="space-y-3">` of `<CampCard>` rows with
`saved=true` baked in. No filter bar, no sort, no count.

**Note:** because the data passed in is the lean shape, `<CampCard>`
won't render hours, care, distance, or completeness on this surface —
the card's own conditional rendering hides those rows when the props
are undefined.

---

## Cross-cutting findings

### 1. How many distinct CARD components for camps? **Three.**

1. `src/components/public/PublicCampCard.tsx` — public directory
2. `src/components/app/CampCard.tsx` — dashboard `/app/camps` + `/app/saved`
3. `src/components/app/WishlistSection.tsx` — inline mini-card rendered only on `/app` dashboard home

Plus two distinct **detail-view** renderings:
- `src/app/[locale]/camps/[slug]/page.tsx` (inline JSX, public)
- `src/components/app/CampDetailView.tsx` (logged-in)

### 2. How many distinct CARD components for schools? **Three (each inline, none shared).**

1. Inline row in `/{locale}/schools/page.tsx`
2. Inline row in `/{locale}/breaks/page.tsx` (closure rows, but same visual vocabulary)
3. The full school detail page has its own bespoke header + content shape

### 3. Filter components: shared OR duplicated?

- `/camps` and `/app/camps` **share** `<CampsFilterBar>` with a `mode="public"|"app"` prop. That sharing is real and well-factored.
- `/schools` uses `<SchoolsIndexFilters>` — **completely separate**, with the same chip styling strings duplicated verbatim (`chipBase`, `chipActive`, `chipInactive`).

### 4. The 110 vs 108 mystery

**Both surfaces run identical SQL filters:**
```ts
.eq('verified', true)
.neq('website_status', 'broken')
.order('is_featured', { ascending: false })
.order('name')
```

There is no filter difference. The only way the totals can differ at
the same point in time is via Vercel edge cache — but both pages set
`export const dynamic = 'force-dynamic'`, which should preclude
caching.

The likely explanation: **migration 051 (committed today) added
exactly two new camps** (305 Mini Chefs + Wise Choice). 110 − 108 = 2.
Rasheid's two screenshots were taken at different points relative to
that migration apply. Whichever page was fetched first saw the older
count; the second saw the new count.

**Conclusion: not a real bug, snapshot artifact.** A unification
prompt does NOT need to fix anything for this. If 110 vs 108 persists
after a hard refresh of both pages, then it's worth re-investigating —
but the code is identical.

(Caveat: I could not run live SQL to definitively confirm — there's
no `.env.local` in this checkout. The code-level certainty is high,
the prod-data certainty is "very likely.")

### 5. Where's the search component?

There is no standalone search-bar component. The 🔍 search input is
inlined inside `<CampsFilterBar>` (lines 92–118). It's a
controlled-input + 300ms debounce + URL-push setup keyed on the `q`
filter from `lib/camps/filters`.

To lift it for `/schools`, a future `EntitySearchBar` could:
- Accept a `value`/`onChange` pair OR a URL-param name (`q` for camps, `q`-or-`name` for schools)
- Move the chip-strip styling primitives (`chipBase`, etc.) to a tiny shared module so both filter bars consume them
- Stay agnostic to the entity's query shape

Schools currently has `name`-substring search built into neither the
SQL query nor the in-memory filter — it would need both.

### 6. Ghost-UI pattern (greyed-out + lock icon)?

**It exists in one place:** `PublicCampCard.tsx:75–83` renders 🔒 with
`title={t('signInToSave')}` next to the title. That's the public-card
"sign in to save" affordance.

It is NOT used on `/schools`, `/breaks`, or any dashboard-only feature
that a logged-out user might encounter. So one example exists; a
unification prompt that wants ghost-UI for other actions
("Plan This Day," etc. while logged out) would extend an existing
pattern rather than invent one.

### 7. What causes the dashboard "irregular cards"?

This is a **perception bug, not a code bug.**

- `/en/camps` renders `<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">` — a 3-column grid of compact `<PublicCampCard>` (no image, no save, no distance, no hours).
- `/app/camps` renders `<ul className="space-y-3">` — a vertical stack of full-width `<CampCard>` rows (no image, but wider because of distance, hours, care rows, save heart, completeness corner).

Each `/app/camps` row is **uniform width** — they're not "some wide,
some narrow." But because the cards have variable VERTICAL HEIGHT
(camps with hours, care, full-workday, completeness fill 6+ lines;
camps without those fill 3 lines), the visual rhythm reads as
"irregular" next to the `/en/camps` grid where every card has the
same fixed height.

**Confirmed root cause:** vertical-height variance from optional
fields, not horizontal-width or class-divergence bugs. A unification
that wants `/app/camps` to feel as "clean" as `/en/camps` should
either (a) move dashboard to the same grid + compact card, or
(b) commit to the row layout but normalize each row to the same number
of lines (e.g. always render the hours and care lines, even if they
say "—").

---

## Specific bug confirmations

### Bug A: Dashboard `/app/camps` cards look irregular

**Confirmed: not a CSS or component bug.** The cards have uniform
width and uniform class strings. The visual irregularity comes from
height variance because some cards have populated hours / before-care
/ after-care / completeness fields and others don't. See cross-
cutting finding #7 for the remediation choice.

### Bug B: 110 vs 108 between public and dashboard

**Confirmed: not a real divergence.** Both queries are byte-identical
on filter clauses. The 2-row difference exactly equals the two camps
inserted by migration 051 today. Snapshot timing artifact.

### Bug C: `/{locale}/schools` has no search bar

**Confirmed.** Page renders type chips + neighborhood accordion +
inline list. There is no `<input>` element on the page. Search would
need to be designed and built — there's not even a hidden code path.

### Bug D: 305 Mini Chefs + Wise Choice on both `/en/camps` and `/app/camps`?

**Likely yes on both** (confirmed by reading migration 051): both new
rows are inserted with `verified=true` and inherit
`website_status='unchecked'` from the column default. The
`verified=true AND website_status<>'broken'` filter on both pages will
include them. Frost was already verified+featured.

I did not run live SQL to confirm visually, but the schema-level
analysis says they should appear on both surfaces.

---

## Recommended unification approach

**Code's reading, not a decided plan.**

The cheapest unification with the highest return is to **normalize
`/app/camps` to the same grid + compact card pattern as `/en/camps`,
then add the dashboard-only affordances (save heart, distance, sort)
back as overlay elements**. Concretely:

1. Promote `<PublicCampCard>` into `<CampCard mode="public" | "app">`
   under `src/components/camps/` (a third location, sibling to filter
   bar). Pass `saved` + `onSave` + optional `distanceMiles` as props.
2. Render the same `<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">` on both pages.
3. Drop the hours/care/full-workday line items from the card and surface them only on the detail page (which makes the detail-page divergence in surface 4 a real fix to do anyway).
4. The save heart sits in the same place the 🔒 currently sits on the public card (top-right corner). Swap by mode.
5. `<CampSortControl>` stays app-only.

For schools, the bigger ask:

1. Add a search input — easiest path: lift the existing
   `<CampsFilterBar>` search input into a tiny `<EntitySearchBar>` and
   render it above `<SchoolsIndexFilters>`.
2. Optionally promote the chip-styling strings (`chipBase`,
   `chipActive`, `chipInactive`) to a shared `chip-classes.ts` so the
   two filter components stop duplicating tokens.

Wishlist mini-card on `/app` dashboard: leave alone. It's
context-appropriate (a dashboard summary tile, not a directory). A
unification prompt that touches it risks overreach.

---

## Estimated scope of unification

If we **only** normalize `/app/camps` to the grid + compact card:
- Files touched: ~5 (`/app/camps/page.tsx`, the new `<CampCard mode>`,
  delete or trim `src/components/app/CampCard.tsx`, possibly
  `/app/saved/page.tsx`, possibly the wishlist if we want full
  consistency).
- Likely commits: 1–2.
- Risk: medium — the dashboard card carries logic the public card
  doesn't (logistics_verified, sessions_unknown, mode-aware kid
  styling). Either preserve it via props, or accept that the
  dashboard's information density takes a hit.

If we **also** add a `/schools` search and lift chip styling:
- Files touched: ~8.
- Likely commits: 2–3.
- Risk: low — the work is additive on schools.

If we **also** unify the detail-view discrepancy (Bug-shaped surface
4 vs surface 3):
- Files touched: ~10.
- Likely commits: 3.
- Risk: medium — `CampDetailView` is mode-aware client component;
  `/camps/[slug]` is pure server JSX. Merging them is a real refactor.

If we **also** introduce `/app/schools/{slug}`:
- Out of scope of this audit. Don't attempt in one prompt.

**Recommended bite size for the next prompt:** scope 1 (compact card
unification on `/app/camps`) + scope 2 (schools search + shared chip
styling). Defer scope 3 to its own prompt because the data shapes
between `/camps/[slug]` and `/app/camps/[slug]` actually do diverge
(public selects 22 columns, dashboard selects 12) and the unification
needs a data decision, not just a UI decision.

---

## Things Rasheid should decide before unification ships

1. **Save affordance for logged-out users on the unified card.** Today
   the public card renders 🔒 in the top-right corner. After
   unification, should `/en/camps` (a) keep 🔒, (b) render a disabled
   heart with a "sign in to save" tooltip, or (c) render a normal
   heart that triggers the sign-in flow on click? Each is shippable;
   each implies different copy and different mom-test framing.

2. **Card density on `/app/camps`.** The dashboard card today shows
   hours, before/after care, full-workday badge, distance,
   completeness corner. If we move to the compact public card, those
   facts disappear from the listing. Acceptable trade for visual
   uniformity, OR essential to the planning workflow? Mom-test
   answer: probably "these are the things parents scan for before
   tapping in," in which case the unified card needs a `mode="app"`
   variant that shows them — but then we're back to the height-variance
   problem from Bug A.

3. **Sort visibility on the public page.** Today only `/app/camps` has
   a sort toggle. Should `/en/camps` get a Name / Featured toggle even
   without distance? (Without a user origin, distance is unavailable
   on the public page.) Or stay sort-less to keep the page simple?

4. **Schools search scope.** Substring on name only, or also
   neighborhood/district/city? The latter is what camps does (`q`
   matches against a few fields in `applyFilters`).

5. **Empty state for `/schools`.** Camps shares `<CampsEmptyHint>`
   with "clear all filters" and "clear search" inline buttons. Schools
   currently has a flat translated string. Match the camps pattern, or
   stay simple?

6. **Detail-page divergence cleanup (surfaces 3 vs 4).** Today
   `/app/camps/{slug}` shows LESS than `/camps/{slug}` for the same
   camp (no hours, no address, no registration deadline). Pull the
   data through and unify the two, or accept that the dashboard detail
   is the "concise" view? The current state surprises users who
   navigate from public → sign in → see less.

7. **Wishlist micro-card on the dashboard.** Leave alone, or also
   normalize? Argument for leaving it alone: dashboard summary tiles
   want lower density than directory listings. Argument for
   normalization: three card components for "a camp" is one too many.
