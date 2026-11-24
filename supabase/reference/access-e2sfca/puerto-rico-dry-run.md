# E2SFCA access dry run: Puerto Rico

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 131; in Puerto Rico: 131
- Drive times: OSRM on OpenStreetMap roads (car profile), 131 x 131 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 53,368.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.17 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.92), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 8,814.2 | 4.30 | 0.59 | 23 of 131 | 00969 (-22), 00920 (-18), 00927 (-18) | 00606 (+47), 00622 (+42), 00677 (+31) |
| Pediatrics (children) | 30 | 1,796.8 | 1.11 | 0.78 | 22 of 131 | 00969 (-24), 00920 (-18), 00927 (-17) | 00606 (+30), 00765 (+26), 00913 (+25) |
| Women's health / OB-GYN | 60 | 690.6 | 0.53 | 0.69 | 10 of 131 | 00729 (-18), 00745 (-15), 00656 (-14) | 00775 (+31), 00913 (+25), 00901 (+22) |
| Mental health & counseling | 30 | 8,756.8 | 7.20 | 0.75 | 6 of 131 | 00775 (-16), 00969 (-16), 00920 (-13) | 00622 (+19), 00606 (+16), 00677 (+16) |
| Dental | 30 | 2,359 | 1.65 | 0.75 | 11 of 131 | 00775 (-32), 00969 (-18), 00920 (-15) | 00606 (+27), 00622 (+24), 00901 (+20) |
| Eye care | 30 | 1,768 | 0.62 | 0.71 | 46 of 131 | 00969 (-34), 00927 (-29), 00966 (-29) | 00775 (+68), 00606 (+60), 00622 (+56) |
| Chiropractic | 30 | 933.2 | 0.63 | 0.78 | 18 of 131 | 00775 (-51), 00969 (-22), 00920 (-18) | 00606 (+26), 00694 (+20), 00670 (+19) |
| Physical & occupational therapy | 30 | 2,065.4 | 2.70 | 0.80 | 0 of 131 | 00969 (-9), 00966 (-8), 00920 (-7) | 00606 (+10), 00611 (+10), 00765 (+10) |
| Orthopedics & sports injury | 60 | 247.8 | 0.39 | 0.73 | 2 of 131 | 00729 (-12), 00656 (-10), 00692 (-9) | 00913 (+17), 00901 (+15), 00906 (+13) |
| Heart / cardiology | 60 | 548 | 0.24 | 0.68 | 55 of 131 | 00656 (-33), 00601 (-30), 00729 (-29) | 00913 (+47), 00775 (+39), 00901 (+39) |
| Skin / dermatology | 60 | 160.6 | 0.09 | 0.75 | 58 of 131 | 00729 (-33), 00656 (-28), 00778 (-28) | 00913 (+52), 00901 (+41), 00949 (+38) |
| Allergy & immunology | 60 | 36.8 | 0.03 | 0.74 | 21 of 131 | 00601 (-21), 00692 (-21), 00729 (-21) | 00913 (+29), 00901 (+26), 00915 (+24) |
| Lung, breathing & sleep | 60 | 277.4 | 0.13 | 0.73 | 60 of 131 | 00729 (-35), 00692 (-29), 00656 (-27) | 00913 (+51), 00901 (+45), 00906 (+41) |
| Digestive / gastroenterology | 60 | 343 | 0.11 | 0.70 | 74 of 131 | 00729 (-56), 00725 (-54), 00778 (-53) | 00765 (+52), 00650 (+47), 00622 (+46) |
| Kidney / nephrology | 60 | 254.4 | 0.11 | 0.55 | 54 of 131 | 00656 (-40), 00601 (-32), 00653 (-29) | 00775 (+66), 00606 (+57), 00622 (+44) |
| Diabetes & hormones | 60 | 207 | 0.06 | 0.71 | 66 of 131 | 00729 (-56), 00778 (-48), 00725 (-45) | 00765 (+78), 00622 (+50), 00606 (+46) |
| Cancer care / oncology | 90 | 329.8 | 0.15 | 0.46 | 83 of 131 | 00729 (-38), 00778 (-36), 00783 (-34) | 00775 (+71), 00765 (+50), 00913 (+50) |
| Arthritis / rheumatology | 60 | 105.4 | 0.04 | 0.79 | 61 of 131 | 00729 (-46), 00778 (-41), 00725 (-40) | 00775 (+63), 00606 (+61), 00913 (+46) |
| Brain & nerves / neurology | 60 | 314.8 | 0.22 | 0.79 | 32 of 131 | 00729 (-27), 00692 (-22), 00745 (-22) | 00913 (+42), 00901 (+34), 00906 (+32) |
| Ear, nose & throat | 60 | 101.2 | 0.07 | 0.65 | 67 of 131 | 00729 (-33), 00778 (-29), 00692 (-28) | 00913 (+48), 00901 (+42), 00906 (+37) |
| Urology | 60 | 182.8 | 0.07 | 0.68 | 76 of 131 | 00656 (-53), 00729 (-45), 00601 (-40) | 00775 (+64), 00913 (+54), 00622 (+53) |
| Foot & ankle / podiatry | 60 | 87.6 | 0.15 | 0.75 | 3 of 131 | 00656 (-9), 00729 (-9), 00745 (-9) | 00775 (+24), 00901 (+15), 00913 (+15) |
| Pain management | 60 | 102.8 | 0.09 | 0.75 | 19 of 131 | 00729 (-26), 00745 (-19), 00692 (-18) | 00913 (+29), 00901 (+24), 00775 (+22) |
| Plastic & reconstructive surgery | 90 | 86.8 | 0.07 | 0.58 | 93 of 131 | 00782 (-26), 00794 (-26), 00612 (-25) | 00913 (+46), 00949 (+43), 00901 (+39) |
| Speech & language therapy | 30 | 1,829.2 | 0.90 | 0.72 | 27 of 131 | 00969 (-25), 00920 (-20), 00927 (-20) | 00694 (+33), 00606 (+27), 00611 (+26) |
| Nutrition & dietitian | 30 | 765.8 | 0.33 | 0.81 | 34 of 131 | 00969 (-35), 00927 (-29), 00920 (-27) | 00765 (+49), 00775 (+35), 00913 (+35) |
| Acupuncture, massage & naturopathy | 30 | 310 | 0.52 | 0.82 | 0 of 131 | 00969 (-11), 00927 (-9), 00920 (-8) | 00677 (+13), 00775 (+13), 00606 (+10) |
| Urgent care & emergency | 30 | 1,581.2 | 0.47 | 0.81 | 16 of 131 | 00951 (-63), 00725 (-58), 00775 (-58) | 00987 (+38), 00765 (+25), 00985 (+23) |
| Imaging & lab | 60 | 2,630.2 | 0.49 | 0.59 | 37 of 131 | 00778 (-38), 00727 (-37), 00725 (-36) | 00622 (+49), 00638 (+46), 00631 (+42) |
| Pharmacy | 30 | 6,902 | 1.72 | 0.59 | 44 of 131 | 00725 (-22), 00612 (-21), 00685 (-21) | 00765 (+61), 00606 (+53), 00694 (+50) |
| Home health & in-home care | 30 | 418.2 | 1.61 | 0.64 | 0 of 131 | 00927 (-3), 00969 (-3), 00612 (-2) | 00606 (+7), 00622 (+6), 00775 (+6) |
| Nursing & assisted living | 60 | 107 | 0.39 | 0.38 | 0 of 131 | 00778 (-5), 00725 (-4), 00727 (-4) | 00775 (+12), 00765 (+11), 00606 (+5) |
| Medical equipment & supplies | 60 | 804 | 0.36 | 0.75 | 17 of 131 | 00729 (-19), 00656 (-15), 00692 (-14) | 00775 (+45), 00606 (+38), 00622 (+36) |
| Hearing & audiology | 60 | 214.6 | 0.19 | 0.65 | 12 of 131 | 00692 (-15), 00729 (-15), 00777 (-12) | 00913 (+26), 00775 (+25), 00901 (+21) |
| Behavior therapy (ABA) | 30 | 155.4 | 2.88 | 0.85 | 0 of 131 | 00603 (-2), 00690 (-2), 00610 (-1) | 00646 (+1), 00677 (+1), 00678 (+1) |
| Care coordination & community health | 30 | 826.6 | 1.63 | 0.75 | 1 of 131 | 00775 (-18), 00969 (-6), 00920 (-5) | 00765 (+11), 00631 (+8), 00650 (+8) |
| General surgery | 60 | 338.6 | 0.35 | 0.71 | 17 of 131 | 00656 (-19), 00601 (-17), 00698 (-16) | 00913 (+20), 00624 (+19), 00622 (+17) |
| Infectious disease | 90 | 129.2 | 0.05 | 0.56 | 96 of 131 | 00612 (-51), 00794 (-40), 00782 (-38) | 00913 (+63), 00901 (+57), 00906 (+53) |
| Genetics & genetic counseling | 90 | 25.2 | 0.03 | 0.61 | 4 of 131 | 00782 (-14), 00646 (-12), 00729 (-12) | 00775 (+34), 00688 (+19), 00641 (+16) |
| Hospice & palliative care | 60 | 93.2 | 0.09 | 0.70 | 5 of 131 | 00685 (-12), 00729 (-11), 00669 (-10) | 00622 (+27), 00694 (+17), 00606 (+16) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Puerto Rico in households with no vehicle: about 344,964 of 2,710,671 (12.7%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 1
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.97 | 3 of 131 | 00913 (+20), 00925 (+19), 00786 (+15) | 1.00 |
| Pediatrics (children) | 0.99 | 3 of 131 | 00913 (+23), 00925 (+21), 00906 (+15) | 1.00 |
| Women's health / OB-GYN | 0.97 | 0 of 131 | 00913 (+13), 00906 (+10), 00925 (+10) | 0.99 |
| Mental health & counseling | 0.98 | 0 of 131 | 00913 (+14), 00925 (+13), 00786 (+9) | 1.00 |
| Dental | 0.99 | 2 of 131 | 00913 (+19), 00925 (+17), 00906 (+12) | 1.00 |
| Eye care | 0.98 | 6 of 131 | 00913 (+33), 00925 (+30), 00906 (+20) | 1.00 |
| Chiropractic | 0.99 | 2 of 131 | 00913 (+19), 00925 (+17), 00906 (+11) | 1.00 |
| Physical & occupational therapy | 0.98 | 0 of 131 | 00913 (+9), 00925 (+9), 00906 (+6) | 1.00 |
| Orthopedics & sports injury | 0.98 | 0 of 131 | 00913 (+7), 00906 (+5), 00925 (+5) | 0.99 |
| Heart / cardiology | 0.96 | 4 of 131 | 00913 (+24), 00925 (+19), 00786 (+17) | 0.99 |
| Skin / dermatology | 0.97 | 2 of 131 | 00913 (+21), 00906 (+15), 00925 (+14) | 0.99 |
| Allergy & immunology | 0.97 | 0 of 131 | 00913 (+13), 00906 (+10), 00925 (+9) | 0.99 |
| Lung, breathing & sleep | 0.97 | 3 of 131 | 00913 (+24), 00925 (+18), 00906 (+17) | 0.99 |
| Digestive / gastroenterology | 0.98 | 6 of 131 | 00913 (+34), 00925 (+26), 00906 (+25) | 0.99 |
| Kidney / nephrology | 0.93 | 4 of 131 | 00913 (+21), 00786 (+17), 00925 (+17) | 0.99 |
| Diabetes & hormones | 0.97 | 7 of 131 | 00913 (+35), 00925 (+28), 00906 (+26) | 0.99 |
| Cancer care / oncology | 0.94 | 2 of 131 | 00786 (+25), 00913 (+15), 00906 (+13) | 0.98 |
| Arthritis / rheumatology | 0.97 | 6 of 131 | 00913 (+34), 00906 (+25), 00925 (+23) | 0.99 |
| Brain & nerves / neurology | 0.97 | 1 of 131 | 00913 (+18), 00906 (+13), 00925 (+13) | 0.99 |
| Ear, nose & throat | 0.98 | 1 of 131 | 00913 (+16), 00906 (+12), 00925 (+12) | 0.99 |
| Urology | 0.95 | 5 of 131 | 00913 (+25), 00925 (+19), 00786 (+18) | 0.98 |
| Foot & ankle / podiatry | 0.97 | 0 of 131 | 00913 (+7), 00786 (+5), 00901 (+5) | 0.99 |
| Pain management | 0.97 | 1 of 131 | 00913 (+15), 00786 (+11), 00906 (+10) | 0.99 |
| Plastic & reconstructive surgery | 0.94 | 1 of 131 | 00786 (+15), 00913 (+9), 00906 (+7) | 0.97 |
| Speech & language therapy | 0.98 | 2 of 131 | 00913 (+19), 00925 (+18), 00786 (+12) | 1.00 |
| Nutrition & dietitian | 0.98 | 6 of 131 | 00913 (+32), 00925 (+30), 00786 (+24) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 0 of 131 | 00913 (+8), 00925 (+8), 00906 (+5) | 1.00 |
| Urgent care & emergency | 0.99 | 0 of 131 | 00786 (+13), 00913 (+13), 00730 (+4) | 1.00 |
| Imaging & lab | 0.93 | 4 of 131 | 00786 (+36), 00913 (+30), 00901 (+20) | 0.97 |
| Pharmacy | 0.96 | 6 of 131 | 00913 (+39), 00786 (+25), 00906 (+24) | 1.00 |
| Home health & in-home care | 0.97 | 0 of 131 | 00913 (+3), 00786 (+2), 00906 (+2) | 0.99 |
| Nursing & assisted living | 0.93 | 0 of 131 | 00786 (+2), 00901 (+2), 00906 (+2) | 0.97 |
| Medical equipment & supplies | 0.95 | 4 of 131 | 00913 (+22), 00925 (+17), 00906 (+16) | 0.99 |
| Hearing & audiology | 0.96 | 0 of 131 | 00913 (+13), 00786 (+10), 00906 (+9) | 0.99 |
| Behavior therapy (ABA) | 0.98 | 0 of 131 | 00901 (+1), 00906 (+1), 00913 (+1) | 0.99 |
| Care coordination & community health | 0.98 | 0 of 131 | 00913 (+5), 00925 (+5), 00786 (+4) | 1.00 |
| General surgery | 0.96 | 0 of 131 | 00913 (+9), 00786 (+7), 00925 (+7) | 0.99 |
| Infectious disease | 0.93 | 4 of 131 | 00786 (+28), 00913 (+22), 00906 (+17) | 0.97 |
| Genetics & genetic counseling | 0.95 | 0 of 131 | 00786 (+7), 00913 (+5), 00901 (+4) | 0.99 |
| Hospice & palliative care | 0.96 | 0 of 131 | 00913 (+11), 00925 (+8), 00906 (+7) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Eye care | 023 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Chiropractic | 010 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Physical & occupational therapy | F049 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Heart / cardiology | 008 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Skin / dermatology | 011 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Allergy & immunology | 007 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Kidney / nephrology | 018 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Diabetes & hormones | 012 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Cancer care / oncology | 021 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Ear, nose & throat | 013 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Urology | 033 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Speech & language therapy | F051 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Imaging & lab | F047 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Nursing & assisted living | F046 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| General surgery | 015 | 0 of 0 | 0 (n/a) |  |  |  |  |  |
| Infectious disease | 017 | 0 of 0 | 0 (n/a) |  |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 5240 rows (ZIP x specialty) stored in access_e2sfca for PR; market-score now uses drive-time access for these ZIPs.
