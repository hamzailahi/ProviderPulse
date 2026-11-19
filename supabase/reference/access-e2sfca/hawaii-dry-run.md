# E2SFCA access dry run: Hawaii

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 94; in Hawaii: 94
- Drive times: OSRM on OpenStreetMap roads (car profile), 94 x 94 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 1
- Listings read: 39,716; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.66 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (9.16), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 7; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 6 (96729, 96742, 96748, 96757, 96763, 96770)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 96714 | yes | 16.12 | 100% | 5.34 | 100% | yes (4.37) |
| 96729 | yes | 3.42 | 33% | 3.42 | 33% | no |
| 96742 | yes | 2.51 | 33% | 2.51 | 33% | no |
| 96748 | yes | 6.00 | 33% | 6.00 | 33% | no |
| 96757 | yes | 2.65 | 33% | 2.65 | 33% | no |
| 96763 | yes | none | 0% | none | 0% | no |
| 96770 | yes | 2.96 | 33% | 2.96 | 33% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 4,884 | 4.78 | 0.34 | 49 of 88 | 96750 (-46), 96731 (-34), 96743 (-34) | 96710 (+57), 96728 (+50), 96781 (+48) |
| Pediatrics (children) | 30 | 1,155 | 1.13 | 0.53 | 51 of 88 | 96750 (-72), 96743 (-41), 96766 (-31) | 96795 (+62), 96825 (+49), 96719 (+46) |
| Women's health / OB-GYN | 60 | 627 | 0.55 | 0.66 | 32 of 88 | 96743 (-28), 96857 (-28), 96707 (-27) | 96790 (+56), 96755 (+53), 96719 (+48) |
| Mental health & counseling | 30 | 7,383 | 7.13 | 0.32 | 43 of 88 | 96731 (-74), 96766 (-50), 96750 (-49) | 96781 (+94), 96773 (+93), 96710 (+80) |
| Dental | 30 | 2,162 | 1.64 | 0.53 | 64 of 88 | 96750 (-53), 96766 (-47), 96720 (-38) | 96710 (+72), 96728 (+72), 96773 (+72) |
| Eye care | 30 | 864 | 0.65 | 0.30 | 61 of 88 | 96720 (-45), 96732 (-43), 96766 (-30) | 96705 (+89), 96710 (+89), 96728 (+89) |
| Chiropractic | 30 | 622 | 0.64 | 0.43 | 45 of 88 | 96712 (-75), 96714 (-32), 96722 (-32) | 96719 (+83), 96755 (+80), 96727 (+74) |
| Physical & occupational therapy | 30 | 2,703 | 2.73 | 0.66 | 42 of 88 | 96732 (-35), 96817 (-23), 96720 (-22) | 96725 (+48), 96773 (+46), 96781 (+46) |
| Orthopedics & sports injury | 60 | 442 | 0.42 | 0.77 | 28 of 88 | 96857 (-29), 96707 (-25), 96759 (-25) | 96795 (+44), 96825 (+41), 96710 (+35) |
| Heart / cardiology | 60 | 228 | 0.28 | 0.78 | 31 of 88 | 96857 (-28), 96707 (-27), 96759 (-27) | 96790 (+52), 96727 (+40), 96821 (+34) |
| Skin / dermatology | 60 | 128 | 0.10 | 0.68 | 45 of 88 | 96707 (-42), 96722 (-38), 96857 (-36) | 96726 (+83), 96713 (+73), 96790 (+72) |
| Allergy & immunology | 60 | 27 | 0.03 | 0.86 | 15 of 72 | 96740 (-24), 96857 (-22), 96759 (-20) | 96726 (+62), 96743 (+45), 96825 (+36) |
| Lung, breathing & sleep | 60 | 80 | 0.14 | 0.75 | 12 of 88 | 96707 (-19), 96857 (-19), 96759 (-18) | 96773 (+24), 96744 (+23), 96821 (+23) |
| Digestive / gastroenterology | 60 | 117 | 0.13 | 0.80 | 34 of 88 | 96857 (-28), 96707 (-27), 96759 (-26) | 96727 (+40), 96755 (+37), 96744 (+36) |
| Kidney / nephrology | 60 | 176 | 0.12 | 0.77 | 47 of 88 | 96857 (-28), 96707 (-26), 96759 (-24) | 96790 (+77), 96773 (+68), 96708 (+63) |
| Diabetes & hormones | 60 | 63 | 0.07 | 0.69 | 45 of 88 | 96769 (-37), 96857 (-33), 96759 (-31) | 96714 (+80), 96722 (+79), 96747 (+59) |
| Cancer care / oncology | 90 | 141 | 0.18 | 0.73 | 32 of 88 | 96707 (-32), 96759 (-32), 96857 (-32) | 96773 (+39), 96821 (+39), 96795 (+38) |
| Arthritis / rheumatology | 60 | 32 | 0.04 | 0.86 | 23 of 72 | 96707 (-34), 96743 (-34), 96857 (-34) | 96821 (+41), 96744 (+40), 96825 (+33) |
| Brain & nerves / neurology | 60 | 166 | 0.24 | 0.75 | 14 of 88 | 96712 (-53), 96857 (-22), 96707 (-21) | 96795 (+32), 96825 (+32), 96821 (+28) |
| Ear, nose & throat | 60 | 63 | 0.08 | 0.62 | 37 of 88 | 96707 (-28), 96743 (-28), 96793 (-28) | 96773 (+60), 96790 (+57), 96710 (+55) |
| Urology | 60 | 79 | 0.08 | 0.73 | 33 of 88 | 96707 (-33), 96857 (-33), 96759 (-31) | 96773 (+54), 96710 (+50), 96795 (+48) |
| Foot & ankle / podiatry | 60 | 102 | 0.16 | 0.64 | 20 of 88 | 96712 (-29), 96720 (-21), 96857 (-16) | 96773 (+71), 96710 (+65), 96781 (+61) |
| Pain management | 60 | 67 | 0.09 | 0.60 | 47 of 88 | 96790 (-60), 96768 (-38), 96719 (-37) | 96773 (+98), 96710 (+90), 96781 (+85) |
| Plastic & reconstructive surgery | 90 | 62 | 0.07 | 0.79 | 25 of 72 | 96707 (-43), 96857 (-43), 96759 (-42) | 96713 (+53), 96795 (+45), 96825 (+43) |
| Speech & language therapy | 30 | 626 | 0.87 | 0.50 | 32 of 88 | 96750 (-84), 96766 (-30), 96732 (-24) | 96710 (+41), 96728 (+41), 96773 (+41) |
| Nutrition & dietitian | 30 | 309 | 0.32 | 0.57 | 49 of 88 | 96708 (-51), 96792 (-42), 96712 (-31) | 96710 (+42), 96728 (+42), 96773 (+42) |
| Acupuncture, massage & naturopathy | 30 | 2,168 | 0.50 | 0.34 | 22 of 88 | 96764 (-18), 96780 (-18), 96712 (-16) | 96752 (+100), 96710 (+86), 96792 (+70) |
| Urgent care & emergency | 30 | 587 | 0.50 | 0.57 | 65 of 88 | 96777 (-75), 96750 (-62), 96766 (-43) | 96704 (+74), 96825 (+70), 96821 (+57) |
| Imaging & lab | 60 | 475 | 0.55 | 0.64 | 28 of 88 | 96857 (-25), 96707 (-23), 96743 (-23) | 96710 (+45), 96781 (+45), 96773 (+40) |
| Pharmacy | 30 | 1,591 | 1.68 | 0.32 | 43 of 88 | 96777 (-47), 96720 (-39), 96766 (-37) | 96710 (+78), 96728 (+78), 96773 (+78) |
| Home health & in-home care | 30 | 617 | 1.49 | 0.15 | 28 of 88 | 96750 (-40), 96766 (-31), 96720 (-23) | 96710 (+52), 96728 (+52), 96773 (+52) |
| Nursing & assisted living | 60 | 437 | 0.37 | 0.55 | 29 of 88 | 96777 (-42), 96701 (-21), 96813 (-21) | 96791 (+78), 96710 (+60), 96773 (+60) |
| Medical equipment & supplies | 60 | 286 | 0.34 | 0.62 | 31 of 88 | 96720 (-16), 96766 (-14), 96857 (-13) | 96773 (+57), 96710 (+52), 96781 (+49) |
| Hearing & audiology | 60 | 165 | 0.20 | 0.66 | 32 of 88 | 96857 (-20), 96740 (-16), 96720 (-15) | 96773 (+52), 96710 (+48), 96781 (+45) |
| Behavior therapy (ABA) | 30 | 6,646 | 2.58 | 0.46 | 46 of 88 | 96766 (-17), 96743 (-16), 96754 (-14) | 96713 (+100), 96773 (+100), 96781 (+100) |
| Care coordination & community health | 30 | 1,130 | 1.55 | 0.14 | 45 of 88 | 96750 (-64), 96766 (-41), 96732 (-32) | 96710 (+78), 96728 (+78), 96773 (+78) |
| General surgery | 60 | 290 | 0.39 | 0.76 | 29 of 88 | 96707 (-24), 96857 (-24), 96732 (-22) | 96790 (+47), 96773 (+32), 96825 (+32) |
| Infectious disease | 90 | 52 | 0.06 | 0.82 | 29 of 88 | 96707 (-43), 96857 (-43), 96759 (-42) | 96795 (+51), 96825 (+48), 96821 (+46) |
| Genetics & genetic counseling | 90 | 37 | 0.03 | 0.83 | 28 of 35 | 96857 (-51), 96707 (-49), 96759 (-49) | 96795 (+33), 96825 (+29), 96734 (+27) |
| Hospice & palliative care | 60 | 47 | 0.09 | 0.63 | 26 of 88 | 96751 (-23), 96769 (-22), 96720 (-18) | 96773 (+63), 96710 (+58), 96781 (+55) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 3760 rows (ZIP x specialty) stored in access_e2sfca for HI; market-score now uses drive-time access for these ZIPs.
