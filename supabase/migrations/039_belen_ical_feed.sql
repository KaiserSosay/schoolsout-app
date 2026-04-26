-- Belen Jesuit Preparatory School iCal feed wire-up.
--
-- Found the actual feed URL on https://www.belenjesuit.org/calendar
-- (webcal:// scheme converted to https:// for fetch). Probed the base
-- endpoint — server returns content-type: text/calendar, so the feed
-- works. The migration-032 nightly cron will pull and filter it within
-- 24h of apply (closure-keyword filter strips non-closure events).
--
-- Idempotent — guarded on ical_feed_url IS NULL so a re-run is a no-op
-- and a manually-set value would never be clobbered.

update public.schools
  set ical_feed_url = 'https://belenjesuit.myschoolapp.com/podium/feed/iCal.aspx?z=VrX1bMOQAiBO13gEADB4nMHeiGChwiuhCgnCv5TWE60RP4jTUqAV1FqYWaIjxfycxMBxz%2f8mk4rfT3q%2fvXy2xk3cAwpgVPBw3EwtEUHDCvgHEK7jDdp%2f9KR0fTCltRT5NgX0QGytyay%2bBag4fObkYccgUz0aMj%2flNdZWI547cH%2bFh%2fK4NVUDBLQewSeh8QNunnIMDmCkV%2b2UhsvRo3uVDg%3d%3d'
  where slug = 'belen-jesuit-preparatory-school'
    and ical_feed_url is null;
