# E2SFCA access dry run: Montana

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 660; in Montana: 345
- Drive times: OSRM on OpenStreetMap roads (car profile), 660 x 660 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 78,255; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.24 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.11), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 3; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 3 (83808, 97828, 97842)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 83808 | no | 9.88 | 100% | 9.88 | 100% | no |
| 97828 | no | 8.58 | 100% | 8.58 | 100% | no |
| 97842 | no | 10.40 | 100% | 10.40 | 100% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 11,361 | 4.78 | 0.37 | 217 of 345 | 59086 (-44), 59405 (-44), 59601 (-44) | 59713 (+92), 59006 (+90), 59421 (+87) |
| Pediatrics (children) | 30 | 1,683 | 1.13 | 0.50 | 118 of 345 | 59721 (-91), 59343 (-61), 59804 (-54) | 59077 (+100), 59345 (+100), 59351 (+100) |
| Women's health / OB-GYN | 60 | 1,259 | 0.55 | 0.64 | 132 of 345 | 59853 (-81), 59752 (-53), 59875 (-53) | 59066 (+100), 59820 (+100), 59846 (+100) |
| Mental health & counseling | 30 | 19,196 | 7.13 | 0.45 | 195 of 345 | 59343 (-94), 59732 (-81), 59071 (-71) | 59018 (+100), 59025 (+100), 59631 (+100) |
| Dental | 30 | 3,894 | 1.64 | 0.47 | 205 of 345 | 59643 (-40), 59865 (-40), 59834 (-39) | 59222 (+100), 59253 (+100), 59713 (+100) |
| Eye care | 30 | 1,601 | 0.65 | 0.41 | 169 of 345 | 59840 (-41), 59601 (-40), 59716 (-40) | 59026 (+100), 59063 (+100), 59416 (+100) |
| Chiropractic | 30 | 2,214 | 0.64 | 0.46 | 188 of 345 | 59644 (-57), 59479 (-53), 59027 (-49) | 59026 (+100), 59052 (+100), 59063 (+100) |
| Physical & occupational therapy | 30 | 7,461 | 2.73 | 0.46 | 181 of 345 | 59843 (-79), 59532 (-77), 59446 (-44) | 59018 (+100), 59412 (+100), 59421 (+100) |
| Orthopedics & sports injury | 60 | 1,217 | 0.42 | 0.71 | 104 of 345 | 59036 (-64), 59732 (-63), 59749 (-54) | 59066 (+100), 59421 (+100), 59480 (+100) |
| Heart / cardiology | 60 | 462 | 0.28 | 0.67 | 89 of 345 | 59858 (-67), 59853 (-63), 59872 (-57) | 59066 (+100), 59412 (+100), 59421 (+100) |
| Skin / dermatology | 60 | 210 | 0.10 | 0.70 | 79 of 345 | 59752 (-68), 59089 (-60), 59034 (-49) | 59262 (+100), 59421 (+100), 59713 (+100) |
| Allergy & immunology | 60 | 44 | 0.03 | 0.73 | 53 of 345 | 59752 (-33), 59468 (-26), 59443 (-22) | 59066 (+100), 59631 (+100), 59633 (+100) |
| Lung, breathing & sleep | 60 | 274 | 0.14 | 0.60 | 89 of 345 | 59936 (-84), 59732 (-52), 59089 (-36) | 59025 (+100), 59066 (+100), 59201 (+100) |
| Digestive / gastroenterology | 60 | 195 | 0.13 | 0.68 | 46 of 345 | 59101 (-72), 59405 (-44), 59804 (-41) | 59820 (+100), 59920 (+100), 59846 (+92) |
| Kidney / nephrology | 60 | 160 | 0.12 | 0.68 | 81 of 345 | 59089 (-53), 59101 (-51), 59034 (-43) | 59066 (+100), 59201 (+100), 59820 (+98) |
| Diabetes & hormones | 60 | 116 | 0.07 | 0.71 | 60 of 345 | 59405 (-42), 59472 (-29), 59752 (-25) | 59066 (+100), 59421 (+100), 59212 (+99) |
| Cancer care / oncology | 90 | 287 | 0.18 | 0.69 | 94 of 345 | 59914 (-62), 59218 (-59), 59440 (-54) | 59421 (+100), 59920 (+100), 59066 (+95) |
| Arthritis / rheumatology | 60 | 61 | 0.04 | 0.71 | 60 of 345 | 59756 (-62), 59405 (-45), 59101 (-42) | 59066 (+100), 59762 (+100), 59821 (+100) |
| Brain & nerves / neurology | 60 | 418 | 0.24 | 0.71 | 73 of 345 | 59863 (-48), 59405 (-41), 59865 (-40) | 59066 (+100), 59421 (+100), 59531 (+100) |
| Ear, nose & throat | 60 | 151 | 0.08 | 0.71 | 67 of 345 | 59405 (-50), 59752 (-39), 59101 (-35) | 59006 (+100), 59066 (+100), 59221 (+100) |
| Urology | 60 | 144 | 0.08 | 0.68 | 64 of 345 | 59804 (-42), 59914 (-41), 59601 (-32) | 59066 (+100), 59412 (+100), 59421 (+100) |
| Foot & ankle / podiatry | 60 | 248 | 0.16 | 0.61 | 102 of 345 | 59089 (-53), 59804 (-45), 59405 (-41) | 59830 (+99), 59456 (+95), 59820 (+91) |
| Pain management | 60 | 153 | 0.09 | 0.69 | 80 of 345 | 59022 (-45), 59405 (-42), 59101 (-41) | 59025 (+100), 59713 (+100), 59920 (+100) |
| Plastic & reconstructive surgery | 90 | 125 | 0.07 | 0.76 | 72 of 345 | 59752 (-100), 59832 (-45), 59643 (-42) | 59920 (+100), 59913 (+83), 59820 (+81) |
| Speech & language therapy | 30 | 1,822 | 0.87 | 0.49 | 154 of 345 | 59731 (-75), 59845 (-73), 59929 (-72) | 59077 (+100), 59746 (+100), 59025 (+92) |
| Nutrition & dietitian | 30 | 1,032 | 0.32 | 0.46 | 168 of 345 | 59845 (-69), 59865 (-61), 59057 (-57) | 59006 (+100), 59007 (+100), 59018 (+100) |
| Acupuncture, massage & naturopathy | 30 | 2,340 | 0.50 | 0.46 | 181 of 345 | 59088 (-68), 59520 (-68), 59754 (-64) | 59002 (+100), 59018 (+100), 59024 (+100) |
| Urgent care & emergency | 30 | 1,215 | 0.50 | 0.39 | 204 of 345 | 59218 (-74), 59872 (-64), 59804 (-53) | 59003 (+100), 59006 (+100), 59027 (+100) |
| Imaging & lab | 60 | 1,020 | 0.55 | 0.61 | 129 of 345 | 59422 (-45), 59089 (-44), 59804 (-43) | 59066 (+100), 59225 (+100), 59421 (+100) |
| Pharmacy | 30 | 4,285 | 1.68 | 0.43 | 216 of 345 | 59432 (-77), 59065 (-55), 59479 (-51) | 59003 (+100), 59050 (+100), 59448 (+100) |
| Home health & in-home care | 30 | 1,481 | 1.49 | 0.42 | 97 of 345 | 59480 (-83), 59827 (-82), 59853 (-77) | 59353 (+100), 59542 (+62), 59253 (+53) |
| Nursing & assisted living | 60 | 910 | 0.37 | 0.46 | 188 of 345 | 59720 (-80), 59745 (-69), 59804 (-57) | 59003 (+100), 59028 (+100), 59067 (+100) |
| Medical equipment & supplies | 60 | 779 | 0.34 | 0.61 | 151 of 345 | 59089 (-100), 59749 (-67), 59433 (-62) | 59025 (+100), 59252 (+100), 59275 (+100) |
| Hearing & audiology | 60 | 561 | 0.20 | 0.67 | 127 of 345 | 59873 (-61), 59255 (-60), 59089 (-53) | 59025 (+100), 59421 (+100), 59441 (+100) |
| Behavior therapy (ABA) | 30 | 2,020 | 2.58 | 0.48 | 36 of 345 | 59804 (-63), 59401 (-38), 59414 (-31) | 59762 (+39), 59713 (+33), 59728 (+29) |
| Care coordination & community health | 30 | 3,702 | 1.55 | 0.54 | 74 of 345 | 59841 (-66), 59830 (-65), 59865 (-57) | 59025 (+100), 59212 (+100), 59353 (+100) |
| General surgery | 60 | 885 | 0.39 | 0.63 | 124 of 345 | 59754 (-58), 59866 (-58), 59756 (-53) | 59066 (+100), 59231 (+100), 59262 (+100) |
| Infectious disease | 90 | 69 | 0.06 | 0.65 | 47 of 345 | 59936 (-75), 59434 (-57), 59486 (-56) | 59421 (+100), 59066 (+93), 59821 (+79) |
| Genetics & genetic counseling | 90 | 64 | 0.03 | 0.69 | 48 of 345 | 59914 (-86), 59733 (-76), 59931 (-72) | 59826 (+100), 59920 (+100), 59846 (+97) |
| Hospice & palliative care | 60 | 237 | 0.09 | 0.64 | 126 of 345 | 59732 (-55), 59101 (-54), 59022 (-47) | 59007 (+100), 59028 (+100), 59055 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
