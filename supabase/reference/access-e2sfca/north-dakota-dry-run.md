# E2SFCA access dry run: North Dakota

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 638; in North Dakota: 370
- Drive times: OSRM on OpenStreetMap roads (car profile), 638 x 638 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 35,465; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.58 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.46), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 4,414 | 4.78 | 0.35 | 249 of 370 | 58853 (-72), 58575 (-58), 58793 (-57) | 58560 (+99), 58649 (+92), 58549 (+86) |
| Pediatrics (children) | 30 | 648 | 1.13 | 0.52 | 113 of 370 | 58250 (-87), 58564 (-82), 58654 (-80) | 58734 (+91), 58021 (+79), 58773 (+69) |
| Women's health / OB-GYN | 60 | 303 | 0.55 | 0.68 | 70 of 370 | 58757 (-88), 58036 (-38), 58079 (-29) | 58838 (+72), 58856 (+48), 58560 (+44) |
| Mental health & counseling | 30 | 6,009 | 7.13 | 0.44 | 140 of 370 | 58535 (-78), 58581 (-54), 58438 (-39) | 58351 (+100), 58382 (+100), 58569 (+100) |
| Dental | 30 | 1,319 | 1.64 | 0.34 | 226 of 370 | 58575 (-73), 58330 (-69), 58436 (-65) | 58620 (+87), 58759 (+86), 58735 (+84) |
| Eye care | 30 | 702 | 0.65 | 0.48 | 200 of 370 | 58257 (-66), 58474 (-66), 58538 (-66) | 58544 (+100), 58735 (+100), 58737 (+100) |
| Chiropractic | 30 | 1,152 | 0.64 | 0.37 | 256 of 370 | 58254 (-76), 58425 (-56), 58532 (-51) | 58001 (+100), 58004 (+100), 58006 (+100) |
| Physical & occupational therapy | 30 | 3,294 | 2.73 | 0.35 | 251 of 370 | 58475 (-72), 58645 (-69), 58632 (-66) | 58560 (+100), 58572 (+100), 58759 (+99) |
| Orthopedics & sports injury | 60 | 472 | 0.42 | 0.77 | 98 of 370 | 58079 (-67), 58015 (-64), 58251 (-57) | 58544 (+100), 58016 (+84), 58031 (+75) |
| Heart / cardiology | 60 | 104 | 0.28 | 0.66 | 37 of 370 | 58036 (-44), 58038 (-31), 58006 (-30) | 58560 (+68), 58042 (+41), 58005 (+37) |
| Skin / dermatology | 60 | 60 | 0.10 | 0.66 | 57 of 370 | 58036 (-45), 58018 (-41), 58001 (-39) | 58838 (+96), 58477 (+95), 58530 (+94) |
| Allergy & immunology | 60 | 19 | 0.03 | 0.71 | 48 of 370 | 58256 (-61), 58214 (-46), 58218 (-35) | 58731 (+53), 58718 (+50), 58725 (+49) |
| Lung, breathing & sleep | 60 | 84 | 0.14 | 0.67 | 60 of 370 | 58761 (-80), 58036 (-75), 58725 (-63) | 58782 (+94), 58752 (+92), 58363 (+76) |
| Digestive / gastroenterology | 60 | 49 | 0.13 | 0.70 | 41 of 370 | 58036 (-51), 58006 (-37), 58038 (-36) | 58560 (+61), 58004 (+45), 58005 (+41) |
| Kidney / nephrology | 60 | 71 | 0.12 | 0.67 | 97 of 370 | 58535 (-97), 58756 (-73), 58256 (-50) | 58520 (+100), 58757 (+100), 58552 (+89) |
| Diabetes & hormones | 60 | 81 | 0.07 | 0.73 | 116 of 370 | 58036 (-100), 58636 (-100), 58652 (-92) | 58540 (+100), 58641 (+100), 58757 (+100) |
| Cancer care / oncology | 90 | 109 | 0.18 | 0.55 | 107 of 370 | 58036 (-82), 58038 (-75), 58218 (-68) | 58838 (+67), 58560 (+52), 58735 (+36) |
| Arthritis / rheumatology | 60 | 12 | 0.04 | 0.64 | 24 of 370 | 58036 (-47), 58015 (-43), 58059 (-39) | 58042 (+48), 58021 (+37), 58477 (+37) |
| Brain & nerves / neurology | 60 | 120 | 0.24 | 0.67 | 49 of 370 | 58036 (-61), 58005 (-49), 58079 (-48) | 58021 (+57), 58477 (+46), 58560 (+43) |
| Ear, nose & throat | 60 | 57 | 0.08 | 0.66 | 65 of 370 | 58036 (-65), 58256 (-53), 58079 (-51) | 58838 (+100), 58735 (+74), 58781 (+66) |
| Urology | 60 | 45 | 0.08 | 0.65 | 54 of 370 | 58756 (-92), 58704 (-69), 58741 (-59) | 58757 (+81), 58560 (+65), 58735 (+58) |
| Foot & ankle / podiatry | 60 | 85 | 0.16 | 0.72 | 77 of 370 | 58467 (-46), 58756 (-43), 58365 (-36) | 58653 (+77), 58352 (+72), 58838 (+63) |
| Pain management | 60 | 29 | 0.09 | 0.68 | 38 of 370 | 58036 (-29), 58256 (-29), 58704 (-28) | 58735 (+56), 58781 (+51), 58759 (+48) |
| Plastic & reconstructive surgery | 90 | 36 | 0.07 | 0.54 | 113 of 370 | 58036 (-58), 58218 (-54), 58038 (-52) | 58059 (+60), 58051 (+58), 58560 (+57) |
| Speech & language therapy | 30 | 1,311 | 0.87 | 0.49 | 224 of 370 | 58492 (-76), 58528 (-76), 58458 (-68) | 58035 (+100), 58225 (+100), 58233 (+100) |
| Nutrition & dietitian | 30 | 430 | 0.32 | 0.54 | 208 of 370 | 58639 (-58), 58054 (-52), 58056 (-52) | 58233 (+100), 58243 (+100), 58330 (+100) |
| Acupuncture, massage & naturopathy | 30 | 211 | 0.50 | 0.57 | 82 of 370 | 58575 (-78), 58640 (-51), 58622 (-37) | 58627 (+61), 58560 (+50), 58021 (+47) |
| Urgent care & emergency | 30 | 436 | 0.50 | 0.33 | 227 of 370 | 58575 (-77), 58474 (-70), 58760 (-70) | 58353 (+100), 58361 (+100), 58363 (+100) |
| Imaging & lab | 60 | 432 | 0.55 | 0.68 | 85 of 370 | 58036 (-61), 58047 (-49), 58079 (-47) | 58348 (+85), 58356 (+81), 58381 (+71) |
| Pharmacy | 30 | 1,770 | 1.68 | 0.26 | 278 of 370 | 58032 (-72), 58067 (-66), 58853 (-62) | 58363 (+100), 58365 (+100), 58369 (+100) |
| Home health & in-home care | 30 | 3,391 | 1.49 | 0.31 | 147 of 370 | 58643 (-72), 58431 (-54), 58223 (-53) | 58016 (+100), 58043 (+100), 58233 (+100) |
| Nursing & assisted living | 60 | 633 | 0.37 | 0.63 | 149 of 370 | 58011 (-97), 58079 (-84), 58256 (-72) | 58632 (+100), 58478 (+96), 58643 (+96) |
| Medical equipment & supplies | 60 | 214 | 0.34 | 0.70 | 110 of 370 | 58413 (-65), 58778 (-64), 58716 (-63) | 58430 (+80), 58271 (+60), 58643 (+60) |
| Hearing & audiology | 60 | 168 | 0.20 | 0.70 | 101 of 370 | 58467 (-57), 58538 (-57), 58704 (-50) | 58477 (+95), 58530 (+93), 58641 (+79) |
| Behavior therapy (ABA) | 30 | 1,062 | 2.58 | 0.65 | 42 of 370 | 58784 (-52), 58701 (-26), 58018 (-25) | 58012 (+91), 58059 (+86), 58051 (+75) |
| Care coordination & community health | 30 | 3,029 | 1.55 | 0.35 | 225 of 370 | 58004 (-64), 58561 (-62), 58006 (-61) | 58258 (+100), 58275 (+100), 58351 (+100) |
| General surgery | 60 | 254 | 0.39 | 0.70 | 75 of 370 | 58218 (-91), 58214 (-79), 58251 (-68) | 58653 (+94), 58838 (+89), 58560 (+49) |
| Infectious disease | 90 | 22 | 0.06 | 0.51 | 66 of 370 | 58036 (-63), 58038 (-57), 58048 (-50) | 58560 (+46), 58042 (+41), 58005 (+36) |
| Genetics & genetic counseling | 90 | 29 | 0.03 | 0.49 | 86 of 370 | 58001 (-100), 58004 (-100), 58006 (-100) | 58538 (+100), 58528 (+91), 58256 (+63) |
| Hospice & palliative care | 60 | 47 | 0.09 | 0.66 | 90 of 370 | 58456 (-100), 58346 (-80), 58542 (-45) | 58440 (+100), 58460 (+100), 58385 (+95) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
