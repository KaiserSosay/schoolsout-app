-- Phase 4.x — clean up iCal-imported closures that don't match the v4
-- allowlist filter (see scripts/parse-school-calendars.ts and R6 in
-- docs/SHIPPING_RULES.md). Background: between 14:00 and 18:00 ET on
-- 2026-04-26 we iterated three different blocklist-style filters that
-- kept letting non-closure events through (graduations, groundbreaking
-- ceremonies, summer programs, extracurriculars). Migration 041 supports
-- the v4 filter switch — pure allowlist. Migration 040 (the prior
-- blocklist sweep) did the first pass; this one is the v4-aligned
-- second sweep that catches what 040 missed.
--
-- Strategy: delete every iCal-sourced closure whose name doesn't contain
-- a strong closure signal. Conservative on the SURVIVE side — any row
-- mentioning "no school", "closed", a named break, a federal holiday,
-- a religious holiday, a teacher workday, or a first/last day marker
-- is kept. Everything else goes. The next sync run after this migration
-- re-imports only the events that pass the v4 filter (same allowlist),
-- so the deleted rows won't bounce back unless their SUMMARY genuinely
-- matches a real closure pattern.
--
-- Source filter: 'ical:<slug>' format (e.g. 'ical:palmer-trinity-school'),
-- NOT the brief's suggested 'ical_sync'. Matches scripts/sync-ical-feeds
-- /sync.ts:`source: \`ical:${school.slug}\``. Migration 040 already
-- corrected the same brief-level mistake.

-- Step 1: Delete iCal rows whose name doesn't contain ANY allowlist phrase
delete from public.closures
where source like 'ical:%'
  and not (
    -- Strong closure signals
    lower(name) like '%no school%' or
    lower(name) like '%school closed%' or
    lower(name) like '%no classes%' or
    lower(name) like '%no class%' or  -- singular ("NO CLASS" in Belen's feed)
    lower(name) like '%closed -%' or
    -- Named breaks
    lower(name) like '%thanksgiving break%' or
    lower(name) like '%thanksgiving recess%' or
    lower(name) like '%winter break%' or
    lower(name) like '%winter recess%' or
    lower(name) like '%christmas break%' or
    lower(name) like '%spring break%' or
    lower(name) like '%spring recess%' or
    lower(name) like '%fall break%' or
    lower(name) like '%fall recess%' or
    lower(name) like '%mid-winter break%' or
    lower(name) like '%february break%' or
    lower(name) like '%easter break%' or
    lower(name) like '%passover break%' or
    -- Federal holidays
    lower(name) like '%labor day%' or
    lower(name) like '%memorial day%' or
    lower(name) like '%martin luther king%' or
    lower(name) like '%mlk day%' or
    lower(name) like '%presidents day%' or
    lower(name) like '%presidents'' day%' or
    lower(name) like '%veterans day%' or
    lower(name) like '%juneteenth%' or
    lower(name) like '%columbus day%' or
    lower(name) like '%indigenous peoples day%' or
    lower(name) like '%thanksgiving%' or
    lower(name) like '%independence day%' or
    -- Religious holidays (Catholic / Christian)
    lower(name) like '%good friday%' or
    lower(name) like '%easter monday%' or
    lower(name) like '%holy thursday%' or
    lower(name) like '%ash wednesday%' or
    -- Religious holidays (Jewish)
    lower(name) like '%rosh hashanah%' or
    lower(name) like '%yom kippur%' or
    lower(name) like '%sukkot%' or
    lower(name) like '%shemini atzeret%' or
    lower(name) like '%simchat torah%' or
    lower(name) like '%passover%' or
    lower(name) like '%shavuot%' or
    -- Teacher / professional days
    lower(name) like '%teacher workday%' or
    lower(name) like '%teacher work day%' or
    lower(name) like '%professional development day%' or
    lower(name) like '%pd day%' or
    lower(name) like '%staff development day%' or
    lower(name) like '%in-service day%' or
    lower(name) like '%in service day%' or
    lower(name) like '%faculty in-service%' or
    -- First / last day markers
    lower(name) like '%first day of school%' or
    lower(name) like '%last day of school%' or
    lower(name) like '%last day of classes%' or
    -- Hyphen-suffixed dismissal patterns
    lower(name) like '%early dismissal -%' or
    lower(name) like '%noon dismissal -%' or
    lower(name) like '%half day -%'
  );

-- Step 2: Of the rows that DID match the allowlist, delete any that
-- also trigger SOFT_DENY. "Holiday Concert" is the canonical case —
-- "thanksgiving" + "concert" combo means it's a Thanksgiving concert,
-- not a closure.
delete from public.closures
where source like 'ical:%'
  and (
    lower(name) like '%concert%' or
    lower(name) like '%recital%' or
    lower(name) like '%performance%' or
    lower(name) like '%rehearsal%' or
    lower(name) like '%celebration%' or
    lower(name) like '%service%' or
    lower(name) like '%mass%' or
    lower(name) like '%observance%' or
    lower(name) like '%liturgy%'
  );

-- Verification block — surfaces post-cleanup counts in the migration
-- log so an operator can sanity-check before pushing to prod.
do $$
declare
  ical_remaining int;
  palmer_remaining int;
begin
  select count(*) into ical_remaining
    from public.closures where source like 'ical:%';
  select count(*) into palmer_remaining
    from public.closures
    where source like 'ical:%'
      and school_id = (
        select id from public.schools where slug = 'palmer-trinity-school'
      );
  raise notice 'Total iCal closures remaining: %', ical_remaining;
  raise notice 'Palmer Trinity iCal closures remaining: %', palmer_remaining;
  if palmer_remaining > 30 then
    raise warning 'Palmer Trinity still has % iCal closures after cleanup — allowlist may be too permissive', palmer_remaining;
  end if;
end $$;
