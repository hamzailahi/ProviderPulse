# E2SFCA access dry run: Washington

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 918; in Washington: 599
- Drive times: OSRM on OpenStreetMap roads (car profile), 918 x 918 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 1
- Listings read: 340,862.599; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.84 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.11), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 19; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 17 (83808, 98110, 98222, 98243, 98249, 98250, 98261, 98279, 98280, 98281, 98282, 98297, 98303, 98342, 98346, 98351, 98358)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83808 | no | 7.20 | 100% | 7.20 | 100% | no |
| 98110 | yes | 7.30 | 100% | 7.30 | 100% | no |
| 98222 | yes | 15.96 | 67% | 12.54 | 67% | no |
| 98243 | yes | 9.95 | 67% | 7.55 | 67% | no |
| 98249 | yes | 7.36 | 100% | 7.36 | 100% | no |
| 98250 | yes | 10.61 | 67% | 9.06 | 67% | no |
| 98261 | yes | 7.20 | 67% | 7.20 | 67% | no |
| 98279 | yes | 8.34 | 67% | 7.20 | 67% | no |
| 98280 | yes | 9.57 | 67% | 7.55 | 67% | yes (1.69) |
| 98281 | yes | none | 0% | none | 0% | no |
| 98282 | yes | 8.47 | 100% | 8.47 | 100% | no |
| 98286 | yes | 10.89 | 67% | 5.99 | 67% | yes (1.69) |
| 98297 | yes | 20.81 | 67% | 18.85 | 67% | no |
| 98303 | yes | 8.39 | 100% | 8.39 | 100% | no |
| 98340 | yes | 8.23 | 100% | 6.04 | 100% | yes (1.82) |
| 98342 | yes | 8.99 | 100% | 8.99 | 100% | no |
| 98346 | yes | 8.01 | 100% | 8.01 | 100% | no |
| 98351 | yes | 8.57 | 100% | 8.57 | 100% | no |
| 98358 | yes | 7.13 | 100% | 7.13 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 33,497.799 | 4.30 | 0.51 | 268 of 583 | 99160 (-75), 99146 (-63), 98350 (-51) | 98260 (+68), 99011 (+63), 99022 (+62) |
| Pediatrics (children) | 30 | 8,280.2 | 1.11 | 0.77 | 163 of 583 | 98830 (-85), 98036 (-49), 98026 (-34) | 99011 (+82), 99022 (+76), 99004 (+73) |
| Women's health / OB-GYN | 60 | 6,288.2 | 0.53 | 0.72 | 241 of 583 | 99129 (-48), 98433 (-47), 98430 (-43) | 99139 (+100), 99157 (+98), 98647 (+95) |
| Mental health & counseling | 30 | 95,010.4 | 7.20 | 0.66 | 280 of 583 | 99040 (-77), 98587 (-65), 98852 (-65) | 98539 (+100), 98572 (+100), 99139 (+100) |
| Dental | 30 | 18,562.4 | 1.65 | 0.63 | 322 of 583 | 98357 (-51), 98350 (-48), 98590 (-43) | 98376 (+92), 98650 (+90), 98320 (+76) |
| Eye care | 30 | 5,147.2 | 0.62 | 0.57 | 266 of 583 | 98812 (-49), 99123 (-39), 98238 (-37) | 98376 (+98), 99401 (+76), 99328 (+70) |
| Chiropractic | 30 | 7,615.6 | 0.63 | 0.62 | 318 of 583 | 99115 (-77), 98356 (-61), 98245 (-46) | 98262 (+100), 98244 (+97), 98266 (+97) |
| Physical & occupational therapy | 30 | 23,896.4 | 2.70 | 0.69 | 268 of 583 | 99169 (-48), 99138 (-45), 98356 (-32) | 98650 (+82), 99125 (+67), 98195 (+65) |
| Orthopedics & sports injury | 60 | 2,912.2 | 0.39 | 0.73 | 179 of 583 | 99016 (-38), 98817 (-31), 98921 (-31) | 98852 (+98), 99125 (+93), 99171 (+92) |
| Heart / cardiology | 60 | 1,443.2 | 0.24 | 0.78 | 197 of 583 | 99037 (-46), 99016 (-44), 99019 (-41) | 98260 (+98), 98584 (+89), 98237 (+73) |
| Skin / dermatology | 60 | 713.2 | 0.09 | 0.82 | 204 of 583 | 98817 (-50), 98198 (-47), 98032 (-46) | 98830 (+99), 98584 (+88), 98195 (+85) |
| Allergy & immunology | 60 | 185.6 | 0.03 | 0.77 | 194 of 583 | 98635 (-52), 98037 (-46), 98188 (-45) | 98260 (+98), 98376 (+95), 98320 (+86) |
| Lung, breathing & sleep | 60 | 1,071.4 | 0.13 | 0.78 | 159 of 583 | 98198 (-67), 98032 (-66), 98077 (-63) | 98621 (+78), 99022 (+73), 99328 (+73) |
| Digestive / gastroenterology | 60 | 822.4 | 0.11 | 0.78 | 214 of 583 | 98055 (-48), 98198 (-47), 98032 (-45) | 98260 (+97), 98584 (+88), 98236 (+82) |
| Kidney / nephrology | 60 | 722.2 | 0.11 | 0.76 | 191 of 583 | 98198 (-40), 99016 (-39), 98032 (-38) | 98260 (+77), 98333 (+77), 98237 (+74) |
| Diabetes & hormones | 60 | 432.8 | 0.06 | 0.78 | 199 of 583 | 98527 (-56), 98055 (-41), 98032 (-39) | 98647 (+95), 98237 (+88), 98260 (+87) |
| Cancer care / oncology | 90 | 1,413.6 | 0.15 | 0.69 | 277 of 583 | 98198 (-75), 98001 (-74), 98032 (-71) | 98260 (+70), 99401 (+68), 98195 (+65) |
| Arthritis / rheumatology | 60 | 308.4 | 0.04 | 0.82 | 184 of 583 | 98148 (-58), 98166 (-58), 99016 (-58) | 98260 (+98), 98376 (+91), 98830 (+90) |
| Brain & nerves / neurology | 60 | 1,555.8 | 0.22 | 0.84 | 184 of 583 | 98198 (-49), 98032 (-48), 98188 (-45) | 98260 (+90), 98195 (+80), 99011 (+68) |
| Ear, nose & throat | 60 | 592 | 0.07 | 0.77 | 227 of 583 | 98921 (-73), 98055 (-58), 98188 (-56) | 98237 (+100), 98326 (+99), 98320 (+89) |
| Urology | 60 | 548.4 | 0.07 | 0.72 | 255 of 583 | 99016 (-54), 98365 (-53), 99019 (-52) | 98237 (+100), 98621 (+100), 98643 (+99) |
| Foot & ankle / podiatry | 60 | 927.6 | 0.15 | 0.67 | 153 of 583 | 98524 (-30), 98327 (-29), 98433 (-29) | 98237 (+100), 99125 (+97), 98621 (+91) |
| Pain management | 60 | 530.8 | 0.09 | 0.82 | 145 of 583 | 98617 (-49), 98635 (-46), 98639 (-42) | 99401 (+94), 98376 (+86), 98260 (+83) |
| Plastic & reconstructive surgery | 90 | 461.6 | 0.07 | 0.78 | 256 of 583 | 98019 (-44), 98092 (-44), 98921 (-44) | 98195 (+87), 98349 (+76), 98237 (+61) |
| Speech & language therapy | 30 | 6,497.6 | 0.90 | 0.64 | 206 of 583 | 99326 (-61), 99258 (-32), 98233 (-30) | 99335 (+72), 98068 (+68), 98650 (+67) |
| Nutrition & dietitian | 30 | 3,601.4 | 0.33 | 0.68 | 285 of 583 | 98858 (-89), 99122 (-63), 99138 (-63) | 98526 (+100), 98566 (+100), 98575 (+100) |
| Acupuncture, massage & naturopathy | 30 | 26,327.2 | 0.52 | 0.46 | 176 of 583 | 99129 (-31), 98631 (-30), 99033 (-29) | 98355 (+100), 98377 (+100), 98526 (+100) |
| Urgent care & emergency | 30 | 3,449.2 | 0.47 | 0.37 | 268 of 583 | 98562 (-73), 98587 (-72), 98586 (-65) | 98237 (+100), 98326 (+100), 98350 (+100) |
| Imaging & lab | 60 | 3,757.4 | 0.49 | 0.77 | 201 of 583 | 98055 (-47), 99138 (-47), 98077 (-43) | 98237 (+85), 98195 (+75), 99011 (+65) |
| Pharmacy | 30 | 15,809.2 | 1.72 | 0.61 | 280 of 583 | 99040 (-75), 99171 (-39), 98587 (-37) | 99011 (+81), 98952 (+77), 98845 (+75) |
| Home health & in-home care | 30 | 5,616.2 | 1.61 | 0.61 | 70 of 583 | 99138 (-73), 98603 (-30), 99347 (-30) | 99126 (+100), 99131 (+100), 99139 (+100) |
| Nursing & assisted living | 60 | 3,376.6 | 0.39 | 0.66 | 218 of 583 | 99341 (-52), 98593 (-51), 98591 (-50) | 99105 (+100), 99136 (+100), 99139 (+100) |
| Medical equipment & supplies | 60 | 2,264 | 0.36 | 0.69 | 131 of 583 | 98921 (-38), 99029 (-38), 98430 (-26) | 99125 (+97), 99171 (+95), 99176 (+85) |
| Hearing & audiology | 60 | 1,834.4 | 0.19 | 0.72 | 225 of 583 | 99031 (-45), 98674 (-39), 98642 (-38) | 98320 (+100), 98349 (+80), 98584 (+79) |
| Behavior therapy (ABA) | 30 | 17,127.6 | 2.88 | 0.84 | 127 of 583 | 98950 (-94), 98277 (-44), 98278 (-41) | 98333 (+98), 99011 (+73), 98221 (+65) |
| Care coordination & community health | 30 | 17,573.6 | 1.63 | 0.62 | 231 of 583 | 98350 (-94), 99040 (-85), 99138 (-83) | 98320 (+100), 98628 (+100), 98937 (+98) |
| General surgery | 60 | 2,797 | 0.35 | 0.70 | 226 of 583 | 99016 (-47), 98055 (-46), 98188 (-43) | 98237 (+98), 98621 (+87), 98260 (+81) |
| Infectious disease | 90 | 359.2 | 0.05 | 0.66 | 236 of 583 | 98065 (-68), 98029 (-67), 98024 (-66) | 98237 (+76), 98628 (+66), 98195 (+65) |
| Genetics & genetic counseling | 90 | 361.8 | 0.03 | 0.72 | 288 of 583 | 98203 (-100), 98207 (-98), 98204 (-97) | 98584 (+81), 99328 (+79), 98557 (+67) |
| Hospice & palliative care | 60 | 456.4 | 0.09 | 0.72 | 159 of 583 | 98635 (-66), 98617 (-61), 98812 (-58) | 98952 (+88), 98552 (+82), 98333 (+81) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Washington in households with no vehicle: about 407,176 of 6,025,280 (6.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 13
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 6 of 583 | 98195 (+60), 98104 (+37), 98101 (+30) | 1.00 |
| Pediatrics (children) | 1.00 | 2 of 583 | 98104 (+29), 98121 (+18), 98101 (+12) | 1.00 |
| Women's health / OB-GYN | 0.99 | 9 of 583 | 98195 (+84), 98104 (+38), 98121 (+31) | 1.00 |
| Mental health & counseling | 0.99 | 1 of 583 | 98195 (+90), 98104 (+12), 98438 (+12) | 1.00 |
| Dental | 0.99 | 5 of 583 | 98195 (+83), 98104 (+33), 98121 (+25) | 1.00 |
| Eye care | 0.99 | 4 of 583 | 98195 (+67), 98104 (+31), 98101 (+25) | 1.00 |
| Chiropractic | 0.99 | 6 of 583 | 98195 (+89), 98104 (+39), 98121 (+29) | 1.00 |
| Physical & occupational therapy | 0.99 | 8 of 583 | 98195 (+73), 98104 (+40), 98101 (+30) | 1.00 |
| Orthopedics & sports injury | 0.99 | 4 of 581 | 98195 (+47), 98104 (+24), 98101 (+19) | 1.00 |
| Heart / cardiology | 1.00 | 4 of 583 | 98195 (+39), 98104 (+25), 98101 (+21) | 1.00 |
| Skin / dermatology | 0.99 | 5 of 581 | 98195 (+63), 98104 (+32), 98101 (+25) | 1.00 |
| Allergy & immunology | 1.00 | 4 of 581 | 98195 (+40), 98104 (+29), 98101 (+23) | 1.00 |
| Lung, breathing & sleep | 1.00 | 4 of 581 | 98195 (+53), 98104 (+29), 98121 (+23) | 1.00 |
| Digestive / gastroenterology | 0.99 | 4 of 581 | 98195 (+51), 98104 (+28), 98101 (+21) | 1.00 |
| Kidney / nephrology | 0.99 | 4 of 581 | 98195 (+38), 98104 (+26), 98101 (+20) | 1.00 |
| Diabetes & hormones | 1.00 | 4 of 581 | 98195 (+43), 98104 (+28), 98101 (+23) | 1.00 |
| Cancer care / oncology | 1.00 | 5 of 581 | 98195 (+59), 98104 (+28), 98101 (+18) | 1.00 |
| Arthritis / rheumatology | 1.00 | 6 of 581 | 98195 (+56), 98104 (+37), 98121 (+30) | 1.00 |
| Brain & nerves / neurology | 1.00 | 4 of 581 | 98195 (+54), 98104 (+27), 98101 (+21) | 1.00 |
| Ear, nose & throat | 0.99 | 6 of 581 | 98195 (+59), 98104 (+36), 98101 (+29) | 1.00 |
| Urology | 0.99 | 4 of 581 | 98195 (+46), 98104 (+25), 98101 (+20) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 4 of 581 | 98195 (+47), 98104 (+23), 98101 (+18) | 1.00 |
| Pain management | 0.99 | 4 of 581 | 98195 (+43), 98104 (+26), 98101 (+20) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 4 of 581 | 98195 (+52), 98104 (+27), 98101 (+21) | 1.00 |
| Speech & language therapy | 0.99 | 5 of 583 | 98195 (+52), 98104 (+31), 98101 (+25) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 583 | 98195 (+58), 98402 (+14), 98934 (+9) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 1 of 583 | 98195 (+75), 98673 (+14), 98582 (+9) | 1.00 |
| Urgent care & emergency | 1.00 | 5 of 583 | 98195 (+52), 98104 (+27), 98121 (+23) | 1.00 |
| Imaging & lab | 0.99 | 5 of 583 | 98195 (+54), 98104 (+33), 98101 (+25) | 1.00 |
| Pharmacy | 0.99 | 4 of 583 | 98195 (+78), 98104 (+31), 98121 (+26) | 1.00 |
| Home health & in-home care | 0.99 | 1 of 583 | 98195 (+21), 98104 (+12), 98101 (+10) | 1.00 |
| Nursing & assisted living | 0.99 | 6 of 583 | 98195 (+50), 98104 (+30), 98101 (+24) | 1.00 |
| Medical equipment & supplies | 0.99 | 4 of 581 | 98195 (+40), 98104 (+22), 98101 (+17) | 1.00 |
| Hearing & audiology | 0.99 | 5 of 583 | 98195 (+53), 98104 (+33), 98101 (+26) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 5 of 583 | 98195 (+60), 98104 (+32), 98101 (+27) | 1.00 |
| Care coordination & community health | 1.00 | 5 of 583 | 98195 (+53), 98104 (+27), 98101 (+21) | 1.00 |
| General surgery | 0.99 | 4 of 583 | 98195 (+52), 98104 (+25), 98101 (+21) | 1.00 |
| Infectious disease | 1.00 | 4 of 581 | 98195 (+49), 98104 (+24), 98101 (+17) | 1.00 |
| Genetics & genetic counseling | 1.00 | 3 of 581 | 98104 (+22), 98195 (+18), 98402 (+17) | 1.00 |
| Hospice & palliative care | 0.99 | 2 of 581 | 98195 (+29), 98104 (+18), 98101 (+14) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 59 of 599 | 99,320 (1.6%) | 7/84 | 23/228 | 15/135 | 14/106 | 0/46 |
| Women's health / OB-GYN | 016 | 6 of 599 | 3,766 (0.1%) | 0/84 | 3/228 | 1/135 | 2/106 | 0/46 |
| Mental health & counseling: Psychiatry | 029 | 69 of 599 | 76,692 (1.3%) | 4/84 | 7/228 | 22/135 | 20/106 | 16/46 |
| Mental health & counseling: Clinical Psychology | 036 | 30 of 599 | 32,596 (0.5%) | 5/84 | 3/228 | 13/135 | 9/106 | 0/46 |
| Mental health & counseling: Clinical Social Work | 037 | 24 of 599 | 15,516 (0.3%) | 3/84 | 7/228 | 10/135 | 4/106 | 0/46 |
| Eye care | 023 | 34 of 599 | 29,322 (0.5%) | 4/84 | 13/228 | 13/135 | 4/106 | 0/46 |
| Chiropractic | 010 | 7 of 599 | 3,702 (0.1%) | 2/84 | 2/228 | 2/135 | 1/106 | 0/46 |
| Physical & occupational therapy | F049 | 10 of 599 | 4,334 (0.1%) | 4/84 | 2/228 | 2/135 | 2/106 | 0/46 |
| Orthopedics & sports injury | 025 | 62 of 599 | 81,639 (1.4%) | 4/84 | 19/228 | 31/135 | 5/106 | 3/46 |
| Heart / cardiology | 008 | 129 of 599 | 256,690 (4.3%) | 9/84 | 28/228 | 50/135 | 19/106 | 23/46 |
| Skin / dermatology | 011 | 96 of 599 | 156,064 (2.6%) | 9/84 | 11/228 | 38/135 | 28/106 | 10/46 |
| Allergy & immunology | 007 | 109 of 599 | 213,867 (3.5%) | 7/84 | 16/228 | 46/135 | 19/106 | 21/46 |
| Lung, breathing & sleep | 030 | 58 of 599 | 105,693 (1.8%) | 8/84 | 9/228 | 38/135 | 3/106 | 0/46 |
| Digestive / gastroenterology | 014 | 69 of 599 | 109,143 (1.8%) | 6/84 | 13/228 | 39/135 | 11/106 | 0/46 |
| Kidney / nephrology | 018 | 34 of 599 | 51,889 (0.9%) | 4/84 | 9/228 | 18/135 | 3/106 | 0/46 |
| Diabetes & hormones | 012 | 40 of 599 | 53,135 (0.9%) | 5/84 | 7/228 | 26/135 | 2/106 | 0/46 |
| Cancer care / oncology | 021 | 116 of 599 | 272,804 (4.5%) | 13/84 | 11/228 | 42/135 | 25/106 | 25/46 |
| Arthritis / rheumatology | 031 | 79 of 599 | 115,558 (1.9%) | 4/84 | 5/228 | 36/135 | 26/106 | 8/46 |
| Brain & nerves / neurology | 019 | 82 of 599 | 116,899 (1.9%) | 7/84 | 10/228 | 39/135 | 13/106 | 13/46 |
| Ear, nose & throat | 013 | 81 of 599 | 117,363 (1.9%) | 4/84 | 14/228 | 26/135 | 18/106 | 19/46 |
| Urology | 033 | 81 of 599 | 188,834 (3.1%) | 12/84 | 12/228 | 32/135 | 9/106 | 16/46 |
| Foot & ankle / podiatry | 028 | 56 of 599 | 78,122 (1.3%) | 6/84 | 7/228 | 28/135 | 7/106 | 8/46 |
| Plastic & reconstructive surgery | 027 | 70 of 599 | 98,179 (1.6%) | 4/84 | 11/228 | 32/135 | 10/106 | 13/46 |
| Speech & language therapy | F051 | 16 of 599 | 17,252 (0.3%) | 5/84 | 3/228 | 3/135 | 5/106 | 0/46 |
| Imaging & lab | F047 | 27 of 599 | 28,586 (0.5%) | 4/84 | 6/228 | 9/135 | 8/106 | 0/46 |
| Nursing & assisted living | F046 | 22 of 599 | 20,192 (0.3%) | 4/84 | 4/228 | 9/135 | 5/106 | 0/46 |
| General surgery | 015 | 64 of 599 | 107,665 (1.8%) | 4/84 | 22/228 | 28/135 | 8/106 | 2/46 |
| Infectious disease | 017 | 73 of 599 | 110,893 (1.8%) | 9/84 | 8/228 | 23/135 | 19/106 | 14/46 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 23960 rows (ZIP x specialty) stored in access_e2sfca for WA; market-score now uses drive-time access for these ZIPs.
