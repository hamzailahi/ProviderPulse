# E2SFCA access dry run: Michigan

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,986; in Michigan: 983
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,986 x 2,986 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 958,650; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.84 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.09), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 7; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (54246, 55601, 55605, 55614)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 49757 | yes | 8.43 | 100% | 2.13 | 100% | yes (0.65) |
| 49840 | yes | 9.47 | 100% | 4.63 | 100% | yes (2.94) |
| 54246 | no | 8.72 | 100% | 8.72 | 100% | no |
| 55601 | no | 2.08 | 42% | 2.08 | 42% | no |
| 55605 | no | 2.03 | 42% | 2.03 | 42% | no |
| 55614 | no | 2.55 | 42% | 2.55 | 42% | no |
| 61322 | no | 7.72 | 100% | 3.33 | 100% | yes (1.47) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 121,996 | 4.78 | 0.61 | 466 of 983 | 48763 (-58), 48640 (-56), 48188 (-46) | 49834 (+99), 49822 (+98), 49664 (+96) |
| Pediatrics (children) | 30 | 26,952 | 1.13 | 0.76 | 237 of 983 | 49925 (-66), 49910 (-56), 48170 (-55) | 49636 (+79), 49664 (+78), 49653 (+60) |
| Women's health / OB-GYN | 60 | 14,342 | 0.55 | 0.68 | 475 of 983 | 49404 (-73), 49430 (-63), 49070 (-59) | 49950 (+97), 49636 (+68), 49799 (+66) |
| Mental health & counseling | 30 | 192,970 | 7.13 | 0.67 | 486 of 983 | 49919 (-81), 49873 (-54), 48888 (-48) | 49822 (+94), 49636 (+90), 49664 (+90) |
| Dental | 30 | 43,911 | 1.64 | 0.62 | 457 of 983 | 48610 (-67), 49709 (-59), 48640 (-51) | 49664 (+86), 49636 (+69), 49822 (+69) |
| Eye care | 30 | 19,896 | 0.65 | 0.62 | 503 of 983 | 49925 (-65), 48730 (-56), 49646 (-56) | 49636 (+100), 49696 (+100), 49795 (+100) |
| Chiropractic | 30 | 19,289 | 0.64 | 0.44 | 495 of 983 | 48651 (-56), 48763 (-56), 49971 (-52) | 49768 (+100), 49815 (+100), 49818 (+100) |
| Physical & occupational therapy | 30 | 84,377 | 2.73 | 0.68 | 465 of 983 | 49883 (-95), 48763 (-71), 49420 (-62) | 49664 (+86), 49822 (+81), 49636 (+77) |
| Orthopedics & sports injury | 60 | 11,451 | 0.42 | 0.66 | 451 of 983 | 49885 (-91), 49806 (-71), 49620 (-69) | 49835 (+99), 49950 (+92), 49795 (+75) |
| Heart / cardiology | 60 | 6,973 | 0.28 | 0.73 | 456 of 983 | 48131 (-67), 49716 (-67), 48187 (-63) | 49795 (+91), 49799 (+85), 49224 (+76) |
| Skin / dermatology | 60 | 2,514 | 0.10 | 0.80 | 402 of 983 | 49716 (-62), 49885 (-62), 49620 (-61) | 49775 (+93), 49670 (+79), 49127 (+74) |
| Allergy & immunology | 60 | 899 | 0.03 | 0.75 | 476 of 983 | 49885 (-92), 49620 (-76), 48164 (-73) | 49799 (+95), 49670 (+86), 48427 (+77) |
| Lung, breathing & sleep | 60 | 3,185 | 0.14 | 0.72 | 436 of 983 | 49847 (-100), 49886 (-71), 48131 (-69) | 49831 (+100), 49870 (+78), 48436 (+75) |
| Digestive / gastroenterology | 60 | 3,062 | 0.13 | 0.77 | 403 of 983 | 49885 (-80), 49950 (-75), 48131 (-70) | 49799 (+95), 49822 (+76), 49636 (+74) |
| Kidney / nephrology | 60 | 2,974 | 0.12 | 0.69 | 440 of 983 | 49620 (-54), 49885 (-54), 48116 (-51) | 49831 (+100), 49870 (+86), 49822 (+79) |
| Diabetes & hormones | 60 | 1,654 | 0.07 | 0.76 | 377 of 983 | 48164 (-60), 48188 (-60), 48174 (-59) | 49879 (+91), 49815 (+83), 49861 (+81) |
| Cancer care / oncology | 90 | 4,220 | 0.18 | 0.52 | 613 of 983 | 49620 (-70), 49648 (-69), 49676 (-67) | 49228 (+64), 49858 (+64), 48433 (+63) |
| Arthritis / rheumatology | 60 | 1,021 | 0.04 | 0.77 | 411 of 983 | 48131 (-90), 48188 (-82), 48187 (-77) | 49799 (+94), 49795 (+82), 49950 (+76) |
| Brain & nerves / neurology | 60 | 5,787 | 0.24 | 0.73 | 400 of 983 | 49430 (-79), 48131 (-77), 48116 (-74) | 49799 (+90), 49822 (+82), 49740 (+69) |
| Ear, nose & throat | 60 | 1,819 | 0.08 | 0.75 | 438 of 983 | 49716 (-89), 49769 (-81), 49847 (-78) | 49831 (+100), 49870 (+95), 49795 (+89) |
| Urology | 60 | 2,035 | 0.08 | 0.70 | 499 of 983 | 49620 (-79), 49430 (-73), 49401 (-66) | 49831 (+90), 49920 (+86), 49822 (+83) |
| Foot & ankle / podiatry | 60 | 5,417 | 0.16 | 0.78 | 416 of 983 | 49620 (-59), 48157 (-58), 48420 (-47) | 49636 (+74), 48467 (+66), 49822 (+65) |
| Pain management | 60 | 2,081 | 0.09 | 0.76 | 371 of 983 | 49847 (-85), 48879 (-71), 48414 (-67) | 49670 (+90), 49648 (+81), 49653 (+76) |
| Plastic & reconstructive surgery | 90 | 1,614 | 0.07 | 0.67 | 585 of 983 | 49885 (-100), 49620 (-96), 49891 (-90) | 48848 (+75), 49127 (+69), 48708 (+67) |
| Speech & language therapy | 30 | 22,105 | 0.87 | 0.65 | 273 of 983 | 49910 (-59), 48765 (-55), 49420 (-51) | 49822 (+60), 49331 (+59), 49871 (+52) |
| Nutrition & dietitian | 30 | 8,191 | 0.32 | 0.62 | 388 of 983 | 49777 (-67), 49781 (-57), 48661 (-56) | 49815 (+100), 49822 (+100), 49831 (+100) |
| Acupuncture, massage & naturopathy | 30 | 7,735 | 0.50 | 0.55 | 301 of 983 | 48654 (-81), 49719 (-73), 49646 (-68) | 49653 (+100), 49682 (+100), 49670 (+98) |
| Urgent care & emergency | 30 | 13,854 | 0.50 | 0.66 | 463 of 983 | 48763 (-75), 49967 (-74), 49884 (-73) | 49834 (+100), 49950 (+96), 49920 (+95) |
| Imaging & lab | 60 | 13,832 | 0.55 | 0.63 | 411 of 983 | 48116 (-68), 48170 (-63), 48187 (-61) | 49831 (+73), 49822 (+65), 49636 (+64) |
| Pharmacy | 30 | 41,223 | 1.68 | 0.64 | 447 of 983 | 49820 (-73), 48763 (-56), 48661 (-47) | 49831 (+100), 49834 (+100), 49902 (+89) |
| Home health & in-home care | 30 | 39,828 | 1.49 | 0.78 | 271 of 983 | 49903 (-81), 48880 (-77), 49103 (-76) | 48628 (+98), 48662 (+87), 48436 (+74) |
| Nursing & assisted living | 60 | 10,155 | 0.37 | 0.58 | 313 of 983 | 49270 (-45), 49620 (-44), 48131 (-40) | 49775 (+79), 49814 (+70), 49670 (+65) |
| Medical equipment & supplies | 60 | 9,447 | 0.34 | 0.70 | 373 of 983 | 49716 (-82), 49885 (-75), 49879 (-73) | 49775 (+100), 49961 (+100), 49950 (+91) |
| Hearing & audiology | 60 | 5,286 | 0.20 | 0.64 | 502 of 983 | 49620 (-100), 49716 (-82), 49847 (-80) | 49831 (+100), 49950 (+100), 49795 (+86) |
| Behavior therapy (ABA) | 30 | 92,028 | 2.58 | 0.76 | 383 of 983 | 48413 (-67), 49103 (-67), 48328 (-65) | 48028 (+100), 48656 (+100), 48737 (+100) |
| Care coordination & community health | 30 | 54,274 | 1.55 | 0.63 | 511 of 983 | 49031 (-72), 48454 (-71), 49925 (-70) | 48468 (+100), 48831 (+100), 49638 (+100) |
| General surgery | 60 | 9,463 | 0.39 | 0.66 | 480 of 983 | 49430 (-64), 49620 (-63), 49344 (-59) | 49918 (+87), 49799 (+84), 49831 (+84) |
| Infectious disease | 90 | 1,351 | 0.06 | 0.70 | 531 of 983 | 48116 (-73), 48353 (-69), 48356 (-68) | 49636 (+74), 49038 (+70), 49664 (+70) |
| Genetics & genetic counseling | 90 | 906 | 0.03 | 0.60 | 563 of 983 | 48164 (-85), 49335 (-85), 48134 (-83) | 48441 (+81), 48456 (+77), 48470 (+77) |
| Hospice & palliative care | 60 | 1,689 | 0.09 | 0.67 | 485 of 983 | 49916 (-58), 49886 (-56), 49885 (-54) | 49808 (+100), 49817 (+100), 49836 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
