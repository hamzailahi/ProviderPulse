# E2SFCA access dry run: Iowa

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,429; in Iowa: 946
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,429 x 2,429 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 240,892; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.63 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.57), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 1; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 61322 | no | 7.72 | 100% | 3.33 | 100% | yes (1.47) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 30,810 | 4.78 | 0.47 | 344 of 946 | 51640 (-62), 52565 (-46), 50854 (-45) | 52755 (+92), 52317 (+78), 50464 (+69) |
| Pediatrics (children) | 30 | 5,849 | 1.13 | 0.79 | 82 of 946 | 52171 (-36), 52776 (-30), 51047 (-28) | 52755 (+91), 52317 (+82), 50211 (+71) |
| Women's health / OB-GYN | 60 | 3,120 | 0.55 | 0.64 | 315 of 946 | 52338 (-56), 52203 (-54), 52236 (-54) | 50629 (+59), 50069 (+53), 52658 (+52) |
| Mental health & counseling | 30 | 42,290 | 7.13 | 0.66 | 231 of 946 | 50144 (-31), 52101 (-29), 50022 (-23) | 52755 (+93), 50261 (+65), 52327 (+63) |
| Dental | 30 | 10,343 | 1.64 | 0.53 | 351 of 946 | 50858 (-39), 50144 (-38), 50849 (-38) | 52755 (+94), 52053 (+72), 52317 (+70) |
| Eye care | 30 | 4,745 | 0.65 | 0.57 | 490 of 946 | 52043 (-59), 50841 (-55), 52044 (-48) | 50851 (+100), 52053 (+100), 50861 (+98) |
| Chiropractic | 30 | 8,186 | 0.64 | 0.53 | 526 of 946 | 50863 (-55), 52247 (-53), 50217 (-51) | 50256 (+100), 50430 (+100), 50556 (+100) |
| Physical & occupational therapy | 30 | 20,848 | 2.73 | 0.57 | 370 of 946 | 52172 (-62), 50841 (-56), 52349 (-40) | 50256 (+88), 50670 (+81), 52053 (+81) |
| Orthopedics & sports injury | 60 | 3,440 | 0.42 | 0.55 | 475 of 946 | 50170 (-87), 50138 (-85), 50262 (-85) | 52561 (+61), 51640 (+57), 50101 (+56) |
| Heart / cardiology | 60 | 1,361 | 0.28 | 0.55 | 253 of 946 | 52776 (-100), 52203 (-96), 52236 (-95) | 50261 (+68), 50063 (+66), 50069 (+64) |
| Skin / dermatology | 60 | 556 | 0.10 | 0.64 | 370 of 946 | 52776 (-100), 52228 (-94), 52201 (-90) | 52053 (+76), 50520 (+62), 50069 (+60) |
| Allergy & immunology | 60 | 193 | 0.03 | 0.59 | 342 of 946 | 52201 (-100), 52203 (-100), 52228 (-100) | 50201 (+76), 52561 (+75), 52746 (+72) |
| Lung, breathing & sleep | 60 | 714 | 0.14 | 0.67 | 224 of 946 | 52776 (-100), 52203 (-98), 52307 (-93) | 50261 (+61), 50063 (+59), 50069 (+56) |
| Digestive / gastroenterology | 60 | 609 | 0.13 | 0.59 | 202 of 946 | 52201 (-100), 52338 (-100), 52236 (-95) | 50063 (+59), 50069 (+57), 50038 (+53) |
| Kidney / nephrology | 60 | 618 | 0.12 | 0.50 | 524 of 946 | 52776 (-88), 52236 (-76), 52338 (-75) | 52207 (+86), 52254 (+86), 52309 (+84) |
| Diabetes & hormones | 60 | 395 | 0.07 | 0.61 | 282 of 946 | 52776 (-100), 52201 (-93), 52236 (-87) | 50201 (+74), 50146 (+67), 51040 (+67) |
| Cancer care / oncology | 90 | 840 | 0.18 | 0.30 | 498 of 946 | 52201 (-100), 52228 (-100), 52338 (-100) | 52658 (+84), 52624 (+75), 50009 (+60) |
| Arthritis / rheumatology | 60 | 215 | 0.04 | 0.55 | 248 of 946 | 52201 (-100), 52203 (-100), 52236 (-100) | 52031 (+82), 52053 (+79), 52624 (+70) |
| Brain & nerves / neurology | 60 | 1,060 | 0.24 | 0.63 | 198 of 946 | 52203 (-100), 52236 (-100), 52307 (-100) | 51526 (+48), 50464 (+41), 51062 (+38) |
| Ear, nose & throat | 60 | 522 | 0.08 | 0.56 | 458 of 946 | 52201 (-100), 52203 (-100), 52206 (-100) | 52746 (+71), 50612 (+68), 52624 (+66) |
| Urology | 60 | 467 | 0.08 | 0.57 | 478 of 946 | 52201 (-100), 52203 (-100), 52236 (-100) | 52746 (+74), 52758 (+69), 51649 (+64) |
| Foot & ankle / podiatry | 60 | 912 | 0.16 | 0.57 | 521 of 946 | 50217 (-100), 50529 (-100), 50543 (-100) | 50066 (+72), 50277 (+67), 51548 (+67) |
| Pain management | 60 | 320 | 0.09 | 0.63 | 186 of 946 | 52726 (-47), 52747 (-44), 52769 (-43) | 52247 (+75), 52755 (+66), 50261 (+64) |
| Plastic & reconstructive surgery | 90 | 320 | 0.07 | 0.43 | 372 of 946 | 52776 (-84), 52306 (-79), 52351 (-78) | 52758 (+73), 50063 (+64), 50261 (+64) |
| Speech & language therapy | 30 | 5,921 | 0.87 | 0.69 | 188 of 946 | 50115 (-48), 52172 (-47), 50622 (-37) | 52755 (+75), 50007 (+68), 50668 (+68) |
| Nutrition & dietitian | 30 | 2,272 | 0.32 | 0.64 | 415 of 946 | 50849 (-59), 51540 (-58), 50525 (-57) | 52755 (+95), 51545 (+85), 51650 (+83) |
| Acupuncture, massage & naturopathy | 30 | 1,365 | 0.50 | 0.78 | 63 of 946 | 50542 (-43), 52620 (-43), 52626 (-29) | 52651 (+67), 52585 (+53), 52580 (+51) |
| Urgent care & emergency | 30 | 2,820 | 0.50 | 0.47 | 402 of 946 | 51640 (-76), 50423 (-62), 52043 (-59) | 50136 (+100), 50540 (+100), 50542 (+100) |
| Imaging & lab | 60 | 2,814 | 0.55 | 0.56 | 291 of 946 | 52351 (-100), 52228 (-99), 52236 (-94) | 52202 (+61), 50464 (+56), 50456 (+45) |
| Pharmacy | 30 | 12,347 | 1.68 | 0.46 | 464 of 946 | 52076 (-53), 51449 (-43), 50119 (-42) | 50515 (+99), 52755 (+91), 50527 (+86) |
| Home health & in-home care | 30 | 34,785 | 1.49 | 0.59 | 138 of 946 | 50854 (-65), 51649 (-64), 51047 (-44) | 51654 (+93), 51556 (+91), 51555 (+85) |
| Nursing & assisted living | 60 | 4,334 | 0.37 | 0.60 | 394 of 946 | 50071 (-100), 50271 (-92), 50650 (-68) | 52309 (+82), 50222 (+78), 50257 (+74) |
| Medical equipment & supplies | 60 | 2,159 | 0.34 | 0.61 | 421 of 946 | 51632 (-60), 50585 (-57), 51033 (-53) | 52746 (+58), 51357 (+54), 50026 (+49) |
| Hearing & audiology | 60 | 1,681 | 0.20 | 0.57 | 536 of 946 | 50482 (-100), 50585 (-100), 51033 (-100) | 52586 (+63), 51548 (+62), 51571 (+60) |
| Behavior therapy (ABA) | 30 | 10,233 | 2.58 | 0.86 | 49 of 946 | 50313 (-23), 52160 (-22), 50322 (-15) | 51526 (+65), 51503 (+53), 50109 (+45) |
| Care coordination & community health | 30 | 5,927 | 1.55 | 0.71 | 104 of 946 | 50115 (-22), 51036 (-22), 51340 (-18) | 51526 (+54), 51503 (+46), 52327 (+45) |
| General surgery | 60 | 2,265 | 0.39 | 0.48 | 413 of 946 | 52201 (-100), 52776 (-100), 52338 (-89) | 51062 (+61), 50101 (+54), 50421 (+54) |
| Infectious disease | 90 | 236 | 0.06 | 0.41 | 328 of 946 | 52201 (-100), 52236 (-100), 52322 (-100) | 50009 (+71), 52572 (+71), 52574 (+64) |
| Genetics & genetic counseling | 90 | 224 | 0.03 | 0.37 | 350 of 946 | 51023 (-100), 51230 (-100), 51240 (-100) | 51436 (+80), 51451 (+80), 51444 (+79) |
| Hospice & palliative care | 60 | 452 | 0.09 | 0.61 | 500 of 946 | 50138 (-63), 51350 (-59), 51249 (-55) | 50222 (+76), 51571 (+76), 51630 (+73) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
