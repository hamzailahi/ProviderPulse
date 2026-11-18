# E2SFCA access dry run: South Carolina

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,504; in South Carolina: 420
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,504 x 1,504 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 525,533; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.68 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.70), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 18; re-anchored: 2; still implausible (left out of the rank comparison, marked in the CSV): 15 (29446, 29915, 37354, 37722, 37725, 37753, 37806, 37820, 37821, 37862, 37865, 37871, 37890, 37914, 37924)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 29446 | yes | 6.91 | 100% | 6.91 | 100% | no |
| 29915 | yes | 18.10 | 100% | 18.10 | 100% | no |
| 37354 | no | 7.58 | 100% | 7.58 | 100% | no |
| 37713 | no | 9.15 | 100% | 6.07 | 100% | no |
| 37722 | no | 10.94 | 100% | 11.59 | 100% | no |
| 37725 | no | 11.76 | 100% | 13.25 | 100% | no |
| 37727 | no | 8.82 | 100% | 3.58 | 100% | yes (4.31) |
| 37753 | no | 10.19 | 100% | 10.19 | 100% | no |
| 37806 | no | 9.53 | 100% | 9.53 | 100% | no |
| 37820 | no | 14.70 | 100% | 14.70 | 100% | no |
| 37821 | no | 8.99 | 100% | 12.25 | 100% | no |
| 37843 | no | 11.43 | 100% | 4.91 | 100% | no |
| 37862 | no | 8.08 | 100% | 8.08 | 100% | no |
| 37865 | no | 10.67 | 100% | 10.67 | 100% | no |
| 37871 | no | 9.40 | 100% | 9.40 | 100% | no |
| 37890 | no | 10.54 | 100% | 8.16 | 100% | yes (21.73) |
| 37914 | no | 16.12 | 100% | 16.12 | 100% | no |
| 37924 | no | 16.02 | 100% | 16.02 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 84,248 | 4.78 | 0.59 | 219 of 418 | 29152 (-61), 29207 (-55), 29902 (-51) | 29592 (+92), 29045 (+83), 29565 (+69) |
| Pediatrics (children) | 30 | 16,524 | 1.13 | 0.67 | 157 of 418 | 29902 (-56), 29905 (-54), 29516 (-47) | 29045 (+83), 29642 (+77), 29455 (+70) |
| Women's health / OB-GYN | 60 | 9,430 | 0.55 | 0.69 | 160 of 418 | 29301 (-43), 29375 (-41), 29365 (-40) | 29372 (+69), 29302 (+62), 29346 (+57) |
| Mental health & counseling | 30 | 105,619 | 7.13 | 0.58 | 163 of 418 | 29902 (-67), 29905 (-67), 29935 (-51) | 29061 (+63), 29455 (+60), 29835 (+55) |
| Dental | 30 | 23,970 | 1.64 | 0.59 | 187 of 418 | 29152 (-62), 29207 (-35), 29406 (-31) | 29920 (+84), 29044 (+79), 29062 (+77) |
| Eye care | 30 | 9,486 | 0.65 | 0.61 | 218 of 418 | 29152 (-63), 29560 (-52), 29302 (-43) | 29439 (+69), 29061 (+68), 29920 (+65) |
| Chiropractic | 30 | 9,823 | 0.64 | 0.70 | 219 of 418 | 29812 (-51), 29926 (-39), 29678 (-32) | 29487 (+70), 29374 (+67), 29065 (+64) |
| Physical & occupational therapy | 30 | 44,484 | 2.73 | 0.72 | 192 of 418 | 29207 (-46), 29621 (-33), 29456 (-28) | 29920 (+74), 29439 (+71), 29487 (+65) |
| Orthopedics & sports injury | 60 | 7,544 | 0.42 | 0.76 | 170 of 418 | 29536 (-48), 29547 (-47), 29322 (-42) | 29728 (+63), 29655 (+55), 29372 (+53) |
| Heart / cardiology | 60 | 4,186 | 0.28 | 0.61 | 209 of 418 | 29536 (-57), 29547 (-50), 29078 (-49) | 29831 (+70), 29346 (+67), 29899 (+65) |
| Skin / dermatology | 60 | 1,473 | 0.10 | 0.80 | 155 of 418 | 29420 (-47), 29456 (-40), 29927 (-40) | 29554 (+65), 29346 (+61), 29655 (+61) |
| Allergy & immunology | 60 | 521 | 0.03 | 0.76 | 156 of 418 | 29375 (-73), 29334 (-72), 29365 (-65) | 29302 (+80), 29472 (+74), 29372 (+69) |
| Lung, breathing & sleep | 60 | 2,271 | 0.14 | 0.69 | 163 of 418 | 29078 (-45), 29927 (-39), 29690 (-37) | 29565 (+61), 29655 (+61), 29592 (+59) |
| Digestive / gastroenterology | 60 | 1,943 | 0.13 | 0.74 | 211 of 418 | 29334 (-51), 29078 (-49), 29375 (-49) | 29346 (+71), 29899 (+68), 29565 (+66) |
| Kidney / nephrology | 60 | 1,907 | 0.12 | 0.55 | 215 of 418 | 29046 (-76), 29040 (-65), 29128 (-62) | 29372 (+68), 29941 (+66), 29453 (+63) |
| Diabetes & hormones | 60 | 868 | 0.07 | 0.68 | 194 of 418 | 29114 (-60), 29142 (-59), 29589 (-58) | 29899 (+69), 29655 (+67), 29835 (+65) |
| Cancer care / oncology | 90 | 2,573 | 0.18 | 0.48 | 259 of 418 | 29690 (-58), 29322 (-54), 29683 (-50) | 29346 (+68), 29324 (+67), 29307 (+65) |
| Arthritis / rheumatology | 60 | 635 | 0.04 | 0.76 | 220 of 418 | 29334 (-67), 29365 (-65), 29589 (-59) | 29436 (+88), 29469 (+83), 29030 (+71) |
| Brain & nerves / neurology | 60 | 3,207 | 0.24 | 0.77 | 139 of 418 | 29078 (-42), 29690 (-40), 29322 (-35) | 29045 (+62), 29835 (+60), 29681 (+55) |
| Ear, nose & throat | 60 | 1,189 | 0.08 | 0.69 | 192 of 418 | 29334 (-52), 29375 (-47), 29365 (-46) | 29062 (+92), 29838 (+75), 29487 (+72) |
| Urology | 60 | 1,506 | 0.08 | 0.66 | 225 of 418 | 29536 (-68), 29341 (-59), 29114 (-58) | 29943 (+75), 29835 (+67), 29346 (+63) |
| Foot & ankle / podiatry | 60 | 1,861 | 0.16 | 0.64 | 148 of 418 | 29018 (-41), 29142 (-39), 29432 (-38) | 29030 (+59), 29164 (+53), 29133 (+51) |
| Pain management | 60 | 1,409 | 0.09 | 0.70 | 194 of 418 | 29547 (-53), 29040 (-49), 29536 (-49) | 29835 (+67), 29372 (+65), 29899 (+63) |
| Plastic & reconstructive surgery | 90 | 1,011 | 0.07 | 0.59 | 283 of 418 | 29690 (-61), 29589 (-59), 29801 (-57) | 29565 (+69), 29592 (+69), 29346 (+64) |
| Speech & language therapy | 30 | 15,328 | 0.87 | 0.65 | 212 of 418 | 29015 (-78), 29580 (-49), 29360 (-40) | 29065 (+76), 29472 (+74), 29487 (+72) |
| Nutrition & dietitian | 30 | 5,474 | 0.32 | 0.64 | 170 of 418 | 29137 (-75), 29902 (-54), 29905 (-54) | 29044 (+82), 29455 (+77), 29061 (+75) |
| Acupuncture, massage & naturopathy | 30 | 4,786 | 0.50 | 0.66 | 69 of 418 | 29438 (-88), 29407 (-24), 29926 (-24) | 29487 (+51), 29455 (+49), 29061 (+47) |
| Urgent care & emergency | 30 | 7,351 | 0.50 | 0.53 | 227 of 418 | 29672 (-77), 29020 (-59), 29650 (-58) | 29045 (+92), 29642 (+90), 29943 (+88) |
| Imaging & lab | 60 | 8,114 | 0.55 | 0.63 | 139 of 418 | 29334 (-44), 29375 (-43), 29365 (-39) | 29346 (+77), 29451 (+64), 29466 (+58) |
| Pharmacy | 30 | 30,286 | 1.68 | 0.47 | 239 of 418 | 29941 (-67), 29152 (-41), 29406 (-41) | 29052 (+86), 29044 (+85), 29835 (+80) |
| Home health & in-home care | 30 | 16,919 | 1.49 | 0.62 | 137 of 418 | 29556 (-41), 29936 (-40), 29015 (-33) | 29207 (+58), 29516 (+54), 29580 (+51) |
| Nursing & assisted living | 60 | 6,775 | 0.37 | 0.53 | 155 of 418 | 29142 (-45), 29536 (-40), 29114 (-39) | 29840 (+58), 29685 (+55), 29014 (+54) |
| Medical equipment & supplies | 60 | 7,239 | 0.34 | 0.70 | 184 of 418 | 29046 (-62), 29142 (-59), 29040 (-48) | 29074 (+68), 29065 (+67), 29655 (+65) |
| Hearing & audiology | 60 | 3,120 | 0.20 | 0.79 | 172 of 418 | 29927 (-57), 29046 (-42), 29322 (-34) | 29920 (+70), 29487 (+61), 29455 (+57) |
| Behavior therapy (ABA) | 30 | 31,962 | 2.58 | 0.68 | 86 of 418 | 29902 (-48), 29905 (-45), 29545 (-36) | 29061 (+92), 29821 (+73), 29053 (+66) |
| Care coordination & community health | 30 | 10,197 | 1.55 | 0.47 | 88 of 418 | 29941 (-89), 29902 (-41), 29905 (-38) | 29044 (+50), 29052 (+48), 29061 (+41) |
| General surgery | 60 | 6,426 | 0.39 | 0.68 | 205 of 418 | 29365 (-52), 29375 (-51), 29388 (-51) | 29899 (+70), 29835 (+67), 29323 (+59) |
| Infectious disease | 90 | 756 | 0.06 | 0.47 | 246 of 418 | 29054 (-51), 29123 (-51), 29801 (-50) | 29346 (+76), 29324 (+66), 29455 (+66) |
| Genetics & genetic counseling | 90 | 494 | 0.03 | 0.37 | 293 of 418 | 29638 (-93), 29692 (-93), 29351 (-91) | 29831 (+68), 29642 (+62), 29470 (+57) |
| Hospice & palliative care | 60 | 1,263 | 0.09 | 0.61 | 210 of 418 | 29536 (-66), 29046 (-65), 29044 (-63) | 29916 (+81), 29934 (+78), 29943 (+67) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 29201 | Primary care / family doctor | 9.787 | 9.571 | 0 | 0 |
| 29201 | Mental health & counseling | 11.340 | 12.525 | 20 | 12 |
| 29201 | Heart / cardiology | 0.640 | 0.409 | 0 | 27 |
| 29201 | Cancer care / oncology | 0.265 | 0.140 | 26 | 61 |
| 29201 | Urgent care & emergency | 1.338 | 1.225 | 0 | 0 |
| 29401 | Primary care / family doctor | 7.321 | 8.021 | 23 | 16 |
| 29401 | Mental health & counseling | 9.628 | 10.182 | 32 | 29 |
| 29401 | Heart / cardiology | 0.429 | 0.290 | 24 | 48 |
| 29401 | Cancer care / oncology | 0.194 | 0.177 | 46 | 50 |
| 29401 | Urgent care & emergency | 0.699 | 0.852 | 30 | 14 |
| 29601 | Primary care / family doctor | 9.719 | 10.163 | 0 | 0 |
| 29601 | Mental health & counseling | 9.678 | 10.815 | 32 | 24 |
| 29601 | Heart / cardiology | 0.555 | 0.344 | 1 | 39 |
| 29601 | Cancer care / oncology | 0.321 | 0.181 | 10 | 49 |
| 29601 | Urgent care & emergency | 1.842 | 1.905 | 0 | 0 |
| 29577 | Primary care / family doctor | 4.573 | 6.874 | 52 | 28 |
| 29577 | Mental health & counseling | 4.741 | 5.300 | 67 | 63 |
| 29577 | Heart / cardiology | 0.254 | 0.303 | 55 | 46 |
| 29577 | Cancer care / oncology | 0.129 | 0.147 | 64 | 59 |
| 29577 | Urgent care & emergency | 0.473 | 1.004 | 52 | 0 |
| 29501 | Primary care / family doctor | 6.855 | 7.825 | 28 | 18 |
| 29501 | Mental health & counseling | 6.299 | 8.317 | 56 | 42 |
| 29501 | Heart / cardiology | 0.502 | 0.433 | 11 | 23 |
| 29501 | Cancer care / oncology | 0.215 | 0.115 | 39 | 68 |
| 29501 | Urgent care & emergency | 0.431 | 0.436 | 57 | 56 |
| 29801 | Primary care / family doctor | 3.277 | 4.342 | 66 | 55 |
| 29801 | Mental health & counseling | 5.297 | 7.813 | 63 | 45 |
| 29801 | Heart / cardiology | 0.157 | 0.238 | 72 | 58 |
| 29801 | Cancer care / oncology | 0.048 | 0.105 | 86 | 70 |
| 29801 | Urgent care & emergency | 0.193 | 0.261 | 81 | 74 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 16720 rows (ZIP x specialty) stored in access_e2sfca for SC; market-score now uses drive-time access for these ZIPs.
