-- Phase 2.6 Goal 5: external alternatives (sitter services, cruises, resorts).
--
-- When camps are full or a closure is a random Tuesday, parents still need
-- options. This table holds non-School's-Out inventory we surface on the
-- closure detail page so parents can act from one screen.
--
-- No affiliate codes. We don't book. We just point parents at choices that
-- fit their school calendar. Every row renders with a visible "External
-- option — not vetted by School's Out!" indicator.

do $$ begin
  create type alternative_type as enum ('sitter_service', 'cruise', 'resort', 'travel');
exception when duplicate_object then null;
end $$;

create table if not exists public.external_alternatives (
  id uuid primary key default gen_random_uuid(),
  type alternative_type not null,
  name text not null,
  provider text not null,
  description text,
  image_url text,
  deep_link_template text not null,
  duration_days int,
  departure_city text,
  min_lead_days int not null default 0,
  price_from_cents int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.external_alternatives enable row level security;
create policy "anyone reads active alternatives"
  on public.external_alternatives for select
  using (is_active = true);

-- Seed — 1 sitter service + 4 short cruises + 2 resorts.
-- DECISION: Care.com's search URL embeds the parent's zip + the closure
-- date as start_date / end_date. deep_link_template uses {{zip}} / {{start}}
-- / {{end}} placeholders the render code substitutes at display time.
insert into public.external_alternatives
  (id, type, name, provider, description, deep_link_template,
   duration_days, departure_city, min_lead_days, price_from_cents)
values
  (
    '11111111-0000-0000-0000-000000000001',
    'sitter_service',
    'Care.com — one-time sitter search',
    'Care.com',
    'Care.com does their own background checks; School''s Out! doesn''t vet sitters. We just pre-fill the search.',
    'https://www.care.com/child-care/s/{{zip}}?start_date={{start}}&end_date={{end}}&type=one-time',
    null, null, 0, null
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'cruise',
    'Royal Caribbean Navigator of the Seas — 3 nights, Bahamas',
    'Royal Caribbean',
    'Frequent 3-night departures from Miami. Family-friendly. Starting under $500/person at short notice.',
    'https://www.royalcaribbean.com/cruises?departure-city=miami&duration=3',
    3, 'Miami', 14, 49900
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'cruise',
    'Carnival Mardi Gras — 3 nights, Bahamas',
    'Carnival',
    'Note: departs from Port Canaveral (1 hour north of Miami-Dade).',
    'https://www.carnival.com/cruise-search?numadults=2&sailingfrom=port-canaveral',
    3, 'Port Canaveral', 21, 39900
  ),
  (
    '11111111-0000-0000-0000-000000000004',
    'cruise',
    'Disney Dream — 4 nights, Bahamas',
    'Disney Cruise Line',
    'Premium family option from Fort Lauderdale. Book well in advance.',
    'https://disneycruise.disney.go.com/cruises-destinations/bahamas-4-night/',
    4, 'Fort Lauderdale', 60, 149900
  ),
  (
    '11111111-0000-0000-0000-000000000005',
    'cruise',
    'Celebrity Reflection — 4 nights, Western Caribbean',
    'Celebrity Cruises',
    'From Miami. Ages 3+ eligible for Fun Factory programming.',
    'https://www.celebritycruises.com/cruises?destination=western-caribbean&departure-port=miami',
    4, 'Miami', 30, 79900
  ),
  (
    '11111111-0000-0000-0000-000000000006',
    'resort',
    'Beaches Turks & Caicos — all-inclusive',
    'Beaches Resorts',
    'All-inclusive family resort. Sesame Street branded kids program. 4+ night minimum.',
    'https://www.beaches.com/resorts/turks-caicos/',
    4, null, 45, 290000
  ),
  (
    '11111111-0000-0000-0000-000000000007',
    'resort',
    'Atlantis Paradise Island, Bahamas',
    'Atlantis',
    'Waterpark + ocean. Flights out of MIA or FLL. 3-night minimum typical.',
    'https://www.atlantisbahamas.com/',
    3, null, 30, 120000
  )
on conflict (id) do nothing;
