# E2SFCA access dry run: Maine

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 937; in Maine: 408
- Drive times: OSRM on OpenStreetMap roads (car profile), 937 x 937 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 268,292; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.34 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.35), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 6; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (04017, 04019, 04848, 04853, 04863)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 04017 | yes | 19.44 | 100% | 9.82 | 100% | yes (2.36) |
| 04019 | yes | 15.96 | 100% | 13.49 | 100% | yes (1.64) |
| 04050 | yes | 10.89 | 100% | 5.94 | 100% | yes (2.04) |
| 04568 | yes | 10.76 | 100% | 3.93 | 100% | yes (1.87) |
| 04642 | yes | 8.48 | 100% | 6.73 | 100% | yes (1.87) |
| 04848 | yes | 11.43 | 100% | 11.43 | 100% | no |
| 04853 | yes | 15.23 | 100% | 14.94 | 100% | no |
| 04863 | yes | 8.48 | 100% | 8.48 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 35,128 | 4.78 | 0.41 | 252 of 403 | 04442 (-72), 04643 (-61), 04614 (-59) | 04411 (+100), 04449 (+95), 04050 (+94) |
| Pediatrics (children) | 30 | 14,727 | 1.13 | 0.63 | 169 of 403 | 04626 (-82), 04619 (-56), 04938 (-49) | 04050 (+98), 04108 (+96), 04411 (+83) |
| Women's health / OB-GYN | 60 | 4,433 | 0.55 | 0.58 | 213 of 403 | 04472 (-96), 04574 (-67), 04743 (-57) | 04411 (+79), 04558 (+75), 03905 (+74) |
| Mental health & counseling | 30 | 73,188 | 7.13 | 0.49 | 239 of 403 | 04426 (-59), 04009 (-55), 04442 (-54) | 04411 (+100), 04766 (+100), 04786 (+99) |
| Dental | 30 | 14,852 | 1.64 | 0.39 | 270 of 403 | 04983 (-78), 04068 (-71), 04654 (-56) | 04449 (+100), 04050 (+99), 04108 (+97) |
| Eye care | 30 | 4,500 | 0.65 | 0.50 | 240 of 403 | 04658 (-65), 04276 (-62), 04426 (-54) | 04774 (+100), 04427 (+96), 03905 (+91) |
| Chiropractic | 30 | 3,111 | 0.64 | 0.55 | 237 of 403 | 04658 (-76), 04681 (-65), 04645 (-64) | 04050 (+98), 04108 (+96), 04616 (+96) |
| Physical & occupational therapy | 30 | 26,445 | 2.73 | 0.48 | 254 of 403 | 04619 (-69), 04970 (-61), 04009 (-59) | 04411 (+100), 04050 (+96), 04766 (+96) |
| Orthopedics & sports injury | 60 | 3,146 | 0.42 | 0.70 | 181 of 403 | 04496 (-76), 04434 (-74), 04932 (-73) | 04408 (+100), 04418 (+100), 04294 (+80) |
| Heart / cardiology | 60 | 2,105 | 0.28 | 0.67 | 115 of 403 | 04429 (-89), 04468 (-85), 04090 (-78) | 04411 (+99), 03905 (+81), 04287 (+55) |
| Skin / dermatology | 60 | 976 | 0.10 | 0.76 | 127 of 403 | 04574 (-56), 04043 (-52), 04090 (-51) | 03905 (+77), 04411 (+71), 03911 (+62) |
| Allergy & immunology | 60 | 278 | 0.03 | 0.66 | 94 of 403 | 04062 (-50), 04039 (-43), 03910 (-42) | 03905 (+73), 04050 (+67), 04003 (+65) |
| Lung, breathing & sleep | 60 | 919 | 0.14 | 0.75 | 149 of 403 | 04475 (-75), 04493 (-73), 04345 (-66) | 04066 (+73), 04411 (+67), 04050 (+61) |
| Digestive / gastroenterology | 60 | 1,017 | 0.13 | 0.67 | 167 of 403 | 04096 (-76), 04062 (-71), 04097 (-69) | 04411 (+96), 04849 (+76), 04938 (+63) |
| Kidney / nephrology | 60 | 618 | 0.12 | 0.62 | 150 of 403 | 04496 (-73), 04932 (-70), 04457 (-53) | 04411 (+88), 03905 (+79), 04050 (+68) |
| Diabetes & hormones | 60 | 693 | 0.07 | 0.63 | 153 of 403 | 04090 (-72), 04062 (-68), 04043 (-65) | 04765 (+100), 04411 (+99), 04626 (+75) |
| Cancer care / oncology | 90 | 1,692 | 0.18 | 0.57 | 220 of 403 | 04932 (-69), 04434 (-68), 04468 (-67) | 04917 (+71), 04989 (+66), 04358 (+65) |
| Arthritis / rheumatology | 60 | 379 | 0.04 | 0.68 | 134 of 403 | 04496 (-100), 04932 (-100), 04949 (-100) | 04411 (+98), 04576 (+98), 04571 (+94) |
| Brain & nerves / neurology | 60 | 2,090 | 0.24 | 0.73 | 138 of 403 | 04468 (-65), 04429 (-64), 04496 (-61) | 04411 (+99), 04066 (+87), 03905 (+81) |
| Ear, nose & throat | 60 | 573 | 0.08 | 0.71 | 177 of 403 | 04097 (-84), 04039 (-79), 04090 (-72) | 04785 (+85), 03905 (+79), 04040 (+72) |
| Urology | 60 | 608 | 0.08 | 0.70 | 181 of 403 | 04574 (-95), 04572 (-83), 04097 (-75) | 04735 (+100), 04785 (+85), 04294 (+81) |
| Foot & ankle / podiatry | 60 | 831 | 0.16 | 0.61 | 165 of 403 | 04938 (-49), 04342 (-46), 04429 (-44) | 04459 (+100), 04487 (+100), 04455 (+90) |
| Pain management | 60 | 458 | 0.09 | 0.79 | 151 of 403 | 04429 (-65), 04071 (-64), 04428 (-62) | 04411 (+99), 04294 (+74), 03905 (+68) |
| Plastic & reconstructive surgery | 90 | 447 | 0.07 | 0.60 | 184 of 403 | 04932 (-60), 04496 (-54), 04987 (-54) | 03905 (+74), 04411 (+71), 04642 (+66) |
| Speech & language therapy | 30 | 6,003 | 0.87 | 0.52 | 268 of 403 | 04628 (-70), 04479 (-67), 04414 (-65) | 04757 (+100), 04411 (+97), 04951 (+96) |
| Nutrition & dietitian | 30 | 3,096 | 0.32 | 0.51 | 248 of 403 | 04472 (-73), 04426 (-71), 04746 (-65) | 04003 (+100), 04547 (+100), 04936 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,635 | 0.50 | 0.65 | 245 of 403 | 04448 (-87), 04650 (-85), 04747 (-73) | 04535 (+100), 04547 (+100), 04558 (+100) |
| Urgent care & emergency | 30 | 3,256 | 0.50 | 0.50 | 199 of 403 | 04747 (-73), 04643 (-70), 04442 (-61) | 04037 (+100), 04294 (+100), 04360 (+100) |
| Imaging & lab | 60 | 4,074 | 0.55 | 0.58 | 159 of 403 | 04468 (-53), 04496 (-51), 04932 (-51) | 04411 (+90), 03905 (+73), 04050 (+69) |
| Pharmacy | 30 | 9,573 | 1.68 | 0.33 | 264 of 403 | 04654 (-57), 04364 (-55), 04457 (-52) | 04411 (+100), 04449 (+91), 04774 (+90) |
| Home health & in-home care | 30 | 4,795 | 1.49 | 0.43 | 163 of 403 | 04956 (-82), 04443 (-74), 04487 (-72) | 04108 (+86), 04050 (+83), 04624 (+77) |
| Nursing & assisted living | 60 | 1,967 | 0.37 | 0.53 | 205 of 403 | 04953 (-63), 04607 (-61), 04740 (-61) | 04459 (+100), 04668 (+100), 04735 (+100) |
| Medical equipment & supplies | 60 | 1,305 | 0.34 | 0.61 | 137 of 403 | 04765 (-80), 04970 (-76), 04457 (-49) | 04487 (+76), 03905 (+68), 04451 (+64) |
| Hearing & audiology | 60 | 1,277 | 0.20 | 0.63 | 203 of 403 | 04354 (-83), 04364 (-81), 04949 (-77) | 04417 (+100), 04430 (+100), 04451 (+100) |
| Behavior therapy (ABA) | 30 | 14,689 | 2.58 | 0.66 | 6 of 403 | 04270 (-16), 03910 (-8), 04654 (-7) | 03905 (+86), 03911 (+59), 03909 (+47) |
| Care coordination & community health | 30 | 9,452 | 1.55 | 0.46 | 132 of 403 | 04492 (-81), 04643 (-76), 04765 (-52) | 04261 (+100), 03905 (+98), 04943 (+67) |
| General surgery | 60 | 2,710 | 0.39 | 0.50 | 231 of 403 | 04090 (-89), 04932 (-83), 04435 (-82) | 04693 (+100), 04463 (+95), 04491 (+95) |
| Infectious disease | 90 | 540 | 0.06 | 0.59 | 205 of 403 | 04096 (-49), 04691 (-49), 04658 (-48) | 03905 (+78), 03911 (+67), 04858 (+65) |
| Genetics & genetic counseling | 90 | 419 | 0.03 | 0.56 | 172 of 403 | 04062 (-84), 04043 (-80), 04090 (-80) | 04463 (+88), 04443 (+82), 04464 (+80) |
| Hospice & palliative care | 60 | 383 | 0.09 | 0.69 | 153 of 403 | 04574 (-59), 04348 (-52), 04496 (-47) | 04576 (+83), 03905 (+77), 04411 (+76) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 16320 rows (ZIP x specialty) stored in access_e2sfca for ME; market-score now uses drive-time access for these ZIPs.
