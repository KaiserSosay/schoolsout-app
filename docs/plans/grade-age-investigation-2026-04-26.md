# Grade vs age data investigation — 2026-04-26

**Brief 2 / Goal 2 from the password+grade prompt.** Mom's report:
"onboarding asks for grades, but ages display elsewhere — and the
ages shown are wrong."

This doc captures the investigation **without** shipping a fix, per
the brief's anti-goal: "Don't change the kid data model in Goal 2
without Rasheid's explicit pick."

## What's stored where

The model is unambiguously **Possibility B** from the brief: only
grade is stored on the client (localStorage), only `age_range` (a
4-bucket enum) is stored on the server. The mapping happens at
write time in `gradeToAge()` in `src/components/app/KidForm.tsx`.

**Server side** (`kid_profiles.age_range`):

```ts
export type AgeRange = '4-6' | '7-9' | '10-12' | '13+';
```

**Client side** (localStorage `so-kids`):

```ts
{ name: string; grade: 'PreK' | 'K' | '1' | ... | '12' }
```

**Mapping** (`gradeToAge`, lines 43-69):

| Grade  | Stored bucket | Real-world age (US) | Bucket says max |
| ------ | ------------- | -------------------- | --------------- |
| PreK   | `4-6`         | ~3-4                | 6               |
| K      | `4-6`         | ~5-6                | 6 ✅             |
| 1      | `4-6`         | ~6-7                | 6 ❌ (off by 1) |
| 2      | `4-6`         | ~7-8                | 6 ❌ (off by 1-2) |
| 3      | `7-9`         | ~8-9                | 9 ✅             |
| 4      | `7-9`         | ~9-10               | 9 ❌ (off by 1) |
| 5      | `7-9`         | ~10-11              | 9 ❌ (off by 1-2) |
| 6      | `10-12`       | ~11-12              | 12 ✅            |
| 7      | `10-12`       | ~12-13              | 12 ❌ (off by 1) |
| 8      | `10-12`       | ~13-14              | 12 ❌ (off by 1-2) |
| 9-12   | `13+`         | ~14-18              | 13+ ✅           |

Every bucket boundary is approximately one year too low. The pattern
is consistent: each bucket holds 4 grades when 3 would fit cleanly.

**Concrete: Noah is in 2nd grade (per CLAUDE.md / memory). He is 8.
The system stores him as `'4-6'`.** Mom looking at age display reads
"4-6 years old" — that's what she saw and that's what's wrong.

## Why this happened

The bucket boundaries were probably picked once to match camp
filtering (camps tag themselves with `'4-6'`, `'7-9'`, etc.) and the
grade→age mapping was reverse-engineered from those buckets without
checking against actual US grade ages. Easy mistake; nobody on a
dev team would notice unless they had a real second-grader to test
on.

## Where the wrong age surfaces in the UI

Anywhere `age_range` is displayed verbatim, e.g.:

- `/app/family` family page (kid cards)
- `/admin` users tab (admin's view of a parent's kids)
- The existing camp-recommendation filtering

Camp-side filtering by `age_range` actually lands roughly correct
because camps are tagged with the same buckets — Noah's camps tagged
`'4-6'` won't match him, but neither will camps tagged `'7-9'` (his
true bucket). Families end up with empty filter results that skew
toward kids who happen to fall on the bucket-aligned grade.

## Three options, ranked by effort

### Option 1 — Quick fix (~30 min): correct the gradeToAge mapping

Re-shift the bucket boundaries to match real ages:

```ts
'PreK' | 'K' → '4-6'
'1' | '2' | '3' → '7-9'
'4' | '5' | '6' → '10-12'
'7' | '8' | '9' | '10' | '11' | '12' → '13+'
```

Pros: trivial diff, fixes mom's display issue today, no migration.
Cons: existing kid_profiles rows with the WRONG age_range stay
wrong until each kid is re-edited. The brief's anti-goal "Don't
fabricate" means we shouldn't auto-update — but a one-line note in
Settings → Family ("we recently fixed grade→age, please re-confirm
your kids' grades") gets parents to fix it themselves.

Migration cleanup option: a backfill that re-derives age_range from
each kid's STORED `client-only` grade is not possible (we don't
have grade server-side). So Option 1 leaves a lingering tail of
already-wrong rows.

### Option 2 — Proper fix (~3-4 hours): birth-month + birth-year model

Onboarding becomes "Mom, what month + year was your kid born?"
Display shows current age computed from today; grade becomes a
display hint, not a stored value. Filters use real age, not bucket.

Pros: zero conversion drift ever. Camp filters get more precise
(an 8-year-old can match a `4-7` camp without bucket hacks). Aging
into the next bucket happens automatically each birthday.

Cons: bigger UX change for mom — she's used to typing grade. Also
arguably stores more sensitive data (date of birth) than ages-as-
ranges. COPPA implication: birth_year + birth_month for a 7-year-old
is enough to identify them combined with school + neighborhood. The
existing model deliberately stored a 3-year range to avoid that.
**This option may conflict with the COPPA design memory.**

### Option 3 — Hybrid: store both (grade + birth month/year)

Mom still types grade in onboarding (familiar). System derives
age_range from birth month/year (accurate). Both stored client-side
only; age_range still goes server-side as the camp-filter signal.

Pros: best of both — accurate age, familiar UX, server signal stays
the same.

Cons: more fields in onboarding (birth month, birth year, grade) —
adds friction to the very flow we want short. And birth date is
still PII even if local-only.

## Recommendation

**Option 1, plus a one-line nudge in Settings → Family.**

The bug is a five-line diff. The brief's "Mom doesn't notice
anything weird about her kid's ages or grades on any page" can be
satisfied by Option 1 alone if mom re-edits Noah after the fix
ships. Option 2 conflicts with the project's [COPPA data model
memory](../../memory/project_coppa-data-model.md) ("ages as ranges").
Option 3 inflates onboarding for marginal gain.

If Rasheid wants Option 2 or 3, a separate plan doc + a careful
COPPA review go first — that's not something to pick under time
pressure with mom watching the live site.

## Decision needed from Rasheid

- [ ] Option 1 (quick fix to gradeToAge boundaries, no migration)
- [ ] Option 2 (birth date model — needs COPPA review first)
- [ ] Option 3 (hybrid — needs onboarding redesign)
- [ ] Other / let's talk

Once picked, the actual work is small (Option 1) or substantial
(Option 2/3). Either way, the next session will move fast.
