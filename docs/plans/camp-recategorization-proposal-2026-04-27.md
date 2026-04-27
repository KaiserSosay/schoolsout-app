# Camp Recategorization Proposal — 2026-04-27

**Stage:** 1 of 2 (proposal only — no migrations applied)
**Companion docs:** `docs/plans/camp-categories-canonical-2026-04-27.md`, `docs/plans/camp-category-gaps-2026-04-27.md`

---

## Executive summary

Code analyzed every camp the repo's data sources know about — **136 camps total**, drawn from:

- `data/camps/miami-research-2026-04-23.json` (96 camps, lowercase-clean)
- `supabase/migrations/013_camps_miami_seed.sql` (38 camps, mixed casing — the source of the prod casing-duplicate problem)
- `supabase/migrations/051_featured_launch_trio.sql` (2 new launch partners, lowercase already)

Records were dedup'd by slug; where a slug exists in both research and migration 013, research's metadata wins for description but migration 013's raw categories were merged into the analysis so casing diffs are surfaced.

**Why 136 ≠ 110.** The prod diagnostic counted 110 *verified* camps. The repo data covers more (138 entries minus dedup) because (a) some research-imported camps may not have flipped to `verified=true` yet and (b) some migration 013 camps may have been flipped to `verified=false` post-insert (e.g., broken-website detection). Without prod read access from this checkout, Code can't perfectly reconcile to 110. Stage 2 should re-verify category counts against prod after applying the canonical migration; any camp the proposal touches that doesn't exist in prod is a no-op (the migration UPDATE will affect zero rows).

### Section breakdown

| Section | Description | Count |
|---|---|---|
| **A** | High-confidence: casing normalization OR name-keyword adds | **25** |
| **B** | Medium-confidence: description-keyword inference only | **17** |
| **C** | Low-confidence / weird / needs Rasheid's eye | **0** |
| **D** | No changes proposed (already correctly categorized) | **94** |

### Stop-condition check

Prompt says "if high-confidence changes are 0 OR more than 80, something's wrong." Result: **25 high-confidence changes** — well within bounds. ✓

### Tennis post-proposal coverage (sanity check)

Per the prompt: "for tennis specifically: confirm exactly which camps end up with the tennis tag after the proposal (should be ~5)."

Result: **8 camps** end up tagged `tennis`:

- `crandon-tennis` — already tagged (no change)
- `ale-tennis-academy-summer-camp-doral` — name keyword
- `flamingo-park-tennis-center-summer-camp` — name keyword
- `miami-beach-tennis-academy-summer-camp` — name keyword
- `neighborhood-tennis-summer-camp-at-kirk-munroe` — name keyword
- `palmetto-bay-tennis-summer-camp` — name keyword
- `fort-lauderdale-tennis-and-sports-summer-camp` — name keyword
- `pembroke-pines-sports-specialty-camps` — description keyword (offers Tennis + Soccer + Golf School as a multi-sport program)

8 ≈ "more than 5" — the prompt's "~5" estimate undercounted because the research JSON has more tennis-named camps than the diagnostic's 4 visible ones. Pass.

### How to read each entry

```markdown
### Camp Name (slug: camp-slug)

- Current: [the raw category strings the data has now, casing preserved]
- Proposed: [post-canonical, post-keyword-adds]
- Diff: +tag1, +tag2  (additive only — never proposes removals)
- Casing: STEM→stem  (when a casing change applies)
- Reasoning: brief explanation of why each add was made
- Confidence: high | medium | low
```

### Review process

- **Section A:** approve-all-or-revise-individuals. Casing normalization is mechanical; name-keyword adds are deterministic from the camp's own name. If Rasheid spots one that's wrong (e.g., "Camp Robotics" tagged `stem` but is actually a wrestling team), strike it before Stage 2 ships.
- **Section B:** per-camp review. Description-keyword inference can hallucinate (e.g., a camp whose description says "we're located near the Miami Synagogue" would falsely get `religious`). Read each one.
- **Section C:** per-camp review (none in this run; if there were any, every entry needs an eyeball).
- **Section D:** skim. These are camps where Code proposes no change. If Rasheid scans and notices a camp with raw casing that wasn't surfaced, that's a bug in the proposal logic — escalate.

---

## Section A — High-confidence auto-changes (casing normalization + name keywords)

**Count: 25 camps.**

### ALE Tennis Academy Summer Camp - Doral (`ale-tennis-academy-summer-camp-doral`)

- **Current:** `['sports']`
- **Proposed:** `['sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Alexander Montessori — Ludlam Road (`alexander-montessori-ludlam`)

- **Current:** `['STEAM', 'general', 'sports', 'summer']`
- **Proposed:** `['academic', 'general', 'sports', 'stem', 'summer']`
- **Diff:** +academic
- **Casing:** STEAM→stem
- **Reasoning:** casing normalized (STEAM→stem); description keyword → +academic
- **Confidence:** high

### Camp Curiosity (Frost + MDC Parks) (`camp-curiosity-ehmann`)

- **Current:** `['STEM', 'nature', 'summer']`
- **Proposed:** `['nature', 'stem', 'summer']`
- **Diff:** (no add)
- **Casing:** STEM→stem
- **Reasoning:** casing normalized (STEM→stem)
- **Confidence:** high

### Club Kids at the Coral Gables Golf & Country Club (`club-kids-at-the-coral-gables-golf-country-club`)

- **Current:** `['arts', 'general', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'golf', 'sports', 'swim']`
- **Diff:** +golf
- **Reasoning:** name keyword → +golf
- **Confidence:** high

### Coral Gables Basketball Summer Camp (`coral-gables-basketball-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['basketball', 'sports']`
- **Diff:** +basketball
- **Reasoning:** name keyword → +basketball
- **Confidence:** high

### The Cushman School Summer Camp (`cushman-school-summer`)

- **Current:** `['STEAM', 'academic', 'arts', 'sports', 'summer']`
- **Proposed:** `['academic', 'arts', 'sports', 'stem', 'summer']`
- **Diff:** (no add)
- **Casing:** STEAM→stem
- **Reasoning:** casing normalized (STEAM→stem)
- **Confidence:** high

### Dance and Crafts Summer Camp at Pinecrest Gardens (`dance-and-crafts-summer-camp-at-pinecrest-gardens`)

- **Current:** `['arts', 'music', 'theater']`
- **Proposed:** `['arts', 'dance', 'music', 'theater']`
- **Diff:** +dance
- **Reasoning:** name keyword → +dance
- **Confidence:** high

### Flamingo Park Tennis Center Summer Camp (`flamingo-park-tennis-center-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Fort Lauderdale Sailing Summer Camp (`fort-lauderdale-sailing-summer-camp`)

- **Current:** `['adventure', 'outdoor', 'sports']`
- **Proposed:** `['adventure', 'outdoor', 'sailing', 'sports']`
- **Diff:** +sailing
- **Reasoning:** name keyword → +sailing
- **Confidence:** high

### Fort Lauderdale Tennis and Sports Summer Camp (`fort-lauderdale-tennis-and-sports-summer-camp`)

- **Current:** `['outdoor', 'sports']`
- **Proposed:** `['outdoor', 'sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Frost Science Summer Camp (`frost-science-summer`)

- **Current:** `['STEM', 'nature', 'summer']`
- **Proposed:** `['nature', 'stem', 'summer']`
- **Diff:** (no add)
- **Casing:** STEM→stem
- **Reasoning:** casing normalized (STEM→stem)
- **Confidence:** high

### Golf Academy of South Florida Half-Day Summer Camp (`golf-academy-of-south-florida-half-day-summer-camp`)

- **Current:** `['outdoor', 'sports']`
- **Proposed:** `['golf', 'outdoor', 'sports']`
- **Diff:** +golf
- **Reasoning:** name keyword → +golf
- **Confidence:** high

### Miami Beach Tennis Academy Summer Camp (`miami-beach-tennis-academy-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Miami Children's Museum — One Day Camp (`miami-childrens-museum-one-day`)

- **Current:** `['STEM', 'arts', 'one_day']`
- **Proposed:** `['arts', 'one_day', 'stem']`
- **Diff:** (no add)
- **Casing:** STEM→stem
- **Reasoning:** casing normalized (STEM→stem)
- **Confidence:** high

### Miami Children's Museum Summer Camp (`miami-childrens-museum-summer`)

- **Current:** `['STEM', 'arts', 'summer']`
- **Proposed:** `['arts', 'stem', 'summer']`
- **Diff:** (no add)
- **Casing:** STEM→stem
- **Reasoning:** casing normalized (STEM→stem)
- **Confidence:** high

### Miami City Ballet Children's Summer Dance (`miami-city-ballet-children-s-summer-dance`)

- **Current:** `['arts', 'music', 'theater']`
- **Proposed:** `['arts', 'dance', 'music', 'theater']`
- **Diff:** +dance
- **Reasoning:** name keyword → +dance
- **Confidence:** high

### Miami Lakes Dance & Soccer Summer Camp (`miami-lakes-dance-soccer-summer-camp`)

- **Current:** `['arts', 'general', 'sports']`
- **Proposed:** `['arts', 'dance', 'general', 'soccer', 'sports']`
- **Diff:** +dance, +soccer
- **Reasoning:** name keyword → +dance, +soccer
- **Confidence:** high

### Miami Youth Sailing Foundation Summer Camp (`miami-youth-sailing-foundation-summer-camp`)

- **Current:** `['adventure', 'nature', 'outdoor', 'sports']`
- **Proposed:** `['adventure', 'nature', 'outdoor', 'sailing', 'sports']`
- **Diff:** +sailing
- **Reasoning:** name keyword → +sailing
- **Confidence:** high

### Moonlighter FabLab STEAM Maker Camp (`moonlighter-fablab`)

- **Current:** `['STEM', 'maker', 'summer']`
- **Proposed:** `['maker', 'stem', 'summer']`
- **Diff:** (no add)
- **Casing:** STEM→stem
- **Reasoning:** casing normalized (STEM→stem)
- **Confidence:** high

### Neighborhood Tennis Summer Camp at Kirk Munroe (`neighborhood-tennis-summer-camp-at-kirk-munroe`)

- **Current:** `['outdoor', 'sports']`
- **Proposed:** `['outdoor', 'sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Palmetto Bay Tennis Summer Camp (`palmetto-bay-tennis-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** name keyword → +tennis
- **Confidence:** high

### Pembroke Pines Golf School Summer Camp (`pembroke-pines-golf-school-summer-camp`)

- **Current:** `['outdoor', 'sports']`
- **Proposed:** `['golf', 'outdoor', 'sports']`
- **Diff:** +golf
- **Reasoning:** name keyword → +golf
- **Confidence:** high

### Pinecrest Basketball Summer Camp (`pinecrest-basketball-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['basketball', 'sports']`
- **Diff:** +basketball
- **Reasoning:** name keyword → +basketball
- **Confidence:** high

### Toddler Summer Camp with Pinecrest Dance Project (`toddler-summer-camp-with-pinecrest-dance-project`)

- **Current:** `['arts', 'music', 'preschool']`
- **Proposed:** `['arts', 'dance', 'music', 'preschool']`
- **Diff:** +dance
- **Reasoning:** name keyword → +dance
- **Confidence:** high

### Wise Choice Summer Camp (`wise-choice-summer-camp`)

- **Current:** `['arts', 'outdoor', 'sports', 'stem', 'swimming']`
- **Proposed:** `['arts', 'outdoor', 'sports', 'stem', 'swim']`
- **Diff:** (no add)
- **Casing:** swimming→swim
- **Reasoning:** casing normalized (swimming→swim)
- **Confidence:** high

## Section B — Medium-confidence proposals (description-keyword inference)

**Count: 17 camps.**

### Alexander Montessori — Old Cutler (`alexander-montessori-old-cutler`)

- **Current:** `['preschool', 'summer']`
- **Proposed:** `['academic', 'preschool', 'summer']`
- **Diff:** +academic
- **Reasoning:** description keyword → +academic
- **Confidence:** medium

### Alexander Montessori — Palmetto Bay (`alexander-montessori-palmetto-bay`)

- **Current:** `['preschool', 'summer']`
- **Proposed:** `['academic', 'preschool', 'summer']`
- **Diff:** +academic
- **Reasoning:** description keyword → +academic
- **Confidence:** medium

### Alexander Montessori — Red Road (`alexander-montessori-red-road`)

- **Current:** `['preschool', 'summer']`
- **Proposed:** `['academic', 'preschool', 'summer']`
- **Diff:** +academic
- **Reasoning:** description keyword → +academic
- **Confidence:** medium

### Camp Carrollton (`camp-carrollton`)

- **Current:** `['academic', 'arts', 'general', 'religious', 'sports', 'theater']`
- **Proposed:** `['academic', 'arts', 'culinary', 'general', 'religious', 'sailing', 'sports', 'theater']`
- **Diff:** +culinary, +sailing
- **Reasoning:** description keyword → +culinary, +sailing
- **Confidence:** medium

### Miami Beach JCC — Camp Klurman (`camp-klurman-jcc`)

- **Current:** `['cultural', 'general', 'summer']`
- **Proposed:** `['cultural', 'general', 'religious', 'summer']`
- **Diff:** +religious
- **Reasoning:** description keyword → +religious
- **Confidence:** medium

### Camp STEAMology at Museum of Discovery and Science (`camp-steamology-at-museum-of-discovery-and-science`)

- **Current:** `['arts', 'general', 'maker', 'stem']`
- **Proposed:** `['arts', 'general', 'maker', 'outdoor', 'stem']`
- **Diff:** +outdoor
- **Reasoning:** description keyword → +outdoor
- **Confidence:** medium

### Camp Tamarac (`camp-tamarac`)

- **Current:** `['arts', 'general', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'outdoor', 'sports', 'swim']`
- **Diff:** +outdoor
- **Reasoning:** description keyword → +outdoor
- **Confidence:** medium

### City of Aventura STEM Camp (`city-of-aventura-stem-camp`)

- **Current:** `['maker', 'stem']`
- **Proposed:** `['academic', 'maker', 'stem']`
- **Diff:** +academic
- **Reasoning:** description keyword → +academic
- **Confidence:** medium

### Coconut Grove Montessori Summer Camp (`coconut-grove-montessori-summer-camp`)

- **Current:** `['general', 'preschool', 'stem']`
- **Proposed:** `['academic', 'general', 'preschool', 'stem']`
- **Diff:** +academic
- **Reasoning:** description keyword → +academic
- **Confidence:** medium

### David Posnack JCC Adventure Camp (`david-posnack-jcc-adventure-camp`)

- **Current:** `['adventure', 'outdoor', 'sports']`
- **Proposed:** `['adventure', 'outdoor', 'religious', 'sports']`
- **Diff:** +religious
- **Reasoning:** description keyword → +religious
- **Confidence:** medium

### Key Biscayne Aquatic Camp (`key-biscayne-aquatic-camp`)

- **Current:** `['outdoor', 'sports', 'swim']`
- **Proposed:** `['outdoor', 'religious', 'sports', 'swim']`
- **Diff:** +religious
- **Reasoning:** description keyword → +religious
- **Confidence:** medium

### Machane Miami (`machane-miami`)

- **Current:** `['arts', 'cultural', 'general', 'religious', 'sports', 'swim']`
- **Proposed:** `['arts', 'culinary', 'cultural', 'general', 'religious', 'sports', 'swim']`
- **Diff:** +culinary
- **Reasoning:** description keyword → +culinary
- **Confidence:** medium

### Miami Country Day School Summer Camp (`miami-country-day-school-summer-camp`)

- **Current:** `['academic', 'arts', 'general', 'sports', 'swim']`
- **Proposed:** `['academic', 'arts', 'culinary', 'general', 'sports', 'swim']`
- **Diff:** +culinary
- **Reasoning:** description keyword → +culinary
- **Confidence:** medium

### O.B. Johnson Park Summer Camp (`o-b-johnson-park-summer-camp`)

- **Current:** `['arts', 'general', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'outdoor', 'sports', 'swim']`
- **Diff:** +outdoor
- **Reasoning:** description keyword → +outdoor
- **Confidence:** medium

### Pembroke Pines Sports Specialty Camps (`pembroke-pines-sports-specialty-camps`)

- **Current:** `['sports']`
- **Proposed:** `['sports', 'tennis']`
- **Diff:** +tennis
- **Reasoning:** description keyword → +tennis
- **Confidence:** medium

### Shake-a-Leg Miami Summer Camp (`shake-a-leg-miami-summer-camp`)

- **Current:** `['adventure', 'nature', 'outdoor', 'sports', 'swim']`
- **Proposed:** `['adventure', 'nature', 'outdoor', 'sailing', 'sports', 'swim']`
- **Diff:** +sailing
- **Reasoning:** description keyword → +sailing
- **Confidence:** medium

### Tidal Cove Waterpark (`tidal-cove`)

- **Current:** `['active', 'water']`
- **Proposed:** `['active', 'outdoor', 'water']`
- **Diff:** +outdoor
- **Reasoning:** description keyword → +outdoor
- **Confidence:** medium

## Section C — Low-confidence / weird / needs Rasheid's eye

**Count: 0 camps.**

## Section D — No changes proposed (already correctly categorized)

**Count: 94 camps.**

### 305 Mini Chefs (`305-mini-chefs`)

- **Current:** `['culinary']`
- **Proposed:** `['culinary']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### All Kids Included Youth Arts Creative Arts Summer Camp (`all-kids-included-youth-arts-creative-arts-summer-camp`)

- **Current:** `['arts', 'cultural', 'general', 'music', 'theater']`
- **Proposed:** `['arts', 'cultural', 'general', 'music', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Beaux Arts Summer Camp (`beaux-arts-lowe`)

- **Current:** `['arts', 'summer']`
- **Proposed:** `['arts', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Belen Jesuit Summer Camp (`belen-jesuit-summer-camp`)

- **Current:** `['academic', 'general', 'religious', 'sports']`
- **Proposed:** `['academic', 'general', 'religious', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Black Bear at A.D. Barnes Park Nature Center (`camp-black-bear-at-a-d-barnes-park-nature-center`)

- **Current:** `['general', 'nature', 'outdoor', 'stem']`
- **Proposed:** `['general', 'nature', 'outdoor', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Chameleon at Markham Park (`camp-chameleon-at-markham-park`)

- **Current:** `['adventure', 'general', 'nature', 'outdoor']`
- **Proposed:** `['adventure', 'general', 'nature', 'outdoor']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Discover at FIU (`camp-discover-at-fiu`)

- **Current:** `['academic', 'general', 'stem']`
- **Proposed:** `['academic', 'general', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Explore at FIU (`camp-explore-at-fiu`)

- **Current:** `['academic', 'general', 'stem']`
- **Proposed:** `['academic', 'general', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Gulliver (`camp-gulliver`)

- **Current:** `['academic', 'arts', 'general', 'sports', 'stem']`
- **Proposed:** `['academic', 'arts', 'general', 'sports', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Hummingbird at Castellow Hammock Park (`camp-hummingbird-at-castellow-hammock-park`)

- **Current:** `['general', 'nature', 'outdoor']`
- **Proposed:** `['general', 'nature', 'outdoor']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp J Miami at Alper JCC (`camp-j-miami-at-alper-jcc`)

- **Current:** `['arts', 'cultural', 'general', 'religious', 'sports', 'stem', 'swim', 'theater']`
- **Proposed:** `['arts', 'cultural', 'general', 'religious', 'sports', 'stem', 'swim', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Kadima at David Posnack JCC (`camp-kadima-at-david-posnack-jcc`)

- **Current:** `['arts', 'cultural', 'general', 'religious', 'sports', 'swim']`
- **Proposed:** `['arts', 'cultural', 'general', 'religious', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Live Oak (`camp-live-oak`)

- **Current:** `['adventure', 'nature', 'outdoor', 'sports']`
- **Proposed:** `['adventure', 'nature', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Manatee at Arch Creek Park (`camp-manatee-at-arch-creek-park`)

- **Current:** `['general', 'nature', 'outdoor', 'sports']`
- **Proposed:** `['general', 'nature', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Manatee at Greynolds Park (`camp-manatee-at-greynolds-park`)

- **Current:** `['general', 'nature', 'outdoor']`
- **Proposed:** `['general', 'nature', 'outdoor']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Maritime FL (`camp-maritime-fl`)

- **Current:** `['adventure', 'nature', 'outdoor', 'sports', 'swim']`
- **Proposed:** `['adventure', 'nature', 'outdoor', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Matecumbe (`camp-matecumbe`)

- **Current:** `['academic', 'general', 'outdoor', 'sports']`
- **Proposed:** `['academic', 'general', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Nova at NSU University School (`camp-nova-at-nsu-university-school`)

- **Current:** `['academic', 'arts', 'general', 'sports', 'stem', 'swim']`
- **Proposed:** `['academic', 'arts', 'general', 'sports', 'stem', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Palmetto Bay at Coral Reef Park (`camp-palmetto-bay-at-coral-reef-park`)

- **Current:** `['arts', 'general', 'outdoor', 'sports']`
- **Proposed:** `['arts', 'general', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Pinecrest Summer Camp (`camp-pinecrest-summer-camp`)

- **Current:** `['academic', 'arts', 'general', 'sports']`
- **Proposed:** `['academic', 'arts', 'general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Shemesh (`camp-shemesh`)

- **Current:** `['cultural', 'general', 'summer']`
- **Proposed:** `['cultural', 'general', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Sinai at Temple Sinai of Hollywood (`camp-sinai-at-temple-sinai-of-hollywood`)

- **Current:** `['cultural', 'general', 'religious', 'swim']`
- **Proposed:** `['cultural', 'general', 'religious', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Camp Victory at Vista View Park (`camp-victory-at-vista-view-park`)

- **Current:** `['adventure', 'nature', 'outdoor', 'sports']`
- **Proposed:** `['adventure', 'nature', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Aventura Art Camp (`city-of-aventura-art-camp`)

- **Current:** `['arts', 'cultural']`
- **Proposed:** `['arts', 'cultural']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Aventura General Camp (`city-of-aventura-general-camp`)

- **Current:** `['arts', 'general', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Aventura Sports Camp (`city-of-aventura-sports-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Doral Camp Unbeatables (`city-of-doral-camp-unbeatables`)

- **Current:** `['general', 'sports']`
- **Proposed:** `['general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Hialeah Creative Learning & Play Summer Camp (`city-of-hialeah-creative-learning-play-summer-camp`)

- **Current:** `['arts', 'general', 'sports']`
- **Proposed:** `['arts', 'general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Homestead Summer Camp 2026 (`city-of-homestead-summer-camp-2026`)

- **Current:** `['general', 'sports', 'stem']`
- **Proposed:** `['general', 'sports', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Plantation Central Park Summer Camp (`city-of-plantation-central-park-summer-camp`)

- **Current:** `['arts', 'general', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Sunny Isles Beach Summer Camps (`city-of-sunny-isles-beach-summer-camps`)

- **Current:** `['arts', 'general', 'sports']`
- **Proposed:** `['arts', 'general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### City of Sunrise Summer Camp (`city-of-sunrise-summer-camp`)

- **Current:** `['general', 'sports']`
- **Proposed:** `['general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Club P.L.A.Y. Summer Camp (`club-p-l-a-y-summer-camp`)

- **Current:** `['general']`
- **Proposed:** `['general']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Coconut Grove Sailing Club Camp (`coconut-grove-sailing`)

- **Current:** `['sailing', 'sports', 'summer']`
- **Proposed:** `['sailing', 'sports', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Code Ninjas Aventura Summer Camp (`code-ninjas-aventura-summer-camp`)

- **Current:** `['coding', 'maker', 'stem']`
- **Proposed:** `['coding', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Coral Gables Theatre Summer Camp (`coral-gables-theatre-summer-camp`)

- **Current:** `['arts', 'music', 'theater']`
- **Proposed:** `['arts', 'music', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Crandon Golf Academy (`crandon-golf-academy`)

- **Current:** `['golf', 'sports', 'summer']`
- **Proposed:** `['golf', 'sports', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Ritz Carlton Tennis Camp (`crandon-tennis`)

- **Current:** `['sports', 'summer', 'tennis']`
- **Proposed:** `['sports', 'summer', 'tennis']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Cutler Bay Careers in STEM Summer Camp (`cutler-bay-careers-in-stem-summer-camp`)

- **Current:** `['coding', 'maker', 'stem']`
- **Proposed:** `['coding', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Cutler Bay Summer Camp (`cutler-bay-summer-camp`)

- **Current:** `['arts', 'general', 'outdoor', 'sports', 'swim']`
- **Proposed:** `['arts', 'general', 'outdoor', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Davis Fencing Academy — Summer Battle Camps (`davis-fencing`)

- **Current:** `['fencing', 'sports', 'summer']`
- **Proposed:** `['fencing', 'sports', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate Summer Camp — Eco (`deering-estate-eco`)

- **Current:** `['nature', 'outdoor', 'summer']`
- **Proposed:** `['nature', 'outdoor', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate Summer Camp — Expedition (`deering-estate-expedition`)

- **Current:** `['adventure', 'nature', 'summer']`
- **Proposed:** `['adventure', 'nature', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate Fall Camp (`deering-fall`)

- **Current:** `['nature', 'short_break']`
- **Proposed:** `['nature', 'short_break']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate — Mini Camp (teacher planning days) (`deering-mini`)

- **Current:** `['nature', 'one_day']`
- **Proposed:** `['nature', 'one_day']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate Spring Camp (`deering-spring`)

- **Current:** `['nature', 'spring_break']`
- **Proposed:** `['nature', 'spring_break']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Deering Estate Winter Camp (`deering-winter`)

- **Current:** `['nature', 'winter_break']`
- **Proposed:** `['nature', 'winter_break']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Epiphany Lutheran Nursery School Summer Camp (`epiphany-lutheran-nursery-school-summer-camp`)

- **Current:** `['preschool', 'religious']`
- **Proposed:** `['preschool', 'religious']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Fairchild Tropical Botanic Garden Camp (`fairchild-gardens-camp`)

- **Current:** `['nature', 'summer']`
- **Proposed:** `['nature', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### FIU Theatre Summer Camp (`fiu-theatre-summer-camp`)

- **Current:** `['arts', 'music', 'theater']`
- **Proposed:** `['arts', 'music', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Flamingo Park Multi-Sport Camp (`flamingo-park-multi-sport-camp`)

- **Current:** `['outdoor', 'sports', 'swim']`
- **Proposed:** `['outdoor', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Fort Lauderdale Parks Summer Camp (`fort-lauderdale-parks-summer-camp`)

- **Current:** `['arts', 'general', 'outdoor', 'sports']`
- **Proposed:** `['arts', 'general', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Gerard Loisel's Marine Biology Camp (`gerard-loisel-s-marine-biology-camp`)

- **Current:** `['animals', 'nature', 'outdoor', 'stem']`
- **Proposed:** `['animals', 'nature', 'outdoor', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Harmony Camp at Beth David (`harmony-camp-at-beth-david`)

- **Current:** `['arts', 'music', 'preschool', 'religious']`
- **Proposed:** `['arts', 'music', 'preschool', 'religious']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Hollywood Jr. Beach Lifeguard Program (`hollywood-jr-beach-lifeguard-program`)

- **Current:** `['adventure', 'outdoor', 'sports', 'swim']`
- **Proposed:** `['adventure', 'outdoor', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Hollywood M.O.S.T. Camp (`hollywood-m-o-s-t-camp`)

- **Current:** `['academic', 'arts', 'general', 'sports', 'swim']`
- **Proposed:** `['academic', 'arts', 'general', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### iD Tech Camps at University of Miami (`id-tech-camps-at-university-of-miami`)

- **Current:** `['coding', 'maker', 'stem']`
- **Proposed:** `['coding', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Ingalls Park Teen Summer Camp (`ingalls-park-teen-summer-camp`)

- **Current:** `['general', 'sports']`
- **Proposed:** `['general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Jungle Island (`jungle-island`)

- **Current:** `['animals', 'nature']`
- **Proposed:** `['animals', 'nature']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Key Biscayne Community Center Summer Camp (`key-biscayne-community-center-summer-camp`)

- **Current:** `['arts', 'general', 'nature', 'sports', 'swim', 'theater']`
- **Proposed:** `['arts', 'general', 'nature', 'sports', 'swim', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### KLA Academy Summer Camp (`kla-academy-summer`)

- **Current:** `['general', 'summer']`
- **Proposed:** `['general', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### La Piazza Academy Summer Camp (`la-piazza-academy-summer-camp`)

- **Current:** `['academic', 'general', 'preschool']`
- **Proposed:** `['academic', 'general', 'preschool']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Marjory Stoneman Douglas Biscayne Nature Center Summer Camp (`marjory-stoneman-douglas-biscayne-nature-center-summer-camp`)

- **Current:** `['animals', 'nature', 'outdoor', 'stem']`
- **Proposed:** `['animals', 'nature', 'outdoor', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Miami Lakes STEAM Summer Camp (`miami-lakes-steam-summer-camp`)

- **Current:** `['maker', 'sports', 'stem']`
- **Proposed:** `['maker', 'sports', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### MOCA Summer Art Camp (`moca-summer-art-camp`)

- **Current:** `['arts', 'maker']`
- **Proposed:** `['arts', 'maker']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Oakland Park Summer Camp (`oakland-park-summer-camp`)

- **Current:** `['academic', 'arts', 'general', 'sports']`
- **Proposed:** `['academic', 'arts', 'general', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pembroke Pines Art Camp (`pembroke-pines-art-camp`)

- **Current:** `['arts', 'cultural']`
- **Proposed:** `['arts', 'cultural']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pembroke Pines Drama Camp (`pembroke-pines-drama-camp`)

- **Current:** `['arts', 'theater']`
- **Proposed:** `['arts', 'theater']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pembroke Pines Early Development Center Summer Camp (`pembroke-pines-early-development-center-summer-camp`)

- **Current:** `['academic', 'general', 'preschool']`
- **Proposed:** `['academic', 'general', 'preschool']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pine Crest Summer Camp (`pine-crest-summer-camp`)

- **Current:** `['academic', 'arts', 'general', 'sports', 'stem']`
- **Proposed:** `['academic', 'arts', 'general', 'sports', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pinecrest Flag Football Summer Camp (`pinecrest-flag-football-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pinecrest Lacrosse Summer Camp (`pinecrest-lacrosse-summer-camp`)

- **Current:** `['sports']`
- **Proposed:** `['sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Pinecrest Robotics Summer Camp (`pinecrest-robotics-summer-camp`)

- **Current:** `['coding', 'maker', 'stem']`
- **Proposed:** `['coding', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Ransom Everglades Sports Camps (`ransom-everglades-sports`)

- **Current:** `['sports', 'summer']`
- **Proposed:** `['sports', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Riviera Day Camp (`riviera-day-camp`)

- **Current:** `['general', 'summer']`
- **Proposed:** `['general', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Riviera Junior Camp (`riviera-junior-camp`)

- **Current:** `['academic', 'general', 'preschool']`
- **Proposed:** `['academic', 'general', 'preschool']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### School of Rock Coconut Grove Summer Music Camps (`school-of-rock-coconut-grove-summer-music-camps`)

- **Current:** `['arts', 'music']`
- **Proposed:** `['arts', 'music']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Scott Rakow Youth Center Kayaking Summer Camp (`scott-rakow-youth-center-kayaking-summer-camp`)

- **Current:** `['adventure', 'outdoor', 'sports', 'swim']`
- **Proposed:** `['adventure', 'outdoor', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Sky Zone Doral (`sky-zone-doral`)

- **Current:** `['active', 'indoor']`
- **Proposed:** `['active', 'indoor']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Snapology of Miami Beach Summer Camp (`snapology-of-miami-beach-summer-camp`)

- **Current:** `['coding', 'maker', 'stem']`
- **Proposed:** `['coding', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### South Miami City Summer Camp (`south-miami-city`)

- **Current:** `['arts', 'general', 'sports', 'summer']`
- **Proposed:** `['arts', 'general', 'sports', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### South Miami City One-Day Camp (`south-miami-one-day`)

- **Current:** `['one_day']`
- **Proposed:** `['one_day']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### South Miami City Spring Break Camp (`south-miami-spring`)

- **Current:** `['spring_break']`
- **Proposed:** `['spring_break']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### South Miami City Winter Break Camp (`south-miami-winter`)

- **Current:** `['winter_break']`
- **Proposed:** `['winter_break']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### STARS Summer Camp at Evelyn Greer Park (`stars-summer-camp-at-evelyn-greer-park`)

- **Current:** `['general', 'outdoor', 'sports']`
- **Proposed:** `['general', 'outdoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### STEAM Summer Camp with Discovery Lab at Pinecrest Gardens (`steam-summer-camp-with-discovery-lab-at-pinecrest-gardens`)

- **Current:** `['general', 'maker', 'stem']`
- **Proposed:** `['general', 'maker', 'stem']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Weston YMCA Family Center Summer Camp (`weston-ymca-family-center-summer-camp`)

- **Current:** `['general', 'sports', 'swim']`
- **Proposed:** `['general', 'sports', 'swim']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Weston Youth Center for Musical Arts Summer Music Camp (`weston-youth-center-for-musical-arts-summer-music-camp`)

- **Current:** `['arts', 'music']`
- **Proposed:** `['arts', 'music']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Wise Choice Summer Camp — FIU campus (`wise-choice-fiu`)

- **Current:** `['general', 'summer']`
- **Proposed:** `['general', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Wise Choice Summer Camp — UM campus (`wise-choice-um`)

- **Current:** `['academic', 'general', 'summer']`
- **Proposed:** `['academic', 'general', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Xtreme Action Park Summer Camp (`xtreme-action-park-summer-camp`)

- **Current:** `['adventure', 'general', 'indoor', 'sports']`
- **Proposed:** `['adventure', 'general', 'indoor', 'sports']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### YMCA of South Florida — Day Off Camp (`ymca-sfl-day-off`)

- **Current:** `['one_day']`
- **Proposed:** `['one_day']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Young at Art Museum Summer Art Camp (`young-at-art-museum-summer-art-camp`)

- **Current:** `['arts', 'cultural', 'maker']`
- **Proposed:** `['arts', 'cultural', 'maker']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

### Zoo Miami Summer Camp (`zoo-miami-summer`)

- **Current:** `['animals', 'nature', 'summer']`
- **Proposed:** `['animals', 'nature', 'summer']`
- **Diff:** (no add)
- **Reasoning:** no change — already canonical
- **Confidence:** n/a

