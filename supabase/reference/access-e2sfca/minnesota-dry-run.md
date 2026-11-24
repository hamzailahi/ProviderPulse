# E2SFCA access dry run: Minnesota

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,056; in Minnesota: 877
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,056 x 2,056 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 247,408.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.40 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.99), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (52073, 55605)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 52073 | no | 6.20 | 100% | 6.20 | 100% | no |
| 55605 | yes | 6.31 | 100% | 6.31 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 29,222 | 4.30 | 0.58 | 270 of 876 | 56359 (-63), 56671 (-52), 55772 (-41) | 56546 (+93), 55919 (+89), 56536 (+83) |
| Pediatrics (children) | 30 | 5,888.4 | 1.11 | 0.81 | 115 of 876 | 56569 (-77), 56591 (-56), 56672 (-48) | 55919 (+63), 56525 (+56), 56536 (+54) |
| Women's health / OB-GYN | 60 | 3,380.4 | 0.53 | 0.72 | 297 of 876 | 56116 (-55), 56156 (-49), 56158 (-45) | 55368 (+72), 55397 (+68), 55367 (+62) |
| Mental health & counseling | 30 | 49,687.2 | 7.20 | 0.74 | 230 of 876 | 55772 (-82), 56591 (-54), 56569 (-53) | 56525 (+75), 56281 (+74), 56663 (+72) |
| Dental | 30 | 12,623 | 1.65 | 0.58 | 352 of 876 | 56591 (-63), 55736 (-62), 56569 (-62) | 56639 (+75), 55771 (+74), 56543 (+72) |
| Eye care | 30 | 4,921.6 | 0.62 | 0.54 | 401 of 876 | 56657 (-92), 56637 (-89), 56733 (-55) | 56669 (+89), 56654 (+88), 56663 (+88) |
| Chiropractic | 30 | 9,407.6 | 0.63 | 0.58 | 443 of 876 | 56484 (-69), 55760 (-67), 56514 (-66) | 55606 (+100), 55612 (+100), 55752 (+100) |
| Physical & occupational therapy | 30 | 23,197 | 2.70 | 0.65 | 318 of 876 | 55702 (-80), 56470 (-47), 56510 (-47) | 56546 (+100), 56210 (+88), 56212 (+87) |
| Orthopedics & sports injury | 60 | 3,430 | 0.39 | 0.65 | 339 of 876 | 56062 (-82), 56361 (-80), 56514 (-79) | 55368 (+75), 55367 (+71), 55360 (+70) |
| Heart / cardiology | 60 | 1,034.2 | 0.24 | 0.76 | 198 of 876 | 55733 (-62), 56116 (-57), 55779 (-56) | 56536 (+81), 56546 (+74), 56321 (+66) |
| Skin / dermatology | 60 | 504.6 | 0.09 | 0.77 | 259 of 876 | 56549 (-60), 56116 (-53), 56547 (-45) | 56029 (+66), 56591 (+66), 56569 (+65) |
| Allergy & immunology | 60 | 159.4 | 0.03 | 0.72 | 295 of 876 | 56215 (-100), 56248 (-100), 56249 (-100) | 55967 (+69), 56762 (+68), 56375 (+63) |
| Lung, breathing & sleep | 60 | 672.2 | 0.13 | 0.77 | 224 of 876 | 56514 (-54), 56549 (-54), 56116 (-51) | 56536 (+61), 55368 (+58), 55919 (+57) |
| Digestive / gastroenterology | 60 | 514 | 0.11 | 0.79 | 213 of 876 | 56116 (-65), 56138 (-50), 55733 (-45) | 56536 (+77), 56546 (+69), 55919 (+62) |
| Kidney / nephrology | 60 | 555.8 | 0.11 | 0.66 | 345 of 876 | 56116 (-59), 56142 (-57), 55735 (-53) | 56666 (+91), 56759 (+84), 56546 (+70) |
| Diabetes & hormones | 60 | 384 | 0.06 | 0.71 | 390 of 876 | 56549 (-96), 56116 (-92), 56514 (-89) | 56641 (+97), 56350 (+76), 56029 (+74) |
| Cancer care / oncology | 90 | 742 | 0.15 | 0.57 | 410 of 876 | 56116 (-62), 56138 (-54), 55717 (-53) | 55111 (+61), 56536 (+60), 55919 (+59) |
| Arthritis / rheumatology | 60 | 212 | 0.04 | 0.78 | 244 of 876 | 55733 (-85), 55779 (-78), 56475 (-74) | 56440 (+77), 56477 (+75), 56437 (+70) |
| Brain & nerves / neurology | 60 | 1,045 | 0.22 | 0.76 | 219 of 876 | 56116 (-56), 55016 (-44), 56138 (-42) | 55111 (+65), 56321 (+65), 55919 (+61) |
| Ear, nose & throat | 60 | 400.6 | 0.07 | 0.74 | 357 of 876 | 56116 (-79), 56514 (-68), 56138 (-60) | 55367 (+79), 55368 (+77), 55360 (+71) |
| Urology | 60 | 398.8 | 0.07 | 0.68 | 405 of 876 | 55733 (-86), 55779 (-70), 55797 (-66) | 56386 (+84), 56536 (+80), 55366 (+79) |
| Foot & ankle / podiatry | 60 | 641.4 | 0.15 | 0.64 | 314 of 876 | 56531 (-44), 56309 (-43), 56311 (-43) | 55723 (+74), 56523 (+70), 56566 (+65) |
| Pain management | 60 | 260.8 | 0.09 | 0.77 | 142 of 876 | 56630 (-39), 56621 (-34), 56320 (-30) | 56469 (+82), 56447 (+62), 56321 (+58) |
| Plastic & reconstructive surgery | 90 | 258.6 | 0.07 | 0.62 | 357 of 876 | 56548 (-42), 56514 (-39), 56594 (-39) | 56375 (+81), 56321 (+77), 56367 (+76) |
| Speech & language therapy | 30 | 6,560.6 | 0.90 | 0.72 | 262 of 876 | 56575 (-69), 56650 (-58), 56653 (-58) | 56722 (+96), 56525 (+73), 56723 (+69) |
| Nutrition & dietitian | 30 | 2,816.4 | 0.33 | 0.67 | 328 of 876 | 55772 (-56), 56542 (-53), 56359 (-52) | 55919 (+100), 56458 (+100), 56461 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,235 | 0.52 | 0.83 | 191 of 876 | 56342 (-69), 55005 (-42), 56386 (-42) | 56450 (+71), 55017 (+69), 56449 (+67) |
| Urgent care & emergency | 30 | 2,993.6 | 0.47 | 0.56 | 333 of 876 | 56174 (-66), 56183 (-66), 55616 (-65) | 55919 (+100), 56536 (+100), 56546 (+100) |
| Imaging & lab | 60 | 2,566.4 | 0.49 | 0.74 | 282 of 876 | 56116 (-73), 56514 (-59), 56138 (-53) | 56566 (+73), 56575 (+68), 56536 (+62) |
| Pharmacy | 30 | 12,488.8 | 1.72 | 0.52 | 346 of 876 | 56359 (-63), 56183 (-57), 55616 (-56) | 56536 (+100), 56546 (+100), 56666 (+100) |
| Home health & in-home care | 30 | 8,666.8 | 1.61 | 0.69 | 170 of 876 | 55725 (-77), 56450 (-66), 56386 (-55) | 56750 (+100), 55382 (+96), 55353 (+88) |
| Nursing & assisted living | 60 | 4,401.8 | 0.39 | 0.51 | 417 of 876 | 55775 (-99), 55742 (-77), 56744 (-51) | 55765 (+95), 55602 (+91), 56659 (+90) |
| Medical equipment & supplies | 60 | 2,260.4 | 0.36 | 0.71 | 218 of 876 | 56715 (-44), 56549 (-43), 56255 (-41) | 56569 (+62), 56591 (+61), 56755 (+57) |
| Hearing & audiology | 60 | 1,770.6 | 0.19 | 0.71 | 433 of 876 | 56132 (-100), 56255 (-100), 56715 (-100) | 55703 (+74), 55763 (+74), 55750 (+73) |
| Behavior therapy (ABA) | 30 | 20,220.4 | 2.88 | 0.84 | 190 of 876 | 56320 (-69), 56569 (-69), 56573 (-61) | 55703 (+100), 55705 (+100), 55723 (+100) |
| Care coordination & community health | 30 | 6,693.8 | 1.63 | 0.68 | 82 of 876 | 55772 (-65), 56671 (-54), 56670 (-45) | 56536 (+100), 56546 (+100), 55919 (+99) |
| General surgery | 60 | 1,800 | 0.35 | 0.63 | 309 of 876 | 56744 (-64), 55733 (-56), 56116 (-53) | 56536 (+83), 56546 (+77), 56321 (+60) |
| Infectious disease | 90 | 205.8 | 0.05 | 0.57 | 314 of 876 | 56116 (-66), 56138 (-59), 55733 (-55) | 55111 (+74), 55919 (+68), 55101 (+64) |
| Genetics & genetic counseling | 90 | 329.2 | 0.03 | 0.62 | 350 of 876 | 55301 (-100), 55330 (-100), 55341 (-100) | 56710 (+78), 55940 (+76), 56375 (+59) |
| Hospice & palliative care | 60 | 445.2 | 0.09 | 0.72 | 376 of 876 | 56171 (-58), 56291 (-56), 56309 (-56) | 55787 (+98), 55798 (+90), 55712 (+84) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Minnesota in households with no vehicle: about 286,671 of 4,389,488 (6.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 3
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 5 of 876 | 55454 (+34), 55111 (+32), 55404 (+22) | 1.00 |
| Pediatrics (children) | 1.00 | 5 of 876 | 55111 (+38), 56591 (+21), 55454 (+20) | 1.00 |
| Women's health / OB-GYN | 1.00 | 4 of 876 | 55111 (+30), 55454 (+25), 55404 (+18) | 1.00 |
| Mental health & counseling | 1.00 | 5 of 876 | 55111 (+39), 55454 (+26), 55404 (+17) | 1.00 |
| Dental | 1.00 | 4 of 876 | 55454 (+35), 55111 (+32), 55404 (+22) | 1.00 |
| Eye care | 1.00 | 5 of 876 | 56591 (+32), 55111 (+29), 55454 (+29) | 1.00 |
| Chiropractic | 1.00 | 0 of 876 | 55111 (+14), 55103 (+11), 55802 (+11) | 1.00 |
| Physical & occupational therapy | 1.00 | 6 of 876 | 55111 (+35), 55454 (+35), 56591 (+33) | 1.00 |
| Orthopedics & sports injury | 1.00 | 5 of 876 | 55111 (+29), 55454 (+27), 55404 (+19) | 1.00 |
| Heart / cardiology | 1.00 | 2 of 876 | 55111 (+20), 55454 (+16), 55802 (+13) | 1.00 |
| Skin / dermatology | 1.00 | 3 of 876 | 55111 (+24), 55454 (+21), 55404 (+15) | 1.00 |
| Allergy & immunology | 1.00 | 2 of 876 | 55111 (+22), 55454 (+19), 55404 (+13) | 1.00 |
| Lung, breathing & sleep | 1.00 | 2 of 876 | 55111 (+22), 55454 (+18), 55404 (+12) | 1.00 |
| Digestive / gastroenterology | 1.00 | 2 of 876 | 55111 (+21), 55454 (+17), 55404 (+13) | 1.00 |
| Kidney / nephrology | 1.00 | 1 of 876 | 55111 (+19), 55454 (+14), 55404 (+11) | 1.00 |
| Diabetes & hormones | 1.00 | 2 of 876 | 55111 (+22), 55454 (+17), 55404 (+13) | 1.00 |
| Cancer care / oncology | 1.00 | 1 of 876 | 55111 (+19), 55454 (+11), 55103 (+10) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 876 | 55111 (+27), 55454 (+21), 55802 (+21) | 1.00 |
| Brain & nerves / neurology | 1.00 | 2 of 876 | 55111 (+25), 55454 (+19), 55403 (+13) | 1.00 |
| Ear, nose & throat | 1.00 | 2 of 876 | 55111 (+22), 55454 (+15), 55802 (+14) | 1.00 |
| Urology | 1.00 | 2 of 876 | 55111 (+21), 55454 (+17), 55404 (+12) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 1 of 876 | 56591 (+15), 55111 (+14), 55454 (+13) | 1.00 |
| Pain management | 1.00 | 0 of 876 | 55111 (+14), 55454 (+13), 55404 (+9) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 1 of 876 | 55111 (+16), 55454 (+14), 55404 (+10) | 1.00 |
| Speech & language therapy | 1.00 | 4 of 876 | 55454 (+29), 55111 (+27), 55404 (+19) | 1.00 |
| Nutrition & dietitian | 1.00 | 3 of 876 | 55111 (+34), 55103 (+19), 55802 (+19) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 4 of 876 | 55111 (+38), 55454 (+30), 55404 (+21) | 1.00 |
| Urgent care & emergency | 1.00 | 5 of 876 | 55111 (+32), 55454 (+29), 55404 (+20) | 1.00 |
| Imaging & lab | 1.00 | 2 of 876 | 55111 (+22), 55454 (+18), 55404 (+13) | 1.00 |
| Pharmacy | 1.00 | 4 of 876 | 55454 (+29), 55111 (+28), 55404 (+17) | 1.00 |
| Home health & in-home care | 1.00 | 5 of 876 | 55454 (+38), 55111 (+26), 55404 (+23) | 1.00 |
| Nursing & assisted living | 0.99 | 9 of 876 | 55454 (+39), 55111 (+38), 55404 (+26) | 1.00 |
| Medical equipment & supplies | 0.99 | 4 of 876 | 55111 (+22), 55454 (+22), 56591 (+17) | 1.00 |
| Hearing & audiology | 1.00 | 7 of 876 | 55111 (+35), 55454 (+33), 55404 (+22) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 1 of 876 | 56591 (+27), 55802 (+12), 55103 (+11) | 1.00 |
| Care coordination & community health | 1.00 | 2 of 876 | 56591 (+17), 55454 (+16), 55111 (+13) | 1.00 |
| General surgery | 1.00 | 2 of 876 | 55111 (+17), 55802 (+15), 55454 (+13) | 1.00 |
| Infectious disease | 1.00 | 1 of 876 | 55111 (+17), 55103 (+8), 55454 (+8) | 1.00 |
| Genetics & genetic counseling | 1.00 | 3 of 876 | 55111 (+42), 55103 (+20), 55101 (+17) | 1.00 |
| Hospice & palliative care | 1.00 | 2 of 876 | 55111 (+17), 55454 (+16), 55404 (+11) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 33 of 873 | 68,966 (1.6%) | 1/85 | 22/187 | 2/145 | 6/359 | 2/97 |
| Women's health / OB-GYN | 016 | 6 of 873 | 1,139 (0.0%) | 0/85 | 2/187 | 0/145 | 3/359 | 1/97 |
| Mental health & counseling: Psychiatry | 029 | 25 of 873 | 13,536 (0.3%) | 1/85 | 2/187 | 0/145 | 18/359 | 4/97 |
| Mental health & counseling: Clinical Psychology | 036 | 7 of 873 | 2,588 (0.1%) | 0/85 | 0/187 | 0/145 | 6/359 | 1/97 |
| Mental health & counseling: Clinical Social Work | 037 | 7 of 873 | 4,174 (0.1%) | 0/85 | 6/187 | 0/145 | 0/359 | 1/97 |
| Eye care | 023 | 7 of 873 | 1,782 (0.0%) | 0/85 | 4/187 | 0/145 | 0/359 | 3/97 |
| Chiropractic | 010 | 5 of 873 | 1,115 (0.0%) | 0/85 | 4/187 | 0/145 | 0/359 | 1/97 |
| Physical & occupational therapy | F049 | 4 of 873 | 485 (0.0%) | 0/85 | 3/187 | 0/145 | 0/359 | 1/97 |
| Orthopedics & sports injury | 025 | 39 of 873 | 36,150 (0.8%) | 0/85 | 19/187 | 0/145 | 7/359 | 13/97 |
| Heart / cardiology | 008 | 240 of 873 | 496,448 (11.3%) | 0/85 | 73/187 | 35/145 | 100/359 | 32/97 |
| Skin / dermatology | 011 | 82 of 873 | 95,960 (2.2%) | 0/85 | 6/187 | 5/145 | 48/359 | 23/97 |
| Allergy & immunology | 007 | 116 of 873 | 161,670 (3.7%) | 0/85 | 14/187 | 14/145 | 65/359 | 23/97 |
| Lung, breathing & sleep | 030 | 118 of 873 | 157,215 (3.6%) | 1/85 | 6/187 | 21/145 | 71/359 | 19/97 |
| Digestive / gastroenterology | 014 | 132 of 873 | 199,070 (4.5%) | 0/85 | 34/187 | 5/145 | 69/359 | 24/97 |
| Kidney / nephrology | 018 | 24 of 873 | 25,742 (0.6%) | 0/85 | 15/187 | 0/145 | 1/359 | 8/97 |
| Diabetes & hormones | 012 | 18 of 873 | 21,122 (0.5%) | 0/85 | 9/187 | 0/145 | 1/359 | 8/97 |
| Cancer care / oncology | 021 | 66 of 873 | 77,048 (1.8%) | 2/85 | 8/187 | 1/145 | 33/359 | 22/97 |
| Arthritis / rheumatology | 031 | 89 of 873 | 119,047 (2.7%) | 0/85 | 30/187 | 1/145 | 41/359 | 17/97 |
| Brain & nerves / neurology | 019 | 130 of 873 | 182,710 (4.2%) | 0/85 | 35/187 | 16/145 | 60/359 | 19/97 |
| Ear, nose & throat | 013 | 39 of 873 | 21,193 (0.5%) | 0/85 | 9/187 | 0/145 | 21/359 | 9/97 |
| Urology | 033 | 68 of 873 | 76,432 (1.7%) | 1/85 | 16/187 | 5/145 | 24/359 | 22/97 |
| Foot & ankle / podiatry | 028 | 35 of 873 | 44,757 (1.0%) | 4/85 | 15/187 | 0/145 | 7/359 | 9/97 |
| Plastic & reconstructive surgery | 027 | 63 of 873 | 60,737 (1.4%) | 0/85 | 7/187 | 1/145 | 36/359 | 19/97 |
| Speech & language therapy | F051 | 13 of 873 | 9,664 (0.2%) | 0/85 | 6/187 | 0/145 | 4/359 | 3/97 |
| Imaging & lab | F047 | 58 of 873 | 69,907 (1.6%) | 1/85 | 26/187 | 0/145 | 15/359 | 16/97 |
| Nursing & assisted living | F046 | 5 of 873 | 1,115 (0.0%) | 0/85 | 4/187 | 0/145 | 0/359 | 1/97 |
| General surgery | 015 | 31 of 873 | 29,074 (0.7%) | 0/85 | 12/187 | 1/145 | 9/359 | 9/97 |
| Infectious disease | 017 | 32 of 873 | 29,105 (0.7%) | 0/85 | 9/187 | 1/145 | 12/359 | 10/97 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 35080 rows (ZIP x specialty) stored in access_e2sfca for MN; market-score now uses drive-time access for these ZIPs.
