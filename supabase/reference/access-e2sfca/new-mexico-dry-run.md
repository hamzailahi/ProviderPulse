# E2SFCA access dry run: New Mexico

Run 2026-11-25 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 625; in New Mexico: 360
- Drive times: OSRM on OpenStreetMap roads (car profile), 625 x 625 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 96,943; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.40 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.99), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 79759 | no | 6.37 | 100% | 1.42 | 100% | yes (1.60) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 11,917 | 4.30 | 0.36 | 197 of 360 | 87734 (-74), 87530 (-71), 87034 (-54) | 87011 (+95), 87573 (+89), 87040 (+75) |
| Pediatrics (children) | 30 | 3,759.4 | 1.11 | 0.55 | 201 of 360 | 87528 (-59), 87740 (-55), 87714 (-54) | 87310 (+100), 87311 (+100), 87320 (+100) |
| Women's health / OB-GYN | 60 | 1,661 | 0.53 | 0.80 | 133 of 360 | 87312 (-80), 87323 (-68), 87001 (-44) | 87573 (+100), 87710 (+91), 87711 (+86) |
| Mental health & counseling | 30 | 21,425.4 | 7.20 | 0.63 | 160 of 360 | 87530 (-75), 87729 (-37), 87532 (-31) | 87573 (+100), 88417 (+100), 88426 (+100) |
| Dental | 30 | 4,415.6 | 1.65 | 0.56 | 171 of 360 | 87530 (-80), 87024 (-67), 87357 (-58) | 88009 (+93), 87573 (+91), 87326 (+87) |
| Eye care | 30 | 1,415 | 0.62 | 0.63 | 124 of 360 | 88002 (-65), 88052 (-65), 87052 (-54) | 87326 (+100), 88342 (+100), 87311 (+98) |
| Chiropractic | 30 | 1,203 | 0.63 | 0.63 | 120 of 360 | 88317 (-64), 87525 (-63), 87010 (-59) | 87011 (+100), 87573 (+95), 87562 (+94) |
| Physical & occupational therapy | 30 | 6,316.4 | 2.70 | 0.64 | 139 of 360 | 88354 (-90), 87539 (-61), 88120 (-58) | 87939 (+69), 87562 (+64), 87573 (+64) |
| Orthopedics & sports injury | 60 | 864.6 | 0.39 | 0.81 | 86 of 360 | 88024 (-46), 88021 (-44), 87531 (-36) | 87573 (+60), 88002 (+60), 88038 (+54) |
| Heart / cardiology | 60 | 472.2 | 0.24 | 0.78 | 74 of 360 | 88072 (-54), 88024 (-48), 88048 (-45) | 87573 (+80), 87562 (+64), 87151 (+55) |
| Skin / dermatology | 60 | 138 | 0.09 | 0.77 | 63 of 360 | 87532 (-62), 87567 (-62), 87052 (-54) | 87573 (+100), 88049 (+89), 88034 (+83) |
| Allergy & immunology | 60 | 69.2 | 0.03 | 0.80 | 87 of 360 | 87532 (-81), 87567 (-74), 87022 (-51) | 87025 (+100), 87573 (+100), 88049 (+83) |
| Lung, breathing & sleep | 60 | 340.6 | 0.13 | 0.82 | 87 of 360 | 87565 (-82), 87569 (-76), 87312 (-56) | 87326 (+70), 87573 (+62), 87117 (+47) |
| Digestive / gastroenterology | 60 | 198 | 0.11 | 0.81 | 57 of 360 | 88072 (-44), 87001 (-38), 87068 (-37) | 87573 (+57), 88008 (+55), 87123 (+45) |
| Kidney / nephrology | 60 | 341.2 | 0.11 | 0.84 | 97 of 360 | 87313 (-62), 87325 (-56), 87323 (-52) | 87573 (+98), 87326 (+63), 87025 (+58) |
| Diabetes & hormones | 60 | 160.2 | 0.06 | 0.77 | 106 of 360 | 87317 (-74), 87375 (-67), 87532 (-61) | 87025 (+100), 88350 (+100), 87538 (+97) |
| Cancer care / oncology | 90 | 254 | 0.15 | 0.71 | 88 of 360 | 88342 (-42), 88210 (-41), 88072 (-36) | 88350 (+76), 87562 (+73), 88347 (+72) |
| Arthritis / rheumatology | 60 | 85.8 | 0.04 | 0.78 | 79 of 360 | 87532 (-100), 87567 (-100), 87537 (-80) | 87025 (+100), 87573 (+100), 87461 (+77) |
| Brain & nerves / neurology | 60 | 367.2 | 0.22 | 0.76 | 68 of 360 | 87712 (-42), 87068 (-40), 87042 (-37) | 87573 (+85), 87713 (+64), 87583 (+61) |
| Ear, nose & throat | 60 | 125.8 | 0.07 | 0.81 | 74 of 360 | 87317 (-37), 87068 (-34), 88072 (-33) | 87461 (+86), 87325 (+79), 88264 (+77) |
| Urology | 60 | 144.2 | 0.07 | 0.80 | 91 of 360 | 87532 (-78), 87567 (-68), 88072 (-45) | 87025 (+100), 87573 (+99), 88250 (+72) |
| Foot & ankle / podiatry | 60 | 352.8 | 0.15 | 0.74 | 111 of 360 | 87712 (-73), 87742 (-54), 87724 (-53) | 87573 (+100), 88350 (+92), 87583 (+91) |
| Pain management | 60 | 198 | 0.09 | 0.81 | 69 of 360 | 88072 (-67), 88048 (-56), 88024 (-46) | 87573 (+100), 87547 (+62), 87047 (+48) |
| Plastic & reconstructive surgery | 90 | 104.6 | 0.07 | 0.74 | 68 of 360 | 88061 (-39), 88065 (-37), 87068 (-33) | 88039 (+55), 88051 (+53), 87562 (+46) |
| Speech & language therapy | 30 | 3,358.4 | 0.90 | 0.66 | 166 of 360 | 87732 (-37), 87420 (-33), 87029 (-31) | 87733 (+100), 88125 (+100), 88301 (+100) |
| Nutrition & dietitian | 30 | 696.2 | 0.33 | 0.68 | 107 of 360 | 87010 (-74), 88103 (-73), 87528 (-60) | 87461 (+100), 87320 (+98), 87325 (+98) |
| Acupuncture, massage & naturopathy | 30 | 1,974 | 0.52 | 0.70 | 148 of 360 | 87582 (-53), 87321 (-51), 87723 (-50) | 87029 (+100), 87539 (+100), 87564 (+100) |
| Urgent care & emergency | 30 | 1,716.6 | 0.47 | 0.55 | 163 of 360 | 87010 (-73), 87041 (-69), 87072 (-62) | 87014 (+100), 87026 (+100), 87038 (+100) |
| Imaging & lab | 60 | 1,074.8 | 0.49 | 0.78 | 84 of 360 | 88350 (-64), 87531 (-36), 88044 (-35) | 88344 (+100), 87461 (+85), 87573 (+74) |
| Pharmacy | 30 | 4,695.4 | 1.72 | 0.61 | 155 of 360 | 87034 (-53), 87036 (-53), 87049 (-53) | 87311 (+100), 87315 (+100), 87326 (+100) |
| Home health & in-home care | 30 | 2,226.8 | 1.61 | 0.69 | 72 of 360 | 87538 (-68), 87713 (-55), 88039 (-37) | 88112 (+53), 88120 (+51), 87939 (+42) |
| Nursing & assisted living | 60 | 984.2 | 0.39 | 0.75 | 93 of 360 | 87724 (-72), 87936 (-60), 88414 (-60) | 88411 (+80), 87939 (+71), 87326 (+57) |
| Medical equipment & supplies | 60 | 891.6 | 0.36 | 0.76 | 94 of 360 | 88072 (-48), 88024 (-46), 87724 (-42) | 87573 (+46), 87710 (+45), 87718 (+43) |
| Hearing & audiology | 60 | 532.8 | 0.19 | 0.82 | 99 of 360 | 87022 (-49), 87068 (-46), 88024 (-46) | 87528 (+100), 87573 (+94), 88350 (+90) |
| Behavior therapy (ABA) | 30 | 8,131 | 2.88 | 0.76 | 96 of 360 | 87581 (-86), 88321 (-51), 87031 (-36) | 88002 (+100), 88347 (+100), 88350 (+100) |
| Care coordination & community health | 30 | 8,684.4 | 1.63 | 0.64 | 164 of 360 | 88042 (-73), 87582 (-70), 87530 (-69) | 87014 (+100), 87038 (+100), 87040 (+100) |
| General surgery | 60 | 877.4 | 0.35 | 0.76 | 102 of 360 | 88072 (-55), 87531 (-54), 88048 (-47) | 87710 (+80), 87718 (+78), 87573 (+75) |
| Infectious disease | 90 | 95.6 | 0.05 | 0.77 | 108 of 360 | 87569 (-49), 87701 (-49), 87565 (-42) | 87573 (+85), 87547 (+77), 87506 (+66) |
| Genetics & genetic counseling | 90 | 59.4 | 0.03 | 0.67 | 71 of 360 | 87001 (-92), 87052 (-72), 87532 (-69) | 87025 (+84), 87573 (+69), 87151 (+48) |
| Hospice & palliative care | 60 | 254.6 | 0.09 | 0.75 | 122 of 360 | 87936 (-94), 88427 (-76), 87937 (-72) | 87315 (+100), 87583 (+89), 87710 (+79) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in New Mexico in households with no vehicle: about 91,666 of 1,637,240 (5.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 11
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 360 | 87038 (+57), 87005 (+10), 88046 (+10) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 360 | 88046 (+20), 87005 (+16), 87322 (+9) | 1.00 |
| Women's health / OB-GYN | 1.00 | 2 of 360 | 87005 (+24), 87038 (+18), 88046 (+13) | 1.00 |
| Mental health & counseling | 1.00 | 2 of 360 | 88046 (+18), 87005 (+17), 87038 (+13) | 1.00 |
| Dental | 1.00 | 1 of 360 | 87038 (+58), 87005 (+14), 88046 (+9) | 1.00 |
| Eye care | 1.00 | 1 of 360 | 87038 (+16), 87102 (+7), 87322 (+7) | 1.00 |
| Chiropractic | 1.00 | 0 of 360 | 88022 (+6), 88046 (+6), 87102 (+5) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 360 | 88046 (+11), 87832 (+8), 87005 (+7) | 1.00 |
| Orthopedics & sports injury | 1.00 | 0 of 360 | 88046 (+12), 87322 (+7), 88022 (+7) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 360 | 88046 (+9), 87108 (+3), 87322 (+3) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 360 | 88022 (+13), 87072 (+5), 87102 (+4) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 360 | 87102 (+8), 88046 (+7), 87106 (+6) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 360 | 87322 (+13), 87560 (+11), 87102 (+7) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 360 | 88046 (+7), 87102 (+5), 87108 (+3) | 1.00 |
| Kidney / nephrology | 0.99 | 2 of 360 | 87038 (+43), 87005 (+32), 87322 (+13) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 360 | 88046 (+10), 87102 (+7), 87461 (+5) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 360 | 87038 (+15), 88046 (+6), 87007 (+4) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 360 | 87102 (+7), 87072 (+5), 87108 (+5) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 360 | 87731 (+7), 87560 (+6), 87102 (+4) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 360 | 88022 (+9), 88046 (+5), 87102 (+4) | 1.00 |
| Urology | 1.00 | 0 of 360 | 88022 (+9), 88046 (+7), 87322 (+6) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 2 of 360 | 87038 (+31), 87005 (+22), 87731 (+13) | 1.00 |
| Pain management | 1.00 | 0 of 360 | 88046 (+12), 87102 (+6), 87106 (+5) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 0 of 360 | 87038 (+14), 87007 (+4), 88022 (+4) | 1.00 |
| Speech & language therapy | 1.00 | 0 of 360 | 87832 (+11), 88022 (+7), 87005 (+6) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 360 | 88046 (+9), 87102 (+7), 87106 (+6) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 360 | 87832 (+15), 87005 (+14), 88022 (+11) | 1.00 |
| Urgent care & emergency | 0.99 | 2 of 360 | 87038 (+100), 87005 (+24), 87832 (+11) | 1.00 |
| Imaging & lab | 1.00 | 0 of 360 | 88046 (+8), 87102 (+5), 87005 (+4) | 1.00 |
| Pharmacy | 0.99 | 1 of 360 | 87038 (+51), 87005 (+11), 87102 (+10) | 1.00 |
| Home health & in-home care | 1.00 | 1 of 360 | 87005 (+25), 87038 (+11), 87102 (+5) | 1.00 |
| Nursing & assisted living | 1.00 | 2 of 360 | 87038 (+18), 87005 (+17), 87102 (+7) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 360 | 87005 (+24), 87038 (+23), 87832 (+9) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 360 | 87832 (+15), 87102 (+10), 88046 (+10) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 360 | 87108 (+8), 88135 (+4), 87005 (+3) | 1.00 |
| Care coordination & community health | 1.00 | 4 of 360 | 87038 (+57), 87832 (+29), 87005 (+25) | 1.00 |
| General surgery | 1.00 | 1 of 360 | 87038 (+16), 87005 (+14), 88046 (+10) | 1.00 |
| Infectious disease | 1.00 | 0 of 360 | 87038 (+14), 87005 (+10), 88046 (+7) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 360 | 87038 (+22), 87072 (+8), 87560 (+7) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 360 | 87832 (+13), 87731 (+11), 88046 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 87102 | Primary care / family doctor | 5.431 | 5.911 | 37 | 31 |
| 87102 | Mental health & counseling | 13.219 | 14.314 | 8 | 1 |
| 87102 | Heart / cardiology | 0.212 | 0.192 | 55 | 60 |
| 87102 | Cancer care / oncology | 0.147 | 0.121 | 52 | 61 |
| 87102 | Urgent care & emergency | 0.547 | 0.618 | 42 | 34 |
| 87501 | Primary care / family doctor | 4.706 | 6.610 | 45 | 23 |
| 87501 | Mental health & counseling | 16.144 | 21.426 | 0 | 0 |
| 87501 | Heart / cardiology | 0.189 | 0.201 | 60 | 58 |
| 87501 | Cancer care / oncology | 0.139 | 0.082 | 55 | 73 |
| 87501 | Urgent care & emergency | 0.573 | 0.791 | 39 | 15 |
| 88001 | Primary care / family doctor | 4.710 | 4.985 | 45 | 42 |
| 88001 | Mental health & counseling | 12.722 | 14.085 | 12 | 2 |
| 88001 | Heart / cardiology | 0.286 | 0.208 | 40 | 56 |
| 88001 | Cancer care / oncology | 0.148 | 0.106 | 52 | 66 |
| 88001 | Urgent care & emergency | 0.409 | 0.433 | 56 | 54 |
| 87401 | Primary care / family doctor | 3.445 | 4.682 | 60 | 46 |
| 87401 | Mental health & counseling | 6.690 | 8.931 | 54 | 38 |
| 87401 | Heart / cardiology | 0.139 | 0.147 | 71 | 69 |
| 87401 | Cancer care / oncology | 0.089 | 0.122 | 71 | 60 |
| 87401 | Urgent care & emergency | 0.468 | 0.627 | 50 | 33 |
| 88201 | Primary care / family doctor | 3.729 | 4.432 | 57 | 48 |
| 88201 | Mental health & counseling | 4.388 | 5.051 | 70 | 65 |
| 88201 | Heart / cardiology | 0.110 | 0.122 | 77 | 74 |
| 88201 | Cancer care / oncology | 0.114 | 0.104 | 63 | 66 |
| 88201 | Urgent care & emergency | 0.583 | 0.712 | 38 | 24 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 26 of 360 | 19,845 (1.2%) |  | 5/46 | 16/115 | 2/26 | 3/173 |
| Women's health / OB-GYN | 016 | 13 of 360 | 5,357 (0.3%) |  | 0/46 | 8/115 | 0/26 | 5/173 |
| Mental health & counseling: Psychiatry | 029 | 23 of 360 | 16,271 (1.0%) |  | 0/46 | 13/115 | 0/26 | 10/173 |
| Mental health & counseling: Clinical Psychology | 036 | 11 of 360 | 7,288 (0.4%) |  | 1/46 | 8/115 | 0/26 | 2/173 |
| Mental health & counseling: Clinical Social Work | 037 | 14 of 360 | 16,572 (1.0%) |  | 1/46 | 12/115 | 0/26 | 1/173 |
| Eye care | 023 | 25 of 360 | 12,709 (0.8%) |  | 4/46 | 11/115 | 1/26 | 9/173 |
| Chiropractic | 010 | 10 of 360 | 5,051 (0.3%) |  | 0/46 | 6/115 | 0/26 | 4/173 |
| Physical & occupational therapy | F049 | 7 of 360 | 1,823 (0.1%) |  | 0/46 | 1/115 | 0/26 | 6/173 |
| Orthopedics & sports injury | 025 | 38 of 360 | 32,025 (2.0%) |  | 2/46 | 17/115 | 1/26 | 18/173 |
| Heart / cardiology | 008 | 76 of 360 | 57,655 (3.5%) |  | 8/46 | 24/115 | 1/26 | 43/173 |
| Skin / dermatology | 011 | 63 of 360 | 94,207 (5.8%) |  | 4/46 | 23/115 | 1/26 | 35/173 |
| Allergy & immunology | 007 | 60 of 360 | 46,034 (2.8%) |  | 3/46 | 11/115 | 16/26 | 30/173 |
| Lung, breathing & sleep | 030 | 31 of 360 | 14,615 (0.9%) |  | 1/46 | 16/115 | 1/26 | 13/173 |
| Digestive / gastroenterology | 014 | 89 of 360 | 62,083 (3.8%) |  | 2/46 | 21/115 | 13/26 | 53/173 |
| Kidney / nephrology | 018 | 16 of 360 | 6,469 (0.4%) |  | 2/46 | 8/115 | 0/26 | 6/173 |
| Diabetes & hormones | 012 | 22 of 360 | 9,428 (0.6%) |  | 0/46 | 7/115 | 3/26 | 12/173 |
| Cancer care / oncology | 021 | 74 of 360 | 123,467 (7.5%) |  | 3/46 | 30/115 | 16/26 | 25/173 |
| Arthritis / rheumatology | 031 | 57 of 360 | 30,604 (1.9%) |  | 0/46 | 11/115 | 12/26 | 34/173 |
| Brain & nerves / neurology | 019 | 33 of 360 | 17,267 (1.1%) |  | 1/46 | 19/115 | 1/26 | 12/173 |
| Ear, nose & throat | 013 | 78 of 360 | 103,006 (6.3%) |  | 4/46 | 18/115 | 17/26 | 39/173 |
| Urology | 033 | 70 of 360 | 120,081 (7.3%) |  | 3/46 | 29/115 | 8/26 | 30/173 |
| Foot & ankle / podiatry | 028 | 47 of 360 | 26,422 (1.6%) |  | 2/46 | 13/115 | 1/26 | 31/173 |
| Plastic & reconstructive surgery | 027 | 79 of 360 | 174,092 (10.6%) |  | 0/46 | 32/115 | 2/26 | 45/173 |
| Speech & language therapy | F051 | 7 of 360 | 4,491 (0.3%) |  | 0/46 | 6/115 | 0/26 | 1/173 |
| Imaging & lab | F047 | 17 of 360 | 13,603 (0.8%) |  | 1/46 | 5/115 | 1/26 | 10/173 |
| Nursing & assisted living | F046 | 21 of 360 | 13,363 (0.8%) |  | 1/46 | 11/115 | 1/26 | 8/173 |
| General surgery | 015 | 48 of 360 | 29,656 (1.8%) |  | 5/46 | 22/115 | 2/26 | 19/173 |
| Infectious disease | 017 | 51 of 360 | 37,732 (2.3%) |  | 0/46 | 12/115 | 13/26 | 26/173 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
