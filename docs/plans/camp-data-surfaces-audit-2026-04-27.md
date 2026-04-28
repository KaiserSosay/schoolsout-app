# Camp Data Surfaces Audit — 2026-04-27 (Phase B prep)

This is a per-surface inventory of every place camp data renders in the
app + an admin-only inventory of where camp data is *editable*. It
becomes the spec for "where does each new structured field need to
surface" once Rasheid picks the field-to-surface mapping in the morning.

Generated overnight as Goal 5 of the Phase B prep run. Migrations 054
(structured fields) + 055 (image buckets) commit alongside this doc but
are NOT applied until Rasheid reviews in the morning.

## Read surfaces (where parents/operators see camp data)

### `/{locale}/camps` — public listing (`UnifiedCampCard`, `mode="public"`)

**Source:** `src/components/camps/UnifiedCampCard.tsx`, used by
`src/app/[locale]/camps/page.tsx`.

Currently rendered:
- `name` (card title)
- `ages_min`, `ages_max` (combined fact line)
- `price_tier` (combined fact line)
- `neighborhood` (combined fact line)
- `categories` (first 2 as colored pills; religious flag → 🙏 badge)
- `is_featured` (gold "Featured" badge)
- `verified` (controls whether it's filtered to display at all)
- `completeness` (data-quality badge for incomplete rows)

NOT currently rendered on the card:
- description, hero_url, logo_url, address, phone, email, website_url,
  registration_url, sessions, pricing_tiers, fees, etc.

Phase B candidate adds: `tagline` (replace truncated description hint),
`logo_url` (small thumbnail next to name).

### `/{locale}/camps/{slug}` — public detail (`UnifiedCampDetail`, `mode="public"`)

**Source:** `src/components/camps/UnifiedCampDetail.tsx` (lines ~193-340),
used by `src/app/[locale]/camps/[slug]/page.tsx`.

Currently rendered:
- Hero section: `name`, `neighborhood`, `categories`, `is_featured`,
  optional `image_url` (legacy single-image column)
- Fact grid: `ages_min`, `ages_max`, `price_tier`, `address`,
  registration deadline (legacy field), `last_verified_at`
- Body: `description` (now markdown-rendered as of `e6b44ec`)
- CTAs: `website_url`, `phone`, `registration_url`
- JSON-LD output (server-side, `src/app/[locale]/camps/[slug]/page.tsx`)

NOT currently rendered:
- email, completeness, all 11 new structured fields

Phase B candidate adds: `tagline` (subtitle under name), `hero_url`
(replace `image_url`), `sessions` (renderable as a session-strip card),
`pricing_tiers` (renderable as a price table), `fees` (collapsed
"Required fees" disclosure), `enrollment_window` (countdown if open),
`activities` (chip cluster), `what_to_bring` (small bulleted aside),
`lunch_policy` + `extended_care_policy` (fact grid additions).

### `/{locale}/app/camps` — dashboard listing (`UnifiedCampCard`, `mode="app"`)

**Source:** same `UnifiedCampCard.tsx` (lines ~314-540).

Currently rendered (delta from public mode):
- All public fields, PLUS
- Save heart button (server-side `is_saved` state)
- Distance-from-home overlay (when location set)
- Pending-verification warning (`verified=false` + admin context)

Phase B candidate adds: same as public mode (tagline, logo).

### `/{locale}/app/camps/{slug}` — dashboard detail (`UnifiedCampDetail`, `mode="app"`)

**Source:** same `UnifiedCampDetail.tsx` (lines ~354-580), used by
`src/app/[locale]/app/camps/[slug]/page.tsx`.

Currently rendered (delta from public mode):
- All public fields, PLUS
- `SaveCampButton` (full-width)
- Kid-mode dark theme (text/link colors flip via `darkMode` prop)
- "Pending verification" pill on `verified=false`

Phase B candidate adds: same as public mode + image upload UI gated to
admins behind a separate `/admin/camps/{slug}/edit` route.

### `/{locale}/app` — dashboard wishlist tile (`UnifiedCampCard`, `mode="wishlist-tile"`)

**Source:** `UnifiedCampCard.tsx` (lines ~580-630), used by
`src/components/app/WishlistSection.tsx`.

Currently rendered (compact tile):
- `name` (truncated)
- `ages_min`, `ages_max`
- `price_tier` (icon)
- Subset of `categories`

Phase B candidate adds: `logo_url` (small avatar leading the name).

### `/{locale}/breaks/{id}` — closure detail "things to do" section

**Source:** `src/app/[locale]/breaks/[id]/page.tsx` renders
`<UnifiedCampCard>` for related camps in the closure's age band.

Same fields as `mode="public"`. No new wiring needed beyond what the
shared card already exposes.

### `/{locale}/app/saved` — saved camps page

**Source:** `src/app/[locale]/app/saved/page.tsx` renders
`<UnifiedCampCard mode="app">`.

Same field set as the dashboard listing.

### Open Graph / SEO surfaces

**Source:** `src/app/[locale]/camps/[slug]/page.tsx` builds JSON-LD
`Event` schema + Next `metadata.description`.

Currently uses: `name`, `description` (text-stripped), `address`,
`ages_min`, `ages_max`, `image_url`.

Phase B candidate switches: prefer `tagline` for `metadata.description`
(it's already a single sentence; saves the strip pass), prefer
`hero_url` for `og:image`.

### Admin read surfaces

- `/admin/camps` (`CampsAdminClient.tsx`) — table view with name, slug,
  verified, featured, ages, price. Inline edit form per row exposes
  ~25 fields. **This is where the new edit form scaffold (Goal 4) lives
  next to / replaces the existing inline form.**
- `/admin/camps/[slug]/review` (`CampReviewClient.tsx`) — completeness
  triage, surfaces `EnrichmentPanel` (gap-fill helper).
- Operator dashboard (`OperatorDashboard.tsx`) — operator-self-edit
  surface; subset of admin fields. Out of scope for this audit.

## Editable surfaces (where camp data is written)

### Existing — `CampsAdminClient.tsx` inline form

Edits these fields (per `useState(camp.X)` lines 314-340):
name, slug, description, ages_min, ages_max, price_tier, categories,
website_url, image_url, neighborhood, address, phone, latitude,
longitude, hours_start, hours_end, before_care_offered,
before_care_start, before_care_price_cents, after_care_offered,
after_care_end, after_care_price_cents, closed_on_holidays.

Doesn't expose: email, registration_url, city, verified, is_featured,
is_launch_partner, featured_until, launch_partner_until,
last_verified_at, data_source.

Doesn't expose (because they don't exist yet): all 11 new fields from
migration 054.

### New — `/{locale}/admin/camps/{slug}/edit` (Goal 4 scaffold)

Scaffold renders **every editable column** with placeholder inputs and
NO working submit. Rasheid wires real components in the morning.

## Phase B field-to-surface mapping — Code's recommendations

Recommendations only — Rasheid confirms in the morning before any
component changes. The intent is to give every new field a destination
so the parser proposal (Goal 2) reads as actionable rather than
abstract.

| Field | Listing card | Detail hero | Detail body | Admin edit | OG/SEO |
|---|---|---|---|---|---|
| `tagline` | YES (subtitle, replaces truncated description preview) | YES (under name) | NO | YES | YES (`metadata.description`) |
| `sessions` | NO | YES (count + first-week chip) | YES (full session strip) | YES | NO |
| `pricing_tiers` | NO | YES (low–high range, e.g. "$285–$315/wk") | YES (full table) | YES | NO |
| `activities` | NO | YES (top 3 chips next to categories) | YES (full chip cluster) | YES | NO |
| `fees` | NO | NO | YES (collapsed disclosure) | YES | NO |
| `enrollment_window` | YES (small "Enrollment open" / "Until full" pill) | YES (countdown if `opens_at` future, status pill if open/closed) | NO | YES | NO |
| `what_to_bring` | NO | NO | YES (sidebar checklist) | YES | NO |
| `lunch_policy` | NO | NO | YES (fact-grid row) | YES | NO |
| `extended_care_policy` | NO | NO | YES (fact-grid row) | YES | NO |
| `logo_url` | YES (small leading avatar) | YES (header) | NO | YES (with upload) | NO |
| `hero_url` | NO | YES (banner — replaces legacy `image_url`) | NO | YES (with upload) | YES (`og:image`) |

### Anti-recommendations (what to defer)

- Don't surface `fees` on the listing card or detail hero — fee
  surprises are emotional, but a card with 5 line items reads as
  cluttered. Keep them in a body disclosure.
- Don't surface `what_to_bring` on the card or hero — it only matters
  once a parent has decided on this camp. Sidebar is enough.
- Don't surface `lunch_policy` / `extended_care_policy` separately on
  the card — they fit naturally in the fact grid because they're a
  yes/no signal (provided / from home / both).
- Don't try to render `weekly_themes[]` on the card — it's only
  meaningful in the body where there's vertical room for a session
  strip.

### Decisions explicitly NOT made (Rasheid picks tomorrow)

- **Order of fact-grid rows on the public detail.** The fact grid is
  shared; adding 3 fields shifts the visual hierarchy. Code didn't
  guess — wait for design.
- **Logo aspect ratio + size on cards.** 28x28? 36x36? Round? Square
  with rounded-xl? All reasonable; none are right without seeing the
  rendered grid against real logos.
- **Empty-state copy for fields without data.** Some camps will have
  null `pricing_tiers` after parsing. Show "Pricing not published"?
  Hide the section entirely? Both work; pick whichever surface tone
  matches Rasheid's "Mom can trust this" voice.
- **Admin form layout.** Goal 4 ships a flat-list scaffold; final
  layout is a Rasheid call.

### Phase B parser dependency

The parser proposal in `docs/plans/camp-structured-fields-proposal-2026-04-27.md`
(Goal 2 of this overnight run) emits per-camp values for these fields.
Migration 054 + the parser values together let the morning's
admin-form-wiring work apply real data to real components.
