# E2SFCA access dry run: Wisconsin

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,292; in Wisconsin: 781
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,292 x 2,292 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 552,802.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.50 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.25), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 4; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (46304, 46403, 54246, 55605)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 46304 | no | 19.87 | 100% | 19.87 | 100% | no |
| 46403 | no | 35.02 | 100% | 35.02 | 100% | no |
| 54246 | yes | 8.67 | 100% | 8.67 | 100% | no |
| 55605 | no | 6.49 | 100% | 6.49 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 69,323.6 | 4.30 | 0.51 | 296 of 780 | 54138 (-55), 54416 (-54), 54548 (-37) | 54621 (+99), 54623 (+99), 54466 (+92) |
| Pediatrics (children) | 30 | 18,188.2 | 1.11 | 0.70 | 115 of 780 | 53072 (-38), 54104 (-38), 54850 (-30) | 54436 (+90), 54466 (+77), 54454 (+72) |
| Women's health / OB-GYN | 60 | 8,546.8 | 0.53 | 0.71 | 200 of 780 | 54123 (-35), 53108 (-32), 53911 (-31) | 54486 (+61), 54926 (+52), 54755 (+45) |
| Mental health & counseling | 30 | 121,959.4 | 7.20 | 0.59 | 224 of 780 | 53295 (-29), 53530 (-25), 54660 (-24) | 54864 (+85), 54874 (+79), 54621 (+70) |
| Dental | 30 | 31,117.2 | 1.65 | 0.48 | 350 of 780 | 54149 (-62), 54138 (-61), 54893 (-54) | 54557 (+100), 54512 (+82), 54844 (+79) |
| Eye care | 30 | 10,936.4 | 0.62 | 0.51 | 354 of 780 | 54634 (-63), 54520 (-52), 54847 (-50) | 54839 (+99), 54770 (+98), 54827 (+93) |
| Chiropractic | 30 | 16,873.2 | 0.63 | 0.38 | 436 of 780 | 54462 (-73), 54465 (-70), 54138 (-58) | 53801 (+100), 54119 (+100), 54120 (+100) |
| Physical & occupational therapy | 30 | 56,318.8 | 2.70 | 0.51 | 424 of 780 | 54552 (-51), 54234 (-45), 54634 (-44) | 54623 (+96), 54621 (+95), 54628 (+93) |
| Orthopedics & sports injury | 60 | 7,346.2 | 0.39 | 0.68 | 348 of 780 | 54421 (-61), 54758 (-59), 54488 (-56) | 53557 (+67), 53825 (+67), 54473 (+65) |
| Heart / cardiology | 60 | 3,467 | 0.24 | 0.74 | 217 of 780 | 54443 (-85), 54421 (-84), 54488 (-81) | 54621 (+68), 54623 (+64), 54208 (+60) |
| Skin / dermatology | 60 | 1,505 | 0.09 | 0.73 | 310 of 780 | 54421 (-77), 54488 (-77), 54230 (-66) | 54150 (+68), 53569 (+64), 53543 (+62) |
| Allergy & immunology | 60 | 517 | 0.03 | 0.76 | 266 of 780 | 54421 (-87), 54488 (-87), 54443 (-79) | 53587 (+70), 53706 (+70), 54208 (+66) |
| Lung, breathing & sleep | 60 | 1,718.2 | 0.13 | 0.71 | 268 of 780 | 54102 (-87), 54156 (-66), 54653 (-63) | 53543 (+81), 53553 (+78), 53569 (+78) |
| Digestive / gastroenterology | 60 | 1,682.8 | 0.11 | 0.74 | 261 of 780 | 54421 (-89), 54488 (-81), 54443 (-76) | 54850 (+94), 54844 (+89), 54814 (+66) |
| Kidney / nephrology | 60 | 1,647 | 0.11 | 0.62 | 286 of 780 | 54421 (-80), 54488 (-73), 54443 (-57) | 54150 (+71), 53599 (+67), 54128 (+67) |
| Diabetes & hormones | 60 | 995.4 | 0.06 | 0.70 | 358 of 780 | 54488 (-86), 54421 (-81), 54446 (-73) | 54211 (+80), 53706 (+75), 53587 (+73) |
| Cancer care / oncology | 90 | 2,396.8 | 0.15 | 0.50 | 439 of 780 | 53149 (-48), 54842 (-45), 54836 (-44) | 54211 (+83), 54436 (+72), 54202 (+71) |
| Arthritis / rheumatology | 60 | 605.2 | 0.04 | 0.71 | 326 of 780 | 54421 (-100), 54488 (-100), 54443 (-95) | 53504 (+70), 53599 (+70), 53587 (+68) |
| Brain & nerves / neurology | 60 | 3,323.4 | 0.22 | 0.77 | 186 of 780 | 54421 (-57), 54488 (-56), 54405 (-49) | 54621 (+62), 54208 (+59), 54623 (+56) |
| Ear, nose & throat | 60 | 1,106.2 | 0.07 | 0.72 | 305 of 780 | 54546 (-100), 54559 (-94), 54421 (-93) | 54850 (+90), 54844 (+86), 53557 (+67) |
| Urology | 60 | 1,161.6 | 0.07 | 0.69 | 342 of 780 | 54421 (-55), 54123 (-53), 54488 (-51) | 54201 (+87), 54205 (+76), 54217 (+71) |
| Foot & ankle / podiatry | 60 | 2,751.8 | 0.15 | 0.69 | 243 of 780 | 54427 (-73), 54499 (-52), 53023 (-37) | 54740 (+63), 54621 (+56), 53931 (+54) |
| Pain management | 60 | 1,101 | 0.09 | 0.78 | 183 of 780 | 54805 (-70), 54733 (-62), 54801 (-57) | 54208 (+61), 54229 (+50), 53178 (+49) |
| Plastic & reconstructive surgery | 90 | 888.6 | 0.07 | 0.63 | 391 of 780 | 53551 (-47), 53076 (-45), 53549 (-45) | 54621 (+72), 54623 (+70), 54658 (+67) |
| Speech & language therapy | 30 | 16,221.6 | 0.90 | 0.62 | 316 of 780 | 54001 (-43), 53578 (-41), 54487 (-37) | 54103 (+70), 54125 (+63), 53706 (+60) |
| Nutrition & dietitian | 30 | 6,287.8 | 0.33 | 0.64 | 348 of 780 | 54840 (-62), 54520 (-58), 54456 (-54) | 54119 (+100), 54120 (+100), 54151 (+100) |
| Acupuncture, massage & naturopathy | 30 | 6,225.6 | 0.52 | 0.65 | 185 of 780 | 54138 (-75), 53962 (-55), 54175 (-54) | 54770 (+59), 54644 (+56), 54817 (+55) |
| Urgent care & emergency | 30 | 7,309.2 | 0.47 | 0.54 | 346 of 780 | 54462 (-90), 54465 (-90), 54850 (-65) | 54626 (+100), 53801 (+99), 54621 (+98) |
| Imaging & lab | 60 | 8,261.4 | 0.49 | 0.69 | 220 of 780 | 54421 (-80), 54488 (-79), 54405 (-60) | 54621 (+64), 54623 (+59), 54658 (+59) |
| Pharmacy | 30 | 27,478.2 | 1.72 | 0.50 | 324 of 780 | 54138 (-71), 54416 (-53), 54872 (-40) | 54120 (+83), 54119 (+78), 54151 (+75) |
| Home health & in-home care | 30 | 13,919 | 1.61 | 0.66 | 49 of 780 | 54174 (-62), 54820 (-30), 54773 (-28) | 53092 (+33), 54119 (+32), 54120 (+31) |
| Nursing & assisted living | 60 | 6,854.6 | 0.39 | 0.52 | 324 of 780 | 53017 (-61), 53033 (-58), 53027 (-56) | 54865 (+89), 53810 (+78), 53806 (+74) |
| Medical equipment & supplies | 60 | 6,028.4 | 0.36 | 0.74 | 231 of 780 | 54443 (-41), 54546 (-38), 53588 (-34) | 54211 (+78), 54202 (+70), 54212 (+70) |
| Hearing & audiology | 60 | 3,625.4 | 0.19 | 0.63 | 391 of 780 | 54427 (-76), 54546 (-59), 54123 (-58) | 54850 (+90), 54844 (+76), 54896 (+73) |
| Behavior therapy (ABA) | 30 | 33,282 | 2.88 | 0.81 | 38 of 780 | 54603 (-20), 54650 (-15), 54940 (-14) | 54658 (+100), 54625 (+81), 54630 (+52) |
| Care coordination & community health | 30 | 16,453 | 1.63 | 0.58 | 203 of 780 | 54810 (-70), 54858 (-69), 54456 (-51) | 54103 (+98), 54658 (+92), 54125 (+81) |
| General surgery | 60 | 5,241.6 | 0.35 | 0.60 | 286 of 780 | 54421 (-82), 54443 (-76), 54488 (-72) | 54208 (+58), 54944 (+57), 53186 (+50) |
| Infectious disease | 90 | 748 | 0.05 | 0.59 | 359 of 780 | 53038 (-49), 53104 (-48), 53076 (-47) | 54436 (+69), 54621 (+69), 54466 (+68) |
| Genetics & genetic counseling | 90 | 717.4 | 0.03 | 0.55 | 476 of 780 | 53036 (-100), 53038 (-100), 53066 (-100) | 54944 (+60), 54208 (+58), 54229 (+58) |
| Hospice & palliative care | 60 | 926 | 0.09 | 0.69 | 266 of 780 | 54758 (-43), 54421 (-42), 54751 (-38) | 54013 (+68), 54767 (+60), 54770 (+59) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Wisconsin in households with no vehicle: about 297,587 of 4,612,395 (6.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 4 of 780 | 53706 (+47), 53205 (+27), 53233 (+26) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 780 | 53706 (+46), 53205 (+30), 53233 (+25) | 1.00 |
| Women's health / OB-GYN | 1.00 | 3 of 780 | 53706 (+26), 53205 (+18), 53233 (+18) | 1.00 |
| Mental health & counseling | 1.00 | 5 of 780 | 53706 (+69), 53205 (+25), 53233 (+24) | 1.00 |
| Dental | 1.00 | 4 of 780 | 53706 (+40), 53205 (+24), 53233 (+23) | 1.00 |
| Eye care | 1.00 | 5 of 780 | 53706 (+51), 53205 (+22), 53233 (+22) | 1.00 |
| Chiropractic | 0.99 | 6 of 780 | 53706 (+57), 53205 (+20), 53233 (+20) | 1.00 |
| Physical & occupational therapy | 0.99 | 5 of 780 | 53706 (+59), 53205 (+32), 53233 (+29) | 1.00 |
| Orthopedics & sports injury | 0.99 | 4 of 780 | 53706 (+37), 53205 (+25), 53233 (+24) | 1.00 |
| Heart / cardiology | 1.00 | 3 of 780 | 53205 (+25), 53233 (+24), 53706 (+17) | 1.00 |
| Skin / dermatology | 1.00 | 3 of 780 | 53706 (+30), 53205 (+25), 53233 (+24) | 1.00 |
| Allergy & immunology | 1.00 | 4 of 780 | 53706 (+52), 53205 (+22), 53233 (+22) | 1.00 |
| Lung, breathing & sleep | 1.00 | 3 of 780 | 53706 (+33), 53205 (+21), 53233 (+21) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 780 | 54861 (+31), 53706 (+27), 53205 (+21) | 1.00 |
| Kidney / nephrology | 0.99 | 4 of 780 | 53205 (+25), 53233 (+25), 53706 (+19) | 1.00 |
| Diabetes & hormones | 1.00 | 5 of 780 | 53706 (+56), 53205 (+30), 53233 (+29) | 1.00 |
| Cancer care / oncology | 0.99 | 3 of 780 | 53205 (+19), 53233 (+18), 53706 (+15) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 780 | 53706 (+45), 53205 (+25), 53233 (+24) | 1.00 |
| Brain & nerves / neurology | 1.00 | 3 of 780 | 53205 (+25), 53233 (+24), 53706 (+17) | 1.00 |
| Ear, nose & throat | 1.00 | 3 of 780 | 53205 (+26), 53233 (+25), 53706 (+25) | 1.00 |
| Urology | 1.00 | 3 of 780 | 53706 (+24), 53205 (+22), 53233 (+21) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 3 of 780 | 53706 (+22), 53205 (+20), 53233 (+19) | 1.00 |
| Pain management | 1.00 | 3 of 780 | 54857 (+28), 53205 (+26), 53233 (+25) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 3 of 780 | 53205 (+17), 53233 (+16), 53706 (+15) | 1.00 |
| Speech & language therapy | 1.00 | 5 of 780 | 53706 (+65), 53205 (+23), 53233 (+23) | 1.00 |
| Nutrition & dietitian | 1.00 | 5 of 780 | 53706 (+63), 53205 (+28), 53233 (+27) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 3 of 780 | 53706 (+42), 53205 (+15), 53233 (+15) | 1.00 |
| Urgent care & emergency | 1.00 | 4 of 780 | 53706 (+29), 53205 (+26), 53233 (+26) | 1.00 |
| Imaging & lab | 1.00 | 3 of 780 | 53205 (+26), 53233 (+25), 53706 (+17) | 1.00 |
| Pharmacy | 1.00 | 5 of 780 | 53706 (+63), 53205 (+29), 53233 (+28) | 1.00 |
| Home health & in-home care | 1.00 | 3 of 780 | 53205 (+24), 53706 (+22), 53233 (+21) | 1.00 |
| Nursing & assisted living | 0.99 | 7 of 780 | 53706 (+50), 53205 (+33), 53233 (+33) | 1.00 |
| Medical equipment & supplies | 0.99 | 3 of 780 | 53706 (+34), 53205 (+24), 53233 (+24) | 1.00 |
| Hearing & audiology | 0.99 | 6 of 780 | 53706 (+43), 54861 (+30), 53205 (+25) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 780 | 53706 (+16), 53205 (+8), 53233 (+8) | 1.00 |
| Care coordination & community health | 1.00 | 3 of 780 | 53706 (+49), 53205 (+17), 53233 (+16) | 1.00 |
| General surgery | 1.00 | 4 of 780 | 54861 (+22), 53706 (+19), 53205 (+18) | 1.00 |
| Infectious disease | 1.00 | 2 of 780 | 53205 (+17), 53233 (+16), 53206 (+9) | 1.00 |
| Genetics & genetic counseling | 1.00 | 3 of 780 | 53205 (+30), 53233 (+29), 53206 (+16) | 1.00 |
| Hospice & palliative care | 0.99 | 4 of 780 | 53706 (+23), 54861 (+17), 53205 (+16) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 37 of 781 | 47,886 (1.0%) | 0/36 | 31/281 | 5/187 | 1/261 | 0/16 |
| Women's health / OB-GYN | 016 | 1 of 781 | 682 (0.0%) | 0/36 | 0/281 | 1/187 | 0/261 | 0/16 |
| Mental health & counseling: Psychiatry | 029 | 9 of 781 | 8,673 (0.2%) | 0/36 | 0/281 | 7/187 | 2/261 | 0/16 |
| Mental health & counseling: Clinical Psychology | 036 | 2 of 781 | 1,628 (0.0%) | 0/36 | 0/281 | 2/187 | 0/261 | 0/16 |
| Mental health & counseling: Clinical Social Work | 037 | 3 of 781 | 4,375 (0.1%) | 0/36 | 2/281 | 1/187 | 0/261 | 0/16 |
| Eye care | 023 | 3 of 781 | 6,113 (0.1%) | 0/36 | 2/281 | 1/187 | 0/261 | 0/16 |
| Chiropractic | 010 | 0 of 781 | 0 (0.0%) | 0/36 | 0/281 | 0/187 | 0/261 | 0/16 |
| Physical & occupational therapy | F049 | 0 of 781 | 0 (0.0%) | 0/36 | 0/281 | 0/187 | 0/261 | 0/16 |
| Orthopedics & sports injury | 025 | 3 of 781 | 4,981 (0.1%) | 0/36 | 2/281 | 1/187 | 0/261 | 0/16 |
| Heart / cardiology | 008 | 93 of 781 | 231,986 (5.0%) | 0/36 | 18/281 | 50/187 | 25/261 | 0/16 |
| Skin / dermatology | 011 | 44 of 781 | 52,410 (1.1%) | 0/36 | 1/281 | 12/187 | 25/261 | 6/16 |
| Allergy & immunology | 007 | 116 of 781 | 187,881 (4.1%) | 0/36 | 12/281 | 18/187 | 75/261 | 11/16 |
| Lung, breathing & sleep | 030 | 45 of 781 | 65,747 (1.4%) | 0/36 | 3/281 | 6/187 | 36/261 | 0/16 |
| Digestive / gastroenterology | 014 | 82 of 781 | 160,352 (3.5%) | 0/36 | 6/281 | 39/187 | 36/261 | 1/16 |
| Kidney / nephrology | 018 | 2 of 781 | 1,942 (0.0%) | 0/36 | 1/281 | 1/187 | 0/261 | 0/16 |
| Diabetes & hormones | 012 | 4 of 781 | 3,751 (0.1%) | 0/36 | 0/281 | 4/187 | 0/261 | 0/16 |
| Cancer care / oncology | 021 | 21 of 781 | 32,412 (0.7%) | 0/36 | 2/281 | 6/187 | 13/261 | 0/16 |
| Arthritis / rheumatology | 031 | 19 of 781 | 28,304 (0.6%) | 0/36 | 1/281 | 1/187 | 17/261 | 0/16 |
| Brain & nerves / neurology | 019 | 61 of 781 | 98,730 (2.1%) | 0/36 | 1/281 | 31/187 | 29/261 | 0/16 |
| Ear, nose & throat | 013 | 37 of 781 | 56,821 (1.2%) | 0/36 | 2/281 | 9/187 | 26/261 | 0/16 |
| Urology | 033 | 38 of 781 | 52,966 (1.1%) | 0/36 | 1/281 | 12/187 | 25/261 | 0/16 |
| Foot & ankle / podiatry | 028 | 4 of 781 | 3,637 (0.1%) | 0/36 | 1/281 | 1/187 | 2/261 | 0/16 |
| Plastic & reconstructive surgery | 027 | 42 of 781 | 61,493 (1.3%) | 0/36 | 0/281 | 4/187 | 33/261 | 5/16 |
| Speech & language therapy | F051 | 0 of 781 | 0 (0.0%) | 0/36 | 0/281 | 0/187 | 0/261 | 0/16 |
| Imaging & lab | F047 | 3 of 781 | 2,377 (0.1%) | 0/36 | 0/281 | 1/187 | 2/261 | 0/16 |
| Nursing & assisted living | F046 | 0 of 781 | 0 (0.0%) | 0/36 | 0/281 | 0/187 | 0/261 | 0/16 |
| General surgery | 015 | 12 of 781 | 25,031 (0.5%) | 0/36 | 8/281 | 3/187 | 1/261 | 0/16 |
| Infectious disease | 017 | 19 of 781 | 31,285 (0.7%) | 0/36 | 2/281 | 5/187 | 12/261 | 0/16 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 31240 rows (ZIP x specialty) stored in access_e2sfca for WI; market-score now uses drive-time access for these ZIPs.
