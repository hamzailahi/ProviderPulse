# E2SFCA access dry run: Hawaii

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 94; in Hawaii: 94
- Drive times: OSRM on OpenStreetMap roads (car profile), 94 x 94 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 1
- Listings read: 38,558.8; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.81 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.01), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 6; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 6 (96729, 96742, 96748, 96757, 96763, 96770)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 96729 | yes | 2.83 | 33% | 2.83 | 33% | no |
| 96742 | yes | 2.68 | 33% | 2.68 | 33% | no |
| 96748 | yes | 3.89 | 33% | 3.89 | 33% | no |
| 96757 | yes | 2.89 | 33% | 2.89 | 33% | no |
| 96763 | yes | none | 0% | none | 0% | no |
| 96770 | yes | 2.89 | 33% | 2.89 | 33% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 4,575.8 | 4.30 | 0.32 | 46 of 88 | 96743 (-41), 96713 (-35), 96732 (-24) | 96710 (+61), 96773 (+54), 96728 (+49) |
| Pediatrics (children) | 30 | 1,120.8 | 1.11 | 0.58 | 39 of 88 | 96743 (-32), 96732 (-23), 96858 (-23) | 96825 (+56), 96795 (+55), 96848 (+48) |
| Women's health / OB-GYN | 60 | 589.6 | 0.53 | 0.61 | 30 of 88 | 96789 (-28), 96797 (-28), 96774 (-26) | 96755 (+54), 96825 (+52), 96719 (+45) |
| Mental health & counseling | 30 | 7,108.4 | 7.20 | 0.33 | 37 of 88 | 96731 (-37), 96762 (-30), 96720 (-28) | 96773 (+86), 96710 (+84), 96728 (+68) |
| Dental | 30 | 2,128.8 | 1.65 | 0.57 | 54 of 88 | 96860 (-33), 96732 (-31), 96818 (-31) | 96710 (+71), 96773 (+71), 96825 (+60) |
| Eye care | 30 | 809 | 0.62 | 0.40 | 55 of 88 | 96720 (-36), 96732 (-33), 96766 (-33) | 96710 (+90), 96773 (+90), 96769 (+86) |
| Chiropractic | 30 | 610.6 | 0.63 | 0.37 | 42 of 88 | 96712 (-46), 96713 (-42), 96791 (-31) | 96719 (+91), 96755 (+76), 96776 (+70) |
| Physical & occupational therapy | 30 | 2,579.4 | 2.70 | 0.60 | 31 of 88 | 96732 (-27), 96858 (-18), 96819 (-17) | 96726 (+42), 96773 (+42), 96704 (+39) |
| Orthopedics & sports injury | 60 | 429.2 | 0.39 | 0.60 | 38 of 88 | 96713 (-33), 96789 (-31), 96797 (-28) | 96825 (+47), 96848 (+45), 96714 (+41) |
| Heart / cardiology | 60 | 217.4 | 0.24 | 0.74 | 33 of 88 | 96774 (-46), 96789 (-32), 96857 (-32) | 96848 (+49), 96773 (+45), 96776 (+43) |
| Skin / dermatology | 60 | 125.4 | 0.09 | 0.72 | 47 of 88 | 96789 (-37), 96754 (-36), 96797 (-36) | 96761 (+66), 96848 (+63), 96726 (+54) |
| Allergy & immunology | 60 | 23.8 | 0.03 | 0.87 | 17 of 72 | 96857 (-31), 96797 (-23), 96789 (-18) | 96825 (+42), 96848 (+42), 96738 (+38) |
| Lung, breathing & sleep | 60 | 77.6 | 0.13 | 0.84 | 14 of 88 | 96857 (-20), 96789 (-19), 96707 (-16) | 96848 (+34), 96773 (+24), 96825 (+22) |
| Digestive / gastroenterology | 60 | 113.4 | 0.11 | 0.66 | 37 of 88 | 96774 (-46), 96857 (-37), 96764 (-28) | 96848 (+58), 96719 (+50), 96776 (+45) |
| Kidney / nephrology | 60 | 166.4 | 0.11 | 0.69 | 41 of 88 | 96774 (-41), 96789 (-32), 96764 (-30) | 96848 (+63), 96773 (+55), 96714 (+52) |
| Diabetes & hormones | 60 | 60.4 | 0.06 | 0.69 | 40 of 88 | 96796 (-51), 96752 (-42), 96789 (-38) | 96714 (+92), 96722 (+70), 96825 (+56) |
| Cancer care / oncology | 90 | 134.8 | 0.15 | 0.53 | 47 of 88 | 96780 (-42), 96764 (-41), 96774 (-40) | 96848 (+39), 96773 (+37), 96710 (+33) |
| Arthritis / rheumatology | 60 | 29.4 | 0.04 | 0.82 | 27 of 72 | 96789 (-37), 96857 (-36), 96707 (-33) | 96848 (+57), 96719 (+38), 96815 (+37) |
| Brain & nerves / neurology | 60 | 157.4 | 0.22 | 0.75 | 21 of 88 | 96857 (-28), 96789 (-24), 96707 (-20) | 96848 (+40), 96825 (+32), 96714 (+31) |
| Ear, nose & throat | 60 | 63.8 | 0.07 | 0.63 | 41 of 88 | 96857 (-34), 96789 (-32), 96707 (-30) | 96848 (+52), 96714 (+50), 96773 (+43) |
| Urology | 60 | 76.6 | 0.07 | 0.68 | 39 of 88 | 96789 (-39), 96857 (-39), 96707 (-36) | 96773 (+59), 96848 (+56), 96825 (+52) |
| Foot & ankle / podiatry | 60 | 97.4 | 0.15 | 0.60 | 19 of 88 | 96774 (-24), 96780 (-23), 96764 (-22) | 96773 (+49), 96710 (+36), 96728 (+33) |
| Pain management | 60 | 67.2 | 0.09 | 0.66 | 48 of 88 | 96780 (-33), 96755 (-29), 96764 (-29) | 96713 (+100), 96773 (+76), 96710 (+52) |
| Plastic & reconstructive surgery | 90 | 57.4 | 0.07 | 0.80 | 25 of 72 | 96857 (-42), 96789 (-34), 96707 (-32) | 96825 (+43), 96848 (+41), 96795 (+36) |
| Speech & language therapy | 30 | 604.4 | 0.90 | 0.62 | 24 of 88 | 96732 (-18), 96701 (-15), 96793 (-13) | 96710 (+37), 96773 (+37), 96795 (+32) |
| Nutrition & dietitian | 30 | 295.6 | 0.33 | 0.49 | 35 of 88 | 96713 (-43), 96743 (-29), 96762 (-23) | 96848 (+42), 96710 (+41), 96714 (+41) |
| Acupuncture, massage & naturopathy | 30 | 2,133.2 | 0.52 | 0.23 | 23 of 88 | 96791 (-34), 96764 (-21), 96774 (-21) | 96752 (+69), 96792 (+66), 96730 (+64) |
| Urgent care & emergency | 30 | 596 | 0.47 | 0.61 | 50 of 88 | 96777 (-43), 96766 (-35), 96732 (-34) | 96780 (+68), 96825 (+66), 96710 (+64) |
| Imaging & lab | 60 | 471 | 0.49 | 0.67 | 30 of 88 | 96774 (-29), 96789 (-29), 96707 (-24) | 96848 (+45), 96719 (+32), 96773 (+30) |
| Pharmacy | 30 | 1,572.6 | 1.72 | 0.34 | 40 of 88 | 96777 (-34), 96720 (-26), 96732 (-22) | 96710 (+75), 96773 (+75), 96728 (+62) |
| Home health & in-home care | 30 | 616.2 | 1.61 | 0.47 | 16 of 88 | 96720 (-15), 96732 (-14), 96793 (-12) | 96710 (+48), 96773 (+48), 96728 (+39) |
| Nursing & assisted living | 60 | 437 | 0.39 | 0.76 | 16 of 88 | 96744 (-16), 96813 (-13), 96732 (-12) | 96773 (+45), 96792 (+40), 96761 (+29) |
| Medical equipment & supplies | 60 | 286 | 0.36 | 0.65 | 21 of 88 | 96774 (-23), 96780 (-20), 96764 (-19) | 96773 (+43), 96714 (+42), 96722 (+31) |
| Hearing & audiology | 60 | 158.2 | 0.19 | 0.65 | 29 of 88 | 96796 (-19), 96752 (-16), 96789 (-16) | 96773 (+40), 96848 (+37), 96714 (+35) |
| Behavior therapy (ABA) | 30 | 6,538.4 | 2.88 | 0.58 | 43 of 88 | 96766 (-27), 96743 (-18), 96732 (-16) | 96773 (+99), 96710 (+98), 96730 (+85) |
| Care coordination & community health | 30 | 1,117 | 1.63 | 0.35 | 32 of 88 | 96732 (-25), 96720 (-22), 96766 (-20) | 96773 (+72), 96710 (+71), 96714 (+59) |
| General surgery | 60 | 279.8 | 0.35 | 0.65 | 31 of 88 | 96857 (-28), 96789 (-27), 96707 (-25) | 96848 (+42), 96714 (+36), 96761 (+35) |
| Infectious disease | 90 | 47.2 | 0.05 | 0.79 | 27 of 88 | 96789 (-48), 96857 (-48), 96707 (-47) | 96825 (+48), 96734 (+47), 96848 (+46) |
| Genetics & genetic counseling | 90 | 36.2 | 0.03 | 0.59 | 30 of 35 | 96857 (-57), 96789 (-56), 96786 (-54) | 96848 (+53), 96795 (+36), 96815 (+36) |
| Hospice & palliative care | 60 | 46.2 | 0.09 | 0.68 | 24 of 88 | 96796 (-29), 96752 (-23), 96780 (-23) | 96773 (+51), 96714 (+49), 96769 (+38) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Hawaii in households with no vehicle: about 89,715 of 1,155,784 (7.8%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 7
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.98 | 1 of 88 | 96848 (+29), 96815 (+12), 96817 (+7) | 1.00 |
| Pediatrics (children) | 0.99 | 1 of 88 | 96848 (+35), 96815 (+13), 96817 (+9) | 1.00 |
| Women's health / OB-GYN | 0.98 | 1 of 88 | 96848 (+23), 96815 (+8), 96817 (+5) | 0.99 |
| Mental health & counseling | 0.98 | 1 of 88 | 96848 (+25), 96815 (+9), 96826 (+7) | 1.00 |
| Dental | 0.99 | 1 of 88 | 96848 (+34), 96815 (+14), 96826 (+8) | 1.00 |
| Eye care | 0.99 | 2 of 88 | 96848 (+39), 96815 (+15), 96826 (+10) | 1.00 |
| Chiropractic | 0.99 | 1 of 88 | 96848 (+20), 96815 (+7), 96817 (+7) | 1.00 |
| Physical & occupational therapy | 0.98 | 1 of 88 | 96848 (+25), 96815 (+10), 96817 (+7) | 1.00 |
| Orthopedics & sports injury | 0.97 | 1 of 88 | 96848 (+25), 96815 (+12), 96769 (+5) | 0.99 |
| Heart / cardiology | 0.98 | 1 of 88 | 96848 (+27), 96815 (+11), 96826 (+6) | 0.99 |
| Skin / dermatology | 0.99 | 1 of 88 | 96848 (+36), 96815 (+13), 96826 (+6) | 1.00 |
| Allergy & immunology | 0.99 | 1 of 72 | 96848 (+24), 96815 (+10), 96826 (+5) | 1.00 |
| Lung, breathing & sleep | 0.99 | 1 of 88 | 96848 (+19), 96815 (+8), 96826 (+4) | 1.00 |
| Digestive / gastroenterology | 0.97 | 1 of 88 | 96848 (+32), 96815 (+13), 96826 (+8) | 0.99 |
| Kidney / nephrology | 0.97 | 2 of 88 | 96848 (+42), 96815 (+17), 96826 (+11) | 0.99 |
| Diabetes & hormones | 0.99 | 1 of 88 | 96848 (+27), 96815 (+11), 96769 (+8) | 0.99 |
| Cancer care / oncology | 0.95 | 1 of 88 | 96848 (+16), 96815 (+7), 96769 (+4) | 0.98 |
| Arthritis / rheumatology | 0.98 | 1 of 72 | 96848 (+30), 96815 (+12), 96826 (+7) | 0.99 |
| Brain & nerves / neurology | 0.98 | 1 of 88 | 96848 (+23), 96815 (+9), 96826 (+4) | 0.99 |
| Ear, nose & throat | 0.97 | 1 of 88 | 96848 (+29), 96815 (+11), 96826 (+5) | 0.99 |
| Urology | 0.97 | 1 of 88 | 96848 (+31), 96815 (+13), 96826 (+6) | 0.99 |
| Foot & ankle / podiatry | 0.96 | 1 of 88 | 96848 (+18), 96815 (+6), 96826 (+3) | 0.99 |
| Pain management | 0.99 | 1 of 88 | 96848 (+19), 96769 (+7), 96815 (+7) | 1.00 |
| Plastic & reconstructive surgery | 0.97 | 1 of 72 | 96848 (+16), 96815 (+6), 96826 (+3) | 0.99 |
| Speech & language therapy | 0.99 | 1 of 88 | 96848 (+22), 96815 (+9), 96826 (+6) | 1.00 |
| Nutrition & dietitian | 0.99 | 1 of 88 | 96848 (+22), 96815 (+9), 96826 (+7) | 1.00 |
| Acupuncture, massage & naturopathy | 0.94 | 1 of 88 | 96848 (+54), 96769 (+10), 96762 (+3) | 1.00 |
| Urgent care & emergency | 0.99 | 1 of 88 | 96848 (+32), 96815 (+12), 96769 (+10) | 1.00 |
| Imaging & lab | 0.97 | 1 of 88 | 96848 (+27), 96815 (+10), 96826 (+5) | 0.99 |
| Pharmacy | 0.99 | 1 of 88 | 96848 (+21), 96815 (+9), 96826 (+7) | 1.00 |
| Home health & in-home care | 0.99 | 0 of 88 | 96848 (+8), 96815 (+3), 96817 (+2) | 1.00 |
| Nursing & assisted living | 0.98 | 1 of 88 | 96848 (+25), 96815 (+11), 96817 (+7) | 1.00 |
| Medical equipment & supplies | 0.97 | 1 of 88 | 96848 (+22), 96815 (+7), 96769 (+5) | 1.00 |
| Hearing & audiology | 0.98 | 1 of 88 | 96848 (+23), 96815 (+8), 96817 (+4) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 2 of 88 | 96848 (+40), 96815 (+17), 96826 (+7) | 1.00 |
| Care coordination & community health | 0.99 | 0 of 88 | 96848 (+12), 96815 (+4), 96826 (+4) | 1.00 |
| General surgery | 0.96 | 1 of 88 | 96848 (+24), 96815 (+10), 96826 (+5) | 0.99 |
| Infectious disease | 0.99 | 1 of 88 | 96848 (+17), 96815 (+6), 96792 (+2) | 1.00 |
| Genetics & genetic counseling | 0.82 | 1 of 35 | 96848 (+23), 96815 (+8), 96792 (+3) | 0.94 |
| Hospice & palliative care | 0.98 | 0 of 88 | 96848 (+12), 96769 (+5), 96815 (+5) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 4 of 94 | 3,277 (0.3%) | 0/35 | 4/58 |  |  | 0/1 |
| Women's health / OB-GYN | 016 | 3 of 94 | 6,362 (0.6%) | 0/35 | 3/58 |  |  | 0/1 |
| Mental health & counseling: Psychiatry | 029 | 14 of 94 | 29,174 (2.5%) | 4/35 | 9/58 |  |  | 1/1 |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 94 | 8,795 (0.8%) | 0/35 | 4/58 |  |  | 0/1 |
| Mental health & counseling: Clinical Social Work | 037 | 1 of 94 | 534 (0.0%) | 0/35 | 1/58 |  |  | 0/1 |
| Eye care | 023 | 4 of 94 | 6,760 (0.6%) | 1/35 | 3/58 |  |  | 0/1 |
| Chiropractic | 010 | 2 of 94 | 4,449 (0.4%) | 0/35 | 2/58 |  |  | 0/1 |
| Physical & occupational therapy | F049 | 2 of 94 | 4,449 (0.4%) | 0/35 | 2/58 |  |  | 0/1 |
| Orthopedics & sports injury | 025 | 7 of 94 | 13,206 (1.1%) | 1/35 | 6/58 |  |  | 0/1 |
| Heart / cardiology | 008 | 28 of 94 | 146,581 (12.7%) | 9/35 | 18/58 |  |  | 1/1 |
| Skin / dermatology | 011 | 17 of 94 | 60,444 (5.2%) | 6/35 | 10/58 |  |  | 1/1 |
| Allergy & immunology | 007 | 50 of 94 | 209,576 (18.1%) | 5/35 | 44/58 |  |  | 1/1 |
| Lung, breathing & sleep | 030 | 10 of 94 | 51,916 (4.5%) | 7/35 | 3/58 |  |  | 0/1 |
| Digestive / gastroenterology | 014 | 23 of 94 | 109,748 (9.5%) | 8/35 | 14/58 |  |  | 1/1 |
| Kidney / nephrology | 018 | 11 of 94 | 27,535 (2.4%) | 3/35 | 8/58 |  |  | 0/1 |
| Diabetes & hormones | 012 | 8 of 94 | 65,343 (5.7%) | 7/35 | 1/58 |  |  | 0/1 |
| Cancer care / oncology | 021 | 15 of 94 | 55,319 (4.8%) | 5/35 | 9/58 |  |  | 1/1 |
| Arthritis / rheumatology | 031 | 43 of 94 | 226,693 (19.6%) | 6/35 | 36/58 |  |  | 1/1 |
| Brain & nerves / neurology | 019 | 11 of 94 | 28,119 (2.4%) | 3/35 | 8/58 |  |  | 0/1 |
| Ear, nose & throat | 013 | 15 of 94 | 81,368 (7.0%) | 5/35 | 9/58 |  |  | 1/1 |
| Urology | 033 | 24 of 94 | 140,017 (12.1%) | 9/35 | 14/58 |  |  | 1/1 |
| Foot & ankle / podiatry | 028 | 16 of 94 | 87,344 (7.6%) | 2/35 | 13/58 |  |  | 1/1 |
| Plastic & reconstructive surgery | 027 | 41 of 94 | 198,969 (17.2%) | 6/35 | 34/58 |  |  | 1/1 |
| Speech & language therapy | F051 | 6 of 94 | 10,722 (0.9%) | 0/35 | 6/58 |  |  | 0/1 |
| Imaging & lab | F047 | 9 of 94 | 28,797 (2.5%) | 3/35 | 6/58 |  |  | 0/1 |
| Nursing & assisted living | F046 | 9 of 94 | 21,270 (1.8%) | 2/35 | 6/58 |  |  | 1/1 |
| General surgery | 015 | 18 of 94 | 58,579 (5.1%) | 5/35 | 12/58 |  |  | 1/1 |
| Infectious disease | 017 | 12 of 94 | 33,206 (2.9%) | 6/35 | 5/58 |  |  | 1/1 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 3760 rows (ZIP x specialty) stored in access_e2sfca for HI; market-score now uses drive-time access for these ZIPs.
