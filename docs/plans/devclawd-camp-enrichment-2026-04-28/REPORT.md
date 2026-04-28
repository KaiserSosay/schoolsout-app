# Camp Enrichment Report — 2026-04-28

## Summary
- **Total camps analyzed:** 94
- **High-confidence taglines:** 31
- **Medium-confidence taglines:** 52
- **Low-confidence taglines:** 3
- **No tagline (blocked/unreachable):** 8
- **Logo URLs captured:** 22
- **Camps blocked/unreachable:** 12

## Per-batch breakdown

| Batch | Camps | Logos | High | Medium | Low | None |
|-------|-------|-------|------|--------|-----|------|
| batch-01 | 20 | 7 | 8 | 10 | 1 | 1 |
| batch-02 | 20 | 5 | 5 | 11 | 1 | 3 |
| batch-03 | 20 | 6 | 6 | 13 | 1 | 0 |
| batch-04 | 20 | 2 | 5 | 15 | 0 | 0 |
| batch-05 | 14 | 2 | 7 | 3 | 0 | 4 |

## Notable findings

### Sites blocked by WAF (8 total)
- `city-of-doral-camp-unbeatables` - Akamai WAF
- `city-of-sunny-isles-beach-summer-camps` - Akamai WAF  
- `cushman-school-summer` - Cloudflare WAF
- `dance-and-crafts-summer-camp-at-pinecrest-gardens` - Akamai WAF
- `harmony-camp-at-beth-david` - Cloudflare WAF
- `id-tech-camps-at-university-of-miami` - Cloudflare WAF
- `steam-summer-camp-with-discovery-lab-at-pinecrest-gardens` - Akamai WAF
- `toddler-summer-camp-with-pinecrest-dance-project` - Akamai WAF

### Geographic notes
Several camps are in **Broward County**, not Miami-Dade:
- `camp-steamology-at-museum-of-discovery-and-science` (Fort Lauderdale)
- `camp-tamarac` (Tamarac)
- `camp-victory-at-vista-view-park` (Davie)
- `hollywood-jr-beach-lifeguard-program` (Hollywood)
- `hollywood-m-o-s-t-camp` (Hollywood)
- `oakland-park-summer-camp` (Oakland Park)
- `pembroke-pines-art-camp` (Pembroke Pines)
- `pembroke-pines-drama-camp` (Pembroke Pines)
- `pembroke-pines-early-development-center-summer-camp` (Pembroke Pines)
- `pine-crest-summer-camp` (Fort Lauderdale)

### Camps with multiple slugs (same venue)
- **Deering Estate**: 6 slugs (eco, expedition, mini, fall, spring, winter)
- **City of Aventura**: 4 slugs (art, general, sports, stem)
- **South Miami**: 4 slugs (city, one-day, spring, winter)
- **Wise Choice**: 2 slugs (fiu, um campus variants)
- **Riviera Country Club**: 2 slugs (day, junior)

### Inclusive/special populations
- `shake-a-leg-miami-summer-camp` - Adaptive water sports for individuals with disabilities

### Not summer camps
Several entries are school break camps, not summer:
- `deering-fall`, `deering-spring`, `deering-winter`
- `south-miami-one-day`, `south-miami-spring`, `south-miami-winter`
- `ymca-sfl-day-off`

### Code Ninjas location 404
- `code-ninjas-aventura-summer-camp` - Location page returns 404, may need URL update

## Camps with low/no tagline confidence

### No tagline (8 camps)
| Slug | Reason |
|------|--------|
| city-of-doral-camp-unbeatables | WAF blocked |
| city-of-sunny-isles-beach-summer-camps | WAF blocked |
| cushman-school-summer | WAF blocked |
| dance-and-crafts-summer-camp-at-pinecrest-gardens | WAF blocked |
| harmony-camp-at-beth-david | WAF blocked |
| id-tech-camps-at-university-of-miami | WAF blocked |
| steam-summer-camp-with-discovery-lab-at-pinecrest-gardens | WAF blocked |
| toddler-summer-camp-with-pinecrest-dance-project | WAF blocked |

### Low confidence (3 camps)
| Slug | Reason |
|------|--------|
| club-p-l-a-y-summer-camp | Site not verified |
| coconut-grove-montessori-summer-camp | Site unreachable |
| epiphany-lutheran-nursery-school-summer-camp | Site not verified |

## Camps with no usable logo (72 camps)

### Municipal/government sites (no camp-specific logos)
Most municipal camps (City of X, Town of Y) use generic city seals rather than camp-specific logos. These include all Aventura, Cutler Bay, Hialeah, Homestead, Hollywood, Key Biscayne, Miami Beach, Oakland Park, Palmetto Bay, Pembroke Pines, South Miami, and Tamarac camps.

### Sites not verified via curl
Many specialty camps (fencing, golf, sailing, tennis, maker spaces) did not return HTML content via curl requests.

### WAF-blocked sites
All 8 blocked camps have no logo.

## Recommendations

1. **Browser-based scraping needed** for WAF-blocked sites (Pinecrest Gardens, Temple Beth David, Cushman School, City of Doral, Sunny Isles Beach, iD Tech)

2. **Review geographic scope** - Decide if Broward County camps should remain in Miami-focused directory

3. **Consolidate multi-slug venues** - Consider whether Deering Estate needs 6 separate cards or 1 card with session variants

4. **Update Code Ninjas URL** - Location page 404, may have moved or closed

5. **School break camps** - Tag these differently from summer camps for clearer filtering

---
*Generated: 2026-04-28 by DevClawd*
