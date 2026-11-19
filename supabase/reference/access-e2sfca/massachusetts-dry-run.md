# E2SFCA access dry run: Massachusetts

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,367; in Massachusetts: 531
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,367 x 2,367 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,102,189; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.33 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.32), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 17; re-anchored: 11; still implausible (left out of the rank comparison, still stored, marked in the CSV): 7 (04003, 04017, 04019, 04066, 04079, 04562, 04852)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 01085 | yes | 9.58 | 100% | 2.73 | 100% | yes (1.72) |
| 02199 | yes | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 02872 | no | 10.65 | 100% | 2.96 | 100% | yes (2.37) |
| 04003 | no | 4.03 | 17% | 4.03 | 17% | no |
| 04017 | no | 13.99 | 75% | 16.31 | 75% | no |
| 04019 | no | 13.26 | 75% | 11.10 | 75% | yes (1.64) |
| 04050 | no | 10.89 | 100% | 5.94 | 100% | yes (2.04) |
| 04066 | no | 4.03 | 17% | 4.03 | 17% | no |
| 04079 | no | 3.11 | 17% | 3.11 | 17% | no |
| 04562 | no | none | 0% | none | 0% | no |
| 04852 | no | 0.63 | 8% | 0.63 | 8% | no |
| 06390 | no | 9.18 | 100% | 2.85 | 100% | yes (2.83) |
| 07311 | no | 9.93 | 100% | 3.91 | 100% | yes (1.27) |
| 07632 | no | 11.39 | 100% | 2.51 | 100% | yes (1.77) |
| 07663 | no | 8.86 | 100% | 2.67 | 100% | yes (0.87) |
| 10004 | no | 11.24 | 100% | 2.57 | 100% | yes (1.47) |
| 10044 | no | 12.53 | 100% | 4.85 | 100% | yes (0.53) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 139,116 | 4.78 | 0.77 | 142 of 531 | 01867 (-30), 02652 (-29), 01230 (-28) | 01908 (+65), 01032 (+55), 01077 (+54) |
| Pediatrics (children) | 30 | 46,797 | 1.13 | 0.85 | 155 of 531 | 02762 (-64), 02093 (-61), 01373 (-53) | 01008 (+78), 01096 (+78), 01257 (+71) |
| Women's health / OB-GYN | 60 | 18,291 | 0.55 | 0.63 | 252 of 531 | 02035 (-54), 02071 (-54), 02032 (-50) | 01966 (+64), 01084 (+60), 01340 (+60) |
| Mental health & counseling | 30 | 264,237 | 7.13 | 0.77 | 187 of 531 | 01373 (-33), 02649 (-32), 02723 (-31) | 01341 (+80), 01355 (+74), 01008 (+73) |
| Dental | 30 | 51,779 | 1.64 | 0.80 | 187 of 531 | 01098 (-58), 01026 (-40), 01103 (-35) | 01908 (+61), 01341 (+59), 01340 (+58) |
| Eye care | 30 | 19,846 | 0.65 | 0.75 | 195 of 531 | 01230 (-32), 01373 (-30), 02657 (-28) | 02791 (+67), 01340 (+66), 01084 (+62) |
| Chiropractic | 30 | 14,222 | 0.64 | 0.51 | 101 of 531 | 01258 (-47), 02557 (-40), 02568 (-38) | 01096 (+51), 01266 (+47), 01244 (+44) |
| Physical & occupational therapy | 30 | 98,056 | 2.73 | 0.75 | 214 of 531 | 02762 (-51), 02093 (-47), 01103 (-38) | 01258 (+74), 01032 (+70), 01966 (+67) |
| Orthopedics & sports injury | 60 | 11,135 | 0.42 | 0.69 | 188 of 531 | 01803 (-42), 01852 (-37), 01851 (-36) | 01966 (+59), 01341 (+56), 01367 (+56) |
| Heart / cardiology | 60 | 10,161 | 0.28 | 0.67 | 255 of 531 | 01867 (-72), 01887 (-65), 01803 (-64) | 01085 (+64), 01077 (+57), 02641 (+46) |
| Skin / dermatology | 60 | 3,809 | 0.10 | 0.72 | 268 of 531 | 01810 (-83), 01843 (-80), 01840 (-71) | 01966 (+85), 01930 (+73), 01929 (+71) |
| Allergy & immunology | 60 | 1,285 | 0.03 | 0.67 | 288 of 531 | 01843 (-80), 01810 (-78), 01867 (-73) | 01008 (+82), 01084 (+77), 02791 (+77) |
| Lung, breathing & sleep | 60 | 4,027 | 0.14 | 0.69 | 254 of 531 | 01887 (-57), 01803 (-51), 01867 (-51) | 01032 (+76), 01096 (+65), 01077 (+61) |
| Digestive / gastroenterology | 60 | 4,965 | 0.13 | 0.61 | 256 of 531 | 01867 (-77), 02032 (-77), 01810 (-73) | 01084 (+85), 01012 (+81), 01050 (+80) |
| Kidney / nephrology | 60 | 3,168 | 0.12 | 0.65 | 310 of 531 | 01867 (-43), 01238 (-37), 01266 (-36) | 01340 (+73), 01077 (+61), 01354 (+50) |
| Diabetes & hormones | 60 | 2,935 | 0.07 | 0.63 | 279 of 531 | 01876 (-85), 01810 (-83), 01852 (-81) | 01032 (+70), 01096 (+67), 01340 (+66) |
| Cancer care / oncology | 90 | 6,344 | 0.18 | 0.55 | 330 of 531 | 01867 (-83), 01887 (-81), 02050 (-81) | 01096 (+51), 02639 (+48), 02641 (+48) |
| Arthritis / rheumatology | 60 | 1,534 | 0.04 | 0.56 | 348 of 531 | 01772 (-82), 01745 (-79), 01721 (-78) | 01255 (+93), 01338 (+74), 01082 (+73) |
| Brain & nerves / neurology | 60 | 8,218 | 0.24 | 0.74 | 226 of 531 | 01907 (-76), 01904 (-75), 02188 (-73) | 01032 (+70), 02791 (+47), 02769 (+42) |
| Ear, nose & throat | 60 | 2,154 | 0.08 | 0.70 | 252 of 531 | 01843 (-64), 02035 (-64), 01810 (-63) | 01938 (+63), 02539 (+58), 02557 (+57) |
| Urology | 60 | 2,655 | 0.08 | 0.73 | 305 of 531 | 02563 (-61), 02762 (-55), 02093 (-54) | 02543 (+80), 01930 (+73), 01085 (+72) |
| Foot & ankle / podiatry | 60 | 6,758 | 0.16 | 0.65 | 148 of 531 | 02563 (-36), 02035 (-31), 02032 (-26) | 01032 (+42), 01468 (+40), 02657 (+40) |
| Pain management | 60 | 2,859 | 0.09 | 0.68 | 141 of 531 | 01238 (-29), 01843 (-29), 01950 (-29) | 01966 (+87), 01938 (+66), 01930 (+58) |
| Plastic & reconstructive surgery | 90 | 2,364 | 0.07 | 0.65 | 333 of 531 | 02767 (-59), 02324 (-54), 02379 (-53) | 02641 (+79), 02639 (+78), 02660 (+77) |
| Speech & language therapy | 30 | 33,090 | 0.87 | 0.76 | 147 of 531 | 02199 (-29), 01103 (-28), 01107 (-27) | 01966 (+86), 01938 (+63), 01096 (+59) |
| Nutrition & dietitian | 30 | 11,716 | 0.32 | 0.75 | 176 of 531 | 02539 (-42), 01026 (-41), 01103 (-29) | 01258 (+100), 01222 (+93), 01257 (+92) |
| Acupuncture, massage & naturopathy | 30 | 15,686 | 0.50 | 0.81 | 130 of 531 | 02557 (-40), 02568 (-40), 02575 (-40) | 01258 (+99), 01355 (+89), 01341 (+77) |
| Urgent care & emergency | 30 | 14,398 | 0.50 | 0.73 | 159 of 531 | 01373 (-45), 01230 (-43), 02534 (-37) | 01340 (+67), 01367 (+59), 01908 (+57) |
| Imaging & lab | 60 | 15,971 | 0.55 | 0.70 | 213 of 531 | 01867 (-75), 01803 (-69), 01887 (-68) | 01096 (+35), 01331 (+34), 01930 (+33) |
| Pharmacy | 30 | 51,369 | 1.68 | 0.69 | 119 of 531 | 02657 (-29), 01103 (-26), 01107 (-24) | 01032 (+65), 01367 (+51), 01266 (+45) |
| Home health & in-home care | 30 | 15,072 | 1.49 | 0.79 | 12 of 531 | 01103 (-13), 01346 (-12), 01843 (-12) | 01562 (+24), 01522 (+23), 01097 (+21) |
| Nursing & assisted living | 60 | 5,972 | 0.37 | 0.29 | 192 of 531 | 01026 (-33), 01070 (-31), 01098 (-25) | 01243 (+78), 01340 (+74), 01244 (+63) |
| Medical equipment & supplies | 60 | 8,508 | 0.34 | 0.36 | 96 of 531 | 01373 (-23), 01029 (-22), 01270 (-22) | 01096 (+43), 01097 (+30), 01244 (+30) |
| Hearing & audiology | 60 | 5,008 | 0.20 | 0.60 | 220 of 531 | 01238 (-45), 01843 (-41), 01266 (-40) | 01084 (+71), 01012 (+69), 01032 (+63) |
| Behavior therapy (ABA) | 30 | 37,994 | 2.58 | 0.77 | 171 of 531 | 01757 (-54), 01523 (-42), 02770 (-42) | 01097 (+74), 01938 (+63), 01463 (+56) |
| Care coordination & community health | 30 | 50,042 | 1.55 | 0.82 | 172 of 531 | 02649 (-35), 01103 (-34), 01107 (-33) | 01463 (+87), 01340 (+74), 01379 (+69) |
| General surgery | 60 | 12,064 | 0.39 | 0.64 | 334 of 531 | 01867 (-52), 01843 (-49), 01810 (-48) | 01085 (+59), 01095 (+59), 01075 (+54) |
| Infectious disease | 90 | 2,290 | 0.06 | 0.52 | 333 of 531 | 02035 (-94), 02071 (-93), 02061 (-91) | 01077 (+66), 01085 (+60), 01096 (+55) |
| Genetics & genetic counseling | 90 | 1,212 | 0.03 | 0.72 | 257 of 531 | 01810 (-100), 01830 (-100), 01832 (-100) | 01077 (+59), 01085 (+33), 01521 (+30) |
| Hospice & palliative care | 60 | 1,104 | 0.09 | 0.65 | 136 of 531 | 01840 (-29), 01843 (-29), 02568 (-28) | 01515 (+63), 01077 (+44), 02738 (+38) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
