# E2SFCA access dry run: Louisiana

Run 2026-11-18 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,213; in Louisiana: 521
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,213 x 1,213 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 217,903; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.72 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.79), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 11; re-anchored: 3; still implausible (left out of the rank comparison, marked in the CSV): 5 (36602, 36603, 36604, 70712, 71316)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 36602 | no | 13.88 | 100% | 11.05 | 100% | yes (19.78) |
| 36603 | no | 13.47 | 100% | 16.24 | 100% | no |
| 36604 | no | 14.43 | 100% | 17.93 | 100% | no |
| 36607 | no | 18.36 | 100% | 0.05 | 100% | no |
| 36610 | no | 14.00 | 100% | 0.06 | 100% | no |
| 36611 | no | 12.96 | 100% | 5.15 | 100% | yes (17.81) |
| 36617 | no | 14.37 | 100% | 0.06 | 100% | no |
| 36652 | no | 17.31 | 100% | 6.20 | 100% | yes (17.42) |
| 36663 | no | 10.72 | 100% | 0.04 | 100% | no |
| 70712 | yes | 6.81 | 100% | 6.81 | 100% | no |
| 71316 | yes | 7.30 | 100% | 7.30 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 33,930 | 4.78 | 0.47 | 285 of 519 | 70643 (-72), 70631 (-66), 71340 (-61) | 70780 (+97), 71424 (+90), 71409 (+88) |
| Pediatrics (children) | 30 | 5,817 | 1.13 | 0.67 | 185 of 519 | 70775 (-54), 70433 (-39), 70301 (-34) | 70780 (+98), 70031 (+87), 71424 (+79) |
| Women's health / OB-GYN | 60 | 3,122 | 0.55 | 0.73 | 184 of 519 | 71004 (-43), 70080 (-42), 71060 (-41) | 71068 (+99), 71034 (+98), 71052 (+86) |
| Mental health & counseling | 30 | 38,878 | 7.13 | 0.60 | 257 of 519 | 70787 (-76), 71373 (-70), 70722 (-61) | 71472 (+90), 71424 (+87), 71006 (+81) |
| Dental | 30 | 8,508 | 1.64 | 0.59 | 198 of 519 | 71079 (-76), 71261 (-76), 70747 (-61) | 70431 (+58), 71474 (+57), 70031 (+52) |
| Eye care | 30 | 3,632 | 0.65 | 0.58 | 230 of 519 | 70039 (-44), 71351 (-42), 70360 (-40) | 71424 (+90), 71472 (+84), 71409 (+83) |
| Chiropractic | 30 | 2,638 | 0.64 | 0.54 | 193 of 519 | 71342 (-70), 70775 (-53), 70471 (-38) | 70431 (+70), 70665 (+62), 70633 (+61) |
| Physical & occupational therapy | 30 | 14,655 | 2.73 | 0.55 | 225 of 519 | 71418 (-61), 71201 (-41), 71209 (-41) | 70780 (+79), 70431 (+60), 71243 (+59) |
| Orthopedics & sports injury | 60 | 2,660 | 0.42 | 0.74 | 226 of 519 | 71426 (-54), 71449 (-48), 70726 (-42) | 70740 (+90), 70764 (+82), 71468 (+71) |
| Heart / cardiology | 60 | 1,837 | 0.28 | 0.73 | 217 of 519 | 70632 (-88), 71033 (-69), 71129 (-69) | 70780 (+60), 70435 (+59), 70510 (+58) |
| Skin / dermatology | 60 | 604 | 0.10 | 0.78 | 205 of 519 | 70080 (-69), 70030 (-57), 70057 (-50) | 70780 (+65), 70719 (+64), 70645 (+59) |
| Allergy & immunology | 60 | 212 | 0.03 | 0.77 | 141 of 519 | 70047 (-80), 71004 (-78), 70079 (-74) | 71276 (+100), 70510 (+77), 70780 (+68) |
| Lung, breathing & sleep | 60 | 912 | 0.14 | 0.76 | 184 of 519 | 71004 (-74), 71129 (-67), 71033 (-64) | 70780 (+72), 70431 (+66), 71424 (+64) |
| Digestive / gastroenterology | 60 | 749 | 0.13 | 0.74 | 216 of 519 | 71129 (-61), 70080 (-59), 71004 (-55) | 71068 (+99), 71034 (+97), 71052 (+84) |
| Kidney / nephrology | 60 | 1,054 | 0.12 | 0.65 | 262 of 519 | 71033 (-81), 71023 (-72), 71129 (-72) | 71226 (+84), 71276 (+80), 70542 (+79) |
| Diabetes & hormones | 60 | 350 | 0.07 | 0.73 | 179 of 519 | 71033 (-69), 71129 (-68), 71004 (-66) | 70719 (+69), 70780 (+67), 70710 (+61) |
| Cancer care / oncology | 90 | 896 | 0.18 | 0.49 | 298 of 519 | 70051 (-66), 70052 (-65), 71033 (-62) | 71424 (+72), 70780 (+68), 71409 (+68) |
| Arthritis / rheumatology | 60 | 241 | 0.04 | 0.73 | 197 of 519 | 71033 (-70), 71007 (-53), 70047 (-52) | 71068 (+100), 71034 (+88), 71472 (+84) |
| Brain & nerves / neurology | 60 | 1,325 | 0.24 | 0.77 | 171 of 519 | 70080 (-61), 71033 (-61), 71129 (-61) | 70780 (+68), 70420 (+65), 70551 (+63) |
| Ear, nose & throat | 60 | 631 | 0.08 | 0.72 | 243 of 519 | 71004 (-100), 71060 (-100), 71023 (-95) | 70552 (+63), 70645 (+63), 71067 (+63) |
| Urology | 60 | 570 | 0.08 | 0.73 | 242 of 519 | 71033 (-83), 70080 (-70), 71004 (-62) | 71068 (+100), 71034 (+99), 70462 (+77) |
| Foot & ankle / podiatry | 60 | 628 | 0.16 | 0.64 | 134 of 519 | 70080 (-35), 70057 (-32), 70051 (-31) | 70753 (+73), 70732 (+64), 70783 (+62) |
| Pain management | 60 | 575 | 0.09 | 0.77 | 226 of 519 | 70128 (-64), 70127 (-61), 70080 (-55) | 71472 (+74), 70780 (+69), 70437 (+60) |
| Plastic & reconstructive surgery | 90 | 405 | 0.07 | 0.63 | 260 of 519 | 70047 (-82), 70051 (-82), 70079 (-82) | 70719 (+58), 70780 (+57), 70710 (+53) |
| Speech & language therapy | 30 | 6,659 | 0.87 | 0.57 | 309 of 519 | 71340 (-54), 71342 (-54), 71432 (-54) | 71234 (+100), 70449 (+99), 70390 (+98) |
| Nutrition & dietitian | 30 | 1,713 | 0.32 | 0.65 | 247 of 519 | 71048 (-86), 71355 (-68), 70039 (-55) | 70780 (+99), 70431 (+75), 70719 (+75) |
| Acupuncture, massage & naturopathy | 30 | 1,366 | 0.50 | 0.70 | 109 of 519 | 71416 (-93), 70549 (-44), 71446 (-31) | 71438 (+73), 71474 (+68), 71403 (+59) |
| Urgent care & emergency | 30 | 3,973 | 0.50 | 0.46 | 328 of 519 | 70345 (-73), 71115 (-72), 70427 (-63) | 70719 (+100), 71439 (+100), 71424 (+99) |
| Imaging & lab | 60 | 3,586 | 0.55 | 0.76 | 186 of 519 | 71004 (-57), 71060 (-46), 71027 (-43) | 70719 (+63), 70780 (+61), 70542 (+58) |
| Pharmacy | 30 | 12,925 | 1.68 | 0.43 | 324 of 519 | 70740 (-67), 71342 (-58), 71340 (-42) | 71234 (+93), 71424 (+91), 71328 (+87) |
| Home health & in-home care | 30 | 8,076 | 1.49 | 0.51 | 257 of 519 | 70083 (-66), 71049 (-56), 70722 (-55) | 71286 (+100), 71424 (+100), 71409 (+92) |
| Nursing & assisted living | 60 | 2,824 | 0.37 | 0.57 | 228 of 519 | 71043 (-59), 71201 (-53), 71209 (-53) | 71455 (+87), 71438 (+78), 71286 (+76) |
| Medical equipment & supplies | 60 | 3,251 | 0.34 | 0.72 | 220 of 519 | 70526 (-65), 71423 (-61), 71330 (-49) | 71472 (+72), 70753 (+63), 70435 (+59) |
| Hearing & audiology | 60 | 1,314 | 0.20 | 0.75 | 220 of 519 | 71325 (-54), 70052 (-51), 71447 (-51) | 71472 (+76), 70780 (+58), 70435 (+53) |
| Behavior therapy (ABA) | 30 | 8,638 | 2.58 | 0.73 | 91 of 519 | 70114 (-66), 70126 (-55), 70117 (-52) | 70031 (+99), 70780 (+54), 70510 (+53) |
| Care coordination & community health | 30 | 16,508 | 1.55 | 0.54 | 283 of 519 | 70643 (-98), 70427 (-60), 71241 (-53) | 70344 (+100), 70397 (+100), 70665 (+100) |
| General surgery | 60 | 2,553 | 0.39 | 0.68 | 206 of 519 | 71129 (-69), 71033 (-64), 71078 (-62) | 71068 (+69), 70431 (+66), 70420 (+63) |
| Infectious disease | 90 | 293 | 0.06 | 0.60 | 226 of 519 | 70047 (-94), 70079 (-93), 70057 (-85) | 71068 (+74), 70780 (+73), 70820 (+69) |
| Genetics & genetic counseling | 90 | 89 | 0.03 | 0.63 | 149 of 519 | 70051 (-62), 70052 (-61), 70068 (-61) | 70820 (+63), 70807 (+56), 70714 (+55) |
| Hospice & palliative care | 60 | 914 | 0.09 | 0.56 | 257 of 519 | 70791 (-86), 70739 (-80), 70737 (-75) | 70782 (+87), 70753 (+86), 70789 (+86) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|
| 70112 | Primary care / family doctor | 5.696 | 7.983 | 40 | 16 |
| 70112 | Mental health & counseling | 10.513 | 14.660 | 26 | 0 |
| 70112 | Heart / cardiology | 0.479 | 0.513 | 15 | 9 |
| 70112 | Cancer care / oncology | 0.270 | 0.211 | 24 | 41 |
| 70112 | Urgent care & emergency | 0.927 | 1.267 | 7 | 0 |
| 70808 | Primary care / family doctor | 6.771 | 8.201 | 29 | 14 |
| 70808 | Mental health & counseling | 10.841 | 12.023 | 24 | 16 |
| 70808 | Heart / cardiology | 0.527 | 0.367 | 6 | 35 |
| 70808 | Cancer care / oncology | 0.302 | 0.161 | 15 | 55 |
| 70808 | Urgent care & emergency | 0.870 | 1.082 | 13 | 0 |
| 71101 | Primary care / family doctor | 7.732 | 10.263 | 19 | 0 |
| 71101 | Mental health & counseling | 13.220 | 17.871 | 7 | 0 |
| 71101 | Heart / cardiology | 0.569 | 0.477 | 0 | 15 |
| 71101 | Cancer care / oncology | 0.355 | 0.230 | 0 | 35 |
| 71101 | Urgent care & emergency | 0.866 | 1.103 | 13 | 0 |
| 70501 | Primary care / family doctor | 7.096 | 6.948 | 26 | 27 |
| 70501 | Mental health & counseling | 10.078 | 10.121 | 29 | 29 |
| 70501 | Heart / cardiology | 0.708 | 0.492 | 0 | 13 |
| 70501 | Cancer care / oncology | 0.278 | 0.167 | 22 | 53 |
| 70501 | Urgent care & emergency | 0.502 | 0.506 | 50 | 49 |
| 71301 | Primary care / family doctor | 7.703 | 12.719 | 19 | 0 |
| 71301 | Mental health & counseling | 11.752 | 19.628 | 18 | 0 |
| 71301 | Heart / cardiology | 0.441 | 0.400 | 22 | 29 |
| 71301 | Cancer care / oncology | 0.209 | 0.130 | 41 | 64 |
| 71301 | Urgent care & emergency | 0.684 | 1.081 | 31 | 0 |
| 70601 | Primary care / family doctor | 4.658 | 7.222 | 51 | 24 |
| 70601 | Mental health & counseling | 5.156 | 8.433 | 64 | 41 |
| 70601 | Heart / cardiology | 0.239 | 0.273 | 57 | 51 |
| 70601 | Cancer care / oncology | 0.103 | 0.099 | 71 | 72 |
| 70601 | Urgent care & emergency | 0.426 | 0.649 | 57 | 35 |

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-18

- 20760 rows (ZIP x specialty) stored in access_e2sfca for LA; market-score now uses drive-time access for these ZIPs.
