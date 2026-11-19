# E2SFCA access dry run: Wyoming

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 558; in Wyoming: 158
- Drive times: OSRM on OpenStreetMap roads (car profile), 558 x 558 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 146,190; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.92 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.31), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 84014 | no | 9.19 | 100% | 2.77 | 100% | yes (1.87) |
| 84045 | no | 8.59 | 100% | 2.85 | 100% | yes (1.49) |
| 84062 | no | 9.29 | 100% | 2.37 | 100% | yes (2.90) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 16,905 | 4.78 | 0.39 | 93 of 158 | 82001 (-43), 83110 (-37), 82005 (-35) | 82516 (+100), 82636 (+89), 82725 (+84) |
| Pediatrics (children) | 30 | 3,685 | 1.13 | 0.52 | 56 of 158 | 82939 (-50), 82510 (-43), 82601 (-36) | 82938 (+95), 83011 (+87), 82725 (+82) |
| Women's health / OB-GYN | 60 | 2,145 | 0.55 | 0.75 | 50 of 158 | 83118 (-85), 82635 (-76), 82601 (-41) | 82831 (+90), 82059 (+78), 83011 (+76) |
| Mental health & counseling | 30 | 35,875 | 7.13 | 0.47 | 83 of 158 | 82081 (-74), 82411 (-49), 82510 (-40) | 82059 (+100), 82636 (+97), 82832 (+90) |
| Dental | 30 | 6,679 | 1.64 | 0.42 | 85 of 158 | 82324 (-57), 83110 (-46), 82601 (-40) | 82516 (+100), 82643 (+95), 82636 (+79) |
| Eye care | 30 | 2,452 | 0.65 | 0.40 | 88 of 158 | 83110 (-49), 82426 (-48), 82001 (-35) | 82410 (+100), 82432 (+100), 82434 (+100) |
| Chiropractic | 30 | 3,010 | 0.64 | 0.36 | 87 of 158 | 82053 (-88), 82223 (-47), 82426 (-47) | 82710 (+100), 82712 (+100), 83119 (+100) |
| Physical & occupational therapy | 30 | 11,021 | 2.73 | 0.44 | 89 of 158 | 83116 (-47), 82410 (-44), 82836 (-44) | 82637 (+100), 82922 (+100), 83011 (+100) |
| Orthopedics & sports injury | 60 | 1,980 | 0.42 | 0.65 | 67 of 158 | 83114 (-67), 82212 (-61), 83110 (-44) | 82055 (+100), 82637 (+100), 83011 (+100) |
| Heart / cardiology | 60 | 738 | 0.28 | 0.67 | 40 of 158 | 82635 (-100), 83014 (-80), 83110 (-50) | 82059 (+93), 82604 (+84), 82636 (+83) |
| Skin / dermatology | 60 | 396 | 0.10 | 0.66 | 39 of 158 | 82635 (-70), 82005 (-29), 82009 (-22) | 82081 (+100), 82637 (+100), 82710 (+100) |
| Allergy & immunology | 60 | 102 | 0.03 | 0.78 | 20 of 158 | 83001 (-29), 82644 (-28), 82727 (-28) | 82637 (+100), 82831 (+92), 83011 (+80) |
| Lung, breathing & sleep | 60 | 407 | 0.14 | 0.73 | 36 of 158 | 82073 (-89), 82635 (-71), 82053 (-43) | 82059 (+100), 82833 (+100), 82636 (+70) |
| Digestive / gastroenterology | 60 | 319 | 0.13 | 0.62 | 12 of 158 | 82635 (-100), 82601 (-29), 82644 (-29) | 82604 (+100), 82636 (+100), 82609 (+90) |
| Kidney / nephrology | 60 | 259 | 0.12 | 0.71 | 40 of 158 | 82635 (-49), 82601 (-48), 82727 (-33) | 82831 (+90), 82081 (+84), 82516 (+78) |
| Diabetes & hormones | 60 | 208 | 0.07 | 0.65 | 30 of 158 | 82073 (-31), 82053 (-25), 82001 (-24) | 83114 (+100), 83123 (+100), 82059 (+84) |
| Cancer care / oncology | 90 | 503 | 0.18 | 0.69 | 30 of 158 | 82440 (-42), 82516 (-28), 82082 (-25) | 82059 (+77), 82637 (+71), 82052 (+49) |
| Arthritis / rheumatology | 60 | 102 | 0.04 | 0.71 | 17 of 158 | 82005 (-23), 82609 (-21), 82073 (-20) | 82732 (+100), 82081 (+79), 82210 (+59) |
| Brain & nerves / neurology | 60 | 769 | 0.24 | 0.76 | 32 of 158 | 82635 (-30), 82005 (-29), 82601 (-26) | 82059 (+66), 82081 (+55), 82637 (+50) |
| Ear, nose & throat | 60 | 292 | 0.08 | 0.70 | 36 of 158 | 82727 (-89), 82604 (-37), 83001 (-27) | 82510 (+100), 82933 (+100), 82939 (+100) |
| Urology | 60 | 237 | 0.08 | 0.65 | 36 of 158 | 82635 (-87), 82601 (-50), 82644 (-35) | 83011 (+100), 83012 (+100), 83014 (+100) |
| Foot & ankle / podiatry | 60 | 567 | 0.16 | 0.69 | 46 of 158 | 83127 (-82), 83114 (-45), 83122 (-44) | 82649 (+100), 82710 (+100), 82412 (+88) |
| Pain management | 60 | 285 | 0.09 | 0.74 | 40 of 158 | 82635 (-94), 83110 (-50), 82007 (-43) | 82833 (+93), 82636 (+90), 82943 (+83) |
| Plastic & reconstructive surgery | 90 | 251 | 0.07 | 0.67 | 35 of 158 | 82635 (-74), 82601 (-41), 82639 (-41) | 83128 (+84), 82082 (+72), 83011 (+71) |
| Speech & language therapy | 30 | 2,781 | 0.87 | 0.34 | 98 of 158 | 82059 (-71), 82410 (-63), 82214 (-59) | 82450 (+95), 82643 (+95), 82938 (+92) |
| Nutrition & dietitian | 30 | 1,530 | 0.32 | 0.49 | 78 of 158 | 82063 (-59), 82072 (-43), 83127 (-43) | 82052 (+100), 82059 (+100), 82710 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,343 | 0.50 | 0.51 | 46 of 158 | 82070 (-31), 82009 (-16), 82601 (-16) | 82055 (+100), 82084 (+100), 82922 (+97) |
| Urgent care & emergency | 30 | 1,762 | 0.50 | 0.37 | 89 of 158 | 82217 (-75), 82214 (-60), 83110 (-53) | 82052 (+100), 82059 (+100), 82083 (+100) |
| Imaging & lab | 60 | 1,719 | 0.55 | 0.78 | 44 of 158 | 82635 (-92), 82601 (-32), 82644 (-32) | 82922 (+82), 82833 (+78), 82831 (+77) |
| Pharmacy | 30 | 5,278 | 1.68 | 0.38 | 83 of 158 | 83110 (-46), 82510 (-39), 82214 (-36) | 82210 (+100), 82081 (+95), 82059 (+92) |
| Home health & in-home care | 30 | 3,072 | 1.49 | 0.38 | 67 of 158 | 82922 (-86), 82944 (-79), 82729 (-39) | 82217 (+100), 82243 (+89), 82223 (+85) |
| Nursing & assisted living | 60 | 1,243 | 0.37 | 0.67 | 67 of 158 | 82732 (-71), 82635 (-55), 82601 (-39) | 82710 (+100), 82217 (+90), 82432 (+90) |
| Medical equipment & supplies | 60 | 1,261 | 0.34 | 0.73 | 62 of 158 | 82635 (-100), 82727 (-26), 83001 (-20) | 82059 (+100), 82710 (+100), 82833 (+100) |
| Hearing & audiology | 60 | 955 | 0.20 | 0.73 | 58 of 158 | 82635 (-67), 82053 (-41), 82727 (-39) | 82059 (+100), 82063 (+100), 82833 (+100) |
| Behavior therapy (ABA) | 30 | 13,229 | 2.58 | 0.48 | 26 of 158 | 82001 (-58), 82005 (-41), 82072 (-38) | 82052 (+77), 82059 (+76), 82725 (+43) |
| Care coordination & community health | 30 | 14,666 | 1.55 | 0.53 | 75 of 158 | 82217 (-81), 83110 (-58), 82411 (-56) | 82059 (+100), 82210 (+100), 82212 (+100) |
| General surgery | 60 | 1,215 | 0.39 | 0.67 | 50 of 158 | 82635 (-100), 83110 (-38), 82005 (-26) | 83011 (+100), 82636 (+94), 82922 (+91) |
| Infectious disease | 90 | 115 | 0.06 | 0.66 | 13 of 158 | 82635 (-100), 82639 (-51), 82712 (-17) | 82604 (+83), 82637 (+52), 82059 (+40) |
| Genetics & genetic counseling | 90 | 131 | 0.03 | 0.74 | 13 of 158 | 83014 (-43), 83025 (-29), 82052 (-24) | 83011 (+83), 82055 (+66), 82637 (+57) |
| Hospice & palliative care | 60 | 349 | 0.09 | 0.73 | 51 of 158 | 82635 (-97), 82601 (-35), 82644 (-35) | 82510 (+100), 82512 (+100), 82649 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 6320 rows (ZIP x specialty) stored in access_e2sfca for WY; market-score now uses drive-time access for these ZIPs.
