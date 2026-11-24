# E2SFCA access dry run: Missouri

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,366; in Missouri: 1,023
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,366 x 3,366 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 428,105.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.59 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.48), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (62295, 62942, 65024)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 62295 | no | 7.18 | 100% | 7.18 | 100% | no |
| 62942 | no | 7.20 | 100% | 7.20 | 100% | no |
| 65024 | yes | 6.56 | 100% | 6.56 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 52,599.4 | 4.30 | 0.56 | 404 of 1022 | 63131 (-32), 63555 (-32), 65466 (-32) | 63742 (+97), 64430 (+74), 63961 (+72) |
| Pediatrics (children) | 30 | 12,622.2 | 1.11 | 0.78 | 151 of 1022 | 65690 (-92), 65778 (-92), 63625 (-83) | 65287 (+74), 65046 (+72), 63742 (+67) |
| Women's health / OB-GYN | 60 | 5,759.2 | 0.53 | 0.73 | 321 of 1022 | 63548 (-46), 63740 (-46), 63541 (-43) | 64430 (+78), 64102 (+53), 63742 (+52) |
| Mental health & counseling | 30 | 78,565 | 7.20 | 0.71 | 196 of 1022 | 63625 (-86), 64061 (-38), 63851 (-27) | 63742 (+99), 65652 (+74), 65287 (+64) |
| Dental | 30 | 17,998.6 | 1.65 | 0.63 | 349 of 1022 | 65085 (-60), 63638 (-58), 65054 (-55) | 65436 (+98), 63742 (+96), 64430 (+95) |
| Eye care | 30 | 7,744.4 | 0.62 | 0.67 | 381 of 1022 | 65627 (-91), 63966 (-35), 63144 (-29) | 63742 (+100), 64430 (+100), 65652 (+92) |
| Chiropractic | 30 | 11,095.4 | 0.63 | 0.62 | 549 of 1022 | 65774 (-57), 64470 (-55), 63565 (-47) | 64430 (+100), 64642 (+99), 64441 (+97) |
| Physical & occupational therapy | 30 | 38,437.2 | 2.70 | 0.61 | 392 of 1022 | 65236 (-72), 63472 (-50), 65065 (-44) | 63828 (+100), 63742 (+98), 63473 (+89) |
| Orthopedics & sports injury | 60 | 5,244.4 | 0.39 | 0.66 | 416 of 1022 | 63537 (-100), 63541 (-100), 63548 (-100) | 65067 (+92), 65727 (+88), 65077 (+87) |
| Heart / cardiology | 60 | 2,505 | 0.24 | 0.71 | 365 of 1022 | 63740 (-57), 63744 (-52), 63025 (-51) | 64102 (+72), 63627 (+68), 65040 (+67) |
| Skin / dermatology | 60 | 909.4 | 0.09 | 0.71 | 352 of 1022 | 63530 (-77), 63548 (-68), 65262 (-64) | 64430 (+80), 65046 (+75), 65083 (+71) |
| Allergy & immunology | 60 | 325.4 | 0.03 | 0.73 | 367 of 1022 | 63435 (-85), 63530 (-74), 63438 (-65) | 64147 (+79), 63742 (+75), 64098 (+69) |
| Lung, breathing & sleep | 60 | 1,362.2 | 0.13 | 0.74 | 338 of 1022 | 65251 (-72), 65262 (-64), 65256 (-57) | 64430 (+81), 63732 (+79), 65046 (+78) |
| Digestive / gastroenterology | 60 | 1,072.2 | 0.11 | 0.76 | 306 of 1022 | 63025 (-72), 63740 (-68), 63739 (-62) | 64430 (+77), 65046 (+73), 65652 (+73) |
| Kidney / nephrology | 60 | 1,303.4 | 0.11 | 0.67 | 497 of 1022 | 63830 (-78), 63851 (-73), 63826 (-61) | 64102 (+75), 64430 (+73), 63467 (+66) |
| Diabetes & hormones | 60 | 632 | 0.06 | 0.72 | 419 of 1022 | 65669 (-66), 65754 (-65), 65630 (-56) | 65766 (+94), 65727 (+83), 65650 (+82) |
| Cancer care / oncology | 90 | 1,680.6 | 0.15 | 0.64 | 520 of 1022 | 63069 (-57), 63012 (-55), 63016 (-53) | 64102 (+70), 63742 (+68), 63758 (+67) |
| Arthritis / rheumatology | 60 | 358.2 | 0.04 | 0.74 | 402 of 1022 | 65626 (-92), 63548 (-80), 65609 (-70) | 63467 (+100), 64102 (+73), 65076 (+68) |
| Brain & nerves / neurology | 60 | 2,349.2 | 0.22 | 0.73 | 293 of 1022 | 63025 (-58), 63033 (-54), 63138 (-54) | 65046 (+78), 64102 (+75), 65083 (+70) |
| Ear, nose & throat | 60 | 808.8 | 0.07 | 0.72 | 414 of 1022 | 65251 (-87), 63435 (-86), 63438 (-83) | 63467 (+100), 65727 (+77), 65650 (+75) |
| Urology | 60 | 760.2 | 0.07 | 0.70 | 411 of 1022 | 65609 (-89), 65626 (-84), 65760 (-70) | 65040 (+77), 65046 (+76), 65282 (+71) |
| Foot & ankle / podiatry | 60 | 1,373.8 | 0.15 | 0.70 | 332 of 1022 | 63435 (-50), 63841 (-49), 63548 (-48) | 64430 (+78), 63381 (+77), 63350 (+72) |
| Pain management | 60 | 875.4 | 0.09 | 0.69 | 333 of 1022 | 63431 (-100), 63460 (-100), 63530 (-100) | 63879 (+71), 65046 (+70), 64643 (+68) |
| Plastic & reconstructive surgery | 90 | 640 | 0.07 | 0.61 | 533 of 1022 | 63031 (-65), 63025 (-64), 63033 (-63) | 63467 (+100), 64430 (+94), 64147 (+85) |
| Speech & language therapy | 30 | 14,801 | 0.90 | 0.54 | 493 of 1022 | 63654 (-85), 63944 (-64), 64645 (-60) | 63828 (+98), 65076 (+97), 65016 (+91) |
| Nutrition & dietitian | 30 | 4,046 | 0.33 | 0.73 | 345 of 1022 | 65479 (-88), 65580 (-71), 63770 (-62) | 65436 (+100), 63742 (+96), 65287 (+95) |
| Acupuncture, massage & naturopathy | 30 | 1,949 | 0.52 | 0.70 | 104 of 1022 | 65762 (-81), 64842 (-57), 64866 (-54) | 65777 (+51), 65652 (+49), 65788 (+45) |
| Urgent care & emergency | 30 | 5,763.4 | 0.47 | 0.66 | 422 of 1022 | 63620 (-72), 63638 (-53), 65058 (-51) | 63531 (+100), 63543 (+100), 63563 (+100) |
| Imaging & lab | 60 | 5,341 | 0.49 | 0.72 | 352 of 1022 | 63740 (-50), 63025 (-49), 63129 (-49) | 64430 (+79), 65046 (+65), 64459 (+61) |
| Pharmacy | 30 | 22,436.8 | 1.72 | 0.55 | 452 of 1022 | 63732 (-58), 65606 (-50), 63748 (-40) | 63742 (+96), 64430 (+96), 63961 (+86) |
| Home health & in-home care | 30 | 38,870.8 | 1.61 | 0.69 | 143 of 1022 | 64420 (-89), 63623 (-86), 64441 (-69) | 63833 (+100), 63373 (+99), 64496 (+98) |
| Nursing & assisted living | 60 | 6,715.2 | 0.39 | 0.54 | 558 of 1022 | 64445 (-61), 63541 (-60), 63548 (-56) | 63467 (+100), 65061 (+87), 63566 (+81) |
| Medical equipment & supplies | 60 | 4,737 | 0.36 | 0.61 | 386 of 1022 | 63783 (-67), 63740 (-66), 63541 (-60) | 63847 (+75), 64765 (+74), 65282 (+70) |
| Hearing & audiology | 60 | 2,843.8 | 0.19 | 0.67 | 531 of 1022 | 63530 (-100), 63548 (-97), 63541 (-89) | 65282 (+89), 64765 (+85), 63746 (+73) |
| Behavior therapy (ABA) | 30 | 22,134.8 | 2.88 | 0.79 | 114 of 1022 | 63966 (-45), 64120 (-39), 63954 (-38) | 63675 (+95), 63665 (+93), 63950 (+93) |
| Care coordination & community health | 30 | 25,674.2 | 1.63 | 0.73 | 121 of 1022 | 64420 (-89), 63625 (-88), 64441 (-78) | 63665 (+100), 63742 (+99), 63950 (+98) |
| General surgery | 60 | 3,869.6 | 0.35 | 0.67 | 400 of 1022 | 63548 (-49), 63541 (-47), 63033 (-46) | 63467 (+74), 64672 (+61), 64765 (+60) |
| Infectious disease | 90 | 495 | 0.05 | 0.65 | 321 of 1022 | 63051 (-80), 63012 (-77), 63025 (-77) | 64633 (+97), 64430 (+93), 63742 (+89) |
| Genetics & genetic counseling | 90 | 285.2 | 0.03 | 0.54 | 440 of 1022 | 65745 (-83), 64856 (-79), 64831 (-72) | 65606 (+76), 65046 (+75), 64020 (+70) |
| Hospice & palliative care | 60 | 986.8 | 0.09 | 0.66 | 513 of 1022 | 64772 (-64), 64752 (-62), 64771 (-61) | 64463 (+74), 64441 (+73), 64147 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Missouri in households with no vehicle: about 310,568 of 4,776,085 (6.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 4
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 11 of 1022 | 64102 (+55), 64147 (+44), 63467 (+31) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 1022 | 64102 (+53), 64147 (+44), 63467 (+19) | 1.00 |
| Women's health / OB-GYN | 0.99 | 10 of 1022 | 64102 (+46), 64147 (+44), 63106 (+31) | 1.00 |
| Mental health & counseling | 0.99 | 7 of 1022 | 64102 (+39), 64147 (+38), 63106 (+24) | 1.00 |
| Dental | 0.99 | 6 of 1022 | 64147 (+50), 64102 (+48), 63467 (+30) | 1.00 |
| Eye care | 0.99 | 7 of 1022 | 64147 (+48), 63467 (+44), 64102 (+40) | 1.00 |
| Chiropractic | 0.99 | 9 of 1022 | 64147 (+66), 64102 (+62), 63467 (+35) | 1.00 |
| Physical & occupational therapy | 0.99 | 10 of 1022 | 64147 (+58), 64102 (+49), 63106 (+28) | 1.00 |
| Orthopedics & sports injury | 0.99 | 9 of 1022 | 63467 (+48), 64102 (+43), 64147 (+42) | 1.00 |
| Heart / cardiology | 0.99 | 12 of 1022 | 64102 (+47), 64147 (+46), 63106 (+35) | 1.00 |
| Skin / dermatology | 0.99 | 9 of 1022 | 64147 (+37), 63467 (+36), 64102 (+36) | 1.00 |
| Allergy & immunology | 1.00 | 14 of 1022 | 64147 (+50), 63467 (+49), 64102 (+47) | 1.00 |
| Lung, breathing & sleep | 0.99 | 9 of 1022 | 64102 (+51), 64147 (+47), 63106 (+27) | 1.00 |
| Digestive / gastroenterology | 1.00 | 11 of 1022 | 64102 (+42), 64147 (+42), 63106 (+36) | 1.00 |
| Kidney / nephrology | 0.99 | 13 of 1022 | 64147 (+45), 64102 (+42), 63106 (+38) | 1.00 |
| Diabetes & hormones | 1.00 | 11 of 1022 | 64102 (+45), 64147 (+45), 63106 (+35) | 1.00 |
| Cancer care / oncology | 0.99 | 7 of 1022 | 64147 (+43), 64102 (+37), 63467 (+31) | 1.00 |
| Arthritis / rheumatology | 1.00 | 12 of 1022 | 63467 (+46), 64147 (+44), 64102 (+40) | 1.00 |
| Brain & nerves / neurology | 1.00 | 10 of 1022 | 64102 (+43), 64147 (+42), 63106 (+35) | 1.00 |
| Ear, nose & throat | 0.99 | 12 of 1022 | 63467 (+69), 64102 (+50), 64147 (+50) | 1.00 |
| Urology | 0.99 | 6 of 1022 | 64102 (+39), 64147 (+37), 63467 (+29) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 10 of 1022 | 63467 (+41), 64102 (+35), 64147 (+33) | 1.00 |
| Pain management | 1.00 | 7 of 1022 | 64102 (+39), 64147 (+39), 63106 (+27) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 7 of 1022 | 64147 (+42), 64102 (+36), 63467 (+35) | 1.00 |
| Speech & language therapy | 0.99 | 13 of 1022 | 64147 (+59), 65468 (+57), 64102 (+52) | 1.00 |
| Nutrition & dietitian | 1.00 | 10 of 1022 | 64102 (+60), 64147 (+44), 63106 (+33) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 2 of 1022 | 64147 (+20), 64102 (+16), 63106 (+7) | 1.00 |
| Urgent care & emergency | 0.99 | 10 of 1022 | 64102 (+64), 64147 (+46), 63467 (+33) | 1.00 |
| Imaging & lab | 0.99 | 11 of 1022 | 64147 (+42), 64102 (+41), 63106 (+37) | 1.00 |
| Pharmacy | 0.99 | 10 of 1022 | 64102 (+51), 64147 (+46), 63847 (+28) | 1.00 |
| Home health & in-home care | 1.00 | 5 of 1022 | 63847 (+39), 65439 (+27), 64102 (+26) | 1.00 |
| Nursing & assisted living | 0.97 | 16 of 1022 | 63847 (+65), 63467 (+64), 64765 (+57) | 1.00 |
| Medical equipment & supplies | 0.98 | 11 of 1022 | 63847 (+54), 63467 (+44), 64147 (+39) | 1.00 |
| Hearing & audiology | 0.99 | 14 of 1022 | 64147 (+52), 63467 (+51), 64102 (+50) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 4 of 1022 | 63847 (+65), 64102 (+44), 64147 (+31) | 1.00 |
| Care coordination & community health | 1.00 | 6 of 1022 | 63847 (+42), 64102 (+31), 64147 (+20) | 1.00 |
| General surgery | 0.99 | 11 of 1022 | 64102 (+38), 64147 (+38), 63467 (+36) | 1.00 |
| Infectious disease | 1.00 | 9 of 1022 | 64147 (+44), 64102 (+34), 63106 (+32) | 1.00 |
| Genetics & genetic counseling | 1.00 | 4 of 1022 | 64147 (+33), 64102 (+19), 63106 (+16) | 1.00 |
| Hospice & palliative care | 0.99 | 11 of 1022 | 64147 (+58), 64102 (+54), 63847 (+32) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 42 of 1023 | 40,649 (0.9%) | 0/42 | 37/271 | 5/153 | 0/504 | 0/53 |
| Women's health / OB-GYN | 016 | 1 of 1023 | 87 (0.0%) | 0/42 | 1/271 | 0/153 | 0/504 | 0/53 |
| Mental health & counseling: Psychiatry | 029 | 9 of 1023 | 3,747 (0.1%) | 0/42 | 1/271 | 2/153 | 6/504 | 0/53 |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 1023 | 1,856 (0.0%) | 0/42 | 1/271 | 2/153 | 1/504 | 0/53 |
| Mental health & counseling: Clinical Social Work | 037 | 9 of 1023 | 4,057 (0.1%) | 0/42 | 6/271 | 3/153 | 0/504 | 0/53 |
| Eye care | 023 | 12 of 1023 | 5,566 (0.1%) | 0/42 | 12/271 | 0/153 | 0/504 | 0/53 |
| Chiropractic | 010 | 0 of 1023 | 0 (0.0%) | 0/42 | 0/271 | 0/153 | 0/504 | 0/53 |
| Physical & occupational therapy | F049 | 0 of 1023 | 0 (0.0%) | 0/42 | 0/271 | 0/153 | 0/504 | 0/53 |
| Orthopedics & sports injury | 025 | 18 of 1023 | 18,216 (0.4%) | 0/42 | 14/271 | 3/153 | 1/504 | 0/53 |
| Heart / cardiology | 008 | 86 of 1023 | 95,457 (2.0%) | 0/42 | 33/271 | 8/153 | 39/504 | 6/53 |
| Skin / dermatology | 011 | 70 of 1023 | 51,832 (1.1%) | 0/42 | 10/271 | 2/153 | 54/504 | 4/53 |
| Allergy & immunology | 007 | 82 of 1023 | 83,089 (1.7%) | 0/42 | 8/271 | 7/153 | 67/504 | 0/53 |
| Lung, breathing & sleep | 030 | 25 of 1023 | 8,043 (0.2%) | 0/42 | 1/271 | 1/153 | 23/504 | 0/53 |
| Digestive / gastroenterology | 014 | 107 of 1023 | 104,592 (2.2%) | 0/42 | 12/271 | 23/153 | 69/504 | 3/53 |
| Kidney / nephrology | 018 | 1 of 1023 | 79 (0.0%) | 0/42 | 1/271 | 0/153 | 0/504 | 0/53 |
| Diabetes & hormones | 012 | 3 of 1023 | 325 (0.0%) | 0/42 | 1/271 | 0/153 | 2/504 | 0/53 |
| Cancer care / oncology | 021 | 78 of 1023 | 81,759 (1.7%) | 0/42 | 7/271 | 3/153 | 63/504 | 5/53 |
| Arthritis / rheumatology | 031 | 10 of 1023 | 15,605 (0.3%) | 0/42 | 1/271 | 2/153 | 7/504 | 0/53 |
| Brain & nerves / neurology | 019 | 77 of 1023 | 82,869 (1.7%) | 0/42 | 10/271 | 4/153 | 60/504 | 3/53 |
| Ear, nose & throat | 013 | 50 of 1023 | 103,210 (2.2%) | 0/42 | 16/271 | 0/153 | 34/504 | 0/53 |
| Urology | 033 | 60 of 1023 | 61,102 (1.3%) | 2/42 | 7/271 | 3/153 | 45/504 | 3/53 |
| Foot & ankle / podiatry | 028 | 13 of 1023 | 5,860 (0.1%) | 0/42 | 4/271 | 1/153 | 8/504 | 0/53 |
| Plastic & reconstructive surgery | 027 | 22 of 1023 | 19,273 (0.4%) | 0/42 | 0/271 | 3/153 | 18/504 | 1/53 |
| Speech & language therapy | F051 | 0 of 1023 | 0 (0.0%) | 0/42 | 0/271 | 0/153 | 0/504 | 0/53 |
| Imaging & lab | F047 | 10 of 1023 | 2,540 (0.1%) | 0/42 | 1/271 | 0/153 | 9/504 | 0/53 |
| Nursing & assisted living | F046 | 0 of 1023 | 0 (0.0%) | 0/42 | 0/271 | 0/153 | 0/504 | 0/53 |
| General surgery | 015 | 32 of 1023 | 29,764 (0.6%) | 0/42 | 21/271 | 5/153 | 6/504 | 0/53 |
| Infectious disease | 017 | 25 of 1023 | 28,659 (0.6%) | 0/42 | 3/271 | 2/153 | 20/504 | 0/53 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 40920 rows (ZIP x specialty) stored in access_e2sfca for MO; market-score now uses drive-time access for these ZIPs.
