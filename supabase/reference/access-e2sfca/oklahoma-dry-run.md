# E2SFCA access dry run: Oklahoma

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,769; in Oklahoma: 660
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,769 x 1,769 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 336,348.404; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.36 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.89), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 44,313 | 4.30 | 0.49 | 311 of 660 | 74058 (-66), 73770 (-53), 74536 (-42) | 74558 (+96), 74549 (+95), 74867 (+80) |
| Pediatrics (children) | 30 | 9,010.4 | 1.11 | 0.73 | 146 of 660 | 74571 (-52), 73669 (-50), 74058 (-44) | 73084 (+71), 73130 (+60), 73141 (+55) |
| Women's health / OB-GYN | 60 | 5,080.8 | 0.53 | 0.72 | 217 of 660 | 74935 (-46), 73566 (-42), 74966 (-42) | 74558 (+100), 74549 (+83), 73733 (+67) |
| Mental health & counseling | 30 | 67,814.8 | 7.20 | 0.64 | 325 of 660 | 74761 (-60), 74955 (-56), 73860 (-47) | 74442 (+100), 74528 (+100), 74530 (+100) |
| Dental | 30 | 17,789.8 | 1.65 | 0.59 | 282 of 660 | 74058 (-61), 74571 (-41), 74637 (-39) | 73552 (+96), 73541 (+94), 73006 (+83) |
| Eye care | 30 | 6,588.4 | 0.62 | 0.60 | 315 of 660 | 74058 (-69), 73737 (-58), 73932 (-52) | 74427 (+95), 73641 (+85), 73719 (+84) |
| Chiropractic | 30 | 7,992 | 0.63 | 0.62 | 287 of 660 | 74536 (-60), 73021 (-59), 74462 (-43) | 73016 (+80), 73007 (+74), 73860 (+67) |
| Physical & occupational therapy | 30 | 26,567 | 2.70 | 0.66 | 245 of 660 | 73669 (-51), 73646 (-50), 73639 (-45) | 74570 (+70), 74528 (+67), 74442 (+66) |
| Orthopedics & sports injury | 60 | 3,832.4 | 0.39 | 0.75 | 283 of 660 | 74832 (-57), 73566 (-56), 73150 (-48) | 73058 (+66), 73528 (+61), 73021 (+57) |
| Heart / cardiology | 60 | 2,020.6 | 0.24 | 0.75 | 220 of 660 | 73064 (-51), 73054 (-47), 73531 (-45) | 74640 (+75), 74459 (+72), 73733 (+67) |
| Skin / dermatology | 60 | 838.6 | 0.09 | 0.77 | 248 of 660 | 73531 (-55), 73562 (-51), 74073 (-49) | 74459 (+80), 73528 (+75), 73552 (+59) |
| Allergy & immunology | 60 | 281.8 | 0.03 | 0.70 | 202 of 660 | 73768 (-62), 73738 (-58), 73742 (-58) | 74046 (+83), 74833 (+70), 73049 (+66) |
| Lung, breathing & sleep | 60 | 1,215.6 | 0.13 | 0.77 | 240 of 660 | 74536 (-100), 74939 (-100), 74943 (-83) | 74558 (+100), 74423 (+72), 74459 (+69) |
| Digestive / gastroenterology | 60 | 905.2 | 0.11 | 0.75 | 206 of 660 | 73065 (-52), 73064 (-45), 73173 (-43) | 74459 (+81), 74640 (+71), 73051 (+62) |
| Kidney / nephrology | 60 | 1,075.8 | 0.11 | 0.73 | 289 of 660 | 73566 (-68), 73567 (-58), 73531 (-54) | 73433 (+81), 73439 (+69), 73719 (+68) |
| Diabetes & hormones | 60 | 467 | 0.06 | 0.69 | 298 of 660 | 74536 (-100), 74939 (-96), 74943 (-75) | 74558 (+100), 73528 (+70), 74735 (+70) |
| Cancer care / oncology | 90 | 1,114 | 0.15 | 0.59 | 337 of 660 | 73028 (-55), 73054 (-53), 73064 (-51) | 74459 (+79), 74463 (+65), 74468 (+65) |
| Arthritis / rheumatology | 60 | 339.6 | 0.04 | 0.72 | 187 of 660 | 73531 (-98), 73562 (-91), 73150 (-76) | 73548 (+79), 73528 (+74), 74459 (+74) |
| Brain & nerves / neurology | 60 | 2,820.6 | 0.22 | 0.74 | 177 of 660 | 74015 (-90), 74055 (-88), 74073 (-82) | 73528 (+71), 74902 (+51), 74640 (+48) |
| Ear, nose & throat | 60 | 574 | 0.07 | 0.75 | 308 of 660 | 73531 (-62), 74354 (-62), 74360 (-59) | 74459 (+85), 73528 (+76), 73552 (+60) |
| Urology | 60 | 582.4 | 0.07 | 0.73 | 287 of 660 | 73173 (-67), 73065 (-60), 73064 (-57) | 74640 (+79), 74459 (+78), 73528 (+76) |
| Foot & ankle / podiatry | 60 | 1,121.6 | 0.15 | 0.71 | 227 of 660 | 73663 (-49), 73858 (-49), 74939 (-48) | 74558 (+100), 74549 (+75), 73625 (+61) |
| Pain management | 60 | 1,241 | 0.09 | 0.75 | 297 of 660 | 73446 (-74), 74055 (-67), 73030 (-66) | 74528 (+72), 74650 (+72), 74045 (+70) |
| Plastic & reconstructive surgery | 90 | 690 | 0.07 | 0.67 | 307 of 660 | 74834 (-65), 73054 (-62), 74881 (-62) | 74902 (+71), 74106 (+58), 74103 (+57) |
| Speech & language therapy | 30 | 12,145.6 | 0.90 | 0.66 | 290 of 660 | 73639 (-72), 73669 (-71), 74750 (-60) | 73659 (+87), 73002 (+85), 73073 (+82) |
| Nutrition & dietitian | 30 | 3,477 | 0.33 | 0.70 | 271 of 660 | 73744 (-74), 74644 (-73), 74651 (-70) | 73946 (+100), 74549 (+100), 74558 (+100) |
| Acupuncture, massage & naturopathy | 30 | 1,918.2 | 0.52 | 0.73 | 41 of 660 | 73663 (-30), 74427 (-29), 73838 (-27) | 74570 (+31), 74528 (+27), 74530 (+27) |
| Urgent care & emergency | 30 | 5,145.8 | 0.47 | 0.47 | 349 of 660 | 74637 (-73), 73842 (-59), 74015 (-56) | 73461 (+100), 73835 (+100), 74060 (+100) |
| Imaging & lab | 60 | 5,284.6 | 0.49 | 0.71 | 246 of 660 | 73150 (-50), 74055 (-45), 73566 (-44) | 74459 (+61), 74640 (+61), 73733 (+55) |
| Pharmacy | 30 | 17,047.6 | 1.72 | 0.49 | 324 of 660 | 74536 (-73), 74058 (-53), 73770 (-44) | 74549 (+100), 74574 (+100), 74942 (+100) |
| Home health & in-home care | 30 | 9,492.6 | 1.61 | 0.64 | 107 of 660 | 73554 (-67), 74954 (-43), 74637 (-40) | 73571 (+79), 74931 (+76), 73544 (+72) |
| Nursing & assisted living | 60 | 4,043 | 0.39 | 0.57 | 289 of 660 | 74531 (-65), 74761 (-57), 73559 (-44) | 73842 (+82), 74931 (+78), 73756 (+76) |
| Medical equipment & supplies | 60 | 4,901.2 | 0.36 | 0.64 | 302 of 660 | 73559 (-57), 73531 (-55), 74761 (-54) | 74549 (+69), 74558 (+63), 73625 (+61) |
| Hearing & audiology | 60 | 2,009.2 | 0.19 | 0.76 | 336 of 660 | 73531 (-59), 74630 (-56), 73742 (-55) | 73628 (+69), 74738 (+60), 73641 (+59) |
| Behavior therapy (ABA) | 30 | 19,995.4 | 2.88 | 0.75 | 151 of 660 | 74523 (-51), 73569 (-40), 73096 (-28) | 74944 (+100), 73032 (+97), 73016 (+96) |
| Care coordination & community health | 30 | 23,542 | 1.63 | 0.58 | 285 of 660 | 73844 (-80), 73435 (-71), 73437 (-67) | 73453 (+100), 73628 (+100), 73842 (+100) |
| General surgery | 60 | 3,816.8 | 0.35 | 0.71 | 241 of 660 | 74055 (-50), 74015 (-45), 74014 (-44) | 74558 (+65), 73528 (+62), 74549 (+62) |
| Infectious disease | 90 | 363.8 | 0.05 | 0.65 | 257 of 660 | 73064 (-48), 73065 (-45), 74834 (-45) | 74106 (+66), 73528 (+64), 74131 (+59) |
| Genetics & genetic counseling | 90 | 204.2 | 0.03 | 0.58 | 167 of 660 | 74359 (-59), 74368 (-59), 74364 (-53) | 73569 (+92), 73565 (+91), 73084 (+55) |
| Hospice & palliative care | 60 | 1,361 | 0.09 | 0.65 | 393 of 660 | 74761 (-100), 74764 (-84), 74576 (-74) | 73844 (+97), 73011 (+92), 73002 (+89) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Oklahoma in households with no vehicle: about 166,795 of 3,010,476 (5.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 6
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 1 of 660 | 73117 (+15), 74103 (+13), 73102 (+12) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 660 | 73117 (+12), 74103 (+11), 73102 (+10) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 660 | 74103 (+11), 74106 (+11), 73117 (+10) | 1.00 |
| Mental health & counseling | 1.00 | 2 of 660 | 74103 (+19), 74106 (+15), 74116 (+8) | 1.00 |
| Dental | 1.00 | 1 of 660 | 73102 (+15), 73117 (+13), 74103 (+11) | 1.00 |
| Eye care | 1.00 | 0 of 660 | 73102 (+14), 73117 (+14), 74103 (+12) | 1.00 |
| Chiropractic | 1.00 | 1 of 660 | 74103 (+15), 73102 (+13), 73117 (+12) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 660 | 73102 (+12), 73117 (+12), 74103 (+12) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 660 | 74103 (+14), 74106 (+12), 73102 (+11) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 660 | 73117 (+10), 74103 (+10), 73102 (+8) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 660 | 74103 (+11), 74106 (+11), 73102 (+10) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 660 | 74103 (+12), 74106 (+11), 73117 (+6) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 660 | 73117 (+12), 74103 (+11), 73102 (+9) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 660 | 74103 (+11), 73117 (+9), 74106 (+9) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 660 | 74103 (+12), 73117 (+11), 74106 (+10) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 660 | 74103 (+11), 74106 (+10), 73117 (+9) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 660 | 74103 (+9), 74106 (+9), 74046 (+8) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 660 | 73117 (+11), 73122 (+10), 73127 (+9) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 660 | 74106 (+15), 73117 (+11), 73122 (+10) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 660 | 74103 (+14), 74106 (+12), 73117 (+11) | 1.00 |
| Urology | 1.00 | 0 of 660 | 73117 (+11), 73122 (+10), 74103 (+10) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 660 | 74942 (+10), 73102 (+9), 73117 (+9) | 1.00 |
| Pain management | 1.00 | 2 of 660 | 74103 (+20), 74106 (+17), 73117 (+13) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 660 | 74046 (+11), 74106 (+11), 74103 (+10) | 1.00 |
| Speech & language therapy | 1.00 | 3 of 660 | 73102 (+15), 73117 (+15), 74103 (+15) | 1.00 |
| Nutrition & dietitian | 1.00 | 2 of 660 | 74103 (+16), 74106 (+15), 73122 (+11) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 660 | 73102 (+4), 74103 (+4), 73117 (+3) | 1.00 |
| Urgent care & emergency | 1.00 | 2 of 660 | 74103 (+18), 73668 (+17), 74106 (+14) | 1.00 |
| Imaging & lab | 1.00 | 0 of 660 | 74103 (+13), 73117 (+10), 74106 (+10) | 1.00 |
| Pharmacy | 1.00 | 0 of 660 | 73117 (+13), 73102 (+12), 73668 (+12) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 660 | 73102 (+4), 73117 (+4), 74103 (+4) | 1.00 |
| Nursing & assisted living | 0.99 | 1 of 660 | 73668 (+20), 73559 (+10), 74103 (+10) | 1.00 |
| Medical equipment & supplies | 1.00 | 0 of 660 | 74103 (+14), 74106 (+13), 73102 (+12) | 1.00 |
| Hearing & audiology | 1.00 | 0 of 660 | 73102 (+13), 73117 (+13), 74103 (+13) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 660 | 73122 (+11), 74103 (+11), 73127 (+10) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 660 | 74368 (+11), 74046 (+8), 74459 (+7) | 1.00 |
| General surgery | 1.00 | 0 of 660 | 74103 (+14), 74106 (+13), 73117 (+9) | 1.00 |
| Infectious disease | 1.00 | 0 of 660 | 74106 (+8), 74046 (+7), 73127 (+6) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 660 | 74368 (+10), 73122 (+6), 73127 (+6) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 660 | 74103 (+16), 74106 (+14), 73117 (+13) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 16 of 659 | 42,515 (1.4%) |  | 9/152 | 4/158 | 3/244 | 0/105 |
| Women's health / OB-GYN | 016 | 0 of 659 | 0 (0.0%) |  | 0/152 | 0/158 | 0/244 | 0/105 |
| Mental health & counseling: Psychiatry | 029 | 1 of 659 | 1,154 (0.0%) |  | 0/152 | 0/158 | 1/244 | 0/105 |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 659 | 281 (0.0%) |  | 0/152 | 1/158 | 0/244 | 0/105 |
| Mental health & counseling: Clinical Social Work | 037 | 2 of 659 | 3,038 (0.1%) |  | 2/152 | 0/158 | 0/244 | 0/105 |
| Eye care | 023 | 2 of 659 | 3,540 (0.1%) |  | 2/152 | 0/158 | 0/244 | 0/105 |
| Chiropractic | 010 | 0 of 659 | 0 (0.0%) |  | 0/152 | 0/158 | 0/244 | 0/105 |
| Physical & occupational therapy | F049 | 0 of 659 | 0 (0.0%) |  | 0/152 | 0/158 | 0/244 | 0/105 |
| Orthopedics & sports injury | 025 | 11 of 659 | 21,735 (0.7%) |  | 4/152 | 3/158 | 2/244 | 2/105 |
| Heart / cardiology | 008 | 56 of 659 | 83,248 (2.8%) |  | 6/152 | 15/158 | 19/244 | 16/105 |
| Skin / dermatology | 011 | 65 of 659 | 112,889 (3.8%) |  | 0/152 | 22/158 | 33/244 | 10/105 |
| Allergy & immunology | 007 | 52 of 659 | 82,240 (2.7%) |  | 8/152 | 1/158 | 23/244 | 20/105 |
| Lung, breathing & sleep | 030 | 26 of 659 | 24,171 (0.8%) |  | 0/152 | 3/158 | 15/244 | 8/105 |
| Digestive / gastroenterology | 014 | 35 of 659 | 41,992 (1.4%) |  | 0/152 | 13/158 | 18/244 | 4/105 |
| Kidney / nephrology | 018 | 2 of 659 | 1,166 (0.0%) |  | 0/152 | 0/158 | 1/244 | 1/105 |
| Diabetes & hormones | 012 | 3 of 659 | 2,139 (0.1%) |  | 2/152 | 0/158 | 0/244 | 1/105 |
| Cancer care / oncology | 021 | 18 of 659 | 25,449 (0.8%) |  | 0/152 | 0/158 | 14/244 | 4/105 |
| Arthritis / rheumatology | 031 | 38 of 659 | 27,466 (0.9%) |  | 3/152 | 2/158 | 9/244 | 24/105 |
| Brain & nerves / neurology | 019 | 15 of 659 | 13,211 (0.4%) |  | 0/152 | 4/158 | 7/244 | 4/105 |
| Ear, nose & throat | 013 | 22 of 659 | 34,786 (1.2%) |  | 0/152 | 0/158 | 20/244 | 2/105 |
| Urology | 033 | 23 of 659 | 34,394 (1.1%) |  | 2/152 | 5/158 | 15/244 | 1/105 |
| Foot & ankle / podiatry | 028 | 17 of 659 | 32,681 (1.1%) |  | 0/152 | 0/158 | 15/244 | 2/105 |
| Plastic & reconstructive surgery | 027 | 38 of 659 | 21,448 (0.7%) |  | 0/152 | 3/158 | 17/244 | 18/105 |
| Speech & language therapy | F051 | 0 of 659 | 0 (0.0%) |  | 0/152 | 0/158 | 0/244 | 0/105 |
| Imaging & lab | F047 | 1 of 659 | 97 (0.0%) |  | 0/152 | 0/158 | 1/244 | 0/105 |
| Nursing & assisted living | F046 | 0 of 659 | 0 (0.0%) |  | 0/152 | 0/158 | 0/244 | 0/105 |
| General surgery | 015 | 7 of 659 | 20,345 (0.7%) |  | 5/152 | 2/158 | 0/244 | 0/105 |
| Infectious disease | 017 | 39 of 659 | 23,750 (0.8%) |  | 1/152 | 4/158 | 11/244 | 23/105 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 26400 rows (ZIP x specialty) stored in access_e2sfca for OK; market-score now uses drive-time access for these ZIPs.
