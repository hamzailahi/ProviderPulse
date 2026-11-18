# E2SFCA access dry run: Oklahoma

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,716; in Oklahoma: 643
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,716 x 1,716 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 352,289; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.66 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.65), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 1; still implausible (left out of the rank comparison, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 71061 | no | 6.72 | 100% | 6.46 | 100% | no |
| 71082 | no | 7.59 | 100% | 4.35 | 100% | yes (3.37) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 49,114 | 4.78 | 0.37 | 371 of 643 | 73565 (-72), 73858 (-69), 73932 (-65) | 74558 (+94), 74871 (+90), 74549 (+87) |
| Pediatrics (children) | 30 | 9,440 | 1.13 | 0.69 | 171 of 643 | 73722 (-81), 74571 (-58), 73669 (-53) | 73084 (+72), 73130 (+58), 73097 (+54) |
| Women's health / OB-GYN | 60 | 5,456 | 0.55 | 0.69 | 238 of 643 | 73835 (-82), 73855 (-47), 74572 (-46) | 74558 (+90), 74549 (+87), 74640 (+62) |
| Mental health & counseling | 30 | 70,253 | 7.13 | 0.58 | 368 of 643 | 74745 (-57), 74955 (-55), 73860 (-52) | 74369 (+100), 74442 (+100), 74530 (+100) |
| Dental | 30 | 18,136 | 1.64 | 0.52 | 374 of 643 | 73663 (-81), 74650 (-73), 73554 (-69) | 73006 (+92), 73552 (+80), 73527 (+69) |
| Eye care | 30 | 7,040 | 0.65 | 0.49 | 379 of 643 | 73932 (-70), 74571 (-63), 73737 (-62) | 74352 (+98), 73719 (+90), 74359 (+85) |
| Chiropractic | 30 | 8,161 | 0.64 | 0.53 | 351 of 643 | 73573 (-70), 73033 (-68), 74536 (-60) | 73007 (+74), 73842 (+69), 73860 (+64) |
| Physical & occupational therapy | 30 | 27,656 | 2.73 | 0.56 | 311 of 643 | 73673 (-71), 73646 (-59), 73446 (-54) | 74442 (+67), 74565 (+67), 73447 (+64) |
| Orthopedics & sports injury | 60 | 4,174 | 0.42 | 0.76 | 269 of 643 | 74832 (-50), 73150 (-45), 74467 (-45) | 73949 (+100), 73947 (+74), 73058 (+60) |
| Heart / cardiology | 60 | 2,350 | 0.28 | 0.78 | 206 of 643 | 73099 (-53), 73049 (-46), 73064 (-46) | 74422 (+67), 74468 (+67), 74640 (+64) |
| Skin / dermatology | 60 | 932 | 0.10 | 0.80 | 213 of 643 | 73150 (-48), 74063 (-42), 74055 (-40) | 73528 (+65), 74932 (+62), 74468 (+61) |
| Allergy & immunology | 60 | 305 | 0.03 | 0.74 | 194 of 643 | 73720 (-58), 74130 (-55), 73768 (-54) | 74083 (+74), 73084 (+64), 74833 (+63) |
| Lung, breathing & sleep | 60 | 1,341 | 0.14 | 0.79 | 216 of 643 | 74536 (-100), 74935 (-100), 74578 (-77) | 74558 (+100), 74423 (+74), 73439 (+71) |
| Digestive / gastroenterology | 60 | 1,046 | 0.13 | 0.77 | 193 of 643 | 73170 (-46), 74066 (-45), 73065 (-44) | 74426 (+71), 74640 (+69), 74363 (+65) |
| Kidney / nephrology | 60 | 1,190 | 0.12 | 0.77 | 266 of 643 | 73566 (-47), 73065 (-46), 73559 (-44) | 73439 (+91), 73433 (+71), 73722 (+71) |
| Diabetes & hormones | 60 | 523 | 0.07 | 0.70 | 274 of 643 | 74935 (-95), 74536 (-72), 74830 (-70) | 73722 (+100), 74558 (+100), 74549 (+81) |
| Cancer care / oncology | 90 | 1,316 | 0.18 | 0.60 | 310 of 643 | 73049 (-54), 73028 (-51), 74834 (-51) | 74426 (+75), 74468 (+74), 74428 (+72) |
| Arthritis / rheumatology | 60 | 389 | 0.04 | 0.74 | 163 of 643 | 73150 (-75), 73066 (-70), 73531 (-69) | 73442 (+79), 73434 (+76), 74422 (+64) |
| Brain & nerves / neurology | 60 | 3,017 | 0.24 | 0.77 | 160 of 643 | 74055 (-85), 74015 (-82), 74063 (-78) | 73528 (+48), 74902 (+45), 74640 (+39) |
| Ear, nose & throat | 60 | 630 | 0.08 | 0.77 | 263 of 643 | 74467 (-61), 73099 (-56), 73150 (-56) | 73528 (+62), 74422 (+62), 74468 (+62) |
| Urology | 60 | 674 | 0.08 | 0.74 | 250 of 643 | 73170 (-65), 73065 (-62), 73099 (-62) | 74640 (+72), 73628 (+70), 73641 (+63) |
| Foot & ankle / podiatry | 60 | 1,210 | 0.16 | 0.73 | 218 of 643 | 73859 (-48), 74935 (-44), 74467 (-41) | 74558 (+100), 74549 (+92), 73625 (+78) |
| Pain management | 60 | 1,330 | 0.09 | 0.78 | 254 of 643 | 73446 (-77), 74055 (-70), 74467 (-66) | 74640 (+68), 73641 (+66), 73628 (+64) |
| Plastic & reconstructive surgery | 90 | 734 | 0.07 | 0.68 | 287 of 643 | 74834 (-65), 73150 (-61), 74026 (-60) | 74932 (+73), 74363 (+70), 74902 (+66) |
| Speech & language therapy | 30 | 12,462 | 0.87 | 0.60 | 352 of 643 | 74831 (-84), 73722 (-81), 73669 (-74) | 73659 (+88), 73002 (+85), 73011 (+82) |
| Nutrition & dietitian | 30 | 3,570 | 0.32 | 0.65 | 321 of 643 | 73664 (-84), 73645 (-83), 74643 (-79) | 74423 (+100), 74549 (+100), 74558 (+100) |
| Acupuncture, massage & naturopathy | 30 | 1,939 | 0.50 | 0.64 | 71 of 643 | 73729 (-83), 73663 (-80), 73048 (-56) | 74871 (+28), 74442 (+27), 74565 (+27) |
| Urgent care & emergency | 30 | 5,486 | 0.50 | 0.43 | 391 of 643 | 74650 (-76), 74637 (-70), 73043 (-63) | 73642 (+100), 73658 (+100), 73667 (+100) |
| Imaging & lab | 60 | 5,754 | 0.55 | 0.77 | 214 of 643 | 73150 (-51), 74055 (-47), 73049 (-46) | 74738 (+58), 74640 (+53), 73733 (+51) |
| Pharmacy | 30 | 17,203 | 1.68 | 0.31 | 392 of 643 | 74536 (-70), 74567 (-65), 74650 (-60) | 74549 (+100), 74558 (+100), 74574 (+100) |
| Home health & in-home care | 30 | 9,504 | 1.49 | 0.54 | 169 of 643 | 73554 (-65), 74352 (-56), 73018 (-52) | 74557 (+100), 74569 (+96), 74931 (+82) |
| Nursing & assisted living | 60 | 4,045 | 0.37 | 0.51 | 291 of 643 | 74350 (-54), 73559 (-51), 73937 (-49) | 73949 (+100), 73625 (+94), 73734 (+86) |
| Medical equipment & supplies | 60 | 4,908 | 0.34 | 0.64 | 319 of 643 | 74951 (-66), 73559 (-61), 74932 (-60) | 73844 (+100), 73625 (+94), 74558 (+77) |
| Hearing & audiology | 60 | 2,113 | 0.20 | 0.75 | 295 of 643 | 73768 (-76), 74630 (-67), 73720 (-59) | 73716 (+85), 73726 (+84), 73724 (+80) |
| Behavior therapy (ABA) | 30 | 20,348 | 2.58 | 0.65 | 185 of 643 | 73569 (-95), 73501 (-53), 73096 (-45) | 73447 (+100), 73458 (+100), 73463 (+100) |
| Care coordination & community health | 30 | 23,812 | 1.55 | 0.44 | 321 of 643 | 73844 (-87), 73642 (-75), 73759 (-68) | 73024 (+100), 73048 (+100), 73092 (+100) |
| General surgery | 60 | 4,229 | 0.39 | 0.71 | 241 of 643 | 74055 (-53), 74066 (-49), 74015 (-42) | 73084 (+50), 73130 (+47), 74640 (+47) |
| Infectious disease | 90 | 411 | 0.06 | 0.67 | 249 of 643 | 73018 (-44), 73099 (-44), 73064 (-43) | 74127 (+61), 74131 (+60), 74106 (+59) |
| Genetics & genetic counseling | 90 | 211 | 0.03 | 0.59 | 163 of 643 | 74347 (-80), 74359 (-67), 74364 (-62) | 74964 (+58), 73084 (+44), 73097 (+43) |
| Hospice & palliative care | 60 | 1,391 | 0.09 | 0.68 | 344 of 643 | 74761 (-81), 74066 (-66), 74553 (-65) | 73844 (+100), 73092 (+92), 73625 (+91) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 73102 | Primary care / family doctor | 7.882 | 9.956 | 18 | 0 |
| 73102 | Mental health & counseling | 18.273 | 22.668 | 0 | 0 |
| 73102 | Heart / cardiology | 0.657 | 0.431 | 0 | 23 |
| 73102 | Cancer care / oncology | 0.379 | 0.228 | 0 | 36 |
| 73102 | Urgent care & emergency | 0.793 | 0.962 | 20 | 3 |
| 74103 | Primary care / family doctor | 7.381 | 6.665 | 23 | 30 |
| 74103 | Mental health & counseling | 19.481 | 16.085 | 0 | 0 |
| 74103 | Heart / cardiology | 0.539 | 0.281 | 4 | 50 |
| 74103 | Cancer care / oncology | 0.334 | 0.164 | 6 | 54 |
| 74103 | Urgent care & emergency | 1.221 | 1.131 | 0 | 0 |
| 73505 | Primary care / family doctor | 5.100 | 7.841 | 47 | 18 |
| 73505 | Mental health & counseling | 10.908 | 12.944 | 24 | 9 |
| 73505 | Heart / cardiology | 0.160 | 0.173 | 72 | 69 |
| 73505 | Cancer care / oncology | 0.137 | 0.096 | 61 | 73 |
| 73505 | Urgent care & emergency | 1.155 | 1.653 | 0 | 0 |
| 74801 | Primary care / family doctor | 2.871 | 3.397 | 70 | 64 |
| 74801 | Mental health & counseling | 7.340 | 12.047 | 49 | 16 |
| 74801 | Heart / cardiology | 0.048 | 0.089 | 91 | 84 |
| 74801 | Cancer care / oncology | 0.048 | 0.131 | 86 | 63 |
| 74801 | Urgent care & emergency | 0.242 | 0.351 | 76 | 65 |
| 73701 | Primary care / family doctor | 4.424 | 5.336 | 54 | 44 |
| 73701 | Mental health & counseling | 10.450 | 12.416 | 27 | 13 |
| 73701 | Heart / cardiology | 0.316 | 0.296 | 44 | 47 |
| 73701 | Cancer care / oncology | 0.158 | 0.099 | 56 | 72 |
| 73701 | Urgent care & emergency | 0.361 | 0.463 | 64 | 53 |
| 74501 | Primary care / family doctor | 4.962 | 6.265 | 48 | 34 |
| 74501 | Mental health & counseling | 20.567 | 24.435 | 0 | 0 |
| 74501 | Heart / cardiology | 0.068 | 0.073 | 88 | 87 |
| 74501 | Cancer care / oncology | 0.103 | 0.056 | 71 | 84 |
| 74501 | Urgent care & emergency | 0.411 | 0.529 | 59 | 47 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 25720 rows (ZIP x specialty) stored in access_e2sfca for OK; market-score now uses drive-time access for these ZIPs.
