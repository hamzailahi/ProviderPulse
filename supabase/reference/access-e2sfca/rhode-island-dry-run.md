# E2SFCA access dry run: Rhode Island

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 860; in Rhode Island: 81
- Drive times: OSRM on OpenStreetMap roads (car profile), 860 x 860 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 369,347; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.12 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.81), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 7; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (02652, 02657, 02666, 02667)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 02652 | no | 2.46 | 25% | 2.46 | 25% | no |
| 02657 | no | 2.52 | 25% | 2.52 | 25% | no |
| 02666 | no | 2.68 | 25% | 2.68 | 25% | no |
| 02667 | no | 2.36 | 25% | 2.36 | 25% | no |
| 02872 | yes | 10.65 | 100% | 2.96 | 100% | yes (2.37) |
| 06390 | no | 9.18 | 100% | 2.85 | 100% | yes (2.83) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 47,315 | 4.78 | 0.75 | 27 of 81 | 02914 (-19), 02903 (-17), 02904 (-17) | 02816 (+42), 02809 (+34), 02814 (+33) |
| Pediatrics (children) | 30 | 18,838 | 1.13 | 0.78 | 21 of 81 | 02895 (-70), 02876 (-66), 02824 (-64) | 02889 (+47), 02823 (+44), 02807 (+41) |
| Women's health / OB-GYN | 60 | 6,282 | 0.55 | 0.55 | 56 of 81 | 02876 (-50), 02824 (-49), 02895 (-48) | 02807 (+72), 02882 (+50), 02809 (+45) |
| Mental health & counseling | 30 | 108,639 | 7.13 | 0.76 | 30 of 81 | 02895 (-29), 02916 (-24), 02904 (-20) | 02807 (+53), 02809 (+46), 02837 (+42) |
| Dental | 30 | 18,972 | 1.64 | 0.40 | 17 of 81 | 02914 (-20), 02903 (-16), 02916 (-15) | 02807 (+48), 02837 (+44), 02814 (+37) |
| Eye care | 30 | 6,557 | 0.65 | 0.64 | 32 of 81 | 02914 (-24), 02871 (-20), 02916 (-20) | 02807 (+60), 02814 (+43), 02816 (+43) |
| Chiropractic | 30 | 4,242 | 0.64 | 0.59 | 11 of 81 | 02914 (-17), 02903 (-12), 02916 (-12) | 02807 (+38), 02837 (+35), 02816 (+24) |
| Physical & occupational therapy | 30 | 32,484 | 2.73 | 0.53 | 34 of 81 | 02876 (-57), 02895 (-55), 02824 (-43) | 02814 (+53), 02837 (+41), 02816 (+33) |
| Orthopedics & sports injury | 60 | 3,998 | 0.42 | 0.46 | 33 of 81 | 02807 (-49), 02832 (-28), 02825 (-27) | 02882 (+35), 02813 (+34), 02837 (+33) |
| Heart / cardiology | 60 | 2,982 | 0.28 | 0.77 | 41 of 81 | 02857 (-38), 02825 (-35), 02815 (-30) | 02807 (+41), 02921 (+36), 02878 (+31) |
| Skin / dermatology | 60 | 1,331 | 0.10 | 0.42 | 50 of 81 | 02876 (-59), 02824 (-53), 02898 (-48) | 02837 (+59), 02878 (+56), 02874 (+51) |
| Allergy & immunology | 60 | 399 | 0.03 | 0.64 | 45 of 81 | 02832 (-39), 02804 (-38), 02857 (-37) | 02852 (+63), 02816 (+50), 02878 (+48) |
| Lung, breathing & sleep | 60 | 1,310 | 0.14 | 0.71 | 33 of 81 | 02873 (-27), 02832 (-26), 02857 (-25) | 02807 (+48), 02806 (+37), 02921 (+37) |
| Digestive / gastroenterology | 60 | 1,479 | 0.13 | 0.65 | 62 of 81 | 02895 (-54), 02824 (-50), 02876 (-48) | 02809 (+49), 02823 (+49), 02807 (+47) |
| Kidney / nephrology | 60 | 918 | 0.12 | 0.59 | 45 of 81 | 02895 (-35), 02824 (-31), 02876 (-30) | 02807 (+65), 02813 (+34), 02889 (+33) |
| Diabetes & hormones | 60 | 1,070 | 0.07 | 0.82 | 25 of 81 | 02822 (-61), 02817 (-57), 02832 (-56) | 02807 (+56), 02837 (+25), 02816 (+14) |
| Cancer care / oncology | 90 | 2,221 | 0.18 | 0.56 | 56 of 81 | 02895 (-58), 02824 (-51), 02876 (-48) | 02807 (+63), 02823 (+62), 02889 (+53) |
| Arthritis / rheumatology | 60 | 563 | 0.04 | 0.47 | 61 of 81 | 02858 (-46), 02832 (-43), 02895 (-43) | 02807 (+55), 02809 (+53), 02808 (+48) |
| Brain & nerves / neurology | 60 | 2,845 | 0.24 | 0.67 | 55 of 81 | 02895 (-37), 02825 (-33), 02824 (-32) | 02823 (+56), 02889 (+54), 02921 (+54) |
| Ear, nose & throat | 60 | 693 | 0.08 | 0.30 | 30 of 81 | 02832 (-32), 02825 (-24), 02873 (-24) | 02807 (+71), 02878 (+44), 02809 (+35) |
| Urology | 60 | 852 | 0.08 | 0.41 | 48 of 81 | 02895 (-56), 02824 (-52), 02876 (-51) | 02807 (+82), 02921 (+43), 02813 (+38) |
| Foot & ankle / podiatry | 60 | 1,308 | 0.16 | 0.47 | 30 of 81 | 02832 (-38), 02873 (-28), 02827 (-22) | 02807 (+82), 02816 (+44), 02809 (+35) |
| Pain management | 60 | 489 | 0.09 | 0.20 | 17 of 81 | 02832 (-19), 02836 (-18), 02898 (-18) | 02807 (+41), 02808 (+30), 02833 (+29) |
| Plastic & reconstructive surgery | 90 | 597 | 0.07 | 0.36 | 48 of 81 | 02895 (-48), 02824 (-45), 02876 (-44) | 02809 (+72), 02823 (+61), 02893 (+57) |
| Speech & language therapy | 30 | 7,074 | 0.87 | 0.64 | 21 of 81 | 02914 (-19), 02903 (-15), 02916 (-14) | 02807 (+44), 02809 (+29), 02814 (+28) |
| Nutrition & dietitian | 30 | 4,108 | 0.32 | 0.82 | 28 of 81 | 02895 (-30), 02838 (-26), 02832 (-18) | 02807 (+71), 02837 (+55), 02816 (+46) |
| Acupuncture, massage & naturopathy | 30 | 4,208 | 0.50 | 0.60 | 17 of 81 | 02886 (-16), 02895 (-14), 02903 (-14) | 02859 (+38), 02837 (+34), 02873 (+33) |
| Urgent care & emergency | 30 | 4,289 | 0.50 | 0.78 | 32 of 81 | 02895 (-39), 02838 (-28), 02824 (-24) | 02807 (+65), 02816 (+59), 02806 (+52) |
| Imaging & lab | 60 | 5,455 | 0.55 | 0.68 | 40 of 81 | 02895 (-28), 02832 (-26), 02824 (-23) | 02823 (+43), 02889 (+38), 02806 (+37) |
| Pharmacy | 30 | 14,002 | 1.68 | 0.62 | 26 of 81 | 02914 (-24), 02903 (-22), 02912 (-20) | 02807 (+55), 02814 (+34), 02837 (+30) |
| Home health & in-home care | 30 | 5,737 | 1.49 | 0.82 | 1 of 81 | 02895 (-5), 02916 (-5), 02824 (-4) | 02831 (+19), 02893 (+14), 02806 (+12) |
| Nursing & assisted living | 60 | 2,584 | 0.37 | 0.28 | 23 of 81 | 02861 (-16), 02914 (-16), 02903 (-15) | 02814 (+40), 02827 (+38), 02807 (+29) |
| Medical equipment & supplies | 60 | 2,023 | 0.34 | 0.42 | 19 of 81 | 02832 (-31), 02873 (-24), 02898 (-21) | 02807 (+32), 02818 (+27), 02840 (+24) |
| Hearing & audiology | 60 | 1,760 | 0.20 | 0.08 | 45 of 81 | 02838 (-31), 02895 (-29), 02858 (-28) | 02852 (+55), 02807 (+47), 02809 (+45) |
| Behavior therapy (ABA) | 30 | 21,626 | 2.58 | 0.86 | 6 of 81 | 02916 (-14), 02911 (-12), 02860 (-10) | 02859 (+24), 02809 (+23), 02816 (+23) |
| Care coordination & community health | 30 | 13,767 | 1.55 | 0.84 | 8 of 81 | 02914 (-19), 02916 (-14), 02895 (-12) | 02809 (+34), 02859 (+20), 02878 (+20) |
| General surgery | 60 | 3,590 | 0.39 | 0.61 | 38 of 81 | 02825 (-34), 02832 (-33), 02895 (-33) | 02823 (+39), 02809 (+38), 02807 (+37) |
| Infectious disease | 90 | 788 | 0.06 | 0.72 | 53 of 81 | 02895 (-67), 02824 (-59), 02876 (-57) | 02823 (+56), 02889 (+53), 02921 (+47) |
| Genetics & genetic counseling | 90 | 476 | 0.03 | 0.61 | 33 of 81 | 02864 (-85), 02838 (-77), 02895 (-74) | 02823 (+75), 02889 (+64), 02886 (+50) |
| Hospice & palliative care | 60 | 419 | 0.09 | 0.48 | 23 of 81 | 02895 (-31), 02824 (-30), 02876 (-30) | 02807 (+34), 02852 (+24), 02921 (+23) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
