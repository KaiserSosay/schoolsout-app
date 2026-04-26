-- Phase 2.7 follow-up — upgrade 6 city-only address stubs to full street
-- addresses. Companion to the bulk school import in
-- scripts/import-schools-research.ts: under R5 (docs/SHIPPING_RULES.md)
-- the import preserves any non-null prod field, including stub-shaped
-- addresses like "Coral Gables, FL" that are technically non-null but
-- functionally useless. The dry-run on 2026-04-26 flagged 6 STUB?
-- addresses for per-row review; this migration applies the agreed-upon
-- upgrades.
--
-- Source values: docs/SHIPPING_RULES.md R5 dry-run report (commit
-- bd36660), pulled from data/schools/miami-schools-research-2026-04-24
-- .schools.json (the same file the bulk import reads).
--
-- Apply order: this migration is intended to run AFTER the bulk import
-- has successfully landed the 9 R5-clean updates + 304 new schools. If
-- the import fails partway, do NOT apply this migration — the affected
-- schools may not be in the expected state.
--
-- Each UPDATE is keyed by slug (R4 — slugs are immutable, safe identifier)
-- AND the existing stub address as a guard so a re-run cannot accidentally
-- clobber a richer value that landed later. Idempotent — second run is a
-- no-op once the addresses are upgraded.

update public.schools
  set address = '105 Minorca Avenue, Coral Gables, FL 33134'
  where slug = 'coral-gables-preparatory-academy'
    and address = 'Coral Gables, FL';

update public.schools
  set address = '6575 North Kendall Drive, Pinecrest, FL 33156 (Preparatory Campus); 1259 Red Road, Coral Gables, FL 33156 (Krutulis Campus); 12595 Red Road, Coral Gables (Miller Drive Campus)'
  where slug = 'gulliver-preparatory-school'
    and address = 'Pinecrest, FL';

update public.schools
  set address = '2045 South Bayshore Drive, Coconut Grove, FL 33133 (Middle School); 3575 Main Highway, Coconut Grove, FL 33133 (Upper School)'
  where slug = 'ransom-everglades-school'
    and address = 'Coconut Grove, FL';

update public.schools
  set address = '500 SW 127th Avenue, Miami, FL 33184'
  where slug = 'belen-jesuit-preparatory-school'
    and address = 'Westchester, FL';

update public.schools
  set address = '7900 SW 176th Street, Palmetto Bay, FL 33157'
  where slug = 'palmer-trinity-school'
    and address = 'Palmetto Bay, FL';

update public.schools
  set address = '6855 SW 152nd Street, Palmetto Bay, FL 33157'
  where slug = 'westminster-christian-school'
    and address = 'Palmetto Bay, FL';

-- Verification: raise if fewer than 6 rows ended up with the upgraded
-- addresses. A re-run after the first successful apply is fine — the
-- guard predicate makes the UPDATEs no-ops, but the count check below
-- only verifies the CURRENT state, so it stays passing.
do $$
declare
  upgraded_count int;
begin
  select count(*) into upgraded_count
    from public.schools
    where slug in (
      'coral-gables-preparatory-academy',
      'gulliver-preparatory-school',
      'ransom-everglades-school',
      'belen-jesuit-preparatory-school',
      'palmer-trinity-school',
      'westminster-christian-school'
    )
    and length(address) >= 30; -- short stubs are ~16 chars; full addresses >= 30
  if upgraded_count < 6 then
    raise exception 'Expected 6 schools with full street addresses, found %. Did the bulk import land first?', upgraded_count;
  end if;
end $$;
