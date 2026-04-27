-- Phase 4.5.X — TGP Summer Camp 2026 + featured set swap.
--
-- Three actions:
--   1. INSERT new camp 'the-growing-place-summer-camp' with full flyer data
--   2. Mark Deering Eco + Miami Children's Museum as is_featured=false
--      (keep camp rows in directory; just unflag from Featured)
--   3. Set TGP camp as is_featured=true + is_launch_partner=true
--
-- Rasheid is personally vouching for TGP (his son Noah's school).
-- Same launch-partner posture as Frost / 305 Mini Chefs / Wise Choice.
--
-- Religious tag rationale: TGP is operated by First United Methodist
-- Church of Coral Gables. Programming is secular but venue affiliation
-- is Methodist — the religious badge surfaces this on the card so a
-- parent sees the affiliation upfront. Same lens may apply later to
-- Camp Klurman, Posnack JCC, Cross Bridge Church camp.
--
-- Schema columns referenced (verified against camps table on
-- 2026-04-27 — migrations 003/005/006/013/021/024):
--   slug, name, description, phone, email, website_url, registration_url,
--   address, neighborhood, city, ages_min, ages_max (plural), price_tier,
--   categories, verified, last_verified_at, is_featured, featured_until,
--   is_launch_partner, launch_partner_until, data_source.
--
-- NOT NULL columns without defaults (per migration 003):
--   slug, name, ages_min, ages_max, price_tier — all provided below.
-- price_tier check constraint: must be '$', '$$', or '$$$'.
--
-- Idempotency: INSERT uses ON CONFLICT (slug) DO NOTHING; UPDATEs are
-- already idempotent (setting is_featured=false on already-false rows
-- is a no-op).
--
-- Tagged dollar-quote ($migration$) instead of an untagged outer
-- block, because the price_tier literal '$$' inside the VALUES list
-- would otherwise terminate the surrounding block early (Postgres
-- greedy-matches the next $$ as the closing marker).

DO $migration$
DECLARE
  tgp_school_id UUID;
BEGIN
  -- Verify the TGP school slug exists (sanity-check precondition; we
  -- don't link the camp to the school by id today — camps has no
  -- school_id column — but if the slug is missing the schools table
  -- needs fixing first, which is a different migration.)
  SELECT id INTO tgp_school_id FROM public.schools WHERE slug = 'the-growing-place';
  IF tgp_school_id IS NULL THEN
    RAISE EXCEPTION 'The Growing Place school not found (slug=the-growing-place) — fix schools table first';
  END IF;

  -- 1) Insert TGP Summer Camp 2026.
  INSERT INTO public.camps (
    slug, name, description,
    phone, email, website_url, registration_url,
    address, neighborhood, city,
    ages_min, ages_max,
    price_tier,
    categories,
    verified, last_verified_at,
    is_featured, featured_until,
    is_launch_partner, launch_partner_until,
    data_source
  ) VALUES (
    'the-growing-place-summer-camp',
    'The Growing Place Summer Camp 2026',
    E'Stomp, chomp, and ROAR your way into a dino-mite summer adventure! TGP''s 2026 summer camp is themed around the "How Do Dinosaurs" series by Jane Yolen, with weekly themes spanning friendship, family, pets, birthdays, food, and bedtime.\n\n**Sessions:**\n- **Session One:** June 15 – July 2, 2026 (no camp June 19 + July 3)\n  - Week 1: How Do Dinosaurs Play with Their Friends?\n  - Week 2: How Do Dinosaurs Say I Love You?\n  - Week 3: How Do Dinosaurs Choose Their Pets?\n- **Session Two:** July 6 – July 24, 2026\n  - Week 4: How Do Dinosaurs Say Happy Birthday?\n  - Week 5: How Do Dinosaurs Eat Their Food?\n  - Week 6: How Do Dinosaurs Say Good Night?\n\n**Camp activities:** Arts & Crafts, Cooking, STEM Lab (3s and up), Music & Movement, Water Play, in-house field trips, weekly-theme activities. All activities are age and developmentally appropriate.\n\n**Two daily schedule options:**\n- **Half-day** (9:00 AM – 12:30 PM): $700/session, $1,300/both, $285/week\n- **Full-day** (9:00 AM – 3:00 PM): $800/session, $1,500/both, $315/week\n\n**Required fees per child:**\n- $150 registration fee\n- $150 security fee\n- 50% camp tuition deposit at enrollment (non-refundable, non-transferable)\n- Balance due May 22, 2026\n\n**Optional:** Early Morning Care 8:00–8:45 AM, $40/week flat fee (pre-registration required, no drop-ins). Morning snack included. Lunch from home or via Our Lunches. Pizza Friday every week.\n\n**Note:** Camp is by full session, not by individual week. Additional weekly enrollment available only after registering for at least one full session.\n\n**Enrollment opens:** Thursday, April 2, 2026 at 11:00 AM. Open until full.\n\n**DCF License:** C11MD0470. Operated by First United Methodist Church of Coral Gables (Methodist-affiliated). Affiliated with The Growing Place School.',
    '(305) 446-0846',
    'mwilburn@firstcoralgables.org',
    'https://www.thegrowingplace.school',
    'https://www.thegrowingplace.school/summer-camp',
    '536 Coral Way, Coral Gables, FL 33134',
    'Coral Gables',
    'Coral Gables',
    3,
    10,
    '$$',
    ARRAY['arts', 'stem', 'general', 'religious', 'preschool'],
    true,
    NOW(),
    true,
    NOW() + INTERVAL '90 days',
    true,
    NOW() + INTERVAL '90 days',
    'rasheid-launch-partner-2026-04'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- 2) Remove Deering Eco from featured (camp stays in directory).
  UPDATE public.camps
  SET is_featured = false,
      featured_until = NULL
  WHERE slug = 'deering-estate-eco';

  -- 3) Remove Miami Children's Museum from featured.
  UPDATE public.camps
  SET is_featured = false,
      featured_until = NULL
  WHERE slug = 'miami-childrens-museum-summer';

  -- Verification.
  DECLARE
    featured_count INT;
    launch_partner_count INT;
    tgp_present BOOLEAN;
  BEGIN
    SELECT COUNT(*) INTO featured_count FROM public.camps WHERE is_featured = true;
    SELECT COUNT(*) INTO launch_partner_count FROM public.camps WHERE is_launch_partner = true;
    SELECT EXISTS(
      SELECT 1 FROM public.camps
      WHERE slug = 'the-growing-place-summer-camp' AND is_featured = true
    ) INTO tgp_present;

    RAISE NOTICE 'Featured camps after migration: % (expected 4 — 305 + Wise Choice + Frost + TGP)', featured_count;
    RAISE NOTICE 'Launch partners after migration: % (expected 4)', launch_partner_count;
    RAISE NOTICE 'TGP Summer Camp present and featured: %', tgp_present;

    IF featured_count <> 4 THEN
      RAISE WARNING 'Expected exactly 4 featured camps, got %. Investigate.', featured_count;
    END IF;
    IF launch_partner_count <> 4 THEN
      RAISE WARNING 'Expected 4 launch partners (Frost + 305 + Wise Choice + TGP), got %.', launch_partner_count;
    END IF;
    IF NOT tgp_present THEN
      RAISE EXCEPTION 'TGP Summer Camp insert failed — row missing or not featured';
    END IF;
  END;
END $migration$;
