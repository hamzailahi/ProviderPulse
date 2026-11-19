# E2SFCA access dry run: Puerto Rico

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 131; in Puerto Rico: 131
- Drive times: OSRM on OpenStreetMap roads (car profile), 131 x 131 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 54,896; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.37 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.43), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 9,215 | 4.78 | 0.62 | 31 of 131 | 00921 (-20), 00969 (-20), 00717 (-18) | 00606 (+34), 00670 (+31), 00622 (+30) |
| Pediatrics (children) | 30 | 1,837 | 1.13 | 0.78 | 28 of 131 | 00969 (-23), 00921 (-22), 00925 (-19) | 00979 (+31), 00670 (+24), 00703 (+24) |
| Women's health / OB-GYN | 60 | 730 | 0.55 | 0.73 | 14 of 131 | 00729 (-21), 00656 (-17), 00782 (-16) | 00767 (+21), 00901 (+19), 00979 (+19) |
| Mental health & counseling | 30 | 9,004 | 7.13 | 0.73 | 9 of 131 | 00775 (-23), 00969 (-16), 00921 (-15) | 00979 (+18), 00670 (+17), 00677 (+17) |
| Dental | 30 | 2,401 | 1.64 | 0.72 | 20 of 131 | 00775 (-39), 00921 (-19), 00969 (-19) | 00670 (+22), 00979 (+22), 00987 (+20) |
| Eye care | 30 | 1,828 | 0.65 | 0.74 | 56 of 131 | 00969 (-34), 00921 (-30), 00968 (-29) | 00670 (+50), 00677 (+42), 00611 (+41) |
| Chiropractic | 30 | 971 | 0.64 | 0.75 | 26 of 131 | 00775 (-65), 00921 (-22), 00969 (-22) | 00767 (+24), 00670 (+23), 00979 (+23) |
| Physical & occupational therapy | 30 | 2,124 | 2.73 | 0.79 | 0 of 131 | 00969 (-10), 00921 (-9), 00925 (-9) | 00611 (+11), 00979 (+11), 00688 (+9) |
| Orthopedics & sports injury | 60 | 270 | 0.42 | 0.79 | 0 of 131 | 00656 (-11), 00729 (-11), 00692 (-9) | 00901 (+13), 00906 (+12), 00913 (+12) |
| Heart / cardiology | 60 | 588 | 0.28 | 0.73 | 49 of 131 | 00656 (-35), 00729 (-29), 00601 (-28) | 00767 (+39), 00731 (+38), 00723 (+34) |
| Skin / dermatology | 60 | 175 | 0.10 | 0.79 | 55 of 131 | 00656 (-32), 00729 (-29), 00778 (-27) | 00901 (+39), 00913 (+38), 00911 (+37) |
| Allergy & immunology | 60 | 40 | 0.03 | 0.75 | 27 of 131 | 00601 (-23), 00656 (-21), 00692 (-20) | 00650 (+21), 00979 (+21), 00901 (+20) |
| Lung, breathing & sleep | 60 | 298 | 0.14 | 0.79 | 60 of 131 | 00729 (-34), 00656 (-31), 00692 (-30) | 00767 (+36), 00901 (+36), 00906 (+32) |
| Digestive / gastroenterology | 60 | 366 | 0.13 | 0.75 | 60 of 131 | 00725 (-54), 00729 (-50), 00778 (-48) | 00650 (+50), 00638 (+42), 00688 (+42) |
| Kidney / nephrology | 60 | 276 | 0.12 | 0.64 | 46 of 131 | 00656 (-46), 00601 (-31), 00653 (-31) | 00670 (+46), 00767 (+35), 00622 (+34) |
| Diabetes & hormones | 60 | 231 | 0.07 | 0.76 | 59 of 131 | 00729 (-53), 00725 (-51), 00778 (-49) | 00767 (+52), 00650 (+46), 00688 (+44) |
| Cancer care / oncology | 90 | 353 | 0.18 | 0.62 | 75 of 131 | 00725 (-35), 00729 (-34), 00778 (-32) | 00731 (+46), 00780 (+42), 00901 (+41) |
| Arthritis / rheumatology | 60 | 115 | 0.04 | 0.80 | 50 of 131 | 00729 (-46), 00782 (-46), 00725 (-45) | 00670 (+46), 00767 (+38), 00622 (+34) |
| Brain & nerves / neurology | 60 | 343 | 0.24 | 0.78 | 33 of 131 | 00692 (-24), 00729 (-24), 00782 (-23) | 00901 (+30), 00979 (+29), 00723 (+28) |
| Ear, nose & throat | 60 | 113 | 0.08 | 0.73 | 58 of 131 | 00692 (-30), 00725 (-30), 00729 (-30) | 00901 (+41), 00906 (+39), 00913 (+37) |
| Urology | 60 | 195 | 0.08 | 0.76 | 73 of 131 | 00656 (-58), 00729 (-40), 00601 (-38) | 00731 (+45), 00780 (+39), 00622 (+38) |
| Foot & ankle / podiatry | 60 | 94 | 0.16 | 0.81 | 0 of 131 | 00729 (-10), 00656 (-9), 00772 (-9) | 00765 (+12), 00901 (+12), 00906 (+12) |
| Pain management | 60 | 107 | 0.09 | 0.77 | 14 of 131 | 00729 (-25), 00782 (-21), 00692 (-18) | 00767 (+32), 00723 (+30), 00765 (+20) |
| Plastic & reconstructive surgery | 90 | 94 | 0.07 | 0.66 | 90 of 131 | 00782 (-29), 00736 (-28), 00786 (-25) | 00911 (+43), 00913 (+43), 00912 (+42) |
| Speech & language therapy | 30 | 1,866 | 0.87 | 0.69 | 37 of 131 | 00969 (-26), 00921 (-25), 00925 (-22) | 00611 (+35), 00688 (+31), 00767 (+31) |
| Nutrition & dietitian | 30 | 789 | 0.32 | 0.82 | 44 of 131 | 00969 (-30), 00921 (-26), 00966 (-25) | 00979 (+45), 00956 (+34), 00754 (+31) |
| Acupuncture, massage & naturopathy | 30 | 316 | 0.50 | 0.81 | 1 of 131 | 00969 (-11), 00921 (-10), 00925 (-9) | 00723 (+15), 00767 (+14), 00677 (+13) |
| Urgent care & emergency | 30 | 1,625 | 0.50 | 0.75 | 27 of 131 | 00951 (-75), 00775 (-67), 00725 (-57) | 00979 (+34), 00956 (+32), 00780 (+30) |
| Imaging & lab | 60 | 2,692 | 0.55 | 0.65 | 40 of 131 | 00775 (-45), 00778 (-44), 00725 (-41) | 00606 (+49), 00767 (+49), 00650 (+48) |
| Pharmacy | 30 | 6,944 | 1.68 | 0.57 | 47 of 131 | 00775 (-53), 00725 (-28), 00717 (-26) | 00606 (+53), 00631 (+50), 00765 (+49) |
| Home health & in-home care | 30 | 419 | 1.49 | 0.63 | 0 of 131 | 00660 (-3), 00717 (-3), 00725 (-3) | 00670 (+7), 00606 (+5), 00622 (+5) |
| Nursing & assisted living | 60 | 107 | 0.37 | 0.57 | 0 of 131 | 00725 (-5), 00739 (-4), 00778 (-4) | 00765 (+10), 00784 (+5), 00606 (+4) |
| Medical equipment & supplies | 60 | 804 | 0.34 | 0.82 | 18 of 131 | 00656 (-21), 00729 (-19), 00692 (-18) | 00765 (+37), 00670 (+34), 00622 (+30) |
| Hearing & audiology | 60 | 226 | 0.20 | 0.71 | 10 of 131 | 00692 (-17), 00729 (-15), 00777 (-15) | 00901 (+18), 00650 (+17), 00765 (+16) |
| Behavior therapy (ABA) | 30 | 157 | 2.58 | 0.80 | 0 of 131 | 00603 (-2), 00690 (-2), 00969 (-2) | 00949 (+2), 00953 (+2), 00979 (+2) |
| Care coordination & community health | 30 | 833 | 1.55 | 0.76 | 1 of 131 | 00775 (-19), 00717 (-6), 00730 (-6) | 00631 (+9), 00650 (+9), 00688 (+7) |
| General surgery | 60 | 367 | 0.39 | 0.77 | 7 of 131 | 00656 (-23), 00601 (-16), 00653 (-16) | 00731 (+23), 00780 (+19), 00624 (+14) |
| Infectious disease | 90 | 143 | 0.06 | 0.67 | 93 of 131 | 00612 (-47), 00782 (-39), 00736 (-38) | 00979 (+48), 00780 (+47), 00731 (+44) |
| Genetics & genetic counseling | 90 | 26 | 0.03 | 0.64 | 10 of 131 | 00782 (-17), 00951 (-15), 00646 (-13) | 00650 (+26), 00688 (+21), 00765 (+18) |
| Hospice & palliative care | 60 | 96 | 0.09 | 0.76 | 5 of 131 | 00685 (-13), 00646 (-12), 00729 (-10) | 00622 (+21), 00650 (+19), 00767 (+17) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 00901 | Primary care / family doctor | 4.766 | 3.412 | 50 | 64 |
| 00901 | Mental health & counseling | 5.270 | 3.823 | 63 | 73 |
| 00901 | Heart / cardiology | 0.478 | 0.304 | 15 | 46 |
| 00901 | Cancer care / oncology | 0.307 | 0.162 | 14 | 55 |
| 00901 | Urgent care & emergency | 1.747 | 1.324 | 0 | 0 |
| 00907 | Primary care / family doctor | 4.586 | 4.658 | 52 | 51 |
| 00907 | Mental health & counseling | 5.085 | 5.183 | 64 | 64 |
| 00907 | Heart / cardiology | 0.449 | 0.333 | 20 | 41 |
| 00907 | Cancer care / oncology | 0.289 | 0.169 | 19 | 53 |
| 00907 | Urgent care & emergency | 1.655 | 1.626 | 0 | 0 |
| 00918 | Primary care / family doctor | 4.262 | 5.619 | 55 | 41 |
| 00918 | Mental health & counseling | 4.717 | 6.320 | 67 | 56 |
| 00918 | Heart / cardiology | 0.394 | 0.351 | 30 | 38 |
| 00918 | Cancer care / oncology | 0.247 | 0.174 | 30 | 51 |
| 00918 | Urgent care & emergency | 1.477 | 1.764 | 0 | 0 |
| 00926 | Primary care / family doctor | 4.110 | 5.021 | 57 | 47 |
| 00926 | Mental health & counseling | 4.650 | 5.729 | 67 | 60 |
| 00926 | Heart / cardiology | 0.385 | 0.336 | 32 | 40 |
| 00926 | Cancer care / oncology | 0.224 | 0.172 | 37 | 52 |
| 00926 | Urgent care & emergency | 1.272 | 1.521 | 0 | 0 |
| 00961 | Primary care / family doctor | 4.274 | 4.638 | 55 | 51 |
| 00961 | Mental health & counseling | 4.758 | 4.934 | 67 | 65 |
| 00961 | Heart / cardiology | 0.388 | 0.334 | 31 | 41 |
| 00961 | Cancer care / oncology | 0.260 | 0.169 | 27 | 53 |
| 00961 | Urgent care & emergency | 1.522 | 1.535 | 0 | 0 |
| 00680 | Primary care / family doctor | 4.468 | 5.378 | 53 | 44 |
| 00680 | Mental health & counseling | 3.461 | 4.299 | 76 | 70 |
| 00680 | Heart / cardiology | 0.175 | 0.152 | 69 | 73 |
| 00680 | Cancer care / oncology | 0.102 | 0.091 | 71 | 74 |
| 00680 | Urgent care & emergency | 0.350 | 0.338 | 65 | 66 |
| 00725 | Primary care / family doctor | 2.953 | 4.358 | 69 | 54 |
| 00725 | Mental health & counseling | 3.283 | 4.936 | 77 | 65 |
| 00725 | Heart / cardiology | 0.208 | 0.323 | 63 | 42 |
| 00725 | Cancer care / oncology | 0.062 | 0.185 | 83 | 48 |
| 00725 | Urgent care & emergency | 0.300 | 0.864 | 70 | 13 |
| 00791 | Primary care / family doctor | 2.621 | 3.131 | 73 | 67 |
| 00791 | Mental health & counseling | 2.184 | 2.776 | 85 | 81 |
| 00791 | Heart / cardiology | 0.105 | 0.171 | 81 | 70 |
| 00791 | Cancer care / oncology | 0.091 | 0.125 | 74 | 65 |
| 00791 | Urgent care & emergency | 0.250 | 0.310 | 75 | 69 |
| 00612 | Primary care / family doctor | 2.923 | 4.081 | 69 | 57 |
| 00612 | Mental health & counseling | 2.890 | 3.893 | 80 | 73 |
| 00612 | Heart / cardiology | 0.104 | 0.142 | 82 | 75 |
| 00612 | Cancer care / oncology | 0.071 | 0.140 | 80 | 61 |
| 00612 | Urgent care & emergency | 0.295 | 0.410 | 70 | 59 |
| 00601 | Primary care / family doctor | 2.935 | 2.065 | 69 | 78 |
| 00601 | Mental health & counseling | 2.362 | 1.842 | 83 | 87 |
| 00601 | Heart / cardiology | 0.058 | 0.213 | 90 | 62 |
| 00601 | Cancer care / oncology | 0.036 | 0.099 | 90 | 72 |
| 00601 | Urgent care & emergency | 0.261 | 0.257 | 74 | 74 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
