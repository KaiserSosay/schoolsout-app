-- Phase 4.x — bulk apply DevClawd Section B + C enrichment.
-- Source: docs/plans/devclawd-camp-enrichment-2026-04-28/batch-*.json (camps
-- where tagline_confidence === "medium" or "low" in the JSON output).
--
-- 53 taglines (47 medium-confidence + 6 low-confidence) + 8 curated logos.
-- All R5 gap-fill — only sets fields where currently NULL/empty. Preserves
-- any manually-curated tagline or logo.
--
-- Skipped DevClawd-suggested logo URLs:
--   - 5 Deering Estate variants (deering-estate-expedition, deering-fall,
--     deering-mini, deering-spring, deering-winter) all share
--     https://dev.deeringestate.org/.../placeholder-logo-e1632763444406.jpg
--     — dev. subdomain + filename literally "placeholder-logo". Same
--     exclusion pattern as migration 060 used for deering-estate-eco.
--     These camps still get taglines, just no logo.
--
-- Also skipped per migration 060's exclusion list:
--   - wise-choice-fiu, wise-choice-um (don't exist in prod — prod has
--     wise-choice-summer-camp as a single launch partner row).
--
-- Trade-off: Section B/C taglines have more generic municipal voice
-- ("City of X municipal summer camp...") than Section A's high-confidence
-- taglines. Operator (Rasheid) explicitly authorized shipping at this
-- voice level for broader directory coverage. Mom-test discipline says
-- we may revisit specific lines via the admin form if any read poorly.
--
-- Idempotent: re-running this on already-populated rows is a no-op
-- because every UPDATE guards on `tagline IS NULL OR tagline = ''`.

DO $migration$
DECLARE
  rows_affected INT := 0;
  total_taglines INT := 0;
  total_logos INT := 0;
BEGIN

-- ============================================================
-- SECTION B TAGLINES (47 medium-confidence camps)
-- ============================================================

UPDATE camps SET tagline = 'Montessori summer program on Ludlam Road with sports and STEAM activities for ages 6-12.'
  WHERE slug = 'alexander-montessori-ludlam' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Montessori summer program on Old Cutler Road for preschoolers ages 2-6 in Palmetto Bay.'
  WHERE slug = 'alexander-montessori-old-cutler' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Montessori summer program in Palmetto Bay for toddlers and preschoolers ages 2-6.'
  WHERE slug = 'alexander-montessori-palmetto-bay' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Montessori summer program on Red Road in South Miami for preschoolers ages 3-6.'
  WHERE slug = 'alexander-montessori-red-road' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Frost Science partnership with Miami-Dade Parks at Ron Ehmann Park, nature-focused summer camp for ages 5-9.'
  WHERE slug = 'camp-curiosity-ehmann' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Miami-Dade Parks nature day camp at Greynolds Park with outdoor activities and environmental education.'
  WHERE slug = 'camp-manatee-at-greynolds-park' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Village of Palmetto Bay municipal day camp at Coral Reef Park with sports, arts, and outdoor activities.'
  WHERE slug = 'camp-palmetto-bay-at-coral-reef-park' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Jewish day camp in Miami with Hebrew immersion, swimming, arts, and Judaic programming.'
  WHERE slug = 'camp-shemesh' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Broward Parks nature day camp at Vista View Park with sports, nature programs, and outdoor activities.'
  WHERE slug = 'camp-victory-at-vista-view-park' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Municipal art camp at the Aventura Arts and Cultural Center with painting, sculpture, and creative projects for ages 5-12.'
  WHERE slug = 'city-of-aventura-art-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'General day camp at Aventura Community Recreation Center with sports, games, swimming, and field trips for ages 5-14.'
  WHERE slug = 'city-of-aventura-general-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Municipal sports camp in Aventura with basketball, soccer, flag football, and multi-sport programming for ages 6-14.'
  WHERE slug = 'city-of-aventura-sports-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Municipal STEM camp at the AACC in Aventura with robotics, coding, and engineering challenges for ages 8-13.'
  WHERE slug = 'city-of-aventura-stem-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Hialeah municipal day camp with creative learning, arts, sports, and educational activities for ages 5-12.'
  WHERE slug = 'city-of-hialeah-creative-learning-play-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Homestead Parks and Recreation municipal summer camp with sports, arts, and field trips.'
  WHERE slug = 'city-of-homestead-summer-camp-2026' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Junior tennis camp at Crandon Park Tennis Center on Key Biscayne with professional instruction and match play.'
  WHERE slug = 'crandon-tennis' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Town of Cutler Bay municipal STEM camp exploring careers in science, technology, engineering, and math.'
  WHERE slug = 'cutler-bay-careers-in-stem-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Town of Cutler Bay municipal summer camp with sports, arts, and recreational activities.'
  WHERE slug = 'cutler-bay-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Fencing summer camp with instruction in foil, epee, and saber techniques for all skill levels.'
  WHERE slug = 'davis-fencing' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Adventure expedition camp at Deering Estate with kayaking, hiking, and environmental exploration.'
  WHERE slug = 'deering-estate-expedition' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Fall break camp at Deering Estate with nature activities and environmental education.'
  WHERE slug = 'deering-fall' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Mini explorers camp at Deering Estate for younger children with age-appropriate nature activities.'
  WHERE slug = 'deering-mini' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Spring break camp at Deering Estate with nature activities and environmental education.'
  WHERE slug = 'deering-spring' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Winter break camp at Deering Estate with nature activities and environmental education.'
  WHERE slug = 'deering-winter' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Miami Beach multi-sport summer camp at Flamingo Park with basketball, soccer, tennis, and swimming.'
  WHERE slug = 'flamingo-park-multi-sport-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Tennis summer camp at Flamingo Park Tennis Center in Miami Beach with professional instruction and match play.'
  WHERE slug = 'flamingo-park-tennis-center-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Hollywood M.O.S.T. (Making Outstanding Students Today) summer enrichment program.'
  WHERE slug = 'hollywood-m-o-s-t-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Miami-Dade Parks teen summer camp at Ingalls Park with sports, recreation, and leadership activities.'
  WHERE slug = 'ingalls-park-teen-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Village of Key Biscayne municipal day camp with beach activities, sports, and island recreation.'
  WHERE slug = 'key-biscayne-community-center-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'KLA Schools summer program with Reggio Emilia-inspired activities, arts, and early learning enrichment.'
  WHERE slug = 'kla-academy-summer' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Montessori summer camp at La Piazza Academy with Italian immersion and nature-based learning.'
  WHERE slug = 'la-piazza-academy-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Jewish day camp in Miami with Hebrew programming, swimming, and Judaic culture activities.'
  WHERE slug = 'machane-miami' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Sailing summer camp at Coconut Grove Sailing Club with learn-to-sail programs, racing, and water safety for youth.'
  WHERE slug = 'miami-youth-sailing-foundation-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Maker summer camp at Moonlighter Fablab with 3D printing, laser cutting, CNC, and digital fabrication for young makers.'
  WHERE slug = 'moonlighter-fablab' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Community tennis camp at Kirk Munroe Tennis Center in Coconut Grove with professional instruction and match play.'
  WHERE slug = 'neighborhood-tennis-summer-camp-at-kirk-munroe' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Miami-Dade Parks summer camp at O.B. Johnson Park with sports, arts, and outdoor recreation.'
  WHERE slug = 'o-b-johnson-park-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Oakland Park municipal summer camp with sports, arts, and recreational activities.'
  WHERE slug = 'oakland-park-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Pembroke Pines art camp at the Cultural Center with painting, sculpture, and mixed media for young artists.'
  WHERE slug = 'pembroke-pines-art-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Pembroke Pines drama camp with acting, improv, and stage production for aspiring young performers.'
  WHERE slug = 'pembroke-pines-drama-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Pembroke Pines early childhood summer camp for preschool-age children with age-appropriate activities.'
  WHERE slug = 'pembroke-pines-early-development-center-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Traditional day camp at Miami Riviera Country Club with swimming, sports, and country club activities.'
  WHERE slug = 'riviera-day-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Junior day camp at Miami Riviera Country Club for younger campers with age-appropriate activities and supervision.'
  WHERE slug = 'riviera-junior-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of Miami Beach kayaking camp at Scott Rakow Youth Center with paddling instruction and water safety.'
  WHERE slug = 'scott-rakow-youth-center-kayaking-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of South Miami single-day camp for school holidays and teacher planning days.'
  WHERE slug = 'south-miami-one-day' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of South Miami spring break camp with recreational activities.'
  WHERE slug = 'south-miami-spring' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'City of South Miami winter break camp with recreational activities.'
  WHERE slug = 'south-miami-winter' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Miami-Dade Parks STARS summer camp at Evelyn Greer Park with sports, arts, and academic enrichment.'
  WHERE slug = 'stars-summer-camp-at-evelyn-greer-park' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

-- ============================================================
-- SECTION C TAGLINES (6 low-confidence camps — operator authorized)
-- ============================================================

UPDATE camps SET tagline = 'Frost Science STEM camp hosted at FIU campus for summer exploration and discovery.'
  WHERE slug = 'camp-discover-at-fiu' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Frost Science exploration camp at FIU with hands-on STEM activities.'
  WHERE slug = 'camp-explore-at-fiu' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Summer camp program at Gulliver Schools with academics, athletics, and enrichment.'
  WHERE slug = 'camp-gulliver' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Community youth program with summer day camp activities, sports, and mentorship.'
  WHERE slug = 'club-p-l-a-y-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Montessori summer program in Coconut Grove with nature-based learning and enrichment.'
  WHERE slug = 'coconut-grove-montessori-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

UPDATE camps SET tagline = 'Faith-based summer camp at Epiphany Lutheran Nursery School for preschool-age children.'
  WHERE slug = 'epiphany-lutheran-nursery-school-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_taglines := total_taglines + rows_affected;

RAISE NOTICE 'Total tagline rows updated: %', total_taglines;

-- ============================================================
-- LOGOS (8 verified URLs)
-- ============================================================
-- Skipped logos per source-prompt exclusion rules:
--   - 5 Deering Estate variants share dev.deeringestate.org/.../placeholder-logo.jpg
-- Frost Science logo deliberately reused across the 3 Frost partnership camps:
--   - camp-curiosity-ehmann (Section B)
--   - camp-discover-at-fiu (Section C)
--   - camp-explore-at-fiu (Section C)

UPDATE camps SET logo_url = 'https://www.alexandermontessori.com/uploaded/images/logo.png'
  WHERE slug = 'alexander-montessori-ludlam' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.alexandermontessori.com/uploaded/images/logo.png'
  WHERE slug = 'alexander-montessori-old-cutler' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.alexandermontessori.com/uploaded/images/logo.png'
  WHERE slug = 'alexander-montessori-palmetto-bay' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.alexandermontessori.com/uploaded/images/logo.png'
  WHERE slug = 'alexander-montessori-red-road' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.frostscience.org/wp-content/themes/frost-science/images/logo_frost.png'
  WHERE slug = 'camp-curiosity-ehmann' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://static.wixstatic.com/media/d8fa3c_8641393f2114453f8822759b60c37155~mv2.png'
  WHERE slug = 'camp-shemesh' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.frostscience.org/wp-content/themes/frost-science/images/logo_frost.png'
  WHERE slug = 'camp-discover-at-fiu' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

UPDATE camps SET logo_url = 'https://www.frostscience.org/wp-content/themes/frost-science/images/logo_frost.png'
  WHERE slug = 'camp-explore-at-fiu' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_logos := total_logos + rows_affected;

RAISE NOTICE 'Total logo rows updated: %', total_logos;

END $migration$;

-- ============================================================
-- VERIFICATION (separate DO block — runs after the writes commit)
-- ============================================================
-- Visibility-only check: surfaces counts but does NOT raise on partial.
-- Some slugs may not exist in prod (the operator-authored plan accepts
-- this), and a partial gap-fill is not an error here — re-running is safe.
DO $verify$
DECLARE
  taglines_count INT;
  logos_count INT;
BEGIN
  SELECT COUNT(*) INTO taglines_count FROM public.camps
    WHERE slug IN (
      'alexander-montessori-ludlam','alexander-montessori-old-cutler',
      'alexander-montessori-palmetto-bay','alexander-montessori-red-road',
      'camp-curiosity-ehmann','camp-manatee-at-greynolds-park',
      'camp-palmetto-bay-at-coral-reef-park','camp-shemesh',
      'camp-victory-at-vista-view-park','city-of-aventura-art-camp',
      'city-of-aventura-general-camp','city-of-aventura-sports-camp',
      'city-of-aventura-stem-camp','city-of-hialeah-creative-learning-play-summer-camp',
      'city-of-homestead-summer-camp-2026','crandon-tennis',
      'cutler-bay-careers-in-stem-summer-camp','cutler-bay-summer-camp',
      'davis-fencing','deering-estate-expedition','deering-fall',
      'deering-mini','deering-spring','deering-winter',
      'flamingo-park-multi-sport-camp','flamingo-park-tennis-center-summer-camp',
      'hollywood-m-o-s-t-camp','ingalls-park-teen-summer-camp',
      'key-biscayne-community-center-summer-camp','kla-academy-summer',
      'la-piazza-academy-summer-camp','machane-miami',
      'miami-youth-sailing-foundation-summer-camp','moonlighter-fablab',
      'neighborhood-tennis-summer-camp-at-kirk-munroe','o-b-johnson-park-summer-camp',
      'oakland-park-summer-camp','pembroke-pines-art-camp',
      'pembroke-pines-drama-camp','pembroke-pines-early-development-center-summer-camp',
      'riviera-day-camp','riviera-junior-camp',
      'scott-rakow-youth-center-kayaking-summer-camp','south-miami-one-day',
      'south-miami-spring','south-miami-winter',
      'stars-summer-camp-at-evelyn-greer-park',
      'camp-discover-at-fiu','camp-explore-at-fiu','camp-gulliver',
      'club-p-l-a-y-summer-camp','coconut-grove-montessori-summer-camp',
      'epiphany-lutheran-nursery-school-summer-camp'
    ) AND tagline IS NOT NULL AND tagline <> '';
  RAISE NOTICE 'Camps with taglines populated: % / 53', taglines_count;

  SELECT COUNT(*) INTO logos_count FROM public.camps
    WHERE slug IN (
      'alexander-montessori-ludlam','alexander-montessori-old-cutler',
      'alexander-montessori-palmetto-bay','alexander-montessori-red-road',
      'camp-curiosity-ehmann','camp-shemesh',
      'camp-discover-at-fiu','camp-explore-at-fiu'
    ) AND logo_url IS NOT NULL AND logo_url <> '';
  RAISE NOTICE 'Camps with logo_url populated: % / 8', logos_count;
END;
$verify$;
