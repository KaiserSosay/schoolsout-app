# Anchor School Calendar Import — Verification Plan

Generated **2026-04-25** by
`scripts/parse-school-calendars.ts` from sources in
`docs/plans/calendar-pdfs/`.

> **Action:** Noah reviews this doc. When approved, dad applies
> migration `029_anchor_schools_calendars.sql` via
> `pnpm exec supabase db push`. **Do not apply yet.**

## Summary

| School | 2025-26 | 2026-27 | Source | Notes |
|---|---:|---:|---|---|
| BASIS Independent Brickell | — | — | — | ⛔ **Unparseable — see school section below.** |
| Gulliver Preparatory School | 23 | 23 | pdf-sidecar, pdf-regex | Both years parsed |
| Lehrman Community Day School | 29 | — | png-sidecar | 25-26 only; 26-27 not yet published |
| Ransom Everglades School | 22 | — | pdf-sidecar | 25-26 only; 26-27 not yet published |
| Scheck Hillel Community School | 23 | 24 | pdf-sidecar, pdf-sidecar | Both years parsed |
| The Growing Place School | — | — | — | ⛔ **Unparseable — see school section below.** |
| Westminster Christian School | 20 | 20 | pdf-sidecar, pdf-sidecar | Both years parsed |

## BASIS Independent Brickell

Slug: `basis-independent-brickell`

### 2025-2026

- `basis-independent-brickell-2025-2026.pdf` (pdf-sidecar) → 0 closures — alternate parse, not used
  > PARSER FAILURE: basis-independent-brickell-2025-2026.pdf is actually BASIS INDEPENDENT BROOKLYN's calendar (header reads 'BASIS INDEPENDENT BROOKLYN' with NY addresses: 405 Gold Street and 556 Columbia Street, Brooklyn, NY). DevClawd downloaded the wrong PDF from basisindependent.com. The two campuses likely share a similar academic framework but their precise dates can differ. Importing Brooklyn's dates for Brickell would seed wrong data on /schools/basis-independent-brickell. Do NOT auto-import. Re-run DevClawd against https://basisindependent.com/brickell looking for a Brickell-specific PDF, or call/email the Brickell campus.

**No closures will be imported for this school year.** Calendar status stays `needs_research`.

## Gulliver Preparatory School

Slug: `gulliver-preparatory-school`

### 2025-2026

- `gulliver-prep-2025-2026.ics` (ics) → 0 closures — alternate parse, not used
- `gulliver-prep-2025-2026.pdf` (pdf-sidecar) → 23 closures ✅ **selected**
  Source URL: https://www.gulliverprep.org/wp-content/uploads/academic_calendar.pdf
  > Hand-extracted from gulliver-prep-2025-2026.pdf via multimodal review (the multi-column grid layout defeats the regex parser — month annotations bleed across columns). Source PDF: https://www.gulliverprep.org/wp-content/uploads/academic_calendar.pdf as of 03.19.25.

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2025-08-10 – 2025-08-11 | Grade 9 Orientation | orientation | N | N | high |
| 2025-08-10 – 2025-08-12 | Middle School & Upper School Orientation Days | orientation | N | N | high |
| 2025-08-13 | Primary & Lower School Meet & Greet | orientation | N | N | high |
| 2025-08-14 | First Day of School | first_day | N | N | high |
| 2025-09-01 | Labor Day Holiday | federal_holiday | Y | N | high |
| 2025-09-23 | Rosh Hashanah Holiday | religious_holiday | Y | N | high |
| 2025-10-02 | Yom Kippur Holiday | religious_holiday | Y | N | high |
| 2025-10-17 | Teacher Workday – No Classes (PS/LS Parent Conferences) | teacher_workday | Y | N | high |
| 2025-11-03 | Teacher Professional Development Day – No Classes | teacher_workday | Y | N | high |
| 2025-11-24 – 2025-11-28 | Thanksgiving Recess | break | Y | N | high |
| 2025-12-19 | Early Dismissal (Half day) | other | N | Y | high |
| 2025-12-22 – 2026-01-02 | Winter Recess | break | Y | N | high |
| 2026-01-05 | Classes Resume | other | N | N | high |
| 2026-01-19 | Martin Luther King, Jr. Holiday | federal_holiday | Y | N | high |
| 2026-02-16 – 2026-02-20 | Presidents' Day Recess | federal_holiday | Y | N | high |
| 2026-03-18 | No Classes for Primary & Lower School Students (PS/LS Parent Conferences) | parent_conference | Y | N | high |
| 2026-03-30 – 2026-04-03 | Spring Recess | break | Y | N | high |
| 2026-04-06 | Teacher Professional Development Day – No Classes | teacher_workday | Y | N | high |
| 2026-05-21 | Class of 2026 Graduation (tentative) | graduation | N | N | medium |
| 2026-05-21 | Last Day of School, Gr PK-SK – Early Dismissal | last_day | N | Y | high |
| 2026-05-22 | Last Day of School, Gr 1-11 – Early Dismissal | last_day | N | Y | high |
| 2026-05-25 | Memorial Day Holiday | federal_holiday | Y | N | high |
| 2026-05-26 – 2026-05-29 | Teacher Workday – No Classes | teacher_workday | Y | N | high |

**Items Noah should double-check:**
- `2026-05-21` "Class of 2026 Graduation (tentative)" — confidence: medium

### 2026-2027

- `gulliver-prep-2026-2027.pdf` (pdf-regex) → 23 closures ✅ **selected**
  Source URL: https://www.gulliverprep.org/wp-content/uploads/academic_calendar.pdf

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2026-07-03 | Independence Day Observed-School Closed | federal_holiday | Y | N | high |
| 2026-08-06 – 2026-08-07 | New Staff Orientation | orientation | Y | N | high |
| 2026-08-17 – 2026-08-18 | MS & US Orientation Days | orientation | Y | N | high |
| 2026-08-20 | First Day of Classes | first_day | Y | N | high |
| 2026-09-07 | Labor Day-No School | federal_holiday | Y | N | high |
| 2026-09-12 | Rosh Hashanah | religious_holiday | Y | N | high |
| 2026-09-21 | Yom Kippur-No School | religious_holiday | Y | N | high |
| 2026-10-23 | Faculty Workday; PS/LS Parent Conferences | teacher_workday | Y | N | high |
| 2026-11-02 | Schoolwide PD Day-No School for Students | other | Y | N | high |
| 2026-11-23 – 2026-11-27 | Thanksgiving Break-School Closed | break | Y | N | high |
| 2026-12-18 | Early Dismissal | other | N | Y | high |
| 2026-12-21 – 2027-01-01 | Winter Break- School Closed | break | Y | N | high |
| 2027-01-18 | Martin Luther King Day-School Closed | federal_holiday | Y | N | high |
| 2027-03-22 – 2027-03-26 | Spring Break-School Closed | break | Y | N | high |
| 2027-03-28 | Easter Sunday | religious_holiday | Y | N | high |
| 2027-03-29 | Faculty Workday-No School for Students | teacher_workday | Y | N | high |
| 2027-04-07 | PS/LS Parent Conferences-No School for Students | parent_conference | Y | N | high |
| 2027-04-21 – 2027-04-29 | Passover | religious_holiday | Y | N | high |
| 2027-04-30 | Schoolwide PD Day-No School for Students | other | Y | N | high |
| 2027-05-20 | Class of 2027 Graduation | graduation | Y | N | high |
| 2027-05-28 | Last Day of School/End of Quarter Four (43 days) | last_day | Y | N | high |
| 2027-05-31 | Memorial Day-School Closed | federal_holiday | Y | N | high |
| 2027-06-18 | Juneteenth Observed-School Closed | federal_holiday | Y | N | high |

## Lehrman Community Day School

Slug: `lehrman-community-day-school`

### 2025-2026

- `lehrman-2025-2026.png` (png-sidecar) → 29 closures ✅ **selected**
  Source URL: https://www.lehrmanschool.org/parents/2025-26-calendar.cfm
  > Extracted from lehrman-2025-2026.png by Claude (multimodal). Image is legible; major closures (Labor Day, Thanksgiving 11/26-28, Winter Break, MLK, Memorial Day) match known federal/Jewish dates which raises confidence. PTA / school events / testing weeks excluded — they are not closures. Filed under medium confidence per the vision-can-hallucinate rule unless the date is independently verifiable.

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2025-08-18 | Orientation | orientation | N | N | medium |
| 2025-08-19 | First Day of School | first_day | N | N | high |
| 2025-09-01 | Labor Day | federal_holiday | Y | N | high |
| 2025-09-12 | 1 PM Dismissal | other | N | Y | medium |
| 2025-09-22 | 1 PM Dismissal | other | N | Y | medium |
| 2025-09-23 – 2025-09-24 | Rosh Hashanah | religious_holiday | Y | N | high |
| 2025-10-01 – 2025-10-02 | Yom Kippur | religious_holiday | Y | N | high |
| 2025-10-06 | Early Dismissal | other | N | Y | medium |
| 2025-10-07 – 2025-10-08 | Sukkot | religious_holiday | Y | N | high |
| 2025-10-13 – 2025-10-15 | Simchat Torah / Shemini Atzeret | religious_holiday | Y | N | medium |
| 2025-11-26 – 2025-11-28 | Thanksgiving Break | break | Y | N | high |
| 2025-12-08 | Parent/Teacher Conferences | parent_conference | Y | N | medium |
| 2025-12-14 | 1 PM Dismissal | other | N | Y | medium |
| 2025-12-24 – 2026-01-06 | Winter Break | break | Y | N | high |
| 2026-01-07 | School Resumes | other | N | N | medium |
| 2026-01-12 – 2026-01-14 | 1 PM Dismissal | other | N | Y | medium |
| 2026-01-19 | Martin Luther King Jr. Day | federal_holiday | Y | N | high |
| 2026-02-16 – 2026-02-17 | February Break | break | Y | N | high |
| 2026-03-03 | Early Dismissal | other | N | Y | medium |
| 2026-03-30 | Professional Development Day | teacher_workday | Y | N | high |
| 2026-03-31 – 2026-04-10 | Passover Break | religious_holiday | Y | N | high |
| 2026-04-13 | School Resumes | other | N | N | medium |
| 2026-04-14 | Yom HaShoah | religious_holiday | N | N | medium |
| 2026-04-21 | Yom HaZikaron | religious_holiday | N | N | medium |
| 2026-04-22 | Yom Ha'Atzmaut | religious_holiday | N | N | medium |
| 2026-05-21 | 1 PM Dismissal | other | N | Y | medium |
| 2026-05-22 | Classes End | last_day | N | N | medium |
| 2026-05-25 | Memorial Day | federal_holiday | Y | N | high |
| 2026-06-09 | Last Day of School (Early Dismissal) | last_day | N | Y | medium |

**Items Noah should double-check:**
- `2025-08-18` "Orientation" — confidence: medium
- `2025-09-12` "1 PM Dismissal" — confidence: medium
- `2025-09-22` "1 PM Dismissal" — confidence: medium
- `2025-10-06` "Early Dismissal" — confidence: medium
- `2025-10-13` "Simchat Torah / Shemini Atzeret" — confidence: medium
- `2025-12-08` "Parent/Teacher Conferences" — confidence: medium
- `2025-12-14` "1 PM Dismissal" — confidence: medium
- `2026-01-07` "School Resumes" — confidence: medium
- `2026-01-12` "1 PM Dismissal" — confidence: medium
- `2026-03-03` "Early Dismissal" — confidence: medium
- `2026-04-13` "School Resumes" — confidence: medium
- `2026-04-14` "Yom HaShoah" — confidence: medium
- `2026-04-21` "Yom HaZikaron" — confidence: medium
- `2026-04-22` "Yom Ha'Atzmaut" — confidence: medium
- `2026-05-21` "1 PM Dismissal" — confidence: medium
- `2026-05-22` "Classes End" — confidence: medium
- `2026-06-09` "Last Day of School (Early Dismissal)" — confidence: medium

## Ransom Everglades School

Slug: `ransom-everglades-school`

### 2025-2026

- `ransom-everglades-2025-2026.ics` (ics) → 10 closures — alternate parse, not used
- `ransom-everglades-2025-2026.pdf` (pdf-sidecar) → 22 closures ✅ **selected**
  Source URL: https://www.ransomeverglades.org/news-and-events/calendar
  > Hand-extracted from ransom-everglades-2025-2026.pdf via multimodal review (regex parser misattributed dates across the multi-column layout). Date ranges (Thanksgiving Nov 24-28, Holiday Break Dec 22-Jan 2, Winter Break Feb 13 + 16-20, Spring Break Mar 30-Apr 3) confirmed by yellow 'No Classes' highlighting in the source PDF. Source: https://www.ransomeverglades.org/news-and-events/calendar (PDF revised 12/16/24).

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2025-08-06 – 2025-08-12 | Faculty Orientation | teacher_workday | Y | N | medium |
| 2025-08-19 | Orientation – 6th, 9th, and new students | orientation | N | N | high |
| 2025-08-20 | First Day of School for Students | first_day | N | N | high |
| 2025-09-01 | Labor Day – School Closed | federal_holiday | Y | N | high |
| 2025-09-23 | Rosh Hashanah – School Closed | religious_holiday | Y | N | high |
| 2025-10-02 | Yom Kippur – School Closed | religious_holiday | Y | N | high |
| 2025-10-17 | Parent Conferences – No Classes | parent_conference | Y | N | high |
| 2025-10-20 | Parent Conferences – No Classes | parent_conference | Y | N | high |
| 2025-11-24 – 2025-11-28 | Thanksgiving Break | break | Y | N | high |
| 2025-12-19 | Last Day of 1st Semester | other | N | N | high |
| 2025-12-22 – 2026-01-02 | Holiday Break | break | Y | N | high |
| 2026-01-05 | Classes Resume – First Day of 2nd Semester | other | N | N | high |
| 2026-01-19 | Martin Luther King Jr. National Day of Service – No Classes | federal_holiday | Y | N | high |
| 2026-02-13 – 2026-02-20 | Winter Break (Presidents' Week) | break | Y | N | high |
| 2026-03-30 – 2026-04-03 | Spring Break | break | Y | N | high |
| 2026-04-02 | Passover | religious_holiday | Y | N | high |
| 2026-04-03 | Good Friday | religious_holiday | Y | N | high |
| 2026-05-22 | Commencement | graduation | N | N | high |
| 2026-05-25 | Memorial Day – School Closed | federal_holiday | Y | N | high |
| 2026-06-02 | Last Day of 2nd Semester | last_day | N | N | high |
| 2026-06-19 | Juneteenth – School Closed | federal_holiday | Y | N | high |
| 2026-07-03 | Independence Day Observed – School Closed | federal_holiday | Y | N | high |

**Items Noah should double-check:**
- `2025-08-06` "Faculty Orientation" — confidence: medium

## Scheck Hillel Community School

Slug: `scheck-hillel-community-school`

### 2025-2026

- `scheck-hillel-2025-2026.pdf` (pdf-sidecar) → 23 closures ✅ **selected**
  Source URL: https://www.ehillel.org/quicklinks/calendar
  > Hand-extracted from scheck-hillel-2025-2026.pdf via multimodal review. The 3-month-per-row grid + side annotations confused the regex parser into wrong months. Source: https://www.ehillel.org/quicklinks/calendar (PDF as of March 26, 2026). Yom HaShoah/HaZikaron/Ha'Atzmaut and Lag BaOmer flagged as observances (school in session) — only listed where Scheck explicitly closes campus. Chanukah Dec 14-22 is highlighted as the Jewish observance but does not close campus until Winter Break starts Dec 22.

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2025-08-14 – 2025-08-15 | Tentative Orientation Days | orientation | N | N | medium |
| 2025-08-18 | First Day of School | first_day | N | N | high |
| 2025-09-01 | Campus Closed - Labor Day | federal_holiday | Y | N | high |
| 2025-09-22 – 2025-09-24 | Campus Closed - Rosh Hashanah | religious_holiday | Y | N | high |
| 2025-10-01 – 2025-10-03 | Campus Closed - Yom Kippur | religious_holiday | Y | N | high |
| 2025-10-06 – 2025-10-08 | Campus Closed - Sukkot | religious_holiday | Y | N | high |
| 2025-10-13 – 2025-10-15 | Campus Closed - Shemini Atzeret & Simchat Torah | religious_holiday | Y | N | high |
| 2025-11-24 – 2025-11-25 | No Classes - Parent/Teacher Conferences | parent_conference | Y | N | high |
| 2025-11-26 – 2025-11-28 | Campus Closed - Thanksgiving Break | break | Y | N | high |
| 2025-12-22 – 2026-01-02 | Campus Closed - Winter Break | break | Y | N | high |
| 2026-01-05 | No Classes - Professional Development | teacher_workday | Y | N | high |
| 2026-01-19 | Campus Closed - Martin Luther King, Jr. Day | federal_holiday | Y | N | high |
| 2026-02-16 | Campus Closed - Presidents' Day | federal_holiday | Y | N | high |
| 2026-03-02 | 2 PM Dismissal - Ta'anit Esther | religious_holiday | N | Y | high |
| 2026-03-03 | 12 PM Dismissal - Purim | religious_holiday | N | Y | high |
| 2026-03-16 | No Classes - Parent/Teacher Conferences | parent_conference | Y | N | high |
| 2026-03-30 – 2026-04-10 | Campus Closed - Passover Break | religious_holiday | Y | N | high |
| 2026-05-20 | 2 PM Dismissal: Commencement | graduation | N | Y | high |
| 2026-05-21 | 12 PM Dismissal: Erev Shavuot | religious_holiday | N | Y | high |
| 2026-05-22 | Campus Closed - Shavuot | religious_holiday | Y | N | high |
| 2026-05-25 | Campus Closed - Memorial Day | federal_holiday | Y | N | high |
| 2026-06-11 | 12 PM Dismissal - Last Day of School | last_day | N | Y | high |
| 2026-06-19 | Campus Closed - Juneteenth | federal_holiday | Y | N | high |

**Items Noah should double-check:**
- `2025-08-14` "Tentative Orientation Days" — confidence: medium

### 2026-2027

- `scheck-hillel-2026-2027.pdf` (pdf-sidecar) → 24 closures ✅ **selected**
  Source URL: https://www.ehillel.org/quicklinks/calendar
  > Hand-extracted from scheck-hillel-2026-2027.pdf via multimodal review. Source: https://www.ehillel.org/quicklinks/calendar (PDF as of January 14, 2026 — calendar may still change). Sukkot listed only on 9/25 (Erev) and 9/28 — Scheck appears to be in session 9/26-27 between Erev and main day; included only the explicit closed days. Yom HaShoah/HaZikaron/Ha'Atzmaut and Lag BaOmer are observances (school in session) — omitted.

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2026-08-19 | First Day of School | first_day | N | N | high |
| 2026-09-07 | Campus Closed - Labor Day | federal_holiday | Y | N | high |
| 2026-09-11 | Campus Closed - Erev Rosh Hashanah | religious_holiday | Y | N | high |
| 2026-09-21 | Campus Closed - Yom Kippur | religious_holiday | Y | N | high |
| 2026-09-22 | 10 AM Late Start | other | N | N | high |
| 2026-09-25 | Campus Closed - Erev Sukkot | religious_holiday | Y | N | high |
| 2026-09-28 | Campus Closed - Sukkot | religious_holiday | Y | N | high |
| 2026-10-02 | Campus Closed - Erev Shemini Atzeret & Simchat Torah | religious_holiday | Y | N | high |
| 2026-11-23 – 2026-11-24 | No Classes - Parent/Teacher Conferences | parent_conference | Y | N | high |
| 2026-11-25 – 2026-11-27 | Campus Closed - Thanksgiving Break | break | Y | N | high |
| 2026-12-21 – 2027-01-01 | Campus Closed - Winter Break | break | Y | N | high |
| 2027-01-04 | No Classes - Professional Development | teacher_workday | Y | N | high |
| 2027-01-18 | Campus Closed - Martin Luther King, Jr. Day | federal_holiday | Y | N | high |
| 2027-02-15 | Campus Closed - Presidents' Day | federal_holiday | Y | N | high |
| 2027-03-11 | No Classes - Parent/Teacher Conferences | parent_conference | Y | N | high |
| 2027-03-22 | 12 PM Dismissal - Ta'anit Esther | religious_holiday | N | Y | high |
| 2027-03-23 | 12 PM Dismissal - Purim | religious_holiday | N | Y | high |
| 2027-04-19 – 2027-04-30 | Campus Closed - Passover Break | religious_holiday | Y | N | high |
| 2027-05-23 | Tentative: Commencement | graduation | N | N | medium |
| 2027-05-26 | Tentative: Commencement - 2 PM Dismissal | graduation | N | Y | medium |
| 2027-05-31 | Campus Closed - Memorial Day | federal_holiday | Y | N | high |
| 2027-06-03 | 12 PM Dismissal - Last Day of School | last_day | N | Y | high |
| 2027-06-10 – 2027-06-12 | Campus Closed - Erev Shavuot & Shavuot | religious_holiday | Y | N | high |
| 2027-06-18 | Campus Closed - Juneteenth | federal_holiday | Y | N | high |

**Items Noah should double-check:**
- `2027-05-23` "Tentative: Commencement" — confidence: medium
- `2027-05-26` "Tentative: Commencement - 2 PM Dismissal" — confidence: medium

## The Growing Place School

Slug: `the-growing-place-school-coral-gables`

### 2025-2026

- `the-growing-place-2025-2026.png` (png-sidecar) → 0 closures — alternate parse, not used
  > PARSER FAILURE: the-growing-place-2025-2026.png is a 404 'Page Not Found' screenshot from thegrowingplace.school, not a calendar. DevClawd captured the wrong URL. No closures extractable. Growing Place needs a fresh PDF (per _BLOCKED.txt the fallback was to call (305) 446-0846 to request one). Calendar status stays at needs_research.

**No closures will be imported for this school year.** Calendar status stays `needs_research`.

## Westminster Christian School

Slug: `westminster-christian-school`

### 2025-2026

- `westminster-christian-2025-2026.pdf` (pdf-sidecar) → 20 closures ✅ **selected**
  Source URL: https://www.wcsmiami.org/news-and-events/key-dates-2025-26
  > Hand-extracted from westminster-christian-2025-2026.pdf via multimodal review. Source: https://www.wcsmiami.org/news-and-events/key-dates-2025-26. Christmas Break Dec 22-Jan 5 merged from the two listed ranges (Dec 22-31 + Jan 1-5). 'Last Day of School' is staggered by grade — 12th grade May 1, 8th grade May 18, 5th grade May 20, all-school last day May 21 with early dismissal.

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2025-08-08 | Preschool Preview Day | orientation | N | N | high |
| 2025-08-11 | First Day of School (ES/MS) – 11:30 a.m. dismissal | first_day | N | Y | high |
| 2025-08-18 | First Day on Campus (HS) | first_day | N | N | high |
| 2025-09-01 | No School: Labor Day | federal_holiday | Y | N | high |
| 2025-10-10 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2025-11-21 | Early Dismissal: 11:30 a.m. | other | N | Y | high |
| 2025-11-24 – 2025-11-28 | No School: Thanksgiving Break | break | Y | N | high |
| 2025-12-19 | Early Dismissal: 11:30 a.m. | other | N | Y | high |
| 2025-12-22 – 2026-01-05 | No School: Christmas Break | break | Y | N | high |
| 2026-01-19 | No School: Martin Luther King, Jr. Day | federal_holiday | Y | N | high |
| 2026-02-13 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2026-02-16 – 2026-02-17 | No School: Winter Break | break | Y | N | high |
| 2026-03-13 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2026-03-23 – 2026-03-27 | No School: Spring Break | break | Y | N | high |
| 2026-04-03 – 2026-04-06 | No School: Easter Break | religious_holiday | Y | N | high |
| 2026-05-01 | 12th Grade: Last Day of School | last_day | N | N | high |
| 2026-05-18 | 8th Grade: Last Day of School | last_day | N | N | high |
| 2026-05-20 | 5th Grade: Last Day of School | last_day | N | N | high |
| 2026-05-21 | Last Day of School: 11:30 a.m. Dismissal | last_day | N | Y | high |
| 2026-05-22 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |

**Items Noah should double-check:**
- `2026-05-01` "12th Grade: Last Day of School" — confidence: high
- `2026-05-18` "8th Grade: Last Day of School" — confidence: high
- `2026-05-20` "5th Grade: Last Day of School" — confidence: high

### 2026-2027

- `westminster-christian-2026-2027.pdf` (pdf-sidecar) → 20 closures ✅ **selected**
  Source URL: https://www.wcsmiami.org/news-and-events/key-dates-2025-26
  > Hand-extracted from westminster-christian-2026-2027.pdf via multimodal review. Source: https://www.wcsmiami.org/news-and-events/key-dates-2025-26 (26-27 PDF). Christmas Break Dec 21-Jan 4 merged. NB: 2026-27 calendar adds Veterans Day (Nov 11) which the 25-26 calendar omitted. Spring Break is 22-29 (full week +).

| Date | Name | Category | Closed | Early Release | Confidence |
|---|---|---|---|---|---|
| 2026-08-07 | Preschool Preview Day | orientation | N | N | high |
| 2026-08-10 | First Day of School: Early Dismissal | first_day | N | Y | high |
| 2026-08-17 | First Day on Campus (HS) | first_day | N | N | high |
| 2026-09-07 | No School: Labor Day | federal_holiday | Y | N | high |
| 2026-10-09 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2026-11-11 | No School: Veterans Day | federal_holiday | Y | N | high |
| 2026-11-20 | Early Dismissal | other | N | Y | high |
| 2026-11-23 – 2026-11-27 | No School: Thanksgiving Break | break | Y | N | high |
| 2026-12-18 | Early Dismissal | other | N | Y | high |
| 2026-12-21 – 2027-01-04 | No School: Christmas Break | break | Y | N | high |
| 2027-01-18 | No School: Martin Luther King, Jr. Day | federal_holiday | Y | N | high |
| 2027-02-12 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2027-02-15 – 2027-02-16 | No School: Winter Break | break | Y | N | high |
| 2027-03-12 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |
| 2027-03-22 – 2027-03-29 | No School: Spring Break | break | Y | N | high |
| 2027-05-07 | Grade 12: Last Day of School | last_day | N | N | high |
| 2027-05-17 | Grade 8: Last Day of School | last_day | N | N | high |
| 2027-05-19 | Grade 5: Last Day of School | last_day | N | N | high |
| 2027-05-20 | Last Day of School: Early Dismissal | last_day | N | Y | high |
| 2027-05-21 | No School: Faculty In-Service Day | teacher_workday | Y | N | high |

**Items Noah should double-check:**
- `2027-05-07` "Grade 12: Last Day of School" — confidence: high
- `2027-05-17` "Grade 8: Last Day of School" — confidence: high
- `2027-05-19` "Grade 5: Last Day of School" — confidence: high

---

## What the migration does

1. Adds a unique index on `closures(school_id, start_date, name)` so the inserts can use `ON CONFLICT DO NOTHING` (idempotent re-runs).
2. Looks up each anchor school by slug; raises if any slug is missing (forces operator to fix the schools table first).
3. Inserts the **selected** rows above for each school + year.
4. Updates `schools.calendar_status` to `verified_multi_year` for schools where BOTH 25-26 and 26-27 are parsed and majority-high-confidence; `verified_current` for one-year-only; leaves the rest at their existing status.

## Anti-import list

- **BASIS Independent Brickell** — DevClawd downloaded BASIS Brooklyn's PDF by mistake. No rows inserted. Status stays `needs_research`.
- **The Growing Place School** — DevClawd captured a 404 page screenshot. No rows inserted. Status stays `needs_research` (the original `docs/audits/2026-04-23-calendar-audit.md` flow — call (305) 446-0846 — is still the next step).
