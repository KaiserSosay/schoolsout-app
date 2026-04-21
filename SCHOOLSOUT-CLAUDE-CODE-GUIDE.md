# School's Out! — Claude Code Build Guide

## How to Use This File

This is a step-by-step guide for building School's Out! v3 using Claude Code CLI.
Run each phase as a separate Claude Code session. Copy the prompt, paste into Claude Code.
Read the PRD (SCHOOLSOUT-PRD.md) first — it's the source of truth.

---

## PHASE 0: Project Setup

```
Prompt for Claude Code:
========================

Initialize a new Next.js 14 project called "schoolsout" with:
- App Router (not Pages)
- TypeScript
- Tailwind CSS 4
- ESLint
- src/ directory

Then:
1. Install dependencies: @supabase/supabase-js @supabase/ssr stripe @anthropic-ai/sdk zod
2. Install dev dependencies: @types/node
3. Create this folder structure:

src/
  app/
    layout.tsx          -- root layout with dark purple gradient bg, Plus Jakarta Sans font
    page.tsx            -- landing / home page
    camps/
      page.tsx          -- camps marketplace
      [slug]/page.tsx   -- camp detail
    closures/
      [id]/page.tsx     -- closure detail
    saved/page.tsx      -- saved camps
    profile/page.tsx    -- user profile
    onboarding/page.tsx -- 3-step onboarding
    operator/
      page.tsx          -- camp operator dashboard
      add/page.tsx      -- add a camp form
    api/
      closures/route.ts
      camps/route.ts
      weather/route.ts
      ai/plan-break/route.ts
      ai/chat/route.ts
      ai/parse-calendar/route.ts
      webhooks/stripe/route.ts
  components/
    BottomNav.tsx       -- 4 tabs: Home, Camps, Saved, Profile
    ClosureCard.tsx     -- gradient card with emoji, date, countdown
    CampCard.tsx        -- camp listing card with save button
    AgeToggle.tsx       -- switch between kids
    WeatherWidget.tsx   -- real forecast or fallback
    CategoryBubbles.tsx -- filter chips
    PlanMyBreak.tsx     -- AI break planner
    SearchBar.tsx       -- camp search with autocomplete
    Badge.tsx           -- break type badges
  lib/
    supabase/
      client.ts         -- browser Supabase client
      server.ts         -- server Supabase client
      middleware.ts      -- auth middleware
    openmeteo.ts        -- weather API helper
    anthropic.ts        -- Claude API helper
    stripe.ts           -- Stripe helper
    types.ts            -- TypeScript types matching DB schema
    constants.ts        -- categories, monthly averages, etc.
  hooks/
    useWeather.ts
    useSavedCamps.ts

4. Create .env.local.example with:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ANTHROPIC_API_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

5. Set up Tailwind config with the School's Out! design tokens:
   - Colors: purple-deep (#1a0b2e), purple-mid (#2d1b4e), blue-deep (#0b1d3a), cta-yellow (#facc15)
   - Font: Plus Jakarta Sans from Google Fonts

6. Create a README.md explaining the project and how to run it locally.

Commit with message: "Initial project setup with Next.js 14 + Tailwind + folder structure"
```

---

## PHASE 1: Database + Auth + Reminders + Spanish i18n

**Updated for v3.1.** Phase 1 now includes email reminders and Spanish localization as core MVP features. The `kids` table is eliminated — kid profile data stays client-side. Camps and operator features are deferred to Phases 3–4.

```
Prompt for Claude Code:
========================

Read SCHOOLSOUT-PRD_1.md (v3.1) for the full database schema and COPPA privacy design.

1. Create a Supabase migration file at supabase/migrations/001_initial_schema.sql with these tables ONLY:
   - users (extends Supabase auth.users, with preferred_language enum, coppa_consent_at, zip_code, role)
   - schools
   - closures (with status enum: 'ai_draft' | 'verified' | 'rejected')
   - reminder_subscriptions
   - reminder_sends (with UNIQUE (subscription_id, closure_id, days_before) for idempotency)

   Do NOT create a `kids` table. Kid profile data (names, exact ages) lives client-side in localStorage only.
   Do NOT create `camps`, `camp_sessions`, `saved_camps`, or `website_clicks` tables — those come in Phase 3.

   Indexes:
   - closures(school_id, start_date, status)
   - reminder_subscriptions(user_id, school_id)
   - reminder_sends(sent_at), reminder_sends(closure_id)

   RLS policies:
   - Anonymous: can read schools and closures WHERE status='verified'. No writes.
   - Authenticated parents: can read schools/verified closures; write only their own reminder_subscriptions.
   - Admins: full access (needed for calendar verification workflow in Phase 5).
   - Operators: deferred to Phase 4.

2. Create a seed file at supabase/seed.sql with:
   - 2 schools: The Growing Place (private), Coral Gables Prep (public/M-DCPS)
   - All closures for both schools with status='verified', source='manual'
   - 1 test admin user

3. Set up Supabase Auth in src/lib/supabase/:
   - client.ts: createBrowserClient
   - server.ts: createServerClient for Server Components
   - middleware.ts: refresh session on every request

4. Create src/middleware.ts running the Supabase auth middleware.

5. Install next-intl and set up bilingual support:
   - npm install next-intl
   - Create src/i18n/messages/en.json and src/i18n/messages/es.json for all UI strings
   - Use Claude to translate en.json → es.json; flag for native-speaker review before launch
   - Configure next-intl with 'en' default, 'es' supported, auto-detect via Accept-Language
   - URL strategy: /en/* and /es/*; persist choice in a cookie
   - Build a LanguageToggle component (top-right of every page)

6. Build the auth pages (all under /[locale]/):
   - /login: Email + password, Google OAuth, magic-link option
   - /signup: Email + password, COPPA parental consent checkbox with lawyer-drafted placeholder text (TODO comment for final legal copy)
   - Signup writes users.coppa_consent_at = now() on consent
   - Signup redirects to /onboarding
   - All copy routed through next-intl

7. Build onboarding (3 screens, all skippable):
   - /[locale]/onboarding
   - Step 1: "What district?" — Miami-Dade public, private, charter (NOT a specific school)
   - Step 2: "Age ranges in your family?" — multi-select bubbles for 4-6, 7-9 (client-side only, saved to localStorage — never sent to server)
   - Step 3: "Get reminder emails?" — primary CTA, defaults to Yes, populates reminder_subscriptions
   - Progress dots at top, "Skip" link, "Next" button

8. Install Resend and implement the email reminder pipeline:
   - npm install resend
   - src/lib/resend.ts: client + send helper
   - src/lib/email/templates/reminder-en.tsx and reminder-es.tsx (React Email components)
   - src/app/api/reminders/subscribe/route.ts: POST { email, school_id, age_range, preferred_language } →
     - Creates or reuses users row (role='parent', coppa_consent_at=now())
     - Creates reminder_subscription
     - Sends magic-link confirmation email via Resend
   - src/app/api/reminders/unsubscribe/route.ts: GET with one-click token → disables subscription (CAN-SPAM compliant)
   - Daily cron (8am ET via Vercel Cron or Supabase scheduler):
     - Query closures WHERE status='verified' AND start_date IN (today+3, today+7, today+14)
     - For each match × reminder_subscription:
       - UPSERT into reminder_sends (idempotency via UNIQUE constraint)
       - Render bilingual template in subscriber's preferred_language
       - Send via Resend
   - Resend webhook handler at src/app/api/webhooks/resend/route.ts to update opened_at, clicked_at

9. Add the home-page email reminder signup CTA (primary Phase 1 conversion):
   - Email input + "Remind me before every break" / "Recuérdame antes de cada vacación" button
   - Posts to /api/reminders/subscribe
   - Shows "Check your email / Revisa tu correo" on success
   - Available without full account (anonymous + email-only signup)
   - Must be above the fold on desktop and mobile

Design notes:
- Primary CTA color: cta-yellow (#facc15)
- Large tap targets (min 44px), instant validation, skeleton loading (never spinners)
- Error states: red, with clear actionable messages in the user's language
- Dark purple gradient background everywhere
- Language toggle always visible in the header
- Every user-facing string goes through next-intl — no hardcoded English

Commit: "Phase 1: Supabase schema, auth, Spanish i18n, email reminders"
```

---

## PHASE 2: Core Pages (Home + Closures + Weather)

```
Prompt for Claude Code:
========================

Read SCHOOLSOUT-PRD.md for feature details.

Build the Home page and Closure detail page:

1. src/app/page.tsx (Home):
   - If logged in: show AgeToggle with user's kids, personalized closures
   - If anonymous: show "Find Your School" search bar → select school → show closures
   - Next 3 closures as big gradient cards (purple/red/blue rotating)
   - Each card: emoji, closure name, school name, date range, countdown badge ("in 12 days!")
   - Below cards: accordion with "Rest of School Year" — all remaining closures
   - Tapping any closure → /closures/[id]
   - Cards animate in with staggered fade-up on load
   - Bottom: "Don't see your school? Request it" link

2. src/app/closures/[id]/page.tsx (Closure Detail):
   - Big emoji header
   - Closure name, school name badge, date range
   - Break type badge: ⚡3-Day Weekend (3 days), 🎉 Long Break (5+), ☀️ Summer
   - WeatherWidget component showing forecast
   - "Activity Ideas" section — short break: "Beach day, museum, playdate" / long break: "Book a camp, family trip, project week"
   - "Plan My Break" button → calls /api/ai/plan-break, shows AI-generated day plan
   - "Book a Camp Now" yellow CTA → /camps?closure_id=X (pre-filters by date + age)

3. src/lib/openmeteo.ts:
   - fetchForecast(date: string): fetches from Open-Meteo API for Coral Gables coords
   - If date is within 16 days of today: return real forecast
   - If further out: return Miami monthly averages from constants.ts
   - Cache responses in memory for 1 hour to avoid hammering the API

4. src/components/WeatherWidget.tsx:
   - Shows high/low temp, weather icon (sun/cloud/rain based on weathercode)
   - If using monthly average, show ⚠️ "Average for [month]"
   - If real forecast, show "Forecast" badge

5. src/api/weather/route.ts:
   - GET ?date=YYYY-MM-DD → returns weather data
   - Server-side fetch to Open-Meteo (avoids CORS)

Design notes:
- Closure cards use these gradient combos, rotating: 
  1. purple (#7c3aed → #4c1d95)
  2. red (#dc2626 → #7f1d1d)  
  3. blue (#2563eb → #1e3a8a)
- Countdown badge: emerald green if ≤7 days, amber if ≤30, gray otherwise
- All text white, generous padding (p-6 on cards)
- Use framer-motion or CSS animations for card stagger

Commit: "Build Home page, Closure detail, and weather integration"
```

---

## PHASE 3: Camps Marketplace

```
Prompt for Claude Code:
========================

Read SCHOOLSOUT-PRD.md for camp feature details.

1. src/app/camps/page.tsx:
   - SearchBar at top with autocomplete (searches camp names)
   - CategoryBubbles row — horizontally scrollable, tappable filter chips
   - Sort dropdown: Relevance, Price (low→high), Rating
   - If age toggle is set, auto-filter by kid's age
   - If arrived from closure detail (?closure_id=X), show banner "Camps available during [Break Name]"
   - Camp cards in a vertical list
   - Featured camps: yellow border-2, "Featured ⭐" badge, sorted to top
   - Infinite scroll or "Load More" button

2. src/components/CampCard.tsx:
   - Camp name (bold), age range, price range ($–$$$)
   - Category chips (first 2 only, "+3 more" if overflow)
   - ☆ save button (top right) — toggles to ⭐ when saved
   - If featured: yellow left border + "Featured" micro-badge
   - Entire card is tappable → /camps/[slug]

3. src/app/camps/[slug]/page.tsx (Camp Detail):
   - Hero image (or gradient placeholder if no image)
   - Camp name, operator name
   - Age range badge, price badge, location with mini-map
   - Full description paragraph
   - Category chips (tappable → go back to /camps filtered)
   - Session dates (if available)
   - "Save Camp" button (full width, toggles)
   - "Visit Website" button (full width, yellow, opens in new tab)
   - If featured: subtle "Featured Camp" banner at top

4. src/app/saved/page.tsx:
   - List of saved camps (same CampCard component)
   - Empty state: fun illustration area + "No saved camps yet — explore camps!" with button to /camps
   - Can unsave from this page

5. src/api/camps/route.ts:
   - GET: query params for age, category, city, search, sort, featured_first
   - Returns paginated results, featured camps first

Design notes:
- Category bubbles: rounded-full, small text, bg-white/10 default, bg-purple-600 when active
- Save animation: brief scale-up pulse when tapping ☆
- Camp cards: bg-white/10 backdrop-blur, rounded-2xl, hover:translate-y-[-2px]
- Price display: use $ symbols not exact numbers ($$$ = $300+/week, $$ = $100-300, $ = under $100)
- Mobile-first: single column, full-width cards

Commit: "Build Camps marketplace, camp detail, and saved camps"
```

---

## PHASE 4: Camp Operator Self-Service

```
Prompt for Claude Code:
========================

Read SCHOOLSOUT-PRD.md for operator features.

1. src/app/signup/page.tsx — add a "I'm a Camp Operator" toggle that switches to operator signup:
   - Business name, business email, website
   - After signup, role=operator, redirect to /operator

2. src/app/operator/page.tsx (Operator Dashboard):
   - Header: "Your Camps" with "Add a Camp" button
   - List of operator's camps with stats: views, saves, website clicks (read from analytics table)
   - Each camp card has "Edit" and "Feature This Camp" buttons
   - If no camps yet: "List your first camp — it's free!" CTA

3. src/app/operator/add/page.tsx (Add/Edit Camp Form):
   - Fields: name, description (textarea), age_min, age_max (number pickers), price_min, price_max
   - Category multi-select (checkboxes styled as bubbles)
   - Location: city + state dropdowns (or text input)
   - Website URL
   - Image upload (to Supabase Storage)
   - Session dates: repeating date range inputs ("Add another session")
   - "Save as Draft" and "Publish" buttons
   - Form validation with zod — all fields required except image and sessions

4. Featuring flow:
   - "Feature This Camp" button on operator dashboard → shows pricing ($29/month)
   - Stripe Checkout session → on success, set is_featured=true, featured_until=+30 days
   - src/api/webhooks/stripe/route.ts: handle checkout.session.completed and subscription events

5. src/api/camps/route.ts — add POST (create) and PUT (update) handlers:
   - Verify user is operator via Supabase auth
   - Validate body with zod schema
   - On create: generate slug from camp name
   - On update: verify operator owns this camp

Design notes:
- Operator pages use a slightly different header/badge so they know they're in "business mode"
- Form inputs: large, clear labels above, rounded-xl borders, focus ring in purple
- Success state: green banner "Camp published! It's now live on School's Out!"
- The operator dashboard should feel professional but still match the app's fun aesthetic

Commit: "Add camp operator dashboard, camp creation, and Stripe featuring"
```

---

## PHASE 5: AI Features

```
Prompt for Claude Code:
========================

Read SCHOOLSOUT-PRD.md for AI feature details.

1. src/lib/anthropic.ts:
   - createClient() helper that initializes Anthropic SDK
   - parseCalendar(rawText: string): sends calendar text to Claude, returns structured JSON
   - planBreak(closure, kidAge, camps): generates day-by-day break plan
   - chatAnswer(question, context): answers parent questions about camps/closures

2. src/api/ai/parse-calendar/route.ts:
   - POST: accepts { school_id, calendar_url }
   - Fetches the URL content (HTML or PDF text extraction)
   - Sends to Claude with system prompt:
     "You are a school calendar parser. Extract all school closures, holidays, teacher workdays, and breaks from this calendar. Return ONLY a JSON array: [{name, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), emoji}]. No other text."
   - Upserts results into closures table with source='ai_parsed', verified=false
   - Protected: admin only

3. src/api/ai/plan-break/route.ts:
   - POST: accepts { closure_id, kid_age }
   - Fetches closure details + matching camps from DB
   - Sends to Claude:
     "You are a fun, helpful parent assistant. Given this school break and these available camps, create a day-by-day plan for a [age]-year-old. Mix camps with free activities. Be specific with camp names. Keep it to 3 sentences per day. Return JSON: [{day: 'Monday Mar 23', activity: '...', camp_name: '...' or null, is_free: boolean}]"
   - Returns structured plan

4. src/api/ai/chat/route.ts:
   - POST: accepts { message, context: { closure_id?, kid_age? } }
   - Loads relevant closures + camps into context
   - Claude answers in 2-3 sentences, friendly tone
   - Streams response back

5. src/components/PlanMyBreak.tsx:
   - Button that triggers the API call
   - Shows loading skeleton (3 day-card placeholders shimmer)
   - Displays results as a mini day-by-day timeline
   - Each day card: date, activity description, camp name (tappable → camp detail), free/paid badge

6. Add a chat bubble button (💬) to closure detail pages:
   - Opens a slide-up chat panel
   - Pre-loaded with context: "You're looking at [Break Name] for a [age]-year-old"
   - Parent can ask questions, Claude responds from camp/closure data
   - Keep last 5 messages in state (no persistence needed for MVP)

Important:
- All AI API calls happen server-side only (API key never exposed to browser)
- Add rate limiting: max 10 AI requests per user per hour
- Cache plan-break results in DB so the same closure+age combo doesn't re-call Claude
- Token budget per call: max_tokens=500 for plan-break, 300 for chat

Commit: "Add AI calendar parsing, break planner, and chat features"
```

---

## PHASE 6: Polish, OG Tags, and Deploy

```
Prompt for Claude Code:
========================

Final polish pass:

1. Add Open Graph meta tags to src/app/layout.tsx:
   <meta property="og:image" content="https://schoolsout.net/schools-out-og.png">
   <meta property="og:title" content="School's Out!">
   <meta property="og:description" content="Plan something awesome for every day off. Miami school closures, camps, and activities for ages 4–9.">
   (Full set of OG + Twitter Card tags from the PRD)

2. Add PWA manifest:
   - public/manifest.json with name, icons, theme_color (#1a0b2e), background_color
   - Add <link rel="manifest"> to layout
   - This lets parents "Add to Home Screen" on iPhone/Android

3. Loading and error states everywhere:
   - Every page gets a loading.tsx with skeleton shimmer matching the layout
   - Every page gets an error.tsx with friendly error message + retry button
   - Camp images get blur placeholder while loading

4. Accessibility pass:
   - All buttons have aria-labels
   - Color contrast meets WCAG AA on all text
   - Tab order is logical
   - Screen reader announces page changes

5. Performance:
   - Images use next/image with lazy loading
   - Camp list uses React.memo to prevent unnecessary re-renders
   - Weather API calls are cached server-side (revalidate: 3600)

6. Create vercel.json if needed, ensure build works:
   - Run `npm run build` and fix any TypeScript errors
   - Test locally with `npm run dev`

7. Update README.md with:
   - Setup instructions (env vars, Supabase setup, Stripe setup)
   - How to run locally
   - How to deploy to Vercel
   - Architecture diagram (text-based)

Commit: "Polish, PWA manifest, accessibility, and deploy config"
```

---

## DEPLOYMENT CHECKLIST (for Rasheid)

Before going live, Rasheid needs to:

1. [ ] Create Supabase project → get URL + keys → add to .env
2. [ ] Run the migration SQL in Supabase SQL editor
3. [ ] Run seed.sql to populate initial data
4. [ ] Create Anthropic API key → add to .env
5. [ ] Create Stripe account + Stripe Connect → add keys to .env
6. [ ] Push repo to GitHub
7. [ ] Connect GitHub repo to Vercel
8. [ ] Add all env vars in Vercel dashboard
9. [ ] Point schoolsout.net DNS to Vercel
10. [ ] Test: signup flow, camp browsing, saving, weather, AI chat
11. [ ] Run AI calendar parser on both school calendars
12. [ ] Invite 5 local camp operators to list (free + offer first month Featured free)

---

## COMMANDS CHEAT SHEET

```bash
# Start Claude Code
claude

# In Claude Code, paste any Phase prompt above

# Local development
npm run dev

# Build check
npm run build

# Deploy (after Vercel setup)
vercel --prod

# Run Supabase migrations
npx supabase db push

# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```
