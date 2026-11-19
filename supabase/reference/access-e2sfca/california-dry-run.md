# E2SFCA access dry run: California

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,076; in California: 1,750
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,076 x 2,076 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,343,936; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.07 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.68), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 10; re-anchored: 9; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (96031)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 89511 | no | 27.79 | 100% | 4.18 | 100% | yes (2.15) |
| 90272 | yes | 8.76 | 100% | 5.57 | 100% | yes (2.89) |
| 93424 | yes | 7.88 | 100% | 2.82 | 100% | yes (1.60) |
| 94941 | yes | 8.88 | 100% | 4.82 | 100% | yes (2.44) |
| 95032 | yes | 8.25 | 100% | 2.89 | 100% | yes (2.01) |
| 95135 | yes | 10.06 | 100% | 3.33 | 100% | yes (2.69) |
| 95219 | yes | 10.16 | 100% | 3.99 | 100% | yes (2.07) |
| 95310 | yes | 7.78 | 100% | 4.80 | 100% | yes (2.11) |
| 95637 | yes | 9.10 | 100% | 3.76 | 100% | yes (2.51) |
| 96031 | yes | 8.49 | 100% | 8.49 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 133,672 | 4.78 | 0.50 | 727 of 1749 | 96061 (-85), 95552 (-77), 96084 (-75) | 94060 (+100), 94074 (+99), 93541 (+95) |
| Pediatrics (children) | 30 | 36,230 | 1.13 | 0.63 | 802 of 1749 | 91931 (-79), 93246 (-77), 93254 (-72) | 93653 (+100), 94020 (+100), 94060 (+100) |
| Women's health / OB-GYN | 60 | 19,567 | 0.55 | 0.62 | 763 of 1749 | 95979 (-87), 93461 (-79), 93667 (-64) | 95549 (+100), 95550 (+100), 95554 (+100) |
| Mental health & counseling | 30 | 315,840 | 7.13 | 0.63 | 881 of 1749 | 93246 (-87), 96084 (-83), 92315 (-71) | 93432 (+100), 93453 (+100), 95549 (+100) |
| Dental | 30 | 67,217 | 1.64 | 0.57 | 944 of 1749 | 95903 (-82), 95249 (-60), 95552 (-58) | 94060 (+100), 95511 (+100), 95514 (+100) |
| Eye care | 30 | 20,601 | 0.65 | 0.66 | 782 of 1749 | 93246 (-85), 95903 (-78), 92315 (-70) | 94060 (+100), 94020 (+98), 94074 (+81) |
| Chiropractic | 30 | 19,561 | 0.64 | 0.60 | 756 of 1749 | 93651 (-91), 93246 (-90), 93920 (-89) | 95715 (+100), 95910 (+100), 95922 (+100) |
| Physical & occupational therapy | 30 | 63,939 | 2.73 | 0.67 | 478 of 1749 | 93246 (-92), 93524 (-74), 96086 (-61) | 94060 (+100), 94020 (+90), 94074 (+81) |
| Orthopedics & sports injury | 60 | 10,271 | 0.42 | 0.63 | 542 of 1749 | 92347 (-54), 93662 (-36), 94580 (-35) | 96024 (+100), 96126 (+84), 96146 (+81) |
| Heart / cardiology | 60 | 7,638 | 0.28 | 0.69 | 706 of 1749 | 95445 (-50), 94580 (-49), 94541 (-47) | 92561 (+95), 94060 (+91), 95461 (+86) |
| Skin / dermatology | 60 | 3,684 | 0.10 | 0.72 | 777 of 1749 | 94580 (-83), 94541 (-75), 94545 (-71) | 93254 (+100), 96024 (+100), 93924 (+99) |
| Allergy & immunology | 60 | 1,080 | 0.03 | 0.73 | 738 of 1749 | 94541 (-67), 94580 (-65), 95974 (-65) | 94060 (+89), 95978 (+89), 95466 (+88) |
| Lung, breathing & sleep | 60 | 5,504 | 0.14 | 0.78 | 786 of 1749 | 90047 (-58), 90305 (-55), 94538 (-52) | 95248 (+96), 94060 (+92), 93619 (+91) |
| Digestive / gastroenterology | 60 | 3,797 | 0.13 | 0.72 | 775 of 1749 | 94580 (-60), 94541 (-53), 94545 (-53) | 93453 (+100), 93619 (+100), 96024 (+100) |
| Kidney / nephrology | 60 | 3,450 | 0.12 | 0.75 | 552 of 1749 | 93662 (-46), 95668 (-43), 93454 (-41) | 93619 (+100), 94060 (+95), 92321 (+90) |
| Diabetes & hormones | 60 | 1,947 | 0.07 | 0.75 | 635 of 1749 | 94030 (-49), 94580 (-49), 94578 (-47) | 93254 (+100), 96009 (+100), 96054 (+100) |
| Cancer care / oncology | 90 | 4,948 | 0.18 | 0.62 | 914 of 1749 | 94541 (-52), 94580 (-50), 94545 (-49) | 93453 (+92), 94567 (+91), 96024 (+88) |
| Arthritis / rheumatology | 60 | 1,257 | 0.04 | 0.76 | 691 of 1749 | 94580 (-59), 94541 (-52), 95837 (-52) | 96024 (+100), 93453 (+97), 94060 (+90) |
| Brain & nerves / neurology | 60 | 7,252 | 0.24 | 0.76 | 665 of 1749 | 94580 (-63), 94541 (-61), 94545 (-58) | 92561 (+90), 94060 (+89), 96024 (+88) |
| Ear, nose & throat | 60 | 2,386 | 0.08 | 0.71 | 785 of 1749 | 94580 (-65), 94541 (-60), 93454 (-57) | 96024 (+100), 95690 (+92), 94060 (+86) |
| Urology | 60 | 2,263 | 0.08 | 0.66 | 751 of 1749 | 95974 (-71), 96067 (-56), 95968 (-49) | 96024 (+100), 96050 (+100), 96094 (+100) |
| Foot & ankle / podiatry | 60 | 4,480 | 0.16 | 0.67 | 563 of 1749 | 92004 (-71), 93529 (-61), 93625 (-47) | 96024 (+100), 94060 (+98), 94074 (+94) |
| Pain management | 60 | 3,160 | 0.09 | 0.67 | 765 of 1749 | 90023 (-56), 93662 (-54), 90240 (-50) | 93441 (+100), 93453 (+100), 96024 (+100) |
| Plastic & reconstructive surgery | 90 | 2,900 | 0.07 | 0.72 | 897 of 1749 | 90061 (-82), 90059 (-80), 90221 (-79) | 95421 (+86), 93619 (+83), 96024 (+82) |
| Speech & language therapy | 30 | 19,829 | 0.87 | 0.72 | 435 of 1749 | 95230 (-63), 96006 (-58), 96062 (-58) | 92283 (+84), 92055 (+75), 94060 (+62) |
| Nutrition & dietitian | 30 | 10,004 | 0.32 | 0.65 | 732 of 1749 | 93238 (-88), 93246 (-80), 95903 (-78) | 92266 (+100), 94020 (+100), 94060 (+100) |
| Acupuncture, massage & naturopathy | 30 | 22,557 | 0.50 | 0.75 | 657 of 1749 | 96051 (-85), 93651 (-82), 95568 (-82) | 94020 (+100), 94021 (+100), 94060 (+100) |
| Urgent care & emergency | 30 | 14,966 | 0.50 | 0.48 | 822 of 1749 | 96062 (-87), 94574 (-76), 95903 (-75) | 92256 (+100), 92561 (+100), 93526 (+100) |
| Imaging & lab | 60 | 16,268 | 0.55 | 0.71 | 741 of 1749 | 94580 (-50), 94541 (-49), 95421 (-47) | 96024 (+100), 94060 (+90), 94074 (+84) |
| Pharmacy | 30 | 51,040 | 1.68 | 0.55 | 777 of 1749 | 92315 (-78), 93251 (-76), 93246 (-75) | 92266 (+100), 94060 (+100), 94074 (+98) |
| Home health & in-home care | 30 | 72,246 | 1.49 | 0.66 | 492 of 1749 | 92283 (-71), 95932 (-67), 93222 (-58) | 92266 (+100), 92281 (+100), 95415 (+100) |
| Nursing & assisted living | 60 | 10,906 | 0.37 | 0.59 | 653 of 1749 | 96080 (-48), 95837 (-45), 90033 (-43) | 92266 (+96), 96115 (+95), 92549 (+75) |
| Medical equipment & supplies | 60 | 9,416 | 0.34 | 0.70 | 510 of 1749 | 95983 (-79), 93662 (-56), 93625 (-47) | 96024 (+100), 96033 (+78), 95645 (+72) |
| Hearing & audiology | 60 | 5,080 | 0.20 | 0.62 | 578 of 1749 | 94550 (-55), 96097 (-49), 94580 (-39) | 93453 (+100), 96024 (+98), 94060 (+97) |
| Behavior therapy (ABA) | 30 | 218,618 | 2.58 | 0.80 | 563 of 1749 | 95981 (-90), 93246 (-89), 94547 (-67) | 92060 (+100), 92327 (+100), 92347 (+100) |
| Care coordination & community health | 30 | 63,647 | 1.55 | 0.53 | 800 of 1749 | 93246 (-81), 95013 (-76), 96084 (-76) | 92256 (+100), 92327 (+100), 93226 (+100) |
| General surgery | 60 | 9,522 | 0.39 | 0.60 | 666 of 1749 | 93662 (-54), 95974 (-51), 93648 (-41) | 93619 (+100), 94060 (+95), 96143 (+95) |
| Infectious disease | 90 | 1,568 | 0.06 | 0.72 | 809 of 1749 | 94538 (-55), 94580 (-54), 94579 (-53) | 92561 (+90), 93653 (+90), 96024 (+81) |
| Genetics & genetic counseling | 90 | 1,241 | 0.03 | 0.79 | 822 of 1749 | 94541 (-98), 94544 (-97), 94579 (-96) | 93653 (+76), 95135 (+62), 93619 (+56) |
| Hospice & palliative care | 60 | 6,730 | 0.09 | 0.83 | 603 of 1749 | 92585 (-76), 90047 (-69), 90303 (-66) | 92070 (+100), 96009 (+100), 96054 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
