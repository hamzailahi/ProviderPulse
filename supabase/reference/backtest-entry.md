# Back-test: need against health outcomes, viability against entry

Run 2026-11-20 by scripts/backtest-entry.mjs. Read only.

Two scores, each against the outcome it claims to predict (2026-11-19, the user's choice after the first run showed new clinicians going to already-supplied areas):

- **Patients need care here** = the mean of the need factor (CDC PLACES against national percentiles; age mix left out here) and the access factor (listings per adult in the 10-mile catchment against the national rate). Tested with today's supply against county outcomes that thin access is known to raise: preventable hospital stays (County Health Rankings: stays for conditions good outpatient care usually prevents, per 100,000 Medicare enrollees; CMS publishes its own county rates as NA), ER visits per 1,000 and readmission rate (Medicare fee-for-service, newest year). County score = adult-weighted mean of its ZIPs (HUD main county). Higher correlation is better: a need score should rise with preventable stays.
- **A practice can make it here** = the mean of ability to pay (insured rate 70% and median income 30%, percentiles in the state, ACS) and room from competitors (nearest same-specialty listing). Tested as of the end of 2020 against clinicians (NPI-1) enumerated in 2021 to 2025 per 1,000 adults in the catchment.
- HPSA (the county's score for the specialty's discipline, 0 when a matched county has none) gets the same tests on the same counties and ZIPs.

## Limits

- 2020 supply counts NPIs still active today at today's address (deactivated records carry no address).
- Need uses today's PLACES; the outcomes are Medicare fee-for-service only and county-wide, so a ZIP-level score is averaged up and loses detail.
- Correlation is not cause: poorer, older counties have both more need and more preventable stays. Need alone and access alone are shown so the two can be told apart.

- NPPES rows read: 9,891,116; enumerated by 2020 and active: 6,328,253; entered 2021 to 2025: 2,619,185
- Counties with outcomes: 3,206

## 1. Patients need care here vs county outcomes

Spearman across counties. Preventable stays columns: the score, need alone, access alone, then HPSA.

| Specialty | Counties | Preventable stays: score | need | access | HPSA | ER visits: score | HPSA | Readmissions: score | HPSA |
|---|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 2,903 | 0.27 | 0.37 | 0.04 | 0.17 | 0.27 | 0.18 | 0.09 | 0.19 |
| Mental health & counseling | 2,903 | 0.32 | 0.26 | 0.19 | 0.06 | 0.24 | 0.10 | 0.10 | 0.09 |
| Dental | 3,007 | 0.44 | 0.45 | 0.29 | 0.13 | 0.35 | 0.14 | 0.22 | 0.17 |
| Eye care | 2,903 | 0.33 | 0.36 | 0.17 | 0.17 | 0.29 | 0.18 | 0.18 | 0.19 |
| Chiropractic | 2,903 | 0.36 | 0.31 | 0.29 | 0.17 | 0.35 | 0.18 | 0.23 | 0.19 |
| Physical & occupational therapy | 2,903 | 0.26 | 0.27 | 0.16 | 0.17 | 0.30 | 0.18 | 0.08 | 0.19 |
| Orthopedics & sports injury | 2,903 | 0.22 | 0.27 | 0.12 | 0.17 | 0.22 | 0.18 | 0.04 | 0.19 |
| Heart / cardiology | 2,903 | 0.15 | 0.28 | -0.04 | 0.17 | 0.20 | 0.18 | -0.05 | 0.19 |
| Allergy & immunology | 2,903 | 0.06 | 0.08 | 0.00 | 0.17 | 0.24 | 0.18 | -0.04 | 0.19 |
| Lung, breathing & sleep | 3,007 | 0.19 | 0.38 | -0.05 | 0.17 | 0.26 | 0.19 | -0.01 | 0.19 |
| Digestive / gastroenterology | 3,007 | 0.18 | 0.36 | -0.04 | 0.17 | 0.18 | 0.19 | -0.05 | 0.19 |
| Kidney / nephrology | 2,903 | 0.13 | 0.37 | -0.16 | 0.17 | 0.14 | 0.18 | -0.06 | 0.19 |
| Diabetes & hormones | 2,903 | 0.28 | 0.39 | 0.06 | 0.17 | 0.27 | 0.18 | 0.06 | 0.19 |
| Cancer care / oncology | 2,903 | -0.04 | -0.07 | 0.00 | 0.17 | 0.05 | 0.18 | -0.17 | 0.19 |
| Arthritis / rheumatology | 2,903 | 0.09 | 0.15 | 0.00 | 0.17 | 0.16 | 0.18 | -0.08 | 0.19 |
| Brain & nerves / neurology | 2,903 | 0.22 | 0.32 | 0.03 | 0.17 | 0.28 | 0.18 | 0.02 | 0.19 |
| Ear, nose & throat | 2,903 | 0.05 | 0.05 | 0.03 | 0.17 | 0.12 | 0.18 | -0.12 | 0.19 |
| Urology | 2,903 | 0.20 | 0.36 | -0.00 | 0.17 | 0.21 | 0.18 | 0.02 | 0.19 |
| Foot & ankle / podiatry | 2,903 | 0.25 | 0.36 | 0.06 | 0.17 | 0.21 | 0.18 | 0.03 | 0.19 |
| Pain management | 2,903 | 0.11 | 0.23 | -0.03 | 0.17 | 0.20 | 0.18 | -0.06 | 0.19 |
| Speech & language therapy | 2,903 | 0.16 | 0.32 | -0.05 | 0.17 | 0.25 | 0.18 | -0.01 | 0.19 |
| Nutrition & dietitian | 2,903 | 0.33 | 0.39 | 0.20 | 0.17 | 0.32 | 0.18 | 0.14 | 0.19 |
| Acupuncture, massage & naturopathy | 2,903 | 0.37 | 0.28 | 0.26 | 0.17 | 0.28 | 0.18 | 0.14 | 0.19 |
| Urgent care & emergency | 2,903 | -0.18 | -0.26 | 0.04 | 0.17 | -0.16 | 0.18 | -0.16 | 0.19 |
| Imaging & lab | 2,903 | -0.04 | -0.05 | -0.01 | 0.17 | 0.06 | 0.18 | -0.18 | 0.19 |
| Pharmacy | 2,903 | 0.30 | 0.37 | -0.02 | 0.17 | 0.28 | 0.18 | 0.12 | 0.19 |
| Home health & in-home care | 2,903 | 0.16 | 0.35 | -0.14 | 0.17 | 0.21 | 0.18 | 0.01 | 0.19 |
| Nursing & assisted living | 2,903 | 0.23 | 0.38 | -0.00 | 0.17 | 0.21 | 0.18 | 0.22 | 0.19 |
| Medical equipment & supplies | 2,903 | 0.16 | 0.34 | -0.13 | 0.17 | 0.22 | 0.18 | 0.02 | 0.19 |
| Hearing & audiology | 2,903 | 0.12 | 0.03 | 0.15 | 0.17 | 0.13 | 0.18 | -0.07 | 0.19 |
| Care coordination & community health | 2,903 | 0.21 | 0.37 | 0.04 | 0.17 | 0.10 | 0.18 | 0.07 | 0.19 |
| General surgery | 2,903 | 0.13 | 0.17 | 0.07 | 0.17 | 0.13 | 0.18 | -0.04 | 0.19 |
| Hospice & palliative care | 2,903 | 0.09 | 0.19 | 0.00 | 0.17 | 0.10 | 0.18 | 0.01 | 0.19 |

## 2. A practice can make it here vs clinician entry 2021 to 2025

| Specialty | ZIPs | Viability score | Pay alone | Competition alone | Top vs bottom fifth | HPSA (same ZIPs) |
|---|---|---|---|---|---|---|
| Primary care / family doctor | 20,588 | -0.01 | 0.06 | -0.18 | 0.97x | 0.21 |
| Pediatrics (children) | 20,588 | -0.25 | 0.08 | -0.42 | 0.46x | 0.22 |
| Women's health / OB-GYN | 20,588 | -0.26 | 0.10 | -0.43 | 0.53x | 0.15 |
| Mental health & counseling | 20,588 | -0.03 | 0.11 | -0.30 | 0.93x | 0.19 |
| Dental | 20,588 | -0.07 | 0.09 | -0.26 | 0.85x | 0.27 |
| Eye care | 20,588 | -0.16 | 0.09 | -0.30 | 0.65x | 0.16 |
| Chiropractic | 20,588 | -0.03 | 0.20 | -0.26 | 1.00x | 0.06 |
| Physical & occupational therapy | 20,588 | 0.05 | 0.21 | -0.26 | 1.08x | 0.05 |
| Orthopedics & sports injury | 20,588 | -0.17 | 0.11 | -0.31 | 0.74x | 0.04 |
| Heart / cardiology | 20,588 | -0.36 | 0.03 | -0.47 | 0.24x | 0.25 |
| Skin / dermatology | 20,588 | -0.38 | 0.09 | -0.55 | 0.26x | 0.22 |
| Allergy & immunology | 20,588 | -0.30 | 0.01 | -0.40 | 0.16x | 0.17 |
| Lung, breathing & sleep | 20,588 | -0.32 | 0.07 | -0.47 | 0.39x | 0.25 |
| Digestive / gastroenterology | 20,588 | -0.33 | 0.01 | -0.44 | 0.22x | 0.20 |
| Kidney / nephrology | 20,588 | -0.31 | -0.00 | -0.40 | 0.27x | 0.24 |
| Diabetes & hormones | 20,588 | -0.34 | 0.03 | -0.48 | 0.41x | 0.18 |
| Cancer care / oncology | 20,588 | -0.35 | 0.05 | -0.49 | 0.21x | 0.22 |
| Arthritis / rheumatology | 20,588 | -0.36 | -0.01 | -0.46 | 0.21x | 0.21 |
| Brain & nerves / neurology | 20,588 | -0.41 | 0.11 | -0.60 | 0.26x | 0.22 |
| Ear, nose & throat | 20,588 | -0.33 | 0.01 | -0.44 | 0.21x | 0.23 |
| Urology | 20,588 | -0.34 | 0.01 | -0.45 | 0.25x | 0.18 |
| Foot & ankle / podiatry | 20,588 | -0.32 | 0.08 | -0.47 | 0.43x | 0.17 |
| Pain management | 20,588 | -0.28 | 0.06 | -0.41 | 0.42x | 0.18 |
| Plastic & reconstructive surgery | 20,588 | -0.37 | 0.02 | -0.48 | 0.21x | 0.24 |
| Speech & language therapy | 20,588 | -0.09 | 0.16 | -0.33 | 0.85x | 0.15 |
| Nutrition & dietitian | 20,588 | -0.23 | 0.18 | -0.46 | 0.58x | 0.13 |
| Acupuncture, massage & naturopathy | 20,588 | -0.29 | 0.14 | -0.50 | 0.45x | 0.13 |
| Urgent care & emergency | 20,588 | -0.22 | 0.02 | -0.30 | 0.47x | 0.20 |
| Imaging & lab | 20,588 | -0.30 | 0.06 | -0.44 | 0.32x | 0.29 |
| Pharmacy | 20,588 | -0.05 | 0.07 | -0.22 | 0.90x | 0.20 |
| Home health & in-home care | 20,588 | -0.16 | 0.02 | -0.27 | 0.45x | 0.23 |
| Nursing & assisted living | 20,588 | -0.10 | 0.04 | -0.20 | 0.60x | 0.25 |
| Medical equipment & supplies | 20,588 | -0.20 | 0.08 | -0.35 | 0.49x | 0.27 |
| Hearing & audiology | 20,588 | -0.23 | 0.16 | -0.46 | 0.64x | 0.12 |
| Behavior therapy (ABA) | 20,588 | -0.36 | 0.14 | -0.59 | 0.32x | 0.22 |
| Care coordination & community health | 20,588 | -0.27 | 0.01 | -0.38 | 0.46x | 0.18 |
| General surgery | 20,588 | -0.30 | 0.09 | -0.47 | 0.38x | 0.21 |
| Infectious disease | 20,588 | -0.33 | 0.01 | -0.45 | 0.23x | 0.21 |
| Genetics & genetic counseling | 20,588 | -0.43 | 0.06 | -0.74 | 0.14x | 0.25 |
| Hospice & palliative care | 20,588 | -0.30 | 0.02 | -0.40 | 0.44x | 0.23 |

## 3. For reference: patients need care here vs entry (the first run's finding)

Negative means new clinicians went where supply was already dense, not where the need score pointed.

| Specialty | ZIPs | Need score | Need alone | Access alone | Top vs bottom fifth |
|---|---|---|---|---|---|
| Primary care / family doctor | 20,281 | -0.68 | -0.27 | -0.84 | 0.29x |
| Pediatrics (children) | 0 | n/a | n/a | n/a | n/a |
| Women's health / OB-GYN | 0 | n/a | n/a | n/a | n/a |
| Mental health & counseling | 20,281 | -0.68 | -0.00 | -0.88 | 0.24x |
| Dental | 21,427 | -0.50 | -0.25 | -0.66 | 0.34x |
| Eye care | 20,281 | -0.40 | -0.14 | -0.55 | 0.33x |
| Chiropractic | 20,281 | -0.57 | -0.39 | -0.56 | 0.17x |
| Physical & occupational therapy | 20,281 | -0.71 | -0.48 | -0.76 | 0.32x |
| Orthopedics & sports injury | 20,281 | -0.56 | -0.35 | -0.56 | 0.19x |
| Heart / cardiology | 20,281 | -0.61 | -0.38 | -0.58 | 0.03x |
| Skin / dermatology | 0 | n/a | n/a | n/a | n/a |
| Allergy & immunology | 20,281 | -0.38 | -0.18 | -0.40 | 0.01x |
| Lung, breathing & sleep | 21,427 | -0.54 | -0.26 | -0.56 | 0.20x |
| Digestive / gastroenterology | 21,427 | -0.49 | -0.12 | -0.54 | 0.02x |
| Kidney / nephrology | 20,281 | -0.49 | -0.18 | -0.47 | 0.08x |
| Diabetes & hormones | 20,281 | -0.51 | -0.25 | -0.54 | 0.16x |
| Cancer care / oncology | 20,281 | -0.62 | -0.45 | -0.59 | 0.02x |
| Arthritis / rheumatology | 20,281 | -0.51 | -0.40 | -0.49 | 0.02x |
| Brain & nerves / neurology | 20,281 | -0.72 | -0.40 | -0.74 | 0.02x |
| Ear, nose & throat | 20,281 | -0.53 | -0.40 | -0.48 | 0.00x |
| Urology | 20,281 | -0.42 | -0.14 | -0.47 | 0.04x |
| Foot & ankle / podiatry | 20,281 | -0.53 | -0.32 | -0.53 | 0.12x |
| Pain management | 20,281 | -0.46 | -0.36 | -0.42 | 0.06x |
| Plastic & reconstructive surgery | 0 | n/a | n/a | n/a | n/a |
| Speech & language therapy | 20,281 | -0.59 | -0.36 | -0.62 | 0.32x |
| Nutrition & dietitian | 20,281 | -0.69 | -0.55 | -0.64 | 0.17x |
| Acupuncture, massage & naturopathy | 20,281 | -0.68 | -0.45 | -0.71 | 0.13x |
| Urgent care & emergency | 20,281 | -0.30 | 0.10 | -0.55 | 0.24x |
| Imaging & lab | 20,281 | -0.65 | -0.51 | -0.59 | 0.07x |
| Pharmacy | 20,281 | -0.42 | -0.18 | -0.56 | 0.48x |
| Home health & in-home care | 20,281 | -0.28 | 0.05 | -0.53 | 0.05x |
| Nursing & assisted living | 20,281 | -0.05 | -0.01 | -0.10 | 0.34x |
| Medical equipment & supplies | 20,281 | -0.36 | -0.13 | -0.38 | 0.31x |
| Hearing & audiology | 20,281 | -0.61 | -0.30 | -0.66 | 0.15x |
| Behavior therapy (ABA) | 0 | n/a | n/a | n/a | n/a |
| Care coordination & community health | 20,281 | -0.61 | -0.07 | -0.80 | 0.10x |
| General surgery | 20,281 | -0.72 | -0.48 | -0.69 | 0.04x |
| Infectious disease | 0 | n/a | n/a | n/a | n/a |
| Genetics & genetic counseling | 0 | n/a | n/a | n/a | n/a |
| Hospice & palliative care | 20,281 | -0.42 | -0.39 | -0.31 | 0.20x |
