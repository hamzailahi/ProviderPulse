# E2SFCA access dry run: Utah

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 478; in Utah: 288
- Drive times: OSRM on OpenStreetMap roads (car profile), 478 x 478 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 129,921; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.93 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.31), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 4; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (84340, 84760)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 84014 | yes | 9.19 | 100% | 2.77 | 100% | yes (1.87) |
| 84045 | yes | 8.59 | 100% | 2.85 | 100% | yes (1.49) |
| 84062 | yes | 9.29 | 100% | 2.37 | 100% | yes (2.90) |
| 84340 | yes | 9.41 | 100% | 9.05 | 100% | yes (1.37) |
| 84760 | yes | 13.09 | 100% | 13.09 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 14,199 | 4.78 | 0.48 | 151 of 286 | 84028 (-81), 84784 (-76), 84733 (-72) | 84109 (+76), 84061 (+73), 84010 (+65) |
| Pediatrics (children) | 30 | 3,223 | 1.13 | 0.64 | 127 of 286 | 84784 (-73), 84744 (-64), 84403 (-62) | 84033 (+100), 84061 (+100), 84050 (+90) |
| Women's health / OB-GYN | 60 | 1,679 | 0.55 | 0.61 | 129 of 286 | 84307 (-62), 84774 (-54), 84745 (-39) | 84755 (+100), 84542 (+89), 84539 (+85) |
| Mental health & counseling | 30 | 30,065 | 7.13 | 0.63 | 159 of 286 | 84784 (-51), 84719 (-50), 84779 (-48) | 84639 (+100), 84728 (+100), 84633 (+89) |
| Dental | 30 | 5,618 | 1.64 | 0.52 | 159 of 286 | 84784 (-76), 84656 (-53), 84776 (-53) | 84640 (+87), 84018 (+85), 84512 (+83) |
| Eye care | 30 | 1,840 | 0.65 | 0.48 | 148 of 286 | 84403 (-61), 84511 (-43), 84083 (-41) | 84534 (+100), 84715 (+100), 84747 (+100) |
| Chiropractic | 30 | 2,166 | 0.64 | 0.59 | 153 of 286 | 84513 (-65), 84403 (-47), 84701 (-47) | 84783 (+100), 84733 (+99), 84746 (+93) |
| Physical & occupational therapy | 30 | 7,859 | 2.73 | 0.53 | 145 of 286 | 84781 (-71), 84735 (-65), 84710 (-55) | 84061 (+84), 84055 (+83), 84018 (+82) |
| Orthopedics & sports injury | 60 | 1,763 | 0.42 | 0.68 | 149 of 286 | 84774 (-76), 84746 (-65), 84037 (-58) | 84018 (+100), 84061 (+92), 84055 (+90) |
| Heart / cardiology | 60 | 576 | 0.28 | 0.78 | 75 of 286 | 84774 (-50), 84746 (-49), 84025 (-37) | 84018 (+100), 84737 (+77), 84098 (+76) |
| Skin / dermatology | 60 | 309 | 0.10 | 0.63 | 102 of 286 | 84774 (-77), 84327 (-59), 84306 (-58) | 84654 (+100), 84711 (+100), 84715 (+100) |
| Allergy & immunology | 60 | 77 | 0.03 | 0.82 | 65 of 286 | 84774 (-36), 84041 (-35), 84015 (-33) | 84018 (+100), 84633 (+84), 84055 (+81) |
| Lung, breathing & sleep | 60 | 342 | 0.14 | 0.78 | 64 of 286 | 84017 (-56), 84041 (-37), 84025 (-34) | 84018 (+100), 84098 (+70), 84108 (+70) |
| Digestive / gastroenterology | 60 | 272 | 0.13 | 0.82 | 69 of 286 | 84746 (-54), 84774 (-45), 84782 (-39) | 84737 (+84), 84018 (+75), 84060 (+75) |
| Kidney / nephrology | 60 | 263 | 0.12 | 0.64 | 89 of 286 | 84765 (-53), 84701 (-40), 84746 (-34) | 84018 (+100), 84534 (+100), 84535 (+100) |
| Diabetes & hormones | 60 | 177 | 0.07 | 0.67 | 96 of 286 | 84043 (-57), 84065 (-46), 84116 (-45) | 84032 (+100), 84051 (+100), 84085 (+100) |
| Cancer care / oncology | 90 | 385 | 0.18 | 0.82 | 85 of 286 | 84774 (-48), 84044 (-44), 84116 (-42) | 84086 (+100), 84018 (+78), 84317 (+64) |
| Arthritis / rheumatology | 60 | 87 | 0.04 | 0.76 | 86 of 286 | 84774 (-56), 84746 (-54), 84043 (-51) | 84018 (+100), 84032 (+100), 84737 (+86) |
| Brain & nerves / neurology | 60 | 520 | 0.24 | 0.74 | 100 of 286 | 84774 (-44), 84749 (-43), 84745 (-38) | 84018 (+100), 84307 (+100), 84729 (+98) |
| Ear, nose & throat | 60 | 233 | 0.08 | 0.72 | 111 of 286 | 84746 (-66), 84774 (-58), 84327 (-54) | 84018 (+100), 84031 (+100), 84539 (+100) |
| Urology | 60 | 181 | 0.08 | 0.72 | 89 of 286 | 84017 (-83), 84746 (-55), 84774 (-47) | 84018 (+100), 84032 (+88), 84737 (+79) |
| Foot & ankle / podiatry | 60 | 536 | 0.16 | 0.51 | 135 of 286 | 84028 (-78), 84774 (-66), 84320 (-64) | 84018 (+100), 84539 (+100), 84542 (+100) |
| Pain management | 60 | 255 | 0.09 | 0.70 | 102 of 286 | 84774 (-58), 84701 (-51), 84306 (-41) | 84539 (+100), 84542 (+100), 84098 (+76) |
| Plastic & reconstructive surgery | 90 | 196 | 0.07 | 0.81 | 107 of 286 | 84044 (-51), 84746 (-48), 84774 (-44) | 84032 (+78), 84018 (+75), 84325 (+75) |
| Speech & language therapy | 30 | 1,873 | 0.87 | 0.55 | 109 of 286 | 84784 (-77), 84648 (-73), 84660 (-69) | 84638 (+100), 84109 (+83), 84049 (+81) |
| Nutrition & dietitian | 30 | 1,101 | 0.32 | 0.55 | 144 of 286 | 84763 (-88), 84767 (-87), 84001 (-78) | 84061 (+100), 84516 (+100), 84715 (+100) |
| Acupuncture, massage & naturopathy | 30 | 1,425 | 0.50 | 0.64 | 120 of 286 | 84763 (-92), 84035 (-70), 84767 (-62) | 84530 (+100), 84536 (+100), 84018 (+80) |
| Urgent care & emergency | 30 | 1,462 | 0.50 | 0.23 | 161 of 286 | 84767 (-80), 84763 (-74), 84523 (-70) | 84513 (+100), 84520 (+100), 84521 (+100) |
| Imaging & lab | 60 | 1,382 | 0.55 | 0.66 | 96 of 286 | 84535 (-70), 84065 (-38), 84043 (-37) | 84098 (+68), 84018 (+63), 84033 (+59) |
| Pharmacy | 30 | 4,626 | 1.68 | 0.47 | 130 of 286 | 84725 (-65), 84026 (-62), 84028 (-45) | 84512 (+100), 84665 (+63), 84638 (+58) |
| Home health & in-home care | 30 | 8,696 | 1.49 | 0.44 | 46 of 286 | 84086 (-76), 84656 (-71), 84511 (-46) | 84534 (+40), 84535 (+39), 84783 (+36) |
| Nursing & assisted living | 60 | 1,196 | 0.37 | 0.57 | 125 of 286 | 84511 (-53), 84330 (-52), 84523 (-44) | 84539 (+100), 84542 (+100), 84528 (+86) |
| Medical equipment & supplies | 60 | 1,012 | 0.34 | 0.54 | 111 of 286 | 84637 (-81), 84774 (-54), 84752 (-46) | 84535 (+100), 84715 (+100), 84747 (+100) |
| Hearing & audiology | 60 | 794 | 0.20 | 0.60 | 141 of 286 | 84774 (-82), 84745 (-80), 84306 (-63) | 84018 (+100), 84715 (+100), 84737 (+100) |
| Behavior therapy (ABA) | 30 | 14,290 | 2.58 | 0.70 | 85 of 286 | 84332 (-48), 84326 (-41), 84401 (-34) | 84033 (+100), 84049 (+100), 84715 (+100) |
| Care coordination & community health | 30 | 13,149 | 1.55 | 0.51 | 155 of 286 | 84731 (-88), 84784 (-87), 84331 (-80) | 84002 (+100), 84007 (+100), 84028 (+100) |
| General surgery | 60 | 967 | 0.39 | 0.68 | 90 of 286 | 84535 (-37), 84043 (-31), 84746 (-30) | 84018 (+94), 84542 (+73), 84098 (+71) |
| Infectious disease | 90 | 84 | 0.06 | 0.75 | 58 of 286 | 84025 (-34), 84043 (-32), 84037 (-31) | 84098 (+69), 84010 (+67), 84103 (+67) |
| Genetics & genetic counseling | 90 | 128 | 0.03 | 0.84 | 75 of 286 | 84065 (-96), 84043 (-94), 84037 (-93) | 84018 (+96), 84033 (+55), 84061 (+54) |
| Hospice & palliative care | 60 | 327 | 0.09 | 0.70 | 102 of 286 | 84320 (-99), 84338 (-77), 84308 (-63) | 84534 (+100), 84535 (+100), 84751 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 11520 rows (ZIP x specialty) stored in access_e2sfca for UT; market-score now uses drive-time access for these ZIPs.
