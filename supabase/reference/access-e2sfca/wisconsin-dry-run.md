# E2SFCA access dry run: Wisconsin

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,267; in Wisconsin: 770
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,267 x 2,267 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 593,333; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.75 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.89), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (46304, 46403, 54246, 55605)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 46304 | no | 19.27 | 100% | 19.27 | 100% | no |
| 46403 | no | 35.34 | 100% | 35.34 | 100% | no |
| 49840 | no | 9.21 | 100% | 4.25 | 100% | yes (2.94) |
| 54246 | yes | 8.72 | 100% | 8.72 | 100% | no |
| 55605 | no | 6.94 | 100% | 6.94 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 82,175 | 4.78 | 0.44 | 386 of 769 | 54138 (-80), 54850 (-56), 54024 (-54) | 54658 (+100), 54621 (+99), 54653 (+97) |
| Pediatrics (children) | 30 | 19,372 | 1.13 | 0.64 | 149 of 769 | 54170 (-70), 54850 (-70), 54104 (-40) | 54446 (+100), 54489 (+98), 54436 (+97) |
| Women's health / OB-GYN | 60 | 9,651 | 0.55 | 0.73 | 192 of 769 | 54454 (-42), 54443 (-40), 54758 (-35) | 54850 (+89), 54466 (+61), 54546 (+52) |
| Mental health & counseling | 30 | 127,923 | 7.13 | 0.55 | 285 of 769 | 54538 (-59), 54403 (-51), 54170 (-48) | 54854 (+100), 54864 (+94), 54874 (+86) |
| Dental | 30 | 31,684 | 1.64 | 0.45 | 427 of 769 | 54416 (-61), 54138 (-59), 54820 (-58) | 54557 (+100), 54854 (+100), 54512 (+96) |
| Eye care | 30 | 11,917 | 0.65 | 0.48 | 419 of 769 | 54520 (-65), 54024 (-52), 54773 (-50) | 54559 (+100), 54770 (+99), 54621 (+98) |
| Chiropractic | 30 | 17,266 | 0.64 | 0.31 | 483 of 769 | 54465 (-61), 54876 (-54), 54986 (-54) | 53801 (+100), 53951 (+100), 54121 (+100) |
| Physical & occupational therapy | 30 | 59,599 | 2.73 | 0.47 | 483 of 769 | 54024 (-55), 54234 (-51), 54923 (-48) | 54628 (+97), 54844 (+97), 54539 (+94) |
| Orthopedics & sports injury | 60 | 8,160 | 0.42 | 0.71 | 354 of 769 | 54880 (-69), 54619 (-60), 54123 (-59) | 54466 (+76), 54629 (+75), 54545 (+67) |
| Heart / cardiology | 60 | 4,434 | 0.28 | 0.76 | 201 of 769 | 54443 (-100), 54454 (-100), 54488 (-67) | 54854 (+88), 54411 (+72), 54466 (+68) |
| Skin / dermatology | 60 | 1,797 | 0.10 | 0.77 | 287 of 769 | 54454 (-91), 54443 (-74), 54488 (-57) | 54466 (+72), 53515 (+65), 54411 (+63) |
| Allergy & immunology | 60 | 601 | 0.03 | 0.77 | 236 of 769 | 54454 (-100), 54443 (-97), 54488 (-71) | 54466 (+66), 53587 (+62), 54229 (+61) |
| Lung, breathing & sleep | 60 | 2,014 | 0.14 | 0.73 | 259 of 769 | 53950 (-62), 54651 (-48), 53590 (-47) | 53506 (+72), 53543 (+70), 53569 (+69) |
| Digestive / gastroenterology | 60 | 2,087 | 0.13 | 0.77 | 257 of 769 | 54443 (-84), 54454 (-63), 54421 (-56) | 54814 (+97), 54546 (+82), 54844 (+77) |
| Kidney / nephrology | 60 | 1,868 | 0.12 | 0.65 | 273 of 769 | 54454 (-91), 54443 (-89), 54421 (-56) | 54854 (+89), 54466 (+71), 53587 (+66) |
| Diabetes & hormones | 60 | 1,183 | 0.07 | 0.74 | 311 of 769 | 54454 (-86), 54443 (-83), 53529 (-71) | 54557 (+100), 54466 (+68), 53587 (+66) |
| Cancer care / oncology | 90 | 3,000 | 0.18 | 0.56 | 416 of 769 | 54454 (-56), 53149 (-54), 54443 (-53) | 54466 (+73), 54209 (+70), 54235 (+67) |
| Arthritis / rheumatology | 60 | 724 | 0.04 | 0.72 | 320 of 769 | 54443 (-100), 54454 (-100), 54880 (-84) | 53587 (+71), 54853 (+71), 53599 (+70) |
| Brain & nerves / neurology | 60 | 3,956 | 0.24 | 0.80 | 186 of 769 | 54454 (-71), 54443 (-68), 54644 (-55) | 54466 (+74), 54446 (+46), 54755 (+46) |
| Ear, nose & throat | 60 | 1,313 | 0.08 | 0.78 | 269 of 769 | 54443 (-64), 54454 (-62), 53149 (-60) | 54814 (+100), 54844 (+99), 54722 (+79) |
| Urology | 60 | 1,423 | 0.08 | 0.71 | 291 of 769 | 54123 (-53), 53103 (-43), 53149 (-42) | 54213 (+93), 54854 (+89), 54201 (+88) |
| Foot & ankle / podiatry | 60 | 3,092 | 0.16 | 0.66 | 254 of 769 | 54499 (-56), 54644 (-47), 54619 (-43) | 54557 (+100), 54854 (+94), 54529 (+81) |
| Pain management | 60 | 1,240 | 0.09 | 0.76 | 171 of 769 | 54805 (-69), 54829 (-67), 54733 (-53) | 54125 (+100), 54511 (+100), 53003 (+65) |
| Plastic & reconstructive surgery | 90 | 1,040 | 0.07 | 0.64 | 380 of 769 | 53551 (-52), 53076 (-49), 53086 (-46) | 54213 (+69), 54854 (+67), 53560 (+65) |
| Speech & language therapy | 30 | 16,757 | 0.87 | 0.55 | 402 of 769 | 54568 (-58), 54629 (-55), 54121 (-54) | 53508 (+78), 53515 (+65), 53517 (+65) |
| Nutrition & dietitian | 30 | 6,567 | 0.32 | 0.57 | 424 of 769 | 54840 (-74), 54756 (-65), 54416 (-60) | 54121 (+100), 54151 (+100), 54621 (+100) |
| Acupuncture, massage & naturopathy | 30 | 6,322 | 0.50 | 0.58 | 250 of 769 | 54138 (-73), 54534 (-66), 54829 (-65) | 54770 (+63), 54644 (+58), 54628 (+54) |
| Urgent care & emergency | 30 | 8,615 | 0.50 | 0.43 | 386 of 769 | 54465 (-90), 54773 (-66), 53934 (-65) | 53827 (+100), 54004 (+100), 54512 (+100) |
| Imaging & lab | 60 | 10,252 | 0.55 | 0.73 | 209 of 769 | 54454 (-81), 54443 (-75), 54488 (-66) | 54466 (+67), 54755 (+50), 54229 (+49) |
| Pharmacy | 30 | 27,739 | 1.68 | 0.43 | 395 of 769 | 54138 (-78), 53533 (-44), 54456 (-41) | 54151 (+80), 54854 (+72), 53587 (+69) |
| Home health & in-home care | 30 | 13,947 | 1.49 | 0.60 | 95 of 769 | 54773 (-67), 54174 (-58), 54760 (-52) | 53051 (+39), 53097 (+38), 54121 (+37) |
| Nursing & assisted living | 60 | 6,859 | 0.37 | 0.51 | 345 of 769 | 53027 (-65), 53033 (-55), 54627 (-54) | 54896 (+99), 53810 (+79), 53806 (+76) |
| Medical equipment & supplies | 60 | 6,032 | 0.34 | 0.71 | 273 of 769 | 54443 (-55), 54454 (-54), 54519 (-38) | 54896 (+94), 54766 (+74), 54466 (+73) |
| Hearing & audiology | 60 | 3,862 | 0.20 | 0.65 | 370 of 769 | 54555 (-64), 53023 (-62), 53091 (-61) | 54814 (+97), 54546 (+82), 54844 (+77) |
| Behavior therapy (ABA) | 30 | 33,705 | 2.58 | 0.74 | 44 of 769 | 54125 (-42), 54614 (-35), 54940 (-30) | 54625 (+100), 54629 (+100), 54630 (+100) |
| Care coordination & community health | 30 | 16,782 | 1.55 | 0.52 | 241 of 769 | 54559 (-86), 54844 (-82), 54861 (-78) | 54644 (+100), 54156 (+90), 54534 (+86) |
| General surgery | 60 | 6,346 | 0.39 | 0.63 | 279 of 769 | 54443 (-82), 54454 (-73), 54619 (-69) | 54466 (+71), 54411 (+66), 54452 (+61) |
| Infectious disease | 90 | 913 | 0.06 | 0.62 | 385 of 769 | 53038 (-54), 53076 (-48), 53551 (-48) | 54466 (+71), 54446 (+64), 54489 (+64) |
| Genetics & genetic counseling | 90 | 745 | 0.03 | 0.58 | 440 of 769 | 53038 (-100), 53066 (-100), 53094 (-100) | 54655 (+73), 54628 (+65), 54229 (+57) |
| Hospice & palliative care | 60 | 1,001 | 0.09 | 0.70 | 258 of 769 | 54454 (-49), 54758 (-42), 53023 (-41) | 54557 (+86), 54013 (+77), 54473 (+75) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
