# E2SFCA access dry run: Nebraska

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,575; in Nebraska: 569
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,575 x 1,575 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 265,167; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.49 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.21), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 28,925 | 4.78 | 0.45 | 247 of 569 | 68821 (-85), 68622 (-71), 69022 (-56) | 68820 (+90), 69030 (+77), 69217 (+76) |
| Pediatrics (children) | 30 | 7,182 | 1.13 | 0.66 | 215 of 569 | 68778 (-61), 68786 (-59), 69210 (-45) | 69221 (+89), 68062 (+86), 68735 (+84) |
| Women's health / OB-GYN | 60 | 3,826 | 0.55 | 0.69 | 123 of 569 | 69360 (-66), 68304 (-57), 68366 (-56) | 69354 (+100), 69337 (+80), 69348 (+72) |
| Mental health & counseling | 30 | 51,684 | 7.13 | 0.67 | 190 of 569 | 69218 (-43), 68756 (-39), 68763 (-39) | 68725 (+90), 69354 (+82), 68820 (+76) |
| Dental | 30 | 11,281 | 1.64 | 0.45 | 264 of 569 | 69022 (-69), 69358 (-53), 69129 (-50) | 68711 (+100), 69219 (+100), 69221 (+100) |
| Eye care | 30 | 4,408 | 0.65 | 0.45 | 313 of 569 | 69027 (-66), 68756 (-62), 69045 (-55) | 68637 (+100), 68714 (+100), 69214 (+100) |
| Chiropractic | 30 | 5,889 | 0.64 | 0.46 | 328 of 569 | 68882 (-63), 68718 (-58), 69021 (-53) | 68637 (+100), 68711 (+100), 68725 (+100) |
| Physical & occupational therapy | 30 | 19,647 | 2.73 | 0.55 | 302 of 569 | 68759 (-70), 68783 (-62), 69022 (-49) | 68820 (+100), 68874 (+100), 68828 (+94) |
| Orthopedics & sports injury | 60 | 2,741 | 0.42 | 0.73 | 252 of 569 | 68858 (-87), 68844 (-76), 68644 (-64) | 68813 (+66), 68015 (+62), 68778 (+58) |
| Heart / cardiology | 60 | 1,344 | 0.28 | 0.70 | 172 of 569 | 68304 (-52), 68366 (-50), 68844 (-47) | 68335 (+82), 68964 (+82), 68935 (+78) |
| Skin / dermatology | 60 | 544 | 0.10 | 0.69 | 112 of 569 | 68304 (-60), 68366 (-58), 68349 (-48) | 68770 (+91), 68785 (+91), 69354 (+63) |
| Allergy & immunology | 60 | 190 | 0.03 | 0.69 | 99 of 569 | 68304 (-64), 68366 (-64), 68003 (-58) | 69030 (+100), 68785 (+81), 68770 (+80) |
| Lung, breathing & sleep | 60 | 760 | 0.14 | 0.68 | 132 of 569 | 68304 (-59), 68366 (-57), 69360 (-57) | 69216 (+87), 69337 (+69), 68820 (+68) |
| Digestive / gastroenterology | 60 | 670 | 0.13 | 0.67 | 111 of 569 | 68028 (-55), 68059 (-48), 68366 (-48) | 68785 (+88), 68770 (+87), 68741 (+78) |
| Kidney / nephrology | 60 | 599 | 0.12 | 0.67 | 218 of 569 | 68337 (-51), 68028 (-43), 68304 (-43) | 69219 (+100), 69354 (+89), 69216 (+85) |
| Diabetes & hormones | 60 | 350 | 0.07 | 0.69 | 196 of 569 | 68304 (-49), 68366 (-48), 68781 (-47) | 68746 (+100), 69354 (+96), 68777 (+77) |
| Cancer care / oncology | 90 | 1,036 | 0.18 | 0.57 | 331 of 569 | 69341 (-57), 69163 (-55), 69138 (-50) | 69032 (+88), 69358 (+71), 68372 (+68) |
| Arthritis / rheumatology | 60 | 224 | 0.04 | 0.66 | 143 of 569 | 69163 (-61), 68304 (-53), 69155 (-51) | 68770 (+90), 68785 (+85), 68820 (+69) |
| Brain & nerves / neurology | 60 | 1,765 | 0.24 | 0.73 | 99 of 569 | 68028 (-43), 68304 (-41), 68366 (-41) | 68770 (+88), 68785 (+87), 68741 (+79) |
| Ear, nose & throat | 60 | 494 | 0.08 | 0.66 | 244 of 569 | 68644 (-92), 68304 (-77), 68366 (-75) | 69354 (+100), 68952 (+94), 69348 (+88) |
| Urology | 60 | 446 | 0.08 | 0.69 | 239 of 569 | 68959 (-59), 68844 (-55), 68869 (-54) | 69030 (+100), 69354 (+100), 68952 (+94) |
| Foot & ankle / podiatry | 60 | 685 | 0.16 | 0.69 | 204 of 569 | 68777 (-80), 68726 (-62), 69221 (-61) | 68714 (+89), 69214 (+84), 68746 (+66) |
| Pain management | 60 | 420 | 0.09 | 0.71 | 176 of 569 | 68869 (-60), 68844 (-51), 68304 (-48) | 68785 (+77), 68770 (+76), 69354 (+70) |
| Plastic & reconstructive surgery | 90 | 327 | 0.07 | 0.60 | 143 of 569 | 68304 (-38), 68366 (-38), 68003 (-37) | 68785 (+85), 68770 (+84), 69145 (+69) |
| Speech & language therapy | 30 | 6,470 | 0.87 | 0.56 | 292 of 569 | 68930 (-51), 69044 (-48), 69045 (-43) | 68062 (+100), 68636 (+100), 68714 (+100) |
| Nutrition & dietitian | 30 | 2,315 | 0.32 | 0.64 | 240 of 569 | 69022 (-64), 68756 (-62), 68061 (-58) | 69030 (+100), 69166 (+100), 69212 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,338 | 0.50 | 0.76 | 50 of 569 | 69144 (-85), 69348 (-79), 68970 (-52) | 69121 (+83), 69038 (+45), 69218 (+45) |
| Urgent care & emergency | 30 | 3,254 | 0.50 | 0.43 | 236 of 569 | 68030 (-81), 68746 (-65), 68777 (-62) | 68725 (+100), 68735 (+100), 68755 (+100) |
| Imaging & lab | 60 | 2,958 | 0.55 | 0.65 | 166 of 569 | 69147 (-55), 68304 (-48), 68366 (-46) | 69354 (+100), 69348 (+80), 68820 (+75) |
| Pharmacy | 30 | 9,908 | 1.68 | 0.47 | 275 of 569 | 68420 (-69), 69022 (-52), 69021 (-40) | 69216 (+100), 69212 (+86), 68820 (+81) |
| Home health & in-home care | 30 | 40,720 | 1.49 | 0.34 | 68 of 569 | 69142 (-54), 68719 (-40), 69216 (-39) | 68711 (+100), 68759 (+100), 69026 (+100) |
| Nursing & assisted living | 60 | 3,874 | 0.37 | 0.35 | 152 of 569 | 68833 (-100), 68821 (-67), 68453 (-65) | 69030 (+100), 69121 (+100), 69148 (+100) |
| Medical equipment & supplies | 60 | 1,972 | 0.34 | 0.61 | 244 of 569 | 69027 (-83), 68959 (-74), 68304 (-68) | 69354 (+92), 69146 (+86), 68785 (+81) |
| Hearing & audiology | 60 | 1,530 | 0.20 | 0.68 | 300 of 569 | 68844 (-73), 68869 (-73), 68858 (-66) | 69357 (+100), 69358 (+100), 69354 (+93) |
| Behavior therapy (ABA) | 30 | 15,033 | 2.58 | 0.82 | 43 of 569 | 68069 (-44), 68028 (-39), 68064 (-30) | 68110 (+85), 68418 (+62), 68037 (+58) |
| Care coordination & community health | 30 | 8,989 | 1.55 | 0.64 | 145 of 569 | 69020 (-41), 68760 (-38), 68822 (-38) | 68725 (+100), 68746 (+100), 69151 (+100) |
| General surgery | 60 | 2,639 | 0.39 | 0.65 | 176 of 569 | 68304 (-59), 68366 (-57), 68003 (-50) | 69030 (+89), 69354 (+83), 68785 (+76) |
| Infectious disease | 90 | 308 | 0.06 | 0.59 | 165 of 569 | 68059 (-38), 68003 (-37), 68304 (-37) | 68358 (+82), 68110 (+54), 68820 (+49) |
| Genetics & genetic counseling | 90 | 246 | 0.03 | 0.63 | 125 of 569 | 68028 (-71), 68059 (-69), 68003 (-64) | 68110 (+43), 68113 (+42), 68372 (+38) |
| Hospice & palliative care | 60 | 552 | 0.09 | 0.68 | 296 of 569 | 68920 (-100), 68960 (-100), 68971 (-100) | 69354 (+100), 68040 (+82), 69146 (+81) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
