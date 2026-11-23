# E2SFCA access dry run: Alabama

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,606; in Alabama: 643
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,606 x 1,606 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 348,451.199; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.56 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.40), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (28771, 70038, 70041)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 28771 | no | 6.78 | 100% | 6.78 | 100% | no |
| 70038 | no | 1.83 | 8% | 1.83 | 8% | no |
| 70041 | no | 1.83 | 8% | 1.83 | 8% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 55,218.2 | 4.30 | 0.58 | 263 of 643 | 35042 (-65), 36518 (-59), 35058 (-40) | 36856 (+74), 36043 (+67), 35127 (+63) |
| Pediatrics (children) | 30 | 10,525.2 | 1.11 | 0.71 | 126 of 643 | 36761 (-54), 35124 (-51), 35071 (-39) | 36527 (+60), 35127 (+59), 35803 (+51) |
| Women's health / OB-GYN | 60 | 6,092 | 0.53 | 0.72 | 177 of 643 | 36574 (-46), 35052 (-43), 35022 (-41) | 35748 (+56), 35803 (+55), 35127 (+53) |
| Mental health & counseling | 30 | 58,051.2 | 7.20 | 0.66 | 111 of 643 | 36083 (-56), 36088 (-41), 35976 (-38) | 36856 (+53), 36874 (+43), 35147 (+41) |
| Dental | 30 | 16,417 | 1.65 | 0.68 | 189 of 643 | 36904 (-33), 35249 (-29), 35055 (-25) | 35176 (+55), 36353 (+55), 35748 (+53) |
| Eye care | 30 | 7,193.6 | 0.62 | 0.67 | 273 of 643 | 35653 (-47), 36037 (-39), 36732 (-37) | 35147 (+66), 36311 (+64), 35043 (+62) |
| Chiropractic | 30 | 7,766.6 | 0.63 | 0.67 | 208 of 643 | 35055 (-40), 35768 (-37), 35565 (-33) | 35621 (+60), 35053 (+58), 35098 (+55) |
| Physical & occupational therapy | 30 | 27,942.6 | 2.70 | 0.66 | 200 of 643 | 36744 (-37), 36925 (-33), 35209 (-29) | 35464 (+71), 35459 (+66), 35443 (+65) |
| Orthopedics & sports injury | 60 | 4,827.4 | 0.39 | 0.71 | 224 of 643 | 35462 (-95), 35111 (-78), 36910 (-70) | 36865 (+65), 36036 (+64), 35748 (+61) |
| Heart / cardiology | 60 | 2,690.4 | 0.24 | 0.70 | 263 of 643 | 35022 (-63), 35111 (-57), 36541 (-56) | 36862 (+59), 35576 (+58), 35803 (+54) |
| Skin / dermatology | 60 | 951 | 0.09 | 0.72 | 229 of 643 | 35005 (-89), 35062 (-83), 35117 (-83) | 35458 (+69), 35578 (+67), 36263 (+67) |
| Allergy & immunology | 60 | 303.8 | 0.03 | 0.75 | 260 of 643 | 36003 (-66), 35052 (-58), 36786 (-53) | 36266 (+72), 36043 (+64), 35490 (+59) |
| Lung, breathing & sleep | 60 | 1,357.4 | 0.13 | 0.63 | 252 of 643 | 35005 (-71), 35117 (-68), 35062 (-65) | 35748 (+63), 35803 (+62), 35578 (+53) |
| Digestive / gastroenterology | 60 | 1,174.4 | 0.11 | 0.73 | 267 of 643 | 36541 (-71), 35022 (-65), 35062 (-65) | 36320 (+66), 36043 (+63), 36856 (+62) |
| Kidney / nephrology | 60 | 1,557.8 | 0.11 | 0.63 | 341 of 643 | 35062 (-77), 35052 (-76), 35078 (-73) | 36264 (+68), 36263 (+66), 36317 (+62) |
| Diabetes & hormones | 60 | 543.4 | 0.06 | 0.74 | 236 of 643 | 36541 (-62), 35071 (-58), 35022 (-57) | 36862 (+69), 35748 (+68), 35803 (+68) |
| Cancer care / oncology | 90 | 1,625.6 | 0.15 | 0.45 | 379 of 643 | 35052 (-67), 35022 (-64), 35146 (-63) | 35803 (+65), 35748 (+63), 35763 (+63) |
| Arthritis / rheumatology | 60 | 399.6 | 0.04 | 0.71 | 246 of 643 | 35111 (-93), 35117 (-88), 35005 (-81) | 36481 (+89), 36865 (+76), 36862 (+72) |
| Brain & nerves / neurology | 60 | 2,051.4 | 0.22 | 0.69 | 226 of 643 | 35111 (-63), 35022 (-62), 35117 (-61) | 36069 (+77), 35748 (+71), 35803 (+60) |
| Ear, nose & throat | 60 | 768.4 | 0.07 | 0.73 | 288 of 643 | 35052 (-83), 35146 (-79), 35111 (-77) | 36862 (+79), 36263 (+71), 36273 (+67) |
| Urology | 60 | 920.2 | 0.07 | 0.68 | 317 of 643 | 35005 (-73), 35062 (-73), 35022 (-70) | 35958 (+80), 35576 (+79), 36856 (+75) |
| Foot & ankle / podiatry | 60 | 1,350 | 0.15 | 0.71 | 173 of 643 | 36047 (-61), 35175 (-41), 35764 (-41) | 35464 (+47), 36093 (+47), 35552 (+46) |
| Pain management | 60 | 1,113 | 0.09 | 0.76 | 246 of 643 | 36370 (-68), 36907 (-68), 35146 (-62) | 35803 (+62), 35748 (+61), 35953 (+56) |
| Plastic & reconstructive surgery | 90 | 682.6 | 0.07 | 0.57 | 326 of 643 | 35111 (-58), 35022 (-54), 35074 (-53) | 35452 (+68), 35803 (+65), 35763 (+64) |
| Speech & language therapy | 30 | 8,588.2 | 0.90 | 0.68 | 165 of 643 | 36518 (-60), 36744 (-54), 36776 (-50) | 35043 (+76), 35051 (+73), 35115 (+62) |
| Nutrition & dietitian | 30 | 3,169.2 | 0.33 | 0.73 | 174 of 643 | 35042 (-52), 35447 (-52), 35053 (-51) | 36039 (+100), 36089 (+100), 36031 (+85) |
| Acupuncture, massage & naturopathy | 30 | 2,990.2 | 0.52 | 0.75 | 25 of 643 | 36040 (-32), 36089 (-29), 36071 (-20) | 36017 (+32), 36052 (+30), 36483 (+25) |
| Urgent care & emergency | 30 | 5,392.8 | 0.47 | 0.50 | 298 of 643 | 35447 (-81), 36518 (-72), 36278 (-65) | 36751 (+96), 36311 (+91), 36471 (+86) |
| Imaging & lab | 60 | 5,855.2 | 0.49 | 0.68 | 228 of 643 | 35005 (-71), 35062 (-67), 35022 (-66) | 35803 (+52), 36320 (+48), 36043 (+47) |
| Pharmacy | 30 | 22,608.4 | 1.72 | 0.57 | 324 of 643 | 36278 (-40), 35986 (-39), 35055 (-35) | 36856 (+82), 36875 (+73), 36093 (+66) |
| Home health & in-home care | 30 | 11,989.4 | 1.61 | 0.55 | 98 of 643 | 36860 (-76), 36538 (-74), 36728 (-47) | 36043 (+39), 36913 (+37), 36311 (+31) |
| Nursing & assisted living | 60 | 3,567.6 | 0.39 | 0.54 | 109 of 643 | 36925 (-41), 36919 (-40), 36773 (-31) | 36727 (+58), 36913 (+50), 36915 (+48) |
| Medical equipment & supplies | 60 | 5,557 | 0.36 | 0.62 | 274 of 643 | 36370 (-61), 36786 (-54), 36925 (-54) | 35552 (+60), 35578 (+60), 36751 (+59) |
| Hearing & audiology | 60 | 2,198.6 | 0.19 | 0.76 | 271 of 643 | 35062 (-62), 35005 (-60), 36574 (-60) | 35746 (+67), 36865 (+64), 35677 (+63) |
| Behavior therapy (ABA) | 30 | 21,880.6 | 2.88 | 0.72 | 83 of 643 | 36081 (-34), 36082 (-30), 36518 (-25) | 36856 (+88), 36483 (+69), 36875 (+68) |
| Care coordination & community health | 30 | 8,371.6 | 1.63 | 0.69 | 39 of 643 | 36083 (-64), 36088 (-64), 35976 (-28) | 36874 (+99), 36856 (+97), 36089 (+72) |
| General surgery | 60 | 4,393.8 | 0.35 | 0.57 | 291 of 643 | 36541 (-69), 36582 (-63), 36525 (-61) | 35803 (+64), 36043 (+62), 35763 (+56) |
| Infectious disease | 90 | 564.6 | 0.05 | 0.53 | 325 of 643 | 35022 (-66), 36578 (-65), 35023 (-64) | 35748 (+68), 35763 (+68), 35803 (+68) |
| Genetics & genetic counseling | 90 | 248.8 | 0.03 | 0.61 | 202 of 643 | 35649 (-32), 36541 (-32), 35615 (-31) | 35181 (+72), 35127 (+71), 35060 (+69) |
| Hospice & palliative care | 60 | 1,101.6 | 0.09 | 0.66 | 291 of 643 | 36047 (-78), 36736 (-76), 36786 (-66) | 35677 (+75), 36264 (+70), 35746 (+67) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Alabama in households with no vehicle: about 210,096 of 3,917,312 (5.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 19
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 4 of 643 | 35204 (+18), 36205 (+18), 36603 (+18) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 643 | 35036 (+16), 35207 (+15), 36603 (+14) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 643 | 35036 (+32), 35207 (+14), 36603 (+13) | 1.00 |
| Mental health & counseling | 1.00 | 0 of 643 | 36205 (+13), 35203 (+12), 35204 (+11) | 1.00 |
| Dental | 1.00 | 2 of 643 | 36205 (+21), 35204 (+16), 36603 (+14) | 1.00 |
| Eye care | 1.00 | 3 of 643 | 36205 (+25), 36865 (+19), 35207 (+16) | 1.00 |
| Chiropractic | 1.00 | 2 of 643 | 36205 (+21), 36603 (+15), 35203 (+12) | 1.00 |
| Physical & occupational therapy | 1.00 | 3 of 643 | 36865 (+18), 36205 (+17), 35204 (+16) | 1.00 |
| Orthopedics & sports injury | 0.99 | 6 of 643 | 35036 (+40), 36865 (+32), 35207 (+18) | 1.00 |
| Heart / cardiology | 1.00 | 4 of 643 | 35036 (+40), 36603 (+19), 35207 (+17) | 1.00 |
| Skin / dermatology | 1.00 | 3 of 643 | 35036 (+58), 36603 (+22), 35207 (+15) | 1.00 |
| Allergy & immunology | 1.00 | 2 of 643 | 35036 (+28), 36775 (+22), 36205 (+14) | 1.00 |
| Lung, breathing & sleep | 1.00 | 3 of 643 | 35036 (+47), 35207 (+18), 35204 (+15) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 643 | 35036 (+47), 35207 (+18), 35204 (+15) | 1.00 |
| Kidney / nephrology | 0.99 | 7 of 643 | 35036 (+49), 36205 (+33), 36775 (+30) | 1.00 |
| Diabetes & hormones | 1.00 | 3 of 643 | 35036 (+36), 35207 (+15), 36603 (+15) | 1.00 |
| Cancer care / oncology | 0.99 | 2 of 643 | 35036 (+42), 35207 (+15), 36603 (+13) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 643 | 35036 (+52), 36865 (+25), 36603 (+16) | 1.00 |
| Brain & nerves / neurology | 1.00 | 2 of 643 | 35036 (+39), 35207 (+16), 35204 (+12) | 1.00 |
| Ear, nose & throat | 1.00 | 3 of 643 | 35036 (+56), 36603 (+23), 36205 (+17) | 1.00 |
| Urology | 1.00 | 5 of 643 | 35036 (+48), 36603 (+24), 36205 (+20) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 1 of 643 | 35036 (+23), 36603 (+11), 36865 (+10) | 1.00 |
| Pain management | 1.00 | 3 of 643 | 35036 (+29), 36205 (+18), 36603 (+17) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 643 | 35036 (+29), 36603 (+15), 36865 (+13) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 643 | 36865 (+23), 35203 (+15), 35204 (+13) | 1.00 |
| Nutrition & dietitian | 1.00 | 3 of 643 | 35207 (+18), 36865 (+18), 36205 (+16) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 643 | 36603 (+5), 36865 (+5), 35089 (+3) | 1.00 |
| Urgent care & emergency | 1.00 | 5 of 643 | 35207 (+19), 36205 (+19), 35036 (+18) | 1.00 |
| Imaging & lab | 1.00 | 4 of 643 | 35036 (+53), 35207 (+21), 36603 (+21) | 1.00 |
| Pharmacy | 1.00 | 5 of 643 | 36865 (+29), 36205 (+23), 35036 (+22) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 643 | 36603 (+10), 35203 (+8), 35204 (+7) | 1.00 |
| Nursing & assisted living | 0.99 | 0 of 643 | 35036 (+14), 36603 (+12), 36775 (+11) | 1.00 |
| Medical equipment & supplies | 0.99 | 8 of 643 | 35036 (+45), 36603 (+24), 36482 (+20) | 1.00 |
| Hearing & audiology | 0.99 | 6 of 643 | 35036 (+45), 36865 (+28), 36603 (+21) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 643 | 35203 (+12), 35204 (+10), 35233 (+9) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 643 | 35204 (+5), 36865 (+5), 35036 (+4) | 1.00 |
| General surgery | 0.99 | 3 of 643 | 35036 (+39), 36603 (+22), 35207 (+16) | 1.00 |
| Infectious disease | 1.00 | 3 of 643 | 35036 (+40), 35207 (+15), 36603 (+15) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 643 | 35036 (+17), 35207 (+6), 36865 (+6) | 1.00 |
| Hospice & palliative care | 0.99 | 6 of 643 | 35036 (+37), 36205 (+21), 36482 (+21) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 45 of 643 | 95,707 (2.4%) |  | 39/318 | 4/102 | 2/223 |  |
| Women's health / OB-GYN | 016 | 4 of 643 | 3,176 (0.1%) |  | 4/318 | 0/102 | 0/223 |  |
| Mental health & counseling: Psychiatry | 029 | 23 of 643 | 30,231 (0.8%) |  | 6/318 | 3/102 | 14/223 |  |
| Mental health & counseling: Clinical Psychology | 036 | 8 of 643 | 5,248 (0.1%) |  | 3/318 | 0/102 | 5/223 |  |
| Mental health & counseling: Clinical Social Work | 037 | 9 of 643 | 12,612 (0.3%) |  | 8/318 | 1/102 | 0/223 |  |
| Eye care | 023 | 22 of 643 | 43,115 (1.1%) |  | 21/318 | 1/102 | 0/223 |  |
| Chiropractic | 010 | 2 of 643 | 1,622 (0.0%) |  | 2/318 | 0/102 | 0/223 |  |
| Physical & occupational therapy | F049 | 2 of 643 | 1,622 (0.0%) |  | 2/318 | 0/102 | 0/223 |  |
| Orthopedics & sports injury | 025 | 18 of 643 | 34,385 (0.9%) |  | 18/318 | 0/102 | 0/223 |  |
| Heart / cardiology | 008 | 58 of 643 | 101,839 (2.6%) |  | 34/318 | 1/102 | 23/223 |  |
| Skin / dermatology | 011 | 67 of 643 | 110,489 (2.8%) |  | 11/318 | 5/102 | 51/223 |  |
| Allergy & immunology | 007 | 38 of 643 | 119,819 (3.1%) |  | 21/318 | 1/102 | 16/223 |  |
| Lung, breathing & sleep | 030 | 6 of 643 | 5,999 (0.2%) |  | 4/318 | 0/102 | 2/223 |  |
| Digestive / gastroenterology | 014 | 88 of 643 | 169,505 (4.3%) |  | 15/318 | 14/102 | 59/223 |  |
| Kidney / nephrology | 018 | 4 of 643 | 5,555 (0.1%) |  | 4/318 | 0/102 | 0/223 |  |
| Diabetes & hormones | 012 | 17 of 643 | 18,352 (0.5%) |  | 4/318 | 0/102 | 13/223 |  |
| Cancer care / oncology | 021 | 28 of 643 | 32,473 (0.8%) |  | 9/318 | 1/102 | 18/223 |  |
| Arthritis / rheumatology | 031 | 22 of 643 | 30,429 (0.8%) |  | 5/318 | 0/102 | 17/223 |  |
| Brain & nerves / neurology | 019 | 17 of 643 | 16,774 (0.4%) |  | 7/318 | 0/102 | 10/223 |  |
| Ear, nose & throat | 013 | 31 of 643 | 72,268 (1.8%) |  | 16/318 | 0/102 | 15/223 |  |
| Urology | 033 | 47 of 643 | 66,240 (1.7%) |  | 7/318 | 0/102 | 40/223 |  |
| Foot & ankle / podiatry | 028 | 14 of 643 | 11,121 (0.3%) |  | 4/318 | 1/102 | 9/223 |  |
| Plastic & reconstructive surgery | 027 | 20 of 643 | 18,527 (0.5%) |  | 2/318 | 0/102 | 18/223 |  |
| Speech & language therapy | F051 | 7 of 643 | 5,960 (0.2%) |  | 3/318 | 0/102 | 4/223 |  |
| Imaging & lab | F047 | 11 of 643 | 9,631 (0.2%) |  | 4/318 | 0/102 | 7/223 |  |
| Nursing & assisted living | F046 | 1 of 643 | 181 (0.0%) |  | 1/318 | 0/102 | 0/223 |  |
| General surgery | 015 | 39 of 643 | 112,316 (2.9%) |  | 38/318 | 1/102 | 0/223 |  |
| Infectious disease | 017 | 16 of 643 | 17,701 (0.5%) |  | 4/318 | 0/102 | 12/223 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 25720 rows (ZIP x specialty) stored in access_e2sfca for AL; market-score now uses drive-time access for these ZIPs.
