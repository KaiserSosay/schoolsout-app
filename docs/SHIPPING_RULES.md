# Shipping rules

Hard-won lessons. Each rule has the incident that earned it. When a rule
feels like overkill, re-read the incident.

## R1 — Migration-dependent code never ships before the migration

**Rule:** When code references a NEW column, function, table, or enum
value, one of these MUST be true before the code merges to `main`:

- (a) The migration that adds the dependency has already been applied
  to prod, OR
- (b) The code is schema-defensive: wraps the new reference in a
  try/catch, IS NOT NULL guard, or feature flag, so a missing column
  doesn't break the whole query.

**Why:** On 2026-04-25, commit `6ef64e1` added `featured_until` to the
`SELECT` in `/api/camps` and the two `[locale]/camps` pages. The
migration that adds the column (`024_featured_launch_set.sql`) was
committed alongside the code but not pushed to prod. Result: every
camps query returned `column camps.featured_until does not exist`,
the API responded HTTP 500, and the public `/en/camps` page rendered
"0 of 0 camps" for several hours. Recovery was a one-command
`supabase db push --include-all`, but the user-facing damage —
parents loading the directory and seeing zero — was already done.

**How to apply:**

- For additive columns: prefer route (a). Push the migration first
  (`pnpm exec supabase db push`), confirm via the Supabase dashboard
  or `\d camps`, then merge the code. Cost: one extra step,
  serializes prod changes, removes the entire failure mode.
- For columns the agent can't push (no prod creds): commit the
  migration to the repo BUT keep the new column out of `SELECT` lists
  until the human applies it. Or use `select ..., coalesce(new_col, …)
  as new_col` only if the column might exist on the read side.
- For renames / type changes: NEVER ship in one PR. Always two-phase:
  (1) add the new column / coexist; (2) cutover code; (3) drop old
  column. Three migrations, three deploys.

**Pre-merge checklist for migration-touching PRs:**

```
- [ ] Are there NEW columns / tables / enum values referenced in code?
- [ ] If yes: has the migration been pushed to prod (or queued for
      immediate push by someone with creds)?
- [ ] If no human is around to push: is the code schema-defensive?
- [ ] After deploy lands, did /api/camps (or whichever endpoint) get
      a 200 with non-empty data?
```

## R2 — Verify migration assumptions against the actual schema

**Rule:** Before writing a migration that references columns by name,
confirm the column exists in the target table. `grep -hE "create
table.*X|alter table public.X.*add column"` on `supabase/migrations/`
is the source of truth.

**Why:** Same incident, second-order. Migration 027's first version
ran `UPDATE public.camps SET updated_at = now()` to fire the migration-
017 trigger across every row. The `camps` table has `created_at` but
NOT `updated_at` — never has. The migration failed at apply time with
`column "updated_at" of relation "camps" does not exist`. Fix was to
`SET name = name` (any column write fires `BEFORE UPDATE` triggers),
but the failed migration created friction during incident response and
delayed the data-completeness backfill by another deploy cycle.

**How to apply:** When writing an UPDATE / ALTER / DROP that names a
column, paste the actual `CREATE TABLE` from the original migration
into the comment block of the new migration. If the column isn't in
the original `CREATE TABLE` and isn't added by a later `ADD COLUMN`,
it doesn't exist.

## R3 — Visual assets that must look a specific way are static files, not runtime-generated

**Rule:** When a customer specifies "I want it to look like X" for a brand
asset (favicon, app icon, logo, OG image), embed the actual asset as a
static file. Don't generate it at runtime through ImageResponse or font
fallback. Runtime emoji rendering uses whatever font the host system
provides (Twemoji on Vercel Edge), which often doesn't match what the
customer expected.

**Incident:** 2026-04-25. Noah requested an Apple-style backpack favicon.
The icon.tsx route used `<div>🎒</div>` rendered through ImageResponse.
Vercel's Edge runtime fell back to Twemoji's geometric backpack instead of
Apple's rounded one. Fix: downloaded actual Apple PNG, served as static
file under public/icons/.

**Applies to:**
- Favicons + app icons + iOS home-screen icons
- Logos and brand marks
- OG/social-share images that need exact branding
- Any visual element where customer said "make it look like X"

**Doesn't apply to:**
- Programmatically generated content (charts, screenshot OG images, etc.)
- Asset variations where any reasonable rendering is fine

## R4 — User-facing slugs are immutable once shipped

**Rule:** If a record (school, camp, school_request, anything else with a
public URL keyed by slug) has a slug that has been live in production
for any period of time, that slug must NEVER be rewritten by automation.

URLs are promises to users — bookmarks, shared links, search engine
indexes, internal references in copy, conditional code paths keyed on
slug. Every one of those silently breaks the moment a slug shifts under
them.

**Why:** On 2026-04-26 a dry-run of `scripts/import-schools-research.ts`
revealed it was about to UPDATE 9 of the 12 manual-curated schools and
rewrite their slugs to whatever the research JSON specified. The
research had `the-growing-place-school-coral-gables` for TGP; prod had
`the-growing-place`. If the import had been applied, Mom's bookmarked
URL `/en/schools/the-growing-place` would have 404'd, the `schoolSlug
=== 'the-growing-place'` check inside `UnverifiedSchoolCalendarPlaceholder`
would have stopped firing the Noah-personal-note path, and migration
035's TGP closures would have been orphaned from the URL parents reach.
The original "always rewrite slug" comment in the script
(`scripts/import-schools-research.ts` line 466) was correct in
2026-04-23 when prod was empty; it was silently wrong forever after.

**How to apply:**

- **Bulk imports may set slugs on INSERT but must skip slug field on
  UPDATE.** The single best place to enforce this is wherever the
  patch object is built — `buildPatch` should never include `slug`,
  and there should be no `patch.slug = …` assignments downstream of
  it. Make this part of the script's top-line contract comment.
- **Always print a "slug-rewrite skips" count alongside update
  counts.** A dry-run should surface this metric prominently so an
  operator can tell whether the import is touching prod identifiers.
- **The only acceptable slug change is a manual SQL UPDATE
  accompanied by a 301 redirect** from the old URL to the new one
  AND a documented decision in `docs/`. Treat slug rename like a
  schema migration: deliberate, reviewed, and reversible.

**Pre-merge checklist for any import / migration that touches a row
with a `slug` column:**

```
- [ ] Does this code touch slug values on existing rows?
- [ ] If yes: is the change explicit, reviewed, and accompanied by a
      redirect from the old slug?
- [ ] Does the dry-run output count slug-rewrite-skips so operators
      see when the script DECLINED to rewrite (vs silently allowing it)?
```
