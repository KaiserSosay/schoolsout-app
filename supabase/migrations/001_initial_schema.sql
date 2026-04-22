-- School's Out! v3.1 — Phase 0 schema.
-- No `kids` table: kid profile data is client-side only per COPPA design.

create type user_role as enum ('parent', 'operator', 'admin');
create type language_code as enum ('en', 'es');
create type school_type as enum ('public', 'private', 'charter');
create type closure_status as enum ('ai_draft', 'verified', 'rejected');
create type age_range as enum ('4-6', '7-9', 'all');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  preferred_language language_code not null default 'en',
  zip_code text,
  role user_role not null default 'parent',
  coppa_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  city text not null,
  state text not null,
  type school_type not null,
  calendar_source_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.closures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  emoji text not null default '📅',
  status closure_status not null default 'ai_draft',
  source text not null default 'manual',
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index closures_school_date_status_idx
  on public.closures (school_id, start_date, status);

create table public.reminder_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  age_range age_range not null default 'all',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);
create index reminder_subs_school_idx
  on public.reminder_subscriptions (school_id) where enabled = true;

create table public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.reminder_subscriptions(id) on delete cascade,
  closure_id uuid not null references public.closures(id) on delete cascade,
  days_before int not null check (days_before in (3, 7, 14)),
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  unique (subscription_id, closure_id, days_before)
);
create index reminder_sends_sent_at_idx on public.reminder_sends (sent_at);

-- RLS
alter table public.users                  enable row level security;
alter table public.schools                enable row level security;
alter table public.closures               enable row level security;
alter table public.reminder_subscriptions enable row level security;
alter table public.reminder_sends         enable row level security;

-- Anonymous reads for schools + verified closures (public content).
create policy "anyone can read schools"
  on public.schools for select using (true);

create policy "anyone can read verified closures"
  on public.closures for select using (status = 'verified');

-- Authenticated users can read their own row.
create policy "users can read self"
  on public.users for select using (auth.uid() = id);

-- Authenticated users manage their own reminder subscriptions.
create policy "users manage own subscriptions"
  on public.reminder_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminder sends are read by owner only; writes happen server-side via service role.
create policy "users read own sends"
  on public.reminder_sends for select
  using (exists (
    select 1 from public.reminder_subscriptions rs
    where rs.id = reminder_sends.subscription_id and rs.user_id = auth.uid()
  ));

-- Trigger: create public.users row when a new auth.users is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, coppa_consent_at)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'coppa_consent_at')::timestamptz, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
