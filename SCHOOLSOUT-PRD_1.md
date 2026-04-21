# School's Out! — Product Requirements Document (PRD)

**Version:** 3.1
**Last Revised:** 2026-04-21
**Authors:** Noah Scarlett (Product Lead, age 8) & Rasheid Scarlett (NetAesthetics)
**Domain:** schoolsout.net
**OG Image:** https://schoolsout.net/schools-out-og.png
**Status:** MVP spec approved. Ready for implementation.

---

## Changelog (v3.0 → v3.1)

The v3.0 spec was stress-tested before any code was written. These changes are baked into v3.1:

1. **Email reminders promoted to Phase 1 core feature.** Without reminders, parents visit once and never return. Reminders are the retention mechanism and the primary Phase 1 conversion CTA.
2. **Spanish on day one.** Miami-Dade is 69% Hispanic. English-only MVP is not viable.
3. **Kid data lives client-side only.** Names and exact ages never touch the server. COPPA risk reduction.
4. **$29/mo Featured subscription deferred.** MVP launches with a free Launch Partner program: first 10 camps get Featured free for 90 days. Paid subs unlock at 1,000 MAU or 500 reminder subscribers.
5. **AI parses calendars to DRAFTS. Human review is required before publish.** No unverified calendar data ships to parents.
6. **The moat is the marketplace, not the AI.** Design for verified camp inventory + operator relationships, not AI features.
7. **Cold start sequence documented.** Parents first via calendar + reminders. Camps recruited once audience exists.
8. **Exact camp prices, not ranges.** Transparency is a differentiator in this market.
9. **Before/after-care indicator added.** The #1 hidden question for working parents.
10. **Co-parent share link primitive added.** Serves divorced/shared-custody families and doubles as the viral loop.

---

## 1. What Is This?

School's Out! is a mobile-first web app that tells parents exactly when school is closed and gives them one-tap access to camps, activities, and AI-powered day plans — so they never have to scramble or Google anything.

**The rule:** The app does the research so parents don't have to look anything up themselves.

### 1.1 Two-Week MVP Scope (Phase 0 + Phase 1)

Before building the full vision, ship the minimum viable loop:

- 2 schools manually entered with complete, verified closure data
- Home page showing next 3 closures (anonymous, no signup required)
- Email reminder signup (the primary CTA)
- Spanish/English toggle
- Reminders sent 2 weeks / 1 week / 3 days before each closure

That's it. No camps. No AI. No operator dashboard. Ship it, distribute to Noah's school community, and measure: do parents sign up? Do they open the emails?

Everything else earns the right to exist only after this loop proves parents want the product.

## 2. Who Uses It?

| User | What They Need |
|------|---------------|
| **Parents** (primary) | Know when school is out, get reminded before each break, find camps/activities fast |
| **Camp Operators** (secondary) | List their camp free, reach local parents, earn Launch Partner status |
| **School Admins** (future) | Submit/verify their calendar directly |

**Age range of kids:** 4–9 (expandable later)
**Launch market:** Coral Gables + Miami, FL
**Primary languages:** English + Spanish (day one)

## 3. Scale Plan

| Phase | Market | Schools | Timeline |
|-------|--------|---------|----------|
| 0 — Dumb MVP | Noah's school only | 1 school | Week 1–2 |
| 1 — Extended MVP | Coral Gables / Miami | 10–20 schools | Weeks 3–6 |
| 2 — Metro | All Miami-Dade County | M-DCPS district-wide + private | +3 months |
| 3 — State | All of Florida | Major districts + private | +6 months |
| 4 — Regional | SW United States | Top 50 districts | +12 months |
| 5 — National | All US | Automated ingestion | +18 months |

## 4. Core Features

### 4.1 Home / Dashboard
- **Age filter:** Client-side only. User selects age range (4–6, 7–9). No kid names, no exact ages on server.
- **Email reminder CTA:** Primary conversion above the fold. "Get reminded before every school closure" → email input → confirmation.
- **Next 3 closures** as big tappable cards with emoji, school name, date range.
- **Countdown timer** to next closure ("3 days away!").
- **Accordion** with rest of school year closures.
- **Weather widget** — real Open-Meteo forecast for breaks within 16 days, Miami monthly averages as fallback.
- **"What should we do?"** AI button — opens chat pre-loaded with the closure context (Phase 5).
- **Language toggle** top-right on every page.

### 4.2 Closure Detail Page
- Emoji header, break name, date range, school badge.
- **Break type badges:** ⚡3-Day Weekend (3 days), 🎉 Long Break (5+), ☀️ Summer.
- **Weather section** — real forecast or monthly average with ⚠️.
- **Activity ideas** — AI-generated (Phase 5), different for short vs. long breaks.
- **"Plan My Break"** button (Phase 5).
- **"Book a Camp Now"** yellow CTA → Camps tab pre-filtered (Phase 3).
- **"Share with co-parent"** button — generates read-only share link (Phase 2).

### 4.3 Email Reminders (NEW in v3.1)

**The retention mechanism.** Without this, the app is a one-time lookup tool.

- **Signup:** Email only, no password required. Confirms with magic link.
- **Cadence per closure:** 14 days before, 7 days before, 3 days before.
- **Content:** Closure name, date range, weather preview, "Plan it now" CTA, 2 Launch Partner camps (once camps exist).
- **Bilingual:** Sent in the language the user selected at signup.
- **Unsubscribe:** One-click, footer link, CAN-SPAM + GDPR compliant.
- **Infrastructure:** Resend for delivery, Supabase edge function + cron for scheduling.
- **Metric targets:** Open rate > 40%, click rate > 10%.

### 4.4 Spanish / Bilingual Support (NEW in v3.1)

- **next-intl** for i18n.
- Strings translated initially by Claude, reviewed by a native Spanish speaker before launch.
- Language toggle in top-right on every page.
- Auto-detect via Accept-Language header on first visit.
- URL strategy: `/es/*` for Spanish, `/en/*` (or root) for English, persisted in a cookie.
- AI chat and reminder emails honor the selected language.

### 4.5 Camps Marketplace (Phase 3)
- **Category filter bubbles:** Sports, Soccer, Swim, Tennis, Basketball, Art, Theater, Music, Dance, STEM, Nature, Cooking, Coding.
- **Camp cards:** Name, age range, **exact price** (not range), star rating, ☆ save button, 📍 distance.
- **Before/after-care indicator:** "Extended care 7am–6pm" badge if offered — often the deciding factor for working parents.
- **Launch Partner badge** (yellow border + "Launch Partner" label) for first 10 camps listed.
- **Search bar** with autocomplete.
- **Sort:** Relevance, Price (low→high), Distance, Rating.
- Camp operators can **self-list** (always free) and apply for **Launch Partner** status.

### 4.6 Camp Detail Page (Phase 3)
- Hero image, camp name, operator name.
- Age range, **exact price** (transparent pricing differentiator).
- Before/after-care hours and pricing.
- Location with map pin.
- 1-paragraph description.
- Category chips (tappable → filter camp list).
- Schedule / session dates.
- **"Visit Website"** button (outbound link, tracked in `website_clicks`).
- **"Save"** button (☆ → ⭐).

### 4.7 Saved / Favorites
- List of starred camps with quick-unstar.
- Persisted per-account via Supabase (`saved_camps` table).
- Anonymous users can save to localStorage; on signup, items migrate to server.

### 4.8 AI Features (Phase 5)

All AI features ship with human review where data integrity matters:

- **Calendar Ingestion:** Claude extracts closures from PDFs/URLs to `closures.status = 'ai_draft'`. **Admin review required before status flips to `verified`.** No AI-only closures in production.
- **Plan My Break:** Given closure dates + age range + saved preferences, AI suggests a day-by-day schedule. Cached by `(closure_id, age_range)` to avoid re-billing Claude for the same combo.
- **Ask Anything:** Chat interface on closure detail. Rate-limited: 3 plans/day per anonymous session, 10 per signed-in user.
- **Co-parent share plans** (Phase 2): share-link generates a read-only view of a closure + saved plan for the other parent.

### 4.9 Accounts & Auth

**COPPA-safe account model:**

- **Sign up:** Email + password, or Google OAuth. Magic-link option for reminder-only signups.
- **Server stores:** parent email, preferred language, zip code (optional), COPPA consent timestamp, reminder subscriptions, saved camps.
- **Server does NOT store:** kid names, exact kid ages, specific schools. All kid profile data is client-side (localStorage/IndexedDB).
- **Onboarding (3 screens, all skippable):**
  1. "What district?" — Miami-Dade public, private, charter. Not a specific school.
  2. "Age ranges in the family?" — bubbles for 4–6, 7–9 (multi-select, client-side only).
  3. "Get reminder emails?" — primary CTA, defaults to Yes.
- **Parental consent checkbox:** Explicit COPPA-safe-harbor language at signup. Lawyer-drafted.
- **Data retention:** Inactive accounts (no login, no email open for 12 months) auto-purged.
- **Anonymous mode:** Can browse without account; can save via localStorage. Signup required only for cross-device saves + reminders.
- **Camp Operator account:** Separate signup, verified business email, manual admin review before going live.

### 4.10 Camp Operator Self-Service (Phase 4)

**Pricing: FREE at launch.** No $29/mo subscription in MVP.

- **Add a Camp:** Name, description, age range, **exact price**, categories, location, website, session dates, extended-care info, hero image.
- **Dashboard:** Views, saves, verified website clicks (outbound link tracking).
- **Launch Partner program:** First 10 camps get Featured (yellow border + "Launch Partner" badge) free for 90 days. Lock in 12-month commitment at discounted $19/mo after (only billed once MVP hits 1,000 MAU).
- **Paid Featured (Phase 2+):** $29/mo month-to-month, activated only when platform hits 1,000 MAU or 500 reminder subscribers.
- **Verification:** Manual admin review before listing goes live. Low volume at launch makes this cheap.

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR for SEO, React for interactivity |
| Backend | Next.js API Routes + tRPC | Type-safe, co-located with frontend |
| Database | Supabase (PostgreSQL + Auth + Storage) | Two-sided marketplace needs real auth; free tier covers 50k users; RLS enforces COPPA boundaries |
| AI | Anthropic Claude API (Sonnet) | Calendar parsing, plan generation, chat |
| Weather | Open-Meteo API (free, no key) | Real forecasts, no signup |
| Email | **Resend** | Transactional reminders, bilingual templates, React Email |
| i18n | **next-intl** | Day-one Spanish support |
| Payments | Stripe Connect (Phase 2+) | Deferred — not in MVP |
| Hosting | Vercel | Free tier, auto-deploy from GitHub, edge functions, cron |
| Maps | Google Maps Embed (free tier) | Camp locations (Phase 3) |
| Analytics | PostHog (free tier) | Usage tracking, conversion funnels |

### 5.2 Database Schema (Supabase / PostgreSQL)

**Principle: no kid PII on the server.** The `kids` table from v3.0 is eliminated. Age ranges live client-side.

```
users
  id uuid PK
  email text UNIQUE
  preferred_language enum ('en', 'es')
  zip_code text NULL
  role enum (parent, operator, admin)
  coppa_consent_at timestamp NOT NULL
  created_at timestamp
  last_seen_at timestamp

schools
  id uuid PK
  name text
  district text
  city text
  state text
  type enum (public, private, charter)
  calendar_source_url text
  last_synced_at timestamp

closures
  id uuid PK
  school_id uuid FK → schools
  name text
  start_date date
  end_date date
  emoji text
  status enum ('ai_draft', 'verified', 'rejected')  -- NEW in v3.1
  source text  -- 'ai_parsed' | 'manual' | 'district_api'
  verified_by uuid FK → users NULL
  verified_at timestamp NULL

reminder_subscriptions  -- NEW in v3.1
  id uuid PK
  user_id uuid FK → users
  school_id uuid FK → schools
  age_range enum ('4-6', '7-9', 'all')
  enabled boolean DEFAULT true
  created_at timestamp

reminder_sends  -- NEW in v3.1
  id uuid PK
  subscription_id uuid FK → reminder_subscriptions
  closure_id uuid FK → closures
  days_before int  -- 14, 7, 3
  sent_at timestamp
  opened_at timestamp NULL
  clicked_at timestamp NULL
  UNIQUE (subscription_id, closure_id, days_before)  -- idempotency

-- Phase 3+ tables below

camps  -- (Phase 3)
  id uuid PK
  operator_id uuid FK → users (role=operator)
  slug text UNIQUE
  name text
  description text
  age_min int
  age_max int
  price_exact_cents int  -- exact, not range
  extended_care_offered boolean
  extended_care_hours text NULL
  categories text[]
  city text
  state text
  latitude decimal
  longitude decimal
  website_url text
  image_url text
  is_launch_partner boolean DEFAULT false
  launch_partner_until date NULL
  verified_at timestamp NULL  -- admin review
  created_at timestamp

camp_sessions  -- (Phase 3)
  id uuid PK
  camp_id uuid FK → camps
  start_date date
  end_date date
  spots_available int

saved_camps  -- (Phase 3)
  id uuid PK
  user_id uuid FK → users
  camp_id uuid FK → camps
  created_at timestamp

website_clicks  -- NEW in v3.1, for operator analytics
  id uuid PK
  camp_id uuid FK → camps
  user_id uuid FK → users NULL
  clicked_at timestamp
  user_agent text
```

**RLS policies:**
- Parents can read closures WHERE `status='verified'`. Read all schools. Write only their own `reminder_subscriptions` and `saved_camps`.
- Operators can read/write only their own camps (Phase 4). Read aggregated analytics only.
- Admins have full access for review workflows.

### 5.3 AI Calendar Ingestion (Human-in-the-Loop)

```
1. Admin adds school → provides calendar URL
2. Cron job (weekly) triggers edge function
3. Edge function fetches calendar URL content
4. Claude extracts structured closure data
5. Upsert closures with status='ai_draft', source='ai_parsed'
6. Admin dashboard shows diff: new drafts, changed drafts, removed closures
7. Admin reviews → marks status='verified' or 'rejected'
8. ONLY verified closures are returned by /api/closures to parents
9. Reminder system only schedules sends for verified closures
```

**Hard rule:** No `ai_draft` row is ever shown to parents or triggers a reminder send. Human review is a production gate, not a nice-to-have.

### 5.4 API Routes

```
GET  /api/closures?school_id=X&after=DATE     — list verified upcoming closures
GET  /api/camps?age_range=7-9&category=soccer — search verified camps (Phase 3)
POST /api/camps                                — operator creates (Phase 4)
PUT  /api/camps/:id                            — operator edits (Phase 4)
POST /api/camps/:id/click                      — track outbound click (Phase 4)
GET  /api/weather?date=YYYY-MM-DD              — proxy to Open-Meteo
POST /api/reminders/subscribe                  — email + school_id + age_range
GET  /api/reminders/unsubscribe?token=X        — one-click unsubscribe
POST /api/ai/plan-break                        — cached by (closure_id, age_range) (Phase 5)
POST /api/ai/chat                              — rate-limited (Phase 5)
POST /api/ai/parse-calendar                    — admin-only, writes drafts (Phase 5)
POST /api/auth/signup                          — create account
POST /api/auth/login                           — sign in
```

### 5.5 COPPA & Privacy Design (NEW in v3.1)

School's Out! serves parents, but collects contextual data about their children (ages, schools). This creates COPPA exposure that the v3.0 spec did not adequately address. v3.1 is designed to minimize that exposure.

**Data minimization principles:**

1. **No kid names on server.** Ever. Client-side only.
2. **No exact kid ages on server.** Only age ranges: 4–6, 7–9.
3. **No specific schools tied to users.** District and type only.
4. **No kid photos.** Ever.
5. **No kid behavioral tracking.** Analytics keyed to parent account only.
6. **Encrypted at rest.** Supabase defaults handle this.
7. **Auto-purge inactive accounts after 12 months.**

**Consent flow:**
- Explicit parental-consent checkbox at signup, COPPA-compliant language.
- Text drafted by a lawyer (budget $500–1500).
- Consent timestamp stored in `users.coppa_consent_at`.
- Re-consent required after material privacy policy changes.

**Privacy policy + ToS:** drafted by a lawyer before public launch. Not optional. Budget $500–1500. File a DPIA (Data Protection Impact Assessment) for internal records.

**Breach response plan:** documented before launch. Who gets notified, how, in what time window (72 hours for GDPR, reasonable promptness for COPPA).

### 5.6 Email Reminder Pipeline (NEW in v3.1)

```
1. Parent signs up via home CTA: email + school_id + age_range
2. Magic-link confirmation (Resend)
3. Daily cron (8am ET) queries closures WHERE status='verified' AND
   start_date IN (today + 3 days, today + 7 days, today + 14 days)
4. For each closure × matching subscription:
   - UPSERT into reminder_sends (idempotency via UNIQUE constraint)
   - Render bilingual template in user's preferred_language
   - Send via Resend
5. Resend webhooks update opened_at, clicked_at on reminder_sends
6. Unsubscribe link embeds one-click token → GET /api/reminders/unsubscribe
```

**Sending limits:** max 1 email per day per user. If Spring Break overlaps with a teacher workday, combine into one digest.

## 6. UX / Conversion Optimization

### 6.1 First-Time User Flow (< 30 seconds to value)

```
Landing → Auto-detect Spanish/English from Accept-Language
  → "Find Your School" search bar (no signup required)
  → Select school
  → Instantly see next 3 closures
  → PRIMARY CTA: "Get reminded before every break" → email input
  → Email confirmation → reminder subscription active
  → Optional: full account for saved camps (Phase 3)
```

**Key principle:** Email signup is the primary conversion. Saved camps, account creation, and onboarding are secondary. The MVP is: see calendar → subscribe to reminders.

### 6.2 Conversion Levers

| Element | Purpose |
|---------|---------|
| **Countdown badge** on home | Creates urgency ("Spring Break in 12 days!") |
| **"Get reminders" CTA** | Primary conversion — the retention mechanism |
| **Countdown in reminder emails** | "3 days to Spring Break — have you planned it?" |
| **Launch Partner camps** yellow highlight | Social proof + operator value prop |
| **Co-parent share link** | Viral loop; also helps shared-custody families |
| **Bilingual UX** | 60%+ more of Miami-Dade addressable |
| **Exact price display** | Differentiator vs. camps hiding prices |
| **Extended-care badge** | Answers the #1 hidden question for working parents |
| **Empty state in Saved** | Friendly nudge to Camps tab |

### 6.3 Navigation
- **Bottom tab bar** (mobile-first): Home 🏠, Camps 🏕️, Saved ⭐, Profile 👤.
- Language toggle always visible top-right.
- Every card tappable — no dead UI.
- Deep links: `schoolsout.net/closures/spring-break-2026` → direct share.

### 6.4 Design System
(Unchanged from v3.0.)

- **Palette:** Deep purple (#1a0b2e) → blue (#0b1d3a) gradient background, white text, yellow (#facc15) CTAs, emerald (#10b981) success states.
- **Typography:** Plus Jakarta Sans display + system sans-serif body.
- **Cards:** Rounded-2xl, white/10 glass effect, hover lift animation.
- **Badges:** Rounded-full, bold, small text, color-coded by type.
- **Spacing:** Generous — never cramped. 16px minimum between tappable elements.
- **Loading states:** Skeleton screens, never spinners.
- **Empty states:** Friendly illustration + clear CTA, never blank.

## 7. Monetization (Revised)

| Revenue Stream | Price | Phase |
|----------------|-------|-------|
| Camp listing (self-serve) | FREE | 1 |
| Launch Partner Featured | FREE for 90 days | 1 |
| Featured Listing | $29/mo | 2 (unlocked at 1,000 MAU or 500 reminder subs) |
| Sponsored Closure Card | $149/mo | 3 |
| Parent Premium (ad-free, early notifications, unlimited AI) | $4.99/mo | 3 |
| Performance pricing (per verified click) | $3–5/click | 3 (alternative to monthly) |
| Direct Booking Commission | 5% per booking | 4 |

**MVP revenue target: $0.** We earn the right to charge by proving audience.

## 8. Success Metrics (Revised)

| Metric | Phase 0 (Week 2) | Phase 1 (Week 6) |
|--------|-----------------|-----------------|
| Parents visiting home page | 100 | 500 |
| **Reminder email signups** | **50** | **200** |
| Reminder email open rate | — | > 40% |
| Reminder email click rate | — | > 10% |
| Schools with verified calendars | 1 | 10 |
| Launch Partner camps signed | 0 | 10 |
| Bilingual sessions (% Spanish) | — | 15%+ |
| Time to first value (see closures) | < 30s | < 30s |

**Phase 1 success gate:** 200 reminder subscribers + 40% open rate. If we hit this, Phase 2 begins. If we miss, iterate on Phase 1 before building more.

## 9. What's NOT in MVP

- Direct booking / checkout inside the app
- Parent reviews of camps (Phase 2)
- Push notifications (email-only in Phase 1)
- Native iOS/Android apps (PWA first)
- School admin self-service calendar upload (Phase 3)
- Paid Featured subscriptions (Phase 2+)
- Parent Premium subscriptions (Phase 3)
- Multi-city / multi-state support (Phase 2+)
- Parent referral program (Phase 2)
- Stripe (Phase 2+)

## 10. Resolved Decisions (formerly Open Questions)

| Question | v3.1 Decision |
|----------|---------------|
| Operator verification method? | Manual admin review; low volume at launch makes it cheap. |
| Price for Featured listings? | FREE at MVP (Launch Partner). $29/mo unlocked at 1,000 MAU. |
| AI chat for anonymous users? | Yes, rate-limited to 3/day per session. |
| Multi-city camps? | Out of scope Phase 1. Miami-only. |
| Referral / invite program? | Phase 2. Share-link on closures is the Phase 1 viral primitive. |
| Language support? | **Spanish day one.** Not deferrable for Miami market. |
| Kid data persistence? | **Client-side only.** COPPA risk reduction. |
| AI-parsed calendar trust? | Human review gate before publish. No unverified data reaches parents. |

## 11. Cold Start Sequence

| Week | Focus | Target |
|------|-------|--------|
| 1 | Phase 0 build: 1 school calendar + reminder signup | Build done |
| 2 | Distribute (PTO email, NextDoor, WhatsApp) | 50 signups |
| 3–4 | Add 9 more schools; continue distribution | 200 signups |
| 5 | Walk-in sales to 10 local camps, Launch Partner offer | 5 yeses |
| 6+ | Phase 2 build begins **only if gate met** | — |

**Gate to Phase 2:** 200 reminder subscribers + 40% open rate + 10 verified school calendars.

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Parents visit once, never return | Email reminders = core Phase 1 feature |
| Can't close first 10 camps | Parent traffic + Launch Partner free offer + in-person sales |
| Google/Apple eat the calendar layer | Differentiate on camps + breaks, not calendars |
| AI-parsed bad data erodes trust | Human review gate before publish |
| COPPA incident | Kid data client-side only; lawyer-drafted policy |
| Solo-dev burnout | Ship 2-week MVP first, earn further scope |
| Noah disengagement | Noah-shaped ownership: picks emojis, names closures, writes blurbs, stars in demo video |
| AI token costs | Aggressive caching, rate limits, Phase 5 not Phase 1 |

---

**End of v3.1 PRD.**
