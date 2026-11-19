# E2SFCA access dry run: Minnesota

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,020; in Minnesota: 869
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,020 x 2,020 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 264,758; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.66 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.65), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (55605)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 55605 | yes | 6.88 | 100% | 6.88 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 35,048 | 4.78 | 0.47 | 395 of 868 | 56628 (-81), 56359 (-65), 56671 (-65) | 56546 (+100), 55941 (+96), 55609 (+91) |
| Pediatrics (children) | 30 | 6,302 | 1.13 | 0.74 | 175 of 868 | 56591 (-77), 56569 (-76), 56671 (-65) | 56310 (+71), 55941 (+67), 56547 (+66) |
| Women's health / OB-GYN | 60 | 3,790 | 0.55 | 0.74 | 302 of 868 | 55733 (-50), 55359 (-45), 56156 (-45) | 55397 (+74), 55367 (+68), 55368 (+60) |
| Mental health & counseling | 30 | 52,494 | 7.13 | 0.64 | 326 of 868 | 56671 (-63), 56591 (-54), 55063 (-52) | 56547 (+94), 56310 (+81), 56663 (+78) |
| Dental | 30 | 12,843 | 1.64 | 0.48 | 474 of 868 | 56732 (-79), 56628 (-70), 55616 (-66) | 56522 (+91), 56639 (+84), 55782 (+76) |
| Eye care | 30 | 5,353 | 0.65 | 0.45 | 490 of 868 | 56657 (-93), 56637 (-89), 56573 (-65) | 56169 (+100), 56264 (+100), 56292 (+100) |
| Chiropractic | 30 | 9,629 | 0.64 | 0.54 | 506 of 868 | 56484 (-71), 55760 (-70), 55616 (-66) | 55612 (+100), 55615 (+100), 55748 (+100) |
| Physical & occupational therapy | 30 | 24,698 | 2.73 | 0.55 | 401 of 868 | 55702 (-78), 56510 (-57), 56470 (-50) | 56546 (+100), 56565 (+100), 55941 (+89) |
| Orthopedics & sports injury | 60 | 3,771 | 0.42 | 0.67 | 344 of 868 | 56028 (-90), 56062 (-86), 56116 (-72) | 55397 (+79), 56546 (+78), 55969 (+77) |
| Heart / cardiology | 60 | 1,337 | 0.28 | 0.74 | 203 of 868 | 55733 (-73), 55797 (-57), 56116 (-56) | 56546 (+86), 56310 (+71), 56375 (+61) |
| Skin / dermatology | 60 | 617 | 0.10 | 0.80 | 273 of 868 | 56116 (-54), 56138 (-45), 56339 (-40) | 56029 (+69), 55929 (+66), 56020 (+63) |
| Allergy & immunology | 60 | 188 | 0.03 | 0.75 | 288 of 868 | 56215 (-100), 56248 (-100), 56311 (-100) | 56762 (+90), 55967 (+73), 56310 (+64) |
| Lung, breathing & sleep | 60 | 766 | 0.14 | 0.80 | 197 of 868 | 56116 (-53), 56580 (-53), 56156 (-52) | 56546 (+76), 55397 (+66), 55367 (+63) |
| Digestive / gastroenterology | 60 | 638 | 0.13 | 0.80 | 205 of 868 | 56116 (-63), 56156 (-47), 55733 (-45) | 56546 (+83), 55941 (+63), 56310 (+61) |
| Kidney / nephrology | 60 | 626 | 0.12 | 0.69 | 322 of 868 | 56142 (-53), 56386 (-53), 56255 (-51) | 56546 (+86), 56759 (+77), 56310 (+65) |
| Diabetes & hormones | 60 | 444 | 0.07 | 0.73 | 375 of 868 | 56116 (-89), 56156 (-73), 56549 (-59) | 56484 (+100), 56641 (+100), 56681 (+100) |
| Cancer care / oncology | 90 | 929 | 0.18 | 0.61 | 367 of 868 | 56116 (-60), 56580 (-60), 55797 (-58) | 55941 (+52), 56546 (+52), 55118 (+50) |
| Arthritis / rheumatology | 60 | 260 | 0.04 | 0.79 | 218 of 868 | 55733 (-98), 55797 (-78), 55779 (-76) | 56477 (+100), 56546 (+87), 56670 (+84) |
| Brain & nerves / neurology | 60 | 1,252 | 0.24 | 0.78 | 226 of 868 | 56116 (-59), 56138 (-48), 55733 (-46) | 56310 (+63), 55941 (+62), 55803 (+59) |
| Ear, nose & throat | 60 | 467 | 0.08 | 0.73 | 355 of 868 | 56116 (-70), 55733 (-68), 55797 (-59) | 56546 (+84), 55397 (+80), 55367 (+75) |
| Urology | 60 | 467 | 0.08 | 0.73 | 360 of 868 | 55733 (-85), 55797 (-63), 55779 (-58) | 56546 (+85), 55307 (+77), 55336 (+74) |
| Foot & ankle / podiatry | 60 | 750 | 0.16 | 0.68 | 298 of 868 | 56339 (-57), 56531 (-56), 55734 (-55) | 56585 (+81), 56566 (+73), 55782 (+71) |
| Pain management | 60 | 302 | 0.09 | 0.78 | 147 of 868 | 55733 (-37), 56425 (-33), 56307 (-28) | 56469 (+97), 56662 (+76), 56340 (+73) |
| Plastic & reconstructive surgery | 90 | 309 | 0.07 | 0.65 | 371 of 868 | 55797 (-49), 55780 (-45), 55720 (-44) | 56375 (+82), 56310 (+80), 56367 (+78) |
| Speech & language therapy | 30 | 6,779 | 0.87 | 0.65 | 366 of 868 | 56650 (-89), 56686 (-77), 56575 (-58) | 56536 (+100), 56744 (+94), 56723 (+91) |
| Nutrition & dietitian | 30 | 2,951 | 0.32 | 0.57 | 410 of 868 | 56628 (-81), 55720 (-63), 56131 (-62) | 55941 (+100), 55947 (+100), 56292 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,287 | 0.50 | 0.77 | 242 of 868 | 56131 (-75), 56579 (-72), 56044 (-70) | 56444 (+74), 56449 (+73), 56450 (+65) |
| Urgent care & emergency | 30 | 3,422 | 0.50 | 0.47 | 404 of 868 | 55724 (-96), 56183 (-66), 55092 (-65) | 55803 (+100), 56214 (+100), 56546 (+100) |
| Imaging & lab | 60 | 3,561 | 0.55 | 0.74 | 282 of 868 | 56116 (-71), 56156 (-59), 55306 (-56) | 56681 (+99), 55765 (+87), 56585 (+87) |
| Pharmacy | 30 | 12,631 | 1.68 | 0.34 | 468 of 868 | 55616 (-62), 56183 (-62), 56628 (-60) | 56546 (+100), 56634 (+100), 56639 (+100) |
| Home health & in-home care | 30 | 8,689 | 1.49 | 0.64 | 240 of 868 | 56245 (-78), 55725 (-75), 56634 (-69) | 56568 (+100), 56750 (+100), 56736 (+98) |
| Nursing & assisted living | 60 | 4,401 | 0.37 | 0.48 | 407 of 868 | 56657 (-53), 55775 (-51), 56628 (-51) | 55603 (+100), 55607 (+100), 55613 (+100) |
| Medical equipment & supplies | 60 | 2,261 | 0.34 | 0.71 | 250 of 868 | 56572 (-47), 56297 (-45), 56531 (-45) | 56153 (+53), 56569 (+53), 55785 (+48) |
| Hearing & audiology | 60 | 1,880 | 0.20 | 0.73 | 400 of 868 | 56255 (-100), 56285 (-100), 56062 (-91) | 56546 (+87), 55785 (+84), 55703 (+77) |
| Behavior therapy (ABA) | 30 | 20,599 | 2.58 | 0.77 | 224 of 868 | 56569 (-74), 56591 (-67), 56228 (-62) | 55703 (+100), 55705 (+100), 55706 (+100) |
| Care coordination & community health | 30 | 6,815 | 1.55 | 0.54 | 130 of 868 | 56626 (-84), 55711 (-82), 56569 (-51) | 56546 (+100), 56547 (+97), 56723 (+94) |
| General surgery | 60 | 2,236 | 0.39 | 0.69 | 324 of 868 | 55733 (-66), 55797 (-51), 55925 (-45) | 56546 (+88), 56310 (+72), 56662 (+61) |
| Infectious disease | 90 | 255 | 0.06 | 0.60 | 311 of 868 | 56116 (-72), 56138 (-68), 56156 (-65) | 56546 (+62), 55118 (+54), 55120 (+54) |
| Genetics & genetic counseling | 90 | 341 | 0.03 | 0.63 | 327 of 868 | 55301 (-100), 55341 (-100), 55376 (-100) | 55973 (+89), 56710 (+77), 56722 (+76) |
| Hospice & palliative care | 60 | 473 | 0.09 | 0.74 | 354 of 868 | 56111 (-82), 56255 (-67), 56309 (-59) | 56629 (+100), 55712 (+97), 56522 (+82) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
