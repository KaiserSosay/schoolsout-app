# Round-3 calendar import verification — 2026-04-26

This doc covers the calendars that ship in `supabase/migrations/035_anchor_schools_calendars_round_3.sql`. Headline win: **The Growing Place** (Noah's family's own school) finally has verified dates, closing mom-test 2026-04-26's empty-page failure.

Migration is **NOT applied** — Rasheid + Noah review here first, then `pnpm exec supabase db push --include-all`.

Audit trail of how round 3 was scoped, and what was deferred:

```
14 schools requested in the round-3 brief
  ├── 4  exist in prod          ✅ this migration handles them
  │     ├── the-growing-place           (TGP — full closure import)
  │     ├── lehrman-community-day-school (status flip only — closures already in 029)
  │     ├── palmer-trinity-school        (iCal feed URL — cron will fill in)
  │     └── belen-jesuit-preparatory-school (deferred — OCR text quality bad)
  └── 10 NOT in schools table   ⏸ flagged for separate decision below
```

---

## ✅ The Growing Place

**Source:** `docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.pdf` (official 2026-27 family calendar from `https://www.thegrowingplace.school/calendar`)
**Curated to:** `docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.extracted.json`
**Parser:** pdf-sidecar (DevClawd's pdftotext output `.txt` + a hand-resolution pass that assigns the right calendar year — Aug entries are 2026, Jan-May are 2027)
**Closures extracted:** 17
**Confidence:** 17 high / 0 medium / 0 low — every entry has an explicit single date or explicit start-end range in the PDF

### Proposed closures

| Date | Name | Category |
| --- | --- | --- |
| 2026-08-18 | First Day of School | first_day |
| 2026-09-07 | School Closed for Labor Day | holiday |
| 2026-10-09 | Professional Development Day / School Closed | teacher_workday |
| 2026-11-11 | School Closed for Veterans Day | holiday |
| 2026-11-20 | Noon Dismissal (pre-Thanksgiving) | early_release |
| 2026-11-23 → 2026-11-27 | Thanksgiving Break | break |
| 2026-12-18 | Noon Dismissal (pre-Christmas Break) | early_release |
| 2026-12-21 → 2027-01-01 | Christmas Break | break |
| 2027-01-04 | Teacher Work Day / School Closed | teacher_workday |
| 2027-01-18 | School Closed for MLK Day | holiday |
| 2027-02-12 | Professional Development Day (February) | teacher_workday |
| 2027-02-15 | School Closed for Presidents Day | holiday |
| 2027-03-19 | Noon Dismissal (pre-Spring Break) | early_release |
| 2027-03-22 → 2027-03-26 | Spring Break | break |
| 2027-03-29 | School Closed for Easter Monday | religious_holiday |
| 2027-04-16 | Noon Dismissal (mid-April) | early_release |
| 2027-05-27 | Last Day of School / Noon Dismissal | last_day |

### What's deliberately excluded

Per the round-3 brief's anti-bleed list, these PTG events from `the-growing-place-doc1.pdf` and `the-growing-place-doc2.pdf` are **NOT** closures (school is open, kids attend):

- "First Day of School Woo-hoo & Boo-Hoo Breakfast" (PTG event, school open)
- Holiday Scholastic Book Fair
- Spring Carnival & Silent Auction
- Preschool Water Fun Day
- Valentine's Day Preschool Dance
- Final PTG Meeting
- Various "PTG Meeting" rows

Calendar entries that look like closures but aren't:

- Aug. 17 — Welcome Day (a school-attended day, not a closure)
- Aug. 18-21 — "No Early Morning Care / After School Care" (the EMC/ASC services don't run those days; school itself is open)
- Aug. 24 — EMC, Kids Club and ASC Begin (services start, not a school day change)
- Dec. 4 — Parent-Teacher Conferences (school open, not noon-dismissed in the PDF)
- May 7 — Parent-Teacher Conferences (same)
- May 26 — Last Day of Kids Club (school open, ASC ends)

### Pre-existing rejected closures get DELETEd

TGP currently has 8 closures in prod stamped `status='rejected'` — they were imported from a district-fanout pattern guess and never displayed correctly. The migration `DELETE`s them before inserting the new verified set. Without this, the `(school_id, start_date, name)` unique index would block inserts where names overlap (e.g., the rejected "Labor Day" row vs the new "School Closed for Labor Day").

### Heuristic check (Methodist-affiliated)

Expected: Christmas, Easter Monday. ✅ Both present (Christmas Break + Easter Monday).

### Footer for Mom

This fixes the empty-page issue you found at `/en/schools/the-growing-place` on 2026-04-26 morning. The unverified-calendar placeholder you saw (with the personal note from Noah & Dad) goes away once this migration applies and the schools row flips to `calendar_status='verified_current'`. After that, hitting the admin "Calendar verifications" panel and clicking the green button sends a "TGP's calendar is now live" email to the parents who tapped Notify me — Noah and you, almost certainly.

---

## ✅ Lehrman Community Day School

**Source:** Already imported by migration 029 (the round-1 batch). 29 verified closures already in prod.
**Parser:** None this round. Migration 035 only flips `calendar_status` from `needs_research` to `verified_current` so the unverified-calendar placeholder stops triggering on Lehrman parents.
**Closures extracted:** 0 new
**Confidence:** N/A

### Heuristic check (Jewish)

Expected: Rosh Hashanah, Yom Kippur, Sukkot, Passover. The migration 029 import covered these; no new check needed.

### Items to review

- None this round. If Rasheid is uncertain Lehrman's existing closures are still accurate, that's a separate audit (out of scope).

---

## ✅ Palmer Trinity School

**Source:** Live iCal feed at `https://www.palmertrinity.org/media/calendar/ical/Calendar?showhistory=true` (file `docs/plans/calendar-pdfs/palmer-trinity-2025-2026.ics` is a snapshot of that feed for offline reference)
**Parser:** None this migration. The feed has 2,322 events (sports, lunches, classes, etc.). The migration just **adds the URL to `schools.ical_feed_url`**; the existing `/api/cron/sync-ical-feeds` from migration 032 will pull and filter it within 24 hours of apply.
**Closures extracted:** 0 in this migration. Cron will land them after the next 5am UTC tick.
**Confidence:** N/A — handled by the cron's keyword filter.

### Items to review

- After cron runs once, sample Palmer Trinity's `closures` table and confirm sports/lunch events were filtered (they should not have closure-keyword SUMMARYs). Flip `calendar_status` to `verified_current` at that point — out of scope for this migration.

---

## ⏸ Belen Jesuit Preparatory School (deferred)

**Source attempted:** `docs/plans/calendar-pdfs/belen-jesuit-calendar-2025-2026.txt`
**Why it's deferred:** OCR output is grid-stripped — every line says `Apr NO CLASS` (or similar) with no date attached. The calendar grid was photographed in a way that separated each cell from its date column.

**Path forward:** Either re-OCR with a better tool, or use the vision API on `docs/plans/calendar-pdfs/belen-jesuit-calendar-2025-2026.png` (estimated $0.05). Deferred to a focused next session.

### Heuristic check (Catholic)

Expected: Holy Week, Good Friday, Easter Monday, Ash Wednesday. Cannot verify yet.

---

## ⏸ Schools NOT in the prod schools table (10)

The round-3 brief assumed a "316-school directory" but `schools` actually has 12 rows in prod. The following schools the brief listed are NOT in the table:

- Carrollton School of the Sacred Heart
- Christopher Columbus High School
- Miami Country Day School
- The Cushman School
- Hebrew Academy (RASG)
- Our Lady of Lourdes Academy
- Temple Beth Am Day School
- La Salle High
- Immaculata-La Salle High
- St. Brendan High

**Per the round-3 brief's stop-and-ask rule:** "For any school that's missing entirely, STOP and ask Rasheid before inserting it as a new school." Migration 035 does NOT insert any of these. Decisions Rasheid needs to make:

1. **Are these schools we want to track?** If yes, a follow-up migration inserts them with the same defensive `INSERT … ON CONFLICT (slug) DO NOTHING` pattern migration 029 used for Lehrman + Scheck Hillel.

2. **What slugs?** Suggested:
   - `carrollton-school-of-the-sacred-heart`
   - `christopher-columbus-high-school`
   - `miami-country-day-school`
   - `the-cushman-school`
   - `hebrew-academy-rasg`
   - `our-lady-of-lourdes-academy`
   - `temple-beth-am-day-school`
   - `la-salle-high-school`
   - `immaculata-la-salle-high-school`
   - `st-brendan-high-school`

3. **Source URLs + addresses?** Some are available in `data/schools/miami-schools-research-2026-04-24.schools.json`; others would need a quick lookup pass.

If we say yes to all 10 + Belen, the next session ships:
- A school-insertion migration (036)
- Calendar parsing for each (vision API on the PNGs we already have, ~$0.55 total — bumps just past the $0.50 brief cap, so flag)
- A second calendar-import migration (037) tied to the new school IDs

---

## Apply order once approved

```bash
cd ~/Projects/schoolsout-app
pnpm exec supabase db push --include-all   # applies 035

# Then sample TGP closures to confirm:
pnpm dlx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
db.from('closures').select('name, start_date, end_date, status').eq('school_id', /* TGP id */).then(r => console.log(r.data));
"

# Visit /en/schools/the-growing-place in incognito
# Visit /en/admin?tab=calendar-reviews → see "Calendar verifications" panel with TGP row + N pending parents
# Click the "Email N parents now" button when ready
```

Then visit `/en/schools/the-growing-place` in incognito as the acceptance test. The unverified-calendar placeholder should be gone; you should see the 17-row closure list with a verified badge.
