-- Migration 059 — TGP structured fields gap-fill (R5 compliant).
--
-- Populates the 8 structured-field columns added in migration 054 for
-- The Growing Place Summer Camp 2026. Mig053 inserted the camp row
-- before mig054 added the columns, so TGP currently has NULL for
-- tagline / sessions / pricing_tiers / activities / fees /
-- enrollment_window / what_to_bring / lunch_policy /
-- extended_care_policy. The rich data lives in TGP's flyer (and is
-- inlined into mig053's `description` markdown) — this migration
-- transcribes the structured form so the new detail-page rendering
-- (commit 0ed1849) can surface it.
--
-- R5 compliance: every UPDATE guards on `IS NULL` (or `= '[]'::jsonb`
-- for JSONB arrays). If an admin or a later migration has already
-- populated a field, that value is preserved — this migration only
-- fills gaps. Safe to re-run; idempotent on already-populated state.
--
-- Source values: docs/plans/camp-structured-fields-proposal-2026-04-27.md
-- Section A. The 2026 TGP flyer is the upstream source.
--
-- Scope: ONE camp (TGP). Camp Black Bear and Shake-a-Leg are also in
-- Section A but their structured-field proposals are research-derived
-- (not flyer-confirmed) — Rasheid reviews those before they ship.

BEGIN;

-- 1) Tagline — short one-liner for cards / SEO. Mig053's description
-- starts with this exact phrase; we lift it as the structured tagline.
UPDATE public.camps
SET tagline = 'Stomp, chomp, and ROAR your way into a dino-mite summer.'
WHERE slug = 'the-growing-place-summer-camp'
  AND tagline IS NULL;

-- 2) Sessions — two windows with weekly themes, dates exactly as on
-- the 2026 flyer. Notes capture the off-days within Session One.
UPDATE public.camps
SET sessions = $sessions$
[
  {
    "label": "Session One",
    "start_date": "2026-06-15",
    "end_date": "2026-07-02",
    "weekly_themes": [
      "How Do Dinosaurs Play with Their Friends?",
      "How Do Dinosaurs Say I Love You?",
      "How Do Dinosaurs Choose Their Pets?"
    ],
    "notes": "No camp June 19 + July 3"
  },
  {
    "label": "Session Two",
    "start_date": "2026-07-06",
    "end_date": "2026-07-24",
    "weekly_themes": [
      "How Do Dinosaurs Say Happy Birthday?",
      "How Do Dinosaurs Eat Their Food?",
      "How Do Dinosaurs Say Good Night?"
    ],
    "notes": null
  }
]
$sessions$::jsonb
WHERE slug = 'the-growing-place-summer-camp'
  AND (sessions IS NULL OR sessions = '[]'::jsonb);

-- 3) Pricing tiers — half-day vs full-day with per-session, both-
-- session bundle, and weekly rates (cents).
UPDATE public.camps
SET pricing_tiers = $pricing$
[
  {
    "label": "Half-day",
    "hours": "9:00 AM – 12:30 PM",
    "session_price_cents": 70000,
    "both_sessions_price_cents": 130000,
    "weekly_price_cents": 28500,
    "notes": null
  },
  {
    "label": "Full-day",
    "hours": "9:00 AM – 3:00 PM",
    "session_price_cents": 80000,
    "both_sessions_price_cents": 150000,
    "weekly_price_cents": 31500,
    "notes": null
  }
]
$pricing$::jsonb
WHERE slug = 'the-growing-place-summer-camp'
  AND (pricing_tiers IS NULL OR pricing_tiers = '[]'::jsonb);

-- 4) Activities — six per the flyer. Title-case preserved as written
-- (the chip cluster renders the strings verbatim).
UPDATE public.camps
SET activities = ARRAY[
  'Arts & Crafts',
  'Cooking',
  'STEM Lab',
  'Music & Movement',
  'Water Play',
  'In-house Field Trips'
]::text[]
WHERE slug = 'the-growing-place-summer-camp'
  AND (activities IS NULL OR activities = '{}'::text[]);

-- 5) Fees — registration + security + tuition deposit. Tuition
-- deposit's amount is null because it's "50% of tuition" (varies by
-- enrollment shape); the notes column carries that detail.
UPDATE public.camps
SET fees = $fees$
[
  {
    "label": "Registration fee",
    "amount_cents": 15000,
    "refundable": false,
    "notes": null
  },
  {
    "label": "Security fee",
    "amount_cents": 15000,
    "refundable": false,
    "notes": null
  },
  {
    "label": "Camp tuition deposit",
    "amount_cents": null,
    "refundable": false,
    "notes": "50% of tuition, non-transferable"
  }
]
$fees$::jsonb
WHERE slug = 'the-growing-place-summer-camp'
  AND (fees IS NULL OR fees = '[]'::jsonb);

-- 6) Enrollment window — opens 2026-04-02 11:00 ET (15:00 UTC), no
-- explicit close, runs until full per the flyer.
UPDATE public.camps
SET enrollment_window = $enroll$
{
  "opens_at": "2026-04-02T15:00:00Z",
  "closes_at": null,
  "status": "until_full"
}
$enroll$::jsonb
WHERE slug = 'the-growing-place-summer-camp'
  AND enrollment_window IS NULL;

-- 7) What to bring — short list of parent-supplied items.
UPDATE public.camps
SET what_to_bring = ARRAY[
  'lunch (or order via Our Lunches)',
  'water bottle',
  'swim clothes'
]::text[]
WHERE slug = 'the-growing-place-summer-camp'
  AND (what_to_bring IS NULL OR what_to_bring = '{}'::text[]);

-- 8) Lunch policy — prose paragraph for the dedicated section.
UPDATE public.camps
SET lunch_policy = 'Lunch from home or order via Our Lunches. Pizza Friday every week. Morning snack included.'
WHERE slug = 'the-growing-place-summer-camp'
  AND lunch_policy IS NULL;

-- 9) Extended care policy — Early Morning Care details. After-care is
-- not offered per the flyer, so we don't fabricate one.
UPDATE public.camps
SET extended_care_policy = 'Early Morning Care 8:00–8:45 AM, $40/week (pre-registration required, no drop-ins).'
WHERE slug = 'the-growing-place-summer-camp'
  AND extended_care_policy IS NULL;

-- Verification — assert TGP now has all 8 structured fields populated.
DO $verify$
DECLARE
  r RECORD;
BEGIN
  SELECT
    tagline,
    jsonb_array_length(sessions) AS session_count,
    jsonb_array_length(pricing_tiers) AS pricing_count,
    array_length(activities, 1) AS activity_count,
    jsonb_array_length(fees) AS fee_count,
    enrollment_window IS NOT NULL AS has_enrollment,
    array_length(what_to_bring, 1) AS bring_count,
    lunch_policy IS NOT NULL AS has_lunch,
    extended_care_policy IS NOT NULL AS has_extended_care
  INTO r
  FROM public.camps
  WHERE slug = 'the-growing-place-summer-camp';

  IF r IS NULL THEN
    RAISE EXCEPTION 'TGP camp row missing — mig053 must apply before mig059';
  END IF;

  RAISE NOTICE 'TGP structured fields after migration 059:';
  RAISE NOTICE '  tagline set: %', r.tagline IS NOT NULL;
  RAISE NOTICE '  sessions: % entries', r.session_count;
  RAISE NOTICE '  pricing_tiers: % entries', r.pricing_count;
  RAISE NOTICE '  activities: % entries', r.activity_count;
  RAISE NOTICE '  fees: % entries', r.fee_count;
  RAISE NOTICE '  enrollment_window present: %', r.has_enrollment;
  RAISE NOTICE '  what_to_bring: % entries', r.bring_count;
  RAISE NOTICE '  lunch_policy set: %', r.has_lunch;
  RAISE NOTICE '  extended_care_policy set: %', r.has_extended_care;

  -- Hard-fail on any field that didn't land. Catches both first-apply
  -- bugs and (rare) re-applies that should have been no-ops on
  -- already-populated rows.
  IF r.tagline IS NULL OR r.session_count = 0 OR r.pricing_count = 0
     OR r.activity_count = 0 OR r.fee_count = 0 OR NOT r.has_enrollment
     OR r.bring_count = 0 OR NOT r.has_lunch OR NOT r.has_extended_care THEN
    RAISE EXCEPTION 'TGP structured-field gap-fill incomplete — at least one column still null/empty';
  END IF;
END;
$verify$;

COMMIT;
