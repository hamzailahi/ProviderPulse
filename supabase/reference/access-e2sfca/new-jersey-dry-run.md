# E2SFCA access dry run: New Jersey

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 2,434; in New Jersey: 587
- Drive times: OSRM on OpenStreetMap roads (car profile), 2,434 x 2,434 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,104,899; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.36 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.39), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 11; re-anchored: 5; still implausible (left out of the rank comparison, still stored, marked in the CSV): 6 (21634, 21669, 21672, 22469, 22488, 22529)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 07311 | yes | 9.93 | 100% | 3.91 | 100% | yes (1.27) |
| 07632 | yes | 11.39 | 100% | 2.51 | 100% | yes (1.77) |
| 07663 | yes | 8.86 | 100% | 2.67 | 100% | yes (0.87) |
| 10004 | no | 11.24 | 100% | 2.57 | 100% | yes (1.47) |
| 10044 | no | 12.53 | 100% | 4.85 | 100% | yes (0.53) |
| 21634 | no | 14.65 | 100% | 14.65 | 100% | no |
| 21669 | no | 13.08 | 100% | 13.08 | 100% | no |
| 21672 | no | 8.49 | 100% | 8.49 | 100% | no |
| 22469 | no | 3.76 | 17% | 3.76 | 17% | no |
| 22488 | no | 3.76 | 17% | 3.76 | 17% | no |
| 22529 | no | 3.50 | 17% | 3.50 | 17% | no |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 146,431 | 4.78 | 0.70 | 145 of 587 | 08701 (-21), 07070 (-20), 08232 (-18) | 08066 (+51), 08086 (+44), 08067 (+41) |
| Pediatrics (children) | 30 | 42,725 | 1.13 | 0.80 | 185 of 587 | 08065 (-40), 08029 (-36), 08002 (-34) | 08014 (+86), 08067 (+84), 08038 (+81) |
| Women's health / OB-GYN | 60 | 19,129 | 0.55 | 0.51 | 267 of 587 | 08061 (-33), 08075 (-33), 08027 (-32) | 08558 (+60), 07711 (+59), 07723 (+59) |
| Mental health & counseling | 30 | 238,480 | 7.13 | 0.64 | 204 of 587 | 08610 (-56), 08002 (-40), 08109 (-40) | 07305 (+65), 07979 (+58), 07094 (+51) |
| Dental | 30 | 48,391 | 1.64 | 0.59 | 191 of 587 | 07605 (-30), 07024 (-28), 07632 (-27) | 07979 (+54), 08340 (+50), 08088 (+47) |
| Eye care | 30 | 20,240 | 0.65 | 0.51 | 205 of 587 | 07605 (-33), 07632 (-33), 07070 (-24) | 08340 (+64), 07305 (+54), 07094 (+50) |
| Chiropractic | 30 | 16,016 | 0.64 | 0.68 | 204 of 587 | 07605 (-38), 07660 (-35), 07024 (-34) | 08740 (+61), 07979 (+58), 07732 (+55) |
| Physical & occupational therapy | 30 | 100,209 | 2.73 | 0.59 | 249 of 587 | 08103 (-49), 08105 (-44), 08102 (-42) | 08733 (+63), 08858 (+58), 07921 (+55) |
| Orthopedics & sports injury | 60 | 12,484 | 0.42 | 0.13 | 295 of 587 | 07833 (-64), 07823 (-43), 08027 (-36) | 07760 (+65), 07924 (+65), 07750 (+62) |
| Heart / cardiology | 60 | 11,327 | 0.28 | 0.44 | 298 of 587 | 08041 (-53), 08073 (-51), 08037 (-50) | 08212 (+82), 08314 (+72), 08640 (+72) |
| Skin / dermatology | 60 | 3,776 | 0.10 | 0.46 | 337 of 587 | 07632 (-59), 07201 (-56), 07202 (-55) | 08088 (+70), 08314 (+70), 07732 (+69) |
| Allergy & immunology | 60 | 1,372 | 0.03 | 0.41 | 363 of 587 | 08073 (-68), 08010 (-65), 08027 (-64) | 07970 (+75), 07869 (+74), 08324 (+73) |
| Lung, breathing & sleep | 60 | 4,465 | 0.14 | 0.38 | 287 of 587 | 08073 (-43), 08046 (-42), 08016 (-41) | 08212 (+71), 07960 (+69), 08314 (+69) |
| Digestive / gastroenterology | 60 | 5,477 | 0.13 | 0.48 | 323 of 587 | 08056 (-59), 08027 (-55), 08051 (-55) | 08212 (+79), 08551 (+69), 08825 (+66) |
| Kidney / nephrology | 60 | 3,844 | 0.12 | 0.48 | 276 of 587 | 08051 (-48), 08080 (-48), 08071 (-46) | 07960 (+64), 08323 (+64), 08212 (+61) |
| Diabetes & hormones | 60 | 2,848 | 0.07 | 0.53 | 324 of 587 | 08041 (-62), 07102 (-58), 07029 (-55) | 08314 (+74), 07847 (+69), 07876 (+69) |
| Cancer care / oncology | 90 | 6,713 | 0.18 | 0.33 | 416 of 587 | 08064 (-61), 08094 (-59), 08562 (-59) | 08246 (+83), 08270 (+75), 08248 (+68) |
| Arthritis / rheumatology | 60 | 1,660 | 0.04 | 0.51 | 314 of 587 | 08073 (-76), 08036 (-61), 08094 (-61) | 08212 (+80), 08340 (+73), 07847 (+72) |
| Brain & nerves / neurology | 60 | 8,418 | 0.24 | 0.64 | 281 of 587 | 08027 (-49), 08051 (-48), 07201 (-44) | 07976 (+66), 07005 (+64), 07924 (+64) |
| Ear, nose & throat | 60 | 2,340 | 0.08 | 0.40 | 326 of 587 | 08041 (-51), 08068 (-48), 08073 (-48) | 08825 (+70), 07924 (+68), 08525 (+68) |
| Urology | 60 | 2,883 | 0.08 | 0.26 | 318 of 587 | 08061 (-55), 08224 (-54), 08330 (-54) | 08079 (+75), 08072 (+73), 07970 (+72) |
| Foot & ankle / podiatry | 60 | 8,375 | 0.16 | 0.33 | 273 of 587 | 08317 (-62), 08562 (-43), 08505 (-40) | 08340 (+79), 08212 (+74), 08825 (+64) |
| Pain management | 60 | 3,501 | 0.09 | 0.56 | 349 of 587 | 07844 (-52), 08514 (-48), 07833 (-47) | 07976 (+62), 08088 (+56), 08089 (+56) |
| Plastic & reconstructive surgery | 90 | 2,587 | 0.07 | 0.42 | 354 of 587 | 07201 (-64), 08041 (-62), 07105 (-58) | 08226 (+77), 08223 (+75), 07732 (+73) |
| Speech & language therapy | 30 | 34,577 | 0.87 | 0.69 | 206 of 587 | 08722 (-53), 07753 (-43), 07762 (-40) | 08733 (+86), 08088 (+75), 07305 (+67) |
| Nutrition & dietitian | 30 | 11,497 | 0.32 | 0.63 | 217 of 587 | 08340 (-67), 07632 (-41), 07088 (-33) | 08733 (+85), 07979 (+69), 08067 (+64) |
| Acupuncture, massage & naturopathy | 30 | 13,987 | 0.50 | 0.82 | 109 of 587 | 07632 (-46), 07024 (-42), 07605 (-39) | 07305 (+74), 07304 (+44), 07094 (+43) |
| Urgent care & emergency | 30 | 15,781 | 0.50 | 0.77 | 170 of 587 | 08316 (-27), 07940 (-25), 08869 (-22) | 08212 (+88), 08340 (+74), 07934 (+62) |
| Imaging & lab | 60 | 16,836 | 0.55 | 0.49 | 237 of 587 | 08051 (-43), 08080 (-41), 08071 (-38) | 07960 (+67), 07924 (+54), 07950 (+53) |
| Pharmacy | 30 | 55,664 | 1.68 | 0.56 | 169 of 587 | 08863 (-23), 07024 (-21), 07605 (-21) | 08340 (+55), 07979 (+46), 07305 (+39) |
| Home health & in-home care | 30 | 19,733 | 1.49 | 0.71 | 37 of 587 | 08107 (-13), 08108 (-13), 07307 (-12) | 08027 (+47), 08066 (+40), 08014 (+39) |
| Nursing & assisted living | 60 | 6,908 | 0.37 | 0.14 | 211 of 587 | 08103 (-39), 08102 (-38), 08104 (-37) | 08212 (+59), 08042 (+50), 08251 (+47) |
| Medical equipment & supplies | 60 | 10,024 | 0.34 | 0.27 | 245 of 587 | 07024 (-35), 07605 (-34), 07650 (-31) | 07979 (+74), 08887 (+65), 08833 (+63) |
| Hearing & audiology | 60 | 5,292 | 0.20 | 0.28 | 276 of 587 | 07833 (-37), 08041 (-35), 08068 (-35) | 08212 (+93), 08055 (+62), 08825 (+61) |
| Behavior therapy (ABA) | 30 | 32,864 | 2.58 | 0.73 | 40 of 587 | 08722 (-22), 07753 (-20), 08701 (-16) | 08733 (+80), 08735 (+42), 08732 (+40) |
| Care coordination & community health | 30 | 45,770 | 1.55 | 0.71 | 97 of 587 | 07070 (-30), 07607 (-25), 07604 (-22) | 07305 (+63), 07979 (+46), 07022 (+43) |
| General surgery | 60 | 13,347 | 0.39 | 0.41 | 295 of 587 | 08051 (-43), 07833 (-41), 08027 (-39) | 07950 (+67), 07976 (+67), 08551 (+67) |
| Infectious disease | 90 | 2,525 | 0.06 | 0.44 | 374 of 587 | 08041 (-87), 08022 (-83), 08074 (-74) | 08203 (+74), 07711 (+70), 07717 (+69) |
| Genetics & genetic counseling | 90 | 1,342 | 0.03 | 0.36 | 422 of 587 | 08098 (-97), 08056 (-96), 08343 (-96) | 08825 (+70), 07979 (+69), 07930 (+65) |
| Hospice & palliative care | 60 | 1,255 | 0.09 | 0.34 | 123 of 587 | 08317 (-30), 08037 (-25), 08056 (-25) | 08226 (+57), 08223 (+52), 08559 (+52) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
