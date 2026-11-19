# E2SFCA access dry run: North Carolina

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,488; in North Carolina: 820
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,488 x 2,488 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 701,113; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.84 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.11), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 42; re-anchored: 13; still implausible (left out of the rank comparison, still stored, marked in the CSV): 31 (23347, 23354, 23405, 24712, 24731, 24740, 24828, 24878, 24892, 24894, 25922, 27950, 40447, 40481, 40486, 40806, 40815, 40818, 40862, 40913, 40941, 40965, 40977, 40997, 41367, 41534, 41560, 41660, 41731, 41821, 41833)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 23347 | no | 7.93 | 100% | 7.93 | 100% | no |
| 23354 | no | 7.25 | 100% | 7.25 | 100% | no |
| 23405 | no | 7.61 | 100% | 7.61 | 100% | no |
| 23604 | no | 8.00 | 100% | 3.43 | 100% | yes (1.35) |
| 24150 | no | 8.98 | 100% | 3.83 | 100% | yes (1.57) |
| 24712 | no | 12.70 | 100% | 13.05 | 100% | no |
| 24731 | no | 12.95 | 100% | 12.59 | 100% | no |
| 24739 | no | 9.97 | 100% | 6.15 | 100% | yes (6.41) |
| 24740 | no | 12.14 | 100% | 11.38 | 100% | no |
| 24828 | no | 7.90 | 100% | 7.90 | 100% | no |
| 24878 | no | 13.30 | 100% | 13.30 | 100% | no |
| 24892 | no | 7.18 | 100% | 7.18 | 100% | no |
| 24894 | no | 8.82 | 100% | 8.82 | 100% | no |
| 25922 | no | 16.43 | 100% | 10.78 | 100% | yes (13.15) |
| 27927 | yes | 10.61 | 100% | 2.33 | 100% | yes (2.74) |
| 27950 | yes | 8.23 | 100% | 7.26 | 100% | no |
| 37757 | no | 7.30 | 100% | 3.08 | 100% | yes (1.41) |
| 40447 | no | 7.27 | 100% | 7.27 | 100% | no |
| 40481 | no | 7.85 | 100% | 7.85 | 100% | no |
| 40486 | no | 10.18 | 100% | 10.18 | 100% | no |
| 40806 | no | 11.24 | 100% | 11.24 | 100% | no |
| 40815 | no | 7.25 | 100% | 7.25 | 100% | no |
| 40818 | no | 7.46 | 100% | 7.46 | 100% | no |
| 40862 | no | 9.99 | 100% | 9.99 | 100% | no |
| 40913 | no | 10.74 | 100% | 11.50 | 100% | no |
| 40939 | no | 8.95 | 100% | 0.00 | 100% | no |
| 40941 | no | 14.57 | 100% | 14.57 | 100% | no |
| 40965 | no | 9.42 | 100% | 7.45 | 100% | yes (2.89) |
| 40977 | no | 10.29 | 100% | 7.69 | 100% | yes (8.84) |
| 40982 | no | 12.73 | 100% | 0.00 | 100% | yes (22.12) |
| 40997 | no | 11.22 | 100% | 11.25 | 100% | no |
| 41367 | no | 10.69 | 100% | 11.49 | 100% | no |
| 41534 | no | 7.93 | 100% | 7.97 | 100% | no |
| 41538 | no | 7.86 | 100% | 1.89 | 100% | yes (8.44) |
| 41560 | no | 7.25 | 100% | 7.77 | 100% | no |
| 41604 | no | 12.35 | 100% | 0.85 | 100% | yes (14.54) |
| 41660 | no | 8.72 | 100% | 8.91 | 100% | no |
| 41701 | no | 13.62 | 100% | 0.04 | 100% | yes (26.69) |
| 41731 | no | 8.83 | 100% | 12.00 | 100% | no |
| 41751 | no | 13.34 | 100% | 0.00 | 100% | yes (21.14) |
| 41821 | no | 10.28 | 100% | 10.28 | 100% | no |
| 41833 | no | 8.57 | 100% | 8.57 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 112,946 | 4.78 | 0.46 | 392 of 819 | 28721 (-75), 28611 (-53), 28779 (-48) | 27829 (+98), 28435 (+97), 28730 (+95) |
| Pediatrics (children) | 30 | 21,094 | 1.13 | 0.67 | 269 of 819 | 28721 (-53), 27201 (-37), 27560 (-35) | 27829 (+100), 27837 (+86), 27503 (+81) |
| Women's health / OB-GYN | 60 | 12,168 | 0.55 | 0.66 | 362 of 819 | 28745 (-56), 28513 (-54), 28554 (-52) | 28436 (+90), 28435 (+64), 28553 (+64) |
| Mental health & counseling | 30 | 141,474 | 7.13 | 0.59 | 364 of 819 | 28745 (-56), 28719 (-45), 28616 (-44) | 27829 (+80), 28449 (+75), 28730 (+74) |
| Dental | 30 | 32,093 | 1.64 | 0.59 | 316 of 819 | 28719 (-52), 28721 (-49), 27923 (-46) | 27829 (+98), 28531 (+88), 27871 (+85) |
| Eye care | 30 | 12,688 | 0.65 | 0.52 | 325 of 819 | 28721 (-57), 28745 (-46), 28584 (-44) | 28457 (+74), 28479 (+69), 28449 (+63) |
| Chiropractic | 30 | 13,080 | 0.64 | 0.64 | 286 of 819 | 28466 (-60), 28717 (-60), 28786 (-49) | 28457 (+76), 28701 (+68), 27972 (+65) |
| Physical & occupational therapy | 30 | 59,067 | 2.73 | 0.61 | 331 of 819 | 27885 (-53), 27917 (-41), 27956 (-39) | 28730 (+93), 27503 (+81), 28701 (+79) |
| Orthopedics & sports injury | 60 | 9,863 | 0.42 | 0.68 | 345 of 819 | 28717 (-61), 28357 (-48), 27284 (-44) | 28133 (+82), 28708 (+73), 28326 (+62) |
| Heart / cardiology | 60 | 5,502 | 0.28 | 0.67 | 335 of 819 | 28513 (-86), 28586 (-75), 27852 (-71) | 28436 (+84), 28369 (+75), 28435 (+71) |
| Skin / dermatology | 60 | 1,872 | 0.10 | 0.69 | 372 of 819 | 28425 (-60), 28762 (-53), 28586 (-52) | 28436 (+78), 28129 (+77), 28097 (+75) |
| Allergy & immunology | 60 | 650 | 0.03 | 0.73 | 342 of 819 | 27965 (-81), 28757 (-81), 28791 (-80) | 28719 (+89), 28367 (+78), 27281 (+69) |
| Lung, breathing & sleep | 60 | 3,000 | 0.14 | 0.67 | 312 of 819 | 28554 (-100), 27864 (-94), 27852 (-93) | 28436 (+85), 28435 (+75), 28709 (+71) |
| Digestive / gastroenterology | 60 | 2,481 | 0.13 | 0.69 | 353 of 819 | 28513 (-79), 27852 (-73), 28554 (-66) | 28436 (+88), 28435 (+78), 28129 (+71) |
| Kidney / nephrology | 60 | 2,498 | 0.12 | 0.64 | 322 of 819 | 28513 (-86), 28554 (-75), 28586 (-73) | 28436 (+90), 28435 (+79), 27207 (+69) |
| Diabetes & hormones | 60 | 1,167 | 0.07 | 0.71 | 341 of 819 | 28513 (-71), 27852 (-67), 28554 (-60) | 28436 (+83), 28129 (+82), 28097 (+77) |
| Cancer care / oncology | 90 | 3,227 | 0.18 | 0.44 | 474 of 819 | 28754 (-53), 28088 (-52), 28782 (-51) | 27281 (+82), 28367 (+81), 28347 (+75) |
| Arthritis / rheumatology | 60 | 816 | 0.04 | 0.71 | 378 of 819 | 28586 (-83), 28513 (-76), 28421 (-64) | 28129 (+82), 28097 (+78), 28612 (+75) |
| Brain & nerves / neurology | 60 | 4,027 | 0.24 | 0.74 | 282 of 819 | 27826 (-45), 27852 (-42), 28079 (-39) | 28436 (+88), 28129 (+80), 28435 (+79) |
| Ear, nose & throat | 60 | 1,486 | 0.08 | 0.69 | 425 of 819 | 27594 (-58), 28555 (-56), 28586 (-53) | 28756 (+76), 27972 (+73), 27982 (+71) |
| Urology | 60 | 1,942 | 0.08 | 0.57 | 467 of 819 | 28586 (-86), 28513 (-76), 27284 (-75) | 28436 (+84), 27808 (+77), 28785 (+77) |
| Foot & ankle / podiatry | 60 | 2,614 | 0.16 | 0.61 | 276 of 819 | 28785 (-46), 28456 (-37), 28088 (-33) | 28436 (+89), 27926 (+78), 28435 (+63) |
| Pain management | 60 | 1,796 | 0.09 | 0.69 | 296 of 819 | 28513 (-53), 28554 (-53), 28586 (-51) | 28556 (+80), 28520 (+74), 28436 (+72) |
| Plastic & reconstructive surgery | 90 | 1,232 | 0.07 | 0.57 | 417 of 819 | 28792 (-51), 28456 (-49), 28754 (-47) | 28367 (+86), 28531 (+84), 28528 (+83) |
| Speech & language therapy | 30 | 19,836 | 0.87 | 0.66 | 346 of 819 | 27542 (-54), 28472 (-47), 28425 (-45) | 28369 (+100), 28438 (+97), 28530 (+94) |
| Nutrition & dietitian | 30 | 6,822 | 0.32 | 0.68 | 347 of 819 | 27314 (-66), 28708 (-66), 27826 (-57) | 27829 (+100), 27871 (+100), 28531 (+100) |
| Acupuncture, massage & naturopathy | 30 | 6,011 | 0.50 | 0.74 | 168 of 819 | 28742 (-64), 28455 (-60), 28443 (-41) | 28746 (+93), 28457 (+68), 28386 (+66) |
| Urgent care & emergency | 30 | 9,703 | 0.50 | 0.44 | 364 of 819 | 28745 (-76), 28721 (-74), 28349 (-68) | 27829 (+100), 27972 (+100), 27982 (+100) |
| Imaging & lab | 60 | 10,278 | 0.55 | 0.65 | 297 of 819 | 27852 (-75), 28513 (-75), 27864 (-66) | 28436 (+89), 28435 (+77), 28367 (+72) |
| Pharmacy | 30 | 39,753 | 1.68 | 0.48 | 393 of 819 | 27810 (-59), 28717 (-47), 28547 (-45) | 28318 (+85), 28531 (+81), 28701 (+80) |
| Home health & in-home care | 30 | 24,967 | 1.49 | 0.69 | 224 of 819 | 28170 (-55), 27573 (-51), 28472 (-45) | 27844 (+74), 27829 (+65), 27926 (+65) |
| Nursing & assisted living | 60 | 9,107 | 0.37 | 0.61 | 346 of 819 | 28637 (-51), 28513 (-48), 28666 (-48) | 28556 (+93), 28736 (+76), 27046 (+74) |
| Medical equipment & supplies | 60 | 9,460 | 0.34 | 0.64 | 378 of 819 | 27594 (-52), 27979 (-51), 27542 (-46) | 27960 (+92), 27847 (+69), 27281 (+68) |
| Hearing & audiology | 60 | 4,037 | 0.20 | 0.71 | 385 of 819 | 27852 (-65), 28729 (-63), 28762 (-60) | 28785 (+89), 28751 (+68), 28756 (+67) |
| Behavior therapy (ABA) | 30 | 40,887 | 2.58 | 0.80 | 146 of 819 | 28443 (-47), 27958 (-41), 28439 (-41) | 28523 (+100), 28527 (+99), 28129 (+94) |
| Care coordination & community health | 30 | 14,416 | 1.55 | 0.61 | 42 of 819 | 28556 (-39), 28719 (-29), 28547 (-27) | 27829 (+29), 28733 (+28), 27871 (+27) |
| General surgery | 60 | 8,287 | 0.39 | 0.53 | 348 of 819 | 28513 (-88), 27825 (-76), 28586 (-72) | 28436 (+88), 28435 (+77), 28531 (+76) |
| Infectious disease | 90 | 971 | 0.06 | 0.58 | 397 of 819 | 27825 (-45), 28580 (-45), 28554 (-44) | 28367 (+86), 27281 (+80), 28129 (+72) |
| Genetics & genetic counseling | 90 | 594 | 0.03 | 0.60 | 472 of 819 | 28726 (-74), 28731 (-73), 28791 (-69) | 28783 (+77), 27829 (+73), 27871 (+72) |
| Hospice & palliative care | 60 | 1,648 | 0.09 | 0.55 | 312 of 819 | 28785 (-56), 27826 (-48), 27020 (-47) | 28739 (+72), 27874 (+70), 28466 (+67) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 28203 | Primary care / family doctor | 7.046 | 10.198 | 26 | 0 |
| 28203 | Mental health & counseling | 10.699 | 14.821 | 25 | 0 |
| 28203 | Heart / cardiology | 0.378 | 0.368 | 33 | 35 |
| 28203 | Cancer care / oncology | 0.326 | 0.206 | 8 | 42 |
| 28203 | Urgent care & emergency | 0.757 | 1.006 | 24 | 0 |
| 27601 | Primary care / family doctor | 6.707 | 8.021 | 30 | 16 |
| 27601 | Mental health & counseling | 14.481 | 16.379 | 0 | 0 |
| 27601 | Heart / cardiology | 0.400 | 0.299 | 29 | 47 |
| 27601 | Cancer care / oncology | 0.167 | 0.175 | 53 | 51 |
| 27601 | Urgent care & emergency | 0.413 | 0.515 | 58 | 48 |
| 28801 | Primary care / family doctor | 9.999 | 14.814 | 0 | 0 |
| 28801 | Mental health & counseling | 20.237 | 31.156 | 0 | 0 |
| 28801 | Heart / cardiology | 0.409 | 0.387 | 27 | 31 |
| 28801 | Cancer care / oncology | 0.338 | 0.247 | 5 | 31 |
| 28801 | Urgent care & emergency | 0.594 | 0.928 | 40 | 7 |
| 28401 | Primary care / family doctor | 7.098 | 10.131 | 26 | 0 |
| 28401 | Mental health & counseling | 12.053 | 14.015 | 15 | 2 |
| 28401 | Heart / cardiology | 0.373 | 0.392 | 34 | 30 |
| 28401 | Cancer care / oncology | 0.250 | 0.169 | 30 | 52 |
| 28401 | Urgent care & emergency | 0.411 | 0.507 | 59 | 49 |
| 27950 | Primary care / family doctor | 1.608 | 0.000 | 83 | 100 |
| 27950 | Mental health & counseling | 2.387 | 0.000 | 83 | 100 |
| 27950 | Heart / cardiology | 0.000 | 0.003 | 100 | 100 |
| 27950 | Cancer care / oncology | 0.000 | 0.013 | 100 | 96 |
| 27950 | Urgent care & emergency | 0.049 | 0.000 | 95 | 100 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 32800 rows (ZIP x specialty) stored in access_e2sfca for NC; market-score now uses drive-time access for these ZIPs.
