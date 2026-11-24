# E2SFCA access dry run: Idaho

Run 2026-11-24 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 716; in Idaho: 277
- Drive times: OSRM on OpenStreetMap roads (car profile), 716 x 716 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 104,077.4; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.43 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (6.08), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 5; re-anchored: 1; still implausible (left out of the rank comparison, still stored, marked in the CSV): 4 (83802, 83808, 84018, 97842)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83802 | yes | 6.12 | 100% | 6.12 | 100% | no |
| 83808 | yes | 7.21 | 100% | 7.21 | 100% | no |
| 83874 | yes | 6.36 | 100% | 4.72 | 100% | yes (2.08) |
| 84018 | no | 12.42 | 100% | 12.42 | 100% | no |
| 97842 | no | 6.71 | 100% | 6.71 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 12,800.8 | 4.30 | 0.46 | 132 of 275 | 83848 (-40), 83522 (-34), 83449 (-31) | 83842 (+100), 83810 (+97), 83666 (+90) |
| Pediatrics (children) | 30 | 2,159.4 | 1.11 | 0.62 | 78 of 275 | 83642 (-32), 83464 (-31), 83530 (-22) | 83631 (+72), 83428 (+69), 83842 (+63) |
| Women's health / OB-GYN | 60 | 1,558.6 | 0.53 | 0.75 | 57 of 275 | 83813 (-39), 83801 (-20), 83605 (-19) | 83666 (+99), 83631 (+94), 83842 (+89) |
| Mental health & counseling | 30 | 27,160.2 | 7.20 | 0.48 | 131 of 275 | 83215 (-86), 83622 (-37), 83851 (-34) | 83810 (+100), 83842 (+100), 83666 (+97) |
| Dental | 30 | 5,431.6 | 1.65 | 0.55 | 153 of 275 | 83450 (-79), 83612 (-53), 83851 (-44) | 83842 (+100), 83810 (+94), 83604 (+71) |
| Eye care | 30 | 1,901 | 0.62 | 0.58 | 130 of 275 | 83276 (-32), 83530 (-30), 83544 (-27) | 83468 (+88), 83842 (+84), 83466 (+83) |
| Chiropractic | 30 | 2,586.4 | 0.63 | 0.54 | 150 of 275 | 83535 (-55), 83530 (-35), 83638 (-33) | 83227 (+100), 83235 (+100), 83253 (+100) |
| Physical & occupational therapy | 30 | 9,619 | 2.70 | 0.50 | 135 of 275 | 83330 (-32), 83642 (-31), 83530 (-28) | 83428 (+100), 83631 (+100), 83810 (+100) |
| Orthopedics & sports injury | 60 | 1,718.8 | 0.39 | 0.72 | 96 of 275 | 83823 (-79), 83834 (-60), 83605 (-41) | 83203 (+100), 83631 (+100), 83666 (+100) |
| Heart / cardiology | 60 | 536.4 | 0.24 | 0.71 | 66 of 275 | 83444 (-43), 83442 (-42), 83431 (-36) | 83666 (+99), 83631 (+95), 83842 (+93) |
| Skin / dermatology | 60 | 246.4 | 0.09 | 0.79 | 66 of 275 | 83656 (-50), 83605 (-46), 83626 (-44) | 83428 (+100), 83842 (+95), 83810 (+89) |
| Allergy & immunology | 60 | 61 | 0.03 | 0.67 | 51 of 275 | 83330 (-28), 83314 (-27), 83336 (-27) | 83631 (+91), 83428 (+59), 83321 (+58) |
| Lung, breathing & sleep | 60 | 278 | 0.13 | 0.77 | 44 of 275 | 83444 (-26), 83442 (-24), 83431 (-21) | 83631 (+100), 83666 (+100), 83842 (+95) |
| Digestive / gastroenterology | 60 | 271.4 | 0.11 | 0.72 | 66 of 275 | 83656 (-40), 83669 (-37), 83626 (-36) | 83631 (+100), 83666 (+100), 83842 (+95) |
| Kidney / nephrology | 60 | 199 | 0.11 | 0.81 | 50 of 275 | 83276 (-35), 83214 (-20), 83442 (-18) | 83631 (+66), 83203 (+59), 83842 (+49) |
| Diabetes & hormones | 60 | 123.8 | 0.06 | 0.71 | 66 of 275 | 83548 (-76), 83524 (-69), 83540 (-52) | 83552 (+100), 83631 (+100), 83666 (+100) |
| Cancer care / oncology | 90 | 311.2 | 0.15 | 0.67 | 70 of 275 | 83869 (-36), 83801 (-32), 83876 (-30) | 83842 (+86), 83555 (+83), 83631 (+79) |
| Arthritis / rheumatology | 60 | 80 | 0.04 | 0.75 | 68 of 275 | 83442 (-49), 83440 (-41), 83460 (-40) | 83631 (+100), 83666 (+100), 83842 (+92) |
| Brain & nerves / neurology | 60 | 473.8 | 0.22 | 0.76 | 61 of 275 | 83251 (-51), 83215 (-35), 83442 (-34) | 83244 (+100), 83631 (+100), 83666 (+81) |
| Ear, nose & throat | 60 | 190.2 | 0.07 | 0.80 | 70 of 275 | 83283 (-55), 83254 (-46), 83214 (-44) | 83842 (+84), 83810 (+72), 83555 (+68) |
| Urology | 60 | 168.2 | 0.07 | 0.78 | 72 of 275 | 83422 (-35), 83444 (-29), 83314 (-27) | 83428 (+100), 83842 (+95), 83810 (+88) |
| Foot & ankle / podiatry | 60 | 335.4 | 0.15 | 0.83 | 65 of 275 | 83287 (-57), 83442 (-38), 83214 (-35) | 83203 (+78), 83210 (+69), 83842 (+64) |
| Pain management | 60 | 201.6 | 0.09 | 0.74 | 79 of 275 | 83444 (-50), 83442 (-46), 83605 (-42) | 83631 (+100), 83666 (+100), 83842 (+78) |
| Plastic & reconstructive surgery | 90 | 163 | 0.07 | 0.67 | 125 of 275 | 83444 (-68), 83449 (-64), 83352 (-62) | 83631 (+85), 83276 (+69), 83239 (+68) |
| Speech & language therapy | 30 | 2,316.2 | 0.90 | 0.62 | 101 of 275 | 83650 (-86), 83320 (-85), 83348 (-85) | 83250 (+69), 83210 (+65), 83344 (+63) |
| Nutrition & dietitian | 30 | 1,278.2 | 0.33 | 0.50 | 152 of 275 | 83848 (-61), 83632 (-58), 83643 (-58) | 83312 (+100), 83428 (+100), 83449 (+100) |
| Acupuncture, massage & naturopathy | 30 | 3,714.8 | 0.52 | 0.58 | 117 of 275 | 83610 (-72), 83823 (-64), 83342 (-53) | 83555 (+100), 83629 (+100), 83631 (+100) |
| Urgent care & emergency | 30 | 1,448.8 | 0.47 | 0.44 | 145 of 275 | 83547 (-57), 83252 (-52), 83530 (-52) | 83271 (+100), 83428 (+100), 83449 (+100) |
| Imaging & lab | 60 | 1,183.4 | 0.49 | 0.74 | 59 of 275 | 83442 (-24), 83444 (-24), 83813 (-24) | 83631 (+100), 83842 (+89), 83548 (+79) |
| Pharmacy | 30 | 5,665 | 1.72 | 0.51 | 136 of 275 | 83851 (-42), 83642 (-31), 83544 (-30) | 83631 (+100), 83666 (+100), 83842 (+100) |
| Home health & in-home care | 30 | 1,941.4 | 1.61 | 0.56 | 54 of 275 | 83555 (-51), 83645 (-26), 83251 (-19) | 83468 (+40), 83302 (+39), 83842 (+39) |
| Nursing & assisted living | 60 | 1,300.4 | 0.39 | 0.67 | 103 of 275 | 83215 (-50), 83523 (-36), 83854 (-26) | 83244 (+100), 83349 (+91), 83874 (+90) |
| Medical equipment & supplies | 60 | 985.8 | 0.36 | 0.74 | 71 of 275 | 83523 (-37), 83214 (-34), 83530 (-25) | 83555 (+86), 83874 (+72), 83243 (+70) |
| Hearing & audiology | 60 | 732.4 | 0.19 | 0.75 | 87 of 275 | 83656 (-53), 83234 (-45), 83626 (-45) | 83203 (+100), 83212 (+100), 83666 (+99) |
| Behavior therapy (ABA) | 30 | 4,832.2 | 2.88 | 0.72 | 19 of 275 | 83346 (-16), 83642 (-15), 83854 (-15) | 83842 (+43), 83810 (+41), 83833 (+37) |
| Care coordination & community health | 30 | 5,305.4 | 1.63 | 0.55 | 113 of 275 | 83622 (-62), 83442 (-49), 83851 (-44) | 83666 (+100), 83842 (+100), 83810 (+99) |
| General surgery | 60 | 967 | 0.35 | 0.72 | 91 of 275 | 83444 (-39), 83605 (-39), 83656 (-34) | 83631 (+100), 83666 (+100), 83428 (+90) |
| Infectious disease | 90 | 50.2 | 0.05 | 0.65 | 34 of 275 | 83687 (-25), 83669 (-24), 83647 (-23) | 83631 (+88), 83666 (+83), 83716 (+42) |
| Genetics & genetic counseling | 90 | 89.2 | 0.03 | 0.64 | 48 of 275 | 83656 (-73), 83687 (-72), 83626 (-68) | 83666 (+97), 83449 (+69), 83631 (+69) |
| Hospice & palliative care | 60 | 281.2 | 0.09 | 0.73 | 108 of 275 | 83251 (-100), 83215 (-87), 83465 (-73) | 83244 (+100), 83670 (+100), 83666 (+92) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Idaho in households with no vehicle: about 50,033 of 1,376,222 (3.6%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 2
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 1 of 275 | 83203 (+70), 83220 (+7), 83702 (+4) | 1.00 |
| Pediatrics (children) | 0.99 | 1 of 275 | 83203 (+46), 83702 (+3), 83840 (+3) | 1.00 |
| Women's health / OB-GYN | 0.99 | 1 of 275 | 83203 (+37), 83809 (+9), 83702 (+3) | 1.00 |
| Mental health & counseling | 0.99 | 1 of 275 | 83203 (+74), 83840 (+6), 83702 (+5) | 1.00 |
| Dental | 0.99 | 1 of 275 | 83203 (+66), 83220 (+5), 83867 (+5) | 1.00 |
| Eye care | 1.00 | 1 of 275 | 83203 (+49), 83840 (+6), 83702 (+4) | 1.00 |
| Chiropractic | 0.99 | 1 of 275 | 83203 (+56), 83220 (+10), 83702 (+5) | 1.00 |
| Physical & occupational therapy | 0.98 | 1 of 275 | 83203 (+88), 83702 (+5), 83840 (+5) | 1.00 |
| Orthopedics & sports injury | 0.98 | 1 of 275 | 83203 (+100), 83220 (+6), 83809 (+6) | 0.99 |
| Heart / cardiology | 0.98 | 1 of 275 | 83203 (+60), 83809 (+5), 83221 (+2) | 0.99 |
| Skin / dermatology | 0.99 | 1 of 275 | 83203 (+61), 83702 (+4), 83313 (+2) | 0.99 |
| Allergy & immunology | 0.99 | 1 of 275 | 83203 (+27), 83318 (+2), 83338 (+2) | 1.00 |
| Lung, breathing & sleep | 0.99 | 1 of 275 | 83203 (+33), 83702 (+3), 83809 (+3) | 1.00 |
| Digestive / gastroenterology | 0.99 | 1 of 275 | 83203 (+49), 83355 (+2), 83702 (+2) | 0.99 |
| Kidney / nephrology | 0.99 | 1 of 275 | 83203 (+52), 83220 (+11), 83809 (+5) | 0.99 |
| Diabetes & hormones | 1.00 | 1 of 275 | 83203 (+28), 83313 (+2), 83541 (+2) | 1.00 |
| Cancer care / oncology | 0.99 | 1 of 275 | 83203 (+27), 83809 (+5), 83215 (+2) | 1.00 |
| Arthritis / rheumatology | 0.99 | 1 of 275 | 83203 (+59), 83318 (+2), 83347 (+2) | 0.99 |
| Brain & nerves / neurology | 0.98 | 1 of 275 | 83203 (+56), 83215 (+7), 83702 (+3) | 0.99 |
| Ear, nose & throat | 0.99 | 1 of 275 | 83203 (+62), 83702 (+3), 83204 (+2) | 1.00 |
| Urology | 0.99 | 1 of 275 | 83203 (+42), 83809 (+4), 83702 (+3) | 1.00 |
| Foot & ankle / podiatry | 0.99 | 1 of 275 | 83203 (+77), 83220 (+6), 83809 (+4) | 1.00 |
| Pain management | 0.98 | 1 of 275 | 83203 (+77), 83809 (+8), 83825 (+3) | 0.99 |
| Plastic & reconstructive surgery | 0.98 | 1 of 275 | 83203 (+66), 83215 (+5), 83809 (+4) | 1.00 |
| Speech & language therapy | 0.99 | 1 of 275 | 83203 (+59), 83840 (+4), 83702 (+3) | 1.00 |
| Nutrition & dietitian | 1.00 | 1 of 275 | 83203 (+58), 83220 (+5), 83840 (+5) | 1.00 |
| Acupuncture, massage & naturopathy | 1.00 | 1 of 275 | 83203 (+45), 83809 (+4), 83702 (+3) | 1.00 |
| Urgent care & emergency | 0.99 | 2 of 275 | 83203 (+71), 83220 (+16), 83867 (+5) | 1.00 |
| Imaging & lab | 0.99 | 1 of 275 | 83203 (+53), 83809 (+4), 83220 (+2) | 1.00 |
| Pharmacy | 0.99 | 1 of 275 | 83203 (+80), 83220 (+11), 83702 (+5) | 1.00 |
| Home health & in-home care | 0.99 | 1 of 275 | 83203 (+21), 83702 (+2), 83220 (+1) | 1.00 |
| Nursing & assisted living | 0.98 | 1 of 275 | 83203 (+59), 83215 (+10), 83220 (+10) | 1.00 |
| Medical equipment & supplies | 0.98 | 1 of 275 | 83203 (+60), 83220 (+4), 83809 (+4) | 0.99 |
| Hearing & audiology | 0.98 | 1 of 275 | 83203 (+100), 83702 (+4), 83347 (+3) | 0.99 |
| Behavior therapy (ABA) | 0.99 | 0 of 275 | 83203 (+8), 83702 (+2), 83239 (+1) | 1.00 |
| Care coordination & community health | 0.99 | 1 of 275 | 83203 (+66), 83702 (+5), 83220 (+4) | 1.00 |
| General surgery | 0.98 | 1 of 275 | 83203 (+64), 83220 (+9), 83809 (+5) | 0.99 |
| Infectious disease | 0.99 | 0 of 275 | 83203 (+11), 83201 (+1), 83215 (+1) | 1.00 |
| Genetics & genetic counseling | 1.00 | 0 of 275 | 83627 (+2), 83702 (+2), 83809 (+2) | 1.00 |
| Hospice & palliative care | 0.98 | 1 of 275 | 83203 (+91), 83215 (+13), 83809 (+7) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 17 of 277 | 6,309 (0.5%) |  | 4/41 | 3/58 | 5/61 | 5/117 |
| Women's health / OB-GYN | 016 | 3 of 277 | 1,436 (0.1%) |  | 1/41 | 1/58 | 0/61 | 1/117 |
| Mental health & counseling: Psychiatry | 029 | 26 of 277 | 12,434 (0.9%) |  | 2/41 | 3/58 | 11/61 | 10/117 |
| Mental health & counseling: Clinical Psychology | 036 | 5 of 277 | 1,110 (0.1%) |  | 0/41 | 3/58 | 1/61 | 1/117 |
| Mental health & counseling: Clinical Social Work | 037 | 9 of 277 | 2,735 (0.2%) |  | 2/41 | 3/58 | 2/61 | 2/117 |
| Eye care | 023 | 15 of 277 | 4,987 (0.4%) |  | 3/41 | 3/58 | 2/61 | 7/117 |
| Chiropractic | 010 | 4 of 277 | 1,486 (0.1%) |  | 1/41 | 1/58 | 0/61 | 2/117 |
| Physical & occupational therapy | F049 | 5 of 277 | 1,887 (0.1%) |  | 1/41 | 0/58 | 2/61 | 2/117 |
| Orthopedics & sports injury | 025 | 20 of 277 | 9,616 (0.7%) |  | 4/41 | 7/58 | 4/61 | 5/117 |
| Heart / cardiology | 008 | 38 of 277 | 25,649 (1.9%) |  | 6/41 | 9/58 | 7/61 | 16/117 |
| Skin / dermatology | 011 | 45 of 277 | 49,389 (3.6%) |  | 2/41 | 12/58 | 15/61 | 16/117 |
| Allergy & immunology | 007 | 39 of 277 | 47,643 (3.5%) |  | 4/41 | 6/58 | 9/61 | 20/117 |
| Lung, breathing & sleep | 030 | 27 of 277 | 16,940 (1.2%) |  | 2/41 | 4/58 | 5/61 | 16/117 |
| Digestive / gastroenterology | 014 | 50 of 277 | 37,141 (2.7%) |  | 2/41 | 7/58 | 13/61 | 28/117 |
| Kidney / nephrology | 018 | 24 of 277 | 12,796 (0.9%) |  | 2/41 | 2/58 | 2/61 | 18/117 |
| Diabetes & hormones | 012 | 14 of 277 | 9,354 (0.7%) |  | 0/41 | 4/58 | 2/61 | 8/117 |
| Cancer care / oncology | 021 | 31 of 277 | 22,245 (1.6%) |  | 2/41 | 4/58 | 7/61 | 18/117 |
| Arthritis / rheumatology | 031 | 49 of 277 | 47,735 (3.5%) |  | 0/41 | 6/58 | 9/61 | 34/117 |
| Brain & nerves / neurology | 019 | 24 of 277 | 11,889 (0.9%) |  | 2/41 | 5/58 | 8/61 | 9/117 |
| Ear, nose & throat | 013 | 27 of 277 | 25,539 (1.9%) |  | 2/41 | 7/58 | 7/61 | 11/117 |
| Urology | 033 | 40 of 277 | 29,433 (2.1%) |  | 2/41 | 6/58 | 8/61 | 24/117 |
| Foot & ankle / podiatry | 028 | 30 of 277 | 28,587 (2.1%) |  | 1/41 | 4/58 | 5/61 | 20/117 |
| Plastic & reconstructive surgery | 027 | 13 of 277 | 8,088 (0.6%) |  | 0/41 | 0/58 | 1/61 | 12/117 |
| Speech & language therapy | F051 | 8 of 277 | 2,454 (0.2%) |  | 1/41 | 1/58 | 3/61 | 3/117 |
| Imaging & lab | F047 | 21 of 277 | 10,356 (0.8%) |  | 0/41 | 3/58 | 4/61 | 14/117 |
| Nursing & assisted living | F046 | 12 of 277 | 3,416 (0.2%) |  | 1/41 | 3/58 | 1/61 | 7/117 |
| General surgery | 015 | 14 of 277 | 7,022 (0.5%) |  | 3/41 | 4/58 | 3/61 | 4/117 |
| Infectious disease | 017 | 30 of 277 | 51,807 (3.8%) |  | 0/41 | 4/58 | 11/61 | 15/117 |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-24

- 11080 rows (ZIP x specialty) stored in access_e2sfca for ID; market-score now uses drive-time access for these ZIPs.
