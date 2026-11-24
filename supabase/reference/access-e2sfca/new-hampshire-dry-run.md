# E2SFCA access dry run: New Hampshire

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,378; in New Hampshire: 246
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,378 x 1,378 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 340,376.201; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.96 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.41), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 13; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 9 (02642, 02652, 02657, 02663, 02666, 02667, 04017, 04019, 04548)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 02642 | no | 2.19 | 42% | 2.19 | 42% | no |
| 02652 | no | 2.29 | 42% | 2.29 | 42% | no |
| 02657 | no | 2.26 | 42% | 2.26 | 42% | no |
| 02663 | no | 2.44 | 42% | 2.44 | 42% | no |
| 02666 | no | 2.31 | 42% | 2.31 | 42% | no |
| 02667 | no | 2.31 | 42% | 2.31 | 42% | no |
| 04017 | no | 19.97 | 100% | 7.45 | 100% | yes (1.69) |
| 04019 | no | 14.31 | 100% | 18.01 | 100% | no |
| 04050 | no | 11.17 | 100% | 5.69 | 100% | yes (1.98) |
| 04109 | no | 7.53 | 100% | 3.66 | 100% | yes (1.70) |
| 04548 | no | 9.05 | 100% | 9.05 | 100% | no |
| 04568 | no | 10.71 | 100% | 3.75 | 100% | yes (1.34) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 40,088.601 | 4.30 | 0.65 | 92 of 246 | 03576 (-36), 03860 (-35), 03801 (-30) | 03812 (+68), 03224 (+58), 03234 (+58) |
| Pediatrics (children) | 30 | 17,139.4 | 1.11 | 0.69 | 70 of 246 | 03264 (-29), 03801 (-26), 03820 (-25) | 03224 (+45), 03285 (+43), 03234 (+41) |
| Women's health / OB-GYN | 60 | 5,573.2 | 0.53 | 0.67 | 108 of 246 | 03077 (-41), 03771 (-41), 03740 (-34) | 03057 (+70), 03854 (+53), 03070 (+51) |
| Mental health & counseling | 30 | 99,672.2 | 7.20 | 0.70 | 106 of 246 | 03820 (-42), 03462 (-32), 03576 (-32) | 03595 (+71), 03812 (+70), 03579 (+67) |
| Dental | 30 | 18,427.8 | 1.65 | 0.71 | 101 of 246 | 03820 (-36), 03753 (-33), 03462 (-28) | 03781 (+78), 03812 (+70), 03846 (+65) |
| Eye care | 30 | 5,587 | 0.62 | 0.66 | 96 of 246 | 03576 (-44), 03561 (-36), 03820 (-36) | 03781 (+79), 03812 (+66), 03595 (+64) |
| Chiropractic | 30 | 4,254.8 | 0.63 | 0.67 | 90 of 246 | 03894 (-37), 03820 (-34), 03753 (-32) | 03781 (+79), 03812 (+60), 03082 (+57) |
| Physical & occupational therapy | 30 | 32,821.6 | 2.70 | 0.61 | 128 of 246 | 03785 (-35), 03774 (-32), 03740 (-28) | 03812 (+85), 03601 (+66), 03575 (+65) |
| Orthopedics & sports injury | 60 | 3,899.8 | 0.39 | 0.43 | 150 of 246 | 03293 (-89), 03282 (-80), 03215 (-73) | 03853 (+66), 03816 (+65), 03850 (+61) |
| Heart / cardiology | 60 | 2,243.4 | 0.24 | 0.70 | 74 of 246 | 03077 (-42), 03079 (-38), 03291 (-34) | 03046 (+73), 03234 (+66), 03258 (+64) |
| Skin / dermatology | 60 | 1,052.8 | 0.09 | 0.50 | 117 of 246 | 03284 (-100), 03751 (-100), 03753 (-100) | 03854 (+73), 03870 (+59), 03431 (+57) |
| Allergy & immunology | 60 | 311.2 | 0.03 | 0.66 | 91 of 246 | 03223 (-63), 03264 (-42), 03279 (-41) | 03457 (+74), 03448 (+71), 03215 (+65) |
| Lung, breathing & sleep | 60 | 1,027 | 0.13 | 0.56 | 92 of 246 | 03771 (-57), 03262 (-40), 03293 (-37) | 03595 (+62), 03226 (+59), 03253 (+52) |
| Digestive / gastroenterology | 60 | 1,102.8 | 0.11 | 0.70 | 108 of 246 | 03077 (-47), 03079 (-42), 03771 (-39) | 03234 (+68), 03275 (+65), 03450 (+63) |
| Kidney / nephrology | 60 | 705 | 0.11 | 0.62 | 53 of 246 | 03077 (-24), 03574 (-21), 03561 (-19) | 03854 (+49), 03448 (+37), 03457 (+37) |
| Diabetes & hormones | 60 | 791.2 | 0.06 | 0.61 | 153 of 246 | 03582 (-60), 03077 (-59), 03079 (-57) | 03867 (+64), 03869 (+61), 03825 (+60) |
| Cancer care / oncology | 90 | 1,686.8 | 0.15 | 0.50 | 77 of 246 | 03079 (-60), 03076 (-55), 03865 (-53) | 03448 (+86), 03457 (+83), 03445 (+75) |
| Arthritis / rheumatology | 60 | 417.8 | 0.04 | 0.63 | 152 of 246 | 03447 (-64), 03440 (-62), 03464 (-62) | 03595 (+73), 03221 (+65), 03585 (+65) |
| Brain & nerves / neurology | 60 | 2,243.8 | 0.22 | 0.60 | 95 of 246 | 03865 (-38), 03079 (-36), 03087 (-33) | 03854 (+63), 03781 (+54), 03770 (+48) |
| Ear, nose & throat | 60 | 595.8 | 0.07 | 0.67 | 124 of 246 | 03771 (-69), 03740 (-58), 03584 (-46) | 03234 (+66), 03457 (+65), 03229 (+63) |
| Urology | 60 | 686.2 | 0.07 | 0.61 | 122 of 246 | 03771 (-63), 03609 (-60), 03608 (-54) | 03601 (+73), 03450 (+69), 03595 (+68) |
| Foot & ankle / podiatry | 60 | 1,044.2 | 0.15 | 0.60 | 110 of 246 | 03580 (-46), 03586 (-40), 03077 (-35) | 03870 (+67), 03854 (+65), 03285 (+58) |
| Pain management | 60 | 485 | 0.09 | 0.55 | 133 of 246 | 03042 (-45), 03077 (-45), 03276 (-38) | 03285 (+74), 03266 (+71), 03817 (+70) |
| Plastic & reconstructive surgery | 90 | 478.8 | 0.07 | 0.65 | 70 of 246 | 03087 (-37), 03865 (-37), 03051 (-34) | 03870 (+67), 03854 (+65), 03871 (+60) |
| Speech & language therapy | 30 | 7,572.6 | 0.90 | 0.77 | 86 of 246 | 03458 (-34), 03820 (-33), 03801 (-28) | 03812 (+61), 03235 (+57), 03810 (+52) |
| Nutrition & dietitian | 30 | 4,093.4 | 0.33 | 0.69 | 113 of 246 | 03278 (-61), 03781 (-38), 03264 (-36) | 03592 (+100), 03590 (+96), 03238 (+82) |
| Acupuncture, massage & naturopathy | 30 | 4,715.8 | 0.52 | 0.71 | 90 of 246 | 03462 (-49), 03820 (-49), 03814 (-39) | 03082 (+94), 03812 (+86), 03781 (+70) |
| Urgent care & emergency | 30 | 4,020 | 0.47 | 0.66 | 103 of 246 | 03771 (-44), 03814 (-40), 03801 (-38) | 03238 (+100), 03812 (+100), 03590 (+89) |
| Imaging & lab | 60 | 4,260.8 | 0.49 | 0.66 | 75 of 246 | 03771 (-29), 03609 (-28), 03077 (-27) | 03234 (+40), 03812 (+40), 03854 (+39) |
| Pharmacy | 30 | 13,239.8 | 1.72 | 0.62 | 93 of 246 | 03576 (-35), 03785 (-33), 03561 (-30) | 03812 (+62), 03595 (+57), 03781 (+56) |
| Home health & in-home care | 30 | 5,853.2 | 1.61 | 0.73 | 8 of 246 | 03576 (-17), 03820 (-11), 03864 (-11) | 03579 (+22), 03590 (+20), 03850 (+19) |
| Nursing & assisted living | 60 | 2,687 | 0.39 | 0.43 | 101 of 246 | 03771 (-53), 03753 (-47), 03740 (-35) | 03450 (+63), 03458 (+60), 03444 (+59) |
| Medical equipment & supplies | 60 | 1,914.6 | 0.36 | 0.61 | 109 of 246 | 03890 (-35), 03771 (-34), 03740 (-31) | 03812 (+49), 03258 (+45), 03846 (+44) |
| Hearing & audiology | 60 | 1,658.8 | 0.19 | 0.56 | 142 of 246 | 03771 (-58), 03584 (-52), 03293 (-51) | 03853 (+71), 03266 (+70), 03229 (+64) |
| Behavior therapy (ABA) | 30 | 18,965.4 | 2.88 | 0.86 | 21 of 246 | 03820 (-29), 03874 (-18), 03801 (-15) | 03470 (+29), 03055 (+24), 03441 (+24) |
| Care coordination & community health | 30 | 13,719.6 | 1.63 | 0.74 | 76 of 246 | 03609 (-70), 03276 (-68), 03106 (-58) | 03812 (+100), 03601 (+99), 03846 (+96) |
| General surgery | 60 | 2,863 | 0.35 | 0.52 | 112 of 246 | 03077 (-45), 03771 (-45), 03890 (-40) | 03854 (+66), 03234 (+56), 03857 (+53) |
| Infectious disease | 90 | 575.6 | 0.05 | 0.59 | 76 of 246 | 03079 (-62), 03038 (-60), 03826 (-60) | 03057 (+77), 03448 (+76), 03457 (+72) |
| Genetics & genetic counseling | 90 | 442 | 0.03 | 0.49 | 107 of 246 | 03079 (-100), 03865 (-100), 03874 (-100) | 03812 (+89), 03818 (+81), 03832 (+79) |
| Hospice & palliative care | 60 | 449.8 | 0.09 | 0.59 | 145 of 246 | 03575 (-61), 03077 (-44), 03890 (-43) | 03590 (+70), 03254 (+67), 03216 (+65) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in New Hampshire in households with no vehicle: about 51,489 of 1,120,742 (4.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 1
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 1 of 246 | 03101 (+18), 03238 (+8), 03774 (+6) | 1.00 |
| Pediatrics (children) | 1.00 | 1 of 246 | 03101 (+15), 03217 (+4), 03774 (+4) | 1.00 |
| Women's health / OB-GYN | 0.99 | 0 of 246 | 03101 (+10), 03583 (+5), 03817 (+5) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 246 | 03101 (+18), 03817 (+7), 03238 (+4) | 1.00 |
| Dental | 1.00 | 1 of 246 | 03101 (+20), 03818 (+5), 03869 (+5) | 1.00 |
| Eye care | 1.00 | 1 of 246 | 03101 (+16), 03583 (+4), 03755 (+4) | 1.00 |
| Chiropractic | 1.00 | 0 of 246 | 03101 (+14), 03755 (+4), 03817 (+4) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 246 | 03101 (+13), 03817 (+7), 03583 (+6) | 1.00 |
| Orthopedics & sports injury | 0.99 | 1 of 246 | 03238 (+26), 03101 (+10), 03817 (+8) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 246 | 03101 (+6), 03869 (+2), 03060 (+1) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 246 | 03101 (+6), 03601 (+3), 03743 (+2) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 246 | 03238 (+16), 03264 (+4), 03101 (+3) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 246 | 03238 (+8), 03101 (+6), 03785 (+5) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 246 | 03101 (+8), 03238 (+5), 03774 (+3) | 1.00 |
| Kidney / nephrology | 0.99 | 0 of 246 | 03101 (+4), 03583 (+2), 03817 (+2) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 246 | 03101 (+9), 03817 (+7), 03818 (+5) | 1.00 |
| Cancer care / oncology | 0.99 | 0 of 246 | 03101 (+8), 03238 (+4), 03060 (+2) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 246 | 03101 (+9), 03602 (+3), 03217 (+2) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 246 | 03101 (+5), 03583 (+3), 03755 (+2) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 246 | 03101 (+6), 03583 (+4), 03774 (+4) | 1.00 |
| Urology | 0.99 | 0 of 246 | 03238 (+7), 03101 (+6), 03774 (+6) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 0 of 246 | 03583 (+7), 03101 (+6), 03238 (+5) | 1.00 |
| Pain management | 1.00 | 0 of 246 | 03238 (+6), 03817 (+6), 03101 (+5) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 0 of 246 | 03101 (+5), 03238 (+3), 03869 (+2) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 246 | 03101 (+19), 03817 (+7), 03869 (+6) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 246 | 03869 (+6), 03784 (+5), 03583 (+4) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 246 | 03101 (+15), 03817 (+7), 03601 (+5) | 1.00 |
| Urgent care & emergency | 1.00 | 1 of 246 | 03101 (+15), 03583 (+7), 03598 (+4) | 1.00 |
| Imaging & lab | 1.00 | 0 of 246 | 03101 (+6), 03238 (+5), 03583 (+5) | 1.00 |
| Pharmacy | 1.00 | 1 of 246 | 03101 (+16), 03238 (+7), 03774 (+7) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 246 | 03101 (+6), 03060 (+1), 03084 (+1) | 1.00 |
| Nursing & assisted living | 0.99 | 0 of 246 | 03238 (+9), 03101 (+7), 03817 (+6) | 1.00 |
| Medical equipment & supplies | 0.99 | 0 of 246 | 03101 (+9), 03817 (+7), 03886 (+4) | 1.00 |
| Hearing & audiology | 0.99 | 0 of 246 | 03101 (+9), 03238 (+7), 03817 (+6) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 246 | 03101 (+9), 03060 (+3), 03818 (+2) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 246 | 03101 (+16), 03817 (+14), 03597 (+4) | 1.00 |
| General surgery | 0.99 | 0 of 246 | 03238 (+8), 03101 (+7), 03817 (+6) | 1.00 |
| Infectious disease | 1.00 | 0 of 246 | 03101 (+8), 03060 (+2), 03869 (+2) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 246 | 03101 (+10), 03238 (+4), 03060 (+2) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 246 | 03583 (+8), 03101 (+7), 03817 (+6) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 18 of 245 | 26,453 (2.4%) |  | 17/151 | 0/79 | 1/15 |  |
| Women's health / OB-GYN | 016 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Mental health & counseling: Psychiatry | 029 | 3 of 245 | 3,802 (0.3%) |  | 0/151 | 0/79 | 3/15 |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Eye care | 023 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Chiropractic | 010 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Physical & occupational therapy | F049 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Orthopedics & sports injury | 025 | 1 of 245 | 3,004 (0.3%) |  | 1/151 | 0/79 | 0/15 |  |
| Heart / cardiology | 008 | 39 of 245 | 73,242 (6.5%) |  | 24/151 | 10/79 | 5/15 |  |
| Skin / dermatology | 011 | 11 of 245 | 10,219 (0.9%) |  | 3/151 | 4/79 | 4/15 |  |
| Allergy & immunology | 007 | 12 of 245 | 15,342 (1.4%) |  | 9/151 | 2/79 | 1/15 |  |
| Lung, breathing & sleep | 030 | 7 of 245 | 9,040 (0.8%) |  | 4/151 | 0/79 | 3/15 |  |
| Digestive / gastroenterology | 014 | 10 of 245 | 15,230 (1.4%) |  | 5/151 | 0/79 | 5/15 |  |
| Kidney / nephrology | 018 | 3 of 245 | 3,358 (0.3%) |  | 3/151 | 0/79 | 0/15 |  |
| Diabetes & hormones | 012 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Cancer care / oncology | 021 | 6 of 245 | 5,242 (0.5%) |  | 5/151 | 0/79 | 1/15 |  |
| Arthritis / rheumatology | 031 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Brain & nerves / neurology | 019 | 5 of 245 | 5,631 (0.5%) |  | 0/151 | 2/79 | 3/15 |  |
| Ear, nose & throat | 013 | 10 of 245 | 13,769 (1.2%) |  | 9/151 | 0/79 | 1/15 |  |
| Urology | 033 | 16 of 245 | 15,605 (1.4%) |  | 3/151 | 8/79 | 5/15 |  |
| Foot & ankle / podiatry | 028 | 1 of 245 | 994 (0.1%) |  | 0/151 | 0/79 | 1/15 |  |
| Plastic & reconstructive surgery | 027 | 2 of 245 | 1,960 (0.2%) |  | 1/151 | 0/79 | 1/15 |  |
| Speech & language therapy | F051 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Imaging & lab | F047 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| Nursing & assisted living | F046 | 0 of 245 | 0 (0.0%) |  | 0/151 | 0/79 | 0/15 |  |
| General surgery | 015 | 11 of 245 | 36,725 (3.3%) |  | 10/151 | 0/79 | 1/15 |  |
| Infectious disease | 017 | 10 of 245 | 11,320 (1.0%) |  | 1/151 | 5/79 | 4/15 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 9840 rows (ZIP x specialty) stored in access_e2sfca for NH; market-score now uses drive-time access for these ZIPs.
