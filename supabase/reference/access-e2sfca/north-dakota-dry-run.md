# E2SFCA access dry run: North Dakota

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 666; in North Dakota: 387
- Drive times: OSRM on OpenStreetMap roads (car profile), 666 x 666 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 33,609.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.27 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.66), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 3,726 | 4.30 | 0.45 | 217 of 387 | 58575 (-58), 58474 (-47), 58793 (-47) | 58649 (+89), 58560 (+84), 58363 (+74) |
| Pediatrics (children) | 30 | 608.6 | 1.11 | 0.63 | 92 of 387 | 58250 (-86), 58564 (-81), 58654 (-80) | 58734 (+92), 58059 (+73), 58773 (+70) |
| Women's health / OB-GYN | 60 | 270.2 | 0.53 | 0.72 | 57 of 387 | 58831 (-41), 58036 (-37), 58038 (-36) | 58750 (+60), 58725 (+59), 58560 (+43) |
| Mental health & counseling | 30 | 5,697.2 | 7.20 | 0.57 | 107 of 387 | 58581 (-51), 58654 (-27), 58316 (-25) | 58374 (+100), 58381 (+97), 58382 (+95) |
| Dental | 30 | 1,307.4 | 1.65 | 0.45 | 190 of 387 | 58575 (-76), 58330 (-57), 58220 (-48) | 58750 (+91), 58649 (+88), 58735 (+81) |
| Eye care | 30 | 649.8 | 0.62 | 0.58 | 198 of 387 | 58538 (-73), 58474 (-64), 58639 (-51) | 58735 (+100), 58737 (+100), 58759 (+100) |
| Chiropractic | 30 | 1,134.6 | 0.63 | 0.48 | 234 of 387 | 58254 (-65), 58761 (-59), 58552 (-57) | 58007 (+100), 58043 (+100), 58058 (+100) |
| Physical & occupational therapy | 30 | 3,115.4 | 2.70 | 0.48 | 224 of 387 | 58475 (-75), 58632 (-59), 58770 (-45) | 58560 (+100), 58572 (+100), 58566 (+96) |
| Orthopedics & sports injury | 60 | 440.6 | 0.39 | 0.75 | 109 of 387 | 58015 (-90), 58214 (-78), 58079 (-75) | 58035 (+90), 58016 (+87), 58049 (+76) |
| Heart / cardiology | 60 | 85.4 | 0.24 | 0.63 | 43 of 387 | 58038 (-42), 58036 (-41), 58015 (-36) | 58560 (+75), 58005 (+57), 58572 (+40) |
| Skin / dermatology | 60 | 51.8 | 0.09 | 0.66 | 47 of 387 | 58015 (-59), 58853 (-56), 58036 (-52) | 58021 (+55), 58051 (+49), 58059 (+48) |
| Allergy & immunology | 60 | 15.2 | 0.03 | 0.65 | 53 of 387 | 58218 (-47), 58205 (-42), 58045 (-40) | 58560 (+64), 58731 (+51), 58021 (+39) |
| Lung, breathing & sleep | 60 | 76.2 | 0.13 | 0.63 | 63 of 387 | 58725 (-91), 58036 (-79), 58038 (-78) | 58363 (+75), 58560 (+59), 58339 (+55) |
| Digestive / gastroenterology | 60 | 43.4 | 0.11 | 0.65 | 41 of 387 | 58036 (-49), 58038 (-48), 58015 (-45) | 58560 (+77), 58004 (+62), 58079 (+51) |
| Kidney / nephrology | 60 | 69 | 0.11 | 0.66 | 108 of 387 | 58535 (-95), 58756 (-74), 58377 (-56) | 58573 (+100), 58552 (+97), 58560 (+73) |
| Diabetes & hormones | 60 | 78.2 | 0.06 | 0.73 | 130 of 387 | 58015 (-100), 58036 (-100), 58038 (-100) | 58035 (+84), 58735 (+83), 58016 (+77) |
| Cancer care / oncology | 90 | 84.4 | 0.15 | 0.54 | 114 of 387 | 58036 (-66), 58038 (-66), 58045 (-60) | 58560 (+61), 58005 (+35), 58735 (+34) |
| Arthritis / rheumatology | 60 | 8.4 | 0.04 | 0.60 | 25 of 387 | 58041 (-45), 58015 (-34), 58012 (-33) | 58021 (+33), 58059 (+27), 58572 (+21) |
| Brain & nerves / neurology | 60 | 99.8 | 0.22 | 0.63 | 49 of 387 | 58038 (-58), 58036 (-56), 58015 (-54) | 58021 (+59), 58059 (+49), 58560 (+46) |
| Ear, nose & throat | 60 | 53 | 0.07 | 0.65 | 63 of 387 | 58853 (-91), 58038 (-74), 58036 (-73) | 58560 (+66), 58735 (+60), 58572 (+55) |
| Urology | 60 | 42 | 0.07 | 0.67 | 62 of 387 | 58756 (-73), 58790 (-59), 58741 (-58) | 58735 (+80), 58560 (+73), 58759 (+67) |
| Foot & ankle / podiatry | 60 | 69.6 | 0.15 | 0.71 | 76 of 387 | 58653 (-70), 58385 (-48), 58352 (-38) | 58348 (+78), 58356 (+63), 58310 (+61) |
| Pain management | 60 | 24.6 | 0.09 | 0.64 | 36 of 387 | 58831 (-46), 58015 (-32), 58036 (-31) | 58735 (+60), 58759 (+51), 58021 (+33) |
| Plastic & reconstructive surgery | 90 | 33.8 | 0.07 | 0.51 | 132 of 387 | 58036 (-61), 58038 (-61), 58005 (-60) | 58735 (+66), 58759 (+63), 58560 (+62) |
| Speech & language therapy | 30 | 1,268.4 | 0.90 | 0.62 | 197 of 387 | 58492 (-73), 58458 (-69), 58528 (-67) | 58233 (+100), 58424 (+100), 58472 (+100) |
| Nutrition & dietitian | 30 | 411 | 0.33 | 0.62 | 192 of 387 | 58036 (-74), 58639 (-54), 58429 (-50) | 58233 (+100), 58346 (+100), 58353 (+100) |
| Acupuncture, massage & naturopathy | 30 | 207 | 0.52 | 0.68 | 67 of 387 | 58575 (-78), 58640 (-43), 58559 (-29) | 58627 (+56), 58560 (+48), 58463 (+47) |
| Urgent care & emergency | 30 | 409.6 | 0.47 | 0.45 | 212 of 387 | 58760 (-83), 58575 (-76), 58474 (-69) | 58239 (+100), 58281 (+100), 58310 (+100) |
| Imaging & lab | 60 | 389.2 | 0.49 | 0.72 | 80 of 387 | 58015 (-69), 58045 (-60), 58038 (-56) | 58348 (+78), 58560 (+68), 58356 (+66) |
| Pharmacy | 30 | 1,751.8 | 1.72 | 0.36 | 234 of 387 | 58575 (-54), 58054 (-48), 58324 (-43) | 58363 (+100), 58310 (+99), 58339 (+93) |
| Home health & in-home care | 30 | 3,418.6 | 1.61 | 0.45 | 161 of 387 | 58006 (-61), 58643 (-59), 58431 (-58) | 58239 (+100), 58281 (+100), 58310 (+100) |
| Nursing & assisted living | 60 | 631.4 | 0.39 | 0.61 | 165 of 387 | 58011 (-100), 58464 (-100), 58079 (-94) | 58478 (+99), 58520 (+85), 58744 (+79) |
| Medical equipment & supplies | 60 | 214 | 0.36 | 0.71 | 110 of 387 | 58790 (-59), 58346 (-53), 58015 (-46) | 58463 (+67), 58008 (+61), 58735 (+60) |
| Hearing & audiology | 60 | 160.4 | 0.19 | 0.71 | 118 of 387 | 58038 (-61), 58741 (-59), 58790 (-59) | 58735 (+80), 58642 (+68), 58759 (+67) |
| Behavior therapy (ABA) | 30 | 1,044 | 2.88 | 0.72 | 31 of 387 | 58784 (-47), 58015 (-19), 58018 (-16) | 58051 (+89), 58012 (+78), 58021 (+66) |
| Care coordination & community health | 30 | 2,984 | 1.63 | 0.53 | 185 of 387 | 58639 (-53), 58413 (-52), 58436 (-51) | 58021 (+100), 58363 (+100), 58374 (+100) |
| General surgery | 60 | 213.4 | 0.35 | 0.67 | 107 of 387 | 58218 (-80), 58214 (-74), 58653 (-66) | 58005 (+60), 58560 (+51), 58735 (+41) |
| Infectious disease | 90 | 21.8 | 0.05 | 0.48 | 101 of 387 | 58036 (-62), 58365 (-62), 58038 (-61) | 58560 (+59), 58363 (+46), 58339 (+37) |
| Genetics & genetic counseling | 90 | 28.8 | 0.03 | 0.47 | 101 of 387 | 58001 (-100), 58004 (-100), 58006 (-100) | 58538 (+99), 58528 (+78), 58258 (+75) |
| Hospice & palliative care | 60 | 44.4 | 0.09 | 0.69 | 97 of 387 | 58346 (-97), 58542 (-76), 58456 (-71) | 58440 (+77), 58540 (+74), 58363 (+73) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in North Dakota in households with no vehicle: about 34,432 of 595,940 (5.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 4
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 1 of 387 | 58778 (+15), 58460 (+8), 58335 (+6) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 387 | 58053 (+4), 58335 (+3), 58102 (+2) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 387 | 58329 (+4), 58568 (+4), 58778 (+4) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 387 | 58335 (+17), 58367 (+4), 58102 (+3) | 1.00 |
| Dental | 1.00 | 1 of 387 | 58778 (+18), 58335 (+7), 58370 (+6) | 1.00 |
| Eye care | 1.00 | 0 of 387 | 58335 (+11), 58370 (+9), 58367 (+3) | 1.00 |
| Chiropractic | 1.00 | 0 of 387 | 58460 (+9), 58335 (+8), 58370 (+6) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 387 | 58335 (+6), 58370 (+4), 58460 (+4) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 387 | 58778 (+9), 58480 (+6), 58329 (+4) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 387 | 58778 (+2), 58042 (+1), 58053 (+1) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 387 | 58102 (+3), 58778 (+3), 58504 (+2) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 387 | 58778 (+3), 58102 (+2), 58203 (+2) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 387 | 58787 (+21), 58329 (+10), 58367 (+8) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 387 | 58335 (+5), 58379 (+4), 58370 (+3) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 387 | 58335 (+16), 58379 (+11), 58370 (+10) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 387 | 58379 (+14), 58644 (+10), 58778 (+7) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 387 | 58778 (+7), 58568 (+3), 58103 (+2) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 387 | 58102 (+2) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 387 | 58102 (+3), 58778 (+3), 58203 (+2) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 387 | 58778 (+4), 58102 (+3), 58203 (+2) | 1.00 |
| Urology | 1.00 | 0 of 387 | 58778 (+9), 58770 (+5), 58781 (+3) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 387 | 58379 (+10), 58370 (+9), 58335 (+3) | 1.00 |
| Pain management | 1.00 | 0 of 387 | 58778 (+5), 58831 (+2), 58042 (+1) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 387 | 58778 (+14), 58102 (+4), 58568 (+3) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 387 | 58335 (+13), 58370 (+10), 58778 (+4) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 387 | 58370 (+7), 58367 (+6), 58317 (+5) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 387 | 58778 (+16), 58102 (+2), 58329 (+1) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 387 | 58778 (+17), 58568 (+7), 58335 (+6) | 1.00 |
| Imaging & lab | 1.00 | 0 of 387 | 58379 (+10), 58370 (+8), 58568 (+4) | 1.00 |
| Pharmacy | 1.00 | 1 of 387 | 58778 (+21), 58370 (+9), 58329 (+8) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 387 | 58778 (+12), 58787 (+10), 58460 (+4) | 1.00 |
| Nursing & assisted living | 0.99 | 2 of 387 | 58778 (+19), 58379 (+18), 58787 (+14) | 1.00 |
| Medical equipment & supplies | 1.00 | 1 of 387 | 58778 (+35), 58335 (+13), 58370 (+8) | 1.00 |
| Hearing & audiology | 1.00 | 0 of 387 | 58335 (+14), 58568 (+11), 58379 (+10) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 387 | 58102 (+3), 58103 (+1), 58225 (+1) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 387 | 58329 (+5), 58568 (+3), 58272 (+2) | 1.00 |
| General surgery | 1.00 | 0 of 387 | 58332 (+6), 58568 (+6), 58329 (+5) | 1.00 |
| Infectious disease | 1.00 | 0 of 387 | 58329 (+12), 58367 (+8), 58568 (+3) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 387 | 58568 (+4), 58072 (+2), 58075 (+2) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 387 | 58329 (+14), 58335 (+10), 58332 (+8) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 26 of 386 | 8,029 (1.3%) |  | 14/25 | 7/43 | 5/46 | 0/272 |
| Women's health / OB-GYN | 016 | 4 of 386 | 686 (0.1%) |  | 3/25 | 0/43 | 1/46 | 0/272 |
| Mental health & counseling: Psychiatry | 029 | 19 of 386 | 12,425 (2.1%) |  | 3/25 | 2/43 | 7/46 | 7/272 |
| Mental health & counseling: Clinical Psychology | 036 | 7 of 386 | 2,285 (0.4%) |  | 3/25 | 2/43 | 2/46 | 0/272 |
| Mental health & counseling: Clinical Social Work | 037 | 8 of 386 | 2,722 (0.5%) |  | 5/25 | 3/43 | 0/46 | 0/272 |
| Eye care | 023 | 13 of 386 | 4,882 (0.8%) |  | 12/25 | 0/43 | 0/46 | 1/272 |
| Chiropractic | 010 | 0 of 386 | 0 (0.0%) |  | 0/25 | 0/43 | 0/46 | 0/272 |
| Physical & occupational therapy | F049 | 0 of 386 | 0 (0.0%) |  | 0/25 | 0/43 | 0/46 | 0/272 |
| Orthopedics & sports injury | 025 | 25 of 386 | 10,034 (1.7%) |  | 2/25 | 6/43 | 2/46 | 15/272 |
| Heart / cardiology | 008 | 176 of 386 | 135,201 (22.7%) |  | 13/25 | 7/43 | 24/46 | 132/272 |
| Skin / dermatology | 011 | 74 of 386 | 29,883 (5.0%) |  | 4/25 | 2/43 | 9/46 | 59/272 |
| Allergy & immunology | 007 | 21 of 386 | 5,453 (0.9%) |  | 0/25 | 0/43 | 1/46 | 20/272 |
| Lung, breathing & sleep | 030 | 45 of 386 | 18,791 (3.2%) |  | 3/25 | 0/43 | 9/46 | 33/272 |
| Digestive / gastroenterology | 014 | 28 of 386 | 12,542 (2.1%) |  | 3/25 | 0/43 | 9/46 | 16/272 |
| Kidney / nephrology | 018 | 6 of 386 | 1,481 (0.2%) |  | 5/25 | 0/43 | 1/46 | 0/272 |
| Diabetes & hormones | 012 | 0 of 386 | 0 (0.0%) |  | 0/25 | 0/43 | 0/46 | 0/272 |
| Cancer care / oncology | 021 | 89 of 386 | 61,158 (10.3%) |  | 4/25 | 0/43 | 17/46 | 68/272 |
| Arthritis / rheumatology | 031 | 107 of 386 | 133,032 (22.3%) |  | 0/25 | 16/43 | 17/46 | 74/272 |
| Brain & nerves / neurology | 019 | 90 of 386 | 41,498 (7.0%) |  | 4/25 | 0/43 | 11/46 | 75/272 |
| Ear, nose & throat | 013 | 46 of 386 | 19,970 (3.4%) |  | 4/25 | 0/43 | 7/46 | 35/272 |
| Urology | 033 | 68 of 386 | 28,821 (4.8%) |  | 0/25 | 2/43 | 7/46 | 59/272 |
| Foot & ankle / podiatry | 028 | 12 of 386 | 3,403 (0.6%) |  | 4/25 | 2/43 | 2/46 | 4/272 |
| Plastic & reconstructive surgery | 027 | 28 of 386 | 12,504 (2.1%) |  | 0/25 | 0/43 | 3/46 | 25/272 |
| Speech & language therapy | F051 | 0 of 386 | 0 (0.0%) |  | 0/25 | 0/43 | 0/46 | 0/272 |
| Imaging & lab | F047 | 14 of 386 | 10,330 (1.7%) |  | 2/25 | 0/43 | 9/46 | 3/272 |
| Nursing & assisted living | F046 | 0 of 386 | 0 (0.0%) |  | 0/25 | 0/43 | 0/46 | 0/272 |
| General surgery | 015 | 22 of 386 | 8,226 (1.4%) |  | 14/25 | 2/43 | 0/46 | 6/272 |
| Infectious disease | 017 | 31 of 386 | 41,732 (7.0%) |  | 0/25 | 0/43 | 8/46 | 23/272 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 15480 rows (ZIP x specialty) stored in access_e2sfca for ND; market-score now uses drive-time access for these ZIPs.
