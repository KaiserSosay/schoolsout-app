-- Phase 2.6 Goal 6: plans visible on dashboard + registration deadlines.
--
-- Adds the columns PlansSummary + the registration-reminder cron need:
--   - camps.registration_deadline (DATE) + camps.registration_url (TEXT)
--   - user_plans.registered (bool) + registered_at (ts) + notes (text)
--   - reminder_sends.reminder_type — distinguishes closure reminders
--     from the new registration-deadline nudge emails so analytics
--     can split them

alter table public.camps
  add column if not exists registration_deadline date,
  add column if not exists registration_url text;

alter table public.user_plans
  add column if not exists registered boolean not null default false,
  add column if not exists registered_at timestamptz,
  add column if not exists notes text;

alter table public.reminder_sends
  add column if not exists reminder_type text not null default 'closure_countdown';

-- Partial index for the cron's fast lookup of unregistered upcoming plans
-- whose linked camps have deadlines coming up.
create index if not exists idx_user_plans_unregistered
  on public.user_plans(user_id, closure_id)
  where registered = false;
