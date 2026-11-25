# E2SFCA access dry run: Chicago

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 277; in Chicago: 64
- Drive times: OSRM on OpenStreetMap roads (car profile), 277 x 277 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 216,144.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.04 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.61), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 27,722.2 | 4.30 | 0.10 | 23 of 64 | 60631 (-31), 60714 (-24), 60622 (-23) | 60626 (+30), 60660 (+30), 60637 (+29) |
| Pediatrics (children) | 30 | 9,397.8 | 1.11 | 0.03 | 28 of 64 | 60631 (-43), 60714 (-34), 60656 (-27) | 60649 (+45), 60626 (+44), 60660 (+42) |
| Women's health / OB-GYN | 60 | 3,457.2 | 0.53 | -0.26 | 29 of 64 | 60655 (-25), 60805 (-25), 60714 (-22) | 60660 (+38), 60637 (+37), 60626 (+35) |
| Mental health & counseling | 30 | 51,547 | 7.20 | 0.63 | 24 of 64 | 60630 (-32), 60631 (-31), 60646 (-30) | 60626 (+32), 60660 (+32), 60649 (+28) |
| Dental | 30 | 13,012.4 | 1.65 | 0.61 | 23 of 64 | 60631 (-35), 60646 (-30), 60630 (-26) | 60626 (+30), 60660 (+30), 60649 (+25) |
| Eye care | 30 | 4,360.4 | 0.62 | 0.39 | 20 of 64 | 60631 (-36), 60646 (-28), 60630 (-26) | 60626 (+24), 60649 (+23), 60660 (+23) |
| Chiropractic | 30 | 5,106.2 | 0.63 | 0.70 | 18 of 64 | 60631 (-35), 60646 (-28), 60714 (-27) | 60626 (+24), 60660 (+24), 60649 (+18) |
| Physical & occupational therapy | 30 | 23,280 | 2.70 | 0.62 | 30 of 64 | 60630 (-35), 60631 (-35), 60706 (-31) | 60660 (+31), 60626 (+29), 60649 (+26) |
| Orthopedics & sports injury | 60 | 2,556 | 0.39 | 0.13 | 20 of 64 | 60805 (-35), 60655 (-30), 60656 (-27) | 60626 (+24), 60660 (+24), 60640 (+16) |
| Heart / cardiology | 60 | 1,718.8 | 0.24 | -0.31 | 27 of 64 | 60805 (-32), 60714 (-29), 60631 (-26) | 60637 (+42), 60626 (+40), 60621 (+37) |
| Skin / dermatology | 60 | 713.4 | 0.09 | 0.00 | 38 of 64 | 60805 (-50), 60655 (-42), 60656 (-40) | 60626 (+48), 60660 (+45), 60637 (+37) |
| Allergy & immunology | 60 | 270.2 | 0.03 | 0.01 | 33 of 64 | 60805 (-53), 60617 (-46), 60655 (-44) | 60626 (+47), 60660 (+43), 60640 (+36) |
| Lung, breathing & sleep | 60 | 746.8 | 0.13 | -0.14 | 18 of 64 | 60631 (-25), 60714 (-25), 60805 (-25) | 60621 (+25), 60626 (+25), 60637 (+25) |
| Digestive / gastroenterology | 60 | 861.4 | 0.11 | -0.14 | 34 of 64 | 60714 (-35), 60805 (-34), 60631 (-29) | 60637 (+45), 60621 (+41), 60626 (+41) |
| Kidney / nephrology | 60 | 830.4 | 0.11 | -0.25 | 24 of 64 | 60714 (-30), 60805 (-29), 60631 (-28) | 60637 (+45), 60649 (+39), 60621 (+38) |
| Diabetes & hormones | 60 | 455.6 | 0.06 | -0.36 | 32 of 64 | 60631 (-37), 60656 (-37), 60714 (-27) | 60637 (+45), 60621 (+39), 60649 (+38) |
| Cancer care / oncology | 90 | 1,153.6 | 0.15 | -0.37 | 46 of 64 | 60714 (-31), 60631 (-25), 60656 (-22) | 60621 (+52), 60649 (+52), 60637 (+51) |
| Arthritis / rheumatology | 60 | 272.2 | 0.04 | -0.17 | 33 of 64 | 60805 (-39), 60631 (-31), 60655 (-31) | 60637 (+47), 60626 (+46), 60660 (+43) |
| Brain & nerves / neurology | 60 | 1,655.2 | 0.22 | -0.10 | 51 of 64 | 60631 (-43), 60805 (-42), 60656 (-40) | 60621 (+50), 60626 (+48), 60637 (+48) |
| Ear, nose & throat | 60 | 473.4 | 0.07 | -0.16 | 35 of 64 | 60805 (-49), 60714 (-44), 60655 (-40) | 60637 (+45), 60626 (+44), 60660 (+40) |
| Urology | 60 | 544.4 | 0.07 | 0.10 | 32 of 64 | 60805 (-34), 60714 (-30), 60655 (-26) | 60626 (+44), 60637 (+44), 60621 (+42) |
| Foot & ankle / podiatry | 60 | 1,651 | 0.15 | 0.32 | 24 of 64 | 60805 (-40), 60655 (-38), 60652 (-37) | 60626 (+35), 60660 (+35), 60640 (+30) |
| Pain management | 60 | 612.8 | 0.09 | 0.00 | 23 of 64 | 60805 (-35), 60655 (-32), 60631 (-28) | 60626 (+23), 60660 (+23), 60637 (+18) |
| Plastic & reconstructive surgery | 90 | 465.6 | 0.07 | -0.38 | 48 of 64 | 60805 (-32), 60656 (-28), 60714 (-26) | 60649 (+57), 60637 (+56), 60626 (+54) |
| Speech & language therapy | 30 | 7,745.4 | 0.90 | 0.65 | 24 of 64 | 60631 (-36), 60714 (-31), 60646 (-30) | 60626 (+28), 60660 (+28), 60615 (+24) |
| Nutrition & dietitian | 30 | 2,522.8 | 0.33 | 0.52 | 21 of 64 | 60631 (-43), 60714 (-35), 60630 (-22) | 60626 (+41), 60660 (+39), 60615 (+38) |
| Acupuncture, massage & naturopathy | 30 | 2,236.2 | 0.52 | 0.77 | 7 of 64 | 60631 (-21), 60646 (-21), 60630 (-18) | 60626 (+18), 60660 (+18), 60649 (+15) |
| Urgent care & emergency | 30 | 3,102.8 | 0.47 | 0.06 | 24 of 64 | 60622 (-30), 60631 (-29), 60604 (-28) | 60626 (+40), 60637 (+39), 60660 (+38) |
| Imaging & lab | 60 | 4,276.6 | 0.49 | 0.12 | 28 of 64 | 60805 (-37), 60655 (-29), 60631 (-25) | 60626 (+44), 60660 (+42), 60637 (+35) |
| Pharmacy | 30 | 9,817 | 1.72 | 0.53 | 13 of 64 | 60631 (-27), 60646 (-19), 60714 (-18) | 60626 (+21), 60660 (+20), 60637 (+18) |
| Home health & in-home care | 30 | 4,317.2 | 1.61 | 0.63 | 0 of 64 | 60631 (-11), 60805 (-11), 60646 (-10) | 60626 (+7), 60633 (+7), 60660 (+7) |
| Nursing & assisted living | 60 | 1,456.8 | 0.39 | 0.17 | 4 of 64 | 60804 (-21), 60632 (-16), 60638 (-16) | 60626 (+9), 60660 (+9), 60640 (+8) |
| Medical equipment & supplies | 60 | 2,701 | 0.36 | 0.32 | 30 of 64 | 60804 (-37), 60805 (-35), 60638 (-31) | 60626 (+22), 60660 (+21), 60640 (+18) |
| Hearing & audiology | 60 | 1,161.2 | 0.19 | 0.33 | 23 of 64 | 60805 (-31), 60631 (-30), 60656 (-30) | 60626 (+19), 60660 (+19), 60640 (+14) |
| Behavior therapy (ABA) | 30 | 10,566.6 | 2.88 | 0.41 | 5 of 64 | 60631 (-21), 60646 (-20), 60656 (-18) | 60649 (+12), 60626 (+10), 60660 (+10) |
| Care coordination & community health | 30 | 5,323.2 | 1.63 | 0.46 | 0 of 64 | 60631 (-14), 60646 (-12), 60630 (-11) | 60660 (+14), 60626 (+13), 60649 (+12) |
| General surgery | 60 | 2,603.4 | 0.35 | -0.07 | 30 of 64 | 60805 (-33), 60714 (-30), 60631 (-27) | 60637 (+43), 60626 (+39), 60621 (+38) |
| Infectious disease | 90 | 428 | 0.05 | -0.33 | 55 of 64 | 60714 (-31), 60656 (-25), 60631 (-24) | 60602 (+47), 60626 (+47), 60660 (+47) |
| Genetics & genetic counseling | 90 | 276.8 | 0.03 | -0.14 | 56 of 64 | 60805 (-47), 60655 (-39), 60643 (-35) | 60621 (+48), 60637 (+47), 60649 (+47) |
| Hospice & palliative care | 60 | 347 | 0.09 | 0.22 | 8 of 64 | 60804 (-20), 60805 (-20), 60638 (-17) | 60626 (+13), 60660 (+12), 60637 (+7) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Chicago in households with no vehicle: about 574,008 of 2,392,678 (24.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 0
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.68 | 10 of 64 | 60606 (+32), 60602 (+26), 60610 (+23) | 0.97 |
| Pediatrics (children) | 0.66 | 12 of 64 | 60606 (+30), 60610 (+29), 60602 (+28) | 0.94 |
| Women's health / OB-GYN | 0.37 | 16 of 64 | 60606 (+27), 60602 (+26), 60610 (+22) | 0.96 |
| Mental health & counseling | 0.82 | 12 of 64 | 60606 (+30), 60610 (+27), 60602 (+24) | 0.99 |
| Dental | 0.85 | 9 of 64 | 60606 (+29), 60602 (+24), 60610 (+23) | 0.99 |
| Eye care | 0.76 | 8 of 64 | 60606 (+28), 60602 (+23), 60610 (+21) | 0.97 |
| Chiropractic | 0.91 | 4 of 64 | 60606 (+21), 60602 (+18), 60610 (+17) | 0.99 |
| Physical & occupational therapy | 0.85 | 10 of 64 | 60606 (+31), 60602 (+25), 60610 (+23) | 0.98 |
| Orthopedics & sports injury | 0.60 | 12 of 64 | 60606 (+25), 60602 (+24), 60610 (+20) | 0.98 |
| Heart / cardiology | 0.28 | 20 of 64 | 60606 (+30), 60602 (+28), 60610 (+22) | 0.96 |
| Skin / dermatology | 0.68 | 20 of 64 | 60602 (+27), 60606 (+27), 60610 (+23) | 0.97 |
| Allergy & immunology | 0.54 | 23 of 64 | 60606 (+33), 60602 (+31), 60644 (+27) | 0.97 |
| Lung, breathing & sleep | 0.29 | 11 of 64 | 60606 (+25), 60602 (+24), 60610 (+19) | 0.96 |
| Digestive / gastroenterology | 0.35 | 21 of 64 | 60602 (+32), 60606 (+32), 60610 (+26) | 0.95 |
| Kidney / nephrology | 0.20 | 22 of 64 | 60606 (+32), 60602 (+31), 60610 (+25) | 0.96 |
| Diabetes & hormones | 0.30 | 21 of 64 | 60606 (+31), 60602 (+30), 60610 (+24) | 0.95 |
| Cancer care / oncology | 0.07 | 19 of 64 | 60602 (+25), 60606 (+25), 60610 (+22) | 0.94 |
| Arthritis / rheumatology | 0.33 | 21 of 64 | 60606 (+30), 60602 (+29), 60610 (+25) | 0.96 |
| Brain & nerves / neurology | 0.53 | 20 of 64 | 60606 (+29), 60602 (+28), 60610 (+24) | 0.95 |
| Ear, nose & throat | 0.43 | 19 of 64 | 60606 (+26), 60602 (+25), 60644 (+22) | 0.95 |
| Urology | 0.40 | 21 of 64 | 60602 (+31), 60606 (+31), 60610 (+24) | 0.95 |
| Foot & ankle / podiatry | 0.51 | 22 of 64 | 60602 (+37), 60606 (+34), 60610 (+33) | 0.97 |
| Pain management | 0.53 | 18 of 64 | 60606 (+29), 60602 (+28), 60610 (+23) | 0.98 |
| Plastic & reconstructive surgery | 0.20 | 17 of 64 | 60602 (+21), 60606 (+21), 60644 (+19) | 0.94 |
| Speech & language therapy | 0.84 | 8 of 64 | 60606 (+29), 60602 (+24), 60610 (+21) | 0.98 |
| Nutrition & dietitian | 0.74 | 12 of 64 | 60602 (+30), 60606 (+30), 60610 (+29) | 0.94 |
| Acupuncture, massage & naturopathy | 0.88 | 3 of 64 | 60606 (+18), 60602 (+17), 60610 (+16) | 0.99 |
| Urgent care & emergency | 0.65 | 13 of 64 | 60606 (+40), 60602 (+34), 60610 (+28) | 0.95 |
| Imaging & lab | 0.41 | 24 of 64 | 60606 (+37), 60602 (+36), 60610 (+29) | 0.97 |
| Pharmacy | 0.77 | 5 of 64 | 60606 (+24), 60602 (+21), 60610 (+17) | 0.99 |
| Home health & in-home care | 0.83 | 0 of 64 | 60606 (+9), 60602 (+7), 60610 (+7) | 0.99 |
| Nursing & assisted living | 0.22 | 2 of 64 | 60602 (+17), 60606 (+17), 60610 (+13) | 0.99 |
| Medical equipment & supplies | 0.58 | 17 of 64 | 60606 (+31), 60602 (+30), 60610 (+25) | 0.98 |
| Hearing & audiology | 0.69 | 9 of 64 | 60606 (+24), 60602 (+22), 60610 (+18) | 0.99 |
| Behavior therapy (ABA) | 0.85 | 0 of 64 | 60606 (+10), 60602 (+8), 60610 (+8) | 0.99 |
| Care coordination & community health | 0.76 | 0 of 64 | 60606 (+13), 60602 (+11), 60610 (+10) | 0.98 |
| General surgery | 0.36 | 20 of 64 | 60602 (+31), 60606 (+31), 60610 (+25) | 0.95 |
| Infectious disease | -0.05 | 20 of 64 | 60602 (+28), 60606 (+27), 60610 (+26) | 0.92 |
| Genetics & genetic counseling | 0.18 | 15 of 64 | 60621 (+23), 60637 (+22), 60644 (+22) | 0.83 |
| Hospice & palliative care | 0.61 | 2 of 64 | 60606 (+17), 60602 (+16), 60610 (+13) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Public transit pilot

The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving 2026-12-02T10:00:00, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.

- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): 7 (Chicago Water Taxi; Chicago Transit Authority (CTA); South Shore Line; Valparaiso Transit; Pace Bus; Gary Public Transportation Corporation; University of Chicago)
- ZIP pairs reachable by transit within 120 minutes: 12,662; focus ZIPs that reach at least one other ZIP by transit: 64 of 64

| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 0 of 64 | 60602 (-3), 60603 (-2), 60605 (-2) | 0.70 |
| Pediatrics (children) | 1.00 | 0 of 64 | 60602 (-5), 60603 (-4), 60657 (-4) | 0.69 |
| Women's health / OB-GYN | 0.98 | 0 of 64 | 60602 (-8), 60606 (-6), 60657 (-6) | 0.49 |
| Mental health & counseling | 1.00 | 0 of 64 | 60657 (-4), 60602 (-3), 60605 (-3) | 0.83 |
| Dental | 1.00 | 0 of 64 | 60602 (-3), 60610 (-3), 60603 (-2) | 0.85 |
| Eye care | 1.00 | 0 of 64 | 60602 (-3), 60603 (-2), 60605 (-2) | 0.77 |
| Chiropractic | 1.00 | 0 of 64 | 60602 (-3), 60610 (-3), 60657 (-3) | 0.92 |
| Physical & occupational therapy | 1.00 | 0 of 64 | 60602 (-3), 60603 (-3), 60657 (-3) | 0.87 |
| Orthopedics & sports injury | 0.99 | 0 of 64 | 60602 (-5), 60657 (-4), 60601 (-3) | 0.66 |
| Heart / cardiology | 0.99 | 0 of 64 | 60602 (-8), 60605 (-6), 60657 (-6) | 0.37 |
| Skin / dermatology | 0.99 | 0 of 64 | 60602 (-8), 60657 (-7), 60605 (-6) | 0.75 |
| Allergy & immunology | 0.99 | 0 of 64 | 60657 (-8), 60602 (-7), 60605 (-6) | 0.60 |
| Lung, breathing & sleep | 0.98 | 0 of 64 | 60602 (-7), 60605 (-5), 60606 (-5) | 0.39 |
| Digestive / gastroenterology | 0.98 | 0 of 64 | 60602 (-11), 60605 (-8), 60603 (-7) | 0.48 |
| Kidney / nephrology | 0.99 | 0 of 64 | 60602 (-8), 60603 (-6), 60605 (-6) | 0.28 |
| Diabetes & hormones | 0.98 | 0 of 64 | 60602 (-9), 60657 (-7), 60603 (-6) | 0.40 |
| Cancer care / oncology | 0.97 | 0 of 64 | 60602 (-10), 60657 (-8), 60605 (-7) | 0.22 |
| Arthritis / rheumatology | 0.98 | 0 of 64 | 60602 (-9), 60657 (-7), 60605 (-6) | 0.45 |
| Brain & nerves / neurology | 0.98 | 0 of 64 | 60602 (-10), 60657 (-9), 60605 (-7) | 0.64 |
| Ear, nose & throat | 0.98 | 0 of 64 | 60602 (-8), 60657 (-7), 60603 (-5) | 0.54 |
| Urology | 0.98 | 0 of 64 | 60602 (-10), 60605 (-7), 60657 (-7) | 0.51 |
| Foot & ankle / podiatry | 0.99 | 0 of 64 | 60602 (-9), 60657 (-8), 60603 (-5) | 0.57 |
| Pain management | 0.99 | 0 of 64 | 60602 (-6), 60603 (-4), 60606 (-4) | 0.59 |
| Plastic & reconstructive surgery | 0.97 | 0 of 64 | 60657 (-8), 60602 (-7), 60640 (-7) | 0.33 |
| Speech & language therapy | 1.00 | 0 of 64 | 60602 (-4), 60603 (-3), 60657 (-3) | 0.85 |
| Nutrition & dietitian | 0.99 | 0 of 64 | 60602 (-7), 60657 (-5), 60603 (-4) | 0.77 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 64 | 60602 (-3), 60657 (-3), 60605 (-2) | 0.88 |
| Urgent care & emergency | 1.00 | 0 of 64 | 60624 (-4), 60602 (-3), 60603 (-2) | 0.68 |
| Imaging & lab | 0.99 | 0 of 64 | 60602 (-9), 60657 (-7), 60603 (-6) | 0.49 |
| Pharmacy | 1.00 | 0 of 64 | 60602 (-2), 60624 (-2), 60657 (-2) | 0.77 |
| Home health & in-home care | 1.00 | 0 of 64 | 60626 (-1), 60642 (-1) | 0.84 |
| Nursing & assisted living | 0.99 | 0 of 64 | 60602 (-4), 60657 (-3), 60603 (-2) | 0.23 |
| Medical equipment & supplies | 1.00 | 0 of 64 | 60602 (-4), 60657 (-4), 60605 (-3) | 0.62 |
| Hearing & audiology | 0.99 | 0 of 64 | 60657 (-4), 60602 (-3), 60601 (-2) | 0.73 |
| Behavior therapy (ABA) | 1.00 | 0 of 64 | 60602 (-1), 60603 (-1), 60604 (-1) | 0.86 |
| Care coordination & community health | 1.00 | 0 of 64 | 60657 (-2), 60602 (-1), 60603 (-1) | 0.77 |
| General surgery | 0.98 | 0 of 64 | 60602 (-10), 60605 (-7), 60601 (-6) | 0.48 |
| Infectious disease | 0.96 | 0 of 64 | 60602 (-12), 60657 (-11), 60605 (-9) | 0.15 |
| Genetics & genetic counseling | 0.92 | 0 of 64 | 60640 (-13), 60657 (-13), 60660 (-13) | 0.40 |
| Hospice & palliative care | 0.99 | 0 of 64 | 60657 (-3), 60602 (-2), 60626 (-2) | 0.64 |

A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 60601 | Primary care / family doctor | 5.303 | 5.190 | 38 | 40 |
| 60601 | Mental health & counseling | 9.806 | 9.637 | 32 | 33 |
| 60601 | Heart / cardiology | 0.321 | 0.263 | 33 | 45 |
| 60601 | Cancer care / oncology | 0.255 | 0.157 | 17 | 49 |
| 60601 | Urgent care & emergency | 0.666 | 0.658 | 29 | 30 |
| 60621 | Primary care / family doctor | 5.958 | 3.592 | 31 | 58 |
| 60621 | Mental health & counseling | 7.979 | 5.056 | 45 | 65 |
| 60621 | Heart / cardiology | 0.409 | 0.235 | 14 | 51 |
| 60621 | Cancer care / oncology | 0.320 | 0.146 | 0 | 52 |
| 60621 | Urgent care & emergency | 0.839 | 0.493 | 10 | 47 |
| 60623 | Primary care / family doctor | 5.571 | 5.419 | 35 | 37 |
| 60623 | Mental health & counseling | 9.493 | 8.716 | 34 | 39 |
| 60623 | Heart / cardiology | 0.376 | 0.311 | 21 | 35 |
| 60623 | Cancer care / oncology | 0.302 | 0.187 | 2 | 39 |
| 60623 | Urgent care & emergency | 0.743 | 0.722 | 21 | 23 |
| 60640 | Primary care / family doctor | 6.120 | 4.235 | 29 | 51 |
| 60640 | Mental health & counseling | 12.035 | 9.334 | 16 | 35 |
| 60640 | Heart / cardiology | 0.375 | 0.230 | 21 | 52 |
| 60640 | Cancer care / oncology | 0.263 | 0.146 | 15 | 52 |
| 60640 | Urgent care & emergency | 0.784 | 0.507 | 16 | 46 |
| 60649 | Primary care / family doctor | 5.416 | 2.921 | 37 | 66 |
| 60649 | Mental health & counseling | 8.075 | 4.035 | 44 | 72 |
| 60649 | Heart / cardiology | 0.393 | 0.223 | 17 | 53 |
| 60649 | Cancer care / oncology | 0.324 | 0.146 | 0 | 52 |
| 60649 | Urgent care & emergency | 0.682 | 0.405 | 27 | 57 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Eye care | 023 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Chiropractic | 010 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Physical & occupational therapy | F049 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Heart / cardiology | 008 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Skin / dermatology | 011 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Allergy & immunology | 007 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Kidney / nephrology | 018 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Diabetes & hormones | 012 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Cancer care / oncology | 021 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Ear, nose & throat | 013 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Urology | 033 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Speech & language therapy | F051 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Imaging & lab | F047 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Nursing & assisted living | F046 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| General surgery | 015 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |
| Infectious disease | 017 | 0 of 64 | 0 (0.0%) | 0/64 |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
