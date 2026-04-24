-- Phase 2.7 Goal 6: privacy-first analytics table.
--
-- Lightweight page-view log for public pages. No third-party tracker, no
-- cookies. ip_hash is sha256(ip + daily salt) — not reversible to the
-- original IP but stable per-day per-IP for rough uniqueness counting.
--
-- Purely additive — new table, no UPDATEs.

create table if not exists public.page_views (
  id bigserial primary key,
  path text not null,
  referrer text,
  user_agent text,
  ip_hash text,
  locale text,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

-- Plain btree on created_at. We wanted (created_at::date) expression
-- indexes for daily slicing, but the cast isn't IMMUTABLE in Postgres
-- (timezone-dependent) so it's rejected for index expressions. A plain
-- timestamptz index still answers daily range scans efficiently.
create index if not exists idx_page_views_created
  on public.page_views(created_at desc);
create index if not exists idx_page_views_path_created
  on public.page_views(path, created_at desc);

-- Only the service role writes + reads — no RLS exposure to anon or
-- authed sessions. Parent-facing surfaces never query this table.
alter table public.page_views enable row level security;
-- No policies = deny-all, service role bypasses RLS.
