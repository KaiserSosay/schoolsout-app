-- Geocoordinates seed for the 10 seeded schools + 20 seeded camps.
--
-- DECISION: coords below are NEIGHBORHOOD-CENTER APPROXIMATIONS, not the
-- precise property address. They are accurate enough to sort camps and schools
-- by distance in a "how far is this from my kid's school" UX, but NOT sufficient
-- for turn-by-turn navigation. Admin review (Subagent G) can refine per-camp
-- coords once Rasheid has real addresses/GPS pins. The UI should always link
-- to the camp's website (or phone) for the definitive street address.
--
-- No NEW hours, before/after-care, phone, or session data is seeded here — the
-- product invariant "NO FAKE DATA" says NULL + "Call camp to confirm" rather
-- than fabricated plausible values.

-- Schools ---------------------------------------------------------------------
-- Existing TGP + CGP already have calendars verified → backfilled by 005.
-- Remaining schools keep calendar_status='needs_research' by default.
update public.schools set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where id = '00000000-0000-0000-0000-000000000001';  -- The Growing Place
update public.schools set latitude = 25.7487, longitude = -80.2609, address = 'Coral Gables, FL'
  where id = '00000000-0000-0000-0000-000000000002';  -- Coral Gables Preparatory Academy
update public.schools set latitude = 25.7743, longitude = -80.1925, address = 'Downtown Miami, FL'
  where id = '00000000-0000-0000-0000-000000000003';  -- Miami-Dade County Public Schools
update public.schools set latitude = 25.6598, longitude = -80.3040, address = 'Pinecrest, FL'
  where id = '00000000-0000-0000-0000-000000000004';  -- Gulliver Preparatory School
update public.schools set latitude = 25.7276, longitude = -80.2404, address = 'Coconut Grove, FL'
  where id = '00000000-0000-0000-0000-000000000005';  -- Ransom Everglades School
update public.schools set latitude = 25.6200, longitude = -80.3100, address = 'Palmetto Bay, FL'
  where id = '00000000-0000-0000-0000-000000000006';  -- Palmer Trinity School
update public.schools set latitude = 25.7620, longitude = -80.3650, address = 'Westchester, FL'
  where id = '00000000-0000-0000-0000-000000000007';  -- Belen Jesuit Preparatory School
update public.schools set latitude = 25.7177, longitude = -80.2615, address = 'Coral Gables, FL'
  where id = '00000000-0000-0000-0000-000000000008';  -- Riviera Schools
update public.schools set latitude = 25.6300, longitude = -80.3300, address = 'Palmetto Bay, FL'
  where id = '00000000-0000-0000-0000-000000000009';  -- Westminster Christian School
update public.schools set latitude = 25.7617, longitude = -80.1918, address = 'Miami, FL'
  where id = '00000000-0000-0000-0000-000000000010';  -- Miami Catholic Schools (diocesan)

-- Camps -----------------------------------------------------------------------
-- Address column doubles as neighborhood descriptor until real addresses arrive.
-- Zoo Miami is the one outlier well south of its "Kendall" neighborhood tag.

update public.camps set latitude = 25.7836, longitude = -80.1860, address = 'Downtown, Miami, FL'
  where slug = 'frost-science-summer-camp';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'fairchild-tropical-garden-camp';
update public.camps set latitude = 25.6112, longitude = -80.3996, address = 'Zoo Miami, FL'
  where slug = 'zoo-miami-summer-camp';
update public.camps set latitude = 25.7836, longitude = -80.1860, address = 'Downtown, Miami, FL'
  where slug = 'miami-childrens-museum-camp';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'venetian-pool-swim-lessons';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'coral-gables-youth-center';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'salzedo-street-soccer';
update public.camps set latitude = 25.7617, longitude = -80.1918, address = 'Various, Miami-Dade, FL'
  where slug = 'ymca-of-south-florida-camp';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'actors-playhouse-kids';
update public.camps set latitude = 25.7906, longitude = -80.1298, address = 'Miami Beach, FL'
  where slug = 'miami-city-ballet-school';
update public.camps set latitude = 25.7836, longitude = -80.1860, address = 'Downtown, Miami, FL'
  where slug = 'new-world-school-of-the-arts-kids';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'biltmore-tennis-program';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'salvadore-park-tennis';
update public.camps set latitude = 25.7276, longitude = -80.2404, address = 'Coconut Grove, Miami, FL'
  where slug = 'vizcaya-kids-programs';
update public.camps set latitude = 25.6598, longitude = -80.3040, address = 'Pinecrest, FL'
  where slug = 'pinecrest-gardens-camp';
update public.camps set latitude = 25.6200, longitude = -80.3100, address = 'Palmetto Bay, FL'
  where slug = 'deering-estate-camp';
update public.camps set latitude = 25.6937, longitude = -80.1629, address = 'Key Biscayne, FL'
  where slug = 'miami-seaquarium-camp';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'gables-gymnastics';
update public.camps set latitude = 25.7276, longitude = -80.2404, address = 'Coconut Grove, Miami, FL'
  where slug = 'miami-hoop-school';
update public.camps set latitude = 25.7434, longitude = -80.2700, address = 'Coral Gables, FL'
  where slug = 'school-of-rock-coral-gables';
