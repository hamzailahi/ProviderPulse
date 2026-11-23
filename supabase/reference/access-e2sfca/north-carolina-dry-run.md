# E2SFCA access dry run: North Carolina

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,553; in North Carolina: 839
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,553 x 2,553 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 661,636.398; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.70 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.75), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 10; re-anchored: 4; still implausible (left out of the rank comparison, still stored, marked in the CSV): 6 (23307, 23347, 23354, 23405, 23413, 27927)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 23307 | no | 6.85 | 100% | 6.85 | 100% | no |
| 23347 | no | 7.60 | 100% | 7.60 | 100% | no |
| 23354 | no | 7.56 | 100% | 7.56 | 100% | no |
| 23405 | no | 7.89 | 100% | 7.89 | 100% | no |
| 23413 | no | 6.75 | 100% | 6.75 | 100% | no |
| 24127 | no | 9.79 | 100% | 2.54 | 100% | yes (2.34) |
| 27927 | yes | 8.73 | 100% | 8.73 | 100% | no |
| 40808 | no | 7.11 | 100% | 5.53 | 100% | yes (1.28) |
| 41317 | no | 7.63 | 100% | 3.46 | 100% | yes (1.29) |
| 41635 | no | 7.95 | 100% | 2.64 | 100% | yes (1.34) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 97,231.598 | 4.30 | 0.55 | 327 of 838 | 28611 (-56), 28789 (-43), 28758 (-39) | 27829 (+95), 28528 (+85), 28553 (+84) |
| Pediatrics (children) | 30 | 20,118.4 | 1.11 | 0.72 | 201 of 838 | 27016 (-42), 27812 (-41), 27560 (-37) | 27829 (+98), 28554 (+87), 27312 (+80) |
| Women's health / OB-GYN | 60 | 11,031.2 | 0.53 | 0.68 | 328 of 838 | 27861 (-46), 27888 (-42), 28711 (-41) | 27214 (+62), 27829 (+60), 27312 (+57) |
| Mental health & counseling | 30 | 135,902.8 | 7.20 | 0.68 | 278 of 838 | 28758 (-40), 27885 (-33), 28616 (-33) | 27829 (+75), 28449 (+73), 28753 (+71) |
| Dental | 30 | 31,553 | 1.65 | 0.67 | 265 of 838 | 27923 (-78), 27916 (-54), 27965 (-33) | 27829 (+96), 28531 (+79), 28326 (+77) |
| Eye care | 30 | 11,842.4 | 0.62 | 0.60 | 249 of 838 | 28584 (-34), 28803 (-30), 27889 (-28) | 28479 (+72), 27829 (+63), 28449 (+61) |
| Chiropractic | 30 | 12,870.4 | 0.63 | 0.73 | 217 of 838 | 28717 (-65), 28775 (-46), 28585 (-44) | 28479 (+65), 28753 (+65), 28735 (+63) |
| Physical & occupational therapy | 30 | 55,998 | 2.70 | 0.69 | 277 of 838 | 27885 (-84), 27956 (-53), 27917 (-46) | 28735 (+78), 27503 (+71), 27312 (+58) |
| Orthopedics & sports injury | 60 | 8,983.8 | 0.39 | 0.67 | 350 of 838 | 27888 (-49), 28716 (-45), 28745 (-45) | 28135 (+79), 28708 (+64), 28747 (+58) |
| Heart / cardiology | 60 | 4,610.8 | 0.24 | 0.66 | 369 of 838 | 27888 (-72), 27861 (-62), 27812 (-57) | 28337 (+76), 28369 (+75), 28340 (+71) |
| Skin / dermatology | 60 | 1,650.8 | 0.09 | 0.71 | 379 of 838 | 28425 (-60), 28435 (-49), 27009 (-46) | 28129 (+80), 28124 (+76), 27829 (+73) |
| Allergy & immunology | 60 | 569.2 | 0.03 | 0.70 | 368 of 838 | 27956 (-82), 28757 (-81), 28711 (-80) | 28367 (+76), 27281 (+71), 28523 (+71) |
| Lung, breathing & sleep | 60 | 2,787.8 | 0.13 | 0.65 | 345 of 838 | 27841 (-100), 27861 (-100), 27888 (-100) | 27503 (+66), 27509 (+63), 28129 (+60) |
| Digestive / gastroenterology | 60 | 2,101.6 | 0.11 | 0.68 | 347 of 838 | 27888 (-79), 27812 (-69), 27852 (-67) | 28369 (+80), 28129 (+77), 28337 (+71) |
| Kidney / nephrology | 60 | 2,309.4 | 0.11 | 0.66 | 332 of 838 | 27888 (-64), 27979 (-60), 27889 (-53) | 28753 (+75), 27252 (+71), 27503 (+66) |
| Diabetes & hormones | 60 | 1,044 | 0.06 | 0.71 | 351 of 838 | 27888 (-67), 27812 (-60), 27852 (-57) | 28318 (+74), 28129 (+72), 27283 (+71) |
| Cancer care / oncology | 90 | 2,794.8 | 0.15 | 0.39 | 490 of 838 | 27597 (-56), 27557 (-54), 27888 (-54) | 27281 (+79), 28367 (+78), 27376 (+76) |
| Arthritis / rheumatology | 60 | 702.2 | 0.04 | 0.72 | 420 of 838 | 27888 (-64), 27812 (-63), 27861 (-56) | 28129 (+85), 28124 (+77), 28097 (+73) |
| Brain & nerves / neurology | 60 | 3,537 | 0.22 | 0.72 | 306 of 838 | 27812 (-43), 27826 (-43), 27885 (-42) | 28367 (+77), 27312 (+70), 27374 (+68) |
| Ear, nose & throat | 60 | 1,306 | 0.07 | 0.66 | 425 of 838 | 27594 (-57), 28694 (-55), 27055 (-49) | 27507 (+82), 27374 (+76), 28434 (+76) |
| Urology | 60 | 1,685.4 | 0.07 | 0.52 | 494 of 838 | 27358 (-71), 27055 (-66), 27284 (-66) | 28756 (+77), 27860 (+75), 27808 (+73) |
| Foot & ankle / podiatry | 60 | 2,373.2 | 0.15 | 0.58 | 272 of 838 | 27861 (-45), 27055 (-41), 27841 (-36) | 27926 (+76), 27937 (+72), 27885 (+53) |
| Pain management | 60 | 1,624.6 | 0.09 | 0.70 | 295 of 838 | 27888 (-49), 27055 (-40), 27812 (-40) | 28520 (+93), 28537 (+75), 28668 (+72) |
| Plastic & reconstructive surgery | 90 | 1,134.8 | 0.07 | 0.55 | 455 of 838 | 28456 (-46), 28436 (-45), 28164 (-44) | 28367 (+87), 28531 (+83), 28528 (+82) |
| Speech & language therapy | 30 | 19,322 | 0.90 | 0.73 | 294 of 838 | 27956 (-46), 28078 (-42), 28518 (-36) | 28375 (+92), 27817 (+89), 27889 (+85) |
| Nutrition & dietitian | 30 | 6,576.4 | 0.33 | 0.76 | 280 of 838 | 28708 (-58), 27962 (-51), 28078 (-41) | 27824 (+100), 27829 (+98), 28531 (+95) |
| Acupuncture, massage & naturopathy | 30 | 5,944.4 | 0.52 | 0.79 | 154 of 838 | 28455 (-43), 28758 (-38), 28743 (-33) | 28746 (+87), 28709 (+67), 28735 (+66) |
| Urgent care & emergency | 30 | 9,052.8 | 0.47 | 0.55 | 331 of 838 | 28461 (-59), 28721 (-58), 28422 (-49) | 28367 (+100), 27829 (+98), 28783 (+97) |
| Imaging & lab | 60 | 9,270 | 0.49 | 0.67 | 291 of 838 | 27888 (-72), 27852 (-61), 27864 (-60) | 28367 (+71), 27281 (+63), 27283 (+62) |
| Pharmacy | 30 | 39,542.4 | 1.72 | 0.53 | 322 of 838 | 27810 (-57), 28719 (-49), 28789 (-48) | 28434 (+83), 28318 (+81), 28709 (+74) |
| Home health & in-home care | 30 | 24,980.6 | 1.61 | 0.74 | 158 of 838 | 27885 (-65), 28091 (-32), 28170 (-30) | 27926 (+66), 27829 (+59), 28528 (+59) |
| Nursing & assisted living | 60 | 9,137.2 | 0.39 | 0.61 | 376 of 838 | 27857 (-52), 28666 (-51), 27557 (-49) | 27584 (+85), 28556 (+82), 28746 (+67) |
| Medical equipment & supplies | 60 | 9,468.6 | 0.36 | 0.61 | 355 of 838 | 27861 (-69), 27812 (-65), 27841 (-63) | 27885 (+90), 28434 (+84), 28552 (+66) |
| Hearing & audiology | 60 | 3,826.2 | 0.19 | 0.70 | 364 of 838 | 27812 (-66), 27852 (-60), 27861 (-58) | 28531 (+58), 27214 (+55), 28369 (+55) |
| Behavior therapy (ABA) | 30 | 40,341.2 | 2.88 | 0.83 | 113 of 838 | 28546 (-31), 28078 (-26), 28368 (-25) | 28586 (+100), 28523 (+99), 28529 (+98) |
| Care coordination & community health | 30 | 14,353.8 | 1.63 | 0.68 | 24 of 838 | 28719 (-66), 28789 (-57), 27885 (-32) | 27377 (+31), 27829 (+28), 27214 (+23) |
| General surgery | 60 | 7,261.8 | 0.35 | 0.51 | 373 of 838 | 27888 (-79), 27861 (-68), 27871 (-61) | 28528 (+77), 28553 (+76), 28531 (+73) |
| Infectious disease | 90 | 841.6 | 0.05 | 0.55 | 402 of 838 | 27888 (-47), 27559 (-46), 27958 (-46) | 28367 (+87), 27281 (+81), 28214 (+71) |
| Genetics & genetic counseling | 90 | 572.6 | 0.03 | 0.59 | 493 of 838 | 28758 (-70), 28790 (-70), 28731 (-69) | 27829 (+77), 27828 (+76), 27884 (+76) |
| Hospice & palliative care | 60 | 1,606 | 0.09 | 0.58 | 300 of 838 | 27861 (-53), 27871 (-52), 27841 (-50) | 27843 (+80), 27229 (+73), 27874 (+72) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in North Carolina in households with no vehicle: about 427,993 of 8,155,354 (5.2%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 17
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 2 of 838 | 28076 (+17), 28301 (+15), 27601 (+9) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 838 | 27601 (+10), 28301 (+10), 28801 (+9) | 1.00 |
| Women's health / OB-GYN | 1.00 | 0 of 838 | 27374 (+14), 28076 (+12), 28301 (+12) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 838 | 28301 (+15), 27601 (+13), 28076 (+11) | 1.00 |
| Dental | 1.00 | 0 of 838 | 28301 (+14), 27601 (+9), 28801 (+9) | 1.00 |
| Eye care | 1.00 | 0 of 838 | 28801 (+12), 28301 (+9), 27601 (+8) | 1.00 |
| Chiropractic | 1.00 | 1 of 838 | 28076 (+25), 27601 (+8), 28401 (+8) | 1.00 |
| Physical & occupational therapy | 1.00 | 0 of 838 | 28301 (+13), 27601 (+11), 28076 (+10) | 1.00 |
| Orthopedics & sports injury | 0.99 | 2 of 838 | 27374 (+22), 28076 (+20), 28301 (+12) | 1.00 |
| Heart / cardiology | 1.00 | 1 of 838 | 27374 (+15), 28801 (+9), 28076 (+8) | 1.00 |
| Skin / dermatology | 1.00 | 1 of 838 | 27374 (+17), 28076 (+12), 28801 (+12) | 1.00 |
| Allergy & immunology | 1.00 | 1 of 838 | 27374 (+17), 28076 (+9), 28301 (+9) | 1.00 |
| Lung, breathing & sleep | 1.00 | 0 of 838 | 27374 (+10), 27957 (+10), 27601 (+8) | 1.00 |
| Digestive / gastroenterology | 1.00 | 1 of 838 | 27374 (+18), 27601 (+9), 27260 (+8) | 1.00 |
| Kidney / nephrology | 1.00 | 0 of 838 | 28076 (+13), 27374 (+10), 27840 (+10) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 838 | 27374 (+16), 28076 (+9), 27260 (+7) | 1.00 |
| Cancer care / oncology | 0.99 | 2 of 838 | 28076 (+16), 27374 (+15), 27584 (+13) | 1.00 |
| Arthritis / rheumatology | 1.00 | 1 of 838 | 27374 (+19), 28801 (+10), 27840 (+9) | 1.00 |
| Brain & nerves / neurology | 1.00 | 1 of 838 | 27374 (+18), 28076 (+12), 27875 (+8) | 1.00 |
| Ear, nose & throat | 1.00 | 1 of 838 | 27374 (+20), 27601 (+10), 28301 (+10) | 1.00 |
| Urology | 0.99 | 2 of 838 | 27374 (+30), 28076 (+21), 27260 (+12) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 0 of 838 | 27374 (+14), 28076 (+9), 28801 (+7) | 1.00 |
| Pain management | 1.00 | 1 of 838 | 27374 (+15), 28076 (+9), 28301 (+9) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 1 of 838 | 28076 (+16), 27374 (+12), 28452 (+7) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 838 | 28076 (+15), 27374 (+12), 27601 (+12) | 1.00 |
| Nutrition & dietitian | 1.00 | 0 of 838 | 28301 (+13), 27890 (+8), 27101 (+7) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 838 | 28301 (+15), 27601 (+8), 28401 (+6) | 1.00 |
| Urgent care & emergency | 1.00 | 0 of 838 | 28301 (+14), 27957 (+12), 27967 (+9) | 1.00 |
| Imaging & lab | 1.00 | 0 of 838 | 27374 (+14), 28076 (+9), 27601 (+8) | 1.00 |
| Pharmacy | 1.00 | 1 of 838 | 28076 (+21), 28301 (+13), 27374 (+10) | 1.00 |
| Home health & in-home care | 1.00 | 0 of 838 | 27957 (+12), 28301 (+12), 27967 (+11) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 838 | 28076 (+38), 27374 (+23), 27584 (+20) | 1.00 |
| Medical equipment & supplies | 0.99 | 3 of 838 | 27374 (+21), 28076 (+21), 28301 (+17) | 1.00 |
| Hearing & audiology | 1.00 | 1 of 838 | 27374 (+17), 28801 (+12), 27601 (+10) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 0 of 838 | 27101 (+6), 27105 (+6), 28202 (+6) | 1.00 |
| Care coordination & community health | 1.00 | 0 of 838 | 28301 (+4), 27401 (+3), 28801 (+3) | 1.00 |
| General surgery | 0.99 | 0 of 838 | 28076 (+13), 27374 (+11), 27873 (+8) | 1.00 |
| Infectious disease | 1.00 | 0 of 838 | 27374 (+11), 28076 (+11), 27584 (+7) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 838 | 28076 (+14), 27374 (+13), 27584 (+8) | 1.00 |
| Hospice & palliative care | 0.99 | 0 of 838 | 28076 (+14), 27374 (+9), 28301 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Sample ZIPs

| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |
|---|---|---|---|---|---|

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 47 of 836 | 223,092 (2.7%) | 3/64 | 42/445 | 2/238 | 0/83 | 0/6 |
| Women's health / OB-GYN | 016 | 5 of 836 | 2,166 (0.0%) | 0/64 | 4/445 | 0/238 | 0/83 | 1/6 |
| Mental health & counseling: Psychiatry | 029 | 7 of 836 | 4,310 (0.1%) | 0/64 | 3/445 | 4/238 | 0/83 | 0/6 |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 836 | 2,590 (0.0%) | 0/64 | 3/445 | 1/238 | 0/83 | 0/6 |
| Mental health & counseling: Clinical Social Work | 037 | 7 of 836 | 5,614 (0.1%) | 0/64 | 7/445 | 0/238 | 0/83 | 0/6 |
| Eye care | 023 | 16 of 836 | 21,169 (0.3%) | 0/64 | 10/445 | 5/238 | 0/83 | 1/6 |
| Chiropractic | 010 | 7 of 836 | 4,239 (0.1%) | 0/64 | 3/445 | 3/238 | 0/83 | 1/6 |
| Physical & occupational therapy | F049 | 1 of 836 | 545 (0.0%) | 0/64 | 1/445 | 0/238 | 0/83 | 0/6 |
| Orthopedics & sports injury | 025 | 22 of 836 | 21,579 (0.3%) | 0/64 | 16/445 | 5/238 | 0/83 | 1/6 |
| Heart / cardiology | 008 | 46 of 836 | 116,693 (1.4%) | 0/64 | 30/445 | 13/238 | 0/83 | 3/6 |
| Skin / dermatology | 011 | 16 of 836 | 28,240 (0.3%) | 0/64 | 4/445 | 10/238 | 1/83 | 1/6 |
| Allergy & immunology | 007 | 47 of 836 | 225,814 (2.8%) | 1/64 | 36/445 | 7/238 | 2/83 | 1/6 |
| Lung, breathing & sleep | 030 | 19 of 836 | 27,531 (0.3%) | 0/64 | 3/445 | 15/238 | 0/83 | 1/6 |
| Digestive / gastroenterology | 014 | 20 of 836 | 16,989 (0.2%) | 0/64 | 4/445 | 14/238 | 1/83 | 1/6 |
| Kidney / nephrology | 018 | 9 of 836 | 5,862 (0.1%) | 0/64 | 4/445 | 4/238 | 0/83 | 1/6 |
| Diabetes & hormones | 012 | 10 of 836 | 6,081 (0.1%) | 0/64 | 1/445 | 8/238 | 0/83 | 1/6 |
| Cancer care / oncology | 021 | 13 of 836 | 59,140 (0.7%) | 3/64 | 4/445 | 5/238 | 0/83 | 1/6 |
| Arthritis / rheumatology | 031 | 16 of 836 | 34,289 (0.4%) | 1/64 | 3/445 | 11/238 | 0/83 | 1/6 |
| Brain & nerves / neurology | 019 | 8 of 836 | 23,304 (0.3%) | 0/64 | 6/445 | 1/238 | 0/83 | 1/6 |
| Ear, nose & throat | 013 | 8 of 836 | 3,672 (0.0%) | 0/64 | 5/445 | 2/238 | 0/83 | 1/6 |
| Urology | 033 | 13 of 836 | 5,848 (0.1%) | 0/64 | 5/445 | 7/238 | 0/83 | 1/6 |
| Foot & ankle / podiatry | 028 | 7 of 836 | 4,407 (0.1%) | 0/64 | 4/445 | 2/238 | 0/83 | 1/6 |
| Plastic & reconstructive surgery | 027 | 17 of 836 | 39,346 (0.5%) | 1/64 | 4/445 | 11/238 | 0/83 | 1/6 |
| Speech & language therapy | F051 | 7 of 836 | 4,239 (0.1%) | 0/64 | 3/445 | 3/238 | 0/83 | 1/6 |
| Imaging & lab | F047 | 4 of 836 | 1,895 (0.0%) | 0/64 | 3/445 | 0/238 | 0/83 | 1/6 |
| Nursing & assisted living | F046 | 5 of 836 | 3,546 (0.0%) | 0/64 | 1/445 | 3/238 | 0/83 | 1/6 |
| General surgery | 015 | 33 of 836 | 76,455 (0.9%) | 0/64 | 27/445 | 5/238 | 0/83 | 1/6 |
| Infectious disease | 017 | 19 of 836 | 55,691 (0.7%) | 0/64 | 6/445 | 10/238 | 2/83 | 1/6 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 33560 rows (ZIP x specialty) stored in access_e2sfca for NC; market-score now uses drive-time access for these ZIPs.
