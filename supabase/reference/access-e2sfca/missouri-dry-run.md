# E2SFCA access dry run: Missouri

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,296; in Missouri: 1,001
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,296 x 3,296 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 451,894; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.88 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.19), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (63732)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 61322 | no | 7.72 | 100% | 3.33 | 100% | yes (1.47) |
| 63732 | yes | 9.02 | 100% | 9.02 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 60,905 | 4.78 | 0.48 | 522 of 1000 | 65305 (-61), 65466 (-59), 64446 (-51) | 63454 (+94), 63740 (+86), 63967 (+78) |
| Pediatrics (children) | 30 | 13,334 | 1.13 | 0.70 | 193 of 1000 | 65778 (-92), 63625 (-83), 65305 (-80) | 65251 (+83), 65262 (+79), 64050 (+68) |
| Women's health / OB-GYN | 60 | 6,371 | 0.55 | 0.75 | 300 of 1000 | 63736 (-66), 63025 (-43), 63069 (-39) | 64459 (+48), 65255 (+45), 65262 (+44) |
| Mental health & counseling | 30 | 81,988 | 7.13 | 0.64 | 282 of 1000 | 63625 (-88), 65305 (-72), 65618 (-72) | 63740 (+82), 65652 (+71), 63780 (+64) |
| Dental | 30 | 18,308 | 1.64 | 0.55 | 453 of 1000 | 65085 (-78), 65305 (-67), 63638 (-61) | 65436 (+100), 65461 (+100), 65552 (+100) |
| Eye care | 30 | 8,416 | 0.65 | 0.59 | 497 of 1000 | 65627 (-95), 63383 (-46), 63830 (-39) | 63740 (+100), 65790 (+100), 63454 (+91) |
| Chiropractic | 30 | 11,366 | 0.64 | 0.54 | 633 of 1000 | 64470 (-72), 64482 (-64), 65625 (-60) | 63454 (+100), 64642 (+100), 64431 (+97) |
| Physical & occupational therapy | 30 | 39,902 | 2.73 | 0.57 | 480 of 1000 | 65236 (-75), 63941 (-51), 63451 (-47) | 63828 (+100), 65790 (+97), 63454 (+92) |
| Orthopedics & sports injury | 60 | 5,726 | 0.42 | 0.69 | 420 of 1000 | 63557 (-100), 63539 (-98), 63736 (-93) | 65067 (+92), 65077 (+84), 65305 (+75) |
| Heart / cardiology | 60 | 3,099 | 0.28 | 0.73 | 338 of 1000 | 63736 (-74), 63069 (-56), 63025 (-55) | 64430 (+79), 64490 (+76), 64088 (+72) |
| Skin / dermatology | 60 | 1,039 | 0.10 | 0.73 | 322 of 1000 | 63530 (-95), 63557 (-87), 65630 (-77) | 65679 (+72), 65731 (+69), 64459 (+65) |
| Allergy & immunology | 60 | 357 | 0.03 | 0.74 | 308 of 1000 | 63069 (-69), 63438 (-66), 63530 (-63) | 65305 (+85), 65068 (+73), 64020 (+72) |
| Lung, breathing & sleep | 60 | 1,566 | 0.14 | 0.78 | 340 of 1000 | 63736 (-59), 65279 (-55), 65626 (-54) | 64459 (+67), 63627 (+56), 64061 (+55) |
| Digestive / gastroenterology | 60 | 1,288 | 0.13 | 0.78 | 291 of 1000 | 63025 (-73), 63736 (-71), 63069 (-63) | 65046 (+74), 65068 (+69), 65652 (+69) |
| Kidney / nephrology | 60 | 1,457 | 0.12 | 0.68 | 455 of 1000 | 63830 (-66), 63851 (-66), 63736 (-64) | 63855 (+78), 63952 (+74), 63852 (+73) |
| Diabetes & hormones | 60 | 731 | 0.07 | 0.74 | 381 of 1000 | 65669 (-69), 65630 (-68), 63069 (-61) | 65766 (+96), 65609 (+78), 65650 (+74) |
| Cancer care / oncology | 90 | 1,996 | 0.18 | 0.66 | 505 of 1000 | 63069 (-61), 63012 (-56), 63016 (-56) | 64430 (+94), 64490 (+91), 64454 (+64) |
| Arthritis / rheumatology | 60 | 422 | 0.04 | 0.74 | 316 of 1000 | 65626 (-96), 63548 (-84), 63453 (-81) | 64430 (+86), 64490 (+84), 64454 (+79) |
| Brain & nerves / neurology | 60 | 2,696 | 0.24 | 0.77 | 270 of 1000 | 63025 (-65), 63736 (-64), 63138 (-63) | 65262 (+57), 65251 (+56), 63454 (+54) |
| Ear, nose & throat | 60 | 940 | 0.08 | 0.75 | 361 of 1000 | 63736 (-99), 63438 (-96), 63435 (-72) | 65679 (+74), 65731 (+69), 64024 (+68) |
| Urology | 60 | 920 | 0.08 | 0.72 | 399 of 1000 | 63736 (-92), 65609 (-89), 65626 (-83) | 64058 (+68), 64498 (+63), 63828 (+62) |
| Foot & ankle / podiatry | 60 | 1,528 | 0.16 | 0.73 | 340 of 1000 | 63736 (-65), 63438 (-47), 63841 (-47) | 63014 (+88), 63363 (+80), 63952 (+76) |
| Pain management | 60 | 979 | 0.09 | 0.69 | 319 of 1000 | 63431 (-100), 63460 (-100), 63530 (-100) | 64624 (+84), 64430 (+80), 63879 (+73) |
| Plastic & reconstructive surgery | 90 | 731 | 0.07 | 0.63 | 510 of 1000 | 63031 (-73), 63025 (-71), 63033 (-69) | 65679 (+69), 65672 (+67), 64459 (+66) |
| Speech & language therapy | 30 | 15,125 | 0.87 | 0.47 | 578 of 1000 | 64667 (-87), 65075 (-79), 64723 (-70) | 64726 (+100), 64770 (+100), 65040 (+100) |
| Nutrition & dietitian | 30 | 4,179 | 0.32 | 0.66 | 418 of 1000 | 65479 (-88), 64446 (-85), 63965 (-74) | 63454 (+100), 65436 (+100), 65461 (+100) |
| Acupuncture, massage & naturopathy | 30 | 1,971 | 0.50 | 0.63 | 139 of 1000 | 64842 (-86), 65762 (-82), 65276 (-76) | 65790 (+61), 65777 (+53), 65788 (+47) |
| Urgent care & emergency | 30 | 6,285 | 0.50 | 0.56 | 490 of 1000 | 64446 (-71), 65305 (-71), 63638 (-68) | 63563 (+100), 63740 (+100), 65552 (+100) |
| Imaging & lab | 60 | 6,147 | 0.55 | 0.73 | 301 of 1000 | 63736 (-88), 63755 (-59), 63025 (-56) | 63952 (+60), 64459 (+59), 65262 (+47) |
| Pharmacy | 30 | 22,604 | 1.68 | 0.49 | 564 of 1000 | 64470 (-69), 65606 (-65), 65305 (-64) | 63937 (+93), 63939 (+93), 63932 (+81) |
| Home health & in-home care | 30 | 39,046 | 1.49 | 0.61 | 199 of 1000 | 65466 (-81), 63623 (-79), 65566 (-76) | 63862 (+93), 63373 (+91), 64496 (+91) |
| Nursing & assisted living | 60 | 6,721 | 0.37 | 0.60 | 515 of 1000 | 64744 (-61), 65626 (-56), 65215 (-55) | 65449 (+95), 63655 (+94), 64742 (+82) |
| Medical equipment & supplies | 60 | 4,737 | 0.34 | 0.63 | 412 of 1000 | 63736 (-91), 63953 (-67), 65609 (-58) | 63941 (+86), 65690 (+67), 64725 (+64) |
| Hearing & audiology | 60 | 3,011 | 0.20 | 0.67 | 513 of 1000 | 63530 (-100), 63552 (-100), 63557 (-100) | 65769 (+77), 65282 (+76), 63781 (+75) |
| Behavior therapy (ABA) | 30 | 22,498 | 2.58 | 0.73 | 141 of 1000 | 63847 (-66), 63763 (-56), 64105 (-42) | 63636 (+100), 63855 (+100), 63879 (+100) |
| Care coordination & community health | 30 | 25,975 | 1.55 | 0.65 | 145 of 1000 | 63625 (-87), 64441 (-79), 63703 (-60) | 63036 (+100), 63665 (+100), 63740 (+100) |
| General surgery | 60 | 4,411 | 0.39 | 0.70 | 372 of 1000 | 63736 (-68), 63069 (-51), 65626 (-49) | 64430 (+85), 64490 (+72), 64454 (+56) |
| Infectious disease | 90 | 582 | 0.06 | 0.68 | 323 of 1000 | 63025 (-80), 63069 (-78), 63386 (-75) | 64633 (+97), 63740 (+82), 64459 (+82) |
| Genetics & genetic counseling | 90 | 296 | 0.03 | 0.56 | 423 of 1000 | 64847 (-82), 64854 (-80), 65745 (-75) | 65606 (+83), 64430 (+79), 65690 (+76) |
| Hospice & palliative care | 60 | 1,019 | 0.09 | 0.67 | 485 of 1000 | 65793 (-75), 63863 (-69), 63736 (-63) | 64088 (+80), 64463 (+78), 64058 (+75) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
