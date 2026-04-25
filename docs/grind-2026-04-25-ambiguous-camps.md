# Ambiguous neighborhood retags — 2026-04-25 daytime grind

Audit pass for Phase 3.0 Item 3.3 (retag camps tagged `South Miami-Dade`
to a specific neighborhood). The agent doesn't have prod read access, so
the seed-data + research-import files were the only authoritative source.

## Found

Only ONE camp tagged `South Miami-Dade` in seed data:

| slug | name | address | ZIP |
|------|------|---------|-----|
| `zoo-miami-summer` | Zoo Miami Summer Camp | 12400 SW 152 St, Miami, FL | 33177 |

ZIP 33177 (Country Walk / Richmond Heights area, south of Kendall, west
of Palmetto Bay) does **not** match any of the explicit ZIP buckets in
the plan:

- 33157 → Cutler Bay
- 33158 / 33176 → Palmetto Bay
- 33156 / 33176 / 33186 / 33196 → Kendall
- 33156 → Pinecrest
- 33030–33035 → Homestead

## The judgment call

Migration 026 retags `zoo-miami-summer` to **Kendall**. Reasoning:

- The Zoo (lat ~25.6094) is ~3.5 mi south of Kendall's centroid
  (25.6793) and ~3 mi west of Palmetto Bay's centroid (25.6220, -80.3251).
- Kendall is the term most parents would associate with this part of
  unincorporated south Miami-Dade.
- The neighboring ZIPs in the explicit bucket (33186, 33196) are
  Kendall-coded, so `Kendall` is the most-consistent extension.

## Override path

If Noah disagrees, easy revert:

```sql
UPDATE public.camps
SET neighborhood = 'South Miami-Dade'
WHERE slug = 'zoo-miami-summer';
```

Or pick a different neighborhood:

```sql
UPDATE public.camps SET neighborhood = 'Palmetto Bay' WHERE slug = 'zoo-miami-summer';
-- or
UPDATE public.camps SET neighborhood = 'Cutler Bay'   WHERE slug = 'zoo-miami-summer';
```

## What about prod camps added since 2026-04-25?

The migration targets by slug, so any newly-added prod camp tagged
`South Miami-Dade` won't be touched. Run this after the migration to
catch stragglers:

```sql
SELECT id, slug, name, address, city
FROM camps
WHERE neighborhood = 'South Miami-Dade';
```

Expected: empty. Any rows returned go in a follow-up retag pass.
