# E2SFCA access dry run: Arizona

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 634; in Arizona: 409
- Drive times: OSRM on OpenStreetMap roads (car profile), 634 x 634 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 283,615; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.50 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.26), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (85619)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 85619 | yes | 9.19 | 100% | 9.19 | 100% | no |
| 86435 | yes | 7.27 | 100% | 5.54 | 100% | yes (6.07) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 33,011 | 4.30 | 0.57 | 172 of 408 | 85610 (-64), 86042 (-60), 86504 (-45) | 85263 (+100), 86540 (+100), 85264 (+85) |
| Pediatrics (children) | 30 | 8,792.6 | 1.11 | 0.75 | 158 of 408 | 85601 (-67), 86514 (-51), 85554 (-50) | 86003 (+100), 86508 (+100), 86540 (+100) |
| Women's health / OB-GYN | 60 | 3,500.8 | 0.53 | 0.82 | 89 of 408 | 86506 (-56), 86046 (-30), 85037 (-25) | 86520 (+96), 86556 (+86), 86547 (+79) |
| Mental health & counseling | 30 | 49,878.2 | 7.20 | 0.76 | 84 of 408 | 86504 (-31), 85390 (-28), 86003 (-24) | 86332 (+50), 85320 (+48), 86338 (+46) |
| Dental | 30 | 13,051.2 | 1.65 | 0.62 | 177 of 408 | 85360 (-83), 85610 (-76), 86042 (-74) | 86540 (+89), 86020 (+84), 85262 (+79) |
| Eye care | 30 | 4,252 | 0.62 | 0.64 | 156 of 408 | 86504 (-51), 86514 (-49), 86510 (-44) | 86540 (+100), 86508 (+96), 86020 (+94) |
| Chiropractic | 30 | 4,556.8 | 0.63 | 0.73 | 156 of 408 | 85637 (-79), 85390 (-30), 86326 (-30) | 85263 (+100), 85264 (+93), 86332 (+85) |
| Physical & occupational therapy | 30 | 17,989 | 2.70 | 0.73 | 134 of 408 | 86504 (-49), 86438 (-35), 85625 (-24) | 85263 (+94), 86038 (+75), 85264 (+71) |
| Orthopedics & sports injury | 60 | 2,607.6 | 0.39 | 0.84 | 102 of 408 | 86046 (-35), 85353 (-31), 85037 (-30) | 85633 (+100), 85263 (+94), 85264 (+68) |
| Heart / cardiology | 60 | 1,786.4 | 0.24 | 0.83 | 106 of 408 | 85045 (-48), 85353 (-38), 85284 (-36) | 85263 (+92), 85137 (+73), 86332 (+73) |
| Skin / dermatology | 60 | 701.6 | 0.09 | 0.84 | 142 of 408 | 85746 (-62), 85734 (-50), 85757 (-47) | 85263 (+90), 86332 (+90), 85723 (+89) |
| Allergy & immunology | 60 | 181.2 | 0.03 | 0.83 | 109 of 408 | 85757 (-39), 85734 (-38), 85339 (-34) | 85263 (+93), 85623 (+90), 86343 (+87) |
| Lung, breathing & sleep | 60 | 1,217.4 | 0.13 | 0.85 | 118 of 408 | 86030 (-90), 85629 (-50), 85747 (-50) | 86343 (+100), 85263 (+93), 86332 (+86) |
| Digestive / gastroenterology | 60 | 764 | 0.11 | 0.91 | 87 of 408 | 85045 (-59), 85734 (-33), 85353 (-32) | 85263 (+88), 86036 (+59), 85264 (+54) |
| Kidney / nephrology | 60 | 850 | 0.11 | 0.71 | 135 of 408 | 85346 (-48), 86511 (-43), 85625 (-42) | 85554 (+100), 86510 (+100), 85263 (+95) |
| Diabetes & hormones | 60 | 377.2 | 0.06 | 0.89 | 126 of 408 | 85037 (-40), 85392 (-35), 85353 (-33) | 86540 (+100), 85263 (+94), 85262 (+71) |
| Cancer care / oncology | 90 | 945 | 0.15 | 0.76 | 116 of 408 | 85602 (-43), 85641 (-41), 85627 (-40) | 85263 (+74), 85264 (+56), 85255 (+49) |
| Arthritis / rheumatology | 60 | 219.2 | 0.04 | 0.88 | 93 of 408 | 85629 (-36), 85048 (-33), 85641 (-33) | 85263 (+93), 85623 (+93), 85264 (+70) |
| Brain & nerves / neurology | 60 | 1,992.2 | 0.22 | 0.90 | 128 of 408 | 85284 (-44), 85353 (-44), 85045 (-42) | 85263 (+90), 85723 (+69), 85739 (+61) |
| Ear, nose & throat | 60 | 403.2 | 0.07 | 0.86 | 109 of 408 | 85037 (-39), 85734 (-36), 85353 (-33) | 85924 (+100), 85263 (+91), 86540 (+91) |
| Urology | 60 | 445.8 | 0.07 | 0.82 | 132 of 408 | 85734 (-40), 85045 (-36), 85284 (-36) | 85263 (+90), 85924 (+89), 85554 (+68) |
| Foot & ankle / podiatry | 60 | 1,175.8 | 0.15 | 0.75 | 156 of 408 | 85339 (-40), 85353 (-39), 85007 (-36) | 85263 (+93), 86039 (+90), 86332 (+88) |
| Pain management | 60 | 1,073 | 0.09 | 0.89 | 97 of 408 | 85936 (-93), 85339 (-62), 85353 (-62) | 85924 (+100), 85941 (+90), 85554 (+86) |
| Plastic & reconstructive surgery | 90 | 581 | 0.07 | 0.84 | 172 of 408 | 85353 (-62), 85392 (-62), 85037 (-60) | 85723 (+76), 85263 (+52), 85344 (+45) |
| Speech & language therapy | 30 | 8,180.8 | 0.90 | 0.80 | 169 of 408 | 86021 (-73), 85638 (-62), 86022 (-44) | 85263 (+100), 86003 (+100), 86028 (+100) |
| Nutrition & dietitian | 30 | 2,284.8 | 0.33 | 0.72 | 151 of 408 | 85611 (-54), 85550 (-45), 85542 (-40) | 85263 (+100), 86520 (+100), 86538 (+100) |
| Acupuncture, massage & naturopathy | 30 | 4,096.4 | 0.52 | 0.80 | 129 of 408 | 85624 (-86), 86022 (-54), 85625 (-46) | 85263 (+100), 86038 (+100), 86332 (+100) |
| Urgent care & emergency | 30 | 3,913.4 | 0.47 | 0.52 | 180 of 408 | 85601 (-96), 85920 (-69), 85390 (-51) | 85263 (+100), 85605 (+100), 85633 (+100) |
| Imaging & lab | 60 | 3,720 | 0.49 | 0.83 | 130 of 408 | 85346 (-52), 86042 (-43), 86514 (-42) | 85263 (+90), 85723 (+63), 86332 (+63) |
| Pharmacy | 30 | 12,500.2 | 1.72 | 0.55 | 168 of 408 | 85344 (-45), 86437 (-37), 85390 (-25) | 86030 (+100), 86039 (+100), 86520 (+100) |
| Home health & in-home care | 30 | 41,488.6 | 1.61 | 0.73 | 66 of 408 | 85927 (-96), 86437 (-68), 85601 (-44) | 86030 (+94), 85633 (+78), 86535 (+78) |
| Nursing & assisted living | 60 | 3,134.4 | 0.39 | 0.75 | 142 of 408 | 85346 (-33), 85008 (-31), 85044 (-31) | 85137 (+100), 86510 (+88), 86035 (+87) |
| Medical equipment & supplies | 60 | 2,409.4 | 0.36 | 0.80 | 78 of 408 | 85911 (-34), 85353 (-23), 85323 (-21) | 85344 (+63), 86332 (+60), 86438 (+60) |
| Hearing & audiology | 60 | 1,467.4 | 0.19 | 0.74 | 145 of 408 | 85629 (-41), 85734 (-41), 85938 (-39) | 85922 (+100), 86520 (+100), 86556 (+93) |
| Behavior therapy (ABA) | 30 | 21,558.2 | 2.88 | 0.88 | 58 of 408 | 85006 (-24), 85037 (-23), 85004 (-20) | 85121 (+50), 85263 (+47), 85361 (+41) |
| Care coordination & community health | 30 | 7,359 | 1.63 | 0.64 | 48 of 408 | 86437 (-90), 86514 (-58), 85601 (-50) | 86508 (+74), 86515 (+54), 86540 (+48) |
| General surgery | 60 | 2,794.4 | 0.35 | 0.84 | 120 of 408 | 85045 (-48), 85037 (-42), 85353 (-38) | 85263 (+92), 86036 (+87), 86540 (+80) |
| Infectious disease | 90 | 335.4 | 0.05 | 0.83 | 151 of 408 | 85392 (-45), 85353 (-43), 85037 (-39) | 85263 (+74), 85264 (+58), 85926 (+57) |
| Genetics & genetic counseling | 90 | 125.2 | 0.03 | 0.80 | 133 of 408 | 85353 (-27), 85392 (-27), 85037 (-26) | 85263 (+85), 85268 (+72), 85251 (+69) |
| Hospice & palliative care | 60 | 1,310.8 | 0.09 | 0.83 | 144 of 408 | 85353 (-83), 85392 (-76), 85323 (-74) | 85137 (+100), 85263 (+92), 86332 (+90) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Arizona in households with no vehicle: about 300,696 of 5,543,083 (5.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 8
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 408 | 85723 (+60), 86011 (+14), 85926 (+12) | 1.00 |
| Pediatrics (children) | 0.99 | 3 of 408 | 85723 (+87), 86011 (+26), 85926 (+15) | 1.00 |
| Women's health / OB-GYN | 0.99 | 2 of 408 | 85723 (+44), 85707 (+15), 86011 (+12) | 1.00 |
| Mental health & counseling | 0.99 | 1 of 408 | 85723 (+49), 86011 (+13), 85003 (+9) | 1.00 |
| Dental | 0.99 | 2 of 408 | 85723 (+56), 86011 (+17), 85701 (+9) | 1.00 |
| Eye care | 0.99 | 1 of 408 | 85723 (+62), 86011 (+14), 85701 (+10) | 1.00 |
| Chiropractic | 1.00 | 2 of 408 | 85723 (+36), 86011 (+15), 85003 (+8) | 1.00 |
| Physical & occupational therapy | 1.00 | 2 of 408 | 85723 (+40), 86011 (+22), 85003 (+7) | 1.00 |
| Orthopedics & sports injury | 0.99 | 1 of 408 | 85723 (+41), 85707 (+14), 85003 (+10) | 1.00 |
| Heart / cardiology | 0.99 | 2 of 408 | 85723 (+53), 85707 (+19), 85003 (+11) | 1.00 |
| Skin / dermatology | 0.99 | 2 of 408 | 85723 (+84), 85707 (+28), 85701 (+12) | 1.00 |
| Allergy & immunology | 0.99 | 2 of 408 | 85723 (+54), 85707 (+17), 85003 (+9) | 1.00 |
| Lung, breathing & sleep | 0.99 | 3 of 408 | 85723 (+59), 85707 (+39), 85926 (+22) | 1.00 |
| Digestive / gastroenterology | 1.00 | 2 of 408 | 85723 (+46), 85707 (+17), 85003 (+11) | 1.00 |
| Kidney / nephrology | 0.99 | 3 of 408 | 85723 (+54), 85926 (+27), 85707 (+18) | 1.00 |
| Diabetes & hormones | 0.99 | 2 of 408 | 85723 (+44), 85707 (+18), 85530 (+11) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 408 | 85723 (+37), 85707 (+14), 85003 (+7) | 1.00 |
| Arthritis / rheumatology | 0.99 | 2 of 408 | 85723 (+49), 85707 (+20), 85003 (+8) | 1.00 |
| Brain & nerves / neurology | 0.99 | 2 of 408 | 85723 (+58), 85707 (+19), 85003 (+12) | 1.00 |
| Ear, nose & throat | 0.99 | 2 of 408 | 85723 (+47), 85707 (+15), 85930 (+11) | 1.00 |
| Urology | 0.99 | 2 of 408 | 85723 (+57), 85707 (+21), 85003 (+9) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 4 of 408 | 85723 (+46), 85926 (+24), 85707 (+19) | 1.00 |
| Pain management | 1.00 | 2 of 408 | 85723 (+41), 85329 (+15), 85707 (+14) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 408 | 85723 (+60), 85707 (+24), 85003 (+12) | 1.00 |
| Speech & language therapy | 0.99 | 1 of 408 | 85723 (+72), 85003 (+14), 85701 (+10) | 1.00 |
| Nutrition & dietitian | 1.00 | 2 of 408 | 85723 (+48), 86011 (+27), 85003 (+10) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 2 of 408 | 85723 (+86), 86011 (+20), 85707 (+10) | 1.00 |
| Urgent care & emergency | 0.99 | 3 of 408 | 85723 (+89), 85926 (+27), 86011 (+22) | 1.00 |
| Imaging & lab | 0.99 | 3 of 408 | 85723 (+56), 85707 (+20), 85926 (+18) | 1.00 |
| Pharmacy | 0.99 | 2 of 408 | 85723 (+62), 85639 (+22), 86011 (+13) | 1.00 |
| Home health & in-home care | 0.99 | 1 of 408 | 85723 (+22), 85003 (+6), 85034 (+5) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 408 | 85723 (+42), 85639 (+18), 85550 (+15) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 408 | 85723 (+35), 85639 (+20), 85707 (+12) | 1.00 |
| Hearing & audiology | 0.99 | 2 of 408 | 85723 (+79), 85707 (+27), 85701 (+12) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 1 of 408 | 85723 (+35), 85003 (+7), 85329 (+7) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 408 | 85723 (+19), 85926 (+10), 85003 (+4) | 1.00 |
| General surgery | 0.99 | 2 of 408 | 85723 (+61), 85707 (+20), 86508 (+14) | 1.00 |
| Infectious disease | 0.99 | 3 of 408 | 85723 (+35), 85707 (+16), 85926 (+16) | 1.00 |
| Genetics & genetic counseling | 0.99 | 1 of 408 | 85723 (+21), 85707 (+8), 85003 (+4) | 1.00 |
| Hospice & palliative care | 1.00 | 4 of 408 | 85723 (+69), 85707 (+23), 85550 (+19) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 30 of 407 | 25,048 (0.5%) |  | 23/268 | 3/67 |  | 4/72 |
| Women's health / OB-GYN | 016 | 28 of 407 | 26,806 (0.5%) |  | 24/268 | 2/67 |  | 2/72 |
| Mental health & counseling: Psychiatry | 029 | 37 of 407 | 37,782 (0.7%) |  | 22/268 | 5/67 |  | 10/72 |
| Mental health & counseling: Clinical Psychology | 036 | 15 of 407 | 13,590 (0.2%) |  | 13/268 | 0/67 |  | 2/72 |
| Mental health & counseling: Clinical Social Work | 037 | 24 of 407 | 27,967 (0.5%) |  | 23/268 | 1/67 |  | 0/72 |
| Eye care | 023 | 48 of 407 | 69,270 (1.2%) |  | 38/268 | 7/67 |  | 3/72 |
| Chiropractic | 010 | 28 of 407 | 31,092 (0.6%) |  | 20/268 | 6/67 |  | 2/72 |
| Physical & occupational therapy | F049 | 18 of 407 | 9,746 (0.2%) |  | 13/268 | 2/67 |  | 3/72 |
| Orthopedics & sports injury | 025 | 54 of 407 | 80,905 (1.5%) |  | 40/268 | 9/67 |  | 5/72 |
| Heart / cardiology | 008 | 58 of 407 | 139,983 (2.5%) |  | 46/268 | 7/67 |  | 5/72 |
| Skin / dermatology | 011 | 56 of 407 | 101,739 (1.8%) |  | 25/268 | 20/67 |  | 11/72 |
| Allergy & immunology | 007 | 53 of 407 | 154,854 (2.8%) |  | 29/268 | 10/67 |  | 14/72 |
| Lung, breathing & sleep | 030 | 31 of 407 | 29,806 (0.5%) |  | 26/268 | 2/67 |  | 3/72 |
| Digestive / gastroenterology | 014 | 67 of 407 | 138,690 (2.5%) |  | 26/268 | 17/67 |  | 24/72 |
| Kidney / nephrology | 018 | 24 of 407 | 18,335 (0.3%) |  | 20/268 | 2/67 |  | 2/72 |
| Diabetes & hormones | 012 | 31 of 407 | 94,701 (1.7%) |  | 27/268 | 1/67 |  | 3/72 |
| Cancer care / oncology | 021 | 46 of 407 | 95,779 (1.7%) |  | 32/268 | 9/67 |  | 5/72 |
| Arthritis / rheumatology | 031 | 61 of 407 | 135,450 (2.4%) |  | 23/268 | 15/67 |  | 23/72 |
| Brain & nerves / neurology | 019 | 45 of 407 | 89,997 (1.6%) |  | 22/268 | 13/67 |  | 10/72 |
| Ear, nose & throat | 013 | 35 of 407 | 48,622 (0.9%) |  | 22/268 | 9/67 |  | 4/72 |
| Urology | 033 | 66 of 407 | 151,401 (2.7%) |  | 33/268 | 14/67 |  | 19/72 |
| Foot & ankle / podiatry | 028 | 44 of 407 | 47,516 (0.9%) |  | 23/268 | 17/67 |  | 4/72 |
| Plastic & reconstructive surgery | 027 | 52 of 407 | 117,485 (2.1%) |  | 29/268 | 6/67 |  | 17/72 |
| Speech & language therapy | F051 | 20 of 407 | 13,572 (0.2%) |  | 16/268 | 1/67 |  | 3/72 |
| Imaging & lab | F047 | 23 of 407 | 17,715 (0.3%) |  | 17/268 | 3/67 |  | 3/72 |
| Nursing & assisted living | F046 | 24 of 407 | 27,131 (0.5%) |  | 21/268 | 2/67 |  | 1/72 |
| General surgery | 015 | 46 of 407 | 66,095 (1.2%) |  | 34/268 | 7/67 |  | 5/72 |
| Infectious disease | 017 | 28 of 407 | 27,700 (0.5%) |  | 18/268 | 1/67 |  | 9/72 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 16360 rows (ZIP x specialty) stored in access_e2sfca for AZ; market-score now uses drive-time access for these ZIPs.
