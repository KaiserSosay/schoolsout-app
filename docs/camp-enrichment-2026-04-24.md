# Camp enrichment — 2026-04-24

Script: `scripts/enrich-camps.ts` — fetches each camp's own website, runs conservative regex against visible text, lists any finds.

Auto-apply policy (Rasheid, Phase 2.7 Goal 1): findings are written to prod only when (i) source = camp's own domain, (ii) field was NULL, (iii) field ∈ { phone, address, website_url, hours_start, hours_end }.

- **Camps processed:** 38
- **Auto-applied findings:** 9
- **Parked for human review:** 24
- **Apply mode:** `--apply`

## Frost Science Summer Camp
- slug: `frost-science-summer`  |  website: https://www.frostscience.org/summer-camp

### Before
| Field | Value |
|---|---|
| phone | (305) 434-9600 |
| address | 1101 Biscayne Blvd, Miami, FL 33132 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://www.frostscience.org/summer-camp | ⏸ parked |
| hours_end | 18:00:00 | https://www.frostscience.org/summer-camp | ⏸ parked |

## Camp Curiosity (Frost + MDC Parks)
- slug: `camp-curiosity-ehmann`  |  website: https://www.frostscience.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 434-9600 |
| address | 10995 SW 97 Ave, Miami, FL 33176 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://www.frostscience.org/ | ⏸ parked |
| hours_end | 18:00:00 | https://www.frostscience.org/ | ⏸ parked |

## Miami Children's Museum Summer Camp
- slug: `miami-childrens-museum-summer`  |  website: https://www.miamichildrensmuseum.org/summer-camp

### Before
| Field | Value |
|---|---|
| phone | (305) 373-5437 |
| address | 980 MacArthur Causeway, Miami, FL 33132 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- all fetches failed

_No findings._

## Zoo Miami Summer Camp
- slug: `zoo-miami-summer`  |  website: https://www.zoomiami.org/summer-camp

### Before
| Field | Value |
|---|---|
| phone | (305) 251-0400 |
| address | 12400 SW 152 St, Miami, FL 33177 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Deering Estate Summer Camp — Eco
- slug: `deering-estate-eco`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## Deering Estate Summer Camp — Expedition
- slug: `deering-estate-expedition`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## KLA Academy Summer Camp
- slug: `kla-academy-summer`  |  website: https://klaschools.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (713) 955-0009 | https://klaschools.com/ | ✅ yes |
| address | 5725 Lorraine Rd Bradenton, FL 34211 | https://klaschools.com/ | ✅ yes |
| hours_start | 07:00:00 | https://klaschools.com/ | ⏸ parked |
| hours_end | 18:30:00 | https://klaschools.com/ | ⏸ parked |

## Alexander Montessori — Ludlam Road
- slug: `alexander-montessori-ludlam`  |  website: https://www.alexandermontessori.com/

### Before
| Field | Value |
|---|---|
| phone | (305) 665-6264 |
| address | 14850 SW 67 Ave, Miami, FL 33158 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Alexander Montessori — Old Cutler
- slug: `alexander-montessori-old-cutler`  |  website: https://www.alexandermontessori.com/

### Before
| Field | Value |
|---|---|
| phone | (305) 238-3162 |
| address | 14400 Old Cutler Rd, Miami, FL 33158 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Alexander Montessori — Palmetto Bay
- slug: `alexander-montessori-palmetto-bay`  |  website: https://www.alexandermontessori.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | 17800 Old Cutler Rd, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (305) 235-3995 | https://www.alexandermontessori.com/ | ✅ yes |

## Alexander Montessori — Red Road
- slug: `alexander-montessori-red-road`  |  website: https://www.alexandermontessori.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | 6050 SW 57 Ave, Miami, FL 33143 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (305) 235-3995 | https://www.alexandermontessori.com/ | ✅ yes |

## The Cushman School Summer Camp
- slug: `cushman-school-summer`  |  website: https://www.cushmanschool.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 757-1966 |
| address | 592 NE 60 St, Miami, FL 33137 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Miami Beach JCC — Camp Klurman
- slug: `camp-klurman-jcc`  |  website: https://msbgcc.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 534-3206 |
| address | 4221 Pine Tree Dr, Miami Beach, FL 33140 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- all fetches failed

_No findings._

## Camp Shemesh
- slug: `camp-shemesh`  |  website: —

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- no website_url on record; skipping fetch

_No findings._

## Beaux Arts Summer Camp
- slug: `beaux-arts-lowe`  |  website: https://www.lowe.miami.edu/education/beaux-arts-summer-camp.html

### Before
| Field | Value |
|---|---|
| phone | (305) 284-3535 |
| address | 1301 Stanford Dr, Coral Gables, FL 33146 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- all fetches failed

_No findings._

## Wise Choice Summer Camp — UM campus
- slug: `wise-choice-um`  |  website: https://wisechoicesummercamp.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | Coral Gables, FL |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (305) 630-3600 | https://wisechoicesummercamp.com/ | ✅ yes |

## Wise Choice Summer Camp — FIU campus
- slug: `wise-choice-fiu`  |  website: https://wisechoicesummercamp.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (305) 630-3600 | https://wisechoicesummercamp.com/ | ✅ yes |
| address | 1100 Stanford Dr. Coral Gables, FL 33146 | https://wisechoicesummercamp.com/contact | ✅ yes |

## South Miami City Summer Camp
- slug: `south-miami-city`  |  website: https://www.southmiamifl.gov/

### Before
| Field | Value |
|---|---|
| phone | (305) 668-7232 |
| address | 6130 Sunset Dr, South Miami, FL 33143 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Moonlighter FabLab STEAM Maker Camp
- slug: `moonlighter-fablab`  |  website: https://moonlighter.io/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Davis Fencing Academy — Summer Battle Camps
- slug: `davis-fencing`  |  website: https://www.davisfencingacademy.com/

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (530) 758-7087 | https://www.davisfencingacademy.com/ | ✅ yes |

## Riviera Day Camp
- slug: `riviera-day-camp`  |  website: https://www.rivieraschools.com/

### Before
| Field | Value |
|---|---|
| phone | (305) 666-1856 |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Ransom Everglades Sports Camps
- slug: `ransom-everglades-sports`  |  website: https://www.ransomeverglades.org/summer

### Before
| Field | Value |
|---|---|
| phone | (305) 460-8874 |
| address | 3575 Main Hwy, Coconut Grove, FL 33133 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Crandon Golf Academy
- slug: `crandon-golf-academy`  |  website: https://www.miamidade.gov/parks/crandon-golf.asp

### Before
| Field | Value |
|---|---|
| phone | (786) 253-2548 |
| address | Crandon Park, Key Biscayne, FL 33149 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Coconut Grove Sailing Club Camp
- slug: `coconut-grove-sailing`  |  website: https://cgsc.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 444-4571 |
| address | 2990 S Bayshore Dr, Coconut Grove, FL 33133 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- all fetches failed

_No findings._

## Ritz Carlton Tennis Camp
- slug: `crandon-tennis`  |  website: —

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | Key Biscayne, FL 33149 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- no website_url on record; skipping fetch

_No findings._

## Fairchild Tropical Botanic Garden Camp
- slug: `fairchild-gardens-camp`  |  website: https://www.fairchildgarden.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 667-1651 |
| address | 10901 Old Cutler Rd, Coral Gables, FL 33156 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## Miami Children's Museum — One Day Camp
- slug: `miami-childrens-museum-one-day`  |  website: https://www.miamichildrensmuseum.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 373-5437 |
| address | 980 MacArthur Causeway, Miami, FL 33132 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 11:00:00 | https://www.miamichildrensmuseum.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://www.miamichildrensmuseum.org/ | ⏸ parked |

## Deering Estate — Mini Camp (teacher planning days)
- slug: `deering-mini`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## Deering Estate Fall Camp
- slug: `deering-fall`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## Deering Estate Winter Camp
- slug: `deering-winter`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## Deering Estate Spring Camp
- slug: `deering-spring`  |  website: https://deeringestate.org/

### Before
| Field | Value |
|---|---|
| phone | (305) 235-1668 |
| address | 16701 SW 72 Ave, Palmetto Bay, FL 33157 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 10:00:00 | https://deeringestate.org/ | ⏸ parked |
| hours_end | 16:00:00 | https://deeringestate.org/ | ⏸ parked |

## South Miami City One-Day Camp
- slug: `south-miami-one-day`  |  website: https://www.southmiamifl.gov/

### Before
| Field | Value |
|---|---|
| phone | (305) 668-7232 |
| address | 6130 Sunset Dr, South Miami, FL 33143 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## South Miami City Winter Break Camp
- slug: `south-miami-winter`  |  website: https://www.southmiamifl.gov/

### Before
| Field | Value |
|---|---|
| phone | (305) 668-7232 |
| address | 6130 Sunset Dr, South Miami, FL 33143 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## South Miami City Spring Break Camp
- slug: `south-miami-spring`  |  website: https://www.southmiamifl.gov/

### Before
| Field | Value |
|---|---|
| phone | (305) 668-7232 |
| address | 6130 Sunset Dr, South Miami, FL 33143 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

_No findings._

## YMCA of South Florida — Day Off Camp
- slug: `ymca-sfl-day-off`  |  website: https://www.ymcasouthflorida.org/

### Before
| Field | Value |
|---|---|
| phone | (954) 334-9622 |
| address | _NULL_ |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 08:00:00 | https://www.ymcasouthflorida.org/contact-us | ⏸ parked |
| hours_end | 19:00:00 | https://www.ymcasouthflorida.org/contact-us | ⏸ parked |

## Sky Zone Doral
- slug: `sky-zone-doral`  |  website: https://www.skyzone.com/doral

### Before
| Field | Value |
|---|---|
| phone | _NULL_ |
| address | 11075 NW 36 St, Doral, FL 33178 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| phone | (786) 408-2762 | https://www.skyzone.com/doral | ✅ yes |

## Jungle Island
- slug: `jungle-island`  |  website: https://www.jungleisland.com/

### Before
| Field | Value |
|---|---|
| phone | (305) 400-7000 |
| address | 1111 Parrot Jungle Trail, Miami, FL 33132 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Findings
| Field | Proposed value | Source | Auto-apply |
|---|---|---|---|
| hours_start | 09:30:00 | https://www.jungleisland.com/ | ⏸ parked |
| hours_end | 17:00:00 | https://www.jungleisland.com/ | ⏸ parked |

## Tidal Cove Waterpark
- slug: `tidal-cove`  |  website: https://www.tidalcovewaterpark.com/

### Before
| Field | Value |
|---|---|
| phone | (786) 279-6600 |
| address | 19999 W Country Club Dr, Aventura, FL 33180 |
| hours_start | _NULL_ |
| hours_end | _NULL_ |

### Errors
- all fetches failed

_No findings._
