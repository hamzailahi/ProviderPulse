# E2SFCA access dry run: New Jersey

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,468; in New Jersey: 595
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,468 x 2,468 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,046,874.398; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.10 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.76), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 10; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (21627, 21669, 22469, 22488, 22529)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | yes | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 08045 | yes | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 10044 | no | 12.91 | 100% | 5.46 | 100% | yes (0.70) |
| 11101 | no | 8.52 | 100% | 4.81 | 100% | yes (0.47) |
| 17517 | no | 9.34 | 100% | 2.36 | 100% | yes (1.07) |
| 21627 | no | 9.58 | 100% | 9.58 | 100% | no |
| 21669 | no | 13.40 | 100% | 13.40 | 100% | no |
| 22469 | no | 3.07 | 17% | 3.07 | 17% | no |
| 22488 | no | 3.07 | 17% | 3.07 | 17% | no |
| 22529 | no | 2.88 | 17% | 2.88 | 17% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 129,215 | 4.30 | 0.70 | 150 of 595 | 07632 (-45), 07666 (-44), 07605 (-42) | 08086 (+55), 08544 (+52), 07931 (+41) |
| Pediatrics (children) | 30 | 41,178 | 1.11 | 0.82 | 177 of 595 | 07072 (-47), 07070 (-46), 07604 (-46) | 08067 (+79), 08069 (+66), 08212 (+58) |
| Women's health / OB-GYN | 60 | 17,484 | 0.53 | 0.48 | 304 of 595 | 07073 (-52), 07070 (-50), 07075 (-49) | 08544 (+84), 08525 (+63), 07723 (+57) |
| Mental health & counseling | 30 | 229,369.8 | 7.20 | 0.60 | 208 of 595 | 07070 (-54), 08077 (-54), 07666 (-53) | 08640 (+84), 08073 (+64), 07931 (+54) |
| Dental | 30 | 47,449.6 | 1.65 | 0.62 | 185 of 595 | 07632 (-56), 07605 (-54), 07024 (-51) | 08544 (+53), 07931 (+50), 07976 (+46) |
| Eye care | 30 | 18,899.2 | 0.62 | 0.49 | 203 of 595 | 07632 (-58), 07605 (-57), 07643 (-51) | 08544 (+55), 07931 (+48), 07976 (+47) |
| Chiropractic | 30 | 15,586.8 | 0.63 | 0.63 | 224 of 595 | 07605 (-70), 07024 (-64), 07666 (-57) | 07465 (+56), 08752 (+56), 07456 (+54) |
| Physical & occupational therapy | 30 | 95,408 | 2.70 | 0.59 | 239 of 595 | 07632 (-60), 07605 (-56), 07024 (-51) | 07931 (+74), 07979 (+63), 07456 (+48) |
| Orthopedics & sports injury | 60 | 11,485.4 | 0.39 | 0.17 | 291 of 595 | 07605 (-56), 07632 (-53), 07823 (-49) | 07732 (+69), 07760 (+62), 07750 (+59) |
| Heart / cardiology | 60 | 9,699.4 | 0.24 | 0.47 | 343 of 595 | 08020 (-55), 08022 (-54), 08071 (-54) | 08212 (+78), 08544 (+66), 08019 (+65) |
| Skin / dermatology | 60 | 3,383 | 0.09 | 0.44 | 379 of 595 | 07031 (-70), 07109 (-69), 07032 (-68) | 07732 (+71), 07931 (+67), 08212 (+66) |
| Allergy & immunology | 60 | 1,243.8 | 0.03 | 0.44 | 377 of 595 | 08027 (-68), 08046 (-68), 08061 (-68) | 08544 (+97), 08349 (+83), 08329 (+82) |
| Lung, breathing & sleep | 60 | 3,949.8 | 0.13 | 0.43 | 319 of 595 | 07031 (-56), 07014 (-53), 07070 (-50) | 08212 (+63), 08243 (+60), 08544 (+60) |
| Digestive / gastroenterology | 60 | 4,753.2 | 0.11 | 0.47 | 344 of 595 | 08020 (-68), 08061 (-65), 08056 (-60) | 08544 (+85), 08212 (+76), 08825 (+69) |
| Kidney / nephrology | 60 | 3,524.2 | 0.11 | 0.46 | 349 of 595 | 08071 (-54), 08230 (-53), 07071 (-52) | 08323 (+82), 08038 (+66), 08544 (+64) |
| Diabetes & hormones | 60 | 2,548 | 0.06 | 0.56 | 352 of 595 | 08041 (-67), 07032 (-63), 07029 (-60) | 08544 (+92), 07970 (+61), 07876 (+60) |
| Cancer care / oncology | 90 | 5,807.2 | 0.15 | 0.35 | 461 of 595 | 07436 (-65), 08641 (-65), 07077 (-64) | 08243 (+79), 08246 (+77), 08223 (+65) |
| Arthritis / rheumatology | 60 | 1,461.2 | 0.04 | 0.54 | 352 of 595 | 07031 (-68), 07032 (-67), 08016 (-65) | 08544 (+95), 08212 (+81), 08332 (+66) |
| Brain & nerves / neurology | 60 | 7,501.2 | 0.22 | 0.67 | 303 of 595 | 07031 (-62), 07032 (-61), 07109 (-58) | 08544 (+59), 07723 (+57), 07750 (+56) |
| Ear, nose & throat | 60 | 2,079 | 0.07 | 0.32 | 379 of 595 | 07031 (-66), 07632 (-65), 07073 (-62) | 08825 (+78), 08544 (+71), 08559 (+70) |
| Urology | 60 | 2,522 | 0.07 | 0.18 | 413 of 595 | 07031 (-67), 08061 (-65), 08020 (-64) | 08323 (+82), 08544 (+80), 08038 (+76) |
| Foot & ankle / podiatry | 60 | 7,575 | 0.15 | 0.41 | 214 of 595 | 08317 (-66), 08270 (-64), 08319 (-62) | 08544 (+82), 08320 (+79), 08073 (+72) |
| Pain management | 60 | 3,204.6 | 0.09 | 0.62 | 318 of 595 | 08514 (-57), 08533 (-55), 07632 (-51) | 08038 (+76), 08544 (+73), 08401 (+64) |
| Plastic & reconstructive surgery | 90 | 2,409.4 | 0.07 | 0.48 | 369 of 595 | 08041 (-69), 07008 (-68), 07064 (-68) | 08226 (+76), 08223 (+72), 08403 (+71) |
| Speech & language therapy | 30 | 33,896 | 0.90 | 0.69 | 203 of 595 | 07666 (-53), 07632 (-52), 07643 (-52) | 08088 (+60), 07734 (+58), 08055 (+57) |
| Nutrition & dietitian | 30 | 11,272.8 | 0.33 | 0.61 | 211 of 595 | 07632 (-62), 07014 (-57), 07070 (-55) | 08069 (+60), 08067 (+58), 08248 (+56) |
| Acupuncture, massage & naturopathy | 30 | 13,745 | 0.52 | 0.81 | 107 of 595 | 07632 (-68), 07605 (-61), 07024 (-60) | 07310 (+40), 07305 (+36), 07304 (+33) |
| Urgent care & emergency | 30 | 13,542 | 0.47 | 0.74 | 159 of 595 | 07603 (-46), 07070 (-44), 07072 (-44) | 08212 (+87), 08086 (+57), 08066 (+42) |
| Imaging & lab | 60 | 14,730.6 | 0.49 | 0.49 | 313 of 595 | 07031 (-57), 07014 (-55), 07070 (-52) | 08544 (+55), 07310 (+52), 07311 (+48) |
| Pharmacy | 30 | 55,498 | 1.72 | 0.60 | 186 of 595 | 07603 (-46), 07643 (-44), 07660 (-44) | 08544 (+51), 07931 (+44), 08073 (+39) |
| Home health & in-home care | 30 | 19,714.4 | 1.61 | 0.68 | 31 of 595 | 07605 (-18), 08108 (-18), 08107 (-17) | 08027 (+42), 08073 (+35), 08056 (+32) |
| Nursing & assisted living | 60 | 6,904 | 0.39 | 0.06 | 180 of 595 | 08063 (-38), 08030 (-36), 08109 (-36) | 08212 (+52), 08073 (+40), 08251 (+40) |
| Medical equipment & supplies | 60 | 10,028.4 | 0.36 | 0.30 | 250 of 595 | 07605 (-67), 07024 (-59), 07657 (-59) | 08853 (+59), 07931 (+58), 08887 (+58) |
| Hearing & audiology | 60 | 5,091.6 | 0.19 | 0.21 | 307 of 595 | 07605 (-58), 07632 (-53), 07643 (-49) | 08212 (+93), 08821 (+65), 08825 (+63) |
| Behavior therapy (ABA) | 30 | 32,421.6 | 2.88 | 0.67 | 29 of 595 | 07719 (-21), 07024 (-17), 07605 (-16) | 08738 (+32), 08055 (+29), 08759 (+27) |
| Care coordination & community health | 30 | 44,878.6 | 1.63 | 0.69 | 100 of 595 | 07607 (-51), 07072 (-49), 07604 (-49) | 08085 (+46), 08067 (+41), 08640 (+39) |
| General surgery | 60 | 11,623 | 0.35 | 0.41 | 347 of 595 | 07031 (-59), 07014 (-50), 07070 (-50) | 07732 (+68), 08551 (+66), 08544 (+65) |
| Infectious disease | 90 | 2,210.6 | 0.05 | 0.39 | 401 of 595 | 08022 (-95), 07420 (-90), 07456 (-90) | 08544 (+99), 08203 (+79), 08248 (+65) |
| Genetics & genetic counseling | 90 | 1,338.8 | 0.03 | 0.39 | 425 of 595 | 08011 (-100), 08039 (-100), 08098 (-100) | 08825 (+67), 07931 (+55), 07979 (+53) |
| Hospice & palliative care | 60 | 1,167.2 | 0.09 | 0.30 | 125 of 595 | 08217 (-34), 08317 (-32), 08061 (-30) | 08038 (+63), 08559 (+51), 08223 (+50) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in New Jersey in households with no vehicle: about 799,733 of 7,281,485 (11.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.94 | 56 of 595 | 08544 (+44), 08073 (+27), 07102 (+19) | 1.00 |
| Pediatrics (children) | 0.97 | 64 of 595 | 08544 (+42), 08073 (+28), 07102 (+21) | 1.00 |
| Women's health / OB-GYN | 0.93 | 154 of 595 | 08073 (+47), 08544 (+40), 07102 (+25) | 1.00 |
| Mental health & counseling | 0.94 | 58 of 595 | 08073 (+64), 08544 (+46), 07102 (+20) | 0.99 |
| Dental | 0.93 | 65 of 595 | 08544 (+49), 08073 (+30), 07102 (+23) | 1.00 |
| Eye care | 0.93 | 59 of 595 | 08544 (+48), 08073 (+30), 07102 (+22) | 1.00 |
| Chiropractic | 0.94 | 55 of 595 | 08544 (+34), 08073 (+30), 07505 (+26) | 1.00 |
| Physical & occupational therapy | 0.93 | 66 of 595 | 08073 (+50), 08544 (+44), 07102 (+24) | 1.00 |
| Orthopedics & sports injury | 0.82 | 128 of 595 | 08073 (+38), 08544 (+31), 07844 (+29) | 1.00 |
| Heart / cardiology | 0.93 | 142 of 595 | 08073 (+57), 08544 (+43), 07102 (+32) | 1.00 |
| Skin / dermatology | 0.95 | 146 of 595 | 08073 (+48), 08544 (+33), 07102 (+29) | 1.00 |
| Allergy & immunology | 0.94 | 148 of 595 | 08073 (+54), 08544 (+48), 07102 (+31) | 1.00 |
| Lung, breathing & sleep | 0.91 | 144 of 595 | 08073 (+43), 08544 (+36), 07102 (+24) | 1.00 |
| Digestive / gastroenterology | 0.93 | 126 of 595 | 08073 (+56), 08544 (+46), 07102 (+32) | 1.00 |
| Kidney / nephrology | 0.91 | 148 of 595 | 08073 (+47), 08544 (+35), 07102 (+24) | 1.00 |
| Diabetes & hormones | 0.93 | 123 of 595 | 08073 (+55), 08544 (+54), 07102 (+35) | 1.00 |
| Cancer care / oncology | 0.86 | 219 of 595 | 08544 (+60), 08073 (+57), 07102 (+31) | 0.99 |
| Arthritis / rheumatology | 0.94 | 162 of 595 | 08073 (+62), 08544 (+45), 07102 (+29) | 1.00 |
| Brain & nerves / neurology | 0.95 | 162 of 595 | 08073 (+46), 08544 (+36), 07102 (+28) | 1.00 |
| Ear, nose & throat | 0.92 | 143 of 595 | 08073 (+45), 08544 (+33), 07102 (+23) | 1.00 |
| Urology | 0.90 | 154 of 595 | 08073 (+47), 08544 (+40), 07102 (+26) | 1.00 |
| Foot & ankle / podiatry | 0.88 | 83 of 595 | 08073 (+67), 08544 (+66), 08608 (+27) | 0.99 |
| Pain management | 0.92 | 129 of 595 | 08544 (+51), 08073 (+44), 07102 (+35) | 1.00 |
| Plastic & reconstructive surgery | 0.93 | 203 of 595 | 08544 (+55), 08073 (+45), 07102 (+34) | 0.99 |
| Speech & language therapy | 0.96 | 48 of 595 | 08073 (+32), 08544 (+32), 08832 (+19) | 1.00 |
| Nutrition & dietitian | 0.92 | 66 of 595 | 08544 (+50), 08073 (+27), 07102 (+23) | 1.00 |
| Acupuncture, massage & naturopathy | 0.98 | 63 of 595 | 08544 (+28), 07102 (+15), 07505 (+15) | 1.00 |
| Urgent care & emergency | 0.96 | 60 of 595 | 08544 (+30), 08073 (+22), 07102 (+19) | 1.00 |
| Imaging & lab | 0.93 | 136 of 595 | 08073 (+42), 08544 (+31), 07102 (+22) | 1.00 |
| Pharmacy | 0.94 | 62 of 595 | 08544 (+42), 08073 (+31), 07102 (+22) | 1.00 |
| Home health & in-home care | 0.94 | 2 of 595 | 08073 (+23), 08544 (+16), 07102 (+11) | 1.00 |
| Nursing & assisted living | 0.85 | 4 of 595 | 08073 (+29), 08544 (+23), 08103 (+15) | 1.00 |
| Medical equipment & supplies | 0.87 | 123 of 595 | 08544 (+41), 08073 (+35), 07102 (+22) | 1.00 |
| Hearing & audiology | 0.84 | 93 of 595 | 08544 (+37), 08073 (+30), 07102 (+19) | 0.99 |
| Behavior therapy (ABA) | 0.94 | 1 of 595 | 08073 (+23), 08544 (+10), 07102 (+7) | 1.00 |
| Care coordination & community health | 0.97 | 50 of 595 | 08544 (+22), 08073 (+20), 07102 (+13) | 1.00 |
| General surgery | 0.90 | 150 of 595 | 08073 (+44), 08544 (+35), 07102 (+24) | 1.00 |
| Infectious disease | 0.85 | 174 of 595 | 08544 (+73), 08073 (+65), 07102 (+36) | 0.98 |
| Genetics & genetic counseling | 0.93 | 201 of 595 | 08073 (+69), 08544 (+65), 07102 (+26) | 0.99 |
| Hospice & palliative care | 0.89 | 2 of 595 | 08073 (+22), 08544 (+17), 08103 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 5 of 593 | 8,619 (0.1%) | 1/233 | 4/360 |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 2 of 593 | 1,631 (0.0%) | 0/233 | 2/360 |  |  |  |
| Eye care | 023 | 1 of 593 | 164 (0.0%) | 0/233 | 1/360 |  |  |  |
| Chiropractic | 010 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Physical & occupational therapy | F049 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Orthopedics & sports injury | 025 | 2 of 593 | 7,998 (0.1%) | 2/233 | 0/360 |  |  |  |
| Heart / cardiology | 008 | 2 of 593 | 5,819 (0.1%) | 1/233 | 1/360 |  |  |  |
| Skin / dermatology | 011 | 1 of 593 | 5,655 (0.1%) | 1/233 | 0/360 |  |  |  |
| Allergy & immunology | 007 | 2 of 593 | 489 (0.0%) | 0/233 | 2/360 |  |  |  |
| Lung, breathing & sleep | 030 | 1 of 593 | 5,655 (0.1%) | 1/233 | 0/360 |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Kidney / nephrology | 018 | 2 of 593 | 18,265 (0.3%) | 2/233 | 0/360 |  |  |  |
| Diabetes & hormones | 012 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Cancer care / oncology | 021 | 2 of 593 | 18,265 (0.3%) | 2/233 | 0/360 |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Brain & nerves / neurology | 019 | 2 of 593 | 18,265 (0.3%) | 2/233 | 0/360 |  |  |  |
| Ear, nose & throat | 013 | 1 of 593 | 292 (0.0%) | 0/233 | 1/360 |  |  |  |
| Urology | 033 | 2 of 593 | 18,265 (0.3%) | 2/233 | 0/360 |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Speech & language therapy | F051 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Imaging & lab | F047 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| Nursing & assisted living | F046 | 0 of 593 | 0 (0.0%) | 0/233 | 0/360 |  |  |  |
| General surgery | 015 | 3 of 593 | 5,355 (0.1%) | 0/233 | 3/360 |  |  |  |
| Infectious disease | 017 | 2 of 593 | 18,265 (0.3%) | 2/233 | 0/360 |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 23800 rows (ZIP x specialty) stored in access_e2sfca for NJ; market-score now uses drive-time access for these ZIPs.
