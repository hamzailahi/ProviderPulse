# Back-test: the need score against where clinicians entered

Run 2026-11-19 by scripts/backtest-entry.mjs. Read only.

Each ZIP with at least 1,000 adults is scored as of the end of 2020: the live model's need factor (CDC PLACES measures against national percentiles; age mix is left out here) and its access factor (listings per adult in the 10-mile catchment against the national rate, counting only NPIs enumerated by the end of 2020). "Patients need care here" is their average. The outcome is clinicians (NPI-1) enumerated in 2021 to 2025 per 1,000 adults in the same catchment. HPSA (the county's designation score for the specialty's discipline, 0 when the county has none) is tested the same way.

## Limits

- Supply in 2020 counts NPIs still active today at today's address: clinicians who retired or moved since are missing or misplaced (NPPES blanks deactivated records), so 2020 supply is understated and survivors are placed where they are now.
- Need uses today's PLACES and today's adults; both change slowly, but they are not 2020 figures.
- Entry is an NPI being issued, mostly new graduates and newly licensed clinicians. It measures where clinicians start practising, which reflects jobs and training sites as much as need.
- A positive correlation means the score points where clinicians went; a negative one means they went to already-supplied places. Neither alone proves the score right or wrong; the comparison with HPSA on the same ZIPs is the fair test.

- NPPES rows read: 9,891,116; deactivated (not placeable): n/a; enumerated by 2020 and active: 6,328,253; entered 2021 to 2025: 2,619,185
- ZIP x specialty rows scored: 862,080

## By specialty

Rank correlation (Spearman) with entry per 1,000 adults. "Top vs bottom fifth" is the mean entry rate in the highest-scoring fifth of ZIPs over the lowest. The last two columns use only ZIPs whose county matched HPSA records, so the score and HPSA are compared on the same ZIPs.

| Specialty | ZIPs | Need score | Need alone | Access alone | Top vs bottom fifth | ZIPs with county | HPSA | Need score, same ZIPs |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 20,281 | -0.68 | -0.27 | -0.84 | 0.29x | 21,418 | 0.21 | -0.68 |
| Pediatrics (children) | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.22 | n/a |
| Women's health / OB-GYN | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.15 | n/a |
| Mental health & counseling | 20,281 | -0.68 | -0.00 | -0.88 | 0.24x | 21,418 | 0.19 | -0.68 |
| Dental | 21,427 | -0.50 | -0.25 | -0.66 | 0.34x | 21,418 | 0.27 | -0.50 |
| Eye care | 20,281 | -0.40 | -0.14 | -0.55 | 0.33x | 21,418 | 0.16 | -0.40 |
| Chiropractic | 20,281 | -0.57 | -0.39 | -0.56 | 0.17x | 21,418 | 0.06 | -0.57 |
| Physical & occupational therapy | 20,281 | -0.71 | -0.48 | -0.76 | 0.32x | 21,418 | 0.05 | -0.71 |
| Orthopedics & sports injury | 20,281 | -0.56 | -0.35 | -0.56 | 0.19x | 21,418 | 0.04 | -0.56 |
| Heart / cardiology | 20,281 | -0.61 | -0.38 | -0.58 | 0.03x | 21,418 | 0.25 | -0.61 |
| Skin / dermatology | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.22 | n/a |
| Allergy & immunology | 20,281 | -0.38 | -0.18 | -0.40 | 0.01x | 21,418 | 0.17 | -0.38 |
| Lung, breathing & sleep | 21,427 | -0.54 | -0.26 | -0.56 | 0.20x | 21,418 | 0.25 | -0.54 |
| Digestive / gastroenterology | 21,427 | -0.49 | -0.12 | -0.54 | 0.02x | 21,418 | 0.20 | -0.49 |
| Kidney / nephrology | 20,281 | -0.49 | -0.18 | -0.47 | 0.08x | 21,418 | 0.24 | -0.49 |
| Diabetes & hormones | 20,281 | -0.51 | -0.25 | -0.54 | 0.16x | 21,418 | 0.18 | -0.51 |
| Cancer care / oncology | 20,281 | -0.62 | -0.45 | -0.59 | 0.02x | 21,418 | 0.22 | -0.62 |
| Arthritis / rheumatology | 20,281 | -0.51 | -0.40 | -0.49 | 0.02x | 21,418 | 0.21 | -0.51 |
| Brain & nerves / neurology | 20,281 | -0.72 | -0.40 | -0.74 | 0.02x | 21,418 | 0.22 | -0.72 |
| Ear, nose & throat | 20,281 | -0.53 | -0.40 | -0.48 | 0.00x | 21,418 | 0.23 | -0.53 |
| Urology | 20,281 | -0.42 | -0.14 | -0.47 | 0.04x | 21,418 | 0.18 | -0.42 |
| Foot & ankle / podiatry | 20,281 | -0.53 | -0.32 | -0.53 | 0.12x | 21,418 | 0.17 | -0.53 |
| Pain management | 20,281 | -0.46 | -0.36 | -0.42 | 0.06x | 21,418 | 0.18 | -0.46 |
| Plastic & reconstructive surgery | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.24 | n/a |
| Speech & language therapy | 20,281 | -0.59 | -0.36 | -0.62 | 0.32x | 21,418 | 0.15 | -0.59 |
| Nutrition & dietitian | 20,281 | -0.69 | -0.55 | -0.64 | 0.17x | 21,418 | 0.13 | -0.69 |
| Acupuncture, massage & naturopathy | 20,281 | -0.68 | -0.45 | -0.71 | 0.13x | 21,418 | 0.13 | -0.68 |
| Urgent care & emergency | 20,281 | -0.30 | 0.10 | -0.55 | 0.24x | 21,418 | 0.20 | -0.30 |
| Imaging & lab | 20,281 | -0.65 | -0.51 | -0.59 | 0.07x | 21,418 | 0.29 | -0.65 |
| Pharmacy | 20,281 | -0.42 | -0.18 | -0.56 | 0.48x | 21,418 | 0.20 | -0.42 |
| Home health & in-home care | 20,281 | -0.28 | 0.05 | -0.53 | 0.05x | 21,418 | 0.23 | -0.28 |
| Nursing & assisted living | 20,281 | -0.05 | -0.01 | -0.10 | 0.34x | 21,418 | 0.25 | -0.05 |
| Medical equipment & supplies | 20,281 | -0.36 | -0.13 | -0.38 | 0.31x | 21,418 | 0.27 | -0.36 |
| Hearing & audiology | 20,281 | -0.61 | -0.30 | -0.66 | 0.15x | 21,418 | 0.12 | -0.61 |
| Behavior therapy (ABA) | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.22 | n/a |
| Care coordination & community health | 20,281 | -0.61 | -0.07 | -0.80 | 0.10x | 21,418 | 0.18 | -0.61 |
| General surgery | 20,281 | -0.72 | -0.48 | -0.69 | 0.04x | 21,418 | 0.21 | -0.72 |
| Infectious disease | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.21 | n/a |
| Genetics & genetic counseling | 0 | n/a | n/a | n/a | n/a | 21,418 | 0.25 | n/a |
| Hospice & palliative care | 20,281 | -0.42 | -0.39 | -0.31 | 0.20x | 21,418 | 0.23 | -0.42 |
