# E2SFCA access dry run: Virginia

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 4,769; in Virginia: 889
- Drive times: OSRM on OpenStreetMap roads (car profile), 4,769 x 4,769 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,234,865.398; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.03 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.58), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 13; re-anchored: 10; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (21627, 21669, 27927)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 15450 | no | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | no | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 17517 | no | 9.34 | 100% | 2.36 | 100% | yes (1.07) |
| 21627 | no | 9.45 | 100% | 9.45 | 100% | no |
| 21669 | no | 13.40 | 100% | 13.40 | 100% | no |
| 24726 | no | 8.81 | 100% | 4.28 | 100% | yes (1.09) |
| 24823 | no | 8.92 | 100% | 4.73 | 100% | yes (1.45) |
| 25848 | no | 7.88 | 100% | 3.94 | 100% | yes (1.55) |
| 25864 | no | 8.64 | 100% | 3.08 | 100% | yes (1.46) |
| 27927 | no | 8.73 | 100% | 8.73 | 100% | no |
| 28805 | no | none | 0% | 3.14 | 100% | yes (1.78) |
| 41317 | no | 8.53 | 100% | 3.97 | 100% | yes (1.29) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 151,315.999 | 4.30 | 0.64 | 301 of 889 | 24314 (-61), 24366 (-40), 23461 (-36) | 24101 (+82), 24216 (+78), 24095 (+75) |
| Pediatrics (children) | 30 | 42,046 | 1.11 | 0.74 | 259 of 889 | 23882 (-61), 23830 (-53), 23884 (-50) | 22940 (+87), 22946 (+85), 22066 (+65) |
| Women's health / OB-GYN | 60 | 18,222 | 0.53 | 0.77 | 319 of 889 | 22546 (-51), 23836 (-50), 23102 (-46) | 23430 (+67), 23009 (+65), 20158 (+59) |
| Mental health & counseling | 30 | 255,384.6 | 7.20 | 0.74 | 192 of 889 | 23221 (-29), 23230 (-29), 22102 (-26) | 22946 (+56), 22940 (+52), 24574 (+50) |
| Dental | 30 | 51,738.6 | 1.65 | 0.73 | 286 of 889 | 22958 (-54), 22427 (-38), 22514 (-35) | 22935 (+72), 22940 (+64), 24067 (+63) |
| Eye care | 30 | 20,144.2 | 0.62 | 0.68 | 327 of 889 | 23970 (-52), 22734 (-41), 23410 (-41) | 22637 (+79), 22940 (+77), 22935 (+71) |
| Chiropractic | 30 | 15,981 | 0.63 | 0.68 | 189 of 889 | 23310 (-41), 23316 (-40), 23307 (-37) | 24067 (+62), 22935 (+57), 24127 (+55) |
| Physical & occupational therapy | 30 | 96,757.2 | 2.70 | 0.68 | 301 of 889 | 23221 (-33), 23230 (-33), 23927 (-31) | 23106 (+90), 23009 (+86), 22940 (+79) |
| Orthopedics & sports injury | 60 | 14,520.4 | 0.39 | 0.67 | 366 of 889 | 22931 (-94), 24517 (-86), 24441 (-82) | 24216 (+68), 23009 (+67), 20197 (+66) |
| Heart / cardiology | 60 | 8,759.4 | 0.24 | 0.69 | 411 of 889 | 24083 (-55), 22931 (-52), 24630 (-52) | 23009 (+75), 24622 (+68), 22637 (+67) |
| Skin / dermatology | 60 | 3,106.4 | 0.09 | 0.76 | 341 of 889 | 22931 (-66), 22972 (-65), 22723 (-62) | 20106 (+81), 24606 (+70), 24131 (+68) |
| Allergy & immunology | 60 | 1,298.2 | 0.03 | 0.74 | 333 of 889 | 22931 (-100), 22943 (-100), 22973 (-100) | 23846 (+100), 23899 (+100), 23883 (+95) |
| Lung, breathing & sleep | 60 | 4,273 | 0.13 | 0.76 | 325 of 889 | 24279 (-71), 23141 (-46), 24083 (-46) | 24127 (+86), 23899 (+79), 23881 (+76) |
| Digestive / gastroenterology | 60 | 4,082.8 | 0.11 | 0.74 | 374 of 889 | 23141 (-58), 24083 (-57), 23836 (-52) | 24127 (+75), 22637 (+74), 23009 (+72) |
| Kidney / nephrology | 60 | 3,874.4 | 0.11 | 0.66 | 401 of 889 | 24607 (-54), 23092 (-48), 23922 (-45) | 23891 (+91), 23882 (+68), 23009 (+65) |
| Diabetes & hormones | 60 | 2,187.4 | 0.06 | 0.76 | 318 of 889 | 22931 (-100), 22973 (-95), 22938 (-93) | 23427 (+93), 23440 (+84), 23009 (+68) |
| Cancer care / oncology | 90 | 5,454.6 | 0.15 | 0.53 | 513 of 889 | 23129 (-56), 23102 (-52), 23140 (-52) | 22637 (+82), 23950 (+79), 23440 (+78) |
| Arthritis / rheumatology | 60 | 1,380.8 | 0.04 | 0.78 | 328 of 889 | 22931 (-76), 22973 (-67), 22938 (-56) | 24412 (+95), 23846 (+94), 24127 (+84) |
| Brain & nerves / neurology | 60 | 6,678.8 | 0.22 | 0.75 | 254 of 889 | 24083 (-54), 23141 (-50), 23102 (-49) | 24127 (+67), 23009 (+60), 24595 (+58) |
| Ear, nose & throat | 60 | 2,255.2 | 0.07 | 0.69 | 468 of 889 | 24630 (-73), 24441 (-71), 22973 (-67) | 24412 (+92), 23952 (+86), 24318 (+82) |
| Urology | 60 | 2,699 | 0.07 | 0.67 | 482 of 889 | 24630 (-88), 24651 (-80), 23422 (-67) | 24131 (+100), 24316 (+87), 24091 (+76) |
| Foot & ankle / podiatry | 60 | 5,460.6 | 0.15 | 0.67 | 361 of 889 | 24630 (-57), 24651 (-51), 22973 (-45) | 23427 (+98), 23891 (+91), 23440 (+84) |
| Pain management | 60 | 2,719.4 | 0.09 | 0.72 | 307 of 889 | 24426 (-100), 24457 (-100), 24474 (-85) | 24127 (+73), 22637 (+65), 22935 (+58) |
| Plastic & reconstructive surgery | 90 | 1,989.8 | 0.07 | 0.73 | 433 of 889 | 23102 (-65), 23065 (-64), 23192 (-60) | 24127 (+67), 22968 (+66), 22923 (+65) |
| Speech & language therapy | 30 | 30,224.2 | 0.90 | 0.71 | 280 of 889 | 23085 (-61), 23161 (-46), 23023 (-36) | 23461 (+77), 22940 (+71), 24070 (+70) |
| Nutrition & dietitian | 30 | 11,231.8 | 0.33 | 0.77 | 214 of 889 | 22811 (-91), 22820 (-85), 24465 (-57) | 24127 (+91), 22940 (+87), 22946 (+84) |
| Acupuncture, massage & naturopathy | 30 | 10,487.4 | 0.52 | 0.82 | 103 of 889 | 24520 (-44), 24093 (-39), 24147 (-32) | 24433 (+74), 22580 (+61), 24131 (+60) |
| Urgent care & emergency | 30 | 14,554.4 | 0.47 | 0.68 | 299 of 889 | 23426 (-60), 24165 (-53), 23970 (-52) | 23009 (+100), 24131 (+100), 24095 (+95) |
| Imaging & lab | 60 | 15,578.8 | 0.49 | 0.72 | 275 of 889 | 23102 (-48), 22546 (-44), 23831 (-44) | 24131 (+74), 24127 (+63), 24184 (+62) |
| Pharmacy | 30 | 59,604.8 | 1.72 | 0.54 | 320 of 889 | 23123 (-51), 23337 (-36), 23092 (-29) | 24131 (+72), 24258 (+70), 24622 (+70) |
| Home health & in-home care | 30 | 116,461 | 1.61 | 0.74 | 164 of 889 | 22637 (-62), 22641 (-62), 22150 (-54) | 24458 (+100), 24465 (+100), 24622 (+100) |
| Nursing & assisted living | 60 | 14,156 | 0.39 | 0.46 | 278 of 889 | 24093 (-45), 23410 (-44), 24363 (-40) | 23307 (+62), 24484 (+55), 23488 (+52) |
| Medical equipment & supplies | 60 | 11,477 | 0.36 | 0.69 | 310 of 889 | 24441 (-38), 22931 (-36), 22211 (-34) | 20106 (+59), 23952 (+58), 24245 (+51) |
| Hearing & audiology | 60 | 6,357.8 | 0.19 | 0.70 | 390 of 889 | 22931 (-58), 22973 (-58), 24440 (-55) | 24127 (+74), 24323 (+74), 24622 (+73) |
| Behavior therapy (ABA) | 30 | 69,527.6 | 2.88 | 0.81 | 120 of 889 | 22003 (-57), 22151 (-55), 22213 (-54) | 23461 (+100), 23430 (+49), 22580 (+48) |
| Care coordination & community health | 30 | 72,228.2 | 1.63 | 0.70 | 77 of 889 | 24093 (-78), 24604 (-66), 24147 (-58) | 24315 (+100), 22503 (+49), 24265 (+49) |
| General surgery | 60 | 11,674.4 | 0.35 | 0.69 | 382 of 889 | 24083 (-64), 24064 (-52), 24175 (-52) | 24412 (+87), 24127 (+85), 22637 (+66) |
| Infectious disease | 90 | 1,822 | 0.05 | 0.73 | 439 of 889 | 23129 (-74), 23084 (-70), 23102 (-69) | 24412 (+77), 24127 (+66), 24184 (+62) |
| Genetics & genetic counseling | 90 | 1,283.8 | 0.03 | 0.67 | 454 of 889 | 22931 (-65), 23084 (-65), 23065 (-64) | 23356 (+92), 23488 (+92), 22637 (+88) |
| Hospice & palliative care | 60 | 1,814.6 | 0.09 | 0.63 | 387 of 889 | 22437 (-77), 23306 (-66), 22504 (-65) | 23430 (+73), 24272 (+71), 22942 (+70) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Virginia in households with no vehicle: about 396,974 of 6,745,229 (5.9%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 21
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 3 of 889 | 23416 (+26), 23523 (+18), 22904 (+13) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 889 | 23523 (+21), 23416 (+16), 23504 (+15) | 1.00 |
| Women's health / OB-GYN | 0.99 | 5 of 889 | 23416 (+24), 23440 (+22), 22209 (+16) | 1.00 |
| Mental health & counseling | 1.00 | 4 of 889 | 23219 (+17), 22904 (+16), 23523 (+15) | 1.00 |
| Dental | 1.00 | 4 of 889 | 23416 (+27), 22904 (+17), 23523 (+17) | 1.00 |
| Eye care | 1.00 | 3 of 889 | 22904 (+18), 23416 (+17), 23523 (+15) | 1.00 |
| Chiropractic | 1.00 | 1 of 889 | 23416 (+18), 22904 (+14), 23523 (+10) | 1.00 |
| Physical & occupational therapy | 1.00 | 4 of 889 | 23416 (+19), 22904 (+18), 23219 (+17) | 1.00 |
| Orthopedics & sports injury | 0.99 | 2 of 889 | 24476 (+27), 23523 (+15), 22943 (+13) | 1.00 |
| Heart / cardiology | 1.00 | 1 of 889 | 23523 (+15), 22209 (+13), 23440 (+13) | 1.00 |
| Skin / dermatology | 1.00 | 3 of 889 | 22904 (+28), 22209 (+17), 24606 (+15) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 889 | 23219 (+15), 23607 (+12), 23284 (+11) | 1.00 |
| Lung, breathing & sleep | 1.00 | 2 of 889 | 23523 (+17), 23607 (+16), 23651 (+13) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 889 | 22209 (+14), 23523 (+13), 23607 (+13) | 1.00 |
| Kidney / nephrology | 0.99 | 3 of 889 | 23416 (+16), 23440 (+16), 23523 (+15) | 1.00 |
| Diabetes & hormones | 1.00 | 2 of 889 | 22209 (+17), 23523 (+15), 23607 (+14) | 1.00 |
| Cancer care / oncology | 0.99 | 2 of 889 | 23416 (+31), 23440 (+15), 22209 (+12) | 1.00 |
| Arthritis / rheumatology | 1.00 | 3 of 889 | 22209 (+17), 22943 (+15), 24476 (+15) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 889 | 22209 (+12), 23523 (+11), 22203 (+10) | 1.00 |
| Ear, nose & throat | 1.00 | 3 of 889 | 24606 (+20), 24476 (+16), 22943 (+15) | 1.00 |
| Urology | 0.99 | 4 of 889 | 23440 (+28), 23416 (+18), 23523 (+16) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 3 of 889 | 23416 (+26), 23440 (+21), 23523 (+15) | 1.00 |
| Pain management | 1.00 | 1 of 889 | 22904 (+16), 22209 (+14), 22943 (+12) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 889 | 23523 (+14), 22209 (+12), 23607 (+11) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 889 | 23523 (+16), 22904 (+15), 23219 (+12) | 1.00 |
| Nutrition & dietitian | 1.00 | 2 of 889 | 22904 (+17), 23219 (+11), 23284 (+11) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 889 | 22904 (+11), 23523 (+11), 22209 (+10) | 1.00 |
| Urgent care & emergency | 1.00 | 3 of 889 | 23416 (+17), 23523 (+16), 23440 (+13) | 1.00 |
| Imaging & lab | 1.00 | 1 of 889 | 24606 (+16), 23523 (+13), 22209 (+11) | 1.00 |
| Pharmacy | 1.00 | 2 of 889 | 23416 (+29), 23523 (+15), 23219 (+14) | 1.00 |
| Home health & in-home care | 1.00 | 4 of 889 | 23523 (+22), 23504 (+16), 23704 (+16) | 1.00 |
| Nursing & assisted living | 0.99 | 2 of 889 | 23416 (+25), 24606 (+16), 24476 (+13) | 1.00 |
| Medical equipment & supplies | 0.99 | 3 of 889 | 23416 (+17), 24476 (+16), 23523 (+15) | 1.00 |
| Hearing & audiology | 0.99 | 3 of 889 | 24606 (+17), 22904 (+16), 24476 (+16) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 889 | 23523 (+19), 22209 (+13), 23504 (+12) | 1.00 |
| Care coordination & community health | 1.00 | 3 of 889 | 24604 (+17), 22504 (+10), 23416 (+10) | 1.00 |
| General surgery | 0.99 | 1 of 889 | 23523 (+17), 23440 (+14), 23607 (+14) | 1.00 |
| Infectious disease | 1.00 | 2 of 889 | 24476 (+19), 22209 (+17), 22202 (+14) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 889 | 24476 (+15), 22209 (+14), 22203 (+12) | 1.00 |
| Hospice & palliative care | 0.99 | 3 of 889 | 23416 (+41), 23440 (+39), 22904 (+15) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 22 of 888 | 85,276 (1.3%) | 0/59 | 16/284 | 5/305 | 1/230 | 0/10 |
| Women's health / OB-GYN | 016 | 2 of 888 | 588 (0.0%) | 0/59 | 2/284 | 0/305 | 0/230 | 0/10 |
| Mental health & counseling: Psychiatry | 029 | 3 of 888 | 2,947 (0.0%) | 0/59 | 3/284 | 0/305 | 0/230 | 0/10 |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 888 | 0 (0.0%) | 0/59 | 0/284 | 0/305 | 0/230 | 0/10 |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 888 | 6,083 (0.1%) | 0/59 | 6/284 | 0/305 | 0/230 | 0/10 |
| Eye care | 023 | 8 of 888 | 26,199 (0.4%) | 0/59 | 8/284 | 0/305 | 0/230 | 0/10 |
| Chiropractic | 010 | 2 of 888 | 588 (0.0%) | 0/59 | 2/284 | 0/305 | 0/230 | 0/10 |
| Physical & occupational therapy | F049 | 0 of 888 | 0 (0.0%) | 0/59 | 0/284 | 0/305 | 0/230 | 0/10 |
| Orthopedics & sports injury | 025 | 5 of 888 | 5,336 (0.1%) | 0/59 | 4/284 | 1/305 | 0/230 | 0/10 |
| Heart / cardiology | 008 | 33 of 888 | 70,919 (1.1%) | 0/59 | 23/284 | 9/305 | 0/230 | 1/10 |
| Skin / dermatology | 011 | 40 of 888 | 41,786 (0.6%) | 0/59 | 4/284 | 33/305 | 3/230 | 0/10 |
| Allergy & immunology | 007 | 32 of 888 | 38,802 (0.6%) | 0/59 | 9/284 | 13/305 | 10/230 | 0/10 |
| Lung, breathing & sleep | 030 | 3 of 888 | 2,947 (0.0%) | 0/59 | 3/284 | 0/305 | 0/230 | 0/10 |
| Digestive / gastroenterology | 014 | 4 of 888 | 5,159 (0.1%) | 0/59 | 4/284 | 0/305 | 0/230 | 0/10 |
| Kidney / nephrology | 018 | 2 of 888 | 588 (0.0%) | 0/59 | 2/284 | 0/305 | 0/230 | 0/10 |
| Diabetes & hormones | 012 | 1 of 888 | 67 (0.0%) | 0/59 | 0/284 | 1/305 | 0/230 | 0/10 |
| Cancer care / oncology | 021 | 8 of 888 | 22,015 (0.3%) | 0/59 | 2/284 | 6/305 | 0/230 | 0/10 |
| Arthritis / rheumatology | 031 | 13 of 888 | 13,691 (0.2%) | 0/59 | 2/284 | 10/305 | 1/230 | 0/10 |
| Brain & nerves / neurology | 019 | 18 of 888 | 12,354 (0.2%) | 0/59 | 3/284 | 15/305 | 0/230 | 0/10 |
| Ear, nose & throat | 013 | 11 of 888 | 11,333 (0.2%) | 0/59 | 5/284 | 5/305 | 1/230 | 0/10 |
| Urology | 033 | 9 of 888 | 14,832 (0.2%) | 0/59 | 4/284 | 5/305 | 0/230 | 0/10 |
| Foot & ankle / podiatry | 028 | 4 of 888 | 3,825 (0.1%) | 0/59 | 3/284 | 0/305 | 1/230 | 0/10 |
| Plastic & reconstructive surgery | 027 | 6 of 888 | 12,620 (0.2%) | 0/59 | 1/284 | 5/305 | 0/230 | 0/10 |
| Speech & language therapy | F051 | 0 of 888 | 0 (0.0%) | 0/59 | 0/284 | 0/305 | 0/230 | 0/10 |
| Imaging & lab | F047 | 2 of 888 | 588 (0.0%) | 0/59 | 2/284 | 0/305 | 0/230 | 0/10 |
| Nursing & assisted living | F046 | 0 of 888 | 0 (0.0%) | 0/59 | 0/284 | 0/305 | 0/230 | 0/10 |
| General surgery | 015 | 15 of 888 | 26,023 (0.4%) | 0/59 | 13/284 | 2/305 | 0/230 | 0/10 |
| Infectious disease | 017 | 7 of 888 | 10,642 (0.2%) | 0/59 | 1/284 | 6/305 | 0/230 | 0/10 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 35560 rows (ZIP x specialty) stored in access_e2sfca for VA; market-score now uses drive-time access for these ZIPs.
