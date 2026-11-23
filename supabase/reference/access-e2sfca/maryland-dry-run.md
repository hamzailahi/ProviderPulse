# E2SFCA access dry run: Maryland

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,829; in Maryland: 470
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,829 x 2,829 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 886,102; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.06 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.65), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 8; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (21627, 21669, 23883)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 11697 | no | none | 0% | 2.44 | 100% | yes (1.74) |
| 15450 | no | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | no | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 17517 | no | 9.34 | 100% | 2.36 | 100% | yes (1.07) |
| 21627 | yes | 9.45 | 100% | 9.45 | 100% | no |
| 21669 | yes | 13.40 | 100% | 13.40 | 100% | no |
| 23883 | no | 8.45 | 100% | 8.45 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 109,079.8 | 4.30 | 0.69 | 167 of 468 | 20650 (-44), 21077 (-40), 20656 (-35) | 21555 (+80), 20742 (+68), 21013 (+67) |
| Pediatrics (children) | 30 | 32,442 | 1.11 | 0.75 | 164 of 468 | 21077 (-50), 20650 (-45), 21144 (-32) | 21814 (+100), 21840 (+100), 20742 (+99) |
| Women's health / OB-GYN | 60 | 14,703.4 | 0.53 | 0.64 | 222 of 468 | 21636 (-50), 21723 (-46), 21077 (-43) | 20742 (+79), 20606 (+76), 20626 (+76) |
| Mental health & counseling | 30 | 184,543.2 | 7.20 | 0.75 | 175 of 468 | 20650 (-40), 21077 (-36), 20656 (-35) | 21840 (+86), 21013 (+85), 21814 (+85) |
| Dental | 30 | 40,360.4 | 1.65 | 0.63 | 157 of 468 | 21227 (-32), 21077 (-31), 20636 (-28) | 21814 (+100), 21840 (+100), 21865 (+89) |
| Eye care | 30 | 15,029.8 | 0.62 | 0.69 | 163 of 468 | 21750 (-35), 21077 (-29), 21853 (-27) | 21056 (+66), 21013 (+62), 20765 (+60) |
| Chiropractic | 30 | 12,662.4 | 0.63 | 0.65 | 62 of 468 | 21872 (-20), 20818 (-17), 21061 (-16) | 20839 (+43), 20837 (+42), 21056 (+39) |
| Physical & occupational therapy | 30 | 78,721.2 | 2.70 | 0.67 | 192 of 468 | 20650 (-44), 20656 (-44), 21607 (-35) | 20609 (+93), 21111 (+85), 20618 (+83) |
| Orthopedics & sports injury | 60 | 10,450.8 | 0.39 | 0.41 | 225 of 468 | 21607 (-54), 21668 (-52), 21636 (-51) | 20687 (+83), 20680 (+77), 20609 (+72) |
| Heart / cardiology | 60 | 7,198.2 | 0.24 | 0.63 | 276 of 468 | 21629 (-73), 21643 (-69), 21660 (-68) | 20742 (+89), 20765 (+72), 21154 (+71) |
| Skin / dermatology | 60 | 2,468.2 | 0.09 | 0.53 | 261 of 468 | 20706 (-62), 20770 (-59), 20769 (-58) | 20742 (+84), 21056 (+81), 20693 (+72) |
| Allergy & immunology | 60 | 1,076.2 | 0.03 | 0.74 | 275 of 468 | 21797 (-91), 21723 (-81), 21771 (-64) | 20742 (+100), 20606 (+76), 20626 (+76) |
| Lung, breathing & sleep | 60 | 3,254.4 | 0.13 | 0.63 | 231 of 468 | 21797 (-51), 21659 (-48), 21105 (-47) | 20742 (+69), 20842 (+69), 21856 (+67) |
| Digestive / gastroenterology | 60 | 3,410.6 | 0.11 | 0.67 | 290 of 468 | 21797 (-71), 21105 (-67), 21629 (-64) | 20742 (+88), 20765 (+72), 20611 (+70) |
| Kidney / nephrology | 60 | 3,046.4 | 0.11 | 0.58 | 290 of 468 | 21659 (-63), 20763 (-61), 21643 (-61) | 20742 (+89), 20609 (+72), 20606 (+67) |
| Diabetes & hormones | 60 | 1,872.8 | 0.06 | 0.61 | 275 of 468 | 21531 (-70), 21539 (-67), 21797 (-62) | 20742 (+100), 21671 (+80), 21652 (+79) |
| Cancer care / oncology | 90 | 4,290.2 | 0.15 | 0.50 | 335 of 468 | 21797 (-72), 21723 (-68), 21105 (-67) | 20742 (+94), 21662 (+80), 21663 (+80) |
| Arthritis / rheumatology | 60 | 1,150.6 | 0.04 | 0.71 | 248 of 468 | 21643 (-95), 21641 (-88), 21659 (-83) | 20742 (+99), 20658 (+90), 20765 (+71) |
| Brain & nerves / neurology | 60 | 5,379 | 0.22 | 0.70 | 254 of 468 | 21077 (-55), 20769 (-49), 20708 (-48) | 20742 (+82), 21154 (+61), 21798 (+51) |
| Ear, nose & throat | 60 | 1,666.4 | 0.07 | 0.56 | 286 of 468 | 21105 (-53), 21046 (-50), 21077 (-48) | 20606 (+82), 20626 (+82), 21056 (+82) |
| Urology | 60 | 1,988.6 | 0.07 | 0.54 | 289 of 468 | 21536 (-81), 21797 (-71), 21105 (-69) | 21056 (+80), 20765 (+71), 21037 (+69) |
| Foot & ankle / podiatry | 60 | 5,079.2 | 0.15 | 0.48 | 259 of 468 | 21659 (-63), 21643 (-62), 21853 (-62) | 20611 (+74), 21610 (+74), 21678 (+67) |
| Pain management | 60 | 2,346.4 | 0.09 | 0.43 | 314 of 468 | 21536 (-100), 21766 (-80), 21607 (-77) | 20660 (+79), 20611 (+70), 21610 (+70) |
| Plastic & reconstructive surgery | 90 | 1,639.6 | 0.07 | 0.63 | 303 of 468 | 20769 (-63), 20720 (-62), 20871 (-60) | 21662 (+85), 21663 (+84), 21653 (+81) |
| Speech & language therapy | 30 | 23,722.6 | 0.90 | 0.71 | 182 of 468 | 21607 (-42), 20650 (-33), 20818 (-31) | 21013 (+81), 21056 (+79), 20609 (+75) |
| Nutrition & dietitian | 30 | 8,520 | 0.33 | 0.73 | 172 of 468 | 21851 (-42), 20676 (-35), 20650 (-33) | 20742 (+73), 21555 (+73), 21013 (+61) |
| Acupuncture, massage & naturopathy | 30 | 8,204 | 0.52 | 0.82 | 139 of 468 | 21227 (-39), 21077 (-32), 21061 (-28) | 21737 (+62), 21036 (+61), 21056 (+60) |
| Urgent care & emergency | 30 | 10,955 | 0.47 | 0.67 | 149 of 468 | 20650 (-58), 20656 (-52), 21077 (-32) | 20609 (+96), 20618 (+84), 20606 (+78) |
| Imaging & lab | 60 | 11,673.8 | 0.49 | 0.61 | 212 of 468 | 21636 (-58), 21607 (-55), 21629 (-54) | 20742 (+62), 21555 (+47), 21610 (+47) |
| Pharmacy | 30 | 43,743.4 | 1.72 | 0.65 | 149 of 468 | 21227 (-33), 21077 (-31), 21607 (-24) | 21555 (+62), 21814 (+53), 21840 (+53) |
| Home health & in-home care | 30 | 60,196.6 | 1.61 | 0.86 | 73 of 468 | 21795 (-66), 20850 (-62), 20854 (-40) | 21766 (+98), 21711 (+97), 20742 (+94) |
| Nursing & assisted living | 60 | 7,545 | 0.39 | 0.70 | 191 of 468 | 21668 (-56), 21607 (-50), 21651 (-50) | 20742 (+94), 21610 (+69), 21867 (+56) |
| Medical equipment & supplies | 60 | 8,594.2 | 0.36 | 0.61 | 183 of 468 | 21607 (-41), 21539 (-40), 21651 (-39) | 20640 (+58), 21626 (+57), 21663 (+53) |
| Hearing & audiology | 60 | 4,679 | 0.19 | 0.47 | 254 of 468 | 21636 (-65), 21643 (-61), 21659 (-60) | 21662 (+64), 21013 (+63), 21663 (+63) |
| Behavior therapy (ABA) | 30 | 54,552 | 2.88 | 0.90 | 100 of 468 | 20770 (-46), 21788 (-45), 20740 (-43) | 20662 (+83), 21219 (+73), 20862 (+68) |
| Care coordination & community health | 30 | 32,548.2 | 1.63 | 0.79 | 125 of 468 | 21851 (-76), 21804 (-52), 20650 (-43) | 20742 (+99), 20609 (+59), 21840 (+59) |
| General surgery | 60 | 9,586.8 | 0.35 | 0.64 | 264 of 468 | 21629 (-74), 21660 (-70), 21105 (-68) | 20742 (+77), 20765 (+72), 21154 (+66) |
| Infectious disease | 90 | 1,646.4 | 0.05 | 0.69 | 293 of 468 | 21723 (-100), 21797 (-100), 20872 (-90) | 20742 (+100), 21856 (+78), 21837 (+73) |
| Genetics & genetic counseling | 90 | 1,059.6 | 0.03 | 0.69 | 296 of 468 | 20720 (-91), 20769 (-90), 20715 (-85) | 20742 (+100), 21652 (+92), 21612 (+91) |
| Hospice & palliative care | 60 | 1,357.6 | 0.09 | 0.60 | 147 of 468 | 21607 (-46), 21636 (-44), 21660 (-43) | 21662 (+67), 21663 (+67), 21653 (+63) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Maryland in households with no vehicle: about 411,643 of 4,814,934 (8.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 8
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 14 of 468 | 20660 (+50), 20742 (+49), 20899 (+38) | 1.00 |
| Pediatrics (children) | 0.98 | 8 of 468 | 20742 (+78), 20899 (+49), 20660 (+38) | 1.00 |
| Women's health / OB-GYN | 0.97 | 11 of 468 | 20742 (+77), 20660 (+47), 20899 (+45) | 1.00 |
| Mental health & counseling | 0.98 | 4 of 468 | 20742 (+57), 20660 (+46), 20899 (+43) | 1.00 |
| Dental | 0.97 | 7 of 468 | 20899 (+53), 20660 (+51), 20742 (+50) | 1.00 |
| Eye care | 0.98 | 7 of 468 | 20742 (+36), 20899 (+36), 20660 (+29) | 1.00 |
| Chiropractic | 0.98 | 2 of 468 | 20899 (+22), 20742 (+20), 20660 (+14) | 1.00 |
| Physical & occupational therapy | 0.98 | 12 of 468 | 20660 (+63), 20742 (+43), 20899 (+41) | 1.00 |
| Orthopedics & sports injury | 0.96 | 11 of 468 | 20742 (+51), 20660 (+45), 20899 (+32) | 1.00 |
| Heart / cardiology | 0.97 | 13 of 468 | 20742 (+72), 20899 (+39), 21201 (+32) | 1.00 |
| Skin / dermatology | 0.97 | 9 of 468 | 20742 (+79), 20899 (+53), 20660 (+48) | 1.00 |
| Allergy & immunology | 0.98 | 12 of 468 | 20742 (+100), 20899 (+58), 20660 (+43) | 1.00 |
| Lung, breathing & sleep | 0.97 | 11 of 468 | 20742 (+61), 20899 (+35), 21201 (+23) | 1.00 |
| Digestive / gastroenterology | 0.97 | 13 of 468 | 20742 (+78), 20899 (+47), 21201 (+31) | 1.00 |
| Kidney / nephrology | 0.97 | 13 of 468 | 20742 (+75), 20660 (+46), 20899 (+37) | 1.00 |
| Diabetes & hormones | 0.97 | 13 of 468 | 20742 (+90), 20899 (+54), 20660 (+40) | 1.00 |
| Cancer care / oncology | 0.97 | 8 of 468 | 20742 (+72), 20899 (+46), 21201 (+25) | 1.00 |
| Arthritis / rheumatology | 0.98 | 12 of 468 | 20742 (+85), 20899 (+48), 21201 (+32) | 1.00 |
| Brain & nerves / neurology | 0.97 | 11 of 468 | 20742 (+68), 20899 (+40), 21201 (+26) | 1.00 |
| Ear, nose & throat | 0.96 | 9 of 468 | 20742 (+61), 20899 (+38), 20660 (+36) | 1.00 |
| Urology | 0.97 | 13 of 468 | 20742 (+63), 21542 (+37), 20899 (+36) | 1.00 |
| Foot & ankle / podiatry | 0.96 | 12 of 468 | 20742 (+65), 20660 (+42), 20899 (+41) | 1.00 |
| Pain management | 0.95 | 13 of 468 | 20742 (+68), 20660 (+67), 20899 (+48) | 1.00 |
| Plastic & reconstructive surgery | 0.97 | 9 of 468 | 20742 (+73), 20899 (+47), 21201 (+27) | 1.00 |
| Speech & language therapy | 0.98 | 11 of 468 | 20660 (+56), 20742 (+47), 20899 (+47) | 1.00 |
| Nutrition & dietitian | 0.98 | 9 of 468 | 20742 (+55), 20899 (+41), 20660 (+28) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 7 of 468 | 20899 (+51), 20742 (+40), 21201 (+24) | 1.00 |
| Urgent care & emergency | 0.98 | 11 of 468 | 20660 (+60), 20742 (+38), 20899 (+30) | 1.00 |
| Imaging & lab | 0.96 | 11 of 468 | 20742 (+59), 20899 (+35), 21542 (+26) | 1.00 |
| Pharmacy | 0.98 | 10 of 468 | 20742 (+40), 20899 (+35), 20660 (+34) | 1.00 |
| Home health & in-home care | 0.99 | 6 of 468 | 20742 (+94), 20899 (+33), 21542 (+29) | 1.00 |
| Nursing & assisted living | 0.97 | 10 of 468 | 20742 (+64), 21542 (+33), 20899 (+30) | 1.00 |
| Medical equipment & supplies | 0.97 | 10 of 468 | 20742 (+54), 20899 (+30), 21201 (+26) | 1.00 |
| Hearing & audiology | 0.96 | 10 of 468 | 20742 (+58), 20660 (+36), 20899 (+36) | 1.00 |
| Behavior therapy (ABA) | 0.98 | 5 of 468 | 20742 (+100), 20899 (+26), 20660 (+24) | 1.00 |
| Care coordination & community health | 0.98 | 9 of 468 | 20742 (+99), 20660 (+36), 20899 (+30) | 1.00 |
| General surgery | 0.97 | 13 of 468 | 20742 (+71), 20899 (+38), 21201 (+31) | 1.00 |
| Infectious disease | 0.98 | 12 of 468 | 20742 (+100), 20899 (+64), 21216 (+23) | 1.00 |
| Genetics & genetic counseling | 0.97 | 9 of 468 | 20742 (+88), 20899 (+48), 21201 (+24) | 1.00 |
| Hospice & palliative care | 0.98 | 7 of 468 | 20742 (+28), 20899 (+18), 20660 (+17) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 25 of 470 | 84,039 (1.7%) | 4/103 | 18/301 | 3/58 | 0/8 |  |
| Women's health / OB-GYN | 016 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |
| Mental health & counseling: Psychiatry | 029 | 3 of 470 | 238 (0.0%) | 0/103 | 1/301 | 2/58 | 0/8 |  |
| Mental health & counseling: Clinical Psychology | 036 | 3 of 470 | 243 (0.0%) | 0/103 | 0/301 | 3/58 | 0/8 |  |
| Mental health & counseling: Clinical Social Work | 037 | 6 of 470 | 2,404 (0.0%) | 0/103 | 2/301 | 4/58 | 0/8 |  |
| Eye care | 023 | 8 of 470 | 3,476 (0.1%) | 0/103 | 5/301 | 3/58 | 0/8 |  |
| Chiropractic | 010 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |
| Physical & occupational therapy | F049 | 2 of 470 | 293 (0.0%) | 0/103 | 0/301 | 2/58 | 0/8 |  |
| Orthopedics & sports injury | 025 | 8 of 470 | 2,480 (0.1%) | 0/103 | 5/301 | 3/58 | 0/8 |  |
| Heart / cardiology | 008 | 18 of 470 | 14,650 (0.3%) | 1/103 | 12/301 | 5/58 | 0/8 |  |
| Skin / dermatology | 011 | 5 of 470 | 6,890 (0.1%) | 3/103 | 0/301 | 2/58 | 0/8 |  |
| Allergy & immunology | 007 | 11 of 470 | 4,859 (0.1%) | 0/103 | 5/301 | 6/58 | 0/8 |  |
| Lung, breathing & sleep | 030 | 8 of 470 | 8,280 (0.2%) | 4/103 | 1/301 | 3/58 | 0/8 |  |
| Digestive / gastroenterology | 014 | 7 of 470 | 7,693 (0.2%) | 4/103 | 0/301 | 3/58 | 0/8 |  |
| Kidney / nephrology | 018 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |
| Diabetes & hormones | 012 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |
| Cancer care / oncology | 021 | 12 of 470 | 10,860 (0.2%) | 3/103 | 3/301 | 6/58 | 0/8 |  |
| Arthritis / rheumatology | 031 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |
| Brain & nerves / neurology | 019 | 10 of 470 | 11,127 (0.2%) | 3/103 | 0/301 | 7/58 | 0/8 |  |
| Ear, nose & throat | 013 | 3 of 470 | 3,095 (0.1%) | 0/103 | 2/301 | 1/58 | 0/8 |  |
| Urology | 033 | 18 of 470 | 53,200 (1.1%) | 6/103 | 7/301 | 5/58 | 0/8 |  |
| Foot & ankle / podiatry | 028 | 2 of 470 | 171 (0.0%) | 0/103 | 0/301 | 2/58 | 0/8 |  |
| Plastic & reconstructive surgery | 027 | 9 of 470 | 4,787 (0.1%) | 0/103 | 9/301 | 0/58 | 0/8 |  |
| Speech & language therapy | F051 | 1 of 470 | 687 (0.0%) | 0/103 | 1/301 | 0/58 | 0/8 |  |
| Imaging & lab | F047 | 3 of 470 | 6,719 (0.1%) | 3/103 | 0/301 | 0/58 | 0/8 |  |
| Nursing & assisted living | F046 | 1 of 470 | 156 (0.0%) | 1/103 | 0/301 | 0/58 | 0/8 |  |
| General surgery | 015 | 15 of 470 | 8,439 (0.2%) | 0/103 | 12/301 | 3/58 | 0/8 |  |
| Infectious disease | 017 | 0 of 470 | 0 (0.0%) | 0/103 | 0/301 | 0/58 | 0/8 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 18800 rows (ZIP x specialty) stored in access_e2sfca for MD; market-score now uses drive-time access for these ZIPs.
