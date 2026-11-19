# E2SFCA access dry run: Maryland

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,442; in Maryland: 462
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,442 x 2,442 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 757,505; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.37 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.44), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 6 (08360, 21634, 21669, 21672, 22488, 23883)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 08360 | no | 10.01 | 100% | 10.01 | 100% | no |
| 15450 | no | 9.55 | 100% | 4.03 | 100% | yes (0.80) |
| 15466 | no | 10.02 | 100% | 3.64 | 100% | yes (0.82) |
| 17271 | no | 9.95 | 100% | 3.38 | 100% | yes (0.60) |
| 21634 | yes | 14.65 | 100% | 14.65 | 100% | no |
| 21669 | yes | 13.08 | 100% | 13.08 | 100% | no |
| 21672 | yes | 8.49 | 100% | 8.49 | 100% | no |
| 22488 | no | 13.01 | 100% | 13.01 | 100% | no |
| 23883 | no | 9.99 | 100% | 9.99 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 103,445 | 4.78 | 0.60 | 191 of 459 | 21077 (-43), 21641 (-36), 21542 (-35) | 21530 (+88), 21679 (+85), 21082 (+76) |
| Pediatrics (children) | 30 | 28,293 | 1.13 | 0.71 | 199 of 459 | 21077 (-51), 21641 (-40), 21666 (-30) | 21840 (+100), 21821 (+94), 21056 (+92) |
| Women's health / OB-GYN | 60 | 13,482 | 0.55 | 0.65 | 234 of 459 | 21636 (-46), 21723 (-43), 21650 (-40) | 21056 (+81), 20606 (+80), 20626 (+79) |
| Mental health & counseling | 30 | 153,837 | 7.13 | 0.68 | 197 of 459 | 21543 (-35), 21641 (-35), 21542 (-34) | 21622 (+88), 21626 (+87), 21865 (+83) |
| Dental | 30 | 33,098 | 1.64 | 0.61 | 195 of 459 | 21804 (-38), 21077 (-36), 21227 (-28) | 21840 (+100), 21821 (+91), 21865 (+84) |
| Eye care | 30 | 12,880 | 0.65 | 0.64 | 178 of 459 | 21750 (-86), 21620 (-38), 21077 (-32) | 21056 (+64), 21678 (+62), 20765 (+60) |
| Chiropractic | 30 | 9,886 | 0.64 | 0.60 | 92 of 459 | 21750 (-41), 21536 (-21), 21061 (-19) | 20839 (+47), 20837 (+46), 21056 (+40) |
| Physical & occupational therapy | 30 | 65,357 | 2.73 | 0.62 | 220 of 459 | 21532 (-41), 21641 (-39), 21077 (-38) | 20606 (+99), 21111 (+85), 21056 (+82) |
| Orthopedics & sports injury | 60 | 9,688 | 0.42 | 0.46 | 207 of 459 | 21607 (-59), 21644 (-49), 21668 (-49) | 20606 (+82), 20687 (+81), 20626 (+64) |
| Heart / cardiology | 60 | 6,799 | 0.28 | 0.67 | 247 of 459 | 21629 (-59), 21660 (-59), 21636 (-53) | 20765 (+73), 20776 (+68), 21034 (+66) |
| Skin / dermatology | 60 | 2,340 | 0.10 | 0.52 | 248 of 459 | 20770 (-59), 21607 (-57), 20706 (-56) | 21056 (+86), 20611 (+73), 20765 (+72) |
| Allergy & immunology | 60 | 990 | 0.03 | 0.76 | 270 of 459 | 21797 (-90), 21723 (-71), 21543 (-66) | 20606 (+82), 20626 (+81), 21154 (+74) |
| Lung, breathing & sleep | 60 | 2,920 | 0.14 | 0.61 | 216 of 459 | 21795 (-63), 21542 (-59), 21543 (-57) | 21790 (+66), 21865 (+66), 21856 (+64) |
| Digestive / gastroenterology | 60 | 3,135 | 0.13 | 0.67 | 277 of 459 | 21797 (-66), 21629 (-56), 21660 (-56) | 20765 (+73), 21056 (+71), 21037 (+69) |
| Kidney / nephrology | 60 | 2,752 | 0.12 | 0.61 | 269 of 459 | 21650 (-64), 21651 (-64), 21636 (-61) | 20606 (+83), 20677 (+79), 21626 (+63) |
| Diabetes & hormones | 60 | 1,740 | 0.07 | 0.60 | 261 of 459 | 21542 (-100), 21539 (-84), 21543 (-82) | 20677 (+82), 21671 (+80), 21652 (+79) |
| Cancer care / oncology | 90 | 4,164 | 0.18 | 0.53 | 315 of 459 | 21797 (-67), 21851 (-67), 21723 (-61) | 21662 (+81), 21663 (+81), 21679 (+79) |
| Arthritis / rheumatology | 60 | 1,120 | 0.04 | 0.70 | 250 of 459 | 21641 (-93), 21660 (-83), 21657 (-79) | 21626 (+77), 20658 (+73), 20765 (+72) |
| Brain & nerves / neurology | 60 | 5,078 | 0.24 | 0.72 | 245 of 459 | 20708 (-48), 20769 (-47), 21077 (-47) | 20606 (+59), 21154 (+54), 21788 (+53) |
| Ear, nose & throat | 60 | 1,613 | 0.08 | 0.56 | 260 of 459 | 21727 (-48), 20770 (-47), 20763 (-46) | 21056 (+86), 20606 (+81), 20626 (+80) |
| Urology | 60 | 1,889 | 0.08 | 0.51 | 286 of 459 | 21542 (-85), 21543 (-78), 21795 (-72) | 21056 (+84), 20765 (+70), 21037 (+68) |
| Foot & ankle / podiatry | 60 | 4,061 | 0.16 | 0.49 | 262 of 459 | 21727 (-71), 21853 (-71), 21651 (-69) | 21626 (+75), 21056 (+72), 20765 (+59) |
| Pain management | 60 | 1,958 | 0.09 | 0.43 | 293 of 459 | 21607 (-83), 21668 (-81), 21651 (-78) | 20606 (+72), 20626 (+70), 21056 (+65) |
| Plastic & reconstructive surgery | 90 | 1,462 | 0.07 | 0.64 | 286 of 459 | 20871 (-64), 20708 (-60), 20769 (-59) | 21662 (+86), 21663 (+86), 21653 (+84) |
| Speech & language therapy | 30 | 17,632 | 0.87 | 0.70 | 225 of 459 | 21607 (-48), 21077 (-36), 21157 (-35) | 20606 (+92), 21056 (+87), 21082 (+81) |
| Nutrition & dietitian | 30 | 7,085 | 0.32 | 0.69 | 208 of 459 | 21543 (-42), 21673 (-41), 21641 (-36) | 21530 (+95), 21791 (+81), 21545 (+74) |
| Acupuncture, massage & naturopathy | 30 | 6,825 | 0.50 | 0.77 | 167 of 459 | 21667 (-50), 21610 (-46), 20625 (-45) | 21791 (+99), 21036 (+83), 21737 (+74) |
| Urgent care & emergency | 30 | 10,449 | 0.50 | 0.61 | 185 of 459 | 21541 (-59), 21824 (-41), 21077 (-34) | 21622 (+100), 21626 (+100), 21677 (+100) |
| Imaging & lab | 60 | 10,994 | 0.55 | 0.63 | 201 of 459 | 21607 (-55), 21542 (-51), 21636 (-50) | 21530 (+59), 21610 (+59), 21865 (+57) |
| Pharmacy | 30 | 34,417 | 1.68 | 0.57 | 183 of 459 | 21550 (-37), 21077 (-35), 21661 (-35) | 21865 (+74), 21530 (+69), 21679 (+66) |
| Home health & in-home care | 30 | 56,351 | 1.49 | 0.81 | 101 of 459 | 20850 (-51), 21077 (-29), 21227 (-27) | 21711 (+100), 21766 (+99), 21541 (+98) |
| Nursing & assisted living | 60 | 6,442 | 0.37 | 0.72 | 181 of 459 | 21668 (-64), 21607 (-61), 21651 (-59) | 21626 (+61), 21829 (+60), 21657 (+53) |
| Medical equipment & supplies | 60 | 6,456 | 0.34 | 0.59 | 203 of 459 | 21542 (-59), 21543 (-52), 21650 (-41) | 20640 (+70), 20658 (+68), 20662 (+60) |
| Hearing & audiology | 60 | 4,040 | 0.20 | 0.41 | 272 of 459 | 21542 (-90), 21543 (-88), 21607 (-75) | 21056 (+71), 20765 (+66), 21111 (+64) |
| Behavior therapy (ABA) | 30 | 48,764 | 2.58 | 0.89 | 128 of 459 | 21793 (-41), 20742 (-37), 20782 (-37) | 20662 (+97), 21737 (+79), 20724 (+77) |
| Care coordination & community health | 30 | 25,796 | 1.55 | 0.74 | 172 of 459 | 21851 (-69), 21811 (-47), 21795 (-42) | 21850 (+85), 20606 (+60), 21840 (+58) |
| General surgery | 60 | 9,113 | 0.39 | 0.66 | 245 of 459 | 21660 (-70), 21629 (-61), 21835 (-58) | 20765 (+76), 20776 (+69), 21403 (+63) |
| Infectious disease | 90 | 1,573 | 0.06 | 0.73 | 272 of 459 | 21797 (-87), 21723 (-86), 21144 (-84) | 21865 (+75), 21856 (+74), 21830 (+69) |
| Genetics & genetic counseling | 90 | 973 | 0.03 | 0.74 | 267 of 459 | 20707 (-89), 20769 (-89), 20708 (-87) | 21652 (+93), 21864 (+92), 21612 (+91) |
| Hospice & palliative care | 60 | 1,250 | 0.09 | 0.62 | 127 of 459 | 21607 (-55), 21668 (-53), 21651 (-52) | 21610 (+68), 21662 (+63), 21663 (+63) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 20814 | Primary care / family doctor | 7.011 | 6.533 | 27 | 32 |
| 20814 | Mental health & counseling | 11.427 | 10.565 | 20 | 26 |
| 20814 | Heart / cardiology | 0.493 | 0.392 | 12 | 30 |
| 20814 | Cancer care / oncology | 0.355 | 0.257 | 0 | 28 |
| 20814 | Urgent care & emergency | 0.679 | 0.526 | 32 | 47 |
| 21401 | Primary care / family doctor | 5.804 | 7.088 | 39 | 26 |
| 21401 | Mental health & counseling | 9.412 | 10.764 | 34 | 25 |
| 21401 | Heart / cardiology | 0.270 | 0.344 | 52 | 39 |
| 21401 | Cancer care / oncology | 0.192 | 0.255 | 46 | 28 |
| 21401 | Urgent care & emergency | 0.338 | 0.420 | 66 | 58 |
| 21634 | Primary care / family doctor | 2.378 | 0.031 | 75 | 100 |
| 21634 | Mental health & counseling | 5.350 | 0.000 | 62 | 100 |
| 21634 | Heart / cardiology | 0.000 | 0.000 | 100 | 100 |
| 21634 | Cancer care / oncology | 0.000 | 0.007 | 100 | 98 |
| 21634 | Urgent care & emergency | 0.046 | 0.000 | 95 | 100 |
| 21669 | Primary care / family doctor | 3.895 | 0.000 | 59 | 100 |
| 21669 | Mental health & counseling | 7.163 | 0.000 | 50 | 100 |
| 21669 | Heart / cardiology | 0.105 | 0.058 | 81 | 90 |
| 21669 | Cancer care / oncology | 0.000 | 0.054 | 100 | 85 |
| 21669 | Urgent care & emergency | 0.601 | 0.000 | 40 | 100 |
| 21672 | Primary care / family doctor | 0.886 | 0.000 | 91 | 100 |
| 21672 | Mental health & counseling | 0.295 | 0.000 | 98 | 100 |
| 21672 | Heart / cardiology | 0.000 | 0.000 | 100 | 100 |
| 21672 | Cancer care / oncology | 0.000 | 0.000 | 100 | 100 |
| 21672 | Urgent care & emergency | 0.000 | 0.000 | 100 | 100 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 18480 rows (ZIP x specialty) stored in access_e2sfca for MD; market-score now uses drive-time access for these ZIPs.
