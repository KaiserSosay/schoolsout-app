-- Phase 4.7.1 — public submission form for school calendar updates.
--
-- First 10% of Phase 4.7 (school operator dashboard). Anyone with an
-- email address can propose calendar changes for any school; admin
-- reviews everything before any data mutates the closures table.
-- Email-domain auto-verification surfaces submissions from a school's
-- own staff (principal@school.org → school.org website) in a fast lane.
--
-- The submission record is the audit trail; nothing in this table ever
-- writes through to closures automatically. When admin approves, a
-- migration is the path to land the dates — same trust posture as R6.

create table if not exists public.school_calendar_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  submitter_email text not null,
  submitter_name text,
  submitter_role text not null
    check (submitter_role in ('principal', 'teacher', 'office_manager', 'parent', 'other')),
  proposed_updates text not null,
  notes text,
  domain_verified boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'incorporated')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

-- Per-school, per-status lookup is the admin tab's primary query
-- (filter by status, sort by date).
create index if not exists idx_school_submissions_school_status
  on public.school_calendar_submissions (school_id, status);

-- Pending-queue index for the admin review tab. Partial index keeps
-- it small as approved/rejected/incorporated rows accumulate.
create index if not exists idx_school_submissions_pending
  on public.school_calendar_submissions (status, created_at desc)
  where status = 'pending';

alter table public.school_calendar_submissions enable row level security;

-- Service-role only. Public POSTs go through /api/schools/{slug}
-- /calendar-submissions which is server-side and uses the service-role
-- client. There's no client-direct path to insert / read submissions.
create policy "service role full access on school_calendar_submissions"
  on public.school_calendar_submissions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.school_calendar_submissions is
  'Phase 4.7.1: parents + school staff propose calendar updates. Admin reviews everything before any closures mutate.';
