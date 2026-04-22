-- Family activities seed — 32 real Miami-area options manually curated.
-- Principles:
--   * Every entry is a real, publicly-operated or well-known venue.
--   * Lat/lng are neighborhood-center approximations where a precise location
--     wasn't hand-verified — consistent with the camp seed policy. Good enough
--     for distance-sort, not turn-by-turn. Admin review can refine.
--   * website_url points to an actual institution or parks-dept page where the
--     venue has a listing. URLs may change; link-checker cron catches regressions.
--   * Cost tiers reflect public entry fees at time of seeding (spring 2026).
--     Admin review before publishing any cost changes.
--   * verified=true because this list is curated by Rasheid, not machine-generated.

insert into public.family_activities
  (slug, name, description, category, ages_min, ages_max, cost_tier, cost_note, address, neighborhood, latitude, longitude, website_url, weather_preference, verified)
values
  -- Beaches
  ('matheson-hammock-park', 'Matheson Hammock Park', 'Atoll pool, mangrove-lined beach, and picnic shelters in Coral Gables.', 'beach', 2, 17, '$', 'Parking fee per car', '9610 Old Cutler Rd, Coral Gables, FL', 'Coral Gables', 25.6787, -80.2701, 'https://www.miamidade.gov/parks/matheson-hammock.asp', 'outdoor_preferred', true),
  ('miami-beach-lummus-park', 'Miami Beach (Lummus Park)', 'Ocean beach with lifeguards, boardwalk, and wide sand near Ocean Drive.', 'beach', 0, 17, 'free', null, '1001 Ocean Dr, Miami Beach, FL', 'Miami Beach', 25.7826, -80.1303, 'https://www.miamibeachfl.gov/city-hall/parks/', 'outdoor_preferred', true),
  ('crandon-park-beach', 'Crandon Park Beach', 'Calm family-friendly beach on Key Biscayne with picnic areas.', 'beach', 0, 17, '$', 'Parking fee per car', '6747 Crandon Blvd, Key Biscayne, FL', 'Key Biscayne', 25.7152, -80.1577, 'https://www.miamidade.gov/parks/crandon.asp', 'outdoor_preferred', true),
  ('haulover-park', 'Haulover Park', 'Oceanfront park popular for kite flying and calm swimming areas.', 'beach', 0, 17, 'free', null, '10800 Collins Ave, Miami Beach, FL', 'Miami Beach', 25.9030, -80.1218, 'https://www.miamidade.gov/parks/haulover.asp', 'outdoor_preferred', true),
  ('bill-baggs-cape-florida', 'Bill Baggs Cape Florida State Park', 'Historic lighthouse, bike rentals, and protected beach on south Key Biscayne.', 'park', 4, 17, '$', 'Per-vehicle state-park fee', '1200 Crandon Blvd, Key Biscayne, FL', 'Key Biscayne', 25.6665, -80.1577, 'https://www.floridastateparks.org/parks-and-trails/bill-baggs-cape-florida-state-park', 'outdoor_preferred', true),

  -- Parks
  ('bayfront-park', 'Bayfront Park', 'Downtown waterfront park with playground, lawn, and frequent free events.', 'park', 0, 17, 'free', null, '301 Biscayne Blvd, Miami, FL', 'Downtown Miami', 25.7743, -80.1862, 'https://bayfrontparkmiami.com/', 'outdoor_preferred', true),
  ('peacock-park', 'Peacock Park, Coconut Grove', 'Open-lawn park at the edge of Biscayne Bay, great for a ball or a kite.', 'park', 0, 17, 'free', null, '2820 McFarlane Rd, Miami, FL', 'Coconut Grove', 25.7280, -80.2393, 'https://www.coconutgrove.com/peacock-park/', 'outdoor_preferred', true),
  ('kennedy-park', 'Kennedy Park, Coconut Grove', 'Waterfront park with jogging trail, dog run, and playground.', 'park', 0, 17, 'free', null, '2400 S Bayshore Dr, Miami, FL', 'Coconut Grove', 25.7313, -80.2381, 'https://www.miamigov.com/Parks', 'outdoor_preferred', true),
  ('tropical-park', 'Tropical Park', 'Large Miami-Dade park with lakes, playgrounds, and walking trails.', 'park', 0, 17, 'free', null, '7900 SW 40th St, Miami, FL', 'Westchester', 25.7362, -80.3264, 'https://www.miamidade.gov/parks/tropical.asp', 'outdoor_preferred', true),
  ('oleta-river-state-park', 'Oleta River State Park', 'Mangrove-lined kayaking, bike trails, and picnic pavilions.', 'nature', 4, 17, '$', 'Per-vehicle state-park fee', '3400 NE 163rd St, North Miami Beach, FL', 'North Miami Beach', 25.9255, -80.1411, 'https://www.floridastateparks.org/parks-and-trails/oleta-river-state-park', 'outdoor_preferred', true),
  ('crandon-park-family-amusement', 'Crandon Park Family Amusement Center', 'Vintage carousel and roller rink on Key Biscayne.', 'park', 3, 12, '$', 'Per-ride tickets', '4000 Crandon Blvd, Key Biscayne, FL', 'Key Biscayne', 25.7079, -80.1608, 'https://www.miamidade.gov/parks/crandon-amusement.asp', 'outdoor_preferred', true),
  ('pinecrest-gardens', 'Pinecrest Gardens', 'Botanical garden with petting zoo, splash pad, and farmer''s market.', 'park', 0, 17, '$', 'Admission per person', '11000 Red Rd, Pinecrest, FL', 'Pinecrest', 25.6690, -80.2990, 'https://www.pinecrestgardens.org/', 'outdoor_preferred', true),

  -- Pools & water
  ('venetian-pool', 'Venetian Pool', 'Historic spring-fed coral-rock swimming pool in Coral Gables.', 'outdoor', 3, 17, '$$', 'Daily admission, ages under 3 not permitted', '2701 De Soto Blvd, Coral Gables, FL', 'Coral Gables', 25.7469, -80.2719, 'https://www.coralgables.com/venetianpool', 'outdoor_preferred', true),

  -- Museums & science
  ('miami-childrens-museum', 'Miami Children''s Museum', 'Hands-on exhibits for early elementary kids, all weather.', 'museum', 0, 10, '$$', 'Per-person admission', '980 MacArthur Cswy, Miami, FL', 'Watson Island', 25.7877, -80.1704, 'https://www.miamichildrensmuseum.org/', 'indoor_preferred', true),
  ('frost-science', 'Phillip & Patricia Frost Museum of Science', 'Aquarium, planetarium, and STEM exhibits for all ages.', 'museum', 3, 17, '$$', 'Per-person admission', '1101 Biscayne Blvd, Miami, FL', 'Downtown Miami', 25.7853, -80.1868, 'https://frostscience.org/', 'indoor_preferred', true),
  ('perez-art-museum', 'Pérez Art Museum Miami (PAMM)', 'Contemporary-art museum with free kid programming on Family Day.', 'museum', 5, 17, '$', 'Free on Family Days; otherwise admission', '1103 Biscayne Blvd, Miami, FL', 'Downtown Miami', 25.7857, -80.1870, 'https://www.pamm.org/', 'indoor_preferred', true),
  ('historymiami', 'HistoryMiami Museum', 'Local history exhibits and kid-focused weekend programming.', 'museum', 5, 17, '$', 'Per-person admission', '101 W Flagler St, Miami, FL', 'Downtown Miami', 25.7745, -80.1944, 'https://historymiami.org/', 'indoor_preferred', true),
  ('vizcaya-museum', 'Vizcaya Museum & Gardens', 'Italian-inspired estate with expansive gardens on Biscayne Bay.', 'museum', 5, 17, '$$', 'Per-person admission', '3251 S Miami Ave, Miami, FL', 'Coconut Grove', 25.7444, -80.2105, 'https://vizcaya.org/', 'indoor_preferred', true),
  ('deering-estate', 'Deering Estate', 'Historic waterfront estate with hiking, kayaking, and kid programming.', 'park', 4, 17, '$', 'Per-person admission', '16701 SW 72nd Ave, Miami, FL', 'Palmetto Bay', 25.6154, -80.3085, 'https://deeringestate.org/', 'outdoor_preferred', true),

  -- Nature
  ('fairchild-tropical-garden', 'Fairchild Tropical Botanic Garden', 'Eighty-three acres of gardens, butterfly conservatory, and kid trails.', 'nature', 2, 17, '$$', 'Per-person admission; free under age 5', '10901 Old Cutler Rd, Coral Gables, FL', 'Coral Gables', 25.6765, -80.2731, 'https://www.fairchildgarden.org/', 'outdoor_preferred', true),
  ('zoo-miami', 'Zoo Miami', 'Large open-range zoo with tram, monorail, and splash park.', 'nature', 0, 17, '$$', 'Per-person admission', '12400 SW 152nd St, Miami, FL', 'South Miami-Dade', 25.6112, -80.3996, 'https://www.zoomiami.org/', 'outdoor_preferred', true),
  ('miami-seaquarium', 'Miami Seaquarium', 'Marine-life park with shows and aquatic exhibits on Virginia Key.', 'nature', 3, 17, '$$$', 'Per-person admission', '4400 Rickenbacker Cswy, Key Biscayne, FL', 'Key Biscayne', 25.7341, -80.1640, 'https://www.miamiseaquarium.com/', 'outdoor_preferred', true),

  -- Libraries & indoor play
  ('coral-gables-library', 'Coral Gables Branch Library', 'Kid story times, maker space, and free wifi.', 'library', 0, 17, 'free', null, '3443 Segovia St, Coral Gables, FL', 'Coral Gables', 25.7491, -80.2608, 'https://www.mdpls.org/locations/coral-gables-branch', 'indoor_preferred', true),
  ('mdpls-main', 'Miami-Dade Main Library', 'Largest branch, kid programming all week.', 'library', 0, 17, 'free', null, '101 W Flagler St, Miami, FL', 'Downtown Miami', 25.7738, -80.1939, 'https://www.mdpls.org/', 'indoor_preferred', true),
  ('books-and-books-coral-gables', 'Books & Books — Coral Gables', 'Independent bookstore with free kid events + weekend story times.', 'cultural', 0, 17, 'free', null, '265 Aragon Ave, Coral Gables, FL', 'Coral Gables', 25.7502, -80.2622, 'https://www.booksandbooks.com/', 'indoor_preferred', true),
  ('coral-gables-art-cinema', 'Coral Gables Art Cinema — Family Matinees', 'Independent theater with family-friendly weekend matinees.', 'cultural', 5, 17, '$', 'Matinee ticket', '260 Aragon Ave, Coral Gables, FL', 'Coral Gables', 25.7501, -80.2621, 'https://www.gablescinema.com/', 'indoor_preferred', true),
  ('key-biscayne-community-center', 'Key Biscayne Community Center', 'Gyms, indoor play space, and free open hours for residents and visitors.', 'playspace', 0, 17, 'free', null, '10 Village Green Way, Key Biscayne, FL', 'Key Biscayne', 25.6920, -80.1631, 'https://www.keybiscayne.fl.gov/community-center', 'indoor_preferred', true),

  -- Events & markets
  ('coconut-grove-farmers-market', 'Coconut Grove Farmers'' Market', 'Saturdays, 10 am – 7 pm: produce, music, food.', 'market', 0, 17, 'free', 'Cash for vendors', 'Grand Ave & Margaret St, Miami, FL', 'Coconut Grove', 25.7281, -80.2432, 'https://coconutgrovefarmersmarket.com/', 'outdoor_preferred', true),
  ('coral-gables-farmers-market', 'Coral Gables Farmers'' Market', 'Saturdays (seasonal), 8 am – 1 pm: produce and crafts.', 'market', 0, 17, 'free', 'Cash for vendors', '405 Biltmore Way, Coral Gables, FL', 'Coral Gables', 25.7515, -80.2603, 'https://www.coralgables.com/farmersmarket', 'outdoor_preferred', true),
  ('pinecrest-farmers-market', 'Pinecrest Gardens Farmers'' Market', 'Sundays, 9 am – 2 pm: produce, prepared food, music.', 'market', 0, 17, 'free', 'Cash for vendors', '11000 Red Rd, Pinecrest, FL', 'Pinecrest', 25.6690, -80.2990, 'https://www.pinecrestgardens.org/farmers-market', 'outdoor_preferred', true),

  -- Outdoor cultural
  ('lincoln-road-mall', 'Lincoln Road Mall', 'Pedestrian shopping promenade with fountains, street performers, and ice cream.', 'outdoor', 3, 17, 'free', 'Walking is free; shops priced individually', 'Lincoln Rd, Miami Beach, FL', 'Miami Beach', 25.7903, -80.1402, 'https://www.lincolnroad.com/', 'outdoor_preferred', true),
  ('wynwood-walls', 'Wynwood Walls', 'Open-air street-art gallery; family-friendly during the day.', 'cultural', 5, 17, '$', 'Weekend ticketed entry', '266 NW 26th St, Miami, FL', 'Wynwood', 25.8008, -80.1988, 'https://thewynwoodwalls.com/', 'outdoor_preferred', true),
  ('calle-ocho', 'Little Havana / Calle Ocho', 'Historic Cuban neighborhood — dominoes park, murals, and Cuban pastries.', 'cultural', 5, 17, 'free', 'Food and shops priced individually', 'SW 8th St & SW 14th Ave, Miami, FL', 'Little Havana', 25.7663, -80.2183, 'https://www.viernesculturales.org/', 'any', true)

on conflict (slug) do nothing;
