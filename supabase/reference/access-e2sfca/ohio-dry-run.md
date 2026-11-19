# E2SFCA access dry run: Ohio

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,307; in Ohio: 1,204
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,307 x 3,307 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 939,631; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.13 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.83), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 24; re-anchored: 18; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (25008, 25047, 25149, 25173, 25204)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 15325 | no | 8.02 | 100% | 4.29 | 100% | yes (1.70) |
| 15450 | no | 9.55 | 100% | 4.03 | 100% | yes (0.80) |
| 15466 | no | 10.02 | 100% | 3.64 | 100% | yes (0.82) |
| 24823 | no | 9.96 | 100% | 5.79 | 100% | yes (2.29) |
| 24870 | no | 7.98 | 100% | 5.09 | 100% | yes (1.65) |
| 25008 | no | 8.06 | 100% | 8.06 | 100% | no |
| 25021 | no | 8.27 | 100% | 5.76 | 100% | no |
| 25022 | no | 8.51 | 100% | 4.75 | 100% | yes (1.65) |
| 25047 | no | 9.17 | 100% | 10.75 | 100% | no |
| 25057 | no | 9.25 | 100% | 3.73 | 100% | yes (1.36) |
| 25114 | no | 8.85 | 100% | 4.62 | 100% | yes (1.92) |
| 25148 | no | 9.80 | 100% | 6.58 | 100% | yes (2.00) |
| 25149 | no | 8.44 | 100% | 8.44 | 100% | no |
| 25152 | no | 9.20 | 100% | 5.75 | 100% | yes (1.99) |
| 25173 | no | 7.94 | 100% | 7.94 | 100% | no |
| 25183 | no | 8.92 | 100% | 5.44 | 100% | yes (1.43) |
| 25204 | no | 8.07 | 100% | 7.85 | 100% | no |
| 25628 | no | 9.83 | 100% | 3.87 | 100% | yes (0.80) |
| 25646 | no | 8.92 | 100% | 5.34 | 100% | yes (1.70) |
| 25864 | no | 11.19 | 100% | 3.54 | 100% | yes (1.99) |
| 26259 | no | 8.15 | 100% | 3.22 | 100% | yes (1.60) |
| 26261 | no | 9.60 | 100% | 3.76 | 100% | yes (1.49) |
| 41250 | no | 9.11 | 100% | 5.42 | 100% | yes (1.44) |
| 47104 | no | 7.94 | 100% | 4.99 | 100% | yes (1.57) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 109,778 | 4.78 | 0.71 | 402 of 1204 | 43438 (-44), 43740 (-43), 43721 (-37) | 45789 (+95), 45619 (+86), 45788 (+82) |
| Pediatrics (children) | 30 | 24,680 | 1.13 | 0.80 | 310 of 1204 | 45041 (-63), 45247 (-60), 45147 (-53) | 44216 (+79), 44260 (+78), 45051 (+67) |
| Women's health / OB-GYN | 60 | 11,454 | 0.55 | 0.66 | 447 of 1204 | 43413 (-49), 45005 (-47), 43008 (-45) | 43511 (+74), 43524 (+73), 43516 (+70) |
| Mental health & counseling | 30 | 174,153 | 7.13 | 0.77 | 432 of 1204 | 44214 (-60), 44606 (-60), 43934 (-52) | 45681 (+95), 45778 (+91), 45766 (+90) |
| Dental | 30 | 32,130 | 1.64 | 0.71 | 298 of 1204 | 43934 (-37), 45771 (-36), 45779 (-32) | 44072 (+62), 45644 (+54), 45789 (+53) |
| Eye care | 30 | 17,487 | 0.65 | 0.61 | 577 of 1204 | 43756 (-59), 45893 (-57), 43056 (-48) | 45644 (+95), 43977 (+93), 43727 (+83) |
| Chiropractic | 30 | 13,017 | 0.64 | 0.63 | 421 of 1204 | 45876 (-48), 43759 (-44), 45820 (-40) | 44454 (+64), 44822 (+62), 45729 (+59) |
| Physical & occupational therapy | 30 | 64,177 | 2.73 | 0.72 | 393 of 1204 | 44301 (-60), 44304 (-53), 44308 (-52) | 45789 (+74), 45710 (+73), 44818 (+64) |
| Orthopedics & sports injury | 60 | 10,691 | 0.42 | 0.58 | 551 of 1204 | 45772 (-92), 45783 (-92), 45723 (-85) | 45789 (+76), 44634 (+75), 43153 (+74) |
| Heart / cardiology | 60 | 6,344 | 0.28 | 0.67 | 639 of 1204 | 45050 (-65), 43008 (-62), 45636 (-61) | 43932 (+70), 44626 (+70), 45789 (+69) |
| Skin / dermatology | 60 | 1,977 | 0.10 | 0.74 | 453 of 1204 | 43018 (-49), 45041 (-49), 45723 (-47) | 43443 (+70), 43446 (+69), 43502 (+66) |
| Allergy & immunology | 60 | 762 | 0.03 | 0.71 | 515 of 1204 | 45065 (-84), 45036 (-78), 45030 (-67) | 45789 (+79), 45166 (+73), 43407 (+72) |
| Lung, breathing & sleep | 60 | 2,953 | 0.14 | 0.73 | 570 of 1204 | 43137 (-61), 43018 (-57), 43033 (-55) | 45830 (+66), 45789 (+62), 45681 (+59) |
| Digestive / gastroenterology | 60 | 2,684 | 0.13 | 0.77 | 488 of 1204 | 43137 (-67), 43008 (-61), 43001 (-58) | 45068 (+66), 44216 (+62), 44666 (+59) |
| Kidney / nephrology | 60 | 2,669 | 0.12 | 0.66 | 636 of 1204 | 43008 (-66), 45810 (-66), 43018 (-61) | 43446 (+69), 43910 (+69), 44626 (+69) |
| Diabetes & hormones | 60 | 1,340 | 0.07 | 0.71 | 587 of 1204 | 45723 (-71), 45783 (-69), 43137 (-67) | 45893 (+70), 45850 (+68), 43446 (+66) |
| Cancer care / oncology | 90 | 3,726 | 0.18 | 0.51 | 761 of 1204 | 43137 (-74), 43147 (-74), 43018 (-73) | 43446 (+74), 43456 (+72), 43540 (+70) |
| Arthritis / rheumatology | 60 | 870 | 0.04 | 0.74 | 522 of 1204 | 45041 (-77), 43018 (-74), 43033 (-71) | 45688 (+100), 45841 (+74), 45877 (+69) |
| Brain & nerves / neurology | 60 | 4,877 | 0.24 | 0.73 | 456 of 1204 | 45005 (-68), 43137 (-60), 45041 (-60) | 45850 (+69), 45896 (+60), 45854 (+55) |
| Ear, nose & throat | 60 | 1,647 | 0.08 | 0.61 | 708 of 1204 | 43018 (-72), 43137 (-66), 43113 (-63) | 44681 (+79), 43360 (+76), 43318 (+75) |
| Urology | 60 | 1,755 | 0.08 | 0.61 | 665 of 1204 | 45636 (-94), 43137 (-68), 45810 (-67) | 43446 (+75), 43977 (+71), 43456 (+70) |
| Foot & ankle / podiatry | 60 | 4,410 | 0.16 | 0.68 | 599 of 1204 | 44412 (-83), 44076 (-71), 44429 (-71) | 45332 (+73), 43360 (+72), 45390 (+71) |
| Pain management | 60 | 1,766 | 0.09 | 0.60 | 511 of 1204 | 45636 (-67), 45723 (-67), 45764 (-66) | 43044 (+76), 43961 (+71), 45068 (+71) |
| Plastic & reconstructive surgery | 90 | 1,350 | 0.07 | 0.64 | 650 of 1204 | 43142 (-55), 43018 (-53), 43151 (-53) | 43504 (+74), 44408 (+72), 44454 (+70) |
| Speech & language therapy | 30 | 17,718 | 0.87 | 0.68 | 439 of 1204 | 44301 (-55), 44304 (-41), 44308 (-39) | 45784 (+82), 45739 (+76), 45332 (+72) |
| Nutrition & dietitian | 30 | 6,443 | 0.32 | 0.77 | 372 of 1204 | 45631 (-42), 45775 (-42), 43934 (-38) | 45681 (+82), 45644 (+80), 45647 (+69) |
| Acupuncture, massage & naturopathy | 30 | 5,970 | 0.50 | 0.76 | 199 of 1204 | 45714 (-37), 45773 (-31), 45820 (-31) | 45669 (+74), 45619 (+63), 43105 (+61) |
| Urgent care & emergency | 30 | 12,196 | 0.50 | 0.71 | 458 of 1204 | 44621 (-58), 43137 (-37), 45424 (-35) | 45729 (+100), 45746 (+100), 45768 (+100) |
| Imaging & lab | 60 | 11,000 | 0.55 | 0.69 | 523 of 1204 | 43018 (-54), 43137 (-54), 45636 (-54) | 44626 (+70), 45663 (+57), 45244 (+52) |
| Pharmacy | 30 | 40,605 | 1.68 | 0.69 | 483 of 1204 | 43934 (-45), 43740 (-44), 43721 (-42) | 45681 (+85), 45896 (+75), 43727 (+72) |
| Home health & in-home care | 30 | 94,984 | 1.49 | 0.61 | 335 of 1204 | 45883 (-38), 44653 (-33), 44093 (-28) | 43446 (+88), 43456 (+88), 45894 (+83) |
| Nursing & assisted living | 60 | 10,807 | 0.37 | 0.50 | 545 of 1204 | 43717 (-81), 45727 (-73), 43001 (-69) | 43446 (+87), 43456 (+78), 43438 (+68) |
| Medical equipment & supplies | 60 | 7,419 | 0.34 | 0.68 | 435 of 1204 | 44412 (-52), 44429 (-48), 43413 (-47) | 43446 (+74), 43456 (+68), 43407 (+64) |
| Hearing & audiology | 60 | 4,661 | 0.20 | 0.61 | 640 of 1204 | 45723 (-77), 44254 (-65), 44214 (-64) | 43977 (+69), 43446 (+64), 45068 (+64) |
| Behavior therapy (ABA) | 30 | 79,191 | 2.58 | 0.84 | 112 of 1204 | 43934 (-41), 45405 (-39), 43909 (-37) | 43977 (+100), 45068 (+96), 44822 (+95) |
| Care coordination & community health | 30 | 85,545 | 1.55 | 0.67 | 439 of 1204 | 44214 (-92), 44217 (-91), 44633 (-91) | 43332 (+100), 43438 (+100), 43446 (+100) |
| General surgery | 60 | 8,143 | 0.39 | 0.63 | 596 of 1204 | 45884 (-61), 45895 (-61), 45810 (-60) | 45663 (+60), 45789 (+56), 44403 (+54) |
| Infectious disease | 90 | 1,140 | 0.06 | 0.57 | 782 of 1204 | 44056 (-61), 44141 (-61), 44241 (-59) | 45830 (+86), 43718 (+85), 43977 (+85) |
| Genetics & genetic counseling | 90 | 786 | 0.03 | 0.55 | 650 of 1204 | 43116 (-100), 43126 (-100), 43137 (-100) | 44807 (+74), 44439 (+72), 44062 (+70) |
| Hospice & palliative care | 60 | 1,440 | 0.09 | 0.60 | 584 of 1204 | 43008 (-57), 43137 (-56), 43116 (-50) | 43977 (+71), 45734 (+70), 45767 (+69) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
