# E2SFCA access dry run: New York

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 5,712; in New York: 1,787
- Drive times: OSRM on OpenStreetMap roads (car profile), 5,712 x 5,712 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,607,632.801; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.01 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.53), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 13; re-anchored: 11; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (02535, 06390)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 02535 | no | none | 0% | none | 0% | no |
| 02872 | no | 9.04 | 100% | 3.14 | 100% | yes (2.18) |
| 06390 | no | 8.29 | 100% | 8.29 | 100% | no |
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 10044 | yes | 12.91 | 100% | 5.46 | 100% | yes (0.70) |
| 10596 | yes | 7.62 | 100% | 2.67 | 100% | yes (1.26) |
| 11101 | yes | 8.52 | 100% | 4.81 | 100% | yes (0.47) |
| 12173 | yes | 7.64 | 100% | 4.78 | 100% | yes (1.27) |
| 15450 | no | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | no | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 17517 | no | 9.34 | 100% | 2.36 | 100% | yes (1.07) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 198,802.001 | 4.30 | 0.73 | 540 of 1787 | 13439 (-70), 13315 (-65), 12852 (-58) | 13488 (+93), 12996 (+85), 13320 (+81) |
| Pediatrics (children) | 30 | 65,237 | 1.11 | 0.78 | 663 of 1787 | 13839 (-63), 13847 (-60), 11367 (-55) | 13320 (+93), 12996 (+83), 12161 (+77) |
| Women's health / OB-GYN | 60 | 26,209.8 | 0.53 | 0.55 | 926 of 1787 | 11365 (-62), 11439 (-62), 11366 (-60) | 14066 (+85), 10152 (+80), 10018 (+73) |
| Mental health & counseling | 30 | 370,797.4 | 7.20 | 0.76 | 570 of 1787 | 11365 (-67), 11439 (-66), 11366 (-65) | 12168 (+90), 12996 (+90), 10152 (+86) |
| Dental | 30 | 75,111.6 | 1.65 | 0.80 | 453 of 1787 | 11365 (-56), 11439 (-55), 11357 (-51) | 13608 (+86), 13691 (+83), 12168 (+67) |
| Eye care | 30 | 29,533 | 0.62 | 0.74 | 625 of 1787 | 11430 (-58), 11420 (-53), 14525 (-52) | 13488 (+100), 13320 (+95), 12059 (+88) |
| Chiropractic | 30 | 24,961 | 0.63 | 0.69 | 513 of 1787 | 12516 (-46), 10119 (-40), 10199 (-40) | 13160 (+78), 12936 (+65), 12943 (+63) |
| Physical & occupational therapy | 30 | 151,018 | 2.70 | 0.71 | 696 of 1787 | 11430 (-55), 11420 (-54), 10465 (-53) | 12975 (+84), 12161 (+74), 13156 (+74) |
| Orthopedics & sports injury | 60 | 18,372.6 | 0.39 | 0.47 | 855 of 1787 | 13784 (-79), 13092 (-74), 12941 (-72) | 13684 (+89), 13312 (+86), 13738 (+79) |
| Heart / cardiology | 60 | 13,262.2 | 0.24 | 0.73 | 904 of 1787 | 13439 (-72), 12151 (-67), 13315 (-66) | 10152 (+76), 11948 (+76), 11952 (+73) |
| Skin / dermatology | 60 | 4,873.4 | 0.09 | 0.78 | 782 of 1787 | 11414 (-81), 11367 (-77), 11430 (-73) | 11958 (+85), 12023 (+80), 12996 (+80) |
| Allergy & immunology | 60 | 1,795.6 | 0.03 | 0.72 | 1022 of 1787 | 12942 (-100), 12997 (-90), 12978 (-84) | 14066 (+89), 13684 (+83), 14550 (+83) |
| Lung, breathing & sleep | 60 | 5,510.2 | 0.13 | 0.71 | 749 of 1787 | 13439 (-84), 13315 (-71), 13482 (-69) | 12085 (+68), 13672 (+67), 10152 (+65) |
| Digestive / gastroenterology | 60 | 6,497 | 0.11 | 0.73 | 957 of 1787 | 13138 (-71), 13020 (-68), 14754 (-68) | 13431 (+77), 13738 (+71), 13488 (+70) |
| Kidney / nephrology | 60 | 4,760.2 | 0.11 | 0.65 | 886 of 1787 | 13439 (-77), 13475 (-62), 13364 (-61) | 11948 (+79), 11952 (+79), 12161 (+71) |
| Diabetes & hormones | 60 | 3,754.4 | 0.06 | 0.63 | 1039 of 1787 | 12116 (-100), 12155 (-100), 13313 (-100) | 12843 (+84), 11948 (+80), 13155 (+79) |
| Cancer care / oncology | 90 | 8,266 | 0.15 | 0.55 | 1209 of 1787 | 11430 (-76), 11414 (-75), 10931 (-74) | 12975 (+81), 13450 (+76), 13488 (+76) |
| Arthritis / rheumatology | 60 | 2,078.2 | 0.04 | 0.68 | 1021 of 1787 | 12116 (-100), 13315 (-100), 13335 (-100) | 12975 (+100), 12996 (+100), 12131 (+88) |
| Brain & nerves / neurology | 60 | 10,798.8 | 0.22 | 0.76 | 803 of 1787 | 11430 (-74), 11367 (-69), 11420 (-69) | 12996 (+91), 11770 (+89), 12975 (+87) |
| Ear, nose & throat | 60 | 3,143 | 0.07 | 0.56 | 1071 of 1787 | 13439 (-100), 13315 (-96), 13482 (-95) | 14066 (+89), 14415 (+82), 12720 (+80) |
| Urology | 60 | 3,732.4 | 0.07 | 0.60 | 1029 of 1787 | 12842 (-100), 12864 (-100), 13494 (-100) | 13684 (+85), 10006 (+75), 10032 (+74) |
| Foot & ankle / podiatry | 60 | 9,837 | 0.15 | 0.79 | 827 of 1787 | 12790 (-65), 14736 (-63), 13084 (-62) | 11770 (+81), 14054 (+80), 10152 (+78) |
| Pain management | 60 | 3,896.6 | 0.09 | 0.77 | 821 of 1787 | 11414 (-72), 11430 (-69), 11419 (-64) | 12996 (+87), 12725 (+86), 11770 (+84) |
| Plastic & reconstructive surgery | 90 | 3,198 | 0.07 | 0.64 | 1039 of 1787 | 11414 (-90), 11420 (-87), 11430 (-86) | 11958 (+85), 11932 (+83), 11975 (+82) |
| Speech & language therapy | 30 | 48,629 | 0.90 | 0.80 | 725 of 1787 | 12790 (-78), 13694 (-48), 12847 (-46) | 11770 (+100), 10987 (+88), 10152 (+80) |
| Nutrition & dietitian | 30 | 17,756.4 | 0.33 | 0.77 | 645 of 1787 | 13439 (-73), 13315 (-69), 13834 (-68) | 12996 (+100), 13320 (+100), 13488 (+100) |
| Acupuncture, massage & naturopathy | 30 | 20,346 | 0.52 | 0.83 | 570 of 1787 | 11430 (-61), 14731 (-55), 11420 (-49) | 11770 (+100), 13312 (+90), 12427 (+86) |
| Urgent care & emergency | 30 | 20,229.8 | 0.47 | 0.75 | 565 of 1787 | 13315 (-79), 13439 (-77), 12842 (-70) | 12996 (+100), 13488 (+97), 12975 (+90) |
| Imaging & lab | 60 | 21,679.2 | 0.49 | 0.66 | 826 of 1787 | 11430 (-66), 11439 (-66), 11357 (-62) | 10152 (+77), 10036 (+74), 10018 (+73) |
| Pharmacy | 30 | 83,413.4 | 1.72 | 0.69 | 672 of 1787 | 13690 (-53), 13834 (-50), 12455 (-44) | 13646 (+77), 12161 (+74), 13320 (+70) |
| Home health & in-home care | 30 | 33,148 | 1.61 | 0.74 | 34 of 1787 | 12842 (-65), 12864 (-65), 12812 (-33) | 13436 (+50), 12164 (+44), 14708 (+29) |
| Nursing & assisted living | 60 | 11,517.6 | 0.39 | 0.44 | 447 of 1787 | 12790 (-68), 12428 (-62), 12483 (-62) | 12592 (+75), 12927 (+71), 12501 (+68) |
| Medical equipment & supplies | 60 | 13,889 | 0.36 | 0.73 | 563 of 1787 | 10119 (-58), 10199 (-58), 11357 (-49) | 12836 (+49), 14066 (+48), 14721 (+45) |
| Hearing & audiology | 60 | 8,368.2 | 0.19 | 0.57 | 962 of 1787 | 12941 (-79), 13020 (-77), 13159 (-76) | 12194 (+85), 12071 (+82), 14884 (+80) |
| Behavior therapy (ABA) | 30 | 50,950.6 | 2.88 | 0.90 | 30 of 1787 | 10199 (-22), 11430 (-22), 10119 (-21) | 11768 (+49), 11721 (+36), 11743 (+28) |
| Care coordination & community health | 30 | 71,357 | 1.63 | 0.73 | 749 of 1787 | 12957 (-84), 14525 (-70), 12790 (-61) | 12969 (+100), 12996 (+98), 13312 (+98) |
| General surgery | 60 | 16,752 | 0.35 | 0.61 | 1004 of 1787 | 12132 (-79), 12115 (-76), 12195 (-74) | 10152 (+77), 12996 (+77), 10036 (+75) |
| Infectious disease | 90 | 2,935.4 | 0.05 | 0.62 | 1139 of 1787 | 11096 (-79), 11509 (-79), 11559 (-76) | 13360 (+100), 12164 (+92), 12108 (+90) |
| Genetics & genetic counseling | 90 | 1,861.4 | 0.03 | 0.70 | 901 of 1787 | 11430 (-79), 11414 (-66), 11509 (-65) | 13353 (+98), 12975 (+97), 13437 (+81) |
| Hospice & palliative care | 60 | 1,894.4 | 0.09 | 0.50 | 296 of 1787 | 14736 (-44), 13159 (-42), 13020 (-40) | 13738 (+100), 12996 (+95), 12975 (+87) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in New York in households with no vehicle: about 4,604,771 of 16,088,154 (28.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 31
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.95 | 158 of 1787 | 10152 (+53), 10036 (+51), 10019 (+49) | 0.99 |
| Pediatrics (children) | 0.96 | 164 of 1787 | 10152 (+72), 10036 (+64), 10019 (+62) | 1.00 |
| Women's health / OB-GYN | 0.89 | 258 of 1787 | 10152 (+62), 10032 (+54), 10036 (+54) | 0.99 |
| Mental health & counseling | 0.96 | 153 of 1787 | 10152 (+70), 10006 (+53), 10032 (+51) | 0.99 |
| Dental | 0.96 | 139 of 1787 | 10152 (+48), 10032 (+46), 10036 (+46) | 1.00 |
| Eye care | 0.95 | 164 of 1787 | 13683 (+63), 10152 (+60), 10006 (+49) | 1.00 |
| Chiropractic | 0.96 | 64 of 1787 | 10519 (+34), 10032 (+32), 10033 (+29) | 1.00 |
| Physical & occupational therapy | 0.94 | 180 of 1787 | 10152 (+57), 13738 (+52), 10032 (+49) | 1.00 |
| Orthopedics & sports injury | 0.85 | 186 of 1787 | 13738 (+73), 10032 (+42), 10152 (+40) | 0.99 |
| Heart / cardiology | 0.95 | 249 of 1787 | 10152 (+76), 10006 (+67), 10036 (+67) | 0.99 |
| Skin / dermatology | 0.98 | 247 of 1787 | 10032 (+70), 10030 (+63), 10452 (+62) | 1.00 |
| Allergy & immunology | 0.94 | 261 of 1787 | 10032 (+70), 10152 (+70), 10036 (+64) | 0.99 |
| Lung, breathing & sleep | 0.94 | 235 of 1787 | 10152 (+56), 10032 (+49), 10036 (+49) | 0.99 |
| Digestive / gastroenterology | 0.97 | 234 of 1787 | 10006 (+73), 10152 (+69), 10032 (+64) | 0.99 |
| Kidney / nephrology | 0.93 | 243 of 1787 | 10152 (+63), 10036 (+55), 10018 (+54) | 0.99 |
| Diabetes & hormones | 0.94 | 249 of 1787 | 10152 (+71), 10006 (+68), 10032 (+64) | 0.99 |
| Cancer care / oncology | 0.95 | 301 of 1787 | 10032 (+60), 10030 (+52), 10033 (+52) | 0.99 |
| Arthritis / rheumatology | 0.94 | 263 of 1787 | 10032 (+60), 10152 (+59), 10036 (+58) | 0.99 |
| Brain & nerves / neurology | 0.96 | 259 of 1787 | 10032 (+61), 10152 (+61), 10036 (+57) | 0.99 |
| Ear, nose & throat | 0.93 | 245 of 1787 | 10032 (+56), 10030 (+49), 10033 (+48) | 0.99 |
| Urology | 0.93 | 262 of 1787 | 10032 (+58), 10006 (+54), 10152 (+54) | 0.99 |
| Foot & ankle / podiatry | 0.96 | 180 of 1787 | 10152 (+78), 10006 (+67), 10032 (+64) | 0.99 |
| Pain management | 0.97 | 248 of 1787 | 10152 (+75), 10032 (+71), 10006 (+63) | 1.00 |
| Plastic & reconstructive surgery | 0.97 | 305 of 1787 | 10032 (+71), 10452 (+63), 10033 (+61) | 0.99 |
| Speech & language therapy | 0.96 | 148 of 1787 | 10152 (+76), 10006 (+63), 13738 (+62) | 1.00 |
| Nutrition & dietitian | 0.96 | 150 of 1787 | 10152 (+64), 10036 (+56), 10019 (+53) | 1.00 |
| Acupuncture, massage & naturopathy | 0.98 | 147 of 1787 | 10152 (+68), 10032 (+53), 10029 (+51) | 1.00 |
| Urgent care & emergency | 0.97 | 149 of 1787 | 10152 (+59), 10036 (+55), 10019 (+52) | 1.00 |
| Imaging & lab | 0.93 | 235 of 1787 | 10032 (+49), 10152 (+48), 10006 (+47) | 0.99 |
| Pharmacy | 0.94 | 187 of 1787 | 10152 (+69), 10036 (+58), 10016 (+57) | 0.99 |
| Home health & in-home care | 0.94 | 1 of 1787 | 13683 (+19), 13738 (+14), 10152 (+12) | 1.00 |
| Nursing & assisted living | 0.85 | 27 of 1787 | 12749 (+34), 12489 (+30), 10152 (+23) | 0.99 |
| Medical equipment & supplies | 0.91 | 233 of 1787 | 10152 (+59), 10036 (+49), 10016 (+47) | 0.99 |
| Hearing & audiology | 0.88 | 214 of 1787 | 13738 (+44), 10152 (+41), 10032 (+40) | 0.99 |
| Behavior therapy (ABA) | 0.99 | 2 of 1787 | 10006 (+13), 10152 (+12), 10005 (+11) | 1.00 |
| Care coordination & community health | 0.95 | 195 of 1787 | 10152 (+81), 10006 (+60), 10032 (+56) | 1.00 |
| General surgery | 0.91 | 255 of 1787 | 10152 (+55), 10032 (+53), 10036 (+52) | 0.99 |
| Infectious disease | 0.97 | 274 of 1787 | 10152 (+69), 10032 (+65), 10006 (+60) | 1.00 |
| Genetics & genetic counseling | 0.98 | 279 of 1787 | 10152 (+51), 10032 (+48), 10036 (+46) | 1.00 |
| Hospice & palliative care | 0.93 | 8 of 1787 | 13738 (+39), 10152 (+18), 10018 (+16) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 47 of 1785 | 74,586 (0.5%) | 4/434 | 42/692 | 1/502 | 0/146 | 0/11 |
| Women's health / OB-GYN | 016 | 5 of 1785 | 2,062 (0.0%) | 1/434 | 3/692 | 1/502 | 0/146 | 0/11 |
| Mental health & counseling: Psychiatry | 029 | 14 of 1785 | 9,385 (0.1%) | 2/434 | 8/692 | 4/502 | 0/146 | 0/11 |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 1785 | 4,462 (0.0%) | 2/434 | 1/692 | 1/502 | 0/146 | 0/11 |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 1785 | 1,316 (0.0%) | 1/434 | 1/692 | 4/502 | 0/146 | 0/11 |
| Eye care | 023 | 26 of 1785 | 27,251 (0.2%) | 3/434 | 19/692 | 4/502 | 0/146 | 0/11 |
| Chiropractic | 010 | 0 of 1785 | 0 (0.0%) | 0/434 | 0/692 | 0/502 | 0/146 | 0/11 |
| Physical & occupational therapy | F049 | 0 of 1785 | 0 (0.0%) | 0/434 | 0/692 | 0/502 | 0/146 | 0/11 |
| Orthopedics & sports injury | 025 | 30 of 1785 | 30,197 (0.2%) | 6/434 | 15/692 | 9/502 | 0/146 | 0/11 |
| Heart / cardiology | 008 | 89 of 1785 | 108,363 (0.7%) | 4/434 | 67/692 | 17/502 | 0/146 | 1/11 |
| Skin / dermatology | 011 | 85 of 1785 | 109,768 (0.7%) | 10/434 | 25/692 | 38/502 | 12/146 | 0/11 |
| Allergy & immunology | 007 | 32 of 1785 | 44,606 (0.3%) | 7/434 | 23/692 | 1/502 | 1/146 | 0/11 |
| Lung, breathing & sleep | 030 | 35 of 1785 | 48,173 (0.3%) | 7/434 | 11/692 | 14/502 | 3/146 | 0/11 |
| Digestive / gastroenterology | 014 | 54 of 1785 | 67,392 (0.4%) | 9/434 | 21/692 | 14/502 | 10/146 | 0/11 |
| Kidney / nephrology | 018 | 25 of 1785 | 30,922 (0.2%) | 8/434 | 15/692 | 1/502 | 1/146 | 0/11 |
| Diabetes & hormones | 012 | 9 of 1785 | 30,350 (0.2%) | 8/434 | 1/692 | 0/502 | 0/146 | 0/11 |
| Cancer care / oncology | 021 | 62 of 1785 | 131,647 (0.8%) | 22/434 | 18/692 | 18/502 | 4/146 | 0/11 |
| Arthritis / rheumatology | 031 | 24 of 1785 | 51,995 (0.3%) | 11/434 | 6/692 | 4/502 | 3/146 | 0/11 |
| Brain & nerves / neurology | 019 | 34 of 1785 | 21,660 (0.1%) | 5/434 | 13/692 | 11/502 | 5/146 | 0/11 |
| Ear, nose & throat | 013 | 35 of 1785 | 64,671 (0.4%) | 9/434 | 23/692 | 3/502 | 0/146 | 0/11 |
| Urology | 033 | 42 of 1785 | 84,256 (0.5%) | 14/434 | 16/692 | 8/502 | 4/146 | 0/11 |
| Foot & ankle / podiatry | 028 | 10 of 1785 | 24,906 (0.2%) | 4/434 | 2/692 | 3/502 | 1/146 | 0/11 |
| Plastic & reconstructive surgery | 027 | 16 of 1785 | 22,890 (0.1%) | 7/434 | 9/692 | 0/502 | 0/146 | 0/11 |
| Speech & language therapy | F051 | 3 of 1785 | 4,800 (0.0%) | 3/434 | 0/692 | 0/502 | 0/146 | 0/11 |
| Imaging & lab | F047 | 11 of 1785 | 6,461 (0.0%) | 3/434 | 8/692 | 0/502 | 0/146 | 0/11 |
| Nursing & assisted living | F046 | 7 of 1785 | 13,959 (0.1%) | 3/434 | 4/692 | 0/502 | 0/146 | 0/11 |
| General surgery | 015 | 78 of 1785 | 86,454 (0.5%) | 3/434 | 60/692 | 12/502 | 1/146 | 2/11 |
| Infectious disease | 017 | 11 of 1785 | 24,295 (0.2%) | 6/434 | 3/692 | 0/502 | 2/146 | 0/11 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 71480 rows (ZIP x specialty) stored in access_e2sfca for NY; market-score now uses drive-time access for these ZIPs.
