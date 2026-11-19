# E2SFCA access dry run: Colorado

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 743; in Colorado: 504
- Drive times: OSRM on OpenStreetMap roads (car profile), 743 x 743 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 216,368; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.06 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.66), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 11; re-anchored: 7; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (81210, 81235)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 80435 | yes | 7.71 | 100% | 5.17 | 100% | yes (2.34) |
| 81210 | yes | 10.84 | 100% | 10.02 | 100% | no |
| 81224 | yes | 7.75 | 100% | 7.53 | 100% | no |
| 81225 | yes | 7.77 | 100% | 5.88 | 100% | yes (1.96) |
| 81235 | yes | 7.77 | 100% | 7.77 | 100% | no |
| 81237 | yes | 7.83 | 100% | 5.76 | 100% | yes (1.79) |
| 81427 | yes | 11.57 | 100% | 4.47 | 100% | yes (3.24) |
| 81642 | yes | 7.99 | 100% | 6.88 | 100% | no |
| 81649 | yes | 9.03 | 100% | 6.22 | 100% | yes (2.07) |
| 81656 | yes | 10.32 | 100% | 6.17 | 100% | yes (2.75) |
| 87512 | no | 8.27 | 100% | 3.52 | 100% | yes (2.13) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 25,616 | 4.78 | 0.47 | 312 of 502 | 81423 (-63), 81621 (-57), 81132 (-55) | 81045 (+100), 81525 (+93), 81523 (+90) |
| Pediatrics (children) | 30 | 6,063 | 1.13 | 0.74 | 210 of 502 | 81024 (-92), 81030 (-85), 80742 (-84) | 81326 (+86), 80019 (+63), 81137 (+61) |
| Women's health / OB-GYN | 60 | 4,001 | 0.55 | 0.68 | 239 of 502 | 81057 (-79), 81092 (-69), 80821 (-60) | 81036 (+100), 81323 (+100), 81433 (+100) |
| Mental health & counseling | 30 | 53,220 | 7.13 | 0.59 | 301 of 502 | 81423 (-61), 81303 (-54), 81601 (-51) | 80474 (+100), 81123 (+100), 81136 (+100) |
| Dental | 30 | 11,336 | 1.64 | 0.54 | 318 of 502 | 80482 (-73), 80812 (-49), 81303 (-48) | 80428 (+100), 80818 (+100), 80928 (+100) |
| Eye care | 30 | 3,706 | 0.65 | 0.55 | 294 of 502 | 80482 (-88), 80443 (-54), 80532 (-47) | 81121 (+100), 81525 (+94), 80829 (+89) |
| Chiropractic | 30 | 4,475 | 0.64 | 0.50 | 304 of 502 | 80821 (-76), 81240 (-50), 80734 (-47) | 80420 (+100), 80428 (+100), 80481 (+100) |
| Physical & occupational therapy | 30 | 17,175 | 2.73 | 0.60 | 303 of 502 | 81030 (-70), 80474 (-67), 81076 (-60) | 80423 (+100), 80468 (+100), 80735 (+100) |
| Orthopedics & sports injury | 60 | 2,435 | 0.42 | 0.62 | 236 of 502 | 80821 (-73), 81057 (-70), 80476 (-68) | 80423 (+100), 80448 (+100), 80498 (+100) |
| Heart / cardiology | 60 | 1,297 | 0.28 | 0.60 | 245 of 502 | 80440 (-51), 80459 (-45), 80601 (-45) | 80423 (+100), 80498 (+100), 80832 (+100) |
| Skin / dermatology | 60 | 590 | 0.10 | 0.59 | 222 of 502 | 81435 (-63), 80430 (-62), 80443 (-62) | 80423 (+100), 80467 (+100), 80473 (+100) |
| Allergy & immunology | 60 | 214 | 0.03 | 0.73 | 202 of 502 | 80759 (-100), 80640 (-64), 80443 (-63) | 80423 (+100), 80498 (+100), 80755 (+100) |
| Lung, breathing & sleep | 60 | 712 | 0.14 | 0.72 | 219 of 502 | 80234 (-51), 80005 (-45), 81611 (-45) | 81022 (+100), 81220 (+100), 81243 (+100) |
| Digestive / gastroenterology | 60 | 640 | 0.13 | 0.76 | 183 of 502 | 80137 (-58), 80817 (-58), 80601 (-56) | 80742 (+100), 81323 (+100), 81433 (+100) |
| Kidney / nephrology | 60 | 491 | 0.12 | 0.73 | 185 of 502 | 81004 (-48), 80601 (-45), 81303 (-43) | 81324 (+100), 81155 (+99), 81141 (+86) |
| Diabetes & hormones | 60 | 299 | 0.07 | 0.79 | 185 of 502 | 80234 (-56), 80241 (-56), 80601 (-55) | 81523 (+83), 81141 (+76), 80498 (+75) |
| Cancer care / oncology | 90 | 1,000 | 0.18 | 0.68 | 232 of 502 | 81303 (-79), 80601 (-77), 80137 (-69) | 81323 (+100), 81332 (+100), 81426 (+100) |
| Arthritis / rheumatology | 60 | 223 | 0.04 | 0.82 | 165 of 502 | 80137 (-63), 80118 (-59), 80817 (-55) | 80510 (+100), 81323 (+100), 81332 (+100) |
| Brain & nerves / neurology | 60 | 2,021 | 0.24 | 0.77 | 184 of 502 | 80601 (-94), 80817 (-91), 80137 (-83) | 81637 (+100), 80481 (+98), 80466 (+92) |
| Ear, nose & throat | 60 | 419 | 0.08 | 0.71 | 214 of 502 | 80601 (-60), 80137 (-58), 81303 (-57) | 81222 (+100), 81233 (+100), 81236 (+100) |
| Urology | 60 | 419 | 0.08 | 0.63 | 184 of 502 | 81303 (-67), 80498 (-58), 81019 (-56) | 80653 (+100), 80726 (+100), 80823 (+100) |
| Foot & ankle / podiatry | 60 | 618 | 0.16 | 0.64 | 166 of 502 | 81621 (-72), 80443 (-43), 80817 (-41) | 81121 (+100), 81323 (+100), 81332 (+100) |
| Pain management | 60 | 469 | 0.09 | 0.68 | 220 of 502 | 81435 (-59), 80446 (-53), 80817 (-49) | 80483 (+100), 80498 (+100), 80823 (+100) |
| Plastic & reconstructive surgery | 90 | 368 | 0.07 | 0.76 | 230 of 502 | 81303 (-100), 81326 (-100), 80601 (-62) | 81323 (+100), 81630 (+100), 80474 (+96) |
| Speech & language therapy | 30 | 5,360 | 0.87 | 0.73 | 286 of 502 | 80510 (-76), 80747 (-68), 81030 (-67) | 81523 (+77), 80804 (+75), 80726 (+74) |
| Nutrition & dietitian | 30 | 2,139 | 0.32 | 0.66 | 279 of 502 | 81428 (-78), 80483 (-68), 81137 (-54) | 80474 (+100), 80480 (+100), 80510 (+100) |
| Acupuncture, massage & naturopathy | 30 | 5,470 | 0.50 | 0.61 | 230 of 502 | 80835 (-83), 80743 (-69), 81324 (-61) | 80420 (+100), 80423 (+100), 80428 (+100) |
| Urgent care & emergency | 30 | 3,344 | 0.50 | 0.44 | 297 of 502 | 80864 (-78), 80813 (-76), 80436 (-71) | 80420 (+100), 80423 (+100), 80468 (+100) |
| Imaging & lab | 60 | 2,918 | 0.55 | 0.70 | 211 of 502 | 80420 (-60), 80601 (-47), 80234 (-42) | 81128 (+100), 81323 (+100), 81332 (+100) |
| Pharmacy | 30 | 7,281 | 1.68 | 0.43 | 272 of 502 | 80474 (-88), 80103 (-74), 81030 (-61) | 81045 (+88), 81331 (+88), 81335 (+88) |
| Home health & in-home care | 30 | 4,480 | 1.49 | 0.52 | 146 of 502 | 81612 (-88), 80451 (-87), 80510 (-76) | 80726 (+100), 80736 (+100), 80747 (+100) |
| Nursing & assisted living | 60 | 2,103 | 0.37 | 0.64 | 218 of 502 | 80105 (-73), 81143 (-72), 81428 (-63) | 80745 (+100), 80755 (+100), 80812 (+100) |
| Medical equipment & supplies | 60 | 1,643 | 0.34 | 0.62 | 216 of 502 | 80482 (-60), 81621 (-45), 81435 (-41) | 80448 (+100), 81237 (+100), 81243 (+100) |
| Hearing & audiology | 60 | 1,429 | 0.20 | 0.65 | 242 of 502 | 80735 (-68), 81428 (-65), 81071 (-63) | 80449 (+100), 80545 (+100), 80823 (+100) |
| Behavior therapy (ABA) | 30 | 16,435 | 2.58 | 0.75 | 159 of 502 | 80439 (-66), 80204 (-47), 81630 (-38) | 80809 (+100), 80813 (+100), 80860 (+100) |
| Care coordination & community health | 30 | 8,953 | 1.55 | 0.48 | 238 of 502 | 80451 (-94), 80443 (-75), 81656 (-66) | 80612 (+100), 80624 (+100), 80650 (+100) |
| General surgery | 60 | 2,796 | 0.39 | 0.67 | 225 of 502 | 80601 (-63), 80137 (-58), 80234 (-53) | 80423 (+100), 80498 (+100), 81323 (+100) |
| Infectious disease | 90 | 266 | 0.06 | 0.75 | 179 of 502 | 81303 (-80), 80601 (-70), 81326 (-68) | 81323 (+100), 81332 (+100), 81426 (+100) |
| Genetics & genetic counseling | 90 | 200 | 0.03 | 0.77 | 186 of 502 | 80137 (-82), 80128 (-79), 80234 (-79) | 80829 (+75), 80906 (+75), 80650 (+70) |
| Hospice & palliative care | 60 | 429 | 0.09 | 0.58 | 220 of 502 | 80451 (-72), 81303 (-65), 80601 (-47) | 80745 (+100), 80823 (+100), 80832 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
