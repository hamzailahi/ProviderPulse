# E2SFCA access dry run: Oregon

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 782; in Oregon: 414
- Drive times: OSRM on OpenStreetMap roads (car profile), 782 x 782 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 241,855; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.26 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.16), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 4; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (97842)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 97842 | yes | 9.86 | 100% | 9.86 | 100% | no |
| 98303 | no | 8.28 | 100% | 2.69 | 100% | yes (2.51) |
| 98533 | no | 8.19 | 100% | 3.90 | 100% | yes (3.10) |
| 98603 | no | 9.97 | 100% | 2.90 | 100% | yes (4.10) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 26,520 | 4.78 | 0.50 | 239 of 413 | 97039 (-71), 97417 (-46), 97731 (-42) | 97626 (+100), 97001 (+77), 97446 (+66) |
| Pediatrics (children) | 30 | 5,282 | 1.13 | 0.67 | 177 of 413 | 97492 (-69), 97731 (-55), 97438 (-46) | 97753 (+66), 97217 (+57), 97007 (+55) |
| Women's health / OB-GYN | 60 | 4,613 | 0.55 | 0.79 | 176 of 413 | 97634 (-76), 97020 (-73), 97348 (-69) | 97624 (+100), 97065 (+92), 97877 (+88) |
| Mental health & counseling | 30 | 73,067 | 7.13 | 0.58 | 233 of 413 | 97051 (-51), 97818 (-48), 97741 (-38) | 97029 (+100), 97326 (+100), 97357 (+100) |
| Dental | 30 | 12,301 | 1.64 | 0.61 | 265 of 413 | 97761 (-52), 97830 (-50), 97526 (-49) | 97041 (+89), 97446 (+79), 97040 (+78) |
| Eye care | 30 | 3,826 | 0.65 | 0.57 | 261 of 413 | 97526 (-45), 97470 (-41), 97845 (-40) | 97144 (+100), 97125 (+99), 97109 (+98) |
| Chiropractic | 30 | 5,429 | 0.64 | 0.66 | 243 of 413 | 97417 (-57), 97828 (-48), 97470 (-47) | 97627 (+100), 97753 (+100), 97041 (+87) |
| Physical & occupational therapy | 30 | 15,935 | 2.73 | 0.66 | 213 of 413 | 97365 (-37), 97031 (-35), 97209 (-32) | 97753 (+81), 97342 (+78), 97841 (+70) |
| Orthopedics & sports injury | 60 | 2,258 | 0.42 | 0.75 | 135 of 413 | 97444 (-69), 97448 (-52), 97327 (-43) | 97627 (+93), 97370 (+80), 97624 (+70) |
| Heart / cardiology | 60 | 1,059 | 0.28 | 0.77 | 106 of 413 | 97634 (-43), 97020 (-38), 97070 (-37) | 97624 (+87), 97503 (+70), 97520 (+67) |
| Skin / dermatology | 60 | 503 | 0.10 | 0.80 | 139 of 413 | 97020 (-54), 97348 (-51), 97448 (-42) | 97753 (+91), 97918 (+74), 97029 (+70) |
| Allergy & immunology | 60 | 123 | 0.03 | 0.78 | 107 of 413 | 97634 (-63), 97701 (-47), 97448 (-46) | 97624 (+100), 97487 (+70), 97446 (+65) |
| Lung, breathing & sleep | 60 | 673 | 0.14 | 0.78 | 143 of 413 | 97020 (-55), 97467 (-50), 97070 (-49) | 97004 (+76), 97503 (+74), 97022 (+71) |
| Digestive / gastroenterology | 60 | 623 | 0.13 | 0.89 | 100 of 413 | 97020 (-60), 97032 (-40), 97348 (-37) | 97438 (+85), 97489 (+82), 97004 (+76) |
| Kidney / nephrology | 60 | 467 | 0.12 | 0.79 | 123 of 413 | 97020 (-38), 97352 (-28), 97032 (-27) | 97357 (+66), 97438 (+62), 97839 (+62) |
| Diabetes & hormones | 60 | 300 | 0.07 | 0.79 | 151 of 413 | 97761 (-54), 97020 (-47), 97348 (-47) | 97037 (+100), 97343 (+77), 97368 (+77) |
| Cancer care / oncology | 90 | 829 | 0.18 | 0.73 | 195 of 413 | 97444 (-71), 97020 (-57), 97106 (-52) | 97029 (+51), 97370 (+50), 97624 (+50) |
| Arthritis / rheumatology | 60 | 194 | 0.04 | 0.82 | 130 of 413 | 97348 (-61), 97020 (-53), 97448 (-50) | 97627 (+100), 97370 (+87), 97753 (+75) |
| Brain & nerves / neurology | 60 | 1,089 | 0.24 | 0.85 | 120 of 413 | 97020 (-61), 97070 (-47), 97032 (-41) | 97438 (+73), 97489 (+64), 97446 (+58) |
| Ear, nose & throat | 60 | 416 | 0.08 | 0.77 | 174 of 413 | 97020 (-70), 97002 (-66), 97502 (-50) | 97029 (+100), 97824 (+100), 97050 (+87) |
| Urology | 60 | 404 | 0.08 | 0.76 | 152 of 413 | 97348 (-67), 97020 (-46), 97365 (-39) | 97029 (+100), 97370 (+99), 97429 (+90) |
| Foot & ankle / podiatry | 60 | 692 | 0.16 | 0.69 | 141 of 413 | 97761 (-61), 97411 (-55), 97634 (-48) | 97624 (+98), 97883 (+78), 97824 (+72) |
| Pain management | 60 | 417 | 0.09 | 0.84 | 88 of 413 | 97444 (-72), 97448 (-54), 97327 (-41) | 97627 (+100), 97503 (+81), 97040 (+79) |
| Plastic & reconstructive surgery | 90 | 301 | 0.07 | 0.78 | 146 of 413 | 97739 (-67), 97020 (-56), 97032 (-50) | 97627 (+61), 97753 (+58), 97370 (+52) |
| Speech & language therapy | 30 | 4,417 | 0.87 | 0.66 | 172 of 413 | 97390 (-80), 97039 (-77), 97453 (-57) | 97473 (+66), 97461 (+64), 97734 (+64) |
| Nutrition & dietitian | 30 | 2,142 | 0.32 | 0.60 | 233 of 413 | 97885 (-80), 97914 (-63), 97465 (-61) | 97446 (+88), 97626 (+87), 97370 (+79) |
| Acupuncture, massage & naturopathy | 30 | 15,860 | 0.50 | 0.57 | 189 of 413 | 97417 (-55), 97810 (-43), 97412 (-40) | 97017 (+100), 97029 (+100), 97041 (+100) |
| Urgent care & emergency | 30 | 2,600 | 0.50 | 0.38 | 256 of 413 | 97536 (-93), 97625 (-81), 97381 (-72) | 97624 (+100), 97626 (+100), 97864 (+100) |
| Imaging & lab | 60 | 2,412 | 0.55 | 0.79 | 138 of 413 | 97020 (-41), 97348 (-35), 97377 (-34) | 97624 (+69), 97753 (+65), 97029 (+53) |
| Pharmacy | 30 | 10,600 | 1.68 | 0.49 | 258 of 413 | 97001 (-86), 97823 (-68), 97480 (-62) | 97037 (+93), 97626 (+88), 97522 (+79) |
| Home health & in-home care | 30 | 4,285 | 1.49 | 0.55 | 101 of 413 | 97621 (-89), 97825 (-85), 97534 (-68) | 97751 (+100), 97874 (+64), 97001 (+46) |
| Nursing & assisted living | 60 | 2,183 | 0.37 | 0.58 | 191 of 413 | 97885 (-48), 97147 (-43), 97838 (-42) | 97817 (+100), 97343 (+90), 97884 (+81) |
| Medical equipment & supplies | 60 | 1,625 | 0.34 | 0.69 | 143 of 413 | 97846 (-43), 97348 (-39), 97838 (-34) | 97001 (+100), 97874 (+100), 97824 (+81) |
| Hearing & audiology | 60 | 1,387 | 0.20 | 0.74 | 183 of 413 | 97020 (-67), 97348 (-61), 97002 (-55) | 97029 (+100), 97824 (+100), 97624 (+92) |
| Behavior therapy (ABA) | 30 | 9,494 | 2.58 | 0.74 | 80 of 413 | 97350 (-91), 97357 (-62), 97462 (-44) | 97053 (+60), 97231 (+41), 97217 (+40) |
| Care coordination & community health | 30 | 16,858 | 1.55 | 0.49 | 234 of 413 | 97039 (-75), 97430 (-63), 97838 (-53) | 97029 (+100), 97040 (+100), 97048 (+100) |
| General surgery | 60 | 2,276 | 0.39 | 0.71 | 194 of 413 | 97634 (-71), 97348 (-63), 97020 (-60) | 97624 (+100), 97848 (+100), 97370 (+93) |
| Infectious disease | 90 | 209 | 0.06 | 0.75 | 167 of 413 | 97070 (-56), 97002 (-54), 97020 (-53) | 97029 (+79), 97438 (+66), 97489 (+61) |
| Genetics & genetic counseling | 90 | 159 | 0.03 | 0.68 | 136 of 413 | 97002 (-64), 97123 (-61), 97020 (-60) | 97438 (+63), 97489 (+59), 97886 (+47) |
| Hospice & palliative care | 60 | 414 | 0.09 | 0.68 | 145 of 413 | 97907 (-70), 97467 (-68), 97839 (-63) | 97122 (+100), 97406 (+100), 97620 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
