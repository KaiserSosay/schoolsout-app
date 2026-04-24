-- Phase 2.6 Goal 1: Admin lockdown — enum extension.
--
-- Base schema (migration 001) already has user_role ('parent','operator','admin')
-- + users.role column. This migration adds 'superadmin' for the primary
-- operator role. The actual promotion of rkscarlett@gmail.com happens in
-- 016_promote_superadmin.sql — it has to be a separate migration file because
-- Postgres refuses to USE a new enum value inside the same transaction that
-- added it (SQLSTATE 55P04), and `supabase db push` wraps each file in a
-- transaction.
--
-- Admin UI gates on users.role ∈ {'admin','superadmin'} with env.ADMIN_EMAILS
-- as the allowlist fallback.

alter type user_role add value if not exists 'superadmin';
