# E2SFCA access dry run: Kentucky

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,295; in Kentucky: 753
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,295 x 3,295 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 649,477; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.23 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.08), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 28; re-anchored: 15; still implausible (left out of the rank comparison, marked in the CSV): 12 (25047, 25149, 28612, 28619, 28665, 28690, 28748, 63732, 72351, 72370, 72426, 72442)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 24823 | no | 9.96 | 100% | 5.79 | 100% | yes (2.29) |
| 25021 | no | 8.27 | 100% | 5.76 | 100% | no |
| 25022 | no | 8.51 | 100% | 4.75 | 100% | yes (1.65) |
| 25047 | no | 9.17 | 100% | 10.75 | 100% | no |
| 25057 | no | 9.25 | 100% | 3.73 | 100% | yes (1.36) |
| 25114 | no | 8.85 | 100% | 4.62 | 100% | yes (1.92) |
| 25148 | no | 9.80 | 100% | 6.58 | 100% | yes (2.00) |
| 25149 | no | 8.44 | 100% | 8.44 | 100% | no |
| 25152 | no | 9.20 | 100% | 5.75 | 100% | yes (1.99) |
| 25183 | no | 8.92 | 100% | 5.44 | 100% | yes (1.43) |
| 25628 | no | 9.83 | 100% | 3.87 | 100% | yes (0.80) |
| 25646 | no | 8.92 | 100% | 5.34 | 100% | yes (1.70) |
| 25864 | no | 11.19 | 100% | 3.54 | 100% | yes (1.99) |
| 25977 | no | 9.58 | 100% | 4.59 | 100% | yes (1.61) |
| 28604 | no | 8.09 | 100% | 6.20 | 100% | yes (7.46) |
| 28612 | no | 8.16 | 100% | 8.16 | 100% | no |
| 28619 | no | 9.77 | 100% | 9.77 | 100% | no |
| 28665 | no | 8.41 | 100% | 9.48 | 100% | no |
| 28690 | no | 10.25 | 100% | 10.25 | 100% | no |
| 28694 | no | 8.13 | 100% | 4.89 | 100% | yes (10.50) |
| 28748 | no | 8.17 | 100% | 8.17 | 100% | no |
| 41250 | yes | 9.11 | 100% | 5.42 | 100% | yes (1.44) |
| 41554 | yes | 8.99 | 100% | 4.87 | 100% | yes (1.89) |
| 63732 | no | 9.02 | 100% | 9.02 | 100% | no |
| 72351 | no | 9.72 | 100% | 9.72 | 100% | no |
| 72370 | no | 8.85 | 100% | 8.85 | 100% | no |
| 72426 | no | 9.12 | 100% | 9.12 | 100% | no |
| 72442 | no | 8.09 | 100% | 8.09 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 93,006 | 4.78 | 0.48 | 413 of 753 | 40830 (-54), 40831 (-54), 40913 (-53) | 41571 (+100), 41754 (+100), 41778 (+100) |
| Pediatrics (children) | 30 | 21,209 | 1.13 | 0.64 | 268 of 753 | 41018 (-51), 40361 (-49), 41564 (-43) | 40383 (+77), 41659 (+75), 41571 (+70) |
| Women's health / OB-GYN | 60 | 8,475 | 0.55 | 0.63 | 248 of 753 | 40165 (-43), 41630 (-42), 40229 (-40) | 42058 (+61), 40383 (+60), 42236 (+50) |
| Mental health & counseling | 30 | 118,788 | 7.13 | 0.60 | 265 of 753 | 41651 (-86), 41630 (-84), 41622 (-83) | 41180 (+100), 42634 (+100), 41754 (+99) |
| Dental | 30 | 23,687 | 1.64 | 0.58 | 282 of 753 | 42501 (-45), 40155 (-42), 40121 (-39) | 42236 (+94), 42232 (+80), 42254 (+77) |
| Eye care | 30 | 11,716 | 0.65 | 0.61 | 383 of 753 | 41619 (-86), 41651 (-82), 41535 (-63) | 41571 (+100), 41660 (+100), 41262 (+97) |
| Chiropractic | 30 | 10,008 | 0.64 | 0.62 | 329 of 753 | 40856 (-87), 42347 (-67), 42501 (-48) | 40007 (+72), 42054 (+71), 41722 (+69) |
| Physical & occupational therapy | 30 | 50,983 | 2.73 | 0.53 | 362 of 753 | 41819 (-66), 41553 (-57), 41749 (-49) | 40071 (+86), 42451 (+82), 42035 (+81) |
| Orthopedics & sports injury | 60 | 8,419 | 0.42 | 0.70 | 278 of 753 | 40165 (-61), 40109 (-43), 40047 (-41) | 40935 (+85), 40856 (+84), 40826 (+74) |
| Heart / cardiology | 60 | 4,846 | 0.28 | 0.59 | 349 of 753 | 41630 (-88), 41619 (-82), 41622 (-82) | 40826 (+85), 42567 (+63), 40383 (+62) |
| Skin / dermatology | 60 | 1,433 | 0.10 | 0.71 | 258 of 753 | 42452 (-59), 40165 (-52), 40109 (-44) | 40357 (+69), 41571 (+63), 41659 (+63) |
| Allergy & immunology | 60 | 597 | 0.03 | 0.67 | 358 of 753 | 41630 (-94), 41564 (-90), 41535 (-88) | 41632 (+79), 42326 (+72), 42252 (+67) |
| Lung, breathing & sleep | 60 | 2,427 | 0.14 | 0.64 | 343 of 753 | 42167 (-100), 41619 (-93), 42602 (-91) | 40826 (+83), 40940 (+67), 40843 (+64) |
| Digestive / gastroenterology | 60 | 2,079 | 0.13 | 0.68 | 302 of 753 | 40165 (-52), 41630 (-50), 42025 (-50) | 40383 (+61), 41722 (+55), 41231 (+52) |
| Kidney / nephrology | 60 | 2,189 | 0.12 | 0.66 | 402 of 753 | 41831 (-100), 41772 (-96), 41822 (-96) | 41180 (+82), 40935 (+81), 41464 (+81) |
| Diabetes & hormones | 60 | 1,013 | 0.07 | 0.68 | 294 of 753 | 41513 (-65), 40372 (-64), 42371 (-62) | 40940 (+76), 42450 (+73), 40763 (+70) |
| Cancer care / oncology | 90 | 2,959 | 0.18 | 0.39 | 470 of 753 | 41001 (-51), 41086 (-51), 40065 (-49) | 40856 (+79), 41557 (+78), 41659 (+77) |
| Arthritis / rheumatology | 60 | 654 | 0.04 | 0.65 | 343 of 753 | 41630 (-72), 41619 (-68), 41831 (-68) | 41660 (+68), 41754 (+67), 41571 (+65) |
| Brain & nerves / neurology | 60 | 4,192 | 0.24 | 0.66 | 242 of 753 | 40165 (-57), 40109 (-54), 40229 (-48) | 40383 (+61), 41571 (+57), 42058 (+55) |
| Ear, nose & throat | 60 | 1,321 | 0.08 | 0.60 | 423 of 753 | 41619 (-100), 41622 (-100), 41630 (-100) | 41464 (+91), 40826 (+70), 42236 (+64) |
| Urology | 60 | 1,482 | 0.08 | 0.62 | 444 of 753 | 41168 (-67), 42025 (-65), 42374 (-62) | 40826 (+100), 41180 (+86), 41124 (+73) |
| Foot & ankle / podiatry | 60 | 2,357 | 0.16 | 0.66 | 283 of 753 | 40456 (-60), 41630 (-49), 41622 (-47) | 40862 (+66), 41832 (+61), 42553 (+57) |
| Pain management | 60 | 1,419 | 0.09 | 0.57 | 395 of 753 | 41619 (-100), 41622 (-100), 41630 (-100) | 40856 (+88), 40328 (+74), 40464 (+66) |
| Plastic & reconstructive surgery | 90 | 1,122 | 0.07 | 0.51 | 443 of 753 | 40031 (-65), 40020 (-63), 40047 (-63) | 41571 (+80), 41557 (+78), 41560 (+78) |
| Speech & language therapy | 30 | 16,722 | 0.87 | 0.58 | 383 of 753 | 41360 (-71), 41366 (-70), 42204 (-69) | 40071 (+96), 42035 (+87), 40046 (+83) |
| Nutrition & dietitian | 30 | 5,287 | 0.32 | 0.60 | 306 of 753 | 42733 (-89), 42758 (-89), 41539 (-86) | 41722 (+100), 41778 (+100), 41754 (+98) |
| Acupuncture, massage & naturopathy | 30 | 3,400 | 0.50 | 0.72 | 90 of 753 | 40376 (-87), 41365 (-82), 41721 (-82) | 40516 (+40), 40390 (+37), 40104 (+34) |
| Urgent care & emergency | 30 | 8,685 | 0.50 | 0.55 | 358 of 753 | 40171 (-85), 40827 (-70), 40913 (-70) | 40826 (+100), 40940 (+99), 41632 (+91) |
| Imaging & lab | 60 | 9,083 | 0.55 | 0.60 | 304 of 753 | 41831 (-92), 41630 (-88), 41822 (-75) | 40763 (+77), 41571 (+70), 40383 (+63) |
| Pharmacy | 30 | 32,871 | 1.68 | 0.46 | 449 of 753 | 42631 (-67), 42653 (-59), 40829 (-58) | 40763 (+100), 41367 (+100), 41571 (+100) |
| Home health & in-home care | 30 | 55,179 | 1.49 | 0.62 | 87 of 753 | 41622 (-38), 42461 (-32), 41749 (-27) | 41034 (+98), 41141 (+97), 41189 (+93) |
| Nursing & assisted living | 60 | 8,254 | 0.37 | 0.43 | 314 of 753 | 41622 (-55), 41619 (-53), 41630 (-53) | 42078 (+81), 42047 (+80), 42028 (+77) |
| Medical equipment & supplies | 60 | 6,417 | 0.34 | 0.62 | 372 of 753 | 40456 (-67), 42066 (-65), 40906 (-61) | 40763 (+82), 40826 (+80), 41250 (+69) |
| Hearing & audiology | 60 | 3,833 | 0.20 | 0.73 | 295 of 753 | 42371 (-63), 40165 (-59), 42056 (-55) | 42047 (+92), 42083 (+88), 42634 (+85) |
| Behavior therapy (ABA) | 30 | 30,477 | 2.58 | 0.70 | 130 of 753 | 41564 (-56), 41619 (-49), 41651 (-41) | 42451 (+86), 42458 (+84), 41571 (+72) |
| Care coordination & community health | 30 | 50,274 | 1.55 | 0.60 | 268 of 753 | 41630 (-94), 41240 (-93), 41622 (-90) | 40379 (+100), 41367 (+100), 41464 (+100) |
| General surgery | 60 | 6,734 | 0.39 | 0.61 | 386 of 753 | 41630 (-78), 41831 (-78), 41619 (-76) | 40826 (+72), 42436 (+61), 40383 (+59) |
| Infectious disease | 90 | 816 | 0.06 | 0.53 | 323 of 753 | 40067 (-62), 40076 (-61), 40165 (-57) | 40390 (+67), 40383 (+65), 42210 (+65) |
| Genetics & genetic counseling | 90 | 567 | 0.03 | 0.52 | 159 of 753 | 41001 (-94), 41059 (-91), 41005 (-88) | 42631 (+66), 40258 (+48), 40219 (+45) |
| Hospice & palliative care | 60 | 994 | 0.09 | 0.61 | 221 of 753 | 41810 (-68), 41849 (-58), 41858 (-49) | 41534 (+97), 41512 (+81), 40383 (+77) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 40202 | Primary care / family doctor | 8.487 | 11.451 | 11 | 0 |
| 40202 | Mental health & counseling | 10.338 | 13.762 | 28 | 3 |
| 40202 | Heart / cardiology | 0.722 | 0.496 | 0 | 12 |
| 40202 | Cancer care / oncology | 0.356 | 0.206 | 0 | 42 |
| 40202 | Urgent care & emergency | 0.828 | 1.090 | 17 | 0 |
| 40508 | Primary care / family doctor | 7.857 | 8.299 | 18 | 13 |
| 40508 | Mental health & counseling | 14.779 | 16.772 | 0 | 0 |
| 40508 | Heart / cardiology | 0.419 | 0.321 | 25 | 43 |
| 40508 | Cancer care / oncology | 0.247 | 0.126 | 31 | 65 |
| 40508 | Urgent care & emergency | 0.639 | 0.687 | 36 | 31 |
| 42101 | Primary care / family doctor | 4.412 | 4.498 | 54 | 53 |
| 42101 | Mental health & counseling | 8.226 | 6.099 | 42 | 57 |
| 42101 | Heart / cardiology | 0.344 | 0.333 | 39 | 41 |
| 42101 | Cancer care / oncology | 0.108 | 0.065 | 70 | 82 |
| 42101 | Urgent care & emergency | 0.271 | 0.223 | 73 | 78 |
| 41501 | Primary care / family doctor | 13.488 | 15.051 | 0 | 0 |
| 41501 | Mental health & counseling | 6.490 | 7.132 | 54 | 50 |
| 41501 | Heart / cardiology | 0.725 | 0.434 | 0 | 23 |
| 41501 | Cancer care / oncology | 0.399 | 0.137 | 0 | 62 |
| 41501 | Urgent care & emergency | 0.725 | 0.826 | 27 | 17 |
| 42001 | Primary care / family doctor | 7.801 | 8.239 | 18 | 14 |
| 42001 | Mental health & counseling | 9.976 | 13.888 | 30 | 3 |
| 42001 | Heart / cardiology | 0.720 | 0.393 | 0 | 30 |
| 42001 | Cancer care / oncology | 0.278 | 0.119 | 22 | 67 |
| 42001 | Urgent care & emergency | 0.556 | 0.474 | 44 | 52 |
| 40701 | Primary care / family doctor | 7.208 | 9.305 | 25 | 3 |
| 40701 | Mental health & counseling | 12.621 | 32.195 | 11 | 0 |
| 40701 | Heart / cardiology | 0.344 | 0.224 | 39 | 60 |
| 40701 | Cancer care / oncology | 0.135 | 0.090 | 62 | 75 |
| 40701 | Urgent care & emergency | 0.258 | 0.437 | 74 | 56 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 30120 rows (ZIP x specialty) stored in access_e2sfca for KY; market-score now uses drive-time access for these ZIPs.
