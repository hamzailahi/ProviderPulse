# E2SFCA access dry run: Kentucky

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,457; in Kentucky: 769
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,457 x 3,457 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 639,031.999; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.91 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.26), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 78; re-anchored: 21; still implausible (left out of the rank comparison, still stored, marked in the CSV): 60 (41048, 46032, 46037, 46038, 46040, 46048, 46074, 46106, 46113, 46142, 46143, 46160, 46181, 46183, 46208, 46221, 46222, 46240, 46260, 46268, 46280, 46290, 47034, 47037, 47112, 47166, 47234, 47240, 47264, 47346, 47351, 47362, 47401, 47403, 47405, 47406, 47408, 47420, 47427, 47431, 47434, 47435, 47436, 47438, 47451, 47458, 47527, 47546, 47564, 47575, 47581, 47584, 47585, 47598, 47613, 47619, 47638, 47654, 47841, 47858)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 24726 | no | 8.81 | 100% | 4.28 | 100% | yes (1.09) |
| 24823 | no | 8.92 | 100% | 4.73 | 100% | yes (1.45) |
| 25848 | no | 7.88 | 100% | 3.94 | 100% | yes (1.55) |
| 25864 | no | 8.64 | 100% | 3.08 | 100% | yes (1.46) |
| 26690 | no | 7.54 | 100% | 3.25 | 100% | yes (1.53) |
| 28805 | no | none | 0% | 3.14 | 100% | yes (1.78) |
| 41048 | yes | 7.55 | 100% | 7.55 | 100% | no |
| 41317 | yes | 8.53 | 100% | 3.97 | 100% | yes (1.29) |
| 46032 | no | 14.39 | 100% | 12.41 | 100% | no |
| 46033 | no | 10.85 | 100% | 0.01 | 100% | no |
| 46037 | no | 10.92 | 100% | 10.92 | 100% | no |
| 46038 | no | 12.30 | 100% | 12.30 | 100% | no |
| 46040 | no | 10.07 | 100% | 10.07 | 100% | no |
| 46048 | no | 8.38 | 100% | 8.38 | 100% | no |
| 46074 | no | 11.82 | 100% | 10.21 | 100% | no |
| 46106 | no | 64.10 | 100% | 63.79 | 100% | yes (66.67) |
| 46113 | no | 11.93 | 100% | 12.27 | 100% | no |
| 46142 | no | 28.84 | 100% | 12.15 | 100% | yes (65.76) |
| 46143 | no | 12.72 | 100% | 9.20 | 100% | no |
| 46160 | no | 13.02 | 100% | 13.02 | 100% | no |
| 46181 | no | 12.91 | 100% | 12.91 | 100% | no |
| 46183 | no | 15.37 | 100% | 15.37 | 100% | no |
| 46184 | no | 8.49 | 100% | 5.99 | 100% | no |
| 46208 | no | 126.83 | 100% | 18.72 | 100% | no |
| 46217 | no | 119.43 | 100% | 0.00 | 100% | yes (66.91) |
| 46221 | no | 23.71 | 100% | 17.20 | 100% | yes (64.28) |
| 46222 | no | 123.55 | 100% | 123.55 | 100% | no |
| 46240 | no | 19.79 | 100% | 19.79 | 100% | no |
| 46260 | no | 137.07 | 100% | 22.52 | 100% | yes (68.17) |
| 46268 | no | 116.62 | 100% | 118.10 | 100% | no |
| 46280 | no | 19.09 | 100% | 14.78 | 100% | no |
| 46290 | no | 34.40 | 100% | 17.78 | 100% | no |
| 47034 | no | 8.28 | 100% | 8.28 | 100% | no |
| 47037 | no | 7.44 | 100% | 7.44 | 100% | no |
| 47112 | no | 7.44 | 100% | 7.44 | 100% | no |
| 47166 | no | 7.79 | 100% | 7.79 | 100% | no |
| 47234 | no | 15.82 | 100% | 11.84 | 100% | yes (47.87) |
| 47240 | no | 7.41 | 100% | 7.41 | 100% | no |
| 47264 | no | 12.17 | 100% | 12.17 | 100% | no |
| 47339 | no | 7.74 | 100% | 6.30 | 100% | yes (12.00) |
| 47345 | no | 8.30 | 100% | 6.38 | 100% | yes (10.05) |
| 47346 | no | 8.71 | 100% | 8.06 | 100% | no |
| 47351 | no | 11.46 | 100% | 11.85 | 100% | no |
| 47362 | no | 10.36 | 100% | 10.36 | 100% | no |
| 47384 | no | 9.97 | 100% | 0.00 | 100% | yes (36.37) |
| 47401 | no | 14.17 | 100% | 14.17 | 100% | no |
| 47403 | no | 11.74 | 100% | 11.74 | 100% | no |
| 47405 | no | 11.96 | 100% | 11.96 | 100% | no |
| 47406 | no | 11.46 | 100% | 11.46 | 100% | no |
| 47408 | no | 10.52 | 100% | 10.52 | 100% | no |
| 47420 | no | 27.70 | 100% | 27.70 | 100% | no |
| 47427 | no | 7.64 | 100% | 7.64 | 100% | no |
| 47431 | no | 7.59 | 100% | 7.59 | 100% | no |
| 47434 | no | 13.03 | 100% | 13.03 | 100% | no |
| 47435 | no | 38.50 | 100% | 38.50 | 100% | no |
| 47436 | no | 14.36 | 100% | 14.36 | 100% | no |
| 47438 | no | 8.03 | 100% | 8.03 | 100% | no |
| 47451 | no | 13.06 | 100% | 13.06 | 100% | no |
| 47458 | no | 17.83 | 100% | 17.83 | 100% | no |
| 47527 | no | 7.95 | 100% | 7.95 | 100% | no |
| 47546 | no | 8.07 | 100% | 8.07 | 100% | no |
| 47564 | no | 16.99 | 100% | 16.99 | 100% | no |
| 47575 | no | 9.55 | 100% | 9.55 | 100% | no |
| 47581 | no | 23.92 | 100% | 23.92 | 100% | no |
| 47584 | no | 9.88 | 100% | 15.12 | 100% | no |
| 47585 | no | 8.43 | 100% | 9.93 | 100% | no |
| 47598 | no | 16.60 | 100% | 16.60 | 100% | no |
| 47613 | no | 8.57 | 100% | 17.59 | 100% | no |
| 47619 | no | 9.93 | 100% | 9.93 | 100% | no |
| 47638 | no | 11.76 | 100% | 11.76 | 100% | no |
| 47639 | no | 8.83 | 100% | 4.92 | 100% | yes (12.86) |
| 47654 | no | 16.41 | 100% | 12.82 | 100% | yes (20.33) |
| 47660 | no | 9.20 | 100% | 4.32 | 100% | no |
| 47683 | no | 9.20 | 100% | 4.92 | 100% | yes (20.05) |
| 47802 | no | 7.59 | 100% | 6.15 | 100% | yes (6.32) |
| 47809 | no | 7.59 | 100% | 5.35 | 100% | yes (4.96) |
| 47841 | no | 9.09 | 100% | 9.09 | 100% | no |
| 47858 | no | 8.43 | 100% | 8.43 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 83,204.799 | 4.30 | 0.60 | 357 of 768 | 41264 (-73), 40914 (-52), 41622 (-50) | 41754 (+99), 41367 (+97), 41660 (+87) |
| Pediatrics (children) | 30 | 20,200.2 | 1.11 | 0.70 | 201 of 768 | 40223 (-29), 40161 (-28), 40241 (-28) | 40258 (+65), 40526 (+57), 41754 (+57) |
| Women's health / OB-GYN | 60 | 7,853 | 0.53 | 0.62 | 215 of 768 | 42420 (-39), 40109 (-38), 40165 (-38) | 40526 (+56), 42051 (+54), 40211 (+45) |
| Mental health & counseling | 30 | 116,717.4 | 7.20 | 0.71 | 217 of 768 | 41264 (-98), 41651 (-87), 41619 (-85) | 41754 (+98), 41367 (+97), 41464 (+95) |
| Dental | 30 | 24,399 | 1.65 | 0.69 | 180 of 768 | 40913 (-34), 40351 (-28), 40979 (-28) | 42254 (+74), 42232 (+67), 42240 (+65) |
| Eye care | 30 | 11,229 | 0.62 | 0.70 | 313 of 768 | 41264 (-61), 41601 (-54), 41642 (-53) | 41660 (+100), 40940 (+87), 41168 (+79) |
| Chiropractic | 30 | 10,278.6 | 0.63 | 0.69 | 245 of 768 | 40856 (-83), 42351 (-47), 40351 (-32) | 40363 (+79), 40075 (+68), 42054 (+60) |
| Physical & occupational therapy | 30 | 50,966.4 | 2.70 | 0.63 | 274 of 768 | 41553 (-52), 42351 (-32), 40475 (-31) | 40526 (+70), 40046 (+63), 41754 (+61) |
| Orthopedics & sports injury | 60 | 8,058.2 | 0.39 | 0.71 | 292 of 768 | 40165 (-53), 40109 (-48), 40031 (-40) | 40995 (+80), 40526 (+75), 40953 (+73) |
| Heart / cardiology | 60 | 4,138.4 | 0.24 | 0.61 | 388 of 768 | 41622 (-69), 42322 (-69), 42025 (-68) | 41168 (+72), 41663 (+71), 42450 (+66) |
| Skin / dermatology | 60 | 1,316 | 0.09 | 0.67 | 277 of 768 | 42452 (-63), 40031 (-48), 42455 (-46) | 40526 (+94), 42171 (+63), 41557 (+60) |
| Allergy & immunology | 60 | 552.4 | 0.03 | 0.65 | 428 of 768 | 41519 (-78), 41535 (-76), 41348 (-74) | 40526 (+96), 41632 (+86), 42252 (+73) |
| Lung, breathing & sleep | 60 | 2,227.6 | 0.13 | 0.63 | 389 of 768 | 42151 (-100), 42167 (-100), 42602 (-90) | 40526 (+85), 40940 (+81), 40826 (+75) |
| Digestive / gastroenterology | 60 | 1,869 | 0.11 | 0.69 | 339 of 768 | 42322 (-55), 42025 (-54), 42455 (-54) | 40526 (+72), 41168 (+71), 42378 (+61) |
| Kidney / nephrology | 60 | 2,018.6 | 0.11 | 0.62 | 459 of 768 | 41640 (-95), 41831 (-90), 41772 (-88) | 41464 (+82), 40437 (+73), 40915 (+73) |
| Diabetes & hormones | 60 | 902.6 | 0.06 | 0.66 | 317 of 768 | 42455 (-71), 40342 (-61), 40601 (-58) | 40526 (+85), 42453 (+72), 42450 (+71) |
| Cancer care / oncology | 90 | 2,733.8 | 0.15 | 0.40 | 511 of 768 | 40065 (-56), 40070 (-56), 42322 (-56) | 41557 (+79), 41559 (+73), 41367 (+66) |
| Arthritis / rheumatology | 60 | 584.8 | 0.04 | 0.64 | 351 of 768 | 40109 (-68), 40165 (-63), 40272 (-60) | 40526 (+80), 41168 (+73), 41760 (+67) |
| Brain & nerves / neurology | 60 | 3,863 | 0.22 | 0.63 | 263 of 768 | 40109 (-55), 40165 (-53), 40272 (-48) | 40526 (+81), 41168 (+66), 40211 (+53) |
| Ear, nose & throat | 60 | 1,172.8 | 0.07 | 0.55 | 475 of 768 | 41622 (-97), 41630 (-84), 42351 (-83) | 41464 (+83), 41168 (+70), 40170 (+64) |
| Urology | 60 | 1,288.2 | 0.07 | 0.60 | 490 of 768 | 42025 (-83), 41144 (-77), 41143 (-73) | 41760 (+71), 40526 (+70), 42321 (+67) |
| Foot & ankle / podiatry | 60 | 2,214.6 | 0.15 | 0.68 | 245 of 768 | 42455 (-52), 41144 (-39), 40055 (-34) | 41168 (+73), 40826 (+62), 41052 (+51) |
| Pain management | 60 | 1,336 | 0.09 | 0.53 | 429 of 768 | 41619 (-100), 41622 (-100), 41630 (-100) | 40526 (+93), 40437 (+81), 41168 (+73) |
| Plastic & reconstructive surgery | 90 | 1,043.8 | 0.07 | 0.51 | 409 of 768 | 40031 (-72), 40065 (-69), 40020 (-67) | 40526 (+79), 41168 (+70), 42051 (+70) |
| Speech & language therapy | 30 | 16,909.4 | 0.90 | 0.67 | 288 of 768 | 41366 (-71), 42265 (-45), 40058 (-37) | 40046 (+86), 40077 (+72), 40526 (+68) |
| Nutrition & dietitian | 30 | 5,370.2 | 0.33 | 0.71 | 213 of 768 | 40161 (-79), 41539 (-78), 40157 (-67) | 41754 (+100), 41367 (+99), 40526 (+94) |
| Acupuncture, massage & naturopathy | 30 | 3,590.4 | 0.52 | 0.79 | 58 of 768 | 41721 (-67), 42729 (-36), 40376 (-21) | 40526 (+49), 40510 (+34), 40322 (+32) |
| Urgent care & emergency | 30 | 8,253.6 | 0.47 | 0.65 | 300 of 768 | 40171 (-77), 40979 (-65), 40913 (-60) | 40940 (+100), 41632 (+94), 40075 (+80) |
| Imaging & lab | 60 | 8,392.8 | 0.49 | 0.62 | 312 of 768 | 41822 (-74), 41772 (-73), 41831 (-70) | 41663 (+68), 40526 (+66), 41607 (+60) |
| Pharmacy | 30 | 34,136.6 | 1.72 | 0.56 | 376 of 768 | 41264 (-72), 40913 (-42), 41513 (-42) | 41632 (+100), 41754 (+100), 41367 (+99) |
| Home health & in-home care | 30 | 57,258.2 | 1.61 | 0.71 | 60 of 768 | 41264 (-77), 41139 (-39), 41169 (-37) | 41168 (+100), 41250 (+100), 41571 (+100) |
| Nursing & assisted living | 60 | 8,549.4 | 0.39 | 0.42 | 347 of 768 | 41622 (-47), 42025 (-45), 41094 (-44) | 42047 (+76), 42032 (+61), 40995 (+59) |
| Medical equipment & supplies | 60 | 6,653 | 0.36 | 0.59 | 384 of 768 | 41264 (-53), 42066 (-53), 40949 (-52) | 40940 (+71), 40526 (+65), 41663 (+61) |
| Hearing & audiology | 60 | 3,707 | 0.19 | 0.70 | 315 of 768 | 42056 (-66), 42455 (-66), 42024 (-63) | 42047 (+78), 40526 (+74), 42450 (+63) |
| Behavior therapy (ABA) | 30 | 31,644.6 | 2.88 | 0.79 | 73 of 768 | 40176 (-29), 41250 (-27), 42351 (-21) | 42204 (+100), 42234 (+86), 42458 (+63) |
| Care coordination & community health | 30 | 50,803.4 | 1.63 | 0.69 | 215 of 768 | 41264 (-100), 41240 (-97), 41254 (-97) | 41754 (+100), 40526 (+99), 42544 (+99) |
| General surgery | 60 | 6,065 | 0.35 | 0.61 | 406 of 768 | 42350 (-68), 42455 (-66), 42372 (-61) | 40526 (+74), 41663 (+68), 42321 (+63) |
| Infectious disease | 90 | 724.2 | 0.05 | 0.49 | 330 of 768 | 40065 (-67), 40076 (-66), 40031 (-63) | 40390 (+69), 41168 (+69), 40356 (+66) |
| Genetics & genetic counseling | 90 | 548.6 | 0.03 | 0.53 | 161 of 768 | 41001 (-94), 41030 (-88), 41059 (-84) | 40211 (+60), 40210 (+58), 40212 (+54) |
| Hospice & palliative care | 60 | 1,001.6 | 0.09 | 0.57 | 235 of 768 | 41810 (-66), 41849 (-62), 41837 (-53) | 41534 (+94), 41512 (+78), 41255 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Kentucky in households with no vehicle: about 235,938 of 3,489,023 (6.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 9
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 16 of 768 | 40526 (+75), 41760 (+36), 42759 (+36) | 1.00 |
| Pediatrics (children) | 0.99 | 9 of 768 | 40526 (+59), 41663 (+43), 40210 (+22) | 1.00 |
| Women's health / OB-GYN | 0.98 | 4 of 768 | 40526 (+53), 42759 (+17), 41663 (+16) | 0.99 |
| Mental health & counseling | 0.99 | 7 of 768 | 40526 (+89), 41760 (+24), 40507 (+22) | 1.00 |
| Dental | 0.98 | 9 of 768 | 40526 (+60), 41663 (+35), 42759 (+28) | 1.00 |
| Eye care | 0.99 | 7 of 768 | 40526 (+81), 41663 (+46), 40202 (+21) | 1.00 |
| Chiropractic | 0.99 | 7 of 768 | 40526 (+58), 42759 (+31), 41663 (+23) | 1.00 |
| Physical & occupational therapy | 0.99 | 9 of 768 | 40526 (+78), 40202 (+27), 40203 (+24) | 1.00 |
| Orthopedics & sports injury | 0.99 | 6 of 768 | 40526 (+72), 40507 (+19), 40210 (+18) | 1.00 |
| Heart / cardiology | 0.99 | 8 of 768 | 40526 (+51), 41663 (+33), 40210 (+20) | 1.00 |
| Skin / dermatology | 0.99 | 5 of 768 | 40526 (+61), 41663 (+22), 40202 (+16) | 1.00 |
| Allergy & immunology | 0.99 | 10 of 768 | 40526 (+86), 41663 (+50), 41607 (+25) | 1.00 |
| Lung, breathing & sleep | 0.99 | 11 of 768 | 40526 (+61), 41663 (+35), 41760 (+26) | 1.00 |
| Digestive / gastroenterology | 0.99 | 4 of 768 | 40526 (+50), 40210 (+16), 41663 (+16) | 1.00 |
| Kidney / nephrology | 0.99 | 13 of 768 | 40526 (+52), 41663 (+51), 41607 (+34) | 1.00 |
| Diabetes & hormones | 0.99 | 4 of 768 | 40526 (+77), 40507 (+21), 41663 (+20) | 1.00 |
| Cancer care / oncology | 0.98 | 2 of 768 | 40526 (+22), 41663 (+15), 40210 (+11) | 1.00 |
| Arthritis / rheumatology | 1.00 | 8 of 768 | 40526 (+48), 41760 (+22), 41714 (+21) | 1.00 |
| Brain & nerves / neurology | 0.99 | 3 of 768 | 40526 (+50), 40210 (+17), 40211 (+15) | 1.00 |
| Ear, nose & throat | 0.99 | 6 of 768 | 41663 (+50), 40526 (+38), 41607 (+30) | 1.00 |
| Urology | 0.98 | 9 of 768 | 40526 (+67), 41714 (+21), 40507 (+19) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 4 of 768 | 40526 (+44), 40202 (+18), 41663 (+17) | 1.00 |
| Pain management | 0.99 | 14 of 768 | 40526 (+83), 41663 (+51), 41714 (+40) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 768 | 40526 (+26), 40211 (+16), 40210 (+14) | 1.00 |
| Speech & language therapy | 0.99 | 9 of 768 | 40526 (+75), 40202 (+26), 41663 (+23) | 1.00 |
| Nutrition & dietitian | 0.99 | 8 of 768 | 40526 (+98), 41663 (+53), 40847 (+28) | 0.99 |
| Acupuncture, massage & naturopathy | 0.99 | 1 of 768 | 40526 (+51), 40202 (+13), 40507 (+11) | 1.00 |
| Urgent care & emergency | 0.99 | 8 of 768 | 41663 (+54), 40526 (+53), 41607 (+26) | 1.00 |
| Imaging & lab | 0.98 | 10 of 768 | 40526 (+52), 41663 (+32), 41760 (+27) | 1.00 |
| Pharmacy | 0.99 | 16 of 768 | 40526 (+85), 41760 (+35), 42759 (+30) | 1.00 |
| Home health & in-home care | 0.99 | 2 of 768 | 41663 (+21), 40526 (+18), 41607 (+14) | 1.00 |
| Nursing & assisted living | 0.97 | 4 of 768 | 42759 (+39), 40526 (+31), 41663 (+25) | 1.00 |
| Medical equipment & supplies | 0.97 | 13 of 768 | 40526 (+61), 42759 (+51), 41663 (+46) | 1.00 |
| Hearing & audiology | 0.99 | 8 of 768 | 40526 (+63), 41663 (+20), 40202 (+19) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 3 of 768 | 40526 (+33), 41663 (+29), 40202 (+18) | 1.00 |
| Care coordination & community health | 0.99 | 2 of 768 | 40526 (+99), 40202 (+18), 40203 (+14) | 1.00 |
| General surgery | 0.98 | 9 of 768 | 40526 (+56), 41663 (+38), 41607 (+21) | 1.00 |
| Infectious disease | 0.99 | 1 of 768 | 40526 (+26), 40211 (+14), 40210 (+12) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 768 | 41052 (+14), 40211 (+11), 40210 (+10) | 1.00 |
| Hospice & palliative care | 0.98 | 2 of 768 | 42759 (+32), 40526 (+30), 41663 (+14) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 22 of 768 | 31,569 (0.9%) | 2/37 | 16/110 | 1/374 | 3/247 |  |
| Women's health / OB-GYN | 016 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Mental health & counseling: Clinical Psychology | 036 | 2 of 768 | 611 (0.0%) | 0/37 | 0/110 | 1/374 | 1/247 |  |
| Mental health & counseling: Clinical Social Work | 037 | 1 of 768 | 4,664 (0.1%) | 0/37 | 1/110 | 0/374 | 0/247 |  |
| Eye care | 023 | 4 of 768 | 5,994 (0.2%) | 0/37 | 2/110 | 2/374 | 0/247 |  |
| Chiropractic | 010 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Physical & occupational therapy | F049 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Orthopedics & sports injury | 025 | 4 of 768 | 7,533 (0.2%) | 0/37 | 1/110 | 3/374 | 0/247 |  |
| Heart / cardiology | 008 | 9 of 768 | 13,476 (0.4%) | 0/37 | 5/110 | 4/374 | 0/247 |  |
| Skin / dermatology | 011 | 35 of 768 | 17,398 (0.5%) | 0/37 | 0/110 | 16/374 | 19/247 |  |
| Allergy & immunology | 007 | 16 of 768 | 67,150 (1.9%) | 0/37 | 4/110 | 8/374 | 4/247 |  |
| Lung, breathing & sleep | 030 | 1 of 768 | 97 (0.0%) | 0/37 | 0/110 | 0/374 | 1/247 |  |
| Digestive / gastroenterology | 014 | 9 of 768 | 3,399 (0.1%) | 0/37 | 0/110 | 6/374 | 3/247 |  |
| Kidney / nephrology | 018 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Diabetes & hormones | 012 | 1 of 768 | 14,041 (0.4%) | 0/37 | 1/110 | 0/374 | 0/247 |  |
| Cancer care / oncology | 021 | 10 of 768 | 6,406 (0.2%) | 0/37 | 0/110 | 7/374 | 3/247 |  |
| Arthritis / rheumatology | 031 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Brain & nerves / neurology | 019 | 5 of 768 | 1,688 (0.0%) | 0/37 | 0/110 | 2/374 | 3/247 |  |
| Ear, nose & throat | 013 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Urology | 033 | 2 of 768 | 4,862 (0.1%) | 1/37 | 0/110 | 1/374 | 0/247 |  |
| Foot & ankle / podiatry | 028 | 8 of 768 | 5,545 (0.2%) | 0/37 | 0/110 | 6/374 | 2/247 |  |
| Plastic & reconstructive surgery | 027 | 5 of 768 | 9,275 (0.3%) | 0/37 | 5/110 | 0/374 | 0/247 |  |
| Speech & language therapy | F051 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Imaging & lab | F047 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| Nursing & assisted living | F046 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |
| General surgery | 015 | 3 of 768 | 5,419 (0.2%) | 0/37 | 2/110 | 1/374 | 0/247 |  |
| Infectious disease | 017 | 0 of 768 | 0 (0.0%) | 0/37 | 0/110 | 0/374 | 0/247 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 30760 rows (ZIP x specialty) stored in access_e2sfca for KY; market-score now uses drive-time access for these ZIPs.
