-- Phase 2.5 Goal 2: feature_requests table — captures parent feedback
-- from the "Got an idea?" modal in the user menu / sidebar / footer.
-- Anonymous submissions allowed (email captured in that case); logged-in
-- submissions attach the user_id so the admin can see who asked.

create type feature_request_category as enum ('idea', 'bug', 'love', 'question');
create type feature_request_status as enum ('new', 'acknowledged', 'in_progress', 'shipped', 'wont_do');

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text,
  category feature_request_category not null default 'idea',
  body text not null check (char_length(body) between 1 and 500),
  page_path text,
  locale text not null default 'en',
  status feature_request_status not null default 'new',
  admin_response text,
  admin_responded_at timestamptz,
  admin_responded_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feature_requests_status_created
  on public.feature_requests(status, created_at desc);

alter table public.feature_requests enable row level security;

-- Anyone can submit — anon parents, logged-in parents, whoever. Email is
-- captured at the row level when no user_id is present so Rasheid can reply.
create policy "anyone can submit feature request"
  on public.feature_requests
  for insert
  with check (true);

-- Logged-in users can read their own submissions (useful for a future
-- "here's what I asked for, here's the answer" surface — not built yet).
create policy "users read own requests"
  on public.feature_requests
  for select
  using (auth.uid() = user_id);

-- Admin reads + writes via service role, which bypasses RLS; no additional
-- policies required. Matches the camp_applications admin pattern.
