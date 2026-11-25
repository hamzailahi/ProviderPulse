# E2SFCA access dry run: Philadelphia

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 243; in Philadelphia: 115
- Drive times: OSRM on OpenStreetMap roads (car profile), 243 x 243 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 141,058.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.23 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.08), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 19,003.8 | 4.30 | 0.60 | 37 of 115 | 19095 (-25), 19108 (-23), 19125 (-23) | 19043 (+38), 19070 (+37), 19022 (+35) |
| Pediatrics (children) | 30 | 6,955.8 | 1.11 | 0.82 | 18 of 115 | 19086 (-45), 19135 (-44), 19149 (-44) | 19070 (+28), 19118 (+24), 19085 (+22) |
| Women's health / OB-GYN | 60 | 2,618.4 | 0.53 | 0.37 | 43 of 115 | 19021 (-35), 19047 (-29), 19020 (-28) | 19139 (+32), 19102 (+30), 19141 (+29) |
| Mental health & counseling | 30 | 28,107.8 | 7.20 | 0.51 | 16 of 115 | 19108 (-47), 19066 (-24), 19127 (-22) | 19043 (+23), 19070 (+18), 19032 (+16) |
| Dental | 30 | 6,680 | 1.65 | 0.23 | 18 of 115 | 19108 (-48), 19127 (-23), 19090 (-22) | 19067 (+22), 19043 (+15), 19104 (+11) |
| Eye care | 30 | 2,572.8 | 0.62 | 0.26 | 19 of 115 | 19108 (-48), 19095 (-28), 19127 (-27) | 19067 (+25), 19043 (+19), 19054 (+14) |
| Chiropractic | 30 | 2,197.4 | 0.63 | 0.81 | 26 of 115 | 19108 (-37), 19116 (-29), 19085 (-25) | 19067 (+22), 19054 (+12), 19055 (+8) |
| Physical & occupational therapy | 30 | 12,989.8 | 2.70 | 0.58 | 50 of 115 | 19108 (-65), 19123 (-35), 19090 (-34) | 19067 (+23), 19054 (+15), 19055 (+14) |
| Orthopedics & sports injury | 60 | 1,680.8 | 0.39 | 0.36 | 28 of 115 | 19108 (-37), 19154 (-24), 19125 (-22) | 19139 (+22), 19060 (+18), 19102 (+18) |
| Heart / cardiology | 60 | 1,488.8 | 0.24 | 0.41 | 48 of 115 | 19015 (-41), 19002 (-40), 19154 (-38) | 19102 (+33), 19107 (+32), 19022 (+27) |
| Skin / dermatology | 60 | 563.2 | 0.09 | 0.25 | 48 of 115 | 19152 (-55), 19154 (-54), 19114 (-53) | 19022 (+30), 19102 (+26), 19107 (+26) |
| Allergy & immunology | 60 | 216.6 | 0.03 | 0.29 | 46 of 115 | 19021 (-84), 19152 (-70), 19007 (-65) | 19102 (+26), 19107 (+25), 19140 (+21) |
| Lung, breathing & sleep | 60 | 620.4 | 0.13 | 0.39 | 86 of 115 | 19021 (-41), 19154 (-38), 19020 (-35) | 19102 (+48), 19107 (+47), 19022 (+45) |
| Digestive / gastroenterology | 60 | 679.6 | 0.11 | 0.43 | 55 of 115 | 19002 (-39), 19015 (-39), 19021 (-39) | 19022 (+32), 19102 (+32), 19107 (+31) |
| Kidney / nephrology | 60 | 561.6 | 0.11 | 0.43 | 78 of 115 | 19021 (-34), 19020 (-32), 19015 (-30) | 19102 (+44), 19107 (+42), 19022 (+38) |
| Diabetes & hormones | 60 | 352.4 | 0.06 | 0.36 | 67 of 115 | 19038 (-42), 19015 (-41), 19086 (-41) | 19102 (+37), 19107 (+36), 19022 (+33) |
| Cancer care / oncology | 90 | 985.6 | 0.15 | 0.08 | 64 of 115 | 19002 (-65), 19030 (-58), 19057 (-57) | 19140 (+36), 19102 (+31), 19132 (+31) |
| Arthritis / rheumatology | 60 | 269.6 | 0.04 | 0.39 | 39 of 115 | 19021 (-59), 19057 (-52), 19152 (-48) | 19102 (+19), 19107 (+17), 19132 (+14) |
| Brain & nerves / neurology | 60 | 1,189.2 | 0.22 | 0.37 | 71 of 115 | 19021 (-49), 19154 (-48), 19086 (-45) | 19102 (+37), 19022 (+36), 19107 (+36) |
| Ear, nose & throat | 60 | 349.6 | 0.07 | 0.46 | 74 of 115 | 19086 (-51), 19021 (-42), 19154 (-41) | 19102 (+40), 19107 (+39), 19141 (+36) |
| Urology | 60 | 383.8 | 0.07 | 0.43 | 48 of 115 | 19002 (-33), 19007 (-32), 19015 (-31) | 19102 (+38), 19107 (+34), 19139 (+34) |
| Foot & ankle / podiatry | 60 | 1,013.8 | 0.15 | 0.31 | 32 of 115 | 19146 (-26), 19015 (-24), 19108 (-24) | 19067 (+40), 19054 (+15), 19102 (+15) |
| Pain management | 60 | 363 | 0.09 | -0.05 | 43 of 115 | 19108 (-49), 19125 (-37), 19066 (-29) | 19067 (+35), 19047 (+17), 19056 (+16) |
| Plastic & reconstructive surgery | 90 | 309.2 | 0.07 | 0.12 | 43 of 115 | 19015 (-44), 19052 (-41), 19014 (-35) | 19087 (+28), 19139 (+26), 19003 (+22) |
| Speech & language therapy | 30 | 2,990.4 | 0.90 | 0.55 | 23 of 115 | 19108 (-43), 19066 (-25), 19004 (-24) | 19067 (+17), 19054 (+12), 19055 (+12) |
| Nutrition & dietitian | 30 | 1,631.8 | 0.33 | 0.50 | 43 of 115 | 19108 (-39), 19090 (-31), 19116 (-29) | 19043 (+26), 19067 (+20), 19070 (+20) |
| Acupuncture, massage & naturopathy | 30 | 1,023 | 0.52 | 0.50 | 1 of 115 | 19108 (-22), 19038 (-14), 19090 (-13) | 19043 (+11), 19070 (+9), 19018 (+8) |
| Urgent care & emergency | 30 | 2,033.4 | 0.47 | 0.81 | 40 of 115 | 19095 (-23), 19125 (-12), 19152 (-12) | 19070 (+44), 19043 (+43), 19029 (+34) |
| Imaging & lab | 60 | 2,384 | 0.49 | 0.30 | 85 of 115 | 19002 (-31), 19038 (-31), 19154 (-31) | 19102 (+47), 19107 (+45), 19121 (+43) |
| Pharmacy | 30 | 7,688.8 | 1.72 | 0.51 | 28 of 115 | 19108 (-38), 19004 (-30), 19066 (-27) | 19043 (+19), 19067 (+18), 19022 (+16) |
| Home health & in-home care | 30 | 6,314.4 | 1.61 | 0.70 | 32 of 115 | 19108 (-36), 19004 (-33), 19066 (-32) | 19063 (+24), 19044 (+22), 19102 (+22) |
| Nursing & assisted living | 60 | 1,567 | 0.39 | 0.52 | 99 of 115 | 19108 (-63), 19066 (-51), 19004 (-47) | 19041 (+32), 19044 (+31), 19087 (+29) |
| Medical equipment & supplies | 60 | 1,408.8 | 0.36 | 0.14 | 46 of 115 | 19108 (-48), 19066 (-33), 19125 (-33) | 19067 (+30), 19060 (+17), 19054 (+14) |
| Hearing & audiology | 60 | 650.6 | 0.19 | 0.18 | 38 of 115 | 19108 (-43), 19066 (-30), 19004 (-25) | 19060 (+19), 19017 (+18), 19087 (+15) |
| Behavior therapy (ABA) | 30 | 4,426.8 | 2.88 | 0.35 | 6 of 115 | 19085 (-20), 19127 (-20), 19108 (-19) | 19054 (+8), 19067 (+8), 19017 (+6) |
| Care coordination & community health | 30 | 3,511 | 1.63 | 0.80 | 1 of 115 | 19108 (-26), 19013 (-10), 19066 (-9) | 19043 (+14), 19018 (+11), 19023 (+11) |
| General surgery | 60 | 1,642.2 | 0.35 | 0.28 | 70 of 115 | 19015 (-34), 19002 (-29), 19086 (-25) | 19102 (+51), 19107 (+49), 19103 (+45) |
| Infectious disease | 90 | 355.2 | 0.05 | 0.01 | 53 of 115 | 19021 (-73), 19020 (-72), 19002 (-68) | 19140 (+27), 19102 (+23), 19132 (+22) |
| Genetics & genetic counseling | 90 | 332.2 | 0.03 | 0.07 | 36 of 115 | 19007 (-91), 19047 (-91), 19056 (-91) | 19140 (+4), 19003 (+0), 19004 (+0) |
| Hospice & palliative care | 60 | 252.2 | 0.09 | 0.61 | 14 of 115 | 19108 (-32), 19066 (-25), 19004 (-21) | 19087 (+26), 19040 (+20), 19044 (+20) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Philadelphia in households with no vehicle: about 421,194 of 2,190,668 (19.2%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 0
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.84 | 13 of 115 | 19102 (+40), 19107 (+38), 19103 (+36) | 0.97 |
| Pediatrics (children) | 0.90 | 6 of 115 | 19022 (+16), 19102 (+14), 19140 (+8) | 0.94 |
| Women's health / OB-GYN | 0.32 | 15 of 115 | 19102 (+40), 19107 (+37), 19103 (+35) | 0.94 |
| Mental health & counseling | 0.73 | 11 of 115 | 19102 (+28), 19107 (+27), 19103 (+24) | 0.98 |
| Dental | 0.58 | 9 of 115 | 19102 (+28), 19107 (+28), 19103 (+25) | 0.99 |
| Eye care | 0.64 | 11 of 115 | 19102 (+27), 19107 (+27), 19103 (+25) | 0.99 |
| Chiropractic | 0.85 | 3 of 115 | 19102 (+20), 19107 (+20), 19103 (+17) | 1.00 |
| Physical & occupational therapy | 0.79 | 12 of 115 | 19102 (+33), 19107 (+33), 19103 (+28) | 1.00 |
| Orthopedics & sports injury | 0.25 | 14 of 115 | 19102 (+36), 19107 (+35), 19103 (+32) | 0.96 |
| Heart / cardiology | 0.33 | 11 of 115 | 19102 (+33), 19107 (+32), 19121 (+26) | 0.87 |
| Skin / dermatology | 0.25 | 16 of 115 | 19102 (+36), 19107 (+34), 19140 (+30) | 0.95 |
| Allergy & immunology | 0.50 | 9 of 115 | 19102 (+26), 19107 (+25), 19140 (+21) | 0.86 |
| Lung, breathing & sleep | 0.36 | 14 of 115 | 19102 (+35), 19107 (+34), 19103 (+29) | 0.88 |
| Digestive / gastroenterology | 0.44 | 11 of 115 | 19102 (+32), 19107 (+31), 19121 (+27) | 0.87 |
| Kidney / nephrology | 0.38 | 15 of 115 | 19102 (+39), 19107 (+38), 19103 (+32) | 0.89 |
| Diabetes & hormones | 0.32 | 16 of 115 | 19102 (+37), 19107 (+36), 19121 (+32) | 0.89 |
| Cancer care / oncology | -0.09 | 15 of 115 | 19140 (+32), 19102 (+29), 19107 (+28) | 0.69 |
| Arthritis / rheumatology | 0.56 | 2 of 115 | 19102 (+19), 19107 (+17), 19132 (+14) | 0.81 |
| Brain & nerves / neurology | 0.32 | 16 of 115 | 19102 (+36), 19107 (+36), 19132 (+34) | 0.88 |
| Ear, nose & throat | 0.35 | 17 of 115 | 19102 (+37), 19107 (+36), 19103 (+31) | 0.92 |
| Urology | 0.35 | 17 of 115 | 19102 (+42), 19107 (+39), 19103 (+36) | 0.94 |
| Foot & ankle / podiatry | 0.37 | 9 of 115 | 19102 (+36), 19107 (+32), 19103 (+29) | 0.93 |
| Pain management | 0.35 | 14 of 115 | 19102 (+37), 19107 (+36), 19103 (+33) | 0.97 |
| Plastic & reconstructive surgery | -0.15 | 12 of 115 | 19102 (+32), 19107 (+29), 19103 (+28) | 0.93 |
| Speech & language therapy | 0.80 | 5 of 115 | 19107 (+24), 19102 (+23), 19103 (+20) | 1.00 |
| Nutrition & dietitian | 0.72 | 13 of 115 | 19102 (+33), 19107 (+33), 19103 (+28) | 0.99 |
| Acupuncture, massage & naturopathy | 0.76 | 0 of 115 | 19102 (+13), 19107 (+12), 19103 (+11) | 0.99 |
| Urgent care & emergency | 0.93 | 12 of 115 | 19102 (+31), 19103 (+28), 19121 (+27) | 0.99 |
| Imaging & lab | 0.33 | 14 of 115 | 19102 (+34), 19107 (+33), 19132 (+29) | 0.88 |
| Pharmacy | 0.70 | 10 of 115 | 19102 (+33), 19107 (+32), 19103 (+29) | 0.98 |
| Home health & in-home care | 0.78 | 13 of 115 | 19102 (+36), 19107 (+34), 19103 (+31) | 0.99 |
| Nursing & assisted living | 0.33 | 12 of 115 | 19102 (+36), 19107 (+34), 19103 (+33) | 1.00 |
| Medical equipment & supplies | 0.21 | 12 of 115 | 19102 (+35), 19107 (+33), 19103 (+31) | 0.98 |
| Hearing & audiology | 0.21 | 10 of 115 | 19102 (+29), 19107 (+27), 19103 (+26) | 0.98 |
| Behavior therapy (ABA) | 0.80 | 0 of 115 | 19102 (+10), 19107 (+10), 19103 (+8) | 0.99 |
| Care coordination & community health | 0.82 | 3 of 115 | 19102 (+16), 19107 (+16), 19103 (+15) | 0.98 |
| General surgery | 0.36 | 14 of 115 | 19102 (+37), 19107 (+36), 19103 (+31) | 0.88 |
| Infectious disease | -0.00 | 12 of 115 | 19140 (+27), 19102 (+23), 19132 (+22) | 0.56 |
| Genetics & genetic counseling | 0.70 | 0 of 115 | 19140 (+4) | 0.70 |
| Hospice & palliative care | 0.40 | 8 of 115 | 19102 (+24), 19107 (+24), 19103 (+21) | 0.98 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Public transit pilot

The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving 2026-12-02T10:00:00, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.

- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): 12 (Southeastern Pennsylvania Transportation Authority (SEPTA); Southeastern Pennsylvania Transportation Authority (SEPTA); New Jersey Transit (NJ Transit); New Jersey Transit (NJ Transit); Delaware Transit Corporation (DART First State); Amtrak Vermonter; PHLASH; PATCO Speedline; Upper Merion Rambler; Academy Lines; Cross County Connection; Pottstown Area Rapid Transit)
- ZIP pairs reachable by transit within 120 minutes: 15,726; focus ZIPs that reach at least one other ZIP by transit: 115 of 115

| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 0 of 115 | 19102 (-14), 19107 (-10), 19139 (-9) | 0.88 |
| Pediatrics (children) | 0.97 | 0 of 115 | 19102 (-14), 19107 (-7), 19103 (-3) | 0.93 |
| Women's health / OB-GYN | 0.99 | 0 of 115 | 19102 (-7), 19107 (-7), 19139 (-6) | 0.45 |
| Mental health & counseling | 1.00 | 0 of 115 | 19102 (-4), 19104 (-4), 19139 (-4) | 0.75 |
| Dental | 1.00 | 0 of 115 | 19102 (-3), 19139 (-3), 19103 (-2) | 0.59 |
| Eye care | 1.00 | 0 of 115 | 19139 (-4), 19102 (-3), 19104 (-3) | 0.67 |
| Chiropractic | 1.00 | 0 of 115 | 19104 (-2), 19102 (-1), 19103 (-1) | 0.85 |
| Physical & occupational therapy | 1.00 | 0 of 115 | 19102 (-2), 19107 (-2), 19139 (-2) | 0.79 |
| Orthopedics & sports injury | 0.99 | 0 of 115 | 19102 (-6), 19107 (-6), 19103 (-5) | 0.35 |
| Heart / cardiology | 0.95 | 0 of 115 | 19107 (-14), 19102 (-13), 19106 (-10) | 0.51 |
| Skin / dermatology | 0.98 | 0 of 115 | 19102 (-7), 19107 (-7), 19139 (-7) | 0.37 |
| Allergy & immunology | 0.92 | 0 of 115 | 19107 (-13), 19102 (-12), 19141 (-9) | 0.64 |
| Lung, breathing & sleep | 0.95 | 0 of 115 | 19102 (-10), 19107 (-10), 19106 (-8) | 0.56 |
| Digestive / gastroenterology | 0.95 | 0 of 115 | 19107 (-13), 19102 (-12), 19106 (-11) | 0.62 |
| Kidney / nephrology | 0.96 | 0 of 115 | 19102 (-12), 19107 (-12), 19106 (-8) | 0.57 |
| Diabetes & hormones | 0.95 | 0 of 115 | 19107 (-14), 19102 (-13), 19106 (-11) | 0.52 |
| Cancer care / oncology | 0.88 | 3 of 115 | 19141 (-17), 19140 (-16), 19133 (-15) | 0.33 |
| Arthritis / rheumatology | 0.93 | 0 of 115 | 19102 (-13), 19107 (-13), 19121 (-10) | 0.68 |
| Brain & nerves / neurology | 0.95 | 0 of 115 | 19107 (-12), 19102 (-11), 19121 (-9) | 0.53 |
| Ear, nose & throat | 0.97 | 0 of 115 | 19107 (-10), 19102 (-9), 19139 (-8) | 0.52 |
| Urology | 0.98 | 0 of 115 | 19102 (-9), 19107 (-8), 19121 (-6) | 0.49 |
| Foot & ankle / podiatry | 0.96 | 0 of 115 | 19102 (-7), 19107 (-7), 19103 (-5) | 0.45 |
| Pain management | 0.99 | 0 of 115 | 19107 (-4), 19102 (-3), 19103 (-3) | 0.41 |
| Plastic & reconstructive surgery | 0.99 | 0 of 115 | 19102 (-9), 19103 (-7), 19107 (-7) | -0.03 |
| Speech & language therapy | 1.00 | 0 of 115 | 19102 (-1), 19103 (-1), 19104 (-1) | 0.81 |
| Nutrition & dietitian | 1.00 | 0 of 115 | 19102 (-3), 19103 (-3), 19104 (-3) | 0.74 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 115 | 19104 (-2), 19102 (-1), 19103 (-1) | 0.77 |
| Urgent care & emergency | 1.00 | 0 of 115 | 19102 (-12), 19107 (-9), 19139 (-9) | 0.94 |
| Imaging & lab | 0.96 | 0 of 115 | 19102 (-10), 19107 (-10), 19106 (-8) | 0.52 |
| Pharmacy | 1.00 | 0 of 115 | 19102 (-6), 19107 (-5), 19103 (-4) | 0.71 |
| Home health & in-home care | 1.00 | 0 of 115 | 19102 (-2), 19107 (-2), 19103 (-1) | 0.79 |
| Nursing & assisted living | 1.00 | 0 of 115 | 19102 (-2), 19103 (-2), 19104 (-2) | 0.35 |
| Medical equipment & supplies | 1.00 | 0 of 115 | 19102 (-4), 19103 (-3), 19107 (-3) | 0.25 |
| Hearing & audiology | 0.99 | 0 of 115 | 19102 (-2), 19103 (-2), 19106 (-2) | 0.27 |
| Behavior therapy (ABA) | 1.00 | 0 of 115 | 19102 (-1), 19103 (-1), 19104 (-1) | 0.81 |
| Care coordination & community health | 1.00 | 0 of 115 | 19102 (-3), 19139 (-3), 19103 (-2) | 0.84 |
| General surgery | 0.96 | 0 of 115 | 19102 (-11), 19107 (-11), 19106 (-7) | 0.55 |
| Infectious disease | 0.76 | 3 of 115 | 19141 (-17), 19140 (-16), 19102 (-15) | 0.48 |
| Genetics & genetic counseling | 0.70 | 0 of 115 | 19140 (-4) | 1.00 |
| Hospice & palliative care | 0.99 | 0 of 115 | 19102 (-3), 19107 (-3), 19103 (-2) | 0.46 |

A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 19104 | Primary care / family doctor | 6.780 | 5.799 | 21 | 33 |
| 19104 | Mental health & counseling | 8.082 | 6.202 | 44 | 57 |
| 19104 | Heart / cardiology | 0.605 | 0.370 | 0 | 22 |
| 19104 | Cancer care / oncology | 0.474 | 0.239 | 0 | 22 |
| 19104 | Urgent care & emergency | 0.882 | 0.669 | 6 | 28 |
| 19121 | Primary care / family doctor | 6.557 | 5.464 | 24 | 36 |
| 19121 | Mental health & counseling | 7.589 | 6.983 | 47 | 52 |
| 19121 | Heart / cardiology | 0.576 | 0.350 | 0 | 26 |
| 19121 | Cancer care / oncology | 0.508 | 0.229 | 0 | 25 |
| 19121 | Urgent care & emergency | 0.841 | 0.679 | 10 | 27 |
| 19132 | Primary care / family doctor | 6.613 | 5.681 | 23 | 34 |
| 19132 | Mental health & counseling | 7.721 | 7.266 | 46 | 50 |
| 19132 | Heart / cardiology | 0.579 | 0.351 | 0 | 26 |
| 19132 | Cancer care / oncology | 0.507 | 0.213 | 0 | 31 |
| 19132 | Urgent care & emergency | 0.844 | 0.706 | 10 | 25 |
| 19140 | Primary care / family doctor | 6.759 | 5.415 | 21 | 37 |
| 19140 | Mental health & counseling | 7.883 | 6.619 | 45 | 54 |
| 19140 | Heart / cardiology | 0.606 | 0.356 | 0 | 25 |
| 19140 | Cancer care / oncology | 0.506 | 0.197 | 0 | 36 |
| 19140 | Urgent care & emergency | 0.865 | 0.722 | 7 | 23 |
| 19143 | Primary care / family doctor | 7.240 | 6.040 | 16 | 30 |
| 19143 | Mental health & counseling | 8.457 | 7.639 | 41 | 47 |
| 19143 | Heart / cardiology | 0.661 | 0.422 | 0 | 11 |
| 19143 | Cancer care / oncology | 0.531 | 0.259 | 0 | 16 |
| 19143 | Urgent care & emergency | 0.894 | 0.696 | 4 | 26 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Eye care | 023 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Chiropractic | 010 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Physical & occupational therapy | F049 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Heart / cardiology | 008 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Skin / dermatology | 011 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Allergy & immunology | 007 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Kidney / nephrology | 018 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Diabetes & hormones | 012 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Cancer care / oncology | 021 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Ear, nose & throat | 013 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Urology | 033 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Speech & language therapy | F051 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Imaging & lab | F047 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Nursing & assisted living | F046 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| General surgery | 015 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |
| Infectious disease | 017 | 0 of 115 | 0 (0.0%) | 0/103 | 0/12 |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
