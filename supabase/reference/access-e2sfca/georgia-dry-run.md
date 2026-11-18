# E2SFCA access dry run: Georgia

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,933; in Georgia: 718
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,933 x 1,933 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 571,514; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.75 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.87), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 0; still implausible (left out of the rank comparison, marked in the CSV): 2 (29446, 29915)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 29446 | no | 6.91 | 100% | 6.91 | 100% | no |
| 29915 | no | 18.10 | 100% | 18.10 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 93,954 | 4.78 | 0.51 | 340 of 718 | 31792 (-59), 39837 (-53), 31533 (-49) | 31020 (+91), 30750 (+85), 30730 (+80) |
| Pediatrics (children) | 30 | 17,513 | 1.13 | 0.72 | 212 of 718 | 31699 (-70), 31314 (-62), 30071 (-56) | 31031 (+79), 30750 (+75), 31020 (+63) |
| Women's health / OB-GYN | 60 | 10,298 | 0.55 | 0.76 | 251 of 718 | 31781 (-56), 31647 (-52), 31620 (-48) | 30543 (+80), 30554 (+71), 30427 (+69) |
| Mental health & counseling | 30 | 101,716 | 7.13 | 0.76 | 141 of 718 | 31699 (-57), 31730 (-57), 31315 (-56) | 31804 (+50), 31811 (+50), 30750 (+44) |
| Dental | 30 | 26,039 | 1.64 | 0.65 | 215 of 718 | 39813 (-72), 31699 (-56), 30909 (-36) | 30427 (+81), 30816 (+71), 30808 (+64) |
| Eye care | 30 | 10,961 | 0.65 | 0.64 | 300 of 718 | 31699 (-60), 31315 (-58), 31314 (-50) | 31331 (+58), 31305 (+57), 31523 (+56) |
| Chiropractic | 30 | 12,337 | 0.64 | 0.69 | 253 of 718 | 30513 (-51), 30677 (-51), 31533 (-45) | 30669 (+87), 30171 (+77), 30184 (+70) |
| Physical & occupational therapy | 30 | 48,279 | 2.73 | 0.68 | 221 of 718 | 31830 (-63), 31792 (-53), 31314 (-52) | 30750 (+79), 31638 (+53), 31821 (+51) |
| Orthopedics & sports injury | 60 | 8,306 | 0.42 | 0.71 | 279 of 718 | 31647 (-59), 31620 (-48), 31042 (-47) | 31821 (+86), 31630 (+80), 30669 (+78) |
| Heart / cardiology | 60 | 4,720 | 0.28 | 0.73 | 297 of 718 | 31407 (-51), 30071 (-50), 30097 (-50) | 30543 (+76), 30747 (+76), 30527 (+74) |
| Skin / dermatology | 60 | 1,583 | 0.10 | 0.80 | 216 of 718 | 31003 (-46), 31017 (-43), 31042 (-41) | 30669 (+88), 30642 (+72), 31811 (+54) |
| Allergy & immunology | 60 | 542 | 0.03 | 0.79 | 299 of 718 | 39845 (-59), 39823 (-56), 30331 (-53) | 30669 (+100), 30816 (+87), 30597 (+76) |
| Lung, breathing & sleep | 60 | 2,555 | 0.14 | 0.77 | 260 of 718 | 31003 (-100), 31017 (-97), 30411 (-88) | 30530 (+76), 30646 (+75), 30543 (+69) |
| Digestive / gastroenterology | 60 | 2,061 | 0.13 | 0.72 | 282 of 718 | 31003 (-60), 31017 (-56), 31620 (-52) | 30554 (+84), 30543 (+83), 30747 (+70) |
| Kidney / nephrology | 60 | 2,350 | 0.12 | 0.63 | 348 of 718 | 31003 (-96), 31017 (-88), 31042 (-88) | 30527 (+76), 30543 (+74), 30669 (+70) |
| Diabetes & hormones | 60 | 930 | 0.07 | 0.83 | 222 of 718 | 31307 (-41), 31326 (-40), 30071 (-38) | 30251 (+78), 30543 (+62), 30554 (+62) |
| Cancer care / oncology | 90 | 2,817 | 0.18 | 0.60 | 408 of 718 | 31307 (-46), 31326 (-46), 31548 (-45) | 30555 (+71), 30543 (+69), 30646 (+67) |
| Arthritis / rheumatology | 60 | 679 | 0.04 | 0.78 | 273 of 718 | 31647 (-59), 31789 (-51), 31620 (-48) | 30669 (+100), 30816 (+91), 30642 (+83) |
| Brain & nerves / neurology | 60 | 3,565 | 0.24 | 0.79 | 236 of 718 | 30336 (-47), 30071 (-43), 30087 (-41) | 30543 (+82), 30527 (+79), 30554 (+78) |
| Ear, nose & throat | 60 | 1,294 | 0.08 | 0.72 | 319 of 718 | 30297 (-54), 30331 (-53), 31044 (-52) | 30543 (+80), 30251 (+68), 30554 (+68) |
| Urology | 60 | 1,520 | 0.08 | 0.68 | 317 of 718 | 31003 (-65), 31781 (-61), 31017 (-59) | 30669 (+93), 30543 (+78), 30527 (+76) |
| Foot & ankle / podiatry | 60 | 2,304 | 0.16 | 0.69 | 220 of 718 | 31044 (-44), 31629 (-39), 31720 (-36) | 30543 (+73), 30828 (+61), 30554 (+58) |
| Pain management | 60 | 1,818 | 0.09 | 0.72 | 360 of 718 | 31044 (-68), 31003 (-67), 31781 (-62) | 30543 (+72), 30183 (+70), 30527 (+70) |
| Plastic & reconstructive surgery | 90 | 1,185 | 0.07 | 0.68 | 379 of 718 | 31320 (-61), 30087 (-55), 31309 (-55) | 30537 (+83), 30568 (+81), 30646 (+81) |
| Speech & language therapy | 30 | 15,357 | 0.87 | 0.64 | 279 of 718 | 39840 (-46), 30662 (-43), 39819 (-41) | 31638 (+97), 30669 (+82), 31636 (+82) |
| Nutrition & dietitian | 30 | 5,186 | 0.32 | 0.68 | 222 of 718 | 39837 (-84), 30730 (-67), 30240 (-51) | 30427 (+100), 31821 (+89), 31316 (+79) |
| Acupuncture, massage & naturopathy | 30 | 6,138 | 0.50 | 0.77 | 87 of 718 | 30513 (-36), 30525 (-33), 31816 (-31) | 31523 (+40), 31527 (+37), 30555 (+34) |
| Urgent care & emergency | 30 | 8,645 | 0.50 | 0.52 | 325 of 718 | 31635 (-58), 30165 (-52), 31792 (-52) | 30427 (+100), 31320 (+100), 31309 (+97) |
| Imaging & lab | 60 | 9,006 | 0.55 | 0.76 | 229 of 718 | 31003 (-42), 31781 (-41), 30336 (-40) | 30543 (+82), 30554 (+78), 30427 (+69) |
| Pharmacy | 30 | 33,954 | 1.68 | 0.49 | 332 of 718 | 31730 (-64), 31533 (-51), 31792 (-51) | 30454 (+85), 31012 (+83), 31009 (+76) |
| Home health & in-home care | 30 | 20,268 | 1.49 | 0.71 | 184 of 718 | 30708 (-96), 30665 (-68), 30678 (-68) | 31716 (+64), 39826 (+59), 39862 (+54) |
| Nursing & assisted living | 60 | 7,631 | 0.37 | 0.72 | 233 of 718 | 31643 (-60), 31096 (-52), 31005 (-41) | 31631 (+70), 30817 (+57), 30725 (+56) |
| Medical equipment & supplies | 60 | 7,976 | 0.34 | 0.73 | 307 of 718 | 31003 (-77), 31647 (-66), 31017 (-65) | 30541 (+63), 31638 (+63), 30747 (+59) |
| Hearing & audiology | 60 | 3,467 | 0.20 | 0.75 | 242 of 718 | 31003 (-49), 31017 (-46), 31620 (-46) | 30543 (+79), 30669 (+74), 30427 (+70) |
| Behavior therapy (ABA) | 30 | 37,074 | 2.58 | 0.77 | 162 of 718 | 30513 (-72), 30677 (-57), 30621 (-50) | 31811 (+99), 30669 (+86), 31309 (+83) |
| Care coordination & community health | 30 | 11,836 | 1.55 | 0.68 | 76 of 718 | 31315 (-60), 31314 (-54), 39840 (-49) | 31811 (+92), 31804 (+81), 30750 (+77) |
| General surgery | 60 | 7,123 | 0.39 | 0.73 | 277 of 718 | 31003 (-56), 31017 (-54), 30336 (-47) | 30543 (+69), 30564 (+68), 30750 (+68) |
| Infectious disease | 90 | 848 | 0.06 | 0.68 | 349 of 718 | 30078 (-74), 30058 (-73), 30087 (-71) | 30750 (+78), 30725 (+77), 31638 (+72) |
| Genetics & genetic counseling | 90 | 462 | 0.03 | 0.68 | 249 of 718 | 30122 (-66), 30297 (-64), 30273 (-63) | 30750 (+81), 30725 (+76), 31044 (+64) |
| Hospice & palliative care | 60 | 1,506 | 0.09 | 0.72 | 337 of 718 | 30562 (-67), 31044 (-56), 30297 (-51) | 30541 (+92), 30669 (+74), 30251 (+65) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 30303 | Primary care / family doctor | 8.826 | 10.181 | 8 | 0 |
| 30303 | Mental health & counseling | 9.481 | 11.676 | 34 | 18 |
| 30303 | Heart / cardiology | 0.671 | 0.462 | 0 | 18 |
| 30303 | Cancer care / oncology | 0.544 | 0.234 | 0 | 34 |
| 30303 | Urgent care & emergency | 1.073 | 1.182 | 0 | 0 |
| 31401 | Primary care / family doctor | 7.287 | 8.984 | 24 | 6 |
| 31401 | Mental health & counseling | 6.006 | 7.349 | 58 | 48 |
| 31401 | Heart / cardiology | 0.360 | 0.407 | 36 | 28 |
| 31401 | Cancer care / oncology | 0.331 | 0.233 | 7 | 35 |
| 31401 | Urgent care & emergency | 0.585 | 0.899 | 41 | 10 |
| 31201 | Primary care / family doctor | 9.400 | 14.056 | 2 | 0 |
| 31201 | Mental health & counseling | 4.419 | 5.104 | 69 | 64 |
| 31201 | Heart / cardiology | 0.620 | 0.375 | 0 | 33 |
| 31201 | Cancer care / oncology | 0.292 | 0.137 | 18 | 61 |
| 31201 | Urgent care & emergency | 0.755 | 1.006 | 24 | 0 |
| 30901 | Primary care / family doctor | 5.163 | 5.752 | 46 | 40 |
| 30901 | Mental health & counseling | 6.243 | 6.087 | 56 | 57 |
| 30901 | Heart / cardiology | 0.423 | 0.321 | 25 | 43 |
| 30901 | Cancer care / oncology | 0.127 | 0.064 | 64 | 82 |
| 30901 | Urgent care & emergency | 0.484 | 0.529 | 51 | 47 |
| 31701 | Primary care / family doctor | 4.799 | 7.964 | 50 | 17 |
| 31701 | Mental health & counseling | 3.193 | 5.237 | 78 | 63 |
| 31701 | Heart / cardiology | 0.212 | 0.208 | 62 | 63 |
| 31701 | Cancer care / oncology | 0.144 | 0.110 | 59 | 69 |
| 31701 | Urgent care & emergency | 0.375 | 0.694 | 62 | 30 |
| 30501 | Primary care / family doctor | 5.224 | 6.487 | 45 | 32 |
| 30501 | Mental health & counseling | 2.855 | 3.250 | 80 | 77 |
| 30501 | Heart / cardiology | 0.578 | 0.221 | 0 | 61 |
| 30501 | Cancer care / oncology | 0.179 | 0.129 | 50 | 64 |
| 30501 | Urgent care & emergency | 0.372 | 0.482 | 63 | 52 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 28720 rows (ZIP x specialty) stored in access_e2sfca for GA; market-score now uses drive-time access for these ZIPs.
