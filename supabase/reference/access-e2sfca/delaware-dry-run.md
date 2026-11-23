# E2SFCA access dry run: Delaware

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,391; in Delaware: 66
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,391 x 1,391 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 611,383.399; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.03 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.58), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 4; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (20625, 21627, 21669, 22520, 23181)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 11697 | no | none | 0% | 2.44 | 100% | yes (1.74) |
| 17517 | no | 9.34 | 100% | 2.36 | 100% | yes (1.07) |
| 20625 | no | none | 0% | none | 0% | no |
| 21627 | no | 9.45 | 100% | 9.45 | 100% | no |
| 21669 | no | 13.40 | 100% | 13.40 | 100% | no |
| 22520 | no | 2.78 | 42% | 2.78 | 42% | no |
| 23181 | no | none | 0% | none | 0% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 75,230.599 | 4.30 | 0.62 | 11 of 66 | 19956 (-24), 19803 (-16), 19951 (-16) | 19938 (+38), 19964 (+29), 19706 (+21) |
| Pediatrics (children) | 30 | 22,884 | 1.11 | 0.74 | 15 of 66 | 19951 (-22), 19943 (-21), 19945 (-20) | 19964 (+64), 19731 (+49), 19953 (+34) |
| Women's health / OB-GYN | 60 | 10,643.2 | 0.53 | 0.22 | 44 of 66 | 19933 (-42), 19945 (-37), 19973 (-37) | 19953 (+36), 19980 (+36), 19938 (+31) |
| Mental health & counseling | 30 | 137,373.4 | 7.20 | 0.74 | 6 of 66 | 19956 (-20), 19702 (-13), 19803 (-13) | 19964 (+36), 19938 (+29), 19953 (+20) |
| Dental | 30 | 27,109.2 | 1.65 | 0.87 | 3 of 66 | 19956 (-18), 19952 (-14), 19803 (-11) | 19938 (+20), 19964 (+20), 19734 (+11) |
| Eye care | 30 | 10,573.6 | 0.62 | 0.69 | 7 of 66 | 19956 (-19), 19804 (-14), 19803 (-11) | 19964 (+37), 19938 (+27), 19731 (+19) |
| Chiropractic | 30 | 8,631.4 | 0.63 | 0.71 | 6 of 66 | 19803 (-17), 19943 (-13), 19710 (-12) | 19964 (+43), 19731 (+20), 19938 (+20) |
| Physical & occupational therapy | 30 | 55,422.4 | 2.70 | 0.75 | 18 of 66 | 19803 (-34), 19956 (-24), 19710 (-22) | 19964 (+46), 19938 (+28), 19731 (+26) |
| Orthopedics & sports injury | 60 | 6,733.4 | 0.39 | 0.30 | 32 of 66 | 19933 (-29), 19956 (-28), 19945 (-26) | 19964 (+41), 19953 (+35), 19980 (+32) |
| Heart / cardiology | 60 | 5,345.6 | 0.24 | -0.17 | 47 of 66 | 19933 (-52), 19973 (-46), 19952 (-42) | 19964 (+64), 19953 (+47), 19980 (+38) |
| Skin / dermatology | 60 | 1,775.6 | 0.09 | 0.66 | 21 of 66 | 19973 (-46), 19933 (-44), 19956 (-44) | 19944 (+45), 19975 (+33), 19706 (+21) |
| Allergy & immunology | 60 | 712.4 | 0.03 | 0.60 | 49 of 66 | 19730 (-40), 19709 (-39), 19950 (-36) | 19943 (+57), 19953 (+44), 19980 (+42) |
| Lung, breathing & sleep | 60 | 2,366 | 0.13 | 0.10 | 39 of 66 | 19945 (-39), 19956 (-39), 19939 (-34) | 19706 (+36), 19953 (+34), 19964 (+33) |
| Digestive / gastroenterology | 60 | 2,603.2 | 0.11 | 0.19 | 44 of 66 | 19945 (-72), 19939 (-65), 19967 (-55) | 19953 (+46), 19931 (+38), 19944 (+37) |
| Kidney / nephrology | 60 | 2,129.2 | 0.11 | -0.02 | 47 of 66 | 19975 (-40), 19945 (-36), 19943 (-35) | 19964 (+60), 19953 (+43), 19938 (+37) |
| Diabetes & hormones | 60 | 1,328.8 | 0.06 | -0.02 | 33 of 66 | 19933 (-47), 19973 (-47), 19956 (-41) | 19953 (+44), 19980 (+39), 19938 (+37) |
| Cancer care / oncology | 90 | 3,177.6 | 0.15 | 0.08 | 44 of 66 | 19945 (-45), 19730 (-43), 19939 (-43) | 19953 (+38), 19938 (+34), 19955 (+33) |
| Arthritis / rheumatology | 60 | 840.6 | 0.04 | 0.03 | 44 of 66 | 19952 (-77), 19941 (-70), 19973 (-66) | 19964 (+66), 19980 (+62), 19953 (+61) |
| Brain & nerves / neurology | 60 | 3,929.6 | 0.22 | 0.04 | 34 of 66 | 19933 (-32), 19945 (-28), 19973 (-27) | 19964 (+34), 19953 (+31), 19707 (+29) |
| Ear, nose & throat | 60 | 1,163.6 | 0.07 | 0.73 | 26 of 66 | 19975 (-33), 19709 (-28), 19730 (-28) | 19707 (+45), 19736 (+39), 19808 (+33) |
| Urology | 60 | 1,441.6 | 0.07 | 0.03 | 37 of 66 | 19945 (-45), 19943 (-44), 19939 (-40) | 19964 (+73), 19953 (+43), 19706 (+32) |
| Foot & ankle / podiatry | 60 | 4,129.4 | 0.15 | 0.55 | 24 of 66 | 19945 (-43), 19939 (-36), 19709 (-35) | 19944 (+26), 19736 (+20), 19707 (+19) |
| Pain management | 60 | 1,833.4 | 0.09 | -0.14 | 46 of 66 | 19956 (-70), 19931 (-54), 19945 (-48) | 19964 (+55), 19706 (+37), 19980 (+35) |
| Plastic & reconstructive surgery | 90 | 1,151.6 | 0.07 | 0.28 | 52 of 66 | 19952 (-37), 19933 (-35), 19730 (-34) | 19964 (+51), 19711 (+37), 19706 (+33) |
| Speech & language therapy | 30 | 17,354.8 | 0.90 | 0.71 | 15 of 66 | 19803 (-26), 19952 (-19), 19732 (-17) | 19964 (+53), 19731 (+39), 19709 (+28) |
| Nutrition & dietitian | 30 | 6,433.6 | 0.33 | 0.85 | 16 of 66 | 19956 (-30), 19803 (-25), 19710 (-21) | 19938 (+36), 19953 (+26), 19970 (+24) |
| Acupuncture, massage & naturopathy | 30 | 6,496 | 0.52 | 0.84 | 0 of 66 | 19951 (-10), 19945 (-9), 19958 (-9) | 19964 (+12), 19731 (+10), 19801 (+9) |
| Urgent care & emergency | 30 | 7,982.6 | 0.47 | 0.85 | 11 of 66 | 19952 (-27), 19941 (-20), 19956 (-12) | 19938 (+70), 19953 (+42), 19955 (+39) |
| Imaging & lab | 60 | 8,430.6 | 0.49 | 0.14 | 30 of 66 | 19933 (-44), 19973 (-38), 19709 (-29) | 19953 (+37), 19980 (+37), 19938 (+30) |
| Pharmacy | 30 | 31,177.4 | 1.72 | 0.56 | 5 of 66 | 19945 (-16), 19952 (-14), 19956 (-14) | 19938 (+30), 19731 (+23), 19953 (+20) |
| Home health & in-home care | 30 | 20,208.8 | 1.61 | 0.73 | 2 of 66 | 19951 (-8), 19720 (-6), 19804 (-6) | 19964 (+21), 19938 (+15), 19953 (+12) |
| Nursing & assisted living | 60 | 4,859.8 | 0.39 | 0.25 | 19 of 66 | 19945 (-28), 19933 (-27), 19956 (-25) | 19807 (+22), 19736 (+21), 19707 (+20) |
| Medical equipment & supplies | 60 | 6,211.6 | 0.36 | 0.25 | 31 of 66 | 19933 (-36), 19952 (-28), 19973 (-26) | 19953 (+54), 19980 (+50), 19955 (+44) |
| Hearing & audiology | 60 | 3,000.6 | 0.19 | 0.24 | 33 of 66 | 19973 (-39), 19945 (-28), 19730 (-25) | 19805 (+42), 19736 (+40), 19801 (+39) |
| Behavior therapy (ABA) | 30 | 29,791 | 2.88 | 0.73 | 3 of 66 | 19945 (-22), 19803 (-6), 19943 (-6) | 19944 (+28), 19964 (+16), 19938 (+11) |
| Care coordination & community health | 30 | 22,862.2 | 1.63 | 0.81 | 2 of 66 | 19945 (-16), 19806 (-14), 19732 (-12) | 19944 (+22), 19964 (+13), 19703 (+12) |
| General surgery | 60 | 6,693.8 | 0.35 | -0.07 | 48 of 66 | 19933 (-43), 19730 (-36), 19709 (-35) | 19964 (+53), 19953 (+47), 19980 (+39) |
| Infectious disease | 90 | 1,259.4 | 0.05 | 0.19 | 37 of 66 | 19730 (-45), 19709 (-42), 19731 (-38) | 19964 (+41), 19955 (+38), 19938 (+36) |
| Genetics & genetic counseling | 90 | 782.6 | 0.03 | 0.86 | 9 of 66 | 19730 (-48), 19709 (-45), 19731 (-43) | 19706 (+22), 19946 (+18), 19801 (+14) |
| Hospice & palliative care | 60 | 838.2 | 0.09 | 0.17 | 14 of 66 | 19933 (-33), 19973 (-31), 19709 (-29) | 19706 (+25), 19707 (+20), 19940 (+19) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Delaware in households with no vehicle: about 46,841 of 783,866 (6.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 3
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.95 | 1 of 66 | 19801 (+15), 19980 (+12), 19802 (+8) | 1.00 |
| Pediatrics (children) | 0.99 | 1 of 66 | 19980 (+18), 19964 (+9), 19953 (+2) | 1.00 |
| Women's health / OB-GYN | 0.94 | 0 of 66 | 19980 (+12), 19801 (+11), 19964 (+10) | 1.00 |
| Mental health & counseling | 0.98 | 1 of 66 | 19801 (+15), 19980 (+10), 19802 (+7) | 1.00 |
| Dental | 0.99 | 0 of 66 | 19801 (+12), 19980 (+7), 19802 (+6) | 1.00 |
| Eye care | 0.98 | 0 of 66 | 19801 (+13), 19980 (+9), 19802 (+6) | 1.00 |
| Chiropractic | 0.98 | 0 of 66 | 19801 (+14), 19980 (+9), 19802 (+7) | 1.00 |
| Physical & occupational therapy | 0.99 | 1 of 66 | 19801 (+19), 19980 (+10), 19802 (+9) | 1.00 |
| Orthopedics & sports injury | 0.96 | 0 of 66 | 19801 (+14), 19980 (+10), 19964 (+9) | 1.00 |
| Heart / cardiology | 0.97 | 0 of 66 | 19801 (+12), 19980 (+9), 19964 (+7) | 1.00 |
| Skin / dermatology | 0.98 | 0 of 66 | 19801 (+10), 19964 (+6), 19802 (+5) | 1.00 |
| Allergy & immunology | 0.97 | 0 of 66 | 19801 (+12), 19980 (+7), 19802 (+6) | 1.00 |
| Lung, breathing & sleep | 0.96 | 0 of 66 | 19801 (+11), 19980 (+10), 19964 (+8) | 1.00 |
| Digestive / gastroenterology | 0.99 | 0 of 66 | 19980 (+11), 19801 (+9), 19964 (+7) | 1.00 |
| Kidney / nephrology | 0.94 | 0 of 66 | 19801 (+13), 19980 (+13), 19964 (+11) | 1.00 |
| Diabetes & hormones | 0.95 | 0 of 66 | 19801 (+10), 19980 (+8), 19964 (+7) | 0.99 |
| Cancer care / oncology | 0.97 | 1 of 66 | 19801 (+15), 19980 (+9), 19802 (+8) | 1.00 |
| Arthritis / rheumatology | 0.98 | 0 of 66 | 19980 (+11), 19801 (+10), 19964 (+9) | 1.00 |
| Brain & nerves / neurology | 0.97 | 0 of 66 | 19801 (+9), 19980 (+7), 19802 (+5) | 1.00 |
| Ear, nose & throat | 0.99 | 0 of 66 | 19801 (+10), 19802 (+5), 19980 (+4) | 1.00 |
| Urology | 0.96 | 0 of 66 | 19801 (+9), 19980 (+9), 19964 (+7) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 0 of 66 | 19801 (+12), 19964 (+8), 19980 (+7) | 1.00 |
| Pain management | 0.89 | 0 of 66 | 19964 (+12), 19980 (+12), 19801 (+11) | 0.99 |
| Plastic & reconstructive surgery | 0.97 | 0 of 66 | 19801 (+11), 19980 (+7), 19802 (+5) | 1.00 |
| Speech & language therapy | 0.99 | 1 of 66 | 19801 (+19), 19980 (+11), 19802 (+8) | 1.00 |
| Nutrition & dietitian | 0.99 | 1 of 66 | 19801 (+20), 19980 (+11), 19802 (+9) | 1.00 |
| Acupuncture, massage & naturopathy | 0.98 | 0 of 66 | 19801 (+8), 19802 (+4), 19980 (+4) | 1.00 |
| Urgent care & emergency | 0.98 | 1 of 66 | 19980 (+17), 19801 (+10), 19964 (+8) | 1.00 |
| Imaging & lab | 0.94 | 0 of 66 | 19801 (+9), 19980 (+9), 19964 (+8) | 0.99 |
| Pharmacy | 0.95 | 0 of 66 | 19801 (+13), 19980 (+10), 19802 (+7) | 1.00 |
| Home health & in-home care | 0.97 | 0 of 66 | 19801 (+6), 19980 (+6), 19802 (+3) | 1.00 |
| Nursing & assisted living | 0.93 | 0 of 66 | 19980 (+10), 19964 (+9), 19801 (+8) | 0.99 |
| Medical equipment & supplies | 0.94 | 0 of 66 | 19980 (+12), 19964 (+9), 19801 (+8) | 0.99 |
| Hearing & audiology | 0.94 | 0 of 66 | 19980 (+13), 19801 (+12), 19964 (+9) | 1.00 |
| Behavior therapy (ABA) | 0.97 | 0 of 66 | 19801 (+4), 19980 (+4), 19802 (+2) | 1.00 |
| Care coordination & community health | 0.99 | 0 of 66 | 19801 (+8), 19802 (+4), 19980 (+4) | 1.00 |
| General surgery | 0.95 | 0 of 66 | 19980 (+9), 19801 (+8), 19964 (+8) | 0.99 |
| Infectious disease | 0.98 | 1 of 66 | 19801 (+15), 19802 (+7), 19980 (+6) | 1.00 |
| Genetics & genetic counseling | 0.98 | 0 of 66 | 19801 (+14), 19964 (+3), 19980 (+3) | 1.00 |
| Hospice & palliative care | 0.95 | 0 of 66 | 19801 (+6), 19964 (+6), 19980 (+5) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 1 of 66 | 3,387 (0.4%) |  | 1/66 |  |  |  |
| Women's health / OB-GYN | 016 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Eye care | 023 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Chiropractic | 010 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Physical & occupational therapy | F049 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Orthopedics & sports injury | 025 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Heart / cardiology | 008 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Skin / dermatology | 011 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Allergy & immunology | 007 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Lung, breathing & sleep | 030 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Digestive / gastroenterology | 014 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Kidney / nephrology | 018 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Diabetes & hormones | 012 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Cancer care / oncology | 021 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Arthritis / rheumatology | 031 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Brain & nerves / neurology | 019 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Ear, nose & throat | 013 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Urology | 033 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Foot & ankle / podiatry | 028 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Plastic & reconstructive surgery | 027 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Speech & language therapy | F051 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Imaging & lab | F047 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Nursing & assisted living | F046 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| General surgery | 015 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |
| Infectious disease | 017 | 0 of 66 | 0 (0.0%) |  | 0/66 |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 2640 rows (ZIP x specialty) stored in access_e2sfca for DE; market-score now uses drive-time access for these ZIPs.
