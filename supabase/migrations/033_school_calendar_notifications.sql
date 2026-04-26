-- Phase 3.5.2 — capture parent demand for unverified school calendars.
--
-- The new <UnverifiedSchoolCalendarPlaceholder> on each unverified school
-- page has a "Notify me when verified" button. Logged-in clicks insert a
-- row here; when an admin flips a school's calendar_status to verified, a
-- one-shot email goes to every (user_id, school_id) row with notified_at
-- IS NULL and the row is stamped.
--
-- Anonymous users who hit the button get redirected through the magic-link
-- flow first (?next=/schools/{slug}?action=notify), so we never have rows
-- with a null user_id — the FK does that work for us.
--
-- Idempotent: ON CONFLICT (user_id, school_id) on the insert path means a
-- parent who taps the button twice gets one row, not two.

create table if not exists public.school_calendar_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);

-- Index for the admin trigger that finds everyone-still-waiting on a school.
create index if not exists idx_school_calendar_notifications_pending
  on public.school_calendar_notifications (school_id)
  where notified_at is null;

alter table public.school_calendar_notifications enable row level security;

create policy "users read own school notifications"
  on public.school_calendar_notifications for select
  using (auth.uid() = user_id);

create policy "users insert own school notifications"
  on public.school_calendar_notifications for insert
  with check (auth.uid() = user_id);

-- DELETE/UPDATE intentionally not exposed via RLS — parents can't
-- self-unsubscribe. The notify is one-shot; once we email them, we stamp
-- notified_at and the row is dormant. Service-role admins can clean up.

comment on table public.school_calendar_notifications is
  'Parent demand signaling: who wants to know when which school calendar gets verified.';
