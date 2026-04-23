-- Phase 2.6 Goal 1: Admin lockdown.
--
-- Base schema (migration 001) already has user_role ('parent','operator','admin')
-- + users.role column. This migration:
--   1. Adds 'superadmin' value to the enum for the primary operator (Rasheid).
--   2. Promotes rkscarlett@gmail.com to superadmin, idempotent (noop if row absent).
--
-- Admin UI now gates on users.role ∈ {'admin','superadmin'} instead of the
-- env.ADMIN_EMAILS allowlist. The allowlist stays as a safety net for the
-- rare case a DB row is corrupted.

alter type user_role add value if not exists 'superadmin';

-- Commit the enum change before the UPDATE so the new value is available.
-- Postgres requires this because enum values added in-transaction aren't
-- usable until the transaction commits. Supabase CLI wraps migrations in
-- transactions by default, but the migration runner applies migration files
-- independently which avoids the issue.

-- No-op if Rasheid hasn't signed up yet. seed.sql has the same UPDATE for
-- the fresh-dev-db case.
update public.users set role = 'superadmin' where email = 'rkscarlett@gmail.com';
