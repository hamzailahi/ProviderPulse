# E2SFCA access dry run: Arkansas

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,703; in Arkansas: 602
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,703 x 1,703 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 229,497.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.49 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.21), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (72328, 72379)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 38767 | no | 6.39 | 100% | 3.93 | 100% | yes (0.84) |
| 72328 | yes | 9.02 | 100% | 9.02 | 100% | no |
| 72379 | yes | 11.01 | 100% | 11.01 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 31,639.8 | 4.30 | 0.48 | 264 of 600 | 72479 (-43), 72628 (-41), 71663 (-36) | 72103 (+76), 72427 (+75), 72364 (+69) |
| Pediatrics (children) | 30 | 6,063.4 | 1.11 | 0.66 | 164 of 600 | 72076 (-54), 72022 (-51), 72065 (-44) | 72332 (+97), 72376 (+86), 72425 (+80) |
| Women's health / OB-GYN | 60 | 2,822.8 | 0.53 | 0.65 | 136 of 600 | 72679 (-64), 72686 (-59), 72183 (-47) | 72103 (+58), 72223 (+46), 71822 (+43) |
| Mental health & counseling | 30 | 41,360.8 | 7.20 | 0.59 | 201 of 600 | 71653 (-68), 72478 (-57), 71655 (-34) | 72427 (+72), 72432 (+67), 72103 (+66) |
| Dental | 30 | 8,983.6 | 1.65 | 0.54 | 216 of 600 | 71676 (-53), 71661 (-49), 72639 (-49) | 72427 (+63), 72135 (+55), 72122 (+53) |
| Eye care | 30 | 4,100.6 | 0.62 | 0.56 | 258 of 600 | 71640 (-52), 72529 (-32), 72650 (-28) | 71822 (+97), 72103 (+73), 72427 (+69) |
| Chiropractic | 30 | 3,173.8 | 0.63 | 0.65 | 218 of 600 | 71970 (-59), 72641 (-57), 72031 (-46) | 72732 (+89), 72571 (+72), 72531 (+66) |
| Physical & occupational therapy | 30 | 19,628 | 2.70 | 0.56 | 326 of 600 | 71653 (-77), 72824 (-50), 72833 (-49) | 72425 (+100), 72827 (+100), 72828 (+100) |
| Orthopedics & sports injury | 60 | 2,431.6 | 0.39 | 0.73 | 220 of 600 | 72183 (-49), 72180 (-46), 72414 (-45) | 71763 (+78), 71962 (+74), 72016 (+69) |
| Heart / cardiology | 60 | 1,452.4 | 0.24 | 0.66 | 202 of 600 | 72065 (-97), 72183 (-94), 72180 (-91) | 71630 (+87), 71749 (+54), 72364 (+52) |
| Skin / dermatology | 60 | 427 | 0.09 | 0.68 | 214 of 600 | 72132 (-60), 72022 (-51), 72065 (-50) | 72453 (+80), 71822 (+67), 72462 (+65) |
| Allergy & immunology | 60 | 166.6 | 0.03 | 0.65 | 143 of 600 | 72015 (-76), 72019 (-76), 72065 (-64) | 72348 (+86), 72364 (+70), 72644 (+66) |
| Lung, breathing & sleep | 60 | 893.8 | 0.13 | 0.64 | 195 of 600 | 72065 (-100), 72180 (-100), 72183 (-100) | 72531 (+65), 71822 (+62), 71941 (+62) |
| Digestive / gastroenterology | 60 | 583.8 | 0.11 | 0.69 | 150 of 600 | 72132 (-100), 72065 (-95), 72180 (-92) | 71630 (+99), 72122 (+72), 71665 (+70) |
| Kidney / nephrology | 60 | 872 | 0.11 | 0.67 | 285 of 600 | 72132 (-78), 72065 (-77), 72083 (-74) | 71630 (+79), 72014 (+77), 72430 (+76) |
| Diabetes & hormones | 60 | 338.2 | 0.06 | 0.70 | 154 of 600 | 72669 (-62), 72015 (-59), 72019 (-59) | 72679 (+91), 72528 (+90), 72538 (+81) |
| Cancer care / oncology | 90 | 960.8 | 0.15 | 0.40 | 365 of 600 | 72339 (-88), 72325 (-84), 72386 (-77) | 71630 (+66), 71822 (+64), 72531 (+64) |
| Arthritis / rheumatology | 60 | 204.8 | 0.04 | 0.60 | 213 of 600 | 72065 (-87), 72183 (-85), 72180 (-81) | 71822 (+76), 72364 (+73), 72534 (+71) |
| Brain & nerves / neurology | 60 | 1,200 | 0.22 | 0.66 | 171 of 600 | 72183 (-76), 72065 (-73), 72761 (-70) | 72332 (+67), 72364 (+65), 72773 (+55) |
| Ear, nose & throat | 60 | 457.8 | 0.07 | 0.66 | 257 of 600 | 72065 (-97), 72022 (-94), 72132 (-92) | 71822 (+75), 72016 (+74), 72070 (+70) |
| Urology | 60 | 464.2 | 0.07 | 0.63 | 289 of 600 | 72677 (-100), 72687 (-100), 72583 (-96) | 72644 (+75), 72534 (+69), 72633 (+62) |
| Foot & ankle / podiatry | 60 | 594.8 | 0.15 | 0.69 | 173 of 600 | 72180 (-38), 72183 (-38), 72065 (-34) | 71822 (+72), 72346 (+69), 72512 (+46) |
| Pain management | 60 | 484.8 | 0.09 | 0.60 | 274 of 600 | 72083 (-83), 72677 (-83), 72687 (-78) | 72350 (+86), 72330 (+83), 71630 (+78) |
| Plastic & reconstructive surgery | 90 | 325.2 | 0.07 | 0.50 | 289 of 600 | 72339 (-59), 72437 (-56), 72386 (-55) | 72945 (+76), 72936 (+74), 72940 (+74) |
| Speech & language therapy | 30 | 8,711.4 | 0.90 | 0.57 | 348 of 600 | 72682 (-75), 72437 (-52), 72928 (-49) | 72001 (+100), 72027 (+100), 72122 (+100) |
| Nutrition & dietitian | 30 | 1,908 | 0.33 | 0.69 | 167 of 600 | 71935 (-88), 71653 (-57), 72137 (-55) | 72135 (+88), 72026 (+83), 72103 (+81) |
| Acupuncture, massage & naturopathy | 30 | 988 | 0.52 | 0.70 | 59 of 600 | 72069 (-56), 72930 (-46), 72088 (-34) | 72773 (+38), 72936 (+37), 72753 (+35) |
| Urgent care & emergency | 30 | 3,361 | 0.47 | 0.58 | 303 of 600 | 71742 (-61), 71653 (-56), 72927 (-55) | 71825 (+100), 72531 (+97), 72827 (+96) |
| Imaging & lab | 60 | 3,271.4 | 0.49 | 0.60 | 203 of 600 | 72065 (-95), 72183 (-92), 72180 (-86) | 72332 (+69), 71822 (+68), 72364 (+50) |
| Pharmacy | 30 | 13,880.4 | 1.72 | 0.51 | 317 of 600 | 71663 (-48), 72031 (-40), 72170 (-38) | 72048 (+94), 72026 (+83), 72060 (+81) |
| Home health & in-home care | 30 | 7,576.4 | 1.61 | 0.62 | 178 of 600 | 72392 (-36), 72021 (-32), 72568 (-32) | 72377 (+100), 72419 (+99), 72571 (+99) |
| Nursing & assisted living | 60 | 3,270 | 0.39 | 0.50 | 318 of 600 | 72523 (-67), 72583 (-64), 72669 (-59) | 71935 (+78), 72860 (+76), 71957 (+74) |
| Medical equipment & supplies | 60 | 3,298.4 | 0.36 | 0.52 | 311 of 600 | 72921 (-76), 72677 (-71), 72687 (-67) | 71630 (+91), 72060 (+74), 72539 (+61) |
| Hearing & audiology | 60 | 1,342 | 0.19 | 0.67 | 262 of 600 | 72065 (-83), 72183 (-82), 72015 (-77) | 72531 (+64), 72432 (+59), 72644 (+59) |
| Behavior therapy (ABA) | 30 | 8,960.2 | 2.88 | 0.73 | 83 of 600 | 71942 (-57), 72437 (-30), 72762 (-28) | 71772 (+100), 71962 (+100), 72948 (+99) |
| Care coordination & community health | 30 | 23,725.8 | 1.63 | 0.56 | 275 of 600 | 72568 (-78), 72350 (-71), 72137 (-70) | 71660 (+100), 71665 (+100), 71674 (+100) |
| General surgery | 60 | 2,026.6 | 0.35 | 0.53 | 218 of 600 | 72183 (-62), 72065 (-61), 72132 (-59) | 71822 (+67), 72364 (+63), 72534 (+61) |
| Infectious disease | 90 | 237.2 | 0.05 | 0.51 | 173 of 600 | 72183 (-66), 72339 (-65), 72022 (-64) | 72332 (+89), 72114 (+41), 72376 (+41) |
| Genetics & genetic counseling | 90 | 127.4 | 0.03 | 0.61 | 167 of 600 | 72736 (-87), 72744 (-85), 72749 (-78) | 72332 (+91), 72721 (+77), 72742 (+61) |
| Hospice & palliative care | 60 | 705.2 | 0.09 | 0.64 | 313 of 600 | 72360 (-79), 71832 (-74), 72366 (-74) | 71969 (+77), 72578 (+76), 72182 (+74) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Arkansas in households with no vehicle: about 136,543 of 2,312,057 (5.9%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 2 of 600 | 72377 (+22), 71677 (+15), 72114 (+12) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 600 | 72332 (+10), 71677 (+7), 72358 (+7) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 600 | 72332 (+15), 72114 (+14), 72072 (+5) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 600 | 72114 (+15), 71855 (+7), 72358 (+7) | 1.00 |
| Dental | 1.00 | 1 of 600 | 72377 (+18), 72114 (+14), 72036 (+9) | 1.00 |
| Eye care | 1.00 | 0 of 600 | 72114 (+13), 71855 (+12), 72072 (+9) | 1.00 |
| Chiropractic | 1.00 | 0 of 600 | 72114 (+11), 72072 (+8), 72342 (+8) | 1.00 |
| Physical & occupational therapy | 1.00 | 1 of 600 | 71855 (+16), 72615 (+11), 72332 (+10) | 1.00 |
| Orthopedics & sports injury | 1.00 | 1 of 600 | 72114 (+15), 71758 (+13), 72377 (+12) | 1.00 |
| Heart / cardiology | 1.00 | 1 of 600 | 72332 (+20), 71758 (+11), 72087 (+9) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 600 | 72114 (+14), 72332 (+13), 72087 (+8) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 600 | 72114 (+18), 72332 (+14), 72615 (+8) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 600 | 72332 (+22), 71758 (+7), 72087 (+7) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 600 | 72332 (+13), 72087 (+8), 72072 (+4) | 1.00 |
| Kidney / nephrology | 0.99 | 4 of 600 | 72332 (+44), 72377 (+21), 72114 (+18) | 1.00 |
| Diabetes & hormones | 1.00 | 2 of 600 | 72332 (+20), 72114 (+19), 72669 (+9) | 1.00 |
| Cancer care / oncology | 0.99 | 3 of 600 | 72332 (+59), 72377 (+19), 72114 (+16) | 1.00 |
| Arthritis / rheumatology | 1.00 | 2 of 600 | 72114 (+16), 72332 (+15), 72377 (+9) | 1.00 |
| Brain & nerves / neurology | 1.00 | 2 of 600 | 72332 (+19), 72114 (+17), 72202 (+7) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 600 | 72332 (+14), 71758 (+11), 72087 (+10) | 1.00 |
| Urology | 1.00 | 1 of 600 | 72114 (+15), 72332 (+10), 72615 (+10) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 600 | 72332 (+11), 72114 (+9), 72087 (+6) | 1.00 |
| Pain management | 1.00 | 2 of 600 | 72114 (+19), 72377 (+17), 72332 (+14) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 2 of 600 | 72377 (+24), 72332 (+22), 72114 (+11) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 600 | 71855 (+17), 72139 (+16), 72332 (+14) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 600 | 72072 (+17), 72615 (+7), 71855 (+6) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 600 | 72114 (+4), 72615 (+4), 72832 (+2) | 1.00 |
| Urgent care & emergency | 1.00 | 3 of 600 | 71677 (+24), 71855 (+17), 72377 (+16) | 1.00 |
| Imaging & lab | 0.99 | 1 of 600 | 72332 (+27), 72087 (+8), 72377 (+8) | 1.00 |
| Pharmacy | 1.00 | 2 of 600 | 72377 (+26), 71677 (+21), 71855 (+13) | 1.00 |
| Home health & in-home care | 1.00 | 2 of 600 | 71677 (+22), 72332 (+17), 72114 (+12) | 1.00 |
| Nursing & assisted living | 0.99 | 6 of 600 | 71855 (+27), 71677 (+25), 71847 (+25) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 600 | 72332 (+34), 72377 (+17), 71758 (+14) | 1.00 |
| Hearing & audiology | 1.00 | 0 of 600 | 72332 (+14), 72087 (+13), 71758 (+8) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 600 | 72114 (+18), 72202 (+5), 71743 (+4) | 1.00 |
| Care coordination & community health | 1.00 | 3 of 600 | 72332 (+30), 72072 (+18), 72373 (+17) | 1.00 |
| General surgery | 0.99 | 2 of 600 | 72332 (+19), 72114 (+15), 71758 (+11) | 1.00 |
| Infectious disease | 1.00 | 2 of 600 | 72332 (+45), 72066 (+15), 72377 (+13) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 600 | 72332 (+39), 72066 (+11), 72072 (+8) | 1.00 |
| Hospice & palliative care | 0.99 | 2 of 600 | 72332 (+29), 71758 (+19), 72389 (+13) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 36 of 600 | 41,603 (1.8%) |  | 22/124 | 5/98 | 9/356 | 0/22 |
| Women's health / OB-GYN | 016 | 2 of 600 | 360 (0.0%) |  | 1/124 | 0/98 | 1/356 | 0/22 |
| Mental health & counseling: Psychiatry | 029 | 9 of 600 | 1,872 (0.1%) |  | 0/124 | 1/98 | 8/356 | 0/22 |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 600 | 402 (0.0%) |  | 0/124 | 1/98 | 3/356 | 0/22 |
| Mental health & counseling: Clinical Social Work | 037 | 7 of 600 | 3,843 (0.2%) |  | 4/124 | 1/98 | 2/356 | 0/22 |
| Eye care | 023 | 7 of 600 | 7,336 (0.3%) |  | 3/124 | 2/98 | 2/356 | 0/22 |
| Chiropractic | 010 | 1 of 600 | 34 (0.0%) |  | 0/124 | 0/98 | 1/356 | 0/22 |
| Physical & occupational therapy | F049 | 3 of 600 | 1,101 (0.0%) |  | 1/124 | 0/98 | 2/356 | 0/22 |
| Orthopedics & sports injury | 025 | 21 of 600 | 16,067 (0.7%) |  | 9/124 | 2/98 | 10/356 | 0/22 |
| Heart / cardiology | 008 | 52 of 600 | 38,956 (1.7%) |  | 18/124 | 4/98 | 30/356 | 0/22 |
| Skin / dermatology | 011 | 46 of 600 | 51,214 (2.2%) |  | 5/124 | 7/98 | 34/356 | 0/22 |
| Allergy & immunology | 007 | 99 of 600 | 131,061 (5.7%) |  | 6/124 | 18/98 | 75/356 | 0/22 |
| Lung, breathing & sleep | 030 | 19 of 600 | 18,422 (0.8%) |  | 1/124 | 3/98 | 15/356 | 0/22 |
| Digestive / gastroenterology | 014 | 39 of 600 | 54,559 (2.4%) |  | 5/124 | 6/98 | 28/356 | 0/22 |
| Kidney / nephrology | 018 | 4 of 600 | 1,493 (0.1%) |  | 1/124 | 1/98 | 2/356 | 0/22 |
| Diabetes & hormones | 012 | 8 of 600 | 945 (0.0%) |  | 0/124 | 0/98 | 8/356 | 0/22 |
| Cancer care / oncology | 021 | 36 of 600 | 15,324 (0.7%) |  | 6/124 | 4/98 | 26/356 | 0/22 |
| Arthritis / rheumatology | 031 | 12 of 600 | 5,621 (0.2%) |  | 0/124 | 1/98 | 11/356 | 0/22 |
| Brain & nerves / neurology | 019 | 33 of 600 | 17,617 (0.8%) |  | 6/124 | 2/98 | 25/356 | 0/22 |
| Ear, nose & throat | 013 | 24 of 600 | 10,380 (0.4%) |  | 5/124 | 1/98 | 18/356 | 0/22 |
| Urology | 033 | 32 of 600 | 16,890 (0.7%) |  | 4/124 | 3/98 | 25/356 | 0/22 |
| Foot & ankle / podiatry | 028 | 40 of 600 | 39,503 (1.7%) |  | 4/124 | 3/98 | 33/356 | 0/22 |
| Plastic & reconstructive surgery | 027 | 24 of 600 | 20,148 (0.9%) |  | 0/124 | 3/98 | 21/356 | 0/22 |
| Speech & language therapy | F051 | 1 of 600 | 34 (0.0%) |  | 0/124 | 0/98 | 1/356 | 0/22 |
| Imaging & lab | F047 | 13 of 600 | 7,362 (0.3%) |  | 2/124 | 1/98 | 10/356 | 0/22 |
| Nursing & assisted living | F046 | 2 of 600 | 75 (0.0%) |  | 0/124 | 0/98 | 2/356 | 0/22 |
| General surgery | 015 | 25 of 600 | 40,004 (1.7%) |  | 17/124 | 4/98 | 4/356 | 0/22 |
| Infectious disease | 017 | 34 of 600 | 98,678 (4.3%) |  | 8/124 | 4/98 | 22/356 | 0/22 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 24080 rows (ZIP x specialty) stored in access_e2sfca for AR; market-score now uses drive-time access for these ZIPs.
