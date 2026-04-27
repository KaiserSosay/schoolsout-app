# **SCHOOL'S OUT! — THE WHOLE PLAN**

> The whiteboard version. Plain language, no jargon. Top-to-bottom. ✅ done · ⏳ in progress · 📋 coming up.

## 🎯 The North Star (write this at the very top)

**Make it crazy easy for busy Miami parents to plan camps and activities when school is closed. Camps pay us — parents never do. Keep it trustworthy and stable.**

Four words guide every decision: **Easy. Responsive. Profitable. Trusted.**

---

## ✅ PHASE 0 — The Foundation (DONE)

Built the basics. Like pouring the foundation of a house before you can put up walls.

- The website exists at schoolsout.net
- People can sign up with an email
- We can send them reminders before school closes
- The site speaks English AND Spanish
- It works on phones

---

## ✅ PHASE 1 — The App for Logged-In Parents (DONE)

Once they sign up, they get a real app. Like the difference between seeing a restaurant from the outside and actually sitting at a table.

- Parents add their kids' info
- They see a dashboard with what's coming up
- They can browse camps and save the ones they like
- There's a kid-friendly version with fun colors

---

## ✅ PHASE 2 — Trust + The Public Directory (DONE)

This is when School's Out! got real. We made it so parents could trust the data, AND we opened the camp directory to the whole internet so Google could find us.

- Verified all the school holidays for Miami-Dade Public Schools (both this year and next year)
- Got 108 real Miami camps in the directory
- Built the "Plan This Day" wizard (the magic button)
- Made it so anyone can browse camps without signing up
- Set up the website so Google can find us
- Built tools so admins can review new camp applications
- Made security strong so only the right people can see admin pages

---

## ⏳ PHASE 3 — Noah's Brain Dump (MOSTLY DONE)

The big list of fixes and features Noah came up with after looking at the live site. Most are shipped. A few big ones are queued up.

**Already shipped:**
- Fixed the broken animations
- Backpack 🎒 favicon
- "Install on your phone" instructions
- Made every date clickable (no more dead clicks!)
- Removed Dad's name from anywhere parents can see it
- Honest "vibe-coded by Noah in Claude in spring 2026" credit
- Re-wrote /how-we-verify to be honest that we use AI to help
- School autocomplete (parents type their school, we find it)

**Still to come:**

### ✅ Phase 3.1 — Camp Operator Dashboard (shipped 2026-04-26 overnight)
Right now, when a camp wants to update their info, they have to email us. That's slow. This builds them their own login where they can update hours, photos, sessions, AND check off "we're open" or "we're closed" for every Miami school holiday. **This is the feature that makes the whole business work** — camps with good info get parents, camps with bad info don't.

Sub-tasks (all ✅):
- **3.1.1** Migration 030 — `camp_operators` + `camp_closure_coverage` tables + RLS
- **3.1.2** Migration 031 — operator-editable columns on `camps` (`scholarships_notes`, `accommodations`, `photo_urls`)
- **3.1.3** OperatorWelcomeEmail template (EN + ES) + magic-link invite on application approve (gated behind `ALLOW_OPERATOR_INVITE_EMAILS=true` so no real applicants get emailed yet)
- **3.1.4** `/{locale}/operator/{slug}` server-component dashboard with 404-on-anything-else access gate, edit form for every editable camp field, and listing-quality meter
- **3.1.5** Closure-coverage checklist on the dashboard with debounced per-row save to `camp_closure_coverage`
- **3.1.6** Parent-side surfacing — `/breaks/{id}` floats explicitly-open camps to the top, drops explicitly-closed camps, renders a green "✓ Open this day" pill on the matching cards

### ✅ Phase 3.6 — Live iCal Feed Sync 📡 (shipped 2026-04-26)
Three anchor schools (Gulliver, Ransom Everglades, Scheck Hillel) publish
live iCal feeds. This phase wires nightly sync so calendar updates land in
our DB without a re-pull. Bigger long-term win than another one-time PDF
import.

Sub-tasks (all ✅ except #4):
- **3.6.1** Migration 032 — `ical_feed_url`, `ical_last_synced_at`,
  `ical_sync_error` columns on `schools`, plus seeded URLs for the three
  feed-publishing schools (NOT applied — Rasheid review first)
- **3.6.2** `src/lib/ical/sync.ts` — testable per-school sync helper that
  reuses `parseIcsString()` and the closure-keyword filter from migration
  029's parser, UPSERTs onto the closures unique index, records errors on
  the school row
- **3.6.3** `/api/cron/sync-ical-feeds` route + `vercel.json` schedule
  `0 5 * * *` (5am UTC daily), bearer-auth via `CRON_SECRET`
- **3.6.4** Manual `scripts/sync-ical-feeds.ts` for one-shot runs (slug
  filter optional)
- **3.6.5** ⏸️ Admin UI surface for sync status (deferred — covered by
  the existing schools panel; promote to a follow-up if dogfooding shows
  it's needed)
- **3.6.6** Tests in `tests/lib/ical-sync.test.ts` cover happy path,
  HTTP error, network throw, no-feed no-op, and the negative-keyword
  filter (so "Holiday Concert" never imports as a closure)

### ✅ Phase 3.5 — Admin Dashboard Accuracy Fixes 🐛 (shipped 2026-04-26)
Sunday-morning bug fix. Pill counts on `/admin` had drifted from what each tab actually rendered, eroding trust in the dashboard.

Sub-tasks (all ✅):
- **3.5.1** Extracted `computePillCounts()` to `src/lib/admin/pill-counts.ts` so the same query that backs the pill is the only thing the dashboard reads — no parallel-truth math in `page.tsx`
- **3.5.2** Dropped the `status='new'`/`status='pending'` filters that made `featureRequests`, `campRequests`, and `schoolRequests` pills undercount the rows their tabs render
- **3.5.3** Switched `dataQuality` pill to a single distinct-camps query so camps with multiple gaps stop being double- and triple-counted
- **3.5.4** Renamed pill labels for honesty: "Camp requests" → "Camp applications" (matches DB), "Calendar reviews" → "Calendar drafts", "Integrity warnings" → "Integrity issues"
- **3.5.5** Fixture-based `tests/lib/admin-pill-counts.test.ts` proves each pill matches the loader query for its tab and the helper is schema-defensive against missing migrations

### 📋 Phase 3.2 — Per-Kid Plans
Right now if you save a "Memorial Day plan," it's for the whole family. But what if Noah goes to one camp and his sister goes somewhere else? This makes plans work per-kid, with a dashboard grid showing who's covered when.

### 📋 Phase 3.3 — Better Camp Data
The 108 camps don't all have addresses. This phase fills in the gaps.

### 📋 Phase 3.4 — Beyond Closures: half days, school events, theme days 🌟 (NOAH'S IDEA, 2026-04-26)
Right now we only show parents the days school is **fully** closed. But kids miss out because of the OTHER days too:

- 🕐 **Half days** — early dismissal. Parents need to plan early pickup or after-care.
- 🎨 **Theme days / dress-up days** — "Crazy Hair Day," "Pajama Day," "Spirit Week."
- 🌊 **Special school events** — Water Day at TGP, Field Day, Picture Day, International Day.
- 🎒 **Things to bring** — "bring water clothes," "bring a stuffed animal," "wear red."

**Why this matters (Noah's exact example):** It's Water Day at The Growing Place. The grown-up forgets. The kid shows up in regular uniform. Every other kid is in swim clothes. The kid can't participate. The kid is sad. **This is the feature parents will tell their friends about** — it's the difference between an app that knows when school is closed and an app that prevents bad mornings.

**What we'll build:**
- Schema: extend `closures` (or add a sibling table `school_events`) with a `kind` enum (`closure | half_day | event | theme_day`) and an `attire_or_bring` text field.
- UI: each kind gets its own color + badge so half days don't visually blend into closures, and events stand out with their own emoji.
- **Notifications: if a parent has installed the PWA on their phone, push a reminder the night before AND the morning of any event that has an `attire_or_bring` instruction.** (Powered by Phase 5.3 push notifications.)

**Why it's Phase 3.4 (not Phase 5):** It builds directly on the closure pipeline we already have — same calendar source, same admin review workflow, same email-template system. Mostly schema + UI + one new push-subscription endpoint. ~1 week of build once Dad is free from 3.1 / 3.2.

**Depends on:** Phase 5.3 push notifications (browser Web Push + iOS Add-to-Home-Screen install acceptance + a server-sent-events pipe). The half-day and event UI pieces can ship without 5.3; only the proactive reminders need it.

---

## 📋 PHASE 4 — Launch + Make Real Money

This is when School's Out! becomes a real business with real users and real revenue.

### 4.1 — Stripe Payments
Camps pay $29/month to be Featured. **Dad's task to set up.** Once it's wired, money comes in.

### 4.2 — Real Parents Use It
Send the link to 5 real parent friends. Watch them use it without helping. Their feedback IS what we build next. **This is the most important step in the entire roadmap and the easiest one to skip — DO NOT SKIP IT.**

### 4.3 — Ask Camps to Pay
Email Miami camps and invite them to upgrade. Get the first 3-5 paying customers.

### 4.4 — Make Sure Nothing Breaks
Set up monitoring so we know if the site goes down. Set up backups. Boring but critical.

### 4.5 — Premium Camp Profiles 🌟 (MOM'S IDEA)
**This is the highest-scoring feature on the entire roadmap.** Mom said comparing camps is awful because every camp's website is different. This builds a beautiful, consistent profile page on School's Out! for every Premium camp ($49-79/month). Sample daily schedule. What to bring. Real pricing. Photos. Instructor bios. Parent FAQ. **Mom has to approve the layout before we ship it.**

### 4.6 — Trusted Registration Badge 🛡️ (MOM'S OTHER IDEA)
Mom's biggest frustration: some camps register kids over WhatsApp, others have hidden fees. We can't process payments yet (that's Phase 7), but we CAN give camps a 🛡️ badge if they meet a transparency standard: real registration form, HTTPS, clear pricing, real refund policy, etc. Parents see the badge and know which camps to trust.

### 4.7 — School Operator Dashboard 🏫
Same shape as Phase 3.1 (camp operator dashboard) but for schools. A school admin logs in, edits their school's calendar directly on our platform, uploads photos, manages their listing. The first 10% of this — a public submission form anyone can fill out to propose calendar updates with email-domain auto-verification — ships earlier (see `docs/plans/sunday-evening-three-buckets.md` Bucket 3).

### ✅ 4.5.1 — Featured launch partner trio (SHIPPED 2026-04-27)

Three camps marked as launch-comped Featured via the existing
`is_launch_partner` column (added in migration 006, already wired into
admin metrics, the toggle action, and `CampsAdminClient`). No new
schema — the column was already there; we just hadn't pointed all
three trio members at it yet.

- **Frost Science Summer Camp** (existing `frost-science-summer`) — UPDATE flips `is_launch_partner=true`, leaves `featured_until=2026-07-24` alone (R5).
- **305 Mini Chefs** (new) — mobile culinary education, Coral Gables base, no fixed address. Pricing/ages NULL because not published.
- **Wise Choice Summer Camp** (new) — UM is the anchor address; the other 4 locations live in the description (multi-row split deferred).

Migration `051_featured_launch_trio.sql`. When Stripe billing ships
(Phase 4.1), the billing logic must respect `is_launch_partner=true` —
those rows are comped and should never get charged.

**Tech debt surfaced during this work:** prod has two Frost rows —
`frost-science-summer` (live, featured) and `frost-science-summer-camp`
(unfeatured dupe). Out of scope tonight; track as Phase 3.5.X cleanup.

### ✅ 4.7.1 — Public Calendar Submission Form (SHIPPED 2026-04-26)
First slice of Phase 4.7. Every school detail page now carries a collapsed "Update this school's calendar →" CTA that expands inline into a form open to anyone — parent, teacher, principal, or anonymous. Submissions land in a new `school_calendar_submissions` table (migration 043), trigger an ack email to the submitter and a notify to admin, and surface in `/admin?tab=calendar-submissions`. Email-domain auto-verification compares the submitter's email host to the school's website host — matches bubble to the top of the admin queue. **No row ever auto-writes to `closures`** — admin marks `approved` then later `incorporated` once the dates land via a normal migration. Same R6 trust posture as the iCal pipeline.

**Wording graduation path:** Until Phase 4.7 ships, all hosted school
calendars are labeled "Verified" — meaning we imported and validated
them against the school's published source. After Phase 4.7 ships and
a school admin actively maintains their calendar directly on our
platform, that school's calendar graduates to "Official." This
distinction is honest about who owns the data at any given time. The
i18n keys at `public.school.verifiedFrame.eyebrow*` use "Verified"
today; when 4.7 lands, add a parallel `officialFrame.*` set and
gate which one renders on the school's `operator_managed` flag.

---

## 📋 PHASE 5 — Whatever Real Parents Tell Us

**This phase can't be planned in detail.** We won't know what to build until 5 real parents have used the app for 2 weeks. Their feedback IS Phase 5.

Educated guesses about what might land here:
- **5.1** Co-parent invite (share plans with your partner)
- **5.2** Sync to Google Calendar / Apple Calendar
- **5.3** Push notifications (powers the Phase 3.4 "don't miss Water Day" reminders)
- **5.4** Side-by-side camp comparison
- **5.5** Native iPhone app
- **5.6** AI chat ("when does my kid have school next month?")
- **5.7** 🌟 **The City Race** — a leaderboard where parents in Atlanta, NYC, etc. compete to be the next city we launch in. Earn points by signing up, sharing, inviting friends. First city to 100 points = we launch them in 90 days.
- **5.8** Group deals from camps
- **5.9** Real parent reviews (like Yelp for camps)
- **5.10** Filter by single-day vs full-week
- **5.11** Share calendar with babysitters/grandparents

**Off-limits forever:** running ads at parents, selling email lists, charging parents for premium. North Star says parents are free.

---

## 📋 PHASE 6 — Beyond Miami

Only after Miami is rock-solid AND making money. Going national too early is how directories die.

- Make the system support multiple cities
- Launch Atlanta (or whichever city wins the City Race)
- Then NYC, LA, Chicago, etc.
- More languages (Vietnamese, Mandarin, Korean for the right cities)
- Hire a real team
- Maybe incorporate as a real company

---

## 📋 PHASE 7 — Mature Company Territory

This is where School's Out! becomes a real business with employees, lawyers, and serious money. **Do NOT start any of this until camp revenue covers all our operating costs.**

### 7.1 — Full Payment Processing 💭 (Mom's full Shopify dream)
The big one. All payments go through us. Camps don't manage registration — we do. Parents have ONE place to register their kid for any camp. **But:** this means we'd be a regulated business handling kids' personal info and payments. That triggers COPPA + Stripe Connect + lawyers + insurance + 6 months of work + $30,000+ in upfront costs. **Worth doing eventually. Not worth doing while we're bootstrapped.**

### 7.2-7.6 — Other big ideas
- API for camp software companies
- Become the official partner of Miami-Dade Public Schools
- Sister product for after-school programs
- Maybe get acquired by a bigger company
- Open-source the code so other communities can run their own

---

## 📋 BIG RULES (write these at the bottom)

1. **Mom is the boss of parent UX.** If she can't use it, we built it wrong.
2. **Don't skip the real-parent test in Phase 4.2.** Speculation is cheap. Real users are gold.
3. **Don't go national before Miami is profitable.** That's how directories die.
4. **Don't start Phase 7 until the company covers its own costs.** We're bootstrapped — that means no shortcuts that need outside money.
5. **Camps pay us. Parents never do.**

---

## 🎒 What's HAPPENING RIGHT NOW

**You're here:** Migration 029 (the first 5 anchor private school calendars) is being applied. Once it's in:

- Gulliver Prep, Ransom Everglades, Westminster Christian, Lehrman, and Scheck Hillel get their REAL calendars on the site
- 5 schools go from "Unofficial — help us verify" to fully verified

After that's done, **Phase 3.1 (Operator Dashboard)** is the next big build. That's the feature that makes Phase 4 (real money) actually work.
