# Camp Structured Fields Proposal — 2026-04-27

_Generated overnight by `scripts/parse-camps-structured-fields.ts` as Goal 2 of the Phase B prep run. **No production data was modified.** Migration 054 (which adds the columns these fields populate) is committed but not yet applied._

## Summary

- Total camps analyzed: 99
- Section A (high confidence — most fields parsed cleanly): **3**
- Section B (medium confidence — some fields ambiguous): **79**
- Section C (low confidence — minimal extraction): **17**
- Section D (no extraction — description too thin): **0**

### Confidence legend

- 🟢 high · 🟡 medium · 🟠 low · ⚪ none/null

### How to use this doc

1. Apply migration 054 (`pnpm exec supabase db push --include-all`).
2. Skim Section A — those camps are batch-approvable. Stage 2 prompt can synthesize a UPDATE migration from the JSON values shown.
3. Read Section B per-camp — most have one or two fields needing your eye.
4. Section C + D camps stay null on the new structured fields until a human or operator fills them in via the admin form (Phase B continued).

---

## Section A — High confidence (3 camps)

### Camp Black Bear at A.D. Barnes Park Nature Center (`camp-black-bear-at-a-d-barnes-park-nature-center`)

**Source:** research-json · **Overall confidence:** 🟢 high

**Description excerpt:**
> Nature-based summer day camp at A.D. Barnes Park Nature Center where campers perform scientific experiments, go on environmental field trips, enjoy pool days, and engage in outdoor physical activities

**Proposed structured fields:**

- 🟢 **tagline:** "Nature-based summer day camp at A.D. Barnes Park Nature Center where campers perform scientific experiments, go on environmental field trips…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":10000,"notes":"$100 per week with $15 one-time membership registration. Before/after care included at no extra charge."}]`
- 🟢 **activities:** `Nature`, `Environmental`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "Before-care from 08:00; After-care until 18:00"

### Shake-a-Leg Miami Summer Camp (`shake-a-leg-miami-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟢 high

**Description excerpt:**
> Adaptive waterfront summer camp offering inclusive sailing, paddleboarding, and marine science programming for children and teens with and without disabilities.

**Proposed structured fields:**

- 🟢 **tagline:** "Adaptive waterfront summer camp offering inclusive sailing, paddleboarding, and marine science programming for children and teens with and without disabilities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":40000,"notes":"$400/week; aftercare $100 extra. 25% early-bird discount. Scholarships for qualifying City of Miami district residents."}]`
- 🟢 **activities:** `Sailing`, `Paddleboarding`, `Science`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "After-care"

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### The Growing Place Summer Camp 2026 (`the-growing-place-summer-camp`)

**Source:** manual-curated · **Overall confidence:** 🟢 high

**Description excerpt:**
> Stomp, chomp, and ROAR your way into a dino-mite summer adventure!

**Proposed structured fields:**

- 🟢 **tagline:** "Stomp, chomp, and ROAR your way into a dino-mite summer."
- 🟢 **sessions:** `[{"label":"Session One","start_date":"2026-06-15","end_date":"2026-07-02","weekly_themes":["How Do Dinosaurs Play with Their Friends?","How Do Dinosaurs Say I Love You?","How Do Dinosaurs Choose Their Pets?"],"notes":"No camp June 19 + July 3"},{"label":"Session Two","start_date":"2026-07-06","end_date":"2026-07-24","weekly_themes":["How Do Dinosaurs Say Happy Birthday?","How Do Dinosaurs Eat Their Food?","How Do Dinosaurs Say Good Night?"],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Half-day","hours":"9:00 AM – 12:30 PM","session_price_cents":70000,"both_sessions_price_cents":130000,"weekly_price_cents":28500,"notes":null},{"label":"Full-day","hours":"9:00 AM – 3:00 PM","session_price_cents":80000,"both_sessions_price_cents":150000,"weekly_price_cents":31500,"notes":null}]`
- 🟢 **activities:** `Arts & Crafts`, `Cooking`, `STEM Lab`, `Music & Movement`, `Water Play`, `In-house Field Trips`
- 🟢 **fees:** `[{"label":"Registration fee","amount_cents":15000,"refundable":false,"notes":null},{"label":"Security fee","amount_cents":15000,"refundable":false,"notes":null},{"label":"Camp tuition deposit","amount_cents":null,"refundable":false,"notes":"50% of tuition, non-transferable"}]`
- 🟢 **enrollment_window:** `{"opens_at":"2026-04-02T15:00:00Z","closes_at":null,"status":"until_full"}`
- 🟡 **what_to_bring:** `lunch (or order via Our Lunches)`, `water bottle`, `swim clothes`
- 🟢 **lunch_policy:** "Lunch from home or order via Our Lunches. Pizza Friday every week. Morning snack included."
- 🟢 **extended_care_policy:** "Early Morning Care 8:00–8:45 AM, $40/week (pre-registration required, no drop-ins)."

**Notes:**
- Source: TGP 2026 flyer, transcribed in migration 053.
- Methodist-affiliated venue (First United Methodist Church of Coral Gables).
- DCF License C11MD0470.

## Section B — Medium confidence (79 camps)

### Camp Manatee at Arch Creek Park (`camp-manatee-at-arch-creek-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Nature-based Miami-Dade County Parks summer day camp at Arch Creek Park in North Miami with scientific experiments, environmental field trips, pool days, and athletic activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Nature-based Miami-Dade County Parks summer day camp at Arch Creek Park in North Miami with scientific experiments, environmental field trips, pool days, and athletic activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Nature`, `Environmental`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Manatee at Greynolds Park (`camp-manatee-at-greynolds-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Miami-Dade County Parks nature-based summer camp at Greynolds Park Boathouse with environmental field trips, pool days, and athletic activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Miami-Dade County Parks nature-based summer camp at Greynolds Park Boathouse with environmental field trips, pool days, and athletic activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Nature`, `Environmental`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Hummingbird at Castellow Hammock Park (`camp-hummingbird-at-castellow-hammock-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Nature-based summer camp at Castellow Hammock Nature Center in Homestead with scientific experiments, environmental field trips, and outdoor physical activities under naturalist supervision.

**Proposed structured fields:**

- 🟢 **tagline:** "Nature-based summer camp at Castellow Hammock Nature Center in Homestead with scientific experiments, environmental field trips, and outdoor…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Nature`, `Environmental`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Matecumbe (`camp-matecumbe`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Miami-Dade County Parks summer camp with physical fitness, sports, academic enrichment, literacy, cultural arts, social skills development, healthy snacks, and field trips for tweens and teens.

**Proposed structured fields:**

- 🟢 **tagline:** "Miami-Dade County Parks summer camp with physical fitness, sports, academic enrichment, literacy, cultural arts, social skills development,…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts`, `Sports`, `Field Trips`, `Fitness`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### All Kids Included Youth Arts Creative Arts Summer Camp (`all-kids-included-youth-arts-creative-arts-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Inclusive creative arts summer camp for children and youth with and without disabilities, offered in partnership with local arts organizations across Miami-Dade parks.

**Proposed structured fields:**

- 🟢 **tagline:** "Inclusive creative arts summer camp for children and youth with and without disabilities, offered in partnership with local arts organizations across Miami-Dade parks."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":18000,"notes":"Program fees $180; youth with disabilities welcome through age 22."}]`
- 🟡 **activities:** `Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp J Miami at Alper JCC (`camp-j-miami-at-alper-jcc`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Full-summer Jewish day camp on a 23-acre Kendall campus with gymnasium, pool, splash-pad, art studio, and professional theater, serving children from infant age through 10th grade.

**Proposed structured fields:**

- 🟢 **tagline:** "Full-summer Jewish day camp on a 23-acre Kendall campus with gymnasium, pool, splash-pad, art studio, and professional theater, serving children from infant age through 10th grade."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Theater`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Machane Miami (`machane-miami`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Jewish day camp on the South Campus of Yeshiva Toras Chaim Toras Emes with specialty activities including sports, gymnastics, maker's club, archery, dance, martial arts, swimming, arts and crafts, and

**Proposed structured fields:**

- 🟢 **tagline:** "Jewish day camp on the South Campus of Yeshiva Toras Chaim Toras Emes with specialty activities including sports, gymnastics, maker's club,…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Swim`, `Swimming`, `Dance`, `Cooking`, `Martial Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Harmony Camp at Beth David (`harmony-camp-at-beth-david`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Creative, joyful, movement-based arts camp at Beth David Reform Congregation open to interfaith and multicultural families. Full and half-day options.

**Proposed structured fields:**

- 🟢 **tagline:** "Creative, joyful, movement-based arts camp at Beth David Reform Congregation open to interfaith and multicultural families."
- 🟡 **sessions:** `[{"label":"Harmony Camp 2026","start_date":"2026-08-11","end_date":"2026-08-29","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### MOCA Summer Art Camp (`moca-summer-art-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly summer art camps at the Museum of Contemporary Art in North Miami with hands-on contemporary art exploration led by working artists.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly summer art camps at the Museum of Contemporary Art in North Miami with hands-on contemporary art exploration led by working artists."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":22000,"notes":"$220/week non-member; $195/week MOCA Family Membership level and above."}]`
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Miami Youth Sailing Foundation Summer Camp (`miami-youth-sailing-foundation-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Youth sailing, windsurfing, SUP, and environmental discovery camp on Biscayne Bay at Miami Yacht Club, offered over 6 weeks in summer 2026.

**Proposed structured fields:**

- 🟢 **tagline:** "Youth sailing, windsurfing, SUP, and environmental discovery camp on Biscayne Bay at Miami Yacht Club, offered over 6 weeks in summer 2026."
- 🟡 **sessions:** `[{"label":"Summer 2026 (6 weeks)","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Sailing`, `Surfing`, `Environmental`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- 🟢 **lunch_policy:** "Lunch from home"
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Carrollton (`camp-carrollton`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Traditional day camp at the Carrollton School campus in Coconut Grove with sailing, lacrosse, athletics, tennis, art, culinary, and performing arts tracks. Serves PK3 through Grade 8.

**Proposed structured fields:**

- 🟢 **tagline:** "Traditional day camp at the Carrollton School campus in Coconut Grove with sailing, lacrosse, athletics, tennis, art, culinary, and performing arts tracks."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts`, `Tennis`, `Sailing`, `Culinary`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "After-care"

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Coconut Grove Montessori Summer Camp (`coconut-grove-montessori-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Montessori-rooted summer camp with science camp programming and a dedicated Toddler Science Camp. Half-day schedule, with themed weeks.

**Proposed structured fields:**

- 🟢 **tagline:** "Montessori-rooted summer camp with science camp programming and a dedicated Toddler Science Camp."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Science`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Neighborhood Tennis Summer Camp at Kirk Munroe (`neighborhood-tennis-summer-camp-at-kirk-munroe`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer tennis camp at Kirk Munroe Tennis Center in the heart of Coconut Grove with expert coaching, skill-building drills, and match play for ages 3 and up.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer tennis camp at Kirk Munroe Tennis Center in the heart of Coconut Grove with expert coaching, skill-building drills, and match play for ages 3 and up."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### School of Rock Coconut Grove Summer Music Camps (`school-of-rock-coconut-grove-summer-music-camps`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly summer music camps at School of Rock Coconut Grove with rehearsals, practice time, and a Friday live performance. Rookies program for ages 5+ and Rock 101 for ages 8-13.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly summer music camps at School of Rock Coconut Grove with rehearsals, practice time, and a Friday live performance."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Music`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Gulliver (`camp-gulliver`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp at Gulliver Prep's Coral Gables campus with academic, sports, arts, and specialty tracks for ages 3-18.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp at Gulliver Prep's Coral Gables campus with academic, sports, arts, and specialty tracks for ages 3-18."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`, `Sports`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Belen Jesuit Summer Camp (`belen-jesuit-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Multi-discipline summer day camp at Belen Jesuit Preparatory School with athletics, arts, and enrichment activities for boys and girls ages 4-14.

**Proposed structured fields:**

- 🟢 **tagline:** "Multi-discipline summer day camp at Belen Jesuit Preparatory School with athletics, arts, and enrichment activities for boys and girls ages 4-14."
- 🟡 **sessions:** `[{"label":"Belen Summer Camp 2026","start_date":"2026-06-15","end_date":"2026-07-24","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### STEAM Summer Camp with Discovery Lab at Pinecrest Gardens (`steam-summer-camp-with-discovery-lab-at-pinecrest-gardens`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly STEAM-themed summer camp at Pinecrest Gardens covering chemistry, engineering, energy, and life sciences with hands-on activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly STEAM-themed summer camp at Pinecrest Gardens covering chemistry, engineering, energy, and life sciences with hands-on activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Science`, `Engineering`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Dance and Crafts Summer Camp at Pinecrest Gardens (`dance-and-crafts-summer-camp-at-pinecrest-gardens`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Half-day summer camp at Pinecrest Gardens focused on dance styles, arts & crafts, theater, costume and makeup design.

**Proposed structured fields:**

- 🟢 **tagline:** "Half-day summer camp at Pinecrest Gardens focused on dance styles, arts & crafts, theater, costume and makeup design."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Dance`, `Theater`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Toddler Summer Camp with Pinecrest Dance Project (`toddler-summer-camp-with-pinecrest-dance-project`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Half-day summer camp for toddlers mixing art, gymnastics, and music.

**Proposed structured fields:**

- 🟢 **tagline:** "Half-day summer camp for toddlers mixing art, gymnastics, and music."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Music`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Coral Gables Basketball Summer Camp (`coral-gables-basketball-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer basketball camp offering fundamental skills instruction plus on-court game experience, offensive and defensive strategies, and physical conditioning.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer basketball camp offering fundamental skills instruction plus on-court game experience, offensive and defensive strategies, and physical conditioning."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Basketball`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Coral Gables Theatre Summer Camp (`coral-gables-theatre-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> One-week summer theatre camp covering acting, singing, dancing, directing, costume design, set design, and pantomime — for campers passionate about theatre.

**Proposed structured fields:**

- 🟢 **tagline:** "One-week summer theatre camp covering acting, singing, dancing, directing, costume design, set design, and pantomime — for campers passionate about theatre."
- 🟡 **sessions:** `[{"label":"Summer 2026 (1 week)","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Singing`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Club Kids at the Coral Gables Golf & Country Club (`club-kids-at-the-coral-gables-golf-country-club`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer camp at the Coral Gables Golf & Country Club featuring pool time, fitness, games, and creative arts. Lunches provided by Le Parc-Bonjour Café.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp at the Coral Gables Golf & Country Club featuring pool time, fitness, games, and creative arts."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`, `Fitness`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- 🟢 **lunch_policy:** "Lunch provided"
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Doral Camp Unbeatables (`city-of-doral-camp-unbeatables`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Sports and Life Coaching summer camp at Doral Legacy Park with weekly sessions by age group.

**Proposed structured fields:**

- 🟢 **tagline:** "Sports and Life Coaching summer camp at Doral Legacy Park with weekly sessions by age group."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Sports`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### City of Aventura General Camp (`city-of-aventura-general-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Supervised interactive summer camp with arts & crafts, games, sports, special events, field trips, and swimming at the Aventura Community Recreation Center.

**Proposed structured fields:**

- 🟢 **tagline:** "Supervised interactive summer camp with arts & crafts, games, sports, special events, field trips, and swimming at the Aventura Community Recreation Center."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Swim`, `Swimming`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### City of Aventura Sports Camp (`city-of-aventura-sports-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer basketball camp emphasizing fundamentals of basketball in a supportive environment for athletes of all skill levels.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer basketball camp emphasizing fundamentals of basketball in a supportive environment for athletes of all skill levels."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Basketball`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### City of Aventura STEM Camp (`city-of-aventura-stem-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer STEM camp exploring science, technology, engineering, and math with stimulating projects and weekly field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer STEM camp exploring science, technology, engineering, and math with stimulating projects and weekly field trips."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-07-17","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `STEM`, `Science`, `Engineering`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Key Biscayne Community Center Summer Camp (`key-biscayne-community-center-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer camp for Key Biscayne residents with swimming, sports, art, young artist, marine biology, basketball, volleyball, triathlon, academic success, Broadway musical theater, and dance specialty camp

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp for Key Biscayne residents with swimming, sports, art, young artist, marine biology, basketball, volleyball, triathlon, academic…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Sports`, `Basketball`, `Volleyball`, `Swim`, `Swimming`, `Music`, `Dance`, `Theater`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Marjory Stoneman Douglas Biscayne Nature Center Summer Camp (`marjory-stoneman-douglas-biscayne-nature-center-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Week-long summer day camp led by marine biologists with hands-on exploration of Biscayne Bay ecosystems from June through August.

**Proposed structured fields:**

- 🟢 **tagline:** "Week-long summer day camp led by marine biologists with hands-on exploration of Biscayne Bay ecosystems from June through August."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `STEM`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Key Biscayne Aquatic Camp (`key-biscayne-aquatic-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly aquatic-focused summer camp at Cross Bridge Church in Key Biscayne with swimming and water-based activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly aquatic-focused summer camp at Cross Bridge Church in Key Biscayne with swimming and water-based activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Swim`, `Swimming`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Miami City Ballet Children's Summer Dance (`miami-city-ballet-childrens-summer-dance`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer dance program at Miami City Ballet in Miami Beach for children ages 3 to 8 running late June through late July 2026.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer dance program at Miami City Ballet in Miami Beach for children ages 3 to 8 running late June through late July 2026."
- 🟡 **sessions:** `[{"label":"Children's Summer Dance 2026","start_date":"2026-06-30","end_date":"2026-07-25","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Dance`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### iD Tech Camps at University of Miami (`id-tech-camps-at-university-of-miami`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Week-long STEM and coding day camps on the University of Miami campus offering game design, Python, Java, Minecraft, robotics, 3D modeling, and more.

**Proposed structured fields:**

- 🟢 **tagline:** "Week-long STEM and coding day camps on the University of Miami campus offering game design, Python, Java, Minecraft, robotics, 3D modeling, and more."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟡 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":109900,"notes":"Day camps start at $1,099/week (payment plan available). 2-week overnight Academies ages 13-18 start at $4,699."}]`
- 🟢 **activities:** `STEM`, `Robotics`, `Coding`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Code Ninjas Aventura Summer Camp (`code-ninjas-aventura-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly coding summer camps in Aventura with AM and PM sessions covering Robotics, Roblox, Minecraft, YouTube and more for ages 5-14.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly coding summer camps in Aventura with AM and PM sessions covering Robotics, Roblox, Minecraft, YouTube and more for ages 5-14."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":25000,"notes":"$250/week half-day; $225/week per camp when registering both AM + PM for full day."}]`
- 🟡 **activities:** `Robotics`, `Coding`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Snapology of Miami Beach Summer Camp (`snapology-of-miami-beach-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Weekly STEM/STEAM summer camps using LEGO bricks and technology. Full-day and half-day options, combinable for full-day adventures.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly STEM/STEAM summer camps using LEGO bricks and technology."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":79500,"notes":"Early-bird tiered pricing: $675 Jan, $700 Feb, $725 Mar, $750 Apr, $795 May and later."}]`
- 🟡 **activities:** `STEM`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Miami Country Day School Summer Camp (`miami-country-day-school-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Full-summer day camp at Miami Country Day School offering fishing, swimming, archery, cooking, arts and crafts, dance, and a variety of field and court games.

**Proposed structured fields:**

- 🟢 **tagline:** "Full-summer day camp at Miami Country Day School offering fishing, swimming, archery, cooking, arts and crafts, dance, and a variety of field and court games."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Swim`, `Swimming`, `Dance`, `Cooking`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Epiphany Lutheran Nursery School Summer Camp (`epiphany-lutheran-nursery-school-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Two-week summer camp for current ELNS students and other children ages 2-6, running half-day sessions in late May.

**Proposed structured fields:**

- 🟢 **tagline:** "Two-week summer camp for current ELNS students and other children ages 2-6, running half-day sessions in late May."
- 🟡 **sessions:** `[{"label":"Week 1","start_date":"2026-05-18","end_date":"2026-05-21","weekly_themes":[],"notes":null},{"label":"Week 2","start_date":"2026-05-26","end_date":"2026-05-29","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":14000,"notes":"Early bird $115-$125/week priority reg; regular $140/week on/after April 1."}]`
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Explore at FIU (`camp-explore-at-fiu`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp at FIU's College of Arts, Sciences & Education for children ages 6-14 with educational enrichment activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp at FIU's College of Arts, Sciences & Education for children ages 6-14 with educational enrichment activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`, `Science`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Homestead Summer Camp 2026 (`city-of-homestead-summer-camp-2026`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> 8-week summer day camp at William F. Dickinson Community Center with STEM activities, environmental exploration, career enrichment, and weekly field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "8-week summer day camp at William F."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-07-31","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `STEM`, `Environmental`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "Before-care from 07:30; After-care until 17:30"

### Camp Palmetto Bay at Coral Reef Park (`camp-palmetto-bay-at-coral-reef-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp at Coral Reef Park with arts and crafts, outdoor sports, indoor games, movies, weekly field trips, and radKIDS safety programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp at Coral Reef Park with arts and crafts, outdoor sports, indoor games, movies, weekly field trips, and radKIDS safety programming."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Field Trips`
- ⚪ **fees:** _empty_
- 🟡 **enrollment_window:** `{"opens_at":null,"closes_at":"2026-06-05","status":"open"}`
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Palmetto Bay Tennis Summer Camp (`palmetto-bay-tennis-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Specialty tennis summer camp at Coral Reef Park with on-court instruction and match play.

**Proposed structured fields:**

- 🟢 **tagline:** "Specialty tennis summer camp at Coral Reef Park with on-court instruction and match play."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Tennis`
- ⚪ **fees:** _empty_
- 🟡 **enrollment_window:** `{"opens_at":null,"closes_at":"2026-06-05","status":"open"}`
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Cutler Bay Summer Camp (`cutler-bay-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Eight-week summer day camp at Cutler Ridge Park with arts & crafts, swim days, indoor/outdoor activities, and weekly field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "Eight-week summer day camp at Cutler Ridge Park with arts & crafts, swim days, indoor/outdoor activities, and weekly field trips."
- 🟡 **sessions:** `[{"label":"Session 1","start_date":"2026-06-08","end_date":"2026-06-19","weekly_themes":[],"notes":null},{"label":"Session 2","start_date":"2026-06-22","end_date":"2026-07-03","weekly_themes":[],"notes":null},{"label":"Session 3","start_date":"2026-07-06","end_date":"2026-07-17","weekly_themes":[],"notes":null},{"label":"Session 4","start_date":"2026-07-20","end_date":"2026-07-31","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":20000,"notes":"$200/child, $180/sibling per session (2 weeks). Includes all activities and field trips."}]`
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Swim`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Cutler Bay Careers in STEM Summer Camp (`cutler-bay-careers-in-stem-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Free Careers in STEM summer camp for up to 40 participants entering grades 6-8 with VEX IQ Robot building and programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Free Careers in STEM summer camp for up to 40 participants entering grades 6-8 with VEX IQ Robot building and programming."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟡 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":0,"notes":"Free."}]`
- 🟡 **activities:** `STEM`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Reported price of $0 — verify or override.
- Session row has no dates — research source said "Summer 2026" generically.

### Miami Lakes Dance & Soccer Summer Camp (`miami-lakes-dance-soccer-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp at Miami Lakes Optimist Park offering dance and soccer programming with weekly field trips, run in partnership with YMCA of South Florida.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp at Miami Lakes Optimist Park offering dance and soccer programming with weekly field trips, run in partnership with YMCA of South Florida."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-17","end_date":"2026-08-02","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":14500,"notes":"$35 registration + $145/week per child (includes field trips)."}]`
- 🟢 **activities:** `Soccer`, `Dance`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Miami Lakes STEAM Summer Camp (`miami-lakes-steam-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> STEAM summer camp at Miami Lakes Youth Center with games and sports, robotics, and engineering focus.

**Proposed structured fields:**

- 🟢 **tagline:** "STEAM summer camp at Miami Lakes Youth Center with games and sports, robotics, and engineering focus."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-17","end_date":"2026-08-09","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Sports`, `Robotics`, `Engineering`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Maritime FL (`camp-maritime-fl`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> All-water adventure day camp in Sunny Isles Beach for ages 5-14 with water sports, arts and crafts, team sports, and environmental education.

**Proposed structured fields:**

- 🟢 **tagline:** "All-water adventure day camp in Sunny Isles Beach for ages 5-14 with water sports, arts and crafts, team sports, and environmental education."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Environmental`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Scott Rakow Youth Center Kayaking Summer Camp (`scott-rakow-youth-center-kayaking-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Specialty kayaking camp at Scott Rakow Youth Center for grades 4-8 during Week #3 (June 22-26) of Miami Beach's summer camp season.

**Proposed structured fields:**

- 🟢 **tagline:** "Specialty kayaking camp at Scott Rakow Youth Center for grades 4-8 during Week #3 (June 22-26) of Miami Beach's summer camp season."
- 🟡 **sessions:** `[{"label":"Kayaking Camp Week 3","start_date":"2026-06-22","end_date":"2026-06-26","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Kayaking`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Flamingo Park Multi-Sport Camp (`flamingo-park-multi-sport-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Week-long multi-sport specialty camp at Flamingo Park Locker Room with soccer, basketball, swimming, and other athletic activities for grades 4-8.

**Proposed structured fields:**

- 🟢 **tagline:** "Week-long multi-sport specialty camp at Flamingo Park Locker Room with soccer, basketball, swimming, and other athletic activities for grades 4-8."
- 🟡 **sessions:** `[{"label":"Multi-Sport Camp Week 2","start_date":"2026-06-15","end_date":"2026-06-18","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Soccer`, `Basketball`, `Swim`, `Swimming`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Flamingo Park Tennis Center Summer Camp (`flamingo-park-tennis-center-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer tennis camp at Flamingo Park Tennis Center with development and performance programs for grades PK-12 throughout the Miami Beach summer camp season.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer tennis camp at Flamingo Park Tennis Center with development and performance programs for grades PK-12 throughout the Miami Beach summer camp season."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-08-07","weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":55000,"notes":"PK-8 half-day $330/wk, full-day $475/wk; grades 4-12 half-day $350/wk, full-day $550/wk."}]`
- 🟡 **activities:** `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### ALE Tennis Academy Summer Camp - Doral (`ale-tennis-academy-summer-camp-doral`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer tennis camp at ALE Tennis Academy's Doral location with age- and level-based grouping for beginners, intermediates, and competitive juniors.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer tennis camp at ALE Tennis Academy's Doral location with age- and level-based grouping for beginners, intermediates, and competitive juniors."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Miami Beach Tennis Academy Summer Camp (`miami-beach-tennis-academy-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer tennis camp at the top South Florida tennis academy led by Martin van Daalen with development and high-performance tracks.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer tennis camp at the top South Florida tennis academy led by Martin van Daalen with development and high-performance tracks."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Kadima at David Posnack JCC (`camp-kadima-at-david-posnack-jcc`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> JCC day camp at the David Posnack JCC in Davie for ages 1-14 with core hours 9am-4pm and extended care available. Sports camps and cultural arts options also offered.

**Proposed structured fields:**

- 🟢 **tagline:** "JCC day camp at the David Posnack JCC in Davie for ages 1-14 with core hours 9am-4pm and extended care available."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts`, `Sports`, `Lab`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "Before-care from 07:30; After-care until 18:00"

### David Posnack JCC Adventure Camp (`david-posnack-jcc-adventure-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Adventure summer camp at David Posnack JCC for rising 1st through 9th graders with hands-on outdoor and active programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Adventure summer camp at David Posnack JCC for rising 1st through 9th graders with hands-on outdoor and active programming."
- 🟡 **sessions:** `[{"label":"Adventure Camp 2026","start_date":"2026-06-08","end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "Before-care; After-care"

### Camp STEAMology at Museum of Discovery and Science (`camp-steamology-at-museum-of-discovery-and-science`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Themed week-long summer day camp at MODS Fort Lauderdale with engaging experiments, creative crafts, showtimes, museum exploration, and outdoor play for ages 6-12.

**Proposed structured fields:**

- 🟢 **tagline:** "Themed week-long summer day camp at MODS Fort Lauderdale with engaging experiments, creative crafts, showtimes, museum exploration, and outdoor play for ages 6-12."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":37500,"notes":"$350/wk members, $375/wk non-members. Max 4 weeks per camper per summer."}]`
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Xtreme Action Park Summer Camp (`xtreme-action-park-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer camp and group packages at Fort Lauderdale's Xtreme Action Park featuring go-karts, ropes course, bowling, VR escape rooms, and arcade activities.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp and group packages at Fort Lauderdale's Xtreme Action Park featuring go-karts, ropes course, bowling, VR escape rooms, and arcade activities."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-04-01","end_date":"2026-08-31","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Live Oak (`camp-live-oak`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Outdoor summer camp at Hugh Taylor Birch State Park in Fort Lauderdale with nature-based activities, swimming, and weekly sessions for ages 5-16.

**Proposed structured fields:**

- 🟢 **tagline:** "Outdoor summer camp at Hugh Taylor Birch State Park in Fort Lauderdale with nature-based activities, swimming, and weekly sessions for ages 5-16."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Swim`, `Swimming`, `Nature`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Fort Lauderdale Parks Summer Camp (`fort-lauderdale-parks-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> City-run summer camp at multiple sites including Bass Park Beach Community Center, Carter, Croissant, Lauderdale Manors, Osswald, Riverland, Riverside, and Warfield parks with arts, sports, and fitnes

**Proposed structured fields:**

- 🟢 **tagline:** "City-run summer camp at multiple sites including Bass Park Beach Community Center, Carter, Croissant, Lauderdale Manors, Osswald, Riverland,…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts`, `Sports`, `Fitness`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Fort Lauderdale Sailing Summer Camp (`fort-lauderdale-sailing-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Specialty sailing summer camp for beginners where campers learn to steer, trim sails, identify sailboat parts, tie knots, and learn about the marine environment.

**Proposed structured fields:**

- 🟢 **tagline:** "Specialty sailing summer camp for beginners where campers learn to steer, trim sails, identify sailboat parts, tie knots, and learn about the marine environment."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`, `Sailing`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Fort Lauderdale Tennis and Sports Summer Camp (`fort-lauderdale-tennis-and-sports-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer camp with a primary focus on tennis, allowing children to make new friends, stay active, and learn various sports.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp with a primary focus on tennis, allowing children to make new friends, stay active, and learn various sports."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Sports`, `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Weston YMCA Family Center Summer Camp (`weston-ymca-family-center-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp at Weston YMCA Family Center inside Weston Regional Park with fitness, youth sports, aquatics, and specialty tracks.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp at Weston YMCA Family Center inside Weston Regional Park with fitness, youth sports, aquatics, and specialty tracks."
- 🟡 **sessions:** `[{"label":"Week A","start_date":"2026-06-08","end_date":"2026-06-12","weekly_themes":[],"notes":null},{"label":"Week B","start_date":"2026-06-15","end_date":"2026-06-19","weekly_themes":[],"notes":null},{"label":"Week 1","start_date":"2026-06-22","end_date":"2026-06-26","weekly_themes":[],"notes":null},{"label":"Week 2","start_date":"2026-06-29","end_date":"2026-07-03","weekly_themes":[],"notes":null},{"label":"Week 3","start_date":"2026-07-06","end_date":"2026-07-10","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Sports`, `Fitness`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Weston Youth Center for Musical Arts Summer Music Camp (`weston-youth-center-for-musical-arts-summer-music-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer music camp operating from the Community Center at Weston Regional Park running Monday-Friday 9am-3pm.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer music camp operating from the Community Center at Weston Regional Park running Monday-Friday 9am-3pm."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Music`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pembroke Pines Art Camp (`pembroke-pines-art-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer art camp at the Pembroke Pines Arts and Cultural Center with creative programming for ages 6-11.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer art camp at the Pembroke Pines Arts and Cultural Center with creative programming for ages 6-11."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-07-31","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Pembroke Pines Drama Camp (`pembroke-pines-drama-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer drama camp at Pembroke Pines Arts and Cultural Center for ages 8-12 with theatrical programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer drama camp at Pembroke Pines Arts and Cultural Center for ages 8-12 with theatrical programming."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-07-31","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Arts`, `Drama`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Pembroke Pines Sports Specialty Camps (`pembroke-pines-sports-specialty-camps`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Recreation department specialty camps including Soccer Camp, Tennis Camp, Special Populations Camp, and Golf School from June 17 through August 9, 2026.

**Proposed structured fields:**

- 🟢 **tagline:** "Recreation department specialty camps including Soccer Camp, Tennis Camp, Special Populations Camp, and Golf School from June 17 through August 9, 2026."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-17","end_date":"2026-08-09","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Soccer`, `Tennis`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Pembroke Pines Early Development Center Summer Camp (`pembroke-pines-early-development-center-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer day camp for children K-4th grade with age-appropriate activities, in-house events, and off-site field trips to AMF Bowling, Young at Art, Snapology, Paradise Cove, and Flamingo Gardens.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp for children K-4th grade with age-appropriate activities, in-house events, and off-site field trips to AMF Bowling, Young at…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Plantation Central Park Summer Camp (`city-of-plantation-central-park-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer camp at Plantation Central Park with sports, arts & crafts, field trips, and swimming for ages 5-11 (K-5th grade).

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp at Plantation Central Park with sports, arts & crafts, field trips, and swimming for ages 5-11 (K-5th grade)."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":57500,"notes":"Resident 8wk $900 (first child) / 4wk $475; Non-resident 8wk $1,100 / 4wk $575. Sibling discounts available."}]`
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Swim`, `Swimming`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Tamarac (`camp-tamarac`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> 8-week summer camp at Tamarac Recreation Center with sports, recreational activities, arts and crafts, games, one weekly swim trip to Caporella Aquatic Center, and one weekly field trip.

**Proposed structured fields:**

- 🟢 **tagline:** "8-week summer camp at Tamarac Recreation Center with sports, recreational activities, arts and crafts, games, one weekly swim trip to Capore…"
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts & Crafts`, `Arts`, `Sports`, `Swim`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pine Crest Summer Camp (`pine-crest-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> On-campus summer programming at Pine Crest School Fort Lauderdale for students entering pre-kindergarten through eighth grade with traditional camp plus specialty tracks.

**Proposed structured fields:**

- 🟢 **tagline:** "On-campus summer programming at Pine Crest School Fort Lauderdale for students entering pre-kindergarten through eighth grade with traditional camp plus specialty tracks."
- 🟡 **sessions:** `[{"label":"Pine Crest Summer 2026","start_date":"2026-06-08","end_date":"2026-08-14","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- 🟢 **extended_care_policy:** "Before-care from 08:00; After-care until 17:30"

### Camp Victory at Vista View Park (`camp-victory-at-vista-view-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Outdoor summer camp at Vista View Park in Davie for boys and girls ages 5-15 with sports, crafts, and nature-based programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Outdoor summer camp at Vista View Park in Davie for boys and girls ages 5-15 with sports, crafts, and nature-based programming."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Sports`, `Nature`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Sinai at Temple Sinai of Hollywood (`camp-sinai-at-temple-sinai-of-hollywood`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Synagogue-based summer day camp at Temple Sinai of Hollywood with classrooms, state-of-the-art playground, and supervised swimming pool.

**Proposed structured fields:**

- 🟢 **tagline:** "Synagogue-based summer day camp at Temple Sinai of Hollywood with classrooms, state-of-the-art playground, and supervised swimming pool."
- 🟡 **sessions:** `[{"label":"Summer 2026 (8 weeks)","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- 🟢 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":3000,"notes":"Registration $240 for 8 weeks or $30/week; security fee $160 for 8 weeks or $20/week."}]`
- 🟡 **activities:** `Swim`, `Swimming`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Hollywood M.O.S.T. Camp (`hollywood-m-o-s-t-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Maximize Out of School Time summer camp at Dr. MLK Jr., Washington Park, McNicol, and Kay Gaither Community Centers with reading, math, science, swimming, arts, sports, and field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "Maximize Out of School Time summer camp at Dr. MLK Jr., Washington Park, McNicol, and Kay Gaither Community Centers with reading, math, scie…"
- 🟡 **sessions:** `[{"label":"M.O.S.T. Camp 2026","start_date":"2026-06-09","end_date":"2026-08-08","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Arts`, `Sports`, `Swim`, `Swimming`, `Science`, `Field Trips`, `Reading`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Hollywood Jr. Beach Lifeguard Program (`hollywood-jr-beach-lifeguard-program`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer Jr. Beach Lifeguard program for children ages 8-17 teaching ocean safety, swimming, surf rescue fundamentals, and beach stewardship.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer Jr. Beach Lifeguard program for children ages 8-17 teaching ocean safety, swimming, surf rescue fundamentals, and beach stewardship."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Swim`, `Swimming`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Oakland Park Summer Camp (`oakland-park-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> City summer camp at Lloyd Estates Elementary School for K-5th graders with breakfast, lunch, snacks, weekly field trips, and Friday special events.

**Proposed structured fields:**

- 🟢 **tagline:** "City summer camp at Lloyd Estates Elementary School for K-5th graders with breakfast, lunch, snacks, weekly field trips, and Friday special events."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- 🟢 **lunch_policy:** "Lunch provided"
- ⚪ **extended_care_policy:** _null_

### O.B. Johnson Park Summer Camp (`o-b-johnson-park-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Free summer day camp at O.B. Johnson Park for Hallandale Beach residents ages 6-12 with indoor/outdoor games, movies, crafts, swimming, special events, and field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "Free summer day camp at O.B. Johnson Park for Hallandale Beach residents ages 6-12 with indoor/outdoor games, movies, crafts, swimming, special events, and field trips."
- 🟡 **sessions:** `[{"label":"Mini Camp A","start_date":"2026-06-07","end_date":"2026-06-18","weekly_themes":[],"notes":null},{"label":"Summer Camp","start_date":"2026-06-21","end_date":"2026-07-30","weekly_themes":[],"notes":null},{"label":"Mini Camp B","start_date":"2026-08-02","end_date":"2026-08-20","weekly_themes":[],"notes":null}]`
- 🟡 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":0,"notes":"No camp fee; small fees for some special events and field trips."}]`
- 🟢 **activities:** `Swim`, `Swimming`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Reported price of $0 — verify or override.

### Ingalls Park Teen Summer Camp (`ingalls-park-teen-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Free summer teen camp at Ingalls Park for Hallandale Beach residents ages 13-17.

**Proposed structured fields:**

- 🟢 **tagline:** "Free summer teen camp at Ingalls Park for Hallandale Beach residents ages 13-17."
- 🟡 **sessions:** `[{"label":"Teen Camp 2026","start_date":"2026-06-14","end_date":"2026-08-20","weekly_themes":[],"notes":null}]`
- 🟡 **pricing_tiers:** `[{"label":"Weekly","hours":null,"session_price_cents":null,"both_sessions_price_cents":null,"weekly_price_cents":0,"notes":"No camp fee; residents only."}]`
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Reported price of $0 — verify or override.

### Camp Chameleon at Markham Park (`camp-chameleon-at-markham-park`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Friendly summer camp at Markham Park in Sunrise for boys and girls ages 5-15 with outdoor and nature-based programming.

**Proposed structured fields:**

- 🟢 **tagline:** "Friendly summer camp at Markham Park in Sunrise for boys and girls ages 5-15 with outdoor and nature-based programming."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Nature`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Sunrise Summer Camp (`city-of-sunrise-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Resident-only City of Sunrise summer camp for ages 6-14 at city community centers with recreation, sports, and field trips.

**Proposed structured fields:**

- 🟢 **tagline:** "Resident-only City of Sunrise summer camp for ages 6-14 at city community centers with recreation, sports, and field trips."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Sports`, `Field Trips`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pinecrest Basketball Summer Camp (`pinecrest-basketball-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Summer basketball clinic camp offered through the Village of Pinecrest Parks & Recreation department with fundamentals and game play.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer basketball clinic camp offered through the Village of Pinecrest Parks & Recreation department with fundamentals and game play."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Basketball`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pinecrest Flag Football Summer Camp (`pinecrest-flag-football-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Flag football summer camp offered through Village of Pinecrest Parks & Recreation.

**Proposed structured fields:**

- 🟢 **tagline:** "Flag football summer camp offered through Village of Pinecrest Parks & Recreation."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `Football`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pinecrest Robotics Summer Camp (`pinecrest-robotics-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟡 medium

**Description excerpt:**
> STEM robotics summer camp offered through Village of Pinecrest Parks & Recreation.

**Proposed structured fields:**

- 🟢 **tagline:** "STEM robotics summer camp offered through Village of Pinecrest Parks & Recreation."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟡 **activities:** `STEM`, `Robotics`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Wise Choice Summer Camp (`wise-choice-summer-camp`)

**Source:** manual-curated · **Overall confidence:** 🟡 medium

**Description excerpt:**
> Miami's trusted summer camp with 22+ years of experience at university campuses including UM and FIU.

**Proposed structured fields:**

- 🟢 **tagline:** "22+ years across 5 Miami campuses — swimming, field trips, electives."
- 🟠 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Swimming`, `Field Trips`, `Art`, `Chess`, `Dance`, `Fitness`, `Music`, `STEM`, `Outdoor Sports`
- 🟢 **fees:** `[{"label":"Registration fee","amount_cents":7900,"refundable":false,"notes":null},{"label":"Weekly deposit","amount_cents":10000,"refundable":true,"notes":"Applied to tuition"}]`
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- 🟢 **lunch_policy:** "Lunch optional via Our Lunches app, or send from home. Snacks $1-$2 available at camp."
- ⚪ **extended_care_policy:** _null_

**Notes:**
- 5 locations (UM Hillel, FIU, Albizu, BridgePrep, Keys Gate Charter) — multi-row split deferred.
- 4-year-olds accepted if turning 5 before August.
- Per-week pricing not in description — pricing_tiers left empty.

## Section C — Low confidence (17 camps)

### La Piazza Academy Summer Camp (`la-piazza-academy-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer camp for preschool and elementary-age children in Coconut Grove with two month-long sessions.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer camp for preschool and elementary-age children in Coconut Grove with two month-long sessions."
- 🟡 **sessions:** `[{"label":"Session 1","start_date":"2026-06-02","end_date":"2026-06-27","weekly_themes":[],"notes":null},{"label":"Session 2","start_date":"2026-06-30","end_date":"2026-07-25","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Riviera Junior Camp (`riviera-junior-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Coral Gables half-day/full-day summer camp for children ages 3 through entering 2nd grade on Riviera's Day School campus.

**Proposed structured fields:**

- 🟢 **tagline:** "Coral Gables half-day/full-day summer camp for children ages 3 through entering 2nd grade on Riviera's Day School campus."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### STARS Summer Camp at Evelyn Greer Park (`stars-summer-camp-at-evelyn-greer-park`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Inclusive summer camp at Evelyn Greer Park offering an enriching experience for diverse youth, including children and teens with special needs.

**Proposed structured fields:**

- 🟢 **tagline:** "Inclusive summer camp at Evelyn Greer Park offering an enriching experience for diverse youth, including children and teens with special needs."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Club P.L.A.Y. Summer Camp (`club-p-l-a-y-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer day camp for grades K-5 at the War Memorial Youth Center with group activities, games, and enrichment. Registration via playgables.com.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp for grades K-5 at the War Memorial Youth Center with group activities, games, and enrichment."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Golf Academy of South Florida Half-Day Summer Camp (`golf-academy-of-south-florida-half-day-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Half-day summer golf camp for ages 5-13 focused on skill development, course skills, etiquette and rules, with groups based on age and skill level.

**Proposed structured fields:**

- 🟢 **tagline:** "Half-day summer golf camp for ages 5-13 focused on skill development, course skills, etiquette and rules, with groups based on age and skill level."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Aventura Art Camp (`city-of-aventura-art-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer art camp teaching campers about artists, media, and techniques through art history and multicultural appreciation.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer art camp teaching campers about artists, media, and techniques through art history and multicultural appreciation."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-08","end_date":"2026-07-17","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Gerard Loisel's Marine Biology Camp (`gerard-loisels-marine-biology-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Weekly marine biology camp on Key Biscayne run through the Key Biscayne Community Center, offering multiple one-week sessions in summer 2026.

**Proposed structured fields:**

- 🟢 **tagline:** "Weekly marine biology camp on Key Biscayne run through the Key Biscayne Community Center, offering multiple one-week sessions in summer 2026."
- 🟡 **sessions:** `[{"label":"Session 1","start_date":"2026-06-08","end_date":"2026-06-12","weekly_themes":[],"notes":null},{"label":"Session 2","start_date":"2026-06-22","end_date":"2026-06-26","weekly_themes":[],"notes":null},{"label":"Session 3","start_date":"2026-07-20","end_date":"2026-07-24","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Camp Discover at FIU (`camp-discover-at-fiu`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Educational activities and field experiences-based summer camp at FIU's Modesto A. Maidique Campus for children ages 6-14.

**Proposed structured fields:**

- 🟢 **tagline:** "Educational activities and field experiences-based summer camp at FIU's Modesto A."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### FIU Theatre Summer Camp (`fiu-theatre-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Theatre summer day camp at FIU's main campus for children ages 8-14 with no previous acting or theatre experience required.

**Proposed structured fields:**

- 🟢 **tagline:** "Theatre summer day camp at FIU's main campus for children ages 8-14 with no previous acting or theatre experience required."
- 🟡 **sessions:** `[{"label":"Theatre Summer Camp 2026","start_date":"2026-07-06","end_date":"2026-07-31","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### City of Hialeah Creative Learning & Play Summer Camp (`city-of-hialeah-creative-learning-play-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer day camp offered to students ages 6-11 who have completed Kindergarten through 5th grade at multiple Hialeah park sites.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp offered to students ages 6-11 who have completed Kindergarten through 5th grade at multiple Hialeah park sites."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### City of Sunny Isles Beach Summer Camps (`city-of-sunny-isles-beach-summer-camps`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer day camp for youth ages 5-15 run by the City of Sunny Isles Beach's Cultural & Community Services Department.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer day camp for youth ages 5-15 run by the City of Sunny Isles Beach's Cultural & Community Services Department."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Young at Art Museum Summer Art Camp (`young-at-art-museum-summer-art-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Themed week-long art summer camp at Young at Art Museum with hands-on art, gallery adventures, visiting artists, and costume fun.

**Proposed structured fields:**

- 🟢 **tagline:** "Themed week-long art summer camp at Young at Art Museum with hands-on art, gallery adventures, visiting artists, and costume fun."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Nova at NSU University School (`camp-nova-at-nsu-university-school`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Multi-level summer day camp at NSU University School in Davie with Guppy (18mo-4), Minnow (K-1), and Shark (grades 2-8) tracks plus specialty programs through grade 11.

**Proposed structured fields:**

- 🟢 **tagline:** "Multi-level summer day camp at NSU University School in Davie with Guppy (18mo-4), Minnow (K-1), and Shark (grades 2-8) tracks plus specialty programs through grade 11."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Pembroke Pines Golf School Summer Camp (`pembroke-pines-golf-school-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Summer Golf School for youth with instruction from Pembroke Pines Recreation golf staff.

**Proposed structured fields:**

- 🟢 **tagline:** "Summer Golf School for youth with instruction from Pembroke Pines Recreation golf staff."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":"2026-06-17","end_date":"2026-08-09","weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

### Pinecrest Lacrosse Summer Camp (`pinecrest-lacrosse-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Youth lacrosse summer camp offered through Village of Pinecrest Parks & Recreation.

**Proposed structured fields:**

- 🟢 **tagline:** "Youth lacrosse summer camp offered through Village of Pinecrest Parks & Recreation."
- 🟡 **sessions:** `[{"label":"Summer 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### Camp Pinecrest Summer Camp (`camp-pinecrest-summer-camp`)

**Source:** research-json · **Overall confidence:** 🟠 low

**Description excerpt:**
> Pinecrest Academy's on-campus day camp with traditional camp programming and specialty enrichment in Miami.

**Proposed structured fields:**

- 🟢 **tagline:** "Pinecrest Academy's on-campus day camp with traditional camp programming and specialty enrichment in Miami."
- 🟡 **sessions:** `[{"label":"Camp Pinecrest 2026","start_date":null,"end_date":null,"weekly_themes":[],"notes":null}]`
- ⚪ **pricing_tiers:** _empty_
- ⚪ **activities:** _empty_
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- Session row has no dates — research source said "Summer 2026" generically.

### 305 Mini Chefs (`305-mini-chefs`)

**Source:** manual-curated · **Overall confidence:** 🟠 low

**Description excerpt:**
> Kids cooking classes, camps, and after-school programs teaching culinary skills across Miami-Dade County.

**Proposed structured fields:**

- 🟡 **tagline:** "Mobile culinary education across Miami-Dade — savor the flavor of 305."
- ⚪ **sessions:** _empty_
- ⚪ **pricing_tiers:** _empty_
- 🟢 **activities:** `Cooking`, `Culinary classes`, `Birthday parties`
- ⚪ **fees:** _empty_
- ⚪ **enrollment_window:** _null_
- ⚪ **what_to_bring:** _empty_
- ⚪ **lunch_policy:** _null_
- ⚪ **extended_care_policy:** _null_

**Notes:**
- 2026 summer-camp pricing not published online — call (786) 509-7509 to confirm.
- Mobile program — operates at George Washington Carver Elementary, I-Prep Academy, and partner schools.
- Sessions / fees / extended-care all NULL until operator publishes 2026 schedule.

## Section D — No extraction (0 camps)

_These camps had descriptions too thin for any heuristic to extract structured fields. Tagline alone may still be present — but no sessions, pricing, activities, fees, etc. Operator self-edit (Phase B) is the right path for these._
