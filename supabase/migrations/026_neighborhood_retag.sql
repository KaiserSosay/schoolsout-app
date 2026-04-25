-- Phase 3.0 daytime grind — Item 3.3 data quality.
--
-- "South Miami-Dade" is a regional descriptor (~50 mi² area south of
-- US-1 covering Cutler Bay, Palmetto Bay, Homestead, Florida City,
-- and unincorporated south-county pockets). It's too imprecise to map
-- to a single neighborhood centroid, so distance sort silently sinks
-- those camps. The fix is data-side: retag each affected camp to the
-- specific neighborhood its actual street address sits in.
--
-- Per the seed-migration check (`grep -n "'South Miami-Dade'"
-- supabase/migrations/`), only one camp uses this tag: zoo-miami-summer
-- at 12400 SW 152 St, Miami, FL 33177. ZIP 33177 isn't in the explicit
-- bucket list from the plan (33157→Cutler Bay, 33158/33176→Palmetto Bay,
-- 33034→Homestead, 33156→Pinecrest, 33156/33176/33186/33196→Kendall),
-- so this is a judgment call: ~3.5 mi south of Kendall's centroid,
-- ~3 mi west of Palmetto Bay's centroid. Kendall is the closer-matching
-- neighborhood AND the term parents searching this area would most
-- likely use, so we retag to Kendall here.
--
-- Noah may want to override this — full reasoning + alternatives in
-- docs/grind-2026-04-25-ambiguous-camps.md. Trivially reversible:
--   UPDATE public.camps SET neighborhood = 'South Miami-Dade'
--     WHERE slug = 'zoo-miami-summer';
--
-- Targets by slug rather than UUID because (a) the agent doesn't have
-- prod read access to fetch the UUID, and (b) slugs are stable. If the
-- prod row's slug differs, the UPDATE matches zero rows and the
-- migration is a no-op for that camp — safer than a wrong UUID.

update public.camps
set neighborhood = 'Kendall'
where slug = 'zoo-miami-summer'
  and neighborhood = 'South Miami-Dade';

-- Verification, post-apply:
--   SELECT count(*) FROM camps WHERE neighborhood = 'South Miami-Dade';
-- Expected: 0, OR the count of camps added to prod since the
-- 2026-04-25 seed-data audit. Any non-zero result should be documented
-- in docs/grind-2026-04-25-ambiguous-camps.md and handled in a
-- follow-up migration.
