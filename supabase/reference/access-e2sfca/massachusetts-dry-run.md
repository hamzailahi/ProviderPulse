# E2SFCA access dry run: Massachusetts

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,392; in Massachusetts: 534
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,392 x 2,392 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,044,651.201; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.07 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.68), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 15; re-anchored: 8; still implausible (left out of the rank comparison, still stored, marked in the CSV): 7 (04003, 04019, 04066, 04079, 04562, 04852, 06390)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | yes | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 02575 | yes | 7.95 | 100% | 4.49 | 100% | yes (1.48) |
| 02872 | no | 9.04 | 100% | 3.14 | 100% | yes (2.18) |
| 04003 | no | 2.99 | 17% | 2.99 | 17% | no |
| 04017 | no | 17.46 | 83% | 3.58 | 83% | yes (1.69) |
| 04019 | no | 13.58 | 83% | 14.31 | 83% | no |
| 04050 | no | 11.17 | 100% | 5.73 | 100% | yes (1.98) |
| 04066 | no | 3.27 | 17% | 3.27 | 17% | no |
| 04079 | no | 3.27 | 17% | 3.27 | 17% | no |
| 04562 | no | none | 0% | none | 0% | no |
| 04852 | no | 1.25 | 8% | 1.25 | 8% | no |
| 06390 | no | 8.29 | 100% | 8.29 | 100% | no |
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 10044 | no | 12.91 | 100% | 5.46 | 100% | yes (0.70) |
| 11101 | no | 8.52 | 100% | 4.81 | 100% | yes (0.47) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 122,591.801 | 4.30 | 0.77 | 121 of 534 | 01867 (-43), 02561 (-28), 01803 (-27) | 01908 (+56), 02163 (+54), 01032 (+52) |
| Pediatrics (children) | 30 | 44,972 | 1.11 | 0.86 | 137 of 534 | 02762 (-64), 02093 (-63), 01516 (-56) | 01096 (+76), 01259 (+76), 01008 (+69) |
| Women's health / OB-GYN | 60 | 16,874.8 | 0.53 | 0.57 | 286 of 534 | 02071 (-59), 02035 (-58), 01867 (-57) | 01522 (+65), 01340 (+63), 02163 (+58) |
| Mental health & counseling | 30 | 253,801.2 | 7.20 | 0.78 | 165 of 534 | 02561 (-60), 01270 (-46), 02777 (-32) | 02713 (+90), 01097 (+80), 01522 (+69) |
| Dental | 30 | 50,770.2 | 1.65 | 0.82 | 131 of 534 | 02561 (-31), 02188 (-30), 01867 (-29) | 01340 (+67), 01908 (+57), 01096 (+53) |
| Eye care | 30 | 18,505.8 | 0.62 | 0.76 | 130 of 534 | 02725 (-35), 02561 (-34), 01867 (-30) | 01012 (+74), 01096 (+62), 01340 (+51) |
| Chiropractic | 30 | 13,861.4 | 0.63 | 0.62 | 84 of 534 | 02568 (-37), 02557 (-33), 02133 (-25) | 01096 (+59), 01244 (+44), 01259 (+40) |
| Physical & occupational therapy | 30 | 93,624.6 | 2.70 | 0.76 | 159 of 534 | 02093 (-51), 02133 (-43), 02056 (-38) | 01084 (+77), 01032 (+76), 01096 (+70) |
| Orthopedics & sports injury | 60 | 10,262 | 0.39 | 0.63 | 216 of 534 | 01867 (-50), 01803 (-48), 01824 (-38) | 01350 (+66), 01032 (+62), 01966 (+60) |
| Heart / cardiology | 60 | 8,633.8 | 0.24 | 0.65 | 272 of 534 | 01867 (-79), 01803 (-70), 01887 (-65) | 01073 (+65), 01085 (+60), 01077 (+53) |
| Skin / dermatology | 60 | 3,365 | 0.09 | 0.69 | 273 of 534 | 01810 (-82), 01843 (-73), 02561 (-67) | 01966 (+84), 01930 (+73), 02366 (+62) |
| Allergy & immunology | 60 | 1,168.6 | 0.03 | 0.62 | 313 of 534 | 01810 (-81), 02035 (-77), 01754 (-74) | 01008 (+74), 02366 (+74), 02575 (+71) |
| Lung, breathing & sleep | 60 | 3,544.2 | 0.13 | 0.65 | 296 of 534 | 01867 (-54), 01887 (-54), 01742 (-52) | 01084 (+75), 01012 (+73), 01096 (+73) |
| Digestive / gastroenterology | 60 | 4,293.2 | 0.11 | 0.59 | 278 of 534 | 01867 (-77), 02032 (-77), 01810 (-75) | 01096 (+73), 01012 (+72), 01073 (+51) |
| Kidney / nephrology | 60 | 2,855.8 | 0.11 | 0.62 | 285 of 534 | 01867 (-45), 01745 (-40), 01803 (-39) | 02163 (+68), 01077 (+56), 02134 (+51) |
| Diabetes & hormones | 60 | 2,603.8 | 0.06 | 0.61 | 288 of 534 | 01876 (-85), 01845 (-82), 01810 (-80) | 01084 (+73), 01012 (+69), 01032 (+66) |
| Cancer care / oncology | 90 | 5,436 | 0.15 | 0.50 | 353 of 534 | 01742 (-82), 01867 (-82), 02359 (-82) | 01096 (+79), 02671 (+67), 02639 (+66) |
| Arthritis / rheumatology | 60 | 1,340.6 | 0.04 | 0.50 | 368 of 534 | 01754 (-81), 01749 (-80), 01772 (-80) | 02539 (+93), 02557 (+93), 02568 (+93) |
| Brain & nerves / neurology | 60 | 7,321.8 | 0.22 | 0.71 | 247 of 534 | 01907 (-78), 01810 (-76), 01940 (-73) | 01235 (+44), 01096 (+42), 01901 (+42) |
| Ear, nose & throat | 60 | 1,904.8 | 0.07 | 0.61 | 307 of 534 | 01810 (-72), 01867 (-69), 01745 (-65) | 01096 (+82), 01938 (+64), 02543 (+60) |
| Urology | 60 | 2,335.6 | 0.07 | 0.66 | 354 of 534 | 02561 (-68), 02762 (-62), 02038 (-61) | 02575 (+92), 02535 (+79), 02539 (+71) |
| Foot & ankle / podiatry | 60 | 6,187.2 | 0.15 | 0.63 | 152 of 534 | 02048 (-35), 02563 (-33), 02032 (-29) | 01032 (+73), 01440 (+40), 01436 (+39) |
| Pain management | 60 | 2,602.2 | 0.09 | 0.61 | 144 of 534 | 01270 (-38), 01238 (-37), 01229 (-36) | 01966 (+85), 01929 (+70), 01938 (+70) |
| Plastic & reconstructive surgery | 90 | 2,202.6 | 0.07 | 0.53 | 351 of 534 | 02718 (-59), 02324 (-56), 02346 (-56) | 01096 (+85), 02639 (+76), 02641 (+76) |
| Speech & language therapy | 30 | 32,437.4 | 0.90 | 0.78 | 103 of 534 | 02133 (-38), 02461 (-30), 02468 (-30) | 01966 (+79), 01096 (+74), 01938 (+66) |
| Nutrition & dietitian | 30 | 11,410.8 | 0.33 | 0.81 | 142 of 534 | 01270 (-64), 01867 (-40), 01026 (-39) | 01259 (+100), 01258 (+77), 01966 (+68) |
| Acupuncture, massage & naturopathy | 30 | 15,421.8 | 0.52 | 0.84 | 114 of 534 | 02568 (-42), 02575 (-42), 02557 (-41) | 01258 (+86), 01259 (+72), 01340 (+67) |
| Urgent care & emergency | 30 | 12,437.6 | 0.47 | 0.75 | 139 of 534 | 01867 (-37), 02725 (-34), 02777 (-33) | 01350 (+64), 01096 (+63), 01235 (+61) |
| Imaging & lab | 60 | 13,753.6 | 0.49 | 0.66 | 244 of 534 | 01867 (-75), 01803 (-68), 01887 (-61) | 02163 (+57), 01901 (+54), 01096 (+45) |
| Pharmacy | 30 | 51,017.6 | 1.72 | 0.70 | 82 of 534 | 02133 (-32), 02725 (-23), 02657 (-19) | 01084 (+62), 01032 (+60), 01350 (+49) |
| Home health & in-home care | 30 | 15,051.2 | 1.61 | 0.82 | 6 of 534 | 02133 (-15), 01801 (-12), 02186 (-12) | 01522 (+31), 01562 (+23), 01097 (+18) |
| Nursing & assisted living | 60 | 5,972.8 | 0.39 | 0.35 | 156 of 534 | 01026 (-34), 01070 (-32), 01098 (-31) | 01340 (+68), 01259 (+64), 01253 (+62) |
| Medical equipment & supplies | 60 | 8,510.2 | 0.36 | 0.48 | 59 of 534 | 02133 (-23), 01029 (-21), 02766 (-21) | 01096 (+43), 01097 (+38), 01259 (+33) |
| Hearing & audiology | 60 | 4,823.2 | 0.19 | 0.53 | 238 of 534 | 02048 (-43), 01810 (-39), 02571 (-37) | 01096 (+62), 01084 (+59), 01002 (+58) |
| Behavior therapy (ABA) | 30 | 37,436.2 | 2.88 | 0.81 | 131 of 534 | 01460 (-60), 01568 (-52), 01757 (-47) | 01097 (+65), 01938 (+59), 01562 (+56) |
| Care coordination & community health | 30 | 49,067.4 | 1.63 | 0.83 | 125 of 534 | 02561 (-50), 02133 (-32), 01851 (-26) | 01340 (+75), 01096 (+64), 01463 (+64) |
| General surgery | 60 | 10,291.4 | 0.35 | 0.59 | 336 of 534 | 01867 (-57), 01810 (-52), 01803 (-50) | 02163 (+66), 01073 (+64), 01085 (+62) |
| Infectious disease | 90 | 2,006.4 | 0.05 | 0.45 | 340 of 534 | 02061 (-97), 02356 (-96), 02351 (-95) | 01096 (+79), 01073 (+69), 01077 (+63) |
| Genetics & genetic counseling | 90 | 1,182.6 | 0.03 | 0.70 | 261 of 534 | 01810 (-100), 01832 (-100), 01833 (-100) | 01077 (+52), 01036 (+35), 01081 (+32) |
| Hospice & palliative care | 60 | 996.8 | 0.09 | 0.54 | 142 of 534 | 01460 (-33), 02568 (-30), 01867 (-28) | 01077 (+42), 02713 (+36), 01343 (+35) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Massachusetts in households with no vehicle: about 666,841 of 5,663,545 (11.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 18 of 534 | 02163 (+54), 02113 (+29), 01103 (+25) | 1.00 |
| Pediatrics (children) | 0.99 | 5 of 534 | 01103 (+35), 01901 (+30), 02163 (+27) | 1.00 |
| Women's health / OB-GYN | 0.96 | 27 of 534 | 02163 (+54), 02114 (+43), 02113 (+42) | 0.99 |
| Mental health & counseling | 0.98 | 6 of 534 | 02163 (+42), 01901 (+30), 02113 (+24) | 0.99 |
| Dental | 0.98 | 10 of 534 | 02163 (+51), 01103 (+28), 01901 (+27) | 1.00 |
| Eye care | 0.98 | 19 of 534 | 02163 (+51), 02115 (+44), 02215 (+39) | 1.00 |
| Chiropractic | 0.93 | 10 of 534 | 02115 (+23), 02114 (+22), 02163 (+21) | 1.00 |
| Physical & occupational therapy | 0.96 | 22 of 534 | 02163 (+44), 02114 (+41), 02115 (+40) | 1.00 |
| Orthopedics & sports injury | 0.96 | 20 of 534 | 02163 (+43), 02114 (+36), 02113 (+34) | 0.99 |
| Heart / cardiology | 0.98 | 18 of 534 | 02163 (+52), 01901 (+36), 02113 (+33) | 1.00 |
| Skin / dermatology | 0.99 | 6 of 534 | 02163 (+45), 01901 (+43), 01840 (+20) | 1.00 |
| Allergy & immunology | 0.98 | 10 of 534 | 02163 (+54), 01901 (+40), 02113 (+26) | 0.99 |
| Lung, breathing & sleep | 0.98 | 18 of 534 | 02163 (+45), 02113 (+30), 01901 (+27) | 1.00 |
| Digestive / gastroenterology | 0.99 | 15 of 534 | 02163 (+49), 01901 (+38), 02113 (+30) | 1.00 |
| Kidney / nephrology | 0.98 | 11 of 534 | 02163 (+38), 02113 (+25), 01901 (+23) | 1.00 |
| Diabetes & hormones | 0.99 | 5 of 534 | 01901 (+32), 02163 (+32), 01103 (+22) | 1.00 |
| Cancer care / oncology | 0.98 | 5 of 534 | 01901 (+39), 02163 (+27), 01840 (+21) | 0.99 |
| Arthritis / rheumatology | 0.98 | 8 of 534 | 02163 (+42), 01901 (+41), 01103 (+27) | 0.99 |
| Brain & nerves / neurology | 0.99 | 3 of 534 | 01901 (+42), 02163 (+42), 01840 (+19) | 1.00 |
| Ear, nose & throat | 0.98 | 22 of 534 | 02163 (+56), 01901 (+36), 02134 (+29) | 1.00 |
| Urology | 0.96 | 20 of 534 | 02163 (+52), 02115 (+36), 02113 (+34) | 0.99 |
| Foot & ankle / podiatry | 0.92 | 17 of 534 | 02163 (+34), 02114 (+31), 02115 (+31) | 1.00 |
| Pain management | 0.96 | 8 of 534 | 02163 (+26), 02113 (+21), 02114 (+21) | 1.00 |
| Plastic & reconstructive surgery | 0.94 | 17 of 534 | 02163 (+33), 02114 (+29), 02113 (+28) | 0.99 |
| Speech & language therapy | 0.96 | 17 of 534 | 02163 (+36), 02115 (+32), 02114 (+30) | 1.00 |
| Nutrition & dietitian | 0.99 | 6 of 534 | 02163 (+42), 01901 (+27), 01103 (+25) | 1.00 |
| Acupuncture, massage & naturopathy | 0.98 | 18 of 534 | 02163 (+41), 02115 (+40), 02114 (+36) | 1.00 |
| Urgent care & emergency | 0.99 | 22 of 534 | 02163 (+50), 02114 (+39), 02113 (+36) | 1.00 |
| Imaging & lab | 0.98 | 22 of 534 | 02163 (+53), 01901 (+33), 02113 (+33) | 1.00 |
| Pharmacy | 0.96 | 17 of 534 | 02163 (+33), 02114 (+32), 02115 (+31) | 0.99 |
| Home health & in-home care | 0.97 | 0 of 534 | 02115 (+14), 02114 (+13), 02163 (+13) | 1.00 |
| Nursing & assisted living | 0.86 | 13 of 534 | 02114 (+24), 02115 (+24), 02163 (+24) | 0.99 |
| Medical equipment & supplies | 0.89 | 8 of 534 | 02163 (+20), 02114 (+19), 02115 (+18) | 1.00 |
| Hearing & audiology | 0.91 | 18 of 534 | 02163 (+39), 02115 (+31), 02114 (+28) | 0.99 |
| Behavior therapy (ABA) | 0.98 | 13 of 534 | 01103 (+26), 02115 (+24), 02163 (+24) | 1.00 |
| Care coordination & community health | 0.98 | 21 of 534 | 02114 (+45), 02115 (+45), 02163 (+43) | 1.00 |
| General surgery | 0.98 | 16 of 534 | 02163 (+41), 02113 (+27), 01901 (+26) | 0.99 |
| Infectious disease | 0.98 | 3 of 534 | 01901 (+40), 02163 (+27), 01840 (+22) | 0.99 |
| Genetics & genetic counseling | 0.99 | 2 of 534 | 01901 (+27), 01840 (+16), 01608 (+14) | 0.99 |
| Hospice & palliative care | 0.95 | 4 of 534 | 02163 (+21), 02113 (+16), 02115 (+16) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 30 of 533 | 50,172 (0.9%) | 4/197 | 25/327 | 1/9 |  |  |
| Women's health / OB-GYN | 016 | 0 of 533 | 0 (0.0%) | 0/197 | 0/327 | 0/9 |  |  |
| Mental health & counseling: Psychiatry | 029 | 2 of 533 | 1,435 (0.0%) | 0/197 | 2/327 | 0/9 |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 533 | 1,020 (0.0%) | 0/197 | 1/327 | 0/9 |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 533 | 0 (0.0%) | 0/197 | 0/327 | 0/9 |  |  |
| Eye care | 023 | 2 of 533 | 566 (0.0%) | 0/197 | 2/327 | 0/9 |  |  |
| Chiropractic | 010 | 1 of 533 | 1,020 (0.0%) | 0/197 | 1/327 | 0/9 |  |  |
| Physical & occupational therapy | F049 | 0 of 533 | 0 (0.0%) | 0/197 | 0/327 | 0/9 |  |  |
| Orthopedics & sports injury | 025 | 6 of 533 | 5,142 (0.1%) | 0/197 | 6/327 | 0/9 |  |  |
| Heart / cardiology | 008 | 18 of 533 | 36,794 (0.6%) | 3/197 | 12/327 | 3/9 |  |  |
| Skin / dermatology | 011 | 8 of 533 | 51,370 (0.9%) | 5/197 | 3/327 | 0/9 |  |  |
| Allergy & immunology | 007 | 23 of 533 | 37,143 (0.7%) | 1/197 | 17/327 | 5/9 |  |  |
| Lung, breathing & sleep | 030 | 15 of 533 | 48,901 (0.9%) | 5/197 | 7/327 | 3/9 |  |  |
| Digestive / gastroenterology | 014 | 23 of 533 | 80,785 (1.4%) | 5/197 | 12/327 | 6/9 |  |  |
| Kidney / nephrology | 018 | 2 of 533 | 1,171 (0.0%) | 0/197 | 2/327 | 0/9 |  |  |
| Diabetes & hormones | 012 | 4 of 533 | 11,631 (0.2%) | 0/197 | 1/327 | 3/9 |  |  |
| Cancer care / oncology | 021 | 14 of 533 | 39,509 (0.7%) | 1/197 | 5/327 | 8/9 |  |  |
| Arthritis / rheumatology | 031 | 9 of 533 | 26,414 (0.5%) | 2/197 | 4/327 | 3/9 |  |  |
| Brain & nerves / neurology | 019 | 16 of 533 | 38,779 (0.7%) | 4/197 | 9/327 | 3/9 |  |  |
| Ear, nose & throat | 013 | 16 of 533 | 18,572 (0.3%) | 0/197 | 13/327 | 3/9 |  |  |
| Urology | 033 | 23 of 533 | 77,457 (1.4%) | 8/197 | 9/327 | 6/9 |  |  |
| Foot & ankle / podiatry | 028 | 10 of 533 | 29,579 (0.5%) | 1/197 | 6/327 | 3/9 |  |  |
| Plastic & reconstructive surgery | 027 | 5 of 533 | 5,526 (0.1%) | 0/197 | 5/327 | 0/9 |  |  |
| Speech & language therapy | F051 | 0 of 533 | 0 (0.0%) | 0/197 | 0/327 | 0/9 |  |  |
| Imaging & lab | F047 | 8 of 533 | 28,216 (0.5%) | 1/197 | 2/327 | 5/9 |  |  |
| Nursing & assisted living | F046 | 1 of 533 | 1,020 (0.0%) | 0/197 | 1/327 | 0/9 |  |  |
| General surgery | 015 | 10 of 533 | 21,267 (0.4%) | 3/197 | 7/327 | 0/9 |  |  |
| Infectious disease | 017 | 6 of 533 | 12,586 (0.2%) | 0/197 | 3/327 | 3/9 |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 21360 rows (ZIP x specialty) stored in access_e2sfca for MA; market-score now uses drive-time access for these ZIPs.
