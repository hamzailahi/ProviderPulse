# E2SFCA access dry run: Boston

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 192; in Boston: 55
- Drive times: OSRM on OpenStreetMap roads (car profile), 192 x 192 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 150,874.804; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.92 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.31), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | yes | 9.20 | 100% | 4.27 | 100% | yes (0.51) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 18,654.004 | 4.30 | 0.39 | 18 of 55 | 02188 (-27), 02180 (-26), 02190 (-10) | 02163 (+54), 02113 (+29), 02136 (+26) |
| Pediatrics (children) | 30 | 8,145.6 | 1.11 | 0.83 | 3 of 55 | 02188 (-45), 02190 (-15), 02180 (-12) | 02163 (+27), 02184 (+10), 02108 (+0) |
| Women's health / OB-GYN | 60 | 2,569.8 | 0.53 | -0.08 | 27 of 55 | 02190 (-25), 02188 (-22), 02180 (-19) | 02163 (+56), 02113 (+42), 02114 (+40) |
| Mental health & counseling | 30 | 44,533 | 7.20 | 0.16 | 8 of 55 | 02188 (-20), 02190 (-8), 02180 (-2) | 02163 (+42), 02113 (+24), 02114 (+22) |
| Dental | 30 | 9,056.6 | 1.65 | 0.28 | 9 of 55 | 02188 (-32), 02190 (-15), 02189 (-7) | 02163 (+51), 02113 (+26), 02114 (+23) |
| Eye care | 30 | 2,464.8 | 0.62 | 0.27 | 18 of 55 | 02133 (-27), 02155 (-19), 02188 (-19) | 02163 (+44), 02136 (+27), 02126 (+24) |
| Chiropractic | 30 | 1,493.8 | 0.63 | 0.50 | 4 of 55 | 02133 (-25), 02155 (-18), 02180 (-16) | 02163 (+16), 02115 (+9), 02113 (+8) |
| Physical & occupational therapy | 30 | 11,617.6 | 2.70 | 0.36 | 12 of 55 | 02133 (-43), 02180 (-35), 02155 (-29) | 02163 (+33), 02126 (+14), 02113 (+13) |
| Orthopedics & sports injury | 60 | 1,559 | 0.39 | 0.16 | 30 of 55 | 02188 (-36), 02180 (-26), 02184 (-26) | 02163 (+50), 02136 (+32), 02113 (+30) |
| Heart / cardiology | 60 | 1,267.8 | 0.24 | 0.20 | 12 of 55 | 02188 (-65), 02190 (-56), 02189 (-55) | 02163 (+49), 02113 (+28), 02109 (+22) |
| Skin / dermatology | 60 | 640.8 | 0.09 | -0.12 | 5 of 55 | 02188 (-59), 02189 (-48), 02190 (-45) | 02163 (+41), 02113 (+13), 02114 (+9) |
| Allergy & immunology | 60 | 186.4 | 0.03 | 0.20 | 10 of 55 | 02188 (-65), 02189 (-51), 02190 (-49) | 02163 (+50), 02113 (+20), 02114 (+16) |
| Lung, breathing & sleep | 60 | 534 | 0.13 | 0.08 | 51 of 55 | 02188 (-43), 02189 (-35), 02190 (-33) | 02163 (+62), 02113 (+45), 02114 (+41) |
| Digestive / gastroenterology | 60 | 611.6 | 0.11 | 0.32 | 10 of 55 | 02188 (-63), 02190 (-50), 02189 (-46) | 02163 (+45), 02113 (+25), 02114 (+19) |
| Kidney / nephrology | 60 | 374.8 | 0.11 | 0.16 | 51 of 55 | 02188 (-31), 02189 (-30), 02190 (-25) | 02163 (+67), 02134 (+49), 02113 (+42) |
| Diabetes & hormones | 60 | 454.2 | 0.06 | -0.04 | 5 of 55 | 02189 (-70), 02188 (-68), 02190 (-59) | 02163 (+28), 02108 (+0), 02109 (+0) |
| Cancer care / oncology | 90 | 1,107 | 0.15 | -0.04 | 5 of 55 | 02188 (-74), 02189 (-71), 02190 (-66) | 02163 (+4), 02108 (+0), 02109 (+0) |
| Arthritis / rheumatology | 60 | 230.2 | 0.04 | 0.07 | 7 of 55 | 02189 (-78), 02188 (-74), 02190 (-65) | 02163 (+38), 02113 (+16), 02109 (+9) |
| Brain & nerves / neurology | 60 | 1,442.2 | 0.22 | -0.08 | 6 of 55 | 02188 (-73), 02189 (-73), 02190 (-65) | 02163 (+38), 02113 (+5), 02134 (+1) |
| Ear, nose & throat | 60 | 350.8 | 0.07 | 0.30 | 15 of 55 | 02188 (-59), 02189 (-52), 02190 (-44) | 02163 (+53), 02134 (+24), 02113 (+22) |
| Urology | 60 | 305.2 | 0.07 | 0.04 | 47 of 55 | 02188 (-46), 02189 (-42), 02190 (-41) | 02163 (+63), 02113 (+40), 02134 (+40) |
| Foot & ankle / podiatry | 60 | 442.2 | 0.15 | 0.50 | 7 of 55 | 02133 (-32), 02155 (-18), 02129 (-17) | 02163 (+17), 02114 (+11), 02115 (+11) |
| Pain management | 60 | 201.8 | 0.09 | 0.30 | 7 of 55 | 02180 (-19), 02188 (-19), 02133 (-18) | 02163 (+30), 02135 (+15), 02113 (+14) |
| Plastic & reconstructive surgery | 90 | 280.6 | 0.07 | 0.00 | 53 of 55 | 02188 (-47), 02189 (-40), 02184 (-39) | 02163 (+57), 02113 (+45), 02114 (+43) |
| Speech & language therapy | 30 | 2,947.6 | 0.90 | 0.29 | 9 of 55 | 02133 (-38), 02180 (-30), 02188 (-20) | 02163 (+26), 02113 (+11), 02126 (+10) |
| Nutrition & dietitian | 30 | 1,961.6 | 0.33 | 0.49 | 5 of 55 | 02188 (-31), 02190 (-13), 02189 (-7) | 02163 (+42), 02113 (+21), 02114 (+17) |
| Acupuncture, massage & naturopathy | 30 | 1,734.2 | 0.52 | 0.35 | 16 of 55 | 02133 (-36), 02155 (-21), 02180 (-19) | 02163 (+33), 02115 (+25), 02113 (+21) |
| Urgent care & emergency | 30 | 1,628.6 | 0.47 | 0.11 | 23 of 55 | 02188 (-25), 02180 (-20), 02133 (-15) | 02163 (+54), 02136 (+37), 02113 (+30) |
| Imaging & lab | 60 | 2,428.6 | 0.49 | 0.12 | 27 of 55 | 02188 (-53), 02189 (-45), 02190 (-43) | 02163 (+54), 02113 (+31), 02134 (+27) |
| Pharmacy | 30 | 5,232.8 | 1.72 | 0.01 | 7 of 55 | 02133 (-32), 02155 (-18), 02180 (-17) | 02163 (+31), 02113 (+20), 02114 (+18) |
| Home health & in-home care | 30 | 2,424.8 | 1.61 | 0.69 | 1 of 55 | 02133 (-15), 02155 (-12), 02180 (-12) | 02163 (+9), 02115 (+4), 02184 (+4) |
| Nursing & assisted living | 60 | 813 | 0.39 | 0.26 | 10 of 55 | 02133 (-28), 02155 (-21), 02180 (-19) | 02163 (+8), 02190 (+6), 02115 (+4) |
| Medical equipment & supplies | 60 | 624.2 | 0.36 | 0.44 | 4 of 55 | 02133 (-25), 02129 (-16), 02155 (-16) | 02163 (+7), 02190 (+7), 02189 (+5) |
| Hearing & audiology | 60 | 632.2 | 0.19 | 0.19 | 19 of 55 | 02189 (-30), 02188 (-26), 02133 (-23) | 02163 (+42), 02134 (+24), 02136 (+23) |
| Behavior therapy (ABA) | 30 | 7,599.8 | 2.88 | 0.42 | 11 of 55 | 02133 (-34), 02180 (-24), 02155 (-19) | 02163 (+18), 02115 (+9), 02126 (+8) |
| Care coordination & community health | 30 | 5,908.6 | 1.63 | 0.04 | 16 of 55 | 02133 (-32), 02155 (-24), 02180 (-23) | 02163 (+40), 02184 (+26), 02191 (+25) |
| General surgery | 60 | 1,339.6 | 0.35 | 0.16 | 52 of 55 | 02188 (-44), 02189 (-38), 02190 (-36) | 02163 (+63), 02113 (+47), 02109 (+43) |
| Infectious disease | 90 | 380.4 | 0.05 | -0.04 | 3 of 55 | 02190 (-94), 02188 (-90), 02189 (-88) | 02163 (+6), 02108 (+0), 02109 (+0) |
| Genetics & genetic counseling | 90 | 321.8 | 0.03 | n/a | 4 of 55 | 02189 (-94), 02188 (-91), 02190 (-90) | 02108 (+0), 02109 (+0), 02110 (+0) |
| Hospice & palliative care | 60 | 166 | 0.09 | 0.06 | 11 of 55 | 02188 (-13), 02189 (-12), 02191 (-11) | 02163 (+29), 02132 (+20), 02134 (+20) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Boston in households with no vehicle: about 311,929 of 1,214,964 (25.7%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 0
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.40 | 12 of 55 | 02163 (+54), 02113 (+29), 02114 (+25) | 0.72 |
| Pediatrics (children) | 0.91 | 1 of 55 | 02163 (+27) | 0.91 |
| Women's health / OB-GYN | -0.34 | 19 of 55 | 02163 (+54), 02113 (+42), 02114 (+40) | 0.87 |
| Mental health & counseling | 0.48 | 4 of 55 | 02163 (+42), 02113 (+24), 02114 (+22) | 0.72 |
| Dental | 0.43 | 5 of 55 | 02163 (+51), 02113 (+26), 02114 (+23) | 0.69 |
| Eye care | 0.26 | 16 of 55 | 02163 (+51), 02115 (+44), 02215 (+39) | 0.91 |
| Chiropractic | 0.21 | 9 of 55 | 02115 (+23), 02114 (+22), 02163 (+21) | 0.99 |
| Physical & occupational therapy | 0.25 | 17 of 55 | 02163 (+44), 02114 (+40), 02115 (+40) | 0.96 |
| Orthopedics & sports injury | -0.21 | 18 of 55 | 02163 (+44), 02113 (+36), 02114 (+36) | 0.91 |
| Heart / cardiology | 0.12 | 7 of 55 | 02163 (+49), 02113 (+28), 02109 (+22) | 0.48 |
| Skin / dermatology | -0.09 | 1 of 55 | 02163 (+41), 02113 (+13), 02114 (+9) | 0.25 |
| Allergy & immunology | 0.26 | 4 of 55 | 02163 (+50), 02113 (+20), 02114 (+16) | 0.42 |
| Lung, breathing & sleep | -0.16 | 16 of 55 | 02163 (+46), 02113 (+31), 02114 (+29) | 0.76 |
| Digestive / gastroenterology | 0.24 | 5 of 55 | 02163 (+45), 02113 (+25), 02114 (+19) | 0.50 |
| Kidney / nephrology | -0.22 | 11 of 55 | 02163 (+39), 02113 (+25), 02114 (+24) | 0.80 |
| Diabetes & hormones | n/a | 1 of 55 | 02163 (+28) | n/a |
| Cancer care / oncology | n/a | 0 of 55 | 02163 (+4) | n/a |
| Arthritis / rheumatology | 0.10 | 2 of 55 | 02163 (+38), 02113 (+16), 02109 (+9) | 0.14 |
| Brain & nerves / neurology | -0.03 | 1 of 55 | 02163 (+38), 02113 (+5), 02134 (+1) | -0.03 |
| Ear, nose & throat | 0.17 | 10 of 55 | 02163 (+53), 02134 (+24), 02113 (+22) | 0.65 |
| Urology | -0.23 | 17 of 55 | 02163 (+49), 02113 (+33), 02114 (+33) | 0.88 |
| Foot & ankle / podiatry | -0.28 | 15 of 55 | 02163 (+34), 02114 (+32), 02115 (+31) | 0.96 |
| Pain management | -0.14 | 10 of 55 | 02163 (+28), 02113 (+22), 02114 (+22) | 0.93 |
| Plastic & reconstructive surgery | -0.52 | 13 of 55 | 02163 (+32), 02113 (+26), 02114 (+25) | 0.78 |
| Speech & language therapy | 0.09 | 15 of 55 | 02163 (+36), 02115 (+32), 02114 (+30) | 0.97 |
| Nutrition & dietitian | 0.62 | 3 of 55 | 02163 (+42), 02113 (+21), 02114 (+17) | 0.75 |
| Acupuncture, massage & naturopathy | 0.36 | 16 of 55 | 02163 (+42), 02115 (+40), 02114 (+36) | 0.97 |
| Urgent care & emergency | 0.26 | 16 of 55 | 02163 (+50), 02114 (+39), 02113 (+36) | 0.74 |
| Imaging & lab | -0.10 | 19 of 55 | 02163 (+54), 02113 (+31), 02134 (+27) | 0.74 |
| Pharmacy | -0.03 | 15 of 55 | 02163 (+34), 02114 (+32), 02115 (+31) | 0.95 |
| Home health & in-home care | 0.43 | 0 of 55 | 02114 (+14), 02115 (+14), 02163 (+13) | 0.99 |
| Nursing & assisted living | -0.39 | 11 of 55 | 02115 (+24), 02163 (+24), 02114 (+23) | 0.98 |
| Medical equipment & supplies | -0.39 | 7 of 55 | 02163 (+20), 02114 (+19), 02115 (+19) | 0.98 |
| Hearing & audiology | -0.30 | 15 of 55 | 02163 (+40), 02115 (+30), 02114 (+28) | 0.92 |
| Behavior therapy (ABA) | 0.34 | 10 of 55 | 02115 (+24), 02163 (+24), 02215 (+22) | 0.99 |
| Care coordination & community health | 0.03 | 15 of 55 | 02114 (+45), 02115 (+45), 02163 (+43) | 0.94 |
| General surgery | -0.08 | 13 of 55 | 02163 (+43), 02113 (+28), 02109 (+25) | 0.76 |
| Infectious disease | n/a | 0 of 55 | 02163 (+6) | n/a |
| Genetics & genetic counseling | n/a | 0 of 55 |  | n/a |
| Hospice & palliative care | -0.36 | 4 of 55 | 02163 (+21), 02113 (+15), 02114 (+15) | 0.85 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Public transit pilot

The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving 2026-12-02T10:00:00, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.

- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): 16 (Brockton Area Transit Authority (BAT); Montachusett Regional Transit Authority (MART); Bay State Cruise Company; Massachusetts Bay Transportation Authority (MBTA); MetroWest Regional Transit Authority (MWRTA); Massport; Middlesex 3 TMA; Yankee Line; Merrimack Valley Regional Transit Authority (MVRTA); Cape Ann Transportation Authority (CATA); Plymouth & Brockton Street Railway Co; Rhode Island Public Transit Authority; Amtrak Vermonter; Blue Apple Bus Company; Boston Express; Brockton Area Transit Authority)
- ZIP pairs reachable by transit within 120 minutes: 8,908; focus ZIPs that reach at least one other ZIP by transit: 55 of 55

| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 0 of 55 | 02111 (-8), 02139 (-6), 02116 (-2) | 0.43 |
| Pediatrics (children) | 1.00 | 0 of 55 |  | 0.91 |
| Women's health / OB-GYN | 0.98 | 0 of 55 | 02111 (-10), 02113 (-10), 02109 (-7) | -0.21 |
| Mental health & counseling | 0.97 | 0 of 55 | 02111 (-3), 02142 (-3), 02114 (-2) | 0.47 |
| Dental | 0.95 | 0 of 55 | 02120 (-5), 02111 (-4), 02139 (-4) | 0.48 |
| Eye care | 1.00 | 0 of 55 | 02139 (-6), 02128 (-2), 02134 (-2) | 0.29 |
| Chiropractic | 1.00 | 0 of 55 | 02120 (-1), 02134 (-1), 02139 (-1) | 0.22 |
| Physical & occupational therapy | 1.00 | 0 of 55 | 02111 (-3), 02120 (-2), 02139 (-2) | 0.28 |
| Orthopedics & sports injury | 0.98 | 0 of 55 | 02113 (-7), 02111 (-6), 02109 (-5) | -0.10 |
| Heart / cardiology | 0.88 | 1 of 55 | 02113 (-15), 02163 (-13), 02109 (-12) | 0.33 |
| Skin / dermatology | 0.78 | 0 of 55 | 02163 (-13), 02113 (-10), 02114 (-5) | -0.07 |
| Allergy & immunology | 0.84 | 0 of 55 | 02163 (-13), 02113 (-11), 02109 (-9) | 0.49 |
| Lung, breathing & sleep | 0.93 | 0 of 55 | 02113 (-11), 02163 (-9), 02109 (-8) | 0.06 |
| Digestive / gastroenterology | 0.86 | 1 of 55 | 02113 (-15), 02163 (-12), 02109 (-11) | 0.44 |
| Kidney / nephrology | 0.94 | 0 of 55 | 02163 (-8), 02113 (-7), 02128 (-6) | -0.02 |
| Diabetes & hormones | 1.00 | 1 of 55 | 02163 (-20) | n/a |
| Cancer care / oncology | n/a | 0 of 55 | 02163 (-4) | n/a |
| Arthritis / rheumatology | 0.34 | 1 of 55 | 02113 (-16), 02163 (-13), 02109 (-9) | 0.73 |
| Brain & nerves / neurology | 0.59 | 1 of 55 | 02163 (-18), 02113 (-5), 02134 (-1) | -0.02 |
| Ear, nose & throat | 0.93 | 1 of 55 | 02163 (-16), 02128 (-10), 02139 (-9) | 0.36 |
| Urology | 0.97 | 0 of 55 | 02163 (-9), 02111 (-6), 02113 (-6) | -0.13 |
| Foot & ankle / podiatry | 0.99 | 0 of 55 | 02111 (-5), 02114 (-4), 02108 (-3) | -0.22 |
| Pain management | 0.99 | 0 of 55 | 02111 (-3), 02113 (-3), 02163 (-3) | -0.07 |
| Plastic & reconstructive surgery | 0.95 | 0 of 55 | 02113 (-7), 02111 (-6), 02128 (-6) | -0.41 |
| Speech & language therapy | 1.00 | 0 of 55 | 02111 (-2), 02116 (-1), 02120 (-1) | 0.10 |
| Nutrition & dietitian | 0.97 | 0 of 55 | 02111 (-5), 02142 (-3), 02114 (-2) | 0.65 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 55 | 02120 (-2), 02139 (-2), 02142 (-2) | 0.39 |
| Urgent care & emergency | 0.99 | 0 of 55 | 02111 (-6), 02139 (-5), 02116 (-3) | 0.33 |
| Imaging & lab | 0.93 | 0 of 55 | 02163 (-12), 02113 (-11), 02109 (-9) | 0.11 |
| Pharmacy | 1.00 | 0 of 55 | 02111 (-3), 02120 (-2), 02142 (-2) | -0.01 |
| Home health & in-home care | 1.00 | 0 of 55 | 02110 (-1), 02119 (-1), 02134 (-1) | 0.43 |
| Nursing & assisted living | 1.00 | 0 of 55 | 02111 (-4), 02108 (-2), 02109 (-2) | -0.36 |
| Medical equipment & supplies | 0.99 | 0 of 55 | 02111 (-2), 02115 (-2), 02139 (-2) | -0.36 |
| Hearing & audiology | 0.98 | 0 of 55 | 02163 (-6), 02111 (-4), 02113 (-4) | -0.23 |
| Behavior therapy (ABA) | 1.00 | 0 of 55 | 02110 (-1), 02111 (-1), 02120 (-1) | 0.34 |
| Care coordination & community health | 1.00 | 0 of 55 | 02111 (-3), 02114 (-2), 02142 (-2) | 0.04 |
| General surgery | 0.93 | 0 of 55 | 02113 (-9), 02163 (-9), 02109 (-7) | 0.12 |
| Infectious disease | n/a | 0 of 55 | 02163 (-6) | n/a |
| Genetics & genetic counseling | n/a | 0 of 55 |  | n/a |
| Hospice & palliative care | 0.97 | 0 of 55 | 02113 (-3), 02163 (-3), 02109 (-2) | -0.24 |

A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 02118 | Primary care / family doctor | 8.744 | 8.988 | 0 | 0 |
| 02118 | Mental health & counseling | 16.862 | 17.315 | 0 | 0 |
| 02118 | Heart / cardiology | 0.739 | 0.498 | 0 | 0 |
| 02118 | Cancer care / oncology | 0.743 | 0.396 | 0 | 0 |
| 02118 | Urgent care & emergency | 0.784 | 0.820 | 16 | 12 |
| 02121 | Primary care / family doctor | 9.420 | 7.314 | 0 | 15 |
| 02121 | Mental health & counseling | 17.980 | 14.788 | 0 | 0 |
| 02121 | Heart / cardiology | 0.801 | 0.402 | 0 | 15 |
| 02121 | Cancer care / oncology | 0.806 | 0.340 | 0 | 0 |
| 02121 | Urgent care & emergency | 0.848 | 0.666 | 9 | 29 |
| 02139 | Primary care / family doctor | 8.886 | 7.470 | 0 | 13 |
| 02139 | Mental health & counseling | 16.659 | 15.499 | 0 | 0 |
| 02139 | Heart / cardiology | 0.767 | 0.444 | 0 | 7 |
| 02139 | Cancer care / oncology | 0.767 | 0.379 | 0 | 0 |
| 02139 | Urgent care & emergency | 0.808 | 0.651 | 14 | 30 |
| 02151 | Primary care / family doctor | 8.689 | 7.526 | 0 | 13 |
| 02151 | Mental health & counseling | 16.404 | 15.654 | 0 | 0 |
| 02151 | Heart / cardiology | 0.740 | 0.454 | 0 | 5 |
| 02151 | Cancer care / oncology | 0.744 | 0.348 | 0 | 0 |
| 02151 | Urgent care & emergency | 0.789 | 0.672 | 16 | 28 |
| 02169 | Primary care / family doctor | 10.478 | 7.518 | 0 | 13 |
| 02169 | Mental health & counseling | 17.028 | 16.939 | 0 | 0 |
| 02169 | Heart / cardiology | 0.937 | 0.457 | 0 | 4 |
| 02169 | Cancer care / oncology | 0.966 | 0.362 | 0 | 0 |
| 02169 | Urgent care & emergency | 0.990 | 0.736 | 0 | 21 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Eye care | 023 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Chiropractic | 010 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Physical & occupational therapy | F049 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Heart / cardiology | 008 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Skin / dermatology | 011 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Allergy & immunology | 007 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Kidney / nephrology | 018 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Diabetes & hormones | 012 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Cancer care / oncology | 021 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Ear, nose & throat | 013 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Urology | 033 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Speech & language therapy | F051 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Imaging & lab | F047 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Nursing & assisted living | F046 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| General surgery | 015 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |
| Infectious disease | 017 | 0 of 55 | 0 (0.0%) | 0/55 |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
