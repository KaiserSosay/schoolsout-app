# School's Out! v3.1 — Design Decisions

**Date:** 2026-04-21
**Authors:** Rasheid Scarlett (NetAesthetics), Noah Scarlett (Product Lead, age 8)
**Status:** Approved. Ready for implementation.
**Related:** `SCHOOLSOUT-PRD_1.md` (v3.1), `SCHOOLSOUT-CLAUDE-CODE-GUIDE.md`

---

## Purpose

Capture the brainstorm that produced v3.1 of the PRD. Records the stress-test of the v3.0 spec, the decisions made, the alternatives rejected, and the reasoning — so future-us can revisit any choice without reconstructing the argument.

## Context

v3.0 PRD was comprehensive but not stress-tested. Before writing any code, we challenged every assumption: stack choice, the AI-as-moat claim, pricing, UX gaps, cold-start strategy, COPPA exposure, and failure modes. This doc is the output.

---

## Decisions

### D1. Stack: Next.js + Supabase + Vercel + Resend (confirmed)

**Alternatives considered:**
- Drop Supabase; use SQLite + Fly.io (or static + Cloudflare Workers).
- Defer auth entirely to Phase 2, use localStorage-only.

**Chosen:** Keep the v3.0 stack. Add Resend for email delivery.

**Why:**
- Two-sided marketplace (parents + operators) requires real auth on both sides. localStorage breaks when an operator logs in from a second device.
- Migrating from localStorage → DB at Phase 2 is MORE work than setting up Supabase once upfront.
- Supabase free tier covers ~50k users. No cost pressure at MVP.
- Supabase RLS directly enforces the COPPA data boundaries (parents can only read their own reminders; operators can only read their own camps).

### D2. Email Reminders Are a Phase 1 Core Feature

**Rejected:** deferring reminders to Phase 2 (as in v3.0).

**Why:**
- Without reminders, parents look up a closure once and never return. The product is a one-shot utility, not an app.
- Reminder signup becomes the primary conversion CTA. Saved camps and account creation are secondary.
- Phase 1 success is gated on 200 reminder subscribers + 40% open rate. This is the only number that matters.
- Implementation cost is moderate (Resend + cron + templates) and well-scoped.

### D3. Spanish on Day One

**Rejected:** Spanish as a Phase 2 feature.

**Why:**
- Miami-Dade is 69% Hispanic, ~25% Spanish-dominant.
- English-only MVP addresses < half the market.
- Claude can produce usable translations for ~$2 in tokens. Native-speaker review is cheap ($50–150 one-time).
- `next-intl` is well-documented; setup cost is small.

### D4. Kid Data Client-Side Only (COPPA Design)

**Rejected:** storing kid names + exact ages + specific schools server-side (the v3.0 model).

**Why:**
- COPPA exposure is disproportionate to the feature value.
- A breach of the v3.0 data model would leak "which kid is at which school at what age." That's dangerous data to aggregate.
- Age ranges (4–6, 7–9) are enough for filtering camps and closures.
- District (not specific school) is enough for calendar lookup.
- Storing kid profile data client-side means cross-device sync is lost for kid profiles. Accepted tradeoff.

**Implementation:**
- Server stores: parent email, preferred language, COPPA consent timestamp, reminder subscriptions, saved camps.
- All kid-specific state (names, exact ages, specific schools) lives in localStorage/IndexedDB.

### D5. Pricing: Launch Partner First, Paid Features Later

**Rejected:** $29/mo Featured subscription in MVP.

**Why:**
- Zero-traffic marketplace = zero conversions at any price. Operators will not pay for imaginary audience.
- First goal is inventory (camps), not revenue. Revenue comes after audience + inventory both exist.

**Chosen:**
- **Phase 1:** Free to list. First 10 camps get Launch Partner — Featured free for 90 days.
- **Phase 2:** $29/mo Featured unlocked only when platform hits 1,000 MAU or 500 reminder subscribers.
- **Phase 3:** Performance pricing ($3–5 per verified outbound click) as alternative model.

### D6. AI Calendar Parsing Is Cost Reduction, Not the Moat

**Reframed:** In v3.0, AI ingestion was presented as "the key innovation that makes scaling possible." In v3.1, it's a cost-reduction feature.

**Why:**
- AI calendar parsing is table stakes within 12 months — any competitor can replicate in a weekend.
- Real moats for this product:
  1. Proprietary verified camp inventory.
  2. Exclusive operator relationships.
  3. Parent network effects (reminders, saves, shares).
  4. School/district partnerships for distribution.

**Implication:** design for inventory + operator relationships first. AI is UX polish, not differentiation.

### D7. AI-Parsed Calendars Are Drafts; Humans Verify Before Publish

**Rejected:** v3.0 behavior where AI parses once a week and data is shown if `verified=false` is later flipped to true without a strict review gate.

**Chosen:**
- `closures.status` enum: `'ai_draft' | 'verified' | 'rejected'`.
- Only `'verified'` closures are returned by `/api/closures`.
- Only `'verified'` closures trigger reminder emails.
- Admin review dashboard shows diffs for new/changed drafts.

**Why:**
- One wrong Spring Break date = a parent misses a work day = trust destroyed.
- Manual verification is cheap at launch volumes (10–20 schools × ~30 closures/year/school).
- At scale, this shifts to spot-review + confidence scoring.

### D8. Cold Start: Parents First via Calendar Value

**Rejected:** trying to seed camps and parents simultaneously.

**Chosen sequence:**
1. **Week 1–2:** Calendar + reminders for 1–2 schools. Manual data entry.
2. **Weeks 3–4:** Distribute. Target 200 reminder subscribers.
3. **Week 5:** In-person walk-ins to 10 local camps. Pitch with "200 Coral Gables parents on our list." Launch Partner (free) offer.
4. **Weeks 6+:** Phase 2/3 build, add camps marketplace.

**Why:**
- Calendar has standalone value without camps. Camps have no value without audience.
- 200-person audience is enough proof to get operator attention.
- In-person sales for the first 10 operators. Automated signup after.

### D9. Ship a 2-Week Dumb MVP Before Anything Else

**Rejected:** building the full PRD before first user contact.

**Chosen:** Phase 0 is 2 weeks of work:
- 1 school's complete verified calendar.
- Home page with next 3 closures.
- Email reminder signup (THE CTA).
- Bilingual EN/ES toggle.

That's it. No camps, no AI, no operator flow.

**Why:**
- Solo dev + 8-year-old co-founder = high burnout risk on multi-month builds.
- Real signal from real users beats any amount of pre-planning.
- Answers the only question that matters at launch: do parents sign up for reminders?

### D10. Noah-Shaped Ownership

**Project risk identified:** if this becomes "Dad's thing," the energy dies and so does the project.

**Design commitments:**
- Noah names closures ("Spooky Week" not "Thanksgiving Break," if he wants).
- Noah picks emojis.
- Noah writes camp blurbs (Phase 3+).
- Noah stars in the demo video.
- Noah is publicly credited as co-founder on the site.

### D11. Privacy Policy + ToS Drafted by a Lawyer Before Launch

**Budget:** $500–1500 one-time.
**Scope:** COPPA-safe parental consent language, privacy policy, terms of service, breach response plan, DPIA on file.
**Non-negotiable.** Not "we'll get to it before scale."

---

## Architecture Summary

See PRD v3.1 sections 5.1–5.6 for full detail. Key changes from v3.0:

- `kids` table **removed**. Kid profile data client-side.
- `reminder_subscriptions`, `reminder_sends`, `website_clicks` tables **added**.
- `closures.status` enum **added** (replaces the simple `verified` boolean).
- `users.preferred_language` and `users.coppa_consent_at` **added**.
- Routes for `/api/reminders/*` **added**.
- Resend integration **added**.
- `next-intl` **added**.
- Stripe **deferred** to Phase 2.

## Phase Structure (Updated)

| Phase | Focus | New/Changed in v3.1 |
|-------|-------|---------------------|
| 0 | Project scaffold | Unchanged |
| 1 | DB + Auth + **Reminders** + **Spanish i18n** + Onboarding | Reminders and Spanish now core MVP |
| 2 | Home + Closures + Weather | Unchanged core, add share-with-co-parent link |
| 3 | Camps marketplace | **Exact prices** (not ranges), extended-care indicator |
| 4 | Operator self-service | **Launch Partner** program, no $29/mo |
| 5 | AI features | **All human-in-loop**; cache + rate-limit |
| 6 | Polish + deploy | Lawyer-drafted privacy policy + ToS |

## Success Criteria for This Design

The spec is correct if, after Phase 0 + Phase 1 (target: 6 weeks), we hit:

- 200 reminder subscribers
- Email open rate > 40%
- 10 verified school calendars
- 10 Launch Partner camps signed (by end of week 6)
- 15%+ Spanish sessions
- Zero kid PII on server
- Zero COPPA complaints

If we hit all of these, Phase 2 begins. If we miss reminders or open rate, iterate on Phase 1 before building more.

## Open Questions

None blocking. All v3.0 open questions resolved in PRD §10.

## Next Steps

Invoke `superpowers:writing-plans` to produce a detailed implementation plan for Phase 0 and Phase 1.
