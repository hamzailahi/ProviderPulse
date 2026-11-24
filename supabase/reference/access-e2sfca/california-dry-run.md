# E2SFCA access dry run: California

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,101; in California: 1,771
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,101 x 2,101 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,291,288.81; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.73 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.83), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 2 (93526, 96031)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 86021 | no | 8.52 | 100% | 1.77 | 100% | yes (1.81) |
| 93526 | yes | 7.47 | 100% | 7.47 | 100% | no |
| 96031 | yes | 7.63 | 100% | 7.63 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 120,477.803 | 4.30 | 0.57 | 532 of 1769 | 95552 (-84), 95903 (-70), 92384 (-65) | 93541 (+100), 94020 (+100), 94021 (+100) |
| Pediatrics (children) | 30 | 34,648.6 | 1.11 | 0.68 | 611 of 1769 | 93605 (-68), 95014 (-44), 95546 (-44) | 94020 (+100), 94021 (+100), 95715 (+100) |
| Women's health / OB-GYN | 60 | 18,398.2 | 0.53 | 0.64 | 702 of 1769 | 95979 (-94), 94541 (-47), 94539 (-43) | 95910 (+100), 93410 (+99), 94021 (+97) |
| Mental health & counseling | 30 | 303,214.199 | 7.20 | 0.67 | 688 of 1769 | 95903 (-59), 96093 (-59), 93605 (-53) | 93453 (+100), 95550 (+100), 95715 (+100) |
| Dental | 30 | 66,088.8 | 1.65 | 0.66 | 719 of 1769 | 95903 (-82), 96112 (-76), 96069 (-68) | 95511 (+100), 95514 (+100), 95554 (+100) |
| Eye care | 30 | 19,294.8 | 0.62 | 0.72 | 539 of 1769 | 92055 (-65), 95903 (-46), 90071 (-43) | 94020 (+100), 94021 (+100), 93410 (+78) |
| Chiropractic | 30 | 19,092.6 | 0.63 | 0.68 | 585 of 1769 | 96104 (-84), 93651 (-56), 90071 (-47) | 95715 (+100), 95910 (+100), 95922 (+100) |
| Physical & occupational therapy | 30 | 60,934.4 | 2.70 | 0.73 | 301 of 1769 | 95903 (-45), 96086 (-43), 92055 (-38) | 94020 (+100), 94021 (+100), 92259 (+91) |
| Orthopedics & sports injury | 60 | 9,375.8 | 0.39 | 0.65 | 479 of 1769 | 93541 (-36), 90670 (-34), 94580 (-33) | 94021 (+98), 94020 (+93), 94074 (+91) |
| Heart / cardiology | 60 | 6,578.6 | 0.24 | 0.68 | 701 of 1769 | 94580 (-50), 94541 (-46), 94578 (-46) | 94924 (+94), 94021 (+93), 94567 (+92) |
| Skin / dermatology | 60 | 3,295.6 | 0.09 | 0.72 | 805 of 1769 | 94580 (-82), 94579 (-75), 94578 (-74) | 93410 (+99), 94021 (+93), 94924 (+87) |
| Allergy & immunology | 60 | 969 | 0.03 | 0.76 | 736 of 1769 | 94541 (-64), 94580 (-63), 94578 (-59) | 93410 (+96), 94021 (+92), 92539 (+89) |
| Lung, breathing & sleep | 60 | 5,148.8 | 0.13 | 0.79 | 774 of 1769 | 90044 (-60), 90305 (-58), 90670 (-57) | 92136 (+100), 94021 (+94), 93653 (+87) |
| Digestive / gastroenterology | 60 | 3,322 | 0.11 | 0.72 | 768 of 1769 | 94580 (-61), 94578 (-55), 94579 (-55) | 93410 (+99), 93653 (+98), 92539 (+93) |
| Kidney / nephrology | 60 | 3,151.6 | 0.11 | 0.77 | 485 of 1769 | 95659 (-42), 93625 (-41), 95668 (-39) | 94021 (+96), 94020 (+90), 94074 (+88) |
| Diabetes & hormones | 60 | 1,730.4 | 0.06 | 0.77 | 630 of 1769 | 94580 (-49), 94030 (-47), 90670 (-46) | 94021 (+94), 93653 (+93), 94924 (+93) |
| Cancer care / oncology | 90 | 4,243.4 | 0.15 | 0.57 | 890 of 1769 | 94539 (-52), 94580 (-51), 96078 (-51) | 94567 (+95), 92539 (+86), 92561 (+85) |
| Arthritis / rheumatology | 60 | 1,103 | 0.04 | 0.76 | 689 of 1769 | 94580 (-65), 94579 (-58), 94578 (-57) | 93410 (+98), 93653 (+93), 94021 (+93) |
| Brain & nerves / neurology | 60 | 6,510 | 0.22 | 0.75 | 700 of 1769 | 94541 (-60), 94580 (-60), 94545 (-57) | 94021 (+91), 94020 (+79), 94074 (+79) |
| Ear, nose & throat | 60 | 2,126.2 | 0.07 | 0.72 | 791 of 1769 | 94580 (-63), 94578 (-58), 94579 (-57) | 93653 (+100), 94567 (+95), 94924 (+93) |
| Urology | 60 | 1,947.8 | 0.07 | 0.66 | 733 of 1769 | 96067 (-53), 95425 (-52), 90670 (-46) | 96085 (+100), 94567 (+97), 94021 (+96) |
| Foot & ankle / podiatry | 60 | 4,063.6 | 0.15 | 0.72 | 519 of 1769 | 92004 (-75), 92066 (-45), 93240 (-43) | 94021 (+98), 94020 (+94), 94074 (+91) |
| Pain management | 60 | 2,881.6 | 0.09 | 0.70 | 757 of 1769 | 90241 (-54), 90240 (-53), 90670 (-53) | 92242 (+100), 94021 (+96), 92539 (+89) |
| Plastic & reconstructive surgery | 90 | 2,694 | 0.07 | 0.73 | 917 of 1769 | 90670 (-83), 90605 (-82), 90221 (-81) | 93924 (+83), 92539 (+81), 92561 (+80) |
| Speech & language therapy | 30 | 19,373 | 0.90 | 0.78 | 266 of 1769 | 96006 (-62), 92070 (-40), 96107 (-34) | 96119 (+83), 94021 (+60), 94074 (+58) |
| Nutrition & dietitian | 30 | 9,709.6 | 0.33 | 0.71 | 534 of 1769 | 93621 (-80), 93641 (-80), 95903 (-76) | 94020 (+100), 94021 (+100), 94074 (+99) |
| Acupuncture, massage & naturopathy | 30 | 22,230.2 | 0.52 | 0.80 | 559 of 1769 | 95248 (-89), 95426 (-74), 94937 (-66) | 94020 (+100), 94060 (+100), 94922 (+100) |
| Urgent care & emergency | 30 | 14,183 | 0.47 | 0.55 | 653 of 1769 | 95957 (-73), 95936 (-71), 93427 (-65) | 92561 (+100), 93529 (+100), 93549 (+100) |
| Imaging & lab | 60 | 14,622.8 | 0.49 | 0.71 | 709 of 1769 | 94580 (-47), 94541 (-45), 94555 (-45) | 94021 (+93), 94020 (+82), 94074 (+81) |
| Pharmacy | 30 | 50,529.6 | 1.72 | 0.62 | 563 of 1769 | 92055 (-54), 93271 (-42), 96039 (-41) | 94020 (+100), 94021 (+100), 94074 (+98) |
| Home health & in-home care | 30 | 71,694.6 | 1.61 | 0.73 | 300 of 1769 | 93240 (-48), 96104 (-47), 90071 (-45) | 92259 (+100), 92384 (+100), 95415 (+100) |
| Nursing & assisted living | 60 | 10,882.8 | 0.39 | 0.66 | 538 of 1769 | 95659 (-50), 90071 (-40), 90022 (-34) | 96112 (+100), 95389 (+84), 95638 (+83) |
| Medical equipment & supplies | 60 | 9,393.2 | 0.36 | 0.71 | 405 of 1769 | 93662 (-51), 93631 (-43), 93625 (-42) | 96112 (+100), 92242 (+84), 95950 (+60) |
| Hearing & audiology | 60 | 4,839.4 | 0.19 | 0.65 | 534 of 1769 | 96080 (-44), 96078 (-43), 95425 (-40) | 92242 (+100), 94021 (+98), 93410 (+95) |
| Behavior therapy (ABA) | 30 | 215,723.209 | 2.88 | 0.85 | 500 of 1769 | 95336 (-70), 94547 (-68), 95981 (-65) | 92136 (+100), 92365 (+100), 94940 (+100) |
| Care coordination & community health | 30 | 62,267 | 1.63 | 0.60 | 683 of 1769 | 96118 (-74), 96084 (-55), 95936 (-53) | 92259 (+100), 92328 (+100), 92365 (+100) |
| General surgery | 60 | 8,369.8 | 0.35 | 0.59 | 611 of 1769 | 93541 (-56), 93616 (-45), 93662 (-45) | 96085 (+100), 96050 (+98), 94021 (+96) |
| Infectious disease | 90 | 1,381.4 | 0.05 | 0.70 | 864 of 1769 | 94539 (-57), 94580 (-53), 95131 (-52) | 94929 (+90), 94922 (+89), 94923 (+89) |
| Genetics & genetic counseling | 90 | 1,205.6 | 0.03 | 0.77 | 881 of 1769 | 94541 (-98), 94578 (-96), 94579 (-96) | 93653 (+67), 93667 (+62), 95814 (+57) |
| Hospice & palliative care | 60 | 6,649.2 | 0.09 | 0.86 | 525 of 1769 | 90704 (-78), 90044 (-68), 90047 (-68) | 94021 (+99), 94020 (+96), 92539 (+87) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in California in households with no vehicle: about 2,144,932 of 30,825,334 (7.0%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 44
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 16 of 1769 | 92136 (+61), 93410 (+50), 94104 (+37) | 1.00 |
| Pediatrics (children) | 0.99 | 22 of 1769 | 93410 (+65), 92136 (+59), 94104 (+51) | 1.00 |
| Women's health / OB-GYN | 0.98 | 27 of 1769 | 93410 (+73), 92136 (+61), 94104 (+57) | 1.00 |
| Mental health & counseling | 0.99 | 23 of 1769 | 93410 (+99), 92136 (+76), 94104 (+51) | 1.00 |
| Dental | 0.99 | 20 of 1769 | 93410 (+69), 92136 (+56), 94104 (+43) | 1.00 |
| Eye care | 0.99 | 19 of 1769 | 93410 (+66), 92136 (+50), 94104 (+41) | 1.00 |
| Chiropractic | 0.99 | 16 of 1769 | 93410 (+80), 92136 (+44), 94104 (+34) | 1.00 |
| Physical & occupational therapy | 0.99 | 11 of 1769 | 93410 (+51), 92136 (+42), 94104 (+27) | 1.00 |
| Orthopedics & sports injury | 0.97 | 16 of 1769 | 92136 (+53), 93410 (+53), 94104 (+27) | 1.00 |
| Heart / cardiology | 0.98 | 20 of 1769 | 92136 (+56), 93410 (+33), 94104 (+31) | 1.00 |
| Skin / dermatology | 0.98 | 24 of 1769 | 92136 (+82), 93410 (+81), 94104 (+49) | 1.00 |
| Allergy & immunology | 0.99 | 22 of 1769 | 92136 (+57), 93410 (+51), 94104 (+42) | 1.00 |
| Lung, breathing & sleep | 0.98 | 33 of 1769 | 92136 (+75), 94104 (+53), 94108 (+48) | 1.00 |
| Digestive / gastroenterology | 0.98 | 22 of 1769 | 93410 (+68), 92136 (+57), 94104 (+38) | 1.00 |
| Kidney / nephrology | 0.98 | 20 of 1769 | 92136 (+41), 93410 (+38), 94104 (+33) | 1.00 |
| Diabetes & hormones | 0.98 | 22 of 1769 | 92136 (+57), 94104 (+37), 94108 (+33) | 1.00 |
| Cancer care / oncology | 0.97 | 17 of 1769 | 92136 (+43), 94104 (+37), 94108 (+34) | 1.00 |
| Arthritis / rheumatology | 0.99 | 22 of 1769 | 93410 (+69), 92136 (+53), 94104 (+36) | 1.00 |
| Brain & nerves / neurology | 0.98 | 21 of 1769 | 92136 (+55), 94104 (+39), 93410 (+38) | 1.00 |
| Ear, nose & throat | 0.99 | 22 of 1769 | 92136 (+64), 93410 (+57), 94104 (+42) | 1.00 |
| Urology | 0.98 | 19 of 1769 | 92136 (+48), 93410 (+40), 94104 (+31) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 22 of 1769 | 93410 (+47), 94104 (+36), 92136 (+34) | 1.00 |
| Pain management | 0.99 | 21 of 1769 | 93410 (+86), 92136 (+54), 94922 (+40) | 1.00 |
| Plastic & reconstructive surgery | 0.99 | 28 of 1769 | 92136 (+63), 90014 (+41), 94104 (+40) | 1.00 |
| Speech & language therapy | 0.99 | 9 of 1769 | 93410 (+47), 92136 (+42), 94104 (+24) | 1.00 |
| Nutrition & dietitian | 0.99 | 19 of 1769 | 93410 (+87), 92136 (+69), 94102 (+48) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 16 of 1769 | 94922 (+95), 92136 (+80), 93410 (+79) | 1.00 |
| Urgent care & emergency | 0.99 | 20 of 1769 | 92136 (+62), 93410 (+54), 94104 (+45) | 1.00 |
| Imaging & lab | 0.98 | 20 of 1769 | 92136 (+55), 93410 (+51), 94104 (+33) | 1.00 |
| Pharmacy | 0.98 | 18 of 1769 | 92136 (+45), 93410 (+43), 94104 (+39) | 1.00 |
| Home health & in-home care | 0.99 | 14 of 1769 | 93410 (+39), 90013 (+29), 90014 (+29) | 1.00 |
| Nursing & assisted living | 0.99 | 18 of 1769 | 92136 (+38), 93410 (+34), 95814 (+28) | 1.00 |
| Medical equipment & supplies | 0.99 | 16 of 1769 | 93410 (+44), 92136 (+34), 90014 (+27) | 1.00 |
| Hearing & audiology | 0.98 | 16 of 1769 | 93410 (+61), 92136 (+50), 94104 (+30) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 17 of 1769 | 92136 (+100), 94720 (+53), 94104 (+47) | 1.00 |
| Care coordination & community health | 0.99 | 22 of 1769 | 93410 (+85), 92136 (+58), 94104 (+51) | 1.00 |
| General surgery | 0.98 | 16 of 1769 | 92136 (+39), 93410 (+26), 94104 (+25) | 1.00 |
| Infectious disease | 0.98 | 19 of 1769 | 92136 (+53), 94104 (+40), 94108 (+37) | 1.00 |
| Genetics & genetic counseling | 0.99 | 18 of 1769 | 92136 (+45), 94720 (+45), 94104 (+44) | 1.00 |
| Hospice & palliative care | 0.99 | 16 of 1769 | 92136 (+52), 93410 (+28), 94104 (+28) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 171 of 1770 | 243,916 (0.8%) | 23/634 | 129/825 | 14/168 | 2/44 | 3/99 |
| Women's health / OB-GYN | 016 | 40 of 1770 | 45,060 (0.1%) | 4/634 | 31/825 | 4/168 | 0/44 | 1/99 |
| Mental health & counseling: Psychiatry | 029 | 114 of 1770 | 107,893 (0.4%) | 20/634 | 55/825 | 25/168 | 1/44 | 13/99 |
| Mental health & counseling: Clinical Psychology | 036 | 44 of 1770 | 38,084 (0.1%) | 13/634 | 23/825 | 6/168 | 1/44 | 1/99 |
| Mental health & counseling: Clinical Social Work | 037 | 77 of 1770 | 67,548 (0.2%) | 8/634 | 57/825 | 10/168 | 1/44 | 1/99 |
| Eye care | 023 | 130 of 1770 | 183,508 (0.6%) | 16/634 | 90/825 | 14/168 | 1/44 | 9/99 |
| Chiropractic | 010 | 41 of 1770 | 23,964 (0.1%) | 5/634 | 35/825 | 1/168 | 0/44 | 0/99 |
| Physical & occupational therapy | F049 | 41 of 1770 | 39,194 (0.1%) | 13/634 | 26/825 | 0/168 | 1/44 | 1/99 |
| Orthopedics & sports injury | 025 | 160 of 1770 | 220,002 (0.7%) | 16/634 | 90/825 | 32/168 | 4/44 | 18/99 |
| Heart / cardiology | 008 | 238 of 1770 | 489,649 (1.6%) | 23/634 | 158/825 | 27/168 | 4/44 | 26/99 |
| Skin / dermatology | 011 | 180 of 1770 | 391,353 (1.3%) | 18/634 | 97/825 | 33/168 | 8/44 | 24/99 |
| Allergy & immunology | 007 | 178 of 1770 | 383,648 (1.2%) | 12/634 | 108/825 | 33/168 | 11/44 | 14/99 |
| Lung, breathing & sleep | 030 | 146 of 1770 | 262,445 (0.9%) | 26/634 | 74/825 | 20/168 | 4/44 | 22/99 |
| Digestive / gastroenterology | 014 | 192 of 1770 | 402,797 (1.3%) | 28/634 | 97/825 | 30/168 | 7/44 | 30/99 |
| Kidney / nephrology | 018 | 106 of 1770 | 106,351 (0.3%) | 10/634 | 68/825 | 15/168 | 4/44 | 9/99 |
| Diabetes & hormones | 012 | 83 of 1770 | 214,843 (0.7%) | 13/634 | 47/825 | 5/168 | 5/44 | 13/99 |
| Cancer care / oncology | 021 | 150 of 1770 | 245,975 (0.8%) | 23/634 | 83/825 | 16/168 | 4/44 | 24/99 |
| Arthritis / rheumatology | 031 | 105 of 1770 | 197,647 (0.6%) | 12/634 | 65/825 | 8/168 | 4/44 | 16/99 |
| Brain & nerves / neurology | 019 | 148 of 1770 | 239,814 (0.8%) | 20/634 | 77/825 | 25/168 | 5/44 | 21/99 |
| Ear, nose & throat | 013 | 168 of 1770 | 312,697 (1.0%) | 12/634 | 94/825 | 29/168 | 9/44 | 24/99 |
| Urology | 033 | 172 of 1770 | 347,334 (1.1%) | 33/634 | 83/825 | 31/168 | 4/44 | 21/99 |
| Foot & ankle / podiatry | 028 | 145 of 1770 | 196,013 (0.6%) | 23/634 | 69/825 | 35/168 | 5/44 | 13/99 |
| Plastic & reconstructive surgery | 027 | 95 of 1770 | 182,090 (0.6%) | 10/634 | 52/825 | 11/168 | 1/44 | 21/99 |
| Speech & language therapy | F051 | 60 of 1770 | 81,590 (0.3%) | 11/634 | 40/825 | 4/168 | 1/44 | 4/99 |
| Imaging & lab | F047 | 85 of 1770 | 106,443 (0.3%) | 21/634 | 44/825 | 7/168 | 3/44 | 10/99 |
| Nursing & assisted living | F046 | 67 of 1770 | 86,583 (0.3%) | 9/634 | 49/825 | 4/168 | 1/44 | 4/99 |
| General surgery | 015 | 192 of 1770 | 262,603 (0.9%) | 18/634 | 118/825 | 36/168 | 2/44 | 18/99 |
| Infectious disease | 017 | 115 of 1770 | 253,088 (0.8%) | 13/634 | 70/825 | 10/168 | 1/44 | 21/99 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 70840 rows (ZIP x specialty) stored in access_e2sfca for CA; market-score now uses drive-time access for these ZIPs.
