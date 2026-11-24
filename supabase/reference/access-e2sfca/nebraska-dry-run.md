# E2SFCA access dry run: Nebraska

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,609; in Nebraska: 582
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,609 x 1,609 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 252,666.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.22 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.56), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 80022 | no | 7.91 | 100% | 2.43 | 100% | yes (1.13) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 25,224 | 4.30 | 0.56 | 220 of 582 | 68431 (-51), 68825 (-50), 68821 (-48) | 69041 (+100), 69216 (+78), 69030 (+74) |
| Pediatrics (children) | 30 | 6,797.6 | 1.11 | 0.73 | 182 of 582 | 68423 (-41), 69365 (-36), 68761 (-30) | 68735 (+83), 69220 (+83), 68732 (+80) |
| Women's health / OB-GYN | 60 | 3,501.4 | 0.53 | 0.74 | 132 of 582 | 69347 (-67), 68366 (-55), 68304 (-51) | 68430 (+47), 69343 (+45), 68064 (+41) |
| Mental health & counseling | 30 | 49,295.2 | 7.20 | 0.77 | 148 of 582 | 69218 (-61), 68763 (-32), 68734 (-29) | 68725 (+88), 68831 (+65), 68430 (+59) |
| Dental | 30 | 11,058.6 | 1.65 | 0.59 | 204 of 582 | 69021 (-49), 68423 (-41), 69339 (-40) | 69220 (+95), 69346 (+95), 68879 (+90) |
| Eye care | 30 | 4,092.8 | 0.62 | 0.58 | 268 of 582 | 69045 (-59), 69027 (-55), 68041 (-42) | 68778 (+100), 69044 (+99), 68831 (+90) |
| Chiropractic | 30 | 5,744.6 | 0.63 | 0.60 | 284 of 582 | 68423 (-80), 69154 (-50), 69343 (-48) | 68637 (+100), 68711 (+100), 68725 (+100) |
| Physical & occupational therapy | 30 | 18,566.6 | 2.70 | 0.62 | 256 of 582 | 68759 (-69), 68724 (-63), 68783 (-61) | 69030 (+99), 68828 (+88), 68874 (+87) |
| Orthopedics & sports injury | 60 | 2,515 | 0.39 | 0.73 | 266 of 582 | 68858 (-100), 68844 (-78), 68852 (-77) | 68031 (+71), 68416 (+69), 68444 (+65) |
| Heart / cardiology | 60 | 1,153.6 | 0.24 | 0.71 | 186 of 582 | 68858 (-52), 68003 (-50), 68366 (-50) | 68452 (+79), 68964 (+79), 68335 (+78) |
| Skin / dermatology | 60 | 469.6 | 0.09 | 0.71 | 124 of 582 | 68366 (-59), 68304 (-56), 68407 (-47) | 68785 (+89), 68770 (+86), 68438 (+53) |
| Allergy & immunology | 60 | 172.2 | 0.03 | 0.68 | 105 of 582 | 69021 (-64), 68003 (-63), 68059 (-61) | 68785 (+75), 68770 (+73), 68418 (+68) |
| Lung, breathing & sleep | 60 | 678.2 | 0.13 | 0.70 | 145 of 582 | 68003 (-55), 68366 (-54), 68462 (-54) | 68831 (+74), 69343 (+66), 68317 (+57) |
| Digestive / gastroenterology | 60 | 565.4 | 0.11 | 0.65 | 117 of 582 | 68003 (-52), 68059 (-52), 68366 (-49) | 68785 (+84), 68770 (+79), 68741 (+72) |
| Kidney / nephrology | 60 | 548.4 | 0.11 | 0.69 | 245 of 582 | 68755 (-65), 68337 (-53), 68777 (-49) | 68785 (+67), 68345 (+66), 69220 (+63) |
| Diabetes & hormones | 60 | 313.6 | 0.06 | 0.71 | 210 of 582 | 68777 (-73), 68003 (-57), 68028 (-54) | 68746 (+100), 68719 (+99), 68429 (+65) |
| Cancer care / oncology | 90 | 919.4 | 0.15 | 0.55 | 339 of 582 | 69145 (-83), 69133 (-77), 69336 (-77) | 69032 (+69), 68372 (+67), 68438 (+67) |
| Arthritis / rheumatology | 60 | 189.6 | 0.04 | 0.65 | 127 of 582 | 69163 (-76), 69155 (-75), 68462 (-58) | 68785 (+67), 68438 (+54), 68372 (+51) |
| Brain & nerves / neurology | 60 | 1,625.6 | 0.22 | 0.76 | 107 of 582 | 68003 (-50), 68366 (-45), 68462 (-43) | 68770 (+85), 68785 (+85), 68741 (+61) |
| Ear, nose & throat | 60 | 431.2 | 0.07 | 0.65 | 273 of 582 | 68792 (-87), 68739 (-86), 68749 (-86) | 68831 (+69), 68785 (+66), 69132 (+60) |
| Urology | 60 | 371 | 0.07 | 0.73 | 256 of 582 | 69336 (-73), 69038 (-63), 69133 (-61) | 68831 (+76), 68438 (+73), 68429 (+72) |
| Foot & ankle / podiatry | 60 | 615.2 | 0.15 | 0.69 | 209 of 582 | 68780 (-89), 68764 (-62), 68726 (-57) | 68952 (+71), 68970 (+68), 68932 (+63) |
| Pain management | 60 | 386.6 | 0.09 | 0.72 | 188 of 582 | 68003 (-53), 68869 (-49), 68366 (-48) | 68785 (+73), 68770 (+68), 68831 (+68) |
| Plastic & reconstructive surgery | 90 | 293.4 | 0.07 | 0.58 | 141 of 582 | 68003 (-37), 68041 (-36), 68366 (-36) | 68785 (+83), 69133 (+82), 69128 (+76) |
| Speech & language therapy | 30 | 6,277.2 | 0.90 | 0.70 | 262 of 582 | 68423 (-40), 69142 (-38), 68777 (-35) | 68714 (+100), 68778 (+100), 69147 (+100) |
| Nutrition & dietitian | 30 | 2,220.8 | 0.33 | 0.71 | 202 of 582 | 68714 (-62), 69165 (-47), 68431 (-42) | 69030 (+100), 69041 (+100), 69166 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,292.4 | 0.52 | 0.82 | 34 of 582 | 69144 (-38), 69039 (-31), 68970 (-30) | 69121 (+80), 68785 (+31), 69354 (+30) |
| Urgent care & emergency | 30 | 3,069.4 | 0.47 | 0.60 | 213 of 582 | 68719 (-64), 68030 (-63), 68746 (-50) | 68725 (+100), 68735 (+100), 68753 (+100) |
| Imaging & lab | 60 | 2,618 | 0.49 | 0.71 | 180 of 582 | 68003 (-48), 68366 (-46), 68304 (-43) | 69121 (+78), 68831 (+76), 68785 (+67) |
| Pharmacy | 30 | 9,798.4 | 1.72 | 0.63 | 229 of 582 | 68325 (-42), 68020 (-36), 68337 (-35) | 69216 (+100), 69212 (+78), 68831 (+73) |
| Home health & in-home care | 30 | 40,511 | 1.61 | 0.33 | 65 of 582 | 68746 (-47), 68792 (-43), 68719 (-42) | 68759 (+100), 69041 (+100), 69135 (+100) |
| Nursing & assisted living | 60 | 3,867.6 | 0.39 | 0.40 | 148 of 582 | 68833 (-100), 68071 (-70), 68065 (-68) | 68753 (+83), 69121 (+82), 68040 (+61) |
| Medical equipment & supplies | 60 | 1,969.6 | 0.36 | 0.67 | 232 of 582 | 68366 (-55), 68858 (-55), 69027 (-54) | 68785 (+79), 68031 (+67), 68072 (+58) |
| Hearing & audiology | 60 | 1,443.6 | 0.19 | 0.71 | 297 of 582 | 68869 (-73), 68858 (-70), 69038 (-68) | 68424 (+76), 68458 (+72), 68031 (+71) |
| Behavior therapy (ABA) | 30 | 14,798.4 | 2.88 | 0.88 | 30 of 582 | 68041 (-13), 68942 (-10), 68023 (-9) | 68037 (+55), 68959 (+51), 68418 (+47) |
| Care coordination & community health | 30 | 8,870 | 1.63 | 0.75 | 107 of 582 | 69128 (-33), 68822 (-32), 68462 (-22) | 68725 (+100), 69132 (+100), 69165 (+100) |
| General surgery | 60 | 2,256.8 | 0.35 | 0.71 | 192 of 582 | 68003 (-62), 68366 (-60), 68304 (-57) | 68785 (+72), 68741 (+65), 68770 (+65) |
| Infectious disease | 90 | 269.4 | 0.05 | 0.59 | 167 of 582 | 68059 (-43), 68003 (-42), 68366 (-41) | 68317 (+72), 68419 (+54), 68430 (+51) |
| Genetics & genetic counseling | 90 | 235.8 | 0.03 | 0.63 | 123 of 582 | 68059 (-73), 68003 (-66), 68403 (-65) | 68317 (+55), 68430 (+47), 68152 (+40) |
| Hospice & palliative care | 60 | 530 | 0.09 | 0.71 | 306 of 582 | 69038 (-100), 69163 (-90), 68929 (-84) | 68040 (+79), 68070 (+73), 68458 (+67) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Nebraska in households with no vehicle: about 80,624 of 1,476,762 (5.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 2
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 0 of 582 | 68508 (+11), 69037 (+11), 68960 (+9) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 582 | 68178 (+10), 68508 (+10), 68111 (+8) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 582 | 68508 (+8), 68178 (+6), 68111 (+5) | 1.00 |
| Mental health & counseling | 1.00 | 0 of 582 | 68508 (+14), 68178 (+9), 68111 (+7) | 1.00 |
| Dental | 1.00 | 0 of 582 | 68508 (+10), 69037 (+10), 68178 (+8) | 1.00 |
| Eye care | 1.00 | 0 of 582 | 68508 (+14), 68178 (+9), 68111 (+7) | 1.00 |
| Chiropractic | 1.00 | 1 of 582 | 68508 (+20), 68178 (+9), 68111 (+7) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 582 | 68508 (+14), 68178 (+10), 68111 (+7) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 582 | 68508 (+12), 68111 (+8), 68178 (+8) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 582 | 68508 (+9), 68934 (+6), 68178 (+5) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 582 | 68508 (+10), 68111 (+5), 68178 (+5) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 582 | 68508 (+9), 68111 (+6), 68178 (+5) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 582 | 68508 (+8), 68111 (+5), 68178 (+5) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 582 | 68178 (+6), 68111 (+5), 68110 (+4) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 582 | 69220 (+30), 69212 (+8), 68508 (+6) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 582 | 68508 (+9), 68111 (+7), 69212 (+7) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 582 | 68508 (+9), 69130 (+5), 68178 (+4) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 582 | 68508 (+11), 68111 (+4), 68178 (+4) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 582 | 68111 (+6), 68178 (+5), 68110 (+4) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 582 | 68508 (+14), 68178 (+7), 68111 (+6) | 1.00 |
| Urology | 1.00 | 0 of 582 | 68111 (+6), 68178 (+6), 68508 (+6) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 582 | 68508 (+7), 68742 (+7), 68934 (+6) | 1.00 |
| Pain management | 1.00 | 0 of 582 | 68111 (+6), 68178 (+6), 68508 (+6) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 582 | 68508 (+5), 68111 (+4), 68178 (+4) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 582 | 68508 (+15), 68178 (+10), 68934 (+10) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 582 | 69037 (+13), 68508 (+12), 68178 (+8) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 582 | 68508 (+4), 68108 (+2), 68114 (+2) | 1.00 |
| Urgent care & emergency | 1.00 | 0 of 582 | 68178 (+6), 68508 (+6), 69148 (+5) | 1.00 |
| Imaging & lab | 1.00 | 0 of 582 | 68508 (+8), 68178 (+5), 68934 (+5) | 1.00 |
| Pharmacy | 1.00 | 0 of 582 | 68508 (+11), 68178 (+10), 68111 (+7) | 1.00 |
| Home health & in-home care | 0.98 | 1 of 582 | 68934 (+25), 68429 (+9), 69220 (+6) | 0.99 |
| Nursing & assisted living | 0.96 | 3 of 582 | 68934 (+27), 68508 (+19), 69220 (+16) | 0.99 |
| Medical equipment & supplies | 1.00 | 1 of 582 | 69220 (+18), 68508 (+10), 68178 (+7) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 582 | 69220 (+17), 68508 (+10), 68111 (+8) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 582 | 68110 (+8), 68152 (+7), 68508 (+6) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 582 | 68508 (+11), 68111 (+6), 68178 (+6) | 1.00 |
| General surgery | 1.00 | 1 of 582 | 69220 (+19), 68508 (+9), 68111 (+6) | 1.00 |
| Infectious disease | 1.00 | 0 of 582 | 68508 (+7), 68111 (+4), 68110 (+3) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 582 | 68508 (+9), 68111 (+6), 68152 (+6) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 582 | 68111 (+7), 68178 (+7), 68960 (+7) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 3 of 582 | 2,923 (0.2%) | 0/34 | 3/54 | 0/52 | 0/232 | 0/210 |
| Women's health / OB-GYN | 016 | 5 of 582 | 851 (0.1%) | 0/34 | 0/54 | 0/52 | 0/232 | 5/210 |
| Mental health & counseling: Psychiatry | 029 | 28 of 582 | 17,433 (1.2%) | 0/34 | 0/54 | 0/52 | 13/232 | 15/210 |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Eye care | 023 | 1 of 582 | 79 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 1/210 |
| Chiropractic | 010 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Physical & occupational therapy | F049 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Orthopedics & sports injury | 025 | 3 of 582 | 463 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 3/210 |
| Heart / cardiology | 008 | 45 of 582 | 25,454 (1.7%) | 0/34 | 0/54 | 0/52 | 9/232 | 36/210 |
| Skin / dermatology | 011 | 61 of 582 | 41,360 (2.8%) | 0/34 | 0/54 | 0/52 | 28/232 | 33/210 |
| Allergy & immunology | 007 | 224 of 582 | 319,713 (21.6%) | 0/34 | 6/54 | 31/52 | 62/232 | 125/210 |
| Lung, breathing & sleep | 030 | 33 of 582 | 17,209 (1.2%) | 1/34 | 0/54 | 0/52 | 7/232 | 25/210 |
| Digestive / gastroenterology | 014 | 113 of 582 | 161,376 (10.9%) | 0/34 | 5/54 | 4/52 | 48/232 | 56/210 |
| Kidney / nephrology | 018 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Diabetes & hormones | 012 | 10 of 582 | 4,557 (0.3%) | 0/34 | 0/54 | 0/52 | 0/232 | 10/210 |
| Cancer care / oncology | 021 | 18 of 582 | 16,189 (1.1%) | 0/34 | 0/54 | 0/52 | 6/232 | 12/210 |
| Arthritis / rheumatology | 031 | 22 of 582 | 23,280 (1.6%) | 0/34 | 0/54 | 0/52 | 1/232 | 21/210 |
| Brain & nerves / neurology | 019 | 35 of 582 | 23,515 (1.6%) | 0/34 | 0/54 | 1/52 | 17/232 | 17/210 |
| Ear, nose & throat | 013 | 35 of 582 | 18,310 (1.2%) | 0/34 | 0/54 | 0/52 | 8/232 | 27/210 |
| Urology | 033 | 32 of 582 | 16,183 (1.1%) | 0/34 | 0/54 | 1/52 | 5/232 | 26/210 |
| Foot & ankle / podiatry | 028 | 12 of 582 | 5,842 (0.4%) | 0/34 | 0/54 | 0/52 | 8/232 | 4/210 |
| Plastic & reconstructive surgery | 027 | 51 of 582 | 70,669 (4.8%) | 0/34 | 2/54 | 0/52 | 5/232 | 44/210 |
| Speech & language therapy | F051 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| Imaging & lab | F047 | 1 of 582 | 320 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 1/210 |
| Nursing & assisted living | F046 | 0 of 582 | 0 (0.0%) | 0/34 | 0/54 | 0/52 | 0/232 | 0/210 |
| General surgery | 015 | 7 of 582 | 1,036 (0.1%) | 0/34 | 0/54 | 0/52 | 0/232 | 7/210 |
| Infectious disease | 017 | 13 of 582 | 10,708 (0.7%) | 0/34 | 0/54 | 0/52 | 0/232 | 13/210 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 23280 rows (ZIP x specialty) stored in access_e2sfca for NE; market-score now uses drive-time access for these ZIPs.
