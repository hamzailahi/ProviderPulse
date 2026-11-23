# E2SFCA access dry run: West Virginia

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,999; in West Virginia: 729
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,999 x 3,999 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 842,407.599; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.08 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.69), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 7; re-anchored: 7; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 15450 | no | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | no | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 24726 | yes | 8.81 | 100% | 4.28 | 100% | yes (1.09) |
| 24823 | yes | 8.92 | 100% | 4.73 | 100% | yes (1.45) |
| 25848 | yes | 7.88 | 100% | 3.94 | 100% | yes (1.55) |
| 25864 | yes | 8.64 | 100% | 3.08 | 100% | yes (1.46) |
| 41317 | no | 8.53 | 100% | 3.97 | 100% | yes (1.29) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 96,293.399 | 4.30 | 0.55 | 357 of 729 | 25920 (-57), 25043 (-48), 25133 (-42) | 25025 (+100), 25907 (+100), 24729 (+97) |
| Pediatrics (children) | 30 | 25,338.6 | 1.11 | 0.66 | 242 of 729 | 26325 (-55), 25411 (-52), 26327 (-52) | 25025 (+100), 25201 (+89), 25315 (+83) |
| Women's health / OB-GYN | 60 | 10,930.6 | 0.53 | 0.59 | 210 of 729 | 25082 (-45), 25560 (-43), 25503 (-41) | 26541 (+56), 26542 (+55), 25201 (+53) |
| Mental health & counseling | 30 | 162,350.6 | 7.20 | 0.72 | 186 of 729 | 25043 (-47), 25920 (-39), 25661 (-38) | 25517 (+95), 25555 (+93), 24729 (+83) |
| Dental | 30 | 32,429.8 | 1.65 | 0.62 | 237 of 729 | 25043 (-64), 25211 (-63), 26617 (-60) | 25201 (+65), 26884 (+59), 25315 (+55) |
| Eye care | 30 | 13,216 | 0.62 | 0.72 | 268 of 729 | 25920 (-60), 25876 (-56), 25875 (-42) | 26268 (+100), 24941 (+97), 26278 (+97) |
| Chiropractic | 30 | 10,516.6 | 0.63 | 0.72 | 167 of 729 | 24945 (-49), 26260 (-26), 25854 (-24) | 24993 (+68), 26180 (+66), 25571 (+49) |
| Physical & occupational therapy | 30 | 61,186.6 | 2.70 | 0.67 | 254 of 729 | 26807 (-43), 25112 (-41), 25303 (-36) | 25907 (+85), 25025 (+81), 25431 (+77) |
| Orthopedics & sports injury | 60 | 9,427.8 | 0.39 | 0.66 | 341 of 729 | 25843 (-98), 24977 (-81), 25825 (-81) | 24941 (+90), 26268 (+80), 25025 (+78) |
| Heart / cardiology | 60 | 5,323.8 | 0.24 | 0.62 | 372 of 729 | 25843 (-92), 25061 (-88), 25560 (-88) | 24941 (+82), 24808 (+79), 26254 (+67) |
| Skin / dermatology | 60 | 1,883.2 | 0.09 | 0.70 | 215 of 729 | 25526 (-47), 26374 (-47), 26544 (-45) | 24993 (+83), 24848 (+82), 24808 (+76) |
| Allergy & immunology | 60 | 805.4 | 0.03 | 0.63 | 315 of 729 | 25320 (-90), 25529 (-84), 25071 (-83) | 24808 (+90), 25160 (+86), 24848 (+83) |
| Lung, breathing & sleep | 60 | 2,542.8 | 0.13 | 0.70 | 349 of 729 | 25843 (-71), 25825 (-59), 26544 (-59) | 25025 (+83), 25755 (+83), 26036 (+72) |
| Digestive / gastroenterology | 60 | 2,455.8 | 0.11 | 0.62 | 355 of 729 | 25560 (-80), 25526 (-70), 25035 (-67) | 25025 (+73), 26036 (+68), 24941 (+65) |
| Kidney / nephrology | 60 | 2,486.2 | 0.11 | 0.63 | 421 of 729 | 25843 (-60), 25560 (-59), 24977 (-58) | 26137 (+97), 24941 (+90), 25755 (+84) |
| Diabetes & hormones | 60 | 1,363.6 | 0.06 | 0.69 | 258 of 729 | 26544 (-93), 26588 (-87), 26554 (-82) | 25755 (+91), 26852 (+67), 25025 (+66) |
| Cancer care / oncology | 90 | 3,262.8 | 0.15 | 0.45 | 481 of 729 | 25560 (-63), 25526 (-60), 25082 (-59) | 25628 (+85), 26036 (+81), 25632 (+78) |
| Arthritis / rheumatology | 60 | 805.8 | 0.04 | 0.60 | 221 of 729 | 25560 (-78), 25526 (-74), 26554 (-72) | 26349 (+71), 26386 (+71), 26451 (+66) |
| Brain & nerves / neurology | 60 | 3,979 | 0.22 | 0.62 | 219 of 729 | 26544 (-77), 26588 (-73), 26554 (-72) | 25755 (+83), 25315 (+61), 25570 (+61) |
| Ear, nose & throat | 60 | 1,433.4 | 0.07 | 0.69 | 325 of 729 | 25082 (-96), 25843 (-94), 24977 (-91) | 25755 (+94), 24941 (+83), 24993 (+72) |
| Urology | 60 | 1,596.6 | 0.07 | 0.66 | 455 of 729 | 25560 (-95), 25526 (-91), 25843 (-83) | 24993 (+100), 25093 (+83), 25755 (+83) |
| Foot & ankle / podiatry | 60 | 3,622.6 | 0.15 | 0.67 | 324 of 729 | 25843 (-65), 25825 (-53), 25082 (-49) | 24993 (+85), 24941 (+73), 26419 (+73) |
| Pain management | 60 | 1,624.2 | 0.09 | 0.62 | 286 of 729 | 24910 (-100), 24943 (-100), 24977 (-100) | 24941 (+78), 26349 (+74), 25025 (+70) |
| Plastic & reconstructive surgery | 90 | 1,256.4 | 0.07 | 0.43 | 403 of 729 | 25061 (-78), 25035 (-74), 25067 (-74) | 26074 (+77), 26542 (+76), 24736 (+74) |
| Speech & language therapy | 30 | 18,355.6 | 0.90 | 0.69 | 301 of 729 | 26151 (-61), 25043 (-50), 25920 (-45) | 25025 (+100), 25907 (+96), 25908 (+88) |
| Nutrition & dietitian | 30 | 6,655.6 | 0.33 | 0.79 | 163 of 729 | 26720 (-48), 25040 (-44), 26717 (-44) | 25570 (+90), 25555 (+87), 25755 (+75) |
| Acupuncture, massage & naturopathy | 30 | 6,825.6 | 0.52 | 0.68 | 196 of 729 | 26866 (-72), 25021 (-36), 26624 (-35) | 24991 (+100), 24941 (+88), 24729 (+82) |
| Urgent care & emergency | 30 | 9,927.6 | 0.47 | 0.72 | 311 of 729 | 24927 (-60), 26209 (-60), 26294 (-56) | 24993 (+100), 25025 (+100), 26138 (+100) |
| Imaging & lab | 60 | 9,798.4 | 0.49 | 0.64 | 321 of 729 | 25843 (-91), 25560 (-74), 25526 (-66) | 24993 (+87), 25025 (+76), 25755 (+76) |
| Pharmacy | 30 | 38,363.8 | 1.72 | 0.53 | 408 of 729 | 25920 (-57), 25209 (-56), 25043 (-55) | 25025 (+100), 25907 (+100), 25201 (+95) |
| Home health & in-home care | 30 | 108,652.2 | 1.61 | 0.23 | 20 of 729 | 24848 (-18), 26034 (-13), 26767 (-11) | 24984 (+100), 25936 (+100), 25942 (+100) |
| Nursing & assisted living | 60 | 9,829 | 0.39 | 0.52 | 403 of 729 | 25977 (-74), 25920 (-68), 26143 (-68) | 25942 (+100), 25936 (+92), 26141 (+81) |
| Medical equipment & supplies | 60 | 7,014.4 | 0.36 | 0.65 | 306 of 729 | 25977 (-64), 25843 (-63), 25082 (-57) | 25624 (+69), 25108 (+63), 25908 (+63) |
| Hearing & audiology | 60 | 4,135.6 | 0.19 | 0.69 | 393 of 729 | 25843 (-78), 25082 (-68), 25560 (-67) | 25755 (+93), 26268 (+81), 24848 (+76) |
| Behavior therapy (ABA) | 30 | 46,889.6 | 2.88 | 0.77 | 33 of 729 | 26292 (-63), 26260 (-62), 26716 (-31) | 26263 (+64), 25570 (+47), 26271 (+39) |
| Care coordination & community health | 30 | 64,958.4 | 1.63 | 0.58 | 308 of 729 | 24884 (-84), 24984 (-77), 24873 (-60) | 24993 (+100), 25936 (+100), 25942 (+100) |
| General surgery | 60 | 7,669 | 0.35 | 0.61 | 350 of 729 | 25843 (-83), 25083 (-80), 25560 (-78) | 25025 (+67), 26036 (+62), 26141 (+57) |
| Infectious disease | 90 | 1,159.2 | 0.05 | 0.47 | 305 of 729 | 25560 (-66), 25526 (-65), 25510 (-60) | 25025 (+78), 25028 (+78), 25114 (+76) |
| Genetics & genetic counseling | 90 | 732.6 | 0.03 | 0.37 | 159 of 729 | 26062 (-48), 26035 (-45), 26544 (-45) | 25270 (+90), 25671 (+90), 26161 (+90) |
| Hospice & palliative care | 60 | 1,333.8 | 0.09 | 0.68 | 247 of 729 | 26845 (-83), 26886 (-57), 26884 (-52) | 26444 (+74), 26320 (+73), 25524 (+70) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in West Virginia in households with no vehicle: about 115,713 of 1,432,282 (8.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 8
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 10 of 729 | 25755 (+95), 26236 (+62), 25624 (+52) | 1.00 |
| Pediatrics (children) | 0.99 | 5 of 729 | 25755 (+69), 25624 (+35), 24993 (+26) | 1.00 |
| Women's health / OB-GYN | 0.98 | 2 of 729 | 25755 (+39), 25942 (+20), 25126 (+13) | 1.00 |
| Mental health & counseling | 0.99 | 5 of 729 | 25755 (+91), 25624 (+27), 25301 (+26) | 1.00 |
| Dental | 0.99 | 5 of 729 | 25755 (+46), 25301 (+23), 25942 (+23) | 1.00 |
| Eye care | 0.99 | 5 of 729 | 25755 (+79), 25624 (+34), 25855 (+23) | 1.00 |
| Chiropractic | 0.99 | 2 of 729 | 25755 (+47), 25301 (+19), 25624 (+14) | 1.00 |
| Physical & occupational therapy | 0.99 | 5 of 729 | 25755 (+61), 25301 (+27), 25624 (+21) | 1.00 |
| Orthopedics & sports injury | 0.99 | 9 of 729 | 25755 (+47), 24993 (+39), 25942 (+28) | 1.00 |
| Heart / cardiology | 0.98 | 10 of 729 | 25755 (+60), 25126 (+43), 24993 (+37) | 1.00 |
| Skin / dermatology | 0.99 | 3 of 729 | 25755 (+44), 24993 (+29), 25301 (+15) | 1.00 |
| Allergy & immunology | 0.99 | 8 of 729 | 25755 (+53), 25126 (+48), 25624 (+24) | 1.00 |
| Lung, breathing & sleep | 0.99 | 7 of 729 | 25755 (+67), 25126 (+20), 25855 (+20) | 1.00 |
| Digestive / gastroenterology | 0.99 | 8 of 729 | 25755 (+44), 24993 (+26), 25301 (+26) | 1.00 |
| Kidney / nephrology | 0.98 | 10 of 729 | 25755 (+80), 25624 (+43), 24993 (+31) | 1.00 |
| Diabetes & hormones | 0.99 | 5 of 729 | 25755 (+78), 25126 (+30), 25301 (+23) | 1.00 |
| Cancer care / oncology | 0.98 | 6 of 729 | 25755 (+47), 25126 (+25), 25301 (+20) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 729 | 25755 (+56), 25126 (+18), 25301 (+18) | 1.00 |
| Brain & nerves / neurology | 0.99 | 3 of 729 | 25755 (+65), 25126 (+18), 24993 (+16) | 1.00 |
| Ear, nose & throat | 0.99 | 8 of 729 | 25755 (+78), 24993 (+52), 25126 (+24) | 1.00 |
| Urology | 0.98 | 11 of 729 | 25755 (+84), 24993 (+49), 25942 (+49) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 6 of 729 | 25755 (+59), 24993 (+32), 25942 (+25) | 1.00 |
| Pain management | 0.99 | 6 of 729 | 24993 (+100), 25755 (+63), 25855 (+21) | 1.00 |
| Plastic & reconstructive surgery | 0.98 | 11 of 729 | 25755 (+53), 25126 (+39), 25942 (+24) | 1.00 |
| Speech & language therapy | 0.99 | 7 of 729 | 25755 (+75), 25624 (+27), 25855 (+26) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 729 | 25755 (+91), 25126 (+26), 25301 (+23) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 4 of 729 | 25755 (+71), 24993 (+52), 25855 (+22) | 1.00 |
| Urgent care & emergency | 0.99 | 8 of 729 | 25755 (+89), 25624 (+44), 25126 (+32) | 1.00 |
| Imaging & lab | 0.97 | 11 of 729 | 25755 (+64), 24993 (+34), 25942 (+32) | 1.00 |
| Pharmacy | 0.99 | 8 of 729 | 25755 (+94), 25624 (+57), 25126 (+38) | 1.00 |
| Home health & in-home care | 0.89 | 3 of 729 | 25942 (+100), 24993 (+96), 25755 (+75) | 0.96 |
| Nursing & assisted living | 0.97 | 12 of 729 | 25942 (+69), 25755 (+60), 24993 (+58) | 1.00 |
| Medical equipment & supplies | 0.98 | 10 of 729 | 25755 (+58), 25942 (+36), 25624 (+33) | 1.00 |
| Hearing & audiology | 0.98 | 9 of 729 | 25755 (+70), 25942 (+36), 25855 (+24) | 1.00 |
| Behavior therapy (ABA) | 0.98 | 1 of 729 | 25755 (+34), 25109 (+4), 25301 (+4) | 0.99 |
| Care coordination & community health | 0.98 | 10 of 729 | 24993 (+94), 25755 (+86), 25126 (+57) | 1.00 |
| General surgery | 0.98 | 10 of 729 | 25755 (+45), 25942 (+37), 25126 (+29) | 1.00 |
| Infectious disease | 0.99 | 4 of 729 | 25755 (+38), 25126 (+23), 25301 (+17) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 729 | 25624 (+8), 24855 (+7), 26534 (+6) | 1.00 |
| Hospice & palliative care | 0.99 | 5 of 729 | 25755 (+21), 25624 (+20), 24993 (+16) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 43 of 727 | 52,550 (3.7%) |  | 33/195 | 9/186 | 1/327 | 0/19 |
| Women's health / OB-GYN | 016 | 8 of 727 | 2,569 (0.2%) |  | 8/195 | 0/186 | 0/327 | 0/19 |
| Mental health & counseling: Psychiatry | 029 | 16 of 727 | 4,108 (0.3%) |  | 9/195 | 2/186 | 5/327 | 0/19 |
| Mental health & counseling: Clinical Psychology | 036 | 3 of 727 | 273 (0.0%) |  | 1/195 | 1/186 | 1/327 | 0/19 |
| Mental health & counseling: Clinical Social Work | 037 | 14 of 727 | 4,968 (0.3%) |  | 10/195 | 4/186 | 0/327 | 0/19 |
| Eye care | 023 | 23 of 727 | 6,887 (0.5%) |  | 18/195 | 4/186 | 1/327 | 0/19 |
| Chiropractic | 010 | 5 of 727 | 1,416 (0.1%) |  | 5/195 | 0/186 | 0/327 | 0/19 |
| Physical & occupational therapy | F049 | 1 of 727 | 221 (0.0%) |  | 1/195 | 0/186 | 0/327 | 0/19 |
| Orthopedics & sports injury | 025 | 43 of 727 | 32,577 (2.3%) |  | 35/195 | 5/186 | 3/327 | 0/19 |
| Heart / cardiology | 008 | 42 of 727 | 19,776 (1.4%) |  | 32/195 | 8/186 | 2/327 | 0/19 |
| Skin / dermatology | 011 | 57 of 727 | 29,749 (2.1%) |  | 10/195 | 10/186 | 37/327 | 0/19 |
| Allergy & immunology | 007 | 65 of 727 | 45,421 (3.2%) |  | 9/195 | 8/186 | 41/327 | 7/19 |
| Lung, breathing & sleep | 030 | 43 of 727 | 23,914 (1.7%) |  | 10/195 | 9/186 | 24/327 | 0/19 |
| Digestive / gastroenterology | 014 | 61 of 727 | 39,945 (2.8%) |  | 11/195 | 12/186 | 38/327 | 0/19 |
| Kidney / nephrology | 018 | 8 of 727 | 2,567 (0.2%) |  | 8/195 | 0/186 | 0/327 | 0/19 |
| Diabetes & hormones | 012 | 5 of 727 | 3,532 (0.2%) |  | 0/195 | 0/186 | 5/327 | 0/19 |
| Cancer care / oncology | 021 | 32 of 727 | 24,571 (1.7%) |  | 7/195 | 7/186 | 18/327 | 0/19 |
| Arthritis / rheumatology | 031 | 18 of 727 | 24,524 (1.7%) |  | 10/195 | 0/186 | 8/327 | 0/19 |
| Brain & nerves / neurology | 019 | 53 of 727 | 33,812 (2.4%) |  | 8/195 | 11/186 | 34/327 | 0/19 |
| Ear, nose & throat | 013 | 34 of 727 | 14,096 (1.0%) |  | 10/195 | 15/186 | 9/327 | 0/19 |
| Urology | 033 | 14 of 727 | 4,829 (0.3%) |  | 5/195 | 2/186 | 7/327 | 0/19 |
| Foot & ankle / podiatry | 028 | 18 of 727 | 7,669 (0.5%) |  | 7/195 | 2/186 | 9/327 | 0/19 |
| Plastic & reconstructive surgery | 027 | 0 of 727 | 0 (0.0%) |  | 0/195 | 0/186 | 0/327 | 0/19 |
| Speech & language therapy | F051 | 9 of 727 | 2,755 (0.2%) |  | 9/195 | 0/186 | 0/327 | 0/19 |
| Imaging & lab | F047 | 1 of 727 | 98 (0.0%) |  | 1/195 | 0/186 | 0/327 | 0/19 |
| Nursing & assisted living | F046 | 7 of 727 | 2,381 (0.2%) |  | 7/195 | 0/186 | 0/327 | 0/19 |
| General surgery | 015 | 46 of 727 | 22,071 (1.5%) |  | 36/195 | 9/186 | 1/327 | 0/19 |
| Infectious disease | 017 | 13 of 727 | 5,233 (0.4%) |  | 4/195 | 0/186 | 9/327 | 0/19 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 29160 rows (ZIP x specialty) stored in access_e2sfca for WV; market-score now uses drive-time access for these ZIPs.
