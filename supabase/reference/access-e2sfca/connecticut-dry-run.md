# E2SFCA access dry run: Connecticut

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,086; in Connecticut: 285
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,086 x 2,086 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,073,480; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.31 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.29), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 11; re-anchored: 9; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (02535, 02543)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 01085 | no | 9.58 | 100% | 2.73 | 100% | yes (1.72) |
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 02535 | no | 2.72 | 8% | 2.72 | 8% | no |
| 02543 | no | 2.72 | 8% | 2.72 | 8% | no |
| 02872 | no | 10.65 | 100% | 2.96 | 100% | yes (2.37) |
| 06390 | yes | 9.18 | 100% | 2.85 | 100% | yes (2.83) |
| 07311 | no | 9.93 | 100% | 3.91 | 100% | yes (1.27) |
| 07632 | no | 11.39 | 100% | 2.51 | 100% | yes (1.77) |
| 07663 | no | 8.86 | 100% | 2.67 | 100% | yes (0.87) |
| 10004 | no | 11.24 | 100% | 2.57 | 100% | yes (1.47) |
| 10044 | no | 12.53 | 100% | 4.85 | 100% | yes (0.53) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 135,035 | 4.78 | 0.72 | 95 of 285 | 06103 (-28), 06410 (-26), 06467 (-25) | 06073 (+52), 06405 (+47), 06414 (+43) |
| Pediatrics (children) | 30 | 46,049 | 1.13 | 0.80 | 81 of 285 | 06410 (-38), 06467 (-32), 06066 (-19) | 06424 (+87), 06073 (+85), 06414 (+81) |
| Women's health / OB-GYN | 60 | 18,066 | 0.55 | 0.51 | 128 of 285 | 06457 (-33), 06459 (-32), 06332 (-31) | 06069 (+56), 06405 (+54), 06796 (+49) |
| Mental health & counseling | 30 | 255,609 | 7.13 | 0.59 | 124 of 285 | 06385 (-35), 06410 (-35), 06320 (-33) | 06073 (+73), 06414 (+66), 06370 (+61) |
| Dental | 30 | 50,366 | 1.64 | 0.69 | 113 of 285 | 06467 (-27), 06062 (-25), 06103 (-25) | 06073 (+49), 06022 (+45), 06883 (+45) |
| Eye care | 30 | 19,483 | 0.65 | 0.65 | 112 of 285 | 06360 (-37), 06467 (-33), 06389 (-31) | 06022 (+62), 06073 (+57), 06019 (+55) |
| Chiropractic | 30 | 13,910 | 0.64 | 0.70 | 71 of 285 | 06103 (-24), 06467 (-20), 06062 (-17) | 06783 (+42), 06079 (+41), 06414 (+40) |
| Physical & occupational therapy | 30 | 95,232 | 2.73 | 0.54 | 110 of 285 | 06103 (-39), 06467 (-32), 06062 (-31) | 06414 (+72), 06424 (+57), 06456 (+55) |
| Orthopedics & sports injury | 60 | 10,706 | 0.42 | 0.34 | 140 of 285 | 06374 (-36), 06702 (-36), 06708 (-32) | 06247 (+74), 06235 (+63), 06278 (+63) |
| Heart / cardiology | 60 | 10,052 | 0.28 | 0.63 | 148 of 285 | 06770 (-53), 06702 (-52), 06410 (-49) | 06001 (+53), 06831 (+50), 06073 (+49) |
| Skin / dermatology | 60 | 3,727 | 0.10 | 0.63 | 158 of 285 | 06410 (-52), 06467 (-49), 06444 (-42) | 06753 (+87), 06754 (+74), 06022 (+69) |
| Allergy & immunology | 60 | 1,280 | 0.03 | 0.66 | 179 of 285 | 06450 (-60), 06457 (-59), 06459 (-59) | 06751 (+64), 06370 (+60), 06371 (+59) |
| Lung, breathing & sleep | 60 | 3,975 | 0.14 | 0.53 | 171 of 285 | 06426 (-43), 06475 (-43), 06409 (-42) | 06254 (+69), 06370 (+62), 06350 (+58) |
| Digestive / gastroenterology | 60 | 4,973 | 0.13 | 0.63 | 165 of 285 | 06702 (-59), 06708 (-52), 06710 (-45) | 06058 (+77), 06098 (+68), 06090 (+64) |
| Kidney / nephrology | 60 | 3,156 | 0.12 | 0.63 | 120 of 285 | 06475 (-37), 06410 (-36), 06426 (-36) | 06405 (+57), 06471 (+52), 06460 (+46) |
| Diabetes & hormones | 60 | 2,916 | 0.07 | 0.57 | 185 of 285 | 06410 (-77), 06498 (-74), 06409 (-70) | 06370 (+59), 06022 (+58), 06390 (+58) |
| Cancer care / oncology | 90 | 6,279 | 0.18 | 0.68 | 185 of 285 | 06417 (-48), 06409 (-47), 06498 (-46) | 06089 (+51), 06405 (+49), 06471 (+46) |
| Arthritis / rheumatology | 60 | 1,523 | 0.04 | 0.55 | 188 of 285 | 06708 (-57), 06072 (-55), 06702 (-54) | 06024 (+77), 06370 (+61), 06069 (+58) |
| Brain & nerves / neurology | 60 | 8,164 | 0.24 | 0.66 | 163 of 285 | 06410 (-47), 06467 (-45), 06444 (-42) | 06089 (+59), 06807 (+58), 06878 (+52) |
| Ear, nose & throat | 60 | 2,111 | 0.08 | 0.48 | 157 of 285 | 06450 (-51), 06451 (-49), 06459 (-45) | 06796 (+68), 06870 (+63), 06022 (+61) |
| Urology | 60 | 2,611 | 0.08 | 0.48 | 162 of 285 | 06410 (-51), 06702 (-44), 06787 (-43) | 06031 (+80), 06039 (+71), 06754 (+71) |
| Foot & ankle / podiatry | 60 | 6,858 | 0.16 | 0.65 | 117 of 285 | 06332 (-35), 06374 (-34), 06239 (-33) | 06753 (+61), 06796 (+54), 06019 (+51) |
| Pain management | 60 | 2,829 | 0.09 | 0.72 | 78 of 285 | 06750 (-22), 06784 (-20), 06456 (-19) | 06031 (+85), 06796 (+83), 06069 (+80) |
| Plastic & reconstructive surgery | 90 | 2,342 | 0.07 | 0.67 | 192 of 285 | 06410 (-46), 06467 (-38), 06444 (-36) | 06019 (+71), 06022 (+71), 06419 (+63) |
| Speech & language therapy | 30 | 32,340 | 0.87 | 0.71 | 59 of 285 | 06062 (-24), 06103 (-24), 06467 (-21) | 06870 (+42), 06022 (+39), 06455 (+37) |
| Nutrition & dietitian | 30 | 11,340 | 0.32 | 0.70 | 107 of 285 | 06467 (-32), 06103 (-29), 06119 (-29) | 06018 (+89), 06079 (+83), 06414 (+61) |
| Acupuncture, massage & naturopathy | 30 | 14,800 | 0.50 | 0.66 | 70 of 285 | 06103 (-25), 06374 (-25), 06467 (-22) | 06414 (+57), 06439 (+45), 06883 (+44) |
| Urgent care & emergency | 30 | 13,802 | 0.50 | 0.68 | 78 of 285 | 06068 (-36), 06410 (-33), 06753 (-27) | 06031 (+77), 06370 (+52), 06390 (+51) |
| Imaging & lab | 60 | 15,747 | 0.55 | 0.62 | 131 of 285 | 06410 (-52), 06702 (-49), 06706 (-48) | 06405 (+42), 06831 (+39), 06073 (+37) |
| Pharmacy | 30 | 50,267 | 1.68 | 0.71 | 83 of 285 | 06103 (-28), 06467 (-27), 06410 (-23) | 06405 (+48), 06370 (+42), 06073 (+41) |
| Home health & in-home care | 30 | 14,510 | 1.49 | 0.80 | 13 of 285 | 06103 (-15), 06062 (-11), 06105 (-11) | 06035 (+22), 06073 (+22), 06090 (+22) |
| Nursing & assisted living | 60 | 5,734 | 0.37 | 0.50 | 66 of 285 | 06103 (-22), 06702 (-19), 06242 (-18) | 06754 (+72), 06069 (+68), 06783 (+63) |
| Medical equipment & supplies | 60 | 8,476 | 0.34 | 0.56 | 77 of 285 | 06384 (-27), 06467 (-20), 06374 (-19) | 06058 (+46), 06414 (+43), 06098 (+42) |
| Hearing & audiology | 60 | 4,798 | 0.20 | 0.51 | 100 of 285 | 06374 (-38), 06447 (-33), 06384 (-30) | 06242 (+68), 06371 (+62), 06357 (+56) |
| Behavior therapy (ABA) | 30 | 37,356 | 2.58 | 0.81 | 43 of 285 | 06374 (-25), 06332 (-23), 06103 (-21) | 06035 (+66), 06093 (+64), 06092 (+63) |
| Care coordination & community health | 30 | 48,526 | 1.55 | 0.74 | 62 of 285 | 06062 (-26), 06103 (-21), 06450 (-19) | 06798 (+55), 06795 (+49), 06478 (+47) |
| General surgery | 60 | 11,762 | 0.39 | 0.58 | 189 of 285 | 06702 (-52), 06410 (-51), 06072 (-49) | 06370 (+66), 06350 (+65), 06254 (+64) |
| Infectious disease | 90 | 2,330 | 0.06 | 0.50 | 220 of 285 | 06778 (-53), 06061 (-51), 06469 (-51) | 06069 (+78), 06350 (+67), 06753 (+67) |
| Genetics & genetic counseling | 90 | 1,179 | 0.03 | 0.67 | 209 of 285 | 06410 (-64), 06467 (-64), 06444 (-62) | 06021 (+65), 06022 (+62), 06019 (+60) |
| Hospice & palliative care | 60 | 1,017 | 0.09 | 0.57 | 28 of 285 | 06410 (-19), 06027 (-15), 06069 (-15) | 06060 (+35), 06024 (+33), 06068 (+26) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
