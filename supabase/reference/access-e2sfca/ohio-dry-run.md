# E2SFCA access dry run: Ohio

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,353; in Ohio: 1,221
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,353 x 3,353 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 890,100.001; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.90 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.26), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 7; re-anchored: 7; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 15450 | no | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | no | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 24823 | no | 8.92 | 100% | 4.73 | 100% | yes (1.45) |
| 24846 | no | 7.39 | 100% | 5.49 | 100% | yes (1.88) |
| 25848 | no | 7.88 | 100% | 3.94 | 100% | yes (1.55) |
| 25864 | no | 8.64 | 100% | 3.08 | 100% | yes (1.46) |
| 26690 | no | 7.54 | 100% | 3.25 | 100% | yes (1.53) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 94,017.601 | 4.30 | 0.75 | 329 of 1221 | 43438 (-57), 43740 (-52), 43721 (-45) | 45788 (+68), 45678 (+60), 45681 (+59) |
| Pediatrics (children) | 30 | 22,928.2 | 1.11 | 0.83 | 263 of 1221 | 45041 (-64), 45147 (-51), 45249 (-46) | 45051 (+64), 45233 (+58), 45341 (+58) |
| Women's health / OB-GYN | 60 | 10,241 | 0.53 | 0.64 | 440 of 1221 | 43522 (-40), 44136 (-40), 45005 (-39) | 43511 (+72), 43516 (+70), 43524 (+69) |
| Mental health & counseling | 30 | 165,591.4 | 7.20 | 0.80 | 356 of 1221 | 44214 (-76), 44217 (-53), 45764 (-48) | 45646 (+92), 45778 (+84), 45699 (+83) |
| Dental | 30 | 31,510.6 | 1.65 | 0.75 | 231 of 1221 | 43740 (-44), 43319 (-30), 45267 (-28) | 44072 (+52), 45644 (+51), 45788 (+45) |
| Eye care | 30 | 16,344.6 | 0.62 | 0.61 | 497 of 1221 | 43740 (-76), 43319 (-63), 43336 (-46) | 45644 (+87), 43967 (+80), 43446 (+79) |
| Chiropractic | 30 | 12,707 | 0.63 | 0.65 | 347 of 1221 | 45814 (-45), 43319 (-42), 43740 (-38) | 45815 (+65), 45831 (+64), 43805 (+62) |
| Physical & occupational therapy | 30 | 61,609.6 | 2.70 | 0.74 | 319 of 1221 | 44301 (-51), 44306 (-48), 44310 (-44) | 45831 (+65), 45815 (+59), 45778 (+56) |
| Orthopedics & sports injury | 60 | 9,746.4 | 0.39 | 0.55 | 604 of 1221 | 45723 (-84), 45720 (-80), 45769 (-80) | 44634 (+71), 45696 (+70), 43153 (+68) |
| Heart / cardiology | 60 | 5,256.6 | 0.24 | 0.63 | 686 of 1221 | 43008 (-62), 43018 (-58), 43046 (-55) | 43791 (+71), 43910 (+69), 43446 (+67) |
| Skin / dermatology | 60 | 1,709.2 | 0.09 | 0.75 | 436 of 1221 | 45041 (-54), 43018 (-47), 45252 (-41) | 43443 (+70), 43446 (+64), 43456 (+62) |
| Allergy & immunology | 60 | 674.6 | 0.03 | 0.70 | 584 of 1221 | 45065 (-83), 45036 (-73), 45030 (-69) | 43407 (+77), 43925 (+62), 45858 (+61) |
| Lung, breathing & sleep | 60 | 2,538.2 | 0.13 | 0.72 | 599 of 1221 | 43018 (-52), 43137 (-51), 44067 (-50) | 45850 (+65), 45854 (+65), 45893 (+64) |
| Digestive / gastroenterology | 60 | 2,230.2 | 0.11 | 0.74 | 598 of 1221 | 43103 (-61), 45041 (-56), 43137 (-55) | 45370 (+63), 44666 (+57), 43504 (+50) |
| Kidney / nephrology | 60 | 2,392.6 | 0.11 | 0.61 | 683 of 1221 | 45817 (-65), 45897 (-61), 45810 (-60) | 43910 (+76), 43446 (+72), 43456 (+72) |
| Diabetes & hormones | 60 | 1,143.4 | 0.06 | 0.69 | 633 of 1221 | 45723 (-69), 45720 (-59), 44286 (-56) | 43446 (+68), 43456 (+68), 45850 (+67) |
| Cancer care / oncology | 90 | 3,103.4 | 0.15 | 0.47 | 794 of 1221 | 43018 (-68), 43147 (-66), 43110 (-65) | 43456 (+81), 43446 (+79), 43440 (+73) |
| Arthritis / rheumatology | 60 | 743.8 | 0.04 | 0.71 | 619 of 1221 | 45041 (-79), 43018 (-71), 45636 (-64) | 45830 (+65), 45877 (+65), 43084 (+64) |
| Brain & nerves / neurology | 60 | 4,168.4 | 0.22 | 0.71 | 487 of 1221 | 45041 (-60), 45005 (-57), 45252 (-53) | 45896 (+74), 45850 (+73), 45854 (+69) |
| Ear, nose & throat | 60 | 1,412.8 | 0.07 | 0.59 | 795 of 1221 | 43018 (-69), 43103 (-69), 45036 (-59) | 44681 (+84), 43347 (+80), 43318 (+76) |
| Urology | 60 | 1,474.4 | 0.07 | 0.60 | 698 of 1221 | 45636 (-83), 45817 (-64), 43018 (-63) | 43446 (+82), 43456 (+82), 43438 (+72) |
| Foot & ankle / podiatry | 60 | 3,983.2 | 0.15 | 0.67 | 595 of 1221 | 44412 (-77), 44429 (-74), 44085 (-70) | 43438 (+79), 43967 (+78), 43446 (+76) |
| Pain management | 60 | 1,556.8 | 0.09 | 0.60 | 497 of 1221 | 45636 (-56), 44412 (-48), 43317 (-47) | 43910 (+75), 43446 (+65), 43456 (+65) |
| Plastic & reconstructive surgery | 90 | 1,219.6 | 0.07 | 0.62 | 663 of 1221 | 43128 (-53), 43142 (-53), 43018 (-51) | 43917 (+83), 43504 (+74), 43971 (+74) |
| Speech & language therapy | 30 | 17,193 | 0.90 | 0.71 | 352 of 1221 | 43545 (-44), 43740 (-40), 43555 (-37) | 45696 (+85), 45678 (+70), 45332 (+65) |
| Nutrition & dietitian | 30 | 6,204.8 | 0.33 | 0.80 | 318 of 1221 | 45041 (-42), 44214 (-40), 44659 (-37) | 45681 (+83), 45612 (+80), 45644 (+73) |
| Acupuncture, massage & naturopathy | 30 | 5,880.6 | 0.52 | 0.79 | 145 of 1221 | 43740 (-29), 43319 (-28), 45808 (-20) | 45729 (+57), 45784 (+50), 45739 (+42) |
| Urgent care & emergency | 30 | 10,303.8 | 0.47 | 0.73 | 427 of 1221 | 45684 (-67), 45620 (-45), 45897 (-45) | 45768 (+100), 45786 (+100), 45788 (+90) |
| Imaging & lab | 60 | 9,609.2 | 0.49 | 0.65 | 575 of 1221 | 45720 (-53), 43018 (-52), 45636 (-48) | 45652 (+57), 43910 (+56), 45893 (+55) |
| Pharmacy | 30 | 40,314.4 | 1.72 | 0.73 | 368 of 1221 | 43740 (-63), 45814 (-41), 43721 (-40) | 45896 (+77), 45681 (+75), 45686 (+74) |
| Home health & in-home care | 30 | 94,677 | 1.61 | 0.67 | 368 of 1221 | 43740 (-41), 43556 (-35), 45821 (-35) | 43967 (+100), 43983 (+97), 43446 (+81) |
| Nursing & assisted living | 60 | 10,781.6 | 0.39 | 0.46 | 619 of 1221 | 43717 (-81), 43724 (-79), 44412 (-74) | 43967 (+100), 43446 (+84), 43456 (+72) |
| Medical equipment & supplies | 60 | 7,412.8 | 0.36 | 0.65 | 427 of 1221 | 44412 (-55), 43469 (-52), 43416 (-47) | 43446 (+70), 43456 (+66), 43438 (+61) |
| Hearing & audiology | 60 | 4,406.6 | 0.19 | 0.59 | 644 of 1221 | 44214 (-69), 44412 (-66), 44254 (-65) | 43967 (+82), 43446 (+62), 43456 (+62) |
| Behavior therapy (ABA) | 30 | 78,191.8 | 2.88 | 0.86 | 92 of 1221 | 45321 (-39), 44838 (-30), 45382 (-30) | 43967 (+88), 43977 (+77), 43901 (+74) |
| Care coordination & community health | 30 | 83,807.4 | 1.63 | 0.73 | 422 of 1221 | 44254 (-93), 44214 (-92), 44633 (-92) | 43456 (+100), 43967 (+100), 45688 (+100) |
| General surgery | 60 | 6,917 | 0.35 | 0.60 | 632 of 1221 | 45817 (-55), 45884 (-54), 43018 (-51) | 45819 (+53), 45428 (+52), 45896 (+52) |
| Infectious disease | 90 | 960 | 0.05 | 0.54 | 824 of 1221 | 44067 (-66), 44056 (-63), 44241 (-57) | 43719 (+87), 43977 (+87), 43951 (+86) |
| Genetics & genetic counseling | 90 | 727 | 0.03 | 0.53 | 663 of 1221 | 45034 (-100), 45050 (-100), 45065 (-98) | 44076 (+86), 44099 (+86), 44439 (+86) |
| Hospice & palliative care | 60 | 1,360 | 0.09 | 0.58 | 601 of 1221 | 43008 (-47), 43018 (-47), 43116 (-47) | 43967 (+88), 45734 (+80), 43557 (+70) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Ohio in households with no vehicle: about 676,147 of 9,207,746 (7.3%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 16
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 24 of 1221 | 44503 (+53), 43967 (+47), 44702 (+34) | 1.00 |
| Pediatrics (children) | 0.99 | 16 of 1221 | 44503 (+46), 43967 (+36), 44702 (+30) | 1.00 |
| Women's health / OB-GYN | 0.98 | 13 of 1221 | 44503 (+31), 44702 (+26), 43967 (+22) | 1.00 |
| Mental health & counseling | 0.99 | 22 of 1221 | 44503 (+73), 43967 (+46), 44702 (+34) | 1.00 |
| Dental | 0.99 | 12 of 1221 | 44503 (+39), 43967 (+30), 44702 (+26) | 1.00 |
| Eye care | 0.98 | 27 of 1221 | 43967 (+64), 44503 (+60), 44702 (+39) | 1.00 |
| Chiropractic | 0.98 | 13 of 1221 | 44503 (+63), 44660 (+52), 44702 (+40) | 1.00 |
| Physical & occupational therapy | 0.99 | 17 of 1221 | 44702 (+54), 44503 (+52), 43967 (+44) | 1.00 |
| Orthopedics & sports injury | 0.98 | 28 of 1221 | 43967 (+43), 44503 (+40), 44702 (+39) | 1.00 |
| Heart / cardiology | 0.98 | 16 of 1221 | 43967 (+45), 44503 (+29), 44702 (+27) | 1.00 |
| Skin / dermatology | 0.99 | 11 of 1221 | 44503 (+27), 44114 (+26), 44115 (+25) | 1.00 |
| Allergy & immunology | 0.99 | 14 of 1221 | 45225 (+30), 44503 (+26), 45203 (+25) | 1.00 |
| Lung, breathing & sleep | 0.99 | 11 of 1221 | 43967 (+34), 44114 (+29), 44115 (+27) | 1.00 |
| Digestive / gastroenterology | 0.99 | 14 of 1221 | 43967 (+39), 44503 (+27), 44114 (+25) | 1.00 |
| Kidney / nephrology | 0.98 | 23 of 1221 | 44503 (+34), 43967 (+31), 44702 (+29) | 1.00 |
| Diabetes & hormones | 0.99 | 14 of 1221 | 45783 (+28), 44114 (+24), 44702 (+24) | 1.00 |
| Cancer care / oncology | 0.99 | 11 of 1221 | 44503 (+22), 43967 (+20), 45225 (+19) | 1.00 |
| Arthritis / rheumatology | 0.99 | 15 of 1221 | 44114 (+29), 44115 (+26), 45225 (+26) | 1.00 |
| Brain & nerves / neurology | 0.99 | 9 of 1221 | 45225 (+23), 44114 (+22), 44115 (+21) | 1.00 |
| Ear, nose & throat | 0.98 | 16 of 1221 | 44503 (+45), 43967 (+38), 44702 (+33) | 1.00 |
| Urology | 0.98 | 15 of 1221 | 43967 (+46), 44503 (+29), 44702 (+25) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 23 of 1221 | 44503 (+64), 43967 (+56), 44702 (+45) | 1.00 |
| Pain management | 0.98 | 9 of 1221 | 44503 (+37), 44702 (+27), 43967 (+24) | 1.00 |
| Plastic & reconstructive surgery | 0.98 | 6 of 1221 | 44503 (+25), 44702 (+21), 44308 (+19) | 1.00 |
| Speech & language therapy | 0.99 | 22 of 1221 | 44503 (+52), 44702 (+52), 43967 (+36) | 1.00 |
| Nutrition & dietitian | 0.99 | 22 of 1221 | 44503 (+59), 43967 (+33), 44702 (+32) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 1 of 1221 | 44503 (+25), 44114 (+14), 44115 (+14) | 1.00 |
| Urgent care & emergency | 0.99 | 26 of 1221 | 44503 (+54), 43967 (+47), 44702 (+43) | 1.00 |
| Imaging & lab | 0.99 | 13 of 1221 | 44503 (+34), 43967 (+33), 44114 (+25) | 1.00 |
| Pharmacy | 0.99 | 23 of 1221 | 44503 (+57), 43967 (+47), 44702 (+36) | 1.00 |
| Home health & in-home care | 0.97 | 13 of 1221 | 43967 (+100), 43842 (+42), 44503 (+34) | 0.99 |
| Nursing & assisted living | 0.96 | 30 of 1221 | 43967 (+94), 44503 (+63), 44702 (+58) | 1.00 |
| Medical equipment & supplies | 0.97 | 17 of 1221 | 44503 (+45), 44702 (+30), 43967 (+25) | 1.00 |
| Hearing & audiology | 0.97 | 24 of 1221 | 44503 (+49), 43967 (+42), 44702 (+37) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 3 of 1221 | 43967 (+57), 44503 (+43), 45428 (+15) | 1.00 |
| Care coordination & community health | 0.99 | 8 of 1221 | 43967 (+100), 43842 (+40), 44503 (+40) | 1.00 |
| General surgery | 0.98 | 10 of 1221 | 43967 (+53), 44503 (+28), 44114 (+22) | 1.00 |
| Infectious disease | 0.99 | 6 of 1221 | 44114 (+21), 44115 (+20), 44702 (+20) | 1.00 |
| Genetics & genetic counseling | 1.00 | 8 of 1221 | 45160 (+24), 45225 (+22), 45428 (+20) | 1.00 |
| Hospice & palliative care | 0.98 | 13 of 1221 | 43967 (+44), 44702 (+26), 44503 (+25) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 57 of 1221 | 68,428 (0.7%) | 1/149 | 53/672 | 3/335 | 0/65 |  |
| Women's health / OB-GYN | 016 | 2 of 1221 | 555 (0.0%) | 0/149 | 2/672 | 0/335 | 0/65 |  |
| Mental health & counseling: Psychiatry | 029 | 5 of 1221 | 16,828 (0.2%) | 1/149 | 3/672 | 1/335 | 0/65 |  |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 1221 | 240 (0.0%) | 0/149 | 1/672 | 0/335 | 0/65 |  |
| Mental health & counseling: Clinical Social Work | 037 | 8 of 1221 | 7,493 (0.1%) | 0/149 | 7/672 | 1/335 | 0/65 |  |
| Eye care | 023 | 14 of 1221 | 13,475 (0.1%) | 0/149 | 13/672 | 1/335 | 0/65 |  |
| Chiropractic | 010 | 2 of 1221 | 555 (0.0%) | 0/149 | 2/672 | 0/335 | 0/65 |  |
| Physical & occupational therapy | F049 | 0 of 1221 | 0 (0.0%) | 0/149 | 0/672 | 0/335 | 0/65 |  |
| Orthopedics & sports injury | 025 | 9 of 1221 | 10,983 (0.1%) | 0/149 | 8/672 | 1/335 | 0/65 |  |
| Heart / cardiology | 008 | 33 of 1221 | 45,779 (0.5%) | 0/149 | 30/672 | 3/335 | 0/65 |  |
| Skin / dermatology | 011 | 20 of 1221 | 25,409 (0.3%) | 0/149 | 12/672 | 7/335 | 1/65 |  |
| Allergy & immunology | 007 | 43 of 1221 | 79,779 (0.9%) | 0/149 | 43/672 | 0/335 | 0/65 |  |
| Lung, breathing & sleep | 030 | 6 of 1221 | 16,902 (0.2%) | 2/149 | 1/672 | 3/335 | 0/65 |  |
| Digestive / gastroenterology | 014 | 13 of 1221 | 11,782 (0.1%) | 0/149 | 10/672 | 3/335 | 0/65 |  |
| Kidney / nephrology | 018 | 2 of 1221 | 555 (0.0%) | 0/149 | 2/672 | 0/335 | 0/65 |  |
| Diabetes & hormones | 012 | 0 of 1221 | 0 (0.0%) | 0/149 | 0/672 | 0/335 | 0/65 |  |
| Cancer care / oncology | 021 | 3 of 1221 | 658 (0.0%) | 0/149 | 2/672 | 1/335 | 0/65 |  |
| Arthritis / rheumatology | 031 | 3 of 1221 | 2,831 (0.0%) | 0/149 | 3/672 | 0/335 | 0/65 |  |
| Brain & nerves / neurology | 019 | 7 of 1221 | 4,333 (0.0%) | 0/149 | 6/672 | 1/335 | 0/65 |  |
| Ear, nose & throat | 013 | 3 of 1221 | 842 (0.0%) | 0/149 | 3/672 | 0/335 | 0/65 |  |
| Urology | 033 | 9 of 1221 | 3,449 (0.0%) | 3/149 | 3/672 | 3/335 | 0/65 |  |
| Foot & ankle / podiatry | 028 | 3 of 1221 | 705 (0.0%) | 0/149 | 2/672 | 1/335 | 0/65 |  |
| Plastic & reconstructive surgery | 027 | 1 of 1221 | 240 (0.0%) | 0/149 | 1/672 | 0/335 | 0/65 |  |
| Speech & language therapy | F051 | 0 of 1221 | 0 (0.0%) | 0/149 | 0/672 | 0/335 | 0/65 |  |
| Imaging & lab | F047 | 3 of 1221 | 16,438 (0.2%) | 1/149 | 2/672 | 0/335 | 0/65 |  |
| Nursing & assisted living | F046 | 0 of 1221 | 0 (0.0%) | 0/149 | 0/672 | 0/335 | 0/65 |  |
| General surgery | 015 | 29 of 1221 | 42,100 (0.5%) | 0/149 | 28/672 | 1/335 | 0/65 |  |
| Infectious disease | 017 | 3 of 1221 | 10,030 (0.1%) | 0/149 | 3/672 | 0/335 | 0/65 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 48840 rows (ZIP x specialty) stored in access_e2sfca for OH; market-score now uses drive-time access for these ZIPs.
