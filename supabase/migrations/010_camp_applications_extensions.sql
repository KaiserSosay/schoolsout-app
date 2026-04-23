-- Phase 2.5 Goal 3: extend camp_applications so the new /list-your-camp
-- public form can capture rich operator data in a single table (no new
-- camp_requests table — keep one mental model for the admin queue).
--
-- Also adds the status values needed for the payment-link flow that
-- lands in Goal 4 when Stripe is wired up: payment_sent, paid, active.
-- Shipping the enum values now means Goal 4 is purely additive.

alter type camp_application_status add value if not exists 'payment_sent';
alter type camp_application_status add value if not exists 'paid';
alter type camp_application_status add value if not exists 'active';
alter type camp_application_status add value if not exists 'denied';

alter table public.camp_applications
  add column if not exists submitted_by_name text,
  add column if not exists business_name text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists age_min int,
  add column if not exists age_max int,
  add column if not exists description text,
  add column if not exists categories text[] default '{}',
  add column if not exists price_min_cents int,
  add column if not exists price_max_cents int,
  add column if not exists admin_notes text,
  add column if not exists linked_camp_id uuid references public.camps(id),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists updated_at timestamptz not null default now();

-- Keep the existing short-form columns (camp_name, website, ages, neighborhood,
-- email) — they remain the minimum required set for the legacy "Run a camp?
-- List it" form. The new rich form populates both the short fields AND the
-- new ones for backward compatibility with admin code written pre-2.5.
