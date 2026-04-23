# UX Principles — School's Out!

> This document is the source of truth. When in doubt, favor honesty over impression.

Every pull request, every subagent pass, every design decision is held against these ten rules. Referenced from `CLAUDE.md` and `PROGRESS.md`.

## The Ten Rules

1. **No dead clicks.** Every tappable element does something useful. If a card looks tappable, it routes somewhere. If a button isn't ready, it isn't shown.

2. **No hallucinations.** If we don't know, we say so. Better to show less than show wrong. No fabricated testimonials, camp hours, session dates, ratings, or anything else the user might trust.

3. **The app thinks for the parent.** Kid eligibility auto-detected. Weather surfaced. Commute estimated. Filters one-tap-smart. Parents are already doing mental math all day — don't add more.

4. **Honest disclosures everywhere.** ⚠️ on unverified data. "Call to confirm" when unsure. "Pending verification" on calendars not yet reviewed. Never pretend certainty we don't have.

5. **One clear next action per screen.** Parents are tired. Don't force a choice between ten options. Show the one thing they should probably do, and make it the biggest thing on screen.

6. **Skeletons not spinners.** Shimmer placeholders during loading preserve visual structure and make waits feel faster. Spinners say "something is happening somewhere"; skeletons say "your content is almost here."

7. **Empty states teach.** Every empty state has a next-action CTA and an explanation of what the filled state will look like. Never show a blank screen or "No results."

8. **Errors are human.** No "500" messages. Every error gets a friendly tone, a specific reason the user can act on, and a retry button.

9. **Respect attention.** No notifications begging to be enabled. No popups on first visit. No "subscribe now" nagware. Parents are overwhelmed already — don't become another source of noise.

10. **Accessibility is the floor, not the ceiling.** 44×44 px touch targets minimum. Keyboard navigation works everywhere. Screen reader labels on every interactive element. `prefers-reduced-motion` respected across every animation.

## How this is enforced

- **Code review:** every PR description references which rules it satisfies or consciously breaks (with reason).
- **Integrity check cron:** `/api/admin/integrity-check` runs nightly and flags camps without verified session data, broken website links, unverified content surfaced to users, etc.
- **Visual audit:** every new page is walked end-to-end in both modes (Parents + Kids), both languages (EN + ES), and with reduced-motion enabled.

## When a rule is broken

If shipping a feature would require breaking a rule, stop. Either scope down the feature, add the missing data to make it honest, or ship a different feature. "We'll fix it later" is how trust erodes.

One wrong Spring Break date costs us a parent forever. Design accordingly.

## COPPA exceptions (documented)

- **`user_plans.kid_names TEXT[]`** (migration 008). Kid display names are
  plaintext server-stored for this table ONLY. Justification: the parent
  opts in by saving a plan; the plan is shareable with a co-parent via the
  closure URL; the user can delete via `DELETE /api/plans?closure_id=…`.
  Everywhere else in the codebase (`kid_profiles`, localStorage `so-kids`,
  reminder subscriptions), names are kept client-side. Do not add name
  storage to new server tables without a comparable PM-authored exception.
