# E2SFCA access dry run: Arizona

Run 2026-11-19 by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.

Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.

## Inputs

- ZIP areas in the region (focus plus a border strip of about 60 miles): 622; in Arizona: 402
- Drive times: OSRM on OpenStreetMap roads (car profile), 622 x 622 ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes
- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): 0
- Listings read: 296,587; outside the region's ZIP list (no centre, or a mistyped ZIP): 0
- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)

## Routing sanity check

Regional median: 2.86 drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above 2.5x that (7.16), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.

- Flagged: 0; re-anchored: 0; still implausible (left out of the rank comparison, still stored, marked in the CSV): 0

## By specialty

Rank agreement is Spearman's rho between the two access factors across the state's ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.

| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 30 | 37,502 | 4.78 | 0.56 | 222 of 402 | 86042 (-71), 85610 (-48), 85938 (-46) | 86540 (+100), 86511 (+88), 86515 (+77) |
| Pediatrics (children) | 30 | 9,167 | 1.13 | 0.71 | 172 of 402 | 85609 (-74), 85601 (-66), 85334 (-53) | 86003 (+100), 86035 (+100), 86508 (+100) |
| Women's health / OB-GYN | 60 | 3,843 | 0.55 | 0.76 | 108 of 402 | 85501 (-27), 86042 (-27), 85037 (-25) | 86046 (+100), 86511 (+100), 86520 (+100) |
| Mental health & counseling | 30 | 51,133 | 7.13 | 0.71 | 122 of 402 | 86504 (-60), 86003 (-52), 85390 (-31) | 86332 (+71), 86432 (+66), 85320 (+59) |
| Dental | 30 | 13,327 | 1.64 | 0.59 | 217 of 402 | 85610 (-65), 85543 (-59), 86042 (-57) | 86515 (+95), 86020 (+93), 86508 (+92) |
| Eye care | 30 | 4,561 | 0.65 | 0.60 | 195 of 402 | 85928 (-68), 86042 (-54), 86001 (-52) | 86020 (+100), 86508 (+100), 86540 (+100) |
| Chiropractic | 30 | 4,633 | 0.64 | 0.68 | 171 of 402 | 85637 (-81), 85552 (-43), 85937 (-42) | 86432 (+100), 85920 (+88), 86332 (+82) |
| Physical & occupational therapy | 30 | 19,032 | 2.73 | 0.70 | 172 of 402 | 85639 (-96), 86504 (-47), 85912 (-44) | 86018 (+82), 86046 (+71), 85264 (+69) |
| Orthopedics & sports injury | 60 | 2,888 | 0.42 | 0.79 | 118 of 402 | 85639 (-73), 86504 (-44), 86326 (-33) | 86432 (+100), 86046 (+96), 86021 (+93) |
| Heart / cardiology | 60 | 2,082 | 0.28 | 0.78 | 131 of 402 | 86001 (-52), 85045 (-50), 85353 (-35) | 86046 (+100), 86332 (+100), 85325 (+90) |
| Skin / dermatology | 60 | 785 | 0.10 | 0.77 | 162 of 402 | 85346 (-53), 85756 (-52), 85746 (-45) | 85619 (+100), 86046 (+100), 86321 (+100) |
| Allergy & immunology | 60 | 202 | 0.03 | 0.79 | 118 of 402 | 86326 (-50), 85087 (-41), 86001 (-41) | 86321 (+100), 86334 (+95), 85264 (+90) |
| Lung, breathing & sleep | 60 | 1,303 | 0.14 | 0.79 | 140 of 402 | 85550 (-77), 85747 (-56), 85045 (-40) | 85926 (+100), 86332 (+100), 86540 (+100) |
| Digestive / gastroenterology | 60 | 889 | 0.13 | 0.86 | 98 of 402 | 85045 (-56), 86001 (-50), 85050 (-39) | 86046 (+91), 86332 (+88), 86021 (+84) |
| Kidney / nephrology | 60 | 931 | 0.12 | 0.60 | 173 of 402 | 85532 (-79), 85539 (-68), 85390 (-50) | 85325 (+100), 85346 (+100), 85536 (+100) |
| Diabetes & hormones | 60 | 423 | 0.07 | 0.79 | 148 of 402 | 85602 (-74), 86305 (-52), 86326 (-39) | 85536 (+100), 85911 (+100), 85926 (+100) |
| Cancer care / oncology | 90 | 1,092 | 0.18 | 0.80 | 119 of 402 | 86305 (-45), 85641 (-39), 85045 (-38) | 86321 (+100), 86432 (+67), 85262 (+63) |
| Arthritis / rheumatology | 60 | 245 | 0.04 | 0.82 | 99 of 402 | 86001 (-44), 86011 (-44), 86515 (-43) | 86046 (+100), 86321 (+100), 86432 (+90) |
| Brain & nerves / neurology | 60 | 2,190 | 0.24 | 0.86 | 123 of 402 | 85329 (-45), 85045 (-44), 85202 (-44) | 86332 (+99), 85264 (+85), 85619 (+81) |
| Ear, nose & throat | 60 | 457 | 0.08 | 0.80 | 131 of 402 | 86305 (-67), 86001 (-45), 86011 (-43) | 85941 (+100), 86046 (+100), 86321 (+100) |
| Urology | 60 | 526 | 0.08 | 0.76 | 166 of 402 | 86326 (-60), 86325 (-41), 85756 (-40) | 85396 (+100), 85619 (+100), 85264 (+83) |
| Foot & ankle / podiatry | 60 | 1,287 | 0.16 | 0.62 | 193 of 402 | 85542 (-54), 85007 (-48), 85006 (-44) | 85325 (+100), 85926 (+100), 86046 (+100) |
| Pain management | 60 | 1,161 | 0.09 | 0.83 | 112 of 402 | 85329 (-58), 85353 (-57), 85392 (-57) | 85263 (+100), 85941 (+100), 86021 (+100) |
| Plastic & reconstructive surgery | 90 | 627 | 0.07 | 0.85 | 144 of 402 | 86017 (-76), 85392 (-64), 85037 (-62) | 85619 (+83), 86432 (+76), 86021 (+68) |
| Speech & language therapy | 30 | 8,380 | 0.87 | 0.74 | 192 of 402 | 85141 (-62), 85638 (-60), 85653 (-56) | 85263 (+100), 85264 (+100), 86003 (+100) |
| Nutrition & dietitian | 30 | 2,393 | 0.32 | 0.66 | 186 of 402 | 86042 (-73), 86556 (-68), 85613 (-51) | 85911 (+100), 85926 (+100), 86020 (+100) |
| Acupuncture, massage & naturopathy | 30 | 4,169 | 0.50 | 0.75 | 149 of 402 | 85624 (-75), 85622 (-69), 85610 (-62) | 86017 (+100), 86038 (+100), 86321 (+100) |
| Urgent care & emergency | 30 | 4,170 | 0.50 | 0.46 | 199 of 402 | 85601 (-97), 85920 (-77), 85619 (-63) | 85325 (+100), 85334 (+100), 85346 (+100) |
| Imaging & lab | 60 | 4,097 | 0.55 | 0.75 | 144 of 402 | 85540 (-52), 86438 (-44), 85747 (-41) | 85325 (+100), 85346 (+100), 86544 (+100) |
| Pharmacy | 30 | 12,628 | 1.68 | 0.45 | 210 of 402 | 86556 (-77), 85938 (-71), 85539 (-66) | 85536 (+100), 85911 (+100), 85926 (+100) |
| Home health & in-home care | 30 | 41,677 | 1.49 | 0.65 | 88 of 402 | 85926 (-96), 85927 (-96), 85639 (-85) | 86020 (+100), 86030 (+100), 86535 (+86) |
| Nursing & assisted living | 60 | 3,142 | 0.37 | 0.66 | 175 of 402 | 86003 (-78), 86035 (-52), 86305 (-47) | 85325 (+100), 85346 (+100), 85550 (+100) |
| Medical equipment & supplies | 60 | 2,413 | 0.34 | 0.70 | 131 of 402 | 85911 (-76), 85928 (-69), 85606 (-48) | 86432 (+91), 86438 (+75), 86046 (+74) |
| Hearing & audiology | 60 | 1,555 | 0.20 | 0.71 | 166 of 402 | 86504 (-51), 85747 (-35), 85329 (-34) | 86321 (+100), 86432 (+100), 86520 (+100) |
| Behavior therapy (ABA) | 30 | 21,926 | 2.58 | 0.84 | 83 of 402 | 85006 (-32), 85003 (-28), 85004 (-25) | 86432 (+100), 85338 (+76), 85619 (+69) |
| Care coordination & community health | 30 | 7,453 | 1.55 | 0.57 | 57 of 402 | 86042 (-77), 86504 (-69), 85601 (-52) | 86432 (+100), 86515 (+88), 86508 (+83) |
| General surgery | 60 | 3,196 | 0.39 | 0.79 | 143 of 402 | 85045 (-49), 85037 (-41), 85329 (-40) | 86046 (+100), 86511 (+100), 86540 (+100) |
| Infectious disease | 90 | 379 | 0.06 | 0.83 | 154 of 402 | 86017 (-50), 85392 (-44), 85353 (-41) | 85926 (+72), 86332 (+72), 85264 (+68) |
| Genetics & genetic counseling | 90 | 129 | 0.03 | 0.83 | 137 of 402 | 85329 (-29), 85353 (-29), 85392 (-29) | 85262 (+77), 85268 (+70), 85255 (+69) |
| Hospice & palliative care | 60 | 1,335 | 0.09 | 0.79 | 151 of 402 | 85329 (-82), 85353 (-82), 85392 (-76) | 85550 (+100), 85941 (+100), 86046 (+100) |

In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.

## Reading this

- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).
- It also divides each practice's capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.
- Nothing here changes the live score. Adopting it is a separate decision.
