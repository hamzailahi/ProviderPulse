# E2SFCA access dry run: West Virginia

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,859; in West Virginia: 719
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,859 x 3,859 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 838,896; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.41 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.53), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 27; re-anchored: 26; still implausible (left out of the rank comparison, marked in the CSV): 3 (20003, 20016, 25047)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 15450 | no | 9.55 | 100% | 4.03 | 100% | yes (0.80) |
| 15466 | no | 10.02 | 100% | 3.64 | 100% | yes (0.82) |
| 17271 | no | 9.95 | 100% | 3.38 | 100% | yes (0.60) |
| 20003 | no | 14.54 | 100% | 16.14 | 100% | yes (2.60) |
| 20008 | no | 13.34 | 100% | 6.82 | 100% | yes (2.24) |
| 20010 | no | 19.84 | 100% | 4.18 | 100% | yes (2.86) |
| 20016 | no | 10.27 | 100% | 10.41 | 100% | yes (2.22) |
| 20059 | no | 24.71 | 100% | 7.49 | 100% | yes (2.91) |
| 20319 | no | 11.14 | 100% | 5.67 | 100% | yes (1.24) |
| 20373 | no | 10.87 | 100% | 4.15 | 100% | yes (1.64) |
| 20390 | no | 14.16 | 100% | 5.67 | 100% | yes (2.60) |
| 21113 | no | none | 0% | 3.75 | 100% | yes (1.48) |
| 24150 | no | 9.44 | 100% | 4.26 | 100% | yes (1.57) |
| 24823 | yes | 9.96 | 100% | 5.79 | 100% | yes (2.29) |
| 25047 | yes | 9.17 | 100% | 10.07 | 100% | no |
| 25057 | yes | 9.25 | 100% | 3.73 | 100% | yes (1.36) |
| 25114 | yes | 8.85 | 100% | 4.62 | 100% | yes (1.92) |
| 25148 | yes | 9.80 | 100% | 6.58 | 100% | yes (2.00) |
| 25152 | yes | 9.20 | 100% | 5.75 | 100% | yes (1.99) |
| 25183 | yes | 8.92 | 100% | 5.44 | 100% | yes (1.43) |
| 25628 | yes | 9.83 | 100% | 3.87 | 100% | yes (0.80) |
| 25646 | yes | 8.92 | 100% | 5.34 | 100% | yes (1.70) |
| 25864 | yes | 11.19 | 100% | 3.54 | 100% | yes (1.99) |
| 26261 | yes | 9.60 | 100% | 3.76 | 100% | yes (1.49) |
| 40997 | no | 10.77 | 100% | 4.81 | 100% | yes (1.70) |
| 41250 | no | 9.11 | 100% | 5.42 | 100% | yes (1.44) |
| 41554 | no | 8.99 | 100% | 4.87 | 100% | yes (1.89) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 103,265 | 4.78 | 0.45 | 441 of 718 | 26280 (-72), 24944 (-64), 25054 (-59) | 25108 (+100), 25107 (+98), 25009 (+97) |
| Pediatrics (children) | 30 | 24,731 | 1.13 | 0.53 | 300 of 718 | 26327 (-89), 26325 (-83), 26151 (-68) | 25025 (+100), 25015 (+99), 25062 (+83) |
| Women's health / OB-GYN | 60 | 11,226 | 0.55 | 0.62 | 231 of 718 | 25503 (-43), 25560 (-43), 25425 (-38) | 25201 (+66), 25411 (+66), 26259 (+65) |
| Mental health & counseling | 30 | 158,984 | 7.13 | 0.56 | 280 of 718 | 24957 (-61), 24938 (-52), 26757 (-48) | 25555 (+100), 25517 (+98), 25062 (+97) |
| Dental | 30 | 31,485 | 1.64 | 0.52 | 324 of 718 | 24870 (-85), 24836 (-72), 26260 (-66) | 25107 (+92), 25201 (+71), 25062 (+70) |
| Eye care | 30 | 13,633 | 0.65 | 0.60 | 326 of 718 | 26280 (-80), 26164 (-59), 26601 (-53) | 25107 (+100), 24916 (+99), 26270 (+99) |
| Chiropractic | 30 | 10,475 | 0.64 | 0.56 | 280 of 718 | 24945 (-82), 26372 (-67), 24938 (-65) | 25107 (+65), 26180 (+62), 25009 (+57) |
| Physical & occupational therapy | 30 | 60,995 | 2.73 | 0.56 | 335 of 718 | 26624 (-64), 26217 (-57), 24927 (-52) | 25009 (+92), 25044 (+87), 25062 (+85) |
| Orthopedics & sports injury | 60 | 9,669 | 0.42 | 0.67 | 309 of 718 | 24943 (-99), 25843 (-92), 24977 (-85) | 26259 (+100), 25969 (+88), 25062 (+86) |
| Heart / cardiology | 60 | 5,577 | 0.28 | 0.65 | 291 of 718 | 25061 (-89), 25560 (-89), 25320 (-87) | 24871 (+90), 24808 (+86), 25009 (+84) |
| Skin / dermatology | 60 | 1,927 | 0.10 | 0.71 | 217 of 718 | 26374 (-50), 26554 (-47), 25560 (-39) | 25009 (+88), 24808 (+87), 24871 (+85) |
| Allergy & immunology | 60 | 837 | 0.03 | 0.65 | 256 of 718 | 25320 (-100), 25312 (-91), 25560 (-82) | 25075 (+100), 24808 (+95), 24871 (+94) |
| Lung, breathing & sleep | 60 | 2,604 | 0.14 | 0.71 | 302 of 718 | 25560 (-70), 26544 (-63), 25213 (-60) | 25009 (+92), 25062 (+85), 25174 (+81) |
| Digestive / gastroenterology | 60 | 2,520 | 0.13 | 0.65 | 303 of 718 | 25560 (-75), 25061 (-68), 25917 (-68) | 25009 (+82), 25062 (+82), 25174 (+78) |
| Kidney / nephrology | 60 | 2,473 | 0.12 | 0.68 | 372 of 718 | 25183 (-62), 26587 (-58), 25843 (-56) | 25062 (+86), 25174 (+83), 25501 (+82) |
| Diabetes & hormones | 60 | 1,364 | 0.07 | 0.72 | 216 of 718 | 26544 (-94), 26560 (-87), 26554 (-85) | 25009 (+83), 26707 (+80), 25411 (+74) |
| Cancer care / oncology | 90 | 3,299 | 0.18 | 0.46 | 428 of 718 | 25560 (-62), 25109 (-59), 25503 (-58) | 25062 (+83), 26259 (+83), 25174 (+82) |
| Arthritis / rheumatology | 60 | 824 | 0.04 | 0.65 | 185 of 718 | 26554 (-75), 25560 (-68), 26559 (-60) | 25411 (+80), 25107 (+76), 25009 (+72) |
| Brain & nerves / neurology | 60 | 3,968 | 0.24 | 0.65 | 203 of 718 | 26554 (-74), 26544 (-66), 25560 (-63) | 25107 (+77), 25201 (+64), 26347 (+61) |
| Ear, nose & throat | 60 | 1,496 | 0.08 | 0.70 | 301 of 718 | 24943 (-100), 25843 (-92), 24977 (-88) | 24808 (+89), 24871 (+87), 25062 (+86) |
| Urology | 60 | 1,680 | 0.08 | 0.63 | 358 of 718 | 24938 (-86), 25560 (-85), 25320 (-84) | 25043 (+100), 26412 (+93), 25019 (+83) |
| Foot & ankle / podiatry | 60 | 3,846 | 0.16 | 0.69 | 315 of 718 | 25843 (-63), 25825 (-55), 25832 (-46) | 25062 (+84), 25174 (+77), 24871 (+71) |
| Pain management | 60 | 1,672 | 0.09 | 0.63 | 268 of 718 | 24910 (-100), 24943 (-100), 24974 (-100) | 25009 (+88), 25062 (+83), 25174 (+79) |
| Plastic & reconstructive surgery | 90 | 1,243 | 0.07 | 0.46 | 398 of 718 | 25061 (-82), 25083 (-80), 25067 (-79) | 24729 (+78), 26036 (+77), 25062 (+74) |
| Speech & language therapy | 30 | 18,008 | 0.87 | 0.59 | 388 of 718 | 24944 (-78), 26151 (-54), 25112 (-53) | 25015 (+100), 25025 (+100), 25062 (+100) |
| Nutrition & dietitian | 30 | 6,379 | 0.32 | 0.69 | 225 of 718 | 26823 (-88), 26801 (-87), 26808 (-82) | 25025 (+100), 25570 (+100), 25555 (+90) |
| Acupuncture, massage & naturopathy | 30 | 6,566 | 0.50 | 0.60 | 263 of 718 | 26851 (-77), 24811 (-65), 25130 (-49) | 25062 (+100), 25174 (+100), 24916 (+99) |
| Urgent care & emergency | 30 | 10,137 | 0.50 | 0.54 | 364 of 718 | 26416 (-54), 26155 (-46), 26757 (-45) | 24816 (+100), 24828 (+100), 24830 (+100) |
| Imaging & lab | 60 | 9,888 | 0.55 | 0.64 | 307 of 718 | 25843 (-79), 25560 (-69), 25213 (-66) | 25009 (+83), 25062 (+75), 26036 (+75) |
| Pharmacy | 30 | 36,496 | 1.68 | 0.43 | 488 of 718 | 26280 (-85), 26711 (-61), 26801 (-61) | 25008 (+100), 25009 (+100), 25019 (+100) |
| Home health & in-home care | 30 | 109,064 | 1.49 | 0.15 | 21 of 718 | 26823 (-53), 24848 (-25), 24815 (-18) | 24984 (+100), 25966 (+100), 26209 (+100) |
| Nursing & assisted living | 60 | 9,670 | 0.37 | 0.51 | 400 of 718 | 26205 (-100), 26662 (-99), 24943 (-83) | 26714 (+88), 24966 (+82), 25043 (+76) |
| Medical equipment & supplies | 60 | 6,763 | 0.34 | 0.66 | 318 of 718 | 25825 (-65), 25843 (-64), 25862 (-64) | 25062 (+83), 25174 (+79), 25121 (+75) |
| Hearing & audiology | 60 | 4,141 | 0.20 | 0.69 | 360 of 718 | 25843 (-77), 26884 (-73), 26587 (-72) | 26259 (+100), 26412 (+93), 25043 (+92) |
| Behavior therapy (ABA) | 30 | 43,349 | 2.58 | 0.67 | 53 of 718 | 26292 (-54), 26260 (-48), 26101 (-47) | 26886 (+80), 26263 (+76), 25570 (+61) |
| Care coordination & community health | 30 | 65,348 | 1.55 | 0.42 | 349 of 718 | 24984 (-71), 24944 (-56), 25434 (-56) | 24991 (+100), 25025 (+100), 25966 (+100) |
| General surgery | 60 | 7,831 | 0.39 | 0.60 | 294 of 718 | 25083 (-90), 25917 (-90), 25061 (-89) | 25009 (+77), 25062 (+77), 26036 (+73) |
| Infectious disease | 90 | 1,099 | 0.06 | 0.48 | 312 of 718 | 25560 (-78), 25213 (-74), 25526 (-73) | 25009 (+65), 25565 (+61), 25570 (+61) |
| Genetics & genetic counseling | 90 | 653 | 0.03 | 0.37 | 155 of 718 | 26062 (-57), 26037 (-48), 26060 (-47) | 25671 (+91), 26148 (+88), 26161 (+87) |
| Hospice & palliative care | 60 | 1,344 | 0.09 | 0.71 | 242 of 718 | 26731 (-100), 26845 (-84), 26884 (-66) | 24986 (+83), 26444 (+76), 26320 (+66) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 25301 | Primary care / family doctor | 11.456 | 22.527 | 0 | 0 |
| 25301 | Mental health & counseling | 11.817 | 20.667 | 17 | 0 |
| 25301 | Heart / cardiology | 1.042 | 0.774 | 0 | 0 |
| 25301 | Cancer care / oncology | 0.394 | 0.263 | 0 | 26 |
| 25301 | Urgent care & emergency | 1.479 | 2.934 | 0 | 0 |
| 26505 | Primary care / family doctor | 12.723 | 16.525 | 0 | 0 |
| 26505 | Mental health & counseling | 9.936 | 12.005 | 30 | 16 |
| 26505 | Heart / cardiology | 0.963 | 0.598 | 0 | 0 |
| 26505 | Cancer care / oncology | 0.578 | 0.195 | 0 | 45 |
| 26505 | Urgent care & emergency | 2.005 | 2.519 | 0 | 0 |
| 25701 | Primary care / family doctor | 10.182 | 15.072 | 0 | 0 |
| 25701 | Mental health & counseling | 13.191 | 16.840 | 7 | 0 |
| 25701 | Heart / cardiology | 0.458 | 0.448 | 19 | 20 |
| 25701 | Cancer care / oncology | 0.302 | 0.218 | 15 | 39 |
| 25701 | Urgent care & emergency | 0.739 | 1.269 | 26 | 0 |
| 26003 | Primary care / family doctor | 7.216 | 9.497 | 24 | 1 |
| 26003 | Mental health & counseling | 5.666 | 7.767 | 60 | 46 |
| 26003 | Heart / cardiology | 0.349 | 0.286 | 38 | 49 |
| 26003 | Cancer care / oncology | 0.213 | 0.083 | 40 | 77 |
| 26003 | Urgent care & emergency | 1.504 | 2.003 | 0 | 0 |
| 24701 | Primary care / family doctor | 6.836 | 4.748 | 28 | 50 |
| 24701 | Mental health & counseling | 8.326 | 4.809 | 42 | 66 |
| 24701 | Heart / cardiology | 0.175 | 0.209 | 69 | 63 |
| 24701 | Cancer care / oncology | 0.205 | 0.089 | 43 | 75 |
| 24701 | Urgent care & emergency | 0.847 | 0.938 | 15 | 6 |
| 25401 | Primary care / family doctor | 3.732 | 6.171 | 61 | 35 |
| 25401 | Mental health & counseling | 6.762 | 9.723 | 53 | 32 |
| 25401 | Heart / cardiology | 0.109 | 0.325 | 81 | 42 |
| 25401 | Cancer care / oncology | 0.129 | 0.121 | 64 | 66 |
| 25401 | Urgent care & emergency | 0.406 | 0.702 | 59 | 29 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 28720 rows (ZIP x specialty) stored in access_e2sfca for WV; market-score now uses drive-time access for these ZIPs.
