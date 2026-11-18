# E2SFCA access dry run: Virginia

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 4,375; in Virginia: 881
- Drive times: OSRM on OpenStreetMap roads (car profile), 4,375 x 4,375 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,144,928; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.21 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.03), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 95; re-anchored: 43; still implausible (left out of the rank comparison, marked in the CSV): 56 (15033, 15083, 15087, 15089, 15131, 15311, 15314, 15364, 15366, 15449, 15473, 15478, 15480, 15482, 15492, 15563, 15615, 15625, 15637, 15640, 15642, 15660, 15663, 15678, 15679, 15695, 15698, 16634, 16657, 16679, 17109, 21610, 21634, 21669, 21672, 21675, 21869, 22488, 25008, 25047, 25149, 43002, 43015, 43026, 43035, 43064, 43113, 43116, 43119, 43123, 43162, 43228, 43728, 43758, 45644, 45743)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 15033 | no | 27.73 | 100% | 23.81 | 100% | no |
| 15083 | no | 31.16 | 100% | 14.95 | 100% | yes (35.51) |
| 15087 | no | 13.53 | 100% | 27.53 | 100% | no |
| 15089 | no | 10.84 | 100% | 10.84 | 100% | no |
| 15131 | no | 8.81 | 100% | 8.81 | 100% | no |
| 15132 | no | 10.04 | 100% | 7.43 | 100% | yes (33.13) |
| 15311 | no | 14.63 | 100% | 15.35 | 100% | no |
| 15314 | no | 22.21 | 100% | 23.82 | 100% | no |
| 15324 | no | 20.55 | 100% | 0.00 | 100% | yes (23.78) |
| 15345 | no | 9.78 | 100% | 0.00 | 100% | yes (19.20) |
| 15360 | no | 23.39 | 100% | 0.00 | 100% | yes (23.15) |
| 15364 | no | 9.02 | 100% | 9.02 | 100% | no |
| 15366 | no | 17.07 | 100% | 12.53 | 100% | yes (26.58) |
| 15422 | no | 14.50 | 100% | 0.00 | 100% | yes (17.16) |
| 15449 | no | 16.17 | 100% | 10.51 | 100% | yes (16.15) |
| 15473 | no | 14.57 | 100% | 10.55 | 100% | yes (23.26) |
| 15478 | no | 8.27 | 100% | 8.27 | 100% | no |
| 15480 | no | 15.24 | 100% | 10.50 | 100% | yes (17.08) |
| 15482 | no | 13.31 | 100% | 9.92 | 100% | yes (22.28) |
| 15484 | no | 13.67 | 100% | 0.00 | 100% | yes (11.08) |
| 15492 | no | 13.09 | 100% | 13.37 | 100% | no |
| 15563 | no | 8.24 | 100% | 8.24 | 100% | no |
| 15615 | no | 11.28 | 100% | 39.41 | 100% | no |
| 15622 | no | 10.26 | 100% | 0.00 | 100% | yes (20.71) |
| 15625 | no | 12.48 | 100% | 12.48 | 100% | no |
| 15637 | no | 20.19 | 100% | 19.88 | 100% | no |
| 15640 | no | 11.74 | 100% | 11.74 | 100% | no |
| 15642 | no | 49.55 | 100% | 23.98 | 100% | yes (40.11) |
| 15660 | no | 34.45 | 100% | 38.50 | 100% | no |
| 15663 | no | 14.67 | 100% | 14.67 | 100% | no |
| 15678 | no | 21.89 | 100% | 21.89 | 100% | no |
| 15679 | no | 10.84 | 100% | 10.84 | 100% | no |
| 15695 | no | 11.35 | 100% | 11.35 | 100% | no |
| 15698 | no | 14.65 | 100% | 14.65 | 100% | no |
| 16634 | no | 8.27 | 100% | 8.27 | 100% | no |
| 16657 | no | 8.20 | 100% | 8.20 | 100% | no |
| 16679 | no | 8.27 | 100% | 8.27 | 100% | no |
| 17070 | no | 8.83 | 100% | 0.00 | 100% | yes (31.46) |
| 17109 | no | 9.32 | 100% | 9.32 | 100% | no |
| 19610 | no | 8.51 | 100% | 0.00 | 100% | yes (40.94) |
| 21610 | no | 8.10 | 100% | 8.10 | 100% | no |
| 21634 | no | 14.65 | 100% | 14.65 | 100% | no |
| 21669 | no | 13.08 | 100% | 13.08 | 100% | no |
| 21672 | no | 8.49 | 100% | 8.49 | 100% | no |
| 21675 | no | 8.28 | 100% | 8.28 | 100% | no |
| 21869 | no | 8.24 | 100% | 8.24 | 100% | no |
| 22488 | yes | 13.01 | 100% | 13.01 | 100% | no |
| 24150 | yes | 9.44 | 100% | 4.26 | 100% | yes (1.57) |
| 24823 | no | 9.96 | 100% | 5.79 | 100% | yes (2.29) |
| 24868 | no | 8.08 | 100% | 5.49 | 100% | yes (1.45) |
| 25008 | no | 8.06 | 100% | 8.06 | 100% | no |
| 25021 | no | 8.27 | 100% | 5.76 | 100% | no |
| 25022 | no | 8.51 | 100% | 4.75 | 100% | yes (1.65) |
| 25047 | no | 9.17 | 100% | 10.75 | 100% | no |
| 25057 | no | 9.25 | 100% | 3.73 | 100% | yes (1.36) |
| 25114 | no | 8.85 | 100% | 4.62 | 100% | yes (1.92) |
| 25148 | no | 9.80 | 100% | 6.58 | 100% | yes (2.00) |
| 25149 | no | 8.44 | 100% | 8.44 | 100% | no |
| 25152 | no | 9.20 | 100% | 5.75 | 100% | yes (1.99) |
| 25183 | no | 8.92 | 100% | 5.44 | 100% | yes (1.43) |
| 25204 | no | 8.07 | 100% | 7.85 | 100% | no |
| 25628 | no | 9.83 | 100% | 3.87 | 100% | yes (0.80) |
| 25646 | no | 8.92 | 100% | 5.34 | 100% | yes (1.70) |
| 25864 | no | 11.19 | 100% | 3.54 | 100% | yes (1.99) |
| 26259 | no | 8.15 | 100% | 3.22 | 100% | yes (1.60) |
| 26261 | no | 9.60 | 100% | 3.76 | 100% | yes (1.49) |
| 27927 | no | 10.61 | 100% | 2.33 | 100% | yes (2.74) |
| 27950 | no | 8.23 | 100% | 7.26 | 100% | no |
| 41250 | no | 9.11 | 100% | 5.42 | 100% | yes (1.44) |
| 41554 | no | 8.99 | 100% | 4.87 | 100% | yes (1.89) |
| 43002 | no | 25.22 | 100% | 25.22 | 100% | no |
| 43015 | no | 0.00 | 42% | 0.00 | 33% | no |
| 43026 | no | 20.57 | 100% | 22.01 | 100% | no |
| 43035 | no | 0.00 | 42% | 0.00 | 33% | no |
| 43064 | no | 22.01 | 100% | 22.01 | 100% | no |
| 43068 | no | 0.00 | 42% | 0.00 | 58% | yes (74.61) |
| 43113 | no | 9.25 | 100% | 9.25 | 100% | no |
| 43116 | no | 13.77 | 100% | 13.77 | 100% | no |
| 43119 | no | 14.31 | 100% | 15.98 | 100% | no |
| 43123 | no | 16.17 | 100% | 16.77 | 100% | no |
| 43162 | no | 14.95 | 100% | 16.66 | 100% | no |
| 43204 | no | 32.82 | 100% | 0.00 | 100% | yes (84.32) |
| 43228 | no | 23.38 | 100% | 24.27 | 100% | no |
| 43230 | no | 0.00 | 25% | 0.00 | 75% | yes (81.89) |
| 43240 | no | 0.00 | 33% | 0.00 | 67% | yes (91.26) |
| 43728 | no | 2.00 | 42% | 2.00 | 42% | no |
| 43739 | no | 0.00 | 42% | 2.40 | 58% | yes (52.92) |
| 43758 | no | 2.67 | 42% | 2.67 | 42% | no |
| 45644 | no | 10.28 | 100% | 10.60 | 100% | no |
| 45647 | no | 9.22 | 100% | 2.52 | 100% | yes (39.82) |
| 45672 | no | 10.80 | 100% | 2.65 | 100% | yes (33.52) |
| 45739 | no | 1.57 | 42% | 3.97 | 58% | yes (1.05) |
| 45743 | no | 2.49 | 42% | 2.91 | 25% | no |
| 45764 | no | 0.00 | 33% | 0.00 | 67% | yes (29.64) |
| 45770 | no | 2.30 | 17% | 4.03 | 83% | yes (2.44) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 151,866 | 4.78 | 0.62 | 396 of 880 | 22922 (-75), 23123 (-58), 24459 (-58) | 24065 (+87), 22952 (+84), 24279 (+84) |
| Pediatrics (children) | 30 | 37,548 | 1.13 | 0.72 | 345 of 880 | 22964 (-58), 22922 (-51), 24651 (-51) | 24065 (+93), 22920 (+89), 24079 (+70) |
| Women's health / OB-GYN | 60 | 17,205 | 0.55 | 0.78 | 308 of 880 | 22546 (-54), 23047 (-52), 24174 (-50) | 23009 (+84), 22952 (+78), 22580 (+77) |
| Mental health & counseling | 30 | 231,990 | 7.13 | 0.71 | 272 of 880 | 22949 (-76), 24210 (-63), 24013 (-37) | 24065 (+70), 24127 (+51), 23059 (+48) |
| Dental | 30 | 45,603 | 1.64 | 0.67 | 369 of 880 | 24315 (-62), 22482 (-61), 24651 (-52) | 22746 (+78), 24079 (+70), 22935 (+67) |
| Eye care | 30 | 18,820 | 0.65 | 0.64 | 426 of 880 | 20117 (-76), 22949 (-70), 23970 (-60) | 22746 (+89), 22637 (+80), 20106 (+75) |
| Chiropractic | 30 | 13,716 | 0.64 | 0.62 | 255 of 880 | 24473 (-72), 24151 (-59), 22482 (-55) | 24067 (+69), 24602 (+60), 24065 (+56) |
| Physical & occupational therapy | 30 | 88,143 | 2.73 | 0.63 | 402 of 880 | 22949 (-69), 24326 (-54), 23604 (-52) | 23106 (+85), 22920 (+82), 23009 (+80) |
| Orthopedics & sports injury | 60 | 13,964 | 0.42 | 0.68 | 338 of 880 | 24517 (-87), 22938 (-85), 24522 (-79) | 23009 (+80), 24127 (+74), 24132 (+72) |
| Heart / cardiology | 60 | 8,365 | 0.28 | 0.69 | 375 of 880 | 22938 (-53), 22731 (-47), 24174 (-47) | 23009 (+88), 22952 (+82), 22580 (+77) |
| Skin / dermatology | 60 | 2,922 | 0.10 | 0.77 | 313 of 880 | 22972 (-79), 22731 (-70), 22738 (-64) | 22746 (+85), 24314 (+75), 22737 (+72) |
| Allergy & immunology | 60 | 1,230 | 0.03 | 0.77 | 319 of 880 | 22938 (-100), 22972 (-100), 22731 (-88) | 23846 (+100), 24318 (+93), 24127 (+91) |
| Lung, breathing & sleep | 60 | 3,954 | 0.14 | 0.76 | 306 of 880 | 24244 (-53), 23141 (-40), 24174 (-37) | 24127 (+98), 22952 (+84), 24216 (+76) |
| Digestive / gastroenterology | 60 | 3,854 | 0.13 | 0.74 | 318 of 880 | 24174 (-55), 24258 (-48), 23663 (-46) | 24127 (+99), 24657 (+79), 22952 (+75) |
| Kidney / nephrology | 60 | 3,556 | 0.12 | 0.65 | 395 of 880 | 24607 (-59), 23169 (-55), 23092 (-52) | 23891 (+87), 23009 (+78), 22952 (+76) |
| Diabetes & hormones | 60 | 2,033 | 0.07 | 0.76 | 295 of 880 | 22938 (-100), 22940 (-82), 24590 (-80) | 23009 (+83), 23427 (+80), 24127 (+78) |
| Cancer care / oncology | 90 | 5,085 | 0.18 | 0.57 | 472 of 880 | 23415 (-56), 23416 (-56), 23442 (-56) | 22637 (+82), 22646 (+77), 22620 (+75) |
| Arthritis / rheumatology | 60 | 1,267 | 0.04 | 0.78 | 300 of 880 | 22938 (-69), 22973 (-57), 22937 (-55) | 23846 (+100), 24127 (+98), 24412 (+88) |
| Brain & nerves / neurology | 60 | 6,215 | 0.24 | 0.76 | 214 of 880 | 24174 (-54), 24122 (-39), 24090 (-37) | 24127 (+88), 22952 (+78), 22920 (+75) |
| Ear, nose & throat | 60 | 2,158 | 0.08 | 0.69 | 395 of 880 | 22938 (-74), 24441 (-64), 22969 (-56) | 24318 (+91), 24657 (+90), 24127 (+85) |
| Urology | 60 | 2,644 | 0.08 | 0.68 | 482 of 880 | 22938 (-70), 23414 (-62), 23401 (-57) | 24657 (+84), 24270 (+79), 24127 (+76) |
| Foot & ankle / podiatry | 60 | 4,780 | 0.16 | 0.69 | 350 of 880 | 23415 (-46), 23414 (-45), 23442 (-44) | 23427 (+100), 24127 (+99), 23426 (+97) |
| Pain management | 60 | 2,529 | 0.09 | 0.73 | 284 of 880 | 24426 (-100), 24457 (-100), 24474 (-100) | 24127 (+99), 22952 (+83), 22637 (+69) |
| Plastic & reconstructive surgery | 90 | 1,811 | 0.07 | 0.74 | 428 of 880 | 23065 (-56), 23102 (-52), 23084 (-50) | 24127 (+75), 24065 (+64), 24521 (+64) |
| Speech & language therapy | 30 | 27,459 | 0.87 | 0.66 | 386 of 880 | 23085 (-74), 24651 (-51), 23301 (-50) | 23461 (+80), 23002 (+69), 24413 (+66) |
| Nutrition & dietitian | 30 | 10,027 | 0.32 | 0.71 | 309 of 880 | 22820 (-90), 22811 (-78), 22976 (-74) | 24065 (+100), 22952 (+99), 24127 (+97) |
| Acupuncture, massage & naturopathy | 30 | 9,571 | 0.50 | 0.77 | 150 of 880 | 20117 (-76), 24448 (-44), 22967 (-42) | 24458 (+87), 22736 (+79), 24413 (+76) |
| Urgent care & emergency | 30 | 13,463 | 0.50 | 0.62 | 350 of 880 | 22482 (-71), 24171 (-58), 22560 (-56) | 22746 (+100), 24065 (+100), 24127 (+100) |
| Imaging & lab | 60 | 14,528 | 0.55 | 0.72 | 273 of 880 | 24605 (-39), 22546 (-36), 24607 (-35) | 22637 (+65), 24127 (+65), 22580 (+62) |
| Pharmacy | 30 | 52,320 | 1.68 | 0.51 | 395 of 880 | 23123 (-67), 22482 (-66), 22949 (-65) | 24225 (+98), 24602 (+86), 24270 (+80) |
| Home health & in-home care | 30 | 112,101 | 1.49 | 0.69 | 210 of 880 | 22150 (-50), 24228 (-45), 22601 (-37) | 24150 (+100), 24413 (+100), 24458 (+100) |
| Nursing & assisted living | 60 | 12,970 | 0.37 | 0.50 | 292 of 880 | 24529 (-72), 23927 (-64), 24541 (-51) | 24484 (+72), 23874 (+62), 23307 (+58) |
| Medical equipment & supplies | 60 | 9,949 | 0.34 | 0.68 | 307 of 880 | 24244 (-38), 23141 (-36), 23821 (-35) | 24216 (+78), 22952 (+73), 24245 (+66) |
| Hearing & audiology | 60 | 5,963 | 0.20 | 0.71 | 355 of 880 | 23169 (-56), 22938 (-54), 24472 (-51) | 24127 (+93), 24657 (+88), 22952 (+74) |
| Behavior therapy (ABA) | 30 | 65,533 | 2.58 | 0.77 | 152 of 880 | 22003 (-53), 22046 (-50), 22213 (-49) | 23461 (+98), 22580 (+72), 23457 (+70) |
| Care coordination & community health | 30 | 69,686 | 1.55 | 0.66 | 76 of 880 | 23604 (-89), 23092 (-50), 22624 (-47) | 22811 (+88), 24366 (+78), 22503 (+72) |
| General surgery | 60 | 11,161 | 0.39 | 0.67 | 372 of 880 | 24090 (-47), 24174 (-46), 24066 (-45) | 24127 (+98), 22952 (+78), 22920 (+70) |
| Infectious disease | 90 | 1,613 | 0.06 | 0.72 | 381 of 880 | 22938 (-75), 23084 (-65), 22969 (-64) | 23899 (+78), 24127 (+76), 23881 (+68) |
| Genetics & genetic counseling | 90 | 1,033 | 0.03 | 0.65 | 417 of 880 | 22938 (-78), 23084 (-73), 22937 (-69) | 23356 (+91), 23415 (+91), 23416 (+91) |
| Hospice & palliative care | 60 | 1,669 | 0.09 | 0.62 | 356 of 880 | 24343 (-68), 23486 (-67), 23416 (-63) | 24225 (+83), 24484 (+83), 23430 (+81) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 23219 | Primary care / family doctor | 4.580 | 6.352 | 52 | 34 |
| 23219 | Mental health & counseling | 11.606 | 15.059 | 19 | 0 |
| 23219 | Heart / cardiology | 0.291 | 0.300 | 48 | 47 |
| 23219 | Cancer care / oncology | 0.196 | 0.136 | 45 | 62 |
| 23219 | Urgent care & emergency | 0.435 | 0.607 | 56 | 39 |
| 22030 | Primary care / family doctor | 5.499 | 4.186 | 42 | 56 |
| 22030 | Mental health & counseling | 7.171 | 6.903 | 50 | 52 |
| 22030 | Heart / cardiology | 0.376 | 0.300 | 33 | 47 |
| 22030 | Cancer care / oncology | 0.228 | 0.186 | 36 | 48 |
| 22030 | Urgent care & emergency | 0.375 | 0.237 | 62 | 76 |
| 23510 | Primary care / family doctor | 6.622 | 8.481 | 31 | 11 |
| 23510 | Mental health & counseling | 7.534 | 9.924 | 47 | 30 |
| 23510 | Heart / cardiology | 0.363 | 0.379 | 35 | 33 |
| 23510 | Cancer care / oncology | 0.176 | 0.157 | 51 | 56 |
| 23510 | Urgent care & emergency | 0.717 | 0.869 | 28 | 13 |
| 24016 | Primary care / family doctor | 8.387 | 12.961 | 12 | 0 |
| 24016 | Mental health & counseling | 8.387 | 12.240 | 41 | 14 |
| 24016 | Heart / cardiology | 0.477 | 0.459 | 15 | 18 |
| 24016 | Cancer care / oncology | 0.214 | 0.150 | 40 | 58 |
| 24016 | Urgent care & emergency | 0.949 | 1.556 | 5 | 0 |
| 22903 | Primary care / family doctor | 5.692 | 7.574 | 40 | 21 |
| 22903 | Mental health & counseling | 10.305 | 12.251 | 28 | 14 |
| 22903 | Heart / cardiology | 0.564 | 0.508 | 0 | 10 |
| 22903 | Cancer care / oncology | 0.079 | 0.120 | 78 | 66 |
| 22903 | Urgent care & emergency | 0.208 | 0.242 | 79 | 76 |
| 24201 | Primary care / family doctor | 5.771 | 7.108 | 40 | 26 |
| 24201 | Mental health & counseling | 4.228 | 3.968 | 70 | 72 |
| 24201 | Heart / cardiology | 0.187 | 0.357 | 67 | 36 |
| 24201 | Cancer care / oncology | 0.131 | 0.172 | 63 | 52 |
| 24201 | Urgent care & emergency | 0.430 | 0.524 | 57 | 47 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 35200 rows (ZIP x specialty) stored in access_e2sfca for VA; market-score now uses drive-time access for these ZIPs.
