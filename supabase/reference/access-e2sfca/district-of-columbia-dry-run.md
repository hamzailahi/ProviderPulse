# E2SFCA access dry run: District of Columbia

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 702; in District of Columbia: 31
- Drive times: OSRM on OpenStreetMap roads (car profile), 702 x 702 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 321,193; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.12 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.79), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 10; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 10 (21669, 21814, 21817, 21821, 21824, 21840, 21865, 21866, 22435, 22511)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 21669 | no | 13.40 | 100% | 13.40 | 100% | no |
| 21814 | no | 2.96 | 17% | 2.96 | 17% | no |
| 21817 | no | 0.45 | 17% | 0.45 | 17% | no |
| 21821 | no | none | 0% | none | 0% | no |
| 21824 | no | 0.48 | 17% | 0.48 | 17% | no |
| 21840 | no | 2.80 | 17% | 2.80 | 17% | no |
| 21865 | no | 2.96 | 17% | 2.96 | 17% | no |
| 21866 | no | 0.48 | 17% | 0.48 | 17% | no |
| 22435 | no | 8.93 | 100% | 8.93 | 100% | no |
| 22511 | no | 11.29 | 100% | 11.29 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 36,020.6 | 4.30 | 0.39 | 11 of 31 | 20390 (-39), 20059 (-25), 20319 (-18) | 20052 (+51), 20006 (+44), 20036 (+23) |
| Pediatrics (children) | 30 | 11,848.2 | 1.11 | n/a | 7 of 31 | 20001 (0), 20002 (0), 20003 (0) | 20052 (+90), 20006 (+76), 20032 (+39) |
| Women's health / OB-GYN | 60 | 5,240 | 0.53 | 0.06 | 20 of 31 | 20390 (-32), 20373 (-20), 20319 (-17) | 20052 (+73), 20006 (+66), 20036 (+40) |
| Mental health & counseling | 30 | 67,089 | 7.20 | 0.12 | 14 of 31 | 20390 (-32), 20059 (-26), 20373 (-25) | 20052 (+67), 20006 (+59), 20036 (+34) |
| Dental | 30 | 14,604.2 | 1.65 | 0.24 | 14 of 31 | 20390 (-43), 20059 (-28), 20373 (-20) | 20052 (+57), 20006 (+50), 20036 (+26) |
| Eye care | 30 | 4,721.4 | 0.62 | 0.27 | 6 of 31 | 20390 (-34), 20059 (-24), 20422 (-15) | 20052 (+43), 20006 (+37), 20036 (+19) |
| Chiropractic | 30 | 3,063 | 0.63 | -0.02 | 4 of 31 | 20390 (-21), 20059 (-15), 20373 (-10) | 20052 (+23), 20006 (+20), 20036 (+9) |
| Physical & occupational therapy | 30 | 23,556.8 | 2.70 | 0.21 | 10 of 31 | 20390 (-35), 20059 (-24), 20064 (-17) | 20052 (+46), 20006 (+40), 20036 (+21) |
| Orthopedics & sports injury | 60 | 3,051.4 | 0.39 | 0.11 | 11 of 31 | 20390 (-29), 20373 (-19), 20319 (-18) | 20052 (+47), 20006 (+41), 20036 (+24) |
| Heart / cardiology | 60 | 2,182.2 | 0.24 | 0.21 | 23 of 31 | 20390 (-23), 20373 (-15), 20319 (-13) | 20052 (+74), 20006 (+68), 20036 (+47) |
| Skin / dermatology | 60 | 869.8 | 0.09 | 0.10 | 17 of 31 | 20390 (-45), 20319 (-31), 20373 (-29) | 20052 (+82), 20006 (+75), 20036 (+49) |
| Allergy & immunology | 60 | 413.2 | 0.03 | 0.33 | 13 of 31 | 20003 (-36), 20390 (-31), 20018 (-25) | 20052 (+84), 20006 (+73), 20036 (+39) |
| Lung, breathing & sleep | 60 | 1,004.8 | 0.13 | 0.25 | 16 of 31 | 20390 (-20), 20373 (-17), 20319 (-15) | 20052 (+55), 20006 (+49), 20036 (+32) |
| Digestive / gastroenterology | 60 | 1,043.6 | 0.11 | 0.22 | 18 of 31 | 20390 (-39), 20373 (-21), 20319 (-18) | 20052 (+68), 20006 (+62), 20009 (+34) |
| Kidney / nephrology | 60 | 1,016.2 | 0.11 | 0.30 | 21 of 31 | 20390 (-15), 20373 (-8), 20319 (-6) | 20052 (+72), 20006 (+66), 20036 (+41) |
| Diabetes & hormones | 60 | 637.4 | 0.06 | 0.30 | 19 of 31 | 20390 (-29), 20373 (-26), 20319 (-24) | 20052 (+68), 20006 (+60), 20009 (+38) |
| Cancer care / oncology | 90 | 1,349.2 | 0.15 | 0.28 | 23 of 31 | 20390 (-15), 20373 (-10), 20319 (-6) | 20052 (+64), 20006 (+59), 20009 (+49) |
| Arthritis / rheumatology | 60 | 385.8 | 0.04 | 0.27 | 19 of 31 | 20390 (-30), 20319 (-17), 20373 (-13) | 20052 (+77), 20006 (+70), 20036 (+41) |
| Brain & nerves / neurology | 60 | 1,700.2 | 0.22 | 0.23 | 22 of 31 | 20390 (-17), 20373 (-4), 20319 (-3) | 20052 (+74), 20006 (+69), 20036 (+47) |
| Ear, nose & throat | 60 | 530.6 | 0.07 | 0.13 | 17 of 31 | 20390 (-32), 20373 (-21), 20319 (-20) | 20052 (+54), 20006 (+49), 20036 (+32) |
| Urology | 60 | 617.2 | 0.07 | -0.09 | 18 of 31 | 20390 (-31), 20422 (-20), 20317 (-19) | 20052 (+57), 20006 (+51), 20036 (+31) |
| Foot & ankle / podiatry | 60 | 1,354.6 | 0.15 | 0.18 | 12 of 31 | 20390 (-38), 20059 (-32), 20373 (-31) | 20052 (+47), 20006 (+41), 20036 (+17) |
| Pain management | 60 | 821.4 | 0.09 | -0.02 | 14 of 31 | 20390 (-57), 20373 (-44), 20319 (-43) | 20052 (+38), 20006 (+31), 20036 (+10) |
| Plastic & reconstructive surgery | 90 | 562.2 | 0.07 | 0.03 | 19 of 31 | 20390 (-35), 20373 (-25), 20319 (-21) | 20052 (+76), 20006 (+71), 20036 (+49) |
| Speech & language therapy | 30 | 7,721.4 | 0.90 | 0.28 | 9 of 31 | 20390 (-33), 20059 (-28), 20064 (-20) | 20052 (+52), 20006 (+45), 20036 (+25) |
| Nutrition & dietitian | 30 | 2,613 | 0.33 | 0.38 | 14 of 31 | 20390 (-34), 20059 (-25), 20422 (-21) | 20052 (+70), 20006 (+62), 20036 (+36) |
| Acupuncture, massage & naturopathy | 30 | 3,739.4 | 0.52 | 0.46 | 5 of 31 | 20390 (-28), 20059 (-19), 20064 (-12) | 20052 (+45), 20006 (+39), 20036 (+20) |
| Urgent care & emergency | 30 | 3,218.8 | 0.47 | 0.24 | 14 of 31 | 20390 (-39), 20059 (-25), 20319 (-20) | 20052 (+52), 20006 (+46), 20036 (+24) |
| Imaging & lab | 60 | 3,676 | 0.49 | 0.23 | 11 of 31 | 20390 (-30), 20319 (-19), 20373 (-19) | 20052 (+45), 20006 (+40), 20036 (+22) |
| Pharmacy | 30 | 12,713.4 | 1.72 | 0.21 | 8 of 31 | 20390 (-33), 20059 (-22), 20373 (-17) | 20052 (+42), 20006 (+37), 20036 (+19) |
| Home health & in-home care | 30 | 33,634.2 | 1.61 | n/a | 2 of 31 | 20001 (0), 20002 (0), 20003 (0) | 20052 (+87), 20006 (+36), 20001 (+0) |
| Nursing & assisted living | 60 | 2,721 | 0.39 | 0.29 | 21 of 31 | 20373 (-16), 20319 (-7), 20390 (-5) | 20052 (+65), 20006 (+59), 20036 (+49) |
| Medical equipment & supplies | 60 | 2,689.8 | 0.36 | 0.39 | 12 of 31 | 20390 (-38), 20059 (-33), 20373 (-30) | 20052 (+35), 20006 (+29), 20036 (+11) |
| Hearing & audiology | 60 | 1,457.2 | 0.19 | 0.23 | 15 of 31 | 20390 (-31), 20319 (-19), 20373 (-19) | 20052 (+51), 20006 (+46), 20036 (+28) |
| Behavior therapy (ABA) | 30 | 36,107 | 2.88 | 0.61 | 19 of 31 | 20011 (-62), 20008 (-61), 20016 (-61) | 20052 (+26), 20006 (+20), 20032 (+5) |
| Care coordination & community health | 30 | 14,581.4 | 1.63 | n/a | 3 of 31 | 20001 (0), 20002 (0), 20003 (0) | 20052 (+96), 20006 (+79), 20036 (+28) |
| General surgery | 60 | 3,188.2 | 0.35 | 0.25 | 14 of 31 | 20390 (-30), 20373 (-19), 20319 (-18) | 20052 (+59), 20006 (+53), 20036 (+31) |
| Infectious disease | 90 | 593 | 0.05 | n/a | 16 of 31 | 20012 (0), 20015 (0), 20057 (0) | 20052 (+83), 20006 (+75), 20036 (+50) |
| Genetics & genetic counseling | 90 | 325.6 | 0.03 | 0.11 | 23 of 31 | 20064 (2), 20059 (3), 20317 (3) | 20052 (+85), 20006 (+79), 20036 (+59) |
| Hospice & palliative care | 60 | 394.4 | 0.09 | 0.18 | 3 of 31 | 20390 (-16), 20059 (-11), 20373 (-11) | 20052 (+20), 20006 (+18), 20036 (+9) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in District of Columbia in households with no vehicle: about 203,145 of 575,051 (35.3%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 6
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | -0.17 | 16 of 31 | 20052 (+73), 20006 (+66), 20036 (+45) | 0.98 |
| Pediatrics (children) | 0.50 | 7 of 31 | 20052 (+90), 20006 (+76), 20036 (+36) | 0.79 |
| Women's health / OB-GYN | -0.44 | 17 of 31 | 20052 (+82), 20006 (+75), 20036 (+52) | 1.00 |
| Mental health & counseling | -0.35 | 20 of 31 | 20052 (+82), 20006 (+75), 20036 (+49) | 0.99 |
| Dental | -0.17 | 18 of 31 | 20052 (+78), 20006 (+71), 20036 (+48) | 0.99 |
| Eye care | -0.09 | 10 of 31 | 20052 (+61), 20006 (+55), 20036 (+36) | 0.99 |
| Chiropractic | -0.21 | 5 of 31 | 20052 (+36), 20006 (+33), 20036 (+22) | 0.99 |
| Physical & occupational therapy | -0.15 | 10 of 31 | 20052 (+63), 20006 (+57), 20036 (+39) | 0.99 |
| Orthopedics & sports injury | -0.42 | 13 of 31 | 20052 (+58), 20006 (+52), 20036 (+36) | 1.00 |
| Heart / cardiology | -0.27 | 15 of 31 | 20052 (+71), 20006 (+66), 20036 (+43) | 1.00 |
| Skin / dermatology | -0.37 | 17 of 31 | 20052 (+85), 20006 (+78), 20036 (+54) | 0.99 |
| Allergy & immunology | n/a | 11 of 31 | 20052 (+90), 20006 (+79), 20036 (+45) | 0.98 |
| Lung, breathing & sleep | -0.35 | 14 of 31 | 20052 (+64), 20006 (+58), 20036 (+40) | 0.99 |
| Digestive / gastroenterology | -0.28 | 16 of 31 | 20052 (+76), 20006 (+70), 20036 (+48) | 1.00 |
| Kidney / nephrology | -0.22 | 15 of 31 | 20052 (+70), 20006 (+65), 20036 (+44) | 0.99 |
| Diabetes & hormones | -0.34 | 17 of 31 | 20052 (+87), 20006 (+79), 20036 (+53) | 0.99 |
| Cancer care / oncology | 0.26 | 15 of 31 | 20052 (+60), 20006 (+55), 20036 (+38) | 0.99 |
| Arthritis / rheumatology | -0.29 | 17 of 31 | 20052 (+84), 20006 (+77), 20036 (+51) | 0.99 |
| Brain & nerves / neurology | -0.31 | 15 of 31 | 20052 (+64), 20006 (+59), 20036 (+39) | 0.99 |
| Ear, nose & throat | -0.40 | 15 of 31 | 20052 (+63), 20006 (+58), 20036 (+40) | 0.99 |
| Urology | -0.45 | 15 of 31 | 20052 (+65), 20006 (+59), 20036 (+40) | 0.99 |
| Foot & ankle / podiatry | -0.46 | 15 of 31 | 20052 (+70), 20006 (+64), 20036 (+45) | 1.00 |
| Pain management | -0.34 | 15 of 31 | 20052 (+71), 20006 (+64), 20036 (+46) | 1.00 |
| Plastic & reconstructive surgery | 0.02 | 15 of 31 | 20052 (+63), 20006 (+58), 20036 (+42) | 0.99 |
| Speech & language therapy | -0.20 | 12 of 31 | 20052 (+74), 20006 (+67), 20036 (+45) | 0.98 |
| Nutrition & dietitian | -0.14 | 20 of 31 | 20052 (+85), 20006 (+77), 20036 (+52) | 0.98 |
| Acupuncture, massage & naturopathy | 0.14 | 9 of 31 | 20052 (+62), 20006 (+56), 20036 (+36) | 0.98 |
| Urgent care & emergency | -0.27 | 17 of 31 | 20052 (+68), 20006 (+62), 20036 (+42) | 0.96 |
| Imaging & lab | -0.29 | 14 of 31 | 20052 (+56), 20006 (+52), 20036 (+35) | 0.99 |
| Pharmacy | -0.20 | 8 of 31 | 20052 (+56), 20006 (+52), 20036 (+35) | 0.99 |
| Home health & in-home care | n/a | 2 of 31 | 20052 (+87), 20006 (+36) | n/a |
| Nursing & assisted living | 0.08 | 13 of 31 | 20052 (+62), 20006 (+57), 20036 (+41) | 0.99 |
| Medical equipment & supplies | -0.40 | 14 of 31 | 20052 (+63), 20006 (+58), 20036 (+41) | 1.00 |
| Hearing & audiology | -0.35 | 14 of 31 | 20052 (+60), 20006 (+56), 20036 (+38) | 1.00 |
| Behavior therapy (ABA) | 0.67 | 9 of 31 | 20052 (+69), 20006 (+58), 20036 (+38) | 0.99 |
| Care coordination & community health | 0.38 | 3 of 31 | 20052 (+96), 20006 (+79), 20036 (+28) | 0.91 |
| General surgery | -0.33 | 15 of 31 | 20052 (+70), 20006 (+64), 20036 (+43) | 1.00 |
| Infectious disease | -0.14 | 16 of 31 | 20052 (+83), 20006 (+75), 20036 (+50) | 0.98 |
| Genetics & genetic counseling | 0.29 | 16 of 31 | 20052 (+69), 20006 (+63), 20036 (+45) | 1.00 |
| Hospice & palliative care | -0.33 | 4 of 31 | 20052 (+28), 20006 (+26), 20036 (+18) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Eye care | 023 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Chiropractic | 010 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Physical & occupational therapy | F049 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Heart / cardiology | 008 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Skin / dermatology | 011 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Allergy & immunology | 007 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Kidney / nephrology | 018 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Diabetes & hormones | 012 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Cancer care / oncology | 021 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Ear, nose & throat | 013 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Urology | 033 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Speech & language therapy | F051 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Imaging & lab | F047 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Nursing & assisted living | F046 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| General surgery | 015 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |
| Infectious disease | 017 | 0 of 30 | 0 (0.0%) | 0/30 |  |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 1240 rows (ZIP x specialty) stored in access_e2sfca for DC; market-score now uses drive-time access for these ZIPs.
