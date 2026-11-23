# E2SFCA access dry run: Connecticut

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,105; in Connecticut: 288
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,105 x 2,105 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,017,879.001; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.08 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.71), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 8; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (02535, 02543, 06390)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 02535 | no | 1.62 | 8% | 1.62 | 8% | no |
| 02543 | no | 1.62 | 8% | 1.62 | 8% | no |
| 02872 | no | 9.04 | 100% | 3.14 | 100% | yes (2.18) |
| 06390 | yes | 8.29 | 100% | 8.29 | 100% | no |
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 10044 | no | 12.91 | 100% | 5.46 | 100% | yes (0.70) |
| 11101 | no | 8.52 | 100% | 4.81 | 100% | yes (0.47) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 119,187.201 | 4.30 | 0.74 | 72 of 287 | 06467 (-30), 06410 (-29), 06479 (-24) | 06471 (+61), 06093 (+38), 06370 (+38) |
| Pediatrics (children) | 30 | 44,278.8 | 1.11 | 0.82 | 76 of 287 | 06062 (-49), 06410 (-42), 06467 (-40) | 06456 (+79), 06424 (+77), 06414 (+74) |
| Women's health / OB-GYN | 60 | 16,667 | 0.53 | 0.48 | 123 of 287 | 06459 (-39), 06387 (-32), 06374 (-31) | 06471 (+56), 06796 (+54), 06282 (+53) |
| Mental health & counseling | 30 | 245,630.4 | 7.20 | 0.61 | 111 of 287 | 06410 (-37), 06479 (-33), 06385 (-32) | 06471 (+63), 06070 (+60), 06350 (+58) |
| Dental | 30 | 49,382.6 | 1.65 | 0.73 | 85 of 287 | 06467 (-29), 06385 (-25), 06479 (-24) | 06370 (+45), 06831 (+42), 06883 (+42) |
| Eye care | 30 | 18,145.6 | 0.62 | 0.70 | 93 of 287 | 06467 (-36), 06389 (-33), 06479 (-30) | 06370 (+57), 06019 (+45), 06350 (+44) |
| Chiropractic | 30 | 13,536 | 0.63 | 0.72 | 58 of 287 | 06467 (-23), 06479 (-19), 06385 (-17) | 06783 (+44), 06414 (+36), 06752 (+34) |
| Physical & occupational therapy | 30 | 90,903 | 2.70 | 0.57 | 91 of 287 | 06467 (-36), 06389 (-31), 06062 (-26) | 06414 (+57), 06456 (+57), 06424 (+52) |
| Orthopedics & sports injury | 60 | 9,862 | 0.39 | 0.29 | 138 of 287 | 06374 (-36), 06459 (-35), 06467 (-34) | 06242 (+72), 06068 (+65), 06753 (+65) |
| Heart / cardiology | 60 | 8,560.4 | 0.24 | 0.60 | 160 of 287 | 06467 (-54), 06489 (-53), 06444 (-51) | 06471 (+55), 06001 (+52), 06089 (+49) |
| Skin / dermatology | 60 | 3,308.4 | 0.09 | 0.67 | 165 of 287 | 06467 (-53), 06444 (-48), 06479 (-48) | 06754 (+83), 06019 (+65), 06092 (+62) |
| Allergy & immunology | 60 | 1,159.2 | 0.03 | 0.64 | 188 of 287 | 06459 (-65), 06450 (-59), 06489 (-57) | 06756 (+74), 06098 (+70), 06751 (+61) |
| Lung, breathing & sleep | 60 | 3,503.8 | 0.13 | 0.54 | 149 of 287 | 06475 (-42), 06426 (-41), 06409 (-38) | 06471 (+63), 06370 (+58), 06513 (+53) |
| Digestive / gastroenterology | 60 | 4,300.2 | 0.11 | 0.66 | 167 of 287 | 06482 (-54), 06708 (-48), 06444 (-43) | 06756 (+72), 06098 (+71), 06471 (+53) |
| Kidney / nephrology | 60 | 2,854.6 | 0.11 | 0.66 | 128 of 287 | 06475 (-39), 06426 (-37), 06498 (-35) | 06471 (+64), 06513 (+56), 06405 (+52) |
| Diabetes & hormones | 60 | 2,585.6 | 0.06 | 0.58 | 181 of 287 | 06410 (-75), 06498 (-72), 06409 (-70) | 06001 (+53), 06333 (+53), 06370 (+53) |
| Cancer care / oncology | 90 | 5,386.6 | 0.15 | 0.59 | 207 of 287 | 06482 (-54), 06442 (-47), 06409 (-45) | 06510 (+53), 06471 (+52), 06089 (+50) |
| Arthritis / rheumatology | 60 | 1,330 | 0.04 | 0.50 | 194 of 287 | 06708 (-64), 06072 (-61), 06062 (-60) | 06018 (+83), 06024 (+83), 06796 (+77) |
| Brain & nerves / neurology | 60 | 7,277.4 | 0.22 | 0.68 | 168 of 287 | 06459 (-53), 06467 (-48), 06444 (-47) | 06089 (+60), 06001 (+51), 06471 (+48) |
| Ear, nose & throat | 60 | 1,882.6 | 0.07 | 0.47 | 158 of 287 | 06450 (-49), 06459 (-48), 06451 (-43) | 06471 (+68), 06513 (+55), 06751 (+53) |
| Urology | 60 | 2,296.2 | 0.07 | 0.46 | 158 of 287 | 06410 (-48), 06482 (-48), 06072 (-42) | 06068 (+77), 06757 (+74), 06031 (+73) |
| Foot & ankle / podiatry | 60 | 6,271.6 | 0.15 | 0.73 | 98 of 287 | 06374 (-33), 06387 (-32), 06279 (-31) | 06751 (+57), 06754 (+53), 06793 (+40) |
| Pain management | 60 | 2,584 | 0.09 | 0.71 | 78 of 287 | 06482 (-28), 06790 (-24), 06759 (-23) | 06068 (+89), 06031 (+88), 06796 (+84) |
| Plastic & reconstructive surgery | 90 | 2,187.8 | 0.07 | 0.67 | 198 of 287 | 06492 (-49), 06410 (-47), 06467 (-41) | 06471 (+60), 06413 (+59), 06419 (+59) |
| Speech & language therapy | 30 | 31,727 | 0.90 | 0.71 | 39 of 287 | 06467 (-20), 06062 (-16), 06107 (-13) | 06831 (+58), 06455 (+35), 06751 (+33) |
| Nutrition & dietitian | 30 | 11,057.2 | 0.33 | 0.73 | 89 of 287 | 06018 (-70), 06467 (-32), 06410 (-29) | 06019 (+51), 06248 (+51), 06471 (+50) |
| Acupuncture, massage & naturopathy | 30 | 14,549.8 | 0.52 | 0.67 | 60 of 287 | 06467 (-25), 06385 (-24), 06018 (-23) | 06414 (+46), 06439 (+43), 06883 (+38) |
| Urgent care & emergency | 30 | 11,901.6 | 0.47 | 0.68 | 72 of 287 | 06492 (-36), 06410 (-35), 06018 (-28) | 06757 (+97), 06471 (+60), 06031 (+58) |
| Imaging & lab | 60 | 13,565 | 0.49 | 0.61 | 134 of 287 | 06410 (-44), 06492 (-44), 06467 (-42) | 06471 (+57), 06513 (+46), 06510 (+45) |
| Pharmacy | 30 | 49,927 | 1.72 | 0.72 | 62 of 287 | 06410 (-29), 06467 (-27), 06385 (-20) | 06471 (+56), 06370 (+42), 06091 (+31) |
| Home health & in-home care | 30 | 14,491.2 | 1.61 | 0.83 | 7 of 287 | 06467 (-12), 06450 (-10), 06410 (-9) | 06026 (+20), 06035 (+19), 06092 (+18) |
| Nursing & assisted living | 60 | 5,734.8 | 0.39 | 0.48 | 53 of 287 | 06095 (-19), 06062 (-18), 06029 (-17) | 06754 (+74), 06069 (+70), 06757 (+67) |
| Medical equipment & supplies | 60 | 8,479.4 | 0.36 | 0.53 | 70 of 287 | 06279 (-29), 06076 (-22), 06084 (-22) | 06098 (+35), 06282 (+34), 06058 (+33) |
| Hearing & audiology | 60 | 4,626.6 | 0.19 | 0.48 | 93 of 287 | 06415 (-36), 06459 (-31), 06447 (-30) | 06242 (+69), 06357 (+57), 06376 (+55) |
| Behavior therapy (ABA) | 30 | 36,818.6 | 2.88 | 0.83 | 26 of 287 | 06374 (-17), 06109 (-16), 06444 (-15) | 06035 (+54), 06092 (+51), 06026 (+43) |
| Care coordination & community health | 30 | 47,556 | 1.63 | 0.78 | 34 of 287 | 06062 (-25), 06450 (-24), 06488 (-23) | 06798 (+55), 06831 (+36), 06070 (+28) |
| General surgery | 60 | 10,089.4 | 0.35 | 0.56 | 194 of 287 | 06410 (-49), 06492 (-46), 06072 (-45) | 06370 (+63), 06471 (+63), 06351 (+59) |
| Infectious disease | 90 | 2,044.4 | 0.05 | 0.51 | 227 of 287 | 06807 (-63), 06878 (-62), 06492 (-61) | 06365 (+56), 06370 (+54), 06338 (+44) |
| Genetics & genetic counseling | 90 | 1,152.6 | 0.03 | 0.63 | 216 of 287 | 06467 (-64), 06444 (-63), 06410 (-62) | 06091 (+79), 06058 (+71), 06021 (+63) |
| Hospice & palliative care | 60 | 922 | 0.09 | 0.57 | 21 of 287 | 06410 (-17), 06095 (-16), 06482 (-16) | 06018 (+38), 06024 (+34), 06093 (+33) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Connecticut in households with no vehicle: about 248,251 of 2,871,146 (8.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 4
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 5 of 287 | 06702 (+25), 06120 (+23), 06105 (+20) | 1.00 |
| Pediatrics (children) | 0.99 | 6 of 287 | 06120 (+28), 06105 (+21), 06112 (+21) | 1.00 |
| Women's health / OB-GYN | 0.93 | 9 of 287 | 06702 (+35), 06120 (+22), 06710 (+18) | 1.00 |
| Mental health & counseling | 0.98 | 5 of 287 | 06702 (+37), 06510 (+27), 06710 (+18) | 1.00 |
| Dental | 0.98 | 8 of 287 | 06702 (+30), 06120 (+27), 06105 (+26) | 1.00 |
| Eye care | 0.98 | 9 of 287 | 06702 (+36), 06120 (+30), 06105 (+26) | 1.00 |
| Chiropractic | 0.97 | 4 of 287 | 06702 (+27), 06510 (+18), 06120 (+17) | 1.00 |
| Physical & occupational therapy | 0.96 | 8 of 287 | 06702 (+43), 06120 (+25), 06105 (+23) | 1.00 |
| Orthopedics & sports injury | 0.95 | 8 of 287 | 06702 (+44), 06120 (+27), 06105 (+22) | 1.00 |
| Heart / cardiology | 0.96 | 13 of 287 | 06702 (+46), 06120 (+24), 06710 (+23) | 1.00 |
| Skin / dermatology | 0.95 | 14 of 287 | 06702 (+43), 06710 (+22), 06120 (+20) | 1.00 |
| Allergy & immunology | 0.95 | 14 of 287 | 06702 (+41), 06710 (+21), 06120 (+20) | 1.00 |
| Lung, breathing & sleep | 0.95 | 6 of 287 | 06702 (+34), 06120 (+18), 06710 (+17) | 1.00 |
| Digestive / gastroenterology | 0.96 | 15 of 287 | 06702 (+50), 06120 (+26), 06710 (+26) | 1.00 |
| Kidney / nephrology | 0.96 | 6 of 287 | 06702 (+32), 06120 (+17), 06710 (+16) | 1.00 |
| Diabetes & hormones | 0.95 | 17 of 287 | 06702 (+49), 06120 (+26), 06710 (+25) | 1.00 |
| Cancer care / oncology | 0.94 | 16 of 287 | 06702 (+34), 06710 (+17), 06120 (+16) | 1.00 |
| Arthritis / rheumatology | 0.95 | 17 of 287 | 06702 (+61), 06710 (+30), 06120 (+28) | 1.00 |
| Brain & nerves / neurology | 0.97 | 12 of 287 | 06702 (+42), 06120 (+21), 06710 (+21) | 1.00 |
| Ear, nose & throat | 0.95 | 8 of 287 | 06702 (+32), 06120 (+19), 06710 (+16) | 1.00 |
| Urology | 0.94 | 9 of 287 | 06702 (+41), 06120 (+23), 06710 (+21) | 1.00 |
| Foot & ankle / podiatry | 0.95 | 13 of 287 | 06702 (+45), 06510 (+26), 06710 (+23) | 1.00 |
| Pain management | 0.97 | 5 of 287 | 06702 (+23), 06710 (+12), 06120 (+10) | 1.00 |
| Plastic & reconstructive surgery | 0.95 | 18 of 287 | 06702 (+28), 06120 (+14), 06710 (+14) | 1.00 |
| Speech & language therapy | 0.97 | 2 of 287 | 06702 (+27), 06510 (+16), 06120 (+14) | 1.00 |
| Nutrition & dietitian | 0.98 | 7 of 287 | 06702 (+28), 06120 (+26), 06105 (+25) | 1.00 |
| Acupuncture, massage & naturopathy | 0.98 | 5 of 287 | 06702 (+20), 06120 (+17), 06105 (+15) | 1.00 |
| Urgent care & emergency | 0.99 | 2 of 287 | 06702 (+22), 06120 (+15), 06103 (+12) | 1.00 |
| Imaging & lab | 0.97 | 6 of 287 | 06702 (+39), 06710 (+20), 06120 (+17) | 1.00 |
| Pharmacy | 0.98 | 6 of 287 | 06702 (+27), 06510 (+23), 06120 (+19) | 1.00 |
| Home health & in-home care | 0.99 | 0 of 287 | 06702 (+12), 06120 (+11), 06105 (+10) | 1.00 |
| Nursing & assisted living | 0.94 | 5 of 287 | 06702 (+32), 06120 (+19), 06105 (+16) | 1.00 |
| Medical equipment & supplies | 0.94 | 5 of 287 | 06702 (+34), 06120 (+19), 06105 (+17) | 1.00 |
| Hearing & audiology | 0.94 | 7 of 287 | 06702 (+35), 06120 (+23), 06105 (+20) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 2 of 287 | 06120 (+19), 06105 (+16), 06103 (+13) | 1.00 |
| Care coordination & community health | 0.99 | 2 of 287 | 06702 (+19), 06120 (+16), 06105 (+13) | 1.00 |
| General surgery | 0.96 | 11 of 287 | 06702 (+47), 06120 (+26), 06710 (+24) | 1.00 |
| Infectious disease | 0.94 | 19 of 287 | 06702 (+42), 06120 (+22), 06710 (+22) | 1.00 |
| Genetics & genetic counseling | 0.97 | 16 of 287 | 06702 (+37), 06710 (+18), 06120 (+15) | 1.00 |
| Hospice & palliative care | 0.96 | 0 of 287 | 06702 (+14), 06120 (+9), 06105 (+8) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 9 (CT Capitol Planning Region, CT Naugatuck Valley Planning Region, CT Northwest Hills Planning Region, CT Southeastern Connecticut Planning Region, CT Northeastern Connecticut Planning Region, CT Lower Connecticut River Valley Planning Region, CT South Central Connecticut Planning Region, CT Greater Bridgeport Planning Region, CT Western Connecticut Planning Region)

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 1 | 0 (0.0%) | 0/1 |  |  |  |  |
| Women's health / OB-GYN | 016 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Eye care | 023 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Chiropractic | 010 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Physical & occupational therapy | F049 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Orthopedics & sports injury | 025 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Heart / cardiology | 008 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Skin / dermatology | 011 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Allergy & immunology | 007 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Lung, breathing & sleep | 030 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Digestive / gastroenterology | 014 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Kidney / nephrology | 018 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Diabetes & hormones | 012 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Cancer care / oncology | 021 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Arthritis / rheumatology | 031 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Brain & nerves / neurology | 019 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Ear, nose & throat | 013 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Urology | 033 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Foot & ankle / podiatry | 028 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Speech & language therapy | F051 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Imaging & lab | F047 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Nursing & assisted living | F046 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| General surgery | 015 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |
| Infectious disease | 017 | 1 of 1 | 352 (100.0%) | 1/1 |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 11520 rows (ZIP x specialty) stored in access_e2sfca for CT; market-score now uses drive-time access for these ZIPs.
