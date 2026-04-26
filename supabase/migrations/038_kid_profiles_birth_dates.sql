-- Phase 3.5+ — hybrid grade + birth date kid model.
--
-- Mom-test investigation (docs/plans/grade-age-investigation-2026-04-26.md)
-- found that the kid_profiles model stored only an age_range bucket (4-6 /
-- 7-9 / 10-12 / 13+) derived from grade via a wrong off-by-one mapping —
-- Noah at 2nd grade (age 8) was bucketed as 4-6. Mom picked Option 3
-- (hybrid): keep grade as the friendly user-input, add birth month + year
-- as the source of truth for age, derive the age_range bucket from real
-- age at read time.
--
-- Both columns nullable so the 8 existing kid_profiles rows stay valid.
-- The app prompts the parent the next time they hit Family settings via
-- a soft banner (third commit in this batch).

alter table public.kid_profiles
  add column if not exists birth_month integer
    check (birth_month is null or (birth_month between 1 and 12)),
  add column if not exists birth_year integer
    check (birth_year is null or (birth_year between 2005 and 2025));

comment on column public.kid_profiles.birth_month is
  'Month (1-12) of kid birth. Source of truth for age computation. Nullable for kids added before migration 038 — soft-prompted in Family settings.';
comment on column public.kid_profiles.birth_year is
  'Year (2005-2025) of kid birth. Combined with birth_month gives current age. Stored on the server because month+year alone is not personally identifying — a city + school + age range narrows the kid before this does.';
