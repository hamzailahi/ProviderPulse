# E2SFCA access dry run: New Hampshire

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,359; in New Hampshire: 244
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,359 x 1,359 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 360,886; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.32 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.29), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 13; re-anchored: 7; still implausible (left out of the rank comparison, still stored, marked in the CSV): 8 (02642, 02652, 02657, 02663, 02666, 02667, 04017, 04019)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 01085 | no | 9.58 | 100% | 2.73 | 100% | yes (1.72) |
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 02642 | no | 2.52 | 42% | 2.52 | 42% | no |
| 02652 | no | 1.97 | 42% | 1.97 | 42% | no |
| 02657 | no | 2.36 | 42% | 2.36 | 42% | no |
| 02663 | no | 2.67 | 42% | 2.67 | 42% | no |
| 02666 | no | 2.67 | 42% | 2.67 | 42% | no |
| 02667 | no | 2.69 | 42% | 2.69 | 42% | no |
| 04017 | no | 19.44 | 100% | 9.82 | 100% | yes (2.36) |
| 04019 | no | 15.96 | 100% | 13.49 | 100% | yes (1.64) |
| 04050 | no | 10.89 | 100% | 5.94 | 100% | yes (2.04) |
| 04568 | no | 10.76 | 100% | 3.85 | 100% | yes (1.87) |
| 04925 | no | 8.95 | 100% | 6.02 | 100% | yes (2.30) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 46,459 | 4.78 | 0.53 | 115 of 244 | 03465 (-52), 03576 (-49), 03264 (-38) | 03307 (+96), 03215 (+94), 03771 (+82) |
| Pediatrics (children) | 30 | 17,969 | 1.13 | 0.54 | 97 of 244 | 03264 (-53), 03818 (-48), 03581 (-42) | 03307 (+73), 03771 (+56), 03215 (+52) |
| Women's health / OB-GYN | 60 | 6,115 | 0.55 | 0.65 | 119 of 244 | 03849 (-54), 03465 (-45), 03875 (-45) | 03057 (+68), 03307 (+67), 03215 (+65) |
| Mental health & counseling | 30 | 103,797 | 7.13 | 0.50 | 118 of 244 | 03465 (-57), 03576 (-50), 03570 (-42) | 03307 (+92), 03771 (+86), 03215 (+83) |
| Dental | 30 | 18,808 | 1.64 | 0.63 | 120 of 244 | 03465 (-58), 03581 (-58), 03249 (-48) | 03215 (+86), 03307 (+86), 03457 (+79) |
| Eye care | 30 | 6,072 | 0.65 | 0.55 | 112 of 244 | 03576 (-63), 03249 (-61), 03465 (-47) | 03771 (+94), 03307 (+92), 03595 (+86) |
| Chiropractic | 30 | 4,352 | 0.64 | 0.65 | 108 of 244 | 03581 (-54), 03580 (-44), 03609 (-42) | 03215 (+74), 03082 (+63), 03307 (+58) |
| Physical & occupational therapy | 30 | 34,115 | 2.73 | 0.59 | 137 of 244 | 03465 (-38), 03581 (-37), 03894 (-36) | 03215 (+100), 03307 (+82), 03575 (+77) |
| Orthopedics & sports injury | 60 | 4,243 | 0.42 | 0.49 | 152 of 244 | 03276 (-87), 03235 (-74), 03282 (-73) | 03215 (+62), 03850 (+62), 03307 (+57) |
| Heart / cardiology | 60 | 2,715 | 0.28 | 0.64 | 85 of 244 | 03276 (-42), 03077 (-40), 03234 (-40) | 03303 (+64), 03046 (+63), 03224 (+61) |
| Skin / dermatology | 60 | 1,232 | 0.10 | 0.54 | 128 of 244 | 03257 (-100), 03284 (-100), 03751 (-100) | 03854 (+70), 03870 (+69), 03871 (+66) |
| Allergy & immunology | 60 | 349 | 0.03 | 0.66 | 89 of 244 | 03223 (-56), 03279 (-42), 03465 (-41) | 03215 (+100), 03574 (+70), 03457 (+66) |
| Lung, breathing & sleep | 60 | 1,207 | 0.14 | 0.59 | 103 of 244 | 03276 (-56), 03293 (-47), 03235 (-46) | 03853 (+76), 03307 (+50), 03595 (+49) |
| Digestive / gastroenterology | 60 | 1,299 | 0.13 | 0.70 | 100 of 244 | 03077 (-42), 03465 (-36), 03609 (-35) | 03307 (+74), 03258 (+64), 03303 (+62) |
| Kidney / nephrology | 60 | 816 | 0.12 | 0.57 | 59 of 244 | 03470 (-25), 03465 (-24), 03466 (-23) | 03854 (+52), 03457 (+49), 03445 (+47) |
| Diabetes & hormones | 60 | 926 | 0.07 | 0.55 | 161 of 244 | 03849 (-61), 03077 (-56), 03875 (-55) | 03579 (+93), 03597 (+77), 03215 (+68) |
| Cancer care / oncology | 90 | 2,069 | 0.18 | 0.55 | 85 of 244 | 03079 (-60), 03087 (-48), 03060 (-43) | 03457 (+86), 03445 (+85), 03448 (+83) |
| Arthritis / rheumatology | 60 | 488 | 0.04 | 0.62 | 144 of 244 | 03465 (-65), 03464 (-58), 03470 (-52) | 03853 (+67), 03278 (+65), 03221 (+63) |
| Brain & nerves / neurology | 60 | 2,586 | 0.24 | 0.61 | 100 of 244 | 03079 (-34), 03087 (-32), 03745 (-31) | 03753 (+59), 03755 (+58), 03770 (+57) |
| Ear, nose & throat | 60 | 686 | 0.08 | 0.61 | 126 of 244 | 03276 (-62), 03237 (-59), 03609 (-59) | 03853 (+96), 03229 (+69), 03275 (+67) |
| Urology | 60 | 800 | 0.08 | 0.60 | 141 of 244 | 03609 (-81), 03465 (-66), 03602 (-59) | 03229 (+68), 03275 (+64), 03303 (+63) |
| Foot & ankle / podiatry | 60 | 1,144 | 0.16 | 0.52 | 120 of 244 | 03583 (-41), 03849 (-40), 03817 (-38) | 03854 (+70), 03870 (+67), 03588 (+58) |
| Pain management | 60 | 545 | 0.09 | 0.59 | 127 of 244 | 03251 (-68), 03293 (-62), 03262 (-53) | 03886 (+78), 03871 (+62), 03259 (+56) |
| Plastic & reconstructive surgery | 90 | 534 | 0.07 | 0.67 | 71 of 244 | 03079 (-43), 03087 (-39), 03060 (-37) | 03307 (+88), 03258 (+83), 03303 (+77) |
| Speech & language therapy | 30 | 7,774 | 0.87 | 0.67 | 117 of 244 | 03593 (-59), 03574 (-36), 03103 (-35) | 03810 (+83), 03307 (+73), 03450 (+72) |
| Nutrition & dietitian | 30 | 4,242 | 0.32 | 0.52 | 125 of 244 | 03278 (-57), 03264 (-56), 03465 (-56) | 03579 (+100), 03592 (+100), 03590 (+96) |
| Acupuncture, massage & naturopathy | 30 | 4,801 | 0.50 | 0.61 | 113 of 244 | 03241 (-68), 03576 (-43), 03101 (-33) | 03215 (+100), 03443 (+100), 03451 (+98) |
| Urgent care & emergency | 30 | 4,511 | 0.50 | 0.53 | 118 of 244 | 03465 (-76), 03849 (-48), 03264 (-47) | 03590 (+100), 03592 (+100), 03597 (+100) |
| Imaging & lab | 60 | 5,126 | 0.55 | 0.60 | 83 of 244 | 03609 (-32), 03291 (-27), 03077 (-25) | 03307 (+49), 03597 (+48), 03057 (+45) |
| Pharmacy | 30 | 13,366 | 1.68 | 0.50 | 117 of 244 | 03576 (-58), 03785 (-48), 03293 (-47) | 03307 (+79), 03771 (+77), 03595 (+68) |
| Home health & in-home care | 30 | 5,868 | 1.49 | 0.61 | 21 of 244 | 03576 (-28), 03766 (-13), 03784 (-13) | 03597 (+27), 03593 (+24), 03582 (+23) |
| Nursing & assisted living | 60 | 2,686 | 0.37 | 0.44 | 108 of 244 | 03597 (-43), 03456 (-40), 03609 (-40) | 03450 (+66), 03084 (+63), 03780 (+60) |
| Medical equipment & supplies | 60 | 1,917 | 0.34 | 0.60 | 114 of 244 | 03836 (-44), 03890 (-38), 03293 (-37) | 03275 (+57), 03215 (+51), 03307 (+49) |
| Hearing & audiology | 60 | 1,751 | 0.20 | 0.54 | 155 of 244 | 03276 (-85), 03235 (-69), 03609 (-59) | 03853 (+86), 03846 (+64), 03266 (+59) |
| Behavior therapy (ABA) | 30 | 19,273 | 2.58 | 0.81 | 44 of 244 | 03466 (-35), 03217 (-31), 03860 (-25) | 03441 (+44), 03052 (+39), 03854 (+37) |
| Care coordination & community health | 30 | 13,946 | 1.55 | 0.55 | 83 of 244 | 03465 (-75), 03234 (-46), 03766 (-42) | 03215 (+100), 03259 (+100), 03581 (+100) |
| General surgery | 60 | 3,404 | 0.39 | 0.53 | 117 of 244 | 03077 (-46), 03836 (-44), 03890 (-44) | 03307 (+69), 03854 (+66), 03857 (+61) |
| Infectious disease | 90 | 676 | 0.06 | 0.55 | 88 of 244 | 03087 (-65), 03038 (-58), 03079 (-56) | 03445 (+86), 03457 (+86), 03448 (+85) |
| Genetics & genetic counseling | 90 | 457 | 0.03 | 0.55 | 101 of 244 | 03079 (-100), 03874 (-96), 03865 (-89) | 03812 (+87), 03838 (+84), 03846 (+78) |
| Hospice & palliative care | 60 | 486 | 0.09 | 0.61 | 137 of 244 | 03237 (-45), 03077 (-42), 03293 (-42) | 03597 (+88), 03590 (+77), 03254 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-19

- 9760 rows (ZIP x specialty) stored in access_e2sfca for NH; market-score now uses drive-time access for these ZIPs.
