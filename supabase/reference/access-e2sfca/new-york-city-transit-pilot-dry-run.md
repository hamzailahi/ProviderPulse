# E2SFCA access dry run: New York City

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 624; in New York City: 193
- Drive times: OSRM on OpenStreetMap roads (car profile), 624 x 624 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 526,331.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.45 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.62), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 10044 | yes | 12.91 | 100% | 5.46 | 100% | yes (0.70) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 61,101.6 | 4.30 | -0.18 | 125 of 193 | 11365 (-57), 11439 (-57), 11366 (-56) | 10152 (+59), 10036 (+57), 10019 (+56) |
| Pediatrics (children) | 30 | 20,837.6 | 1.11 | -0.18 | 134 of 193 | 11367 (-55), 11418 (-55), 11414 (-54) | 10152 (+76), 10036 (+69), 10019 (+67) |
| Women's health / OB-GYN | 60 | 8,569.6 | 0.53 | -0.62 | 161 of 193 | 11439 (-62), 11365 (-61), 11366 (-60) | 10152 (+80), 10018 (+73), 10036 (+72) |
| Mental health & counseling | 30 | 108,764.2 | 7.20 | -0.25 | 131 of 193 | 11365 (-67), 11366 (-66), 11439 (-66) | 10152 (+86), 10006 (+73), 10019 (+65) |
| Dental | 30 | 24,299.2 | 1.65 | -0.14 | 117 of 193 | 11365 (-56), 11439 (-56), 11357 (-51) | 10006 (+56), 10152 (+54), 10018 (+53) |
| Eye care | 30 | 9,475.6 | 0.62 | -0.12 | 125 of 193 | 11430 (-59), 11420 (-53), 11439 (-50) | 10152 (+71), 10006 (+60), 10018 (+58) |
| Chiropractic | 30 | 6,895.6 | 0.63 | 0.01 | 77 of 193 | 10119 (-40), 10199 (-40), 11430 (-34) | 10006 (+31), 10152 (+30), 10012 (+29) |
| Physical & occupational therapy | 30 | 45,401.8 | 2.70 | -0.05 | 124 of 193 | 11430 (-55), 11420 (-54), 10465 (-53) | 10152 (+62), 10006 (+53), 10018 (+53) |
| Orthopedics & sports injury | 60 | 4,539.4 | 0.39 | -0.32 | 144 of 193 | 11439 (-57), 11357 (-55), 11430 (-52) | 10018 (+56), 10036 (+53), 10152 (+53) |
| Heart / cardiology | 60 | 4,939.2 | 0.24 | -0.24 | 138 of 193 | 11414 (-65), 11367 (-64), 11417 (-63) | 10152 (+76), 10036 (+66), 10018 (+65) |
| Skin / dermatology | 60 | 1,793.4 | 0.09 | -0.35 | 166 of 193 | 11414 (-81), 11367 (-77), 11419 (-73) | 10032 (+71), 10006 (+69), 10030 (+69) |
| Allergy & immunology | 60 | 649.4 | 0.03 | -0.36 | 152 of 193 | 11414 (-73), 11367 (-69), 11419 (-68) | 10152 (+73), 10006 (+70), 10032 (+69) |
| Lung, breathing & sleep | 60 | 1,971.2 | 0.13 | -0.43 | 140 of 193 | 11439 (-63), 11430 (-62), 11367 (-56) | 10152 (+65), 10018 (+62), 10036 (+61) |
| Digestive / gastroenterology | 60 | 2,513 | 0.11 | -0.21 | 135 of 193 | 11414 (-58), 11421 (-58), 11416 (-57) | 10152 (+69), 10006 (+65), 10032 (+63) |
| Kidney / nephrology | 60 | 1,685.4 | 0.11 | -0.35 | 141 of 193 | 11430 (-58), 11439 (-55), 11365 (-49) | 10032 (+63), 10152 (+60), 10018 (+55) |
| Diabetes & hormones | 60 | 1,331 | 0.06 | -0.33 | 146 of 193 | 11367 (-65), 11414 (-65), 11417 (-65) | 10006 (+71), 10152 (+71), 10038 (+65) |
| Cancer care / oncology | 90 | 2,957.8 | 0.15 | -0.33 | 163 of 193 | 11414 (-77), 11430 (-76), 11420 (-67) | 10032 (+73), 10030 (+67), 10455 (+66) |
| Arthritis / rheumatology | 60 | 675.2 | 0.04 | -0.31 | 166 of 193 | 11414 (-70), 11420 (-70), 11367 (-66) | 10152 (+72), 10032 (+71), 10038 (+70) |
| Brain & nerves / neurology | 60 | 3,874.8 | 0.22 | -0.34 | 167 of 193 | 11430 (-74), 11367 (-69), 11420 (-68) | 10152 (+74), 10038 (+71), 10032 (+67) |
| Ear, nose & throat | 60 | 1,023.6 | 0.07 | -0.31 | 162 of 193 | 11430 (-74), 11439 (-71), 11365 (-65) | 10038 (+73), 10280 (+71), 10014 (+70) |
| Urology | 60 | 1,232 | 0.07 | -0.31 | 152 of 193 | 11414 (-67), 11430 (-65), 11367 (-61) | 10006 (+75), 10032 (+73), 10038 (+72) |
| Foot & ankle / podiatry | 60 | 4,033.6 | 0.15 | -0.27 | 112 of 193 | 11415 (-36), 10475 (-35), 11374 (-35) | 10152 (+78), 10006 (+67), 10030 (+60) |
| Pain management | 60 | 1,773.2 | 0.09 | -0.40 | 153 of 193 | 11414 (-72), 11430 (-69), 11420 (-64) | 10152 (+76), 10006 (+73), 10029 (+67) |
| Plastic & reconstructive surgery | 90 | 1,377.4 | 0.07 | -0.29 | 171 of 193 | 11414 (-90), 11420 (-87), 11430 (-86) | 10032 (+75), 10030 (+68), 10452 (+67) |
| Speech & language therapy | 30 | 18,967 | 0.90 | 0.15 | 119 of 193 | 11419 (-44), 11416 (-40), 11417 (-40) | 10152 (+80), 10006 (+66), 10019 (+58) |
| Nutrition & dietitian | 30 | 5,463.4 | 0.33 | -0.11 | 127 of 193 | 11439 (-64), 11365 (-63), 11366 (-63) | 10152 (+80), 10006 (+74), 10036 (+69) |
| Acupuncture, massage & naturopathy | 30 | 8,034.6 | 0.52 | 0.33 | 118 of 193 | 11430 (-63), 11420 (-50), 11367 (-48) | 10152 (+79), 10006 (+75), 10005 (+67) |
| Urgent care & emergency | 30 | 6,665.8 | 0.47 | -0.23 | 124 of 193 | 11367 (-66), 11365 (-65), 11439 (-65) | 10152 (+62), 10018 (+56), 10036 (+56) |
| Imaging & lab | 60 | 7,269.4 | 0.49 | -0.37 | 150 of 193 | 11439 (-66), 11430 (-65), 11357 (-62) | 10152 (+77), 10018 (+73), 10036 (+73) |
| Pharmacy | 30 | 29,085.2 | 1.72 | 0.25 | 121 of 193 | 11414 (-41), 11421 (-38), 11430 (-38) | 10152 (+61), 10006 (+51), 10019 (+49) |
| Home health & in-home care | 30 | 6,542.8 | 1.61 | 0.65 | 5 of 193 | 10119 (-18), 10199 (-18), 11378 (-17) | 10006 (+8), 10152 (+8), 11050 (+8) |
| Nursing & assisted living | 60 | 2,122.2 | 0.39 | 0.69 | 16 of 193 | 10119 (-31), 10199 (-31), 11370 (-21) | 10006 (+8), 10152 (+8), 11224 (+6) |
| Medical equipment & supplies | 60 | 5,035.8 | 0.36 | 0.59 | 78 of 193 | 10119 (-58), 10199 (-58), 11357 (-51) | 10006 (+32), 10152 (+32), 11212 (+29) |
| Hearing & audiology | 60 | 2,226.2 | 0.19 | -0.08 | 118 of 193 | 11430 (-55), 11439 (-50), 11414 (-46) | 10018 (+45), 10152 (+45), 10014 (+43) |
| Behavior therapy (ABA) | 30 | 13,059.6 | 2.88 | 0.58 | 8 of 193 | 10199 (-22), 11430 (-22), 10119 (-21) | 10308 (+17), 11050 (+13), 10306 (+12) |
| Care coordination & community health | 30 | 27,441.6 | 1.63 | -0.37 | 142 of 193 | 11358 (-45), 11365 (-45), 11367 (-45) | 10152 (+84), 10006 (+64), 10019 (+56) |
| General surgery | 60 | 5,461.6 | 0.35 | -0.34 | 146 of 193 | 11430 (-69), 11439 (-67), 11365 (-62) | 10152 (+77), 10018 (+74), 10036 (+74) |
| Infectious disease | 90 | 1,135 | 0.05 | -0.53 | 157 of 193 | 11096 (-80), 11436 (-74), 11367 (-72) | 10152 (+67), 10032 (+64), 10006 (+63) |
| Genetics & genetic counseling | 90 | 601.4 | 0.03 | -0.35 | 150 of 193 | 11430 (-79), 11414 (-69), 11420 (-64) | 10152 (+73), 10014 (+68), 10032 (+68) |
| Hospice & palliative care | 60 | 436.2 | 0.09 | -0.50 | 45 of 193 | 11439 (-25), 11357 (-24), 11430 (-22) | 10152 (+27), 10018 (+26), 10001 (+25) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in New York City in households with no vehicle: about 3,765,675 of 7,155,234 (52.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.19 | 115 of 193 | 10152 (+53), 10036 (+51), 10019 (+49) | 0.94 |
| Pediatrics (children) | 0.25 | 110 of 193 | 10152 (+72), 10036 (+64), 10019 (+62) | 0.94 |
| Women's health / OB-GYN | -0.43 | 144 of 193 | 10152 (+64), 10032 (+55), 10036 (+55) | 0.97 |
| Mental health & counseling | 0.10 | 117 of 193 | 10152 (+70), 10006 (+53), 10032 (+51) | 0.85 |
| Dental | 0.07 | 109 of 193 | 10152 (+48), 10032 (+46), 10036 (+46) | 0.93 |
| Eye care | 0.06 | 123 of 193 | 10152 (+60), 10006 (+50), 10032 (+49) | 0.94 |
| Chiropractic | 0.21 | 48 of 193 | 10032 (+32), 10033 (+29), 10152 (+27) | 0.92 |
| Physical & occupational therapy | 0.18 | 124 of 193 | 10152 (+57), 10032 (+49), 10006 (+47) | 0.96 |
| Orthopedics & sports injury | -0.25 | 116 of 193 | 10032 (+42), 10152 (+41), 10036 (+39) | 0.95 |
| Heart / cardiology | -0.33 | 127 of 193 | 10152 (+76), 10006 (+69), 10036 (+66) | 0.94 |
| Skin / dermatology | -0.20 | 133 of 193 | 10032 (+70), 10030 (+64), 10452 (+61) | 0.89 |
| Allergy & immunology | -0.15 | 129 of 193 | 10152 (+72), 10032 (+69), 10036 (+65) | 0.94 |
| Lung, breathing & sleep | -0.39 | 139 of 193 | 10152 (+57), 10036 (+50), 10006 (+49) | 0.98 |
| Digestive / gastroenterology | -0.23 | 112 of 193 | 10006 (+73), 10152 (+69), 10032 (+63) | 0.93 |
| Kidney / nephrology | -0.46 | 142 of 193 | 10152 (+65), 10036 (+57), 10018 (+56) | 0.97 |
| Diabetes & hormones | -0.29 | 126 of 193 | 10152 (+71), 10006 (+69), 10032 (+64) | 0.92 |
| Cancer care / oncology | -0.56 | 143 of 193 | 10032 (+57), 10030 (+50), 10033 (+49) | 0.90 |
| Arthritis / rheumatology | -0.29 | 144 of 193 | 10032 (+62), 10152 (+61), 10036 (+60) | 0.93 |
| Brain & nerves / neurology | -0.25 | 138 of 193 | 10152 (+63), 10032 (+61), 10036 (+58) | 0.92 |
| Ear, nose & throat | -0.19 | 135 of 193 | 10032 (+55), 10030 (+50), 10452 (+48) | 0.91 |
| Urology | -0.34 | 145 of 193 | 10032 (+58), 10006 (+55), 10152 (+55) | 0.94 |
| Foot & ankle / podiatry | -0.23 | 90 of 193 | 10152 (+78), 10006 (+67), 10032 (+63) | 0.98 |
| Pain management | -0.45 | 138 of 193 | 10152 (+76), 10032 (+72), 10006 (+64) | 0.97 |
| Plastic & reconstructive surgery | -0.51 | 147 of 193 | 10032 (+68), 10452 (+59), 10030 (+58) | 0.89 |
| Speech & language therapy | 0.56 | 99 of 193 | 10152 (+76), 10006 (+64), 10032 (+56) | 0.97 |
| Nutrition & dietitian | 0.17 | 110 of 193 | 10152 (+64), 10036 (+56), 10019 (+53) | 0.89 |
| Acupuncture, massage & naturopathy | 0.39 | 114 of 193 | 10152 (+68), 10032 (+53), 10029 (+51) | 0.93 |
| Urgent care & emergency | 0.12 | 120 of 193 | 10152 (+59), 10036 (+55), 10019 (+52) | 0.91 |
| Imaging & lab | -0.36 | 138 of 193 | 10032 (+50), 10152 (+49), 10006 (+48) | 0.94 |
| Pharmacy | 0.19 | 129 of 193 | 10152 (+69), 10036 (+58), 10016 (+57) | 0.98 |
| Home health & in-home care | 0.56 | 0 of 193 | 10152 (+12), 10036 (+11), 10006 (+10) | 0.99 |
| Nursing & assisted living | -0.31 | 27 of 193 | 10152 (+24), 10018 (+20), 10036 (+20) | 0.99 |
| Medical equipment & supplies | -0.23 | 140 of 193 | 10152 (+60), 10036 (+50), 10018 (+49) | 0.99 |
| Hearing & audiology | -0.13 | 123 of 193 | 10152 (+43), 10032 (+40), 10030 (+37) | 0.98 |
| Behavior therapy (ABA) | 0.56 | 2 of 193 | 10006 (+13), 10152 (+12), 10005 (+11) | 0.98 |
| Care coordination & community health | 0.04 | 133 of 193 | 10152 (+82), 10006 (+60), 10016 (+56) | 0.96 |
| General surgery | -0.28 | 139 of 193 | 10152 (+57), 10032 (+54), 10036 (+53) | 0.95 |
| Infectious disease | -0.61 | 121 of 193 | 10152 (+67), 10032 (+64), 10006 (+59) | 0.92 |
| Genetics & genetic counseling | -0.59 | 142 of 193 | 10152 (+52), 10006 (+46), 10014 (+46) | 0.89 |
| Hospice & palliative care | -0.36 | 10 of 193 | 10152 (+19), 10032 (+17), 10006 (+16) | 0.97 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Public transit pilot

The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving 2026-12-02T10:00:00, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.

- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): 40 (Metropolitan Transit Authority (MTA); New Jersey Transit (NJ Transit); New Jersey Transit (NJ Transit); Metropolitan Transit Authority (MTA); Metropolitan Transit Authority (MTA); Metropolitan Transit Authority (MTA); Metropolitan Transit Authority (MTA); Metropolitan Transit Authority (MTA); NYC Ferry; Metropolitan Transit Authority (MTA); Metropolitan Transit Authority (MTA); Nassau Inter-County Express (NICE Bus); Metro-North Railroad; Metropolitan Transit Authority (MTA); Greater Bridgeport Transit; Connecticut Transit; Adirondack Trailways ADP; Adirondack Trailways NYP; Huntington Area Rapid Transit (HART); Leprechaun Lines; Clarkstown MiniTrans; Lower Hudson Valley Transit; City of Long Beach Transportation; Norwalk Transit System (NTS); Amtrak Vermonter; Hudson Link; Suffolk County Transit; NY Waterway; Academy Lines; Trans-Bridge Lines; Somerset County; SeaStreak Ferries; Sussex County Skylands Ride; Roosevelt Island Operating Corporation Tramway; Monsey Trails; Housatonic Area Regional Transit; Mercy College; City Of Glen Cove; MTA Metro-North Railroad; Monroe Bus Lines)
- ZIP pairs reachable by transit within 120 minutes: 95,454; focus ZIPs that reach at least one other ZIP by transit: 193 of 193

| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 193 | 10152 (-15), 10011 (-8), 10012 (-8) | 0.23 |
| Pediatrics (children) | 0.99 | 1 of 193 | 10152 (-21), 10027 (-11), 10012 (-10) | 0.29 |
| Women's health / OB-GYN | 0.97 | 13 of 193 | 10012 (-19), 10005 (-18), 10006 (-18) | -0.34 |
| Mental health & counseling | 0.98 | 4 of 193 | 10152 (-22), 10006 (-16), 10007 (-16) | 0.19 |
| Dental | 0.99 | 0 of 193 | 10152 (-11), 10011 (-10), 10012 (-10) | 0.12 |
| Eye care | 0.99 | 1 of 193 | 10152 (-15), 10011 (-13), 10005 (-10) | 0.11 |
| Chiropractic | 0.99 | 0 of 193 | 10012 (-7), 10011 (-6), 10152 (-6) | 0.25 |
| Physical & occupational therapy | 0.99 | 0 of 193 | 10152 (-13), 10011 (-9), 10012 (-9) | 0.21 |
| Orthopedics & sports injury | 0.97 | 0 of 193 | 10006 (-11), 10012 (-11), 10027 (-11) | -0.14 |
| Heart / cardiology | 0.96 | 23 of 193 | 10012 (-24), 10006 (-23), 10005 (-21) | -0.20 |
| Skin / dermatology | 0.90 | 35 of 193 | 10027 (-28), 10006 (-25), 10012 (-25) | 0.03 |
| Allergy & immunology | 0.96 | 22 of 193 | 10006 (-23), 10012 (-22), 10005 (-21) | -0.05 |
| Lung, breathing & sleep | 0.98 | 4 of 193 | 10006 (-16), 10005 (-15), 10012 (-15) | -0.33 |
| Digestive / gastroenterology | 0.95 | 30 of 193 | 10012 (-27), 10006 (-26), 10005 (-25) | -0.09 |
| Kidney / nephrology | 0.98 | 5 of 193 | 10005 (-16), 10006 (-16), 10012 (-16) | -0.39 |
| Diabetes & hormones | 0.95 | 27 of 193 | 10012 (-25), 10006 (-24), 10005 (-23) | -0.11 |
| Cancer care / oncology | 0.95 | 36 of 193 | 10032 (-25), 10455 (-24), 10012 (-23) | -0.46 |
| Arthritis / rheumatology | 0.95 | 18 of 193 | 10006 (-20), 10012 (-20), 10027 (-20) | -0.15 |
| Brain & nerves / neurology | 0.95 | 14 of 193 | 10006 (-19), 10012 (-19), 10027 (-18) | -0.08 |
| Ear, nose & throat | 0.93 | 17 of 193 | 10027 (-20), 10006 (-19), 10012 (-19) | -0.00 |
| Urology | 0.95 | 17 of 193 | 10012 (-22), 10006 (-21), 10005 (-20) | -0.21 |
| Foot & ankle / podiatry | 0.98 | 22 of 193 | 10012 (-24), 11217 (-24), 10152 (-23) | -0.22 |
| Pain management | 0.98 | 6 of 193 | 10012 (-19), 10027 (-19), 11217 (-18) | -0.38 |
| Plastic & reconstructive surgery | 0.96 | 33 of 193 | 10032 (-29), 10452 (-27), 10033 (-24) | -0.44 |
| Speech & language therapy | 1.00 | 1 of 193 | 10152 (-18), 10012 (-14), 10007 (-13) | 0.57 |
| Nutrition & dietitian | 0.99 | 1 of 193 | 10152 (-22), 10012 (-14), 10007 (-11) | 0.23 |
| Acupuncture, massage & naturopathy | 0.98 | 5 of 193 | 10152 (-22), 10007 (-19), 10012 (-18) | 0.45 |
| Urgent care & emergency | 0.99 | 1 of 193 | 10152 (-16), 10012 (-10), 10027 (-8) | 0.17 |
| Imaging & lab | 0.96 | 8 of 193 | 10006 (-18), 10012 (-18), 10005 (-17) | -0.24 |
| Pharmacy | 1.00 | 0 of 193 | 10152 (-10), 10005 (-7), 10006 (-7) | 0.22 |
| Home health & in-home care | 1.00 | 0 of 193 | 10002 (-1), 10003 (-1), 10004 (-1) | 0.58 |
| Nursing & assisted living | 0.99 | 0 of 193 | 10006 (-4), 10005 (-3), 10012 (-3) | -0.30 |
| Medical equipment & supplies | 0.99 | 0 of 193 | 10012 (-12), 11217 (-12), 10005 (-11) | -0.21 |
| Hearing & audiology | 0.98 | 0 of 193 | 10006 (-9), 10012 (-9), 10027 (-9) | -0.09 |
| Behavior therapy (ABA) | 1.00 | 0 of 193 | 11232 (-3), 11217 (-2), 11220 (-2) | 0.57 |
| Care coordination & community health | 0.99 | 1 of 193 | 10152 (-19), 10005 (-13), 10007 (-13) | 0.07 |
| General surgery | 0.96 | 8 of 193 | 10006 (-19), 10012 (-19), 10005 (-18) | -0.16 |
| Infectious disease | 0.95 | 51 of 193 | 10012 (-27), 10014 (-26), 10152 (-26) | -0.49 |
| Genetics & genetic counseling | 0.95 | 27 of 193 | 10012 (-24), 10014 (-22), 10152 (-22) | -0.45 |
| Hospice & palliative care | 0.97 | 0 of 193 | 10005 (-5), 10006 (-5), 10012 (-5) | -0.27 |

A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 10001 | Primary care / family doctor | 7.087 | 2.946 | 18 | 66 |
| 10001 | Mental health & counseling | 15.798 | 7.685 | 0 | 47 |
| 10001 | Heart / cardiology | 0.614 | 0.184 | 0 | 61 |
| 10001 | Cancer care / oncology | 0.582 | 0.137 | 0 | 55 |
| 10001 | Urgent care & emergency | 0.820 | 0.340 | 12 | 64 |
| 10029 | Primary care / family doctor | 6.788 | 2.864 | 21 | 67 |
| 10029 | Mental health & counseling | 13.409 | 5.351 | 7 | 63 |
| 10029 | Heart / cardiology | 0.654 | 0.196 | 0 | 59 |
| 10029 | Cancer care / oncology | 0.575 | 0.150 | 0 | 51 |
| 10029 | Urgent care & emergency | 0.807 | 0.381 | 14 | 59 |
| 10451 | Primary care / family doctor | 6.084 | 2.746 | 29 | 68 |
| 10451 | Mental health & counseling | 9.121 | 5.086 | 37 | 65 |
| 10451 | Heart / cardiology | 0.541 | 0.200 | 0 | 58 |
| 10451 | Cancer care / oncology | 0.503 | 0.110 | 0 | 64 |
| 10451 | Urgent care & emergency | 0.743 | 0.381 | 21 | 59 |
| 11212 | Primary care / family doctor | 3.478 | 2.338 | 60 | 73 |
| 11212 | Mental health & counseling | 6.488 | 4.239 | 55 | 71 |
| 11212 | Heart / cardiology | 0.200 | 0.180 | 58 | 62 |
| 11212 | Cancer care / oncology | 0.080 | 0.104 | 74 | 66 |
| 11212 | Urgent care & emergency | 0.403 | 0.270 | 57 | 71 |
| 11368 | Primary care / family doctor | 4.811 | 5.276 | 44 | 39 |
| 11368 | Mental health & counseling | 6.152 | 8.886 | 57 | 38 |
| 11368 | Heart / cardiology | 0.378 | 0.339 | 21 | 29 |
| 11368 | Cancer care / oncology | 0.404 | 0.166 | 0 | 46 |
| 11368 | Urgent care & emergency | 0.495 | 0.597 | 47 | 36 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Eye care | 023 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Chiropractic | 010 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Physical & occupational therapy | F049 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Heart / cardiology | 008 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Skin / dermatology | 011 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Allergy & immunology | 007 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Kidney / nephrology | 018 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Diabetes & hormones | 012 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Cancer care / oncology | 021 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Ear, nose & throat | 013 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Urology | 033 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Speech & language therapy | F051 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Imaging & lab | F047 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Nursing & assisted living | F046 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| General surgery | 015 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |
| Infectious disease | 017 | 0 of 193 | 0 (0.0%) | 0/193 |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
