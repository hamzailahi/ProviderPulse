# E2SFCA access dry run: Alabama

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,557; in Alabama: 626
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,557 x 1,557 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 360,576; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.85 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.11), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 0; still implausible (left out of the rank comparison, marked in the CSV): 2 (70038, 70041)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 70038 | no | 1.78 | 8% | 1.78 | 8% | no |
| 70041 | no | 1.78 | 8% | 1.78 | 8% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 61,169 | 4.78 | 0.48 | 327 of 626 | 35235 (-70), 36768 (-53), 36481 (-49) | 36912 (+100), 35973 (+89), 35748 (+81) |
| Pediatrics (children) | 30 | 10,781 | 1.13 | 0.66 | 171 of 626 | 35235 (-79), 35774 (-76), 35764 (-66) | 36527 (+81), 35748 (+77), 35803 (+75) |
| Women's health / OB-GYN | 60 | 6,434 | 0.55 | 0.70 | 192 of 626 | 36549 (-56), 35235 (-49), 35036 (-46) | 35803 (+66), 35748 (+63), 35763 (+62) |
| Mental health & counseling | 30 | 59,549 | 7.13 | 0.61 | 159 of 626 | 36083 (-66), 35976 (-56), 36088 (-50) | 35748 (+59), 36856 (+54), 36854 (+52) |
| Dental | 30 | 16,364 | 1.64 | 0.61 | 267 of 626 | 35055 (-49), 35235 (-47), 36904 (-43) | 35748 (+73), 36912 (+59), 35803 (+58) |
| Eye care | 30 | 7,550 | 0.65 | 0.58 | 337 of 626 | 36732 (-68), 35653 (-64), 35768 (-58) | 35748 (+86), 36912 (+86), 36370 (+76) |
| Chiropractic | 30 | 7,840 | 0.64 | 0.57 | 262 of 626 | 35565 (-48), 35768 (-47), 35906 (-43) | 35748 (+61), 35621 (+60), 35031 (+58) |
| Physical & occupational therapy | 30 | 28,746 | 2.73 | 0.53 | 287 of 626 | 35235 (-47), 35071 (-41), 35447 (-41) | 35748 (+75), 35459 (+69), 36740 (+69) |
| Orthopedics & sports injury | 60 | 5,141 | 0.42 | 0.72 | 218 of 626 | 35111 (-83), 36907 (-71), 35235 (-56) | 36922 (+92), 35459 (+91), 36036 (+75) |
| Heart / cardiology | 60 | 3,096 | 0.28 | 0.72 | 216 of 626 | 36541 (-63), 35111 (-59), 35036 (-57) | 35147 (+90), 35576 (+67), 36854 (+66) |
| Skin / dermatology | 60 | 1,063 | 0.10 | 0.73 | 209 of 626 | 35036 (-93), 35073 (-75), 35117 (-75) | 35458 (+94), 35147 (+85), 35475 (+76) |
| Allergy & immunology | 60 | 324 | 0.03 | 0.74 | 236 of 626 | 35096 (-45), 35052 (-43), 35078 (-42) | 36767 (+100), 35475 (+82), 36043 (+68) |
| Lung, breathing & sleep | 60 | 1,506 | 0.14 | 0.66 | 235 of 626 | 35036 (-74), 35073 (-63), 35117 (-63) | 35803 (+69), 35748 (+66), 36854 (+66) |
| Digestive / gastroenterology | 60 | 1,316 | 0.13 | 0.73 | 240 of 626 | 36541 (-75), 35036 (-60), 35117 (-60) | 35546 (+100), 35475 (+78), 36344 (+73) |
| Kidney / nephrology | 60 | 1,653 | 0.12 | 0.63 | 315 of 626 | 35148 (-70), 35078 (-69), 36088 (-69) | 36767 (+100), 36758 (+90), 36263 (+81) |
| Diabetes & hormones | 60 | 581 | 0.07 | 0.76 | 211 of 626 | 36541 (-63), 35111 (-60), 35036 (-59) | 36854 (+79), 35803 (+75), 35748 (+72) |
| Cancer care / oncology | 90 | 1,821 | 0.18 | 0.46 | 358 of 626 | 35022 (-63), 35052 (-63), 35111 (-63) | 35748 (+66), 35803 (+66), 35763 (+65) |
| Arthritis / rheumatology | 60 | 438 | 0.04 | 0.72 | 203 of 626 | 35111 (-86), 35036 (-79), 35117 (-74) | 35475 (+80), 35546 (+73), 36263 (+70) |
| Brain & nerves / neurology | 60 | 2,215 | 0.24 | 0.71 | 188 of 626 | 35235 (-70), 35036 (-67), 35111 (-66) | 35748 (+75), 35803 (+69), 35763 (+65) |
| Ear, nose & throat | 60 | 864 | 0.08 | 0.71 | 241 of 626 | 35235 (-77), 35036 (-76), 35005 (-73) | 35546 (+100), 35444 (+94), 35475 (+92) |
| Urology | 60 | 1,024 | 0.08 | 0.70 | 274 of 626 | 35036 (-74), 36541 (-73), 35235 (-67) | 35576 (+91), 35772 (+78), 36856 (+77) |
| Foot & ankle / podiatry | 60 | 1,428 | 0.16 | 0.70 | 188 of 626 | 36043 (-56), 35974 (-36), 36344 (-35) | 35475 (+83), 35546 (+71), 36722 (+67) |
| Pain management | 60 | 1,185 | 0.09 | 0.81 | 210 of 626 | 36907 (-79), 36549 (-65), 36574 (-59) | 36528 (+70), 35953 (+67), 35803 (+64) |
| Plastic & reconstructive surgery | 90 | 716 | 0.07 | 0.58 | 275 of 626 | 35111 (-61), 35074 (-53), 35022 (-50) | 35546 (+86), 35475 (+79), 35147 (+69) |
| Speech & language therapy | 30 | 8,597 | 0.87 | 0.57 | 232 of 626 | 36420 (-57), 36785 (-56), 35470 (-53) | 35043 (+77), 35051 (+72), 35748 (+68) |
| Nutrition & dietitian | 30 | 3,232 | 0.32 | 0.65 | 222 of 626 | 36908 (-77), 35552 (-73), 36742 (-61) | 36031 (+100), 36039 (+100), 36089 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,994 | 0.50 | 0.69 | 38 of 626 | 36071 (-96), 36040 (-33), 36360 (-33) | 36052 (+35), 36017 (+34), 36075 (+34) |
| Urgent care & emergency | 30 | 5,503 | 0.50 | 0.40 | 359 of 626 | 35447 (-85), 35235 (-77), 36801 (-63) | 36912 (+100), 36352 (+96), 36311 (+95) |
| Imaging & lab | 60 | 6,170 | 0.55 | 0.71 | 205 of 626 | 36541 (-66), 35036 (-65), 35005 (-59) | 35546 (+76), 35803 (+69), 35748 (+66) |
| Pharmacy | 30 | 22,332 | 1.68 | 0.49 | 400 of 626 | 36420 (-57), 36049 (-50), 35768 (-49) | 36912 (+88), 36856 (+85), 35147 (+73) |
| Home health & in-home care | 30 | 11,830 | 1.49 | 0.47 | 157 of 626 | 36860 (-82), 36538 (-70), 36908 (-66) | 36481 (+44), 36352 (+38), 36912 (+38) |
| Nursing & assisted living | 60 | 3,483 | 0.37 | 0.53 | 115 of 626 | 36344 (-47), 36907 (-31), 36919 (-29) | 36767 (+49), 36921 (+49), 36584 (+47) |
| Medical equipment & supplies | 60 | 5,468 | 0.34 | 0.62 | 262 of 626 | 36907 (-64), 36904 (-48), 36919 (-46) | 36767 (+94), 35147 (+71), 36758 (+65) |
| Hearing & audiology | 60 | 2,245 | 0.20 | 0.76 | 269 of 626 | 35036 (-65), 35235 (-59), 36549 (-58) | 36912 (+64), 35772 (+63), 36311 (+63) |
| Behavior therapy (ABA) | 30 | 21,955 | 2.58 | 0.69 | 148 of 626 | 36081 (-41), 36915 (-37), 36579 (-30) | 36856 (+94), 36877 (+89), 36875 (+76) |
| Care coordination & community health | 30 | 8,384 | 1.55 | 0.59 | 77 of 626 | 36088 (-72), 36083 (-71), 35976 (-41) | 36854 (+100), 36874 (+99), 36856 (+95) |
| General surgery | 60 | 4,802 | 0.39 | 0.57 | 274 of 626 | 36541 (-74), 36525 (-66), 36582 (-65) | 35803 (+70), 35763 (+66), 35748 (+65) |
| Infectious disease | 90 | 626 | 0.06 | 0.53 | 311 of 626 | 35111 (-71), 35022 (-69), 35036 (-68) | 35803 (+71), 35748 (+70), 35763 (+70) |
| Genetics & genetic counseling | 90 | 256 | 0.03 | 0.63 | 199 of 626 | 35622 (-35), 36541 (-34), 35649 (-33) | 36611 (+71), 35060 (+70), 35119 (+69) |
| Hospice & palliative care | 60 | 1,118 | 0.09 | 0.64 | 271 of 626 | 36907 (-100), 35148 (-52), 36786 (-51) | 36481 (+100), 36767 (+100), 36763 (+83) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 35203 | Primary care / family doctor | 9.029 | 11.714 | 6 | 0 |
| 35203 | Mental health & counseling | 8.725 | 11.191 | 39 | 22 |
| 35203 | Heart / cardiology | 0.843 | 0.556 | 0 | 1 |
| 35203 | Cancer care / oncology | 0.622 | 0.279 | 0 | 22 |
| 35203 | Urgent care & emergency | 1.020 | 1.166 | 0 | 0 |
| 36602 | Primary care / family doctor | 7.556 | 8.344 | 21 | 13 |
| 36602 | Mental health & counseling | 5.371 | 5.148 | 62 | 64 |
| 36602 | Heart / cardiology | 0.516 | 0.425 | 8 | 24 |
| 36602 | Cancer care / oncology | 0.430 | 0.255 | 0 | 28 |
| 36602 | Urgent care & emergency | 0.630 | 0.686 | 37 | 31 |
| 35801 | Primary care / family doctor | 7.471 | 9.468 | 22 | 1 |
| 35801 | Mental health & counseling | 7.255 | 9.152 | 49 | 36 |
| 35801 | Heart / cardiology | 0.579 | 0.321 | 0 | 43 |
| 35801 | Cancer care / oncology | 0.333 | 0.147 | 6 | 59 |
| 35801 | Urgent care & emergency | 0.555 | 0.663 | 44 | 33 |
| 36104 | Primary care / family doctor | 5.151 | 6.394 | 46 | 33 |
| 36104 | Mental health & counseling | 3.924 | 5.131 | 72 | 64 |
| 36104 | Heart / cardiology | 0.156 | 0.284 | 72 | 49 |
| 36104 | Cancer care / oncology | 0.207 | 0.102 | 42 | 71 |
| 36104 | Urgent care & emergency | 0.277 | 0.312 | 72 | 69 |
| 35401 | Primary care / family doctor | 4.960 | 5.636 | 48 | 41 |
| 35401 | Mental health & counseling | 5.597 | 6.111 | 61 | 57 |
| 35401 | Heart / cardiology | 0.195 | 0.194 | 65 | 66 |
| 35401 | Cancer care / oncology | 0.102 | 0.164 | 71 | 54 |
| 35401 | Urgent care & emergency | 0.289 | 0.346 | 71 | 65 |
| 36303 | Primary care / family doctor | 6.084 | 6.954 | 36 | 27 |
| 36303 | Mental health & counseling | 4.726 | 6.026 | 67 | 58 |
| 36303 | Heart / cardiology | 0.464 | 0.330 | 18 | 41 |
| 36303 | Cancer care / oncology | 0.199 | 0.109 | 44 | 69 |
| 36303 | Urgent care & emergency | 0.409 | 0.469 | 59 | 53 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 25040 rows (ZIP x specialty) stored in access_e2sfca for AL; market-score now uses drive-time access for these ZIPs.
