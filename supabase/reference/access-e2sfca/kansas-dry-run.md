# E2SFCA access dry run: Kansas

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,587; in Kansas: 700
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,587 x 1,587 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 170,293.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.36 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.91), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 20,899.4 | 4.30 | 0.46 | 341 of 700 | 66834 (-56), 66442 (-55), 66872 (-53) | 66539 (+78), 67584 (+72), 67753 (+72) |
| Pediatrics (children) | 30 | 4,265 | 1.11 | 0.79 | 81 of 700 | 66214 (-53), 66215 (-50), 67061 (-49) | 67232 (+53), 67002 (+49), 67228 (+48) |
| Women's health / OB-GYN | 60 | 2,269.2 | 0.53 | 0.79 | 188 of 700 | 67730 (-69), 66109 (-37), 67548 (-33) | 67002 (+47), 67023 (+46), 66849 (+43) |
| Mental health & counseling | 30 | 33,474.6 | 7.20 | 0.69 | 204 of 700 | 67054 (-45), 66434 (-35), 66442 (-30) | 66539 (+77), 67660 (+63), 66860 (+60) |
| Dental | 30 | 7,427.8 | 1.65 | 0.55 | 301 of 700 | 67657 (-67), 67840 (-64), 67632 (-52) | 67487 (+76), 67862 (+74), 67764 (+72) |
| Eye care | 30 | 3,180 | 0.62 | 0.49 | 375 of 700 | 66521 (-69), 67625 (-61), 67560 (-43) | 66960 (+100), 66964 (+97), 67673 (+97) |
| Chiropractic | 30 | 4,946.2 | 0.63 | 0.47 | 423 of 700 | 67334 (-60), 67864 (-56), 67836 (-53) | 66520 (+100), 66960 (+100), 67417 (+100) |
| Physical & occupational therapy | 30 | 15,075.6 | 2.70 | 0.61 | 351 of 700 | 67521 (-86), 67740 (-52), 67863 (-44) | 66094 (+84), 67581 (+81), 67573 (+79) |
| Orthopedics & sports injury | 60 | 2,079.4 | 0.39 | 0.73 | 311 of 700 | 67548 (-100), 67520 (-85), 67665 (-70) | 66023 (+76), 67102 (+74), 66041 (+69) |
| Heart / cardiology | 60 | 953 | 0.24 | 0.78 | 200 of 700 | 67548 (-58), 67665 (-54), 67030 (-52) | 66539 (+66), 67660 (+65), 66713 (+59) |
| Skin / dermatology | 60 | 289.2 | 0.09 | 0.77 | 160 of 700 | 66742 (-51), 66749 (-46), 67877 (-45) | 67648 (+81), 66533 (+73), 66539 (+61) |
| Allergy & immunology | 60 | 116.2 | 0.03 | 0.74 | 187 of 700 | 67733 (-86), 67757 (-85), 67738 (-82) | 66097 (+86), 66849 (+82), 67579 (+71) |
| Lung, breathing & sleep | 60 | 520.6 | 0.13 | 0.78 | 195 of 700 | 66109 (-56), 66507 (-55), 66007 (-52) | 66097 (+86), 66020 (+76), 66054 (+72) |
| Digestive / gastroenterology | 60 | 356.8 | 0.11 | 0.75 | 142 of 700 | 66007 (-41), 66013 (-40), 66109 (-36) | 66713 (+63), 67002 (+57), 67071 (+50) |
| Kidney / nephrology | 60 | 442.2 | 0.11 | 0.70 | 345 of 700 | 67548 (-56), 66404 (-54), 66516 (-48) | 67579 (+71), 67644 (+63), 67147 (+57) |
| Diabetes & hormones | 60 | 246.2 | 0.06 | 0.76 | 244 of 700 | 67004 (-84), 67074 (-78), 67010 (-74) | 67352 (+82), 67345 (+75), 66777 (+69) |
| Cancer care / oncology | 90 | 611.6 | 0.15 | 0.59 | 341 of 700 | 67548 (-96), 67665 (-95), 67520 (-93) | 66539 (+79), 67028 (+69), 67071 (+68) |
| Arthritis / rheumatology | 60 | 129.2 | 0.04 | 0.74 | 174 of 700 | 67460 (-75), 67514 (-56), 66012 (-54) | 66873 (+91), 66846 (+87), 66834 (+78) |
| Brain & nerves / neurology | 60 | 945.8 | 0.22 | 0.80 | 137 of 700 | 66109 (-46), 67548 (-38), 67665 (-36) | 67017 (+69), 66539 (+60), 67002 (+47) |
| Ear, nose & throat | 60 | 271.8 | 0.07 | 0.76 | 234 of 700 | 67437 (-57), 66956 (-56), 67661 (-56) | 66873 (+92), 66846 (+88), 66554 (+85) |
| Urology | 60 | 273.6 | 0.07 | 0.70 | 295 of 700 | 67520 (-100), 67548 (-100), 67665 (-100) | 67345 (+79), 66777 (+78), 67352 (+75) |
| Foot & ankle / podiatry | 60 | 463.4 | 0.15 | 0.73 | 177 of 700 | 67749 (-73), 67731 (-46), 67039 (-40) | 67112 (+85), 67142 (+82), 67159 (+76) |
| Pain management | 60 | 285.4 | 0.09 | 0.80 | 157 of 700 | 67554 (-48), 66109 (-43), 67524 (-40) | 67481 (+76), 66873 (+74), 67017 (+68) |
| Plastic & reconstructive surgery | 90 | 238.2 | 0.07 | 0.65 | 245 of 700 | 66109 (-60), 66007 (-55), 66043 (-51) | 66873 (+92), 66846 (+89), 67857 (+80) |
| Speech & language therapy | 30 | 4,898.6 | 0.90 | 0.71 | 218 of 700 | 67038 (-87), 67842 (-79), 67834 (-48) | 67660 (+78), 67656 (+72), 67017 (+68) |
| Nutrition & dietitian | 30 | 1,551.2 | 0.33 | 0.65 | 305 of 700 | 66521 (-71), 67361 (-65), 67022 (-64) | 66520 (+100), 67487 (+99), 66549 (+94) |
| Acupuncture, massage & naturopathy | 30 | 669.6 | 0.52 | 0.80 | 27 of 700 | 67869 (-46), 67749 (-39), 67859 (-33) | 67744 (+42), 66732 (+37), 67635 (+37) |
| Urgent care & emergency | 30 | 2,481.4 | 0.47 | 0.46 | 372 of 700 | 67106 (-88), 67334 (-68), 67118 (-63) | 66838 (+100), 67065 (+100), 67071 (+100) |
| Imaging & lab | 60 | 1,962.4 | 0.49 | 0.73 | 271 of 700 | 67548 (-60), 67520 (-55), 66526 (-50) | 66539 (+66), 67545 (+58), 66402 (+57) |
| Pharmacy | 30 | 8,544.8 | 1.72 | 0.43 | 360 of 700 | 67024 (-54), 67553 (-50), 67667 (-49) | 67071 (+91), 67734 (+91), 67743 (+90) |
| Home health & in-home care | 30 | 13,778.2 | 1.61 | 0.57 | 137 of 700 | 67455 (-74), 67653 (-62), 67645 (-56) | 66094 (+99), 67739 (+97), 66946 (+89) |
| Nursing & assisted living | 60 | 2,820.6 | 0.39 | 0.33 | 347 of 700 | 66716 (-64), 67104 (-56), 67547 (-53) | 67143 (+99), 66014 (+90), 67458 (+90) |
| Medical equipment & supplies | 60 | 1,662.2 | 0.36 | 0.62 | 299 of 700 | 67548 (-79), 66956 (-61), 67437 (-55) | 67736 (+99), 66964 (+82), 67840 (+81) |
| Hearing & audiology | 60 | 1,104.2 | 0.19 | 0.76 | 318 of 700 | 67548 (-87), 66526 (-84), 66501 (-82) | 67764 (+79), 66746 (+67), 66549 (+62) |
| Behavior therapy (ABA) | 30 | 9,232.6 | 2.88 | 0.77 | 79 of 700 | 66758 (-82), 66014 (-37), 66104 (-30) | 66849 (+100), 66872 (+100), 67487 (+100) |
| Care coordination & community health | 30 | 12,101 | 1.63 | 0.72 | 246 of 700 | 67764 (-88), 66507 (-82), 67736 (-82) | 66527 (+72), 66840 (+68), 67029 (+68) |
| General surgery | 60 | 1,424.4 | 0.35 | 0.69 | 274 of 700 | 67548 (-73), 67520 (-70), 67110 (-49) | 67452 (+63), 66740 (+61), 66507 (+59) |
| Infectious disease | 90 | 157.4 | 0.05 | 0.64 | 188 of 700 | 66018 (-57), 66031 (-55), 66030 (-54) | 66532 (+90), 66058 (+87), 66424 (+87) |
| Genetics & genetic counseling | 90 | 108.8 | 0.03 | 0.54 | 142 of 700 | 67335 (-60), 67357 (-60), 67301 (-58) | 67352 (+73), 66772 (+70), 66775 (+65) |
| Hospice & palliative care | 60 | 491.4 | 0.09 | 0.73 | 344 of 700 | 67576 (-86), 66967 (-84), 66716 (-78) | 67071 (+100), 67143 (+100), 67122 (+82) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Kansas in households with no vehicle: about 112,455 of 2,229,196 (5.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 1 of 700 | 66612 (+23), 66607 (+9), 66932 (+8) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 700 | 66612 (+13), 66607 (+5), 67214 (+5) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 700 | 66612 (+9), 66101 (+5), 66607 (+5) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 700 | 66612 (+24), 66607 (+11), 67214 (+9) | 1.00 |
| Dental | 1.00 | 1 of 700 | 66612 (+18), 66607 (+7), 67214 (+7) | 1.00 |
| Eye care | 1.00 | 1 of 700 | 66612 (+23), 67214 (+10), 66607 (+9) | 1.00 |
| Chiropractic | 1.00 | 1 of 700 | 66612 (+19), 66407 (+11), 66016 (+9) | 1.00 |
| Physical & occupational therapy | 1.00 | 1 of 700 | 66612 (+33), 66607 (+13), 66603 (+12) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 700 | 66612 (+14), 66407 (+12), 66607 (+8) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 700 | 66612 (+11), 66607 (+7), 67214 (+7) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 700 | 66612 (+11), 66101 (+5), 66607 (+5) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 700 | 66612 (+11), 66607 (+8), 66101 (+6) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 700 | 66612 (+15), 66607 (+9), 66101 (+6) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 700 | 66612 (+7), 66101 (+5), 66607 (+4) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 700 | 66612 (+8), 67058 (+6), 66101 (+5) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 700 | 66612 (+12), 67345 (+10), 67214 (+8) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 700 | 66612 (+11), 66607 (+6), 67660 (+6) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 700 | 67505 (+8), 66612 (+7), 66101 (+5) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 700 | 66612 (+9), 66101 (+5), 66607 (+5) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 700 | 66932 (+11), 66612 (+7), 66101 (+6) | 1.00 |
| Urology | 1.00 | 1 of 700 | 66612 (+15), 66607 (+10), 66932 (+10) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 700 | 66612 (+8), 66607 (+5), 66101 (+4) | 1.00 |
| Pain management | 1.00 | 0 of 700 | 66612 (+8), 66101 (+5), 66607 (+5) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 700 | 66612 (+9), 66862 (+6), 67072 (+5) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 700 | 66612 (+15), 67214 (+8), 66607 (+6) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 700 | 66612 (+22), 66607 (+9), 66403 (+7) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 700 | 66612 (+2), 66044 (+1), 66049 (+1) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 700 | 66612 (+21), 66607 (+8), 66603 (+7) | 1.00 |
| Imaging & lab | 1.00 | 0 of 700 | 66612 (+10), 66607 (+7), 66101 (+5) | 1.00 |
| Pharmacy | 1.00 | 1 of 700 | 66612 (+24), 66607 (+10), 66932 (+9) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 700 | 66612 (+7), 66607 (+3), 67214 (+3) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 700 | 66612 (+26), 66964 (+24), 67345 (+19) | 1.00 |
| Medical equipment & supplies | 1.00 | 0 of 700 | 66612 (+9), 66932 (+8), 66407 (+6) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 700 | 66612 (+22), 66607 (+11), 67214 (+11) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 700 | 67214 (+6), 66101 (+5), 66217 (+5) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 700 | 67214 (+11), 67202 (+6), 67341 (+5) | 1.00 |
| General surgery | 1.00 | 0 of 700 | 66612 (+7), 67341 (+5), 66101 (+4) | 1.00 |
| Infectious disease | 1.00 | 0 of 700 | 66612 (+10), 66101 (+5), 66607 (+5) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 700 | 67341 (+7), 67345 (+6), 66612 (+5) | 1.00 |
| Hospice & palliative care | 1.00 | 2 of 700 | 66612 (+20), 66964 (+17), 66607 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 15 of 700 | 13,384 (0.6%) |  | 9/136 | 4/60 | 2/257 | 0/247 |
| Women's health / OB-GYN | 016 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Mental health & counseling: Psychiatry | 029 | 17 of 700 | 9,015 (0.4%) |  | 0/136 | 1/60 | 2/257 | 14/247 |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Mental health & counseling: Clinical Social Work | 037 | 2 of 700 | 1,434 (0.1%) |  | 1/136 | 1/60 | 0/257 | 0/247 |
| Eye care | 023 | 1 of 700 | 172 (0.0%) |  | 0/136 | 1/60 | 0/257 | 0/247 |
| Chiropractic | 010 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Physical & occupational therapy | F049 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Orthopedics & sports injury | 025 | 5 of 700 | 3,128 (0.1%) |  | 2/136 | 1/60 | 0/257 | 2/247 |
| Heart / cardiology | 008 | 75 of 700 | 64,134 (2.9%) |  | 5/136 | 5/60 | 15/257 | 50/247 |
| Skin / dermatology | 011 | 73 of 700 | 45,809 (2.1%) |  | 0/136 | 5/60 | 27/257 | 41/247 |
| Allergy & immunology | 007 | 88 of 700 | 122,201 (5.5%) |  | 7/136 | 0/60 | 31/257 | 50/247 |
| Lung, breathing & sleep | 030 | 56 of 700 | 32,306 (1.4%) |  | 0/136 | 4/60 | 16/257 | 36/247 |
| Digestive / gastroenterology | 014 | 127 of 700 | 109,795 (4.9%) |  | 0/136 | 6/60 | 49/257 | 72/247 |
| Kidney / nephrology | 018 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Diabetes & hormones | 012 | 10 of 700 | 70,021 (3.1%) |  | 8/136 | 0/60 | 0/257 | 2/247 |
| Cancer care / oncology | 021 | 14 of 700 | 7,422 (0.3%) |  | 0/136 | 0/60 | 10/257 | 4/247 |
| Arthritis / rheumatology | 031 | 77 of 700 | 108,582 (4.9%) |  | 2/136 | 0/60 | 16/257 | 59/247 |
| Brain & nerves / neurology | 019 | 49 of 700 | 29,909 (1.3%) |  | 0/136 | 4/60 | 20/257 | 25/247 |
| Ear, nose & throat | 013 | 24 of 700 | 11,923 (0.5%) |  | 0/136 | 0/60 | 4/257 | 20/247 |
| Urology | 033 | 19 of 700 | 8,292 (0.4%) |  | 0/136 | 0/60 | 12/257 | 7/247 |
| Foot & ankle / podiatry | 028 | 21 of 700 | 26,771 (1.2%) |  | 0/136 | 0/60 | 7/257 | 14/247 |
| Plastic & reconstructive surgery | 027 | 15 of 700 | 4,119 (0.2%) |  | 0/136 | 0/60 | 5/257 | 10/247 |
| Speech & language therapy | F051 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Imaging & lab | F047 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| Nursing & assisted living | F046 | 0 of 700 | 0 (0.0%) |  | 0/136 | 0/60 | 0/257 | 0/247 |
| General surgery | 015 | 5 of 700 | 3,333 (0.1%) |  | 4/136 | 1/60 | 0/257 | 0/247 |
| Infectious disease | 017 | 78 of 700 | 77,379 (3.5%) |  | 0/136 | 0/60 | 5/257 | 73/247 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 28000 rows (ZIP x specialty) stored in access_e2sfca for KS; market-score now uses drive-time access for these ZIPs.
