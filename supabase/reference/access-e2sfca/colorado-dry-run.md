# E2SFCA access dry run: Colorado

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 768; in Colorado: 517
- Drive times: OSRM on OpenStreetMap roads (car profile), 768 x 768 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 205,092; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.57 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.42), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 80022 | yes | 7.91 | 100% | 2.43 | 100% | yes (1.13) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 22,513.6 | 4.30 | 0.52 | 258 of 517 | 80813 (-62), 80815 (-47), 81624 (-47) | 81045 (+100), 81630 (+83), 80804 (+78) |
| Pediatrics (children) | 30 | 5,702.4 | 1.11 | 0.79 | 156 of 517 | 81024 (-92), 80742 (-76), 80481 (-56) | 81021 (+100), 80024 (+74), 81326 (+66) |
| Women's health / OB-GYN | 60 | 3,694.4 | 0.53 | 0.79 | 188 of 517 | 80735 (-54), 80234 (-44), 80640 (-42) | 80430 (+100), 80510 (+85), 80483 (+83) |
| Mental health & counseling | 30 | 50,730.8 | 7.20 | 0.66 | 240 of 517 | 81423 (-48), 80443 (-47), 81601 (-38) | 81146 (+100), 81136 (+97), 81025 (+95) |
| Dental | 30 | 11,096.2 | 1.65 | 0.57 | 297 of 517 | 81030 (-51), 81423 (-50), 81089 (-47) | 80428 (+100), 80430 (+100), 80801 (+100) |
| Eye care | 30 | 3,468.2 | 0.62 | 0.62 | 258 of 517 | 80443 (-59), 81019 (-53), 81077 (-47) | 80540 (+84), 81123 (+83), 81146 (+83) |
| Chiropractic | 30 | 4,365.4 | 0.63 | 0.54 | 284 of 517 | 81090 (-72), 80446 (-48), 80821 (-43) | 80428 (+100), 80430 (+100), 80467 (+100) |
| Physical & occupational therapy | 30 | 16,130.2 | 2.70 | 0.63 | 254 of 517 | 81423 (-51), 80746 (-41), 81435 (-41) | 80735 (+100), 81649 (+97), 81642 (+92) |
| Orthopedics & sports injury | 60 | 2,203.4 | 0.39 | 0.75 | 198 of 517 | 81248 (-84), 81133 (-51), 80476 (-43) | 81243 (+100), 81642 (+100), 80430 (+99) |
| Heart / cardiology | 60 | 1,138.6 | 0.24 | 0.75 | 217 of 517 | 80603 (-45), 80640 (-44), 80601 (-43) | 80463 (+97), 81045 (+83), 81638 (+73) |
| Skin / dermatology | 60 | 519.2 | 0.09 | 0.75 | 207 of 517 | 81248 (-100), 80530 (-58), 80603 (-54) | 80426 (+100), 81243 (+100), 81642 (+100) |
| Allergy & immunology | 60 | 191.8 | 0.03 | 0.82 | 195 of 517 | 80735 (-100), 80759 (-100), 80603 (-69) | 81642 (+100), 80860 (+85), 80463 (+84) |
| Lung, breathing & sleep | 60 | 658.6 | 0.13 | 0.80 | 186 of 517 | 80549 (-86), 81248 (-63), 80234 (-53) | 81243 (+100), 81419 (+87), 81415 (+83) |
| Digestive / gastroenterology | 60 | 544.2 | 0.11 | 0.87 | 155 of 517 | 80603 (-58), 80137 (-53), 80640 (-53) | 81642 (+100), 81224 (+86), 80024 (+81) |
| Kidney / nephrology | 60 | 459 | 0.11 | 0.84 | 176 of 517 | 80603 (-43), 81133 (-41), 80530 (-40) | 81155 (+89), 80024 (+77), 81141 (+62) |
| Diabetes & hormones | 60 | 267.2 | 0.06 | 0.84 | 180 of 517 | 80640 (-63), 80234 (-57), 80241 (-56) | 81081 (+92), 80024 (+82), 81091 (+64) |
| Cancer care / oncology | 90 | 887.6 | 0.15 | 0.76 | 253 of 517 | 80603 (-81), 80601 (-78), 80137 (-69) | 81025 (+80), 80024 (+79), 80819 (+72) |
| Arthritis / rheumatology | 60 | 191 | 0.04 | 0.87 | 172 of 517 | 80603 (-72), 80640 (-63), 80118 (-58) | 80474 (+96), 80481 (+91), 80466 (+88) |
| Brain & nerves / neurology | 60 | 1,859 | 0.22 | 0.84 | 171 of 517 | 80603 (-87), 80601 (-85), 80930 (-84) | 81131 (+100), 80481 (+94), 80466 (+84) |
| Ear, nose & throat | 60 | 367.2 | 0.07 | 0.80 | 198 of 517 | 81248 (-67), 80640 (-64), 80603 (-58) | 80430 (+100), 81243 (+100), 81223 (+92) |
| Urology | 60 | 348.4 | 0.07 | 0.80 | 168 of 517 | 80759 (-100), 80735 (-80), 81059 (-44) | 80430 (+100), 80726 (+100), 81091 (+100) |
| Foot & ankle / podiatry | 60 | 560.8 | 0.15 | 0.72 | 144 of 517 | 81433 (-67), 80517 (-45), 81248 (-38) | 81235 (+100), 81243 (+71), 81022 (+58) |
| Pain management | 60 | 432.8 | 0.09 | 0.79 | 180 of 517 | 80817 (-51), 80504 (-46), 80514 (-46) | 80430 (+100), 81642 (+100), 80426 (+99) |
| Plastic & reconstructive surgery | 90 | 334.2 | 0.07 | 0.80 | 230 of 517 | 80603 (-61), 81149 (-61), 80601 (-59) | 80426 (+100), 81642 (+100), 80474 (+80) |
| Speech & language therapy | 30 | 5,199.8 | 0.90 | 0.75 | 241 of 517 | 80731 (-58), 80746 (-55), 81415 (-50) | 80455 (+86), 80726 (+79), 80812 (+72) |
| Nutrition & dietitian | 30 | 2,040.4 | 0.33 | 0.72 | 227 of 517 | 81428 (-62), 81089 (-52), 81332 (-51) | 80434 (+100), 81155 (+100), 81610 (+98) |
| Acupuncture, massage & naturopathy | 30 | 5,394.8 | 0.52 | 0.69 | 207 of 517 | 80835 (-62), 80545 (-59), 80832 (-48) | 80423 (+100), 80426 (+100), 80428 (+100) |
| Urgent care & emergency | 30 | 3,080.2 | 0.47 | 0.52 | 269 of 517 | 81643 (-86), 80864 (-84), 80517 (-61) | 80428 (+100), 80430 (+100), 80825 (+100) |
| Imaging & lab | 60 | 2,597.2 | 0.49 | 0.78 | 186 of 517 | 80603 (-47), 80234 (-44), 80640 (-43) | 80536 (+78), 80439 (+77), 81155 (+72) |
| Pharmacy | 30 | 7,184.6 | 1.72 | 0.54 | 219 of 517 | 81036 (-56), 80443 (-51), 80746 (-41) | 81045 (+74), 81331 (+69), 80726 (+64) |
| Home health & in-home care | 30 | 4,470.4 | 1.61 | 0.58 | 103 of 517 | 80821 (-63), 81624 (-57), 80612 (-55) | 80726 (+100), 80736 (+98), 80862 (+95) |
| Nursing & assisted living | 60 | 2,099.2 | 0.39 | 0.79 | 181 of 517 | 80832 (-70), 81071 (-66), 80542 (-49) | 80812 (+100), 81081 (+95), 80822 (+88) |
| Medical equipment & supplies | 60 | 1,639.4 | 0.36 | 0.73 | 186 of 517 | 81248 (-61), 81071 (-43), 81435 (-41) | 81243 (+100), 81429 (+97), 81241 (+79) |
| Hearing & audiology | 60 | 1,346.2 | 0.19 | 0.74 | 229 of 517 | 81071 (-100), 80834 (-85), 80735 (-77) | 80545 (+100), 80449 (+98), 80860 (+91) |
| Behavior therapy (ABA) | 30 | 16,201.4 | 2.88 | 0.83 | 107 of 517 | 80439 (-32), 80211 (-31), 80204 (-30) | 80860 (+100), 80863 (+93), 80106 (+83) |
| Care coordination & community health | 30 | 8,840.8 | 1.63 | 0.59 | 192 of 517 | 80443 (-49), 81077 (-45), 81050 (-39) | 80622 (+100), 80745 (+100), 80754 (+100) |
| General surgery | 60 | 2,417.2 | 0.35 | 0.79 | 207 of 517 | 81631 (-67), 80603 (-59), 80759 (-59) | 80430 (+95), 81155 (+88), 81642 (+79) |
| Infectious disease | 90 | 240.8 | 0.05 | 0.79 | 185 of 517 | 80603 (-73), 80601 (-71), 80640 (-65) | 80024 (+80), 80831 (+68), 81330 (+62) |
| Genetics & genetic counseling | 90 | 189.2 | 0.03 | 0.78 | 200 of 517 | 80640 (-83), 80234 (-77), 80137 (-74) | 80024 (+77), 80463 (+66), 80426 (+62) |
| Hospice & palliative care | 60 | 407.8 | 0.09 | 0.74 | 221 of 517 | 80733 (-67), 80834 (-60), 80735 (-48) | 81155 (+91), 81091 (+89), 80449 (+87) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Colorado in households with no vehicle: about 226,834 of 4,509,854 (5.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 2 of 517 | 80024 (+47), 80202 (+15), 80203 (+12) | 1.00 |
| Pediatrics (children) | 1.00 | 1 of 517 | 80024 (+73), 80290 (+8), 80204 (+6) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 517 | 80024 (+71), 80218 (+12), 80202 (+11) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 517 | 80024 (+60), 80010 (+6), 80230 (+6) | 1.00 |
| Dental | 1.00 | 2 of 517 | 80024 (+54), 80202 (+15), 80203 (+13) | 1.00 |
| Eye care | 1.00 | 1 of 517 | 80024 (+43), 80202 (+14), 80203 (+12) | 1.00 |
| Chiropractic | 1.00 | 3 of 517 | 80024 (+39), 80202 (+16), 81043 (+16) | 1.00 |
| Physical & occupational therapy | 1.00 | 2 of 517 | 80024 (+43), 80202 (+15), 80203 (+12) | 1.00 |
| Orthopedics & sports injury | 0.99 | 1 of 517 | 80024 (+47), 80202 (+12), 80203 (+10) | 1.00 |
| Heart / cardiology | 0.99 | 2 of 517 | 80024 (+47), 80721 (+17), 80202 (+11) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 517 | 80024 (+54), 80202 (+14), 80203 (+12) | 1.00 |
| Allergy & immunology | 1.00 | 2 of 517 | 80024 (+64), 80202 (+17), 80203 (+12) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 517 | 80024 (+52), 80202 (+12), 80203 (+8) | 1.00 |
| Digestive / gastroenterology | 1.00 | 1 of 517 | 80024 (+54), 80202 (+13), 80203 (+11) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 517 | 80024 (+46), 80202 (+9), 80218 (+9) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 517 | 80024 (+51), 80202 (+13), 80203 (+10) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 517 | 80024 (+62), 80202 (+14), 80721 (+12) | 1.00 |
| Arthritis / rheumatology | 1.00 | 2 of 517 | 80024 (+63), 80202 (+16), 80203 (+11) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 517 | 80024 (+68), 81043 (+6), 81647 (+6) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 517 | 80024 (+55), 80202 (+14), 80203 (+12) | 1.00 |
| Urology | 1.00 | 1 of 517 | 80024 (+43), 80202 (+10), 80203 (+9) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 1 of 517 | 80024 (+33), 80202 (+9), 80203 (+7) | 1.00 |
| Pain management | 0.99 | 1 of 517 | 80024 (+45), 80202 (+12), 80203 (+11) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 517 | 80024 (+48), 81642 (+19), 80202 (+12) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 517 | 80024 (+51), 80202 (+17), 80203 (+13) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 517 | 80024 (+52), 80218 (+10), 80202 (+9) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 517 | 80024 (+71), 80010 (+7), 80230 (+6) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 517 | 80024 (+65), 80721 (+11), 81647 (+8) | 1.00 |
| Imaging & lab | 1.00 | 1 of 517 | 80024 (+52), 80202 (+13), 80203 (+11) | 1.00 |
| Pharmacy | 1.00 | 1 of 517 | 80024 (+36), 80202 (+10), 80218 (+9) | 1.00 |
| Home health & in-home care | 1.00 | 1 of 517 | 80024 (+18), 81087 (+13), 80202 (+7) | 1.00 |
| Nursing & assisted living | 0.99 | 1 of 517 | 80024 (+47), 80202 (+12), 80203 (+10) | 1.00 |
| Medical equipment & supplies | 0.99 | 1 of 517 | 80024 (+39), 80202 (+10), 80203 (+8) | 1.00 |
| Hearing & audiology | 0.99 | 2 of 517 | 80024 (+60), 80202 (+16), 80203 (+14) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 517 | 80024 (+31), 80202 (+12), 80203 (+10) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 517 | 80024 (+40), 80202 (+13), 80203 (+11) | 1.00 |
| General surgery | 0.99 | 1 of 517 | 80024 (+68), 80202 (+14), 80218 (+14) | 1.00 |
| Infectious disease | 0.99 | 1 of 517 | 80024 (+57), 80202 (+12), 80218 (+10) | 1.00 |
| Genetics & genetic counseling | 1.00 | 2 of 517 | 80024 (+68), 80202 (+15), 80203 (+13) | 1.00 |
| Hospice & palliative care | 0.99 | 1 of 517 | 80024 (+42), 80202 (+10), 80203 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 52 of 517 | 78,431 (1.7%) | 0/26 | 33/192 | 8/64 | 8/93 | 3/142 |
| Women's health / OB-GYN | 016 | 10 of 517 | 10,937 (0.2%) | 0/26 | 6/192 | 2/64 | 2/93 | 0/142 |
| Mental health & counseling: Psychiatry | 029 | 32 of 517 | 25,566 (0.6%) | 0/26 | 10/192 | 5/64 | 9/93 | 8/142 |
| Mental health & counseling: Clinical Psychology | 036 | 17 of 517 | 6,298 (0.1%) | 0/26 | 8/192 | 2/64 | 5/93 | 2/142 |
| Mental health & counseling: Clinical Social Work | 037 | 18 of 517 | 9,780 (0.2%) | 0/26 | 14/192 | 3/64 | 1/93 | 0/142 |
| Eye care | 023 | 32 of 517 | 18,315 (0.4%) | 0/26 | 17/192 | 7/64 | 5/93 | 3/142 |
| Chiropractic | 010 | 9 of 517 | 5,880 (0.1%) | 0/26 | 7/192 | 2/64 | 0/93 | 0/142 |
| Physical & occupational therapy | F049 | 9 of 517 | 2,787 (0.1%) | 0/26 | 5/192 | 2/64 | 2/93 | 0/142 |
| Orthopedics & sports injury | 025 | 31 of 517 | 19,542 (0.4%) | 0/26 | 18/192 | 6/64 | 4/93 | 3/142 |
| Heart / cardiology | 008 | 40 of 517 | 49,221 (1.1%) | 0/26 | 28/192 | 7/64 | 4/93 | 1/142 |
| Skin / dermatology | 011 | 53 of 517 | 32,489 (0.7%) | 0/26 | 15/192 | 5/64 | 16/93 | 17/142 |
| Allergy & immunology | 007 | 88 of 517 | 89,751 (2.0%) | 0/26 | 19/192 | 2/64 | 19/93 | 48/142 |
| Lung, breathing & sleep | 030 | 78 of 517 | 79,420 (1.8%) | 0/26 | 13/192 | 8/64 | 27/93 | 30/142 |
| Digestive / gastroenterology | 014 | 90 of 517 | 72,302 (1.6%) | 0/26 | 15/192 | 8/64 | 17/93 | 50/142 |
| Kidney / nephrology | 018 | 46 of 517 | 85,441 (1.9%) | 0/26 | 16/192 | 3/64 | 18/93 | 9/142 |
| Diabetes & hormones | 012 | 73 of 517 | 83,808 (1.9%) | 0/26 | 10/192 | 4/64 | 19/93 | 40/142 |
| Cancer care / oncology | 021 | 57 of 517 | 46,916 (1.0%) | 0/26 | 15/192 | 7/64 | 19/93 | 16/142 |
| Arthritis / rheumatology | 031 | 93 of 517 | 95,350 (2.1%) | 0/26 | 13/192 | 4/64 | 21/93 | 55/142 |
| Brain & nerves / neurology | 019 | 48 of 517 | 36,268 (0.8%) | 0/26 | 14/192 | 4/64 | 18/93 | 12/142 |
| Ear, nose & throat | 013 | 70 of 517 | 50,721 (1.1%) | 0/26 | 18/192 | 2/64 | 14/93 | 36/142 |
| Urology | 033 | 78 of 517 | 86,320 (1.9%) | 0/26 | 18/192 | 5/64 | 24/93 | 31/142 |
| Foot & ankle / podiatry | 028 | 73 of 517 | 56,211 (1.2%) | 0/26 | 13/192 | 5/64 | 13/93 | 42/142 |
| Plastic & reconstructive surgery | 027 | 27 of 517 | 13,066 (0.3%) | 0/26 | 10/192 | 1/64 | 6/93 | 10/142 |
| Speech & language therapy | F051 | 13 of 517 | 6,502 (0.1%) | 0/26 | 6/192 | 2/64 | 5/93 | 0/142 |
| Imaging & lab | F047 | 22 of 517 | 9,589 (0.2%) | 0/26 | 11/192 | 2/64 | 6/93 | 3/142 |
| Nursing & assisted living | F046 | 23 of 517 | 19,500 (0.4%) | 0/26 | 9/192 | 2/64 | 8/93 | 4/142 |
| General surgery | 015 | 33 of 517 | 24,076 (0.5%) | 0/26 | 17/192 | 7/64 | 5/93 | 4/142 |
| Infectious disease | 017 | 53 of 517 | 45,803 (1.0%) | 0/26 | 12/192 | 1/64 | 9/93 | 31/142 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 20680 rows (ZIP x specialty) stored in access_e2sfca for CO; market-score now uses drive-time access for these ZIPs.
