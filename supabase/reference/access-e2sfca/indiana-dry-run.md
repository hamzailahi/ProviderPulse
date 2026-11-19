# E2SFCA access dry run: Indiana

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,567; in Indiana: 773
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,567 x 2,567 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 695,068; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.90 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.24), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 47104 | yes | 7.94 | 100% | 4.99 | 100% | yes (1.57) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 98,564 | 4.78 | 0.58 | 308 of 773 | 47403 (-41), 47708 (-35), 47561 (-32) | 46763 (+81), 47610 (+71), 46723 (+70) |
| Pediatrics (children) | 30 | 25,514 | 1.13 | 0.71 | 181 of 773 | 47708 (-36), 47978 (-36), 47470 (-30) | 46763 (+91), 46241 (+77), 46180 (+67) |
| Women's health / OB-GYN | 60 | 10,819 | 0.55 | 0.64 | 274 of 773 | 46052 (-44), 46552 (-43), 47615 (-38) | 46058 (+67), 46763 (+59), 47634 (+51) |
| Mental health & counseling | 30 | 145,118 | 7.13 | 0.69 | 172 of 773 | 47405 (-27), 47403 (-26), 47406 (-26) | 46340 (+59), 47982 (+58), 47459 (+56) |
| Dental | 30 | 32,558 | 1.64 | 0.65 | 272 of 773 | 46929 (-39), 47337 (-30), 47443 (-29) | 46076 (+55), 46045 (+50), 46936 (+50) |
| Eye care | 30 | 14,272 | 0.65 | 0.60 | 364 of 773 | 47042 (-54), 46996 (-46), 47567 (-44) | 47459 (+100), 47468 (+88), 47866 (+83) |
| Chiropractic | 30 | 13,131 | 0.64 | 0.52 | 301 of 773 | 46996 (-71), 46929 (-57), 47952 (-49) | 47590 (+95), 47564 (+94), 47519 (+90) |
| Physical & occupational therapy | 30 | 66,016 | 2.73 | 0.64 | 309 of 773 | 47137 (-65), 47978 (-47), 47174 (-44) | 46763 (+85), 47524 (+82), 47610 (+82) |
| Orthopedics & sports injury | 60 | 9,957 | 0.42 | 0.58 | 372 of 773 | 47842 (-75), 47882 (-68), 47648 (-66) | 46164 (+92), 46128 (+72), 46121 (+69) |
| Heart / cardiology | 60 | 5,885 | 0.28 | 0.66 | 385 of 773 | 46052 (-55), 47124 (-53), 47648 (-49) | 47320 (+79), 47373 (+77), 47336 (+73) |
| Skin / dermatology | 60 | 1,882 | 0.10 | 0.67 | 298 of 773 | 46176 (-44), 47164 (-43), 47620 (-43) | 47453 (+73), 47036 (+72), 47240 (+69) |
| Allergy & immunology | 60 | 733 | 0.03 | 0.66 | 344 of 773 | 47124 (-57), 46013 (-55), 46064 (-55) | 46936 (+80), 47462 (+68), 47338 (+66) |
| Lung, breathing & sleep | 60 | 2,543 | 0.14 | 0.65 | 301 of 773 | 47648 (-57), 47620 (-53), 47683 (-53) | 47320 (+55), 46165 (+52), 47849 (+52) |
| Digestive / gastroenterology | 60 | 2,682 | 0.13 | 0.65 | 328 of 773 | 46112 (-72), 46052 (-70), 47639 (-62) | 46128 (+90), 46121 (+81), 46180 (+73) |
| Kidney / nephrology | 60 | 2,591 | 0.12 | 0.60 | 404 of 773 | 47124 (-62), 47164 (-55), 47561 (-54) | 46150 (+71), 47574 (+69), 46165 (+68) |
| Diabetes & hormones | 60 | 1,316 | 0.07 | 0.66 | 338 of 773 | 47561 (-87), 46183 (-64), 47648 (-60) | 46128 (+83), 46121 (+75), 46076 (+74) |
| Cancer care / oncology | 90 | 3,775 | 0.18 | 0.40 | 535 of 773 | 46052 (-68), 46072 (-64), 46183 (-64) | 47320 (+84), 47336 (+80), 47373 (+80) |
| Arthritis / rheumatology | 60 | 860 | 0.04 | 0.71 | 322 of 773 | 46154 (-64), 46140 (-63), 46176 (-60) | 46127 (+79), 47225 (+78), 47453 (+75) |
| Brain & nerves / neurology | 60 | 4,715 | 0.24 | 0.68 | 279 of 773 | 46052 (-55), 47126 (-47), 47124 (-45) | 46706 (+61), 46936 (+61), 46710 (+50) |
| Ear, nose & throat | 60 | 1,524 | 0.08 | 0.57 | 425 of 773 | 47523 (-77), 47552 (-77), 47553 (-74) | 46128 (+82), 47330 (+78), 47341 (+75) |
| Urology | 60 | 1,777 | 0.08 | 0.59 | 433 of 773 | 46052 (-72), 46793 (-60), 47561 (-58) | 47462 (+76), 47006 (+66), 47320 (+64) |
| Foot & ankle / podiatry | 60 | 3,875 | 0.16 | 0.52 | 398 of 773 | 47532 (-69), 47523 (-60), 47552 (-60) | 47160 (+76), 46340 (+74), 47330 (+73) |
| Pain management | 60 | 1,792 | 0.09 | 0.66 | 359 of 773 | 47639 (-82), 47683 (-69), 47648 (-66) | 46766 (+86), 47110 (+78), 47142 (+75) |
| Plastic & reconstructive surgery | 90 | 1,249 | 0.07 | 0.43 | 429 of 773 | 47126 (-65), 47124 (-61), 47114 (-59) | 47330 (+84), 47521 (+84), 47527 (+83) |
| Speech & language therapy | 30 | 19,788 | 0.87 | 0.65 | 243 of 773 | 47515 (-60), 47929 (-54), 47137 (-47) | 47104 (+94), 46763 (+80), 47162 (+76) |
| Nutrition & dietitian | 30 | 6,624 | 0.32 | 0.69 | 276 of 773 | 47708 (-43), 47403 (-38), 47863 (-38) | 47225 (+92), 47459 (+90), 47982 (+89) |
| Acupuncture, massage & naturopathy | 30 | 5,208 | 0.50 | 0.73 | 38 of 773 | 46926 (-24), 47018 (-22), 47405 (-20) | 46725 (+39), 46799 (+39), 47459 (+37) |
| Urgent care & emergency | 30 | 10,275 | 0.50 | 0.59 | 326 of 773 | 47454 (-66), 47993 (-62), 47978 (-60) | 46241 (+89), 47453 (+89), 47336 (+85) |
| Imaging & lab | 60 | 11,248 | 0.55 | 0.61 | 296 of 773 | 46052 (-55), 46154 (-48), 46140 (-47) | 46725 (+63), 46799 (+57), 47320 (+57) |
| Pharmacy | 30 | 32,313 | 1.68 | 0.58 | 297 of 773 | 47454 (-40), 47042 (-39), 47708 (-35) | 46050 (+90), 46069 (+65), 47640 (+62) |
| Home health & in-home care | 30 | 23,919 | 1.49 | 0.76 | 74 of 773 | 46221 (-40), 46164 (-17), 47448 (-15) | 46075 (+56), 46077 (+56), 46130 (+55) |
| Nursing & assisted living | 60 | 7,399 | 0.37 | 0.37 | 353 of 773 | 47116 (-100), 47561 (-63), 47174 (-54) | 47585 (+65), 47574 (+64), 47470 (+63) |
| Medical equipment & supplies | 60 | 7,512 | 0.34 | 0.62 | 352 of 773 | 47633 (-56), 47882 (-50), 47561 (-48) | 47954 (+68), 46164 (+66), 47965 (+62) |
| Hearing & audiology | 60 | 4,363 | 0.20 | 0.55 | 457 of 773 | 47882 (-84), 47858 (-74), 47855 (-71) | 46173 (+72), 47849 (+67), 47327 (+64) |
| Behavior therapy (ABA) | 30 | 43,441 | 2.58 | 0.78 | 281 of 773 | 47708 (-58), 47355 (-57), 46072 (-56) | 47325 (+100), 47459 (+100), 47849 (+100) |
| Care coordination & community health | 30 | 33,340 | 1.55 | 0.65 | 122 of 773 | 46996 (-38), 47403 (-30), 46175 (-29) | 47923 (+85), 47975 (+75), 47929 (+69) |
| General surgery | 60 | 7,968 | 0.39 | 0.49 | 340 of 773 | 46052 (-76), 46923 (-68), 46041 (-63) | 46706 (+58), 46710 (+58), 46799 (+55) |
| Infectious disease | 90 | 1,094 | 0.06 | 0.52 | 428 of 773 | 46113 (-57), 47124 (-55), 46154 (-54) | 46128 (+71), 46706 (+69), 46710 (+68) |
| Genetics & genetic counseling | 90 | 748 | 0.03 | 0.44 | 427 of 773 | 46052 (-100), 46112 (-100), 46123 (-100) | 47601 (+72), 47634 (+71), 46741 (+70) |
| Hospice & palliative care | 60 | 1,131 | 0.09 | 0.63 | 339 of 773 | 47683 (-50), 47561 (-49), 47619 (-44) | 46340 (+77), 46348 (+69), 47616 (+68) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
