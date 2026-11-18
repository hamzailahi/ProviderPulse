# E2SFCA access dry run: Mississippi

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,445; in Mississippi: 410
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,445 x 1,445 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 275,266; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.84 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.10), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 1; still implausible (left out of the rank comparison, marked in the CSV): 2 (32534, 71316)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 32514 | no | 7.82 | 100% | 5.83 | 100% | yes (11.72) |
| 32534 | no | 8.48 | 100% | 9.43 | 100% | no |
| 71316 | no | 7.30 | 100% | 7.30 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 43,073 | 4.78 | 0.37 | 238 of 410 | 39309 (-72), 38646 (-53), 39345 (-50) | 39335 (+77), 39363 (+77), 39364 (+77) |
| Pediatrics (children) | 30 | 8,321 | 1.13 | 0.52 | 136 of 410 | 39272 (-65), 38821 (-47), 39406 (-32) | 39047 (+84), 39364 (+40), 39363 (+37) |
| Women's health / OB-GYN | 60 | 3,766 | 0.55 | 0.78 | 98 of 410 | 39305 (-43), 39323 (-42), 39073 (-40) | 39363 (+69), 39355 (+61), 39335 (+51) |
| Mental health & counseling | 30 | 47,765 | 7.13 | 0.45 | 177 of 410 | 39309 (-77), 39648 (-57), 39307 (-44) | 38858 (+96), 38601 (+95), 38843 (+93) |
| Dental | 30 | 10,428 | 1.64 | 0.45 | 190 of 410 | 39309 (-60), 39645 (-50), 39705 (-43) | 39047 (+62), 39335 (+60), 39364 (+57) |
| Eye care | 30 | 4,797 | 0.65 | 0.44 | 252 of 410 | 39082 (-92), 39309 (-75), 38915 (-55) | 39335 (+74), 39364 (+70), 39047 (+69) |
| Chiropractic | 30 | 3,238 | 0.64 | 0.60 | 96 of 410 | 38847 (-41), 39577 (-41), 39345 (-37) | 38726 (+41), 39482 (+31), 38626 (+30) |
| Physical & occupational therapy | 30 | 20,361 | 2.73 | 0.42 | 213 of 410 | 38967 (-55), 39090 (-53), 39577 (-44) | 39662 (+100), 39657 (+82), 39071 (+75) |
| Orthopedics & sports injury | 60 | 3,382 | 0.42 | 0.75 | 150 of 410 | 38606 (-52), 39056 (-45), 39170 (-42) | 38619 (+78), 39425 (+75), 38860 (+59) |
| Heart / cardiology | 60 | 2,392 | 0.28 | 0.71 | 143 of 410 | 38824 (-66), 39073 (-66), 38849 (-59) | 38725 (+76), 39452 (+66), 38860 (+60) |
| Skin / dermatology | 60 | 730 | 0.10 | 0.78 | 141 of 410 | 39272 (-55), 39352 (-55), 39170 (-52) | 39363 (+68), 38765 (+63), 39452 (+62) |
| Allergy & immunology | 60 | 252 | 0.03 | 0.76 | 106 of 410 | 39272 (-96), 39170 (-74), 39073 (-69) | 38626 (+70), 39479 (+65), 38654 (+62) |
| Lung, breathing & sleep | 60 | 1,174 | 0.14 | 0.74 | 153 of 410 | 39056 (-70), 39170 (-62), 39071 (-59) | 39565 (+80), 39363 (+61), 38860 (+58) |
| Digestive / gastroenterology | 60 | 941 | 0.13 | 0.75 | 145 of 410 | 39073 (-52), 39056 (-51), 39170 (-48) | 38725 (+77), 39363 (+73), 39355 (+65) |
| Kidney / nephrology | 60 | 1,251 | 0.12 | 0.66 | 188 of 410 | 38751 (-80), 38748 (-74), 38769 (-65) | 39363 (+77), 39355 (+75), 39740 (+69) |
| Diabetes & hormones | 60 | 459 | 0.07 | 0.78 | 97 of 410 | 39073 (-79), 38824 (-67), 39059 (-65) | 39452 (+58), 38643 (+57), 38860 (+48) |
| Cancer care / oncology | 90 | 1,362 | 0.18 | 0.44 | 227 of 410 | 38611 (-78), 38664 (-68), 38671 (-67) | 38725 (+76), 38639 (+61), 38614 (+60) |
| Arthritis / rheumatology | 60 | 294 | 0.04 | 0.76 | 106 of 410 | 39073 (-100), 39056 (-90), 39170 (-87) | 39452 (+72), 38860 (+61), 39479 (+56) |
| Brain & nerves / neurology | 60 | 1,680 | 0.24 | 0.71 | 83 of 410 | 39073 (-71), 39056 (-64), 39170 (-60) | 38860 (+64), 38863 (+59), 38841 (+54) |
| Ear, nose & throat | 60 | 714 | 0.08 | 0.72 | 175 of 410 | 39056 (-90), 39170 (-89), 39073 (-84) | 39363 (+75), 39355 (+67), 39641 (+67) |
| Urology | 60 | 662 | 0.08 | 0.78 | 173 of 410 | 39305 (-74), 39323 (-72), 38751 (-68) | 38950 (+85), 39363 (+79), 39355 (+74) |
| Foot & ankle / podiatry | 60 | 771 | 0.16 | 0.76 | 75 of 410 | 39305 (-27), 39323 (-27), 38751 (-23) | 39363 (+41), 39355 (+36), 39633 (+36) |
| Pain management | 60 | 714 | 0.09 | 0.78 | 149 of 410 | 39305 (-73), 39323 (-70), 39056 (-58) | 38725 (+76), 39363 (+73), 39520 (+68) |
| Plastic & reconstructive surgery | 90 | 489 | 0.07 | 0.65 | 163 of 410 | 39073 (-100), 39059 (-91), 39056 (-82) | 38860 (+75), 38868 (+69), 38863 (+68) |
| Speech & language therapy | 30 | 8,749 | 0.87 | 0.47 | 233 of 410 | 38944 (-82), 38744 (-63), 39483 (-57) | 39662 (+100), 39641 (+96), 39667 (+86) |
| Nutrition & dietitian | 30 | 2,365 | 0.32 | 0.59 | 178 of 410 | 39656 (-87), 39140 (-78), 38921 (-52) | 38601 (+76), 39364 (+66), 38913 (+63) |
| Acupuncture, massage & naturopathy | 30 | 1,485 | 0.50 | 0.68 | 20 of 410 | 39328 (-24), 39530 (-23), 39069 (-20) | 39193 (+36), 39042 (+26), 39145 (+25) |
| Urgent care & emergency | 30 | 4,507 | 0.50 | 0.32 | 270 of 410 | 39631 (-79), 39150 (-78), 39328 (-71) | 38617 (+100), 38631 (+100), 38645 (+100) |
| Imaging & lab | 60 | 4,627 | 0.55 | 0.72 | 121 of 410 | 39323 (-58), 39073 (-57), 39305 (-56) | 39363 (+74), 39355 (+65), 39330 (+55) |
| Pharmacy | 30 | 17,060 | 1.68 | 0.29 | 261 of 410 | 39309 (-72), 38603 (-63), 38646 (-62) | 39047 (+75), 39364 (+68), 39335 (+67) |
| Home health & in-home care | 30 | 9,639 | 1.49 | 0.56 | 186 of 410 | 39082 (-67), 38748 (-51), 39113 (-49) | 39656 (+77), 38726 (+62), 39668 (+61) |
| Nursing & assisted living | 60 | 3,008 | 0.37 | 0.58 | 137 of 410 | 38644 (-33), 38768 (-28), 39635 (-27) | 39745 (+62), 39045 (+61), 39767 (+61) |
| Medical equipment & supplies | 60 | 3,959 | 0.34 | 0.67 | 190 of 410 | 39323 (-68), 39305 (-62), 38751 (-59) | 39633 (+82), 39363 (+74), 39355 (+71) |
| Hearing & audiology | 60 | 1,598 | 0.20 | 0.78 | 115 of 410 | 39272 (-63), 39170 (-50), 39056 (-44) | 39363 (+63), 39355 (+57), 39330 (+51) |
| Behavior therapy (ABA) | 30 | 12,060 | 2.58 | 0.63 | 24 of 410 | 39309 (-98), 39402 (-31), 39406 (-25) | 39573 (+37), 39479 (+34), 39576 (+32) |
| Care coordination & community health | 30 | 21,616 | 1.55 | 0.47 | 139 of 410 | 39540 (-52), 38663 (-47), 39648 (-44) | 38626 (+100), 38631 (+100), 38913 (+99) |
| General surgery | 60 | 3,057 | 0.39 | 0.73 | 120 of 410 | 39056 (-64), 39170 (-61), 39073 (-59) | 39363 (+65), 39355 (+57), 38725 (+55) |
| Infectious disease | 90 | 403 | 0.06 | 0.49 | 162 of 410 | 39056 (-67), 39073 (-65), 39071 (-62) | 39462 (+57), 39425 (+52), 38860 (+48) |
| Genetics & genetic counseling | 90 | 158 | 0.03 | 0.53 | 121 of 410 | 38671 (-56), 38672 (-53), 38637 (-52) | 39058 (+67), 39193 (+67), 39208 (+67) |
| Hospice & palliative care | 60 | 945 | 0.09 | 0.75 | 201 of 410 | 38967 (-62), 38824 (-60), 38849 (-59) | 39669 (+100), 39144 (+96), 38725 (+75) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 39201 | Primary care / family doctor | 12.065 | 15.827 | 0 | 0 |
| 39201 | Mental health & counseling | 10.966 | 14.257 | 23 | 0 |
| 39201 | Heart / cardiology | 0.833 | 0.563 | 0 | 0 |
| 39201 | Cancer care / oncology | 0.453 | 0.229 | 0 | 36 |
| 39201 | Urgent care & emergency | 1.541 | 1.892 | 0 | 0 |
| 38655 | Primary care / family doctor | 5.490 | 6.728 | 43 | 30 |
| 38655 | Mental health & counseling | 13.420 | 18.099 | 6 | 0 |
| 38655 | Heart / cardiology | 0.407 | 0.360 | 28 | 36 |
| 38655 | Cancer care / oncology | 0.222 | 0.112 | 38 | 69 |
| 38655 | Urgent care & emergency | 0.407 | 0.407 | 59 | 59 |
| 39531 | Primary care / family doctor | 6.284 | 7.399 | 34 | 23 |
| 39531 | Mental health & counseling | 6.273 | 8.185 | 56 | 43 |
| 39531 | Heart / cardiology | 0.389 | 0.350 | 31 | 38 |
| 39531 | Cancer care / oncology | 0.130 | 0.108 | 64 | 70 |
| 39531 | Urgent care & emergency | 0.671 | 0.998 | 33 | 0 |
| 38801 | Primary care / family doctor | 9.050 | 13.293 | 5 | 0 |
| 38801 | Mental health & counseling | 13.105 | 15.926 | 8 | 0 |
| 38801 | Heart / cardiology | 0.504 | 0.365 | 10 | 35 |
| 38801 | Cancer care / oncology | 0.163 | 0.126 | 54 | 65 |
| 38801 | Urgent care & emergency | 0.531 | 0.760 | 47 | 24 |
| 39401 | Primary care / family doctor | 5.945 | 7.749 | 38 | 19 |
| 39401 | Mental health & counseling | 6.158 | 9.088 | 57 | 36 |
| 39401 | Heart / cardiology | 0.332 | 0.334 | 41 | 41 |
| 39401 | Cancer care / oncology | 0.145 | 0.098 | 59 | 73 |
| 39401 | Urgent care & emergency | 0.587 | 0.737 | 41 | 26 |
| 38701 | Primary care / family doctor | 4.632 | 5.046 | 52 | 47 |
| 38701 | Mental health & counseling | 4.532 | 4.279 | 68 | 70 |
| 38701 | Heart / cardiology | 0.275 | 0.267 | 51 | 52 |
| 38701 | Cancer care / oncology | 0.150 | 0.107 | 58 | 70 |
| 38701 | Urgent care & emergency | 0.376 | 0.184 | 62 | 81 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 16400 rows (ZIP x specialty) stored in access_e2sfca for MS; market-score now uses drive-time access for these ZIPs.
