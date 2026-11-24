# E2SFCA access dry run: Oregon

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 798; in Oregon: 422
- Drive times: OSRM on OpenStreetMap roads (car profile), 798 x 798 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 230,065; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.64 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.59), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (97842, 98303)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 97842 | yes | 6.71 | 100% | 6.71 | 100% | no |
| 98303 | no | 7.02 | 100% | 7.02 | 100% | no |
| 98556 | no | 6.83 | 100% | 3.37 | 100% | yes (1.37) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 22,770 | 4.30 | 0.54 | 191 of 421 | 97037 (-52), 97761 (-49), 97731 (-47) | 97001 (+100), 97732 (+82), 97539 (+71) |
| Pediatrics (children) | 30 | 5,008.4 | 1.11 | 0.74 | 138 of 421 | 97731 (-54), 97037 (-45), 97031 (-31) | 97759 (+66), 97231 (+62), 97707 (+59) |
| Women's health / OB-GYN | 60 | 4,256.8 | 0.53 | 0.82 | 146 of 421 | 97348 (-74), 97032 (-64), 97020 (-60) | 97406 (+100), 97624 (+100), 97522 (+86) |
| Mental health & counseling | 30 | 70,327 | 7.20 | 0.61 | 205 of 421 | 97844 (-63), 97051 (-59), 97818 (-54) | 97625 (+100), 97632 (+100), 97639 (+100) |
| Dental | 30 | 12,040.4 | 1.65 | 0.68 | 233 of 421 | 97761 (-52), 97634 (-42), 97830 (-33) | 97817 (+84), 97840 (+81), 97023 (+73) |
| Eye care | 30 | 3,540 | 0.62 | 0.58 | 202 of 421 | 97761 (-33), 97365 (-31), 97141 (-27) | 97144 (+97), 97819 (+95), 97837 (+94) |
| Chiropractic | 30 | 5,316.2 | 0.63 | 0.71 | 197 of 421 | 97342 (-85), 97350 (-74), 97063 (-49) | 97707 (+100), 97732 (+100), 97760 (+78) |
| Physical & occupational therapy | 30 | 15,205.6 | 2.70 | 0.73 | 166 of 421 | 97031 (-33), 97219 (-30), 97239 (-25) | 97827 (+68), 97876 (+66), 97867 (+65) |
| Orthopedics & sports injury | 60 | 2,089.8 | 0.39 | 0.75 | 112 of 421 | 97446 (-53), 97327 (-39), 97352 (-37) | 97326 (+76), 97406 (+75), 97624 (+75) |
| Heart / cardiology | 60 | 857.6 | 0.24 | 0.79 | 101 of 421 | 97348 (-37), 97070 (-31), 97071 (-31) | 97624 (+83), 97522 (+68), 97539 (+62) |
| Skin / dermatology | 60 | 452.2 | 0.09 | 0.84 | 142 of 421 | 97348 (-57), 97020 (-55), 97032 (-47) | 97624 (+87), 97522 (+77), 97539 (+65) |
| Allergy & immunology | 60 | 111.2 | 0.03 | 0.80 | 118 of 421 | 97020 (-44), 97032 (-41), 97348 (-40) | 97624 (+100), 97451 (+61), 97454 (+60) |
| Lung, breathing & sleep | 60 | 580.6 | 0.13 | 0.83 | 112 of 421 | 97020 (-51), 97070 (-45), 97032 (-41) | 97023 (+78), 97022 (+70), 97466 (+70) |
| Digestive / gastroenterology | 60 | 509 | 0.11 | 0.87 | 107 of 421 | 97020 (-47), 97032 (-47), 97348 (-42) | 97023 (+84), 97431 (+71), 97452 (+67) |
| Kidney / nephrology | 60 | 418.2 | 0.11 | 0.83 | 89 of 421 | 97032 (-37), 97020 (-33), 97071 (-30) | 97357 (+45), 97818 (+45), 97711 (+44) |
| Diabetes & hormones | 60 | 278.6 | 0.06 | 0.84 | 143 of 421 | 97348 (-49), 97032 (-48), 97020 (-47) | 97326 (+64), 97733 (+64), 97522 (+63) |
| Cancer care / oncology | 90 | 675.4 | 0.15 | 0.71 | 217 of 421 | 97026 (-48), 97032 (-47), 97020 (-46) | 97406 (+83), 97039 (+59), 97454 (+56) |
| Arthritis / rheumatology | 60 | 167.6 | 0.04 | 0.83 | 141 of 421 | 97348 (-62), 97446 (-55), 97456 (-47) | 97326 (+72), 97707 (+65), 97522 (+64) |
| Brain & nerves / neurology | 60 | 944 | 0.22 | 0.87 | 115 of 421 | 97032 (-51), 97020 (-43), 97071 (-43) | 97522 (+56), 97454 (+52), 97204 (+49) |
| Ear, nose & throat | 60 | 364.4 | 0.07 | 0.82 | 156 of 421 | 97417 (-73), 97469 (-71), 97833 (-66) | 97039 (+84), 97023 (+81), 97624 (+68) |
| Urology | 60 | 332.4 | 0.07 | 0.78 | 154 of 421 | 97348 (-65), 97446 (-46), 97020 (-44) | 97429 (+91), 97039 (+87), 97023 (+83) |
| Foot & ankle / podiatry | 60 | 619.6 | 0.15 | 0.75 | 113 of 421 | 97071 (-32), 97348 (-32), 97032 (-28) | 97624 (+100), 97837 (+100), 97877 (+89) |
| Pain management | 60 | 385 | 0.09 | 0.87 | 83 of 421 | 97446 (-57), 97537 (-50), 97020 (-40) | 97406 (+100), 97522 (+90), 97326 (+86) |
| Plastic & reconstructive surgery | 90 | 273.8 | 0.07 | 0.74 | 162 of 421 | 97739 (-69), 97754 (-62), 97734 (-61) | 97326 (+58), 97007 (+51), 97267 (+49) |
| Speech & language therapy | 30 | 4,294.6 | 0.90 | 0.71 | 135 of 421 | 97830 (-62), 97390 (-56), 97031 (-28) | 97490 (+71), 97001 (+65), 97754 (+53) |
| Nutrition & dietitian | 30 | 2,046.2 | 0.33 | 0.65 | 198 of 421 | 97885 (-84), 97857 (-59), 97761 (-50) | 97057 (+100), 97326 (+100), 97707 (+100) |
| Acupuncture, massage & naturopathy | 30 | 15,575.4 | 0.52 | 0.68 | 171 of 421 | 97063 (-38), 97834 (-33), 97641 (-32) | 97033 (+100), 97039 (+100), 97050 (+100) |
| Urgent care & emergency | 30 | 2,492.6 | 0.47 | 0.44 | 216 of 421 | 97536 (-94), 97733 (-83), 97029 (-76) | 97406 (+100), 97624 (+100), 97750 (+100) |
| Imaging & lab | 60 | 2,148.8 | 0.49 | 0.83 | 114 of 421 | 97020 (-37), 97348 (-36), 97026 (-31) | 97624 (+62), 97406 (+55), 97522 (+54) |
| Pharmacy | 30 | 10,399.6 | 1.72 | 0.55 | 210 of 421 | 97057 (-70), 97001 (-66), 97761 (-47) | 97145 (+79), 97819 (+77), 97837 (+77) |
| Home health & in-home care | 30 | 4,268.6 | 1.61 | 0.59 | 74 of 421 | 97825 (-76), 97324 (-53), 97830 (-49) | 97001 (+100), 97823 (+62), 97874 (+59) |
| Nursing & assisted living | 60 | 2,178.2 | 0.39 | 0.58 | 139 of 421 | 97367 (-43), 97882 (-29), 97838 (-26) | 97856 (+100), 97057 (+93), 97390 (+85) |
| Medical equipment & supplies | 60 | 1,623.4 | 0.36 | 0.75 | 97 of 421 | 97348 (-44), 97498 (-31), 97833 (-31) | 97874 (+100), 97637 (+69), 97390 (+60) |
| Hearing & audiology | 60 | 1,308.4 | 0.19 | 0.79 | 156 of 421 | 97348 (-65), 97032 (-58), 97020 (-56) | 97624 (+89), 97039 (+86), 97856 (+70) |
| Behavior therapy (ABA) | 30 | 9,324.6 | 2.88 | 0.79 | 53 of 421 | 97350 (-42), 97907 (-34), 97342 (-31) | 97231 (+60), 97056 (+56), 97053 (+47) |
| Care coordination & community health | 30 | 16,584.2 | 1.63 | 0.60 | 212 of 421 | 97430 (-60), 97324 (-47), 97882 (-47) | 97001 (+100), 97110 (+100), 97390 (+100) |
| General surgery | 60 | 1,924 | 0.35 | 0.73 | 163 of 421 | 97348 (-68), 97446 (-52), 97032 (-47) | 97624 (+100), 97848 (+100), 97817 (+88) |
| Infectious disease | 90 | 167.4 | 0.05 | 0.72 | 170 of 421 | 97070 (-50), 97020 (-49), 97014 (-48) | 97039 (+75), 97357 (+71), 97380 (+60) |
| Genetics & genetic counseling | 90 | 152.8 | 0.03 | 0.67 | 142 of 421 | 97020 (-56), 97002 (-55), 97032 (-55) | 97204 (+53), 97205 (+48), 97452 (+48) |
| Hospice & palliative care | 60 | 380 | 0.09 | 0.79 | 116 of 421 | 97365 (-44), 97347 (-39), 97476 (-31) | 97406 (+100), 97837 (+100), 97733 (+89) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Oregon in households with no vehicle: about 231,696 of 3,370,470 (6.9%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 4
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 5 of 421 | 97204 (+64), 97205 (+37), 97201 (+23) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 421 | 97204 (+65), 97205 (+36), 97201 (+16) | 1.00 |
| Women's health / OB-GYN | 0.99 | 3 of 421 | 97204 (+59), 97205 (+35), 97201 (+15) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 421 | 97204 (+29), 97233 (+8), 97018 (+3) | 1.00 |
| Dental | 1.00 | 3 of 421 | 97204 (+60), 97205 (+33), 97227 (+15) | 1.00 |
| Eye care | 1.00 | 5 of 421 | 97204 (+70), 97205 (+40), 97201 (+26) | 1.00 |
| Chiropractic | 1.00 | 1 of 421 | 97204 (+47), 97205 (+8), 97233 (+8) | 1.00 |
| Physical & occupational therapy | 1.00 | 5 of 421 | 97204 (+68), 97205 (+45), 97201 (+27) | 1.00 |
| Orthopedics & sports injury | 0.99 | 3 of 421 | 97204 (+37), 97205 (+24), 97201 (+15) | 1.00 |
| Heart / cardiology | 0.99 | 2 of 421 | 97204 (+29), 97205 (+19), 97201 (+10) | 1.00 |
| Skin / dermatology | 0.99 | 3 of 421 | 97204 (+39), 97205 (+26), 97201 (+15) | 1.00 |
| Allergy & immunology | 1.00 | 2 of 421 | 97204 (+32), 97205 (+21), 97201 (+12) | 1.00 |
| Lung, breathing & sleep | 1.00 | 5 of 421 | 97204 (+46), 97205 (+30), 97201 (+17) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 421 | 97204 (+46), 97205 (+31), 97201 (+17) | 1.00 |
| Kidney / nephrology | 0.99 | 2 of 421 | 97204 (+36), 97205 (+24), 97201 (+13) | 1.00 |
| Diabetes & hormones | 1.00 | 4 of 421 | 97204 (+43), 97205 (+31), 97201 (+16) | 1.00 |
| Cancer care / oncology | 0.99 | 2 of 421 | 97204 (+28), 97205 (+20), 97201 (+11) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 421 | 97204 (+42), 97205 (+30), 97201 (+15) | 1.00 |
| Brain & nerves / neurology | 1.00 | 4 of 421 | 97204 (+42), 97205 (+30), 97209 (+16) | 1.00 |
| Ear, nose & throat | 0.99 | 4 of 421 | 97204 (+44), 97205 (+29), 97201 (+16) | 1.00 |
| Urology | 0.99 | 2 of 421 | 97204 (+36), 97205 (+23), 97201 (+13) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 2 of 421 | 97204 (+31), 97205 (+20), 97201 (+12) | 1.00 |
| Pain management | 1.00 | 2 of 421 | 97204 (+33), 97205 (+22), 97201 (+13) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 421 | 97204 (+30), 97205 (+20), 97201 (+12) | 1.00 |
| Speech & language therapy | 1.00 | 5 of 421 | 97204 (+72), 97205 (+42), 97201 (+26) | 1.00 |
| Nutrition & dietitian | 1.00 | 2 of 421 | 97204 (+59), 97205 (+26), 97216 (+9) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 421 | 97450 (+6), 97122 (+5), 97414 (+4) | 1.00 |
| Urgent care & emergency | 1.00 | 4 of 421 | 97204 (+64), 97205 (+35), 97201 (+22) | 1.00 |
| Imaging & lab | 0.99 | 2 of 421 | 97204 (+36), 97205 (+24), 97201 (+13) | 1.00 |
| Pharmacy | 1.00 | 6 of 421 | 97204 (+69), 97205 (+42), 97201 (+26) | 1.00 |
| Home health & in-home care | 1.00 | 4 of 421 | 97204 (+53), 97205 (+28), 97201 (+18) | 1.00 |
| Nursing & assisted living | 0.99 | 3 of 421 | 97204 (+38), 97205 (+24), 97201 (+15) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 421 | 97204 (+29), 97205 (+19), 97201 (+11) | 1.00 |
| Hearing & audiology | 0.99 | 5 of 421 | 97204 (+55), 97205 (+37), 97201 (+21) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 4 of 421 | 97204 (+53), 97205 (+33), 97201 (+20) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 421 | 97204 (+37), 97722 (+5), 97839 (+4) | 1.00 |
| General surgery | 0.99 | 4 of 421 | 97204 (+42), 97205 (+28), 97201 (+15) | 1.00 |
| Infectious disease | 0.99 | 2 of 421 | 97204 (+23), 97205 (+16), 97227 (+10) | 1.00 |
| Genetics & genetic counseling | 1.00 | 2 of 421 | 97204 (+22), 97205 (+16), 97227 (+10) | 1.00 |
| Hospice & palliative care | 0.99 | 2 of 421 | 97204 (+29), 97205 (+19), 97201 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 51 of 422 | 32,416 (1.0%) | 1/32 | 20/153 | 15/113 | 4/49 | 11/75 |
| Women's health / OB-GYN | 016 | 7 of 422 | 1,143 (0.0%) | 0/32 | 4/153 | 1/113 | 0/49 | 2/75 |
| Mental health & counseling: Psychiatry | 029 | 41 of 422 | 27,062 (0.8%) | 2/32 | 10/153 | 2/113 | 1/49 | 26/75 |
| Mental health & counseling: Clinical Psychology | 036 | 18 of 422 | 9,485 (0.3%) | 1/32 | 4/153 | 7/113 | 0/49 | 6/75 |
| Mental health & counseling: Clinical Social Work | 037 | 20 of 422 | 8,980 (0.3%) | 0/32 | 9/153 | 9/113 | 0/49 | 2/75 |
| Eye care | 023 | 31 of 422 | 19,818 (0.6%) | 1/32 | 14/153 | 8/113 | 0/49 | 8/75 |
| Chiropractic | 010 | 6 of 422 | 1,842 (0.1%) | 0/32 | 4/153 | 0/113 | 0/49 | 2/75 |
| Physical & occupational therapy | F049 | 8 of 422 | 2,038 (0.1%) | 0/32 | 5/153 | 0/113 | 0/49 | 3/75 |
| Orthopedics & sports injury | 025 | 54 of 422 | 61,001 (1.8%) | 1/32 | 16/153 | 14/113 | 0/49 | 23/75 |
| Heart / cardiology | 008 | 96 of 422 | 103,882 (3.1%) | 2/32 | 35/153 | 9/113 | 4/49 | 46/75 |
| Skin / dermatology | 011 | 95 of 422 | 124,642 (3.7%) | 2/32 | 21/153 | 22/113 | 11/49 | 39/75 |
| Allergy & immunology | 007 | 93 of 422 | 155,300 (4.6%) | 0/32 | 19/153 | 21/113 | 12/49 | 41/75 |
| Lung, breathing & sleep | 030 | 40 of 422 | 35,250 (1.0%) | 2/32 | 11/153 | 2/113 | 1/49 | 24/75 |
| Digestive / gastroenterology | 014 | 102 of 422 | 180,558 (5.4%) | 1/32 | 20/153 | 16/113 | 27/49 | 38/75 |
| Kidney / nephrology | 018 | 33 of 422 | 16,039 (0.5%) | 0/32 | 9/153 | 3/113 | 1/49 | 20/75 |
| Diabetes & hormones | 012 | 29 of 422 | 24,185 (0.7%) | 0/32 | 11/153 | 0/113 | 0/49 | 18/75 |
| Cancer care / oncology | 021 | 55 of 422 | 43,862 (1.3%) | 0/32 | 20/153 | 1/113 | 4/49 | 30/75 |
| Arthritis / rheumatology | 031 | 46 of 422 | 89,255 (2.6%) | 1/32 | 13/153 | 5/113 | 6/49 | 21/75 |
| Brain & nerves / neurology | 019 | 56 of 422 | 59,358 (1.8%) | 1/32 | 11/153 | 17/113 | 5/49 | 22/75 |
| Ear, nose & throat | 013 | 57 of 422 | 63,216 (1.9%) | 0/32 | 21/153 | 4/113 | 7/49 | 25/75 |
| Urology | 033 | 71 of 422 | 104,597 (3.1%) | 1/32 | 27/153 | 4/113 | 3/49 | 36/75 |
| Foot & ankle / podiatry | 028 | 51 of 422 | 35,834 (1.1%) | 2/32 | 10/153 | 10/113 | 2/49 | 27/75 |
| Plastic & reconstructive surgery | 027 | 57 of 422 | 69,266 (2.1%) | 1/32 | 11/153 | 12/113 | 7/49 | 26/75 |
| Speech & language therapy | F051 | 17 of 422 | 8,601 (0.3%) | 0/32 | 6/153 | 1/113 | 0/49 | 10/75 |
| Imaging & lab | F047 | 44 of 422 | 36,101 (1.1%) | 2/32 | 14/153 | 0/113 | 0/49 | 28/75 |
| Nursing & assisted living | F046 | 22 of 422 | 10,009 (0.3%) | 0/32 | 9/153 | 1/113 | 1/49 | 11/75 |
| General surgery | 015 | 61 of 422 | 45,391 (1.3%) | 2/32 | 23/153 | 12/113 | 3/49 | 21/75 |
| Infectious disease | 017 | 45 of 422 | 41,299 (1.2%) | 0/32 | 10/153 | 8/113 | 1/49 | 26/75 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 16880 rows (ZIP x specialty) stored in access_e2sfca for OR; market-score now uses drive-time access for these ZIPs.
