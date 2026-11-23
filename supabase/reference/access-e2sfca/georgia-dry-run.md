# E2SFCA access dry run: Georgia

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,017; in Georgia: 735
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,017 x 2,017 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 552,440.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.51 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.27), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 29915 | no | 17.87 | 100% | 5.16 | 100% | yes (1.79) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 83,874 | 4.30 | 0.58 | 260 of 735 | 31314 (-38), 30905 (-36), 31313 (-35) | 31020 (+73), 31641 (+72), 30730 (+69) |
| Pediatrics (children) | 30 | 17,287.8 | 1.11 | 0.77 | 144 of 735 | 31699 (-50), 30096 (-33), 30071 (-31) | 31020 (+55), 31032 (+52), 31046 (+51) |
| Women's health / OB-GYN | 60 | 9,575.8 | 0.53 | 0.73 | 276 of 735 | 31625 (-55), 31781 (-52), 31017 (-49) | 30543 (+63), 30554 (+63), 30427 (+58) |
| Mental health & counseling | 30 | 99,393.8 | 7.20 | 0.78 | 102 of 735 | 31699 (-58), 31314 (-26), 31313 (-24) | 31808 (+43), 31323 (+39), 31638 (+39) |
| Dental | 30 | 26,414 | 1.65 | 0.67 | 167 of 735 | 31699 (-55), 30905 (-43), 31313 (-33) | 30427 (+81), 31814 (+67), 31323 (+65) |
| Eye care | 30 | 10,505 | 0.62 | 0.64 | 253 of 735 | 31699 (-60), 30673 (-36), 31314 (-36) | 31327 (+56), 31527 (+54), 31020 (+52) |
| Chiropractic | 30 | 12,267 | 0.63 | 0.74 | 183 of 735 | 30537 (-53), 30665 (-33), 31634 (-33) | 30184 (+92), 30183 (+84), 30171 (+65) |
| Physical & occupational therapy | 30 | 46,631.8 | 2.70 | 0.71 | 159 of 735 | 31699 (-49), 31830 (-31), 30293 (-30) | 30750 (+48), 31323 (+48), 31641 (+45) |
| Orthopedics & sports injury | 60 | 7,746 | 0.39 | 0.65 | 295 of 735 | 31625 (-67), 31307 (-60), 31620 (-60) | 31821 (+94), 30572 (+86), 31630 (+73) |
| Heart / cardiology | 60 | 4,110.2 | 0.24 | 0.68 | 348 of 735 | 31407 (-59), 31017 (-52), 31307 (-49) | 30543 (+81), 30730 (+81), 30554 (+78) |
| Skin / dermatology | 60 | 1,443.8 | 0.09 | 0.76 | 243 of 735 | 31407 (-54), 31017 (-48), 30620 (-47) | 30605 (+61), 30667 (+59), 30621 (+58) |
| Allergy & immunology | 60 | 489.2 | 0.03 | 0.76 | 322 of 735 | 30549 (-61), 39870 (-61), 30620 (-57) | 31038 (+88), 30229 (+86), 39885 (+81) |
| Lung, breathing & sleep | 60 | 2,382.4 | 0.13 | 0.73 | 297 of 735 | 31003 (-100), 31017 (-100), 31044 (-90) | 30529 (+60), 31303 (+60), 30554 (+57) |
| Digestive / gastroenterology | 60 | 1,831.6 | 0.11 | 0.67 | 330 of 735 | 31017 (-68), 31625 (-64), 31003 (-60) | 30554 (+75), 30730 (+71), 30543 (+68) |
| Kidney / nephrology | 60 | 2,237.4 | 0.11 | 0.59 | 380 of 735 | 31017 (-100), 31042 (-100), 31003 (-95) | 39885 (+80), 30543 (+79), 30456 (+73) |
| Diabetes & hormones | 60 | 880 | 0.06 | 0.79 | 247 of 735 | 31407 (-60), 31326 (-53), 31307 (-51) | 30251 (+79), 30730 (+66), 30276 (+65) |
| Cancer care / oncology | 90 | 2,523.4 | 0.15 | 0.53 | 441 of 735 | 31407 (-53), 31548 (-52), 31307 (-47) | 30541 (+81), 30555 (+78), 30513 (+75) |
| Arthritis / rheumatology | 60 | 614.4 | 0.04 | 0.74 | 326 of 735 | 31407 (-59), 30548 (-52), 31326 (-51) | 30543 (+75), 30527 (+74), 30554 (+73) |
| Brain & nerves / neurology | 60 | 3,258.8 | 0.22 | 0.75 | 252 of 735 | 30336 (-49), 30058 (-41), 30122 (-40) | 30554 (+84), 30543 (+74), 30750 (+64) |
| Ear, nose & throat | 60 | 1,175 | 0.07 | 0.65 | 370 of 735 | 31017 (-52), 31625 (-51), 30448 (-50) | 39862 (+87), 30251 (+69), 30554 (+66) |
| Urology | 60 | 1,387.6 | 0.07 | 0.66 | 380 of 735 | 31017 (-78), 31003 (-72), 31781 (-66) | 30543 (+80), 39885 (+78), 30554 (+71) |
| Foot & ankle / podiatry | 60 | 2,150 | 0.15 | 0.63 | 226 of 735 | 31556 (-44), 31044 (-36), 31008 (-34) | 30543 (+60), 30554 (+59), 30828 (+57) |
| Pain management | 60 | 1,677.4 | 0.09 | 0.67 | 379 of 735 | 31017 (-72), 31556 (-67), 31003 (-63) | 30184 (+74), 31064 (+73), 30183 (+72) |
| Plastic & reconstructive surgery | 90 | 1,139.4 | 0.07 | 0.66 | 415 of 735 | 31320 (-58), 31321 (-58), 30446 (-56) | 30565 (+76), 30605 (+75), 30677 (+74) |
| Speech & language therapy | 30 | 15,247.4 | 0.90 | 0.69 | 191 of 735 | 30662 (-33), 31533 (-33), 30639 (-32) | 31641 (+84), 31635 (+80), 31811 (+80) |
| Nutrition & dietitian | 30 | 5,085 | 0.33 | 0.71 | 168 of 735 | 30905 (-52), 39837 (-51), 30731 (-40) | 30427 (+100), 31814 (+82), 31323 (+80) |
| Acupuncture, massage & naturopathy | 30 | 6,134.6 | 0.52 | 0.83 | 60 of 735 | 31816 (-28), 30401 (-19), 30581 (-18) | 30814 (+45), 30537 (+43), 31527 (+38) |
| Urgent care & emergency | 30 | 8,374 | 0.47 | 0.57 | 285 of 735 | 30830 (-72), 30905 (-60), 30757 (-46) | 30537 (+100), 31323 (+100), 31320 (+95) |
| Imaging & lab | 60 | 8,517 | 0.49 | 0.72 | 272 of 735 | 31017 (-48), 31003 (-44), 30336 (-43) | 30543 (+68), 30554 (+66), 39885 (+59) |
| Pharmacy | 30 | 34,579.6 | 1.72 | 0.54 | 256 of 735 | 31036 (-51), 31699 (-39), 31314 (-35) | 30454 (+90), 31096 (+71), 31009 (+69) |
| Home health & in-home care | 30 | 20,544.4 | 1.61 | 0.76 | 123 of 735 | 30678 (-71), 30665 (-70), 30288 (-26) | 39885 (+48), 31562 (+42), 31716 (+42) |
| Nursing & assisted living | 60 | 7,745 | 0.39 | 0.69 | 236 of 735 | 31643 (-41), 30457 (-39), 31698 (-39) | 31631 (+75), 30631 (+74), 31076 (+67) |
| Medical equipment & supplies | 60 | 8,138.6 | 0.36 | 0.67 | 355 of 735 | 31017 (-77), 31003 (-66), 31044 (-58) | 30631 (+66), 31631 (+63), 31071 (+61) |
| Hearing & audiology | 60 | 3,382.6 | 0.19 | 0.71 | 253 of 735 | 31407 (-60), 31017 (-53), 31625 (-45) | 30543 (+79), 30427 (+64), 30525 (+63) |
| Behavior therapy (ABA) | 30 | 37,227 | 2.88 | 0.83 | 114 of 735 | 30830 (-74), 31548 (-39), 31558 (-32) | 31811 (+99), 31323 (+85), 31829 (+69) |
| Care coordination & community health | 30 | 11,850.4 | 1.63 | 0.75 | 57 of 735 | 39840 (-45), 31807 (-44), 39886 (-38) | 31805 (+65), 31068 (+56), 30427 (+45) |
| General surgery | 60 | 6,490.4 | 0.35 | 0.68 | 318 of 735 | 31017 (-66), 31407 (-62), 31003 (-57) | 30543 (+76), 30597 (+73), 30527 (+72) |
| Infectious disease | 90 | 777.2 | 0.05 | 0.66 | 380 of 735 | 30039 (-77), 30058 (-72), 30012 (-71) | 30725 (+75), 30750 (+74), 31020 (+70) |
| Genetics & genetic counseling | 90 | 470 | 0.03 | 0.66 | 252 of 735 | 30122 (-63), 30273 (-61), 30039 (-60) | 30725 (+67), 30750 (+56), 30303 (+53) |
| Hospice & palliative care | 60 | 1,483.8 | 0.09 | 0.69 | 363 of 735 | 30562 (-61), 30525 (-58), 30568 (-54) | 31038 (+71), 31066 (+70), 30251 (+68) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Georgia in households with no vehicle: about 477,704 of 8,220,652 (5.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 17
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 4 of 735 | 30303 (+31), 39885 (+26), 31333 (+18) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 735 | 39885 (+31), 30303 (+25), 30314 (+15) | 1.00 |
| Women's health / OB-GYN | 0.99 | 4 of 735 | 39885 (+37), 30303 (+34), 31333 (+23) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 735 | 30303 (+27), 31333 (+13), 30573 (+12) | 1.00 |
| Dental | 1.00 | 3 of 735 | 30303 (+21), 31333 (+17), 39885 (+17) | 1.00 |
| Eye care | 1.00 | 3 of 735 | 39885 (+32), 30573 (+30), 30303 (+26) | 1.00 |
| Chiropractic | 1.00 | 1 of 735 | 30303 (+35), 30314 (+14), 30573 (+12) | 1.00 |
| Physical & occupational therapy | 1.00 | 2 of 735 | 30303 (+21), 30901 (+16), 31333 (+13) | 1.00 |
| Orthopedics & sports injury | 0.99 | 5 of 735 | 39885 (+29), 30303 (+26), 30573 (+22) | 1.00 |
| Heart / cardiology | 0.99 | 3 of 735 | 30303 (+29), 39885 (+25), 30314 (+15) | 1.00 |
| Skin / dermatology | 1.00 | 2 of 735 | 30303 (+26), 30901 (+15), 39885 (+14) | 1.00 |
| Allergy & immunology | 1.00 | 3 of 735 | 39885 (+52), 30303 (+28), 30901 (+20) | 1.00 |
| Lung, breathing & sleep | 1.00 | 3 of 735 | 30303 (+28), 31333 (+28), 39885 (+18) | 1.00 |
| Digestive / gastroenterology | 1.00 | 3 of 735 | 30303 (+30), 39885 (+21), 30314 (+16) | 1.00 |
| Kidney / nephrology | 0.99 | 6 of 735 | 39885 (+53), 30303 (+36), 30901 (+20) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 735 | 30303 (+26), 30314 (+14), 31415 (+14) | 1.00 |
| Cancer care / oncology | 0.99 | 2 of 735 | 30303 (+23), 39885 (+17), 30314 (+12) | 1.00 |
| Arthritis / rheumatology | 1.00 | 3 of 735 | 30303 (+29), 39885 (+17), 30314 (+15) | 1.00 |
| Brain & nerves / neurology | 1.00 | 3 of 735 | 30303 (+28), 39885 (+22), 30314 (+15) | 1.00 |
| Ear, nose & throat | 1.00 | 4 of 735 | 30303 (+29), 30314 (+16), 31415 (+16) | 1.00 |
| Urology | 0.99 | 4 of 735 | 39885 (+47), 30303 (+33), 30454 (+17) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 3 of 735 | 30303 (+24), 39885 (+23), 30901 (+16) | 1.00 |
| Pain management | 0.99 | 7 of 735 | 30303 (+37), 39885 (+35), 30901 (+24) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 1 of 735 | 30303 (+24), 30314 (+14), 31333 (+14) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 735 | 30303 (+22), 30901 (+11), 31333 (+11) | 1.00 |
| Nutrition & dietitian | 1.00 | 3 of 735 | 30303 (+30), 31333 (+21), 30314 (+15) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 2 of 735 | 30303 (+19), 30573 (+15), 31333 (+13) | 1.00 |
| Urgent care & emergency | 1.00 | 5 of 735 | 30573 (+26), 31333 (+20), 30303 (+19) | 1.00 |
| Imaging & lab | 0.99 | 4 of 735 | 30303 (+35), 39885 (+32), 31333 (+22) | 1.00 |
| Pharmacy | 0.99 | 5 of 735 | 39885 (+37), 30303 (+25), 30573 (+20) | 1.00 |
| Home health & in-home care | 1.00 | 2 of 735 | 39885 (+31), 30303 (+23), 30901 (+12) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 735 | 39885 (+34), 30901 (+20), 30303 (+19) | 1.00 |
| Medical equipment & supplies | 0.99 | 8 of 735 | 39885 (+44), 30303 (+27), 30314 (+19) | 1.00 |
| Hearing & audiology | 0.99 | 4 of 735 | 30303 (+24), 39885 (+20), 31333 (+17) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 4 of 735 | 31333 (+18), 30901 (+17), 30303 (+15) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 735 | 30303 (+12), 31333 (+12), 39885 (+12) | 1.00 |
| General surgery | 0.99 | 6 of 735 | 30303 (+35), 39885 (+28), 31333 (+22) | 1.00 |
| Infectious disease | 1.00 | 2 of 735 | 30303 (+27), 30314 (+16), 30079 (+14) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 735 | 30303 (+27), 30314 (+14), 30311 (+12) | 1.00 |
| Hospice & palliative care | 0.99 | 7 of 735 | 30303 (+32), 30901 (+25), 39885 (+25) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 15 of 733 | 132,477 (1.6%) | 3/99 | 12/230 | 0/196 | 0/200 | 0/8 |
| Women's health / OB-GYN | 016 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Mental health & counseling: Psychiatry | 029 | 5 of 733 | 5,361 (0.1%) | 0/99 | 1/230 | 2/196 | 2/200 | 0/8 |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Eye care | 023 | 1 of 733 | 1,235 (0.0%) | 0/99 | 1/230 | 0/196 | 0/200 | 0/8 |
| Chiropractic | 010 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Physical & occupational therapy | F049 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Orthopedics & sports injury | 025 | 1 of 733 | 1,235 (0.0%) | 0/99 | 1/230 | 0/196 | 0/200 | 0/8 |
| Heart / cardiology | 008 | 7 of 733 | 87,502 (1.1%) | 2/99 | 4/230 | 0/196 | 1/200 | 0/8 |
| Skin / dermatology | 011 | 31 of 733 | 271,166 (3.3%) | 3/99 | 8/230 | 10/196 | 10/200 | 0/8 |
| Allergy & immunology | 007 | 19 of 733 | 135,819 (1.7%) | 0/99 | 7/230 | 9/196 | 3/200 | 0/8 |
| Lung, breathing & sleep | 030 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Digestive / gastroenterology | 014 | 8 of 733 | 78,985 (1.0%) | 3/99 | 0/230 | 1/196 | 4/200 | 0/8 |
| Kidney / nephrology | 018 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Diabetes & hormones | 012 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Cancer care / oncology | 021 | 2 of 733 | 1,792 (0.0%) | 0/99 | 0/230 | 0/196 | 2/200 | 0/8 |
| Arthritis / rheumatology | 031 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Brain & nerves / neurology | 019 | 3 of 733 | 65,489 (0.8%) | 2/99 | 0/230 | 1/196 | 0/200 | 0/8 |
| Ear, nose & throat | 013 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Urology | 033 | 6 of 733 | 74,326 (0.9%) | 3/99 | 0/230 | 0/196 | 3/200 | 0/8 |
| Foot & ankle / podiatry | 028 | 3 of 733 | 2,569 (0.0%) | 0/99 | 0/230 | 0/196 | 3/200 | 0/8 |
| Plastic & reconstructive surgery | 027 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Speech & language therapy | F051 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Imaging & lab | F047 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| Nursing & assisted living | F046 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |
| General surgery | 015 | 3 of 733 | 8,899 (0.1%) | 0/99 | 3/230 | 0/196 | 0/200 | 0/8 |
| Infectious disease | 017 | 0 of 733 | 0 (0.0%) | 0/99 | 0/230 | 0/196 | 0/200 | 0/8 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 29400 rows (ZIP x specialty) stored in access_e2sfca for GA; market-score now uses drive-time access for these ZIPs.
