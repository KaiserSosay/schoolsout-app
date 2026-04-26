# Round-4 calendar import — BLOCKED on bad OCR (2026-04-26 evening)

Bucket 2 of the Sunday-evening pass (10 OCR'd school calendars) is
blocked at the source. The OCR text files DevClawd produced for these
10 schools don't contain parseable calendar data — they're a mix of
marketing copy, website navigation menus, grid-stripped garbage, and
in one case a calendar archive from **2019-2020**.

This is the same failure mode as round-2 BASIS Brickell (which turned
out to be the Brooklyn campus' PDF, blocked in
`docs/plans/blocked-2026-04-26-round2.md`). No migration 042 ships
from this data — that would be a trust failure on top of an OCR
failure.

## Pre-flight checks done

1. **Schools count is 319 in prod** ✅ (the round-3 import landed
   earlier today).
2. **Slug verification** — 9 of 10 schools exist:

   | Brief school | Prod slug |
   |---|---|
   | Carrollton | `carrollton-school-of-the-sacred-heart` |
   | Christopher Columbus | `christopher-columbus-high-school` |
   | Miami Country Day | `miami-country-day-school` |
   | Cushman | `cushman-school` |
   | Our Lady of Lourdes | `our-lady-of-lourdes-academy` |
   | Temple Beth Am | `temple-beth-am-day-school` |
   | Immaculata-La Salle | `immaculata-la-salle-high-school` |
   | St. Brendan High | `st-brendan-high-school` |
   | Hebrew Academy (RASG) | ❌ NOT IN PROD |
   | "La Salle High" | ⚠️ Ambiguous — only `la-salle-educational-center` (a college program) and `immaculata-la-salle-high-school` exist; brief lists "La Salle High" + "Immaculata-La Salle" as separate but the OCR file `la-salle-high-2025-2026.txt` is unrelated to either |

3. **Parser already adopts R6 allowlist** — `scripts/parse-school-
   calendars.ts:isClosureEvent` was rewritten to use the same
   allowlist + soft-deny pattern earlier today (commit `bb7b3c5`).
   No parser refactor was needed.

## OCR file diagnosis

Closure-keyword hit counts (substring match on "no school", "labor
day", "memorial day", "spring break", "thanksgiving", "christmas",
"easter", "winter break", "teacher work", "professional dev"):

| File | Bytes | Hits | What it actually contains |
|---|---:|---:|---|
| `carrollton-2025-2026-full.txt` | 1,766 | 2 | Bare phrases without dates: "Easter Sunday", "Easter Holiday Good Friday" |
| `christopher-columbus-2025-2026.txt` | 1,051 | 0 | No closure mentions |
| `miami-country-day-calendar-2025-2026.txt` | 11,393 | 0 | Mostly grid-OCR garbage; no date+closure pairs found |
| `cushman-2025-2026-full.txt` | 493 | 0 | "...summer camp and academic programming for students from Pre-K through 12th grade. Register today..." — marketing copy |
| `hebrew-academy-rasg-2025-2026.txt` | 796 | 0 | No closure mentions |
| `our-lady-of-lourdes-2025-2026.txt` | 922 | 1 | Single hit dated **2019-11-26** ("Nov. 26, 2019 Thanksgiving Basket Distribution") — six-year-old archive content |
| `temple-beth-am-2025-2026.txt` | **0** | 0 | Empty file |
| `la-salle-high-2025-2026.txt` | 6,960 | 2 | Opens with "STUDENTS ¥ PARENTS FACULTY v" — a website nav bar OCR'd. Hits are concatenated grid-strip garbage like "Easter Break Easter Break Easter Break Hofmann Center" |
| `immaculata-la-salle-2025-2026.txt` | 1,333 | 0 | Opens "Immaculata-La Salle / High School" — title page only, no calendar body |
| `st-brendan-high-2025-2026.txt` | 4,034 | 0 | No closure mentions |

Best-case parse from this set: ~3 unverified-shape closures total.
Brief expected 100-200. **Two orders of magnitude off.**

## Why this isn't recoverable in this session

- 7 of 10 files have ZERO closure-keyword hits. No amount of parser
  tuning extracts closures from text that doesn't mention them.
- Lourdes' file is genuinely from 2019-2020 — the file is correct
  text but the wrong year.
- Temple Beth Am's file is 0 bytes — the OCR step failed entirely.
- Schools where text exists but is grid-OCR garbage (Miami Country
  Day, La Salle High) would need vision-API re-OCR or a clean PDF
  re-pull from DevClawd.

## What this round needs from DevClawd / Cowork

1. **Verify each file's source URL** — confirm the OCR captured a
   2025-2026 calendar PDF, not a homepage / summer-camp marketing
   page / nav menu / 2019 archive.
2. **Re-pull the failed schools** with cleaner methods:
   - Direct calendar PDF link from the school's own site
   - `pdftotext -layout` if DevClawd has the source PDF
   - Vision-API on a clean screenshot if no PDF exists
3. **Confirm the slug for the brief's "La Salle High"** — either
   it's the same calendar as Immaculata-La Salle (drop one of the
   two files) or it's a school we don't have in prod yet (treat
   like the Hebrew Academy gap).
4. **Hebrew Academy (RASG) needs a schools-table row** before any
   calendar import can attach to it. Per the round-3 brief's
   stop-and-ask, schools missing from prod need explicit Rasheid
   approval before insertion.

## What did ship in this session (Sunday evening 2026-04-26)

Independent of this block:

- ✅ Bucket 1 (4 quick-win commits — verified-frame closure-count
  guard, Belen iCal feed, kid-age display refactor, year-coverage
  banner verified live)
- ✅ iCal v4 hardening (3 commits + migration 040 + 041 applied):
  school_year derivation in sync, NEGATIVE_KEYWORDS extension,
  Palmer Trinity cleanup, then full v4 allowlist swap
- ✅ R6 in `docs/SHIPPING_RULES.md` — allowlist over blocklist for
  trust-sensitive imports
- ✅ Task 2: "Official" → "Verified" copy refresh across school
  calendar eyebrow keys (EN + ES) + Phase 4.7 wording graduation
  note in `docs/ROADMAP.md`

Calendar import for the round-4 schools moves to a follow-up
session once DevClawd / Cowork supply usable source files.
