# E2SFCA access dry run: South Dakota

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 840; in South Dakota: 373
- Drive times: OSRM on OpenStreetMap roads (car profile), 840 x 840 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 42,991.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.27 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.66), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (58504, 58528)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 58504 | no | 9.07 | 100% | 9.07 | 100% | no |
| 58528 | no | 6.22 | 100% | 6.22 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 5,522 | 4.30 | 0.33 | 231 of 373 | 57641 (-66), 57659 (-61), 57752 (-60) | 57640 (+100), 57560 (+90), 57650 (+89) |
| Pediatrics (children) | 30 | 860.4 | 1.11 | 0.58 | 114 of 373 | 57369 (-66), 57278 (-60), 57770 (-44) | 57553 (+81), 57622 (+71), 57055 (+64) |
| Women's health / OB-GYN | 60 | 450 | 0.53 | 0.74 | 120 of 373 | 57465 (-66), 57022 (-61), 57752 (-54) | 57772 (+93), 57756 (+75), 57750 (+56) |
| Mental health & counseling | 30 | 6,576.6 | 7.20 | 0.53 | 116 of 373 | 57724 (-48), 57747 (-45), 57322 (-31) | 57766 (+88), 57735 (+83), 57782 (+77) |
| Dental | 30 | 1,948.2 | 1.65 | 0.33 | 216 of 373 | 57577 (-58), 57339 (-55), 57382 (-51) | 57755 (+97), 57759 (+80), 57751 (+74) |
| Eye care | 30 | 982.2 | 0.62 | 0.57 | 174 of 373 | 57450 (-80), 57374 (-77), 57752 (-61) | 57015 (+100), 57223 (+100), 57241 (+100) |
| Chiropractic | 30 | 1,620.4 | 0.63 | 0.52 | 209 of 373 | 57380 (-51), 57633 (-45), 57428 (-44) | 57050 (+100), 57051 (+100), 57052 (+100) |
| Physical & occupational therapy | 30 | 3,863.4 | 2.70 | 0.48 | 210 of 373 | 57070 (-50), 57225 (-48), 57362 (-47) | 57467 (+94), 57584 (+84), 57433 (+77) |
| Orthopedics & sports injury | 60 | 580.2 | 0.39 | 0.73 | 140 of 373 | 57004 (-100), 57022 (-100), 57212 (-100) | 57780 (+100), 57474 (+80), 57791 (+79) |
| Heart / cardiology | 60 | 159.6 | 0.24 | 0.73 | 63 of 373 | 57020 (-56), 57033 (-53), 57030 (-51) | 57745 (+55), 57015 (+51), 57013 (+39) |
| Skin / dermatology | 60 | 90.6 | 0.09 | 0.74 | 102 of 373 | 57741 (-87), 57785 (-87), 57003 (-53) | 57474 (+59), 57762 (+56), 57745 (+55) |
| Allergy & immunology | 60 | 18.2 | 0.03 | 0.71 | 58 of 373 | 57461 (-72), 57441 (-69), 57422 (-59) | 57474 (+83), 57745 (+65), 57013 (+57) |
| Lung, breathing & sleep | 60 | 110.4 | 0.13 | 0.77 | 97 of 373 | 57020 (-75), 57033 (-71), 57035 (-62) | 57621 (+100), 57661 (+100), 57560 (+94) |
| Digestive / gastroenterology | 60 | 71.4 | 0.11 | 0.74 | 51 of 373 | 57020 (-80), 57033 (-77), 57003 (-74) | 57745 (+57), 57038 (+42), 57751 (+35) |
| Kidney / nephrology | 60 | 106 | 0.11 | 0.69 | 150 of 373 | 57317 (-100), 57383 (-73), 57335 (-65) | 57661 (+100), 57714 (+100), 57560 (+93) |
| Diabetes & hormones | 60 | 68 | 0.06 | 0.72 | 65 of 373 | 57020 (-97), 57376 (-96), 57066 (-93) | 57536 (+100), 57650 (+100), 57560 (+80) |
| Cancer care / oncology | 90 | 122 | 0.15 | 0.56 | 181 of 373 | 57004 (-72), 57035 (-69), 57048 (-61) | 57258 (+67), 57477 (+62), 57322 (+59) |
| Arthritis / rheumatology | 60 | 18 | 0.04 | 0.69 | 62 of 373 | 57020 (-59), 57033 (-56), 57003 (-50) | 57270 (+74), 57239 (+72), 57745 (+58) |
| Brain & nerves / neurology | 60 | 135.8 | 0.22 | 0.72 | 65 of 373 | 57022 (-54), 57035 (-53), 57068 (-52) | 57745 (+70), 57751 (+42), 57761 (+40) |
| Ear, nose & throat | 60 | 81.2 | 0.07 | 0.70 | 119 of 373 | 57010 (-100), 57069 (-100), 57020 (-91) | 57474 (+79), 57745 (+66), 57375 (+53) |
| Urology | 60 | 69.8 | 0.07 | 0.70 | 125 of 373 | 57461 (-92), 57441 (-88), 57010 (-84) | 57449 (+93), 57434 (+91), 57421 (+81) |
| Foot & ankle / podiatry | 60 | 112.4 | 0.15 | 0.76 | 113 of 373 | 57472 (-58), 57547 (-46), 57069 (-45) | 57650 (+100), 57560 (+89), 57762 (+75) |
| Pain management | 60 | 42.8 | 0.09 | 0.67 | 61 of 373 | 57010 (-46), 57226 (-45), 57248 (-45) | 57466 (+100), 57242 (+50), 57241 (+48) |
| Plastic & reconstructive surgery | 90 | 45 | 0.07 | 0.52 | 148 of 373 | 57461 (-72), 57422 (-71), 57441 (-70) | 57337 (+55), 57077 (+52), 57474 (+52) |
| Speech & language therapy | 30 | 1,194.6 | 0.90 | 0.50 | 211 of 373 | 57716 (-95), 57585 (-84), 57456 (-81) | 57214 (+100), 57221 (+100), 57233 (+100) |
| Nutrition & dietitian | 30 | 446.6 | 0.33 | 0.50 | 182 of 373 | 57045 (-79), 57221 (-71), 57218 (-63) | 57232 (+100), 57247 (+100), 57270 (+100) |
| Acupuncture, massage & naturopathy | 30 | 338.6 | 0.52 | 0.73 | 90 of 373 | 57732 (-40), 57248 (-36), 57438 (-33) | 57745 (+99), 57759 (+99), 57761 (+98) |
| Urgent care & emergency | 30 | 697.6 | 0.47 | 0.35 | 212 of 373 | 57456 (-71), 57477 (-71), 57434 (-70) | 57052 (+100), 57420 (+100), 57436 (+100) |
| Imaging & lab | 60 | 504.6 | 0.49 | 0.68 | 150 of 373 | 57251 (-71), 57035 (-66), 57022 (-65) | 57536 (+78), 57239 (+76), 57270 (+71) |
| Pharmacy | 30 | 2,300.8 | 1.72 | 0.27 | 247 of 373 | 57382 (-64), 57577 (-56), 57380 (-46) | 57560 (+100), 57623 (+100), 57661 (+100) |
| Home health & in-home care | 30 | 5,261.6 | 1.61 | 0.45 | 102 of 373 | 57714 (-76), 57751 (-64), 57626 (-43) | 57457 (+100), 57623 (+100), 57640 (+100) |
| Nursing & assisted living | 60 | 1,009.2 | 0.39 | 0.63 | 160 of 373 | 57652 (-100), 57429 (-75), 57790 (-55) | 57457 (+100), 57475 (+100), 57661 (+100) |
| Medical equipment & supplies | 60 | 348 | 0.36 | 0.71 | 144 of 373 | 57630 (-68), 57226 (-54), 57568 (-44) | 57650 (+100), 57661 (+100), 57473 (+65) |
| Hearing & audiology | 60 | 291.2 | 0.19 | 0.77 | 149 of 373 | 57441 (-100), 57461 (-100), 57564 (-95) | 57348 (+77), 57474 (+73), 57344 (+66) |
| Behavior therapy (ABA) | 30 | 826.4 | 2.88 | 0.71 | 19 of 373 | 57702 (-7), 57701 (-5), 57262 (-4) | 57759 (+35), 57003 (+34), 57761 (+28) |
| Care coordination & community health | 30 | 1,795.4 | 1.63 | 0.58 | 97 of 373 | 57380 (-55), 57570 (-53), 57339 (-43) | 57648 (+94), 57745 (+86), 57761 (+81) |
| General surgery | 60 | 303.8 | 0.35 | 0.69 | 130 of 373 | 57004 (-52), 57003 (-45), 57035 (-45) | 57650 (+100), 57630 (+71), 57038 (+54) |
| Infectious disease | 90 | 35.6 | 0.05 | 0.57 | 96 of 373 | 57004 (-73), 57020 (-72), 57033 (-68) | 57745 (+47), 57015 (+38), 57751 (+38) |
| Genetics & genetic counseling | 90 | 41.2 | 0.03 | 0.47 | 65 of 373 | 57001 (-100), 57004 (-100), 57010 (-100) | 57648 (+33), 57005 (+0), 57032 (+0) |
| Hospice & palliative care | 60 | 106.4 | 0.09 | 0.77 | 116 of 373 | 57053 (-69), 57383 (-67), 57022 (-65) | 57457 (+100), 57760 (+87), 57548 (+85) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in South Dakota in households with no vehicle: about 35,967 of 667,922 (5.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 0 of 373 | 57572 (+6), 57104 (+4), 57555 (+4) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 373 | 57104 (+5), 57764 (+5), 57572 (+3) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 373 | 57652 (+9), 57772 (+8), 57756 (+7) | 1.00 |
| Mental health & counseling | 1.00 | 0 of 373 | 57104 (+3), 57572 (+2), 57639 (+2) | 1.00 |
| Dental | 1.00 | 0 of 373 | 57104 (+4), 57258 (+4), 57548 (+4) | 1.00 |
| Eye care | 1.00 | 0 of 373 | 57104 (+6), 57548 (+3), 57785 (+3) | 1.00 |
| Chiropractic | 1.00 | 0 of 373 | 57258 (+8), 57658 (+5), 57010 (+4) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 373 | 57104 (+5), 57258 (+5), 57010 (+4) | 1.00 |
| Orthopedics & sports injury | 1.00 | 1 of 373 | 57657 (+20), 57548 (+6), 57639 (+6) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 373 | 57104 (+4), 57764 (+3), 57785 (+3) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 373 | 57104 (+4), 57225 (+3), 57761 (+3) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 373 | 57445 (+4), 57785 (+3), 57104 (+2) | 1.00 |
| Lung, breathing & sleep | 1.00 | 2 of 373 | 57639 (+18), 57764 (+18), 57572 (+8) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 373 | 57104 (+4), 57785 (+3), 57010 (+1) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 373 | 57652 (+21), 57764 (+12), 57572 (+9) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 373 | 57317 (+4), 57376 (+4), 57059 (+3) | 1.00 |
| Cancer care / oncology | 1.00 | 0 of 373 | 57772 (+6), 57258 (+5), 57764 (+5) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 373 | 57224 (+10), 57104 (+4), 57785 (+3) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 373 | 57785 (+3), 57103 (+2), 57104 (+2) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 373 | 57785 (+5), 57045 (+4), 57314 (+4) | 1.00 |
| Urology | 1.00 | 0 of 373 | 57010 (+4), 57104 (+4), 57314 (+4) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 2 of 373 | 57750 (+19), 57772 (+17), 57572 (+7) | 1.00 |
| Pain management | 1.00 | 0 of 373 | 57473 (+14), 57225 (+3), 57264 (+3) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 373 | 57219 (+6), 57274 (+4), 57449 (+4) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 373 | 57010 (+5), 57104 (+4), 57701 (+3) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 373 | 57572 (+12), 57548 (+11), 57449 (+7) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 373 | 57104 (+3), 57785 (+2), 57001 (+1) | 1.00 |
| Urgent care & emergency | 1.00 | 0 of 373 | 57376 (+6), 57219 (+5), 57104 (+4) | 1.00 |
| Imaging & lab | 1.00 | 0 of 373 | 57224 (+11), 57652 (+7), 57764 (+6) | 1.00 |
| Pharmacy | 1.00 | 0 of 373 | 57764 (+14), 57572 (+9), 57104 (+5) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 373 | 57449 (+2), 57027 (+1), 57045 (+1) | 1.00 |
| Nursing & assisted living | 1.00 | 0 of 373 | 57224 (+10), 57258 (+9), 57449 (+7) | 1.00 |
| Medical equipment & supplies | 1.00 | 1 of 373 | 57657 (+20), 57652 (+12), 57639 (+7) | 1.00 |
| Hearing & audiology | 1.00 | 0 of 373 | 57540 (+5), 57785 (+5), 57010 (+4) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 373 | 57104 (+1), 57445 (+1), 57701 (+1) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 373 | 57548 (+7), 57572 (+6), 57639 (+5) | 1.00 |
| General surgery | 1.00 | 0 of 373 | 57764 (+7), 57642 (+6), 57652 (+6) | 1.00 |
| Infectious disease | 1.00 | 0 of 373 | 57785 (+5), 57010 (+3), 57027 (+3) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 373 | 57025 (+5), 57006 (+3), 57069 (+3) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 373 | 57339 (+6), 57045 (+5), 57785 (+5) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 57104 | Primary care / family doctor | 6.493 | 6.610 | 25 | 23 |
| 57104 | Mental health & counseling | 8.049 | 8.072 | 44 | 44 |
| 57104 | Heart / cardiology | 0.426 | 0.354 | 10 | 25 |
| 57104 | Cancer care / oncology | 0.279 | 0.214 | 9 | 30 |
| 57104 | Urgent care & emergency | 0.614 | 0.627 | 34 | 33 |
| 57701 | Primary care / family doctor | 6.379 | 7.625 | 26 | 11 |
| 57701 | Mental health & counseling | 7.844 | 9.356 | 46 | 35 |
| 57701 | Heart / cardiology | 0.311 | 0.305 | 34 | 36 |
| 57701 | Cancer care / oncology | 0.203 | 0.163 | 34 | 47 |
| 57701 | Urgent care & emergency | 0.701 | 0.843 | 25 | 10 |
| 57401 | Primary care / family doctor | 4.522 | 5.022 | 47 | 42 |
| 57401 | Mental health & counseling | 7.819 | 8.663 | 46 | 40 |
| 57401 | Heart / cardiology | 0.140 | 0.133 | 71 | 72 |
| 57401 | Cancer care / oncology | 0.231 | 0.184 | 25 | 40 |
| 57401 | Urgent care & emergency | 0.525 | 0.588 | 44 | 37 |
| 57501 | Primary care / family doctor | 5.424 | 5.632 | 37 | 35 |
| 57501 | Mental health & counseling | 5.476 | 5.689 | 62 | 61 |
| 57501 | Heart / cardiology | 0.000 | 0.000 | 100 | 100 |
| 57501 | Cancer care / oncology | 0.116 | 0.098 | 62 | 68 |
| 57501 | Urgent care & emergency | 0.360 | 0.374 | 62 | 60 |
| 57770 | Primary care / family doctor | 4.180 | 6.798 | 51 | 21 |
| 57770 | Mental health & counseling | 3.436 | 3.205 | 76 | 78 |
| 57770 | Heart / cardiology | 0.060 | 0.093 | 87 | 80 |
| 57770 | Cancer care / oncology | 0.100 | 0.089 | 67 | 71 |
| 57770 | Urgent care & emergency | 2.050 | 4.779 | 0 | 0 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 14 of 372 | 2,877 (0.4%) |  | 3/26 | 3/13 | 6/105 | 2/228 |
| Women's health / OB-GYN | 016 | 13 of 372 | 3,900 (0.6%) |  | 0/26 | 2/13 | 0/105 | 11/228 |
| Mental health & counseling: Psychiatry | 029 | 41 of 372 | 14,753 (2.2%) |  | 1/26 | 4/13 | 9/105 | 27/228 |
| Mental health & counseling: Clinical Psychology | 036 | 3 of 372 | 417 (0.1%) |  | 0/26 | 2/13 | 0/105 | 1/228 |
| Mental health & counseling: Clinical Social Work | 037 | 4 of 372 | 1,404 (0.2%) |  | 2/26 | 1/13 | 0/105 | 1/228 |
| Eye care | 023 | 8 of 372 | 1,654 (0.2%) |  | 0/26 | 4/13 | 0/105 | 4/228 |
| Chiropractic | 010 | 1 of 372 | 118 (0.0%) |  | 0/26 | 1/13 | 0/105 | 0/228 |
| Physical & occupational therapy | F049 | 1 of 372 | 118 (0.0%) |  | 0/26 | 1/13 | 0/105 | 0/228 |
| Orthopedics & sports injury | 025 | 41 of 372 | 14,715 (2.2%) |  | 4/26 | 2/13 | 0/105 | 35/228 |
| Heart / cardiology | 008 | 126 of 372 | 78,019 (11.7%) |  | 5/26 | 4/13 | 12/105 | 105/228 |
| Skin / dermatology | 011 | 66 of 372 | 31,386 (4.7%) |  | 1/26 | 4/13 | 9/105 | 52/228 |
| Allergy & immunology | 007 | 75 of 372 | 55,743 (8.3%) |  | 3/26 | 2/13 | 21/105 | 49/228 |
| Lung, breathing & sleep | 030 | 63 of 372 | 70,271 (10.5%) |  | 1/26 | 0/13 | 14/105 | 48/228 |
| Digestive / gastroenterology | 014 | 86 of 372 | 44,329 (6.6%) |  | 0/26 | 4/13 | 3/105 | 79/228 |
| Kidney / nephrology | 018 | 8 of 372 | 1,938 (0.3%) |  | 2/26 | 2/13 | 0/105 | 4/228 |
| Diabetes & hormones | 012 | 5 of 372 | 3,588 (0.5%) |  | 0/26 | 0/13 | 0/105 | 5/228 |
| Cancer care / oncology | 021 | 48 of 372 | 24,235 (3.6%) |  | 3/26 | 0/13 | 6/105 | 39/228 |
| Arthritis / rheumatology | 031 | 163 of 372 | 141,068 (21.1%) |  | 0/26 | 0/13 | 41/105 | 122/228 |
| Brain & nerves / neurology | 019 | 56 of 372 | 28,246 (4.2%) |  | 2/26 | 4/13 | 5/105 | 45/228 |
| Ear, nose & throat | 013 | 57 of 372 | 29,168 (4.4%) |  | 3/26 | 2/13 | 1/105 | 51/228 |
| Urology | 033 | 59 of 372 | 26,298 (3.9%) |  | 2/26 | 0/13 | 10/105 | 47/228 |
| Foot & ankle / podiatry | 028 | 24 of 372 | 7,684 (1.2%) |  | 0/26 | 4/13 | 0/105 | 20/228 |
| Plastic & reconstructive surgery | 027 | 39 of 372 | 17,465 (2.6%) |  | 0/26 | 0/13 | 0/105 | 39/228 |
| Speech & language therapy | F051 | 4 of 372 | 605 (0.1%) |  | 0/26 | 1/13 | 0/105 | 3/228 |
| Imaging & lab | F047 | 9 of 372 | 1,928 (0.3%) |  | 0/26 | 2/13 | 0/105 | 7/228 |
| Nursing & assisted living | F046 | 4 of 372 | 1,844 (0.3%) |  | 0/26 | 1/13 | 0/105 | 3/228 |
| General surgery | 015 | 22 of 372 | 12,034 (1.8%) |  | 3/26 | 4/13 | 0/105 | 15/228 |
| Infectious disease | 017 | 73 of 372 | 62,015 (9.3%) |  | 0/26 | 0/13 | 26/105 | 47/228 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
