# E2SFCA access dry run: Utah

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 488; in Utah: 291
- Drive times: OSRM on OpenStreetMap roads (car profile), 488 x 488 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 125,002.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.31 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.77), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 12,580.8 | 4.30 | 0.62 | 99 of 291 | 84022 (-71), 84028 (-66), 84759 (-52) | 84512 (+67), 84745 (+58), 84656 (+54) |
| Pediatrics (children) | 30 | 3,093.4 | 1.11 | 0.76 | 82 of 291 | 84744 (-66), 84732 (-65), 84047 (-44) | 84775 (+50), 84010 (+47), 84773 (+43) |
| Women's health / OB-GYN | 60 | 1,568.6 | 0.53 | 0.72 | 98 of 291 | 84774 (-44), 84334 (-32), 84044 (-31) | 84022 (+84), 84060 (+62), 84333 (+58) |
| Mental health & counseling | 30 | 29,028 | 7.20 | 0.79 | 110 of 291 | 84732 (-56), 84744 (-56), 84302 (-24) | 84630 (+83), 84639 (+77), 84728 (+74) |
| Dental | 30 | 5,510.8 | 1.65 | 0.67 | 103 of 291 | 84784 (-44), 84723 (-41), 84656 (-40) | 84512 (+82), 84712 (+71), 84638 (+68) |
| Eye care | 30 | 1,734.2 | 0.62 | 0.65 | 101 of 291 | 84759 (-58), 84302 (-25), 84701 (-22) | 84764 (+87), 84776 (+87), 84762 (+79) |
| Chiropractic | 30 | 2,138 | 0.63 | 0.72 | 104 of 291 | 84601 (-21), 84060 (-19), 84330 (-18) | 84733 (+97), 84782 (+84), 84338 (+76) |
| Physical & occupational therapy | 30 | 7,509 | 2.70 | 0.70 | 95 of 291 | 84781 (-48), 84722 (-40), 84759 (-37) | 84080 (+62), 84024 (+58), 84055 (+58) |
| Orthopedics & sports injury | 60 | 1,633.8 | 0.39 | 0.79 | 128 of 291 | 84774 (-79), 84037 (-57), 84044 (-51) | 84055 (+81), 84719 (+70), 84082 (+69) |
| Heart / cardiology | 60 | 494.6 | 0.24 | 0.83 | 61 of 291 | 84774 (-44), 84757 (-30), 84014 (-29) | 84098 (+70), 84087 (+53), 84010 (+48) |
| Skin / dermatology | 60 | 279.4 | 0.09 | 0.72 | 123 of 291 | 84774 (-80), 84652 (-62), 84757 (-58) | 84631 (+100), 84637 (+100), 84644 (+100) |
| Allergy & immunology | 60 | 71.4 | 0.03 | 0.85 | 67 of 291 | 84044 (-32), 84014 (-31), 84037 (-31) | 84098 (+66), 84310 (+62), 84333 (+62) |
| Lung, breathing & sleep | 60 | 311.4 | 0.13 | 0.83 | 48 of 291 | 84774 (-29), 84037 (-26), 84044 (-24) | 84098 (+62), 84530 (+45), 84656 (+45) |
| Digestive / gastroenterology | 60 | 237.2 | 0.11 | 0.88 | 71 of 291 | 84304 (-32), 84327 (-32), 84025 (-31) | 84060 (+73), 84333 (+67), 84098 (+63) |
| Kidney / nephrology | 60 | 240 | 0.11 | 0.77 | 77 of 291 | 84024 (-40), 84033 (-39), 84512 (-35) | 84051 (+79), 84073 (+78), 84002 (+71) |
| Diabetes & hormones | 60 | 166.2 | 0.06 | 0.78 | 117 of 291 | 84652 (-72), 84621 (-66), 84035 (-63) | 84631 (+100), 84637 (+100), 84644 (+100) |
| Cancer care / oncology | 90 | 362.2 | 0.15 | 0.84 | 81 of 291 | 84014 (-47), 84044 (-45), 84065 (-41) | 84098 (+52), 84111 (+52), 84101 (+51) |
| Arthritis / rheumatology | 60 | 78.4 | 0.04 | 0.81 | 94 of 291 | 84014 (-48), 84043 (-42), 84020 (-38) | 84781 (+91), 84098 (+72), 84333 (+57) |
| Brain & nerves / neurology | 60 | 476.8 | 0.22 | 0.85 | 77 of 291 | 84044 (-38), 84065 (-32), 84020 (-30) | 84316 (+83), 84306 (+80), 84311 (+79) |
| Ear, nose & throat | 60 | 207.6 | 0.07 | 0.78 | 118 of 291 | 84024 (-100), 84033 (-100), 84064 (-79) | 84333 (+60), 84069 (+59), 84051 (+54) |
| Urology | 60 | 154 | 0.07 | 0.81 | 94 of 291 | 84774 (-35), 84047 (-34), 84070 (-33) | 84098 (+66), 84010 (+55), 84087 (+52) |
| Foot & ankle / podiatry | 60 | 492.4 | 0.15 | 0.71 | 114 of 291 | 84723 (-76), 84740 (-65), 84774 (-63) | 84512 (+100), 84762 (+78), 84055 (+57) |
| Pain management | 60 | 225.8 | 0.09 | 0.83 | 92 of 291 | 84774 (-53), 84722 (-46), 84324 (-35) | 84082 (+58), 84656 (+56), 84539 (+55) |
| Plastic & reconstructive surgery | 90 | 188.8 | 0.07 | 0.86 | 131 of 291 | 84513 (-47), 84537 (-44), 84516 (-38) | 84333 (+79), 84086 (+60), 84111 (+47) |
| Speech & language therapy | 30 | 1,812.2 | 0.90 | 0.73 | 60 of 291 | 84784 (-73), 84648 (-27), 84645 (-17) | 84080 (+63), 84626 (+49), 84633 (+47) |
| Nutrition & dietitian | 30 | 1,056.8 | 0.33 | 0.72 | 108 of 291 | 84779 (-93), 84763 (-88), 84767 (-88) | 84764 (+100), 84776 (+100), 84512 (+95) |
| Acupuncture, massage & naturopathy | 30 | 1,399 | 0.52 | 0.75 | 64 of 291 | 84763 (-28), 84767 (-22), 84716 (-21) | 84530 (+100), 84536 (+100), 84726 (+94) |
| Urgent care & emergency | 30 | 1,412.4 | 0.47 | 0.51 | 96 of 291 | 84763 (-79), 84767 (-78), 84719 (-56) | 84086 (+100), 84512 (+100), 84520 (+100) |
| Imaging & lab | 60 | 1,296.4 | 0.49 | 0.81 | 81 of 291 | 84774 (-41), 84020 (-32), 84043 (-31) | 84098 (+61), 84534 (+56), 84512 (+53) |
| Pharmacy | 30 | 4,580.4 | 1.72 | 0.59 | 97 of 291 | 84759 (-60), 84725 (-31), 84028 (-24) | 84512 (+100), 84764 (+62), 84776 (+62) |
| Home health & in-home care | 30 | 8,637.2 | 1.61 | 0.64 | 23 of 291 | 84656 (-38), 84086 (-34), 84636 (-34) | 84535 (+35), 84716 (+25), 84733 (+25) |
| Nursing & assisted living | 60 | 1,195.6 | 0.39 | 0.71 | 71 of 291 | 84744 (-45), 84064 (-30), 84330 (-27) | 84539 (+62), 84520 (+56), 84628 (+51) |
| Medical equipment & supplies | 60 | 1,011.6 | 0.36 | 0.76 | 94 of 291 | 84774 (-50), 84652 (-45), 84064 (-42) | 84631 (+69), 84644 (+47), 84637 (+45) |
| Hearing & audiology | 60 | 751.6 | 0.19 | 0.80 | 113 of 291 | 84774 (-82), 84064 (-66), 84757 (-49) | 84316 (+77), 84098 (+60), 84310 (+57) |
| Behavior therapy (ABA) | 30 | 14,061.8 | 2.88 | 0.85 | 63 of 291 | 84660 (-41), 84302 (-40), 84340 (-38) | 84018 (+100), 84317 (+100), 84719 (+100) |
| Care coordination & community health | 30 | 13,003.2 | 1.63 | 0.70 | 113 of 291 | 84014 (-73), 84074 (-68), 84022 (-66) | 84086 (+100), 84520 (+100), 84530 (+100) |
| General surgery | 60 | 845 | 0.35 | 0.77 | 77 of 291 | 84033 (-47), 84064 (-40), 84774 (-30) | 84060 (+73), 84098 (+65), 84539 (+47) |
| Infectious disease | 90 | 76.4 | 0.05 | 0.78 | 61 of 291 | 84536 (-58), 84025 (-31), 84037 (-30) | 84098 (+70), 84010 (+68), 84087 (+67) |
| Genetics & genetic counseling | 90 | 125 | 0.03 | 0.84 | 80 of 291 | 84065 (-96), 84025 (-92), 84096 (-91) | 84719 (+26), 84760 (+24), 84761 (+22) |
| Hospice & palliative care | 60 | 322.6 | 0.09 | 0.80 | 100 of 291 | 84722 (-73), 84304 (-55), 84327 (-53) | 84723 (+100), 84740 (+100), 84743 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Utah in households with no vehicle: about 90,428 of 2,323,037 (3.9%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 4
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 0 of 291 | 84111 (+13), 84101 (+10), 84102 (+6) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 291 | 84116 (+4), 84026 (+3), 84047 (+3) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 291 | 84111 (+13), 84101 (+9), 84102 (+5) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 291 | 84111 (+16), 84102 (+8), 84116 (+6) | 1.00 |
| Dental | 1.00 | 0 of 291 | 84111 (+12), 84101 (+9), 84026 (+4) | 1.00 |
| Eye care | 1.00 | 0 of 291 | 84111 (+8), 84101 (+7), 84766 (+4) | 1.00 |
| Chiropractic | 1.00 | 0 of 291 | 84111 (+10), 84101 (+8), 84026 (+5) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 291 | 84111 (+13), 84101 (+9), 84102 (+6) | 1.00 |
| Orthopedics & sports injury | 1.00 | 1 of 291 | 84111 (+17), 84102 (+10), 84026 (+4) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 291 | 84111 (+10), 84101 (+7), 84102 (+4) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 291 | 84111 (+15), 84101 (+10), 84766 (+8) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 291 | 84111 (+11), 84101 (+9), 84102 (+5) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 291 | 84111 (+10), 84101 (+7), 84102 (+5) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 291 | 84111 (+11), 84101 (+8), 84102 (+4) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 291 | 84026 (+9), 84076 (+9), 84111 (+9) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 291 | 84111 (+14), 84101 (+11), 84766 (+9) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 291 | 84101 (+7), 84111 (+7), 84115 (+4) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 291 | 84111 (+10), 84101 (+8), 84076 (+4) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 291 | 84111 (+12), 84101 (+9), 84116 (+5) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 291 | 84111 (+16), 84101 (+12), 84521 (+7) | 1.00 |
| Urology | 1.00 | 0 of 291 | 84111 (+10), 84101 (+7), 84076 (+4) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 291 | 84111 (+13), 84101 (+9), 84630 (+8) | 1.00 |
| Pain management | 1.00 | 0 of 291 | 84111 (+11), 84101 (+8), 84102 (+5) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 291 | 84111 (+13), 84101 (+9), 84102 (+6) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 291 | 84111 (+10), 84101 (+7), 84102 (+5) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 291 | 84111 (+17), 84101 (+12), 84102 (+8) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 291 | 84111 (+10), 84101 (+7), 84102 (+4) | 1.00 |
| Urgent care & emergency | 1.00 | 0 of 291 | 84111 (+14), 84101 (+11), 84026 (+8) | 1.00 |
| Imaging & lab | 1.00 | 0 of 291 | 84111 (+12), 84101 (+8), 84102 (+5) | 1.00 |
| Pharmacy | 1.00 | 0 of 291 | 84111 (+10), 84101 (+8), 84630 (+6) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 291 | 84111 (+3), 84630 (+3), 84101 (+2) | 1.00 |
| Nursing & assisted living | 1.00 | 0 of 291 | 84111 (+9), 84076 (+6), 84101 (+6) | 1.00 |
| Medical equipment & supplies | 1.00 | 0 of 291 | 84111 (+11), 84101 (+8), 84766 (+8) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 291 | 84111 (+15), 84101 (+11), 84102 (+7) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 291 | 84766 (+6), 84401 (+3), 84730 (+3) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 291 | 84026 (+9), 84052 (+4), 84750 (+4) | 1.00 |
| General surgery | 1.00 | 0 of 291 | 84111 (+9), 84101 (+7), 84026 (+4) | 1.00 |
| Infectious disease | 1.00 | 0 of 291 | 84111 (+5), 84101 (+4), 84047 (+2) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 291 | 84401 (+3), 84111 (+2), 84403 (+2) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 291 | 84111 (+17), 84101 (+12), 84630 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 11 of 291 | 4,709 (0.2%) | 1/39 | 5/82 | 4/35 | 0/46 | 1/89 |
| Women's health / OB-GYN | 016 | 7 of 291 | 1,510 (0.1%) | 0/39 | 0/82 | 4/35 | 0/46 | 3/89 |
| Mental health & counseling: Psychiatry | 029 | 17 of 291 | 7,508 (0.3%) | 0/39 | 5/82 | 6/35 | 0/46 | 6/89 |
| Mental health & counseling: Clinical Psychology | 036 | 6 of 291 | 1,592 (0.1%) | 0/39 | 0/82 | 5/35 | 0/46 | 1/89 |
| Mental health & counseling: Clinical Social Work | 037 | 9 of 291 | 2,550 (0.1%) | 0/39 | 3/82 | 5/35 | 0/46 | 1/89 |
| Eye care | 023 | 14 of 291 | 5,265 (0.2%) | 0/39 | 6/82 | 5/35 | 0/46 | 3/89 |
| Chiropractic | 010 | 10 of 291 | 4,084 (0.2%) | 0/39 | 2/82 | 4/35 | 0/46 | 4/89 |
| Physical & occupational therapy | F049 | 6 of 291 | 852 (0.0%) | 0/39 | 0/82 | 3/35 | 0/46 | 3/89 |
| Orthopedics & sports injury | 025 | 16 of 291 | 4,174 (0.2%) | 0/39 | 4/82 | 4/35 | 0/46 | 8/89 |
| Heart / cardiology | 008 | 62 of 291 | 55,020 (2.4%) | 0/39 | 13/82 | 10/35 | 9/46 | 30/89 |
| Skin / dermatology | 011 | 37 of 291 | 39,557 (1.7%) | 0/39 | 5/82 | 6/35 | 5/46 | 21/89 |
| Allergy & immunology | 007 | 46 of 291 | 40,520 (1.7%) | 0/39 | 5/82 | 5/35 | 5/46 | 31/89 |
| Lung, breathing & sleep | 030 | 15 of 291 | 10,429 (0.4%) | 0/39 | 5/82 | 5/35 | 0/46 | 5/89 |
| Digestive / gastroenterology | 014 | 51 of 291 | 49,814 (2.1%) | 0/39 | 5/82 | 7/35 | 5/46 | 34/89 |
| Kidney / nephrology | 018 | 9 of 291 | 3,935 (0.2%) | 0/39 | 2/82 | 4/35 | 0/46 | 3/89 |
| Diabetes & hormones | 012 | 7 of 291 | 1,939 (0.1%) | 0/39 | 1/82 | 4/35 | 0/46 | 2/89 |
| Cancer care / oncology | 021 | 56 of 291 | 48,026 (2.1%) | 0/39 | 5/82 | 7/35 | 22/46 | 22/89 |
| Arthritis / rheumatology | 031 | 39 of 291 | 47,514 (2.0%) | 0/39 | 1/82 | 5/35 | 5/46 | 28/89 |
| Brain & nerves / neurology | 019 | 25 of 291 | 19,234 (0.8%) | 0/39 | 2/82 | 12/35 | 0/46 | 11/89 |
| Ear, nose & throat | 013 | 41 of 291 | 40,878 (1.8%) | 0/39 | 5/82 | 4/35 | 17/46 | 15/89 |
| Urology | 033 | 77 of 291 | 72,670 (3.1%) | 0/39 | 5/82 | 12/35 | 20/46 | 40/89 |
| Foot & ankle / podiatry | 028 | 14 of 291 | 5,179 (0.2%) | 0/39 | 5/82 | 5/35 | 0/46 | 4/89 |
| Plastic & reconstructive surgery | 027 | 19 of 291 | 11,250 (0.5%) | 0/39 | 2/82 | 4/35 | 2/46 | 11/89 |
| Speech & language therapy | F051 | 13 of 291 | 4,719 (0.2%) | 0/39 | 2/82 | 4/35 | 0/46 | 7/89 |
| Imaging & lab | F047 | 13 of 291 | 4,719 (0.2%) | 0/39 | 2/82 | 4/35 | 0/46 | 7/89 |
| Nursing & assisted living | F046 | 7 of 291 | 2,910 (0.1%) | 0/39 | 2/82 | 4/35 | 0/46 | 1/89 |
| General surgery | 015 | 20 of 291 | 7,920 (0.3%) | 0/39 | 8/82 | 6/35 | 0/46 | 6/89 |
| Infectious disease | 017 | 34 of 291 | 32,530 (1.4%) | 0/39 | 1/82 | 5/35 | 6/46 | 22/89 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 11640 rows (ZIP x specialty) stored in access_e2sfca for UT; market-score now uses drive-time access for these ZIPs.
