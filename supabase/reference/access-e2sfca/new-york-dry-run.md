# E2SFCA access dry run: New York

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 5,621; in New York: 1,752
- Drive times: OSRM on OpenStreetMap roads (car profile), 5,621 x 5,621 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 1,701,461; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 3.31 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (8.28), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 14; re-anchored: 13; still implausible (left out of the rank comparison, still stored, marked in the CSV): 1 (02535)

| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |
|---|---|---|---|---|---|---|
| 01085 | no | 9.58 | 100% | 2.73 | 100% | yes (1.72) |
| 02199 | no | 9.23 | 100% | 5.36 | 100% | yes (1.02) |
| 02535 | no | 1.40 | 8% | none | 0% | no |
| 02543 | no | 1.40 | 8% | 1.99 | 92% | yes (7.97) |
| 02872 | no | 10.65 | 100% | 2.96 | 100% | yes (2.37) |
| 06390 | no | 9.18 | 100% | 2.85 | 100% | yes (2.83) |
| 07311 | no | 9.93 | 100% | 3.91 | 100% | yes (1.27) |
| 07632 | no | 11.39 | 100% | 2.51 | 100% | yes (1.77) |
| 07663 | no | 8.86 | 100% | 2.67 | 100% | yes (0.87) |
| 10004 | yes | 11.24 | 100% | 2.57 | 100% | yes (1.47) |
| 10044 | yes | 12.53 | 100% | 4.85 | 100% | yes (0.53) |
| 15450 | no | 9.55 | 100% | 4.03 | 100% | yes (0.80) |
| 15466 | no | 10.02 | 100% | 3.64 | 100% | yes (0.82) |
| 17271 | no | 9.95 | 100% | 3.38 | 100% | yes (0.60) |

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 227,982 | 4.78 | 0.69 | 574 of 1752 | 12725 (-64), 12852 (-64), 12885 (-61) | 13665 (+100), 14859 (+98), 12155 (+95) |
| Pediatrics (children) | 30 | 67,903 | 1.13 | 0.77 | 710 of 1752 | 13353 (-92), 12740 (-75), 12117 (-64) | 13333 (+83), 12517 (+78), 12959 (+73) |
| Women's health / OB-GYN | 60 | 28,802 | 0.55 | 0.64 | 793 of 1752 | 13315 (-90), 13459 (-82), 13439 (-77) | 14066 (+83), 13672 (+76), 12970 (+68) |
| Mental health & counseling | 30 | 386,208 | 7.13 | 0.74 | 640 of 1752 | 14845 (-53), 12993 (-47), 11365 (-42) | 14859 (+96), 14825 (+90), 14838 (+83) |
| Dental | 30 | 76,596 | 1.64 | 0.78 | 495 of 1752 | 12885 (-61), 13420 (-41), 10033 (-36) | 13665 (+100), 13691 (+89), 11957 (+59) |
| Eye care | 30 | 31,691 | 0.65 | 0.72 | 674 of 1752 | 14731 (-81), 14027 (-59), 14081 (-57) | 11957 (+100), 12155 (+100), 13488 (+100) |
| Chiropractic | 30 | 25,647 | 0.64 | 0.65 | 558 of 1752 | 12117 (-70), 12516 (-70), 12485 (-68) | 12720 (+88), 12943 (+76), 12996 (+74) |
| Physical & occupational therapy | 30 | 157,992 | 2.73 | 0.69 | 765 of 1752 | 12740 (-67), 13694 (-65), 13081 (-55) | 13665 (+97), 13156 (+89), 13074 (+84) |
| Orthopedics & sports injury | 60 | 20,006 | 0.42 | 0.54 | 813 of 1752 | 13642 (-72), 13784 (-70), 13092 (-67) | 12852 (+99), 13343 (+91), 12986 (+88) |
| Heart / cardiology | 60 | 15,694 | 0.28 | 0.75 | 800 of 1752 | 13315 (-100), 13439 (-100), 13475 (-82) | 11952 (+76), 11946 (+75), 11948 (+73) |
| Skin / dermatology | 60 | 5,493 | 0.10 | 0.81 | 666 of 1752 | 11374 (-65), 11375 (-64), 11415 (-62) | 12023 (+88), 11957 (+87), 11935 (+81) |
| Allergy & immunology | 60 | 1,982 | 0.03 | 0.76 | 894 of 1752 | 12942 (-84), 12978 (-73), 13743 (-70) | 11957 (+100), 12997 (+95), 14066 (+89) |
| Lung, breathing & sleep | 60 | 6,355 | 0.14 | 0.75 | 638 of 1752 | 13315 (-100), 13439 (-100), 13361 (-86) | 13672 (+90), 13687 (+73), 10514 (+65) |
| Digestive / gastroenterology | 60 | 7,549 | 0.13 | 0.77 | 865 of 1752 | 13834 (-91), 13439 (-83), 13138 (-69) | 13672 (+75), 13416 (+73), 13435 (+70) |
| Kidney / nephrology | 60 | 5,263 | 0.12 | 0.72 | 689 of 1752 | 13439 (-100), 13834 (-100), 13315 (-97) | 11952 (+81), 12067 (+73), 11948 (+71) |
| Diabetes & hormones | 60 | 4,261 | 0.07 | 0.69 | 911 of 1752 | 12116 (-100), 13315 (-100), 13317 (-100) | 11957 (+100), 12811 (+90), 11952 (+78) |
| Cancer care / oncology | 90 | 9,703 | 0.18 | 0.58 | 1142 of 1752 | 12936 (-59), 13138 (-59), 11374 (-58) | 11764 (+78), 11777 (+78), 11789 (+78) |
| Arthritis / rheumatology | 60 | 2,396 | 0.04 | 0.74 | 892 of 1752 | 12116 (-100), 13315 (-100), 13335 (-100) | 12975 (+100), 12076 (+81), 12131 (+81) |
| Brain & nerves / neurology | 60 | 12,262 | 0.24 | 0.80 | 713 of 1752 | 12847 (-69), 13315 (-69), 13834 (-69) | 12975 (+86), 11770 (+85), 10562 (+67) |
| Ear, nose & throat | 60 | 3,567 | 0.08 | 0.63 | 952 of 1752 | 13315 (-100), 13335 (-100), 13439 (-100) | 12720 (+95), 14066 (+90), 14541 (+86) |
| Urology | 60 | 4,286 | 0.08 | 0.64 | 989 of 1752 | 13020 (-100), 13315 (-100), 13335 (-100) | 12139 (+100), 12164 (+100), 13312 (+96) |
| Foot & ankle / podiatry | 60 | 10,873 | 0.16 | 0.80 | 813 of 1752 | 13439 (-67), 14781 (-67), 14736 (-66) | 12970 (+79), 14054 (+76), 11770 (+75) |
| Pain management | 60 | 4,309 | 0.09 | 0.79 | 744 of 1752 | 14736 (-57), 11365 (-54), 12861 (-54) | 12961 (+100), 12998 (+100), 12964 (+99) |
| Plastic & reconstructive surgery | 90 | 3,454 | 0.07 | 0.68 | 924 of 1752 | 11374 (-75), 11375 (-74), 11415 (-73) | 11958 (+88), 11935 (+86), 11932 (+85) |
| Speech & language therapy | 30 | 49,652 | 0.87 | 0.76 | 793 of 1752 | 12973 (-63), 12847 (-62), 13472 (-60) | 11770 (+95), 12410 (+93), 14091 (+84) |
| Nutrition & dietitian | 30 | 18,231 | 0.32 | 0.74 | 730 of 1752 | 12469 (-82), 12878 (-77), 12810 (-71) | 12155 (+100), 13118 (+100), 13488 (+100) |
| Acupuncture, massage & naturopathy | 30 | 20,698 | 0.50 | 0.79 | 619 of 1752 | 13144 (-84), 12758 (-70), 13625 (-69) | 13345 (+100), 13473 (+96), 11770 (+93) |
| Urgent care & emergency | 30 | 23,512 | 0.50 | 0.72 | 575 of 1752 | 12842 (-78), 12758 (-65), 12545 (-61) | 12155 (+100), 12965 (+100), 13672 (+100) |
| Imaging & lab | 60 | 25,078 | 0.55 | 0.71 | 765 of 1752 | 13439 (-80), 13834 (-76), 13315 (-74) | 10514 (+71), 10597 (+71), 14859 (+66) |
| Pharmacy | 30 | 83,801 | 1.68 | 0.65 | 756 of 1752 | 13690 (-78), 12853 (-56), 13670 (-49) | 14825 (+92), 14859 (+86), 13687 (+81) |
| Home health & in-home care | 30 | 33,197 | 1.49 | 0.64 | 57 of 1752 | 13633 (-86), 12842 (-63), 13756 (-58) | 12164 (+49), 13436 (+46), 12856 (+37) |
| Nursing & assisted living | 60 | 11,520 | 0.37 | 0.41 | 463 of 1752 | 12428 (-81), 12732 (-77), 12489 (-76) | 12847 (+100), 12592 (+71), 12501 (+65) |
| Medical equipment & supplies | 60 | 13,890 | 0.34 | 0.71 | 662 of 1752 | 13020 (-42), 13808 (-42), 14753 (-41) | 13672 (+67), 11957 (+65), 14859 (+62) |
| Hearing & audiology | 60 | 8,729 | 0.20 | 0.58 | 863 of 1752 | 13159 (-69), 13020 (-63), 12929 (-62) | 12852 (+100), 11957 (+90), 12997 (+84) |
| Behavior therapy (ABA) | 30 | 51,738 | 2.58 | 0.87 | 41 of 1752 | 12857 (-66), 11788 (-26), 12955 (-21) | 11721 (+51), 11743 (+40), 11771 (+36) |
| Care coordination & community health | 30 | 72,751 | 1.55 | 0.71 | 769 of 1752 | 14522 (-60), 14845 (-59), 12842 (-58) | 12969 (+100), 12980 (+100), 13345 (+100) |
| General surgery | 60 | 19,604 | 0.39 | 0.65 | 902 of 1752 | 13315 (-100), 13475 (-94), 13439 (-87) | 12997 (+90), 12970 (+82), 12976 (+80) |
| Infectious disease | 90 | 3,397 | 0.06 | 0.65 | 1007 of 1752 | 11355 (-65), 11367 (-63), 11434 (-63) | 13360 (+100), 13338 (+99), 12164 (+92) |
| Genetics & genetic counseling | 90 | 1,885 | 0.03 | 0.72 | 857 of 1752 | 10703 (-51), 11374 (-51), 11375 (-51) | 12975 (+94), 11770 (+86), 13083 (+82) |
| Hospice & palliative care | 60 | 2,044 | 0.09 | 0.59 | 264 of 1752 | 12916 (-40), 14736 (-39), 13159 (-38) | 12975 (+90), 14517 (+75), 14549 (+75) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
