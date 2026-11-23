# E2SFCA access dry run: Rhode Island

Run 2026-11-23 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 868; in Rhode Island: 81
- Drive times: OSRM on OpenStreetMap roads (car profile), 868 x 868 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 348,209.801; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.88 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.21), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 8; re-anchored: 3; still implausible (left out of the rank comparison, still stored, marked in the CSV): 5 (02652, 02657, 02666, 02667, 06390)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 02109 | no | 9.20 | 100% | 4.27 | 100% | yes (0.51) |
| 02575 | no | 7.95 | 100% | 4.49 | 100% | yes (1.48) |
| 02652 | no | 2.40 | 25% | 2.40 | 25% | no |
| 02657 | no | 2.26 | 25% | 2.26 | 25% | no |
| 02666 | no | 2.31 | 25% | 2.31 | 25% | no |
| 02667 | no | 2.26 | 25% | 2.26 | 25% | no |
| 02872 | yes | 9.04 | 100% | 3.14 | 100% | yes (2.18) |
| 06390 | no | 8.29 | 100% | 8.29 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 41,004.201 | 4.30 | 0.74 | 20 of 81 | 02916 (-17), 02914 (-14), 02865 (-11) | 02912 (+50), 02822 (+33), 02809 (+32) |
| Pediatrics (children) | 30 | 17,950.6 | 1.11 | 0.72 | 22 of 81 | 02895 (-72), 02824 (-67), 02876 (-67) | 02912 (+47), 02807 (+41), 02885 (+39) |
| Women's health / OB-GYN | 60 | 5,744.4 | 0.53 | 0.40 | 56 of 81 | 02824 (-53), 02876 (-52), 02814 (-39) | 02912 (+81), 02807 (+73), 02882 (+46) |
| Mental health & counseling | 30 | 104,301.6 | 7.20 | 0.75 | 26 of 81 | 02916 (-28), 02914 (-24), 02895 (-23) | 02912 (+63), 02809 (+51), 02807 (+49) |
| Dental | 30 | 18,591 | 1.65 | 0.51 | 18 of 81 | 02914 (-16), 02916 (-15), 02909 (-12) | 02807 (+46), 02837 (+46), 02912 (+41) |
| Eye care | 30 | 6,031.8 | 0.62 | 0.59 | 25 of 81 | 02916 (-21), 02871 (-20), 02914 (-20) | 02807 (+60), 02912 (+53), 02837 (+37) |
| Chiropractic | 30 | 4,131.8 | 0.63 | 0.57 | 10 of 81 | 02914 (-14), 02916 (-13), 02909 (-9) | 02807 (+39), 02837 (+36), 02912 (+34) |
| Physical & occupational therapy | 30 | 31,207.8 | 2.70 | 0.46 | 30 of 81 | 02824 (-59), 02876 (-59), 02895 (-57) | 02912 (+55), 02837 (+39), 02822 (+36) |
| Orthopedics & sports injury | 60 | 3,642.4 | 0.39 | 0.28 | 24 of 81 | 02807 (-50), 02832 (-31), 02873 (-29) | 02912 (+51), 02813 (+38), 02837 (+33) |
| Heart / cardiology | 60 | 2,492.6 | 0.24 | 0.72 | 30 of 81 | 02825 (-35), 02832 (-31), 02815 (-29) | 02912 (+53), 02807 (+36), 02885 (+32) |
| Skin / dermatology | 60 | 1,147.6 | 0.09 | 0.30 | 45 of 81 | 02824 (-61), 02876 (-60), 02832 (-51) | 02874 (+56), 02837 (+53), 02912 (+53) |
| Allergy & immunology | 60 | 353 | 0.03 | 0.58 | 53 of 81 | 02804 (-45), 02832 (-43), 02858 (-38) | 02872 (+58), 02852 (+52), 02912 (+49) |
| Lung, breathing & sleep | 60 | 1,111.8 | 0.13 | 0.62 | 29 of 81 | 02873 (-34), 02814 (-26), 02832 (-26) | 02912 (+53), 02807 (+50), 02809 (+28) |
| Digestive / gastroenterology | 60 | 1,242.4 | 0.11 | 0.55 | 63 of 81 | 02824 (-57), 02876 (-56), 02895 (-50) | 02912 (+87), 02831 (+47), 02893 (+47) |
| Kidney / nephrology | 60 | 800.2 | 0.11 | 0.43 | 33 of 81 | 02824 (-31), 02876 (-30), 02832 (-29) | 02807 (+62), 02912 (+44), 02813 (+36) |
| Diabetes & hormones | 60 | 920.2 | 0.06 | 0.79 | 26 of 81 | 02873 (-76), 02832 (-67), 02898 (-60) | 02912 (+75), 02807 (+53), 02837 (+41) |
| Cancer care / oncology | 90 | 1,831.8 | 0.15 | 0.53 | 42 of 81 | 02824 (-51), 02876 (-50), 02895 (-48) | 02912 (+62), 02823 (+51), 02807 (+49) |
| Arthritis / rheumatology | 60 | 479.6 | 0.04 | 0.30 | 65 of 81 | 02858 (-49), 02814 (-48), 02832 (-48) | 02912 (+71), 02807 (+62), 02808 (+62) |
| Brain & nerves / neurology | 60 | 2,486.8 | 0.22 | 0.57 | 52 of 81 | 02832 (-34), 02824 (-32), 02825 (-31) | 02912 (+58), 02885 (+49), 02823 (+45) |
| Ear, nose & throat | 60 | 609 | 0.07 | 0.15 | 29 of 81 | 02832 (-37), 02873 (-34), 02814 (-27) | 02807 (+81), 02813 (+41), 02912 (+39) |
| Urology | 60 | 730.6 | 0.07 | 0.30 | 44 of 81 | 02824 (-54), 02876 (-54), 02832 (-50) | 02807 (+78), 02912 (+62), 02813 (+44) |
| Foot & ankle / podiatry | 60 | 1,187.6 | 0.15 | 0.39 | 26 of 81 | 02832 (-41), 02873 (-37), 02825 (-19) | 02807 (+81), 02912 (+56), 02872 (+35) |
| Pain management | 60 | 431.4 | 0.09 | 0.11 | 17 of 81 | 02832 (-18), 02898 (-17), 02812 (-16) | 02807 (+32), 02891 (+26), 02808 (+25) |
| Plastic & reconstructive surgery | 90 | 543 | 0.07 | 0.30 | 45 of 81 | 02824 (-47), 02876 (-47), 02858 (-41) | 02885 (+55), 02912 (+49), 02823 (+48) |
| Speech & language therapy | 30 | 6,898.6 | 0.90 | 0.55 | 22 of 81 | 02916 (-14), 02914 (-13), 02838 (-11) | 02807 (+42), 02912 (+42), 02822 (+30) |
| Nutrition & dietitian | 30 | 3,961 | 0.33 | 0.78 | 32 of 81 | 02824 (-26), 02838 (-23), 02876 (-23) | 02912 (+73), 02807 (+69), 02837 (+51) |
| Acupuncture, massage & naturopathy | 30 | 4,143 | 0.52 | 0.55 | 11 of 81 | 02824 (-13), 02857 (-13), 02876 (-12) | 02827 (+40), 02837 (+32), 02822 (+31) |
| Urgent care & emergency | 30 | 3,769.2 | 0.47 | 0.71 | 27 of 81 | 02895 (-25), 02824 (-23), 02876 (-21) | 02807 (+67), 02885 (+54), 02809 (+53) |
| Imaging & lab | 60 | 4,525 | 0.49 | 0.62 | 22 of 81 | 02832 (-26), 02873 (-23), 02824 (-21) | 02912 (+43), 02885 (+34), 02823 (+25) |
| Pharmacy | 30 | 13,869.6 | 1.72 | 0.61 | 23 of 81 | 02914 (-19), 02916 (-16), 02918 (-16) | 02807 (+54), 02912 (+48), 02837 (+32) |
| Home health & in-home care | 30 | 5,726.8 | 1.61 | 0.79 | 1 of 81 | 02824 (-6), 02864 (-6), 02802 (-5) | 02912 (+19), 02831 (+14), 02885 (+11) |
| Nursing & assisted living | 60 | 2,585 | 0.39 | 0.21 | 22 of 81 | 02861 (-17), 02865 (-17), 02916 (-15) | 02912 (+44), 02878 (+29), 02807 (+28) |
| Medical equipment & supplies | 60 | 2,022.4 | 0.36 | 0.36 | 17 of 81 | 02832 (-32), 02873 (-30), 02898 (-20) | 02912 (+37), 02807 (+30), 02818 (+24) |
| Hearing & audiology | 60 | 1,676.6 | 0.19 | -0.11 | 41 of 81 | 02858 (-33), 02864 (-33), 02838 (-31) | 02807 (+48), 02912 (+48), 02852 (+41) |
| Behavior therapy (ABA) | 30 | 21,303 | 2.88 | 0.83 | 7 of 81 | 02916 (-14), 02857 (-10), 02911 (-10) | 02912 (+30), 02809 (+26), 02872 (+19) |
| Care coordination & community health | 30 | 13,511.8 | 1.63 | 0.82 | 7 of 81 | 02914 (-18), 02916 (-16), 02824 (-15) | 02912 (+33), 02809 (+26), 02831 (+20) |
| General surgery | 60 | 3,002 | 0.35 | 0.53 | 35 of 81 | 02825 (-32), 02832 (-32), 02873 (-31) | 02912 (+48), 02807 (+38), 02823 (+29) |
| Infectious disease | 90 | 674.4 | 0.05 | 0.58 | 53 of 81 | 02824 (-62), 02876 (-61), 02895 (-56) | 02912 (+80), 02886 (+49), 02889 (+48) |
| Genetics & genetic counseling | 90 | 459.4 | 0.03 | 0.58 | 33 of 81 | 02838 (-74), 02824 (-70), 02876 (-68) | 02823 (+56), 02912 (+43), 02885 (+40) |
| Hospice & palliative care | 60 | 383.8 | 0.09 | 0.33 | 17 of 81 | 02824 (-32), 02876 (-31), 02895 (-27) | 02807 (+32), 02912 (+32), 02809 (+23) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## People without a car

The stored figure (`e2sfca` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).

- Adults in Rhode Island in households with no vehicle: about 84,291 of 887,662 (9.5%)
- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): 0
- Sensitivity check: the same split with the no-car group at 2.5x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.

| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |
|---|---|---|---|---|
| Primary care / family doctor | 0.92 | 2 of 81 | 02912 (+61), 02903 (+18), 02863 (+14) | 0.99 |
| Pediatrics (children) | 0.96 | 3 of 81 | 02912 (+57), 02863 (+15), 02903 (+15) | 0.99 |
| Women's health / OB-GYN | 0.88 | 3 of 81 | 02912 (+65), 02903 (+19), 02863 (+15) | 0.99 |
| Mental health & counseling | 0.92 | 3 of 81 | 02912 (+79), 02903 (+27), 02863 (+17) | 0.99 |
| Dental | 0.90 | 2 of 81 | 02912 (+52), 02903 (+17), 02863 (+11) | 1.00 |
| Eye care | 0.91 | 2 of 81 | 02912 (+63), 02903 (+20), 02863 (+13) | 1.00 |
| Chiropractic | 0.91 | 1 of 81 | 02912 (+42), 02903 (+14), 02863 (+8) | 1.00 |
| Physical & occupational therapy | 0.91 | 2 of 81 | 02912 (+65), 02903 (+21), 02863 (+14) | 1.00 |
| Orthopedics & sports injury | 0.89 | 2 of 81 | 02912 (+50), 02903 (+15), 02863 (+12) | 0.99 |
| Heart / cardiology | 0.90 | 1 of 81 | 02912 (+41), 02903 (+12), 02863 (+11) | 0.99 |
| Skin / dermatology | 0.90 | 2 of 81 | 02912 (+55), 02903 (+17), 02863 (+14) | 1.00 |
| Allergy & immunology | 0.91 | 1 of 81 | 02912 (+45), 02903 (+14), 02863 (+12) | 1.00 |
| Lung, breathing & sleep | 0.89 | 1 of 81 | 02912 (+42), 02903 (+12), 02863 (+10) | 0.99 |
| Digestive / gastroenterology | 0.89 | 3 of 81 | 02912 (+61), 02903 (+18), 02863 (+15) | 0.99 |
| Kidney / nephrology | 0.90 | 1 of 81 | 02912 (+34), 02903 (+11), 02863 (+9) | 0.99 |
| Diabetes & hormones | 0.93 | 1 of 81 | 02912 (+75), 02863 (+5), 02808 (+4) | 0.98 |
| Cancer care / oncology | 0.93 | 3 of 81 | 02912 (+54), 02863 (+16), 02903 (+15) | 1.00 |
| Arthritis / rheumatology | 0.91 | 2 of 81 | 02912 (+58), 02903 (+18), 02863 (+13) | 0.99 |
| Brain & nerves / neurology | 0.90 | 1 of 81 | 02912 (+34), 02863 (+12), 02903 (+9) | 0.99 |
| Ear, nose & throat | 0.82 | 1 of 81 | 02912 (+36), 02903 (+11), 02863 (+8) | 0.98 |
| Urology | 0.90 | 3 of 81 | 02912 (+60), 02903 (+19), 02863 (+15) | 0.99 |
| Foot & ankle / podiatry | 0.87 | 2 of 81 | 02912 (+57), 02903 (+18), 02863 (+13) | 0.99 |
| Pain management | 0.90 | 1 of 81 | 02912 (+21), 02903 (+7), 02863 (+5) | 0.99 |
| Plastic & reconstructive surgery | 0.92 | 1 of 81 | 02912 (+38), 02903 (+11), 02863 (+10) | 1.00 |
| Speech & language therapy | 0.91 | 2 of 81 | 02912 (+51), 02903 (+16), 02863 (+11) | 1.00 |
| Nutrition & dietitian | 0.93 | 2 of 81 | 02912 (+79), 02863 (+21), 02903 (+12) | 0.99 |
| Acupuncture, massage & naturopathy | 0.91 | 1 of 81 | 02912 (+40), 02903 (+14), 02863 (+9) | 0.99 |
| Urgent care & emergency | 0.96 | 3 of 81 | 02912 (+58), 02863 (+16), 02903 (+15) | 1.00 |
| Imaging & lab | 0.90 | 1 of 81 | 02912 (+32), 02903 (+10), 02863 (+9) | 0.99 |
| Pharmacy | 0.92 | 2 of 81 | 02912 (+64), 02903 (+21), 02863 (+13) | 1.00 |
| Home health & in-home care | 0.92 | 1 of 81 | 02912 (+22), 02903 (+7), 02863 (+5) | 0.98 |
| Nursing & assisted living | 0.88 | 2 of 81 | 02912 (+53), 02903 (+17), 02863 (+12) | 1.00 |
| Medical equipment & supplies | 0.88 | 1 of 81 | 02912 (+40), 02903 (+12), 02863 (+9) | 0.99 |
| Hearing & audiology | 0.86 | 2 of 81 | 02912 (+53), 02903 (+16), 02863 (+11) | 0.99 |
| Behavior therapy (ABA) | 0.95 | 1 of 81 | 02912 (+33), 02903 (+9), 02863 (+8) | 1.00 |
| Care coordination & community health | 0.92 | 1 of 81 | 02912 (+43), 02903 (+14), 02863 (+8) | 0.98 |
| General surgery | 0.89 | 1 of 81 | 02912 (+35), 02903 (+10), 02863 (+9) | 0.99 |
| Infectious disease | 0.93 | 3 of 81 | 02912 (+58), 02863 (+18), 02903 (+17) | 1.00 |
| Genetics & genetic counseling | 0.96 | 3 of 81 | 02912 (+55), 02863 (+17), 02903 (+16) | 1.00 |
| Hospice & palliative care | 0.91 | 1 of 81 | 02912 (+28), 02903 (+9), 02863 (+6) | 0.99 |

A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.

## Travel burden against CMS Medicare Advantage limits

Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP's pinned listings in the specialty, the 8 nearest by straight line routed on roads), against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP's main county. The CMS limit applies to a plan's network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.

- Counties not matched by name to the HSD file: 0

| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 6 of 81 | 16,967 (1.9%) | 3/42 | 3/39 |  |  |  |
| Women's health / OB-GYN | 016 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Mental health & counseling: Psychiatry | 029 | 4 of 81 | 12,839 (1.4%) | 3/42 | 1/39 |  |  |  |
| Mental health & counseling: Clinical Psychology | 036 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Mental health & counseling: Clinical Social Work | 037 | 2 of 81 | 1,426 (0.2%) | 0/42 | 2/39 |  |  |  |
| Eye care | 023 | 2 of 81 | 1,426 (0.2%) | 0/42 | 2/39 |  |  |  |
| Chiropractic | 010 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Physical & occupational therapy | F049 | 0 of 81 | 0 (0.0%) | 0/42 | 0/39 |  |  |  |
| Orthopedics & sports injury | 025 | 1 of 81 | 205 (0.0%) | 0/42 | 1/39 |  |  |  |
| Heart / cardiology | 008 | 5 of 81 | 11,207 (1.3%) | 3/42 | 2/39 |  |  |  |
| Skin / dermatology | 011 | 6 of 81 | 17,419 (2.0%) | 5/42 | 1/39 |  |  |  |
| Allergy & immunology | 007 | 2 of 81 | 1,426 (0.2%) | 0/42 | 2/39 |  |  |  |
| Lung, breathing & sleep | 030 | 2 of 81 | 1,402 (0.2%) | 1/42 | 1/39 |  |  |  |
| Digestive / gastroenterology | 014 | 5 of 81 | 17,149 (1.9%) | 4/42 | 1/39 |  |  |  |
| Kidney / nephrology | 018 | 2 of 81 | 1,426 (0.2%) | 0/42 | 2/39 |  |  |  |
| Diabetes & hormones | 012 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Cancer care / oncology | 021 | 4 of 81 | 5,917 (0.7%) | 2/42 | 2/39 |  |  |  |
| Arthritis / rheumatology | 031 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Brain & nerves / neurology | 019 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Ear, nose & throat | 013 | 2 of 81 | 1,426 (0.2%) | 0/42 | 2/39 |  |  |  |
| Urology | 033 | 5 of 81 | 17,149 (1.9%) | 4/42 | 1/39 |  |  |  |
| Foot & ankle / podiatry | 028 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Plastic & reconstructive surgery | 027 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Speech & language therapy | F051 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Imaging & lab | F047 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| Nursing & assisted living | F046 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |
| General surgery | 015 | 5 of 81 | 7,701 (0.9%) | 2/42 | 3/39 |  |  |  |
| Infectious disease | 017 | 1 of 81 | 1,221 (0.1%) | 0/42 | 1/39 |  |  |  |

Designation cells are ZIPs over the limit out of ZIPs of that county type.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.

## Applied 2026-11-23

- 3240 rows (ZIP x specialty) stored in access_e2sfca for RI; market-score now uses drive-time access for these ZIPs.
