-- Phase 3.x — live iCal feed sync for anchor schools.
--
-- Round-1 calendar import (migration 029) gave us a static snapshot. This
-- migration enables the OPPOSITE pattern for the three schools that publish
-- live iCal/webcal feeds — Gulliver, Ransom Everglades, Scheck Hillel — so
-- updates flow into our DB automatically instead of waiting for a re-pull.
--
-- The columns are additive and nullable, so this is safe to apply ahead of
-- the sync script and cron route shipping; they just sit empty until the
-- script runs. UPDATEs below seed the three known feeds. DO NOT APPLY until
-- Rasheid reviews — same pattern as 029.

alter table public.schools
  add column if not exists ical_feed_url text,
  add column if not exists ical_last_synced_at timestamptz,
  add column if not exists ical_sync_error text;

comment on column public.schools.ical_feed_url is
  'HTTPS URL of an iCal feed for this school. NULL for schools with no live feed; in that case calendars come from static migration imports (e.g. 029).';
comment on column public.schools.ical_last_synced_at is
  'Most recent successful sync of ical_feed_url. NULL means never synced.';
comment on column public.schools.ical_sync_error is
  'Last sync error string, NULL on success. Set by the sync script so the admin dashboard can surface broken feeds.';

-- Seed feed URLs. webcal:// is the OS-level scheme; HTTPS works for fetch().
update public.schools
  set ical_feed_url = 'https://www.gulliverprep.org/events/?ical=1'
  where slug = 'gulliver-preparatory-school'
    and ical_feed_url is null;

update public.schools
  set ical_feed_url = 'https://ransomeverglades.myschoolapp.com/podium/feed/iCal.aspx?z=Ro7Ri9A2B5d7mkiT8DfdC8QBByU1BXifUL6VGe1X2%2fc8Gm91c5EWMH3QKjRvn7WrgYJoUzNQ9L62vD9OMqz4ULnalUqBRhVgvkhSWeV3vz7Cx%2bhUD6dDM2x%2byS4m4gu9'
  where slug = 'ransom-everglades-school'
    and ical_feed_url is null;

update public.schools
  set ical_feed_url = 'https://ehillel.myschoolapp.com/podium/feed/iCal.aspx?z=sCiwKWAydRzVAqWSm339PClFExPgzAeOZ9XXrnE3Wy5C6iqxmi0vjr0x4U9uL0bcL%2bOJc%2fQzocBnh0bfWk9UQA%3d%3d'
  where slug = 'scheck-hillel-community-school'
    and ical_feed_url is null;
