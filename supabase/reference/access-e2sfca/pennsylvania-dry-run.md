# E2SFCA access dry run: Pennsylvania

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 4,778; in Pennsylvania: 1,820
- Drive times: OSRM on OpenStreetMap roads (car profile), 4,778 x 4,778 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,487,239.2; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.07 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.68), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 8; re-anchored: 7; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (21624)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | no | 8.86 | 100% | 3.10 | 100% | yes (1.25) |
| 08045 | no | 9.27 | 100% | 2.83 | 100% | yes (0.53) |
| 10044 | no | 12.91 | 100% | 5.46 | 100% | yes (0.70) |
| 11101 | no | 8.52 | 100% | 4.81 | 100% | yes (0.47) |
| 15450 | yes | 9.77 | 100% | 3.94 | 100% | yes (0.53) |
| 15466 | yes | 9.48 | 100% | 3.17 | 100% | yes (0.74) |
| 17517 | yes | 9.34 | 100% | 2.36 | 100% | yes (1.07) |
| 21624 | no | none | 0% | none | 0% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 179,086.8 | 4.30 | 0.76 | 533 of 1820 | 17850 (-60), 17847 (-57), 17749 (-50) | 17265 (+90), 17860 (+83), 15315 (+79) |
| Pediatrics (children) | 30 | 54,989.6 | 1.11 | 0.86 | 262 of 1820 | 17850 (-61), 17847 (-58), 17857 (-52) | 17860 (+90), 15315 (+81), 17265 (+72) |
| Women's health / OB-GYN | 60 | 23,571.6 | 0.53 | 0.70 | 745 of 1820 | 17730 (-63), 16748 (-61), 17756 (-54) | 17265 (+86), 18443 (+76), 18405 (+68) |
| Mental health & counseling | 30 | 307,767.8 | 7.20 | 0.83 | 399 of 1820 | 19108 (-47), 15473 (-42), 15482 (-40) | 15470 (+70), 15545 (+63), 17265 (+63) |
| Dental | 30 | 64,165.2 | 1.65 | 0.81 | 324 of 1820 | 19108 (-47), 15282 (-42), 16746 (-33) | 17265 (+98), 15315 (+59), 19541 (+52) |
| Eye care | 30 | 26,163 | 0.62 | 0.74 | 551 of 1820 | 15736 (-59), 16319 (-50), 19108 (-48) | 18818 (+86), 17265 (+75), 15315 (+74) |
| Chiropractic | 30 | 21,896.4 | 0.63 | 0.74 | 618 of 1820 | 15282 (-43), 16915 (-38), 15734 (-37) | 17265 (+95), 15682 (+76), 15470 (+72) |
| Physical & occupational therapy | 30 | 130,934.4 | 2.70 | 0.71 | 653 of 1820 | 19108 (-64), 16915 (-54), 18616 (-49) | 17265 (+95), 15677 (+82), 16374 (+81) |
| Orthopedics & sports injury | 60 | 16,247.8 | 0.39 | 0.61 | 906 of 1820 | 16841 (-81), 17730 (-78), 16686 (-75) | 15447 (+72), 17265 (+71), 16155 (+70) |
| Heart / cardiology | 60 | 12,216.4 | 0.24 | 0.70 | 987 of 1820 | 17730 (-91), 17552 (-85), 17570 (-83) | 17265 (+85), 17244 (+73), 16025 (+71) |
| Skin / dermatology | 60 | 4,244.4 | 0.09 | 0.72 | 851 of 1820 | 17730 (-79), 17749 (-79), 17772 (-76) | 17265 (+90), 17322 (+78), 18850 (+78) |
| Allergy & immunology | 60 | 1,681.2 | 0.03 | 0.67 | 1094 of 1820 | 15925 (-88), 17570 (-87), 17552 (-85) | 16111 (+92), 16130 (+88), 16114 (+87) |
| Lung, breathing & sleep | 60 | 5,081.6 | 0.13 | 0.64 | 930 of 1820 | 15460 (-61), 15338 (-60), 17552 (-60) | 17265 (+86), 16025 (+75), 16061 (+75) |
| Digestive / gastroenterology | 60 | 5,879.4 | 0.11 | 0.65 | 1078 of 1820 | 16748 (-100), 17730 (-100), 17772 (-100) | 18443 (+88), 17265 (+87), 18405 (+78) |
| Kidney / nephrology | 60 | 4,739.6 | 0.11 | 0.66 | 996 of 1820 | 15547 (-99), 15531 (-93), 17730 (-90) | 17265 (+88), 18229 (+87), 16259 (+85) |
| Diabetes & hormones | 60 | 3,214.8 | 0.06 | 0.69 | 972 of 1820 | 17570 (-97), 17552 (-94), 15338 (-89) | 17265 (+85), 17244 (+76), 17304 (+71) |
| Cancer care / oncology | 90 | 7,366 | 0.15 | 0.55 | 1362 of 1820 | 19543 (-87), 18912 (-71), 17570 (-67) | 17265 (+83), 16364 (+81), 17054 (+77) |
| Arthritis / rheumatology | 60 | 1,832 | 0.04 | 0.69 | 1024 of 1820 | 17730 (-100), 17756 (-100), 17772 (-100) | 16259 (+89), 16210 (+85), 17265 (+83) |
| Brain & nerves / neurology | 60 | 9,290.8 | 0.22 | 0.69 | 851 of 1820 | 17730 (-97), 17772 (-92), 17756 (-84) | 17265 (+88), 18817 (+62), 17244 (+61) |
| Ear, nose & throat | 60 | 2,853.4 | 0.07 | 0.57 | 1122 of 1820 | 16730 (-100), 16743 (-100), 16748 (-100) | 18831 (+79), 18850 (+79), 18817 (+77) |
| Urology | 60 | 3,392.6 | 0.07 | 0.61 | 1061 of 1820 | 16743 (-100), 16748 (-100), 16922 (-100) | 16259 (+86), 17265 (+85), 16374 (+80) |
| Foot & ankle / podiatry | 60 | 9,414.8 | 0.15 | 0.65 | 937 of 1820 | 16412 (-83), 16667 (-80), 16682 (-78) | 15364 (+82), 15359 (+79), 17265 (+79) |
| Pain management | 60 | 3,949.6 | 0.09 | 0.60 | 873 of 1820 | 15938 (-76), 15948 (-74), 15925 (-73) | 17265 (+85), 15364 (+83), 15359 (+78) |
| Plastic & reconstructive surgery | 90 | 3,032.6 | 0.07 | 0.62 | 1234 of 1820 | 19543 (-69), 18935 (-53), 19320 (-53) | 15533 (+77), 15961 (+77), 16720 (+76) |
| Speech & language therapy | 30 | 44,362.8 | 0.90 | 0.77 | 422 of 1820 | 16726 (-53), 18616 (-47), 18619 (-45) | 16374 (+98), 16364 (+84), 17265 (+80) |
| Nutrition & dietitian | 30 | 14,882.8 | 0.33 | 0.83 | 550 of 1820 | 17847 (-62), 17749 (-60), 17850 (-58) | 17860 (+89), 16364 (+87), 16669 (+84) |
| Acupuncture, massage & naturopathy | 30 | 16,745.2 | 0.52 | 0.83 | 128 of 1820 | 18229 (-76), 18337 (-37), 17088 (-27) | 18440 (+62), 17505 (+42), 15078 (+39) |
| Urgent care & emergency | 30 | 18,388.4 | 0.47 | 0.77 | 600 of 1820 | 15531 (-63), 15736 (-59), 15547 (-58) | 17723 (+100), 17729 (+100), 17769 (+100) |
| Imaging & lab | 60 | 19,464 | 0.49 | 0.62 | 896 of 1820 | 17730 (-93), 17772 (-85), 17756 (-84) | 17265 (+90), 16374 (+72), 16364 (+66) |
| Pharmacy | 30 | 76,745.6 | 1.72 | 0.74 | 560 of 1820 | 16689 (-73), 17847 (-63), 17850 (-57) | 17265 (+79), 15315 (+78), 17860 (+64) |
| Home health & in-home care | 30 | 79,018.4 | 1.61 | 0.88 | 114 of 1820 | 15323 (-48), 15478 (-42), 15337 (-38) | 17211 (+100), 17267 (+92), 15021 (+76) |
| Nursing & assisted living | 60 | 12,098.2 | 0.39 | 0.50 | 705 of 1820 | 17827 (-72), 17821 (-65), 17822 (-65) | 17217 (+80), 17213 (+76), 16155 (+73) |
| Medical equipment & supplies | 60 | 13,435.2 | 0.36 | 0.68 | 536 of 1820 | 17730 (-57), 17772 (-46), 17756 (-45) | 17265 (+58), 18443 (+48), 16155 (+46) |
| Hearing & audiology | 60 | 7,568 | 0.19 | 0.58 | 1027 of 1820 | 16686 (-84), 17730 (-84), 16743 (-78) | 17265 (+85), 16259 (+82), 16263 (+78) |
| Behavior therapy (ABA) | 30 | 60,836.4 | 2.88 | 0.90 | 94 of 1820 | 15642 (-41), 15647 (-35), 17868 (-31) | 15695 (+82), 15089 (+66), 15640 (+58) |
| Care coordination & community health | 30 | 74,340.8 | 1.63 | 0.82 | 188 of 1820 | 15282 (-33), 15370 (-27), 15357 (-26) | 15961 (+88), 16155 (+81), 15315 (+75) |
| General surgery | 60 | 15,722.2 | 0.35 | 0.62 | 1053 of 1820 | 17730 (-89), 17772 (-89), 17756 (-86) | 17265 (+89), 16155 (+74), 16938 (+60) |
| Infectious disease | 90 | 2,750.8 | 0.05 | 0.62 | 1322 of 1820 | 19543 (-86), 19021 (-74), 19020 (-72) | 17265 (+88), 16235 (+79), 16334 (+78) |
| Genetics & genetic counseling | 90 | 1,653.6 | 0.03 | 0.56 | 967 of 1820 | 15347 (-100), 17005 (-100), 17045 (-100) | 18812 (+78), 17509 (+72), 18011 (+64) |
| Hospice & palliative care | 60 | 1,824.4 | 0.09 | 0.68 | 726 of 1820 | 17730 (-64), 17756 (-60), 17749 (-55) | 17265 (+87), 15422 (+73), 18440 (+73) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Pennsylvania in households with no vehicle: about 1,066,959 of 10,353,504 (10.3%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 18
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.99 | 33 of 1820 | 16654 (+58), 19102 (+40), 19107 (+38) | 1.00 |
| Pediatrics (children) | 0.99 | 19 of 1820 | 16654 (+28), 17101 (+26), 17865 (+23) | 1.00 |
| Women's health / OB-GYN | 0.98 | 32 of 1820 | 19102 (+40), 19107 (+39), 19103 (+35) | 1.00 |
| Mental health & counseling | 0.99 | 26 of 1820 | 16654 (+37), 16155 (+30), 16501 (+29) | 1.00 |
| Dental | 0.99 | 25 of 1820 | 16654 (+30), 19102 (+28), 19107 (+28) | 1.00 |
| Eye care | 0.98 | 34 of 1820 | 16654 (+63), 16802 (+30), 16501 (+29) | 1.00 |
| Chiropractic | 0.98 | 30 of 1820 | 15072 (+56), 16802 (+43), 16501 (+41) | 1.00 |
| Physical & occupational therapy | 0.98 | 37 of 1820 | 16654 (+64), 17943 (+41), 15072 (+36) | 1.00 |
| Orthopedics & sports injury | 0.97 | 45 of 1820 | 17943 (+41), 15072 (+40), 16155 (+40) | 1.00 |
| Heart / cardiology | 0.99 | 38 of 1820 | 17943 (+41), 19102 (+37), 19107 (+35) | 1.00 |
| Skin / dermatology | 0.99 | 42 of 1820 | 17943 (+45), 19102 (+41), 19107 (+39) | 1.00 |
| Allergy & immunology | 0.99 | 33 of 1820 | 17943 (+43), 16654 (+34), 17101 (+31) | 1.00 |
| Lung, breathing & sleep | 0.99 | 27 of 1820 | 19107 (+35), 19102 (+34), 17943 (+33) | 1.00 |
| Digestive / gastroenterology | 0.99 | 41 of 1820 | 17943 (+71), 16802 (+37), 19102 (+35) | 1.00 |
| Kidney / nephrology | 0.98 | 38 of 1820 | 17943 (+52), 19102 (+39), 19107 (+38) | 1.00 |
| Diabetes & hormones | 0.99 | 41 of 1820 | 19102 (+41), 19107 (+40), 17943 (+35) | 1.00 |
| Cancer care / oncology | 0.98 | 37 of 1820 | 17943 (+47), 15072 (+42), 19102 (+31) | 1.00 |
| Arthritis / rheumatology | 0.99 | 22 of 1820 | 17943 (+51), 16501 (+30), 17606 (+30) | 1.00 |
| Brain & nerves / neurology | 0.99 | 30 of 1820 | 17943 (+50), 19102 (+35), 19107 (+35) | 1.00 |
| Ear, nose & throat | 0.98 | 36 of 1820 | 17943 (+68), 19102 (+35), 19107 (+35) | 1.00 |
| Urology | 0.98 | 37 of 1820 | 17943 (+54), 19102 (+41), 19107 (+39) | 1.00 |
| Foot & ankle / podiatry | 0.98 | 43 of 1820 | 16155 (+68), 16501 (+41), 19102 (+40) | 1.00 |
| Pain management | 0.98 | 30 of 1820 | 16802 (+38), 19102 (+37), 16501 (+36) | 1.00 |
| Plastic & reconstructive surgery | 0.98 | 26 of 1820 | 19102 (+33), 15072 (+32), 19107 (+32) | 1.00 |
| Speech & language therapy | 0.99 | 18 of 1820 | 16654 (+40), 16155 (+32), 17943 (+30) | 1.00 |
| Nutrition & dietitian | 0.99 | 29 of 1820 | 16654 (+87), 16802 (+46), 19102 (+34) | 1.00 |
| Acupuncture, massage & naturopathy | 0.99 | 4 of 1820 | 17606 (+32), 17505 (+21), 16802 (+18) | 1.00 |
| Urgent care & emergency | 0.99 | 31 of 1820 | 16654 (+70), 17943 (+35), 19102 (+31) | 1.00 |
| Imaging & lab | 0.98 | 29 of 1820 | 17943 (+53), 19102 (+33), 19107 (+32) | 1.00 |
| Pharmacy | 0.98 | 31 of 1820 | 16654 (+42), 17943 (+42), 16501 (+39) | 1.00 |
| Home health & in-home care | 0.99 | 18 of 1820 | 16155 (+69), 19102 (+36), 19107 (+34) | 1.00 |
| Nursing & assisted living | 0.97 | 21 of 1820 | 16155 (+71), 17943 (+43), 19102 (+35) | 1.00 |
| Medical equipment & supplies | 0.97 | 27 of 1820 | 16155 (+36), 17943 (+33), 19102 (+33) | 1.00 |
| Hearing & audiology | 0.97 | 32 of 1820 | 17943 (+48), 16155 (+38), 15072 (+32) | 1.00 |
| Behavior therapy (ABA) | 0.99 | 3 of 1820 | 16155 (+20), 15110 (+16), 17101 (+15) | 1.00 |
| Care coordination & community health | 0.99 | 10 of 1820 | 16155 (+50), 16501 (+23), 16654 (+20) | 1.00 |
| General surgery | 0.98 | 35 of 1820 | 17943 (+50), 19102 (+36), 19107 (+35) | 1.00 |
| Infectious disease | 0.99 | 33 of 1820 | 15072 (+41), 17943 (+39), 19102 (+34) | 1.00 |
| Genetics & genetic counseling | 0.99 | 22 of 1820 | 17943 (+84), 15072 (+47), 17750 (+42) | 1.00 |
| Hospice & palliative care | 0.98 | 17 of 1820 | 17943 (+28), 15072 (+27), 19102 (+23) | 1.00 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 88 of 1817 | 106,973 (1.0%) | 10/244 | 68/1040 | 8/338 | 2/195 |  |
| Women's health / OB-GYN | 016 | 1 of 1817 | 11,977 (0.1%) | 0/244 | 1/1040 | 0/338 | 0/195 |  |
| Mental health & counseling: Psychiatry | 029 | 14 of 1817 | 20,158 (0.2%) | 0/244 | 10/1040 | 4/338 | 0/195 |  |
| Mental health & counseling: Clinical Psychology | 036 | 4 of 1817 | 12,325 (0.1%) | 0/244 | 2/1040 | 0/338 | 2/195 |  |
| Mental health & counseling: Clinical Social Work | 037 | 15 of 1817 | 22,503 (0.2%) | 0/244 | 14/1040 | 1/338 | 0/195 |  |
| Eye care | 023 | 21 of 1817 | 33,325 (0.3%) | 0/244 | 17/1040 | 4/338 | 0/195 |  |
| Chiropractic | 010 | 1 of 1817 | 111 (0.0%) | 0/244 | 1/1040 | 0/338 | 0/195 |  |
| Physical & occupational therapy | F049 | 1 of 1817 | 11,977 (0.1%) | 0/244 | 1/1040 | 0/338 | 0/195 |  |
| Orthopedics & sports injury | 025 | 18 of 1817 | 26,206 (0.3%) | 0/244 | 16/1040 | 2/338 | 0/195 |  |
| Heart / cardiology | 008 | 128 of 1817 | 198,241 (1.9%) | 0/244 | 117/1040 | 11/338 | 0/195 |  |
| Skin / dermatology | 011 | 50 of 1817 | 70,947 (0.7%) | 4/244 | 23/1040 | 10/338 | 13/195 |  |
| Allergy & immunology | 007 | 46 of 1817 | 60,423 (0.6%) | 0/244 | 41/1040 | 0/338 | 5/195 |  |
| Lung, breathing & sleep | 030 | 29 of 1817 | 32,891 (0.3%) | 2/244 | 18/1040 | 7/338 | 2/195 |  |
| Digestive / gastroenterology | 014 | 29 of 1817 | 41,945 (0.4%) | 6/244 | 17/1040 | 5/338 | 1/195 |  |
| Kidney / nephrology | 018 | 5 of 1817 | 13,775 (0.1%) | 0/244 | 5/1040 | 0/338 | 0/195 |  |
| Diabetes & hormones | 012 | 7 of 1817 | 7,121 (0.1%) | 0/244 | 7/1040 | 0/338 | 0/195 |  |
| Cancer care / oncology | 021 | 42 of 1817 | 42,547 (0.4%) | 4/244 | 23/1040 | 14/338 | 1/195 |  |
| Arthritis / rheumatology | 031 | 9 of 1817 | 6,226 (0.1%) | 0/244 | 9/1040 | 0/338 | 0/195 |  |
| Brain & nerves / neurology | 019 | 32 of 1817 | 45,842 (0.4%) | 6/244 | 10/1040 | 9/338 | 7/195 |  |
| Ear, nose & throat | 013 | 30 of 1817 | 48,290 (0.5%) | 0/244 | 30/1040 | 0/338 | 0/195 |  |
| Urology | 033 | 28 of 1817 | 55,236 (0.5%) | 3/244 | 20/1040 | 5/338 | 0/195 |  |
| Foot & ankle / podiatry | 028 | 3 of 1817 | 13,331 (0.1%) | 0/244 | 3/1040 | 0/338 | 0/195 |  |
| Plastic & reconstructive surgery | 027 | 4 of 1817 | 3,968 (0.0%) | 0/244 | 4/1040 | 0/338 | 0/195 |  |
| Speech & language therapy | F051 | 1 of 1817 | 11,977 (0.1%) | 0/244 | 1/1040 | 0/338 | 0/195 |  |
| Imaging & lab | F047 | 4 of 1817 | 13,165 (0.1%) | 0/244 | 4/1040 | 0/338 | 0/195 |  |
| Nursing & assisted living | F046 | 2 of 1817 | 12,850 (0.1%) | 0/244 | 2/1040 | 0/338 | 0/195 |  |
| General surgery | 015 | 85 of 1817 | 109,559 (1.1%) | 2/244 | 79/1040 | 4/338 | 0/195 |  |
| Infectious disease | 017 | 18 of 1817 | 18,754 (0.2%) | 0/244 | 12/1040 | 0/338 | 6/195 |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 72800 rows (ZIP x specialty) stored in access_e2sfca for PA; market-score now uses drive-time access for these ZIPs.
