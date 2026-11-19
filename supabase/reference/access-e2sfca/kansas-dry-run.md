# E2SFCA access dry run: Kansas

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,552; in Kansas: 686
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,552 x 1,552 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 179,196; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.67 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.68), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 24,137 | 4.78 | 0.36 | 421 of 686 | 67663 (-60), 66834 (-59), 67029 (-53) | 67840 (+90), 67753 (+81), 67747 (+80) |
| Pediatrics (children) | 30 | 4,531 | 1.13 | 0.75 | 96 of 686 | 67954 (-92), 67061 (-85), 66112 (-57) | 67232 (+57), 66539 (+49), 67228 (+46) |
| Women's health / OB-GYN | 60 | 2,483 | 0.55 | 0.81 | 194 of 686 | 67831 (-49), 67061 (-47), 66109 (-38) | 67487 (+49), 67232 (+48), 66066 (+47) |
| Mental health & counseling | 30 | 34,768 | 7.13 | 0.60 | 283 of 686 | 67061 (-83), 67054 (-62), 66544 (-54) | 66066 (+70), 66539 (+70), 67556 (+68) |
| Dental | 30 | 7,544 | 1.64 | 0.50 | 381 of 686 | 67657 (-73), 67632 (-69), 67361 (-57) | 67487 (+96), 67862 (+81), 66531 (+80) |
| Eye care | 30 | 3,407 | 0.65 | 0.40 | 454 of 686 | 67547 (-65), 67625 (-63), 67560 (-59) | 66960 (+100), 67732 (+100), 67733 (+100) |
| Chiropractic | 30 | 5,075 | 0.64 | 0.29 | 489 of 686 | 67834 (-66), 67547 (-64), 67864 (-58) | 66079 (+100), 66401 (+100), 66520 (+100) |
| Physical & occupational therapy | 30 | 15,770 | 2.73 | 0.56 | 426 of 686 | 67870 (-71), 66953 (-53), 67070 (-53) | 66094 (+95), 66402 (+88), 66424 (+87) |
| Orthopedics & sports injury | 60 | 2,269 | 0.42 | 0.74 | 301 of 686 | 67010 (-70), 66407 (-57), 67110 (-57) | 67556 (+100), 67950 (+81), 66023 (+78) |
| Heart / cardiology | 60 | 1,169 | 0.28 | 0.77 | 195 of 686 | 67663 (-50), 66109 (-49), 67235 (-47) | 67556 (+100), 66539 (+62), 66618 (+59) |
| Skin / dermatology | 60 | 335 | 0.10 | 0.78 | 152 of 686 | 66526 (-47), 67877 (-42), 66109 (-41) | 67648 (+85), 66533 (+69), 67556 (+66) |
| Allergy & immunology | 60 | 127 | 0.03 | 0.75 | 170 of 686 | 67757 (-82), 66109 (-76), 66226 (-76) | 66097 (+86), 67017 (+78), 67144 (+77) |
| Lung, breathing & sleep | 60 | 590 | 0.14 | 0.79 | 169 of 686 | 66109 (-64), 66012 (-43), 66526 (-43) | 66097 (+87), 66020 (+70), 66054 (+68) |
| Digestive / gastroenterology | 60 | 415 | 0.13 | 0.76 | 146 of 686 | 66109 (-59), 66013 (-39), 66007 (-33) | 66713 (+64), 67017 (+60), 66066 (+54) |
| Kidney / nephrology | 60 | 494 | 0.12 | 0.70 | 310 of 686 | 66404 (-59), 66516 (-51), 66087 (-49) | 67556 (+77), 67579 (+73), 67061 (+62) |
| Diabetes & hormones | 60 | 285 | 0.07 | 0.77 | 230 of 686 | 67074 (-98), 66429 (-71), 66414 (-66) | 67061 (+84), 67665 (+83), 67634 (+76) |
| Cancer care / oncology | 90 | 730 | 0.18 | 0.62 | 328 of 686 | 67665 (-72), 67626 (-69), 67520 (-67) | 66539 (+64), 66618 (+58), 66756 (+58) |
| Arthritis / rheumatology | 60 | 148 | 0.04 | 0.75 | 167 of 686 | 67020 (-75), 67460 (-71), 67543 (-71) | 67634 (+100), 67665 (+99), 66873 (+96) |
| Brain & nerves / neurology | 60 | 1,046 | 0.24 | 0.79 | 143 of 686 | 66109 (-53), 66018 (-37), 66226 (-34) | 67556 (+66), 66539 (+56), 66618 (+52) |
| Ear, nose & throat | 60 | 315 | 0.08 | 0.76 | 238 of 686 | 66109 (-62), 66956 (-56), 67628 (-47) | 66873 (+96), 67556 (+90), 66846 (+84) |
| Urology | 60 | 333 | 0.08 | 0.73 | 273 of 686 | 67427 (-86), 66526 (-80), 67074 (-74) | 67556 (+100), 67634 (+90), 66955 (+78) |
| Foot & ankle / podiatry | 60 | 516 | 0.16 | 0.75 | 173 of 686 | 67010 (-41), 66087 (-37), 67110 (-36) | 67159 (+81), 67112 (+77), 67142 (+69) |
| Pain management | 60 | 326 | 0.09 | 0.81 | 161 of 686 | 66018 (-49), 66109 (-46), 66526 (-43) | 66066 (+80), 66873 (+72), 67481 (+69) |
| Plastic & reconstructive surgery | 90 | 266 | 0.07 | 0.66 | 256 of 686 | 66109 (-63), 66007 (-56), 66043 (-52) | 66873 (+91), 66846 (+90), 67857 (+78) |
| Speech & language therapy | 30 | 5,052 | 0.87 | 0.63 | 288 of 686 | 67842 (-83), 66938 (-64), 67644 (-58) | 67556 (+84), 67017 (+78), 67656 (+77) |
| Nutrition & dietitian | 30 | 1,590 | 0.32 | 0.55 | 359 of 686 | 67022 (-86), 66833 (-83), 67544 (-79) | 66401 (+100), 66520 (+100), 67487 (+100) |
| Acupuncture, massage & naturopathy | 30 | 681 | 0.50 | 0.72 | 38 of 686 | 67869 (-95), 67749 (-37), 67356 (-25) | 67757 (+45), 67635 (+44), 67744 (+42) |
| Urgent care & emergency | 30 | 2,657 | 0.50 | 0.30 | 445 of 686 | 67106 (-73), 67118 (-65), 67578 (-64) | 66838 (+100), 66951 (+100), 66952 (+100) |
| Imaging & lab | 60 | 2,195 | 0.55 | 0.77 | 237 of 686 | 66109 (-45), 67524 (-45), 67110 (-44) | 66539 (+59), 67556 (+58), 67232 (+53) |
| Pharmacy | 30 | 8,572 | 1.68 | 0.27 | 468 of 686 | 67054 (-68), 66849 (-58), 66075 (-57) | 67127 (+100), 67734 (+96), 67747 (+96) |
| Home health & in-home care | 30 | 13,829 | 1.49 | 0.38 | 218 of 686 | 67623 (-83), 67455 (-74), 67645 (-65) | 66955 (+100), 66403 (+98), 66404 (+96) |
| Nursing & assisted living | 60 | 2,823 | 0.37 | 0.35 | 358 of 686 | 66414 (-58), 67871 (-56), 67740 (-52) | 66853 (+100), 67071 (+100), 67584 (+100) |
| Medical equipment & supplies | 60 | 1,663 | 0.34 | 0.63 | 326 of 686 | 67560 (-60), 66956 (-54), 67110 (-44) | 67521 (+100), 67584 (+100), 67736 (+100) |
| Hearing & audiology | 60 | 1,166 | 0.20 | 0.78 | 285 of 686 | 67663 (-74), 66429 (-72), 67672 (-68) | 67556 (+100), 67764 (+94), 67457 (+65) |
| Behavior therapy (ABA) | 30 | 9,419 | 2.58 | 0.69 | 126 of 686 | 66758 (-95), 67574 (-77), 66064 (-51) | 66834 (+100), 66849 (+100), 66872 (+100) |
| Care coordination & community health | 30 | 12,248 | 1.55 | 0.61 | 307 of 686 | 67572 (-89), 67764 (-88), 67736 (-76) | 67334 (+100), 67155 (+99), 66424 (+93) |
| General surgery | 60 | 1,634 | 0.39 | 0.70 | 278 of 686 | 67110 (-53), 67052 (-46), 67235 (-46) | 67556 (+98), 67452 (+68), 66771 (+64) |
| Infectious disease | 90 | 181 | 0.06 | 0.62 | 204 of 686 | 66018 (-60), 66109 (-58), 66007 (-54) | 66439 (+86), 66424 (+85), 66516 (+83) |
| Genetics & genetic counseling | 90 | 112 | 0.03 | 0.55 | 126 of 686 | 67341 (-80), 67335 (-67), 67357 (-65) | 67352 (+91), 66732 (+79), 66772 (+77) |
| Hospice & palliative care | 60 | 502 | 0.09 | 0.76 | 291 of 686 | 66711 (-87), 66712 (-84), 66716 (-84) | 66853 (+85), 66941 (+83), 67122 (+76) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
