# E2SFCA access dry run: Tennessee

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,203; in Tennessee: 615
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,203 x 2,203 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 408,374; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.06 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.66), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 3; still implausible (left out of the rank comparison, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 24834 | no | 8.78 | 100% | 4.57 | 100% | yes (2.13) |
| 24868 | no | 8.08 | 100% | 5.49 | 100% | yes (1.45) |
| 41554 | no | 9.03 | 100% | 4.87 | 100% | yes (1.89) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 71,305 | 4.78 | 0.49 | 355 of 615 | 37756 (-63), 37361 (-61), 37745 (-56) | 37023 (+93), 37218 (+86), 37688 (+79) |
| Pediatrics (children) | 30 | 11,140 | 1.13 | 0.69 | 144 of 615 | 37213 (-49), 37204 (-42), 37201 (-41) | 37853 (+80), 37218 (+78), 37015 (+73) |
| Women's health / OB-GYN | 60 | 6,315 | 0.55 | 0.73 | 173 of 615 | 38469 (-45), 37871 (-43), 37764 (-42) | 37023 (+80), 37218 (+75), 38568 (+54) |
| Mental health & counseling | 30 | 74,584 | 7.13 | 0.65 | 142 of 615 | 37178 (-50), 38008 (-30), 37027 (-28) | 37218 (+87), 37209 (+59), 37849 (+58) |
| Dental | 30 | 18,526 | 1.64 | 0.59 | 274 of 615 | 37756 (-60), 37745 (-58), 38555 (-41) | 37023 (+100), 37191 (+54), 37218 (+54) |
| Eye care | 30 | 7,973 | 0.65 | 0.59 | 334 of 615 | 37757 (-74), 37745 (-65), 38501 (-48) | 38562 (+74), 37218 (+73), 38313 (+71) |
| Chiropractic | 30 | 7,911 | 0.64 | 0.61 | 279 of 615 | 37361 (-93), 37745 (-54), 37213 (-53) | 37046 (+74), 37060 (+68), 38348 (+54) |
| Physical & occupational therapy | 30 | 36,826 | 2.73 | 0.52 | 344 of 615 | 37745 (-65), 38578 (-63), 38485 (-56) | 37023 (+77), 37419 (+71), 37060 (+70) |
| Orthopedics & sports injury | 60 | 5,602 | 0.42 | 0.72 | 241 of 615 | 37617 (-46), 37663 (-46), 37664 (-42) | 37023 (+84), 37218 (+77), 37376 (+58) |
| Heart / cardiology | 60 | 3,127 | 0.28 | 0.73 | 220 of 615 | 38375 (-49), 37806 (-45), 37871 (-42) | 37862 (+80), 37218 (+78), 37873 (+77) |
| Skin / dermatology | 60 | 939 | 0.10 | 0.78 | 173 of 615 | 37167 (-46), 37076 (-45), 37086 (-38) | 37873 (+82), 37218 (+76), 37801 (+55) |
| Allergy & immunology | 60 | 368 | 0.03 | 0.79 | 213 of 615 | 37764 (-69), 37862 (-56), 37871 (-55) | 37882 (+98), 38568 (+66), 37218 (+62) |
| Lung, breathing & sleep | 60 | 1,714 | 0.14 | 0.71 | 236 of 615 | 38556 (-100), 38575 (-100), 38582 (-100) | 38543 (+100), 37862 (+83), 37218 (+79) |
| Digestive / gastroenterology | 60 | 1,231 | 0.13 | 0.75 | 201 of 615 | 37871 (-52), 37764 (-45), 37806 (-44) | 37862 (+89), 37873 (+81), 37218 (+73) |
| Kidney / nephrology | 60 | 1,373 | 0.12 | 0.69 | 234 of 615 | 37769 (-71), 37714 (-68), 38574 (-60) | 37218 (+71), 38568 (+71), 37756 (+65) |
| Diabetes & hormones | 60 | 543 | 0.07 | 0.76 | 178 of 615 | 37771 (-34), 38002 (-34), 37934 (-33) | 37030 (+76), 38567 (+75), 38560 (+73) |
| Cancer care / oncology | 90 | 2,033 | 0.18 | 0.64 | 317 of 615 | 37806 (-69), 38053 (-68), 38002 (-67) | 37862 (+69), 37218 (+68), 37873 (+60) |
| Arthritis / rheumatology | 60 | 394 | 0.04 | 0.79 | 171 of 615 | 37806 (-48), 37938 (-44), 37721 (-43) | 37218 (+82), 37862 (+76), 37209 (+67) |
| Brain & nerves / neurology | 60 | 2,749 | 0.24 | 0.79 | 185 of 615 | 37076 (-90), 37122 (-89), 37062 (-88) | 37419 (+65), 37405 (+63), 37804 (+54) |
| Ear, nose & throat | 60 | 765 | 0.08 | 0.72 | 199 of 615 | 37328 (-46), 37342 (-38), 37871 (-37) | 37023 (+77), 37376 (+75), 37359 (+68) |
| Urology | 60 | 1,040 | 0.08 | 0.68 | 283 of 615 | 38574 (-56), 38481 (-52), 38469 (-51) | 37862 (+85), 37376 (+84), 37187 (+83) |
| Foot & ankle / podiatry | 60 | 1,447 | 0.16 | 0.67 | 163 of 615 | 38237 (-43), 38233 (-42), 38050 (-39) | 38568 (+55), 37753 (+48), 38030 (+45) |
| Pain management | 60 | 1,014 | 0.09 | 0.69 | 253 of 615 | 38574 (-46), 38344 (-45), 38387 (-44) | 37218 (+66), 37878 (+66), 38318 (+64) |
| Plastic & reconstructive surgery | 90 | 656 | 0.07 | 0.63 | 320 of 615 | 37073 (-48), 37188 (-48), 37048 (-46) | 38017 (+65), 37218 (+61), 37419 (+61) |
| Speech & language therapy | 30 | 11,872 | 0.87 | 0.62 | 274 of 615 | 37807 (-73), 37058 (-59), 37917 (-54) | 37171 (+93), 37052 (+91), 37849 (+81) |
| Nutrition & dietitian | 30 | 3,802 | 0.32 | 0.66 | 234 of 615 | 38241 (-88), 37375 (-79), 38573 (-79) | 37023 (+100), 37218 (+87), 37650 (+70) |
| Acupuncture, massage & naturopathy | 30 | 2,536 | 0.50 | 0.61 | 60 of 615 | 37097 (-72), 37375 (-42), 37738 (-39) | 38380 (+39), 37391 (+27), 38469 (+27) |
| Urgent care & emergency | 30 | 5,786 | 0.50 | 0.47 | 326 of 615 | 37375 (-82), 37869 (-75), 37317 (-69) | 37023 (+100), 38061 (+100), 38356 (+100) |
| Imaging & lab | 60 | 5,744 | 0.55 | 0.75 | 184 of 615 | 37871 (-46), 38053 (-43), 37764 (-42) | 37218 (+75), 37862 (+73), 37419 (+69) |
| Pharmacy | 30 | 26,710 | 1.68 | 0.46 | 386 of 615 | 37361 (-76), 37756 (-74), 37365 (-73) | 37852 (+77), 37732 (+72), 38392 (+72) |
| Home health & in-home care | 30 | 11,823 | 1.49 | 0.62 | 107 of 615 | 37178 (-78), 37888 (-59), 37175 (-44) | 38079 (+53), 37710 (+39), 38080 (+38) |
| Nursing & assisted living | 60 | 5,297 | 0.37 | 0.45 | 289 of 615 | 37806 (-71), 37764 (-68), 37871 (-62) | 37882 (+98), 37714 (+96), 37369 (+81) |
| Medical equipment & supplies | 60 | 5,540 | 0.34 | 0.67 | 252 of 615 | 38469 (-65), 38481 (-63), 38582 (-52) | 37218 (+68), 37730 (+67), 38568 (+62) |
| Hearing & audiology | 60 | 2,431 | 0.20 | 0.74 | 237 of 615 | 37617 (-52), 38469 (-50), 38481 (-50) | 37726 (+88), 37218 (+74), 38554 (+69) |
| Behavior therapy (ABA) | 30 | 19,476 | 2.58 | 0.69 | 114 of 615 | 37027 (-42), 37213 (-42), 37214 (-38) | 37171 (+100), 38333 (+100), 37035 (+96) |
| Care coordination & community health | 30 | 16,695 | 1.55 | 0.59 | 223 of 615 | 37871 (-66), 37721 (-61), 37862 (-59) | 38356 (+89), 38063 (+85), 38392 (+82) |
| General surgery | 60 | 4,771 | 0.39 | 0.69 | 231 of 615 | 37062 (-50), 37076 (-50), 37167 (-48) | 37862 (+83), 37873 (+76), 37863 (+67) |
| Infectious disease | 90 | 382 | 0.06 | 0.62 | 271 of 615 | 38002 (-54), 38049 (-52), 38036 (-51) | 37218 (+79), 37419 (+77), 37189 (+76) |
| Genetics & genetic counseling | 90 | 270 | 0.03 | 0.58 | 249 of 615 | 38002 (-59), 37931 (-55), 37871 (-54) | 37419 (+80), 37862 (+74), 37218 (+69) |
| Hospice & palliative care | 60 | 864 | 0.09 | 0.70 | 119 of 615 | 38481 (-46), 38452 (-41), 38469 (-41) | 38380 (+48), 38387 (+48), 37218 (+45) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 38017 | Primary care / family doctor | 6.155 | 2.873 | 36 | 70 |
| 38017 | Mental health & counseling | 4.760 | 1.875 | 67 | 87 |
| 38017 | Heart / cardiology | 0.518 | 0.261 | 8 | 54 |
| 38017 | Cancer care / oncology | 0.329 | 0.264 | 8 | 26 |
| 38017 | Urgent care & emergency | 0.329 | 0.146 | 67 | 85 |
| 38018 | Primary care / family doctor | 5.396 | 5.389 | 44 | 44 |
| 38018 | Mental health & counseling | 4.875 | 4.698 | 66 | 67 |
| 38018 | Heart / cardiology | 0.430 | 0.336 | 23 | 40 |
| 38018 | Cancer care / oncology | 0.302 | 0.298 | 15 | 16 |
| 38018 | Urgent care & emergency | 0.343 | 0.360 | 66 | 64 |
| 38103 | Primary care / family doctor | 5.047 | 5.977 | 47 | 37 |
| 38103 | Mental health & counseling | 5.095 | 6.325 | 64 | 56 |
| 38103 | Heart / cardiology | 0.328 | 0.323 | 42 | 42 |
| 38103 | Cancer care / oncology | 0.523 | 0.336 | 0 | 6 |
| 38103 | Urgent care & emergency | 0.482 | 0.586 | 52 | 41 |
| 37203 | Primary care / family doctor | 7.488 | 10.745 | 22 | 0 |
| 37203 | Mental health & counseling | 10.807 | 14.601 | 24 | 0 |
| 37203 | Heart / cardiology | 0.407 | 0.326 | 28 | 42 |
| 37203 | Cancer care / oncology | 0.344 | 0.183 | 3 | 49 |
| 37203 | Urgent care & emergency | 0.465 | 0.640 | 53 | 36 |
| 37902 | Primary care / family doctor | 8.096 | 12.046 | 15 | 0 |
| 37902 | Mental health & counseling | 11.576 | 14.476 | 19 | 0 |
| 37902 | Heart / cardiology | 0.562 | 0.477 | 0 | 15 |
| 37902 | Cancer care / oncology | 0.505 | 0.304 | 0 | 15 |
| 37902 | Urgent care & emergency | 0.619 | 0.965 | 38 | 3 |
| 37402 | Primary care / family doctor | 7.909 | 9.973 | 17 | 0 |
| 37402 | Mental health & counseling | 8.167 | 10.147 | 43 | 29 |
| 37402 | Heart / cardiology | 0.598 | 0.395 | 0 | 30 |
| 37402 | Cancer care / oncology | 0.355 | 0.187 | 0 | 48 |
| 37402 | Urgent care & emergency | 0.870 | 1.091 | 13 | 0 |
| 37683 | Primary care / family doctor | 2.463 | 4.678 | 74 | 51 |
| 37683 | Mental health & counseling | 1.781 | 2.426 | 88 | 83 |
| 37683 | Heart / cardiology | 0.038 | 0.102 | 93 | 82 |
| 37683 | Cancer care / oncology | 0.000 | 0.080 | 100 | 78 |
| 37683 | Urgent care & emergency | 0.152 | 0.334 | 85 | 66 |
| 38551 | Primary care / family doctor | 4.227 | 5.716 | 56 | 40 |
| 38551 | Mental health & counseling | 1.585 | 0.635 | 89 | 96 |
| 38551 | Heart / cardiology | 0.000 | 0.000 | 100 | 100 |
| 38551 | Cancer care / oncology | 0.000 | 0.016 | 100 | 95 |
| 38551 | Urgent care & emergency | 0.493 | 1.588 | 50 | 0 |
| 37336 | Primary care / family doctor | 3.487 | 1.367 | 64 | 86 |
| 37336 | Mental health & counseling | 2.417 | 1.371 | 83 | 90 |
| 37336 | Heart / cardiology | 0.079 | 0.050 | 86 | 91 |
| 37336 | Cancer care / oncology | 0.040 | 0.105 | 89 | 71 |
| 37336 | Urgent care & emergency | 0.211 | 0.059 | 79 | 94 |
| 38464 | Primary care / family doctor | 4.021 | 7.336 | 58 | 23 |
| 38464 | Mental health & counseling | 2.021 | 3.751 | 86 | 74 |
| 38464 | Heart / cardiology | 0.064 | 0.071 | 89 | 87 |
| 38464 | Cancer care / oncology | 0.021 | 0.049 | 94 | 86 |
| 38464 | Urgent care & emergency | 0.255 | 0.441 | 74 | 56 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 24600 rows (ZIP x specialty) stored in access_e2sfca for TN; market-score now uses drive-time access for these ZIPs.
