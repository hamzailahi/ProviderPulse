# E2SFCA access dry run: Vermont

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,507; in Vermont: 260
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,507 x 1,507 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 349,429.001; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.98 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.44), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 12173 | no | 7.64 | 100% | 4.78 | 100% | yes (1.27) |
| 12421 | no | 8.02 | 100% | 5.31 | 100% | yes (1.26) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 41,142.201 | 4.30 | 0.49 | 110 of 260 | 05353 (-47), 05033 (-39), 05050 (-37) | 05762 (+74), 05744 (+71), 05640 (+69) |
| Pediatrics (children) | 30 | 17,909.2 | 1.11 | 0.57 | 98 of 260 | 05043 (-52), 05033 (-44), 05081 (-34) | 05458 (+78), 05463 (+69), 05474 (+65) |
| Women's health / OB-GYN | 60 | 5,744.6 | 0.53 | 0.54 | 152 of 260 | 05873 (-60), 05847 (-59), 05494 (-48) | 05358 (+73), 05748 (+68), 05351 (+67) |
| Mental health & counseling | 30 | 100,672 | 7.20 | 0.66 | 128 of 260 | 05060 (-38), 05735 (-34), 05753 (-34) | 05358 (+93), 05351 (+88), 05762 (+75) |
| Dental | 30 | 18,521.8 | 1.65 | 0.57 | 107 of 260 | 05735 (-39), 05773 (-36), 05447 (-35) | 05762 (+89), 05477 (+79), 05445 (+78) |
| Eye care | 30 | 5,862 | 0.62 | 0.65 | 115 of 260 | 05873 (-60), 05033 (-47), 05043 (-45) | 05458 (+81), 05445 (+80), 05682 (+76) |
| Chiropractic | 30 | 4,339.2 | 0.63 | 0.65 | 126 of 260 | 05843 (-40), 05839 (-39), 05254 (-36) | 05462 (+95), 05648 (+86), 05682 (+85) |
| Physical & occupational therapy | 30 | 33,460 | 2.70 | 0.63 | 102 of 260 | 05073 (-46), 05735 (-32), 05873 (-28) | 05462 (+90), 05489 (+84), 05744 (+84) |
| Orthopedics & sports injury | 60 | 3,847.2 | 0.39 | 0.62 | 141 of 260 | 05733 (-64), 05873 (-63), 05456 (-62) | 05350 (+62), 05747 (+62), 05340 (+58) |
| Heart / cardiology | 60 | 2,360 | 0.24 | 0.59 | 71 of 260 | 05456 (-52), 05473 (-52), 05468 (-44) | 05682 (+44), 05640 (+42), 05648 (+42) |
| Skin / dermatology | 60 | 1,059 | 0.09 | 0.57 | 145 of 260 | 05032 (-89), 05073 (-74), 05058 (-73) | 05301 (+59), 05352 (+57), 05346 (+53) |
| Allergy & immunology | 60 | 333.4 | 0.03 | 0.65 | 37 of 260 | 05462 (-41), 05473 (-41), 05456 (-38) | 05477 (+81), 05448 (+56), 05445 (+48) |
| Lung, breathing & sleep | 60 | 1,015 | 0.13 | 0.61 | 107 of 260 | 05050 (-55), 05445 (-54), 05873 (-52) | 05448 (+81), 05457 (+60), 05483 (+50) |
| Digestive / gastroenterology | 60 | 1,120.6 | 0.11 | 0.54 | 130 of 260 | 05461 (-57), 05465 (-55), 05445 (-54) | 05640 (+72), 05648 (+70), 05252 (+68) |
| Kidney / nephrology | 60 | 726.2 | 0.11 | 0.59 | 44 of 260 | 05468 (-38), 05494 (-34), 05473 (-31) | 05840 (+38), 05905 (+35), 05821 (+27) |
| Diabetes & hormones | 60 | 859.2 | 0.06 | 0.60 | 139 of 260 | 05773 (-93), 05757 (-82), 05742 (-79) | 05252 (+74), 05640 (+61), 05648 (+56) |
| Cancer care / oncology | 90 | 1,770.6 | 0.15 | 0.30 | 124 of 260 | 05454 (-78), 05473 (-75), 05478 (-74) | 05868 (+37), 05830 (+34), 05829 (+33) |
| Arthritis / rheumatology | 60 | 432.6 | 0.04 | 0.52 | 133 of 260 | 05461 (-95), 05445 (-86), 05465 (-86) | 05748 (+72), 05906 (+60), 05358 (+55) |
| Brain & nerves / neurology | 60 | 2,350 | 0.22 | 0.52 | 105 of 260 | 05473 (-58), 05456 (-54), 05454 (-53) | 05252 (+64), 05048 (+55), 05352 (+47) |
| Ear, nose & throat | 60 | 610.6 | 0.07 | 0.57 | 149 of 260 | 05822 (-75), 05873 (-71), 05845 (-70) | 05448 (+80), 05358 (+65), 05034 (+64) |
| Urology | 60 | 726.8 | 0.07 | 0.60 | 156 of 260 | 05873 (-88), 05658 (-81), 05050 (-63) | 05448 (+73), 05067 (+68), 05091 (+65) |
| Foot & ankle / podiatry | 60 | 1,131.4 | 0.15 | 0.47 | 129 of 260 | 05733 (-55), 05773 (-55), 05735 (-52) | 05358 (+75), 05351 (+71), 05821 (+71) |
| Pain management | 60 | 448.2 | 0.09 | 0.59 | 101 of 260 | 05845 (-53), 05822 (-52), 05491 (-51) | 05448 (+62), 05821 (+62), 05858 (+49) |
| Plastic & reconstructive surgery | 90 | 498.2 | 0.07 | 0.54 | 73 of 260 | 05456 (-25), 05774 (-25), 05473 (-24) | 05751 (+67), 05762 (+61), 05738 (+60) |
| Speech & language therapy | 30 | 8,127.6 | 0.90 | 0.55 | 77 of 260 | 05448 (-47), 05441 (-35), 05735 (-34) | 05458 (+100), 05486 (+94), 05762 (+64) |
| Nutrition & dietitian | 30 | 4,227.2 | 0.33 | 0.61 | 129 of 260 | 05862 (-69), 05873 (-48), 05038 (-43) | 05901 (+96), 05748 (+91), 05682 (+89) |
| Acupuncture, massage & naturopathy | 30 | 4,556.4 | 0.52 | 0.71 | 114 of 260 | 05679 (-50), 05043 (-48), 05456 (-48) | 05358 (+100), 05091 (+95), 05067 (+81) |
| Urgent care & emergency | 30 | 4,001.2 | 0.47 | 0.60 | 121 of 260 | 05050 (-86), 05873 (-76), 05866 (-64) | 05767 (+100), 05840 (+100), 05448 (+98) |
| Imaging & lab | 60 | 4,397 | 0.49 | 0.44 | 114 of 260 | 05468 (-67), 05494 (-61), 05456 (-56) | 05448 (+41), 05252 (+40), 05751 (+39) |
| Pharmacy | 30 | 14,291.8 | 1.72 | 0.51 | 108 of 260 | 05735 (-29), 05661 (-26), 05033 (-25) | 05744 (+69), 05762 (+65), 05458 (+64) |
| Home health & in-home care | 30 | 5,530 | 1.61 | 0.60 | 2 of 260 | 05043 (-11), 05050 (-11), 05042 (-8) | 05350 (+15), 05901 (+15), 05048 (+14) |
| Nursing & assisted living | 60 | 2,619 | 0.39 | 0.49 | 146 of 260 | 05873 (-82), 05847 (-67), 05050 (-63) | 05448 (+74), 05747 (+73), 05457 (+64) |
| Medical equipment & supplies | 60 | 2,023 | 0.36 | 0.58 | 88 of 260 | 05456 (-42), 05733 (-40), 05873 (-40) | 05445 (+52), 05477 (+48), 05762 (+41) |
| Hearing & audiology | 60 | 1,710.8 | 0.19 | 0.50 | 168 of 260 | 05773 (-100), 05873 (-83), 05658 (-82) | 05358 (+74), 05776 (+71), 05351 (+70) |
| Behavior therapy (ABA) | 30 | 19,044.4 | 2.88 | 0.63 | 4 of 260 | 05866 (-11), 05845 (-9), 05774 (-8) | 05445 (+21), 05462 (+18), 05477 (+17) |
| Care coordination & community health | 30 | 15,155.2 | 1.63 | 0.61 | 95 of 260 | 05101 (-71), 05086 (-58), 05845 (-52) | 05448 (+100), 05747 (+100), 05748 (+100) |
| General surgery | 60 | 2,945.2 | 0.35 | 0.48 | 145 of 260 | 05873 (-65), 05843 (-62), 05464 (-51) | 05748 (+62), 05821 (+58), 05252 (+52) |
| Infectious disease | 90 | 590.2 | 0.05 | 0.30 | 123 of 260 | 05468 (-62), 05461 (-60), 05445 (-58) | 05751 (+68), 05762 (+63), 05738 (+61) |
| Genetics & genetic counseling | 90 | 451.8 | 0.03 | 0.36 | 80 of 260 | 05461 (-71), 05486 (-68), 05445 (-67) | 05452 (+28), 05446 (+27), 05408 (+26) |
| Hospice & palliative care | 60 | 431 | 0.09 | 0.58 | 143 of 260 | 05873 (-52), 05658 (-44), 05445 (-38) | 05840 (+70), 05905 (+65), 05358 (+48) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Vermont in households with no vehicle: about 31,902 of 524,478 (6.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 3
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 260 | 05141 (+24), 05736 (+12), 05081 (+10) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 260 | 05141 (+10), 05081 (+9), 05736 (+7) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 260 | 05141 (+16), 05034 (+8), 05081 (+8) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 260 | 05141 (+16), 05736 (+11), 05081 (+9) | 1.00 |
| Dental | 1.00 | 0 of 260 | 05736 (+13), 05034 (+10), 05141 (+10) | 1.00 |
| Eye care | 1.00 | 0 of 260 | 05736 (+11), 05081 (+9), 05404 (+5) | 1.00 |
| Chiropractic | 1.00 | 2 of 260 | 05034 (+17), 05141 (+16), 05401 (+6) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 260 | 05034 (+14), 05736 (+14), 05081 (+12) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 260 | 05141 (+14), 05034 (+10), 05736 (+10) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 260 | 05736 (+4), 05034 (+3), 05141 (+3) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 260 | 05034 (+21), 05141 (+9), 05736 (+9) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 260 | 05141 (+6), 05401 (+5), 05404 (+5) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 260 | 05081 (+9), 05034 (+5), 05404 (+4) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 260 | 05034 (+8), 05141 (+7), 05081 (+6) | 1.00 |
| Kidney / nephrology | 0.99 | 0 of 260 | 05141 (+4), 05034 (+3), 05833 (+3) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 260 | 05034 (+16), 05736 (+9), 05732 (+8) | 1.00 |
| Cancer care / oncology | 0.99 | 0 of 260 | 05141 (+4), 05034 (+3), 05081 (+3) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 260 | 05141 (+13), 05736 (+11), 05034 (+9) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 260 | 05034 (+7), 05408 (+4), 05081 (+3) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 260 | 05034 (+14), 05736 (+11), 05833 (+11) | 1.00 |
| Urology | 1.00 | 1 of 260 | 05141 (+15), 05081 (+12), 05034 (+7) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 0 of 260 | 05034 (+9), 05736 (+8), 05141 (+6) | 1.00 |
| Pain management | 1.00 | 0 of 260 | 05833 (+9), 05141 (+5), 05081 (+4) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 260 | 05034 (+4), 05141 (+2), 05401 (+2) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 260 | 05736 (+9), 05081 (+5), 05404 (+5) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 260 | 05902 (+12), 05736 (+8), 05050 (+4) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 260 | 05141 (+37), 05736 (+8), 05253 (+5) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 260 | 05141 (+32), 05736 (+14), 05902 (+10) | 1.00 |
| Imaging & lab | 0.99 | 0 of 260 | 05034 (+6), 05141 (+6), 05081 (+5) | 1.00 |
| Pharmacy | 1.00 | 0 of 260 | 05736 (+11), 05081 (+10), 05833 (+9) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 260 | 05034 (+3), 05081 (+2), 05736 (+2) | 1.00 |
| Nursing & assisted living | 0.99 | 1 of 260 | 05833 (+17), 05034 (+14), 05081 (+12) | 1.00 |
| Medical equipment & supplies | 0.99 | 0 of 260 | 05141 (+8), 05034 (+6), 05081 (+6) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 260 | 05034 (+16), 05736 (+12), 05081 (+11) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 260 | 05404 (+2), 05050 (+1), 05081 (+1) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 260 | 05736 (+14), 05902 (+10), 05101 (+8) | 1.00 |
| General surgery | 1.00 | 0 of 260 | 05081 (+8), 05034 (+6), 05141 (+6) | 1.00 |
| Infectious disease | 1.00 | 0 of 260 | 05034 (+4), 05141 (+4), 05676 (+3) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 260 | 05478 (+3), 05676 (+3), 05445 (+2) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 260 | 05081 (+7), 05034 (+4), 05141 (+4) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 5 of 260 | 10,050 (1.9%) |  | 4/18 | 1/148 | 0/82 | 0/12 |
| Women's health / OB-GYN | 016 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Mental health & counseling: Psychiatry | 029 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Mental health & counseling: Clinical Social Work | 037 | 1 of 260 | 3,575 (0.7%) |  | 1/18 | 0/148 | 0/82 | 0/12 |
| Eye care | 023 | 3 of 260 | 4,441 (0.8%) |  | 2/18 | 1/148 | 0/82 | 0/12 |
| Chiropractic | 010 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Physical & occupational therapy | F049 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Orthopedics & sports injury | 025 | 2 of 260 | 6,249 (1.2%) |  | 2/18 | 0/148 | 0/82 | 0/12 |
| Heart / cardiology | 008 | 13 of 260 | 13,148 (2.5%) |  | 2/18 | 11/148 | 0/82 | 0/12 |
| Skin / dermatology | 011 | 2 of 260 | 2,716 (0.5%) |  | 0/18 | 2/148 | 0/82 | 0/12 |
| Allergy & immunology | 007 | 20 of 260 | 18,696 (3.6%) |  | 1/18 | 13/148 | 2/82 | 4/12 |
| Lung, breathing & sleep | 030 | 2 of 260 | 2,716 (0.5%) |  | 0/18 | 2/148 | 0/82 | 0/12 |
| Digestive / gastroenterology | 014 | 3 of 260 | 3,051 (0.6%) |  | 0/18 | 3/148 | 0/82 | 0/12 |
| Kidney / nephrology | 018 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Diabetes & hormones | 012 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Cancer care / oncology | 021 | 2 of 260 | 2,070 (0.4%) |  | 0/18 | 2/148 | 0/82 | 0/12 |
| Arthritis / rheumatology | 031 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Brain & nerves / neurology | 019 | 1 of 260 | 308 (0.1%) |  | 0/18 | 1/148 | 0/82 | 0/12 |
| Ear, nose & throat | 013 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Urology | 033 | 1 of 260 | 308 (0.1%) |  | 0/18 | 1/148 | 0/82 | 0/12 |
| Foot & ankle / podiatry | 028 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Plastic & reconstructive surgery | 027 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Speech & language therapy | F051 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Imaging & lab | F047 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| Nursing & assisted living | F046 | 0 of 260 | 0 (0.0%) |  | 0/18 | 0/148 | 0/82 | 0/12 |
| General surgery | 015 | 8 of 260 | 7,397 (1.4%) |  | 2/18 | 6/148 | 0/82 | 0/12 |
| Infectious disease | 017 | 17 of 260 | 17,600 (3.4%) |  | 0/18 | 0/148 | 12/82 | 5/12 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 10400 rows (ZIP x specialty) stored in access_e2sfca for VT; market-score now uses drive-time access for these ZIPs.
