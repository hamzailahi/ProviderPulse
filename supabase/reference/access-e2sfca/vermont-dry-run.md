# E2SFCA access dry run: Vermont

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,486; in Vermont: 254
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,486 x 1,486 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 370,123; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.36 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.41), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 01085 | no | 9.58 | 100% | 2.73 | 100% | yes (1.72) |
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 47,627 | 4.78 | 0.37 | 149 of 254 | 05732 (-82), 05873 (-64), 05353 (-63) | 05751 (+89), 05648 (+85), 05640 (+82) |
| Pediatrics (children) | 30 | 18,724 | 1.13 | 0.44 | 129 of 254 | 05732 (-96), 05837 (-85), 05060 (-54) | 05486 (+82), 05458 (+81), 05463 (+70) |
| Women's health / OB-GYN | 60 | 6,273 | 0.55 | 0.59 | 125 of 254 | 05873 (-71), 05679 (-62), 05050 (-59) | 05767 (+98), 05737 (+69), 05351 (+61) |
| Mental health & counseling | 30 | 104,810 | 7.13 | 0.48 | 145 of 254 | 05050 (-59), 05732 (-52), 05873 (-50) | 05824 (+100), 05342 (+93), 05751 (+92) |
| Dental | 30 | 18,902 | 1.64 | 0.39 | 157 of 254 | 05846 (-59), 05476 (-50), 05873 (-48) | 05751 (+100), 05738 (+89), 05737 (+84) |
| Eye care | 30 | 6,363 | 0.65 | 0.53 | 130 of 254 | 05873 (-87), 05672 (-75), 05050 (-65) | 05824 (+99), 05751 (+91), 05055 (+82) |
| Chiropractic | 30 | 4,445 | 0.64 | 0.55 | 151 of 254 | 05732 (-65), 05673 (-60), 05843 (-44) | 05677 (+100), 05462 (+96), 05648 (+92) |
| Physical & occupational therapy | 30 | 34,808 | 2.73 | 0.59 | 128 of 254 | 05672 (-54), 05767 (-44), 05873 (-41) | 05462 (+90), 05458 (+83), 05738 (+82) |
| Orthopedics & sports injury | 60 | 4,188 | 0.42 | 0.67 | 125 of 254 | 05843 (-72), 05873 (-70), 05464 (-60) | 05340 (+70), 05737 (+68), 05824 (+60) |
| Heart / cardiology | 60 | 2,848 | 0.28 | 0.66 | 56 of 254 | 05473 (-54), 05468 (-53), 05456 (-50) | 05737 (+56), 05648 (+36), 05452 (+35) |
| Skin / dermatology | 60 | 1,233 | 0.10 | 0.62 | 111 of 254 | 05089 (-99), 05037 (-92), 05048 (-82) | 05737 (+100), 05744 (+60), 05907 (+55) |
| Allergy & immunology | 60 | 370 | 0.03 | 0.69 | 34 of 254 | 05473 (-34), 05462 (-30), 05443 (-28) | 05477 (+55), 05445 (+47), 05461 (+43) |
| Lung, breathing & sleep | 60 | 1,190 | 0.14 | 0.65 | 92 of 254 | 05050 (-84), 05461 (-75), 05873 (-72) | 05906 (+62), 05824 (+50), 05847 (+50) |
| Digestive / gastroenterology | 60 | 1,324 | 0.13 | 0.63 | 106 of 254 | 05477 (-66), 05461 (-62), 05363 (-51) | 05737 (+95), 05262 (+76), 05352 (+69) |
| Kidney / nephrology | 60 | 831 | 0.12 | 0.60 | 42 of 254 | 05468 (-40), 05494 (-34), 05473 (-33) | 05445 (+53), 05840 (+41), 05408 (+39) |
| Diabetes & hormones | 60 | 1,002 | 0.07 | 0.68 | 106 of 254 | 05468 (-67), 05773 (-67), 05473 (-64) | 05737 (+100), 05739 (+78), 05262 (+65) |
| Cancer care / oncology | 90 | 2,154 | 0.18 | 0.26 | 113 of 254 | 05454 (-81), 05468 (-79), 05473 (-77) | 05262 (+38), 05868 (+33), 05907 (+31) |
| Arthritis / rheumatology | 60 | 504 | 0.04 | 0.59 | 92 of 254 | 05461 (-100), 05477 (-81), 05473 (-70) | 05767 (+97), 05075 (+84), 05737 (+84) |
| Brain & nerves / neurology | 60 | 2,697 | 0.24 | 0.61 | 90 of 254 | 05461 (-63), 05473 (-60), 05477 (-59) | 05262 (+60), 05059 (+57), 05352 (+56) |
| Ear, nose & throat | 60 | 693 | 0.08 | 0.66 | 126 of 254 | 05873 (-81), 05050 (-79), 05822 (-68) | 05737 (+79), 05907 (+76), 05062 (+69) |
| Urology | 60 | 837 | 0.08 | 0.62 | 146 of 254 | 05873 (-100), 05658 (-93), 05843 (-78) | 05091 (+73), 05065 (+69), 05351 (+64) |
| Foot & ankle / podiatry | 60 | 1,235 | 0.16 | 0.52 | 108 of 254 | 05873 (-50), 05363 (-43), 05843 (-43) | 05737 (+100), 05767 (+93), 05821 (+65) |
| Pain management | 60 | 511 | 0.09 | 0.67 | 64 of 254 | 05845 (-43), 05822 (-41), 05847 (-40) | 05907 (+61), 05868 (+50), 05445 (+46) |
| Plastic & reconstructive surgery | 90 | 549 | 0.07 | 0.55 | 78 of 254 | 05757 (-32), 05764 (-32), 05773 (-30) | 05751 (+62), 05737 (+56), 05458 (+49) |
| Speech & language therapy | 30 | 8,337 | 0.87 | 0.46 | 104 of 254 | 05360 (-65), 05905 (-62), 05042 (-49) | 05458 (+100), 05486 (+90), 05751 (+72) |
| Nutrition & dietitian | 30 | 4,378 | 0.32 | 0.55 | 152 of 254 | 05871 (-77), 05732 (-69), 05148 (-64) | 05840 (+96), 05486 (+94), 05767 (+94) |
| Acupuncture, massage & naturopathy | 30 | 4,640 | 0.50 | 0.59 | 145 of 254 | 05040 (-60), 05043 (-56), 05060 (-56) | 05360 (+100), 05677 (+100), 05342 (+98) |
| Urgent care & emergency | 30 | 4,493 | 0.50 | 0.48 | 124 of 254 | 05050 (-87), 05873 (-79), 05353 (-51) | 05486 (+100), 05737 (+100), 05738 (+100) |
| Imaging & lab | 60 | 5,271 | 0.55 | 0.57 | 89 of 254 | 05468 (-71), 05477 (-62), 05461 (-61) | 05737 (+54), 05767 (+45), 05352 (+40) |
| Pharmacy | 30 | 14,433 | 1.68 | 0.35 | 155 of 254 | 05732 (-73), 05676 (-45), 05846 (-37) | 05751 (+79), 05824 (+75), 05737 (+71) |
| Home health & in-home care | 30 | 5,544 | 1.49 | 0.50 | 9 of 254 | 05042 (-28), 05161 (-20), 05050 (-19) | 05751 (+19), 05840 (+17), 05824 (+16) |
| Nursing & assisted living | 60 | 2,618 | 0.37 | 0.57 | 132 of 254 | 05873 (-95), 05050 (-80), 05843 (-73) | 05737 (+99), 05907 (+75), 05840 (+65) |
| Medical equipment & supplies | 60 | 2,025 | 0.34 | 0.63 | 84 of 254 | 05873 (-53), 05050 (-47), 05658 (-33) | 05737 (+63), 05824 (+53), 05906 (+43) |
| Hearing & audiology | 60 | 1,808 | 0.20 | 0.56 | 139 of 254 | 05873 (-100), 05658 (-96), 05773 (-87) | 05360 (+100), 05737 (+100), 05340 (+88) |
| Behavior therapy (ABA) | 30 | 19,352 | 2.58 | 0.59 | 10 of 254 | 05850 (-19), 05602 (-17), 05774 (-17) | 05445 (+19), 05462 (+19), 05261 (+18) |
| Care coordination & community health | 30 | 15,420 | 1.55 | 0.45 | 113 of 254 | 05873 (-64), 05050 (-55), 05101 (-52) | 05342 (+100), 05640 (+100), 05648 (+100) |
| General surgery | 60 | 3,473 | 0.39 | 0.54 | 111 of 254 | 05873 (-76), 05843 (-73), 05050 (-58) | 05821 (+56), 05737 (+54), 05824 (+53) |
| Infectious disease | 90 | 687 | 0.06 | 0.35 | 113 of 254 | 05468 (-73), 05461 (-69), 05477 (-63) | 05751 (+50), 05737 (+46), 05738 (+40) |
| Genetics & genetic counseling | 90 | 467 | 0.03 | 0.40 | 73 of 254 | 05461 (-74), 05468 (-71), 05477 (-68) | 05486 (+31), 05452 (+26), 05445 (+25) |
| Hospice & palliative care | 60 | 470 | 0.09 | 0.64 | 107 of 254 | 05873 (-64), 05658 (-46), 05050 (-41) | 05075 (+71), 05840 (+69), 05767 (+55) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 10160 rows (ZIP x specialty) stored in access_e2sfca for VT; market-score now uses drive-time access for these ZIPs.
