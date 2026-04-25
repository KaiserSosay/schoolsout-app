# Neighborhood centroids — deferred entries (2026-04-25)

Source: `https://schoolsout.net/api/camps` returned 108 verified camps
across 29 distinct `neighborhood` values. After the Phase 3.0 patch
(commit `68156c5` + the alias added in this commit), 26/29 resolve to a
centroid. Three remain unresolved — each for a deliberate reason.

## "South Miami-Dade" (1 camp at the time of writing)

This isn't a specific neighborhood — it's a regional descriptor for the
~50 mi² area south of US-1 (roughly Cutler Bay, Palmetto Bay, Homestead,
Florida City). Picking any single point as "the centroid" would either
favor camps near Cutler Bay or near Homestead and skew the sort. Per the
overnight ground rule "if you can't find an authoritative coordinate within
60 seconds of looking, leave it out and add it to a `// TODO: pending
centroid` list," this is deferred.

**Recommended fix (data-side, not code-side):** in admin, retag any camp
currently in "South Miami-Dade" with the more specific neighborhood it
actually sits in (Cutler Bay, Palmetto Bay, Homestead, etc.). All three
of those are in the lookup. The "South Miami-Dade" label was likely a
research-import shortcut for an address whose city wasn't obvious.

```sql
-- run when ready, then re-fetch /api/camps to confirm 0 unmatched:
SELECT id, name, address, city
  FROM camps
 WHERE neighborhood = 'South Miami-Dade' AND verified = true;
```

## "Various" (1+ camps)

This is the operator-confirmed marker for multi-location / floating /
mobile camps (e.g. a camp that meets in different parks each week).
There is no single coordinate that's correct. Camps marked "Various"
**should** sink to the bottom of distance sort — that matches reality
(parents can't sort by distance to a camp that moves), and the
existing `Number.POSITIVE_INFINITY` fallback in
`src/app/[locale]/app/camps/page.tsx` does exactly that.

**No fix needed** — this is intentional. The CampCard's distance label
just won't render for these camps, and they're sorted last when
sort=distance.

## Anything else?

Nope — the other 26 distinct neighborhoods all resolve. Re-run the diff
after any data import that touches `camps.neighborhood`:

```bash
curl -sL https://schoolsout.net/api/camps \
  | python3 -c "import sys,json;d=json.load(sys.stdin);camps=d.get('camps',d) if isinstance(d,dict) else d;hoods=sorted({c['neighborhood'] for c in camps if c.get('neighborhood')});[print(h) for h in hoods]"
```

vs.

```bash
grep -oE "'[A-Z][a-zA-Z' -]+':" src/lib/neighborhoods.ts \
  | sed -E "s/[':] *//g" | sort -u
```

The `comm -23 <(prod)| <(lookup)` pipe should print nothing once any
deferred items above are resolved (or accepted as intentional, like
"Various").
