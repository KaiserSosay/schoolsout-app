-- Outbound click tracking for camps. Logs when a user taps "Visit website"
-- in our app and gets redirected to the camp's external site.
--
-- DECISION: Insert is open so any session (including anonymous) can log a
-- click; SELECT is restricted to the service role only (admin dashboards).
-- Rasheid is the only admin, no read policy needed for end users.
create table if not exists public.camp_clicks (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,  -- null if anonymous
  clicked_at timestamptz not null default now(),
  user_agent text,
  referrer text
);
create index if not exists camp_clicks_camp_idx on public.camp_clicks (camp_id, clicked_at desc);
create index if not exists camp_clicks_date_idx on public.camp_clicks (clicked_at desc);

alter table public.camp_clicks enable row level security;

-- Insert is open (anyone can click); read is service-role only (admin).
drop policy if exists "anyone can log a click" on public.camp_clicks;
create policy "anyone can log a click"
  on public.camp_clicks for insert
  to anon, authenticated
  with check (true);
-- No select policy — only service role reads (admin dashboards).

-- DECISION: launch_partner_until lives on camps for the 90-day window that
-- the admin's "toggle launch partner" action manages. is_launch_partner is
-- the flag; this column is the expiry so a cron (or a manual script) can
-- flip old partners back off without human memory.
alter table public.camps add column if not exists is_launch_partner boolean not null default false;
alter table public.camps add column if not exists launch_partner_until timestamptz;
