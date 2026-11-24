# E2SFCA access dry run: Wyoming

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 585; in Wyoming: 172
- Drive times: OSRM on OpenStreetMap roads (car profile), 585 x 585 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 140,362.6; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.32 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.81), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 15,014.6 | 4.30 | 0.45 | 81 of 172 | 82190 (-45), 83013 (-37), 82514 (-34) | 82083 (+75), 82845 (+74), 82844 (+72) |
| Pediatrics (children) | 30 | 3,545 | 1.11 | 0.66 | 50 of 172 | 82514 (-46), 82214 (-22), 83014 (-20) | 83011 (+81), 83012 (+67), 82450 (+60) |
| Women's health / OB-GYN | 60 | 1,999.8 | 0.53 | 0.83 | 46 of 172 | 82213 (-51), 82240 (-22), 82218 (-21) | 82433 (+75), 82844 (+66), 82845 (+45) |
| Mental health & counseling | 30 | 34,440.6 | 7.20 | 0.53 | 68 of 172 | 82411 (-44), 82929 (-44), 82514 (-43) | 82845 (+100), 82844 (+97), 82838 (+90) |
| Dental | 30 | 6,560.6 | 1.65 | 0.56 | 73 of 172 | 82324 (-71), 82514 (-36), 83122 (-32) | 82516 (+64), 83011 (+64), 82845 (+61) |
| Eye care | 30 | 2,340.6 | 0.62 | 0.54 | 77 of 172 | 83122 (-47), 82426 (-28), 83110 (-28) | 82428 (+100), 82450 (+94), 82710 (+94) |
| Chiropractic | 30 | 2,954.6 | 0.63 | 0.55 | 89 of 172 | 82729 (-61), 82053 (-37), 82431 (-36) | 82710 (+100), 83119 (+100), 82842 (+95) |
| Physical & occupational therapy | 30 | 10,540.2 | 2.70 | 0.54 | 82 of 172 | 83122 (-40), 82941 (-35), 83110 (-35) | 83011 (+100), 83012 (+97), 82923 (+92) |
| Orthopedics & sports injury | 60 | 1,838.4 | 0.39 | 0.78 | 62 of 172 | 82721 (-45), 82714 (-44), 82711 (-41) | 82428 (+76), 82844 (+76), 83128 (+65) |
| Heart / cardiology | 60 | 647 | 0.24 | 0.78 | 39 of 172 | 82929 (-39), 82410 (-32), 82052 (-25) | 82428 (+69), 83119 (+61), 82945 (+48) |
| Skin / dermatology | 60 | 370 | 0.09 | 0.77 | 35 of 172 | 82410 (-51), 82922 (-40), 82052 (-39) | 82428 (+100), 83128 (+83), 82710 (+72) |
| Allergy & immunology | 60 | 93.8 | 0.03 | 0.82 | 18 of 172 | 82520 (-31), 82929 (-31), 82515 (-26) | 83128 (+57), 83011 (+43), 82516 (+39) |
| Lung, breathing & sleep | 60 | 374 | 0.13 | 0.75 | 26 of 172 | 82052 (-88), 82073 (-63), 82082 (-62) | 82844 (+88), 82054 (+61), 82838 (+56) |
| Digestive / gastroenterology | 60 | 287 | 0.11 | 0.79 | 7 of 172 | 82643 (-26), 82635 (-21), 82052 (-17) | 82637 (+38), 82054 (+25), 82053 (+17) |
| Kidney / nephrology | 60 | 240 | 0.11 | 0.81 | 34 of 172 | 82721 (-37), 82732 (-23), 82433 (-21) | 83114 (+66), 82727 (+45), 82523 (+44) |
| Diabetes & hormones | 60 | 190.6 | 0.06 | 0.72 | 25 of 172 | 82934 (-55), 82410 (-49), 83114 (-43) | 82428 (+100), 82229 (+40), 82054 (+38) |
| Cancer care / oncology | 90 | 473.2 | 0.15 | 0.64 | 56 of 172 | 82422 (-86), 82433 (-81), 82411 (-75) | 82054 (+48), 82053 (+45), 82060 (+45) |
| Arthritis / rheumatology | 60 | 95.8 | 0.04 | 0.76 | 18 of 172 | 82052 (-32), 82732 (-28), 82721 (-26) | 82054 (+48), 82727 (+38), 82450 (+33) |
| Brain & nerves / neurology | 60 | 717.8 | 0.22 | 0.81 | 23 of 172 | 82052 (-37), 82433 (-27), 82073 (-24) | 82054 (+54), 82450 (+48), 82053 (+37) |
| Ear, nose & throat | 60 | 271.6 | 0.07 | 0.83 | 41 of 172 | 82937 (-84), 82721 (-72), 82933 (-72) | 82844 (+72), 82838 (+51), 82054 (+49) |
| Urology | 60 | 214 | 0.07 | 0.81 | 41 of 172 | 82410 (-41), 82922 (-41), 82929 (-40) | 82428 (+87), 83128 (+83), 82844 (+51) |
| Foot & ankle / podiatry | 60 | 519.8 | 0.15 | 0.79 | 49 of 172 | 83127 (-50), 82834 (-32), 82213 (-31) | 82710 (+82), 83119 (+77), 82844 (+70) |
| Pain management | 60 | 265.8 | 0.09 | 0.83 | 32 of 172 | 82929 (-59), 82834 (-39), 82934 (-37) | 82844 (+86), 82838 (+60), 82845 (+57) |
| Plastic & reconstructive surgery | 90 | 240.4 | 0.07 | 0.68 | 37 of 172 | 82922 (-56), 82929 (-35), 83118 (-34) | 82930 (+61), 82082 (+49), 83128 (+44) |
| Speech & language therapy | 30 | 2,704.6 | 0.90 | 0.55 | 78 of 172 | 82059 (-62), 82052 (-60), 82214 (-54) | 82450 (+100), 82845 (+80), 82844 (+79) |
| Nutrition & dietitian | 30 | 1,461 | 0.33 | 0.64 | 71 of 172 | 82514 (-63), 82729 (-48), 83122 (-42) | 82053 (+100), 82054 (+100), 82055 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,304.2 | 0.52 | 0.67 | 41 of 172 | 82520 (-33), 82515 (-18), 82633 (-15) | 82229 (+100), 83011 (+86), 83012 (+80) |
| Urgent care & emergency | 30 | 1,745.8 | 0.47 | 0.43 | 88 of 172 | 82729 (-63), 82217 (-55), 83110 (-55) | 82083 (+100), 82324 (+100), 82327 (+100) |
| Imaging & lab | 60 | 1,582.8 | 0.49 | 0.80 | 47 of 172 | 82512 (-73), 82721 (-28), 82922 (-28) | 83013 (+100), 82844 (+71), 83128 (+67) |
| Pharmacy | 30 | 5,221.2 | 1.72 | 0.57 | 73 of 172 | 82514 (-43), 83122 (-42), 83110 (-26) | 82059 (+91), 82054 (+90), 82060 (+90) |
| Home health & in-home care | 30 | 3,061.6 | 1.61 | 0.59 | 58 of 172 | 82944 (-86), 82242 (-32), 83122 (-32) | 82217 (+91), 82243 (+88), 82244 (+87) |
| Nursing & assisted living | 60 | 1,241.4 | 0.39 | 0.75 | 54 of 172 | 82213 (-56), 82512 (-53), 82240 (-32) | 82428 (+98), 82324 (+94), 83119 (+87) |
| Medical equipment & supplies | 60 | 1,258.6 | 0.36 | 0.84 | 60 of 172 | 82213 (-73), 82934 (-48), 82052 (-44) | 83119 (+100), 82054 (+78), 82428 (+70) |
| Hearing & audiology | 60 | 910 | 0.19 | 0.83 | 57 of 172 | 82934 (-100), 82213 (-58), 82422 (-53) | 82844 (+84), 82054 (+78), 82053 (+52) |
| Behavior therapy (ABA) | 30 | 13,031.2 | 2.88 | 0.56 | 15 of 172 | 82214 (-11), 82215 (-9), 83001 (-9) | 82053 (+36), 82054 (+36), 82059 (+36) |
| Care coordination & community health | 30 | 14,507.8 | 1.63 | 0.69 | 76 of 172 | 82082 (-60), 82411 (-58), 83122 (-51) | 82229 (+100), 82243 (+100), 82428 (+100) |
| General surgery | 60 | 1,088.6 | 0.35 | 0.84 | 49 of 172 | 82433 (-40), 82937 (-37), 82213 (-32) | 83119 (+55), 82054 (+52), 83114 (+52) |
| Infectious disease | 90 | 100.8 | 0.05 | 0.64 | 20 of 172 | 82643 (-67), 82648 (-59), 82633 (-56) | 82833 (+22), 82844 (+21), 82054 (+17) |
| Genetics & genetic counseling | 90 | 127.6 | 0.03 | 0.65 | 13 of 172 | 82922 (-33), 83118 (-18), 82005 (-17) | 83011 (+41), 83128 (+32), 82051 (+19) |
| Hospice & palliative care | 60 | 346.8 | 0.09 | 0.86 | 48 of 172 | 82922 (-46), 83128 (-32), 82732 (-31) | 83119 (+100), 82711 (+80), 82710 (+65) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Wyoming in households with no vehicle: about 18,058 of 440,881 (4.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 2
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 2 of 172 | 83119 (+40), 82833 (+20), 82430 (+7) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 172 | 82833 (+8), 83025 (+3), 82227 (+2) | 1.00 |
| Women's health / OB-GYN | 1.00 | 1 of 172 | 82833 (+25), 82430 (+7), 83025 (+7) | 1.00 |
| Mental health & counseling | 0.99 | 2 of 172 | 83119 (+28), 82833 (+27), 82430 (+8) | 1.00 |
| Dental | 0.98 | 2 of 172 | 83119 (+48), 82833 (+16), 82430 (+7) | 1.00 |
| Eye care | 0.99 | 2 of 172 | 83119 (+51), 82833 (+21), 82430 (+11) | 1.00 |
| Chiropractic | 0.98 | 2 of 172 | 83119 (+88), 82833 (+23), 82430 (+9) | 1.00 |
| Physical & occupational therapy | 0.99 | 3 of 172 | 83119 (+62), 82833 (+19), 82430 (+16) | 1.00 |
| Orthopedics & sports injury | 0.98 | 4 of 172 | 83119 (+55), 82833 (+28), 82430 (+18) | 0.99 |
| Heart / cardiology | 0.98 | 1 of 172 | 83119 (+61), 82430 (+13), 83025 (+4) | 0.99 |
| Skin / dermatology | 1.00 | 2 of 172 | 82430 (+20), 82833 (+15), 82635 (+3) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 172 | 83025 (+8), 82514 (+5), 82510 (+2) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 172 | 82833 (+37), 82430 (+9), 82635 (+2) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 172 | 82609 (+3), 82635 (+3), 82007 (+1) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 172 | 82833 (+13), 82430 (+6), 82510 (+2) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 172 | 82430 (+19), 83025 (+4), 82442 (+3) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 172 | 82833 (+14), 82412 (+6), 82514 (+4) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 172 | 82833 (+11), 82001 (+1), 82007 (+1) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 172 | 82833 (+12), 82430 (+4), 82412 (+3) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 172 | 82833 (+27), 83025 (+7), 82412 (+4) | 1.00 |
| Urology | 1.00 | 1 of 172 | 82833 (+19), 82635 (+3), 82430 (+2) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 2 of 172 | 83119 (+80), 82833 (+27), 82412 (+4) | 0.99 |
| Pain management | 0.99 | 2 of 172 | 83119 (+39), 82833 (+33), 83025 (+6) | 0.99 |
| Plastic & reconstructive surgery | 1.00 | 0 of 172 | 83025 (+11), 82635 (+4), 82007 (+1) | 1.00 |
| Speech & language therapy | 0.99 | 2 of 172 | 83119 (+26), 82833 (+21), 82430 (+9) | 1.00 |
| Nutrition & dietitian | 0.99 | 2 of 172 | 83119 (+45), 82833 (+38), 82430 (+10) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 172 | 82833 (+14), 82430 (+4), 82072 (+2) | 0.99 |
| Urgent care & emergency | 0.99 | 2 of 172 | 83119 (+61), 82833 (+21), 82430 (+11) | 1.00 |
| Imaging & lab | 1.00 | 1 of 172 | 82833 (+27), 83025 (+12), 83119 (+12) | 1.00 |
| Pharmacy | 0.99 | 2 of 172 | 83119 (+51), 82833 (+22), 82430 (+6) | 1.00 |
| Home health & in-home care | 0.98 | 1 of 172 | 83119 (+35), 82833 (+8), 82412 (+2) | 1.00 |
| Nursing & assisted living | 0.97 | 2 of 172 | 83119 (+70), 82833 (+20), 82710 (+8) | 0.99 |
| Medical equipment & supplies | 0.98 | 2 of 172 | 83119 (+98), 82430 (+19), 83025 (+7) | 0.99 |
| Hearing & audiology | 0.99 | 2 of 172 | 83119 (+29), 82833 (+19), 82412 (+4) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 172 | 82833 (+2), 82325 (+1) | 1.00 |
| Care coordination & community health | 0.99 | 2 of 172 | 83119 (+55), 82833 (+21), 82412 (+4) | 1.00 |
| General surgery | 0.98 | 2 of 172 | 83119 (+56), 82833 (+16), 83025 (+13) | 0.99 |
| Infectious disease | 1.00 | 0 of 172 | 82833 (+13), 82635 (+10), 82633 (+2) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 172 | 83025 (+7), 82001 (+1), 82635 (+1) | 1.00 |
| Hospice & palliative care | 0.98 | 2 of 172 | 83119 (+91), 82833 (+20), 82412 (+6) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 13 of 171 | 1,387 (0.3%) |  |  | 6/21 | 4/12 | 3/138 |
| Women's health / OB-GYN | 016 | 0 of 171 | 0 (0.0%) |  |  | 0/21 | 0/12 | 0/138 |
| Mental health & counseling: Psychiatry | 029 | 18 of 171 | 5,170 (1.2%) |  |  | 4/21 | 3/12 | 11/138 |
| Mental health & counseling: Clinical Psychology | 036 | 3 of 171 | 398 (0.1%) |  |  | 2/21 | 1/12 | 0/138 |
| Mental health & counseling: Clinical Social Work | 037 | 4 of 171 | 415 (0.1%) |  |  | 3/21 | 1/12 | 0/138 |
| Eye care | 023 | 8 of 171 | 1,085 (0.2%) |  |  | 5/21 | 1/12 | 2/138 |
| Chiropractic | 010 | 0 of 171 | 0 (0.0%) |  |  | 0/21 | 0/12 | 0/138 |
| Physical & occupational therapy | F049 | 1 of 171 | 167 (0.0%) |  |  | 0/21 | 1/12 | 0/138 |
| Orthopedics & sports injury | 025 | 14 of 171 | 2,273 (0.5%) |  |  | 7/21 | 2/12 | 5/138 |
| Heart / cardiology | 008 | 24 of 171 | 35,270 (8.0%) |  |  | 6/21 | 3/12 | 15/138 |
| Skin / dermatology | 011 | 27 of 171 | 35,601 (8.1%) |  |  | 2/21 | 2/12 | 23/138 |
| Allergy & immunology | 007 | 12 of 171 | 5,364 (1.2%) |  |  | 0/21 | 0/12 | 12/138 |
| Lung, breathing & sleep | 030 | 10 of 171 | 1,504 (0.3%) |  |  | 4/21 | 0/12 | 6/138 |
| Digestive / gastroenterology | 014 | 105 of 171 | 189,264 (42.9%) |  |  | 2/21 | 12/12 | 91/138 |
| Kidney / nephrology | 018 | 17 of 171 | 4,731 (1.1%) |  |  | 0/21 | 0/12 | 17/138 |
| Diabetes & hormones | 012 | 4 of 171 | 3,655 (0.8%) |  |  | 0/21 | 0/12 | 4/138 |
| Cancer care / oncology | 021 | 23 of 171 | 9,963 (2.3%) |  |  | 4/21 | 3/12 | 16/138 |
| Arthritis / rheumatology | 031 | 43 of 171 | 87,129 (19.8%) |  |  | 0/21 | 0/12 | 43/138 |
| Brain & nerves / neurology | 019 | 21 of 171 | 7,527 (1.7%) |  |  | 4/21 | 3/12 | 14/138 |
| Ear, nose & throat | 013 | 9 of 171 | 2,145 (0.5%) |  |  | 0/21 | 0/12 | 9/138 |
| Urology | 033 | 21 of 171 | 7,275 (1.7%) |  |  | 4/21 | 3/12 | 14/138 |
| Foot & ankle / podiatry | 028 | 27 of 171 | 27,102 (6.1%) |  |  | 4/21 | 2/12 | 21/138 |
| Plastic & reconstructive surgery | 027 | 10 of 171 | 3,228 (0.7%) |  |  | 0/21 | 0/12 | 10/138 |
| Speech & language therapy | F051 | 2 of 171 | 194 (0.0%) |  |  | 0/21 | 1/12 | 1/138 |
| Imaging & lab | F047 | 5 of 171 | 2,533 (0.6%) |  |  | 0/21 | 1/12 | 4/138 |
| Nursing & assisted living | F046 | 4 of 171 | 583 (0.1%) |  |  | 0/21 | 1/12 | 3/138 |
| General surgery | 015 | 15 of 171 | 3,942 (0.9%) |  |  | 5/21 | 1/12 | 9/138 |
| Infectious disease | 017 | 26 of 171 | 13,996 (3.2%) |  |  | 0/21 | 0/12 | 26/138 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 6880 rows (ZIP x specialty) stored in access_e2sfca for WY; market-score now uses drive-time access for these ZIPs.
