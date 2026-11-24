# E2SFCA access dry run: Alaska

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 237; in Alaska: 237
- Drive times: OSRM on OpenStreetMap roads (car profile), 237 x 237 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 35,393.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.00 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (4.99), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 56; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 56 (99546, 99547, 99549, 99553, 99571, 99579, 99580, 99583, 99585, 99605, 99606, 99608, 99612, 99624, 99627, 99630, 99636, 99640, 99643, 99644, 99648, 99649, 99657, 99659, 99661, 99671, 99682, 99685, 99689, 99692, 99723, 99748, 99754, 99758, 99759, 99782, 99786, 99791, 99801, 99820, 99824, 99825, 99826, 99827, 99829, 99830, 99832, 99833, 99835, 99840, 99841, 99901, 99918, 99923, 99926, 99929)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 99546 | yes | 0.27 | 8% | 0.27 | 8% | no |
| 99547 | yes | 0.27 | 8% | 0.27 | 8% | no |
| 99549 | yes | 0.13 | 42% | 0.13 | 42% | no |
| 99553 | yes | 7.36 | 100% | 7.36 | 100% | no |
| 99571 | yes | 7.14 | 92% | 7.14 | 92% | no |
| 99579 | yes | 0.34 | 42% | 0.34 | 42% | no |
| 99580 | yes | 1.23 | 42% | 1.23 | 42% | no |
| 99583 | yes | 7.44 | 100% | 7.44 | 100% | no |
| 99585 | yes | 0.12 | 25% | 0.12 | 25% | no |
| 99605 | yes | 5.77 | 100% | 5.77 | 100% | no |
| 99606 | yes | 0.51 | 42% | 0.51 | 42% | no |
| 99608 | yes | 1.38 | 42% | 1.38 | 42% | no |
| 99612 | yes | 5.84 | 92% | 5.84 | 92% | no |
| 99624 | yes | 1.60 | 42% | 1.60 | 42% | no |
| 99627 | yes | 6.30 | 33% | 6.30 | 33% | no |
| 99630 | yes | 0.02 | 25% | 0.02 | 25% | no |
| 99636 | yes | 1.06 | 42% | 1.06 | 42% | no |
| 99640 | yes | 0.44 | 42% | 0.44 | 42% | no |
| 99643 | yes | 5.17 | 50% | 5.17 | 50% | no |
| 99644 | yes | 5.16 | 83% | 5.16 | 83% | no |
| 99648 | yes | 6.85 | 67% | 6.85 | 67% | no |
| 99649 | yes | 0.53 | 42% | 0.53 | 42% | no |
| 99657 | yes | 0.00 | 33% | 0.00 | 33% | no |
| 99659 | yes | 0.44 | 25% | 0.44 | 25% | no |
| 99661 | yes | 6.20 | 75% | 6.20 | 75% | no |
| 99671 | yes | 2.00 | 33% | 2.00 | 33% | no |
| 99682 | yes | 5.86 | 100% | 5.86 | 100% | no |
| 99685 | yes | 5.41 | 92% | 5.41 | 92% | no |
| 99689 | yes | 8.06 | 100% | 8.06 | 100% | no |
| 99692 | yes | 5.26 | 92% | 5.26 | 92% | no |
| 99723 | yes | 0.20 | 25% | 0.20 | 25% | no |
| 99748 | yes | 0.20 | 42% | 0.20 | 42% | no |
| 99754 | yes | 0.05 | 33% | 0.05 | 33% | no |
| 99758 | yes | 5.07 | 100% | 5.07 | 100% | no |
| 99759 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99782 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99786 | yes | 0.00 | 42% | 0.00 | 42% | no |
| 99791 | yes | 0.00 | 25% | 0.00 | 25% | no |
| 99801 | yes | 6.26 | 100% | 6.26 | 100% | no |
| 99820 | yes | 9.98 | 83% | 9.49 | 83% | no |
| 99824 | yes | 6.56 | 100% | 6.56 | 100% | no |
| 99825 | yes | 9.98 | 92% | 9.98 | 92% | no |
| 99826 | yes | 9.08 | 100% | 9.08 | 100% | no |
| 99827 | yes | 7.91 | 100% | 7.91 | 100% | no |
| 99829 | yes | 8.68 | 100% | 8.68 | 100% | no |
| 99830 | yes | 6.94 | 67% | 5.50 | 67% | yes (1.41) |
| 99832 | yes | 9.29 | 92% | 9.29 | 92% | no |
| 99833 | yes | 7.95 | 33% | 10.60 | 33% | no |
| 99835 | yes | 12.79 | 83% | 12.79 | 83% | no |
| 99840 | yes | 7.24 | 100% | 7.24 | 100% | no |
| 99841 | yes | 9.91 | 92% | 7.91 | 92% | no |
| 99901 | yes | 4.75 | 33% | 4.75 | 33% | no |
| 99918 | yes | 5.07 | 58% | 5.07 | 58% | no |
| 99923 | yes | 4.04 | 42% | 5.15 | 42% | no |
| 99926 | yes | 4.39 | 33% | 4.39 | 33% | no |
| 99929 | yes | 5.15 | 33% | 6.10 | 33% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 3,306.2 | 4.30 | 0.54 | 84 of 181 | 99622 (-100), 99680 (-100), 99750 (-100) | 99555 (+100), 99625 (+100), 99628 (+100) |
| Pediatrics (children) | 30 | 575.2 | 1.11 | 0.68 | 44 of 161 | 99622 (-93), 99680 (-93), 99550 (-91) | 99555 (+95), 99628 (+94), 99569 (+88) |
| Women's health / OB-GYN | 60 | 516.2 | 0.53 | 0.81 | 30 of 150 | 99750 (-100), 99761 (-100), 99766 (-100) | 99641 (+69), 99609 (+57), 99621 (+57) |
| Mental health & counseling | 30 | 8,540.8 | 7.20 | 0.69 | 72 of 181 | 99622 (-100), 99761 (-100), 99766 (-100) | 99631 (+100), 99653 (+91), 99540 (+89) |
| Dental | 30 | 1,382.2 | 1.65 | 0.64 | 64 of 181 | 99622 (-100), 99680 (-100), 99733 (-100) | 99555 (+100), 99625 (+100), 99628 (+100) |
| Eye care | 30 | 443.4 | 0.62 | 0.75 | 40 of 164 | 99622 (-100), 99680 (-100), 99679 (-40) | 99555 (+100), 99628 (+100), 99641 (+93) |
| Chiropractic | 30 | 606.6 | 0.63 | 0.72 | 46 of 157 | 99622 (-82), 99680 (-82), 99639 (-39) | 99555 (+100), 99573 (+100), 99628 (+100) |
| Physical & occupational therapy | 30 | 1,925.4 | 2.70 | 0.75 | 52 of 170 | 99755 (-57), 99622 (-47), 99680 (-44) | 99568 (+97), 99729 (+81), 99674 (+80) |
| Orthopedics & sports injury | 60 | 218.2 | 0.39 | 0.91 | 10 of 132 | 99567 (-39), 99635 (-28), 99714 (-17) | 99568 (+61), 99702 (+43), 99540 (+40) |
| Heart / cardiology | 60 | 81.6 | 0.24 | 0.94 | 7 of 125 | 99567 (-42), 99645 (-11), 99714 (-9) | 99540 (+45), 99702 (+23), 99550 (+22) |
| Skin / dermatology | 60 | 46.6 | 0.09 | 0.92 | 10 of 125 | 99635 (-48), 99567 (-44), 99647 (-18) | 99663 (+49), 99674 (+47), 99568 (+35) |
| Allergy & immunology | 60 | 16.8 | 0.03 | 0.95 | 9 of 125 | 99567 (-56), 99635 (-54), 99645 (-14) | 99674 (+62), 99540 (+44), 99702 (+36) |
| Lung, breathing & sleep | 60 | 119.2 | 0.13 | 0.89 | 10 of 125 | 99635 (-100), 99567 (-55), 99647 (-26) | 99663 (+69), 99550 (+40), 99556 (+29) |
| Digestive / gastroenterology | 60 | 47.2 | 0.11 | 0.89 | 15 of 125 | 99567 (-63), 99645 (-17), 99647 (-15) | 99540 (+48), 99663 (+41), 99568 (+31) |
| Kidney / nephrology | 60 | 36.2 | 0.11 | 0.93 | 4 of 125 | 99567 (-45), 99635 (-13), 99587 (-10) | 99540 (+53), 99568 (+32), 99577 (+16) |
| Diabetes & hormones | 60 | 34.6 | 0.06 | 0.77 | 16 of 140 | 99733 (-100), 99750 (-100), 99761 (-100) | 99550 (+86), 99702 (+55), 99540 (+51) |
| Cancer care / oncology | 90 | 76.8 | 0.15 | 0.90 | 14 of 125 | 99567 (-43), 99635 (-33), 99639 (-22) | 99674 (+83), 99568 (+47), 99540 (+38) |
| Arthritis / rheumatology | 60 | 10.6 | 0.04 | 0.91 | 4 of 132 | 99567 (-36), 99678 (-30), 99651 (-11) | 99628 (+72), 99540 (+38), 99577 (+13) |
| Brain & nerves / neurology | 60 | 131.8 | 0.22 | 0.93 | 8 of 125 | 99567 (-54), 99635 (-38), 99714 (-19) | 99568 (+61), 99674 (+33), 99702 (+33) |
| Ear, nose & throat | 60 | 51.4 | 0.07 | 0.93 | 15 of 132 | 99567 (-59), 99635 (-37), 99714 (-25) | 99628 (+84), 99702 (+56), 99555 (+45) |
| Urology | 60 | 44.8 | 0.07 | 0.95 | 10 of 125 | 99567 (-46), 99635 (-26), 99714 (-17) | 99674 (+69), 99568 (+65), 99702 (+45) |
| Foot & ankle / podiatry | 60 | 48.6 | 0.15 | 0.93 | 6 of 125 | 99567 (-25), 99635 (-21), 99714 (-11) | 99568 (+53), 99540 (+32), 99702 (+30) |
| Pain management | 60 | 67 | 0.09 | 0.86 | 18 of 142 | 99622 (-85), 99680 (-85), 99679 (-48) | 99641 (+84), 99621 (+71), 99609 (+69) |
| Plastic & reconstructive surgery | 90 | 34.8 | 0.07 | 0.88 | 14 of 125 | 99567 (-41), 99714 (-36), 99639 (-35) | 99663 (+68), 99674 (+68), 99540 (+39) |
| Speech & language therapy | 30 | 562 | 0.90 | 0.85 | 30 of 142 | 99709 (-27), 99775 (-24), 99508 (-23) | 99568 (+91), 99663 (+90), 99540 (+74) |
| Nutrition & dietitian | 30 | 270 | 0.33 | 0.67 | 47 of 164 | 99622 (-100), 99680 (-100), 99750 (-100) | 99550 (+100), 99555 (+100), 99628 (+100) |
| Acupuncture, massage & naturopathy | 30 | 1,449.4 | 0.52 | 0.75 | 34 of 168 | 99622 (-100), 99680 (-100), 99639 (-80) | 99556 (+100), 99613 (+100), 99625 (+100) |
| Urgent care & emergency | 30 | 432.6 | 0.47 | 0.65 | 48 of 164 | 99622 (-100), 99680 (-100), 99750 (-100) | 99540 (+100), 99555 (+100), 99568 (+100) |
| Imaging & lab | 60 | 271 | 0.49 | 0.78 | 23 of 150 | 99622 (-100), 99679 (-100), 99680 (-100) | 99641 (+86), 99550 (+80), 99621 (+69) |
| Pharmacy | 30 | 1,033 | 1.72 | 0.62 | 56 of 169 | 99622 (-100), 99680 (-100), 99761 (-100) | 99555 (+98), 99628 (+98), 99641 (+89) |
| Home health & in-home care | 30 | 2,468 | 1.61 | 0.72 | 33 of 166 | 99552 (-100), 99622 (-100), 99637 (-100) | 99568 (+100), 99573 (+100), 99675 (+100) |
| Nursing & assisted living | 60 | 916.2 | 0.39 | 0.69 | 38 of 150 | 99745 (-100), 99746 (-100), 99750 (-100) | 99550 (+100), 99663 (+100), 99675 (+100) |
| Medical equipment & supplies | 60 | 189.2 | 0.36 | 0.86 | 17 of 157 | 99567 (-43), 99635 (-23), 99622 (-20) | 99628 (+90), 99555 (+66), 99568 (+60) |
| Hearing & audiology | 60 | 137.4 | 0.19 | 0.93 | 10 of 140 | 99567 (-63), 99635 (-33), 99678 (-29) | 99677 (+85), 99628 (+73), 99702 (+51) |
| Behavior therapy (ABA) | 30 | 1,569.4 | 2.88 | 0.78 | 36 of 157 | 99704 (-77), 99744 (-57), 99777 (-31) | 99631 (+100), 99674 (+69), 99675 (+69) |
| Care coordination & community health | 30 | 5,180.6 | 1.63 | 0.66 | 29 of 181 | 99602 (-100), 99575 (-87), 99714 (-67) | 99631 (+100), 99663 (+100), 99704 (+100) |
| General surgery | 60 | 273.2 | 0.35 | 0.92 | 14 of 125 | 99567 (-58), 99647 (-30), 99635 (-19) | 99663 (+80), 99550 (+78), 99674 (+71) |
| Infectious disease | 90 | 16 | 0.05 | 0.89 | 20 of 103 | 99567 (-54), 99645 (-38), 99587 (-36) | 99540 (+49), 99577 (+37), 99505 (+36) |
| Genetics & genetic counseling | 90 | 6 | 0.03 | 0.82 | 9 of 103 | 99567 (-32), 99645 (-21), 99587 (-20) | 99540 (+32), 99577 (+21), 99505 (+20) |
| Hospice & palliative care | 60 | 32.8 | 0.09 | 0.93 | 4 of 125 | 99567 (-36), 99635 (-29), 99669 (-8) | 99568 (+60), 99702 (+16), 99505 (+9) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Alaska in households with no vehicle: about 53,720 of 552,769 (9.7%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 5
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.82 | 31 of 181 | 99625 (+100), 99578 (+86), 99681 (+86) | 0.84 |
| Pediatrics (children) | 0.91 | 19 of 153 | 99578 (+54), 99681 (+54), 99690 (+54) | 0.92 |
| Women's health / OB-GYN | 0.95 | 21 of 142 | 99770 (+95), 99736 (+88), 99772 (+83) | 0.97 |
| Mental health & counseling | 0.86 | 31 of 181 | 99681 (+100), 99578 (+99), 99690 (+99) | 0.86 |
| Dental | 0.83 | 26 of 181 | 99578 (+100), 99625 (+100), 99681 (+100) | 0.86 |
| Eye care | 0.93 | 16 of 156 | 99578 (+65), 99681 (+65), 99690 (+65) | 0.94 |
| Chiropractic | 0.93 | 16 of 149 | 99638 (+81), 99578 (+48), 99681 (+48) | 0.96 |
| Physical & occupational therapy | 0.96 | 12 of 160 | 99578 (+29), 99681 (+29), 99690 (+27) | 0.97 |
| Orthopedics & sports injury | 1.00 | 0 of 110 | 99501 (+6), 99653 (+6), 99503 (+4) | 1.00 |
| Heart / cardiology | 1.00 | 0 of 103 | 99501 (+4), 99503 (+4), 99518 (+1) | 1.00 |
| Skin / dermatology | 1.00 | 2 of 103 | 99653 (+24), 99647 (+15), 99501 (+5) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 103 | 99501 (+8), 99503 (+6), 99568 (+2) | 1.00 |
| Lung, breathing & sleep | 1.00 | 2 of 103 | 99653 (+33), 99647 (+21), 99556 (+2) | 1.00 |
| Digestive / gastroenterology | 1.00 | 1 of 103 | 99653 (+19), 99647 (+13), 99501 (+6) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 103 | 99501 (+5), 99503 (+5), 99504 (+1) | 1.00 |
| Diabetes & hormones | 0.92 | 8 of 132 | 99589 (+100), 99788 (+100), 99770 (+93) | 0.97 |
| Cancer care / oncology | 0.99 | 0 of 103 | 99503 (+5), 99501 (+3), 99518 (+2) | 1.00 |
| Arthritis / rheumatology | 0.96 | 4 of 110 | 99589 (+60), 99651 (+49), 99628 (+34) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 103 | 99501 (+6), 99653 (+6), 99503 (+4) | 1.00 |
| Ear, nose & throat | 0.99 | 6 of 110 | 99589 (+34), 99651 (+28), 99555 (+21) | 1.00 |
| Urology | 1.00 | 0 of 103 | 99501 (+8), 99503 (+5), 99518 (+2) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 0 of 103 | 99501 (+4), 99503 (+4), 99672 (+2) | 1.00 |
| Pain management | 0.96 | 15 of 120 | 99681 (+56), 99690 (+56), 99614 (+55) | 0.96 |
| Plastic & reconstructive surgery | 0.99 | 2 of 103 | 99653 (+41), 99647 (+26), 99503 (+5) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 120 | 99653 (+12), 99647 (+8), 99501 (+7) | 1.00 |
| Nutrition & dietitian | 0.92 | 12 of 156 | 99578 (+91), 99681 (+91), 99690 (+91) | 0.92 |
| Acupuncture, massage & naturopathy | 0.94 | 18 of 160 | 99625 (+100), 99638 (+99), 99578 (+83) | 0.97 |
| Urgent care & emergency | 0.93 | 24 of 156 | 99784 (+88), 99739 (+77), 99771 (+65) | 0.94 |
| Imaging & lab | 0.91 | 14 of 142 | 99681 (+100), 99690 (+100), 99614 (+98) | 0.91 |
| Pharmacy | 0.89 | 19 of 167 | 99578 (+93), 99690 (+93), 99614 (+91) | 0.89 |
| Home health & in-home care | 0.95 | 6 of 156 | 99578 (+100), 99681 (+100), 99690 (+94) | 0.96 |
| Nursing & assisted living | 0.93 | 26 of 142 | 99772 (+87), 99784 (+78), 99770 (+76) | 0.95 |
| Medical equipment & supplies | 0.97 | 5 of 149 | 99569 (+49), 99653 (+24), 99589 (+21) | 0.97 |
| Hearing & audiology | 0.98 | 4 of 132 | 99589 (+58), 99651 (+47), 99628 (+33) | 1.00 |
| Behavior therapy (ABA) | 0.94 | 4 of 149 | 99691 (+52), 99745 (+29), 99548 (+22) | 0.95 |
| Care coordination & community health | 0.91 | 7 of 181 | 99656 (+100), 99668 (+100), 99681 (+91) | 0.92 |
| General surgery | 1.00 | 2 of 103 | 99653 (+39), 99647 (+25), 99556 (+2) | 1.00 |
| Infectious disease | 1.00 | 0 of 103 | 99503 (+6), 99518 (+2), 99501 (+1) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 103 | 99503 (+3), 99501 (+1), 99517 (+1) | 1.00 |
| Hospice & palliative care | 1.00 | 0 of 103 | 99501 (+5), 99672 (+2), 99508 (+1) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 1 (AK Kusilvak Census Area)

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 31 of 225 | 8,290 (1.5%) |  | 2/17 | 1/10 | 0/2 | 28/196 |
| Women's health / OB-GYN | 016 | 109 of 225 | 37,202 (6.8%) |  | 1/17 | 1/10 | 0/2 | 107/196 |
| Mental health & counseling: Psychiatry | 029 | 160 of 225 | 70,410 (12.9%) |  | 2/17 | 1/10 | 0/2 | 157/196 |
| Mental health & counseling: Clinical Psychology | 036 | 101 of 225 | 36,222 (6.6%) |  | 1/17 | 1/10 | 0/2 | 99/196 |
| Mental health & counseling: Clinical Social Work | 037 | 77 of 225 | 13,413 (2.4%) |  | 1/17 | 1/10 | 0/2 | 75/196 |
| Eye care | 023 | 97 of 225 | 29,615 (5.4%) |  | 2/17 | 1/10 | 0/2 | 94/196 |
| Chiropractic | 010 | 97 of 225 | 20,359 (3.7%) |  | 1/17 | 1/10 | 0/2 | 95/196 |
| Physical & occupational therapy | F049 | 82 of 225 | 17,348 (3.2%) |  | 2/17 | 1/10 | 0/2 | 79/196 |
| Orthopedics & sports injury | 025 | 147 of 225 | 72,075 (13.2%) |  | 2/17 | 1/10 | 0/2 | 144/196 |
| Heart / cardiology | 008 | 167 of 225 | 129,210 (23.6%) |  | 3/17 | 1/10 | 2/2 | 161/196 |
| Skin / dermatology | 011 | 161 of 225 | 93,862 (17.1%) |  | 2/17 | 1/10 | 0/2 | 158/196 |
| Allergy & immunology | 007 | 164 of 225 | 126,119 (23.0%) |  | 2/17 | 1/10 | 2/2 | 159/196 |
| Lung, breathing & sleep | 030 | 153 of 225 | 82,028 (15.0%) |  | 1/17 | 1/10 | 0/2 | 151/196 |
| Digestive / gastroenterology | 014 | 164 of 225 | 125,895 (23.0%) |  | 2/17 | 1/10 | 2/2 | 159/196 |
| Kidney / nephrology | 018 | 160 of 225 | 98,567 (18.0%) |  | 1/17 | 1/10 | 0/2 | 158/196 |
| Diabetes & hormones | 012 | 127 of 225 | 66,106 (12.1%) |  | 1/17 | 1/10 | 0/2 | 125/196 |
| Cancer care / oncology | 021 | 159 of 225 | 89,462 (16.3%) |  | 2/17 | 1/10 | 0/2 | 156/196 |
| Arthritis / rheumatology | 031 | 181 of 225 | 232,637 (42.5%) |  | 1/17 | 10/10 | 2/2 | 168/196 |
| Brain & nerves / neurology | 019 | 162 of 225 | 102,532 (18.7%) |  | 2/17 | 1/10 | 0/2 | 159/196 |
| Ear, nose & throat | 013 | 149 of 225 | 84,787 (15.5%) |  | 2/17 | 1/10 | 0/2 | 146/196 |
| Urology | 033 | 162 of 225 | 97,405 (17.8%) |  | 2/17 | 1/10 | 0/2 | 159/196 |
| Foot & ankle / podiatry | 028 | 162 of 225 | 96,904 (17.7%) |  | 2/17 | 1/10 | 0/2 | 159/196 |
| Plastic & reconstructive surgery | 027 | 155 of 225 | 86,149 (15.7%) |  | 1/17 | 1/10 | 0/2 | 153/196 |
| Speech & language therapy | F051 | 140 of 225 | 55,624 (10.2%) |  | 1/17 | 1/10 | 0/2 | 138/196 |
| Imaging & lab | F047 | 125 of 225 | 70,867 (12.9%) |  | 2/17 | 1/10 | 2/2 | 120/196 |
| Nursing & assisted living | F046 | 100 of 225 | 30,702 (5.6%) |  | 2/17 | 1/10 | 0/2 | 97/196 |
| General surgery | 015 | 155 of 225 | 73,569 (13.4%) |  | 2/17 | 1/10 | 0/2 | 152/196 |
| Infectious disease | 017 | 172 of 225 | 134,082 (24.5%) |  | 1/17 | 1/10 | 2/2 | 168/196 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 9480 rows (ZIP x specialty) stored in access_e2sfca for AK; market-score now uses drive-time access for these ZIPs.
