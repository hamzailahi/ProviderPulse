# E2SFCA access dry run: Indiana

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,606; in Indiana: 790
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,606 x 2,606 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 650,675.804; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.66 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.64), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 83,886.804 | 4.30 | 0.62 | 234 of 790 | 46290 (-31), 46278 (-26), 47561 (-25) | 46788 (+89), 46763 (+74), 46799 (+61) |
| Pediatrics (children) | 30 | 23,929 | 1.11 | 0.76 | 143 of 790 | 47978 (-31), 46278 (-28), 46290 (-27) | 46763 (+86), 46180 (+63), 46165 (+55) |
| Women's health / OB-GYN | 60 | 9,508.2 | 0.53 | 0.63 | 246 of 790 | 47126 (-39), 47615 (-38), 46725 (-36) | 46058 (+60), 46763 (+57), 46065 (+52) |
| Mental health & counseling | 30 | 138,330.8 | 7.20 | 0.73 | 114 of 790 | 47370 (-22), 47951 (-22), 47355 (-19) | 47459 (+58), 47982 (+55), 46348 (+50) |
| Dental | 30 | 31,988.8 | 1.65 | 0.68 | 184 of 790 | 46290 (-30), 47465 (-25), 47978 (-25) | 46039 (+75), 46076 (+51), 46799 (+50) |
| Eye care | 30 | 13,172 | 0.62 | 0.66 | 309 of 790 | 46996 (-43), 47043 (-27), 47371 (-26) | 47459 (+95), 47866 (+83), 47435 (+74) |
| Chiropractic | 30 | 12,825 | 0.63 | 0.56 | 251 of 790 | 46996 (-66), 46962 (-32), 47263 (-29) | 47580 (+89), 47590 (+85), 47527 (+72) |
| Physical & occupational therapy | 30 | 63,007.6 | 2.70 | 0.69 | 254 of 790 | 47137 (-70), 47174 (-60), 47978 (-40) | 46763 (+80), 46039 (+76), 47601 (+72) |
| Orthopedics & sports injury | 60 | 9,067 | 0.39 | 0.52 | 402 of 790 | 47879 (-90), 47842 (-88), 47834 (-82) | 46121 (+81), 47010 (+80), 46164 (+79) |
| Heart / cardiology | 60 | 4,660.8 | 0.24 | 0.64 | 378 of 790 | 47619 (-50), 47164 (-49), 47639 (-49) | 47320 (+74), 46788 (+65), 46536 (+60) |
| Skin / dermatology | 60 | 1,611.8 | 0.09 | 0.63 | 331 of 790 | 47164 (-51), 47126 (-47), 47634 (-43) | 47036 (+65), 47338 (+64), 47142 (+63) |
| Allergy & immunology | 60 | 646.6 | 0.03 | 0.65 | 367 of 790 | 47060 (-65), 46064 (-63), 47164 (-60) | 47462 (+77), 47573 (+63), 47338 (+62) |
| Lung, breathing & sleep | 60 | 2,152.8 | 0.13 | 0.61 | 313 of 790 | 47639 (-61), 47654 (-59), 47648 (-57) | 47994 (+68), 47104 (+60), 47320 (+57) |
| Digestive / gastroenterology | 60 | 2,193.2 | 0.11 | 0.60 | 356 of 790 | 46052 (-63), 46793 (-61), 47639 (-61) | 46121 (+92), 46180 (+78), 46165 (+75) |
| Kidney / nephrology | 60 | 2,290.6 | 0.11 | 0.58 | 407 of 790 | 47164 (-62), 46113 (-50), 47561 (-50) | 46150 (+73), 46121 (+70), 47338 (+64) |
| Diabetes & hormones | 60 | 1,113.4 | 0.06 | 0.63 | 344 of 790 | 47561 (-83), 47512 (-74), 47666 (-68) | 46121 (+87), 46180 (+73), 46076 (+71) |
| Cancer care / oncology | 90 | 3,123.6 | 0.15 | 0.36 | 558 of 790 | 46045 (-63), 46072 (-62), 46052 (-59) | 47320 (+79), 47874 (+71), 47521 (+70) |
| Arthritis / rheumatology | 60 | 715.6 | 0.04 | 0.69 | 367 of 790 | 46075 (-65), 47060 (-59), 47126 (-59) | 46127 (+83), 47225 (+82), 46155 (+78) |
| Brain & nerves / neurology | 60 | 4,001.2 | 0.22 | 0.65 | 267 of 790 | 47126 (-50), 46052 (-48), 46327 (-43) | 46536 (+54), 46738 (+50), 46788 (+46) |
| Ear, nose & throat | 60 | 1,303.6 | 0.07 | 0.56 | 444 of 790 | 47523 (-92), 47552 (-79), 47611 (-75) | 46121 (+85), 47330 (+76), 47341 (+76) |
| Urology | 60 | 1,465.2 | 0.07 | 0.53 | 457 of 790 | 47615 (-63), 47611 (-62), 47523 (-58) | 46180 (+73), 47006 (+71), 47037 (+70) |
| Foot & ankle / podiatry | 60 | 3,474.2 | 0.15 | 0.52 | 398 of 790 | 47523 (-62), 47619 (-60), 47882 (-54) | 46382 (+73), 46039 (+72), 47341 (+68) |
| Pain management | 60 | 1,588 | 0.09 | 0.65 | 368 of 790 | 47639 (-75), 47612 (-70), 47633 (-65) | 46766 (+86), 46781 (+83), 47142 (+68) |
| Plastic & reconstructive surgery | 90 | 1,119 | 0.07 | 0.42 | 431 of 790 | 47126 (-67), 47164 (-62), 47177 (-61) | 47341 (+80), 47521 (+79), 47527 (+79) |
| Speech & language therapy | 30 | 19,190.8 | 0.90 | 0.71 | 173 of 790 | 46226 (-31), 47043 (-25), 46250 (-23) | 47104 (+95), 46069 (+69), 46763 (+66) |
| Nutrition & dietitian | 30 | 6,340.8 | 0.33 | 0.77 | 199 of 790 | 47240 (-36), 47465 (-33), 46290 (-32) | 46788 (+98), 47459 (+92), 47225 (+86) |
| Acupuncture, massage & naturopathy | 30 | 5,131.6 | 0.52 | 0.79 | 20 of 790 | 46926 (-21), 46958 (-19), 46988 (-13) | 47459 (+40), 46799 (+39), 46783 (+31) |
| Urgent care & emergency | 30 | 8,895.4 | 0.47 | 0.62 | 305 of 790 | 47978 (-66), 46290 (-51), 47561 (-51) | 47874 (+99), 46121 (+71), 47573 (+70) |
| Imaging & lab | 60 | 9,857.2 | 0.49 | 0.59 | 309 of 790 | 46052 (-51), 46158 (-47), 47126 (-47) | 47320 (+47), 47150 (+46), 46799 (+43) |
| Pharmacy | 30 | 32,052.6 | 1.72 | 0.65 | 223 of 790 | 46290 (-43), 46278 (-35), 47809 (-22) | 46050 (+91), 46788 (+73), 47982 (+62) |
| Home health & in-home care | 30 | 23,854.2 | 1.61 | 0.80 | 56 of 790 | 46221 (-19), 46217 (-18), 46225 (-15) | 46130 (+80), 46140 (+79), 46163 (+56) |
| Nursing & assisted living | 60 | 7,390 | 0.39 | 0.35 | 330 of 790 | 47576 (-60), 47060 (-59), 47116 (-55) | 47264 (+71), 46961 (+67), 46127 (+62) |
| Medical equipment & supplies | 60 | 7,505.4 | 0.36 | 0.59 | 346 of 790 | 47882 (-46), 46158 (-45), 46725 (-44) | 47916 (+71), 47866 (+62), 47954 (+62) |
| Hearing & audiology | 60 | 4,120.4 | 0.19 | 0.53 | 475 of 790 | 47879 (-79), 47882 (-76), 47126 (-71) | 46173 (+75), 46039 (+69), 47264 (+68) |
| Behavior therapy (ABA) | 30 | 42,838.2 | 2.88 | 0.82 | 239 of 790 | 47370 (-49), 46914 (-45), 46915 (-41) | 46039 (+100), 47325 (+99), 47846 (+98) |
| Care coordination & community health | 30 | 32,663.2 | 1.63 | 0.76 | 70 of 790 | 46996 (-33), 46931 (-24), 47951 (-23) | 47923 (+54), 47992 (+46), 46917 (+45) |
| General surgery | 60 | 6,789.8 | 0.35 | 0.44 | 350 of 790 | 46052 (-72), 46035 (-69), 46923 (-69) | 46788 (+64), 46738 (+58), 47137 (+55) |
| Infectious disease | 90 | 918.6 | 0.05 | 0.52 | 419 of 790 | 47164 (-56), 47170 (-53), 47112 (-51) | 46121 (+72), 46738 (+67), 46788 (+67) |
| Genetics & genetic counseling | 90 | 705.2 | 0.03 | 0.42 | 434 of 790 | 46112 (-100), 46123 (-100), 46113 (-99) | 46571 (+83), 46741 (+77), 46788 (+76) |
| Hospice & palliative care | 60 | 1,055.8 | 0.09 | 0.59 | 349 of 790 | 47619 (-47), 47561 (-41), 47512 (-40) | 46348 (+60), 46302 (+58), 47024 (+54) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Indiana in households with no vehicle: about 326,603 of 5,192,523 (6.3%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 3 of 790 | 46961 (+20), 46556 (+17), 46803 (+16) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 790 | 46556 (+15), 46803 (+15), 46216 (+10) | 1.00 |
| Women's health / OB-GYN | 0.99 | 2 of 790 | 46154 (+26), 46556 (+17), 46543 (+12) | 1.00 |
| Mental health & counseling | 1.00 | 0 of 790 | 46556 (+14), 46961 (+14), 46803 (+12) | 1.00 |
| Dental | 0.99 | 3 of 790 | 46961 (+21), 46154 (+15), 46556 (+15) | 1.00 |
| Eye care | 1.00 | 4 of 790 | 46961 (+22), 46556 (+21), 46154 (+19) | 1.00 |
| Chiropractic | 0.99 | 2 of 790 | 46961 (+24), 46543 (+16), 46571 (+13) | 1.00 |
| Physical & occupational therapy | 1.00 | 5 of 790 | 46803 (+21), 46556 (+18), 46961 (+17) | 1.00 |
| Orthopedics & sports injury | 0.99 | 5 of 790 | 46154 (+41), 46741 (+21), 46803 (+19) | 1.00 |
| Heart / cardiology | 0.99 | 2 of 790 | 46154 (+24), 46556 (+15), 46741 (+14) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 790 | 46154 (+24), 47305 (+8), 47406 (+7) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 790 | 46154 (+27), 46741 (+14), 46803 (+14) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 790 | 46154 (+24), 46741 (+12), 46803 (+10) | 1.00 |
| Digestive / gastroenterology | 1.00 | 3 of 790 | 46154 (+31), 46741 (+17), 46803 (+17) | 1.00 |
| Kidney / nephrology | 0.99 | 2 of 790 | 46154 (+32), 46556 (+17), 46741 (+13) | 1.00 |
| Diabetes & hormones | 1.00 | 3 of 790 | 46154 (+34), 46961 (+17), 47558 (+15) | 1.00 |
| Cancer care / oncology | 0.98 | 4 of 790 | 46154 (+37), 46961 (+18), 46543 (+17) | 1.00 |
| Arthritis / rheumatology | 1.00 | 1 of 790 | 46154 (+36), 46556 (+13), 46741 (+10) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 790 | 46154 (+25), 46556 (+11), 46741 (+10) | 1.00 |
| Ear, nose & throat | 0.99 | 4 of 790 | 46154 (+31), 46556 (+17), 46741 (+16) | 1.00 |
| Urology | 0.99 | 1 of 790 | 46154 (+23), 46741 (+14), 46556 (+13) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 3 of 790 | 46154 (+29), 46961 (+22), 46556 (+15) | 1.00 |
| Pain management | 0.99 | 2 of 790 | 46154 (+22), 46556 (+17), 46601 (+11) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 1 of 790 | 46154 (+31), 46543 (+10), 46571 (+10) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 790 | 46803 (+13), 46556 (+11), 46154 (+10) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 790 | 47305 (+18), 46803 (+17), 46543 (+15) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 790 | 46803 (+7), 46556 (+6), 46741 (+6) | 1.00 |
| Urgent care & emergency | 1.00 | 2 of 790 | 46961 (+26), 46556 (+16), 47406 (+14) | 1.00 |
| Imaging & lab | 0.99 | 1 of 790 | 46154 (+33), 46961 (+13), 46556 (+12) | 1.00 |
| Pharmacy | 0.99 | 3 of 790 | 46961 (+18), 46556 (+16), 46803 (+15) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 790 | 46154 (+14), 46556 (+9), 46803 (+9) | 1.00 |
| Nursing & assisted living | 0.97 | 3 of 790 | 46961 (+36), 46154 (+28), 46556 (+17) | 1.00 |
| Medical equipment & supplies | 0.99 | 3 of 790 | 46154 (+35), 46961 (+17), 46556 (+15) | 1.00 |
| Hearing & audiology | 0.99 | 5 of 790 | 46154 (+37), 46961 (+22), 46556 (+18) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 6 of 790 | 46556 (+30), 46154 (+24), 46961 (+24) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 790 | 46961 (+33), 46556 (+11), 47901 (+9) | 1.00 |
| General surgery | 0.99 | 1 of 790 | 46154 (+25), 46961 (+13), 46556 (+11) | 1.00 |
| Infectious disease | 0.99 | 1 of 790 | 46154 (+26), 46543 (+11), 46571 (+11) | 1.00 |
| Genetics & genetic counseling | 1.00 | 3 of 790 | 46154 (+54), 46543 (+15), 46571 (+15) | 1.00 |
| Hospice & palliative care | 0.99 | 1 of 790 | 46154 (+25), 46741 (+11), 46556 (+10) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 43 of 789 | 45,542 (0.9%) | 0/38 | 40/309 | 3/350 | 0/92 |  |
| Women's health / OB-GYN | 016 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Mental health & counseling: Psychiatry | 029 | 3 of 789 | 3,479 (0.1%) | 0/38 | 2/309 | 1/350 | 0/92 |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Eye care | 023 | 3 of 789 | 3,942 (0.1%) | 0/38 | 3/309 | 0/350 | 0/92 |  |
| Chiropractic | 010 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Physical & occupational therapy | F049 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Orthopedics & sports injury | 025 | 1 of 789 | 72 (0.0%) | 0/38 | 1/309 | 0/350 | 0/92 |  |
| Heart / cardiology | 008 | 15 of 789 | 13,586 (0.3%) | 0/38 | 9/309 | 6/350 | 0/92 |  |
| Skin / dermatology | 011 | 16 of 789 | 18,737 (0.4%) | 0/38 | 6/309 | 9/350 | 1/92 |  |
| Allergy & immunology | 007 | 19 of 789 | 68,297 (1.3%) | 0/38 | 18/309 | 1/350 | 0/92 |  |
| Lung, breathing & sleep | 030 | 2 of 789 | 1,176 (0.0%) | 0/38 | 1/309 | 1/350 | 0/92 |  |
| Digestive / gastroenterology | 014 | 10 of 789 | 8,442 (0.2%) | 0/38 | 2/309 | 7/350 | 1/92 |  |
| Kidney / nephrology | 018 | 1 of 789 | 72 (0.0%) | 0/38 | 1/309 | 0/350 | 0/92 |  |
| Diabetes & hormones | 012 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Cancer care / oncology | 021 | 7 of 789 | 6,850 (0.1%) | 0/38 | 3/309 | 4/350 | 0/92 |  |
| Arthritis / rheumatology | 031 | 4 of 789 | 6,426 (0.1%) | 0/38 | 4/309 | 0/350 | 0/92 |  |
| Brain & nerves / neurology | 019 | 8 of 789 | 8,362 (0.2%) | 0/38 | 1/309 | 7/350 | 0/92 |  |
| Ear, nose & throat | 013 | 2 of 789 | 1,296 (0.0%) | 0/38 | 2/309 | 0/350 | 0/92 |  |
| Urology | 033 | 12 of 789 | 25,516 (0.5%) | 2/38 | 7/309 | 3/350 | 0/92 |  |
| Foot & ankle / podiatry | 028 | 1 of 789 | 1,060 (0.0%) | 0/38 | 1/309 | 0/350 | 0/92 |  |
| Plastic & reconstructive surgery | 027 | 3 of 789 | 5,549 (0.1%) | 0/38 | 3/309 | 0/350 | 0/92 |  |
| Speech & language therapy | F051 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Imaging & lab | F047 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| Nursing & assisted living | F046 | 0 of 789 | 0 (0.0%) | 0/38 | 0/309 | 0/350 | 0/92 |  |
| General surgery | 015 | 2 of 789 | 2,718 (0.1%) | 0/38 | 2/309 | 0/350 | 0/92 |  |
| Infectious disease | 017 | 1 of 789 | 2,646 (0.1%) | 0/38 | 1/309 | 0/350 | 0/92 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 31600 rows (ZIP x specialty) stored in access_e2sfca for IN; market-score now uses drive-time access for these ZIPs.
