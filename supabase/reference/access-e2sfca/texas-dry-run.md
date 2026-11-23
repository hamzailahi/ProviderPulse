# E2SFCA access dry run: Texas

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 3,600; in Texas: 1,940
- Drive times: OSRM on OpenStreetMap roads (car profile), 3,600 x 3,600 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 832,818.606; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.37 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.92), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 79759 | yes | 6.37 | 100% | 1.42 | 100% | yes (1.60) |
| 81091 | no | 6.64 | 100% | 5.29 | 100% | yes (1.57) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 111,689.405 | 4.30 | 0.64 | 638 of 1940 | 77563 (-59), 79502 (-44), 76234 (-40) | 77617 (+89), 79533 (+73), 79098 (+70) |
| Pediatrics (children) | 30 | 25,216.2 | 1.11 | 0.83 | 373 of 1940 | 79010 (-81), 78044 (-80), 77563 (-72) | 76534 (+94), 78725 (+91), 79009 (+90) |
| Women's health / OB-GYN | 60 | 12,928 | 0.53 | 0.76 | 658 of 1940 | 75692 (-45), 76524 (-44), 78617 (-44) | 77617 (+88), 77650 (+75), 76528 (+65) |
| Mental health & counseling | 30 | 149,613.8 | 7.20 | 0.80 | 194 of 1940 | 75473 (-37), 75057 (-23), 76524 (-20) | 78732 (+77), 79009 (+55), 78725 (+53) |
| Dental | 30 | 44,526.4 | 1.65 | 0.75 | 602 of 1940 | 78044 (-73), 76452 (-65), 79010 (-40) | 76528 (+75), 78608 (+63), 79098 (+58) |
| Eye care | 30 | 16,207.4 | 0.62 | 0.75 | 601 of 1940 | 76882 (-74), 76884 (-39), 75951 (-37) | 79223 (+100), 78832 (+89), 79098 (+84) |
| Chiropractic | 30 | 16,008.4 | 0.63 | 0.77 | 540 of 1940 | 79064 (-66), 79082 (-36), 76102 (-35) | 79098 (+84), 78645 (+68), 79025 (+62) |
| Physical & occupational therapy | 30 | 63,335.2 | 2.70 | 0.71 | 508 of 1940 | 79019 (-48), 75494 (-45), 79744 (-39) | 79098 (+80), 78618 (+63), 76463 (+62) |
| Orthopedics & sports injury | 60 | 9,454 | 0.39 | 0.74 | 620 of 1940 | 78833 (-66), 75681 (-56), 76649 (-55) | 79533 (+98), 77617 (+95), 78622 (+72) |
| Heart / cardiology | 60 | 5,540.4 | 0.24 | 0.78 | 789 of 1940 | 77037 (-59), 77016 (-52), 77510 (-52) | 78590 (+93), 77617 (+85), 79533 (+85) |
| Skin / dermatology | 60 | 2,159.4 | 0.09 | 0.83 | 677 of 1940 | 78617 (-56), 76354 (-53), 78653 (-50) | 77617 (+89), 77650 (+77), 77302 (+72) |
| Allergy & immunology | 60 | 828 | 0.03 | 0.82 | 747 of 1940 | 78617 (-77), 75692 (-70), 75763 (-63) | 77617 (+83), 76041 (+81), 76266 (+77) |
| Lung, breathing & sleep | 60 | 3,252.8 | 0.13 | 0.80 | 703 of 1940 | 78380 (-68), 75692 (-64), 75672 (-62) | 77617 (+93), 79533 (+82), 77873 (+62) |
| Digestive / gastroenterology | 60 | 2,481 | 0.11 | 0.79 | 708 of 1940 | 75692 (-62), 77016 (-58), 75659 (-57) | 78590 (+93), 79533 (+89), 77617 (+85) |
| Kidney / nephrology | 60 | 3,307 | 0.11 | 0.66 | 908 of 1940 | 79743 (-78), 79252 (-74), 76360 (-72) | 78021 (+100), 79533 (+99), 77617 (+89) |
| Diabetes & hormones | 60 | 1,305 | 0.06 | 0.81 | 586 of 1940 | 77037 (-59), 75692 (-58), 77016 (-54) | 78828 (+100), 79506 (+91), 78833 (+90) |
| Cancer care / oncology | 90 | 3,453.4 | 0.15 | 0.58 | 928 of 1940 | 77049 (-79), 77578 (-78), 77050 (-77) | 77650 (+90), 77617 (+86), 79533 (+82) |
| Arthritis / rheumatology | 60 | 876.6 | 0.04 | 0.80 | 730 of 1940 | 76357 (-80), 76360 (-68), 77015 (-56) | 77617 (+94), 79743 (+93), 79789 (+88) |
| Brain & nerves / neurology | 60 | 6,702.2 | 0.22 | 0.84 | 641 of 1940 | 78252 (-79), 78245 (-78), 78070 (-76) | 79533 (+99), 77617 (+88), 78590 (+84) |
| Ear, nose & throat | 60 | 1,620 | 0.07 | 0.76 | 801 of 1940 | 75763 (-99), 75782 (-90), 75692 (-88) | 79533 (+99), 77617 (+83), 79010 (+74) |
| Urology | 60 | 1,636.8 | 0.07 | 0.75 | 800 of 1940 | 75692 (-69), 79068 (-63), 75659 (-60) | 79533 (+99), 77617 (+89), 78563 (+86) |
| Foot & ankle / podiatry | 60 | 2,987 | 0.15 | 0.74 | 518 of 1940 | 79019 (-57), 75782 (-46), 79245 (-43) | 75496 (+89), 77617 (+79), 75470 (+75) |
| Pain management | 60 | 2,884.6 | 0.09 | 0.80 | 795 of 1940 | 75446 (-67), 77957 (-63), 75249 (-60) | 76627 (+94), 78590 (+90), 75101 (+89) |
| Plastic & reconstructive surgery | 90 | 1,756.4 | 0.07 | 0.74 | 907 of 1940 | 77578 (-81), 77015 (-79), 77049 (-79) | 78618 (+92), 77617 (+80), 77650 (+77) |
| Speech & language therapy | 30 | 30,742 | 0.90 | 0.77 | 690 of 1940 | 77963 (-49), 78881 (-49), 79068 (-44) | 78044 (+100), 75755 (+95), 75684 (+93) |
| Nutrition & dietitian | 30 | 8,981.6 | 0.33 | 0.80 | 476 of 1940 | 79019 (-93), 78653 (-65), 79095 (-60) | 76519 (+100), 77617 (+85), 79098 (+81) |
| Acupuncture, massage & naturopathy | 30 | 7,697.8 | 0.52 | 0.82 | 164 of 1940 | 78608 (-58), 79843 (-56), 79241 (-29) | 75932 (+62), 78732 (+62), 78730 (+55) |
| Urgent care & emergency | 30 | 13,772.2 | 0.47 | 0.61 | 852 of 1940 | 75862 (-80), 79373 (-78), 77873 (-64) | 76845 (+100), 79056 (+100), 79519 (+100) |
| Imaging & lab | 60 | 13,763 | 0.49 | 0.79 | 705 of 1940 | 77547 (-66), 77506 (-62), 77016 (-61) | 79533 (+91), 77617 (+84), 78590 (+78) |
| Pharmacy | 30 | 44,954.8 | 1.72 | 0.62 | 649 of 1940 | 76430 (-48), 79227 (-46), 76524 (-38) | 76519 (+99), 79098 (+89), 78353 (+81) |
| Home health & in-home care | 30 | 29,112.6 | 1.61 | 0.78 | 298 of 1940 | 75657 (-50), 79261 (-36), 75207 (-35) | 77481 (+89), 77444 (+70), 75564 (+68) |
| Nursing & assisted living | 60 | 10,316.4 | 0.39 | 0.58 | 796 of 1940 | 75782 (-67), 76648 (-66), 79236 (-66) | 79094 (+100), 78005 (+96), 76862 (+87) |
| Medical equipment & supplies | 60 | 12,685.4 | 0.36 | 0.76 | 777 of 1940 | 79851 (-67), 78543 (-63), 77015 (-55) | 78590 (+87), 77444 (+83), 79744 (+69) |
| Hearing & audiology | 60 | 4,983.6 | 0.19 | 0.74 | 715 of 1940 | 75792 (-75), 76524 (-70), 79350 (-70) | 77617 (+93), 76519 (+87), 78618 (+78) |
| Behavior therapy (ABA) | 30 | 52,759 | 2.88 | 0.85 | 233 of 1940 | 76087 (-38), 76086 (-31), 77060 (-29) | 76528 (+97), 76539 (+83), 78063 (+75) |
| Care coordination & community health | 30 | 42,978.6 | 1.63 | 0.82 | 56 of 1940 | 75473 (-52), 79039 (-48), 75411 (-38) | 75412 (+100), 79323 (+100), 79009 (+95) |
| General surgery | 60 | 10,312.8 | 0.35 | 0.79 | 740 of 1940 | 77016 (-75), 77037 (-75), 77547 (-74) | 79533 (+99), 77617 (+85), 78618 (+73) |
| Infectious disease | 90 | 1,057.6 | 0.05 | 0.69 | 994 of 1940 | 77049 (-70), 77015 (-69), 77506 (-67) | 78590 (+82), 76630 (+80), 75750 (+78) |
| Genetics & genetic counseling | 90 | 596.8 | 0.03 | 0.71 | 678 of 1940 | 77503 (-69), 77578 (-69), 77015 (-68) | 77617 (+90), 78067 (+90), 77650 (+87) |
| Hospice & palliative care | 60 | 3,650.2 | 0.09 | 0.77 | 848 of 1940 | 79024 (-100), 75441 (-84), 77506 (-81) | 78598 (+97), 77617 (+96), 79257 (+93) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Texas in households with no vehicle: about 1,186,822 of 21,865,353 (5.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 46
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 6 of 1940 | 78205 (+36), 77661 (+35), 79901 (+29) | 1.00 |
| Pediatrics (children) | 1.00 | 4 of 1940 | 78205 (+34), 79901 (+30), 75247 (+25) | 1.00 |
| Women's health / OB-GYN | 1.00 | 4 of 1940 | 75247 (+23), 79901 (+22), 78205 (+21) | 1.00 |
| Mental health & counseling | 1.00 | 3 of 1940 | 78205 (+21), 79901 (+18), 75247 (+15) | 1.00 |
| Dental | 1.00 | 4 of 1940 | 78205 (+38), 75247 (+31), 79901 (+29) | 1.00 |
| Eye care | 1.00 | 6 of 1940 | 78205 (+33), 79901 (+25), 75247 (+22) | 1.00 |
| Chiropractic | 1.00 | 3 of 1940 | 75247 (+26), 78205 (+18), 79101 (+18) | 1.00 |
| Physical & occupational therapy | 1.00 | 5 of 1940 | 78205 (+30), 79901 (+25), 75247 (+21) | 1.00 |
| Orthopedics & sports injury | 1.00 | 7 of 1940 | 78205 (+23), 75247 (+22), 79901 (+21) | 1.00 |
| Heart / cardiology | 1.00 | 4 of 1940 | 77661 (+27), 78205 (+26), 75247 (+21) | 1.00 |
| Skin / dermatology | 1.00 | 4 of 1940 | 78205 (+27), 75247 (+25), 77661 (+23) | 1.00 |
| Allergy & immunology | 1.00 | 5 of 1940 | 78205 (+32), 75247 (+29), 77661 (+26) | 1.00 |
| Lung, breathing & sleep | 1.00 | 5 of 1940 | 78205 (+36), 75247 (+24), 77661 (+18) | 1.00 |
| Digestive / gastroenterology | 1.00 | 5 of 1940 | 78205 (+23), 75247 (+22), 77661 (+22) | 1.00 |
| Kidney / nephrology | 1.00 | 9 of 1940 | 78205 (+37), 79730 (+31), 79901 (+28) | 1.00 |
| Diabetes & hormones | 1.00 | 4 of 1940 | 78205 (+28), 77661 (+21), 79901 (+20) | 1.00 |
| Cancer care / oncology | 1.00 | 2 of 1940 | 77661 (+28), 78205 (+23), 77081 (+14) | 1.00 |
| Arthritis / rheumatology | 1.00 | 4 of 1940 | 77661 (+39), 78205 (+30), 75247 (+22) | 1.00 |
| Brain & nerves / neurology | 1.00 | 4 of 1940 | 75247 (+27), 78205 (+24), 77661 (+20) | 1.00 |
| Ear, nose & throat | 1.00 | 4 of 1940 | 75779 (+29), 77661 (+25), 78205 (+23) | 1.00 |
| Urology | 1.00 | 4 of 1940 | 78205 (+22), 77661 (+20), 75247 (+16) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 5 of 1940 | 77661 (+23), 78205 (+22), 75247 (+20) | 1.00 |
| Pain management | 1.00 | 6 of 1940 | 78205 (+37), 77661 (+29), 79901 (+23) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 3 of 1940 | 78205 (+24), 75247 (+23), 77661 (+22) | 1.00 |
| Speech & language therapy | 1.00 | 7 of 1940 | 79901 (+44), 78205 (+35), 75247 (+33) | 1.00 |
| Nutrition & dietitian | 1.00 | 5 of 1940 | 78205 (+31), 75247 (+30), 77661 (+29) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 1940 | 79901 (+19), 78401 (+14), 78205 (+13) | 1.00 |
| Urgent care & emergency | 1.00 | 7 of 1940 | 77661 (+39), 78205 (+39), 79901 (+33) | 1.00 |
| Imaging & lab | 1.00 | 6 of 1940 | 75247 (+28), 77661 (+27), 78205 (+25) | 1.00 |
| Pharmacy | 1.00 | 5 of 1940 | 78205 (+34), 79901 (+24), 75247 (+23) | 1.00 |
| Home health & in-home care | 1.00 | 3 of 1940 | 78205 (+21), 79901 (+20), 75247 (+18) | 1.00 |
| Nursing & assisted living | 0.99 | 12 of 1940 | 77661 (+35), 75779 (+33), 78205 (+26) | 1.00 |
| Medical equipment & supplies | 1.00 | 8 of 1940 | 77661 (+28), 78205 (+28), 75247 (+26) | 1.00 |
| Hearing & audiology | 1.00 | 8 of 1940 | 77661 (+37), 78205 (+27), 79101 (+23) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 2 of 1940 | 79901 (+28), 78205 (+20), 78705 (+10) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 1940 | 79901 (+24), 75247 (+10), 78205 (+8) | 1.00 |
| General surgery | 1.00 | 6 of 1940 | 78205 (+31), 75247 (+30), 77661 (+26) | 1.00 |
| Infectious disease | 1.00 | 3 of 1940 | 77661 (+21), 78205 (+18), 75247 (+17) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 1940 | 77081 (+12), 77036 (+11), 77051 (+11) | 1.00 |
| Hospice & palliative care | 1.00 | 8 of 1940 | 77661 (+53), 75470 (+29), 78205 (+28) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 79 of 1936 | 454,134 (2.1%) | 21/452 | 43/537 | 12/250 | 3/461 | 0/236 |
| Women's health / OB-GYN | 016 | 4 of 1936 | 490 (0.0%) | 0/452 | 3/537 | 0/250 | 0/461 | 1/236 |
| Mental health & counseling: Psychiatry | 029 | 39 of 1936 | 223,074 (1.0%) | 21/452 | 5/537 | 3/250 | 7/461 | 3/236 |
| Mental health & counseling: Clinical Psychology | 036 | 13 of 1936 | 25,318 (0.1%) | 4/452 | 2/537 | 4/250 | 3/461 | 0/236 |
| Mental health & counseling: Clinical Social Work | 037 | 12 of 1936 | 34,859 (0.2%) | 1/452 | 10/537 | 1/250 | 0/461 | 0/236 |
| Eye care | 023 | 32 of 1936 | 68,413 (0.3%) | 7/452 | 19/537 | 3/250 | 1/461 | 2/236 |
| Chiropractic | 010 | 7 of 1936 | 1,093 (0.0%) | 0/452 | 6/537 | 0/250 | 0/461 | 1/236 |
| Physical & occupational therapy | F049 | 9 of 1936 | 9,119 (0.0%) | 1/452 | 4/537 | 0/250 | 1/461 | 3/236 |
| Orthopedics & sports injury | 025 | 31 of 1936 | 69,973 (0.3%) | 3/452 | 19/537 | 3/250 | 1/461 | 5/236 |
| Heart / cardiology | 008 | 96 of 1936 | 217,735 (1.0%) | 15/452 | 30/537 | 11/250 | 8/461 | 32/236 |
| Skin / dermatology | 011 | 99 of 1936 | 358,547 (1.6%) | 17/452 | 10/537 | 17/250 | 33/461 | 22/236 |
| Allergy & immunology | 007 | 54 of 1936 | 68,754 (0.3%) | 3/452 | 17/537 | 6/250 | 17/461 | 11/236 |
| Lung, breathing & sleep | 030 | 51 of 1936 | 194,678 (0.9%) | 5/452 | 10/537 | 6/250 | 20/461 | 10/236 |
| Digestive / gastroenterology | 014 | 84 of 1936 | 287,884 (1.3%) | 16/452 | 16/537 | 12/250 | 24/461 | 16/236 |
| Kidney / nephrology | 018 | 13 of 1936 | 11,461 (0.1%) | 1/452 | 5/537 | 0/250 | 1/461 | 6/236 |
| Diabetes & hormones | 012 | 14 of 1936 | 42,842 (0.2%) | 2/452 | 6/537 | 0/250 | 1/461 | 5/236 |
| Cancer care / oncology | 021 | 57 of 1936 | 208,759 (1.0%) | 11/452 | 10/537 | 14/250 | 13/461 | 9/236 |
| Arthritis / rheumatology | 031 | 27 of 1936 | 132,526 (0.6%) | 3/452 | 7/537 | 3/250 | 7/461 | 7/236 |
| Brain & nerves / neurology | 019 | 68 of 1936 | 189,722 (0.9%) | 12/452 | 11/537 | 4/250 | 23/461 | 18/236 |
| Ear, nose & throat | 013 | 37 of 1936 | 126,628 (0.6%) | 2/452 | 14/537 | 2/250 | 9/461 | 10/236 |
| Urology | 033 | 98 of 1936 | 382,443 (1.7%) | 17/452 | 16/537 | 13/250 | 30/461 | 22/236 |
| Foot & ankle / podiatry | 028 | 45 of 1936 | 170,769 (0.8%) | 12/452 | 9/537 | 4/250 | 7/461 | 13/236 |
| Plastic & reconstructive surgery | 027 | 31 of 1936 | 235,246 (1.1%) | 3/452 | 15/537 | 2/250 | 5/461 | 6/236 |
| Speech & language therapy | F051 | 3 of 1936 | 2,424 (0.0%) | 1/452 | 1/537 | 0/250 | 1/461 | 0/236 |
| Imaging & lab | F047 | 17 of 1936 | 60,205 (0.3%) | 7/452 | 5/537 | 0/250 | 1/461 | 4/236 |
| Nursing & assisted living | F046 | 8 of 1936 | 64,924 (0.3%) | 5/452 | 1/537 | 0/250 | 1/461 | 1/236 |
| General surgery | 015 | 48 of 1936 | 110,644 (0.5%) | 5/452 | 23/537 | 7/250 | 2/461 | 11/236 |
| Infectious disease | 017 | 27 of 1936 | 87,296 (0.4%) | 2/452 | 10/537 | 0/250 | 7/461 | 8/236 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 77600 rows (ZIP x specialty) stored in access_e2sfca for TX; market-score now uses drive-time access for these ZIPs.
