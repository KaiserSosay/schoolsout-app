-- Miami camps seed — 20 MVP camps.
-- All verified=false (MVP flag); image_url=null (UI renders gradient placeholders).
-- Idempotent on slug (unique).
--
-- DECISION: website_url uses `https://` + a reasonable subdomain/path per the
-- provider's public website. These are best-effort real URLs; if any 404 when
-- users click, the fix is a DB UPDATE — no code change needed.

insert into public.camps (slug, name, ages_min, ages_max, price_tier, categories, website_url, neighborhood, verified) values
  ('frost-science-summer-camp',        'Frost Science Summer Camp',         5, 12, '$$',  ARRAY['STEM'],                       'https://frostscience.org/camps',              'Downtown',      false),
  ('fairchild-tropical-garden-camp',   'Fairchild Tropical Garden Camp',    6, 13, '$$',  ARRAY['Nature'],                     'https://fairchildgarden.org/camp',            'Coral Gables',  false),
  ('zoo-miami-summer-camp',            'Zoo Miami Summer Camp',             5, 14, '$$',  ARRAY['Nature','Animals'],           'https://zoomiami.org/camp',                   'Kendall',       false),
  ('miami-childrens-museum-camp',      'Miami Children''s Museum Camp',     3,  8, '$$',  ARRAY['Art','STEM'],                 'https://miamichildrensmuseum.org',            'Downtown',      false),
  ('venetian-pool-swim-lessons',       'Venetian Pool Swim Lessons',        4, 12, '$',   ARRAY['Swim'],                       'https://coralgables.com/venetianpool',        'Coral Gables',  false),
  ('coral-gables-youth-center',        'Coral Gables Youth Center',         5, 15, '$',   ARRAY['Sports','Arts'],              'https://coralgables.com',                     'Coral Gables',  false),
  ('salzedo-street-soccer',            'Salzedo Street Soccer',             4, 14, '$$',  ARRAY['Soccer','Sports'],            'https://salzedosoccer.com',                   'Coral Gables',  false),
  ('ymca-of-south-florida-camp',       'YMCA of South Florida Camp',        4, 15, '$$',  ARRAY['Sports','Swim','STEM'],       'https://ymcasouthflorida.org',                'Various',       false),
  ('actors-playhouse-kids',            'Actors Playhouse Kids',             6, 17, '$$',  ARRAY['Theater'],                    'https://actorsplayhouse.org',                 'Coral Gables',  false),
  ('miami-city-ballet-school',         'Miami City Ballet School',          6, 18, '$$$', ARRAY['Dance'],                      'https://miamicityballet.org',                 'Miami Beach',   false),
  ('new-world-school-of-the-arts-kids','New World School of the Arts Kids', 8, 17, '$$$', ARRAY['Music','Dance','Theater'],    'https://nwsa.mdc.edu',                        'Downtown',      false),
  ('biltmore-tennis-program',          'Biltmore Tennis Program',           4, 16, '$$',  ARRAY['Tennis'],                     'https://biltmorehotel.com/tennis',            'Coral Gables',  false),
  ('salvadore-park-tennis',            'Salvadore Park Tennis',             4, 16, '$',   ARRAY['Tennis'],                     'https://salvadoretennis.com',                 'Coral Gables',  false),
  ('vizcaya-kids-programs',            'Vizcaya Kids Programs',             5, 12, '$',   ARRAY['Art','History'],              'https://vizcaya.org',                         'Coconut Grove', false),
  ('pinecrest-gardens-camp',           'Pinecrest Gardens Camp',            4, 12, '$$',  ARRAY['Nature','Art'],               'https://pinecrestgardens.org',                'Pinecrest',     false),
  ('deering-estate-camp',              'Deering Estate Camp',               6, 14, '$$',  ARRAY['Nature','History'],           'https://deeringestate.org',                   'Palmetto Bay',  false),
  ('miami-seaquarium-camp',            'Miami Seaquarium Camp',             6, 13, '$$$', ARRAY['Nature','Animals'],           'https://miamiseaquarium.com',                 'Key Biscayne',  false),
  ('gables-gymnastics',                'Gables Gymnastics',                 4, 15, '$$',  ARRAY['Sports'],                     'https://gablesgymnastics.com',                'Coral Gables',  false),
  ('miami-hoop-school',                'Miami Hoop School',                 6, 17, '$$',  ARRAY['Basketball'],                 'https://miamihoopschool.com',                 'Coconut Grove', false),
  ('school-of-rock-coral-gables',      'School of Rock Coral Gables',       7, 17, '$$$', ARRAY['Music'],                      'https://schoolofrock.com/coralgables',        'Coral Gables',  false)
on conflict (slug) do nothing;
