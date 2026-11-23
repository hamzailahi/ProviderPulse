# E2SFCA access dry run: Mississippi

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,527; in Mississippi: 420
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,527 x 1,527 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 265,031.599; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.52 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.31), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (70712, 72328, 72379)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 38767 | yes | 6.39 | 100% | 3.93 | 100% | yes (0.84) |
| 70712 | no | 6.39 | 100% | 6.39 | 100% | no |
| 70749 | no | 8.31 | 100% | 2.22 | 100% | yes (1.69) |
| 72328 | no | 9.02 | 100% | 9.02 | 100% | no |
| 72379 | no | 11.01 | 100% | 11.01 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 38,568.2 | 4.30 | 0.43 | 197 of 420 | 39359 (-44), 38821 (-36), 39705 (-35) | 38860 (+80), 38858 (+71), 38720 (+61) |
| Pediatrics (children) | 30 | 7,981.4 | 1.11 | 0.59 | 102 of 420 | 38821 (-42), 39358 (-34), 39272 (-33) | 39193 (+46), 39056 (+45), 39058 (+42) |
| Women's health / OB-GYN | 60 | 3,502 | 0.53 | 0.73 | 107 of 420 | 39272 (-39), 39352 (-39), 39323 (-37) | 39355 (+54), 39309 (+49), 39363 (+45) |
| Mental health & counseling | 30 | 46,550.4 | 7.20 | 0.52 | 126 of 420 | 39648 (-24), 39635 (-23), 39180 (-22) | 38858 (+93), 38913 (+86), 38949 (+83) |
| Dental | 30 | 10,478.8 | 1.65 | 0.50 | 152 of 420 | 39153 (-54), 39645 (-32), 39705 (-29) | 39193 (+46), 39071 (+44), 38858 (+40) |
| Eye care | 30 | 4,519.6 | 0.62 | 0.56 | 221 of 420 | 39082 (-94), 38921 (-46), 39074 (-40) | 38748 (+68), 38858 (+60), 38726 (+59) |
| Chiropractic | 30 | 3,227.4 | 0.63 | 0.67 | 74 of 420 | 39577 (-38), 39645 (-24), 38821 (-23) | 38726 (+43), 38781 (+31), 38626 (+30) |
| Physical & occupational therapy | 30 | 19,904.4 | 2.70 | 0.48 | 166 of 420 | 39090 (-41), 39577 (-41), 38821 (-35) | 39641 (+100), 39657 (+99), 39662 (+92) |
| Orthopedics & sports injury | 60 | 3,154.2 | 0.39 | 0.73 | 163 of 420 | 39335 (-57), 38606 (-53), 38841 (-48) | 39464 (+69), 38619 (+68), 38774 (+60) |
| Heart / cardiology | 60 | 2,023 | 0.24 | 0.66 | 182 of 420 | 38849 (-67), 39272 (-63), 38824 (-62) | 38725 (+64), 38860 (+62), 38858 (+59) |
| Skin / dermatology | 60 | 666 | 0.09 | 0.76 | 149 of 420 | 39352 (-70), 39332 (-54), 39272 (-53) | 38920 (+69), 38748 (+57), 39572 (+50) |
| Allergy & immunology | 60 | 223.6 | 0.03 | 0.76 | 126 of 420 | 39272 (-77), 39073 (-70), 39170 (-58) | 38626 (+82), 39177 (+67), 39355 (+64) |
| Lung, breathing & sleep | 60 | 1,067.6 | 0.13 | 0.77 | 150 of 420 | 39272 (-73), 39073 (-63), 38849 (-52) | 38860 (+53), 39355 (+53), 38720 (+47) |
| Digestive / gastroenterology | 60 | 800.6 | 0.11 | 0.71 | 167 of 420 | 39323 (-50), 39272 (-49), 39335 (-49) | 38725 (+77), 39117 (+60), 39309 (+60) |
| Kidney / nephrology | 60 | 1,172.4 | 0.11 | 0.63 | 200 of 420 | 38731 (-100), 38748 (-82), 38751 (-77) | 39665 (+75), 39144 (+72), 39088 (+68) |
| Diabetes & hormones | 60 | 414.8 | 0.06 | 0.78 | 105 of 420 | 39272 (-76), 38824 (-71), 39148 (-71) | 38962 (+75), 39355 (+49), 38921 (+48) |
| Cancer care / oncology | 90 | 1,199.8 | 0.15 | 0.36 | 262 of 420 | 38671 (-73), 38672 (-71), 38664 (-70) | 38720 (+73), 38767 (+71), 38639 (+70) |
| Arthritis / rheumatology | 60 | 257 | 0.04 | 0.75 | 98 of 420 | 39272 (-87), 39073 (-86), 39148 (-85) | 39086 (+64), 39455 (+64), 39479 (+62) |
| Brain & nerves / neurology | 60 | 1,480.6 | 0.22 | 0.69 | 85 of 420 | 39272 (-68), 39073 (-60), 38849 (-59) | 38860 (+57), 38858 (+54), 38862 (+50) |
| Ear, nose & throat | 60 | 627 | 0.07 | 0.70 | 188 of 420 | 39272 (-93), 39073 (-83), 39059 (-73) | 38781 (+82), 38726 (+66), 39439 (+64) |
| Urology | 60 | 592.8 | 0.07 | 0.73 | 222 of 420 | 38761 (-81), 39323 (-77), 39335 (-76) | 39665 (+70), 38781 (+68), 39668 (+67) |
| Foot & ankle / podiatry | 60 | 735.2 | 0.15 | 0.70 | 81 of 420 | 39325 (-27), 38606 (-25), 38774 (-25) | 38781 (+39), 38726 (+37), 39355 (+35) |
| Pain management | 60 | 656.2 | 0.09 | 0.75 | 152 of 420 | 39352 (-70), 39272 (-61), 39323 (-59) | 38725 (+74), 39117 (+57), 39455 (+57) |
| Plastic & reconstructive surgery | 90 | 453.4 | 0.07 | 0.63 | 182 of 420 | 39062 (-91), 39059 (-84), 39066 (-83) | 38858 (+72), 38862 (+71), 38860 (+69) |
| Speech & language therapy | 30 | 8,645 | 0.90 | 0.54 | 184 of 420 | 39483 (-48), 38833 (-46), 38846 (-46) | 39641 (+100), 39657 (+86), 39662 (+85) |
| Nutrition & dietitian | 30 | 2,319.4 | 0.33 | 0.66 | 142 of 420 | 39656 (-87), 39095 (-51), 39063 (-40) | 38601 (+67), 39309 (+64), 38913 (+63) |
| Acupuncture, massage & naturopathy | 30 | 1,489.4 | 0.52 | 0.75 | 13 of 420 | 39328 (-22), 39540 (-20), 39532 (-11) | 39046 (+27), 39574 (+25), 38748 (+23) |
| Urgent care & emergency | 30 | 4,218.2 | 0.47 | 0.42 | 254 of 420 | 39631 (-76), 39328 (-75), 39153 (-59) | 38631 (+100), 39108 (+100), 38720 (+90) |
| Imaging & lab | 60 | 4,218 | 0.49 | 0.69 | 144 of 420 | 39272 (-59), 39323 (-56), 39073 (-54) | 39309 (+56), 39363 (+45), 38950 (+43) |
| Pharmacy | 30 | 17,222.4 | 1.72 | 0.37 | 221 of 420 | 38603 (-59), 38821 (-48), 39653 (-37) | 38631 (+58), 38950 (+55), 39177 (+55) |
| Home health & in-home care | 30 | 9,750.4 | 1.61 | 0.60 | 134 of 420 | 39082 (-71), 38748 (-50), 39429 (-44) | 39656 (+76), 38726 (+58), 38781 (+56) |
| Nursing & assisted living | 60 | 3,074 | 0.39 | 0.55 | 128 of 420 | 38768 (-68), 38966 (-57), 38957 (-50) | 38781 (+62), 38769 (+61), 39668 (+59) |
| Medical equipment & supplies | 60 | 4,034.6 | 0.36 | 0.64 | 210 of 420 | 38731 (-100), 38948 (-61), 38751 (-59) | 38920 (+63), 38927 (+63), 39633 (+62) |
| Hearing & audiology | 60 | 1,554.8 | 0.19 | 0.78 | 129 of 420 | 39272 (-51), 39073 (-48), 39170 (-41) | 39355 (+62), 39455 (+57), 39479 (+51) |
| Behavior therapy (ABA) | 30 | 12,129.8 | 2.88 | 0.67 | 16 of 420 | 39402 (-14), 39406 (-10), 38967 (-9) | 39520 (+29), 39573 (+29), 39576 (+29) |
| Care coordination & community health | 30 | 21,546.4 | 1.63 | 0.55 | 96 of 420 | 39540 (-51), 38663 (-40), 39152 (-30) | 38631 (+100), 38676 (+100), 38913 (+98) |
| General surgery | 60 | 2,714.2 | 0.35 | 0.70 | 145 of 420 | 39272 (-69), 39073 (-61), 39170 (-53) | 39355 (+61), 39177 (+46), 38860 (+45) |
| Infectious disease | 90 | 371.8 | 0.05 | 0.48 | 178 of 420 | 39148 (-70), 39272 (-69), 39044 (-66) | 38860 (+55), 38858 (+51), 38863 (+50) |
| Genetics & genetic counseling | 90 | 151.2 | 0.03 | 0.51 | 113 of 420 | 38651 (-54), 38680 (-54), 38671 (-52) | 39193 (+68), 39218 (+67), 39056 (+64) |
| Hospice & palliative care | 60 | 939 | 0.09 | 0.74 | 204 of 420 | 38948 (-74), 38967 (-71), 38849 (-65) | 39088 (+100), 39665 (+75), 39144 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Mississippi in households with no vehicle: about 143,136 of 2,277,684 (6.3%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 12
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 420 | 38781 (+27), 39113 (+14), 39079 (+10) | 1.00 |
| Pediatrics (children) | 1.00 | 1 of 420 | 38781 (+16), 39203 (+14), 39204 (+7) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 420 | 38781 (+15), 39203 (+11), 38644 (+7) | 1.00 |
| Mental health & counseling | 1.00 | 0 of 420 | 39203 (+13), 38781 (+7), 39202 (+7) | 1.00 |
| Dental | 1.00 | 1 of 420 | 38781 (+16), 39203 (+14), 39202 (+9) | 1.00 |
| Eye care | 1.00 | 1 of 420 | 38781 (+19), 39203 (+13), 39213 (+8) | 1.00 |
| Chiropractic | 1.00 | 1 of 420 | 38781 (+17), 38644 (+6), 39203 (+6) | 1.00 |
| Physical & occupational therapy | 1.00 | 2 of 420 | 38781 (+18), 39203 (+16), 39213 (+9) | 1.00 |
| Orthopedics & sports injury | 1.00 | 1 of 420 | 38781 (+25), 39203 (+9), 39213 (+7) | 1.00 |
| Heart / cardiology | 1.00 | 1 of 420 | 38781 (+20), 39203 (+14), 39213 (+9) | 1.00 |
| Skin / dermatology | 1.00 | 0 of 420 | 39203 (+10), 39307 (+8), 38644 (+6) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 420 | 39203 (+17), 39213 (+9), 39204 (+8) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 420 | 39203 (+13), 38781 (+11), 38644 (+7) | 1.00 |
| Digestive / gastroenterology | 1.00 | 0 of 420 | 38781 (+10), 39203 (+10), 38862 (+7) | 1.00 |
| Kidney / nephrology | 0.99 | 3 of 420 | 39113 (+27), 38781 (+24), 38644 (+17) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 420 | 38862 (+10), 38860 (+5), 39046 (+5) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 420 | 38781 (+24), 39079 (+14), 38644 (+13) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 420 | 38862 (+6), 39401 (+5), 39041 (+4) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 420 | 39203 (+17), 39213 (+9), 38781 (+7) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 420 | 38781 (+26), 39079 (+7), 38862 (+6) | 1.00 |
| Urology | 1.00 | 1 of 420 | 38781 (+29), 38644 (+13), 39203 (+12) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 1 of 420 | 38781 (+15), 39203 (+7), 39213 (+4) | 1.00 |
| Pain management | 1.00 | 0 of 420 | 39203 (+12), 39307 (+8), 39213 (+7) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 1 of 420 | 39079 (+22), 39194 (+11), 39179 (+8) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 420 | 38781 (+32), 39203 (+15), 38644 (+11) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 420 | 39203 (+13), 38781 (+9), 39079 (+7) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 420 | 39203 (+5), 39501 (+4), 39202 (+3) | 1.00 |
| Urgent care & emergency | 1.00 | 3 of 420 | 39113 (+33), 38644 (+23), 38781 (+23) | 1.00 |
| Imaging & lab | 0.99 | 1 of 420 | 38781 (+30), 38644 (+14), 39203 (+14) | 1.00 |
| Pharmacy | 1.00 | 2 of 420 | 38781 (+18), 39203 (+16), 38644 (+13) | 1.00 |
| Home health & in-home care | 1.00 | 1 of 420 | 38781 (+33), 39203 (+12), 38644 (+9) | 1.00 |
| Nursing & assisted living | 0.99 | 3 of 420 | 38781 (+54), 38644 (+23), 39079 (+18) | 1.00 |
| Medical equipment & supplies | 0.99 | 4 of 420 | 38781 (+25), 39113 (+24), 38644 (+18) | 1.00 |
| Hearing & audiology | 1.00 | 0 of 420 | 39203 (+14), 38781 (+10), 39213 (+7) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 0 of 420 | 39501 (+5), 39203 (+3), 39202 (+2) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 420 | 38644 (+12), 39203 (+11), 39213 (+7) | 1.00 |
| General surgery | 1.00 | 0 of 420 | 39203 (+14), 38781 (+12), 39213 (+8) | 1.00 |
| Infectious disease | 1.00 | 1 of 420 | 39079 (+15), 39203 (+9), 39194 (+8) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 420 | 39079 (+7), 38641 (+3), 39194 (+3) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 420 | 39203 (+15), 39169 (+10), 38862 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 7 of 420 | 13,026 (0.6%) |  | 4/101 | 1/62 | 2/250 | 0/7 |
| Women's health / OB-GYN | 016 | 1 of 420 | 21 (0.0%) |  | 0/101 | 0/62 | 1/250 | 0/7 |
| Mental health & counseling: Psychiatry | 029 | 6 of 420 | 9,064 (0.4%) |  | 2/101 | 0/62 | 4/250 | 0/7 |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 420 | 403 (0.0%) |  | 0/101 | 0/62 | 1/250 | 0/7 |
| Mental health & counseling: Clinical Social Work | 037 | 2 of 420 | 3,315 (0.1%) |  | 2/101 | 0/62 | 0/250 | 0/7 |
| Eye care | 023 | 3 of 420 | 5,962 (0.3%) |  | 3/101 | 0/62 | 0/250 | 0/7 |
| Chiropractic | 010 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| Physical & occupational therapy | F049 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| Orthopedics & sports injury | 025 | 5 of 420 | 7,433 (0.3%) |  | 4/101 | 0/62 | 1/250 | 0/7 |
| Heart / cardiology | 008 | 8 of 420 | 22,736 (1.0%) |  | 5/101 | 2/62 | 1/250 | 0/7 |
| Skin / dermatology | 011 | 15 of 420 | 34,293 (1.5%) |  | 1/101 | 1/62 | 13/250 | 0/7 |
| Allergy & immunology | 007 | 28 of 420 | 59,216 (2.6%) |  | 3/101 | 2/62 | 23/250 | 0/7 |
| Lung, breathing & sleep | 030 | 3 of 420 | 1,450 (0.1%) |  | 0/101 | 0/62 | 3/250 | 0/7 |
| Digestive / gastroenterology | 014 | 9 of 420 | 37,382 (1.6%) |  | 0/101 | 1/62 | 8/250 | 0/7 |
| Kidney / nephrology | 018 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| Diabetes & hormones | 012 | 1 of 420 | 21 (0.0%) |  | 0/101 | 0/62 | 1/250 | 0/7 |
| Cancer care / oncology | 021 | 9 of 420 | 28,757 (1.3%) |  | 1/101 | 1/62 | 7/250 | 0/7 |
| Arthritis / rheumatology | 031 | 36 of 420 | 78,635 (3.5%) |  | 0/101 | 7/62 | 29/250 | 0/7 |
| Brain & nerves / neurology | 019 | 6 of 420 | 25,530 (1.1%) |  | 1/101 | 1/62 | 4/250 | 0/7 |
| Ear, nose & throat | 013 | 4 of 420 | 5,107 (0.2%) |  | 3/101 | 0/62 | 1/250 | 0/7 |
| Urology | 033 | 14 of 420 | 64,098 (2.8%) |  | 0/101 | 2/62 | 12/250 | 0/7 |
| Foot & ankle / podiatry | 028 | 6 of 420 | 7,452 (0.3%) |  | 2/101 | 0/62 | 4/250 | 0/7 |
| Plastic & reconstructive surgery | 027 | 37 of 420 | 117,575 (5.2%) |  | 0/101 | 10/62 | 27/250 | 0/7 |
| Speech & language therapy | F051 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| Imaging & lab | F047 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| Nursing & assisted living | F046 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |
| General surgery | 015 | 10 of 420 | 18,431 (0.8%) |  | 7/101 | 1/62 | 2/250 | 0/7 |
| Infectious disease | 017 | 0 of 420 | 0 (0.0%) |  | 0/101 | 0/62 | 0/250 | 0/7 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 16800 rows (ZIP x specialty) stored in access_e2sfca for MS; market-score now uses drive-time access for these ZIPs.
