-- 1 school (Noah's, placeholder — update with the real school name/district)
insert into public.schools (id, name, district, city, state, type)
values (
  '00000000-0000-0000-0000-000000000001',
  'The Growing Place',
  'Miami-Dade Private',
  'Coral Gables',
  'FL',
  'private'
) on conflict (id) do nothing;

-- Verified closures for 2026 school year — adjust dates to the real calendar.
insert into public.closures (school_id, name, start_date, end_date, emoji, status, source) values
  ('00000000-0000-0000-0000-000000000001', 'Memorial Day',           '2026-05-25', '2026-05-25', '🇺🇸', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Summer Break',           '2026-06-08', '2026-08-16', '☀️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Labor Day',              '2026-09-07', '2026-09-07', '🛠️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Thanksgiving Break',     '2026-11-25', '2026-11-27', '🦃', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Winter Break',           '2026-12-21', '2027-01-02', '❄️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Martin Luther King Day', '2027-01-18', '2027-01-18', '✊🏿', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Presidents Day',         '2027-02-15', '2027-02-15', '🎩', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Spring Break',           '2027-03-22', '2027-03-26', '🌸', 'verified', 'manual')
on conflict do nothing;
