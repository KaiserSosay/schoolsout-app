# The Growing Place School — Calendar Research (2026-04-25)

**Item:** Phase 3.0 / Group 2 / Item 2.5
**Status:** SUPERSEDED — Noah running fresh Cowork research session
            2026-04-25. This doc represents the agent's best-effort
            initial proposal. Wait for Cowork's verified output before
            applying any closure rows to prod.

See `docs/cowork-2026-04-25-schools-output.json` once that lands.

---

**Original status:** Findings only. NO DB writes. Awaiting Noah's review
            before migration 023 (or whatever number is next).

## TL;DR

- TGP publishes its calendars at `https://www.thegrowingplace.school/campus-life`
  as Wix-hosted PDFs (one per academic year).
- Direct PDF for 2025-26:
  `https://www.thegrowingplace.school/_files/ugd/2672a1_b2e06a6dc3004d368eb45d6c0e42eeda.pdf`
- Direct PDF for 2026-27:
  `https://www.thegrowingplace.school/_files/ugd/2672a1_04b05300856b43798f24fa3f1a313a2d.pdf`
- The May 1, 2026 Parent-Teacher Conference (the one Noah remembered from
  v1 of School's Out!) is real — it's on the official TGP calendar as
  "Parent Teacher Conferences (No Classes)".
- There's also a **December 5, 2025 PTC** that should be on the calendar
  but probably isn't in prod yet.
- 2026-27 calendar PDF is downloaded too — out of scope for this pass but
  flagged for a follow-up so we cover next school year.

## Sources

- Page that lists both PDFs:
  https://www.thegrowingplace.school/campus-life
- 2025-26 PDF parsed via `pdftotext` (poppler-utils 25.x).
- All dates below carry `source_url` =
  `https://www.thegrowingplace.school/_files/ugd/2672a1_b2e06a6dc3004d368eb45d6c0e42eeda.pdf`,
  `source_type='school_pdf'`, `confidence='high'`.

## Proposed closures (school-wide closed days, 2025-26)

These are the days TGP is **closed for students**. Half-days / noon
dismissals / Kids-Club-only changes are listed separately below.

| # | Name                                       | start_date | end_date   | day_count | category          | notes                                                  |
|---|--------------------------------------------|------------|------------|-----------|-------------------|--------------------------------------------------------|
| 1 | Labor Day                                  | 2025-09-01 | 2025-09-01 | 1         | federal_holiday   | School Closed for Labor Day                            |
| 2 | Professional Development Day               | 2025-10-03 | 2025-10-03 | 1         | teacher_workday   | School Closed for Professional Dev. Day                |
| 3 | Veterans Day                               | 2025-11-11 | 2025-11-11 | 1         | federal_holiday   | School Closed for Veterans Day                         |
| 4 | Thanksgiving Break                         | 2025-11-24 | 2025-11-28 | 5         | school_break      | Full week                                              |
| 5 | Parent-Teacher Conferences (No Classes)    | 2025-12-05 | 2025-12-05 | 1         | parent_teacher    | Calendar legend matches the May 1 PTC                  |
| 6 | Christmas Break                            | 2025-12-22 | 2026-01-02 | 12        | school_break      | "December 22 - January 2 Christmas Break"              |
| 7 | Professional Development Day               | 2026-01-05 | 2026-01-05 | 1         | teacher_workday   | School Closed - Professional Development Day           |
| 8 | Martin Luther King Jr. Day                 | 2026-01-19 | 2026-01-19 | 1         | federal_holiday   | School Closed for MLK Day                              |
| 9 | Presidents' Day                            | 2026-02-16 | 2026-02-16 | 1         | federal_holiday   | School Closed for Presidents' Day                      |
| 10 | Spring Break                              | 2026-03-23 | 2026-03-27 | 5         | school_break      | Full week                                              |
| 11 | Good Friday                               | 2026-04-03 | 2026-04-03 | 1         | religious_holiday | School Closed for Good Friday                          |
| 12 | Easter Monday                             | 2026-04-06 | 2026-04-06 | 1         | religious_holiday | School Closed for Easter Monday                        |
| 13 | Parent-Teacher Conferences (No Classes)   | 2026-05-01 | 2026-05-01 | 1         | parent_teacher    | **The one Noah remembered.** Listed under MAY 2026.    |
| 14 | Memorial Day                              | 2026-05-25 | 2026-05-25 | 1         | federal_holiday   | School Closed for Memorial Day                         |
| 15 | Last Day of School (Noon Dismissal)       | 2026-05-28 | 2026-05-28 | 1         | last_day          | Half day, but logged as the last student-facing day    |

**14 full closure days** across the school year, plus 1 last-day half day.

## Noon dismissals (NOT full closures — kept here for reference)

These are early-release days. Not currently a `closures` row, but if/when
we add `is_early_release=true` to the schema (we already have the column
per migration 022), they'd land here:

- 2025-10-31 — Fall Fantasy Event, noon dismissal
- 2025-11-21 — Noon Dismissal / Teacher Work Afternoon
- 2025-12-19 — Noon Dismissal (last-day-before-Christmas-break)
- 2026-02-13 — Noon Dismissal / Teacher Work Afternoon
- 2026-03-20 — Noon Dismissal (Friday before Spring Break)
- 2026-04-02 — Noon Dismissal / Teacher Work Afternoon
- 2026-05-22 — Noon Dismissal / Teacher Work Afternoon
- 2026-05-28 — Noon Dismissal (last day, already in main table)

## Extended-care-only changes (definitely NOT closures)

- 2025-08-19 to 2025-08-22 — No Early Morning Care (EMC) or After School
  Care (ASC). School is OPEN.
- 2025-08-25 — EMC and ASC begin.
- 2025-12-18 — Last Day of Kids Club (before Christmas break)
- 2026-05-27 — Last Day of Kids Club

## Verification I couldn't do from this session

- **Compare against current prod DB.** Without `.env.local` populated,
  I can't run a query against the hosted Supabase. Suggested check:
  ```sql
  select start_date, end_date, name, status
  from public.closures
  where school_id = (select id from public.schools where slug = 'the-growing-place')
  order by start_date;
  ```
  Anything in the proposed table above that's NOT in the result is a
  missing row to insert. Anything in the result that's NOT in the
  proposed table is something to flag (could be a v1 closure that
  needs review).

## Suggested next step

Once the diff against prod is in hand, add migration `023_tgp_closures.sql`
that idempotently upserts the 15 rows above. Each row carries the
source_url + confidence so a future audit can re-validate. **No row-level
UPDATEs against existing closures** — let the dedupe key (school_id,
start_date, name) handle re-insertion safely (per the project's
"additive-only" ground rule).

If 2026-27 should also land in this pass: the second PDF
(`2672a1_04b05300856b43798f24fa3f1a313a2d.pdf`) is downloaded too — give
me the word and I'll parse it the same way.
