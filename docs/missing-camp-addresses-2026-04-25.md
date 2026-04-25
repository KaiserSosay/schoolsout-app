# Camps with Missing Addresses (as of 2026-04-25)

Total: **26 camps** in the 2026-04-23 research import that landed in
`camp_applications` / `camps` without a street address. Each row should
be researched via the camp's official website and the address backfilled
in admin (or via a follow-up import migration).

> ⚠️ Source caveat: this list is derived from the
> `data/camps/miami-research-2026-04-23.json` source-of-truth file
> because the agent doesn't have prod read access. If any of these
> camps were already addressed in the 2026-04-24 enrichment script
> run, drop the row before researching. Easy way to filter live:
>
> ```sql
> SELECT slug FROM camps
> WHERE verified = true
>   AND (address IS NULL OR address = '')
>   AND slug IN (...slug list from this doc...);
> ```

| Name | Slug | Website | Neighborhood |
|------|------|---------|--------------|
| All Kids Included Youth Arts Creative Arts Summer Camp | all-kids-included-youth-arts-creative-arts-summer-camp | https://miamidadearts.org/education/youth-arts-parks-0 | Kendall |
| Machane Miami | machane-miami | https://machanemiami.org/ | North Miami |
| La Piazza Academy Summer Camp | la-piazza-academy-summer-camp | https://lapiazzaacademy.com/summer-camp/ | Coconut Grove |
| Toddler Summer Camp with Pinecrest Dance Project | toddler-summer-camp-with-pinecrest-dance-project | https://www.pinecrest-fl.gov/Government/About-Us/Pinecrest-Summer-Camps | Pinecrest |
| Golf Academy of South Florida Half-Day Summer Camp | golf-academy-of-south-florida-half-day-summer-camp | https://www.coralgables.com/community-recreation/kids-teens/summer-camps | Coral Gables |
| Key Biscayne Aquatic Camp | key-biscayne-aquatic-camp | https://www.keybiscayneaquaticcamp.com/ | Key Biscayne |
| Code Ninjas Aventura Summer Camp | code-ninjas-aventura-summer-camp | https://www.codeninjas.com/fl-aventura/camps | Aventura |
| Snapology of Miami Beach Summer Camp | snapology-of-miami-beach-summer-camp | https://www.snapology.com/florida-miami-beach/camps/ | Miami Beach |
| Epiphany Lutheran Nursery School Summer Camp | epiphany-lutheran-nursery-school-summer-camp | https://epiphanylutherannurseryschool.com/summer-camp | Miami Lakes |
| City of Hialeah Creative Learning & Play Summer Camp | city-of-hialeah-creative-learning-play-summer-camp | https://www.hialeahfl.gov/464/Creative-Learning-Play | Hialeah |
| Camp Maritime FL | camp-maritime-fl | https://campmaritimefl.com/ | Sunny Isles Beach |
| Miami Beach Tennis Academy Summer Camp | miami-beach-tennis-academy-summer-camp | https://www.mbtennisacademy.com/camp | Miami Beach |
| Fort Lauderdale Parks Summer Camp | fort-lauderdale-parks-summer-camp | https://www.fortlauderdale.gov/government/departments-i-z/parks-recreation/recreation/summer-camp | Fort Lauderdale |
| Fort Lauderdale Sailing Summer Camp | fort-lauderdale-sailing-summer-camp | https://www.parks.fortlauderdale.gov/programs/recreation/camps | Fort Lauderdale |
| Fort Lauderdale Tennis and Sports Summer Camp | fort-lauderdale-tennis-and-sports-summer-camp | https://www.parks.fortlauderdale.gov/programs/recreation/camps | Fort Lauderdale |
| Pembroke Pines Sports Specialty Camps | pembroke-pines-sports-specialty-camps | https://www.ppines.com/309/Camp-Information | Pembroke Pines |
| Pembroke Pines Early Development Center Summer Camp | pembroke-pines-early-development-center-summer-camp | https://www.ppines.com/564/Camps-and-Mini--Camps | Pembroke Pines |
| Hollywood M.O.S.T. Camp | hollywood-m-o-s-t-camp | https://www.hollywoodfl.org/298/Classes-Programs | Hollywood |
| Hollywood Jr. Beach Lifeguard Program | hollywood-jr-beach-lifeguard-program | https://www.hollywoodfl.org/257/Jr-Beach-Lifeguard-Program | Hollywood |
| Ingalls Park Teen Summer Camp | ingalls-park-teen-summer-camp | https://hallandalebeachfl.gov/25/Parks-Recreation-and-Open-Spaces | Hollywood |
| Pembroke Pines Golf School Summer Camp | pembroke-pines-golf-school-summer-camp | https://www.ppines.com/309/Camp-Information | Pembroke Pines |
| Pinecrest Basketball Summer Camp | pinecrest-basketball-summer-camp | https://www.pinecrest-fl.gov/Government/Parks-Recreation/Camps | Pinecrest |
| Pinecrest Lacrosse Summer Camp | pinecrest-lacrosse-summer-camp | https://www.pinecrest-fl.gov/Government/Parks-Recreation/Camps | Pinecrest |
| Pinecrest Flag Football Summer Camp | pinecrest-flag-football-summer-camp | https://www.pinecrest-fl.gov/Government/Parks-Recreation/Camps | Pinecrest |
| Pinecrest Robotics Summer Camp | pinecrest-robotics-summer-camp | https://www.pinecrest-fl.gov/Government/Parks-Recreation/Camps | Pinecrest |
| Camp Pinecrest Summer Camp | camp-pinecrest-summer-camp | https://www.pinecrest-fl.gov/Government/Parks-Recreation/Camps | Pinecrest |

## How Noah uses this

1. Open each website in a Cowork batch.
2. Find the camp's street address from the program / facility page.
3. Drop the address into the admin → camps detail editor (or a single
   `UPDATE camps SET address = '...' WHERE slug = '...'` migration if
   doing several at once).
4. The migration-017 trigger fires on every `UPDATE camps`, so
   `data_completeness` and `missing_fields` will recompute automatically
   per row (see migration 027 — the bulk backfill that catches camps
   whose stored values are out of date).

## Patterns

- **Multi-camp parks departments** (Pinecrest x6, Fort Lauderdale x3,
  Pembroke Pines x3, Hollywood x2): one address research → multiple
  rows can share it.
- **Franchise locations** (Code Ninjas, Snapology) usually have a
  single facility per slug — quick lookup.
- **Children's-program operators with a HQ but no per-camp address**
  (All Kids Included, Machane Miami): may need to call to confirm where
  the camp actually meets, since the website might list HQ rather than
  program location.
