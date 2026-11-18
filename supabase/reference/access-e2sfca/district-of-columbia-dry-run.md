# E2SFCA access dry run: District of Columbia

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 574; in District of Columbia: 29
- Drive times: OSRM on OpenStreetMap roads (car profile), 574 x 574 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 326,156; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.49 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.73), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 10; re-anchored: 0; still implausible (left out of the rank comparison, marked in the CSV): 10 (21610, 21620, 21634, 21661, 21667, 21669, 21678, 22469, 22488, 25430)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 21610 | no | 3.40 | 25% | 3.40 | 25% | no |
| 21620 | no | 3.57 | 33% | 3.57 | 33% | no |
| 21634 | no | 14.65 | 100% | 14.65 | 100% | no |
| 21661 | no | 3.57 | 8% | 3.57 | 8% | no |
| 21667 | no | 3.40 | 25% | 3.40 | 25% | no |
| 21669 | no | 13.08 | 100% | 13.08 | 100% | no |
| 21678 | no | 3.88 | 25% | 3.88 | 25% | no |
| 22469 | no | 9.08 | 100% | 9.08 | 100% | no |
| 22488 | no | 13.01 | 100% | 13.01 | 100% | no |
| 25430 | no | 9.38 | 100% | 9.38 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 38,788 | 4.78 | 0.31 | 8 of 29 | 20006 (-30), 20037 (-28), 20003 (-26) | 20032 (+7), 20007 (+6), 20016 (+6) |
| Pediatrics (children) | 30 | 12,094 | 1.13 | n/a | 2 of 29 | 20001 (0), 20002 (0), 20003 (0) | 20020 (+15), 20032 (+15), 20001 (+0) |
| Women's health / OB-GYN | 60 | 5,563 | 0.55 | 0.01 | 6 of 29 | 20003 (-22), 20390 (-20), 20002 (-18) | 20016 (+17), 20007 (+13), 20057 (+12) |
| Mental health & counseling | 30 | 67,904 | 7.13 | 0.16 | 9 of 29 | 20003 (-30), 20390 (-28), 20004 (-27) | 20007 (+6), 20024 (+6), 20020 (+5) |
| Dental | 30 | 14,414 | 1.64 | 0.43 | 8 of 29 | 20003 (-30), 20006 (-30), 20004 (-28) | 20020 (+5), 20024 (+5), 20016 (+4) |
| Eye care | 30 | 4,866 | 0.65 | 0.61 | 8 of 29 | 20006 (-24), 20037 (-24), 20003 (-23) | 20032 (+4), 20016 (+2), 20020 (+1) |
| Chiropractic | 30 | 2,986 | 0.64 | 0.52 | 3 of 29 | 20006 (-16), 20004 (-15), 20037 (-15) | 20020 (+4), 20016 (+1), 20024 (+1) |
| Physical & occupational therapy | 30 | 23,661 | 2.73 | 0.46 | 8 of 29 | 20006 (-25), 20004 (-24), 20003 (-23) | 20020 (+6), 20024 (+3), 20016 (+2) |
| Orthopedics & sports injury | 60 | 3,186 | 0.42 | 0.01 | 4 of 29 | 20003 (-23), 20390 (-23), 20004 (-15) | 20016 (+11), 20007 (+8), 20015 (+6) |
| Heart / cardiology | 60 | 2,403 | 0.28 | -0.08 | 7 of 29 | 20003 (-21), 20390 (-19), 20019 (-12) | 20016 (+33), 20007 (+31), 20057 (+27) |
| Skin / dermatology | 60 | 942 | 0.10 | 0.37 | 10 of 29 | 20003 (-37), 20390 (-36), 20019 (-34) | 20008 (+13), 20011 (+13), 20016 (+13) |
| Allergy & immunology | 60 | 447 | 0.03 | n/a | 8 of 29 | 20003 (-35), 20020 (-34), 20002 (-33) | 20005 (+0), 20007 (+0), 20008 (+0) |
| Lung, breathing & sleep | 60 | 1,038 | 0.14 | 0.10 | 8 of 29 | 20003 (-19), 20390 (-18), 20004 (-16) | 20016 (+17), 20007 (+16), 20057 (+14) |
| Digestive / gastroenterology | 60 | 1,192 | 0.13 | 0.02 | 7 of 29 | 20002 (-28), 20003 (-27), 20390 (-26) | 20016 (+20), 20007 (+16), 20057 (+11) |
| Kidney / nephrology | 60 | 1,071 | 0.12 | -0.06 | 2 of 29 | 20003 (-10), 20390 (-9), 20002 (-6) | 20016 (+19), 20057 (+15), 20015 (+13) |
| Diabetes & hormones | 60 | 678 | 0.07 | 0.01 | 11 of 29 | 20003 (-29), 20002 (-27), 20006 (-27) | 20016 (+13), 20007 (+12), 20008 (+11) |
| Cancer care / oncology | 90 | 1,472 | 0.18 | 0.12 | 8 of 29 | 20002 (-14), 20003 (-14), 20390 (-12) | 20007 (+33), 20016 (+33), 20057 (+27) |
| Arthritis / rheumatology | 60 | 425 | 0.04 | 0.29 | 2 of 29 | 20003 (-19), 20390 (-17), 20002 (-14) | 20016 (+13), 20008 (+12), 20007 (+11) |
| Brain & nerves / neurology | 60 | 1,851 | 0.24 | 0.32 | 10 of 29 | 20003 (-9), 20019 (-9), 20002 (-8) | 20007 (+30), 20016 (+30), 20057 (+30) |
| Ear, nose & throat | 60 | 588 | 0.08 | 0.07 | 9 of 29 | 20003 (-26), 20390 (-25), 20002 (-18) | 20016 (+25), 20015 (+18), 20007 (+15) |
| Urology | 60 | 683 | 0.08 | -0.11 | 6 of 29 | 20003 (-22), 20390 (-22), 20002 (-20) | 20016 (+19), 20007 (+16), 20008 (+8) |
| Foot & ankle / podiatry | 60 | 1,455 | 0.16 | 0.11 | 20 of 29 | 20003 (-30), 20390 (-29), 20005 (-25) | 20016 (+-1), 20015 (+-5), 20007 (+-6) |
| Pain management | 60 | 861 | 0.09 | 0.10 | 26 of 29 | 20390 (-46), 20003 (-44), 20004 (-36) | 20015 (+-7), 20016 (+-11), 20012 (+-13) |
| Plastic & reconstructive surgery | 90 | 596 | 0.07 | 0.37 | 13 of 29 | 20019 (-26), 20003 (-23), 20390 (-23) | 20007 (+30), 20057 (+30), 20016 (+28) |
| Speech & language therapy | 30 | 7,721 | 0.87 | 0.33 | 8 of 29 | 20006 (-31), 20004 (-28), 20037 (-28) | 20020 (+8), 20024 (+4), 20016 (+3) |
| Nutrition & dietitian | 30 | 2,592 | 0.32 | 0.49 | 8 of 29 | 20006 (-26), 20004 (-25), 20003 (-21) | 20020 (+14), 20032 (+10), 20024 (+8) |
| Acupuncture, massage & naturopathy | 30 | 3,730 | 0.50 | 0.73 | 8 of 29 | 20037 (-25), 20006 (-24), 20004 (-22) | 20020 (+9), 20032 (+4), 20064 (+2) |
| Urgent care & emergency | 30 | 3,364 | 0.50 | 0.35 | 8 of 29 | 20037 (-26), 20003 (-25), 20004 (-25) | 20007 (+11), 20032 (+10), 20057 (+10) |
| Imaging & lab | 60 | 3,943 | 0.55 | 0.09 | 7 of 29 | 20003 (-21), 20390 (-21), 20002 (-18) | 20016 (+15), 20007 (+12), 20057 (+10) |
| Pharmacy | 30 | 12,185 | 1.68 | 0.15 | 7 of 29 | 20003 (-21), 20006 (-21), 20004 (-20) | 20016 (+4), 20057 (+4), 20007 (+3) |
| Home health & in-home care | 30 | 33,251 | 1.49 | n/a | 0 of 29 | 20001 (0), 20002 (0), 20003 (0) | 20001 (+0), 20002 (+0), 20003 (+0) |
| Nursing & assisted living | 60 | 2,615 | 0.37 | 0.61 | 3 of 29 | 20373 (-9), 20032 (-6), 20004 (-4) | 20017 (+18), 20018 (+16), 20064 (+16) |
| Medical equipment & supplies | 60 | 2,607 | 0.34 | -0.50 | 27 of 29 | 20003 (-33), 20004 (-32), 20005 (-32) | 20015 (+-13), 20016 (+-14), 20018 (+-16) |
| Hearing & audiology | 60 | 1,506 | 0.20 | 0.10 | 10 of 29 | 20003 (-31), 20390 (-29), 20019 (-25) | 20016 (+18), 20015 (+14), 20007 (+12) |
| Behavior therapy (ABA) | 30 | 36,026 | 2.58 | 0.66 | 20 of 29 | 20007 (-59), 20011 (-59), 20008 (-58) | 20012 (+0), 20015 (+0), 20024 (+0) |
| Care coordination & community health | 30 | 14,646 | 1.55 | n/a | 0 of 29 | 20001 (0), 20002 (0), 20003 (0) | 20015 (+9), 20001 (+0), 20002 (+0) |
| General surgery | 60 | 3,426 | 0.39 | 0.07 | 10 of 29 | 20003 (-22), 20390 (-21), 20002 (-19) | 20016 (+32), 20007 (+30), 20057 (+27) |
| Infectious disease | 90 | 648 | 0.06 | 0.16 | 0 of 29 | 20019 (-4), 20001 (0), 20002 (0) | 20024 (+7), 20032 (+6), 20007 (+5) |
| Genetics & genetic counseling | 90 | 331 | 0.03 | 0.50 | 4 of 29 | 20012 (1), 20011 (5), 20010 (6) | 20024 (+17), 20032 (+17), 20007 (+15) |
| Hospice & palliative care | 60 | 396 | 0.09 | 0.16 | 0 of 29 | 20003 (-12), 20002 (-11), 20004 (-10) | 20016 (+5), 20007 (+4), 20057 (+3) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 20001 | Primary care / family doctor | 5.932 | 6.749 | 38 | 29 |
| 20001 | Mental health & counseling | 10.840 | 12.524 | 24 | 12 |
| 20001 | Heart / cardiology | 0.433 | 0.425 | 23 | 24 |
| 20001 | Cancer care / oncology | 0.274 | 0.250 | 23 | 30 |
| 20001 | Urgent care & emergency | 0.645 | 0.753 | 35 | 24 |
| 20010 | Primary care / family doctor | 6.465 | 7.405 | 32 | 23 |
| 20010 | Mental health & counseling | 11.507 | 12.940 | 19 | 9 |
| 20010 | Heart / cardiology | 0.458 | 0.427 | 18 | 24 |
| 20010 | Cancer care / oncology | 0.301 | 0.257 | 15 | 28 |
| 20010 | Urgent care & emergency | 0.687 | 0.791 | 31 | 20 |
| 20032 | Primary care / family doctor | 5.139 | 4.448 | 46 | 53 |
| 20032 | Mental health & counseling | 9.236 | 9.083 | 35 | 36 |
| 20032 | Heart / cardiology | 0.345 | 0.371 | 39 | 34 |
| 20032 | Cancer care / oncology | 0.216 | 0.229 | 39 | 36 |
| 20032 | Urgent care & emergency | 0.628 | 0.526 | 37 | 47 |
| 20016 | Primary care / family doctor | 7.645 | 7.110 | 20 | 26 |
| 20016 | Mental health & counseling | 11.832 | 11.222 | 17 | 21 |
| 20016 | Heart / cardiology | 0.598 | 0.378 | 0 | 33 |
| 20016 | Cancer care / oncology | 0.366 | 0.240 | 0 | 33 |
| 20016 | Urgent care & emergency | 0.815 | 0.728 | 18 | 27 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 1160 rows (ZIP x specialty) stored in access_e2sfca for DC; market-score now uses drive-time access for these ZIPs.
