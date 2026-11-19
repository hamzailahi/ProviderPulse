# E2SFCA access dry run: Nevada

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 879; in Nevada: 172
- Drive times: OSRM on OpenStreetMap roads (car profile), 879 x 879 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 440,253; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.91 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.27), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 8; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (93513, 95910, 95981)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83211 | no | none | 0% | 2.12 | 100% | yes (1.74) |
| 89511 | yes | 27.79 | 100% | 4.18 | 100% | yes (2.15) |
| 93424 | no | 7.88 | 100% | 2.82 | 100% | yes (1.60) |
| 93513 | no | 7.60 | 100% | 7.60 | 100% | no |
| 95310 | no | 7.78 | 100% | 4.80 | 100% | yes (2.11) |
| 95910 | no | 8.19 | 100% | 8.19 | 100% | no |
| 95959 | no | 7.32 | 100% | 4.67 | 100% | yes (1.54) |
| 95981 | no | 8.99 | 100% | 8.99 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 41,897 | 4.78 | 0.78 | 55 of 172 | 89424 (-66), 89828 (-35), 89020 (-34) | 89451 (+72), 89427 (+63), 89704 (+57) |
| Pediatrics (children) | 30 | 10,567 | 1.13 | 0.85 | 22 of 172 | 89020 (-48), 89502 (-13), 89102 (-11) | 89161 (+39), 89451 (+34), 89521 (+33) |
| Women's health / OB-GYN | 60 | 5,173 | 0.55 | 0.89 | 28 of 172 | 89701 (-23), 89156 (-15), 89011 (-14) | 89019 (+57), 89451 (+57), 89135 (+44) |
| Mental health & counseling | 30 | 97,317 | 7.13 | 0.87 | 67 of 172 | 89124 (-58), 89496 (-42), 89823 (-40) | 89521 (+64), 89191 (+58), 89135 (+57) |
| Dental | 30 | 19,717 | 1.64 | 0.80 | 57 of 172 | 89424 (-35), 89701 (-28), 89511 (-26) | 89427 (+100), 89451 (+89), 89704 (+70) |
| Eye care | 30 | 5,877 | 0.65 | 0.79 | 47 of 172 | 89040 (-45), 89431 (-21), 89102 (-16) | 89704 (+99), 89451 (+84), 89402 (+63) |
| Chiropractic | 30 | 5,599 | 0.64 | 0.83 | 37 of 172 | 89040 (-31), 89511 (-27), 89048 (-20) | 89704 (+61), 89319 (+48), 89039 (+43) |
| Physical & occupational therapy | 30 | 18,788 | 2.73 | 0.74 | 46 of 172 | 89828 (-63), 89424 (-39), 89511 (-34) | 89704 (+50), 89823 (+49), 89026 (+44) |
| Orthopedics & sports injury | 60 | 2,988 | 0.42 | 0.87 | 23 of 172 | 89701 (-20), 89086 (-15), 89501 (-13) | 89025 (+68), 89019 (+50), 89447 (+50) |
| Heart / cardiology | 60 | 2,202 | 0.28 | 0.87 | 38 of 172 | 89011 (-27), 89506 (-27), 89086 (-20) | 89451 (+67), 89402 (+65), 89135 (+58) |
| Skin / dermatology | 60 | 942 | 0.10 | 0.87 | 31 of 172 | 89436 (-39), 89703 (-34), 89506 (-26) | 89403 (+85), 89410 (+61), 89161 (+52) |
| Allergy & immunology | 60 | 270 | 0.03 | 0.79 | 21 of 172 | 89701 (-31), 89413 (-27), 89178 (-19) | 89402 (+67), 89706 (+51), 89026 (+48) |
| Lung, breathing & sleep | 60 | 1,498 | 0.14 | 0.89 | 40 of 172 | 89156 (-42), 89011 (-23), 89178 (-23) | 89135 (+73), 89451 (+64), 89440 (+56) |
| Digestive / gastroenterology | 60 | 1,002 | 0.13 | 0.84 | 31 of 172 | 89506 (-22), 89431 (-21), 89441 (-20) | 89402 (+72), 89019 (+69), 89451 (+61) |
| Kidney / nephrology | 60 | 1,083 | 0.12 | 0.87 | 52 of 172 | 89431 (-28), 89011 (-24), 89433 (-22) | 89135 (+74), 89451 (+70), 89007 (+68) |
| Diabetes & hormones | 60 | 534 | 0.07 | 0.82 | 46 of 172 | 89447 (-27), 89460 (-27), 89506 (-25) | 89019 (+99), 89402 (+69), 89161 (+67) |
| Cancer care / oncology | 90 | 1,460 | 0.18 | 0.88 | 36 of 172 | 89441 (-36), 89506 (-36), 89442 (-30) | 89451 (+54), 89440 (+51), 89019 (+50) |
| Arthritis / rheumatology | 60 | 343 | 0.04 | 0.88 | 31 of 172 | 89703 (-28), 89701 (-25), 89156 (-22) | 89026 (+44), 89410 (+42), 89511 (+42) |
| Brain & nerves / neurology | 60 | 2,221 | 0.24 | 0.92 | 52 of 172 | 89156 (-65), 89011 (-57), 89178 (-55) | 89135 (+73), 89451 (+64), 89402 (+61) |
| Ear, nose & throat | 60 | 548 | 0.08 | 0.89 | 30 of 172 | 89506 (-27), 89441 (-26), 89086 (-17) | 89402 (+70), 89451 (+46), 89511 (+39) |
| Urology | 60 | 624 | 0.08 | 0.90 | 27 of 172 | 89431 (-39), 89433 (-30), 89506 (-29) | 89402 (+54), 89019 (+45), 89448 (+44) |
| Foot & ankle / podiatry | 60 | 1,389 | 0.16 | 0.82 | 22 of 172 | 89086 (-19), 89431 (-13), 89501 (-13) | 89403 (+67), 89135 (+53), 89007 (+50) |
| Pain management | 60 | 1,052 | 0.09 | 0.86 | 50 of 172 | 89156 (-36), 89431 (-32), 89115 (-27) | 89019 (+99), 89135 (+78), 89402 (+68) |
| Plastic & reconstructive surgery | 90 | 840 | 0.07 | 0.86 | 59 of 172 | 89156 (-38), 89086 (-37), 89701 (-37) | 89135 (+54), 89704 (+49), 89439 (+47) |
| Speech & language therapy | 30 | 5,414 | 0.87 | 0.76 | 31 of 172 | 89828 (-95), 89501 (-20), 89510 (-20) | 89823 (+100), 89704 (+46), 89429 (+42) |
| Nutrition & dietitian | 30 | 2,752 | 0.32 | 0.78 | 43 of 172 | 89124 (-79), 89703 (-37), 89701 (-30) | 89496 (+100), 89704 (+83), 89429 (+80) |
| Acupuncture, massage & naturopathy | 30 | 4,318 | 0.50 | 0.81 | 35 of 172 | 89511 (-37), 89431 (-24), 89703 (-21) | 89448 (+51), 89449 (+48), 89704 (+42) |
| Urgent care & emergency | 30 | 4,568 | 0.50 | 0.73 | 69 of 172 | 89005 (-45), 89413 (-39), 89431 (-39) | 89446 (+100), 89496 (+100), 89418 (+64) |
| Imaging & lab | 60 | 4,680 | 0.55 | 0.86 | 31 of 172 | 89442 (-67), 89424 (-52), 89020 (-27) | 89496 (+100), 89135 (+38), 89511 (+33) |
| Pharmacy | 30 | 15,683 | 1.68 | 0.76 | 47 of 172 | 89424 (-63), 89410 (-48), 89020 (-30) | 89440 (+49), 89427 (+47), 89039 (+45) |
| Home health & in-home care | 30 | 53,835 | 1.49 | 0.84 | 41 of 172 | 89424 (-71), 89046 (-59), 89029 (-22) | 89026 (+100), 89124 (+100), 89409 (+100) |
| Nursing & assisted living | 60 | 4,073 | 0.37 | 0.85 | 30 of 172 | 89442 (-67), 89424 (-28), 89002 (-15) | 89402 (+53), 89418 (+45), 89135 (+43) |
| Medical equipment & supplies | 60 | 3,428 | 0.34 | 0.88 | 36 of 172 | 89161 (-24), 89040 (-16), 89115 (-14) | 89403 (+70), 89135 (+54), 89402 (+54) |
| Hearing & audiology | 60 | 1,537 | 0.20 | 0.78 | 35 of 172 | 89161 (-28), 89040 (-27), 89027 (-22) | 89451 (+53), 89135 (+46), 89124 (+40) |
| Behavior therapy (ABA) | 30 | 71,544 | 2.58 | 0.87 | 49 of 172 | 89020 (-48), 89428 (-16), 89005 (-15) | 89828 (+100), 89135 (+90), 89004 (+79) |
| Care coordination & community health | 30 | 19,332 | 1.55 | 0.85 | 47 of 172 | 89124 (-79), 89424 (-66), 89429 (-63) | 89521 (+62), 89508 (+54), 89441 (+53) |
| General surgery | 60 | 3,000 | 0.39 | 0.88 | 41 of 172 | 89011 (-21), 89086 (-20), 89506 (-19) | 89019 (+62), 89451 (+57), 89402 (+53) |
| Infectious disease | 90 | 403 | 0.06 | 0.86 | 60 of 172 | 89011 (-34), 89701 (-31), 89070 (-30) | 89511 (+57), 89440 (+55), 89521 (+48) |
| Genetics & genetic counseling | 90 | 272 | 0.03 | 0.88 | 61 of 172 | 89011 (-31), 89428 (-30), 89441 (-30) | 89019 (+83), 89511 (+52), 89161 (+50) |
| Hospice & palliative care | 60 | 4,180 | 0.09 | 0.90 | 34 of 172 | 89086 (-72), 89115 (-64), 89085 (-51) | 89046 (+100), 89026 (+87), 89019 (+71) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
