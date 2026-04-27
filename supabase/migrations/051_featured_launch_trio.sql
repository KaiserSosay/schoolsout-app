-- Phase 4.5.1 — Featured launch partner trio.
--
-- Three camps marked as launch-comped Featured: Frost (existing) +
-- 305 Mini Chefs + Wise Choice Summer Camp (new). All three carry
-- is_launch_partner=true so when paid Featured billing ships later,
-- the billing logic can skip charging launch partners.
--
-- Source data: docs/plans/featured-partners/305-mini-chefs.json,
--              docs/plans/featured-partners/wise-choice-summer-camp.json
-- Captured by DevClawd 2026-04-26.
--
-- Schema columns referenced (verified against the camps table on
-- 2026-04-27, NOT the brief's first draft): ages_min, ages_max
-- (plural), is_launch_partner + launch_partner_until (already exist
-- from migration 006 — no new column added). No `state` column;
-- city/neighborhood carry the location signal.
--
-- NOT NULL columns without defaults (per migration 003 — every INSERT
-- must provide them): slug, name, ages_min, ages_max, price_tier.
-- The first apply attempt failed on ages_min — fixed with explicit
-- ranges below. price_tier is a coarse categorical bucket the schema
-- requires (must be '$', '$$', or '$$$'). Both new camps tagged '$$'
-- to match the peer-camp default for established day-camp / specialty
-- programs (camp-j-miami, machane-miami, shake-a-leg, alexander-
-- montessori-ludlam, ransom-everglades-sports all sit at '$$').
-- Override to '$$$' before applying if Rasheid's pricing intel says
-- otherwise — admin can also flip later via UPDATE without a
-- migration.
--
-- Frost UPDATE only flips is_launch_partner / launch_partner_until.
-- It deliberately does NOT touch featured_until (already correctly
-- set to 2026-07-24 in prod) — R5 spirit, don't overwrite intentional
-- non-null state.

DO $$
DECLARE
  launch_partner_count INT;
BEGIN

  -- 305 MINI CHEFS — new camp.
  -- Mobile culinary education across Miami-Dade. No fixed address;
  -- description carries the mobile-program nuance. ages_min/ages_max
  -- set to 5-12 (typical elementary range — they operate at Carver
  -- Elementary + I-Prep Academy, both elementary schools, so this
  -- matches their actual student base).
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
    '305-mini-chefs',
    '305 Mini Chefs',
    E'Kids cooking classes, camps, and after-school programs teaching culinary skills across Miami-Dade County.\n\n305 Mini Chefs is a mobile culinary education program — they bring professional cooking instruction directly to schools and communities, so there is no single fixed location. Based in Coral Gables, they currently operate at partner schools including George Washington Carver Elementary and I-Prep Academy, plus offer summer camps, private lessons, and birthday parties.\n\nKids learn real cooking techniques from professional chefs, prepare actual recipes, and build confidence and safety skills in the kitchen. Tagline: "Savor the Flavor of 305 Mini Chefs."\n\n*Note: 2026 summer camp pricing isn''t published online — call (786) 509-7509 or book online to get details for your child.*',
    '(786) 509-7509',
    '305minichefs@gmail.com',
    'https://www.305minichefs.com/',
    'https://www.305minichefs.com/book-online',
    NULL,
    'Coral Gables',
    'Miami',
    5,
    12,
    '$$',
    ARRAY['culinary'],
    true,
    NOW(),
    true,
    NOW() + INTERVAL '90 days',
    true,
    NOW() + INTERVAL '90 days',
    'rasheid-launch-partner-2026-04'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- WISE CHOICE SUMMER CAMP — new camp.
  -- 5 locations across Miami-Dade. UM is the anchor address; the
  -- other 4 are listed in the description so parents can see all
  -- options. Multi-location split into separate rows is deferred
  -- (out of scope tonight).
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
    'wise-choice-summer-camp',
    'Wise Choice Summer Camp',
    E'Miami''s trusted summer camp with 22+ years of experience at university campuses including UM and FIU. Swimming, field trips, and electives included.\n\nWise Choice Summer Camp has been serving Miami-Dade families for over 22 years, offering a comprehensive summer experience at five convenient locations:\n\n• **Coral Gables – University of Miami** (UM Hillel, 1100 Stanford Dr.)\n• **Westchester – FIU** (FIU Stadium Club, 11310 SW 17 St)\n• **Doral – Albizu University** (2173 NW 99th Ave)\n• **West Kendall – BridgePrep Academy** (13300 SW 120 St)\n• **Homestead – Keys Gate Charter** (2000 SE 28th Ave)\n\nThe camp provides a balanced mix of structured activities and free play, with weekly swimming, weekly field trips, and a wide range of electives. Campers are grouped by age (5-14) to ensure age-appropriate programming. Activities include art, chess, dance, fitness, music, STEM, video games, outdoor sports, and presentations.\n\n**Tuition includes:** weekly field trips, weekly swimming, all activities, mini-electives, and camp supplies. **Additional fees:** $79 non-refundable registration fee + $100 deposit per week (applied to tuition).\n\n**Lunch is optional** through the Our Lunches app, or you can send lunch from home. Snacks $1-$2 available at camp. **4-year-olds accepted** if turning 5 before August.',
    '(305) 630-3600',
    'info@wisechoicesummercamp.com',
    'https://www.wisechoicesummercamp.com/',
    'https://wisechoice.campium.com/login.php',
    'University of Miami Hillel, 1100 Stanford Dr., Coral Gables, FL 33146',
    'Coral Gables',
    'Coral Gables',
    5,
    14,
    '$$',
    ARRAY['sports', 'arts', 'stem', 'outdoor', 'swimming'],
    true,
    NOW(),
    true,
    NOW() + INTERVAL '90 days',
    true,
    NOW() + INTERVAL '90 days',
    'rasheid-launch-partner-2026-04'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- FROST SCIENCE — flip the existing live row to launch partner.
  -- DO NOT touch featured_until: prod has it set to 2026-07-24 already
  -- (real expiry that lines up with summer camp end). R5: preserve
  -- intentional non-null state.
  UPDATE public.camps
  SET is_launch_partner = true,
      launch_partner_until = NOW() + INTERVAL '90 days'
  WHERE slug = 'frost-science-summer'
    AND is_featured = true;

  -- Verification.
  SELECT COUNT(*) INTO launch_partner_count
    FROM public.camps
    WHERE is_launch_partner = true;

  RAISE NOTICE 'Launch partners after migration: % (expected 3 — Frost + 305 Mini Chefs + Wise Choice)', launch_partner_count;

  IF launch_partner_count <> 3 THEN
    RAISE WARNING 'Expected exactly 3 launch partners, got %. Investigate before deploying any code that depends on this set.', launch_partner_count;
  END IF;
END $$;
