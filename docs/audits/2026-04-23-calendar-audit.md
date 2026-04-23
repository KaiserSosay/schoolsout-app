# School Calendar Audit — 2026-04-23

Triggered by Noah (product owner, age 8) reporting that The Growing Place
calendar on the live site is wrong. This doc captures the resolution.

## Finding: The Growing Place (Coral Gables)

**Identity**
- Legal: The Growing Place School
- Address: 536 Coral Way, Coral Gables, FL 33134
- Phone: (305) 446-0846
- Website: https://www.thegrowingplace.school
- Type: Methodist-affiliated preschool + elementary
- Row id: `00000000-0000-0000-0000-000000000001`

**Action taken (migration 012)**
- Populated `website`, `phone`, `address` fields.
- Flipped `calendar_status` to `needs_research`.
- Marked all previously "verified" closures as `rejected` with
  `notes='Possibly pulled from the wrong TGP (Clearwater preschool)...'`.
  Rows preserved for audit trail.

**Unresolved — requires human action**
- [ ] Email admissions@thegrowingplace.school and request the
      2025-2026 + 2026-2027 calendar PDFs.
- [ ] Once received, upload via the new admin calendar-review flow
      (Goal 3.5) and verify row-by-row.

## Finding: Miami-Dade County Public Schools

**Identity**
- Row id: `00000000-0000-0000-0000-000000000003`
- Source: https://api.dadeschools.net/WMSFiles/392/calendars/

**Action taken (migration 012)**
- Seeded all 13 holidays for 2025-2026 with `status='verified'`,
  `source='official_pdf'`, `source_url=<pdf-URL>`.
- Seeded 8 known holidays for 2026-2027 (board-approved 2025-12-09);
  deliberately omitted `Last Day of School` since the exact June 2027
  date is not yet published in the approved calendar PDF we have
  access to.
- Flipped `calendar_status` to `verified_multi_year` (two full years
  covered).

**Spot-check dates**

| Holiday | 2025-2026 | 2026-2027 |
| --- | --- | --- |
| Labor Day | Sep 1, 2025 | Sep 7, 2026 |
| Thanksgiving | Nov 24-28, 2025 | Nov 23-27, 2026 |
| Winter Recess | Dec 22, 2025 – Jan 2, 2026 | Dec 21, 2026 – Jan 1, 2027 |
| MLK Day | Jan 19, 2026 | Jan 18, 2027 |
| Spring Recess | Mar 23-27, 2026 | Mar 22-26, 2027 |
| Memorial Day | May 25, 2026 | May 31, 2027 |

## Other 8 schools

Still `calendar_status='needs_research'` with zero closures. No action
required this pass — rather NOT show closures than show wrong ones.
Admin PDF-upload tool is the path forward once PDFs land.

## Follow-up gate

Don't claim "every Miami school, covered" in marketing until this list
has at least: TGP (Coral Gables, pending), Gulliver, Ransom, Palmer
Trinity, and CGP Academy all at `verified_current` or better.
