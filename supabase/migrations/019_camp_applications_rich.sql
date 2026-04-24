-- Phase 2.7 Goal 5: rich operator camp application form.
--
-- Extends camp_applications so the new /list-your-camp form can capture
-- hours, extended care, pricing, photos, sessions, and socials — all the
-- fields that drive camp_completeness on the public side.
--
-- Purely additive: new nullable columns + defaults only. No UPDATEs, no
-- enum changes.

alter table public.camp_applications
  add column if not exists hours_start time,
  add column if not exists hours_end time,
  add column if not exists before_care_offered boolean,
  add column if not exists before_care_start time,
  add column if not exists after_care_offered boolean,
  add column if not exists after_care_end time,
  add column if not exists lunch_included boolean,
  add column if not exists scholarships_available boolean,
  add column if not exists scholarships_notes text,
  add column if not exists accommodations text,
  add column if not exists photo_urls text[] default '{}',
  add column if not exists instagram_handle text,
  add column if not exists facebook_url text,
  add column if not exists tiktok_handle text,
  add column if not exists sessions jsonb default '[]',
  add column if not exists testimonials text,
  add column if not exists registration_url text,
  add column if not exists registration_deadline date,
  add column if not exists applicant_completeness numeric(3,2);
