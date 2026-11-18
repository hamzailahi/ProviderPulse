# E2SFCA access dry run: Texas

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,474; in Texas: 1,899
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,474 x 3,474 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 865,140; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.70 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.75), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 50; re-anchored: 17; still implausible (left out of the rank comparison, marked in the CSV): 31 (64866, 65604, 65608, 65611, 65612, 65614, 65646, 65667, 65680, 65704, 65712, 65723, 65729, 65733, 66724, 66725, 66753, 66781, 66782, 67104, 67146, 67152, 67351, 67354, 67356, 67357, 72661, 81091, 81120, 87521, 87573)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 64855 | no | 7.26 | 100% | 0.00 | 100% | yes (22.59) |
| 64866 | no | 12.16 | 100% | 12.16 | 100% | no |
| 64867 | no | 7.88 | 100% | 5.71 | 100% | yes (13.77) |
| 65604 | no | 6.86 | 100% | 6.86 | 100% | no |
| 65608 | no | 0.01 | 42% | 0.01 | 42% | no |
| 65611 | no | 6.91 | 100% | 7.38 | 100% | no |
| 65612 | no | 7.97 | 100% | 7.97 | 100% | no |
| 65614 | no | 8.19 | 92% | 8.19 | 92% | no |
| 65646 | no | 13.31 | 100% | 13.59 | 100% | no |
| 65654 | no | 11.70 | 100% | 4.61 | 100% | yes (35.52) |
| 65664 | no | 8.49 | 100% | 6.70 | 100% | yes (46.84) |
| 65667 | no | 0.22 | 25% | 0.22 | 25% | no |
| 65680 | no | 8.12 | 100% | 8.12 | 100% | no |
| 65704 | no | 0.27 | 42% | 0.27 | 42% | no |
| 65707 | no | 11.70 | 100% | 0.01 | 100% | no |
| 65712 | no | 7.03 | 100% | 14.45 | 100% | no |
| 65723 | no | 12.55 | 100% | 11.13 | 100% | no |
| 65729 | no | 0.62 | 42% | 0.62 | 33% | no |
| 65733 | no | 7.16 | 75% | 7.16 | 83% | no |
| 65737 | no | 7.57 | 100% | 0.20 | 100% | yes (13.94) |
| 65738 | no | 8.58 | 100% | 0.17 | 100% | yes (42.45) |
| 65746 | no | 7.29 | 75% | 0.00 | 75% | yes (43.17) |
| 66724 | no | 7.67 | 100% | 7.23 | 100% | no |
| 66725 | no | 6.88 | 100% | 6.88 | 100% | no |
| 66753 | no | 6.81 | 100% | 6.81 | 100% | no |
| 66760 | no | 6.91 | 100% | 4.11 | 100% | yes (18.38) |
| 66781 | no | 6.97 | 100% | 7.21 | 100% | no |
| 66782 | no | 9.63 | 100% | 9.63 | 100% | no |
| 67103 | no | 7.02 | 100% | 5.48 | 100% | yes (13.77) |
| 67104 | no | 7.24 | 100% | 7.24 | 100% | no |
| 67146 | no | 6.75 | 100% | 6.75 | 100% | no |
| 67152 | no | 6.88 | 100% | 7.22 | 100% | no |
| 67351 | no | 7.44 | 100% | 7.44 | 100% | no |
| 67354 | no | 7.40 | 100% | 7.40 | 100% | no |
| 67356 | no | 8.28 | 100% | 8.28 | 100% | no |
| 67357 | no | 7.03 | 100% | 7.03 | 100% | no |
| 72661 | no | 6.14 | 17% | 6.90 | 83% | yes (2.00) |
| 78402 | yes | 6.87 | 100% | 3.11 | 100% | yes (1.96) |
| 81091 | no | 8.93 | 100% | 8.93 | 100% | no |
| 81120 | no | 9.40 | 100% | 9.40 | 100% | no |
| 81121 | no | none | 0% | 5.57 | 100% | yes (3.21) |
| 87510 | no | 7.35 | 100% | 2.76 | 100% | yes (2.65) |
| 87512 | no | 7.87 | 100% | 3.52 | 100% | yes (2.13) |
| 87521 | no | 8.30 | 100% | 7.91 | 100% | no |
| 87522 | no | 8.49 | 100% | 4.69 | 100% | yes (2.48) |
| 87573 | no | 8.42 | 100% | 8.42 | 100% | no |
| 87579 | no | 22.36 | 100% | 4.06 | 100% | yes (2.65) |
| 87713 | no | 6.93 | 100% | 6.21 | 100% | no |
| 87742 | no | 7.11 | 100% | 5.69 | 100% | no |
| 88347 | no | 7.11 | 100% | 5.39 | 100% | yes (1.82) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 123,538 | 4.78 | 0.60 | 842 of 1899 | 76234 (-62), 78843 (-62), 79502 (-52) | 78598 (+90), 79010 (+87), 79503 (+78) |
| Pediatrics (children) | 30 | 26,166 | 1.13 | 0.79 | 478 of 1899 | 78385 (-82), 78044 (-71), 78843 (-68) | 78373 (+100), 76569 (+96), 79325 (+94) |
| Women's health / OB-GYN | 60 | 13,846 | 0.55 | 0.76 | 694 of 1899 | 78879 (-87), 78838 (-63), 75705 (-55) | 78860 (+85), 79533 (+70), 79535 (+67) |
| Mental health & counseling | 30 | 154,399 | 7.13 | 0.76 | 310 of 1899 | 78843 (-77), 79001 (-74), 79518 (-70) | 78732 (+71), 78742 (+58), 79325 (+58) |
| Dental | 30 | 44,997 | 1.64 | 0.72 | 798 of 1899 | 76253 (-64), 76252 (-60), 76452 (-60) | 76935 (+65), 78004 (+64), 76389 (+62) |
| Eye care | 30 | 17,269 | 0.65 | 0.69 | 812 of 1899 | 76525 (-66), 78654 (-65), 76033 (-54) | 78373 (+92), 79233 (+91), 78832 (+84) |
| Chiropractic | 30 | 16,253 | 0.64 | 0.72 | 711 of 1899 | 79064 (-73), 76265 (-49), 76844 (-49) | 79010 (+98), 79098 (+83), 78645 (+71) |
| Physical & occupational therapy | 30 | 65,052 | 2.73 | 0.64 | 727 of 1899 | 78843 (-87), 77483 (-86), 79244 (-58) | 79010 (+96), 78373 (+80), 79098 (+79) |
| Orthopedics & sports injury | 60 | 10,161 | 0.42 | 0.74 | 636 of 1899 | 79778 (-78), 79607 (-54), 77836 (-48) | 79533 (+100), 79847 (+99), 76239 (+83) |
| Heart / cardiology | 60 | 6,401 | 0.28 | 0.79 | 732 of 1899 | 77037 (-60), 77016 (-57), 75705 (-54) | 78598 (+95), 79533 (+86), 78590 (+83) |
| Skin / dermatology | 60 | 2,417 | 0.10 | 0.83 | 658 of 1899 | 75792 (-58), 75705 (-57), 78653 (-56) | 76389 (+94), 76351 (+75), 78027 (+75) |
| Allergy & immunology | 60 | 899 | 0.03 | 0.83 | 664 of 1899 | 77016 (-67), 75692 (-65), 77078 (-65) | 78024 (+98), 76266 (+87), 76249 (+79) |
| Lung, breathing & sleep | 60 | 3,527 | 0.14 | 0.80 | 684 of 1899 | 78410 (-69), 78339 (-68), 75692 (-58) | 76491 (+85), 79533 (+80), 76430 (+77) |
| Digestive / gastroenterology | 60 | 2,868 | 0.13 | 0.80 | 684 of 1899 | 77016 (-61), 77093 (-58), 75692 (-57) | 78598 (+94), 78590 (+85), 79533 (+77) |
| Kidney / nephrology | 60 | 3,579 | 0.12 | 0.67 | 920 of 1899 | 79730 (-67), 75782 (-63), 78387 (-60) | 76852 (+100), 78044 (+100), 78860 (+100) |
| Diabetes & hormones | 60 | 1,456 | 0.07 | 0.82 | 561 of 1899 | 78838 (-65), 77028 (-61), 77093 (-61) | 78873 (+100), 76389 (+91), 79506 (+91) |
| Cancer care / oncology | 90 | 3,999 | 0.18 | 0.61 | 876 of 1899 | 77013 (-77), 77016 (-77), 77078 (-76) | 78879 (+100), 79533 (+82), 78838 (+78) |
| Arthritis / rheumatology | 60 | 1,005 | 0.04 | 0.81 | 725 of 1899 | 77013 (-62), 77093 (-62), 76357 (-61) | 79533 (+100), 76389 (+89), 76239 (+87) |
| Brain & nerves / neurology | 60 | 7,269 | 0.24 | 0.84 | 576 of 1899 | 78223 (-88), 78023 (-85), 78245 (-80) | 79533 (+100), 79504 (+96), 78598 (+87) |
| Ear, nose & throat | 60 | 1,815 | 0.08 | 0.76 | 766 of 1899 | 75763 (-91), 75692 (-90), 75782 (-88) | 76878 (+100), 78024 (+100), 79533 (+100) |
| Urology | 60 | 1,874 | 0.08 | 0.75 | 756 of 1899 | 75705 (-74), 79061 (-61), 79068 (-55) | 79533 (+100), 76389 (+95), 77990 (+93) |
| Foot & ankle / podiatry | 60 | 3,261 | 0.16 | 0.74 | 571 of 1899 | 75782 (-57), 75778 (-48), 75763 (-45) | 76670 (+84), 78075 (+82), 75496 (+81) |
| Pain management | 60 | 3,123 | 0.09 | 0.80 | 741 of 1899 | 75705 (-89), 75141 (-69), 75750 (-62) | 78598 (+93), 75101 (+86), 76093 (+85) |
| Plastic & reconstructive surgery | 90 | 1,870 | 0.07 | 0.76 | 859 of 1899 | 77506 (-74), 77015 (-72), 77049 (-70) | 79755 (+100), 78618 (+93), 75847 (+72) |
| Speech & language therapy | 30 | 30,828 | 0.87 | 0.71 | 872 of 1899 | 79789 (-81), 78881 (-78), 77659 (-73) | 78044 (+100), 78369 (+100), 78371 (+100) |
| Nutrition & dietitian | 30 | 8,914 | 0.32 | 0.77 | 620 of 1899 | 76671 (-91), 79019 (-89), 75938 (-71) | 79010 (+93), 75932 (+87), 79098 (+83) |
| Acupuncture, massage & naturopathy | 30 | 7,762 | 0.50 | 0.78 | 238 of 1899 | 79371 (-93), 79059 (-83), 78597 (-71) | 78734 (+59), 78732 (+58), 78742 (+53) |
| Urgent care & emergency | 30 | 14,539 | 0.50 | 0.52 | 1003 of 1899 | 79373 (-83), 76360 (-82), 75862 (-81) | 76429 (+100), 76460 (+100), 76481 (+100) |
| Imaging & lab | 60 | 14,844 | 0.55 | 0.81 | 674 of 1899 | 77013 (-74), 77028 (-67), 77547 (-66) | 78598 (+83), 79533 (+83), 78590 (+73) |
| Pharmacy | 30 | 44,795 | 1.68 | 0.57 | 922 of 1899 | 75801 (-62), 78064 (-59), 79241 (-49) | 79010 (+97), 78860 (+95), 76569 (+90) |
| Home health & in-home care | 30 | 28,945 | 1.49 | 0.73 | 459 of 1899 | 76455 (-81), 79261 (-69), 77564 (-54) | 75555 (+96), 77481 (+87), 77444 (+79) |
| Nursing & assisted living | 60 | 10,208 | 0.37 | 0.57 | 824 of 1899 | 76648 (-82), 75782 (-60), 79068 (-57) | 76852 (+100), 76888 (+100), 79255 (+100) |
| Medical equipment & supplies | 60 | 12,583 | 0.34 | 0.75 | 788 of 1899 | 75705 (-69), 75782 (-69), 78538 (-69) | 78843 (+100), 76491 (+99), 78598 (+90) |
| Hearing & audiology | 60 | 5,197 | 0.20 | 0.74 | 707 of 1899 | 75705 (-100), 75792 (-94), 75778 (-76) | 78024 (+100), 77617 (+97), 76389 (+93) |
| Behavior therapy (ABA) | 30 | 53,203 | 2.58 | 0.82 | 339 of 1899 | 79001 (-82), 76086 (-60), 78879 (-60) | 78608 (+100), 76935 (+98), 76544 (+93) |
| Care coordination & community health | 30 | 42,866 | 1.55 | 0.79 | 78 of 1899 | 76525 (-68), 76544 (-57), 79039 (-51) | 79325 (+97), 75412 (+90), 75692 (+89) |
| General surgery | 60 | 11,273 | 0.39 | 0.78 | 732 of 1899 | 77013 (-76), 77016 (-76), 77093 (-75) | 78860 (+100), 79533 (+100), 79503 (+90) |
| Infectious disease | 90 | 1,159 | 0.06 | 0.72 | 889 of 1899 | 77049 (-64), 77015 (-62), 77502 (-55) | 78598 (+93), 78590 (+79), 75708 (+78) |
| Genetics & genetic counseling | 90 | 606 | 0.03 | 0.72 | 673 of 1899 | 77506 (-67), 77015 (-66), 77049 (-66) | 76123 (+77), 76132 (+76), 76116 (+75) |
| Hospice & palliative care | 60 | 3,702 | 0.09 | 0.75 | 839 of 1899 | 77502 (-81), 75441 (-80), 77506 (-80) | 76372 (+100), 76491 (+100), 78044 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 77030 | Primary care / family doctor | 8.551 | 9.484 | 11 | 1 |
| 77030 | Mental health & counseling | 7.659 | 7.948 | 46 | 44 |
| 77030 | Heart / cardiology | 0.710 | 0.464 | 0 | 17 |
| 77030 | Cancer care / oncology | 0.885 | 0.325 | 0 | 9 |
| 77030 | Urgent care & emergency | 1.125 | 1.240 | 0 | 0 |
| 75201 | Primary care / family doctor | 6.228 | 8.246 | 35 | 14 |
| 75201 | Mental health & counseling | 6.209 | 8.387 | 56 | 41 |
| 75201 | Heart / cardiology | 0.401 | 0.347 | 29 | 38 |
| 75201 | Cancer care / oncology | 0.267 | 0.142 | 25 | 60 |
| 75201 | Urgent care & emergency | 0.634 | 0.833 | 36 | 16 |
| 78701 | Primary care / family doctor | 6.519 | 7.680 | 32 | 20 |
| 78701 | Mental health & counseling | 12.204 | 14.813 | 14 | 0 |
| 78701 | Heart / cardiology | 0.361 | 0.285 | 36 | 49 |
| 78701 | Cancer care / oncology | 0.174 | 0.121 | 51 | 66 |
| 78701 | Urgent care & emergency | 0.701 | 0.860 | 30 | 14 |
| 79901 | Primary care / family doctor | 5.731 | 6.952 | 40 | 27 |
| 79901 | Mental health & counseling | 5.725 | 6.842 | 60 | 52 |
| 79901 | Heart / cardiology | 0.423 | 0.301 | 25 | 47 |
| 79901 | Cancer care / oncology | 0.164 | 0.097 | 54 | 73 |
| 79901 | Urgent care & emergency | 0.805 | 0.932 | 19 | 6 |
| 78501 | Primary care / family doctor | 6.237 | 7.616 | 35 | 20 |
| 78501 | Mental health & counseling | 3.581 | 4.363 | 75 | 69 |
| 78501 | Heart / cardiology | 0.295 | 0.218 | 47 | 61 |
| 78501 | Cancer care / oncology | 0.143 | 0.096 | 60 | 73 |
| 78501 | Urgent care & emergency | 0.408 | 0.489 | 59 | 51 |
| 79101 | Primary care / family doctor | 4.970 | 6.211 | 48 | 35 |
| 79101 | Mental health & counseling | 4.851 | 5.581 | 66 | 61 |
| 79101 | Heart / cardiology | 0.259 | 0.275 | 54 | 51 |
| 79101 | Cancer care / oncology | 0.287 | 0.227 | 19 | 36 |
| 79101 | Urgent care & emergency | 0.567 | 0.727 | 43 | 27 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 75960 rows (ZIP x specialty) stored in access_e2sfca for TX; market-score now uses drive-time access for these ZIPs.
