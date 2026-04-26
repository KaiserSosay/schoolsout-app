# Round-3 calendars + admin notify trigger — 2026-04-26 afternoon

**Operator:** Claude Code session (Rasheid)
**Brief:** docs/plans/calendar-import-verification-2026-04-26-round3.md (verification doc) and the user-supplied "Parse TGP + 13 OCR'd Schools (Migration 035)" prompt.

## What landed (3 commits, all on origin/main)

1. `data(schools): migration 035 — TGP + Palmer Trinity calendars (NOT applied)` (`80feef2`)
   - Migration 035 with 17 high-confidence TGP closures + Palmer Trinity iCal feed URL + Lehrman calendar_status flip
   - TGP sidecar JSON (audit trail) at `docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.extracted.json`
   - Six tests in `tests/scripts/parse-tgp-calendar.test.ts` pin the sidecar contents
   - Slug fix in `scripts/parse-school-calendars.ts` registry (was `the-growing-place-school-coral-gables`, prod truth is `the-growing-place`)

2. `feat(admin): "Calendar verifications" panel + notify-subscribers email batch` (`ed6e4d3`)
   - `SchoolCalendarVerifiedEmail.tsx` (EN + ES, ES flagged for native review)
   - `POST /api/admin/schools/notify-calendar-verified` (admin-gated, idempotent)
   - `NotifySubscribersPanel` rendered at the top of the calendar-reviews tab
   - Six tests covering unauth/non-admin/missing-school/invalid/happy/idempotent

3. (this commit) `docs(progress): round-3 verification doc + report`

## Numbers

- 569 tests passing (was 556 → +13 from this round)
- Lint clean (only pre-existing OperatorDashboard warning)
- No new typecheck errors

## What didn't land (and why)

### Belen Jesuit deferred
OCR text from `belen-jesuit-calendar-2025-2026.txt` is grid-stripped — every line reads `Apr NO CLASS` without dates. Useless for parsing. Path forward: vision API on the PNG (~$0.05). Deferred to a focused next session.

### 10 round-3 schools NOT in prod
The round-3 brief assumed a 316-school directory; `schools` actually has 12 rows. Carrollton, Christopher Columbus, Country Day, Cushman, Hebrew Academy RASG, Lourdes, Beth Am, La Salle, Immaculata, St. Brendan are all missing. Per the brief's "STOP and ask Rasheid before inserting a new school" rule, those are flagged in the verification doc with suggested slugs but not inserted.

### Parser script regenerates 029 — flagged
Running `scripts/parse-school-calendars.ts` regenerates `supabase/migrations/029_anchor_schools_calendars.sql` from scratch. 029 is already applied to prod. If the parser is rerun and the regenerated 029 differs from the applied one, follow-on migrations could break. **The parser should be patched** to either parameterize the output filename or refuse to overwrite existing migrations. I caught this once during this session and reverted; flagging here so the next session does it cleanly.

## Next decisions for Rasheid

1. Apply migration 035 (`pnpm exec supabase db push --include-all`)
2. After it lands, verify TGP at `/en/schools/the-growing-place` in incognito — should see the 17-closure list and the placeholder gone
3. Open `/en/admin?tab=calendar-reviews` — "Calendar verifications" panel surfaces TGP with the pending-parents count
4. Click the "Email N parents now" button — Noah and Mom (if subscribed) get the calendar-verified email
5. Decide on the 10 missing schools — yes/no/which slugs (verification doc has suggestions)
6. Decide on Belen's vision-API parse for next session
7. Patch `scripts/parse-school-calendars.ts` so it doesn't overwrite already-applied migrations

Slow product, fast users. 👊
