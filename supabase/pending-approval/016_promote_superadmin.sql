-- Phase 2.6 Goal 1: Admin lockdown — superadmin promotion.
--
-- Companion to 011_superadmin_role.sql. Split into its own migration so the
-- enum value 'superadmin' added in 011 is committed before this UPDATE runs
-- (Postgres SQLSTATE 55P04: unsafe use of new enum value inside the adding
-- transaction). seed.sql has the same UPDATE for fresh-dev-db cases.
--
-- No-op if Rasheid hasn't signed up yet — runs again idempotently any time
-- and only ever affects the single row matching his email.
update public.users set role = 'superadmin' where email = 'rkscarlett@gmail.com';
