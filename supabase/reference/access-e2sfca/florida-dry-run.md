# E2SFCA access dry run: Florida

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,334; in Florida: 997
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,334 x 1,334 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 666,658; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.69 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.72), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 2; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 33109 | yes | 7.41 | 100% | 2.95 | 100% | yes (1.39) |
| 33127 | yes | 10.49 | 100% | 4.57 | 100% | yes (0.69) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 98,387.8 | 4.30 | 0.73 | 382 of 997 | 34141 (-68), 32446 (-42), 32025 (-33) | 32667 (+93), 32336 (+92), 32361 (+87) |
| Pediatrics (children) | 30 | 20,693 | 1.11 | 0.83 | 288 of 997 | 33760 (-46), 33312 (-42), 33315 (-41) | 32667 (+88), 33149 (+81), 34773 (+78) |
| Women's health / OB-GYN | 60 | 9,221.4 | 0.53 | 0.72 | 273 of 997 | 32681 (-72), 32664 (-66), 32634 (-62) | 32344 (+64), 32336 (+63), 33956 (+63) |
| Mental health & counseling | 30 | 93,319 | 7.20 | 0.81 | 152 of 997 | 34141 (-68), 33855 (-44), 32025 (-28) | 32696 (+92), 32667 (+90), 32621 (+87) |
| Dental | 30 | 27,203.6 | 1.65 | 0.78 | 241 of 997 | 32025 (-29), 33018 (-26), 32424 (-25) | 32667 (+96), 32336 (+56), 33149 (+56) |
| Eye care | 30 | 11,480.2 | 0.62 | 0.74 | 335 of 997 | 32025 (-44), 32446 (-34), 32448 (-34) | 33149 (+75), 32667 (+72), 32426 (+68) |
| Chiropractic | 30 | 13,360 | 0.63 | 0.81 | 322 of 997 | 33037 (-67), 32359 (-43), 32803 (-30) | 34251 (+85), 34138 (+80), 32617 (+73) |
| Physical & occupational therapy | 30 | 52,341.6 | 2.70 | 0.77 | 320 of 997 | 32565 (-40), 32803 (-36), 32025 (-34) | 32336 (+76), 34251 (+69), 32361 (+68) |
| Orthopedics & sports injury | 60 | 6,526 | 0.39 | 0.74 | 256 of 997 | 32681 (-64), 32664 (-60), 32634 (-59) | 32616 (+75), 33149 (+56), 32336 (+49) |
| Heart / cardiology | 60 | 5,445.4 | 0.24 | 0.67 | 505 of 997 | 32681 (-100), 32634 (-95), 32664 (-94) | 32336 (+75), 34140 (+71), 32344 (+68) |
| Skin / dermatology | 60 | 2,263.8 | 0.09 | 0.77 | 443 of 997 | 32664 (-87), 32681 (-81), 32634 (-73) | 34138 (+91), 34139 (+84), 32336 (+77) |
| Allergy & immunology | 60 | 530.8 | 0.03 | 0.76 | 435 of 997 | 32681 (-68), 32664 (-64), 32634 (-61) | 33438 (+96), 33476 (+96), 33430 (+93) |
| Lung, breathing & sleep | 60 | 3,137.6 | 0.13 | 0.76 | 345 of 997 | 32664 (-100), 32634 (-92), 32681 (-92) | 33037 (+90), 32087 (+60), 34797 (+56) |
| Digestive / gastroenterology | 60 | 2,345.2 | 0.11 | 0.65 | 444 of 997 | 32681 (-87), 32664 (-84), 32634 (-77) | 32767 (+87), 33956 (+85), 34449 (+70) |
| Kidney / nephrology | 60 | 2,210.2 | 0.11 | 0.66 | 358 of 997 | 32681 (-69), 32634 (-59), 32631 (-52) | 32157 (+68), 32181 (+65), 33867 (+64) |
| Diabetes & hormones | 60 | 1,119.4 | 0.06 | 0.74 | 430 of 997 | 32631 (-100), 32634 (-100), 32664 (-100) | 34138 (+81), 32344 (+80), 32336 (+79) |
| Cancer care / oncology | 90 | 3,174 | 0.15 | 0.46 | 603 of 997 | 32044 (-81), 32681 (-79), 32234 (-75) | 32336 (+72), 32361 (+70), 32344 (+66) |
| Arthritis / rheumatology | 60 | 690 | 0.04 | 0.71 | 458 of 997 | 32634 (-100), 32681 (-100), 32686 (-93) | 33430 (+95), 33438 (+91), 33476 (+90) |
| Brain & nerves / neurology | 60 | 4,005.8 | 0.22 | 0.75 | 412 of 997 | 32681 (-96), 32634 (-84), 32686 (-76) | 32336 (+72), 32344 (+71), 32361 (+57) |
| Ear, nose & throat | 60 | 1,193.2 | 0.07 | 0.69 | 454 of 997 | 32681 (-90), 32664 (-86), 32634 (-81) | 33430 (+68), 33956 (+66), 32410 (+65) |
| Urology | 60 | 1,669.8 | 0.07 | 0.63 | 500 of 997 | 32664 (-100), 32681 (-100), 32634 (-99) | 33956 (+85), 32361 (+79), 34139 (+78) |
| Foot & ankle / podiatry | 60 | 3,464 | 0.15 | 0.81 | 359 of 997 | 32681 (-51), 32634 (-47), 32664 (-47) | 34140 (+71), 33438 (+60), 33924 (+59) |
| Pain management | 60 | 2,327.8 | 0.09 | 0.69 | 465 of 997 | 32681 (-85), 32664 (-78), 32634 (-77) | 32616 (+76), 32336 (+73), 32410 (+71) |
| Plastic & reconstructive surgery | 90 | 1,596.6 | 0.07 | 0.70 | 573 of 997 | 33570 (-82), 33572 (-70), 33018 (-68) | 32616 (+80), 32410 (+57), 32336 (+53) |
| Speech & language therapy | 30 | 16,145 | 0.90 | 0.77 | 280 of 997 | 33924 (-75), 33855 (-62), 32321 (-49) | 32336 (+90), 32344 (+90), 32361 (+80) |
| Nutrition & dietitian | 30 | 4,651.4 | 0.33 | 0.82 | 181 of 997 | 32025 (-52), 33018 (-31), 32567 (-30) | 32621 (+93), 32696 (+91), 32667 (+87) |
| Acupuncture, massage & naturopathy | 30 | 11,704.4 | 0.52 | 0.78 | 351 of 997 | 33924 (-50), 32013 (-47), 32066 (-47) | 32087 (+84), 32667 (+78), 33149 (+75) |
| Urgent care & emergency | 30 | 8,500.2 | 0.47 | 0.63 | 341 of 997 | 32351 (-48), 32446 (-47), 32063 (-44) | 32667 (+94), 33857 (+87), 32336 (+86) |
| Imaging & lab | 60 | 11,418.2 | 0.49 | 0.71 | 399 of 997 | 32664 (-86), 32634 (-85), 32681 (-85) | 32361 (+67), 32336 (+61), 32344 (+61) |
| Pharmacy | 30 | 33,031.2 | 1.72 | 0.72 | 292 of 997 | 32025 (-39), 32359 (-37), 32803 (-36) | 32667 (+85), 32621 (+75), 32696 (+73) |
| Home health & in-home care | 30 | 24,085 | 1.61 | 0.79 | 195 of 997 | 32615 (-36), 32303 (-26), 33840 (-25) | 32038 (+85), 32621 (+79), 32696 (+79) |
| Nursing & assisted living | 60 | 11,808 | 0.39 | 0.64 | 400 of 997 | 32054 (-91), 32666 (-87), 32634 (-68) | 34739 (+99), 32767 (+70), 33924 (+62) |
| Medical equipment & supplies | 60 | 10,056.8 | 0.36 | 0.85 | 240 of 997 | 32664 (-47), 33332 (-39), 33896 (-36) | 32112 (+56), 33924 (+55), 33867 (+54) |
| Hearing & audiology | 60 | 4,074.2 | 0.19 | 0.71 | 421 of 997 | 32681 (-84), 32664 (-82), 32634 (-76) | 32767 (+81), 32625 (+77), 32410 (+66) |
| Behavior therapy (ABA) | 30 | 101,065.4 | 2.88 | 0.82 | 308 of 997 | 34431 (-81), 32433 (-45), 33444 (-33) | 32327 (+100), 32355 (+100), 33924 (+100) |
| Care coordination & community health | 30 | 14,130.4 | 1.63 | 0.80 | 96 of 997 | 34956 (-45), 32456 (-36), 32351 (-31) | 32696 (+95), 32667 (+93), 32621 (+88) |
| General surgery | 60 | 7,443 | 0.35 | 0.73 | 431 of 997 | 32664 (-78), 32681 (-75), 32192 (-67) | 32336 (+69), 32344 (+66), 32361 (+63) |
| Infectious disease | 90 | 1,091.8 | 0.05 | 0.55 | 607 of 997 | 32044 (-100), 32192 (-100), 32631 (-100) | 34228 (+66), 32616 (+60), 34446 (+60) |
| Genetics & genetic counseling | 90 | 444.2 | 0.03 | 0.59 | 604 of 997 | 32044 (-71), 32664 (-68), 32615 (-67) | 33493 (+67), 32809 (+66), 32827 (+66) |
| Hospice & palliative care | 60 | 706 | 0.09 | 0.76 | 102 of 997 | 32681 (-27), 32664 (-26), 32634 (-25) | 32336 (+47), 32344 (+45), 33647 (+40) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Florida in households with no vehicle: about 1,032,203 of 17,339,313 (6.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 12
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 1.00 | 6 of 997 | 32202 (+35), 32616 (+27), 33128 (+23) | 1.00 |
| Pediatrics (children) | 1.00 | 3 of 997 | 32202 (+39), 32616 (+23), 33128 (+19) | 1.00 |
| Women's health / OB-GYN | 0.99 | 3 of 997 | 32616 (+47), 32202 (+33), 32361 (+15) | 1.00 |
| Mental health & counseling | 1.00 | 2 of 997 | 32202 (+27), 32616 (+24), 33128 (+14) | 1.00 |
| Dental | 0.99 | 4 of 997 | 32202 (+30), 32616 (+21), 32970 (+17) | 1.00 |
| Eye care | 0.99 | 4 of 997 | 32202 (+33), 32616 (+21), 32970 (+21) | 1.00 |
| Chiropractic | 1.00 | 3 of 997 | 32202 (+28), 32616 (+22), 32970 (+18) | 1.00 |
| Physical & occupational therapy | 1.00 | 4 of 997 | 32202 (+37), 32616 (+24), 33128 (+18) | 1.00 |
| Orthopedics & sports injury | 0.99 | 3 of 997 | 32616 (+36), 32202 (+30), 33128 (+15) | 1.00 |
| Heart / cardiology | 0.99 | 10 of 997 | 32616 (+53), 32202 (+38), 33128 (+26) | 1.00 |
| Skin / dermatology | 0.99 | 9 of 997 | 32616 (+49), 32202 (+31), 33128 (+26) | 1.00 |
| Allergy & immunology | 0.99 | 3 of 997 | 32616 (+33), 32202 (+20), 33128 (+19) | 1.00 |
| Lung, breathing & sleep | 1.00 | 7 of 997 | 32202 (+42), 33128 (+24), 32616 (+19) | 1.00 |
| Digestive / gastroenterology | 0.99 | 6 of 997 | 32616 (+51), 32202 (+39), 33128 (+20) | 1.00 |
| Kidney / nephrology | 0.99 | 5 of 997 | 32616 (+49), 32202 (+36), 33128 (+21) | 1.00 |
| Diabetes & hormones | 0.99 | 6 of 997 | 32616 (+63), 32202 (+28), 33128 (+22) | 1.00 |
| Cancer care / oncology | 0.99 | 4 of 997 | 32616 (+46), 32202 (+35), 32206 (+16) | 1.00 |
| Arthritis / rheumatology | 0.99 | 3 of 997 | 32616 (+60), 32202 (+28), 33128 (+18) | 1.00 |
| Brain & nerves / neurology | 0.99 | 4 of 997 | 32616 (+50), 32202 (+41), 33128 (+17) | 1.00 |
| Ear, nose & throat | 0.99 | 3 of 997 | 32616 (+56), 32202 (+41), 32206 (+18) | 1.00 |
| Urology | 0.98 | 5 of 997 | 32616 (+60), 32202 (+36), 32970 (+25) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 8 of 997 | 32202 (+31), 33128 (+29), 32616 (+27) | 1.00 |
| Pain management | 0.99 | 5 of 997 | 32616 (+43), 32202 (+36), 33128 (+23) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 6 of 997 | 32616 (+35), 32202 (+32), 33128 (+24) | 1.00 |
| Speech & language therapy | 1.00 | 4 of 997 | 32202 (+27), 32616 (+18), 33128 (+17) | 1.00 |
| Nutrition & dietitian | 1.00 | 4 of 997 | 32202 (+36), 32616 (+28), 33128 (+16) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 6 of 997 | 32202 (+41), 33128 (+29), 32616 (+25) | 1.00 |
| Urgent care & emergency | 1.00 | 3 of 997 | 32202 (+30), 32616 (+25), 33128 (+16) | 1.00 |
| Imaging & lab | 0.99 | 11 of 997 | 32616 (+57), 32202 (+41), 33128 (+23) | 1.00 |
| Pharmacy | 0.99 | 5 of 997 | 32202 (+37), 32616 (+33), 33128 (+19) | 1.00 |
| Home health & in-home care | 1.00 | 3 of 997 | 32616 (+43), 32202 (+30), 33128 (+16) | 1.00 |
| Nursing & assisted living | 0.99 | 5 of 997 | 32202 (+36), 32970 (+27), 32361 (+24) | 1.00 |
| Medical equipment & supplies | 0.99 | 2 of 997 | 32616 (+32), 32202 (+26), 33605 (+14) | 1.00 |
| Hearing & audiology | 0.99 | 4 of 997 | 32616 (+42), 32202 (+32), 32970 (+17) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 3 of 997 | 32202 (+34), 32616 (+29), 33139 (+17) | 1.00 |
| Care coordination & community health | 1.00 | 2 of 997 | 32202 (+22), 32616 (+16), 33128 (+10) | 1.00 |
| General surgery | 0.99 | 7 of 997 | 32616 (+44), 32202 (+27), 33128 (+23) | 1.00 |
| Infectious disease | 0.99 | 5 of 997 | 32616 (+62), 32202 (+29), 33128 (+20) | 1.00 |
| Genetics & genetic counseling | 1.00 | 4 of 997 | 32616 (+43), 33128 (+16), 32202 (+15) | 1.00 |
| Hospice & palliative care | 0.99 | 1 of 997 | 32616 (+15), 32202 (+8), 33128 (+8) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 44 of 992 | 359,192 (2.1%) | 11/311 | 32/555 | 0/68 | 1/55 | 0/3 |
| Women's health / OB-GYN | 016 | 4 of 992 | 1,436 (0.0%) | 0/311 | 4/555 | 0/68 | 0/55 | 0/3 |
| Mental health & counseling: Psychiatry | 029 | 17 of 992 | 75,454 (0.4%) | 5/311 | 7/555 | 0/68 | 5/55 | 0/3 |
| Mental health & counseling: Clinical Psychology | 036 | 5 of 992 | 8,223 (0.0%) | 2/311 | 3/555 | 0/68 | 0/55 | 0/3 |
| Mental health & counseling: Clinical Social Work | 037 | 8 of 992 | 5,048 (0.0%) | 0/311 | 8/555 | 0/68 | 0/55 | 0/3 |
| Eye care | 023 | 15 of 992 | 33,455 (0.2%) | 2/311 | 13/555 | 0/68 | 0/55 | 0/3 |
| Chiropractic | 010 | 2 of 992 | 751 (0.0%) | 0/311 | 2/555 | 0/68 | 0/55 | 0/3 |
| Physical & occupational therapy | F049 | 3 of 992 | 1,050 (0.0%) | 0/311 | 3/555 | 0/68 | 0/55 | 0/3 |
| Orthopedics & sports injury | 025 | 23 of 992 | 61,942 (0.4%) | 2/311 | 21/555 | 0/68 | 0/55 | 0/3 |
| Heart / cardiology | 008 | 46 of 992 | 227,476 (1.3%) | 8/311 | 35/555 | 2/68 | 1/55 | 0/3 |
| Skin / dermatology | 011 | 23 of 992 | 99,046 (0.6%) | 6/311 | 13/555 | 0/68 | 4/55 | 0/3 |
| Allergy & immunology | 007 | 41 of 992 | 258,067 (1.5%) | 4/311 | 26/555 | 7/68 | 4/55 | 0/3 |
| Lung, breathing & sleep | 030 | 14 of 992 | 30,126 (0.2%) | 5/311 | 7/555 | 0/68 | 2/55 | 0/3 |
| Digestive / gastroenterology | 014 | 30 of 992 | 138,272 (0.8%) | 9/311 | 11/555 | 5/68 | 5/55 | 0/3 |
| Kidney / nephrology | 018 | 4 of 992 | 1,888 (0.0%) | 0/311 | 3/555 | 1/68 | 0/55 | 0/3 |
| Diabetes & hormones | 012 | 4 of 992 | 5,114 (0.0%) | 0/311 | 4/555 | 0/68 | 0/55 | 0/3 |
| Cancer care / oncology | 021 | 23 of 992 | 93,784 (0.5%) | 4/311 | 10/555 | 4/68 | 5/55 | 0/3 |
| Arthritis / rheumatology | 031 | 12 of 992 | 57,073 (0.3%) | 1/311 | 8/555 | 3/68 | 0/55 | 0/3 |
| Brain & nerves / neurology | 019 | 18 of 992 | 62,672 (0.4%) | 5/311 | 5/555 | 0/68 | 8/55 | 0/3 |
| Ear, nose & throat | 013 | 16 of 992 | 38,536 (0.2%) | 1/311 | 11/555 | 0/68 | 4/55 | 0/3 |
| Urology | 033 | 30 of 992 | 157,081 (0.9%) | 8/311 | 14/555 | 0/68 | 8/55 | 0/3 |
| Foot & ankle / podiatry | 028 | 9 of 992 | 28,971 (0.2%) | 2/311 | 7/555 | 0/68 | 0/55 | 0/3 |
| Plastic & reconstructive surgery | 027 | 5 of 992 | 7,745 (0.0%) | 1/311 | 4/555 | 0/68 | 0/55 | 0/3 |
| Speech & language therapy | F051 | 5 of 992 | 9,697 (0.1%) | 3/311 | 2/555 | 0/68 | 0/55 | 0/3 |
| Imaging & lab | F047 | 8 of 992 | 35,208 (0.2%) | 5/311 | 3/555 | 0/68 | 0/55 | 0/3 |
| Nursing & assisted living | F046 | 7 of 992 | 10,193 (0.1%) | 2/311 | 5/555 | 0/68 | 0/55 | 0/3 |
| General surgery | 015 | 27 of 992 | 66,910 (0.4%) | 3/311 | 20/555 | 2/68 | 2/55 | 0/3 |
| Infectious disease | 017 | 5 of 992 | 2,660 (0.0%) | 0/311 | 5/555 | 0/68 | 0/55 | 0/3 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 39880 rows (ZIP x specialty) stored in access_e2sfca for FL; market-score now uses drive-time access for these ZIPs.
