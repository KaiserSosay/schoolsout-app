-- Phase 4.x — v4.1 cleanup of existing iCal closures.
--
-- Two prod bugs visible on Palmer Trinity tonight (2026-04-26 evening):
--
--   1. "Veterans Day Program and Breakfast" rendered as a closure. It's
--      a school-day event (kids attend, holiday-themed program with
--      breakfast). The v4 SOFT_DENY missed this class of "<holiday>
--      <school-day-event>" patterns. The v4.1 filter (this batch) extends
--      SOFT_DENY with eight new keywords: program, breakfast, luncheon,
--      assembly, ceremony, fair, parade, workshop.
--
--   2. Same-date duplicates ("Labor Day" + "Labor Day - No School", "Rosh
--      Hashanah" + "Rosh Hashanah - No School") — Palmer's iCal feed
--      publishes both forms; the unique index on (school_id, start_date,
--      name) lets both land. The v4.1 sync helper now dedupes by
--      (school_id, start_date, end_date) BEFORE upsert, picking the row
--      with strongest closure signal. This migration cleans the existing
--      duplicates so the next sync run is the only path that controls
--      Palmer's data.
--
-- Source filter is `LIKE 'ical:%'` not `'ical_sync'` — same fix migrations
-- 040 + 041 already made; the actual column format is `ical:<slug>`.
--
-- Live prod preview (no writes, run before this commit):
--   Total iCal closures: 40
--   SOFT_DENY hits: 1 ("Veterans Day Program and Breakfast")
--   Same-date dupe buckets: 3 (3 extra rows)
--   Net: 40 → 36 after both steps.

-- Step 1: SOFT_DENY (v4.1) — drop iCal rows naming a holiday-themed
-- school-day event.
delete from public.closures
where source like 'ical:%'
  and (
    lower(name) like '%program%' or
    lower(name) like '%breakfast%' or
    lower(name) like '%luncheon%' or
    lower(name) like '%assembly%' or
    lower(name) like '%ceremony%' or
    lower(name) like '% fair%' or  -- leading space avoids matching "fair-" as a prefix
    lower(name) like '%parade%' or
    lower(name) like '%workshop%'
  );

-- Step 2: Same-date dedupe — keep the row with strongest closure signal.
-- Order priority within each (school_id, start_date, end_date) bucket:
--   1. "no school" / "school closed" / "no classes" / "no class" markers win
--   2. Longer (more specific) name wins
--   3. Alphabetical for determinism
-- The first row stays; everything else in array_agg gets deleted.
with dupes as (
  select
    school_id,
    start_date,
    end_date,
    array_agg(id order by
      case
        when lower(name) like '%no school%'
          or lower(name) like '%school closed%'
          or lower(name) like '%no classes%'
          or lower(name) like '%no class%'
        then 0 else 1
      end,
      length(name) desc,
      name
    ) as ids
  from public.closures
  where source like 'ical:%'
  group by school_id, start_date, end_date
  having count(*) > 1
)
delete from public.closures
where id in (
  select unnest(ids[2:]) from dupes
);

-- Verification block — counts surface in the migration log.
do $$
declare
  palmer_count int;
  remaining_dupes int;
begin
  select count(*) into palmer_count
    from public.closures
    where school_id = (select id from public.schools where slug = 'palmer-trinity-school')
      and source like 'ical:%';

  select count(*) into remaining_dupes
    from (
      select 1
        from public.closures
        where source like 'ical:%'
        group by school_id, start_date, end_date
        having count(*) > 1
    ) sub;

  raise notice 'Palmer Trinity iCal closures after cleanup: %', palmer_count;
  raise notice 'Same-date duplicates remaining (should be 0): %', remaining_dupes;

  if remaining_dupes > 0 then
    raise warning 'Some same-date duplicates not removed!';
  end if;
end $$;
