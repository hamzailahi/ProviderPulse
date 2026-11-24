# E2SFCA access dry run: Michigan

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,013; in Michigan: 988
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,013 x 3,013 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 902,662.605; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.59 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.48), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 6; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (49782, 54246, 55601, 55605, 55614)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 49757 | yes | 8.89 | 100% | 2.25 | 100% | yes (0.42) |
| 49782 | yes | 6.52 | 100% | 6.52 | 100% | no |
| 54246 | no | 8.67 | 100% | 8.67 | 100% | no |
| 55601 | no | 1.97 | 42% | 1.97 | 42% | no |
| 55605 | no | 1.46 | 42% | 1.46 | 42% | no |
| 55614 | no | 2.36 | 42% | 2.36 | 42% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 104,200.206 | 4.30 | 0.68 | 367 of 987 | 48139 (-41), 49781 (-37), 48763 (-36) | 49636 (+92), 49654 (+84), 49653 (+82) |
| Pediatrics (children) | 30 | 25,466.4 | 1.11 | 0.81 | 173 of 987 | 49910 (-70), 48189 (-58), 48139 (-53) | 49654 (+79), 49636 (+77), 49682 (+63) |
| Women's health / OB-GYN | 60 | 12,875.6 | 0.53 | 0.66 | 457 of 987 | 49404 (-64), 49403 (-60), 49430 (-60) | 49654 (+75), 49636 (+65), 48655 (+62) |
| Mental health & counseling | 30 | 184,243 | 7.20 | 0.74 | 384 of 987 | 48888 (-44), 48071 (-35), 48067 (-33) | 49636 (+94), 49654 (+92), 49653 (+89) |
| Dental | 30 | 43,183.8 | 1.65 | 0.68 | 350 of 987 | 49709 (-56), 48067 (-35), 48030 (-34) | 49636 (+82), 49654 (+66), 49653 (+64) |
| Eye care | 30 | 18,533.8 | 0.62 | 0.68 | 441 of 987 | 49969 (-66), 48730 (-61), 48763 (-60) | 49636 (+100), 49312 (+94), 49654 (+91) |
| Chiropractic | 30 | 18,874 | 0.63 | 0.52 | 442 of 987 | 48763 (-51), 49726 (-51), 49910 (-45) | 49815 (+100), 49831 (+100), 49748 (+99) |
| Physical & occupational therapy | 30 | 80,295.8 | 2.70 | 0.72 | 361 of 987 | 49883 (-94), 48763 (-59), 49779 (-41) | 49654 (+85), 49839 (+82), 49636 (+81) |
| Orthopedics & sports injury | 60 | 10,401.2 | 0.39 | 0.65 | 433 of 987 | 49886 (-79), 49874 (-74), 48874 (-70) | 49654 (+66), 49835 (+66), 48109 (+65) |
| Heart / cardiology | 60 | 5,631.8 | 0.24 | 0.72 | 459 of 987 | 48131 (-70), 49716 (-62), 48140 (-60) | 49034 (+63), 49012 (+60), 49259 (+60) |
| Skin / dermatology | 60 | 2,168.4 | 0.09 | 0.79 | 394 of 987 | 49648 (-80), 49799 (-67), 49630 (-65) | 49775 (+100), 49757 (+88), 49106 (+75) |
| Allergy & immunology | 60 | 784 | 0.03 | 0.75 | 498 of 987 | 49620 (-86), 49774 (-84), 49780 (-84) | 48845 (+82), 48427 (+74), 48733 (+69) |
| Lung, breathing & sleep | 60 | 2,723.6 | 0.13 | 0.68 | 444 of 987 | 49834 (-100), 49847 (-100), 49874 (-100) | 49106 (+73), 49654 (+72), 49636 (+68) |
| Digestive / gastroenterology | 60 | 2,504.8 | 0.11 | 0.76 | 410 of 987 | 49806 (-78), 49826 (-74), 48131 (-68) | 49918 (+88), 49654 (+76), 49636 (+74) |
| Kidney / nephrology | 60 | 2,672.6 | 0.11 | 0.65 | 463 of 987 | 49668 (-57), 48179 (-54), 49780 (-54) | 49654 (+76), 49760 (+72), 49636 (+68) |
| Diabetes & hormones | 60 | 1,417.6 | 0.06 | 0.75 | 394 of 987 | 48131 (-72), 48164 (-60), 49270 (-59) | 48450 (+74), 49808 (+71), 49831 (+69) |
| Cancer care / oncology | 90 | 3,488.8 | 0.15 | 0.46 | 631 of 987 | 49629 (-82), 49648 (-80), 49659 (-73) | 49106 (+69), 49848 (+63), 49083 (+62) |
| Arthritis / rheumatology | 60 | 868 | 0.04 | 0.78 | 434 of 987 | 48131 (-85), 48187 (-75), 49270 (-64) | 49038 (+72), 49331 (+65), 49022 (+63) |
| Brain & nerves / neurology | 60 | 4,925.4 | 0.22 | 0.73 | 422 of 987 | 49435 (-77), 48131 (-73), 49430 (-73) | 49654 (+65), 48848 (+60), 49106 (+59) |
| Ear, nose & throat | 60 | 1,566 | 0.07 | 0.73 | 474 of 987 | 49847 (-100), 49874 (-100), 49886 (-100) | 48845 (+77), 49654 (+70), 49331 (+68) |
| Urology | 60 | 1,696 | 0.07 | 0.64 | 533 of 987 | 49799 (-87), 49620 (-75), 48131 (-70) | 49756 (+91), 49638 (+68), 48845 (+65) |
| Foot & ankle / podiatry | 60 | 4,890.4 | 0.15 | 0.78 | 421 of 987 | 49886 (-60), 49874 (-57), 49847 (-56) | 49654 (+69), 49636 (+67), 48427 (+63) |
| Pain management | 60 | 1,859.4 | 0.09 | 0.75 | 400 of 987 | 48879 (-74), 48857 (-65), 48836 (-63) | 48760 (+70), 49653 (+67), 49276 (+62) |
| Plastic & reconstructive surgery | 90 | 1,422.2 | 0.07 | 0.64 | 605 of 987 | 49620 (-78), 49335 (-76), 49891 (-76) | 49106 (+81), 49097 (+77), 48848 (+76) |
| Speech & language therapy | 30 | 21,382.2 | 0.90 | 0.72 | 201 of 987 | 48730 (-48), 48765 (-41), 49910 (-28) | 49331 (+56), 49822 (+47), 49653 (+44) |
| Nutrition & dietitian | 30 | 7,882.8 | 0.33 | 0.73 | 316 of 987 | 49895 (-59), 49701 (-57), 49781 (-57) | 49815 (+100), 49831 (+100), 49654 (+87) |
| Acupuncture, massage & naturopathy | 30 | 7,616.4 | 0.52 | 0.64 | 233 of 987 | 49719 (-54), 49646 (-52), 49868 (-35) | 49653 (+100), 49654 (+92), 49636 (+90) |
| Urgent care & emergency | 30 | 11,638.4 | 0.47 | 0.71 | 414 of 987 | 48763 (-69), 49967 (-62), 49635 (-52) | 49831 (+100), 49654 (+96), 49775 (+88) |
| Imaging & lab | 60 | 11,974.8 | 0.49 | 0.63 | 417 of 987 | 48131 (-64), 48165 (-59), 48116 (-56) | 49654 (+64), 49636 (+61), 49653 (+55) |
| Pharmacy | 30 | 40,894.2 | 1.72 | 0.71 | 340 of 987 | 48661 (-46), 49733 (-45), 48763 (-42) | 49815 (+100), 49831 (+100), 49654 (+89) |
| Home health & in-home care | 30 | 39,680.8 | 1.61 | 0.81 | 204 of 987 | 49057 (-51), 49104 (-42), 49459 (-40) | 48628 (+95), 48662 (+89), 48637 (+85) |
| Nursing & assisted living | 60 | 10,131.2 | 0.39 | 0.55 | 306 of 987 | 48131 (-62), 49799 (-56), 48140 (-52) | 49775 (+75), 49808 (+68), 49670 (+65) |
| Medical equipment & supplies | 60 | 9,438.2 | 0.36 | 0.69 | 341 of 987 | 49799 (-93), 49886 (-78), 49874 (-74) | 49775 (+94), 49757 (+78), 49831 (+66) |
| Hearing & audiology | 60 | 5,003.2 | 0.19 | 0.59 | 529 of 987 | 49620 (-100), 49668 (-100), 49847 (-100) | 49835 (+75), 49409 (+69), 48725 (+64) |
| Behavior therapy (ABA) | 30 | 90,884 | 2.88 | 0.81 | 336 of 987 | 48381 (-69), 48413 (-68), 48701 (-57) | 48028 (+100), 48754 (+100), 48819 (+96) |
| Care coordination & community health | 30 | 53,136.4 | 1.63 | 0.69 | 468 of 987 | 48429 (-81), 49733 (-54), 48430 (-49) | 48831 (+100), 49747 (+100), 49947 (+100) |
| General surgery | 60 | 7,988 | 0.35 | 0.64 | 490 of 987 | 49335 (-61), 49435 (-60), 49404 (-58) | 49918 (+94), 48109 (+67), 49654 (+67) |
| Infectious disease | 90 | 1,141.4 | 0.05 | 0.67 | 543 of 987 | 48353 (-73), 48165 (-69), 48139 (-67) | 49106 (+77), 48601 (+70), 48603 (+70) |
| Genetics & genetic counseling | 90 | 857.6 | 0.03 | 0.57 | 572 of 987 | 49315 (-82), 49335 (-81), 48164 (-80) | 48848 (+77), 49654 (+73), 49091 (+72) |
| Hospice & palliative care | 60 | 1,593.6 | 0.09 | 0.70 | 468 of 987 | 49886 (-73), 48630 (-70), 49874 (-69) | 49756 (+81), 48765 (+68), 48471 (+67) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Michigan in households with no vehicle: about 549,764 of 7,914,561 (6.9%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 6 of 987 | 49757 (+41), 49409 (+33), 48201 (+22) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 987 | 48933 (+17), 48208 (+15), 49409 (+14) | 1.00 |
| Women's health / OB-GYN | 0.99 | 7 of 987 | 49409 (+37), 48201 (+29), 48109 (+28) | 1.00 |
| Mental health & counseling | 1.00 | 8 of 987 | 49409 (+35), 48933 (+26), 49757 (+26) | 1.00 |
| Dental | 0.99 | 6 of 987 | 49409 (+36), 49757 (+23), 48201 (+22) | 1.00 |
| Eye care | 1.00 | 5 of 987 | 48109 (+40), 49409 (+40), 48201 (+25) | 1.00 |
| Chiropractic | 0.99 | 4 of 987 | 49409 (+49), 49757 (+35), 48109 (+28) | 1.00 |
| Physical & occupational therapy | 1.00 | 7 of 987 | 48109 (+37), 49409 (+36), 48933 (+25) | 1.00 |
| Orthopedics & sports injury | 0.99 | 6 of 987 | 49409 (+31), 48109 (+26), 48933 (+24) | 1.00 |
| Heart / cardiology | 1.00 | 6 of 987 | 48201 (+27), 49409 (+22), 48109 (+21) | 1.00 |
| Skin / dermatology | 1.00 | 10 of 987 | 48201 (+30), 48109 (+28), 48208 (+22) | 1.00 |
| Allergy & immunology | 1.00 | 11 of 987 | 48109 (+36), 48201 (+30), 49409 (+26) | 1.00 |
| Lung, breathing & sleep | 1.00 | 3 of 987 | 48201 (+23), 48109 (+21), 48208 (+18) | 1.00 |
| Digestive / gastroenterology | 1.00 | 4 of 987 | 48201 (+23), 49409 (+21), 48109 (+20) | 1.00 |
| Kidney / nephrology | 0.99 | 5 of 987 | 48201 (+24), 49757 (+22), 48109 (+21) | 1.00 |
| Diabetes & hormones | 1.00 | 3 of 987 | 48109 (+28), 48201 (+24), 48208 (+19) | 1.00 |
| Cancer care / oncology | 0.99 | 5 of 987 | 48109 (+27), 48201 (+21), 49409 (+16) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 987 | 48109 (+25), 48201 (+23), 48208 (+19) | 1.00 |
| Brain & nerves / neurology | 1.00 | 5 of 987 | 48109 (+29), 48201 (+26), 49409 (+25) | 1.00 |
| Ear, nose & throat | 1.00 | 5 of 987 | 49409 (+33), 48201 (+25), 48208 (+19) | 1.00 |
| Urology | 0.99 | 5 of 987 | 49409 (+25), 48201 (+21), 48109 (+20) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 6 of 987 | 48109 (+39), 48214 (+23), 48201 (+22) | 1.00 |
| Pain management | 1.00 | 6 of 987 | 48201 (+28), 49409 (+26), 48933 (+23) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 6 of 987 | 49409 (+33), 48109 (+32), 48201 (+25) | 1.00 |
| Speech & language therapy | 1.00 | 2 of 987 | 48109 (+35), 49409 (+22), 48933 (+13) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 987 | 49757 (+50), 48109 (+47), 49409 (+30) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 4 of 987 | 49757 (+43), 48109 (+22), 48933 (+17) | 1.00 |
| Urgent care & emergency | 1.00 | 7 of 987 | 49409 (+35), 49757 (+23), 49074 (+20) | 1.00 |
| Imaging & lab | 1.00 | 4 of 987 | 48201 (+25), 49409 (+20), 48208 (+19) | 1.00 |
| Pharmacy | 1.00 | 6 of 987 | 48109 (+33), 49409 (+31), 48201 (+24) | 1.00 |
| Home health & in-home care | 1.00 | 4 of 987 | 48109 (+22), 48201 (+20), 48933 (+20) | 1.00 |
| Nursing & assisted living | 0.98 | 4 of 987 | 49409 (+26), 49757 (+21), 48109 (+20) | 1.00 |
| Medical equipment & supplies | 0.99 | 8 of 987 | 48201 (+30), 48109 (+26), 49409 (+23) | 1.00 |
| Hearing & audiology | 0.99 | 6 of 987 | 49409 (+39), 48109 (+28), 48201 (+21) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 5 of 987 | 48109 (+46), 48933 (+26), 48201 (+25) | 1.00 |
| Care coordination & community health | 1.00 | 6 of 987 | 49409 (+56), 48109 (+46), 49757 (+39) | 1.00 |
| General surgery | 0.99 | 4 of 987 | 48201 (+22), 49409 (+22), 48109 (+18) | 1.00 |
| Infectious disease | 1.00 | 4 of 987 | 48109 (+30), 48201 (+21), 48208 (+15) | 1.00 |
| Genetics & genetic counseling | 1.00 | 4 of 987 | 49409 (+30), 48109 (+27), 48201 (+16) | 1.00 |
| Hospice & palliative care | 0.99 | 5 of 987 | 48109 (+23), 48201 (+22), 49409 (+21) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 42 of 986 | 82,750 (1.0%) | 3/171 | 36/409 | 3/166 | 0/205 | 0/35 |
| Women's health / OB-GYN | 016 | 3 of 986 | 1,823 (0.0%) | 0/171 | 0/409 | 1/166 | 2/205 | 0/35 |
| Mental health & counseling: Psychiatry | 029 | 17 of 986 | 19,371 (0.2%) | 2/171 | 2/409 | 1/166 | 10/205 | 2/35 |
| Mental health & counseling: Clinical Psychology | 036 | 6 of 986 | 13,740 (0.2%) | 1/171 | 1/409 | 1/166 | 3/205 | 0/35 |
| Mental health & counseling: Clinical Social Work | 037 | 4 of 986 | 2,829 (0.0%) | 0/171 | 1/409 | 1/166 | 2/205 | 0/35 |
| Eye care | 023 | 6 of 986 | 5,320 (0.1%) | 0/171 | 2/409 | 1/166 | 3/205 | 0/35 |
| Chiropractic | 010 | 2 of 986 | 966 (0.0%) | 0/171 | 0/409 | 1/166 | 1/205 | 0/35 |
| Physical & occupational therapy | F049 | 3 of 986 | 1,823 (0.0%) | 0/171 | 0/409 | 1/166 | 2/205 | 0/35 |
| Orthopedics & sports injury | 025 | 12 of 986 | 21,026 (0.3%) | 1/171 | 6/409 | 1/166 | 4/205 | 0/35 |
| Heart / cardiology | 008 | 52 of 986 | 132,408 (1.7%) | 4/171 | 20/409 | 7/166 | 16/205 | 5/35 |
| Skin / dermatology | 011 | 54 of 986 | 128,040 (1.6%) | 4/171 | 9/409 | 6/166 | 35/205 | 0/35 |
| Allergy & immunology | 007 | 90 of 986 | 167,560 (2.1%) | 0/171 | 14/409 | 6/166 | 60/205 | 10/35 |
| Lung, breathing & sleep | 030 | 16 of 986 | 42,795 (0.5%) | 5/171 | 0/409 | 1/166 | 7/205 | 3/35 |
| Digestive / gastroenterology | 014 | 131 of 986 | 333,550 (4.2%) | 10/171 | 7/409 | 20/166 | 84/205 | 10/35 |
| Kidney / nephrology | 018 | 5 of 986 | 3,702 (0.0%) | 0/171 | 2/409 | 1/166 | 2/205 | 0/35 |
| Diabetes & hormones | 012 | 4 of 986 | 2,175 (0.0%) | 0/171 | 1/409 | 1/166 | 1/205 | 1/35 |
| Cancer care / oncology | 021 | 17 of 986 | 44,936 (0.6%) | 5/171 | 4/409 | 1/166 | 7/205 | 0/35 |
| Arthritis / rheumatology | 031 | 46 of 986 | 76,936 (1.0%) | 1/171 | 4/409 | 4/166 | 37/205 | 0/35 |
| Brain & nerves / neurology | 019 | 17 of 986 | 55,571 (0.7%) | 6/171 | 3/409 | 4/166 | 4/205 | 0/35 |
| Ear, nose & throat | 013 | 40 of 986 | 61,834 (0.8%) | 0/171 | 7/409 | 1/166 | 24/205 | 8/35 |
| Urology | 033 | 53 of 986 | 167,868 (2.1%) | 11/171 | 3/409 | 1/166 | 28/205 | 10/35 |
| Foot & ankle / podiatry | 028 | 8 of 986 | 4,532 (0.1%) | 0/171 | 1/409 | 2/166 | 5/205 | 0/35 |
| Plastic & reconstructive surgery | 027 | 34 of 986 | 61,547 (0.8%) | 1/171 | 1/409 | 2/166 | 26/205 | 4/35 |
| Speech & language therapy | F051 | 5 of 986 | 3,282 (0.0%) | 0/171 | 1/409 | 1/166 | 3/205 | 0/35 |
| Imaging & lab | F047 | 5 of 986 | 13,154 (0.2%) | 1/171 | 1/409 | 1/166 | 2/205 | 0/35 |
| Nursing & assisted living | F046 | 4 of 986 | 12,281 (0.2%) | 1/171 | 0/409 | 1/166 | 2/205 | 0/35 |
| General surgery | 015 | 26 of 986 | 46,482 (0.6%) | 1/171 | 21/409 | 1/166 | 3/205 | 0/35 |
| Infectious disease | 017 | 44 of 986 | 62,500 (0.8%) | 1/171 | 2/409 | 2/166 | 35/205 | 4/35 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 39520 rows (ZIP x specialty) stored in access_e2sfca for MI; market-score now uses drive-time access for these ZIPs.
