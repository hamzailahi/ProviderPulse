# E2SFCA access dry run: Iowa

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,474; in Iowa: 969
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,474 x 2,474 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 228,005.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.40 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (5.99), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 26,193.6 | 4.30 | 0.61 | 269 of 969 | 52565 (-49), 50165 (-48), 52561 (-37) | 52660 (+75), 50261 (+73), 52637 (+67) |
| Pediatrics (children) | 30 | 5,571.2 | 1.11 | 0.82 | 61 of 969 | 52171 (-16), 52561 (-16), 52533 (-15) | 52247 (+59), 50009 (+52), 50211 (+48) |
| Women's health / OB-GYN | 60 | 2,811 | 0.53 | 0.62 | 312 of 969 | 52338 (-56), 52351 (-47), 52758 (-47) | 50261 (+58), 52660 (+50), 50236 (+46) |
| Mental health & counseling | 30 | 40,458.4 | 7.20 | 0.73 | 171 of 969 | 52101 (-24), 52561 (-22), 50523 (-20) | 50261 (+67), 52247 (+65), 52242 (+63) |
| Dental | 30 | 10,156 | 1.65 | 0.59 | 269 of 969 | 50165 (-29), 50841 (-28), 52561 (-28) | 51554 (+72), 50261 (+64), 52247 (+62) |
| Eye care | 30 | 4,370.6 | 0.62 | 0.65 | 406 of 969 | 50841 (-52), 50839 (-44), 50517 (-39) | 50851 (+100), 50261 (+87), 50597 (+87) |
| Chiropractic | 30 | 8,010.2 | 0.63 | 0.60 | 453 of 969 | 50841 (-43), 52561 (-40), 50846 (-36) | 50256 (+100), 52242 (+100), 52630 (+99) |
| Physical & occupational therapy | 30 | 19,850.4 | 2.70 | 0.65 | 290 of 969 | 50841 (-53), 50839 (-38), 52349 (-32) | 50256 (+84), 50261 (+83), 50631 (+75) |
| Orthopedics & sports injury | 60 | 3,164.2 | 0.39 | 0.52 | 520 of 969 | 50262 (-87), 52162 (-83), 50585 (-79) | 52660 (+73), 50236 (+69), 52637 (+69) |
| Heart / cardiology | 60 | 1,082.8 | 0.24 | 0.55 | 243 of 969 | 52351 (-87), 52203 (-86), 52236 (-86) | 52660 (+76), 52637 (+75), 50261 (+68) |
| Skin / dermatology | 60 | 478.8 | 0.09 | 0.59 | 414 of 969 | 52338 (-100), 52351 (-81), 52203 (-78) | 50261 (+63), 50545 (+59), 50063 (+58) |
| Allergy & immunology | 60 | 170.2 | 0.03 | 0.58 | 364 of 969 | 52203 (-100), 52236 (-100), 52307 (-100) | 50236 (+85), 50248 (+81), 52586 (+67) |
| Lung, breathing & sleep | 60 | 616.6 | 0.13 | 0.64 | 247 of 969 | 52203 (-91), 52307 (-91), 52314 (-84) | 50063 (+63), 50261 (+62), 50069 (+55) |
| Digestive / gastroenterology | 60 | 502.4 | 0.11 | 0.58 | 206 of 969 | 52201 (-88), 52236 (-86), 52203 (-82) | 51062 (+79), 50063 (+62), 50261 (+61) |
| Kidney / nephrology | 60 | 554 | 0.11 | 0.46 | 572 of 969 | 52776 (-77), 52351 (-70), 52236 (-69) | 52074 (+86), 52254 (+85), 52309 (+84) |
| Diabetes & hormones | 60 | 344.2 | 0.06 | 0.62 | 301 of 969 | 52338 (-100), 52227 (-89), 52236 (-88) | 50236 (+83), 50248 (+76), 51550 (+73) |
| Cancer care / oncology | 90 | 713.4 | 0.15 | 0.27 | 562 of 969 | 52201 (-100), 52338 (-100), 52351 (-96) | 52637 (+81), 51444 (+80), 51401 (+78) |
| Arthritis / rheumatology | 60 | 180.6 | 0.04 | 0.54 | 282 of 969 | 52201 (-100), 52322 (-100), 52361 (-100) | 52031 (+88), 50236 (+85), 50248 (+81) |
| Brain & nerves / neurology | 60 | 940.4 | 0.22 | 0.59 | 219 of 969 | 52203 (-100), 52236 (-100), 52307 (-100) | 51062 (+72), 50468 (+45), 50248 (+43) |
| Ear, nose & throat | 60 | 449 | 0.07 | 0.56 | 467 of 969 | 52201 (-100), 52203 (-100), 52206 (-100) | 52660 (+74), 52637 (+68), 52645 (+67) |
| Urology | 60 | 382.4 | 0.07 | 0.54 | 540 of 969 | 52236 (-96), 52201 (-93), 52203 (-93) | 50261 (+77), 50101 (+75), 51649 (+68) |
| Foot & ankle / podiatry | 60 | 787 | 0.15 | 0.51 | 565 of 969 | 50523 (-100), 50586 (-100), 50529 (-99) | 52630 (+70), 50236 (+69), 50247 (+67) |
| Pain management | 60 | 284.2 | 0.09 | 0.60 | 181 of 969 | 52773 (-51), 52726 (-50), 52758 (-49) | 51062 (+72), 50558 (+67), 50261 (+66) |
| Plastic & reconstructive surgery | 90 | 270 | 0.07 | 0.41 | 367 of 969 | 52351 (-63), 52306 (-62), 52206 (-61) | 50063 (+65), 52242 (+65), 50261 (+64) |
| Speech & language therapy | 30 | 5,744.4 | 0.90 | 0.77 | 138 of 969 | 50647 (-36), 52172 (-33), 50115 (-29) | 50631 (+86), 50676 (+71), 50658 (+63) |
| Nutrition & dietitian | 30 | 2,208.6 | 0.33 | 0.73 | 345 of 969 | 50247 (-54), 50841 (-51), 51540 (-48) | 51636 (+91), 52755 (+80), 51630 (+79) |
| Acupuncture, massage & naturopathy | 30 | 1,345.2 | 0.52 | 0.82 | 43 of 969 | 52620 (-29), 50864 (-22), 52626 (-21) | 52588 (+56), 52651 (+48), 52580 (+41) |
| Urgent care & emergency | 30 | 2,589.8 | 0.47 | 0.62 | 339 of 969 | 50839 (-48), 50841 (-48), 50071 (-47) | 52660 (+100), 52570 (+96), 52637 (+88) |
| Imaging & lab | 60 | 2,416.8 | 0.49 | 0.55 | 328 of 969 | 52351 (-99), 52338 (-92), 52236 (-90) | 50468 (+59), 52202 (+56), 50261 (+52) |
| Pharmacy | 30 | 12,210.2 | 1.72 | 0.56 | 354 of 969 | 50165 (-50), 50060 (-38), 51449 (-36) | 50527 (+93), 52755 (+86), 50147 (+80) |
| Home health & in-home care | 30 | 34,607.4 | 1.61 | 0.70 | 74 of 969 | 50133 (-29), 50155 (-29), 51052 (-28) | 51062 (+99), 51654 (+84), 51554 (+73) |
| Nursing & assisted living | 60 | 4,331.2 | 0.39 | 0.60 | 428 of 969 | 50071 (-100), 52561 (-89), 51630 (-85) | 52074 (+76), 52254 (+73), 52309 (+73) |
| Medical equipment & supplies | 60 | 2,159 | 0.36 | 0.56 | 430 of 969 | 50585 (-51), 51632 (-51), 50523 (-49) | 50261 (+58), 51341 (+56), 52771 (+56) |
| Hearing & audiology | 60 | 1,582.6 | 0.19 | 0.53 | 565 of 969 | 50585 (-100), 51033 (-100), 51346 (-100) | 52660 (+74), 52637 (+69), 50853 (+68) |
| Behavior therapy (ABA) | 30 | 10,089.4 | 2.88 | 0.86 | 36 of 969 | 50313 (-19), 50316 (-13), 50046 (-12) | 50261 (+47), 50073 (+36), 51501 (+36) |
| Care coordination & community health | 30 | 5,806.6 | 1.63 | 0.77 | 68 of 969 | 51340 (-18), 52561 (-17), 51052 (-16) | 51526 (+46), 52755 (+45), 51341 (+44) |
| General surgery | 60 | 1,929.2 | 0.35 | 0.46 | 469 of 969 | 52338 (-95), 52201 (-87), 52322 (-87) | 51062 (+63), 50147 (+60), 50101 (+59) |
| Infectious disease | 90 | 192.8 | 0.05 | 0.41 | 358 of 969 | 52322 (-92), 52720 (-89), 52201 (-88) | 52572 (+83), 52593 (+81), 52574 (+79) |
| Genetics & genetic counseling | 90 | 217.2 | 0.03 | 0.36 | 376 of 969 | 51230 (-100), 51240 (-100), 51241 (-100) | 51636 (+86), 51647 (+86), 51656 (+85) |
| Hospice & palliative care | 60 | 438.4 | 0.09 | 0.59 | 541 of 969 | 51249 (-64), 50514 (-56), 50578 (-55) | 50222 (+77), 52301 (+77), 50149 (+71) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Iowa in households with no vehicle: about 137,573 of 2,450,686 (5.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 2
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 1 of 969 | 52242 (+36), 51101 (+13), 52801 (+12) | 1.00 |
| Pediatrics (children) | 1.00 | 0 of 969 | 51101 (+9), 52401 (+9), 50314 (+7) | 1.00 |
| Women's health / OB-GYN | 1.00 | 1 of 969 | 52242 (+27), 52401 (+13), 52801 (+12) | 1.00 |
| Mental health & counseling | 1.00 | 1 of 969 | 52242 (+75), 52401 (+13), 52801 (+13) | 1.00 |
| Dental | 1.00 | 2 of 969 | 52242 (+50), 51101 (+16), 52401 (+13) | 1.00 |
| Eye care | 1.00 | 2 of 969 | 52242 (+54), 51101 (+19), 52401 (+13) | 1.00 |
| Chiropractic | 0.99 | 5 of 969 | 52242 (+100), 52771 (+23), 52620 (+20) | 1.00 |
| Physical & occupational therapy | 0.99 | 3 of 969 | 52242 (+74), 51101 (+16), 52801 (+15) | 1.00 |
| Orthopedics & sports injury | 1.00 | 3 of 969 | 52242 (+28), 51101 (+22), 52401 (+20) | 1.00 |
| Heart / cardiology | 1.00 | 1 of 969 | 52401 (+18), 51101 (+9), 52247 (+6) | 1.00 |
| Skin / dermatology | 1.00 | 2 of 969 | 52242 (+27), 52401 (+20), 52801 (+13) | 1.00 |
| Allergy & immunology | 1.00 | 0 of 969 | 51101 (+13), 52801 (+10), 50309 (+6) | 1.00 |
| Lung, breathing & sleep | 1.00 | 1 of 969 | 52401 (+20), 52801 (+7), 50309 (+6) | 1.00 |
| Digestive / gastroenterology | 1.00 | 1 of 969 | 52401 (+17), 52801 (+10), 51101 (+7) | 1.00 |
| Kidney / nephrology | 1.00 | 2 of 969 | 52242 (+17), 52401 (+16), 52801 (+14) | 1.00 |
| Diabetes & hormones | 1.00 | 1 of 969 | 52401 (+21), 51101 (+12), 52801 (+9) | 1.00 |
| Cancer care / oncology | 1.00 | 1 of 969 | 52401 (+19), 52801 (+13), 51230 (+8) | 1.00 |
| Arthritis / rheumatology | 1.00 | 0 of 969 | 52401 (+14), 50309 (+9), 52570 (+9) | 1.00 |
| Brain & nerves / neurology | 1.00 | 0 of 969 | 52801 (+7), 52647 (+6), 51101 (+5) | 1.00 |
| Ear, nose & throat | 1.00 | 0 of 969 | 51101 (+13), 50309 (+9), 52801 (+9) | 1.00 |
| Urology | 1.00 | 2 of 969 | 51101 (+19), 52401 (+15), 52801 (+9) | 1.00 |
| Foot & ankle / podiatry | 1.00 | 2 of 969 | 52242 (+29), 52801 (+16), 52401 (+11) | 1.00 |
| Pain management | 1.00 | 1 of 969 | 52801 (+17), 51101 (+12), 52242 (+6) | 1.00 |
| Plastic & reconstructive surgery | 1.00 | 1 of 969 | 52242 (+36), 52401 (+11), 52801 (+9) | 1.00 |
| Speech & language therapy | 1.00 | 1 of 969 | 52242 (+62), 51101 (+12), 52801 (+9) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 969 | 52242 (+22), 50078 (+11), 50309 (+11) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 1 of 969 | 52242 (+28), 52401 (+6), 51101 (+5) | 1.00 |
| Urgent care & emergency | 1.00 | 2 of 969 | 52242 (+38), 52620 (+20), 52401 (+11) | 1.00 |
| Imaging & lab | 1.00 | 0 of 969 | 52401 (+11), 52801 (+11), 51101 (+6) | 1.00 |
| Pharmacy | 1.00 | 1 of 969 | 52242 (+28), 52401 (+14), 52801 (+13) | 1.00 |
| Home health & in-home care | 0.99 | 1 of 969 | 52242 (+17), 51101 (+7), 52401 (+7) | 1.00 |
| Nursing & assisted living | 0.99 | 4 of 969 | 52242 (+47), 51101 (+23), 52620 (+20) | 1.00 |
| Medical equipment & supplies | 0.99 | 1 of 969 | 52242 (+33), 52801 (+12), 52401 (+10) | 1.00 |
| Hearing & audiology | 1.00 | 4 of 969 | 52242 (+58), 51101 (+18), 52401 (+18) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 0 of 969 | 52242 (+14), 51101 (+8), 50314 (+6) | 1.00 |
| Care coordination & community health | 1.00 | 1 of 969 | 52242 (+47), 51101 (+11), 52801 (+9) | 1.00 |
| General surgery | 1.00 | 1 of 969 | 52401 (+17), 51101 (+13), 52590 (+11) | 1.00 |
| Infectious disease | 1.00 | 1 of 969 | 52401 (+18), 51230 (+11), 52801 (+11) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 969 | 52801 (+14), 52308 (+7), 52312 (+5) | 1.00 |
| Hospice & palliative care | 0.99 | 1 of 969 | 52242 (+28), 52401 (+12), 52801 (+9) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 16 of 968 | 18,539 (0.8%) |  | 16/165 | 0/147 | 0/645 | 0/11 |
| Women's health / OB-GYN | 016 | 0 of 968 | 0 (0.0%) |  | 0/165 | 0/147 | 0/645 | 0/11 |
| Mental health & counseling: Psychiatry | 029 | 6 of 968 | 2,705 (0.1%) |  | 3/165 | 0/147 | 3/645 | 0/11 |
| Mental health & counseling: Clinical Psychology | 036 | 8 of 968 | 2,378 (0.1%) |  | 3/165 | 0/147 | 5/645 | 0/11 |
| Mental health & counseling: Clinical Social Work | 037 | 4 of 968 | 1,783 (0.1%) |  | 4/165 | 0/147 | 0/645 | 0/11 |
| Eye care | 023 | 3 of 968 | 1,978 (0.1%) |  | 3/165 | 0/147 | 0/645 | 0/11 |
| Chiropractic | 010 | 0 of 968 | 0 (0.0%) |  | 0/165 | 0/147 | 0/645 | 0/11 |
| Physical & occupational therapy | F049 | 0 of 968 | 0 (0.0%) |  | 0/165 | 0/147 | 0/645 | 0/11 |
| Orthopedics & sports injury | 025 | 1 of 968 | 773 (0.0%) |  | 1/165 | 0/147 | 0/645 | 0/11 |
| Heart / cardiology | 008 | 141 of 968 | 150,024 (6.1%) |  | 32/165 | 17/147 | 87/645 | 5/11 |
| Skin / dermatology | 011 | 83 of 968 | 86,431 (3.5%) |  | 5/165 | 0/147 | 77/645 | 1/11 |
| Allergy & immunology | 007 | 90 of 968 | 93,107 (3.8%) |  | 6/165 | 1/147 | 83/645 | 0/11 |
| Lung, breathing & sleep | 030 | 69 of 968 | 73,217 (3.0%) |  | 2/165 | 3/147 | 64/645 | 0/11 |
| Digestive / gastroenterology | 014 | 260 of 968 | 288,832 (11.8%) |  | 10/165 | 22/147 | 226/645 | 2/11 |
| Kidney / nephrology | 018 | 2 of 968 | 840 (0.0%) |  | 2/165 | 0/147 | 0/645 | 0/11 |
| Diabetes & hormones | 012 | 7 of 968 | 3,813 (0.2%) |  | 1/165 | 0/147 | 6/645 | 0/11 |
| Cancer care / oncology | 021 | 44 of 968 | 46,984 (1.9%) |  | 6/165 | 1/147 | 37/645 | 0/11 |
| Arthritis / rheumatology | 031 | 89 of 968 | 100,741 (4.1%) |  | 2/165 | 6/147 | 81/645 | 0/11 |
| Brain & nerves / neurology | 019 | 115 of 968 | 131,356 (5.4%) |  | 6/165 | 2/147 | 107/645 | 0/11 |
| Ear, nose & throat | 013 | 16 of 968 | 6,784 (0.3%) |  | 5/165 | 0/147 | 11/645 | 0/11 |
| Urology | 033 | 81 of 968 | 80,483 (3.3%) |  | 9/165 | 1/147 | 71/645 | 0/11 |
| Foot & ankle / podiatry | 028 | 1 of 968 | 538 (0.0%) |  | 1/165 | 0/147 | 0/645 | 0/11 |
| Plastic & reconstructive surgery | 027 | 9 of 968 | 4,656 (0.2%) |  | 1/165 | 0/147 | 8/645 | 0/11 |
| Speech & language therapy | F051 | 0 of 968 | 0 (0.0%) |  | 0/165 | 0/147 | 0/645 | 0/11 |
| Imaging & lab | F047 | 1 of 968 | 590 (0.0%) |  | 0/165 | 0/147 | 1/645 | 0/11 |
| Nursing & assisted living | F046 | 0 of 968 | 0 (0.0%) |  | 0/165 | 0/147 | 0/645 | 0/11 |
| General surgery | 015 | 21 of 968 | 15,445 (0.6%) |  | 21/165 | 0/147 | 0/645 | 0/11 |
| Infectious disease | 017 | 58 of 968 | 139,077 (5.7%) |  | 8/165 | 0/147 | 50/645 | 0/11 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 38760 rows (ZIP x specialty) stored in access_e2sfca for IA; market-score now uses drive-time access for these ZIPs.
