# E2SFCA access dry run: Tennessee

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,256; in Tennessee: 621
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,256 x 2,256 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 384,436.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.72 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.80), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 4; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (62919)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 24726 | no | 8.03 | 100% | 3.36 | 100% | yes (1.57) |
| 25928 | no | 7.34 | 100% | 4.03 | 100% | yes (1.05) |
| 40808 | no | 7.11 | 100% | 5.53 | 100% | yes (1.28) |
| 41317 | no | 7.66 | 100% | 3.46 | 100% | yes (1.29) |
| 62919 | no | 6.81 | 100% | 6.81 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 61,686.2 | 4.30 | 0.59 | 287 of 621 | 37756 (-38), 37916 (-30), 37912 (-29) | 37658 (+70), 38392 (+69), 38313 (+68) |
| Pediatrics (children) | 30 | 10,605 | 1.11 | 0.75 | 110 of 621 | 38119 (-35), 38476 (-29), 37220 (-27) | 37015 (+71), 37143 (+70), 37082 (+63) |
| Women's health / OB-GYN | 60 | 5,719.2 | 0.53 | 0.73 | 162 of 621 | 37806 (-39), 37080 (-36), 38481 (-36) | 38562 (+61), 38568 (+54), 37886 (+50) |
| Mental health & counseling | 30 | 71,265.4 | 7.20 | 0.73 | 102 of 621 | 37178 (-32), 37220 (-21), 37213 (-20) | 37171 (+52), 37052 (+44), 37849 (+43) |
| Dental | 30 | 18,161 | 1.65 | 0.69 | 189 of 621 | 37756 (-54), 37213 (-33), 37201 (-32) | 37191 (+53), 37052 (+52), 37710 (+50) |
| Eye care | 30 | 7,375.6 | 0.62 | 0.63 | 262 of 621 | 37033 (-31), 37757 (-31), 37921 (-30) | 37715 (+77), 38562 (+74), 38313 (+65) |
| Chiropractic | 30 | 7,768 | 0.63 | 0.69 | 193 of 621 | 37213 (-44), 37201 (-43), 37219 (-40) | 37046 (+56), 37052 (+53), 38562 (+53) |
| Physical & occupational therapy | 30 | 34,945.8 | 2.70 | 0.62 | 258 of 621 | 38485 (-47), 37201 (-32), 37204 (-32) | 37171 (+65), 38313 (+60), 37052 (+59) |
| Orthopedics & sports injury | 60 | 5,081.4 | 0.39 | 0.71 | 238 of 621 | 37076 (-45), 37806 (-44), 37013 (-41) | 38562 (+59), 37376 (+58), 37377 (+56) |
| Heart / cardiology | 60 | 2,622.8 | 0.24 | 0.70 | 236 of 621 | 38340 (-56), 38315 (-54), 37806 (-52) | 37886 (+73), 37377 (+63), 37658 (+59) |
| Skin / dermatology | 60 | 844 | 0.09 | 0.78 | 188 of 621 | 37076 (-44), 37086 (-38), 37080 (-34) | 37753 (+54), 37801 (+49), 37046 (+48) |
| Allergy & immunology | 60 | 323.6 | 0.03 | 0.79 | 221 of 621 | 37871 (-56), 37806 (-51), 37807 (-45) | 38568 (+68), 38562 (+66), 37878 (+65) |
| Lung, breathing & sleep | 60 | 1,512.4 | 0.13 | 0.70 | 264 of 621 | 38575 (-100), 38582 (-100), 38574 (-92) | 37886 (+70), 37715 (+68), 37377 (+61) |
| Digestive / gastroenterology | 60 | 1,041.2 | 0.11 | 0.72 | 221 of 621 | 37806 (-57), 37764 (-51), 37721 (-45) | 37377 (+67), 37886 (+65), 37650 (+59) |
| Kidney / nephrology | 60 | 1,273.6 | 0.11 | 0.67 | 266 of 621 | 38330 (-71), 38259 (-62), 38574 (-57) | 38568 (+68), 37377 (+66), 38562 (+65) |
| Diabetes & hormones | 60 | 488 | 0.06 | 0.74 | 182 of 621 | 37771 (-34), 38066 (-32), 37772 (-31) | 38552 (+80), 38560 (+74), 38567 (+72) |
| Cancer care / oncology | 90 | 1,746.2 | 0.15 | 0.63 | 332 of 621 | 37806 (-71), 38054 (-69), 38053 (-68) | 37326 (+85), 37317 (+75), 37410 (+62) |
| Arthritis / rheumatology | 60 | 343.2 | 0.04 | 0.77 | 181 of 621 | 37806 (-57), 37840 (-49), 37716 (-47) | 37338 (+78), 37886 (+69), 37377 (+68) |
| Brain & nerves / neurology | 60 | 2,480.2 | 0.22 | 0.78 | 192 of 621 | 37060 (-97), 37062 (-87), 37076 (-87) | 37377 (+69), 37777 (+50), 37415 (+49) |
| Ear, nose & throat | 60 | 671.6 | 0.07 | 0.72 | 200 of 621 | 37328 (-41), 37806 (-35), 37620 (-34) | 37376 (+72), 37688 (+71), 37352 (+67) |
| Urology | 60 | 913.2 | 0.07 | 0.66 | 305 of 621 | 38574 (-56), 38481 (-52), 38340 (-47) | 37376 (+94), 37374 (+79), 37143 (+74) |
| Foot & ankle / podiatry | 60 | 1,322.2 | 0.15 | 0.65 | 173 of 621 | 38259 (-41), 38574 (-35), 38233 (-34) | 38562 (+57), 38370 (+55), 37181 (+44) |
| Pain management | 60 | 916.6 | 0.09 | 0.68 | 251 of 621 | 38344 (-50), 38574 (-49), 38382 (-42) | 37886 (+67), 38562 (+66), 37394 (+61) |
| Plastic & reconstructive surgery | 90 | 603.2 | 0.07 | 0.62 | 337 of 621 | 37073 (-52), 37072 (-51), 37188 (-50) | 37410 (+67), 37352 (+64), 37330 (+57) |
| Speech & language therapy | 30 | 11,530 | 0.90 | 0.69 | 211 of 621 | 37763 (-45), 37917 (-44), 37918 (-43) | 37171 (+90), 37849 (+70), 37772 (+68) |
| Nutrition & dietitian | 30 | 3,655.8 | 0.33 | 0.74 | 173 of 621 | 37756 (-85), 38241 (-83), 37033 (-61) | 37143 (+64), 37650 (+58), 38568 (+58) |
| Acupuncture, massage & naturopathy | 30 | 2,507.6 | 0.52 | 0.67 | 36 of 621 | 37097 (-80), 38477 (-32), 37144 (-28) | 37391 (+37), 38380 (+33), 37078 (+32) |
| Urgent care & emergency | 30 | 5,577 | 0.47 | 0.55 | 273 of 621 | 37869 (-70), 37061 (-59), 37050 (-58) | 37715 (+99), 38392 (+92), 37377 (+87) |
| Imaging & lab | 60 | 5,103.2 | 0.49 | 0.74 | 190 of 621 | 37806 (-45), 38053 (-43), 37764 (-42) | 37886 (+53), 37915 (+52), 37377 (+51) |
| Pharmacy | 30 | 26,454 | 1.72 | 0.58 | 313 of 621 | 38485 (-49), 37033 (-40), 37756 (-34) | 38392 (+70), 37732 (+69), 37715 (+66) |
| Home health & in-home care | 30 | 11,829 | 1.61 | 0.68 | 66 of 621 | 37178 (-56), 37848 (-41), 37869 (-31) | 38079 (+60), 37710 (+34), 38080 (+32) |
| Nursing & assisted living | 60 | 5,292.8 | 0.39 | 0.50 | 255 of 621 | 37806 (-76), 37711 (-53), 37764 (-51) | 38486 (+70), 37144 (+69), 37882 (+67) |
| Medical equipment & supplies | 60 | 5,541.6 | 0.36 | 0.69 | 244 of 621 | 38481 (-56), 38570 (-46), 38574 (-46) | 38562 (+69), 37376 (+65), 38486 (+63) |
| Hearing & audiology | 60 | 2,288.4 | 0.19 | 0.75 | 223 of 621 | 37806 (-47), 38481 (-43), 38582 (-43) | 38562 (+63), 37052 (+60), 37143 (+52) |
| Behavior therapy (ABA) | 30 | 19,228.8 | 2.88 | 0.75 | 74 of 621 | 37213 (-30), 38589 (-30), 37201 (-24) | 37171 (+100), 38333 (+99), 37134 (+98) |
| Care coordination & community health | 30 | 16,519 | 1.63 | 0.71 | 157 of 621 | 37806 (-88), 37764 (-41), 38104 (-38) | 38392 (+80), 37810 (+75), 38041 (+75) |
| General surgery | 60 | 4,200.4 | 0.35 | 0.65 | 249 of 621 | 37076 (-68), 37167 (-53), 37062 (-52) | 37886 (+75), 37377 (+70), 37658 (+61) |
| Infectious disease | 90 | 326.4 | 0.05 | 0.63 | 302 of 621 | 38002 (-58), 38049 (-57), 38054 (-55) | 37377 (+78), 37853 (+70), 37658 (+64) |
| Genetics & genetic counseling | 90 | 259.2 | 0.03 | 0.57 | 263 of 621 | 38002 (-54), 37922 (-53), 37934 (-52) | 37228 (+66), 37206 (+65), 37207 (+65) |
| Hospice & palliative care | 60 | 839.8 | 0.09 | 0.68 | 131 of 621 | 38481 (-45), 38463 (-41), 38103 (-31) | 37359 (+50), 38485 (+49), 38380 (+47) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Tennessee in households with no vehicle: about 275,643 of 5,379,387 (5.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 12
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 6 of 621 | 37915 (+30), 37402 (+24), 37410 (+22) | 1.00 |
| Pediatrics (children) | 1.00 | 4 of 621 | 37915 (+24), 38126 (+18), 37402 (+17) | 1.00 |
| Women's health / OB-GYN | 1.00 | 3 of 621 | 37915 (+21), 37402 (+17), 37410 (+17) | 1.00 |
| Mental health & counseling | 1.00 | 3 of 621 | 37915 (+26), 37402 (+17), 37902 (+17) | 1.00 |
| Dental | 1.00 | 3 of 621 | 37915 (+20), 37402 (+17), 37210 (+15) | 1.00 |
| Eye care | 1.00 | 4 of 621 | 37915 (+24), 37402 (+18), 37902 (+16) | 1.00 |
| Chiropractic | 1.00 | 3 of 621 | 37402 (+21), 37915 (+16), 37410 (+15) | 1.00 |
| Physical & occupational therapy | 1.00 | 4 of 621 | 37915 (+24), 37402 (+23), 37410 (+20) | 1.00 |
| Orthopedics & sports injury | 1.00 | 4 of 621 | 37410 (+22), 37915 (+20), 37402 (+18) | 1.00 |
| Heart / cardiology | 1.00 | 3 of 621 | 37915 (+24), 37410 (+18), 37402 (+17) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 621 | 37915 (+15), 37210 (+14), 37410 (+13) | 1.00 |
| Allergy & immunology | 1.00 | 3 of 621 | 37915 (+28), 37402 (+16), 37902 (+16) | 1.00 |
| Lung, breathing & sleep | 1.00 | 3 of 621 | 37915 (+26), 37410 (+15), 37902 (+15) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 621 | 37915 (+26), 37410 (+16), 37719 (+15) | 1.00 |
| Kidney / nephrology | 1.00 | 4 of 621 | 37402 (+20), 37915 (+18), 38126 (+18) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 621 | 37915 (+13), 38126 (+11), 37210 (+8) | 1.00 |
| Cancer care / oncology | 1.00 | 2 of 621 | 37915 (+23), 37719 (+22), 37902 (+13) | 1.00 |
| Arthritis / rheumatology | 1.00 | 2 of 621 | 37915 (+26), 37902 (+15), 37402 (+13) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 621 | 37915 (+21), 37410 (+12), 37902 (+11) | 1.00 |
| Ear, nose & throat | 1.00 | 2 of 621 | 37915 (+16), 37326 (+15), 37402 (+12) | 1.00 |
| Urology | 1.00 | 4 of 621 | 37915 (+25), 37326 (+19), 37402 (+17) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 2 of 621 | 37402 (+20), 37410 (+17), 37915 (+14) | 1.00 |
| Pain management | 1.00 | 4 of 621 | 37915 (+24), 37402 (+17), 37719 (+16) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 0 of 621 | 37719 (+14), 37915 (+14), 37326 (+13) | 1.00 |
| Speech & language therapy | 1.00 | 3 of 621 | 37915 (+33), 37402 (+18), 37410 (+15) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 621 | 37915 (+28), 37402 (+18), 37902 (+18) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 621 | 37326 (+9), 37402 (+7), 37410 (+6) | 1.00 |
| Urgent care & emergency | 1.00 | 5 of 621 | 37326 (+32), 37915 (+27), 37402 (+24) | 1.00 |
| Imaging & lab | 1.00 | 1 of 621 | 37915 (+24), 38126 (+13), 37210 (+12) | 1.00 |
| Pharmacy | 1.00 | 7 of 621 | 37915 (+30), 37402 (+25), 37719 (+21) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 621 | 37915 (+13), 38126 (+13), 37719 (+11) | 1.00 |
| Nursing & assisted living | 0.99 | 3 of 621 | 37915 (+25), 37719 (+20), 37402 (+17) | 1.00 |
| Medical equipment & supplies | 0.99 | 6 of 621 | 37402 (+26), 37410 (+22), 37915 (+22) | 1.00 |
| Hearing & audiology | 1.00 | 4 of 621 | 37915 (+26), 37402 (+19), 37902 (+16) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 621 | 37210 (+13), 37915 (+13), 37326 (+11) | 1.00 |
| Care coordination & community health | 1.00 | 3 of 621 | 38126 (+18), 37402 (+15), 38105 (+15) | 1.00 |
| General surgery | 1.00 | 3 of 621 | 37915 (+21), 37210 (+15), 37410 (+15) | 1.00 |
| Infectious disease | 1.00 | 0 of 621 | 37719 (+8), 38108 (+8), 38126 (+8) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 621 | 37719 (+15), 37915 (+11), 38108 (+7) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 621 | 37326 (+18), 37402 (+11), 37410 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 38017 | Primary care / family doctor | 4.640 | 2.792 | 46 | 68 |
| 38017 | Mental health & counseling | 4.144 | 2.258 | 71 | 84 |
| 38017 | Heart / cardiology | 0.329 | 0.236 | 31 | 50 |
| 38017 | Cancer care / oncology | 0.217 | 0.248 | 29 | 19 |
| 38017 | Urgent care & emergency | 0.273 | 0.174 | 71 | 81 |
| 38018 | Primary care / family doctor | 4.110 | 4.886 | 52 | 43 |
| 38018 | Mental health & counseling | 4.042 | 4.974 | 72 | 65 |
| 38018 | Heart / cardiology | 0.296 | 0.277 | 38 | 42 |
| 38018 | Cancer care / oncology | 0.176 | 0.265 | 43 | 14 |
| 38018 | Urgent care & emergency | 0.293 | 0.359 | 69 | 62 |
| 38103 | Primary care / family doctor | 4.479 | 5.086 | 48 | 41 |
| 38103 | Mental health & counseling | 5.006 | 5.833 | 65 | 60 |
| 38103 | Heart / cardiology | 0.269 | 0.262 | 43 | 45 |
| 38103 | Cancer care / oncology | 0.487 | 0.289 | 0 | 6 |
| 38103 | Urgent care & emergency | 0.459 | 0.549 | 51 | 41 |
| 37203 | Primary care / family doctor | 6.644 | 8.493 | 23 | 1 |
| 37203 | Mental health & counseling | 10.391 | 11.375 | 28 | 21 |
| 37203 | Heart / cardiology | 0.347 | 0.254 | 27 | 46 |
| 37203 | Cancer care / oncology | 0.293 | 0.149 | 4 | 52 |
| 37203 | Urgent care & emergency | 0.441 | 0.571 | 53 | 39 |
| 37902 | Primary care / family doctor | 6.561 | 7.416 | 24 | 14 |
| 37902 | Mental health & counseling | 10.508 | 9.947 | 27 | 31 |
| 37902 | Heart / cardiology | 0.423 | 0.282 | 11 | 41 |
| 37902 | Cancer care / oncology | 0.422 | 0.204 | 0 | 34 |
| 37902 | Urgent care & emergency | 0.621 | 0.692 | 34 | 26 |
| 37402 | Primary care / family doctor | 6.267 | 5.001 | 27 | 42 |
| 37402 | Mental health & counseling | 6.765 | 5.186 | 53 | 64 |
| 37402 | Heart / cardiology | 0.405 | 0.217 | 15 | 54 |
| 37402 | Cancer care / oncology | 0.252 | 0.124 | 18 | 59 |
| 37402 | Urgent care & emergency | 0.652 | 0.561 | 30 | 40 |
| 37683 | Primary care / family doctor | 2.288 | 4.142 | 73 | 52 |
| 37683 | Mental health & counseling | 1.682 | 2.204 | 88 | 85 |
| 37683 | Heart / cardiology | 0.038 | 0.106 | 92 | 78 |
| 37683 | Cancer care / oncology | 0.023 | 0.089 | 93 | 71 |
| 37683 | Urgent care & emergency | 0.152 | 0.323 | 84 | 65 |
| 38551 | Primary care / family doctor | 3.333 | 3.271 | 61 | 62 |
| 38551 | Mental health & counseling | 0.920 | 0.755 | 94 | 95 |
| 38551 | Heart / cardiology | 0.000 | 0.034 | 100 | 93 |
| 38551 | Cancer care / oncology | 0.000 | 0.034 | 100 | 89 |
| 38551 | Urgent care & emergency | 0.470 | 0.723 | 50 | 23 |
| 37336 | Primary care / family doctor | 3.126 | 0.866 | 64 | 90 |
| 37336 | Mental health & counseling | 2.539 | 0.866 | 82 | 94 |
| 37336 | Heart / cardiology | 0.094 | 0.053 | 80 | 89 |
| 37336 | Cancer care / oncology | 0.099 | 0.096 | 68 | 69 |
| 37336 | Urgent care & emergency | 0.193 | 0.039 | 79 | 96 |
| 38464 | Primary care / family doctor | 3.872 | 5.621 | 55 | 35 |
| 38464 | Mental health & counseling | 1.901 | 2.830 | 87 | 80 |
| 38464 | Heart / cardiology | 0.051 | 0.050 | 89 | 90 |
| 38464 | Cancer care / oncology | 0.020 | 0.047 | 94 | 85 |
| 38464 | Urgent care & emergency | 0.301 | 0.355 | 68 | 62 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 29 of 620 | 96,281 (1.8%) |  | 25/292 | 4/202 | 0/126 |  |
| Women's health / OB-GYN | 016 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Mental health & counseling: Psychiatry | 029 | 2 of 620 | 1,634 (0.0%) |  | 1/292 | 1/202 | 0/126 |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 620 | 6,383 (0.1%) |  | 6/292 | 0/202 | 0/126 |  |
| Eye care | 023 | 9 of 620 | 8,699 (0.2%) |  | 9/292 | 0/202 | 0/126 |  |
| Chiropractic | 010 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Physical & occupational therapy | F049 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Orthopedics & sports injury | 025 | 12 of 620 | 19,570 (0.4%) |  | 11/292 | 1/202 | 0/126 |  |
| Heart / cardiology | 008 | 21 of 620 | 38,545 (0.7%) |  | 14/292 | 7/202 | 0/126 |  |
| Skin / dermatology | 011 | 16 of 620 | 41,084 (0.8%) |  | 5/292 | 10/202 | 1/126 |  |
| Allergy & immunology | 007 | 28 of 620 | 134,737 (2.5%) |  | 15/292 | 7/202 | 6/126 |  |
| Lung, breathing & sleep | 030 | 1 of 620 | 2,002 (0.0%) |  | 0/292 | 1/202 | 0/126 |  |
| Digestive / gastroenterology | 014 | 15 of 620 | 38,309 (0.7%) |  | 4/292 | 8/202 | 3/126 |  |
| Kidney / nephrology | 018 | 2 of 620 | 17,360 (0.3%) |  | 2/292 | 0/202 | 0/126 |  |
| Diabetes & hormones | 012 | 10 of 620 | 80,264 (1.5%) |  | 10/292 | 0/202 | 0/126 |  |
| Cancer care / oncology | 021 | 7 of 620 | 11,764 (0.2%) |  | 1/292 | 6/202 | 0/126 |  |
| Arthritis / rheumatology | 031 | 20 of 620 | 102,867 (1.9%) |  | 12/292 | 7/202 | 1/126 |  |
| Brain & nerves / neurology | 019 | 21 of 620 | 37,632 (0.7%) |  | 2/292 | 15/202 | 4/126 |  |
| Ear, nose & throat | 013 | 7 of 620 | 31,649 (0.6%) |  | 6/292 | 1/202 | 0/126 |  |
| Urology | 033 | 15 of 620 | 30,763 (0.6%) |  | 3/292 | 12/202 | 0/126 |  |
| Foot & ankle / podiatry | 028 | 3 of 620 | 7,421 (0.1%) |  | 1/292 | 2/202 | 0/126 |  |
| Plastic & reconstructive surgery | 027 | 1 of 620 | 4,169 (0.1%) |  | 1/292 | 0/202 | 0/126 |  |
| Speech & language therapy | F051 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Imaging & lab | F047 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| Nursing & assisted living | F046 | 0 of 620 | 0 (0.0%) |  | 0/292 | 0/202 | 0/126 |  |
| General surgery | 015 | 11 of 620 | 23,749 (0.4%) |  | 11/292 | 0/202 | 0/126 |  |
| Infectious disease | 017 | 3 of 620 | 10,372 (0.2%) |  | 3/292 | 0/202 | 0/126 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
