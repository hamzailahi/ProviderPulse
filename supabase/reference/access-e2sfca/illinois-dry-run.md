# E2SFCA access dry run: Illinois

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,424; in Illinois: 1,391
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,424 x 3,424 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 671,389.003; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.65 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.61), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 4; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (38079, 38080, 62295, 62942)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 38079 | no | 7.52 | 100% | 7.52 | 100% | no |
| 38080 | no | 7.10 | 100% | 7.10 | 100% | no |
| 62295 | yes | 7.18 | 100% | 7.18 | 100% | no |
| 62942 | yes | 7.20 | 100% | 7.20 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 89,522.403 | 4.30 | 0.72 | 366 of 1389 | 61859 (-40), 60631 (-31), 62932 (-30) | 62990 (+95), 61877 (+75), 62910 (+75) |
| Pediatrics (children) | 30 | 24,268.2 | 1.11 | 0.85 | 292 of 1389 | 62208 (-49), 60631 (-43), 60912 (-41) | 62001 (+80), 62613 (+75), 62520 (+70) |
| Women's health / OB-GYN | 60 | 10,431.4 | 0.53 | 0.65 | 562 of 1389 | 61842 (-65), 61856 (-60), 61839 (-58) | 62975 (+69), 61077 (+63), 62905 (+60) |
| Mental health & counseling | 30 | 138,225.6 | 7.20 | 0.81 | 345 of 1389 | 61859 (-38), 62992 (-33), 60630 (-32) | 61774 (+98), 62990 (+97), 62974 (+85) |
| Dental | 30 | 35,162.4 | 1.65 | 0.79 | 333 of 1389 | 61437 (-54), 61480 (-50), 62445 (-41) | 62990 (+92), 62414 (+91), 61730 (+83) |
| Eye care | 30 | 13,581 | 0.62 | 0.75 | 424 of 1389 | 62033 (-39), 62263 (-37), 60631 (-36) | 61559 (+100), 62990 (+94), 62972 (+81) |
| Chiropractic | 30 | 17,182 | 0.63 | 0.64 | 652 of 1389 | 62204 (-53), 62931 (-53), 62201 (-50) | 61480 (+100), 62036 (+100), 62244 (+100) |
| Physical & occupational therapy | 30 | 69,008.6 | 2.70 | 0.75 | 477 of 1389 | 60304 (-35), 60630 (-35), 60631 (-35) | 62990 (+93), 62423 (+82), 62460 (+68) |
| Orthopedics & sports injury | 60 | 9,261.8 | 0.39 | 0.54 | 674 of 1389 | 62539 (-78), 62515 (-77), 61473 (-76) | 61731 (+82), 61773 (+82), 61775 (+82) |
| Heart / cardiology | 60 | 4,830.8 | 0.24 | 0.63 | 599 of 1389 | 62515 (-80), 62539 (-74), 62545 (-72) | 62975 (+74), 62244 (+71), 62256 (+69) |
| Skin / dermatology | 60 | 1,837.2 | 0.09 | 0.71 | 555 of 1389 | 62515 (-99), 62693 (-90), 62519 (-89) | 61774 (+76), 62975 (+67), 62905 (+58) |
| Allergy & immunology | 60 | 684.8 | 0.03 | 0.73 | 615 of 1389 | 62376 (-99), 62348 (-93), 62351 (-89) | 60151 (+78), 62990 (+74), 61559 (+73) |
| Lung, breathing & sleep | 60 | 2,285.8 | 0.13 | 0.68 | 455 of 1389 | 62926 (-88), 62897 (-84), 62846 (-81) | 62975 (+78), 61773 (+74), 62905 (+70) |
| Digestive / gastroenterology | 60 | 2,282 | 0.11 | 0.70 | 615 of 1389 | 62515 (-73), 62539 (-69), 62545 (-65) | 60954 (+74), 61379 (+68), 61323 (+66) |
| Kidney / nephrology | 60 | 2,446.4 | 0.11 | 0.59 | 754 of 1389 | 62515 (-61), 62312 (-58), 62539 (-58) | 62244 (+82), 62031 (+80), 62355 (+79) |
| Diabetes & hormones | 60 | 1,276.6 | 0.06 | 0.69 | 611 of 1389 | 62693 (-98), 62515 (-95), 62519 (-90) | 62990 (+78), 61312 (+76), 61370 (+76) |
| Cancer care / oncology | 90 | 3,241.8 | 0.15 | 0.51 | 906 of 1389 | 62265 (-60), 62926 (-60), 62046 (-58) | 60974 (+88), 60931 (+87), 60945 (+85) |
| Arthritis / rheumatology | 60 | 749 | 0.04 | 0.71 | 576 of 1389 | 62515 (-87), 62693 (-81), 62539 (-79) | 61955 (+80), 62975 (+80), 61720 (+78) |
| Brain & nerves / neurology | 60 | 4,167.6 | 0.22 | 0.69 | 527 of 1389 | 62539 (-73), 62693 (-73), 62519 (-71) | 62990 (+64), 62975 (+63), 61877 (+62) |
| Ear, nose & throat | 60 | 1,514.2 | 0.07 | 0.58 | 747 of 1389 | 62351 (-100), 62359 (-100), 62376 (-100) | 61731 (+89), 61775 (+88), 60952 (+86) |
| Urology | 60 | 1,540.6 | 0.07 | 0.60 | 759 of 1389 | 62515 (-100), 62539 (-100), 62545 (-100) | 61731 (+80), 61775 (+78), 61720 (+76) |
| Foot & ankle / podiatry | 60 | 3,602.2 | 0.15 | 0.70 | 663 of 1389 | 61273 (-60), 61068 (-55), 60113 (-54) | 60920 (+88), 61476 (+86), 61272 (+84) |
| Pain management | 60 | 1,686.4 | 0.09 | 0.70 | 559 of 1389 | 61777 (-65), 61842 (-65), 61727 (-63) | 62244 (+78), 62256 (+76), 62285 (+72) |
| Plastic & reconstructive surgery | 90 | 1,259.2 | 0.07 | 0.52 | 829 of 1389 | 62693 (-94), 62643 (-90), 61751 (-89) | 62476 (+87), 62815 (+85), 62414 (+82) |
| Speech & language therapy | 30 | 22,016.2 | 0.90 | 0.69 | 562 of 1389 | 62319 (-71), 62931 (-64), 62982 (-43) | 62434 (+100), 61737 (+82), 62481 (+82) |
| Nutrition & dietitian | 30 | 7,182.6 | 0.33 | 0.79 | 404 of 1389 | 62319 (-79), 61846 (-69), 60631 (-42) | 62990 (+96), 61851 (+82), 61855 (+81) |
| Acupuncture, massage & naturopathy | 30 | 5,074 | 0.52 | 0.85 | 100 of 1389 | 61001 (-72), 61728 (-52), 61722 (-49) | 62947 (+41), 60530 (+38), 60146 (+36) |
| Urgent care & emergency | 30 | 9,669.4 | 0.47 | 0.69 | 485 of 1389 | 61473 (-65), 61859 (-47), 62248 (-41) | 62253 (+100), 62355 (+100), 62086 (+99) |
| Imaging & lab | 60 | 10,973 | 0.49 | 0.69 | 558 of 1389 | 62906 (-55), 62969 (-54), 62530 (-50) | 60945 (+72), 60974 (+70), 60931 (+68) |
| Pharmacy | 30 | 35,294 | 1.72 | 0.69 | 372 of 1389 | 62982 (-47), 62992 (-44), 61377 (-37) | 62990 (+97), 62972 (+73), 61814 (+61) |
| Home health & in-home care | 30 | 19,387.4 | 1.61 | 0.75 | 71 of 1389 | 62810 (-61), 62872 (-48), 60958 (-30) | 62028 (+98), 62851 (+97), 62022 (+72) |
| Nursing & assisted living | 60 | 8,353.2 | 0.39 | 0.52 | 737 of 1389 | 61233 (-100), 61413 (-100), 61490 (-100) | 62244 (+93), 62256 (+82), 61260 (+79) |
| Medical equipment & supplies | 60 | 8,274.8 | 0.36 | 0.53 | 644 of 1389 | 62995 (-71), 61335 (-65), 61842 (-64) | 62850 (+73), 62091 (+70), 62366 (+68) |
| Hearing & audiology | 60 | 4,528.2 | 0.19 | 0.47 | 870 of 1389 | 62995 (-94), 61842 (-91), 61859 (-90) | 62414 (+72), 61044 (+70), 61737 (+67) |
| Behavior therapy (ABA) | 30 | 38,227.2 | 2.88 | 0.87 | 109 of 1389 | 62204 (-32), 62006 (-31), 62016 (-31) | 62423 (+96), 62281 (+70), 62289 (+59) |
| Care coordination & community health | 30 | 22,038 | 1.63 | 0.82 | 141 of 1389 | 60021 (-47), 60034 (-37), 60156 (-36) | 62990 (+96), 62244 (+84), 62256 (+73) |
| General surgery | 60 | 7,308.4 | 0.35 | 0.53 | 657 of 1389 | 62515 (-92), 61742 (-89), 62539 (-85) | 61773 (+68), 62990 (+66), 62910 (+62) |
| Infectious disease | 90 | 991.2 | 0.05 | 0.64 | 764 of 1389 | 62046 (-80), 62265 (-74), 62298 (-72) | 62990 (+87), 61873 (+76), 62244 (+74) |
| Genetics & genetic counseling | 90 | 750.4 | 0.03 | 0.68 | 605 of 1389 | 60075 (-69), 60154 (-64), 60473 (-63) | 61877 (+80), 61873 (+78), 62613 (+65) |
| Hospice & palliative care | 60 | 1,245.4 | 0.09 | 0.55 | 539 of 1389 | 61490 (-52), 61413 (-51), 61468 (-51) | 61932 (+89), 61940 (+87), 60530 (+79) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Illinois in households with no vehicle: about 1,043,196 of 9,999,448 (10.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 17 of 1389 | 61112 (+43), 62523 (+40), 62701 (+38) | 1.00 |
| Pediatrics (children) | 1.00 | 18 of 1389 | 60141 (+42), 62701 (+36), 61112 (+32) | 1.00 |
| Women's health / OB-GYN | 0.99 | 22 of 1389 | 60141 (+44), 61112 (+36), 60606 (+27) | 1.00 |
| Mental health & counseling | 1.00 | 17 of 1389 | 60141 (+36), 60606 (+30), 61112 (+29) | 1.00 |
| Dental | 0.99 | 14 of 1389 | 60141 (+42), 61112 (+42), 62701 (+30) | 1.00 |
| Eye care | 0.99 | 13 of 1389 | 61112 (+51), 62523 (+41), 60141 (+37) | 1.00 |
| Chiropractic | 0.99 | 11 of 1389 | 61112 (+59), 62701 (+41), 60141 (+40) | 1.00 |
| Physical & occupational therapy | 0.99 | 18 of 1389 | 61112 (+43), 60141 (+41), 62523 (+41) | 1.00 |
| Orthopedics & sports injury | 0.98 | 19 of 1389 | 60141 (+42), 61112 (+41), 62523 (+40) | 1.00 |
| Heart / cardiology | 0.99 | 25 of 1389 | 60141 (+47), 61112 (+31), 62523 (+30) | 1.00 |
| Skin / dermatology | 1.00 | 24 of 1389 | 60141 (+51), 62523 (+30), 60606 (+28) | 1.00 |
| Allergy & immunology | 1.00 | 29 of 1389 | 60141 (+57), 60606 (+32), 62701 (+31) | 1.00 |
| Lung, breathing & sleep | 0.99 | 16 of 1389 | 60141 (+36), 60606 (+24), 60602 (+23) | 1.00 |
| Digestive / gastroenterology | 0.99 | 29 of 1389 | 60141 (+49), 60606 (+32), 61112 (+32) | 1.00 |
| Kidney / nephrology | 0.99 | 28 of 1389 | 60141 (+47), 61112 (+37), 60606 (+32) | 1.00 |
| Diabetes & hormones | 1.00 | 25 of 1389 | 60141 (+49), 60606 (+31), 60602 (+30) | 1.00 |
| Cancer care / oncology | 0.99 | 25 of 1389 | 60141 (+41), 62523 (+30), 60602 (+26) | 1.00 |
| Arthritis / rheumatology | 0.99 | 27 of 1389 | 60141 (+48), 61112 (+38), 62523 (+30) | 1.00 |
| Brain & nerves / neurology | 1.00 | 25 of 1389 | 60141 (+50), 60606 (+29), 60602 (+27) | 1.00 |
| Ear, nose & throat | 0.99 | 25 of 1389 | 62523 (+57), 60141 (+46), 60606 (+25) | 1.00 |
| Urology | 0.99 | 25 of 1389 | 60141 (+47), 62523 (+40), 60606 (+31) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 26 of 1389 | 60141 (+60), 60602 (+38), 60606 (+35) | 1.00 |
| Pain management | 0.99 | 20 of 1389 | 60141 (+46), 61112 (+31), 60606 (+28) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 20 of 1389 | 62523 (+50), 60141 (+39), 62090 (+21) | 1.00 |
| Speech & language therapy | 0.99 | 17 of 1389 | 60141 (+42), 61112 (+39), 62523 (+36) | 1.00 |
| Nutrition & dietitian | 1.00 | 18 of 1389 | 62523 (+48), 60141 (+42), 62701 (+31) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 5 of 1389 | 60141 (+20), 61112 (+20), 60606 (+18) | 1.00 |
| Urgent care & emergency | 0.99 | 18 of 1389 | 60141 (+41), 60606 (+40), 62523 (+40) | 1.00 |
| Imaging & lab | 0.99 | 31 of 1389 | 60141 (+56), 60606 (+37), 60602 (+35) | 1.00 |
| Pharmacy | 0.99 | 11 of 1389 | 61112 (+36), 62523 (+30), 62701 (+28) | 1.00 |
| Home health & in-home care | 0.99 | 1 of 1389 | 62205 (+16), 61112 (+11), 62090 (+10) | 1.00 |
| Nursing & assisted living | 0.98 | 11 of 1389 | 62523 (+56), 62843 (+52), 61112 (+36) | 1.00 |
| Medical equipment & supplies | 0.98 | 23 of 1389 | 60141 (+48), 62523 (+33), 61112 (+31) | 1.00 |
| Hearing & audiology | 0.98 | 18 of 1389 | 61112 (+46), 60141 (+39), 62523 (+39) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 3 of 1389 | 62523 (+35), 62701 (+35), 60141 (+17) | 1.00 |
| Care coordination & community health | 1.00 | 2 of 1389 | 60141 (+15), 62090 (+15), 60606 (+13) | 1.00 |
| General surgery | 0.99 | 25 of 1389 | 60141 (+49), 62523 (+33), 60606 (+31) | 1.00 |
| Infectious disease | 0.99 | 26 of 1389 | 60141 (+47), 62523 (+33), 60602 (+29) | 1.00 |
| Genetics & genetic counseling | 1.00 | 18 of 1389 | 60141 (+47), 62523 (+25), 60621 (+22) | 1.00 |
| Hospice & palliative care | 0.98 | 6 of 1389 | 61112 (+27), 60141 (+26), 62090 (+17) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 53 of 1391 | 44,790 (0.4%) | 1/231 | 44/359 | 8/298 | 0/503 |  |
| Women's health / OB-GYN | 016 | 1 of 1391 | 399 (0.0%) | 0/231 | 1/359 | 0/298 | 0/503 |  |
| Mental health & counseling: Psychiatry | 029 | 7 of 1391 | 38,524 (0.4%) | 3/231 | 2/359 | 2/298 | 0/503 |  |
| Mental health & counseling: Clinical Psychology | 036 | 3 of 1391 | 1,142 (0.0%) | 0/231 | 1/359 | 0/298 | 2/503 |  |
| Mental health & counseling: Clinical Social Work | 037 | 11 of 1391 | 7,743 (0.1%) | 0/231 | 11/359 | 0/298 | 0/503 |  |
| Eye care | 023 | 9 of 1391 | 6,547 (0.1%) | 0/231 | 9/359 | 0/298 | 0/503 |  |
| Chiropractic | 010 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| Physical & occupational therapy | F049 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| Orthopedics & sports injury | 025 | 7 of 1391 | 5,260 (0.1%) | 0/231 | 7/359 | 0/298 | 0/503 |  |
| Heart / cardiology | 008 | 33 of 1391 | 45,164 (0.5%) | 0/231 | 27/359 | 6/298 | 0/503 |  |
| Skin / dermatology | 011 | 29 of 1391 | 42,714 (0.4%) | 1/231 | 6/359 | 16/298 | 6/503 |  |
| Allergy & immunology | 007 | 17 of 1391 | 13,211 (0.1%) | 0/231 | 9/359 | 3/298 | 5/503 |  |
| Lung, breathing & sleep | 030 | 17 of 1391 | 12,827 (0.1%) | 0/231 | 1/359 | 5/298 | 11/503 |  |
| Digestive / gastroenterology | 014 | 30 of 1391 | 32,495 (0.3%) | 1/231 | 2/359 | 5/298 | 22/503 |  |
| Kidney / nephrology | 018 | 1 of 1391 | 178 (0.0%) | 0/231 | 1/359 | 0/298 | 0/503 |  |
| Diabetes & hormones | 012 | 1 of 1391 | 165 (0.0%) | 0/231 | 1/359 | 0/298 | 0/503 |  |
| Cancer care / oncology | 021 | 10 of 1391 | 12,774 (0.1%) | 1/231 | 2/359 | 6/298 | 1/503 |  |
| Arthritis / rheumatology | 031 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| Brain & nerves / neurology | 019 | 23 of 1391 | 20,677 (0.2%) | 0/231 | 2/359 | 6/298 | 15/503 |  |
| Ear, nose & throat | 013 | 3 of 1391 | 2,727 (0.0%) | 0/231 | 3/359 | 0/298 | 0/503 |  |
| Urology | 033 | 12 of 1391 | 18,536 (0.2%) | 1/231 | 3/359 | 7/298 | 1/503 |  |
| Foot & ankle / podiatry | 028 | 4 of 1391 | 868 (0.0%) | 0/231 | 3/359 | 1/298 | 0/503 |  |
| Plastic & reconstructive surgery | 027 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| Speech & language therapy | F051 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| Imaging & lab | F047 | 1 of 1391 | 399 (0.0%) | 0/231 | 1/359 | 0/298 | 0/503 |  |
| Nursing & assisted living | F046 | 0 of 1391 | 0 (0.0%) | 0/231 | 0/359 | 0/298 | 0/503 |  |
| General surgery | 015 | 21 of 1391 | 16,234 (0.2%) | 0/231 | 18/359 | 3/298 | 0/503 |  |
| Infectious disease | 017 | 1 of 1391 | 165 (0.0%) | 0/231 | 1/359 | 0/298 | 0/503 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 55640 rows (ZIP x specialty) stored in access_e2sfca for IL; market-score now uses drive-time access for these ZIPs.
