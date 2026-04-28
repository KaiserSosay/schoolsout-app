-- Phase 4.x — bulk apply DevClawd Section A enrichment (high-confidence only).
-- Source: docs/plans/devclawd-camp-enrichment-2026-04-28/batch-*.json (camps where
-- tagline_confidence === "high" in the JSON output).
--
-- R5 trust posture: every UPDATE is gap-fill only — sets the field ONLY when
-- currently NULL/empty. Preserves any manually-curated tagline (e.g., the 4
-- launch partners) and any manually-uploaded logo_url. Pre-flight on
-- 2026-04-28 confirmed all 28 slugs exist and none have taglines/logos
-- today, so every UPDATE here is expected to flip a NULL to a value on
-- first apply.
--
-- 28 camps get tagline updates. 13 of those also get logo_url. Two DevClawd
-- slugs deliberately skipped: wise-choice-fiu and wise-choice-um (don't
-- exist in prod — prod has wise-choice-summer-camp as a single launch
-- partner row, already curated). Three logos also skipped per source
-- prompt: deering-estate-eco (dev URL with literal "placeholder-logo"),
-- miami-country-day (.ico favicon), miami-childrens-museum-one-day
-- (favicon). Those camps still get taglines, just no logo.
--
-- Idempotent: re-running this on already-populated rows is a no-op
-- because every UPDATE guards on `tagline IS NULL OR tagline = ''`.

DO $migration$
DECLARE
  rows_affected INT := 0;
  total_updated INT := 0;
BEGIN

-- ============================================================
-- TAGLINES (28 camps)
-- ============================================================

UPDATE camps SET tagline = 'Year-round tennis academy in Doral with summer camps for all skill levels, ages 3-16.'
  WHERE slug = 'ale-tennis-academy-summer-camp-doral' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Inclusive creative arts summer camp for children with and without disabilities, in partnership with Miami-Dade County parks.'
  WHERE slug = 'all-kids-included-youth-arts-creative-arts-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Multi-discipline summer day camp at Belen Jesuit with athletics, arts, and enrichment for boys and girls ages 4-14.'
  WHERE slug = 'belen-jesuit-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Miami-Dade Parks nature day camp with scientific experiments, environmental field trips, and pool days for ages 6-14.'
  WHERE slug = 'camp-black-bear-at-a-d-barnes-park-nature-center' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Traditional day camp at Carrollton School in Coconut Grove with sailing, lacrosse, tennis, art, culinary, and theater for PK3-Grade 8.'
  WHERE slug = 'camp-carrollton' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Nature-based summer day camp at Markham Park in Sunrise since 2009, for ages 5-15.'
  WHERE slug = 'camp-chameleon-at-markham-park' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Jewish community center day camp in Miami with swimming, sports, arts, and Shabbat celebrations.'
  WHERE slug = 'camp-j-miami-at-alper-jcc' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Award-winning Jewish day camp in Davie with sports, swimming, special needs services, and color war traditions.'
  WHERE slug = 'camp-kadima-at-david-posnack-jcc' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'NSU University School summer program in Davie with academics, athletics, and enrichment for PreK-Grade 12.'
  WHERE slug = 'camp-nova-at-nsu-university-school' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = E'STEAM summer camp at Fort Lauderdale''s Museum of Discovery and Science with hands-on science, IMAX experiences, and themed weekly sessions.'
  WHERE slug = 'camp-steamology-at-museum-of-discovery-and-science' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'City of Tamarac municipal summer camp with sports, arts, and field trips for ages 5-14.'
  WHERE slug = 'camp-tamarac' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Coding summer camp at Code Ninjas Aventura with game development, robotics, and programming for ages 7-14.'
  WHERE slug = 'code-ninjas-aventura-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Junior golf camp at Crandon Golf on Key Biscayne with instruction, course play, and PGA-certified coaching.'
  WHERE slug = 'crandon-golf-academy' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = E'Environmental day camp at Deering Estate exploring Florida''s coastal ecosystems, archaeology, and natural history.'
  WHERE slug = 'deering-estate-eco' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Nature and botanic science camp at Fairchild Tropical Botanic Garden with plant exploration, wildlife encounters, and hands-on science.'
  WHERE slug = 'fairchild-gardens-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Performing arts summer camp at FIU Theatre with acting, improv, and stage production for aspiring young actors.'
  WHERE slug = 'fiu-theatre-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'City of Hollywood junior lifeguard program with ocean safety, rescue techniques, and beach training for teens.'
  WHERE slug = 'hollywood-jr-beach-lifeguard-program' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Coding, robotics, and game design summer camp at University of Miami campus, hosted by iD Tech for ages 7-17.'
  WHERE slug = 'id-tech-camps-at-university-of-miami' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Animal encounter summer camp at Jungle Island with hands-on wildlife experiences, nature education, and adventure activities.'
  WHERE slug = 'jungle-island' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = E'Single-day camp experiences at Miami Children''s Museum with interactive exhibits, arts, and culture exploration.'
  WHERE slug = 'miami-childrens-museum-one-day' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Premier day camp at Miami Country Day School with academics, athletics, arts, and aquatics in a relaxed summer environment.'
  WHERE slug = 'miami-country-day-school-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Premier day camp at Pine Crest School with academics, arts, athletics, and specialty programs on the Fort Lauderdale campus.'
  WHERE slug = 'pine-crest-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Sports summer camp at Ransom Everglades School in Coconut Grove with multi-sport training and athletic development.'
  WHERE slug = 'ransom-everglades-sports' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Rock band summer camp at School of Rock Coconut Grove with instrument instruction, songwriting, and live performance training.'
  WHERE slug = 'school-of-rock-coconut-grove-summer-music-camps' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'Adaptive water sports camp at Shake-a-Leg Miami in Coconut Grove with sailing, kayaking, and marine education for all abilities.'
  WHERE slug = 'shake-a-leg-miami-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'LEGO, robotics, and STEAM summer camp at Snapology Miami Beach with hands-on building and coding activities.'
  WHERE slug = 'snapology-of-miami-beach-summer-camp' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'City of South Miami municipal summer camp with sports, arts, and recreational activities at Murray Park.'
  WHERE slug = 'south-miami-city' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET tagline = 'YMCA South Florida day-off camp for school holidays and teacher planning days with sports, swimming, and youth development activities.'
  WHERE slug = 'ymca-sfl-day-off' AND (tagline IS NULL OR tagline = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

RAISE NOTICE 'Total tagline rows updated: %', total_updated;

-- Reset counter for logos.
total_updated := 0;

-- ============================================================
-- LOGOS (13 camps with verified logo URLs)
-- ============================================================
-- Skipped logos that looked unreliable per source prompt:
--   - deering-estate-eco: dev URL + filename literally "placeholder-logo"
--   - miami-country-day-school-summer-camp: .ico favicon
--   - miami-childrens-museum-one-day: favicon
-- These camps still get taglines above; just no logo.

UPDATE camps SET logo_url = 'https://aletennis.com/wp-content/uploads/2024/08/ALETA-Borde-Blanco.png'
  WHERE slug = 'ale-tennis-academy-summer-camp-doral' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://bbk12e1-cdn.myschoolcdn.com/ftpimages/836/logo/logoHeaderMLAthletics_143x185.png'
  WHERE slug = 'belen-jesuit-summer-camp' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://resources.finalsite.net/images/v1681840788/carrolltonorg/mabf4cndmhbl9eelsyyo/logo-footer.svg'
  WHERE slug = 'camp-carrollton' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://www.campchameleon.com/images/logo.png'
  WHERE slug = 'camp-chameleon-at-markham-park' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1739872046/alperjccorg/dhr6syyxthxkmemzbgst/alperjcc-light.png'
  WHERE slug = 'camp-j-miami-at-alper-jcc' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://www.dpjcc.org/graphics/design/2014_logo.png'
  WHERE slug = 'camp-kadima-at-david-posnack-jcc' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://resources.finalsite.net/images/v1690458102/uschoolnovaedu/v4mwanh2gahwpfomd3mk/sharkLogoWatwrmark.svg'
  WHERE slug = 'camp-nova-at-nsu-university-school' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://mods.org/wp-content/uploads/2023/04/MODS-Logo-Vert-Black.png'
  WHERE slug = 'camp-steamology-at-museum-of-discovery-and-science' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://www.golfcrandon.com/wp-content/uploads/sites/9314/2023/12/miami-dade-golf-logo.png'
  WHERE slug = 'crandon-golf-academy' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://www.jungleisland.com/wp-content/themes/jungleisland/images/logo_words_blue@2x.png'
  WHERE slug = 'jungle-island' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://cdn.schoolofrock.com/af156a2ac1bdda6c375076494a8427c8f00c62ea/assets/img/ogimage.jpg'
  WHERE slug = 'school-of-rock-coconut-grove-summer-music-camps' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://cdn.prod.website-files.com/66a407875661cf81e04572fb/66b0d4e7f44108b771062d16_shake-a-leg-logo.avif'
  WHERE slug = 'shake-a-leg-miami-summer-camp' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

UPDATE camps SET logo_url = 'https://ymcasouthflorida.org/wp-content/uploads/2023/10/Icon-logo.png'
  WHERE slug = 'ymca-sfl-day-off' AND (logo_url IS NULL OR logo_url = '');
GET DIAGNOSTICS rows_affected = ROW_COUNT; total_updated := total_updated + rows_affected;

RAISE NOTICE 'Total logo rows updated: %', total_updated;

END $migration$;

-- ============================================================
-- VERIFICATION (separate DO block — runs after the writes commit)
-- ============================================================
DO $verify$
DECLARE
  taglines_count INT;
  logos_count INT;
BEGIN
  SELECT COUNT(*) INTO taglines_count FROM public.camps
    WHERE slug IN (
      'ale-tennis-academy-summer-camp-doral','all-kids-included-youth-arts-creative-arts-summer-camp',
      'belen-jesuit-summer-camp','camp-black-bear-at-a-d-barnes-park-nature-center','camp-carrollton',
      'camp-chameleon-at-markham-park','camp-j-miami-at-alper-jcc','camp-kadima-at-david-posnack-jcc',
      'camp-nova-at-nsu-university-school','camp-steamology-at-museum-of-discovery-and-science',
      'camp-tamarac','code-ninjas-aventura-summer-camp','crandon-golf-academy','deering-estate-eco',
      'fairchild-gardens-camp','fiu-theatre-summer-camp','hollywood-jr-beach-lifeguard-program',
      'id-tech-camps-at-university-of-miami','jungle-island','miami-childrens-museum-one-day',
      'miami-country-day-school-summer-camp','pine-crest-summer-camp','ransom-everglades-sports',
      'school-of-rock-coconut-grove-summer-music-camps','shake-a-leg-miami-summer-camp',
      'snapology-of-miami-beach-summer-camp','south-miami-city','ymca-sfl-day-off'
    ) AND tagline IS NOT NULL AND tagline <> '';
  RAISE NOTICE 'Camps with taglines populated: % / 28', taglines_count;
  IF taglines_count <> 28 THEN
    RAISE EXCEPTION 'Section A tagline gap-fill incomplete — expected 28 populated, got %', taglines_count;
  END IF;

  SELECT COUNT(*) INTO logos_count FROM public.camps
    WHERE slug IN (
      'ale-tennis-academy-summer-camp-doral','belen-jesuit-summer-camp','camp-carrollton',
      'camp-chameleon-at-markham-park','camp-j-miami-at-alper-jcc','camp-kadima-at-david-posnack-jcc',
      'camp-nova-at-nsu-university-school','camp-steamology-at-museum-of-discovery-and-science',
      'crandon-golf-academy','jungle-island','school-of-rock-coconut-grove-summer-music-camps',
      'shake-a-leg-miami-summer-camp','ymca-sfl-day-off'
    ) AND logo_url IS NOT NULL AND logo_url <> '';
  RAISE NOTICE 'Camps with logo_url populated: % / 13', logos_count;
  IF logos_count <> 13 THEN
    RAISE EXCEPTION 'Section A logo gap-fill incomplete — expected 13 populated, got %', logos_count;
  END IF;
END;
$verify$;
