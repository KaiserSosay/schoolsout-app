-- Phase 4.5.X — Camp categories canonical normalization (Stage 2).
--
-- Spec:
--   docs/plans/camp-categories-canonical-2026-04-27.md
--   docs/plans/camp-recategorization-proposal-2026-04-27.md
--   docs/plans/camp-categories-stage-2-plan-2026-04-27.md
--
-- This migration:
--   Phase 1 — lowercases + synonym-normalizes every category across the
--             table (STEM→stem, Art→arts, History→cultural, etc.)
--   Phase 2 — applies the locked per-camp Section A name-keyword adds and
--             the revised Section B description-keyword adds
--   Phase 3 — Q1 orphan folds (animals→nature, water→swim+outdoor,
--             active+indoor→sports, adventure→outdoor, fencing+sports
--             dual-tag, maker→stem)
--   Phase 4 — verification: fails the migration if any non-lowercase tag
--             survives, any deprecated tag survives, or any row's
--             categories array is empty
--
-- Idempotency: every UPDATE uses array_agg(DISTINCT ...) so re-runs on
-- already-canonical data are no-ops. Safe to apply multiple times.
--
-- Schema columns referenced (verified against migration 003 +
-- migration 010 on 2026-04-27): public.camps.id, public.camps.slug,
-- public.camps.categories (text[]).
--
-- The Phase 1 CASE block keys are kept lockstep with
-- src/lib/camps/categories.ts via tests/lib/migration-052-sync.test.ts.

DO $migration$
DECLARE
  cnt int;
  empty_cnt int;
BEGIN

  -- ============================================================
  -- Phase 1 — Casing + synonym normalization (table-wide)
  -- ============================================================
  -- For every camp, rewrite its categories array by mapping each tag
  -- through the synonym/casing CASE block. Unknowns fall through via
  -- lower(cat) — preserves data we can't classify rather than dropping.

  WITH normalized AS (
    SELECT
      id,
      array_agg(DISTINCT
        CASE
          WHEN cat IN ('STEM', 'STEAM', 'stem')                THEN 'stem'
          WHEN cat IN ('Sports', 'sports')                     THEN 'sports'
          WHEN cat IN ('Soccer', 'soccer')                     THEN 'soccer'
          WHEN cat IN ('Tennis', 'tennis')                     THEN 'tennis'
          WHEN cat IN ('Basketball', 'basketball')             THEN 'basketball'
          WHEN cat IN ('Swim', 'Swimming', 'swim', 'swimming') THEN 'swim'
          WHEN cat IN ('Art', 'Arts', 'art', 'arts')           THEN 'arts'
          WHEN cat IN ('Theater', 'theater')                   THEN 'theater'
          WHEN cat IN ('Music', 'music')                       THEN 'music'
          WHEN cat IN ('Dance', 'dance')                       THEN 'dance'
          WHEN cat IN ('Nature', 'nature')                     THEN 'nature'
          WHEN cat IN ('History', 'Cultural', 'cultural')      THEN 'cultural'
          ELSE lower(cat)
        END
      ) AS cats
    FROM public.camps, UNNEST(categories) AS cat
    GROUP BY id
  )
  UPDATE public.camps c
  SET categories = n.cats
  FROM normalized n
  WHERE c.id = n.id
    AND c.categories IS DISTINCT FROM n.cats;

  -- ============================================================
  -- Phase 2 — Section A name-keyword adds (high confidence)
  -- ============================================================
  -- Each block adds a single tag to a specific list of slugs. Slugs are
  -- the source of truth — the slug list is locked in
  -- docs/plans/camp-recategorization-proposal-2026-04-27.md Section A.
  -- Idempotent via array_agg(DISTINCT).

  -- 2.1 — Tennis name-keyword (6 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['tennis']) AS cat
  ) WHERE slug IN (
    'ale-tennis-academy-summer-camp-doral',
    'flamingo-park-tennis-center-summer-camp',
    'miami-beach-tennis-academy-summer-camp',
    'neighborhood-tennis-summer-camp-at-kirk-munroe',
    'palmetto-bay-tennis-summer-camp',
    'fort-lauderdale-tennis-and-sports-summer-camp'
  );

  -- 2.2 — Dance name-keyword (4 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['dance']) AS cat
  ) WHERE slug IN (
    'dance-and-crafts-summer-camp-at-pinecrest-gardens',
    'miami-city-ballet-children-s-summer-dance',
    'miami-lakes-dance-soccer-summer-camp',
    'toddler-summer-camp-with-pinecrest-dance-project'
  );

  -- 2.3 — Golf name-keyword (3 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['golf']) AS cat
  ) WHERE slug IN (
    'club-kids-at-the-coral-gables-golf-country-club',
    'golf-academy-of-south-florida-half-day-summer-camp',
    'pembroke-pines-golf-school-summer-camp'
  );

  -- 2.4 — Sailing name-keyword (2 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['sailing']) AS cat
  ) WHERE slug IN (
    'fort-lauderdale-sailing-summer-camp',
    'miami-youth-sailing-foundation-summer-camp'
  );

  -- 2.5 — Basketball name-keyword (2 camps; below threshold but still
  -- tagged for searchability)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['basketball']) AS cat
  ) WHERE slug IN (
    'coral-gables-basketball-summer-camp',
    'pinecrest-basketball-summer-camp'
  );

  -- 2.6 — Soccer name-keyword (1 camp; below threshold)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['soccer']) AS cat
  ) WHERE slug IN (
    'miami-lakes-dance-soccer-summer-camp'
  );

  -- ============================================================
  -- Section B — description-keyword adds (after 7 strikes)
  -- ============================================================
  -- The 7 struck adds (3 religious, 5 academic) are NOT in this section
  -- — they were removed during Stage 1 review per the false-positive
  -- analysis. See plan §7 / Stage 2 plan §1.

  -- 2.7 — Culinary description-keyword (3 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['culinary']) AS cat
  ) WHERE slug IN (
    'camp-carrollton',
    'machane-miami',
    'miami-country-day-school-summer-camp'
  );

  -- 2.8 — Sailing description-keyword (2 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['sailing']) AS cat
  ) WHERE slug IN (
    'camp-carrollton',
    'shake-a-leg-miami-summer-camp'
  );

  -- 2.9 — Outdoor description-keyword (4 camps)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['outdoor']) AS cat
  ) WHERE slug IN (
    'camp-steamology-at-museum-of-discovery-and-science',
    'camp-tamarac',
    'o-b-johnson-park-summer-camp',
    'tidal-cove'
  );

  -- 2.10 — Tennis description-keyword (1 camp; offers Tennis Camp +
  -- Soccer Camp + Golf School as a multi-sport program)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['tennis']) AS cat
  ) WHERE slug IN (
    'pembroke-pines-sports-specialty-camps'
  );

  -- ============================================================
  -- Phase 3 — Q1 orphan folds
  -- ============================================================

  -- 3.1 — animals → nature
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'animals') || ARRAY['nature']) AS cat
  ) WHERE 'animals' = ANY(categories);

  -- 3.2 — water → swim AND outdoor (dual-tag)
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'water') || ARRAY['swim', 'outdoor']) AS cat
  ) WHERE 'water' = ANY(categories);

  -- 3.3 — active → sports
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'active') || ARRAY['sports']) AS cat
  ) WHERE 'active' = ANY(categories);

  -- 3.4 — indoor → sports
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'indoor') || ARRAY['sports']) AS cat
  ) WHERE 'indoor' = ANY(categories);

  -- 3.5 — adventure → outdoor
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'adventure') || ARRAY['outdoor']) AS cat
  ) WHERE 'adventure' = ANY(categories);

  -- 3.6 — maker → stem
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(array_remove(categories, 'maker') || ARRAY['stem']) AS cat
  ) WHERE 'maker' = ANY(categories);

  -- 3.7 — fencing keeps its tag but ALWAYS dual-tags with sports
  -- (Q1 explicit "keep + add sports")
  UPDATE public.camps SET categories = (
    SELECT array_agg(DISTINCT cat)
    FROM UNNEST(categories || ARRAY['sports']) AS cat
  ) WHERE 'fencing' = ANY(categories) AND NOT ('sports' = ANY(categories));

  -- ============================================================
  -- Phase 4 — Verification (fail-closed)
  -- ============================================================

  -- 4.1 — No non-lowercase tags anywhere
  SELECT COUNT(*) INTO cnt FROM public.camps
  WHERE EXISTS (SELECT 1 FROM UNNEST(categories) c WHERE c <> lower(c));
  RAISE NOTICE 'verify: camps with non-lowercase tags: %', cnt;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'Phase 1 failed — % camps still have non-lowercase tags', cnt;
  END IF;

  -- 4.2 — No deprecated tags survive
  SELECT COUNT(*) INTO cnt FROM public.camps
  WHERE EXISTS (
    SELECT 1 FROM UNNEST(categories) c
    WHERE c IN ('animals', 'water', 'active', 'indoor', 'adventure', 'maker')
  );
  RAISE NOTICE 'verify: camps with deprecated tags: %', cnt;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'Phase 3 failed — % camps still have deprecated tags', cnt;
  END IF;

  -- 4.3 — No camp lost ALL its categories
  SELECT COUNT(*) INTO empty_cnt FROM public.camps
  WHERE categories IS NULL OR array_length(categories, 1) IS NULL;
  RAISE NOTICE 'verify: camps with empty categories: %', empty_cnt;
  IF empty_cnt > 0 THEN
    RAISE EXCEPTION 'Empty-array guard failed — % camps lost all tags', empty_cnt;
  END IF;

  -- 4.4 — Every fencing camp also has sports (Q1 dual-tag rule)
  SELECT COUNT(*) INTO cnt FROM public.camps
  WHERE 'fencing' = ANY(categories) AND NOT ('sports' = ANY(categories));
  IF cnt > 0 THEN
    RAISE EXCEPTION 'fencing dual-tag guard failed — % camps have fencing but not sports', cnt;
  END IF;

  RAISE NOTICE 'migration 052: complete';
END;
$migration$;
