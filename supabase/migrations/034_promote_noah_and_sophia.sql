-- Phase 3.5 — promote Noah (product owner) and Sophia (domain-expert mom)
-- to admin. Both are recognized stakeholders per docs/ROADMAP.md.
--
-- admin (not superadmin) — only Rasheid is superadmin per the project's
-- governance pattern. The case-insensitive match catches the mixed-case
-- emails on the file (NoahRScarlett@gmail.com vs noahrscarlett@gmail.com)
-- without forcing parity at signup.
--
-- 2026-04-26 prod check: sophia.solano@yahoo.com exists with role=parent.
-- noahrscarlett@gmail.com is NOT in users yet — Noah needs to sign up
-- before this migration can promote him. The DO block emits a WARNING
-- (not an exception) so a partial promotion lands cleanly and is visible
-- in the migration log.

update public.users
  set role = 'admin'
  where lower(email) in ('noahrscarlett@gmail.com', 'sophia.solano@yahoo.com')
    and role not in ('admin', 'superadmin');

do $$
declare
  promoted_count int;
begin
  select count(*) into promoted_count
    from public.users
    where lower(email) in ('noahrscarlett@gmail.com', 'sophia.solano@yahoo.com')
      and role in ('admin', 'superadmin');
  if promoted_count < 2 then
    raise warning 'Expected 2 admins (Noah + Sophia), have %. The other has not signed up yet — rerun this migration after they do.', promoted_count;
  end if;
end $$;
