# E2SFCA access dry run: Nevada

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 895; in Nevada: 176
- Drive times: OSRM on OpenStreetMap roads (car profile), 895 x 895 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 424,522.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.56 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.39), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 6; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (92305, 93526, 93545, 95981)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83211 | no | none | 0% | 1.49 | 100% | yes (2.03) |
| 92305 | no | 6.94 | 100% | 6.94 | 100% | no |
| 93526 | no | 7.47 | 100% | 7.47 | 100% | no |
| 93545 | no | 6.51 | 100% | 6.51 | 100% | no |
| 95910 | no | 6.95 | 100% | 4.57 | 100% | yes (1.72) |
| 95981 | no | 9.69 | 100% | 9.69 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 37,599.6 | 4.30 | 0.70 | 42 of 176 | 89496 (-62), 89424 (-54), 89008 (-46) | 89831 (+90), 89440 (+64), 89161 (+53) |
| Pediatrics (children) | 30 | 10,144 | 1.11 | 0.85 | 18 of 176 | 89020 (-22), 89430 (-10), 89449 (-10) | 89440 (+43), 89161 (+38), 89822 (+35) |
| Women's health / OB-GYN | 60 | 4,855 | 0.53 | 0.84 | 28 of 176 | 89706 (-25), 89506 (-24), 89701 (-24) | 89403 (+48), 89440 (+47), 89402 (+38) |
| Mental health & counseling | 30 | 93,392 | 7.20 | 0.85 | 56 of 176 | 89124 (-62), 89496 (-55), 89823 (-55) | 89444 (+69), 89427 (+65), 89440 (+59) |
| Dental | 30 | 19,402.6 | 1.65 | 0.74 | 42 of 176 | 89424 (-72), 89496 (-56), 89442 (-53) | 89451 (+60), 89704 (+54), 89403 (+52) |
| Eye care | 30 | 5,504.8 | 0.62 | 0.70 | 47 of 176 | 89706 (-23), 89021 (-21), 89801 (-16) | 89043 (+100), 89831 (+78), 89822 (+77) |
| Chiropractic | 30 | 5,476.4 | 0.63 | 0.78 | 37 of 176 | 89021 (-31), 89040 (-19), 89509 (-11) | 89822 (+53), 89025 (+50), 89704 (+49) |
| Physical & occupational therapy | 30 | 17,835.6 | 2.70 | 0.72 | 35 of 176 | 89008 (-46), 89021 (-14), 89402 (-14) | 89413 (+45), 89704 (+44), 89124 (+43) |
| Orthopedics & sports injury | 60 | 2,747.8 | 0.39 | 0.89 | 28 of 176 | 89701 (-20), 89027 (-19), 89706 (-18) | 89402 (+47), 89410 (+36), 89430 (+35) |
| Heart / cardiology | 60 | 1,907.2 | 0.24 | 0.88 | 25 of 176 | 89506 (-29), 89439 (-27), 89441 (-22) | 89440 (+60), 89451 (+58), 89403 (+34) |
| Skin / dermatology | 60 | 861.6 | 0.09 | 0.89 | 29 of 176 | 89441 (-32), 89508 (-23), 89433 (-16) | 89444 (+78), 89161 (+63), 89403 (+58) |
| Allergy & immunology | 60 | 249.6 | 0.03 | 0.81 | 18 of 176 | 89701 (-34), 89823 (-30), 89705 (-29) | 89429 (+60), 89451 (+60), 89402 (+57) |
| Lung, breathing & sleep | 60 | 1,406.2 | 0.13 | 0.92 | 26 of 176 | 89506 (-28), 89439 (-27), 89508 (-25) | 89440 (+60), 89039 (+41), 89124 (+37) |
| Digestive / gastroenterology | 60 | 884 | 0.11 | 0.84 | 25 of 176 | 89439 (-37), 89506 (-33), 89441 (-26) | 89451 (+75), 89403 (+64), 89440 (+64) |
| Kidney / nephrology | 60 | 991.8 | 0.11 | 0.88 | 44 of 176 | 89439 (-34), 89506 (-33), 89441 (-25) | 89403 (+76), 89039 (+61), 89428 (+59) |
| Diabetes & hormones | 60 | 475.4 | 0.06 | 0.85 | 34 of 176 | 89441 (-35), 89442 (-29), 89506 (-28) | 89451 (+72), 89833 (+72), 89403 (+69) |
| Cancer care / oncology | 90 | 1,265 | 0.15 | 0.84 | 35 of 176 | 89441 (-39), 89508 (-34), 89510 (-34) | 89440 (+55), 89451 (+50), 89039 (+40) |
| Arthritis / rheumatology | 60 | 307.8 | 0.04 | 0.90 | 27 of 176 | 89441 (-23), 89706 (-22), 89191 (-21) | 89440 (+44), 89039 (+36), 89444 (+31) |
| Brain & nerves / neurology | 60 | 2,065.2 | 0.22 | 0.91 | 56 of 176 | 89074 (-53), 89052 (-52), 89014 (-51) | 89451 (+72), 89403 (+62), 89440 (+49) |
| Ear, nose & throat | 60 | 497.8 | 0.07 | 0.87 | 29 of 176 | 89441 (-37), 89823 (-35), 89835 (-23) | 89451 (+75), 89413 (+63), 89440 (+54) |
| Urology | 60 | 534 | 0.07 | 0.88 | 24 of 176 | 89439 (-52), 89506 (-49), 89441 (-36) | 89403 (+74), 89413 (+63), 89451 (+55) |
| Foot & ankle / podiatry | 60 | 1,262.4 | 0.15 | 0.85 | 24 of 176 | 89823 (-26), 89835 (-17), 89021 (-16) | 89403 (+47), 89828 (+44), 89429 (+42) |
| Pain management | 60 | 963.4 | 0.09 | 0.88 | 45 of 176 | 89052 (-29), 89191 (-29), 89014 (-25) | 89403 (+68), 89451 (+60), 89161 (+51) |
| Plastic & reconstructive surgery | 90 | 786.2 | 0.07 | 0.84 | 61 of 176 | 89191 (-38), 89510 (-37), 89442 (-35) | 89403 (+58), 89429 (+52), 89428 (+46) |
| Speech & language therapy | 30 | 5,302 | 0.90 | 0.75 | 25 of 176 | 89402 (-14), 89406 (-11), 89431 (-10) | 89404 (+100), 89496 (+36), 89429 (+35) |
| Nutrition & dietitian | 30 | 2,669.6 | 0.33 | 0.75 | 45 of 176 | 89427 (-79), 89124 (-72), 89402 (-17) | 89831 (+100), 89420 (+80), 89413 (+71) |
| Acupuncture, massage & naturopathy | 30 | 4,269.4 | 0.52 | 0.76 | 28 of 176 | 89019 (-31), 89406 (-16), 89449 (-15) | 89832 (+100), 89834 (+100), 89413 (+44) |
| Urgent care & emergency | 30 | 4,343.6 | 0.47 | 0.59 | 65 of 176 | 89424 (-82), 89442 (-56), 89008 (-45) | 89420 (+100), 89446 (+100), 89821 (+100) |
| Imaging & lab | 60 | 4,359.8 | 0.49 | 0.85 | 15 of 176 | 89506 (-18), 89166 (-14), 89442 (-14) | 89831 (+97), 89427 (+45), 89440 (+42) |
| Pharmacy | 30 | 15,536.2 | 1.72 | 0.69 | 38 of 176 | 89496 (-64), 89008 (-34), 89821 (-31) | 89831 (+84), 89440 (+68), 89043 (+66) |
| Home health & in-home care | 30 | 53,498.4 | 1.61 | 0.89 | 29 of 176 | 89441 (-27), 89008 (-13), 89442 (-13) | 89124 (+100), 89161 (+97), 89828 (+93) |
| Nursing & assisted living | 60 | 4,066.2 | 0.39 | 0.83 | 21 of 176 | 89008 (-23), 89418 (-19), 89422 (-17) | 89831 (+98), 89451 (+52), 89821 (+50) |
| Medical equipment & supplies | 60 | 3,423.6 | 0.36 | 0.87 | 34 of 176 | 89013 (-24), 89508 (-21), 89506 (-19) | 89451 (+46), 89403 (+40), 89039 (+38) |
| Hearing & audiology | 60 | 1,465.6 | 0.19 | 0.78 | 25 of 176 | 89441 (-18), 89004 (-17), 89027 (-16) | 89124 (+55), 89039 (+38), 89403 (+36) |
| Behavior therapy (ABA) | 30 | 70,802.8 | 2.88 | 0.88 | 52 of 176 | 89020 (-25), 89431 (-18), 89074 (-12) | 89161 (+99), 89828 (+95), 89004 (+81) |
| Care coordination & community health | 30 | 18,913 | 1.63 | 0.76 | 43 of 176 | 89124 (-85), 89424 (-63), 89429 (-61) | 89831 (+100), 89427 (+96), 89430 (+57) |
| General surgery | 60 | 2,662.4 | 0.35 | 0.88 | 36 of 176 | 89506 (-33), 89441 (-25), 89706 (-23) | 89451 (+56), 89403 (+53), 89440 (+44) |
| Infectious disease | 90 | 359.6 | 0.05 | 0.91 | 39 of 176 | 89070 (-35), 89018 (-31), 89510 (-27) | 89440 (+55), 89521 (+30), 89117 (+27) |
| Genetics & genetic counseling | 90 | 264 | 0.03 | 0.87 | 55 of 176 | 89701 (-27), 89703 (-27), 89706 (-27) | 89004 (+41), 89161 (+40), 89440 (+39) |
| Hospice & palliative care | 60 | 4,155.4 | 0.09 | 0.92 | 40 of 176 | 89191 (-61), 89086 (-55), 89085 (-52) | 89821 (+81), 89403 (+59), 89429 (+55) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Nevada in households with no vehicle: about 171,199 of 2,413,131 (7.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 3 of 176 | 89501 (+22), 89169 (+16), 89101 (+15) | 1.00 |
| Pediatrics (children) | 0.99 | 1 of 176 | 89501 (+17), 89169 (+10), 89101 (+9) | 1.00 |
| Women's health / OB-GYN | 0.96 | 1 of 176 | 89501 (+20), 89101 (+10), 89169 (+10) | 0.99 |
| Mental health & counseling | 0.99 | 4 of 176 | 89501 (+29), 89169 (+22), 89101 (+21) | 1.00 |
| Dental | 0.99 | 3 of 176 | 89501 (+27), 89101 (+16), 89169 (+16) | 1.00 |
| Eye care | 0.99 | 1 of 176 | 89501 (+30), 89101 (+13), 89169 (+13) | 1.00 |
| Chiropractic | 0.99 | 1 of 176 | 89501 (+21), 89169 (+11), 89101 (+10) | 1.00 |
| Physical & occupational therapy | 0.99 | 1 of 176 | 89501 (+17), 89101 (+13), 89169 (+13) | 1.00 |
| Orthopedics & sports injury | 0.97 | 1 of 176 | 89501 (+16), 89169 (+10), 89101 (+9) | 0.99 |
| Heart / cardiology | 0.96 | 1 of 176 | 89501 (+19), 89101 (+10), 89169 (+9) | 0.99 |
| Skin / dermatology | 0.98 | 1 of 176 | 89501 (+20), 89169 (+9), 89512 (+9) | 1.00 |
| Allergy & immunology | 0.96 | 0 of 176 | 89501 (+13), 89101 (+7), 89169 (+7) | 0.99 |
| Lung, breathing & sleep | 0.96 | 3 of 176 | 89501 (+21), 89101 (+17), 89169 (+17) | 0.99 |
| Digestive / gastroenterology | 0.95 | 1 of 176 | 89501 (+17), 89101 (+10), 89169 (+9) | 0.99 |
| Kidney / nephrology | 0.95 | 1 of 176 | 89501 (+17), 89101 (+12), 89169 (+11) | 0.98 |
| Diabetes & hormones | 0.97 | 1 of 176 | 89501 (+22), 89101 (+10), 89169 (+10) | 1.00 |
| Cancer care / oncology | 0.95 | 0 of 176 | 89501 (+14), 89101 (+9), 89169 (+8) | 0.98 |
| Arthritis / rheumatology | 0.95 | 1 of 176 | 89501 (+15), 89101 (+11), 89169 (+10) | 0.98 |
| Brain & nerves / neurology | 0.98 | 4 of 176 | 89169 (+24), 89501 (+24), 89101 (+23) | 1.00 |
| Ear, nose & throat | 0.98 | 1 of 176 | 89501 (+21), 89101 (+8), 89512 (+8) | 0.99 |
| Urology | 0.97 | 1 of 176 | 89501 (+25), 89512 (+9), 89101 (+6) | 0.99 |
| Foot & ankle / podiatry | 0.95 | 1 of 176 | 89501 (+15), 89169 (+11), 89101 (+10) | 0.99 |
| Pain management | 0.97 | 4 of 176 | 89501 (+24), 89101 (+21), 89169 (+21) | 0.99 |
| Plastic & reconstructive surgery | 0.94 | 1 of 176 | 89501 (+15), 89169 (+12), 89101 (+11) | 0.98 |
| Speech & language therapy | 0.99 | 1 of 176 | 89501 (+19), 89101 (+7), 89169 (+7) | 1.00 |
| Nutrition & dietitian | 0.99 | 1 of 176 | 89501 (+34), 89512 (+12), 89101 (+11) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 1 of 176 | 89501 (+16), 89169 (+9), 89101 (+8) | 1.00 |
| Urgent care & emergency | 0.99 | 1 of 176 | 89501 (+27), 89101 (+14), 89169 (+14) | 1.00 |
| Imaging & lab | 0.94 | 1 of 176 | 89501 (+15), 89101 (+10), 89169 (+9) | 0.98 |
| Pharmacy | 0.99 | 1 of 176 | 89501 (+24), 89169 (+13), 89101 (+12) | 1.00 |
| Home health & in-home care | 0.99 | 0 of 176 | 89430 (+3), 89442 (+2), 89029 (+1) | 1.00 |
| Nursing & assisted living | 0.96 | 1 of 176 | 89501 (+17), 89101 (+10), 89169 (+10) | 0.99 |
| Medical equipment & supplies | 0.95 | 1 of 176 | 89501 (+17), 89169 (+14), 89101 (+12) | 0.99 |
| Hearing & audiology | 0.95 | 1 of 176 | 89501 (+16), 89101 (+10), 89169 (+9) | 0.99 |
| Behavior therapy (ABA) | 1.00 | 1 of 176 | 89501 (+33), 89512 (+11), 89115 (+6) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 176 | 89501 (+31), 89169 (+14), 89101 (+13) | 1.00 |
| General surgery | 0.97 | 1 of 176 | 89501 (+27), 89169 (+11), 89512 (+11) | 1.00 |
| Infectious disease | 0.95 | 0 of 176 | 89101 (+12), 89169 (+10), 89501 (+9) | 0.98 |
| Genetics & genetic counseling | 0.94 | 0 of 176 | 89501 (+10), 89101 (+8), 89169 (+8) | 0.96 |
| Hospice & palliative care | 1.00 | 1 of 176 | 89501 (+18), 89512 (+7), 89039 (+6) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 16 of 173 | 12,285 (0.5%) |  | 9/103 | 0/15 | 0/1 | 7/54 |
| Women's health / OB-GYN | 016 | 14 of 173 | 12,786 (0.5%) |  | 4/103 | 0/15 | 0/1 | 10/54 |
| Mental health & counseling: Psychiatry | 029 | 21 of 173 | 37,542 (1.6%) |  | 9/103 | 1/15 | 0/1 | 11/54 |
| Mental health & counseling: Clinical Psychology | 036 | 8 of 173 | 5,667 (0.2%) |  | 3/103 | 0/15 | 0/1 | 5/54 |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 173 | 3,496 (0.1%) |  | 4/103 | 0/15 | 0/1 | 2/54 |
| Eye care | 023 | 18 of 173 | 11,088 (0.5%) |  | 7/103 | 0/15 | 0/1 | 11/54 |
| Chiropractic | 010 | 13 of 173 | 9,681 (0.4%) |  | 3/103 | 0/15 | 0/1 | 10/54 |
| Physical & occupational therapy | F049 | 7 of 173 | 4,210 (0.2%) |  | 3/103 | 0/15 | 0/1 | 4/54 |
| Orthopedics & sports injury | 025 | 29 of 173 | 31,314 (1.3%) |  | 9/103 | 0/15 | 0/1 | 20/54 |
| Heart / cardiology | 008 | 34 of 173 | 45,214 (1.9%) |  | 14/103 | 3/15 | 0/1 | 17/54 |
| Skin / dermatology | 011 | 45 of 173 | 72,116 (3.0%) |  | 5/103 | 1/15 | 0/1 | 39/54 |
| Allergy & immunology | 007 | 33 of 173 | 58,272 (2.4%) |  | 12/103 | 3/15 | 0/1 | 18/54 |
| Lung, breathing & sleep | 030 | 32 of 173 | 46,251 (1.9%) |  | 11/103 | 2/15 | 0/1 | 19/54 |
| Digestive / gastroenterology | 014 | 26 of 173 | 46,423 (1.9%) |  | 10/103 | 2/15 | 0/1 | 14/54 |
| Kidney / nephrology | 018 | 12 of 173 | 10,885 (0.5%) |  | 5/103 | 0/15 | 0/1 | 7/54 |
| Diabetes & hormones | 012 | 16 of 173 | 16,276 (0.7%) |  | 3/103 | 0/15 | 0/1 | 13/54 |
| Cancer care / oncology | 021 | 31 of 173 | 30,170 (1.3%) |  | 5/103 | 1/15 | 0/1 | 25/54 |
| Arthritis / rheumatology | 031 | 24 of 173 | 21,054 (0.9%) |  | 3/103 | 0/15 | 0/1 | 21/54 |
| Brain & nerves / neurology | 019 | 28 of 173 | 31,869 (1.3%) |  | 5/103 | 3/15 | 0/1 | 20/54 |
| Ear, nose & throat | 013 | 31 of 173 | 29,945 (1.2%) |  | 6/103 | 2/15 | 0/1 | 23/54 |
| Urology | 033 | 35 of 173 | 53,621 (2.2%) |  | 10/103 | 1/15 | 0/1 | 24/54 |
| Foot & ankle / podiatry | 028 | 37 of 173 | 36,264 (1.5%) |  | 6/103 | 1/15 | 0/1 | 30/54 |
| Plastic & reconstructive surgery | 027 | 29 of 173 | 21,671 (0.9%) |  | 2/103 | 0/15 | 0/1 | 27/54 |
| Speech & language therapy | F051 | 15 of 173 | 12,188 (0.5%) |  | 4/103 | 0/15 | 0/1 | 11/54 |
| Imaging & lab | F047 | 15 of 173 | 11,958 (0.5%) |  | 4/103 | 0/15 | 0/1 | 11/54 |
| Nursing & assisted living | F046 | 13 of 173 | 10,205 (0.4%) |  | 4/103 | 0/15 | 0/1 | 9/54 |
| General surgery | 015 | 28 of 173 | 33,119 (1.4%) |  | 11/103 | 1/15 | 0/1 | 16/54 |
| Infectious disease | 017 | 35 of 173 | 57,658 (2.4%) |  | 3/103 | 1/15 | 0/1 | 31/54 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 7040 rows (ZIP x specialty) stored in access_e2sfca for NV; market-score now uses drive-time access for these ZIPs.
