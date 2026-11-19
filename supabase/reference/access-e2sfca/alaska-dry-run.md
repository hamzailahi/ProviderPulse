# E2SFCA access dry run: Alaska

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 213; in Alaska: 213
- Drive times: OSRM on OpenStreetMap roads (car profile), 213 x 213 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 1
- Listings read: 36,190; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.34 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.86), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 48; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 44 (99546, 99549, 99553, 99571, 99574, 99580, 99583, 99585, 99589, 99606, 99607, 99611, 99612, 99613, 99626, 99630, 99633, 99636, 99640, 99648, 99649, 99657, 99661, 99670, 99682, 99685, 99689, 99723, 99748, 99754, 99759, 99782, 99791, 99820, 99824, 99826, 99829, 99830, 99832, 99833, 99835, 99840, 99841, 99929)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 99504 | yes | 6.88 | 100% | 3.52 | 100% | yes (2.67) |
| 99546 | yes | none | 0% | none | 0% | no |
| 99549 | yes | 0.20 | 25% | 0.20 | 25% | no |
| 99553 | yes | 7.07 | 92% | 7.07 | 92% | no |
| 99571 | yes | 7.28 | 75% | 7.28 | 75% | no |
| 99574 | yes | 7.57 | 100% | 7.57 | 100% | no |
| 99580 | yes | 0.69 | 42% | 0.69 | 42% | no |
| 99583 | yes | 7.31 | 83% | 7.31 | 83% | no |
| 99585 | yes | 0.47 | 33% | 0.47 | 33% | no |
| 99589 | yes | 0.63 | 33% | 0.63 | 33% | no |
| 99606 | yes | 0.54 | 33% | 0.54 | 33% | no |
| 99607 | yes | 0.00 | 42% | 0.00 | 42% | no |
| 99611 | yes | 7.34 | 100% | 7.34 | 100% | no |
| 99612 | yes | 7.50 | 75% | 7.50 | 75% | no |
| 99613 | yes | 0.89 | 33% | 0.89 | 33% | no |
| 99626 | yes | 0.00 | 42% | 0.00 | 42% | no |
| 99630 | yes | 0.02 | 25% | 0.02 | 25% | no |
| 99633 | yes | 0.89 | 33% | 0.89 | 33% | no |
| 99636 | yes | 0.60 | 42% | 0.60 | 42% | no |
| 99640 | yes | 0.56 | 25% | 0.56 | 25% | no |
| 99648 | yes | 7.44 | 50% | 7.44 | 50% | no |
| 99649 | yes | 0.49 | 25% | 0.49 | 25% | no |
| 99657 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99661 | yes | 7.22 | 75% | 7.22 | 75% | no |
| 99670 | yes | 0.92 | 33% | 0.92 | 33% | no |
| 99682 | yes | 6.14 | 100% | 6.14 | 100% | no |
| 99685 | yes | 5.87 | 92% | 5.87 | 92% | no |
| 99689 | yes | 8.27 | 100% | 8.27 | 100% | no |
| 99723 | yes | 0.21 | 25% | 0.21 | 25% | no |
| 99748 | yes | 0.30 | 33% | 0.30 | 33% | no |
| 99754 | yes | 0.00 | 42% | 0.00 | 42% | no |
| 99759 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99782 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99791 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99820 | yes | 9.82 | 75% | 10.06 | 83% | no |
| 99824 | yes | 6.32 | 83% | 5.87 | 92% | no |
| 99826 | yes | 6.68 | 92% | 6.68 | 100% | no |
| 99829 | yes | 8.29 | 83% | 8.24 | 92% | no |
| 99830 | yes | 2.94 | 42% | 7.52 | 58% | yes (14.06) |
| 99832 | yes | 10.06 | 83% | 9.12 | 92% | no |
| 99833 | yes | 6.06 | 42% | 6.06 | 50% | no |
| 99835 | yes | 12.57 | 67% | 12.57 | 75% | no |
| 99840 | yes | 7.64 | 92% | 7.64 | 100% | no |
| 99841 | yes | 7.64 | 83% | 7.52 | 92% | no |
| 99901 | yes | 5.65 | 42% | 5.65 | 50% | no |
| 99923 | yes | 5.01 | 42% | 5.01 | 50% | no |
| 99926 | yes | 4.58 | 42% | 4.58 | 50% | no |
| 99929 | yes | 7.97 | 42% | 7.97 | 50% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 3,542 | 4.78 | 0.48 | 84 of 169 | 99668 (-100), 99745 (-100), 99781 (-94) | 99714 (+100), 99652 (+95), 99623 (+94) |
| Pediatrics (children) | 30 | 592 | 1.13 | 0.51 | 56 of 151 | 99668 (-100), 99558 (-76), 99590 (-76) | 99623 (+95), 99540 (+88), 99652 (+87) |
| Women's health / OB-GYN | 60 | 547 | 0.55 | 0.63 | 52 of 147 | 99736 (-100), 99749 (-100), 99750 (-100) | 99688 (+100), 99568 (+81), 99556 (+77) |
| Mental health & counseling | 30 | 8,809 | 7.13 | 0.38 | 82 of 169 | 99558 (-100), 99561 (-100), 99590 (-100) | 99652 (+100), 99540 (+94), 99672 (+92) |
| Dental | 30 | 1,407 | 1.64 | 0.44 | 76 of 169 | 99558 (-100), 99561 (-100), 99578 (-100) | 99714 (+100), 99919 (+100), 99922 (+99) |
| Eye care | 30 | 452 | 0.65 | 0.52 | 62 of 157 | 99558 (-100), 99590 (-100), 99602 (-100) | 99652 (+86), 99714 (+83), 99623 (+78) |
| Chiropractic | 30 | 601 | 0.64 | 0.53 | 60 of 151 | 99558 (-100), 99590 (-100), 99602 (-100) | 99568 (+100), 99688 (+100), 99693 (+100) |
| Physical & occupational therapy | 30 | 1,967 | 2.73 | 0.62 | 54 of 157 | 99558 (-100), 99590 (-100), 99602 (-100) | 99568 (+95), 99652 (+92), 99587 (+87) |
| Orthopedics & sports injury | 60 | 240 | 0.42 | 0.74 | 19 of 114 | 99781 (-100), 99668 (-85), 99558 (-73) | 99714 (+87), 99623 (+85), 99652 (+84) |
| Heart / cardiology | 60 | 84 | 0.28 | 0.81 | 13 of 108 | 99781 (-64), 99668 (-31), 99558 (-27) | 99623 (+93), 99652 (+86), 99577 (+45) |
| Skin / dermatology | 60 | 52 | 0.10 | 0.90 | 16 of 101 | 99557 (-50), 99653 (-27), 99654 (-23) | 99623 (+80), 99652 (+77), 99688 (+74) |
| Allergy & immunology | 60 | 18 | 0.03 | 0.70 | 16 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+100), 99652 (+100), 99568 (+69) |
| Lung, breathing & sleep | 60 | 120 | 0.14 | 0.78 | 22 of 108 | 99557 (-100), 99781 (-84), 99668 (-62) | 99688 (+100), 99663 (+80), 99623 (+72) |
| Digestive / gastroenterology | 60 | 52 | 0.13 | 0.81 | 17 of 108 | 99668 (-34), 99558 (-29), 99590 (-29) | 99623 (+97), 99652 (+97), 99577 (+55) |
| Kidney / nephrology | 60 | 38 | 0.12 | 0.89 | 9 of 101 | 99781 (-51), 99557 (-7), 99587 (-6) | 99623 (+97), 99652 (+86), 99540 (+46) |
| Diabetes & hormones | 60 | 38 | 0.07 | 0.64 | 23 of 127 | 99677 (-100), 99733 (-100), 99736 (-100) | 99693 (+100), 99688 (+90), 99623 (+76) |
| Cancer care / oncology | 90 | 84 | 0.18 | 0.72 | 18 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+86), 99652 (+79), 99540 (+42) |
| Arthritis / rheumatology | 60 | 11 | 0.04 | 0.94 | 6 of 101 | 99654 (-9), 99508 (-5), 99587 (-4) | 99623 (+90), 99652 (+89), 99577 (+45) |
| Brain & nerves / neurology | 60 | 135 | 0.24 | 0.76 | 18 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+92), 99652 (+82), 99568 (+80) |
| Ear, nose & throat | 60 | 55 | 0.08 | 0.87 | 14 of 101 | 99781 (-100), 99923 (-100), 99654 (-23) | 99688 (+100), 99623 (+73), 99652 (+71) |
| Urology | 60 | 47 | 0.08 | 0.68 | 17 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+100), 99652 (+100), 99568 (+57) |
| Foot & ankle / podiatry | 60 | 51 | 0.16 | 0.90 | 9 of 101 | 99781 (-100), 99557 (-22), 99508 (-7) | 99623 (+76), 99652 (+66), 99568 (+61) |
| Pain management | 60 | 70 | 0.09 | 0.74 | 33 of 125 | 99781 (-100), 99561 (-51), 99578 (-51) | 99688 (+100), 99567 (+75), 99587 (+70) |
| Plastic & reconstructive surgery | 90 | 34 | 0.07 | 0.72 | 20 of 108 | 99781 (-91), 99923 (-63), 99668 (-60) | 99688 (+83), 99623 (+76), 99663 (+76) |
| Speech & language therapy | 30 | 577 | 0.87 | 0.58 | 44 of 126 | 99558 (-100), 99590 (-100), 99602 (-100) | 99587 (+100), 99663 (+100), 99540 (+97) |
| Nutrition & dietitian | 30 | 283 | 0.32 | 0.52 | 58 of 157 | 99561 (-100), 99578 (-100), 99614 (-100) | 99652 (+100), 99540 (+98), 99568 (+92) |
| Acupuncture, massage & naturopathy | 30 | 1,487 | 0.50 | 0.66 | 47 of 157 | 99558 (-100), 99590 (-100), 99602 (-100) | 99556 (+100), 99568 (+100), 99605 (+100) |
| Urgent care & emergency | 30 | 418 | 0.50 | 0.49 | 70 of 157 | 99736 (-100), 99749 (-100), 99763 (-100) | 99568 (+100), 99631 (+100), 99652 (+100) |
| Imaging & lab | 60 | 292 | 0.55 | 0.61 | 30 of 147 | 99561 (-100), 99578 (-100), 99614 (-100) | 99623 (+88), 99652 (+86), 99568 (+74) |
| Pharmacy | 30 | 1,049 | 1.68 | 0.56 | 65 of 157 | 99668 (-100), 99561 (-94), 99578 (-94) | 99540 (+74), 99652 (+69), 99922 (+69) |
| Home health & in-home care | 30 | 2,474 | 1.49 | 0.59 | 46 of 157 | 99558 (-100), 99578 (-100), 99590 (-100) | 99540 (+100), 99568 (+100), 99605 (+100) |
| Nursing & assisted living | 60 | 917 | 0.37 | 0.51 | 55 of 147 | 99558 (-100), 99590 (-100), 99602 (-100) | 99605 (+100), 99663 (+100), 99677 (+87) |
| Medical equipment & supplies | 60 | 190 | 0.34 | 0.71 | 23 of 151 | 99558 (-100), 99590 (-100), 99602 (-100) | 99688 (+95), 99568 (+71), 99623 (+71) |
| Hearing & audiology | 60 | 137 | 0.20 | 0.80 | 18 of 134 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+85), 99652 (+85), 99677 (+83) |
| Behavior therapy (ABA) | 30 | 1,583 | 2.58 | 0.57 | 44 of 153 | 99668 (-100), 99781 (-100), 99691 (-61) | 99587 (+100), 99540 (+75), 99623 (+72) |
| Care coordination & community health | 30 | 5,232 | 1.55 | 0.60 | 27 of 169 | 99602 (-100), 99668 (-100), 99923 (-100) | 99540 (+100), 99556 (+100), 99568 (+100) |
| General surgery | 60 | 266 | 0.39 | 0.73 | 23 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99623 (+87), 99663 (+87), 99652 (+86) |
| Infectious disease | 90 | 17 | 0.06 | 0.89 | 18 of 101 | 99587 (-35), 99654 (-35), 99567 (-31) | 99623 (+98), 99652 (+98), 99577 (+45) |
| Genetics & genetic counseling | 90 | 6 | 0.03 | 0.86 | 12 of 101 | 99587 (-22), 99654 (-21), 99567 (-19) | 99623 (+79), 99652 (+66), 99540 (+28) |
| Hospice & palliative care | 60 | 32 | 0.09 | 0.71 | 13 of 108 | 99558 (-100), 99590 (-100), 99602 (-100) | 99688 (+85), 99568 (+80), 99652 (+31) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
