# Round-2 calendar import — blocked items (2026-04-26)

This is the cousin of `docs/plans/blocked-2026-04-25.md` from the first
round. Round 2 was supposed to add 5 more anchor private schools. One is
blocked, four are pending sidecar curation.

## ❌ BASIS Independent Brickell — wrong school re-downloaded

DevClawd's overnight pull at `~/Downloads/schoolsout-calendars/basis-independent-brickell-2025-2026.pdf`
is **BASIS Independent Brooklyn**, not Brickell.

Proof, from `pdftotext` on the file:

```
PreK–Grade 2: 405 Gold Street, Brooklyn, NY 11201 | Grades 3–12: 556 Columbia Street, Brooklyn, NY 11231
brooklyn.basisindependent.com
```

Same failure mode as round 1 — the BASIS marketing site cross-links the
campuses and a generic "PDF" link sometimes resolves to Brooklyn. The
brief flagged this risk explicitly; the file was caught BEFORE any
vision-API spend.

**Action:** BASIS Brickell is excluded from round 2. Whoever picks this
up next should re-download from the actual Brickell campus URL
(`https://miamibrickell.basisindependent.com/`) and run the standard
verification before parsing.

The previous Brickell sidecar at
`docs/plans/calendar-pdfs/basis-independent-brickell-2025-2026.extracted.json`
is from an earlier verified pass and was NOT touched in this session.

## ⏸️ Carrollton, Belen Jesuit, Miami Country Day, Cushman — staged, not parsed

Round-2 PNGs were copied into `docs/plans/calendar-pdfs/`:

- `carrollton-2025-2026-full.png`
- `belen-jesuit-calendar-2025-2026.png`
- `miami-country-day-calendar-2025-2026.png`
- `cushman-2025-2026-full.png`

The parser at `scripts/parse-school-calendars.ts` reads `.extracted.json`
sidecars rather than calling the vision API directly. To finish the round-2
import, someone needs to:

1. Open each PNG in Claude (multimodal) or another vision tool and produce
   the `<basename>.extracted.json` sidecar in the same shape used by the
   round-1 files (e.g. `gulliver-prep-2025-2026.extracted.json`).
2. Add a `SCHOOL_REGISTRY` entry for each school (with `ensure` set if the
   school doesn't yet exist in prod — defensive pattern from migration 029).
3. Run the parser, write the `parsed-school-calendars-2026-04-26-round2.json`,
   eyeball it for the Catholic-school heuristic (Carrollton/Belen MUST have
   Holy Week / Good Friday / Easter Monday / Ash Wednesday).
4. Generate a verification doc and a migration in the standard pattern.

This was deferred from the 2026-04-26 morning push because vision-on-the-fly
sidecar work is enough scope to deserve its own focused session, and the
day's higher-priority items (admin badge + pill-count fixes) shipped first.

## What did ship in this session (Sunday 2026-04-26 morning)

- ✅ Goal 1 — admin link in user menu (`feat(admin): admin dashboard link…`)
- ✅ Goal 2 — pill count accuracy (`fix(admin): admin dashboard pill counts…`)
- ⏸️ Goal 3 — round-2 calendars (this doc; BASIS blocked, 4 PNGs staged)
- ⏸️ Goal 4 — iCal feed sync (deferred; depends on Goal 3 migration number)
