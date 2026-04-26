-- Phase 4.x cleanup — Palmer Trinity's iCal sync on 2026-04-26 inserted
-- 136 closures with school_year=NULL because the sync script wasn't
-- setting that field (Fix 1 in this batch added derive-school-year to
-- the sync helper). Most of those rows are also NOT real closures —
-- orientations, sports, parent-night events, college visits — that
-- snuck through a too-permissive keyword filter (Fix 2 in this batch
-- tightened NEGATIVE_KEYWORDS).
--
-- This migration cleans up the 2026-04-26 incident's leftovers:
--   1. DELETE the junk Palmer Trinity rows (names matching the same
--      negative-keyword pattern Fix 2 added). Conservative — leaves
--      anything ambiguous in place so an admin can review.
--   2. Backfill school_year on the SURVIVING iCal rows for ALL 5
--      iCal-fed schools using the deriveSchoolYear logic (U.S.
--      academic year flips Aug 1).
--
-- After Rasheid applies + re-runs sync-ical-feeds.ts, Palmer Trinity
-- should have ~30-50 real closures, all with school_year='2025-2026'.
--
-- IMPORTANT: source column uses format 'ical:<slug>' (e.g.
-- 'ical:palmer-trinity-school'), NOT 'ical_sync'. Filters use LIKE.

-- Step 1: Delete obvious junk for Palmer Trinity ONLY.
-- Conservative — only removes rows whose names match the brief's
-- Palmer-shaped failure list. Any row that's ambiguous or might be a
-- real closure stays put for admin review.
delete from public.closures
where school_id = (select id from public.schools where slug = 'palmer-trinity-school')
  and source like 'ical:%'
  and school_year is null
  and (
    -- Sports — school in session during games
    name ilike '%vs.%' or name ilike '% vs %' or
    name ilike '%match%' or name ilike '%tournament%' or
    name ilike '%scrimmage%' or
    name ilike '%varsity%' or name ilike '% jv %' or
    name ilike '%baseball%' or name ilike '%basketball%' or
    name ilike '%football%' or name ilike '%soccer%' or
    name ilike '%volleyball%' or name ilike '%lacrosse%' or
    name ilike '%swim meet%' or name ilike '%cross country%' or
    name ilike '%wrestling%' or name ilike '%softball%' or
    -- Sports that aren't qualified are too risky to ILIKE blindly
    -- ("Field Trip" vs "Track" — leave plain "track" alone). The
    -- positive matches above cover the Palmer pattern.

    -- Orientations / preview / parent nights — students attend
    name ilike '%orientation%' or name ilike '%launch |%' or
    name ilike '%welcome day%' or name ilike '%meet & greet%' or
    name ilike '%preview day%' or name ilike '%parent night%' or
    name ilike '%curriculum night%' or name ilike '%back to school%' or
    name ilike '%new student%' or name ilike '%new family%' or
    -- Meetings + admin
    name ilike '%open house%' or name ilike '%pta meeting%' or
    name ilike '%pto meeting%' or name ilike '%board meeting%' or
    name ilike '%town hall%' or
    -- Performances + creative
    name ilike '%concert%' or name ilike '%recital%' or
    name ilike '%performance%' or name ilike '%rehearsal%' or
    name ilike '%showcase%' or name ilike '%exhibition%' or
    name ilike '%art show%' or name ilike '%science fair%' or
    name ilike '%spelling bee%' or name ilike '%math team%' or
    -- Trips / college events
    name ilike '%field trip%' or name ilike '% college visit%' or
    name ilike '%college fair%' or name ilike '%campus tour%' or
    -- Social
    name ilike '%dance' or name ilike '%dance %' or
    name ilike '%prom%' or name ilike '%gala%' or
    name ilike '%fundraiser%' or name ilike '%auction%' or
    name ilike '%movie night%' or name ilike '%family night%' or
    name ilike '%spirit day%' or name ilike '%pep rally%' or
    name ilike '%picture day%' or name ilike '%yearbook%' or
    name ilike '% party%' or  -- Holiday Party, Hot Cocoa Party, Bows & Bow Ties, etc.
    name ilike '%cheerleading%' or
    name ilike '% tennis %' or name ilike '% tennis (%' or  -- "Co-ed Tennis (Half Day)" — sport, school in session
    name ilike '%alumni%' or
    name ilike '%breakthrough %' or  -- Palmer-specific Saturday program (school in session)
    name ilike '%memorial service%' or
    name ilike '%groundbreaking%' or  -- ceremonial, school in session
    name ilike '%university visit%' or  -- specific colleges (Northeastern, etc.)
    -- Religious services (school in session)
    name ilike '%mass %' or name ilike '%chapel service%' or
    name ilike '%bar mitzvah%' or name ilike '%bat mitzvah%' or
    -- Standardized tests (school open)
    name ilike '% sat %' or name ilike '% sat:' or
    name ilike '%psat%' or name ilike '%ap exam%' or
    name ilike '%final exam%' or name ilike '%midterm%' or
    name ilike '%standardized test%'
  );

-- Step 2: Backfill school_year on every surviving iCal row across all
-- 5 iCal-fed schools. CASE encodes deriveSchoolYear: Aug-Dec → year-
-- (year+1), Jan-Jul → (year-1)-year.
update public.closures
  set school_year = case
    when extract(month from start_date) >= 8
      then extract(year from start_date) || '-' || (extract(year from start_date) + 1)
    else (extract(year from start_date) - 1) || '-' || extract(year from start_date)
  end
where source like 'ical:%'
  and school_year is null;

-- Verification: should be zero NULL rows after this
do $$
declare
  remaining int;
begin
  select count(*) into remaining
    from public.closures
    where source like 'ical:%' and school_year is null;
  if remaining > 0 then
    raise warning 'iCal-sourced closures still have NULL school_year after backfill: %', remaining;
  else
    raise notice 'All iCal closures now have school_year set';
  end if;
end $$;
