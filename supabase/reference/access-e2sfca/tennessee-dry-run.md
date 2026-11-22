# E2SFCA access dry run: Tennessee

Run 2026-11-22 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,256; in Tennessee: 621
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,256 x 2,256 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 410,121; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.07 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.68), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 24834 | no | 8.78 | 100% | 4.57 | 100% | yes (2.13) |
| 24868 | no | 8.08 | 100% | 5.49 | 100% | yes (1.45) |
| 41554 | no | 9.03 | 100% | 4.87 | 100% | yes (1.89) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 71,753 | 4.78 | 0.50 | 354 of 621 | 37756 (-63), 37361 (-61), 37745 (-56) | 37023 (+97), 37218 (+87), 37873 (+78) |
| Pediatrics (children) | 30 | 11,281 | 1.13 | 0.69 | 144 of 621 | 37213 (-55), 37201 (-51), 37204 (-49) | 37218 (+79), 37853 (+79), 37015 (+73) |
| Women's health / OB-GYN | 60 | 6,412 | 0.55 | 0.72 | 188 of 621 | 38469 (-47), 37871 (-45), 37764 (-41) | 37023 (+75), 37218 (+75), 37862 (+56) |
| Mental health & counseling | 30 | 74,545 | 7.13 | 0.66 | 140 of 621 | 37178 (-51), 38008 (-30), 37027 (-29) | 37218 (+88), 37209 (+59), 37849 (+57) |
| Dental | 30 | 18,535 | 1.64 | 0.59 | 270 of 621 | 37756 (-60), 37745 (-58), 38555 (-41) | 37023 (+100), 37710 (+55), 37191 (+54) |
| Eye care | 30 | 7,998 | 0.65 | 0.59 | 334 of 621 | 37757 (-74), 37745 (-66), 38501 (-48) | 38562 (+74), 37218 (+73), 38313 (+70) |
| Chiropractic | 30 | 7,948 | 0.64 | 0.61 | 286 of 621 | 37361 (-93), 37745 (-54), 37213 (-53) | 37046 (+76), 37060 (+70), 38348 (+54) |
| Physical & occupational therapy | 30 | 36,853 | 2.73 | 0.52 | 342 of 621 | 37745 (-64), 38578 (-62), 38485 (-56) | 37023 (+76), 37419 (+72), 37060 (+69) |
| Orthopedics & sports injury | 60 | 5,607 | 0.42 | 0.72 | 244 of 621 | 37617 (-48), 37663 (-48), 37656 (-42) | 37023 (+85), 37218 (+77), 37376 (+59) |
| Heart / cardiology | 60 | 3,186 | 0.28 | 0.73 | 235 of 621 | 38375 (-47), 37806 (-43), 38340 (-43) | 37862 (+80), 37218 (+77), 37873 (+76) |
| Skin / dermatology | 60 | 952 | 0.10 | 0.78 | 167 of 621 | 37076 (-47), 37167 (-46), 37086 (-39) | 37873 (+82), 37218 (+77), 37060 (+55) |
| Allergy & immunology | 60 | 372 | 0.03 | 0.79 | 221 of 621 | 37764 (-69), 37862 (-58), 37871 (-58) | 37882 (+98), 38568 (+69), 37218 (+68) |
| Lung, breathing & sleep | 60 | 1,714 | 0.14 | 0.71 | 245 of 621 | 38556 (-100), 38575 (-100), 38582 (-100) | 38543 (+100), 37862 (+83), 37218 (+79) |
| Digestive / gastroenterology | 60 | 1,238 | 0.13 | 0.76 | 200 of 621 | 37871 (-55), 37764 (-46), 37806 (-44) | 37862 (+89), 37873 (+82), 37218 (+74) |
| Kidney / nephrology | 60 | 1,382 | 0.12 | 0.68 | 261 of 621 | 37714 (-68), 37769 (-68), 38259 (-66) | 38568 (+76), 37218 (+71), 37756 (+65) |
| Diabetes & hormones | 60 | 552 | 0.07 | 0.75 | 191 of 621 | 38002 (-37), 37934 (-36), 37771 (-35) | 38567 (+77), 37030 (+75), 38560 (+73) |
| Cancer care / oncology | 90 | 2,053 | 0.18 | 0.63 | 336 of 621 | 38054 (-72), 38002 (-70), 37721 (-69) | 37218 (+69), 37862 (+68), 37410 (+59) |
| Arthritis / rheumatology | 60 | 400 | 0.04 | 0.79 | 178 of 621 | 37806 (-48), 37721 (-46), 37938 (-46) | 37862 (+85), 37218 (+82), 37209 (+67) |
| Brain & nerves / neurology | 60 | 2,787 | 0.24 | 0.79 | 190 of 621 | 37076 (-90), 37122 (-89), 37062 (-86) | 37419 (+60), 37862 (+59), 37405 (+58) |
| Ear, nose & throat | 60 | 772 | 0.08 | 0.72 | 199 of 621 | 37328 (-47), 37342 (-39), 37871 (-39) | 37376 (+75), 37218 (+68), 37359 (+68) |
| Urology | 60 | 1,056 | 0.08 | 0.68 | 289 of 621 | 38469 (-55), 38481 (-55), 38574 (-52) | 37376 (+100), 37187 (+87), 37862 (+85) |
| Foot & ankle / podiatry | 60 | 1,469 | 0.16 | 0.67 | 167 of 621 | 38259 (-48), 38237 (-42), 38233 (-41) | 38568 (+56), 37753 (+48), 37165 (+47) |
| Pain management | 60 | 1,019 | 0.09 | 0.70 | 258 of 621 | 38574 (-46), 38344 (-45), 38387 (-45) | 37218 (+68), 37878 (+66), 38318 (+64) |
| Plastic & reconstructive surgery | 90 | 658 | 0.07 | 0.62 | 339 of 621 | 37188 (-51), 37073 (-50), 37048 (-49) | 37410 (+67), 37402 (+65), 37218 (+63) |
| Speech & language therapy | 30 | 11,852 | 0.87 | 0.62 | 274 of 621 | 37807 (-73), 37058 (-59), 37917 (-55) | 37171 (+92), 37052 (+90), 37849 (+80) |
| Nutrition & dietitian | 30 | 3,795 | 0.32 | 0.67 | 238 of 621 | 38241 (-88), 37375 (-79), 38573 (-79) | 37023 (+100), 37218 (+87), 37853 (+72) |
| Acupuncture, massage & naturopathy | 30 | 2,544 | 0.50 | 0.62 | 59 of 621 | 37097 (-72), 37375 (-42), 37738 (-39) | 38380 (+39), 37391 (+27), 38469 (+27) |
| Urgent care & emergency | 30 | 6,107 | 0.50 | 0.46 | 344 of 621 | 37317 (-69), 37869 (-67), 37061 (-61) | 37730 (+100), 38392 (+97), 38356 (+94) |
| Imaging & lab | 60 | 5,816 | 0.55 | 0.75 | 194 of 621 | 37871 (-46), 38053 (-43), 38054 (-41) | 37218 (+75), 37862 (+68), 37419 (+67) |
| Pharmacy | 30 | 26,732 | 1.68 | 0.46 | 381 of 621 | 37361 (-76), 37756 (-74), 37365 (-73) | 37852 (+77), 37732 (+72), 38392 (+72) |
| Home health & in-home care | 30 | 11,855 | 1.49 | 0.62 | 100 of 621 | 37178 (-78), 37888 (-59), 37175 (-44) | 38079 (+53), 37710 (+39), 38080 (+39) |
| Nursing & assisted living | 60 | 5,298 | 0.37 | 0.45 | 292 of 621 | 37806 (-69), 37764 (-68), 37721 (-62) | 37882 (+98), 37714 (+96), 37369 (+81) |
| Medical equipment & supplies | 60 | 5,552 | 0.34 | 0.67 | 259 of 621 | 38469 (-66), 38481 (-63), 38582 (-52) | 37218 (+69), 37730 (+66), 38568 (+65) |
| Hearing & audiology | 60 | 2,430 | 0.20 | 0.74 | 241 of 621 | 37617 (-51), 38469 (-51), 38481 (-50) | 37726 (+88), 37218 (+75), 38554 (+69) |
| Behavior therapy (ABA) | 30 | 19,534 | 2.58 | 0.69 | 113 of 621 | 37027 (-43), 37213 (-42), 37214 (-40) | 37171 (+100), 38333 (+100), 37035 (+96) |
| Care coordination & community health | 30 | 16,709 | 1.55 | 0.59 | 231 of 621 | 37871 (-69), 37721 (-64), 37862 (-59) | 38356 (+89), 38063 (+82), 38392 (+82) |
| General surgery | 60 | 4,832 | 0.39 | 0.67 | 239 of 621 | 37076 (-56), 37062 (-54), 37167 (-54) | 37862 (+83), 37873 (+73), 37863 (+68) |
| Infectious disease | 90 | 396 | 0.06 | 0.62 | 302 of 621 | 38002 (-63), 38049 (-56), 38054 (-54) | 37218 (+75), 37419 (+75), 37189 (+74) |
| Genetics & genetic counseling | 90 | 268 | 0.03 | 0.57 | 251 of 621 | 38002 (-62), 37871 (-56), 37931 (-56) | 37419 (+82), 37862 (+74), 37218 (+70) |
| Hospice & palliative care | 60 | 879 | 0.09 | 0.70 | 133 of 621 | 38481 (-46), 38469 (-42), 37317 (-38) | 38380 (+48), 38387 (+47), 37218 (+45) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Tennessee in households with no vehicle: about 275,643 of 5,379,387 (5.1%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 12
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 6 of 621 | 37915 (+31), 37402 (+27), 37410 (+24) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 621 | 37915 (+26), 37402 (+24), 37410 (+17) | 1.00 |
| Women's health / OB-GYN | 1.00 | 3 of 621 | 37915 (+24), 37402 (+19), 37410 (+19) | 1.00 |
| Mental health & counseling | 1.00 | 4 of 621 | 37915 (+29), 37402 (+23), 37902 (+19) | 1.00 |
| Dental | 1.00 | 5 of 621 | 37402 (+24), 37915 (+18), 37326 (+17) | 1.00 |
| Eye care | 1.00 | 5 of 621 | 37402 (+25), 37915 (+24), 37902 (+18) | 1.00 |
| Chiropractic | 1.00 | 3 of 621 | 37402 (+30), 37410 (+19), 37915 (+15) | 1.00 |
| Physical & occupational therapy | 1.00 | 4 of 621 | 37402 (+27), 37410 (+23), 37915 (+23) | 1.00 |
| Orthopedics & sports injury | 1.00 | 3 of 621 | 37402 (+22), 37410 (+22), 37915 (+21) | 1.00 |
| Heart / cardiology | 1.00 | 4 of 621 | 37915 (+26), 37402 (+20), 37410 (+19) | 1.00 |
| Skin / dermatology | 1.00 | 2 of 621 | 37402 (+15), 37915 (+15), 37210 (+14) | 1.00 |
| Allergy & immunology | 1.00 | 4 of 621 | 37915 (+28), 37402 (+21), 37410 (+18) | 1.00 |
| Lung, breathing & sleep | 1.00 | 4 of 621 | 37915 (+31), 37410 (+18), 37902 (+18) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 621 | 37915 (+27), 37410 (+16), 37402 (+15) | 1.00 |
| Kidney / nephrology | 1.00 | 5 of 621 | 37402 (+21), 38126 (+20), 37410 (+18) | 1.00 |
| Diabetes & hormones | 1.00 | 0 of 621 | 37915 (+13), 38126 (+13), 37410 (+10) | 1.00 |
| Cancer care / oncology | 1.00 | 2 of 621 | 37915 (+25), 37719 (+22), 37902 (+14) | 1.00 |
| Arthritis / rheumatology | 1.00 | 3 of 621 | 37915 (+29), 37902 (+17), 37410 (+15) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 621 | 37915 (+24), 37410 (+14), 37902 (+13) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 621 | 37915 (+19), 37326 (+13), 37402 (+13) | 1.00 |
| Urology | 1.00 | 5 of 621 | 37915 (+27), 37326 (+22), 37402 (+20) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 2 of 621 | 37402 (+23), 37410 (+18), 37165 (+14) | 1.00 |
| Pain management | 1.00 | 5 of 621 | 37915 (+25), 37719 (+21), 37402 (+19) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 621 | 37915 (+16), 37719 (+15), 37326 (+13) | 1.00 |
| Speech & language therapy | 1.00 | 4 of 621 | 37915 (+34), 37402 (+27), 37410 (+19) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 621 | 37915 (+30), 37402 (+24), 37410 (+18) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 0 of 621 | 37402 (+9), 37410 (+6), 37902 (+5) | 1.00 |
| Urgent care & emergency | 1.00 | 6 of 621 | 37326 (+34), 37915 (+29), 37402 (+28) | 1.00 |
| Imaging & lab | 1.00 | 2 of 621 | 37915 (+25), 38126 (+16), 37902 (+14) | 1.00 |
| Pharmacy | 1.00 | 7 of 621 | 37915 (+29), 37402 (+28), 37410 (+23) | 1.00 |
| Home health & in-home care | 1.00 | 1 of 621 | 38126 (+19), 37915 (+14), 38105 (+14) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 621 | 37719 (+26), 37402 (+20), 37915 (+20) | 1.00 |
| Medical equipment & supplies | 0.99 | 10 of 621 | 37402 (+29), 37719 (+25), 37376 (+24) | 1.00 |
| Hearing & audiology | 1.00 | 6 of 621 | 37915 (+28), 37402 (+21), 37410 (+17) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 621 | 37915 (+15), 37402 (+13), 37410 (+12) | 1.00 |
| Care coordination & community health | 1.00 | 2 of 621 | 37402 (+21), 37410 (+16), 37210 (+11) | 1.00 |
| General surgery | 1.00 | 3 of 621 | 37915 (+23), 37210 (+17), 37410 (+15) | 1.00 |
| Infectious disease | 1.00 | 0 of 621 | 38126 (+10), 38108 (+9), 37719 (+8) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 621 | 37719 (+16), 37915 (+13), 38108 (+9) | 1.00 |
| Hospice & palliative care | 1.00 | 1 of 621 | 37326 (+17), 37402 (+12), 37410 (+12) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 38017 | Primary care / family doctor | 6.130 | 2.924 | 36 | 69 |
| 38017 | Mental health & counseling | 4.756 | 1.936 | 67 | 86 |
| 38017 | Heart / cardiology | 0.518 | 0.278 | 8 | 51 |
| 38017 | Cancer care / oncology | 0.329 | 0.273 | 8 | 23 |
| 38017 | Urgent care & emergency | 0.339 | 0.181 | 66 | 82 |
| 38018 | Primary care / family doctor | 5.398 | 5.533 | 44 | 42 |
| 38018 | Mental health & counseling | 4.864 | 4.850 | 66 | 66 |
| 38018 | Heart / cardiology | 0.433 | 0.351 | 23 | 38 |
| 38018 | Cancer care / oncology | 0.289 | 0.304 | 19 | 15 |
| 38018 | Urgent care & emergency | 0.349 | 0.383 | 65 | 61 |
| 38103 | Primary care / family doctor | 5.029 | 6.253 | 47 | 35 |
| 38103 | Mental health & counseling | 5.171 | 6.665 | 64 | 53 |
| 38103 | Heart / cardiology | 0.334 | 0.332 | 41 | 41 |
| 38103 | Cancer care / oncology | 0.520 | 0.341 | 0 | 4 |
| 38103 | Urgent care & emergency | 0.520 | 0.656 | 48 | 34 |
| 37203 | Primary care / family doctor | 7.539 | 11.121 | 21 | 0 |
| 37203 | Mental health & counseling | 10.794 | 13.916 | 24 | 2 |
| 37203 | Heart / cardiology | 0.435 | 0.339 | 23 | 40 |
| 37203 | Cancer care / oncology | 0.344 | 0.181 | 3 | 49 |
| 37203 | Urgent care & emergency | 0.471 | 0.680 | 53 | 32 |
| 37902 | Primary care / family doctor | 8.100 | 9.817 | 15 | 0 |
| 37902 | Mental health & counseling | 11.523 | 11.596 | 19 | 19 |
| 37902 | Heart / cardiology | 0.551 | 0.381 | 2 | 32 |
| 37902 | Cancer care / oncology | 0.520 | 0.257 | 0 | 28 |
| 37902 | Urgent care & emergency | 0.695 | 0.874 | 30 | 12 |
| 37402 | Primary care / family doctor | 8.065 | 6.975 | 16 | 27 |
| 37402 | Mental health & counseling | 8.289 | 6.994 | 42 | 51 |
| 37402 | Heart / cardiology | 0.608 | 0.285 | 0 | 49 |
| 37402 | Cancer care / oncology | 0.365 | 0.154 | 0 | 57 |
| 37402 | Urgent care & emergency | 0.836 | 0.720 | 16 | 28 |
| 37683 | Primary care / family doctor | 2.501 | 4.710 | 74 | 51 |
| 37683 | Mental health & counseling | 1.743 | 2.358 | 88 | 83 |
| 37683 | Heart / cardiology | 0.038 | 0.109 | 93 | 81 |
| 37683 | Cancer care / oncology | 0.038 | 0.090 | 89 | 75 |
| 37683 | Urgent care & emergency | 0.152 | 0.336 | 85 | 66 |
| 38551 | Primary care / family doctor | 4.263 | 5.399 | 55 | 44 |
| 38551 | Mental health & counseling | 1.585 | 0.635 | 89 | 96 |
| 38551 | Heart / cardiology | 0.000 | 0.000 | 100 | 100 |
| 38551 | Cancer care / oncology | 0.000 | 0.021 | 100 | 94 |
| 38551 | Urgent care & emergency | 0.528 | 1.588 | 47 | 0 |
| 37336 | Primary care / family doctor | 3.566 | 1.410 | 63 | 85 |
| 37336 | Mental health & counseling | 2.391 | 1.363 | 83 | 90 |
| 37336 | Heart / cardiology | 0.079 | 0.055 | 86 | 90 |
| 37336 | Cancer care / oncology | 0.040 | 0.110 | 89 | 69 |
| 37336 | Urgent care & emergency | 0.225 | 0.059 | 77 | 94 |
| 38464 | Primary care / family doctor | 4.234 | 7.446 | 56 | 22 |
| 38464 | Mental health & counseling | 2.000 | 3.751 | 86 | 74 |
| 38464 | Heart / cardiology | 0.064 | 0.073 | 89 | 87 |
| 38464 | Cancer care / oncology | 0.021 | 0.045 | 94 | 87 |
| 38464 | Urgent care & emergency | 0.255 | 0.441 | 74 | 56 |

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest ZIP with a listing in the specialty, against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 39 of 620 | 65,736 (1.2%) |  | 19/292 | 16/202 | 4/126 |  |
| Women's health / OB-GYN | 016 | 3 of 620 | 7,664 (0.1%) |  | 3/292 | 0/202 | 0/126 |  |
| Mental health & counseling | 029 | 2 of 620 | 3,495 (0.1%) |  | 2/292 | 0/202 | 0/126 |  |
| Eye care | 023 | 24 of 620 | 84,908 (1.6%) |  | 22/292 | 2/202 | 0/126 |  |
| Chiropractic | 010 | 3 of 620 | 4,122 (0.1%) |  | 3/292 | 0/202 | 0/126 |  |
| Physical & occupational therapy | F049 | 2 of 620 | 3,495 (0.1%) |  | 2/292 | 0/202 | 0/126 |  |
| Orthopedics & sports injury | 025 | 21 of 620 | 60,807 (1.1%) |  | 19/292 | 2/202 | 0/126 |  |
| Heart / cardiology | 008 | 65 of 620 | 251,947 (4.7%) |  | 43/292 | 21/202 | 1/126 |  |
| Skin / dermatology | 011 | 42 of 620 | 111,459 (2.1%) |  | 10/292 | 23/202 | 9/126 |  |
| Allergy & immunology | 007 | 47 of 620 | 203,054 (3.8%) |  | 24/292 | 16/202 | 7/126 |  |
| Lung, breathing & sleep | 030 | 8 of 620 | 15,813 (0.3%) |  | 3/292 | 4/202 | 1/126 |  |
| Digestive / gastroenterology | 014 | 50 of 620 | 175,007 (3.3%) |  | 9/292 | 30/202 | 11/126 |  |
| Kidney / nephrology | 018 | 5 of 620 | 12,120 (0.2%) |  | 5/292 | 0/202 | 0/126 |  |
| Diabetes & hormones | 012 | 15 of 620 | 88,374 (1.6%) |  | 15/292 | 0/202 | 0/126 |  |
| Cancer care / oncology | 021 | 14 of 620 | 22,953 (0.4%) |  | 3/292 | 9/202 | 2/126 |  |
| Arthritis / rheumatology | 031 | 32 of 620 | 189,373 (3.5%) |  | 17/292 | 12/202 | 3/126 |  |
| Brain & nerves / neurology | 019 | 46 of 620 | 112,395 (2.1%) |  | 5/292 | 36/202 | 5/126 |  |
| Ear, nose & throat | 013 | 17 of 620 | 86,600 (1.6%) |  | 14/292 | 2/202 | 1/126 |  |
| Urology | 033 | 33 of 620 | 84,409 (1.6%) |  | 6/292 | 24/202 | 3/126 |  |
| Foot & ankle / podiatry | 028 | 11 of 620 | 34,811 (0.6%) |  | 6/292 | 4/202 | 1/126 |  |
| Plastic & reconstructive surgery | 027 | 4 of 620 | 11,951 (0.2%) |  | 4/292 | 0/202 | 0/126 |  |
| Speech & language therapy | F051 | 3 of 620 | 7,664 (0.1%) |  | 3/292 | 0/202 | 0/126 |  |
| Imaging & lab | F047 | 2 of 620 | 3,495 (0.1%) |  | 2/292 | 0/202 | 0/126 |  |
| Nursing & assisted living | F046 | 2 of 620 | 3,495 (0.1%) |  | 2/292 | 0/202 | 0/126 |  |
| General surgery | 015 | 35 of 620 | 144,432 (2.7%) |  | 30/292 | 5/202 | 0/126 |  |
| Infectious disease | 017 | 8 of 620 | 17,969 (0.3%) |  | 5/292 | 3/202 | 0/126 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
