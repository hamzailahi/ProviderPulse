# E2SFCA access dry run: Montana

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 694; in Montana: 368
- Drive times: OSRM on OpenStreetMap roads (car profile), 694 x 694 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 74,843.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.38 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.95), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (83802, 83808, 97828, 97842)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83802 | no | 6.12 | 100% | 6.12 | 100% | no |
| 83808 | no | 7.21 | 100% | 7.21 | 100% | no |
| 83874 | no | 6.36 | 100% | 4.72 | 100% | yes (2.08) |
| 97828 | no | 7.26 | 100% | 7.26 | 100% | no |
| 97842 | no | 7.69 | 100% | 7.69 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 9,949.6 | 4.30 | 0.46 | 190 of 368 | 59338 (-33), 59522 (-31), 59043 (-30) | 59728 (+99), 59821 (+86), 59075 (+85) |
| Pediatrics (children) | 30 | 1,600.2 | 1.11 | 0.65 | 93 of 368 | 59223 (-63), 59343 (-61), 59925 (-45) | 59077 (+100), 59319 (+100), 59345 (+100) |
| Women's health / OB-GYN | 60 | 1,172.8 | 0.53 | 0.77 | 115 of 368 | 59743 (-48), 59931 (-43), 59218 (-41) | 59066 (+100), 59936 (+82), 59025 (+77) |
| Mental health & counseling | 30 | 18,381.6 | 7.20 | 0.58 | 164 of 368 | 59343 (-94), 59223 (-65), 59844 (-52) | 59025 (+100), 59728 (+100), 59812 (+98) |
| Dental | 30 | 3,812.6 | 1.65 | 0.57 | 181 of 368 | 59643 (-52), 59043 (-42), 59865 (-41) | 59222 (+100), 59253 (+100), 59276 (+100) |
| Eye care | 30 | 1,544.8 | 0.62 | 0.60 | 157 of 368 | 59840 (-43), 59828 (-38), 59435 (-33) | 59416 (+100), 59456 (+100), 59466 (+100) |
| Chiropractic | 30 | 2,191 | 0.63 | 0.56 | 181 of 368 | 59644 (-64), 59479 (-59), 59068 (-49) | 59222 (+100), 59253 (+100), 59257 (+100) |
| Physical & occupational therapy | 30 | 7,211 | 2.70 | 0.56 | 169 of 368 | 59053 (-74), 59843 (-68), 59446 (-47) | 59728 (+100), 59820 (+98), 59846 (+98) |
| Orthopedics & sports injury | 60 | 1,151.8 | 0.39 | 0.77 | 110 of 368 | 59743 (-100), 59863 (-65), 59032 (-58) | 59066 (+100), 59311 (+96), 59720 (+93) |
| Heart / cardiology | 60 | 423 | 0.24 | 0.79 | 93 of 368 | 59483 (-65), 59487 (-64), 59468 (-57) | 59066 (+100), 59450 (+79), 59936 (+74) |
| Skin / dermatology | 60 | 197.4 | 0.09 | 0.80 | 75 of 368 | 59931 (-61), 59089 (-52), 59218 (-52) | 59066 (+100), 59936 (+83), 59018 (+78) |
| Allergy & immunology | 60 | 38.4 | 0.03 | 0.78 | 36 of 368 | 59632 (-87), 59648 (-60), 59713 (-58) | 59066 (+100), 59636 (+100), 59812 (+91) |
| Lung, breathing & sleep | 60 | 251.4 | 0.13 | 0.77 | 84 of 368 | 59743 (-93), 59218 (-87), 59063 (-52) | 59066 (+100), 59448 (+100), 59025 (+95) |
| Digestive / gastroenterology | 60 | 183.4 | 0.11 | 0.73 | 64 of 368 | 59931 (-47), 59483 (-44), 59487 (-43) | 59066 (+100), 59450 (+86), 59925 (+71) |
| Kidney / nephrology | 60 | 145.4 | 0.11 | 0.75 | 66 of 368 | 59218 (-89), 59863 (-59), 59089 (-44) | 59848 (+96), 59845 (+93), 59066 (+91) |
| Diabetes & hormones | 60 | 104.8 | 0.06 | 0.73 | 70 of 368 | 59212 (-71), 59041 (-47), 59931 (-40) | 59066 (+100), 59450 (+89), 59925 (+67) |
| Cancer care / oncology | 90 | 256.8 | 0.15 | 0.65 | 153 of 368 | 59008 (-82), 59421 (-79), 59014 (-75) | 59243 (+73), 59066 (+67), 59047 (+61) |
| Arthritis / rheumatology | 60 | 60.4 | 0.04 | 0.78 | 71 of 368 | 59016 (-70), 59089 (-69), 59931 (-52) | 59066 (+100), 59762 (+91), 59450 (+88) |
| Brain & nerves / neurology | 60 | 375.6 | 0.22 | 0.81 | 72 of 368 | 59528 (-48), 59483 (-42), 59487 (-42) | 59066 (+100), 59444 (+100), 59450 (+86) |
| Ear, nose & throat | 60 | 144.2 | 0.07 | 0.80 | 71 of 368 | 59632 (-84), 59218 (-72), 59063 (-54) | 59066 (+100), 59025 (+88), 59636 (+87) |
| Urology | 60 | 128.2 | 0.07 | 0.77 | 75 of 368 | 59931 (-74), 59483 (-57), 59487 (-56) | 59066 (+100), 59450 (+82), 59936 (+82) |
| Foot & ankle / podiatry | 60 | 224.2 | 0.15 | 0.76 | 87 of 368 | 59089 (-71), 59016 (-59), 59743 (-39) | 59025 (+86), 59075 (+80), 59713 (+76) |
| Pain management | 60 | 142.4 | 0.09 | 0.79 | 65 of 368 | 59632 (-69), 59931 (-56), 59743 (-46) | 59010 (+100), 59025 (+95), 59936 (+83) |
| Plastic & reconstructive surgery | 90 | 116.8 | 0.07 | 0.71 | 100 of 368 | 59752 (-88), 59760 (-69), 59931 (-62) | 59713 (+67), 59812 (+54), 59728 (+49) |
| Speech & language therapy | 30 | 1,776.8 | 0.90 | 0.64 | 133 of 368 | 59845 (-74), 59743 (-71), 59065 (-61) | 59077 (+100), 59746 (+99), 59025 (+84) |
| Nutrition & dietitian | 30 | 985.6 | 0.33 | 0.55 | 166 of 368 | 59845 (-74), 59436 (-62), 59865 (-61) | 59025 (+100), 59050 (+100), 59066 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,297.6 | 0.52 | 0.65 | 165 of 368 | 59520 (-71), 59755 (-47), 59477 (-46) | 59018 (+100), 59027 (+100), 59052 (+100) |
| Urgent care & emergency | 30 | 1,180 | 0.47 | 0.48 | 188 of 368 | 59840 (-40), 59422 (-32), 59036 (-29) | 59003 (+100), 59006 (+100), 59012 (+100) |
| Imaging & lab | 60 | 970.6 | 0.49 | 0.75 | 110 of 368 | 59218 (-100), 59483 (-62), 59632 (-58) | 59066 (+100), 59025 (+87), 59450 (+81) |
| Pharmacy | 30 | 4,270.8 | 1.72 | 0.45 | 204 of 368 | 59432 (-84), 59471 (-62), 59065 (-50) | 59003 (+100), 59050 (+100), 59075 (+100) |
| Home health & in-home care | 30 | 1,476.4 | 1.61 | 0.55 | 74 of 368 | 59529 (-73), 59219 (-62), 59521 (-53) | 59542 (+57), 59253 (+48), 59275 (+47) |
| Nursing & assisted living | 60 | 906.4 | 0.39 | 0.66 | 164 of 368 | 59322 (-100), 59743 (-91), 59032 (-70) | 59067 (+100), 59456 (+100), 59837 (+93) |
| Medical equipment & supplies | 60 | 777 | 0.36 | 0.73 | 120 of 368 | 59089 (-75), 59468 (-61), 59483 (-61) | 59456 (+92), 59025 (+86), 59450 (+78) |
| Hearing & audiology | 60 | 542 | 0.19 | 0.77 | 133 of 368 | 59433 (-72), 59421 (-70), 59632 (-67) | 59066 (+98), 59720 (+94), 59025 (+93) |
| Behavior therapy (ABA) | 30 | 2,002.4 | 2.88 | 0.66 | 20 of 368 | 59711 (-23), 59756 (-10), 59716 (-9) | 59762 (+35), 59858 (+33), 59728 (+29) |
| Care coordination & community health | 30 | 3,638.4 | 1.63 | 0.66 | 56 of 368 | 59830 (-92), 59521 (-79), 59842 (-58) | 59025 (+100), 59529 (+100), 59353 (+86) |
| General surgery | 60 | 798.2 | 0.35 | 0.79 | 111 of 368 | 59241 (-63), 59074 (-46), 59218 (-46) | 59066 (+100), 59762 (+100), 59858 (+92) |
| Infectious disease | 90 | 54.6 | 0.05 | 0.55 | 86 of 368 | 59916 (-64), 59432 (-60), 59427 (-58) | 59066 (+76), 59450 (+72), 59448 (+63) |
| Genetics & genetic counseling | 90 | 63.4 | 0.03 | 0.66 | 63 of 368 | 59421 (-100), 59648 (-100), 59713 (-100) | 59636 (+100), 59831 (+72), 59865 (+71) |
| Hospice & palliative care | 60 | 232.8 | 0.09 | 0.76 | 125 of 368 | 59226 (-100), 59743 (-100), 59632 (-75) | 59010 (+100), 59253 (+100), 59762 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Montana in households with no vehicle: about 40,754 of 850,719 (4.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 1
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 2 of 368 | 59812 (+79), 59636 (+60), 59031 (+11) | 1.00 |
| Pediatrics (children) | 0.99 | 2 of 368 | 59812 (+48), 59636 (+39), 59031 (+7) | 1.00 |
| Women's health / OB-GYN | 0.99 | 3 of 368 | 59812 (+56), 59636 (+46), 59333 (+21) | 0.99 |
| Mental health & counseling | 0.99 | 2 of 368 | 59812 (+98), 59636 (+79), 59855 (+8) | 0.99 |
| Dental | 0.99 | 2 of 368 | 59812 (+70), 59636 (+59), 59855 (+9) | 1.00 |
| Eye care | 0.99 | 2 of 368 | 59812 (+81), 59636 (+62), 59031 (+14) | 0.99 |
| Chiropractic | 0.99 | 2 of 368 | 59812 (+100), 59636 (+99), 59855 (+9) | 0.99 |
| Physical & occupational therapy | 0.99 | 2 of 368 | 59812 (+84), 59636 (+64), 59855 (+8) | 1.00 |
| Orthopedics & sports injury | 0.99 | 2 of 368 | 59636 (+55), 59333 (+19), 59532 (+14) | 1.00 |
| Heart / cardiology | 0.99 | 2 of 368 | 59812 (+59), 59636 (+33), 59915 (+9) | 1.00 |
| Skin / dermatology | 0.99 | 3 of 368 | 59812 (+67), 59636 (+59), 59031 (+17) | 0.99 |
| Allergy & immunology | 0.99 | 2 of 368 | 59636 (+100), 59812 (+91), 59632 (+3) | 0.99 |
| Lung, breathing & sleep | 1.00 | 2 of 368 | 59812 (+44), 59636 (+43), 59201 (+4) | 1.00 |
| Digestive / gastroenterology | 0.99 | 2 of 368 | 59812 (+53), 59636 (+26), 59915 (+4) | 1.00 |
| Kidney / nephrology | 0.99 | 3 of 368 | 59812 (+46), 59031 (+15), 59636 (+15) | 1.00 |
| Diabetes & hormones | 0.99 | 3 of 368 | 59812 (+31), 59333 (+22), 59532 (+18) | 1.00 |
| Cancer care / oncology | 1.00 | 3 of 368 | 59636 (+35), 59812 (+24), 59532 (+15) | 1.00 |
| Arthritis / rheumatology | 0.99 | 2 of 368 | 59636 (+58), 59812 (+37), 59031 (+5) | 0.99 |
| Brain & nerves / neurology | 1.00 | 2 of 368 | 59636 (+59), 59812 (+48), 59532 (+6) | 1.00 |
| Ear, nose & throat | 1.00 | 2 of 368 | 59636 (+87), 59812 (+34), 59915 (+10) | 1.00 |
| Urology | 0.99 | 2 of 368 | 59812 (+64), 59636 (+49), 59915 (+6) | 0.99 |
| Foot & ankle / podiatry | 1.00 | 3 of 368 | 59812 (+40), 59636 (+38), 59031 (+20) | 1.00 |
| Pain management | 0.99 | 2 of 368 | 59636 (+79), 59812 (+36), 59031 (+6) | 0.99 |
| Plastic & reconstructive surgery | 1.00 | 2 of 368 | 59812 (+44), 59636 (+30), 59915 (+14) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 368 | 59812 (+82), 59636 (+42), 59915 (+6) | 1.00 |
| Nutrition & dietitian | 0.99 | 3 of 368 | 59812 (+100), 59636 (+67), 59031 (+19) | 0.99 |
| Acupuncture, massage & naturopathy | 0.98 | 2 of 368 | 59812 (+100), 59636 (+82), 59855 (+14) | 0.99 |
| Urgent care & emergency | 0.99 | 2 of 368 | 59636 (+65), 59812 (+57), 59532 (+8) | 1.00 |
| Imaging & lab | 0.99 | 2 of 368 | 59636 (+62), 59812 (+43), 59532 (+10) | 0.99 |
| Pharmacy | 0.99 | 2 of 368 | 59636 (+81), 59812 (+66), 59855 (+13) | 1.00 |
| Home health & in-home care | 0.98 | 2 of 368 | 59812 (+28), 59636 (+19), 59031 (+2) | 0.99 |
| Nursing & assisted living | 0.99 | 4 of 368 | 59636 (+54), 59812 (+33), 59532 (+18) | 1.00 |
| Medical equipment & supplies | 0.99 | 3 of 368 | 59636 (+69), 59812 (+39), 59333 (+24) | 0.99 |
| Hearing & audiology | 0.99 | 4 of 368 | 59636 (+80), 59812 (+42), 59333 (+21) | 1.00 |
| Behavior therapy (ABA) | 0.98 | 1 of 368 | 59636 (+16), 59812 (+11), 59414 (+1) | 0.98 |
| Care coordination & community health | 1.00 | 2 of 368 | 59812 (+27), 59636 (+18), 59855 (+5) | 1.00 |
| General surgery | 1.00 | 4 of 368 | 59812 (+54), 59636 (+35), 59333 (+24) | 1.00 |
| Infectious disease | 1.00 | 1 of 368 | 59812 (+20), 59636 (+8), 59031 (+6) | 1.00 |
| Genetics & genetic counseling | 0.99 | 3 of 368 | 59636 (+100), 59812 (+28), 59915 (+15) | 0.99 |
| Hospice & palliative care | 0.99 | 3 of 368 | 59636 (+76), 59812 (+45), 59333 (+16) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 36 of 368 | 8,858 (1.0%) |  |  | 14/82 | 1/23 | 21/263 |
| Women's health / OB-GYN | 016 | 13 of 368 | 3,257 (0.4%) |  |  | 2/82 | 0/23 | 11/263 |
| Mental health & counseling: Psychiatry | 029 | 46 of 368 | 19,093 (2.2%) |  |  | 11/82 | 0/23 | 35/263 |
| Mental health & counseling: Clinical Psychology | 036 | 13 of 368 | 7,056 (0.8%) |  |  | 9/82 | 0/23 | 4/263 |
| Mental health & counseling: Clinical Social Work | 037 | 16 of 368 | 3,541 (0.4%) |  |  | 5/82 | 0/23 | 11/263 |
| Eye care | 023 | 33 of 368 | 10,029 (1.2%) |  |  | 10/82 | 0/23 | 23/263 |
| Chiropractic | 010 | 10 of 368 | 2,004 (0.2%) |  |  | 1/82 | 0/23 | 9/263 |
| Physical & occupational therapy | F049 | 7 of 368 | 982 (0.1%) |  |  | 1/82 | 0/23 | 6/263 |
| Orthopedics & sports injury | 025 | 76 of 368 | 36,111 (4.2%) |  |  | 11/82 | 0/23 | 65/263 |
| Heart / cardiology | 008 | 124 of 368 | 90,847 (10.7%) |  |  | 13/82 | 0/23 | 111/263 |
| Skin / dermatology | 011 | 108 of 368 | 63,443 (7.5%) |  |  | 11/82 | 1/23 | 96/263 |
| Allergy & immunology | 007 | 68 of 368 | 25,441 (3.0%) |  |  | 9/82 | 5/23 | 54/263 |
| Lung, breathing & sleep | 030 | 42 of 368 | 17,382 (2.0%) |  |  | 10/82 | 0/23 | 32/263 |
| Digestive / gastroenterology | 014 | 122 of 368 | 64,955 (7.6%) |  |  | 11/82 | 4/23 | 107/263 |
| Kidney / nephrology | 018 | 44 of 368 | 11,471 (1.3%) |  |  | 4/82 | 0/23 | 40/263 |
| Diabetes & hormones | 012 | 20 of 368 | 9,665 (1.1%) |  |  | 2/82 | 1/23 | 17/263 |
| Cancer care / oncology | 021 | 83 of 368 | 45,989 (5.4%) |  |  | 10/82 | 0/23 | 73/263 |
| Arthritis / rheumatology | 031 | 90 of 368 | 54,481 (6.4%) |  |  | 0/82 | 1/23 | 89/263 |
| Brain & nerves / neurology | 019 | 110 of 368 | 77,629 (9.1%) |  |  | 11/82 | 0/23 | 99/263 |
| Ear, nose & throat | 013 | 88 of 368 | 38,631 (4.5%) |  |  | 4/82 | 2/23 | 82/263 |
| Urology | 033 | 114 of 368 | 76,516 (9.0%) |  |  | 11/82 | 0/23 | 103/263 |
| Foot & ankle / podiatry | 028 | 56 of 368 | 24,404 (2.9%) |  |  | 10/82 | 0/23 | 46/263 |
| Plastic & reconstructive surgery | 027 | 83 of 368 | 47,658 (5.6%) |  |  | 1/82 | 0/23 | 82/263 |
| Speech & language therapy | F051 | 29 of 368 | 9,332 (1.1%) |  |  | 1/82 | 0/23 | 28/263 |
| Imaging & lab | F047 | 23 of 368 | 5,262 (0.6%) |  |  | 3/82 | 0/23 | 20/263 |
| Nursing & assisted living | F046 | 13 of 368 | 1,354 (0.2%) |  |  | 1/82 | 0/23 | 12/263 |
| General surgery | 015 | 32 of 368 | 11,533 (1.4%) |  |  | 9/82 | 0/23 | 23/263 |
| Infectious disease | 017 | 90 of 368 | 51,696 (6.1%) |  |  | 1/82 | 4/23 | 85/263 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 14720 rows (ZIP x specialty) stored in access_e2sfca for MT; market-score now uses drive-time access for these ZIPs.
