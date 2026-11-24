# E2SFCA access dry run: Maine

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 952; in Maine: 418
- Drive times: OSRM on OpenStreetMap roads (car profile), 952 x 952 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 252,742.801; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.96 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.40), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 11; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 7 (04017, 04019, 04548, 04848, 04851, 04853, 04863)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 04017 | yes | 19.97 | 100% | 7.45 | 100% | yes (1.69) |
| 04019 | yes | 14.31 | 100% | 18.01 | 100% | no |
| 04050 | yes | 11.17 | 100% | 5.69 | 100% | yes (1.98) |
| 04109 | yes | 7.53 | 100% | 3.66 | 100% | yes (1.70) |
| 04548 | yes | 9.05 | 100% | 9.05 | 100% | no |
| 04568 | yes | 10.71 | 100% | 4.17 | 100% | yes (1.34) |
| 04848 | yes | 10.13 | 100% | 10.13 | 100% | no |
| 04851 | yes | 9.04 | 100% | 9.04 | 100% | no |
| 04853 | yes | 17.26 | 100% | 17.26 | 100% | no |
| 04863 | yes | 12.29 | 100% | 12.29 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 30,436.401 | 4.30 | 0.52 | 222 of 411 | 04765 (-49), 04068 (-44), 04657 (-44) | 04050 (+96), 04108 (+90), 04461 (+86) |
| Pediatrics (children) | 30 | 14,047.2 | 1.11 | 0.71 | 120 of 411 | 04418 (-42), 04605 (-32), 04619 (-30) | 04050 (+99), 04108 (+93), 04231 (+82) |
| Women's health / OB-GYN | 60 | 4,049.2 | 0.53 | 0.56 | 207 of 411 | 04416 (-63), 04472 (-59), 04039 (-49) | 04768 (+81), 04267 (+74), 04108 (+68) |
| Mental health & counseling | 30 | 70,284.2 | 7.20 | 0.62 | 193 of 411 | 04265 (-43), 04605 (-28), 04856 (-28) | 04766 (+97), 04657 (+95), 04050 (+93) |
| Dental | 30 | 14,554.4 | 1.65 | 0.52 | 231 of 411 | 04068 (-67), 04652 (-51), 04472 (-46) | 04050 (+99), 04108 (+95), 04461 (+84) |
| Eye care | 30 | 4,132 | 0.62 | 0.60 | 201 of 411 | 04472 (-44), 04619 (-40), 04265 (-39) | 04774 (+100), 03909 (+93), 04732 (+90) |
| Chiropractic | 30 | 3,043.8 | 0.63 | 0.62 | 189 of 411 | 04765 (-59), 04681 (-44), 04537 (-38) | 04050 (+99), 04108 (+95), 03909 (+79) |
| Physical & occupational therapy | 30 | 25,408.4 | 2.70 | 0.58 | 230 of 411 | 04970 (-59), 04265 (-49), 04673 (-47) | 04768 (+100), 04050 (+98), 04732 (+97) |
| Orthopedics & sports injury | 60 | 2,882 | 0.39 | 0.64 | 213 of 411 | 04434 (-90), 04427 (-88), 04932 (-72) | 04418 (+100), 04936 (+100), 04408 (+99) |
| Heart / cardiology | 60 | 1,742 | 0.24 | 0.62 | 147 of 411 | 04434 (-77), 04427 (-75), 04090 (-72) | 03905 (+73), 04108 (+60), 03911 (+59) |
| Skin / dermatology | 60 | 831.4 | 0.09 | 0.72 | 147 of 411 | 04090 (-47), 04572 (-42), 04348 (-41) | 03905 (+75), 03909 (+70), 03911 (+69) |
| Allergy & immunology | 60 | 245.8 | 0.03 | 0.66 | 115 of 411 | 03910 (-47), 04062 (-44), 04090 (-42) | 04050 (+72), 04003 (+71), 04341 (+70) |
| Lung, breathing & sleep | 60 | 779.2 | 0.13 | 0.71 | 160 of 411 | 04350 (-78), 04353 (-66), 04359 (-65) | 04050 (+70), 04006 (+65), 04108 (+62) |
| Digestive / gastroenterology | 60 | 861.8 | 0.11 | 0.64 | 189 of 411 | 04096 (-80), 04434 (-79), 04967 (-75) | 04108 (+57), 04562 (+57), 04050 (+56) |
| Kidney / nephrology | 60 | 529.2 | 0.11 | 0.65 | 156 of 411 | 04932 (-54), 04434 (-51), 04472 (-49) | 04050 (+75), 04064 (+65), 04108 (+61) |
| Diabetes & hormones | 60 | 581.2 | 0.06 | 0.62 | 194 of 411 | 04427 (-75), 04090 (-72), 04039 (-68) | 04626 (+84), 04652 (+77), 04485 (+73) |
| Cancer care / oncology | 90 | 1,372 | 0.15 | 0.56 | 225 of 411 | 04434 (-69), 04932 (-64), 04969 (-62) | 04768 (+72), 04355 (+70), 04363 (+69) |
| Arthritis / rheumatology | 60 | 322.2 | 0.04 | 0.66 | 140 of 411 | 04416 (-100), 04472 (-100), 04932 (-100) | 04768 (+95), 04562 (+82), 04575 (+66) |
| Brain & nerves / neurology | 60 | 1,810.6 | 0.22 | 0.73 | 150 of 411 | 04434 (-65), 04427 (-58), 04932 (-57) | 04066 (+87), 04003 (+85), 03905 (+73) |
| Ear, nose & throat | 60 | 498.2 | 0.07 | 0.69 | 194 of 411 | 04039 (-87), 04069 (-78), 04097 (-77) | 04768 (+95), 04057 (+89), 04255 (+86) |
| Urology | 60 | 516.8 | 0.07 | 0.73 | 190 of 411 | 04039 (-81), 04096 (-74), 04097 (-68) | 04768 (+98), 04562 (+84), 04966 (+78) |
| Foot & ankle / podiatry | 60 | 768.6 | 0.15 | 0.68 | 177 of 411 | 04427 (-64), 04932 (-60), 04453 (-51) | 04454 (+80), 04562 (+79), 04066 (+77) |
| Pain management | 60 | 403.2 | 0.09 | 0.76 | 171 of 411 | 04071 (-67), 04434 (-67), 04472 (-64) | 04966 (+82), 04956 (+68), 04983 (+68) |
| Plastic & reconstructive surgery | 90 | 402 | 0.07 | 0.60 | 194 of 411 | 04069 (-51), 04932 (-50), 04090 (-49) | 04267 (+73), 03905 (+67), 04108 (+67) |
| Speech & language therapy | 30 | 5,849.8 | 0.90 | 0.63 | 226 of 411 | 04451 (-66), 04041 (-62), 04441 (-44) | 04050 (+93), 04108 (+89), 04849 (+81) |
| Nutrition & dietitian | 30 | 2,981.4 | 0.33 | 0.59 | 198 of 411 | 04970 (-58), 04668 (-56), 04068 (-53) | 04003 (+100), 04050 (+98), 04108 (+90) |
| Acupuncture, massage & naturopathy | 30 | 3,575 | 0.52 | 0.72 | 191 of 411 | 04462 (-52), 04472 (-52), 04537 (-45) | 04547 (+96), 04050 (+95), 04003 (+91) |
| Urgent care & emergency | 30 | 2,935.8 | 0.47 | 0.61 | 207 of 411 | 04096 (-77), 04265 (-69), 04743 (-43) | 04231 (+100), 04255 (+100), 04478 (+100) |
| Imaging & lab | 60 | 3,355.2 | 0.49 | 0.55 | 188 of 411 | 04434 (-55), 04427 (-54), 04932 (-49) | 04050 (+68), 04613 (+60), 04108 (+58) |
| Pharmacy | 30 | 9,478.4 | 1.72 | 0.50 | 230 of 411 | 04020 (-43), 04654 (-39), 04537 (-37) | 04774 (+91), 04461 (+83), 04108 (+75) |
| Home health & in-home care | 30 | 4,782.6 | 1.61 | 0.60 | 101 of 411 | 04454 (-88), 04491 (-75), 04762 (-53) | 04050 (+79), 04108 (+76), 04424 (+53) |
| Nursing & assisted living | 60 | 1,967.2 | 0.39 | 0.56 | 200 of 411 | 04434 (-100), 04932 (-87), 04427 (-72) | 04491 (+100), 04570 (+85), 04497 (+84) |
| Medical equipment & supplies | 60 | 1,303 | 0.36 | 0.68 | 132 of 411 | 04364 (-37), 04427 (-35), 04472 (-35) | 04454 (+54), 04050 (+51), 04487 (+50) |
| Hearing & audiology | 60 | 1,201.6 | 0.19 | 0.66 | 221 of 411 | 04932 (-77), 04949 (-73), 04472 (-71) | 04462 (+80), 04231 (+76), 04562 (+75) |
| Behavior therapy (ABA) | 30 | 14,444.2 | 2.88 | 0.76 | 4 of 411 | 03910 (-10), 04005 (-4), 04072 (-4) | 03909 (+69), 03911 (+52), 03905 (+41) |
| Care coordination & community health | 30 | 9,304.8 | 1.63 | 0.62 | 84 of 411 | 04454 (-64), 04765 (-57), 04491 (-50) | 04261 (+100), 03909 (+79), 03911 (+59) |
| General surgery | 60 | 2,276.4 | 0.35 | 0.40 | 235 of 411 | 04427 (-100), 04434 (-98), 04069 (-90) | 04491 (+100), 04485 (+83), 04558 (+83) |
| Infectious disease | 90 | 468 | 0.05 | 0.60 | 218 of 411 | 04680 (-62), 04622 (-61), 04607 (-58) | 04108 (+71), 04626 (+70), 04050 (+69) |
| Genetics & genetic counseling | 90 | 407.8 | 0.03 | 0.52 | 200 of 411 | 04090 (-78), 04039 (-76), 04042 (-76) | 04485 (+87), 04464 (+78), 04406 (+76) |
| Hospice & palliative care | 60 | 350.8 | 0.09 | 0.67 | 187 of 411 | 04434 (-45), 04472 (-45), 04574 (-45) | 04613 (+73), 04108 (+71), 04109 (+65) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Maine in households with no vehicle: about 73,504 of 1,109,819 (6.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 3
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 3 of 411 | 04109 (+31), 04057 (+25), 04570 (+19) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 411 | 04109 (+33), 04057 (+26), 04570 (+8) | 1.00 |
| Women's health / OB-GYN | 0.99 | 2 of 411 | 04057 (+26), 04109 (+25), 04101 (+11) | 1.00 |
| Mental health & counseling | 1.00 | 2 of 411 | 04109 (+33), 04057 (+31), 03904 (+8) | 1.00 |
| Dental | 1.00 | 2 of 411 | 04109 (+33), 04057 (+25), 04570 (+9) | 1.00 |
| Eye care | 1.00 | 4 of 411 | 04109 (+23), 04570 (+19), 04057 (+17) | 1.00 |
| Chiropractic | 0.99 | 3 of 411 | 04570 (+49), 04109 (+30), 04057 (+20) | 1.00 |
| Physical & occupational therapy | 0.99 | 3 of 411 | 04057 (+42), 04109 (+36), 04570 (+28) | 1.00 |
| Orthopedics & sports injury | 1.00 | 2 of 411 | 04109 (+30), 04057 (+26), 04108 (+12) | 1.00 |
| Heart / cardiology | 1.00 | 2 of 411 | 04109 (+32), 04101 (+16), 04108 (+9) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 411 | 04109 (+26), 04101 (+9), 04108 (+8) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 411 | 04109 (+18), 04101 (+7), 04108 (+6) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 411 | 04109 (+23), 04101 (+11), 04108 (+6) | 1.00 |
| Digestive / gastroenterology | 1.00 | 2 of 411 | 04109 (+24), 04570 (+15), 04108 (+8) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 411 | 04109 (+17), 04108 (+5), 04489 (+5) | 1.00 |
| Diabetes & hormones | 1.00 | 2 of 411 | 04109 (+26), 04057 (+21), 04101 (+11) | 1.00 |
| Cancer care / oncology | 1.00 | 1 of 411 | 04109 (+20), 04057 (+14), 04570 (+11) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 411 | 04109 (+9), 04461 (+7), 04953 (+6) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 411 | 04109 (+25), 04101 (+14), 04570 (+8) | 1.00 |
| Ear, nose & throat | 1.00 | 3 of 411 | 04109 (+31), 04057 (+19), 04101 (+17) | 1.00 |
| Urology | 1.00 | 2 of 411 | 04109 (+32), 04101 (+16), 04108 (+10) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 2 of 411 | 04109 (+22), 04057 (+17), 04570 (+12) | 1.00 |
| Pain management | 1.00 | 2 of 411 | 04057 (+23), 04109 (+22), 04108 (+12) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 2 of 411 | 04057 (+18), 04109 (+17), 04101 (+7) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 411 | 04109 (+38), 04057 (+22), 03904 (+8) | 1.00 |
| Nutrition & dietitian | 1.00 | 3 of 411 | 04109 (+36), 04057 (+30), 04570 (+18) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 2 of 411 | 04057 (+61), 04570 (+41), 04662 (+14) | 1.00 |
| Urgent care & emergency | 1.00 | 3 of 411 | 04057 (+34), 04109 (+31), 04662 (+15) | 1.00 |
| Imaging & lab | 0.99 | 2 of 411 | 04109 (+18), 04057 (+17), 04101 (+7) | 1.00 |
| Pharmacy | 0.99 | 4 of 411 | 04570 (+40), 04057 (+24), 04109 (+23) | 1.00 |
| Home health & in-home care | 1.00 | 2 of 411 | 04109 (+22), 04101 (+15), 04057 (+13) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 411 | 04057 (+35), 04570 (+31), 04109 (+25) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 411 | 04109 (+19), 04057 (+18), 04101 (+9) | 1.00 |
| Hearing & audiology | 1.00 | 3 of 411 | 04109 (+31), 04057 (+27), 04101 (+17) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 411 | 03904 (+4), 04109 (+4), 04101 (+3) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 411 | 04109 (+12), 04101 (+8), 04570 (+8) | 1.00 |
| General surgery | 0.99 | 2 of 411 | 04109 (+35), 04057 (+26), 04108 (+14) | 1.00 |
| Infectious disease | 1.00 | 0 of 411 | 04109 (+14), 04057 (+12), 04570 (+7) | 1.00 |
| Genetics & genetic counseling | 1.00 | 2 of 411 | 04057 (+26), 04109 (+26), 04101 (+12) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 411 | 04109 (+23), 04101 (+11), 04057 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 32 of 418 | 34,985 (3.2%) |  | 14/112 | 15/247 | 3/47 | 0/12 |
| Women's health / OB-GYN | 016 | 10 of 418 | 3,471 (0.3%) |  | 3/112 | 6/247 | 1/47 | 0/12 |
| Mental health & counseling: Psychiatry | 029 | 32 of 418 | 13,656 (1.2%) |  | 3/112 | 20/247 | 7/47 | 2/12 |
| Mental health & counseling: Clinical Psychology | 036 | 12 of 418 | 4,170 (0.4%) |  | 3/112 | 9/247 | 0/47 | 0/12 |
| Mental health & counseling: Clinical Social Work | 037 | 8 of 418 | 1,373 (0.1%) |  | 3/112 | 5/247 | 0/47 | 0/12 |
| Eye care | 023 | 23 of 418 | 9,143 (0.8%) |  | 3/112 | 19/247 | 1/47 | 0/12 |
| Chiropractic | 010 | 8 of 418 | 3,202 (0.3%) |  | 3/112 | 5/247 | 0/47 | 0/12 |
| Physical & occupational therapy | F049 | 5 of 418 | 1,683 (0.2%) |  | 2/112 | 3/247 | 0/47 | 0/12 |
| Orthopedics & sports injury | 025 | 14 of 418 | 4,489 (0.4%) |  | 3/112 | 11/247 | 0/47 | 0/12 |
| Heart / cardiology | 008 | 62 of 418 | 55,131 (5.0%) |  | 21/112 | 35/247 | 3/47 | 3/12 |
| Skin / dermatology | 011 | 107 of 418 | 113,771 (10.3%) |  | 10/112 | 74/247 | 21/47 | 2/12 |
| Allergy & immunology | 007 | 92 of 418 | 71,008 (6.4%) |  | 16/112 | 55/247 | 21/47 | 0/12 |
| Lung, breathing & sleep | 030 | 73 of 418 | 51,404 (4.6%) |  | 13/112 | 58/247 | 2/47 | 0/12 |
| Digestive / gastroenterology | 014 | 8 of 418 | 5,995 (0.5%) |  | 7/112 | 1/247 | 0/47 | 0/12 |
| Kidney / nephrology | 018 | 18 of 418 | 12,604 (1.1%) |  | 10/112 | 7/247 | 1/47 | 0/12 |
| Diabetes & hormones | 012 | 12 of 418 | 5,174 (0.5%) |  | 3/112 | 6/247 | 3/47 | 0/12 |
| Cancer care / oncology | 021 | 22 of 418 | 11,052 (1.0%) |  | 6/112 | 14/247 | 2/47 | 0/12 |
| Arthritis / rheumatology | 031 | 26 of 418 | 16,163 (1.5%) |  | 5/112 | 8/247 | 13/47 | 0/12 |
| Brain & nerves / neurology | 019 | 20 of 418 | 10,340 (0.9%) |  | 5/112 | 11/247 | 4/47 | 0/12 |
| Ear, nose & throat | 013 | 37 of 418 | 22,890 (2.1%) |  | 7/112 | 15/247 | 15/47 | 0/12 |
| Urology | 033 | 68 of 418 | 50,290 (4.5%) |  | 12/112 | 48/247 | 8/47 | 0/12 |
| Foot & ankle / podiatry | 028 | 28 of 418 | 20,332 (1.8%) |  | 6/112 | 21/247 | 1/47 | 0/12 |
| Plastic & reconstructive surgery | 027 | 37 of 418 | 27,205 (2.5%) |  | 3/112 | 14/247 | 20/47 | 0/12 |
| Speech & language therapy | F051 | 5 of 418 | 968 (0.1%) |  | 3/112 | 2/247 | 0/47 | 0/12 |
| Imaging & lab | F047 | 14 of 418 | 4,833 (0.4%) |  | 3/112 | 8/247 | 3/47 | 0/12 |
| Nursing & assisted living | F046 | 4 of 418 | 565 (0.1%) |  | 1/112 | 3/247 | 0/47 | 0/12 |
| General surgery | 015 | 12 of 418 | 4,592 (0.4%) |  | 4/112 | 7/247 | 1/47 | 0/12 |
| Infectious disease | 017 | 42 of 418 | 54,407 (4.9%) |  | 2/112 | 39/247 | 1/47 | 0/12 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 16720 rows (ZIP x specialty) stored in access_e2sfca for ME; market-score now uses drive-time access for these ZIPs.
