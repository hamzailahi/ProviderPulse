# E2SFCA access dry run: South Carolina

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,559; in South Carolina: 422
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,559 x 1,559 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 502,131.599; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.49 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.23), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 29915 | yes | 17.87 | 100% | 5.16 | 100% | yes (1.79) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 73,596.798 | 4.30 | 0.60 | 170 of 422 | 29577 (-35), 29334 (-29), 29102 (-28) | 29323 (+70), 29111 (+59), 29899 (+58) |
| Pediatrics (children) | 30 | 15,880.2 | 1.11 | 0.70 | 140 of 422 | 29438 (-34), 29456 (-27), 29334 (-25) | 29439 (+65), 29487 (+61), 29455 (+59) |
| Women's health / OB-GYN | 60 | 8,705.6 | 0.53 | 0.71 | 145 of 422 | 29334 (-49), 29365 (-46), 29375 (-44) | 29372 (+74), 29373 (+64), 29323 (+62) |
| Mental health & counseling | 30 | 102,387.4 | 7.20 | 0.61 | 131 of 422 | 29020 (-25), 29406 (-23), 29445 (-23) | 29899 (+53), 29487 (+50), 29449 (+47) |
| Dental | 30 | 23,896.2 | 1.65 | 0.63 | 162 of 422 | 29424 (-28), 29577 (-28), 29409 (-27) | 29941 (+82), 29044 (+76), 29052 (+66) |
| Eye care | 30 | 8,922.2 | 0.62 | 0.63 | 188 of 422 | 29577 (-43), 29020 (-35), 29440 (-34) | 29439 (+73), 29450 (+70), 29044 (+69) |
| Chiropractic | 30 | 9,822.6 | 0.63 | 0.73 | 193 of 422 | 29577 (-31), 29812 (-27), 29576 (-26) | 29450 (+94), 29449 (+82), 29487 (+77) |
| Physical & occupational therapy | 30 | 42,533.8 | 2.70 | 0.75 | 158 of 422 | 29621 (-26), 29577 (-24), 29225 (-23) | 29439 (+74), 29450 (+74), 29487 (+69) |
| Orthopedics & sports injury | 60 | 6,963 | 0.39 | 0.79 | 158 of 422 | 29160 (-46), 29334 (-45), 29123 (-44) | 29346 (+66), 29728 (+63), 29323 (+53) |
| Heart / cardiology | 60 | 3,557.6 | 0.24 | 0.58 | 203 of 422 | 29160 (-56), 29114 (-52), 29927 (-49) | 29899 (+74), 29834 (+66), 29831 (+60) |
| Skin / dermatology | 60 | 1,330.4 | 0.09 | 0.82 | 161 of 422 | 29420 (-45), 29445 (-43), 29456 (-41) | 29487 (+59), 29831 (+56), 29920 (+55) |
| Allergy & immunology | 60 | 458.4 | 0.03 | 0.75 | 170 of 422 | 29334 (-73), 29375 (-70), 29365 (-66) | 29472 (+78), 29372 (+77), 29373 (+76) |
| Lung, breathing & sleep | 60 | 2,088.2 | 0.13 | 0.65 | 174 of 422 | 29927 (-51), 29160 (-48), 29177 (-40) | 29899 (+49), 29915 (+47), 29492 (+46) |
| Digestive / gastroenterology | 60 | 1,680 | 0.11 | 0.70 | 234 of 422 | 29160 (-52), 29177 (-49), 29565 (-46) | 29323 (+78), 29372 (+72), 29899 (+72) |
| Kidney / nephrology | 60 | 1,782.6 | 0.11 | 0.55 | 225 of 422 | 29114 (-61), 29080 (-60), 29162 (-47) | 29372 (+72), 29373 (+68), 29062 (+67) |
| Diabetes & hormones | 60 | 809.4 | 0.06 | 0.64 | 210 of 422 | 29160 (-69), 29114 (-66), 29571 (-58) | 29899 (+75), 29655 (+56), 29030 (+53) |
| Cancer care / oncology | 90 | 2,278 | 0.15 | 0.47 | 249 of 422 | 29448 (-50), 29683 (-48), 29690 (-48) | 29915 (+69), 29038 (+68), 29039 (+68) |
| Arthritis / rheumatology | 60 | 561.2 | 0.04 | 0.73 | 234 of 422 | 29160 (-81), 29334 (-64), 29365 (-59) | 29431 (+91), 29434 (+84), 29915 (+81) |
| Brain & nerves / neurology | 60 | 2,907 | 0.22 | 0.76 | 154 of 422 | 29160 (-39), 29177 (-37), 29571 (-36) | 29899 (+60), 29063 (+49), 29681 (+49) |
| Ear, nose & throat | 60 | 1,045.6 | 0.07 | 0.65 | 206 of 422 | 29927 (-63), 29334 (-52), 29909 (-49) | 29838 (+82), 29899 (+73), 29074 (+71) |
| Urology | 60 | 1,332.4 | 0.07 | 0.64 | 232 of 422 | 29114 (-71), 29536 (-65), 29516 (-61) | 29899 (+75), 29346 (+74), 29372 (+63) |
| Foot & ankle / podiatry | 60 | 1,715 | 0.15 | 0.61 | 143 of 422 | 29912 (-46), 29160 (-44), 29448 (-42) | 29446 (+59), 29133 (+46), 29922 (+45) |
| Pain management | 60 | 1,301 | 0.09 | 0.67 | 205 of 422 | 29912 (-74), 29044 (-52), 29824 (-48) | 29899 (+80), 29372 (+74), 29373 (+72) |
| Plastic & reconstructive surgery | 90 | 967.4 | 0.07 | 0.57 | 297 of 422 | 29912 (-71), 29904 (-62), 29906 (-62) | 29125 (+62), 29323 (+62), 29346 (+62) |
| Speech & language therapy | 30 | 15,045.4 | 0.90 | 0.67 | 182 of 422 | 29580 (-54), 29015 (-45), 29225 (-34) | 29487 (+73), 29070 (+70), 29472 (+68) |
| Nutrition & dietitian | 30 | 5,325.6 | 0.33 | 0.70 | 135 of 422 | 29137 (-54), 29164 (-30), 29406 (-27) | 29052 (+86), 29044 (+78), 29172 (+60) |
| Acupuncture, massage & naturopathy | 30 | 4,814.8 | 0.52 | 0.73 | 54 of 422 | 29438 (-89), 29576 (-18), 29577 (-18) | 29821 (+51), 29487 (+49), 29449 (+46) |
| Urgent care & emergency | 30 | 6,942 | 0.47 | 0.58 | 205 of 422 | 29650 (-56), 29572 (-54), 29577 (-51) | 29323 (+91), 29899 (+72), 29045 (+69) |
| Imaging & lab | 60 | 7,425.6 | 0.49 | 0.64 | 155 of 422 | 29160 (-44), 29334 (-43), 29927 (-39) | 29323 (+69), 29346 (+63), 29466 (+59) |
| Pharmacy | 30 | 30,385.4 | 1.72 | 0.55 | 197 of 422 | 29577 (-34), 29406 (-32), 29020 (-29) | 29052 (+97), 29044 (+81), 29899 (+79) |
| Home health & in-home care | 30 | 17,172.2 | 1.61 | 0.66 | 113 of 422 | 29556 (-27), 29015 (-22), 29536 (-21) | 29062 (+51), 29580 (+45), 29516 (+43) |
| Nursing & assisted living | 60 | 6,856.4 | 0.39 | 0.50 | 150 of 422 | 29114 (-41), 29080 (-33), 29547 (-30) | 29046 (+55), 29111 (+55), 29468 (+46) |
| Medical equipment & supplies | 60 | 7,332.2 | 0.36 | 0.70 | 184 of 422 | 29160 (-49), 29114 (-45), 29448 (-44) | 29111 (+62), 29346 (+61), 29372 (+61) |
| Hearing & audiology | 60 | 2,985.6 | 0.19 | 0.79 | 176 of 422 | 29927 (-57), 29936 (-41), 29912 (-40) | 29920 (+68), 29487 (+64), 29831 (+59) |
| Behavior therapy (ABA) | 30 | 31,803.4 | 2.88 | 0.75 | 54 of 422 | 29061 (-21), 29518 (-20), 29732 (-14) | 29821 (+77), 29053 (+76), 29172 (+65) |
| Care coordination & community health | 30 | 10,195.8 | 1.63 | 0.53 | 54 of 422 | 29334 (-20), 29446 (-18), 29020 (-17) | 29052 (+38), 29044 (+37), 29323 (+34) |
| General surgery | 60 | 5,663 | 0.35 | 0.66 | 207 of 422 | 29334 (-51), 29365 (-50), 29375 (-48) | 29899 (+79), 29915 (+72), 29346 (+69) |
| Infectious disease | 90 | 667.6 | 0.05 | 0.48 | 246 of 422 | 29054 (-50), 29123 (-49), 29160 (-48) | 29323 (+76), 29449 (+72), 29831 (+69) |
| Genetics & genetic counseling | 90 | 492.2 | 0.03 | 0.39 | 301 of 422 | 29325 (-85), 29355 (-77), 29351 (-75) | 29915 (+92), 29831 (+84), 29916 (+72) |
| Hospice & palliative care | 60 | 1,253.6 | 0.09 | 0.64 | 202 of 422 | 29061 (-72), 29160 (-60), 29162 (-58) | 29934 (+81), 29686 (+77), 29945 (+73) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in South Carolina in households with no vehicle: about 230,290 of 4,014,463 (5.7%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 10
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 2 of 422 | 29834 (+17), 29046 (+16), 29403 (+12) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 422 | 29834 (+14), 29046 (+9), 29346 (+8) | 1.00 |
| Women's health / OB-GYN | 0.99 | 2 of 422 | 29046 (+34), 29834 (+15), 29519 (+10) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 422 | 29834 (+15), 29046 (+11), 29403 (+10) | 1.00 |
| Dental | 1.00 | 0 of 422 | 29403 (+13), 29834 (+13), 29046 (+11) | 1.00 |
| Eye care | 1.00 | 1 of 422 | 29834 (+15), 29346 (+10), 29923 (+9) | 1.00 |
| Chiropractic | 1.00 | 1 of 422 | 29346 (+17), 29834 (+14), 29306 (+11) | 1.00 |
| Physical & occupational therapy | 1.00 | 1 of 422 | 29834 (+19), 29519 (+9), 29346 (+8) | 1.00 |
| Orthopedics & sports injury | 0.99 | 1 of 422 | 29046 (+48), 29519 (+14), 29834 (+14) | 1.00 |
| Heart / cardiology | 0.98 | 3 of 422 | 29046 (+50), 29834 (+18), 29519 (+15) | 1.00 |
| Skin / dermatology | 0.99 | 2 of 422 | 29046 (+23), 29834 (+21), 29403 (+11) | 1.00 |
| Allergy & immunology | 0.99 | 2 of 422 | 29046 (+29), 29834 (+17), 29403 (+14) | 1.00 |
| Lung, breathing & sleep | 0.99 | 1 of 422 | 29046 (+34), 29834 (+14), 29519 (+13) | 1.00 |
| Digestive / gastroenterology | 0.99 | 2 of 422 | 29046 (+40), 29834 (+21), 29519 (+13) | 1.00 |
| Kidney / nephrology | 0.98 | 3 of 422 | 29046 (+83), 29834 (+29), 29519 (+21) | 1.00 |
| Diabetes & hormones | 0.98 | 1 of 422 | 29046 (+60), 29519 (+14), 29834 (+11) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 422 | 29046 (+28), 29519 (+14), 29105 (+10) | 1.00 |
| Arthritis / rheumatology | 1.00 | 3 of 422 | 29046 (+21), 29834 (+19), 29519 (+15) | 1.00 |
| Brain & nerves / neurology | 0.99 | 1 of 422 | 29046 (+29), 29834 (+13), 29519 (+9) | 1.00 |
| Ear, nose & throat | 0.99 | 2 of 422 | 29046 (+43), 29834 (+15), 29519 (+9) | 1.00 |
| Urology | 0.98 | 2 of 422 | 29046 (+69), 29519 (+23), 29834 (+13) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 2 of 422 | 29046 (+30), 29834 (+17), 29519 (+9) | 1.00 |
| Pain management | 0.99 | 2 of 422 | 29046 (+43), 29834 (+28), 29403 (+10) | 1.00 |
| Plastic & reconstructive surgery | 0.98 | 4 of 422 | 29046 (+43), 29834 (+22), 29519 (+21) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 422 | 29834 (+17), 29046 (+16), 29346 (+8) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 422 | 29834 (+12), 29403 (+11), 29201 (+6) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 422 | 29403 (+8), 29834 (+8), 29203 (+4) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 422 | 29834 (+16), 29403 (+11), 29519 (+11) | 1.00 |
| Imaging & lab | 0.99 | 1 of 422 | 29046 (+34), 29834 (+14), 29519 (+10) | 1.00 |
| Pharmacy | 0.99 | 2 of 422 | 29834 (+19), 29046 (+17), 29923 (+13) | 1.00 |
| Home health & in-home care | 0.99 | 3 of 422 | 29046 (+24), 29519 (+15), 29834 (+15) | 1.00 |
| Nursing & assisted living | 0.98 | 3 of 422 | 29046 (+63), 29834 (+21), 29519 (+17) | 1.00 |
| Medical equipment & supplies | 0.98 | 3 of 422 | 29046 (+87), 29519 (+25), 29834 (+21) | 1.00 |
| Hearing & audiology | 0.99 | 2 of 422 | 29046 (+46), 29834 (+20), 29915 (+11) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 422 | 29204 (+8), 29203 (+7), 29834 (+6) | 1.00 |
| Care coordination & community health | 0.99 | 0 of 422 | 29834 (+11), 29046 (+10), 29346 (+5) | 1.00 |
| General surgery | 0.99 | 2 of 422 | 29046 (+34), 29834 (+20), 29519 (+14) | 1.00 |
| Infectious disease | 0.98 | 3 of 422 | 29046 (+29), 29834 (+16), 29105 (+15) | 1.00 |
| Genetics & genetic counseling | 0.99 | 2 of 422 | 29046 (+31), 29105 (+18), 29834 (+13) | 1.00 |
| Hospice & palliative care | 0.98 | 2 of 422 | 29046 (+64), 29834 (+30), 29519 (+14) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 28 of 422 | 98,230 (2.4%) |  | 23/263 | 4/101 | 1/58 |  |
| Women's health / OB-GYN | 016 | 3 of 422 | 4,279 (0.1%) |  | 3/263 | 0/101 | 0/58 |  |
| Mental health & counseling: Psychiatry | 029 | 6 of 422 | 8,398 (0.2%) |  | 5/263 | 0/101 | 1/58 |  |
| Mental health & counseling: Clinical Psychology | 036 | 5 of 422 | 7,187 (0.2%) |  | 4/263 | 0/101 | 1/58 |  |
| Mental health & counseling: Clinical Social Work | 037 | 11 of 422 | 19,161 (0.5%) |  | 11/263 | 0/101 | 0/58 |  |
| Eye care | 023 | 14 of 422 | 28,587 (0.7%) |  | 13/263 | 0/101 | 1/58 |  |
| Chiropractic | 010 | 3 of 422 | 3,398 (0.1%) |  | 3/263 | 0/101 | 0/58 |  |
| Physical & occupational therapy | F049 | 1 of 422 | 919 (0.0%) |  | 0/263 | 0/101 | 1/58 |  |
| Orthopedics & sports injury | 025 | 14 of 422 | 24,319 (0.6%) |  | 13/263 | 0/101 | 1/58 |  |
| Heart / cardiology | 008 | 39 of 422 | 127,972 (3.2%) |  | 38/263 | 0/101 | 1/58 |  |
| Skin / dermatology | 011 | 20 of 422 | 55,335 (1.4%) |  | 14/263 | 4/101 | 2/58 |  |
| Allergy & immunology | 007 | 44 of 422 | 204,516 (5.1%) |  | 42/263 | 0/101 | 2/58 |  |
| Lung, breathing & sleep | 030 | 7 of 422 | 11,646 (0.3%) |  | 6/263 | 0/101 | 1/58 |  |
| Digestive / gastroenterology | 014 | 12 of 422 | 25,581 (0.6%) |  | 10/263 | 1/101 | 1/58 |  |
| Kidney / nephrology | 018 | 3 of 422 | 3,398 (0.1%) |  | 3/263 | 0/101 | 0/58 |  |
| Diabetes & hormones | 012 | 3 of 422 | 4,279 (0.1%) |  | 3/263 | 0/101 | 0/58 |  |
| Cancer care / oncology | 021 | 9 of 422 | 21,047 (0.5%) |  | 7/263 | 1/101 | 1/58 |  |
| Arthritis / rheumatology | 031 | 4 of 422 | 4,575 (0.1%) |  | 4/263 | 0/101 | 0/58 |  |
| Brain & nerves / neurology | 019 | 9 of 422 | 17,354 (0.4%) |  | 7/263 | 1/101 | 1/58 |  |
| Ear, nose & throat | 013 | 11 of 422 | 28,142 (0.7%) |  | 10/263 | 0/101 | 1/58 |  |
| Urology | 033 | 7 of 422 | 12,798 (0.3%) |  | 6/263 | 0/101 | 1/58 |  |
| Foot & ankle / podiatry | 028 | 8 of 422 | 12,056 (0.3%) |  | 7/263 | 0/101 | 1/58 |  |
| Plastic & reconstructive surgery | 027 | 3 of 422 | 4,737 (0.1%) |  | 3/263 | 0/101 | 0/58 |  |
| Speech & language therapy | F051 | 3 of 422 | 4,258 (0.1%) |  | 2/263 | 0/101 | 1/58 |  |
| Imaging & lab | F047 | 3 of 422 | 3,401 (0.1%) |  | 2/263 | 0/101 | 1/58 |  |
| Nursing & assisted living | F046 | 3 of 422 | 4,258 (0.1%) |  | 2/263 | 0/101 | 1/58 |  |
| General surgery | 015 | 26 of 422 | 73,815 (1.8%) |  | 25/263 | 0/101 | 1/58 |  |
| Infectious disease | 017 | 4 of 422 | 8,149 (0.2%) |  | 4/263 | 0/101 | 0/58 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 16880 rows (ZIP x specialty) stored in access_e2sfca for SC; market-score now uses drive-time access for these ZIPs.
