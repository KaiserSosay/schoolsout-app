-- Kid access tokens: short, revocable URLs that let a parent hand a kid
-- (or a family tablet) a session locked to Kid Mode.
--
-- DECISION: token is stored as plain text (not a hash) because tokens are
-- short, low-value, per-user, and revocable. A leak only affects one user's
-- Kid Mode view until they click "Revoke" — nothing mutates closures, camps,
-- or family data that isn't already visible to that account.
create table if not exists public.kid_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text unique not null,
  label text,                    -- optional nickname like "Family iPad"
  expires_at timestamptz,        -- null = no expiry
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists kid_access_tokens_user_idx on public.kid_access_tokens (user_id);
create index if not exists kid_access_tokens_token_idx on public.kid_access_tokens (token) where revoked_at is null;

alter table public.kid_access_tokens enable row level security;

drop policy if exists "users manage own kid tokens" on public.kid_access_tokens;
create policy "users manage own kid tokens"
  on public.kid_access_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
