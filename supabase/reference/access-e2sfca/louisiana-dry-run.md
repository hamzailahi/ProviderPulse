# E2SFCA access dry run: Louisiana

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 1,252; in Louisiana: 527
- Drive times: OSRM on OpenStreetMap roads (car profile), 1,252 x 1,252 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 212,247.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.44 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.09), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 4; re-anchored: 2; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (70712, 71316)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 36542 | no | none | 0% | 2.40 | 100% | yes (1.83) |
| 70712 | yes | 6.39 | 100% | 6.39 | 100% | no |
| 70749 | yes | 8.31 | 100% | 2.22 | 100% | yes (1.69) |
| 71316 | yes | 6.14 | 100% | 6.14 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 31,091.8 | 4.30 | 0.55 | 216 of 525 | 70643 (-74), 70631 (-42), 70441 (-34) | 71424 (+94), 71430 (+87), 71264 (+76) |
| Pediatrics (children) | 30 | 5,815.2 | 1.11 | 0.72 | 141 of 525 | 70775 (-43), 70726 (-31), 70722 (-27) | 70031 (+80), 71424 (+77), 70070 (+75) |
| Women's health / OB-GYN | 60 | 3,071.6 | 0.53 | 0.76 | 177 of 525 | 71004 (-45), 70080 (-44), 70070 (-42) | 71424 (+74), 71430 (+65), 71409 (+59) |
| Mental health & counseling | 30 | 37,631 | 7.20 | 0.68 | 190 of 525 | 70722 (-60), 70643 (-32), 70427 (-30) | 71424 (+85), 71264 (+80), 71238 (+69) |
| Dental | 30 | 8,651 | 1.65 | 0.60 | 136 of 525 | 71079 (-77), 70747 (-59), 71358 (-59) | 70656 (+59), 71474 (+58), 70431 (+55) |
| Eye care | 30 | 3,498.8 | 0.62 | 0.66 | 153 of 525 | 71253 (-47), 71463 (-21), 70427 (-19) | 71424 (+85), 71466 (+64), 71409 (+63) |
| Chiropractic | 30 | 2,754.6 | 0.63 | 0.59 | 144 of 525 | 71342 (-44), 70775 (-35), 70648 (-29) | 70645 (+71), 70657 (+70), 70431 (+68) |
| Physical & occupational therapy | 30 | 14,329.8 | 2.70 | 0.60 | 171 of 525 | 71418 (-49), 71263 (-26), 70526 (-19) | 70780 (+55), 70431 (+54), 71424 (+53) |
| Orthopedics & sports injury | 60 | 2,558.8 | 0.39 | 0.73 | 221 of 525 | 71416 (-69), 71434 (-59), 71426 (-55) | 71404 (+78), 70764 (+69), 70462 (+65) |
| Heart / cardiology | 60 | 1,685.4 | 0.24 | 0.74 | 254 of 525 | 71033 (-64), 70070 (-59), 71007 (-57) | 71424 (+72), 70631 (+67), 71264 (+65) |
| Skin / dermatology | 60 | 575.2 | 0.09 | 0.78 | 226 of 525 | 70080 (-80), 70129 (-74), 70039 (-72) | 70736 (+63), 70148 (+61), 70082 (+60) |
| Allergy & immunology | 60 | 204.6 | 0.03 | 0.78 | 174 of 525 | 70070 (-85), 70080 (-83), 70039 (-80) | 71264 (+73), 71032 (+68), 70736 (+61) |
| Lung, breathing & sleep | 60 | 863 | 0.13 | 0.76 | 195 of 525 | 71004 (-72), 71033 (-62), 71078 (-58) | 71424 (+68), 71264 (+67), 70437 (+64) |
| Digestive / gastroenterology | 60 | 668.2 | 0.11 | 0.76 | 248 of 525 | 70080 (-68), 70039 (-64), 71004 (-62) | 71424 (+74), 71430 (+61), 70578 (+59) |
| Kidney / nephrology | 60 | 1,027.4 | 0.11 | 0.63 | 243 of 525 | 71416 (-84), 71033 (-72), 71434 (-72) | 71358 (+86), 70542 (+83), 71404 (+81) |
| Diabetes & hormones | 60 | 333.6 | 0.06 | 0.77 | 169 of 525 | 70080 (-75), 70070 (-71), 70039 (-68) | 70710 (+64), 70780 (+61), 70776 (+60) |
| Cancer care / oncology | 90 | 826.2 | 0.15 | 0.48 | 319 of 525 | 70052 (-57), 70047 (-56), 70080 (-56) | 71424 (+81), 71430 (+76), 71409 (+68) |
| Arthritis / rheumatology | 60 | 218.4 | 0.04 | 0.76 | 217 of 525 | 71033 (-69), 71007 (-62), 70668 (-60) | 71424 (+71), 71001 (+67), 71222 (+65) |
| Brain & nerves / neurology | 60 | 1,247 | 0.22 | 0.77 | 185 of 525 | 70080 (-61), 70039 (-57), 70070 (-53) | 70551 (+71), 70437 (+65), 70464 (+62) |
| Ear, nose & throat | 60 | 578.2 | 0.07 | 0.74 | 274 of 525 | 71004 (-98), 70080 (-90), 70726 (-78) | 71264 (+85), 71354 (+75), 71358 (+72) |
| Urology | 60 | 535.4 | 0.07 | 0.72 | 253 of 525 | 71033 (-81), 70080 (-76), 71004 (-70) | 71264 (+76), 71424 (+75), 70462 (+72) |
| Foot & ankle / podiatry | 60 | 615.2 | 0.15 | 0.69 | 114 of 525 | 70080 (-38), 70030 (-31), 70375 (-31) | 70759 (+64), 70760 (+62), 70755 (+58) |
| Pain management | 60 | 554.6 | 0.09 | 0.77 | 233 of 525 | 70128 (-63), 70080 (-62), 70129 (-61) | 71358 (+74), 70082 (+66), 71345 (+65) |
| Plastic & reconstructive surgery | 90 | 436.8 | 0.07 | 0.62 | 272 of 525 | 70079 (-80), 70084 (-78), 70068 (-77) | 70148 (+69), 70519 (+58), 70836 (+56) |
| Speech & language therapy | 30 | 6,591 | 0.90 | 0.65 | 230 of 525 | 71434 (-65), 70438 (-36), 71008 (-32) | 71264 (+100), 71238 (+97), 71229 (+83) |
| Nutrition & dietitian | 30 | 1,683.6 | 0.33 | 0.70 | 181 of 525 | 71048 (-86), 70427 (-53), 71465 (-52) | 70656 (+81), 71238 (+76), 70780 (+73) |
| Acupuncture, massage & naturopathy | 30 | 1,407.6 | 0.52 | 0.72 | 85 of 525 | 71416 (-89), 71452 (-69), 71434 (-37) | 71474 (+79), 70575 (+64), 70639 (+59) |
| Urgent care & emergency | 30 | 3,791 | 0.47 | 0.49 | 271 of 525 | 70083 (-77), 70427 (-58), 71075 (-57) | 71424 (+100), 71430 (+100), 71439 (+96) |
| Imaging & lab | 60 | 3,519.8 | 0.49 | 0.78 | 209 of 525 | 71004 (-49), 70080 (-45), 70070 (-41) | 71264 (+66), 71424 (+65), 70542 (+61) |
| Pharmacy | 30 | 13,092.8 | 1.72 | 0.51 | 265 of 525 | 71366 (-50), 71449 (-41), 71357 (-30) | 71424 (+89), 71323 (+82), 71423 (+78) |
| Home health & in-home care | 30 | 8,133.6 | 1.61 | 0.58 | 190 of 525 | 70083 (-60), 71353 (-54), 71282 (-37) | 71264 (+100), 71424 (+98), 71357 (+84) |
| Nursing & assisted living | 60 | 2,830.2 | 0.39 | 0.59 | 230 of 525 | 71209 (-54), 71434 (-54), 71201 (-43) | 71472 (+97), 71260 (+76), 71223 (+68) |
| Medical equipment & supplies | 60 | 3,305.2 | 0.36 | 0.73 | 220 of 525 | 70526 (-52), 70772 (-48), 70080 (-45) | 71250 (+73), 71264 (+71), 71358 (+70) |
| Hearing & audiology | 60 | 1,305.8 | 0.19 | 0.76 | 215 of 525 | 71325 (-54), 70080 (-50), 71330 (-50) | 71424 (+67), 70656 (+57), 70082 (+55) |
| Behavior therapy (ABA) | 30 | 8,873.6 | 2.88 | 0.77 | 82 of 525 | 70114 (-43), 70126 (-43), 70053 (-42) | 70031 (+99), 70575 (+63), 70148 (+62) |
| Care coordination & community health | 30 | 15,937.6 | 1.63 | 0.60 | 251 of 525 | 70643 (-94), 70427 (-68), 71241 (-57) | 70645 (+100), 70657 (+100), 71008 (+100) |
| General surgery | 60 | 2,400.2 | 0.35 | 0.71 | 212 of 525 | 71033 (-61), 71325 (-59), 71004 (-54) | 71424 (+70), 70431 (+62), 70437 (+57) |
| Infectious disease | 90 | 298.2 | 0.05 | 0.61 | 244 of 525 | 70047 (-82), 70079 (-75), 70070 (-72) | 70710 (+69), 70148 (+59), 70437 (+55) |
| Genetics & genetic counseling | 90 | 99.8 | 0.03 | 0.63 | 158 of 525 | 70079 (-60), 70084 (-59), 70068 (-58) | 70148 (+68), 70710 (+60), 70767 (+57) |
| Hospice & palliative care | 60 | 920.4 | 0.09 | 0.55 | 272 of 525 | 70791 (-86), 70772 (-81), 70770 (-76) | 71366 (+93), 70086 (+86), 70782 (+85) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Louisiana in households with no vehicle: about 301,531 of 3,570,248 (8.4%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 12
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 6 of 525 | 71101 (+25), 70112 (+23), 70148 (+22) | 1.00 |
| Pediatrics (children) | 1.00 | 7 of 525 | 70112 (+31), 70148 (+30), 70113 (+25) | 1.00 |
| Women's health / OB-GYN | 0.99 | 5 of 525 | 71472 (+33), 70148 (+28), 70112 (+19) | 1.00 |
| Mental health & counseling | 1.00 | 8 of 525 | 70112 (+28), 70148 (+28), 70836 (+22) | 1.00 |
| Dental | 1.00 | 5 of 525 | 70112 (+21), 70148 (+20), 70836 (+18) | 1.00 |
| Eye care | 1.00 | 5 of 525 | 70112 (+20), 71101 (+19), 70148 (+17) | 1.00 |
| Chiropractic | 1.00 | 0 of 525 | 70112 (+14), 70148 (+13), 71101 (+12) | 1.00 |
| Physical & occupational therapy | 1.00 | 4 of 525 | 70836 (+20), 71101 (+17), 70112 (+15) | 1.00 |
| Orthopedics & sports injury | 0.99 | 5 of 525 | 71472 (+36), 70148 (+32), 70112 (+23) | 1.00 |
| Heart / cardiology | 0.99 | 4 of 525 | 71472 (+40), 70148 (+39), 70112 (+22) | 1.00 |
| Skin / dermatology | 0.99 | 5 of 525 | 70148 (+43), 70112 (+27), 71472 (+22) | 1.00 |
| Allergy & immunology | 1.00 | 4 of 525 | 70148 (+50), 70112 (+23), 71101 (+18) | 1.00 |
| Lung, breathing & sleep | 0.99 | 4 of 525 | 70148 (+35), 71472 (+31), 70112 (+20) | 1.00 |
| Digestive / gastroenterology | 0.99 | 6 of 525 | 70148 (+39), 71472 (+34), 70112 (+24) | 1.00 |
| Kidney / nephrology | 0.99 | 5 of 525 | 70148 (+49), 71472 (+42), 70112 (+22) | 1.00 |
| Diabetes & hormones | 1.00 | 4 of 525 | 70148 (+36), 70112 (+20), 70113 (+16) | 1.00 |
| Cancer care / oncology | 0.99 | 3 of 525 | 71472 (+28), 70148 (+27), 70112 (+15) | 1.00 |
| Arthritis / rheumatology | 0.99 | 3 of 525 | 70148 (+33), 71472 (+27), 70112 (+20) | 1.00 |
| Brain & nerves / neurology | 0.99 | 4 of 525 | 70148 (+35), 71472 (+22), 70112 (+21) | 1.00 |
| Ear, nose & throat | 0.99 | 6 of 525 | 71472 (+78), 70148 (+46), 70112 (+27) | 1.00 |
| Urology | 0.99 | 5 of 525 | 71472 (+45), 70148 (+32), 70112 (+19) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 3 of 525 | 71472 (+30), 70148 (+22), 70112 (+17) | 1.00 |
| Pain management | 0.99 | 6 of 525 | 70148 (+39), 70112 (+29), 71472 (+25) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 2 of 525 | 70148 (+35), 70112 (+17), 70836 (+14) | 1.00 |
| Speech & language therapy | 0.99 | 8 of 525 | 70836 (+31), 71101 (+24), 70112 (+23) | 1.00 |
| Nutrition & dietitian | 1.00 | 5 of 525 | 70836 (+24), 70148 (+20), 70112 (+19) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 2 of 525 | 70112 (+18), 70148 (+18), 70113 (+13) | 1.00 |
| Urgent care & emergency | 1.00 | 7 of 525 | 70148 (+33), 70836 (+23), 70112 (+22) | 1.00 |
| Imaging & lab | 0.99 | 5 of 525 | 71472 (+35), 70148 (+34), 70112 (+19) | 1.00 |
| Pharmacy | 0.99 | 8 of 525 | 70112 (+27), 70148 (+24), 71101 (+23) | 1.00 |
| Home health & in-home care | 1.00 | 5 of 525 | 70836 (+22), 71101 (+18), 70112 (+17) | 1.00 |
| Nursing & assisted living | 0.98 | 6 of 525 | 71472 (+96), 71424 (+21), 70148 (+18) | 1.00 |
| Medical equipment & supplies | 0.98 | 8 of 525 | 71472 (+51), 70148 (+32), 70112 (+24) | 1.00 |
| Hearing & audiology | 0.98 | 4 of 525 | 71472 (+56), 70148 (+29), 70112 (+20) | 1.00 |
| Behavior therapy (ABA) | 1.00 | 5 of 525 | 70148 (+32), 70112 (+30), 70836 (+27) | 1.00 |
| Care coordination & community health | 1.00 | 3 of 525 | 70148 (+48), 70514 (+22), 71245 (+20) | 1.00 |
| General surgery | 0.99 | 4 of 525 | 71472 (+44), 70148 (+32), 70112 (+20) | 1.00 |
| Infectious disease | 1.00 | 2 of 525 | 70148 (+45), 70112 (+15), 70127 (+12) | 1.00 |
| Genetics & genetic counseling | 1.00 | 1 of 525 | 70148 (+26), 70112 (+13), 70836 (+11) | 1.00 |
| Hospice & palliative care | 0.98 | 11 of 525 | 71472 (+66), 70148 (+33), 70112 (+23) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 13 of 523 | 15,772 (0.4%) |  | 9/185 | 1/131 | 3/200 | 0/7 |
| Women's health / OB-GYN | 016 | 2 of 523 | 964 (0.0%) |  | 1/185 | 0/131 | 1/200 | 0/7 |
| Mental health & counseling: Psychiatry | 029 | 6 of 523 | 3,173 (0.1%) |  | 3/185 | 0/131 | 3/200 | 0/7 |
| Mental health & counseling: Clinical Psychology | 036 | 6 of 523 | 8,291 (0.2%) |  | 2/185 | 0/131 | 4/200 | 0/7 |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 523 | 2,958 (0.1%) |  | 4/185 | 0/131 | 2/200 | 0/7 |
| Eye care | 023 | 6 of 523 | 4,028 (0.1%) |  | 4/185 | 0/131 | 2/200 | 0/7 |
| Chiropractic | 010 | 1 of 523 | 820 (0.0%) |  | 1/185 | 0/131 | 0/200 | 0/7 |
| Physical & occupational therapy | F049 | 3 of 523 | 1,021 (0.0%) |  | 1/185 | 0/131 | 2/200 | 0/7 |
| Orthopedics & sports injury | 025 | 15 of 523 | 15,872 (0.4%) |  | 10/185 | 1/131 | 4/200 | 0/7 |
| Heart / cardiology | 008 | 27 of 523 | 39,860 (1.1%) |  | 16/185 | 5/131 | 6/200 | 0/7 |
| Skin / dermatology | 011 | 28 of 523 | 41,197 (1.2%) |  | 3/185 | 5/131 | 20/200 | 0/7 |
| Allergy & immunology | 007 | 15 of 523 | 12,915 (0.4%) |  | 4/185 | 0/131 | 11/200 | 0/7 |
| Lung, breathing & sleep | 030 | 9 of 523 | 11,826 (0.3%) |  | 2/185 | 0/131 | 7/200 | 0/7 |
| Digestive / gastroenterology | 014 | 27 of 523 | 45,133 (1.3%) |  | 6/185 | 1/131 | 20/200 | 0/7 |
| Kidney / nephrology | 018 | 2 of 523 | 964 (0.0%) |  | 1/185 | 0/131 | 1/200 | 0/7 |
| Diabetes & hormones | 012 | 4 of 523 | 2,224 (0.1%) |  | 1/185 | 0/131 | 3/200 | 0/7 |
| Cancer care / oncology | 021 | 10 of 523 | 11,543 (0.3%) |  | 3/185 | 1/131 | 6/200 | 0/7 |
| Arthritis / rheumatology | 031 | 4 of 523 | 2,224 (0.1%) |  | 1/185 | 0/131 | 3/200 | 0/7 |
| Brain & nerves / neurology | 019 | 24 of 523 | 40,567 (1.1%) |  | 3/185 | 5/131 | 16/200 | 0/7 |
| Ear, nose & throat | 013 | 5 of 523 | 2,033 (0.1%) |  | 3/185 | 0/131 | 2/200 | 0/7 |
| Urology | 033 | 22 of 523 | 29,306 (0.8%) |  | 3/185 | 5/131 | 14/200 | 0/7 |
| Foot & ankle / podiatry | 028 | 9 of 523 | 10,815 (0.3%) |  | 3/185 | 0/131 | 6/200 | 0/7 |
| Plastic & reconstructive surgery | 027 | 4 of 523 | 2,224 (0.1%) |  | 1/185 | 0/131 | 3/200 | 0/7 |
| Speech & language therapy | F051 | 2 of 523 | 964 (0.0%) |  | 1/185 | 0/131 | 1/200 | 0/7 |
| Imaging & lab | F047 | 6 of 523 | 4,371 (0.1%) |  | 1/185 | 0/131 | 5/200 | 0/7 |
| Nursing & assisted living | F046 | 3 of 523 | 1,021 (0.0%) |  | 1/185 | 0/131 | 2/200 | 0/7 |
| General surgery | 015 | 20 of 523 | 30,832 (0.9%) |  | 15/185 | 0/131 | 5/200 | 0/7 |
| Infectious disease | 017 | 2 of 523 | 940 (0.0%) |  | 1/185 | 0/131 | 1/200 | 0/7 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 21080 rows (ZIP x specialty) stored in access_e2sfca for LA; market-score now uses drive-time access for these ZIPs.
