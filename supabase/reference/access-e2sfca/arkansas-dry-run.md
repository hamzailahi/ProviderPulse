# E2SFCA access dry run: Arkansas

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,618; in Arkansas: 577
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,618 x 1,618 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 239,054; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.83 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.06), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 0; still implausible (left out of the rank comparison, marked in the CSV): 5 (65627, 66725, 66753, 66782, 67356)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 65627 | no | 7.18 | 100% | 7.18 | 100% | no |
| 66725 | no | 9.90 | 100% | 9.90 | 100% | no |
| 66753 | no | 8.61 | 100% | 8.61 | 100% | no |
| 66782 | no | 7.18 | 100% | 7.18 | 100% | no |
| 67356 | no | 8.46 | 100% | 8.46 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 35,656 | 4.78 | 0.39 | 330 of 577 | 72342 (-58), 71663 (-54), 72029 (-52) | 72561 (+81), 72206 (+78), 72555 (+77) |
| Pediatrics (children) | 30 | 6,350 | 1.13 | 0.56 | 235 of 577 | 71839 (-88), 71671 (-59), 72685 (-48) | 72376 (+95), 72016 (+83), 72127 (+76) |
| Women's health / OB-GYN | 60 | 3,061 | 0.55 | 0.64 | 142 of 577 | 72132 (-57), 72180 (-51), 72022 (-46) | 71865 (+55), 72206 (+54), 72210 (+52) |
| Mental health & counseling | 30 | 42,483 | 7.13 | 0.51 | 289 of 577 | 71653 (-67), 72478 (-58), 72015 (-47) | 72206 (+81), 72727 (+80), 72930 (+68) |
| Dental | 30 | 9,018 | 1.64 | 0.49 | 280 of 577 | 71676 (-79), 72006 (-60), 72639 (-55) | 72727 (+63), 72930 (+61), 71853 (+56) |
| Eye care | 30 | 4,354 | 0.65 | 0.51 | 315 of 577 | 72650 (-56), 71860 (-52), 72703 (-42) | 71822 (+100), 71865 (+100), 72206 (+91) |
| Chiropractic | 30 | 3,194 | 0.64 | 0.53 | 280 of 577 | 71970 (-85), 72087 (-69), 72562 (-60) | 72571 (+83), 72561 (+74), 72579 (+74) |
| Physical & occupational therapy | 30 | 20,162 | 2.73 | 0.51 | 359 of 577 | 71653 (-77), 72342 (-52), 72631 (-49) | 72444 (+100), 72827 (+100), 72838 (+100) |
| Orthopedics & sports injury | 60 | 2,611 | 0.42 | 0.72 | 196 of 577 | 72132 (-53), 72538 (-52), 72568 (-50) | 72959 (+77), 71743 (+70), 72016 (+69) |
| Heart / cardiology | 60 | 1,713 | 0.28 | 0.71 | 181 of 577 | 72180 (-98), 72132 (-91), 72079 (-84) | 71865 (+71), 71630 (+70), 71822 (+65) |
| Skin / dermatology | 60 | 482 | 0.10 | 0.71 | 186 of 577 | 72132 (-71), 72079 (-64), 72180 (-60) | 71865 (+74), 72453 (+69), 71822 (+67) |
| Allergy & immunology | 60 | 186 | 0.03 | 0.68 | 109 of 577 | 72132 (-81), 72180 (-80), 72103 (-78) | 72644 (+79), 71853 (+75), 72364 (+63) |
| Lung, breathing & sleep | 60 | 988 | 0.14 | 0.69 | 191 of 577 | 72180 (-100), 72007 (-80), 72104 (-75) | 71949 (+72), 71853 (+68), 71865 (+65) |
| Digestive / gastroenterology | 60 | 677 | 0.13 | 0.71 | 117 of 577 | 72079 (-100), 72132 (-100), 72180 (-100) | 71630 (+70), 72057 (+62), 71652 (+61) |
| Kidney / nephrology | 60 | 931 | 0.12 | 0.72 | 239 of 577 | 72132 (-89), 72079 (-79), 72180 (-75) | 71853 (+80), 72948 (+72), 71663 (+69) |
| Diabetes & hormones | 60 | 375 | 0.07 | 0.71 | 126 of 577 | 72180 (-78), 72132 (-67), 72007 (-52) | 72531 (+82), 72528 (+79), 72538 (+74) |
| Cancer care / oncology | 90 | 1,096 | 0.18 | 0.42 | 320 of 577 | 72339 (-83), 72022 (-78), 72103 (-78) | 71652 (+65), 72658 (+64), 71865 (+63) |
| Arthritis / rheumatology | 60 | 241 | 0.04 | 0.65 | 189 of 577 | 72132 (-100), 72180 (-90), 72079 (-85) | 71865 (+81), 71822 (+76), 72301 (+69) |
| Brain & nerves / neurology | 60 | 1,356 | 0.24 | 0.71 | 127 of 577 | 72022 (-73), 72180 (-71), 72132 (-70) | 72727 (+68), 72376 (+64), 72364 (+62) |
| Ear, nose & throat | 60 | 518 | 0.08 | 0.69 | 223 of 577 | 72079 (-100), 72132 (-100), 72180 (-100) | 71865 (+81), 71822 (+72), 71652 (+71) |
| Urology | 60 | 521 | 0.08 | 0.67 | 257 of 577 | 72538 (-100), 72677 (-100), 72687 (-98) | 72644 (+82), 71652 (+72), 71949 (+72) |
| Foot & ankle / podiatry | 60 | 638 | 0.16 | 0.71 | 141 of 577 | 72180 (-37), 72940 (-37), 72447 (-36) | 71865 (+74), 71822 (+73), 72727 (+58) |
| Pain management | 60 | 538 | 0.09 | 0.65 | 225 of 577 | 72568 (-93), 72677 (-88), 72046 (-84) | 71865 (+78), 72644 (+74), 71822 (+67) |
| Plastic & reconstructive surgery | 90 | 354 | 0.07 | 0.55 | 258 of 577 | 72035 (-56), 72339 (-56), 72386 (-56) | 72835 (+83), 72845 (+77), 72945 (+74) |
| Speech & language therapy | 30 | 8,856 | 0.87 | 0.46 | 384 of 577 | 72843 (-79), 72682 (-77), 71961 (-51) | 72027 (+100), 72060 (+100), 72063 (+100) |
| Nutrition & dietitian | 30 | 1,952 | 0.32 | 0.65 | 232 of 577 | 72360 (-78), 72064 (-74), 71965 (-69) | 72727 (+97), 72127 (+86), 72170 (+86) |
| Acupuncture, massage & naturopathy | 30 | 988 | 0.50 | 0.60 | 96 of 577 | 72069 (-84), 72087 (-73), 72824 (-67) | 72578 (+57), 72727 (+52), 72936 (+41) |
| Urgent care & emergency | 30 | 3,579 | 0.50 | 0.45 | 329 of 577 | 72927 (-73), 72015 (-69), 72519 (-67) | 71658 (+100), 72333 (+100), 71862 (+98) |
| Imaging & lab | 60 | 3,637 | 0.55 | 0.63 | 174 of 577 | 72132 (-93), 72180 (-93), 72079 (-84) | 72727 (+81), 71822 (+69), 71865 (+68) |
| Pharmacy | 30 | 13,792 | 1.68 | 0.44 | 376 of 577 | 72087 (-56), 72031 (-54), 72650 (-54) | 72060 (+87), 72026 (+85), 72368 (+83) |
| Home health & in-home care | 30 | 7,492 | 1.49 | 0.49 | 258 of 577 | 72342 (-62), 72776 (-50), 71654 (-41) | 72561 (+100), 72571 (+100), 72623 (+100) |
| Nursing & assisted living | 60 | 3,215 | 0.37 | 0.51 | 308 of 577 | 72538 (-69), 72583 (-67), 72482 (-61) | 71935 (+98), 71658 (+92), 72857 (+91) |
| Medical equipment & supplies | 60 | 3,237 | 0.34 | 0.56 | 294 of 577 | 72538 (-75), 72677 (-75), 72447 (-70) | 72060 (+76), 71630 (+74), 72478 (+70) |
| Hearing & audiology | 60 | 1,382 | 0.20 | 0.71 | 227 of 577 | 72180 (-81), 72538 (-65), 72132 (-64) | 71853 (+76), 71949 (+75), 72644 (+71) |
| Behavior therapy (ABA) | 30 | 8,961 | 2.58 | 0.67 | 114 of 577 | 72756 (-38), 72205 (-35), 72022 (-31) | 71743 (+100), 71763 (+100), 71962 (+100) |
| Care coordination & community health | 30 | 23,947 | 1.55 | 0.41 | 314 of 577 | 72568 (-79), 72137 (-65), 72006 (-62) | 71658 (+100), 71660 (+100), 71665 (+100) |
| General surgery | 60 | 2,257 | 0.39 | 0.58 | 189 of 577 | 72132 (-70), 72180 (-62), 72022 (-61) | 71822 (+69), 71865 (+63), 71853 (+62) |
| Infectious disease | 90 | 256 | 0.06 | 0.53 | 168 of 577 | 72103 (-58), 72339 (-58), 72132 (-57) | 72414 (+53), 72376 (+49), 72210 (+42) |
| Genetics & genetic counseling | 90 | 134 | 0.03 | 0.63 | 156 of 577 | 72736 (-87), 72753 (-86), 72747 (-85) | 72760 (+73), 72624 (+70), 72742 (+59) |
| Hospice & palliative care | 60 | 703 | 0.09 | 0.67 | 264 of 577 | 72940 (-75), 72908 (-59), 72180 (-58) | 72320 (+99), 71839 (+77), 72182 (+75) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 72201 | Primary care / family doctor | 10.901 | 13.476 | 0 | 0 |
| 72201 | Mental health & counseling | 13.817 | 16.808 | 3 | 0 |
| 72201 | Heart / cardiology | 1.288 | 0.736 | 0 | 0 |
| 72201 | Cancer care / oncology | 0.739 | 0.333 | 0 | 6 |
| 72201 | Urgent care & emergency | 1.376 | 1.681 | 0 | 0 |
| 72701 | Primary care / family doctor | 4.273 | 1.201 | 55 | 87 |
| 72701 | Mental health & counseling | 7.530 | 6.322 | 47 | 56 |
| 72701 | Heart / cardiology | 0.174 | 0.098 | 69 | 83 |
| 72701 | Cancer care / oncology | 0.130 | 0.108 | 63 | 70 |
| 72701 | Urgent care & emergency | 0.360 | 0.147 | 64 | 85 |
| 71601 | Primary care / family doctor | 4.227 | 2.495 | 56 | 74 |
| 71601 | Mental health & counseling | 4.978 | 5.074 | 65 | 64 |
| 71601 | Heart / cardiology | 0.314 | 0.206 | 44 | 63 |
| 71601 | Cancer care / oncology | 0.192 | 0.134 | 46 | 62 |
| 71601 | Urgent care & emergency | 0.349 | 0.215 | 65 | 78 |
| 72401 | Primary care / family doctor | 7.492 | 9.949 | 22 | 0 |
| 72401 | Mental health & counseling | 10.301 | 13.916 | 28 | 2 |
| 72401 | Heart / cardiology | 0.511 | 0.401 | 9 | 29 |
| 72401 | Cancer care / oncology | 0.207 | 0.136 | 42 | 62 |
| 72401 | Urgent care & emergency | 0.414 | 0.581 | 58 | 42 |
| 71901 | Primary care / family doctor | 4.069 | 4.834 | 57 | 49 |
| 71901 | Mental health & counseling | 5.400 | 8.470 | 62 | 41 |
| 71901 | Heart / cardiology | 0.220 | 0.234 | 61 | 58 |
| 71901 | Cancer care / oncology | 0.189 | 0.199 | 47 | 44 |
| 71901 | Urgent care & emergency | 0.472 | 0.602 | 53 | 39 |
| 72830 | Primary care / family doctor | 2.654 | 4.172 | 72 | 56 |
| 72830 | Mental health & counseling | 5.449 | 8.164 | 62 | 43 |
| 72830 | Heart / cardiology | 0.000 | 0.074 | 100 | 87 |
| 72830 | Cancer care / oncology | 0.000 | 0.060 | 100 | 83 |
| 72830 | Urgent care & emergency | 0.326 | 0.602 | 67 | 40 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 23080 rows (ZIP x specialty) stored in access_e2sfca for AR; market-score now uses drive-time access for these ZIPs.
