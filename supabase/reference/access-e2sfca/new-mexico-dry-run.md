# E2SFCA access dry run: New Mexico

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 609; in New Mexico: 339
- Drive times: OSRM on OpenStreetMap roads (car profile), 609 x 609 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 103,604; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.91 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.27), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 6; re-anchored: 4; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (87521, 87573)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 87510 | yes | 7.35 | 100% | 2.76 | 100% | yes (2.65) |
| 87512 | yes | 8.27 | 100% | 3.52 | 100% | yes (2.13) |
| 87521 | yes | 8.30 | 100% | 7.91 | 100% | no |
| 87522 | yes | 8.49 | 100% | 4.69 | 100% | yes (2.48) |
| 87573 | yes | 8.42 | 100% | 8.42 | 100% | no |
| 87579 | yes | 22.36 | 100% | 4.06 | 100% | yes (2.65) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 13,609 | 4.78 | 0.27 | 217 of 337 | 87553 (-76), 87530 (-69), 87734 (-69) | 87328 (+93), 87068 (+90), 87562 (+85) |
| Pediatrics (children) | 30 | 3,969 | 1.13 | 0.45 | 207 of 337 | 88028 (-67), 87049 (-63), 87832 (-60) | 87037 (+100), 87310 (+100), 87311 (+100) |
| Women's health / OB-GYN | 60 | 1,793 | 0.55 | 0.76 | 117 of 337 | 87531 (-63), 87527 (-54), 87560 (-42) | 87347 (+100), 87552 (+100), 87713 (+100) |
| Mental health & counseling | 30 | 22,646 | 7.13 | 0.48 | 195 of 337 | 87530 (-80), 87729 (-75), 87565 (-57) | 87569 (+100), 87713 (+100), 87724 (+100) |
| Dental | 30 | 4,592 | 1.64 | 0.45 | 194 of 337 | 87024 (-77), 87531 (-72), 87553 (-72) | 87320 (+100), 87562 (+100), 87310 (+89) |
| Eye care | 30 | 1,598 | 0.65 | 0.55 | 149 of 337 | 87034 (-80), 88002 (-54), 87505 (-52) | 87310 (+100), 87311 (+100), 87312 (+100) |
| Chiropractic | 30 | 1,306 | 0.64 | 0.55 | 145 of 337 | 88317 (-62), 87010 (-57), 88056 (-46) | 87552 (+100), 88020 (+100), 87562 (+97) |
| Physical & occupational therapy | 30 | 6,935 | 2.73 | 0.50 | 170 of 337 | 88354 (-90), 87539 (-62), 88028 (-60) | 87562 (+73), 88002 (+70), 87939 (+69) |
| Orthopedics & sports injury | 60 | 999 | 0.42 | 0.80 | 89 of 337 | 88024 (-35), 87571 (-30), 88027 (-29) | 88012 (+95), 87714 (+87), 87552 (+71) |
| Heart / cardiology | 60 | 553 | 0.28 | 0.78 | 63 of 337 | 87520 (-62), 87544 (-40), 88048 (-36) | 87552 (+83), 87562 (+77), 88047 (+65) |
| Skin / dermatology | 60 | 163 | 0.10 | 0.78 | 63 of 337 | 87544 (-49), 87513 (-37), 87415 (-36) | 87419 (+100), 87552 (+100), 87562 (+100) |
| Allergy & immunology | 60 | 78 | 0.03 | 0.85 | 75 of 337 | 87544 (-82), 87547 (-57), 87505 (-38) | 87552 (+100), 87562 (+100), 88043 (+100) |
| Lung, breathing & sleep | 60 | 374 | 0.14 | 0.79 | 88 of 337 | 88352 (-60), 87538 (-54), 87535 (-45) | 87347 (+100), 87583 (+100), 87326 (+85) |
| Digestive / gastroenterology | 60 | 235 | 0.13 | 0.87 | 48 of 337 | 88011 (-47), 88048 (-33), 88052 (-33) | 88008 (+73), 87413 (+65), 87552 (+57) |
| Kidney / nephrology | 60 | 370 | 0.12 | 0.74 | 109 of 337 | 87313 (-66), 87034 (-56), 88056 (-46) | 87347 (+100), 87552 (+100), 87562 (+100) |
| Diabetes & hormones | 60 | 168 | 0.07 | 0.73 | 81 of 337 | 87417 (-75), 87544 (-75), 87547 (-62) | 87017 (+100), 87515 (+100), 87528 (+100) |
| Cancer care / oncology | 90 | 275 | 0.18 | 0.75 | 59 of 337 | 88048 (-47), 88072 (-46), 87001 (-44) | 87552 (+79), 87562 (+58), 88350 (+53) |
| Arthritis / rheumatology | 60 | 102 | 0.04 | 0.86 | 59 of 337 | 88260 (-51), 87544 (-45), 87547 (-45) | 87044 (+100), 87552 (+100), 87562 (+100) |
| Brain & nerves / neurology | 60 | 410 | 0.24 | 0.76 | 66 of 337 | 87828 (-89), 87832 (-77), 87823 (-61) | 87552 (+97), 87562 (+93), 87753 (+64) |
| Ear, nose & throat | 60 | 135 | 0.08 | 0.84 | 58 of 337 | 88011 (-41), 87544 (-37), 87421 (-34) | 88267 (+92), 87552 (+84), 87562 (+78) |
| Urology | 60 | 157 | 0.08 | 0.80 | 83 of 337 | 87544 (-59), 87547 (-59), 88011 (-44) | 87552 (+100), 87562 (+92), 87044 (+90) |
| Foot & ankle / podiatry | 60 | 388 | 0.16 | 0.73 | 103 of 337 | 87034 (-67), 87544 (-64), 87547 (-42) | 87552 (+100), 87569 (+100), 87711 (+100) |
| Pain management | 60 | 226 | 0.09 | 0.87 | 57 of 337 | 88024 (-37), 88027 (-33), 87001 (-19) | 87552 (+100), 87562 (+99), 88012 (+95) |
| Plastic & reconstructive surgery | 90 | 121 | 0.07 | 0.71 | 64 of 337 | 88065 (-100), 88048 (-41), 88022 (-40) | 88038 (+100), 88039 (+100), 88051 (+100) |
| Speech & language therapy | 30 | 3,636 | 0.87 | 0.56 | 194 of 337 | 87575 (-72), 87732 (-62), 88053 (-55) | 87733 (+100), 88132 (+100), 88112 (+99) |
| Nutrition & dietitian | 30 | 726 | 0.32 | 0.57 | 137 of 337 | 87010 (-72), 87024 (-62), 87505 (-56) | 87320 (+100), 87328 (+100), 87714 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,009 | 0.50 | 0.58 | 177 of 337 | 88029 (-70), 87510 (-60), 87551 (-58) | 87029 (+100), 87044 (+100), 87513 (+100) |
| Urgent care & emergency | 30 | 1,803 | 0.50 | 0.46 | 175 of 337 | 87010 (-75), 87461 (-72), 87072 (-71) | 87005 (+100), 87007 (+100), 87014 (+100) |
| Imaging & lab | 60 | 1,177 | 0.55 | 0.72 | 101 of 337 | 88350 (-69), 88340 (-66), 88011 (-38) | 87520 (+100), 87551 (+100), 87575 (+100) |
| Pharmacy | 30 | 4,883 | 1.68 | 0.50 | 188 of 337 | 87517 (-69), 87505 (-52), 87034 (-51) | 87310 (+100), 87311 (+100), 87312 (+100) |
| Home health & in-home care | 30 | 2,293 | 1.49 | 0.58 | 126 of 337 | 87712 (-84), 87713 (-76), 87538 (-72) | 88112 (+58), 87005 (+51), 87049 (+48) |
| Nursing & assisted living | 60 | 1,025 | 0.37 | 0.64 | 132 of 337 | 88340 (-58), 88065 (-43), 87528 (-41) | 87728 (+100), 87935 (+100), 87939 (+100) |
| Medical equipment & supplies | 60 | 924 | 0.34 | 0.72 | 103 of 337 | 88044 (-41), 87901 (-26), 87327 (-23) | 87714 (+83), 87749 (+77), 87713 (+72) |
| Hearing & audiology | 60 | 622 | 0.20 | 0.81 | 97 of 337 | 87327 (-40), 87001 (-28), 87026 (-28) | 87552 (+100), 87820 (+100), 88350 (+100) |
| Behavior therapy (ABA) | 30 | 8,687 | 2.58 | 0.69 | 106 of 337 | 87581 (-84), 88118 (-83), 87031 (-46) | 87940 (+100), 88002 (+100), 88325 (+100) |
| Care coordination & community health | 30 | 8,835 | 1.55 | 0.52 | 185 of 337 | 87530 (-74), 88042 (-69), 87026 (-64) | 87006 (+100), 87007 (+100), 87014 (+100) |
| General surgery | 60 | 963 | 0.39 | 0.76 | 99 of 337 | 87531 (-36), 88048 (-36), 87034 (-35) | 87713 (+100), 87714 (+100), 87722 (+100) |
| Infectious disease | 90 | 94 | 0.06 | 0.78 | 64 of 337 | 87041 (-58), 87001 (-54), 88048 (-42) | 87731 (+100), 87552 (+90), 87543 (+67) |
| Genetics & genetic counseling | 90 | 62 | 0.03 | 0.75 | 47 of 337 | 87001 (-100), 87567 (-100), 87532 (-69) | 87552 (+75), 87044 (+52), 87031 (+50) |
| Hospice & palliative care | 60 | 266 | 0.09 | 0.71 | 104 of 337 | 88434 (-84), 88021 (-45), 88072 (-38) | 87315 (+100), 87711 (+100), 87713 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
