# E2SFCA access dry run: Idaho

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 686; in Idaho: 268
- Drive times: OSRM on OpenStreetMap roads (car profile), 686 x 686 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 109,429; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.24 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.10), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (83808, 84340, 97842)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83808 | yes | 9.88 | 100% | 9.88 | 100% | no |
| 84340 | no | 9.41 | 100% | 9.05 | 100% | yes (1.37) |
| 97842 | no | 9.86 | 100% | 9.86 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 14,892 | 4.78 | 0.34 | 168 of 267 | 83449 (-63), 83422 (-53), 83272 (-50) | 83842 (+100), 83629 (+93), 83217 (+82) |
| Pediatrics (children) | 30 | 2,295 | 1.13 | 0.54 | 118 of 267 | 83424 (-67), 83814 (-64), 83214 (-60) | 83631 (+100), 83629 (+84), 83428 (+72) |
| Women's health / OB-GYN | 60 | 1,681 | 0.55 | 0.62 | 97 of 267 | 83814 (-49), 83241 (-48), 83860 (-40) | 83604 (+100), 83629 (+100), 83631 (+100) |
| Mental health & counseling | 30 | 28,335 | 7.13 | 0.37 | 166 of 267 | 83422 (-54), 83851 (-50), 83648 (-44) | 83217 (+100), 83629 (+100), 83842 (+100) |
| Dental | 30 | 5,542 | 1.64 | 0.38 | 175 of 267 | 83537 (-66), 83234 (-59), 83450 (-55) | 83217 (+100), 83604 (+100), 83627 (+100) |
| Eye care | 30 | 2,003 | 0.65 | 0.43 | 165 of 267 | 83873 (-80), 83239 (-56), 83648 (-56) | 83236 (+100), 83427 (+88), 83468 (+88) |
| Chiropractic | 30 | 2,619 | 0.64 | 0.36 | 179 of 267 | 83420 (-67), 83332 (-64), 83318 (-50) | 83235 (+100), 83236 (+100), 83253 (+100) |
| Physical & occupational therapy | 30 | 9,966 | 2.73 | 0.43 | 171 of 267 | 83616 (-44), 83864 (-41), 83340 (-40) | 83217 (+100), 83428 (+100), 83631 (+100) |
| Orthopedics & sports injury | 60 | 1,816 | 0.42 | 0.58 | 108 of 267 | 83221 (-50), 83814 (-48), 83861 (-47) | 83217 (+100), 83327 (+100), 83428 (+100) |
| Heart / cardiology | 60 | 626 | 0.28 | 0.67 | 50 of 267 | 83814 (-52), 83221 (-41), 83815 (-29) | 83631 (+100), 83842 (+100), 83236 (+96) |
| Skin / dermatology | 60 | 272 | 0.10 | 0.75 | 61 of 267 | 83814 (-58), 83605 (-46), 83237 (-40) | 83327 (+100), 83333 (+100), 83428 (+100) |
| Allergy & immunology | 60 | 65 | 0.03 | 0.64 | 35 of 267 | 83302 (-35), 83687 (-29), 83814 (-29) | 83321 (+100), 83344 (+95), 83316 (+84) |
| Lung, breathing & sleep | 60 | 322 | 0.14 | 0.72 | 52 of 267 | 83814 (-46), 83340 (-35), 83353 (-31) | 83327 (+100), 83631 (+100), 83842 (+100) |
| Digestive / gastroenterology | 60 | 297 | 0.13 | 0.68 | 46 of 267 | 83814 (-63), 83340 (-46), 83642 (-38) | 83629 (+100), 83631 (+100), 83842 (+100) |
| Kidney / nephrology | 60 | 228 | 0.12 | 0.68 | 60 of 267 | 83814 (-53), 83854 (-35), 83815 (-31) | 83631 (+97), 83238 (+85), 83233 (+78) |
| Diabetes & hormones | 60 | 135 | 0.07 | 0.65 | 59 of 267 | 83642 (-49), 83544 (-39), 83709 (-33) | 83327 (+100), 83526 (+100), 83530 (+100) |
| Cancer care / oncology | 90 | 372 | 0.18 | 0.68 | 58 of 267 | 83523 (-52), 83541 (-50), 83535 (-45) | 83631 (+100), 83555 (+92), 83842 (+85) |
| Arthritis / rheumatology | 60 | 87 | 0.04 | 0.68 | 58 of 267 | 83440 (-43), 83421 (-39), 83605 (-31) | 83414 (+100), 83631 (+100), 83842 (+100) |
| Brain & nerves / neurology | 60 | 536 | 0.24 | 0.67 | 57 of 267 | 83522 (-74), 83814 (-59), 83604 (-52) | 83255 (+100), 83631 (+100), 83842 (+98) |
| Ear, nose & throat | 60 | 208 | 0.08 | 0.74 | 77 of 267 | 83340 (-59), 83814 (-42), 83237 (-40) | 83217 (+100), 83327 (+100), 83842 (+92) |
| Urology | 60 | 195 | 0.08 | 0.68 | 65 of 267 | 83814 (-65), 83340 (-63), 83302 (-38) | 83321 (+100), 83327 (+100), 83428 (+100) |
| Foot & ankle / podiatry | 60 | 378 | 0.16 | 0.59 | 95 of 267 | 83814 (-61), 83221 (-47), 83286 (-46) | 83217 (+100), 83842 (+100), 83236 (+89) |
| Pain management | 60 | 217 | 0.09 | 0.72 | 60 of 267 | 83221 (-59), 83814 (-53), 83203 (-36) | 83217 (+100), 83236 (+100), 83629 (+100) |
| Plastic & reconstructive surgery | 90 | 175 | 0.07 | 0.66 | 88 of 267 | 83221 (-73), 83455 (-57), 83352 (-55) | 83236 (+100), 83320 (+100), 83327 (+100) |
| Speech & language therapy | 30 | 2,376 | 0.87 | 0.53 | 124 of 267 | 83320 (-82), 83670 (-53), 83537 (-47) | 83217 (+92), 83414 (+80), 83321 (+77) |
| Nutrition & dietitian | 30 | 1,343 | 0.32 | 0.42 | 188 of 267 | 83813 (-93), 83420 (-61), 83522 (-61) | 83227 (+100), 83236 (+100), 83285 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,782 | 0.50 | 0.48 | 152 of 267 | 83610 (-72), 83549 (-67), 83404 (-55) | 83327 (+100), 83353 (+100), 83465 (+100) |
| Urgent care & emergency | 30 | 1,475 | 0.50 | 0.22 | 178 of 267 | 83549 (-67), 83436 (-66), 83404 (-63) | 83217 (+100), 83271 (+100), 83327 (+100) |
| Imaging & lab | 60 | 1,302 | 0.55 | 0.67 | 75 of 267 | 83221 (-31), 83646 (-27), 83203 (-26) | 83631 (+100), 83842 (+98), 83629 (+85) |
| Pharmacy | 30 | 5,712 | 1.68 | 0.36 | 173 of 267 | 83851 (-64), 83422 (-54), 83814 (-46) | 83629 (+100), 83631 (+100), 83842 (+100) |
| Home health & in-home care | 30 | 1,946 | 1.49 | 0.40 | 106 of 267 | 83542 (-90), 83286 (-67), 83555 (-55) | 83468 (+45), 83465 (+43), 83842 (+42) |
| Nursing & assisted living | 60 | 1,304 | 0.37 | 0.46 | 131 of 267 | 83537 (-82), 83623 (-45), 83544 (-40) | 83239 (+93), 83349 (+90), 83321 (+88) |
| Medical equipment & supplies | 60 | 987 | 0.34 | 0.55 | 112 of 267 | 83252 (-49), 83422 (-35), 83523 (-35) | 83285 (+100), 83555 (+98), 83217 (+94) |
| Hearing & audiology | 60 | 770 | 0.20 | 0.66 | 102 of 267 | 83276 (-56), 83422 (-56), 83452 (-54) | 83217 (+100), 83321 (+100), 83622 (+100) |
| Behavior therapy (ABA) | 30 | 4,916 | 2.58 | 0.64 | 35 of 267 | 83712 (-57), 83814 (-41), 83616 (-34) | 83631 (+65), 83629 (+51), 83810 (+51) |
| Care coordination & community health | 30 | 5,406 | 1.55 | 0.44 | 156 of 267 | 83873 (-70), 83851 (-62), 83622 (-58) | 83236 (+100), 83443 (+100), 83450 (+100) |
| General surgery | 60 | 1,102 | 0.39 | 0.56 | 110 of 267 | 83340 (-52), 83221 (-45), 83605 (-43) | 83327 (+100), 83629 (+100), 83631 (+100) |
| Infectious disease | 90 | 67 | 0.06 | 0.66 | 41 of 267 | 83605 (-32), 83651 (-30), 83669 (-30) | 83631 (+100), 83629 (+91), 83842 (+66) |
| Genetics & genetic counseling | 90 | 91 | 0.03 | 0.62 | 37 of 267 | 83651 (-73), 83605 (-69), 83656 (-67) | 83449 (+100), 83631 (+99), 83629 (+81) |
| Hospice & palliative care | 60 | 294 | 0.09 | 0.60 | 114 of 267 | 83286 (-62), 83452 (-59), 83422 (-52) | 83217 (+100), 83220 (+100), 83223 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
