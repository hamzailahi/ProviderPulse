# E2SFCA access dry run: Delaware

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,209; in Delaware: 65
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,209 x 1,209 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 483,157; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.19 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.99), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 1; still implausible (left out of the rank comparison, marked in the CSV): 8 (21610, 21634, 21669, 21672, 21675, 21869, 23359, 23409)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 10302 | no | 3.03 | 42% | 2.96 | 58% | yes (2.26) |
| 21610 | no | 8.10 | 100% | 8.10 | 100% | no |
| 21634 | no | 14.65 | 100% | 14.65 | 100% | no |
| 21669 | no | 13.08 | 100% | 13.08 | 100% | no |
| 21672 | no | 8.49 | 100% | 8.49 | 100% | no |
| 21675 | no | 8.28 | 100% | 8.28 | 100% | no |
| 21869 | no | 8.24 | 100% | 8.24 | 100% | no |
| 23359 | no | 11.03 | 100% | 11.03 | 100% | no |
| 23409 | no | 9.15 | 100% | 9.15 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 68,208 | 4.78 | 0.68 | 17 of 65 | 19963 (-59), 19713 (-24), 19958 (-23) | 19962 (+35), 19964 (+28), 19934 (+25) |
| Pediatrics (children) | 30 | 18,482 | 1.13 | 0.67 | 18 of 65 | 19958 (-44), 19963 (-44), 19971 (-33) | 19731 (+54), 19964 (+41), 19952 (+37) |
| Women's health / OB-GYN | 60 | 9,050 | 0.55 | 0.25 | 42 of 65 | 19945 (-46), 19952 (-45), 19947 (-41) | 19707 (+35), 19706 (+28), 19977 (+28) |
| Mental health & counseling | 30 | 107,451 | 7.13 | 0.75 | 15 of 65 | 19713 (-27), 19963 (-24), 19945 (-20) | 19964 (+33), 19934 (+28), 19962 (+23) |
| Dental | 30 | 21,436 | 1.64 | 0.82 | 6 of 65 | 19963 (-23), 19713 (-21), 19711 (-16) | 19962 (+16), 19934 (+15), 19734 (+14) |
| Eye care | 30 | 8,787 | 0.65 | 0.64 | 14 of 65 | 19963 (-33), 19713 (-22), 19904 (-19) | 19934 (+38), 19964 (+37), 19962 (+27) |
| Chiropractic | 30 | 7,548 | 0.64 | 0.70 | 12 of 65 | 19963 (-42), 19958 (-32), 19713 (-24) | 19964 (+30), 19962 (+28), 19734 (+19) |
| Physical & occupational therapy | 30 | 46,096 | 2.73 | 0.66 | 25 of 65 | 19963 (-50), 19713 (-31), 19711 (-26) | 19964 (+41), 19934 (+35), 19962 (+33) |
| Orthopedics & sports injury | 60 | 6,370 | 0.42 | 0.43 | 37 of 65 | 19947 (-41), 19943 (-38), 19945 (-38) | 19707 (+39), 19702 (+29), 19807 (+28) |
| Heart / cardiology | 60 | 5,055 | 0.28 | -0.13 | 51 of 65 | 19966 (-50), 19947 (-48), 19952 (-47) | 19953 (+48), 19964 (+43), 19707 (+40) |
| Skin / dermatology | 60 | 1,497 | 0.10 | 0.67 | 19 of 65 | 19947 (-53), 19956 (-34), 19940 (-32) | 19707 (+36), 19706 (+16), 19805 (+15) |
| Allergy & immunology | 60 | 626 | 0.03 | 0.70 | 44 of 65 | 19730 (-41), 19709 (-37), 19955 (-35) | 19707 (+64), 19805 (+39), 19801 (+37) |
| Lung, breathing & sleep | 60 | 2,131 | 0.14 | 0.23 | 37 of 65 | 19945 (-47), 19952 (-47), 19943 (-45) | 19706 (+36), 19707 (+36), 19931 (+32) |
| Digestive / gastroenterology | 60 | 2,372 | 0.13 | 0.07 | 45 of 65 | 19966 (-88), 19945 (-78), 19939 (-65) | 19931 (+36), 19707 (+31), 19977 (+28) |
| Kidney / nephrology | 60 | 1,886 | 0.12 | 0.07 | 48 of 65 | 19952 (-54), 19943 (-52), 19945 (-45) | 19934 (+52), 19964 (+50), 19953 (+43) |
| Diabetes & hormones | 60 | 1,192 | 0.07 | 0.13 | 34 of 65 | 19943 (-52), 19952 (-51), 19730 (-40) | 19707 (+48), 19977 (+37), 19962 (+35) |
| Cancer care / oncology | 90 | 3,079 | 0.18 | 0.21 | 48 of 65 | 19966 (-54), 19945 (-52), 19975 (-50) | 19946 (+50), 19977 (+39), 19962 (+36) |
| Arthritis / rheumatology | 60 | 783 | 0.04 | -0.06 | 44 of 65 | 19947 (-78), 19941 (-76), 19966 (-70) | 19934 (+57), 19938 (+54), 19953 (+53) |
| Brain & nerves / neurology | 60 | 3,584 | 0.24 | 0.25 | 38 of 65 | 19966 (-32), 19945 (-31), 19956 (-30) | 19707 (+45), 19706 (+33), 19808 (+31) |
| Ear, nose & throat | 60 | 1,089 | 0.08 | 0.65 | 27 of 65 | 19966 (-31), 19709 (-27), 19730 (-27) | 19707 (+63), 19808 (+42), 19805 (+34) |
| Urology | 60 | 1,364 | 0.08 | -0.14 | 44 of 65 | 19966 (-64), 19945 (-59), 19939 (-50) | 19953 (+60), 19964 (+53), 19934 (+52) |
| Foot & ankle / podiatry | 60 | 3,546 | 0.16 | 0.42 | 26 of 65 | 19966 (-54), 19945 (-53), 19947 (-41) | 19707 (+38), 19977 (+25), 19901 (+22) |
| Pain management | 60 | 1,514 | 0.09 | 0.04 | 35 of 65 | 19945 (-58), 19975 (-48), 19950 (-43) | 19707 (+33), 19702 (+31), 19964 (+30) |
| Plastic & reconstructive surgery | 90 | 1,030 | 0.07 | 0.18 | 43 of 65 | 19952 (-39), 19933 (-38), 19956 (-37) | 19707 (+44), 19953 (+35), 19964 (+34) |
| Speech & language therapy | 30 | 12,864 | 0.87 | 0.72 | 22 of 65 | 19958 (-31), 19713 (-26), 19904 (-24) | 19964 (+43), 19731 (+41), 19977 (+33) |
| Nutrition & dietitian | 30 | 5,053 | 0.32 | 0.82 | 20 of 65 | 19963 (-50), 19713 (-32), 19945 (-32) | 19946 (+37), 19962 (+31), 19930 (+25) |
| Acupuncture, massage & naturopathy | 30 | 4,228 | 0.50 | 0.68 | 4 of 65 | 19958 (-18), 19713 (-15), 19963 (-15) | 19734 (+13), 19962 (+11), 19946 (+9) |
| Urgent care & emergency | 30 | 7,011 | 0.50 | 0.87 | 9 of 65 | 19953 (-43), 19955 (-35), 19979 (-30) | 19946 (+55), 19977 (+41), 19962 (+31) |
| Imaging & lab | 60 | 7,746 | 0.55 | 0.33 | 31 of 65 | 19952 (-42), 19943 (-40), 19947 (-34) | 19946 (+32), 19977 (+32), 19962 (+31) |
| Pharmacy | 30 | 23,841 | 1.68 | 0.61 | 9 of 65 | 19963 (-31), 19975 (-23), 19713 (-22) | 19731 (+27), 19946 (+26), 19962 (+22) |
| Home health & in-home care | 30 | 14,147 | 1.49 | 0.73 | 3 of 65 | 19963 (-16), 19936 (-14), 19958 (-14) | 19964 (+20), 19934 (+17), 19731 (+13) |
| Nursing & assisted living | 60 | 4,160 | 0.37 | 0.30 | 21 of 65 | 19952 (-44), 19943 (-40), 19947 (-37) | 19707 (+31), 19977 (+20), 19808 (+19) |
| Medical equipment & supplies | 60 | 4,697 | 0.34 | 0.20 | 29 of 65 | 19943 (-41), 19952 (-41), 19950 (-36) | 19977 (+39), 19946 (+35), 19962 (+35) |
| Hearing & audiology | 60 | 2,654 | 0.20 | 0.05 | 38 of 65 | 19966 (-61), 19947 (-51), 19945 (-43) | 19702 (+45), 19707 (+45), 19805 (+43) |
| Behavior therapy (ABA) | 30 | 22,302 | 2.58 | 0.64 | 5 of 65 | 19975 (-51), 19945 (-44), 19963 (-29) | 19962 (+15), 19964 (+15), 19934 (+13) |
| Care coordination & community health | 30 | 14,283 | 1.55 | 0.70 | 4 of 65 | 19975 (-36), 19945 (-33), 19963 (-18) | 19803 (+16), 19931 (+11), 19962 (+11) |
| General surgery | 60 | 6,180 | 0.39 | -0.01 | 50 of 65 | 19952 (-46), 19943 (-43), 19730 (-37) | 19707 (+42), 19953 (+39), 19964 (+35) |
| Infectious disease | 90 | 1,133 | 0.06 | 0.40 | 47 of 65 | 19730 (-44), 19709 (-43), 19945 (-42) | 19707 (+35), 19940 (+35), 19977 (+28) |
| Genetics & genetic counseling | 90 | 689 | 0.03 | 0.81 | 18 of 65 | 19709 (-54), 19730 (-47), 19731 (-44) | 19701 (+22), 19702 (+21), 19706 (+21) |
| Hospice & palliative care | 60 | 742 | 0.09 | 0.32 | 15 of 65 | 19933 (-25), 19730 (-24), 19956 (-24) | 19706 (+25), 19707 (+23), 19808 (+18) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 19801 | Primary care / family doctor | 6.533 | 6.427 | 32 | 33 |
| 19801 | Mental health & counseling | 9.069 | 10.082 | 36 | 29 |
| 19801 | Heart / cardiology | 0.366 | 0.344 | 35 | 39 |
| 19801 | Cancer care / oncology | 0.278 | 0.260 | 22 | 27 |
| 19801 | Urgent care & emergency | 0.363 | 0.413 | 64 | 59 |
| 19901 | Primary care / family doctor | 5.957 | 7.036 | 38 | 26 |
| 19901 | Mental health & counseling | 8.692 | 9.653 | 39 | 32 |
| 19901 | Heart / cardiology | 0.344 | 0.223 | 39 | 60 |
| 19901 | Cancer care / oncology | 0.220 | 0.118 | 38 | 67 |
| 19901 | Urgent care & emergency | 0.889 | 1.301 | 11 | 0 |
| 19958 | Primary care / family doctor | 5.234 | 7.497 | 45 | 22 |
| 19958 | Mental health & counseling | 5.593 | 7.291 | 61 | 49 |
| 19958 | Heart / cardiology | 0.341 | 0.333 | 39 | 41 |
| 19958 | Cancer care / oncology | 0.126 | 0.146 | 65 | 59 |
| 19958 | Urgent care & emergency | 1.095 | 2.672 | 0 | 0 |
| 19702 | Primary care / family doctor | 4.523 | 3.816 | 53 | 60 |
| 19702 | Mental health & counseling | 7.342 | 6.569 | 49 | 54 |
| 19702 | Heart / cardiology | 0.295 | 0.179 | 48 | 68 |
| 19702 | Cancer care / oncology | 0.196 | 0.169 | 45 | 52 |
| 19702 | Urgent care & emergency | 0.234 | 0.192 | 76 | 81 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 2600 rows (ZIP x specialty) stored in access_e2sfca for DE; market-score now uses drive-time access for these ZIPs.
