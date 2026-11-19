# E2SFCA access dry run: Washington

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 907; in Washington: 589
- Drive times: OSRM on OpenStreetMap roads (car profile), 907 x 907 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 1
- Listings read: 358,513; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.42 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.54), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 7 (83808, 97842, 98281, 98297, 98342, 98346, 98816)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83808 | no | 9.88 | 100% | 9.88 | 100% | no |
| 97842 | no | 9.86 | 100% | 9.86 | 100% | no |
| 98281 | yes | none | 0% | none | 0% | no |
| 98297 | yes | 19.62 | 58% | 19.62 | 58% | no |
| 98342 | yes | 10.23 | 100% | 10.23 | 100% | no |
| 98346 | yes | 8.91 | 100% | 8.91 | 100% | no |
| 98560 | yes | 8.59 | 100% | 4.76 | 100% | yes (1.41) |
| 98603 | yes | 9.97 | 100% | 2.90 | 100% | yes (4.10) |
| 98816 | yes | 8.59 | 100% | 8.59 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 38,853 | 4.78 | 0.46 | 359 of 584 | 99040 (-77), 99160 (-68), 98350 (-61) | 98936 (+71), 98849 (+66), 98320 (+65) |
| Pediatrics (children) | 30 | 8,713 | 1.13 | 0.70 | 230 of 584 | 98946 (-89), 98830 (-85), 98274 (-62) | 99022 (+78), 99011 (+66), 98106 (+58) |
| Women's health / OB-GYN | 60 | 6,747 | 0.55 | 0.62 | 279 of 584 | 98610 (-57), 98617 (-56), 99129 (-52) | 99126 (+100), 99139 (+100), 99152 (+100) |
| Mental health & counseling | 30 | 98,658 | 7.13 | 0.60 | 342 of 584 | 99040 (-79), 98852 (-63), 98350 (-55) | 98295 (+100), 99126 (+100), 99139 (+100) |
| Dental | 30 | 18,981 | 1.64 | 0.59 | 395 of 584 | 98590 (-85), 98356 (-80), 98587 (-65) | 98819 (+91), 98376 (+83), 98351 (+81) |
| Eye care | 30 | 5,574 | 0.65 | 0.52 | 344 of 584 | 98356 (-67), 98812 (-67), 99109 (-62) | 98320 (+85), 98376 (+84), 98840 (+81) |
| Chiropractic | 30 | 7,765 | 0.64 | 0.53 | 395 of 584 | 98590 (-80), 99115 (-80), 99133 (-80) | 98262 (+100), 98220 (+97), 98320 (+97) |
| Physical & occupational therapy | 30 | 25,003 | 2.73 | 0.63 | 349 of 584 | 99133 (-79), 98356 (-63), 99169 (-47) | 99161 (+76), 98833 (+71), 99125 (+68) |
| Orthopedics & sports injury | 60 | 3,221 | 0.42 | 0.69 | 229 of 577 | 98267 (-59), 99130 (-57), 98862 (-52) | 99017 (+97), 98833 (+94), 99032 (+88) |
| Heart / cardiology | 60 | 1,773 | 0.28 | 0.78 | 202 of 584 | 98832 (-48), 98057 (-47), 98188 (-43) | 98584 (+87), 98351 (+81), 99011 (+69) |
| Skin / dermatology | 60 | 824 | 0.10 | 0.78 | 224 of 577 | 99403 (-65), 98057 (-52), 98032 (-50) | 98351 (+98), 98376 (+85), 98584 (+85) |
| Allergy & immunology | 60 | 207 | 0.03 | 0.77 | 218 of 577 | 98057 (-55), 99403 (-52), 98037 (-51) | 98320 (+100), 98650 (+96), 98605 (+87) |
| Lung, breathing & sleep | 60 | 1,210 | 0.14 | 0.76 | 173 of 577 | 98057 (-73), 98032 (-69), 98188 (-69) | 99328 (+93), 98647 (+81), 99022 (+72) |
| Digestive / gastroenterology | 60 | 1,019 | 0.13 | 0.76 | 238 of 577 | 98812 (-66), 98057 (-59), 98188 (-52) | 98351 (+86), 98584 (+84), 98110 (+79) |
| Kidney / nephrology | 60 | 812 | 0.12 | 0.74 | 215 of 577 | 98032 (-42), 98433 (-39), 99114 (-39) | 98351 (+87), 98333 (+72), 98647 (+71) |
| Diabetes & hormones | 60 | 488 | 0.07 | 0.74 | 216 of 577 | 98057 (-52), 98188 (-45), 98032 (-44) | 99328 (+84), 98643 (+83), 98110 (+68) |
| Cancer care / oncology | 90 | 1,677 | 0.18 | 0.70 | 267 of 577 | 98057 (-77), 98032 (-76), 98188 (-76) | 99401 (+96), 99402 (+92), 98647 (+53) |
| Arthritis / rheumatology | 60 | 357 | 0.04 | 0.80 | 206 of 577 | 98148 (-69), 98166 (-59), 98188 (-59) | 98856 (+100), 98110 (+77), 98295 (+77) |
| Brain & nerves / neurology | 60 | 1,825 | 0.24 | 0.81 | 192 of 577 | 98057 (-58), 98188 (-55), 98032 (-53) | 98351 (+92), 98110 (+72), 99011 (+66) |
| Ear, nose & throat | 60 | 686 | 0.08 | 0.74 | 218 of 577 | 98057 (-73), 98166 (-61), 98331 (-61) | 98237 (+100), 98350 (+100), 98526 (+99) |
| Urology | 60 | 647 | 0.08 | 0.71 | 256 of 577 | 98365 (-60), 98057 (-57), 98188 (-54) | 98363 (+100), 98613 (+100), 98351 (+95) |
| Foot & ankle / podiatry | 60 | 1,047 | 0.16 | 0.63 | 192 of 577 | 98022 (-53), 98542 (-32), 98057 (-30) | 99125 (+95), 99143 (+89), 98237 (+88) |
| Pain management | 60 | 578 | 0.09 | 0.80 | 155 of 577 | 99403 (-46), 98057 (-40), 98934 (-38) | 99401 (+92), 99402 (+88), 99350 (+86) |
| Plastic & reconstructive surgery | 90 | 514 | 0.07 | 0.77 | 244 of 577 | 98027 (-46), 98057 (-44), 98932 (-44) | 98110 (+64), 99022 (+62), 98952 (+60) |
| Speech & language therapy | 30 | 6,682 | 0.87 | 0.53 | 304 of 584 | 98635 (-79), 98902 (-61), 99326 (-60) | 99335 (+78), 98068 (+69), 98288 (+66) |
| Nutrition & dietitian | 30 | 3,739 | 0.32 | 0.58 | 324 of 584 | 98858 (-86), 98245 (-79), 98587 (-73) | 98811 (+100), 98828 (+100), 98833 (+100) |
| Acupuncture, massage & naturopathy | 30 | 26,748 | 0.50 | 0.30 | 207 of 584 | 99138 (-52), 99129 (-47), 99018 (-38) | 98068 (+100), 98220 (+100), 98224 (+100) |
| Urgent care & emergency | 30 | 3,553 | 0.50 | 0.29 | 355 of 584 | 98587 (-91), 99138 (-76), 98948 (-70) | 98350 (+100), 98526 (+100), 98813 (+100) |
| Imaging & lab | 60 | 4,349 | 0.55 | 0.76 | 205 of 584 | 99138 (-78), 99155 (-64), 98057 (-55) | 98110 (+75), 99328 (+72), 99140 (+67) |
| Pharmacy | 30 | 16,088 | 1.68 | 0.54 | 364 of 584 | 99040 (-74), 98587 (-64), 98948 (-58) | 98952 (+82), 98811 (+81), 98847 (+81) |
| Home health & in-home care | 30 | 5,641 | 1.49 | 0.54 | 112 of 584 | 98256 (-92), 98550 (-74), 99138 (-68) | 99119 (+100), 99126 (+100), 99139 (+100) |
| Nursing & assisted living | 60 | 3,385 | 0.37 | 0.54 | 300 of 584 | 99110 (-58), 98542 (-51), 99014 (-51) | 98587 (+100), 99034 (+100), 99126 (+100) |
| Medical equipment & supplies | 60 | 2,268 | 0.34 | 0.64 | 192 of 577 | 98822 (-74), 98856 (-54), 98548 (-53) | 99125 (+95), 99401 (+92), 99143 (+90) |
| Hearing & audiology | 60 | 1,942 | 0.20 | 0.67 | 289 of 584 | 98934 (-55), 99150 (-52), 99118 (-48) | 98320 (+100), 98351 (+97), 99328 (+93) |
| Behavior therapy (ABA) | 30 | 17,404 | 2.58 | 0.77 | 195 of 584 | 98833 (-81), 98950 (-81), 98277 (-43) | 98261 (+100), 98303 (+100), 98351 (+100) |
| Care coordination & community health | 30 | 17,888 | 1.55 | 0.54 | 299 of 584 | 98350 (-90), 99040 (-84), 99138 (-77) | 98613 (+100), 98635 (+100), 98643 (+100) |
| General surgery | 60 | 3,367 | 0.39 | 0.67 | 277 of 584 | 98057 (-58), 98188 (-49), 98055 (-47) | 98237 (+96), 98643 (+86), 98255 (+79) |
| Infectious disease | 90 | 431 | 0.06 | 0.68 | 218 of 577 | 98027 (-72), 98029 (-70), 98057 (-70) | 98255 (+60), 98351 (+58), 98584 (+56) |
| Genetics & genetic counseling | 90 | 377 | 0.03 | 0.72 | 280 of 577 | 98201 (-100), 98203 (-100), 99115 (-100) | 99140 (+100), 99155 (+98), 98541 (+87) |
| Hospice & palliative care | 60 | 502 | 0.09 | 0.70 | 167 of 577 | 99116 (-75), 99124 (-61), 99403 (-53) | 98855 (+100), 98952 (+100), 98605 (+97) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
