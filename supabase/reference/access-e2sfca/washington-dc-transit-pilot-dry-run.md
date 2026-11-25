# E2SFCA access dry run: Washington DC

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 201; in Washington DC: 47
- Drive times: OSRM on OpenStreetMap roads (car profile), 201 x 201 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 183,263.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.44 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.60), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 18,373.4 | 4.30 | 0.63 | 12 of 47 | 20390 (-39), 20059 (-25), 20319 (-18) | 20052 (+51), 20006 (+44), 20036 (+23) |
| Pediatrics (children) | 30 | 7,092.2 | 1.11 | 0.73 | 15 of 47 | 20120 (-19), 20001 (0), 20002 (0) | 20052 (+90), 20006 (+76), 20124 (+49) |
| Women's health / OB-GYN | 60 | 2,846.2 | 0.53 | 0.40 | 20 of 47 | 20390 (-32), 20373 (-21), 20319 (-20) | 20052 (+73), 20006 (+66), 20036 (+39) |
| Mental health & counseling | 30 | 33,055.2 | 7.20 | 0.65 | 17 of 47 | 20390 (-32), 20059 (-26), 20373 (-25) | 20052 (+67), 20006 (+59), 20036 (+34) |
| Dental | 30 | 8,666.6 | 1.65 | 0.42 | 19 of 47 | 20390 (-44), 20059 (-28), 20373 (-20) | 20052 (+57), 20006 (+50), 20036 (+26) |
| Eye care | 30 | 2,444.4 | 0.62 | 0.47 | 10 of 47 | 20390 (-34), 20059 (-24), 20422 (-15) | 20052 (+43), 20006 (+37), 20111 (+22) |
| Chiropractic | 30 | 1,688.4 | 0.63 | 0.62 | 7 of 47 | 20390 (-21), 20059 (-15), 20373 (-10) | 20110 (+27), 20052 (+23), 20006 (+20) |
| Physical & occupational therapy | 30 | 10,958.4 | 2.70 | 0.34 | 14 of 47 | 20390 (-36), 20059 (-24), 20064 (-18) | 20052 (+46), 20006 (+40), 20036 (+21) |
| Orthopedics & sports injury | 60 | 1,427.4 | 0.39 | 0.29 | 17 of 47 | 20390 (-28), 20319 (-20), 20373 (-18) | 20052 (+46), 20006 (+41), 20110 (+26) |
| Heart / cardiology | 60 | 1,106 | 0.24 | 0.55 | 27 of 47 | 20390 (-23), 20120 (-20), 20170 (-19) | 20052 (+73), 20006 (+67), 20036 (+46) |
| Skin / dermatology | 60 | 516 | 0.09 | 0.39 | 25 of 47 | 20390 (-45), 20319 (-32), 20373 (-27) | 20052 (+81), 20006 (+74), 20036 (+49) |
| Allergy & immunology | 60 | 265.8 | 0.03 | 0.36 | 15 of 47 | 20003 (-36), 20121 (-32), 20390 (-31) | 20052 (+83), 20006 (+72), 20147 (+38) |
| Lung, breathing & sleep | 60 | 517.6 | 0.13 | 0.53 | 16 of 47 | 20390 (-19), 20319 (-16), 20373 (-16) | 20052 (+54), 20006 (+49), 20036 (+32) |
| Digestive / gastroenterology | 60 | 552.2 | 0.11 | 0.46 | 23 of 47 | 20390 (-36), 20165 (-20), 20170 (-19) | 20052 (+68), 20006 (+61), 20009 (+34) |
| Kidney / nephrology | 60 | 507.4 | 0.11 | 0.62 | 25 of 47 | 20165 (-17), 20390 (-15), 20147 (-10) | 20052 (+72), 20006 (+65), 20036 (+40) |
| Diabetes & hormones | 60 | 348.2 | 0.06 | 0.54 | 24 of 47 | 20120 (-38), 20390 (-29), 20319 (-26) | 20052 (+67), 20006 (+60), 20009 (+37) |
| Cancer care / oncology | 90 | 696.4 | 0.15 | 0.27 | 38 of 47 | 20120 (-34), 20165 (-32), 20170 (-31) | 20052 (+60), 20006 (+56), 20009 (+51) |
| Arthritis / rheumatology | 60 | 213 | 0.04 | 0.50 | 29 of 47 | 20390 (-30), 20111 (-29), 20120 (-23) | 20052 (+76), 20006 (+69), 20036 (+39) |
| Brain & nerves / neurology | 60 | 943.4 | 0.22 | 0.49 | 25 of 47 | 20120 (-19), 20390 (-18), 20111 (-16) | 20052 (+74), 20006 (+69), 20036 (+46) |
| Ear, nose & throat | 60 | 284.4 | 0.07 | 0.37 | 19 of 47 | 20390 (-31), 20319 (-21), 20373 (-21) | 20052 (+54), 20006 (+48), 20036 (+32) |
| Urology | 60 | 293.2 | 0.07 | 0.31 | 19 of 47 | 20390 (-27), 20422 (-17), 20059 (-16) | 20052 (+56), 20006 (+51), 20036 (+31) |
| Foot & ankle / podiatry | 60 | 661 | 0.15 | 0.21 | 15 of 47 | 20390 (-39), 20059 (-35), 20373 (-31) | 20052 (+47), 20006 (+40), 20112 (+29) |
| Pain management | 60 | 381.4 | 0.09 | -0.01 | 23 of 47 | 20390 (-55), 20319 (-43), 20373 (-43) | 20110 (+40), 20052 (+37), 20166 (+37) |
| Plastic & reconstructive surgery | 90 | 322.4 | 0.07 | 0.19 | 32 of 47 | 20111 (-41), 20110 (-31), 20390 (-30) | 20052 (+74), 20006 (+69), 20036 (+48) |
| Speech & language therapy | 30 | 3,771.2 | 0.90 | 0.33 | 17 of 47 | 20390 (-33), 20059 (-28), 20064 (-20) | 20052 (+52), 20006 (+45), 20124 (+39) |
| Nutrition & dietitian | 30 | 1,454.6 | 0.33 | 0.55 | 19 of 47 | 20390 (-34), 20059 (-25), 20422 (-21) | 20052 (+70), 20006 (+62), 20036 (+36) |
| Acupuncture, massage & naturopathy | 30 | 2,088 | 0.52 | 0.57 | 7 of 47 | 20390 (-28), 20059 (-20), 20012 (-12) | 20052 (+45), 20006 (+39), 20110 (+21) |
| Urgent care & emergency | 30 | 1,612 | 0.47 | 0.66 | 14 of 47 | 20390 (-39), 20059 (-25), 20319 (-20) | 20052 (+52), 20006 (+46), 20036 (+24) |
| Imaging & lab | 60 | 1,868.8 | 0.49 | 0.53 | 10 of 47 | 20390 (-31), 20319 (-22), 20373 (-21) | 20052 (+45), 20006 (+40), 20036 (+21) |
| Pharmacy | 30 | 6,245.8 | 1.72 | 0.31 | 11 of 47 | 20390 (-34), 20059 (-22), 20373 (-17) | 20052 (+42), 20006 (+37), 20036 (+19) |
| Home health & in-home care | 30 | 28,932.8 | 1.61 | 0.88 | 3 of 47 | 20121 (-1), 20001 (0), 20002 (0) | 20052 (+87), 20006 (+36), 20112 (+16) |
| Nursing & assisted living | 60 | 1,545.4 | 0.39 | 0.66 | 25 of 47 | 20191 (-21), 20373 (-20), 20190 (-19) | 20052 (+65), 20006 (+58), 20036 (+47) |
| Medical equipment & supplies | 60 | 1,417.4 | 0.36 | 0.10 | 15 of 47 | 20390 (-39), 20059 (-35), 20373 (-31) | 20052 (+35), 20112 (+33), 20006 (+29) |
| Hearing & audiology | 60 | 765.6 | 0.19 | 0.46 | 15 of 47 | 20390 (-32), 20319 (-21), 20373 (-20) | 20052 (+51), 20006 (+46), 20036 (+27) |
| Behavior therapy (ABA) | 30 | 22,947.4 | 2.88 | 0.38 | 24 of 47 | 20011 (-62), 20008 (-61), 20016 (-61) | 20110 (+32), 20052 (+26), 20165 (+23) |
| Care coordination & community health | 30 | 10,032.4 | 1.63 | 0.86 | 3 of 47 | 20120 (-3), 20001 (0), 20002 (0) | 20052 (+96), 20006 (+79), 20036 (+28) |
| General surgery | 60 | 1,586.2 | 0.35 | 0.44 | 20 of 47 | 20390 (-28), 20319 (-19), 20373 (-18) | 20052 (+58), 20006 (+52), 20191 (+32) |
| Infectious disease | 90 | 344.6 | 0.05 | 0.03 | 33 of 47 | 20164 (-59), 20166 (-56), 20165 (-52) | 20052 (+77), 20006 (+71), 20036 (+48) |
| Genetics & genetic counseling | 90 | 189.6 | 0.03 | 0.08 | 35 of 47 | 20165 (-64), 20147 (-52), 20112 (-38) | 20052 (+80), 20006 (+75), 20036 (+56) |
| Hospice & palliative care | 60 | 157.2 | 0.09 | 0.16 | 3 of 47 | 20390 (-15), 20059 (-11), 20319 (-11) | 20052 (+20), 20006 (+17), 20191 (+14) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Washington DC in households with no vehicle: about 219,261 of 986,248 (22.2%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 6
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.43 | 16 of 47 | 20052 (+73), 20006 (+66), 20036 (+45) | 0.98 |
| Pediatrics (children) | 0.80 | 7 of 47 | 20052 (+90), 20006 (+76), 20036 (+36) | 0.93 |
| Women's health / OB-GYN | 0.17 | 16 of 47 | 20052 (+82), 20006 (+76), 20036 (+52) | 0.96 |
| Mental health & counseling | 0.48 | 20 of 47 | 20052 (+83), 20006 (+75), 20036 (+50) | 0.99 |
| Dental | 0.17 | 18 of 47 | 20052 (+78), 20006 (+71), 20036 (+48) | 0.99 |
| Eye care | 0.26 | 10 of 47 | 20052 (+61), 20006 (+55), 20036 (+36) | 0.99 |
| Chiropractic | 0.58 | 5 of 47 | 20052 (+36), 20006 (+33), 20036 (+22) | 0.99 |
| Physical & occupational therapy | 0.26 | 11 of 47 | 20052 (+63), 20006 (+58), 20036 (+39) | 0.98 |
| Orthopedics & sports injury | 0.00 | 12 of 47 | 20052 (+57), 20006 (+52), 20036 (+36) | 0.98 |
| Heart / cardiology | 0.27 | 15 of 47 | 20052 (+72), 20006 (+66), 20036 (+43) | 0.96 |
| Skin / dermatology | 0.07 | 16 of 47 | 20052 (+83), 20006 (+76), 20036 (+53) | 0.99 |
| Allergy & immunology | 0.30 | 8 of 47 | 20052 (+89), 20006 (+78), 20036 (+42) | 0.96 |
| Lung, breathing & sleep | 0.22 | 14 of 47 | 20052 (+62), 20006 (+57), 20036 (+39) | 0.97 |
| Digestive / gastroenterology | 0.15 | 16 of 47 | 20052 (+76), 20006 (+69), 20036 (+47) | 0.97 |
| Kidney / nephrology | 0.33 | 15 of 47 | 20052 (+73), 20006 (+66), 20036 (+45) | 0.97 |
| Diabetes & hormones | 0.20 | 17 of 47 | 20052 (+88), 20006 (+81), 20036 (+53) | 0.97 |
| Cancer care / oncology | -0.10 | 13 of 47 | 20052 (+51), 20006 (+47), 20036 (+32) | 0.92 |
| Arthritis / rheumatology | 0.17 | 17 of 47 | 20052 (+85), 20006 (+78), 20036 (+52) | 0.98 |
| Brain & nerves / neurology | 0.19 | 15 of 47 | 20052 (+66), 20006 (+61), 20036 (+40) | 0.96 |
| Ear, nose & throat | 0.11 | 15 of 47 | 20052 (+63), 20006 (+57), 20036 (+39) | 0.98 |
| Urology | 0.15 | 14 of 47 | 20052 (+62), 20006 (+57), 20036 (+38) | 0.97 |
| Foot & ankle / podiatry | 0.09 | 15 of 47 | 20052 (+71), 20006 (+64), 20036 (+46) | 0.99 |
| Pain management | 0.13 | 16 of 47 | 20052 (+70), 20006 (+64), 20036 (+46) | 0.99 |
| Plastic & reconstructive surgery | -0.24 | 15 of 47 | 20052 (+58), 20006 (+53), 20036 (+37) | 0.95 |
| Speech & language therapy | 0.39 | 13 of 47 | 20052 (+74), 20006 (+67), 20036 (+45) | 0.98 |
| Nutrition & dietitian | 0.38 | 20 of 47 | 20052 (+85), 20006 (+77), 20036 (+52) | 0.97 |
| Acupuncture, massage & naturopathy | 0.37 | 9 of 47 | 20052 (+62), 20006 (+56), 20036 (+36) | 0.99 |
| Urgent care & emergency | 0.51 | 18 of 47 | 20052 (+68), 20006 (+62), 20036 (+42) | 0.96 |
| Imaging & lab | 0.16 | 13 of 47 | 20052 (+58), 20006 (+54), 20036 (+36) | 0.97 |
| Pharmacy | 0.24 | 8 of 47 | 20052 (+56), 20006 (+52), 20036 (+35) | 0.99 |
| Home health & in-home care | 0.91 | 2 of 47 | 20052 (+87), 20006 (+36) | 0.91 |
| Nursing & assisted living | 0.55 | 14 of 47 | 20052 (+67), 20006 (+61), 20036 (+44) | 0.98 |
| Medical equipment & supplies | 0.18 | 14 of 47 | 20052 (+64), 20006 (+58), 20036 (+42) | 0.98 |
| Hearing & audiology | 0.15 | 13 of 47 | 20052 (+62), 20006 (+57), 20036 (+39) | 0.98 |
| Behavior therapy (ABA) | 0.68 | 9 of 47 | 20052 (+69), 20006 (+58), 20037 (+39) | 1.00 |
| Care coordination & community health | 0.88 | 3 of 47 | 20052 (+96), 20006 (+79), 20036 (+28) | 0.97 |
| General surgery | 0.13 | 15 of 47 | 20052 (+69), 20006 (+63), 20036 (+43) | 0.97 |
| Infectious disease | -0.13 | 17 of 47 | 20052 (+76), 20006 (+70), 20036 (+47) | 0.88 |
| Genetics & genetic counseling | -0.09 | 15 of 47 | 20052 (+60), 20006 (+55), 20036 (+36) | 0.94 |
| Hospice & palliative care | 0.06 | 4 of 47 | 20052 (+28), 20006 (+25), 20036 (+18) | 0.98 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Public transit pilot

The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving 2026-12-02T10:00:00, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.

- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): 16 (Maryland Transit Administration; Maryland Transit Administration; Maryland Transit Administration; Maryland Transit Administration; Prince George's County (The Bus); Alexandria Transit Company (DASH); Fairfax Connector; Arlington Transit; Montgomery County Department of Transportation (Ride On); Regional Transportation Agency of Central Maryland (RTA); Loudoun County Transit; Washington Metropolitan Area Transit Authority (WMATA); Washington Metropolitan Area Transit Authority (WMATA); Amtrak Vermonter; Fairfax CUE Bus (CUE); Virginia Railway Express)
- ZIP pairs reachable by transit within 120 minutes: 13,715; focus ZIPs that reach at least one other ZIP by transit: 44 of 47

| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 0 of 47 | 20004 (-3), 20005 (-2), 20008 (-2) | 0.45 |
| Pediatrics (children) | 1.00 | 0 of 47 | 20005 (-10), 20004 (-6), 20024 (-2) | 0.80 |
| Women's health / OB-GYN | 0.99 | 0 of 47 | 20036 (-8), 20004 (-7), 20052 (-7) | 0.27 |
| Mental health & counseling | 1.00 | 0 of 47 | 20004 (-3), 20024 (-2), 20036 (-2) | 0.48 |
| Dental | 1.00 | 0 of 47 | 20004 (-2), 20037 (-2), 20005 (-1) | 0.18 |
| Eye care | 1.00 | 0 of 47 | 20004 (-3), 20024 (-2), 20001 (-1) | 0.27 |
| Chiropractic | 1.00 | 0 of 47 | 20004 (-1), 20008 (-1), 20037 (-1) | 0.58 |
| Physical & occupational therapy | 1.00 | 0 of 47 | 20004 (-2), 20003 (-1), 20005 (-1) | 0.27 |
| Orthopedics & sports injury | 0.99 | 0 of 47 | 20036 (-5), 20052 (-5), 20004 (-4) | 0.08 |
| Heart / cardiology | 0.98 | 0 of 47 | 20004 (-9), 20024 (-8), 20036 (-8) | 0.38 |
| Skin / dermatology | 0.99 | 0 of 47 | 20036 (-12), 20004 (-7), 20008 (-7) | 0.14 |
| Allergy & immunology | 0.98 | 1 of 47 | 20036 (-19), 20004 (-13), 20052 (-11) | 0.37 |
| Lung, breathing & sleep | 0.99 | 0 of 47 | 20036 (-7), 20004 (-6), 20052 (-6) | 0.30 |
| Digestive / gastroenterology | 0.99 | 0 of 47 | 20004 (-7), 20036 (-7), 20052 (-7) | 0.23 |
| Kidney / nephrology | 0.99 | 0 of 47 | 20004 (-8), 20024 (-7), 20036 (-7) | 0.40 |
| Diabetes & hormones | 0.99 | 0 of 47 | 20004 (-10), 20036 (-10), 20052 (-9) | 0.29 |
| Cancer care / oncology | 0.95 | 1 of 47 | 20052 (-18), 20006 (-14), 20036 (-14) | 0.12 |
| Arthritis / rheumatology | 0.99 | 0 of 47 | 20004 (-9), 20024 (-8), 20036 (-8) | 0.25 |
| Brain & nerves / neurology | 0.98 | 0 of 47 | 20004 (-10), 20036 (-9), 20052 (-9) | 0.31 |
| Ear, nose & throat | 0.99 | 0 of 47 | 20036 (-6), 20052 (-6), 20004 (-5) | 0.17 |
| Urology | 0.99 | 0 of 47 | 20004 (-6), 20052 (-6), 20006 (-5) | 0.24 |
| Foot & ankle / podiatry | 1.00 | 0 of 47 | 20036 (-7), 20004 (-5), 20052 (-5) | 0.14 |
| Pain management | 1.00 | 0 of 47 | 20036 (-7), 20004 (-4), 20037 (-4) | 0.18 |
| Plastic & reconstructive surgery | 0.97 | 3 of 47 | 20052 (-23), 20006 (-19), 20036 (-17) | -0.06 |
| Speech & language therapy | 1.00 | 0 of 47 | 20004 (-2), 20037 (-2), 20003 (-1) | 0.41 |
| Nutrition & dietitian | 1.00 | 0 of 47 | 20004 (-3), 20005 (-3), 20037 (-2) | 0.40 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 47 | 20004 (-2), 20003 (-1), 20005 (-1) | 0.38 |
| Urgent care & emergency | 1.00 | 0 of 47 | 20005 (-4), 20004 (-3), 20001 (-2) | 0.52 |
| Imaging & lab | 0.99 | 0 of 47 | 20004 (-6), 20036 (-5), 20052 (-5) | 0.25 |
| Pharmacy | 1.00 | 0 of 47 | 20003 (-1), 20004 (-1), 20005 (-1) | 0.26 |
| Home health & in-home care | 1.00 | 0 of 47 |  | 0.91 |
| Nursing & assisted living | 0.99 | 0 of 47 | 20036 (-9), 20052 (-8), 20004 (-7) | 0.61 |
| Medical equipment & supplies | 0.99 | 0 of 47 | 20036 (-5), 20052 (-4), 20004 (-3) | 0.26 |
| Hearing & audiology | 0.99 | 0 of 47 | 20036 (-8), 20052 (-6), 20004 (-5) | 0.23 |
| Behavior therapy (ABA) | 1.00 | 0 of 47 | 20004 (-2), 20024 (-1), 20036 (-1) | 0.68 |
| Care coordination & community health | 1.00 | 0 of 47 | 20036 (-1) | 0.88 |
| General surgery | 0.99 | 0 of 47 | 20004 (-7), 20024 (-7), 20036 (-7) | 0.21 |
| Infectious disease | 0.92 | 7 of 47 | 20052 (-29), 20006 (-24), 20036 (-23) | 0.16 |
| Genetics & genetic counseling | 0.95 | 5 of 47 | 20052 (-22), 20006 (-18), 20036 (-17) | 0.12 |
| Hospice & palliative care | 0.99 | 0 of 47 | 20036 (-3), 20052 (-3), 20004 (-2) | 0.14 |

A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 20001 | Primary care / family doctor | 4.839 | 4.778 | 44 | 44 |
| 20001 | Mental health & counseling | 9.973 | 9.621 | 31 | 33 |
| 20001 | Heart / cardiology | 0.370 | 0.270 | 22 | 43 |
| 20001 | Cancer care / oncology | 0.220 | 0.147 | 28 | 52 |
| 20001 | Urgent care & emergency | 0.560 | 0.523 | 40 | 44 |
| 20019 | Primary care / family doctor | 4.632 | 3.907 | 46 | 55 |
| 20019 | Mental health & counseling | 10.376 | 8.867 | 28 | 38 |
| 20019 | Heart / cardiology | 0.345 | 0.247 | 27 | 48 |
| 20019 | Cancer care / oncology | 0.216 | 0.133 | 30 | 57 |
| 20019 | Urgent care & emergency | 0.532 | 0.394 | 43 | 58 |
| 20020 | Primary care / family doctor | 4.413 | 3.640 | 49 | 58 |
| 20020 | Mental health & counseling | 9.269 | 7.940 | 36 | 45 |
| 20020 | Heart / cardiology | 0.307 | 0.232 | 35 | 51 |
| 20020 | Cancer care / oncology | 0.202 | 0.126 | 34 | 59 |
| 20020 | Urgent care & emergency | 0.541 | 0.413 | 42 | 56 |
| 20032 | Primary care / family doctor | 4.479 | 3.008 | 48 | 65 |
| 20032 | Mental health & counseling | 8.907 | 6.543 | 38 | 55 |
| 20032 | Heart / cardiology | 0.311 | 0.211 | 35 | 56 |
| 20032 | Cancer care / oncology | 0.193 | 0.118 | 37 | 62 |
| 20032 | Urgent care & emergency | 0.557 | 0.365 | 40 | 61 |
| 20011 | Primary care / family doctor | 5.897 | 5.724 | 31 | 33 |
| 20011 | Mental health & counseling | 11.153 | 10.712 | 23 | 26 |
| 20011 | Heart / cardiology | 0.413 | 0.318 | 13 | 33 |
| 20011 | Cancer care / oncology | 0.314 | 0.175 | 0 | 43 |
| 20011 | Urgent care & emergency | 0.597 | 0.579 | 36 | 38 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Eye care | 023 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Chiropractic | 010 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Physical & occupational therapy | F049 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Heart / cardiology | 008 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Skin / dermatology | 011 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Allergy & immunology | 007 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Kidney / nephrology | 018 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Diabetes & hormones | 012 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Cancer care / oncology | 021 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Ear, nose & throat | 013 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Urology | 033 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Speech & language therapy | F051 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Imaging & lab | F047 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Nursing & assisted living | F046 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| General surgery | 015 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |
| Infectious disease | 017 | 0 of 46 | 0 (0.0%) | 0/39 | 0/7 |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
