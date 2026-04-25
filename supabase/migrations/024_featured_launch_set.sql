-- Phase 3.0 daytime grind — Item 3.3.
--
-- 1) Add a `featured_until` timestamptz column so the Featured badge can
--    expire automatically without an admin having to flip is_featured back
--    off. Purely additive.
-- 2) Mark three anchor institutions as featured for 90 days from migration
--    apply. These were chosen because they're high-trust public-facing
--    venues (museum, science center, county park) — good "this is the
--    quality bar" representatives for launch.
--
-- Touches three rows in `camps` (intentional). All other rows untouched.

alter table public.camps
  add column if not exists featured_until timestamptz;

update public.camps
set is_featured = true,
    featured_until = now() + interval '90 days'
where slug in (
  'frost-science-summer',
  'miami-childrens-museum-summer',
  'deering-estate-eco'
);
