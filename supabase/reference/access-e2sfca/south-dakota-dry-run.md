# E2SFCA access dry run: South Dakota

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 891; in South Dakota: 362
- Drive times: OSRM on OpenStreetMap roads (car profile), 891 x 891 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 52,203; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.57 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.43), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 7,274 | 4.78 | 0.31 | 255 of 362 | 57641 (-67), 57570 (-58), 57620 (-55) | 57015 (+96), 57724 (+92), 57744 (+89) |
| Pediatrics (children) | 30 | 1,022 | 1.13 | 0.49 | 139 of 362 | 57652 (-85), 57570 (-67), 57278 (-66) | 57015 (+98), 57720 (+65), 57792 (+63) |
| Women's health / OB-GYN | 60 | 570 | 0.55 | 0.63 | 146 of 362 | 57445 (-100), 57450 (-75), 57424 (-71) | 57756 (+100), 57341 (+63), 57436 (+63) |
| Mental health & counseling | 30 | 8,112 | 7.13 | 0.45 | 135 of 362 | 57741 (-53), 57724 (-48), 57701 (-35) | 57763 (+88), 57735 (+87), 57782 (+80) |
| Dental | 30 | 2,227 | 1.64 | 0.29 | 252 of 362 | 57382 (-78), 57226 (-69), 57741 (-68) | 57751 (+77), 57265 (+75), 57718 (+75) |
| Eye care | 30 | 1,178 | 0.65 | 0.52 | 186 of 362 | 57450 (-81), 57374 (-76), 57752 (-68) | 57241 (+100), 57242 (+100), 57243 (+100) |
| Chiropractic | 30 | 1,943 | 0.64 | 0.45 | 221 of 362 | 57428 (-61), 57349 (-55), 57469 (-47) | 57045 (+100), 57050 (+100), 57051 (+100) |
| Physical & occupational therapy | 30 | 4,741 | 2.73 | 0.42 | 236 of 362 | 57531 (-86), 57066 (-63), 57782 (-58) | 57015 (+93), 57584 (+93), 57744 (+82) |
| Orthopedics & sports injury | 60 | 722 | 0.42 | 0.73 | 135 of 362 | 57004 (-100), 57022 (-100), 57212 (-95) | 57754 (+92), 57474 (+86), 57633 (+84) |
| Heart / cardiology | 60 | 212 | 0.28 | 0.67 | 63 of 362 | 57033 (-60), 57055 (-58), 57020 (-53) | 57785 (+77), 57744 (+73), 57725 (+57) |
| Skin / dermatology | 60 | 113 | 0.10 | 0.66 | 109 of 362 | 57741 (-100), 57055 (-67), 57020 (-65) | 57785 (+100), 57754 (+87), 57761 (+79) |
| Allergy & immunology | 60 | 23 | 0.03 | 0.68 | 55 of 362 | 57445 (-69), 57461 (-59), 57033 (-52) | 57474 (+89), 57785 (+88), 57744 (+77) |
| Lung, breathing & sleep | 60 | 132 | 0.14 | 0.68 | 88 of 362 | 57033 (-79), 57020 (-77), 57055 (-75) | 57621 (+100), 57762 (+100), 57766 (+100) |
| Digestive / gastroenterology | 60 | 93 | 0.13 | 0.73 | 52 of 362 | 57033 (-82), 57035 (-79), 57003 (-77) | 57785 (+83), 57744 (+78), 57025 (+74) |
| Kidney / nephrology | 60 | 126 | 0.12 | 0.61 | 152 of 362 | 57024 (-66), 57383 (-63), 57266 (-61) | 57528 (+100), 57534 (+100), 57661 (+100) |
| Diabetes & hormones | 60 | 88 | 0.07 | 0.68 | 68 of 362 | 57020 (-100), 57033 (-100), 57003 (-92) | 57536 (+100), 57540 (+100), 57572 (+100) |
| Cancer care / oncology | 90 | 150 | 0.18 | 0.56 | 159 of 362 | 57035 (-74), 57004 (-70), 57077 (-61) | 57337 (+61), 57477 (+59), 57314 (+58) |
| Arthritis / rheumatology | 60 | 21 | 0.04 | 0.67 | 50 of 362 | 57033 (-66), 57055 (-65), 57020 (-63) | 57025 (+58), 57744 (+55), 57785 (+55) |
| Brain & nerves / neurology | 60 | 176 | 0.24 | 0.69 | 53 of 362 | 57022 (-61), 57035 (-61), 57004 (-48) | 57785 (+95), 57025 (+81), 57744 (+75) |
| Ear, nose & throat | 60 | 101 | 0.08 | 0.66 | 120 of 362 | 57445 (-96), 57035 (-89), 57033 (-86) | 57785 (+100), 57474 (+85), 57761 (+81) |
| Urology | 60 | 84 | 0.08 | 0.66 | 112 of 362 | 57445 (-86), 57069 (-74), 57035 (-73) | 57766 (+89), 57474 (+87), 57785 (+75) |
| Foot & ankle / podiatry | 60 | 145 | 0.16 | 0.65 | 107 of 362 | 57741 (-71), 57442 (-47), 57445 (-45) | 57455 (+100), 57638 (+98), 57754 (+98) |
| Pain management | 60 | 51 | 0.09 | 0.64 | 74 of 362 | 57264 (-49), 57234 (-42), 57272 (-42) | 57265 (+66), 57025 (+64), 57242 (+60) |
| Plastic & reconstructive surgery | 90 | 59 | 0.07 | 0.55 | 150 of 362 | 57445 (-70), 57461 (-66), 57424 (-62) | 57785 (+75), 57337 (+63), 57015 (+61) |
| Speech & language therapy | 30 | 1,422 | 0.87 | 0.44 | 237 of 362 | 57716 (-91), 57456 (-88), 57328 (-80) | 57214 (+100), 57221 (+100), 57233 (+100) |
| Nutrition & dietitian | 30 | 537 | 0.32 | 0.44 | 194 of 362 | 57045 (-81), 57449 (-72), 57221 (-70) | 57371 (+100), 57466 (+100), 57467 (+100) |
| Acupuncture, massage & naturopathy | 30 | 398 | 0.50 | 0.66 | 101 of 362 | 57732 (-52), 57438 (-50), 57248 (-48) | 57718 (+100), 57745 (+100), 57769 (+96) |
| Urgent care & emergency | 30 | 785 | 0.50 | 0.26 | 237 of 362 | 57382 (-81), 57434 (-72), 57231 (-67) | 57015 (+100), 57052 (+100), 57330 (+100) |
| Imaging & lab | 60 | 615 | 0.55 | 0.62 | 146 of 362 | 57251 (-80), 57035 (-72), 57266 (-70) | 57261 (+96), 57540 (+95), 57270 (+87) |
| Pharmacy | 30 | 2,709 | 1.68 | 0.24 | 258 of 362 | 57428 (-69), 57328 (-68), 57226 (-67) | 57341 (+100), 57371 (+100), 57560 (+100) |
| Home health & in-home care | 30 | 5,656 | 1.49 | 0.41 | 125 of 362 | 57741 (-82), 57751 (-79), 57714 (-65) | 57457 (+100), 57636 (+100), 57661 (+100) |
| Nursing & assisted living | 60 | 1,136 | 0.37 | 0.63 | 142 of 362 | 57429 (-96), 57544 (-61), 57540 (-58) | 57457 (+100), 57467 (+100), 57521 (+100) |
| Medical equipment & supplies | 60 | 406 | 0.34 | 0.63 | 151 of 362 | 57657 (-75), 57450 (-63), 57741 (-59) | 57661 (+100), 57638 (+92), 57640 (+88) |
| Hearing & audiology | 60 | 341 | 0.20 | 0.68 | 152 of 362 | 57445 (-100), 57461 (-99), 57424 (-83) | 57520 (+100), 57528 (+100), 57541 (+100) |
| Behavior therapy (ABA) | 30 | 1,288 | 2.58 | 0.61 | 27 of 362 | 57702 (-45), 57401 (-5), 57022 (-4) | 57730 (+59), 57030 (+44), 57003 (+38) |
| Care coordination & community health | 30 | 2,221 | 1.55 | 0.46 | 108 of 362 | 57741 (-78), 57380 (-62), 57328 (-50) | 57725 (+100), 57744 (+100), 57763 (+100) |
| General surgery | 60 | 397 | 0.39 | 0.59 | 133 of 362 | 57004 (-56), 57251 (-54), 57035 (-52) | 57638 (+100), 57640 (+92), 57541 (+82) |
| Infectious disease | 90 | 45 | 0.06 | 0.57 | 77 of 362 | 57004 (-79), 57033 (-77), 57055 (-77) | 57785 (+85), 57759 (+51), 57761 (+51) |
| Genetics & genetic counseling | 90 | 45 | 0.03 | 0.48 | 61 of 362 | 57001 (-100), 57004 (-100), 57010 (-100) | 57005 (+0), 57015 (+0), 57032 (+0) |
| Hospice & palliative care | 60 | 120 | 0.09 | 0.69 | 112 of 362 | 57730 (-83), 57053 (-76), 57544 (-73) | 57437 (+100), 57457 (+100), 57541 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 14480 rows (ZIP x specialty) stored in access_e2sfca for SD; market-score now uses drive-time access for these ZIPs.
