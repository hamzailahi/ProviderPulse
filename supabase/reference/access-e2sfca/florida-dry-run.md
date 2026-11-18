# E2SFCA access dry run: Florida

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,314; in Florida: 986
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,314 x 1,314 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 693,620; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.89 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.23), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 109,728 | 4.78 | 0.69 | 449 of 986 | 34141 (-63), 34429 (-49), 33870 (-47) | 32617 (+96), 32361 (+84), 33109 (+81) |
| Pediatrics (children) | 30 | 21,311 | 1.13 | 0.80 | 359 of 986 | 33760 (-48), 33470 (-47), 32446 (-44) | 32829 (+89), 33621 (+82), 32617 (+81) |
| Women's health / OB-GYN | 60 | 10,145 | 0.55 | 0.74 | 324 of 986 | 32506 (-54), 32681 (-53), 32664 (-51) | 32617 (+73), 33956 (+70), 32566 (+63) |
| Mental health & counseling | 30 | 94,040 | 7.13 | 0.78 | 201 of 986 | 34141 (-62), 32025 (-57), 32324 (-47) | 32621 (+93), 32696 (+85), 32669 (+71) |
| Dental | 30 | 27,428 | 1.64 | 0.75 | 332 of 986 | 34429 (-72), 32424 (-57), 32025 (-56) | 32617 (+55), 32334 (+52), 33149 (+51) |
| Eye care | 30 | 12,242 | 0.65 | 0.71 | 421 of 986 | 32435 (-64), 33870 (-64), 34429 (-63) | 33109 (+71), 33149 (+63), 32426 (+62) |
| Chiropractic | 30 | 13,642 | 0.64 | 0.78 | 416 of 986 | 33037 (-81), 33870 (-67), 34429 (-63) | 32180 (+100), 32617 (+87), 32130 (+77) |
| Physical & occupational therapy | 30 | 54,269 | 2.73 | 0.74 | 402 of 986 | 32565 (-67), 32025 (-54), 32061 (-49) | 32169 (+75), 34436 (+69), 32132 (+68) |
| Orthopedics & sports injury | 60 | 7,210 | 0.42 | 0.74 | 295 of 986 | 32506 (-58), 32664 (-53), 32681 (-52) | 32413 (+57), 33621 (+52), 33647 (+52) |
| Heart / cardiology | 60 | 6,329 | 0.28 | 0.71 | 484 of 986 | 32681 (-66), 32664 (-63), 32192 (-56) | 34448 (+72), 34216 (+71), 34268 (+71) |
| Skin / dermatology | 60 | 2,516 | 0.10 | 0.77 | 432 of 986 | 32664 (-74), 32681 (-64), 33014 (-49) | 32180 (+87), 34138 (+86), 34139 (+78) |
| Allergy & immunology | 60 | 583 | 0.03 | 0.77 | 429 of 986 | 33412 (-61), 34221 (-54), 34285 (-54) | 33476 (+99), 32413 (+72), 34268 (+72) |
| Lung, breathing & sleep | 60 | 3,338 | 0.14 | 0.77 | 336 of 986 | 32664 (-100), 32681 (-94), 32686 (-89) | 34449 (+90), 33037 (+78), 33187 (+76) |
| Digestive / gastroenterology | 60 | 2,682 | 0.13 | 0.71 | 438 of 986 | 33563 (-52), 32712 (-50), 32073 (-48) | 34449 (+100), 33924 (+91), 33956 (+90) |
| Kidney / nephrology | 60 | 2,364 | 0.12 | 0.71 | 358 of 986 | 32465 (-56), 33042 (-45), 33563 (-42) | 32566 (+67), 32219 (+64), 33715 (+61) |
| Diabetes & hormones | 60 | 1,210 | 0.07 | 0.80 | 384 of 986 | 33592 (-50), 32221 (-49), 32664 (-46) | 32617 (+79), 33476 (+77), 32219 (+73) |
| Cancer care / oncology | 90 | 3,638 | 0.18 | 0.52 | 595 of 986 | 32221 (-73), 32063 (-67), 32234 (-67) | 32361 (+64), 32344 (+60), 32561 (+59) |
| Arthritis / rheumatology | 60 | 771 | 0.04 | 0.74 | 443 of 986 | 34221 (-56), 33414 (-55), 34222 (-55) | 33476 (+100), 32336 (+70), 33867 (+69) |
| Brain & nerves / neurology | 60 | 4,543 | 0.24 | 0.80 | 409 of 986 | 33993 (-53), 33972 (-47), 32073 (-46) | 32617 (+76), 33109 (+61), 33621 (+56) |
| Ear, nose & throat | 60 | 1,350 | 0.08 | 0.72 | 469 of 986 | 32664 (-53), 33042 (-53), 32681 (-52) | 32617 (+78), 33476 (+70), 32566 (+64) |
| Urology | 60 | 1,866 | 0.08 | 0.65 | 512 of 986 | 32681 (-62), 32664 (-61), 32192 (-53) | 33956 (+83), 32617 (+71), 33430 (+71) |
| Foot & ankle / podiatry | 60 | 3,769 | 0.16 | 0.79 | 362 of 986 | 33440 (-54), 32664 (-51), 32681 (-51) | 33327 (+85), 33493 (+73), 32617 (+66) |
| Pain management | 60 | 2,551 | 0.09 | 0.71 | 452 of 986 | 32664 (-77), 32681 (-77), 33563 (-66) | 32157 (+92), 32413 (+77), 32784 (+73) |
| Plastic & reconstructive surgery | 90 | 1,711 | 0.07 | 0.71 | 578 of 986 | 33042 (-100), 33573 (-75), 33592 (-74) | 32615 (+56), 32616 (+56), 32653 (+55) |
| Speech & language therapy | 30 | 16,594 | 0.87 | 0.75 | 381 of 986 | 32334 (-56), 32321 (-55), 33924 (-49) | 32344 (+91), 32361 (+86), 33194 (+74) |
| Nutrition & dietitian | 30 | 4,767 | 0.32 | 0.79 | 271 of 986 | 33470 (-63), 33872 (-53), 32025 (-49) | 32621 (+95), 32344 (+91), 32696 (+86) |
| Acupuncture, massage & naturopathy | 30 | 11,817 | 0.50 | 0.75 | 435 of 986 | 33870 (-59), 32059 (-54), 32177 (-51) | 32072 (+88), 33621 (+84), 33109 (+80) |
| Urgent care & emergency | 30 | 8,874 | 0.50 | 0.62 | 416 of 986 | 32424 (-73), 34428 (-66), 33470 (-56) | 32219 (+98), 32617 (+98), 32829 (+92) |
| Imaging & lab | 60 | 12,258 | 0.55 | 0.75 | 409 of 986 | 32664 (-71), 32681 (-70), 33563 (-58) | 32829 (+65), 32617 (+61), 32219 (+55) |
| Pharmacy | 30 | 32,852 | 1.68 | 0.67 | 388 of 986 | 32320 (-55), 32435 (-54), 33870 (-54) | 32621 (+83), 32696 (+70), 32622 (+62) |
| Home health & in-home care | 30 | 24,114 | 1.49 | 0.75 | 282 of 986 | 33438 (-46), 34429 (-37), 32177 (-33) | 32072 (+94), 32038 (+92), 32360 (+88) |
| Nursing & assisted living | 60 | 11,807 | 0.37 | 0.65 | 402 of 986 | 34785 (-67), 32113 (-66), 32681 (-66) | 33438 (+90), 33034 (+85), 32102 (+83) |
| Medical equipment & supplies | 60 | 10,051 | 0.34 | 0.85 | 263 of 986 | 33563 (-42), 33033 (-38), 32664 (-37) | 33327 (+81), 32617 (+70), 33196 (+66) |
| Hearing & audiology | 60 | 4,231 | 0.20 | 0.72 | 399 of 986 | 32664 (-77), 32681 (-72), 33563 (-63) | 32736 (+87), 34431 (+80), 32180 (+79) |
| Behavior therapy (ABA) | 30 | 102,738 | 2.58 | 0.77 | 360 of 986 | 34431 (-78), 32055 (-60), 32433 (-59) | 32327 (+100), 32344 (+100), 32355 (+100) |
| Care coordination & community health | 30 | 13,878 | 1.55 | 0.75 | 148 of 986 | 32025 (-58), 32321 (-54), 32061 (-45) | 32621 (+96), 32696 (+87), 34945 (+55) |
| General surgery | 60 | 8,420 | 0.39 | 0.75 | 439 of 986 | 33563 (-62), 33592 (-54), 33565 (-50) | 32413 (+74), 32617 (+71), 33109 (+61) |
| Infectious disease | 90 | 1,192 | 0.06 | 0.67 | 585 of 986 | 32234 (-70), 33563 (-65), 32063 (-61) | 34228 (+70), 34481 (+66), 32669 (+63) |
| Genetics & genetic counseling | 90 | 443 | 0.03 | 0.66 | 579 of 986 | 33563 (-54), 33759 (-54), 33765 (-54) | 32829 (+68), 32621 (+66), 34141 (+66) |
| Hospice & palliative care | 60 | 773 | 0.09 | 0.77 | 115 of 986 | 32465 (-25), 32343 (-21), 33967 (-21) | 33559 (+40), 32504 (+39), 32344 (+38) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 33136 | Primary care / family doctor | 9.635 | 10.296 | 0 | 0 |
| 33136 | Mental health & counseling | 7.019 | 7.607 | 51 | 47 |
| 33136 | Heart / cardiology | 0.539 | 0.519 | 4 | 8 |
| 33136 | Cancer care / oncology | 0.321 | 0.242 | 10 | 32 |
| 33136 | Urgent care & emergency | 0.647 | 0.724 | 35 | 27 |
| 32804 | Primary care / family doctor | 8.237 | 9.784 | 14 | 0 |
| 32804 | Mental health & counseling | 8.766 | 10.892 | 39 | 24 |
| 32804 | Heart / cardiology | 0.526 | 0.444 | 6 | 21 |
| 32804 | Cancer care / oncology | 0.282 | 0.209 | 21 | 41 |
| 32804 | Urgent care & emergency | 0.780 | 0.872 | 22 | 12 |
| 33602 | Primary care / family doctor | 9.740 | 12.567 | 0 | 0 |
| 33602 | Mental health & counseling | 7.817 | 10.649 | 45 | 25 |
| 33602 | Heart / cardiology | 0.557 | 0.531 | 1 | 6 |
| 33602 | Cancer care / oncology | 0.584 | 0.321 | 0 | 10 |
| 33602 | Urgent care & emergency | 0.725 | 1.020 | 27 | 0 |
| 32209 | Primary care / family doctor | 7.962 | 7.598 | 17 | 20 |
| 32209 | Mental health & counseling | 7.738 | 7.535 | 46 | 47 |
| 32209 | Heart / cardiology | 0.600 | 0.474 | 0 | 16 |
| 32209 | Cancer care / oncology | 0.381 | 0.325 | 0 | 9 |
| 32209 | Urgent care & emergency | 1.247 | 1.219 | 0 | 0 |
| 32301 | Primary care / family doctor | 6.471 | 8.585 | 32 | 10 |
| 32301 | Mental health & counseling | 7.670 | 9.975 | 46 | 30 |
| 32301 | Heart / cardiology | 0.322 | 0.242 | 43 | 57 |
| 32301 | Cancer care / oncology | 0.204 | 0.139 | 43 | 61 |
| 32301 | Urgent care & emergency | 0.462 | 0.617 | 54 | 38 |
| 32501 | Primary care / family doctor | 8.092 | 12.322 | 15 | 0 |
| 32501 | Mental health & counseling | 5.987 | 9.037 | 58 | 37 |
| 32501 | Heart / cardiology | 0.499 | 0.377 | 11 | 33 |
| 32501 | Cancer care / oncology | 0.316 | 0.210 | 11 | 41 |
| 32501 | Urgent care & emergency | 0.731 | 1.141 | 27 | 0 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 39440 rows (ZIP x specialty) stored in access_e2sfca for FL; market-score now uses drive-time access for these ZIPs.
