# Camp hours enrichment — 2026-04-24

Script: `scripts/enrich-camp-hours.ts` — single-purpose pass that proposes `hours_start` / `hours_end` / `before_care_*` / `after_care_*` / `lunch_included` from each camp's own site.

**Read-only:** the script writes nothing to the database. Confirmed rows land in `supabase/migrations/023_camp_hours_enrichment.sql` as a series of `UPDATE … WHERE slug = '…'` statements.

- **Camps researched:** 30
- **Total findings:** 11
- **Same-domain hits:** 11 of 11
- **Camps with at least one finding:** 7 / 30

---

## Camp Curiosity (Frost + MDC Parks)
- slug: `camp-curiosity-ehmann`  |  importance: 8  |  website: https://www.frostscience.org/
- pages fetched: [6161b](https://www.frostscience.org/), [4908b](https://www.frostscience.org/summer-camp), [4878b](https://www.frostscience.org/camps), [4878b](https://www.frostscience.org/camp), [4208b](https://www.frostscience.org/faq)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Cutler Bay Careers in STEM Summer Camp
- slug: `cutler-bay-careers-in-stem-summer-camp`  |  importance: 8  |  website: https://www.cutlerbay-fl.gov/parksrec/page/stem-summer-camp-start
- pages fetched: [3538b](https://www.cutlerbay-fl.gov/), [44026b](https://www.cutlerbay-fl.gov/faqs), [13979b](https://www.cutlerbay-fl.gov/contact), [13979b](https://www.cutlerbay-fl.gov/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Frost Science Summer Camp
- slug: `frost-science-summer`  |  importance: 8  |  website: https://www.frostscience.org/summer-camp
- pages fetched: [6161b](https://www.frostscience.org/), [4908b](https://www.frostscience.org/summer-camp), [4878b](https://www.frostscience.org/camps), [4878b](https://www.frostscience.org/camp), [4208b](https://www.frostscience.org/faq)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Miami Children's Museum — One Day Camp
- slug: `miami-childrens-museum-one-day`  |  importance: 8  |  website: https://www.miamichildrensmuseum.org/
- pages fetched: [6286b](https://www.miamichildrensmuseum.org/), [9761b](https://www.miamichildrensmuseum.org/camps), [8434b](https://www.miamichildrensmuseum.org/programs)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| after_care_offered | true | https://www.miamichildrensmuseum.org/camps | ✅ | …ly run from 9 am - 3 pm with before and after care options available. ‍ What Makes Our Camps Special? Miami Children&#x27;s Museum camps stand out among other seasonal options in t… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  after_care_offered = true,
  last_enriched_at = now()
where slug = 'miami-childrens-museum-one-day';
```

</details>

## Miami Children's Museum Summer Camp
- slug: `miami-childrens-museum-summer`  |  importance: 8  |  website: https://www.miamichildrensmuseum.org/summer-camp
- pages fetched: [6286b](https://www.miamichildrensmuseum.org/), [9761b](https://www.miamichildrensmuseum.org/camps), [8434b](https://www.miamichildrensmuseum.org/programs)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| after_care_offered | true | https://www.miamichildrensmuseum.org/camps | ✅ | …ly run from 9 am - 3 pm with before and after care options available. ‍ What Makes Our Camps Special? Miami Children&#x27;s Museum camps stand out among other seasonal options in t… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  after_care_offered = true,
  last_enriched_at = now()
where slug = 'miami-childrens-museum-summer';
```

</details>

## Camp J Miami at Alper JCC
- slug: `camp-j-miami-at-alper-jcc`  |  importance: 6  |  website: https://www.alperjcc.org/youth-and-teen/camp-j-miami
- pages fetched: [7515b](https://www.alperjcc.org/), [10552b](https://www.alperjcc.org/camp)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| hours_start | 09:00:00 | https://www.alperjcc.org/camp | ✅ | …tes & hours? Preschool Camp Camp Hours: 9:00 AM- 4:00 PM Summer 2026 Camp Dates: June 15 &ndash; August 7 Kindergarten - 8th Grade Camp Camp Hours: 8:40 AM- 3:45 PM Summer 2026 Cam… |
| hours_end | 16:00:00 | https://www.alperjcc.org/camp | ✅ | …tes & hours? Preschool Camp Camp Hours: 9:00 AM- 4:00 PM Summer 2026 Camp Dates: June 15 &ndash; August 7 Kindergarten - 8th Grade Camp Camp Hours: 8:40 AM- 3:45 PM Summer 2026 Cam… |
| lunch_included | true | https://www.alperjcc.org/camp | ✅ | …sample lunch and snack menu, see below. Hot Lunch Menu Snack Menu ** Upper Camp provides lunch and snack every day for all campers free of charge every day. Please send in a dispos… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  hours_start = '09:00:00',
  hours_end = '16:00:00',
  lunch_included = true,
  last_enriched_at = now()
where slug = 'camp-j-miami-at-alper-jcc';
```

</details>

## Camp Nova at NSU University School
- slug: `camp-nova-at-nsu-university-school`  |  importance: 6  |  website: https://www.uschool.nova.edu/summer
- pages fetched: [7551b](https://www.uschool.nova.edu/), [14145b](https://www.uschool.nova.edu/programs), [1568b](https://www.uschool.nova.edu/contact)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| after_care_offered | true | https://www.uschool.nova.edu/ | ✅ | …S COMMUNITY SERVICE ALL-INCLUSIVE LUNCH AFTER CARE JUST FOR KIDS CLASSES THE R.E.E.F. VOLUNTEER CAMPS SHARK CAMP MINNOW CAMP GUPPY CAMP SUMMER SCHOLARS SPECIALTY CAMPS SPORTS CAMPS… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  after_care_offered = true,
  last_enriched_at = now()
where slug = 'camp-nova-at-nsu-university-school';
```

</details>

## City of Aventura STEM Camp
- slug: `city-of-aventura-stem-camp`  |  importance: 6  |  website: https://www.cityofaventura.com/403/Camps
- pages fetched: [2627b](https://www.cityofaventura.com/), [47912b](https://www.cityofaventura.com/faq)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| after_care_offered | true | https://www.cityofaventura.com/faq | ✅ | …ence School (ACES) Are there before and after care programs at ACES? Along with after school programs such as sports or dance classes, we offer Before and After Care. It is availab… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  after_care_offered = true,
  last_enriched_at = now()
where slug = 'city-of-aventura-stem-camp';
```

</details>

## iD Tech Camps at University of Miami
- slug: `id-tech-camps-at-university-of-miami`  |  importance: 6  |  website: https://www.idtech.com/locations/florida-summer-camps/university-of-miami
- pages fetched: [16179b](https://www.idtech.com/), [13161b](https://www.idtech.com/summer-camp), [13161b](https://www.idtech.com/summer-camps), [0b](https://www.idtech.com/faq), [6953b](https://www.idtech.com/contact)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Moonlighter FabLab STEAM Maker Camp
- slug: `moonlighter-fablab`  |  importance: 6  |  website: https://moonlighter.io/
- pages fetched: [19785b](https://moonlighter.io/)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Snapology of Miami Beach Summer Camp
- slug: `snapology-of-miami-beach-summer-camp`  |  importance: 6  |  website: https://www.snapology.com/florida-miami-beach/camps/
- pages fetched: [12447b](https://www.snapology.com/), [8294b](https://www.snapology.com/camps), [18164b](https://www.snapology.com/camp), [6942b](https://www.snapology.com/programs), [6942b](https://www.snapology.com/program)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Alexander Montessori — Ludlam Road
- slug: `alexander-montessori-ludlam`  |  importance: 5  |  website: https://www.alexandermontessori.com/
- pages fetched: [9251b](https://www.alexandermontessori.com/), [6264b](https://www.alexandermontessori.com/summer-camp), [6264b](https://www.alexandermontessori.com/camp), [4304b](https://www.alexandermontessori.com/contact), [4304b](https://www.alexandermontessori.com/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Alexander Montessori — Old Cutler
- slug: `alexander-montessori-old-cutler`  |  importance: 5  |  website: https://www.alexandermontessori.com/
- pages fetched: [9251b](https://www.alexandermontessori.com/), [6264b](https://www.alexandermontessori.com/summer-camp), [6264b](https://www.alexandermontessori.com/camp), [4304b](https://www.alexandermontessori.com/contact), [4304b](https://www.alexandermontessori.com/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Beaux Arts Summer Camp
- slug: `beaux-arts-lowe`  |  importance: 5  |  website: https://www.lowe.miami.edu/education/beaux-arts-summer-camp.html
- pages fetched: [5303b](https://www.lowe.miami.edu/)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## City of Plantation Central Park Summer Camp
- slug: `city-of-plantation-central-park-summer-camp`  |  importance: 5  |  website: https://www.plantation.org/government/departments/parks-recreation/camps-kids-day-off
- pages fetched: _none_

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Errors
- all fetches failed

_No proposed changes._

## Coconut Grove Sailing Club Camp
- slug: `coconut-grove-sailing`  |  importance: 5  |  website: https://cgsc.org/
- pages fetched: _none_

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Errors
- all fetches failed

_No proposed changes._

## Crandon Golf Academy
- slug: `crandon-golf-academy`  |  importance: 5  |  website: https://www.miamidade.gov/parks/crandon-golf.asp
- pages fetched: [17b](https://www.miamidade.gov/)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate — Mini Camp (teacher planning days)
- slug: `deering-mini`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7357b](https://deeringestate.org/contact), [7361b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate Fall Camp
- slug: `deering-fall`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7360b](https://deeringestate.org/contact), [7361b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate Spring Camp
- slug: `deering-spring`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7360b](https://deeringestate.org/contact), [7361b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate Summer Camp — Eco
- slug: `deering-estate-eco`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7361b](https://deeringestate.org/contact), [7359b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate Summer Camp — Expedition
- slug: `deering-estate-expedition`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7357b](https://deeringestate.org/contact), [7357b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Deering Estate Winter Camp
- slug: `deering-winter`  |  importance: 5  |  website: https://deeringestate.org/
- pages fetched: [54776b](https://deeringestate.org/), [7781b](https://deeringestate.org/camp), [7361b](https://deeringestate.org/contact), [7359b](https://deeringestate.org/contact-us)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Fairchild Tropical Botanic Garden Camp
- slug: `fairchild-gardens-camp`  |  importance: 5  |  website: https://www.fairchildgarden.org/
- pages fetched: [12208b](https://www.fairchildgarden.org/), [12208b](https://www.fairchildgarden.org/summer-camp), [12208b](https://www.fairchildgarden.org/summer-camps), [12208b](https://www.fairchildgarden.org/camps), [12208b](https://www.fairchildgarden.org/camp)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## Jungle Island
- slug: `jungle-island`  |  importance: 5  |  website: https://www.jungleisland.com/
- pages fetched: [7522b](https://www.jungleisland.com/), [3873b](https://www.jungleisland.com/contact)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| after_care_offered | true | https://www.jungleisland.com/ | ✅ | …acks Included Take Home A Book Each Day Aftercare Available Immersive Learning REGISTER NOW --> Luminosa A Journey Through Light Luminosa returns BIGGER and BETTER than ever, featu… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  after_care_offered = true,
  last_enriched_at = now()
where slug = 'jungle-island';
```

</details>

## Miami Beach JCC — Camp Klurman
- slug: `camp-klurman-jcc`  |  importance: 5  |  website: https://msbgcc.org/
- pages fetched: _none_

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Errors
- all fetches failed

_No proposed changes._

## Ransom Everglades Sports Camps
- slug: `ransom-everglades-sports`  |  importance: 5  |  website: https://www.ransomeverglades.org/summer
- pages fetched: [7465b](https://www.ransomeverglades.org/), [68000b](https://www.ransomeverglades.org/summer-camp), [12486b](https://www.ransomeverglades.org/about)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

### Proposed (after Rasheid review)
| Field | Proposed | Source | Same-domain | Evidence |
|---|---|---|---|---|
| before_care_offered | true | https://www.ransomeverglades.org/summer-camp | ✅ | …$1,250 Session 3: July 13 - 24 = $1,380 Before Care: 7:30 - 8:30 a.m. = $80 per session General Aftercare: 3 - 4:15 p.m. = $100 per session Please note that campers picked up from… |
| after_care_offered | true | https://www.ransomeverglades.org/summer-camp | ✅ | …0 - 8:30 a.m. = $80 per session General Aftercare: 3 - 4:15 p.m. = $100 per session Please note that campers picked up from general aftercare after 4:15 p.m. will be subject to a $… |
| lunch_included | true | https://www.ransomeverglades.org/summer-camp | ✅ | …dation for high school math and beyond! Lunch is included in the dining hall with this course. &#160; Financial Aid Eligibility: Upon request, financial aid for for-credit courses… |

<details><summary>SQL skeleton (review before pasting)</summary>

```sql
update public.camps set
  before_care_offered = true,
  after_care_offered = true,
  lunch_included = true,
  last_enriched_at = now()
where slug = 'ransom-everglades-sports';
```

</details>

## Riviera Day Camp
- slug: `riviera-day-camp`  |  importance: 5  |  website: https://www.rivieraschools.com/
- pages fetched: [4994b](https://www.rivieraschools.com/), [4655b](https://www.rivieraschools.com/about)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## South Miami City One-Day Camp
- slug: `south-miami-one-day`  |  importance: 5  |  website: https://www.southmiamifl.gov/
- pages fetched: [631b](https://www.southmiamifl.gov/), [6602b](https://www.southmiamifl.gov/faq)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._

## South Miami City Spring Break Camp
- slug: `south-miami-spring`  |  importance: 5  |  website: https://www.southmiamifl.gov/
- pages fetched: [631b](https://www.southmiamifl.gov/), [6602b](https://www.southmiamifl.gov/faq)

### Before
| Field | Value |
|---|---|
| hours_start | _NULL_ |
| hours_end | _NULL_ |
| before_care_offered | false |
| before_care_start | _NULL_ |
| after_care_offered | false |
| after_care_end | _NULL_ |
| lunch_included | _NULL_ |

_No proposed changes._
