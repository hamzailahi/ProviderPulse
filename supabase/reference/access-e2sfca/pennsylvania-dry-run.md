# E2SFCA access dry run: Pennsylvania

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 4,700; in Pennsylvania: 1,787
- Drive times: OSRM on OpenStreetMap roads (car profile), 4,700 x 4,700 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,568,329; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.35 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.38), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 9; re-anchored: 8; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (21624)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | no | 9.93 | 100% | 3.91 | 100% | yes (1.27) |
| 07632 | no | 11.39 | 100% | 2.51 | 100% | yes (1.77) |
| 07663 | no | 8.86 | 100% | 2.67 | 100% | yes (0.87) |
| 10004 | no | 11.24 | 100% | 2.57 | 100% | yes (1.47) |
| 10044 | no | 12.53 | 100% | 4.85 | 100% | yes (0.53) |
| 15450 | yes | 9.55 | 100% | 4.03 | 100% | yes (0.80) |
| 15466 | yes | 10.02 | 100% | 3.64 | 100% | yes (0.82) |
| 17271 | yes | 9.95 | 100% | 3.38 | 100% | yes (0.60) |
| 21624 | no | none | 0% | none | 0% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 204,213 | 4.78 | 0.70 | 663 of 1787 | 18437 (-82), 18455 (-66), 16915 (-54) | 17763 (+90), 15315 (+85), 17771 (+83) |
| Pediatrics (children) | 30 | 57,074 | 1.13 | 0.84 | 332 of 1787 | 15502 (-88), 16346 (-76), 17042 (-60) | 15024 (+86), 15315 (+86), 18092 (+67) |
| Women's health / OB-GYN | 60 | 25,920 | 0.55 | 0.73 | 700 of 1787 | 16748 (-92), 17552 (-59), 17370 (-54) | 18443 (+69), 18405 (+67), 17763 (+65) |
| Mental health & counseling | 30 | 320,370 | 7.13 | 0.78 | 516 of 1787 | 19056 (-50), 19020 (-48), 15482 (-46) | 16925 (+88), 15431 (+79), 15351 (+67) |
| Dental | 30 | 65,403 | 1.64 | 0.75 | 470 of 1787 | 18624 (-57), 15834 (-44), 16915 (-42) | 15315 (+66), 17265 (+58), 17018 (+55) |
| Eye care | 30 | 28,022 | 0.65 | 0.68 | 715 of 1787 | 15931 (-55), 15537 (-52), 16319 (-52) | 18830 (+94), 18818 (+91), 17267 (+80) |
| Chiropractic | 30 | 22,516 | 0.64 | 0.67 | 792 of 1787 | 16915 (-53), 16920 (-53), 15943 (-46) | 15329 (+85), 15462 (+84), 15464 (+84) |
| Physical & occupational therapy | 30 | 137,362 | 2.73 | 0.64 | 831 of 1787 | 18616 (-75), 17243 (-51), 16915 (-50) | 17265 (+100), 17729 (+92), 17760 (+90) |
| Orthopedics & sports injury | 60 | 17,715 | 0.42 | 0.62 | 889 of 1787 | 17750 (-77), 16748 (-76), 17777 (-75) | 17763 (+93), 17729 (+88), 17776 (+79) |
| Heart / cardiology | 60 | 14,311 | 0.28 | 0.73 | 842 of 1787 | 17552 (-92), 17550 (-83), 15460 (-79) | 17763 (+83), 17265 (+81), 17244 (+70) |
| Skin / dermatology | 60 | 4,731 | 0.10 | 0.75 | 800 of 1787 | 17552 (-67), 16686 (-64), 17570 (-59) | 17967 (+81), 17322 (+74), 17764 (+74) |
| Allergy & immunology | 60 | 1,854 | 0.03 | 0.68 | 1026 of 1787 | 15948 (-85), 17552 (-83), 16686 (-79) | 15341 (+85), 16130 (+85), 16114 (+84) |
| Lung, breathing & sleep | 60 | 5,730 | 0.14 | 0.69 | 868 of 1787 | 15460 (-68), 17552 (-66), 15334 (-60) | 16061 (+76), 16025 (+73), 16029 (+69) |
| Digestive / gastroenterology | 60 | 6,806 | 0.13 | 0.71 | 932 of 1787 | 16748 (-100), 17552 (-97), 17570 (-86) | 16922 (+94), 17763 (+92), 18443 (+78) |
| Kidney / nephrology | 60 | 5,178 | 0.12 | 0.68 | 902 of 1787 | 15563 (-89), 15925 (-86), 15841 (-76) | 15821 (+100), 15832 (+100), 16740 (+97) |
| Diabetes & hormones | 60 | 3,581 | 0.07 | 0.71 | 868 of 1787 | 17552 (-98), 15460 (-91), 15478 (-90) | 17265 (+80), 17322 (+80), 17307 (+69) |
| Cancer care / oncology | 90 | 8,496 | 0.18 | 0.58 | 1277 of 1787 | 19543 (-71), 17552 (-67), 17550 (-65) | 17265 (+82), 18436 (+79), 17058 (+77) |
| Arthritis / rheumatology | 60 | 2,088 | 0.04 | 0.75 | 877 of 1787 | 17552 (-96), 15065 (-77), 16724 (-75) | 15861 (+100), 17763 (+87), 16259 (+85) |
| Brain & nerves / neurology | 60 | 10,482 | 0.24 | 0.73 | 758 of 1787 | 17552 (-79), 15460 (-68), 17570 (-68) | 17265 (+66), 17244 (+63), 16838 (+62) |
| Ear, nose & throat | 60 | 3,214 | 0.08 | 0.64 | 1017 of 1787 | 16748 (-100), 16730 (-94), 15460 (-80) | 16922 (+88), 18850 (+74), 18817 (+70) |
| Urology | 60 | 3,882 | 0.08 | 0.65 | 969 of 1787 | 16748 (-100), 16933 (-100), 16946 (-99) | 16922 (+86), 16259 (+84), 17265 (+83) |
| Foot & ankle / podiatry | 60 | 10,433 | 0.16 | 0.66 | 912 of 1787 | 16412 (-93), 16667 (-91), 16745 (-82) | 15341 (+92), 17032 (+86), 17763 (+86) |
| Pain management | 60 | 4,343 | 0.09 | 0.62 | 845 of 1787 | 15925 (-93), 16748 (-86), 15938 (-78) | 17763 (+96), 15832 (+94), 15341 (+89) |
| Plastic & reconstructive surgery | 90 | 3,251 | 0.07 | 0.64 | 1188 of 1787 | 17361 (-52), 19369 (-51), 17552 (-50) | 16922 (+82), 16650 (+79), 15864 (+78) |
| Speech & language therapy | 30 | 45,333 | 0.87 | 0.69 | 577 of 1787 | 18626 (-67), 18619 (-61), 18616 (-58) | 16738 (+100), 16374 (+98), 16732 (+98) |
| Nutrition & dietitian | 30 | 15,204 | 0.32 | 0.79 | 678 of 1787 | 18847 (-62), 18626 (-55), 16344 (-53) | 16925 (+91), 16732 (+89), 16744 (+89) |
| Acupuncture, massage & naturopathy | 30 | 17,038 | 0.50 | 0.77 | 191 of 1787 | 16650 (-34), 17601 (-29), 18801 (-28) | 18972 (+55), 18433 (+52), 17327 (+50) |
| Urgent care & emergency | 30 | 21,348 | 0.50 | 0.68 | 682 of 1787 | 17361 (-75), 18657 (-66), 15773 (-62) | 17778 (+100), 15944 (+97), 15861 (+94) |
| Imaging & lab | 60 | 22,194 | 0.55 | 0.64 | 826 of 1787 | 17552 (-68), 17570 (-63), 17550 (-62) | 15821 (+65), 15832 (+65), 17327 (+64) |
| Pharmacy | 30 | 76,969 | 1.68 | 0.67 | 696 of 1787 | 17065 (-69), 16331 (-51), 15901 (-44) | 15315 (+85), 15832 (+71), 15068 (+64) |
| Home health & in-home care | 30 | 79,246 | 1.49 | 0.85 | 165 of 1787 | 15460 (-36), 17829 (-32), 17837 (-32) | 15054 (+87), 17810 (+79), 15459 (+78) |
| Nursing & assisted living | 60 | 12,121 | 0.37 | 0.49 | 702 of 1787 | 16745 (-68), 17756 (-66), 17861 (-65) | 17071 (+96), 17021 (+83), 15712 (+70) |
| Medical equipment & supplies | 60 | 13,435 | 0.34 | 0.70 | 580 of 1787 | 17756 (-61), 17777 (-60), 16745 (-51) | 17763 (+69), 16917 (+65), 18833 (+56) |
| Hearing & audiology | 60 | 7,896 | 0.20 | 0.60 | 1030 of 1787 | 17777 (-70), 15925 (-68), 16667 (-68) | 16922 (+90), 17265 (+83), 17763 (+83) |
| Behavior therapy (ABA) | 30 | 61,608 | 2.58 | 0.86 | 140 of 1787 | 18249 (-72), 18219 (-60), 15035 (-49) | 15679 (+99), 15089 (+97), 15695 (+92) |
| Care coordination & community health | 30 | 75,795 | 1.55 | 0.76 | 272 of 1787 | 15931 (-60), 15927 (-46), 15320 (-40) | 16925 (+92), 15961 (+83), 16159 (+74) |
| General surgery | 60 | 18,090 | 0.39 | 0.65 | 966 of 1787 | 17552 (-94), 15943 (-86), 15962 (-85) | 17763 (+71), 16374 (+63), 17053 (+61) |
| Infectious disease | 90 | 3,135 | 0.06 | 0.66 | 1183 of 1787 | 19343 (-77), 16066 (-76), 15347 (-75) | 18324 (+84), 18371 (+83), 16235 (+81) |
| Genetics & genetic counseling | 90 | 1,671 | 0.03 | 0.64 | 922 of 1787 | 15347 (-100), 15301 (-94), 19022 (-92) | 18618 (+80), 18062 (+66), 18037 (+63) |
| Hospice & palliative care | 60 | 1,950 | 0.09 | 0.70 | 672 of 1787 | 16748 (-71), 17756 (-53), 15925 (-48) | 17763 (+81), 16922 (+80), 15431 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
