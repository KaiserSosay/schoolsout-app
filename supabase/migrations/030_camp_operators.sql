-- Phase 3.1 — Camp Operator Self-Edit Dashboard.
--
-- Two new tables:
--   camp_operators          — links a camp to one or more user_ids who can
--                             edit it. invite_token + invite_expires_at let
--                             the admin email a magic-link before the
--                             operator signs up.
--   camp_closure_coverage   — per-(camp, closure) "are you open?" record
--                             owned by the camp operator. Drives the green
--                             "✓ Open this day" pill on parent-side closure
--                             pages.
--
-- All additive. No UPDATE/DELETE on existing data. RLS enabled on both;
-- coverage is publicly readable (parents need to see it) but only writable
-- by the camp's operators.
--
-- Schema-defensive: every CREATE uses IF NOT EXISTS; every policy uses
-- DROP POLICY IF EXISTS first so re-runs don't fail on conflict.

-- ---------------------------------------------------------------------------
-- camp_operators: who can edit which camp
-- ---------------------------------------------------------------------------
create table if not exists public.camp_operators (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  invited_at timestamptz,
  accepted_at timestamptz,
  invite_token text unique,
  invite_expires_at timestamptz,
  unique (camp_id, user_id)
);

create index if not exists idx_camp_operators_user on public.camp_operators(user_id);
create index if not exists idx_camp_operators_camp on public.camp_operators(camp_id);
create index if not exists idx_camp_operators_invite_token
  on public.camp_operators(invite_token)
  where invite_token is not null;

alter table public.camp_operators enable row level security;

-- An operator can read their own assignments. Writes happen server-side
-- through the service role (admin-approve route + invite-acceptance flow).
drop policy if exists "operators read own assignments" on public.camp_operators;
create policy "operators read own assignments"
  on public.camp_operators for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- camp_closure_coverage: per-(camp, closure) open/closed state
-- ---------------------------------------------------------------------------
create table if not exists public.camp_closure_coverage (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  closure_id uuid not null references public.closures(id) on delete cascade,
  is_open boolean not null,
  notes text,
  set_by_operator_id uuid references public.users(id),
  updated_at timestamptz not null default now(),
  unique (camp_id, closure_id)
);

create index if not exists idx_camp_closure_coverage_camp
  on public.camp_closure_coverage(camp_id);
create index if not exists idx_camp_closure_coverage_closure
  on public.camp_closure_coverage(closure_id);
-- Partial index so the parent-side "show open camps for this closure" query
-- doesn't have to scan rows where the operator marked themselves closed.
create index if not exists idx_camp_closure_coverage_open
  on public.camp_closure_coverage(closure_id, camp_id)
  where is_open = true;

alter table public.camp_closure_coverage enable row level security;

-- Anyone reads coverage — parents need to see "✓ Open this day" pills
-- without being authenticated. (No PII is stored here; just open/closed.)
drop policy if exists "anyone reads closure coverage" on public.camp_closure_coverage;
create policy "anyone reads closure coverage"
  on public.camp_closure_coverage for select
  using (true);

-- Only the camp's operators can insert / update coverage rows.
drop policy if exists "operators write own camp coverage" on public.camp_closure_coverage;
create policy "operators write own camp coverage"
  on public.camp_closure_coverage for insert
  with check (
    exists (
      select 1 from public.camp_operators co
      where co.camp_id = camp_closure_coverage.camp_id
        and co.user_id = auth.uid()
    )
  );

drop policy if exists "operators update own camp coverage" on public.camp_closure_coverage;
create policy "operators update own camp coverage"
  on public.camp_closure_coverage for update
  using (
    exists (
      select 1 from public.camp_operators co
      where co.camp_id = camp_closure_coverage.camp_id
        and co.user_id = auth.uid()
    )
  );

-- Touch updated_at on UPDATE so the dashboard can show "last edited" timestamps.
create or replace function public.touch_camp_closure_coverage_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_camp_closure_coverage_updated_at on public.camp_closure_coverage;
create trigger trg_camp_closure_coverage_updated_at
  before update on public.camp_closure_coverage
  for each row execute function public.touch_camp_closure_coverage_updated_at();
