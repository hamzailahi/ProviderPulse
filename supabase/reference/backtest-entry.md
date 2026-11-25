# Back-test: need against health outcomes, viability against entry

Run 2026-11-25 by scripts/backtest-entry.mjs. Read only.

Two scores, each against the outcome it claims to predict (2026-11-19, the user's choice after the first run showed new clinicians going to already-supplied areas):

- **Patients need care here** = the mean of the need factor (CDC PLACES against national percentiles; age mix left out here) and the access factor (where `access_e2sfca` holds the ZIP and specialty, the stored drive-time E2SFCA figure the live score reads, against the site-weighted national rate; else listings per adult in the 10-mile catchment against the national rate; drive time covered 734,067 of 862,080 ZIP x specialty rows with an access figure). Tested with today's supply against county outcomes that thin access is known to raise: preventable hospital stays (County Health Rankings: stays for conditions good outpatient care usually prevents, per 100,000 Medicare enrollees; CMS publishes its own county rates as NA), ER visits per 1,000 and readmission rate (Medicare fee-for-service, newest year). County score = adult-weighted mean of its ZIPs (HUD main county). Higher correlation is better: a need score should rise with preventable stays.
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
| Primary care / family doctor | 2,903 | 0.28 | 0.37 | 0.04 | 0.17 | 0.27 | 0.18 | 0.12 | 0.19 |
| Mental health & counseling | 2,903 | 0.31 | 0.26 | 0.19 | 0.06 | 0.24 | 0.10 | 0.10 | 0.09 |
| Dental | 3,007 | 0.43 | 0.45 | 0.27 | 0.13 | 0.35 | 0.14 | 0.22 | 0.17 |
| Eye care | 2,903 | 0.31 | 0.36 | 0.14 | 0.17 | 0.27 | 0.18 | 0.17 | 0.19 |
| Chiropractic | 2,903 | 0.34 | 0.31 | 0.26 | 0.17 | 0.34 | 0.18 | 0.22 | 0.19 |
| Physical & occupational therapy | 2,903 | 0.27 | 0.27 | 0.16 | 0.17 | 0.31 | 0.18 | 0.10 | 0.19 |
| Orthopedics & sports injury | 2,903 | 0.23 | 0.27 | 0.12 | 0.17 | 0.23 | 0.18 | 0.06 | 0.19 |
| Heart / cardiology | 2,903 | 0.16 | 0.28 | -0.04 | 0.17 | 0.21 | 0.18 | -0.04 | 0.19 |
| Allergy & immunology | 2,903 | 0.07 | 0.08 | 0.00 | 0.17 | 0.26 | 0.18 | -0.02 | 0.19 |
| Lung, breathing & sleep | 3,007 | 0.21 | 0.38 | -0.04 | 0.17 | 0.28 | 0.19 | 0.00 | 0.19 |
| Digestive / gastroenterology | 3,007 | 0.20 | 0.36 | -0.04 | 0.17 | 0.20 | 0.19 | -0.03 | 0.19 |
| Kidney / nephrology | 2,903 | 0.14 | 0.37 | -0.18 | 0.17 | 0.17 | 0.18 | -0.04 | 0.19 |
| Diabetes & hormones | 2,903 | 0.30 | 0.39 | 0.07 | 0.17 | 0.29 | 0.18 | 0.08 | 0.19 |
| Cancer care / oncology | 2,903 | -0.04 | -0.07 | -0.00 | 0.17 | 0.05 | 0.18 | -0.19 | 0.19 |
| Arthritis / rheumatology | 2,903 | 0.11 | 0.15 | 0.00 | 0.17 | 0.18 | 0.18 | -0.07 | 0.19 |
| Brain & nerves / neurology | 2,903 | 0.22 | 0.32 | 0.02 | 0.17 | 0.28 | 0.18 | 0.02 | 0.19 |
| Ear, nose & throat | 2,903 | 0.05 | 0.05 | 0.02 | 0.17 | 0.13 | 0.18 | -0.12 | 0.19 |
| Urology | 2,903 | 0.22 | 0.36 | -0.01 | 0.17 | 0.23 | 0.18 | 0.03 | 0.19 |
| Foot & ankle / podiatry | 2,903 | 0.26 | 0.36 | 0.06 | 0.17 | 0.24 | 0.18 | 0.04 | 0.19 |
| Pain management | 2,903 | 0.12 | 0.23 | -0.03 | 0.17 | 0.22 | 0.18 | -0.05 | 0.19 |
| Speech & language therapy | 2,903 | 0.19 | 0.32 | -0.01 | 0.17 | 0.24 | 0.18 | 0.01 | 0.19 |
| Nutrition & dietitian | 2,903 | 0.33 | 0.39 | 0.17 | 0.17 | 0.31 | 0.18 | 0.15 | 0.19 |
| Acupuncture, massage & naturopathy | 2,903 | 0.37 | 0.28 | 0.26 | 0.17 | 0.29 | 0.18 | 0.14 | 0.19 |
| Urgent care & emergency | 2,903 | -0.18 | -0.26 | 0.04 | 0.17 | -0.18 | 0.18 | -0.12 | 0.19 |
| Imaging & lab | 2,903 | -0.05 | -0.05 | -0.03 | 0.17 | 0.06 | 0.18 | -0.18 | 0.19 |
| Pharmacy | 2,903 | 0.29 | 0.37 | -0.02 | 0.17 | 0.29 | 0.18 | 0.14 | 0.19 |
| Home health & in-home care | 2,903 | 0.17 | 0.35 | -0.11 | 0.17 | 0.21 | 0.18 | 0.03 | 0.19 |
| Nursing & assisted living | 2,903 | 0.24 | 0.38 | 0.02 | 0.17 | 0.24 | 0.18 | 0.22 | 0.19 |
| Medical equipment & supplies | 2,903 | 0.17 | 0.34 | -0.13 | 0.17 | 0.25 | 0.18 | 0.04 | 0.19 |
| Hearing & audiology | 2,903 | 0.12 | 0.03 | 0.14 | 0.17 | 0.13 | 0.18 | -0.08 | 0.19 |
| Care coordination & community health | 2,903 | 0.23 | 0.37 | 0.06 | 0.17 | 0.12 | 0.18 | 0.08 | 0.19 |
| General surgery | 2,903 | 0.14 | 0.17 | 0.07 | 0.17 | 0.14 | 0.18 | -0.05 | 0.19 |
| Hospice & palliative care | 2,903 | 0.10 | 0.19 | -0.00 | 0.17 | 0.12 | 0.18 | 0.01 | 0.19 |

## 2. A practice can make it here vs clinician entry 2021 to 2025

Payer yield (dry run, 2026-11-20): coverage weighted by what it pays relative to Medicare (commercial 1.43, Medicare 1.0, Medicaid 0.72, uninsured 0; published national averages), then 70% yield and 30% income as percentiles in the state, beside the live pay factor (insured rate and income).

| Specialty | ZIPs | Viability score | Pay alone (live) | Payer yield (dry run) | Pay: top vs bottom fifth | Yield: top vs bottom fifth | Competition alone | HPSA (same ZIPs) |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 20,588 | 0.05 | 0.12 | 0.12 | 1.18x | 1.18x | -0.18 | 0.21 |
| Pediatrics (children) | 20,588 | -0.18 | 0.15 | 0.15 | n/a | n/a | -0.42 | 0.22 |
| Women's health / OB-GYN | 20,588 | -0.20 | 0.17 | 0.17 | n/a | n/a | -0.43 | 0.15 |
| Mental health & counseling | 20,588 | 0.04 | 0.18 | 0.18 | 1.29x | 1.29x | -0.30 | 0.19 |
| Dental | 20,588 | -0.01 | 0.16 | 0.16 | 1.26x | 1.26x | -0.26 | 0.27 |
| Eye care | 20,588 | -0.11 | 0.14 | 0.14 | 1.29x | 1.29x | -0.30 | 0.16 |
| Chiropractic | 20,588 | 0.04 | 0.27 | 0.27 | 2.00x | 2.00x | -0.26 | 0.06 |
| Physical & occupational therapy | 20,588 | 0.14 | 0.30 | 0.30 | 1.57x | 1.57x | -0.26 | 0.05 |
| Orthopedics & sports injury | 20,588 | -0.10 | 0.18 | 0.18 | 1.44x | 1.44x | -0.31 | 0.04 |
| Heart / cardiology | 20,588 | -0.30 | 0.09 | 0.09 | 1.31x | 1.31x | -0.47 | 0.25 |
| Skin / dermatology | 20,588 | -0.31 | 0.16 | 0.16 | n/a | n/a | -0.55 | 0.22 |
| Allergy & immunology | 20,588 | -0.27 | 0.05 | 0.05 | 1.73x | 1.73x | -0.40 | 0.17 |
| Lung, breathing & sleep | 20,588 | -0.27 | 0.11 | 0.11 | 0.86x | 0.86x | -0.47 | 0.25 |
| Digestive / gastroenterology | 20,588 | -0.28 | 0.07 | 0.07 | 1.37x | 1.37x | -0.44 | 0.20 |
| Kidney / nephrology | 20,588 | -0.27 | 0.05 | 0.05 | 1.04x | 1.04x | -0.40 | 0.24 |
| Diabetes & hormones | 20,588 | -0.28 | 0.09 | 0.09 | 1.14x | 1.14x | -0.48 | 0.18 |
| Cancer care / oncology | 20,588 | -0.30 | 0.11 | 0.10 | 1.31x | 1.31x | -0.49 | 0.22 |
| Arthritis / rheumatology | 20,588 | -0.31 | 0.04 | 0.04 | 1.41x | 1.41x | -0.46 | 0.21 |
| Brain & nerves / neurology | 20,588 | -0.33 | 0.18 | 0.18 | 2.03x | 2.03x | -0.60 | 0.22 |
| Ear, nose & throat | 20,588 | -0.29 | 0.06 | 0.06 | 1.52x | 1.52x | -0.44 | 0.23 |
| Urology | 20,588 | -0.29 | 0.06 | 0.06 | 1.32x | 1.32x | -0.45 | 0.18 |
| Foot & ankle / podiatry | 20,588 | -0.26 | 0.14 | 0.14 | 1.29x | 1.29x | -0.47 | 0.17 |
| Pain management | 20,588 | -0.23 | 0.11 | 0.11 | 1.84x | 1.84x | -0.41 | 0.18 |
| Plastic & reconstructive surgery | 20,588 | -0.32 | 0.07 | 0.07 | n/a | n/a | -0.48 | 0.24 |
| Speech & language therapy | 20,588 | -0.01 | 0.25 | 0.25 | 1.57x | 1.57x | -0.33 | 0.15 |
| Nutrition & dietitian | 20,588 | -0.15 | 0.27 | 0.27 | 1.75x | 1.75x | -0.46 | 0.13 |
| Acupuncture, massage & naturopathy | 20,588 | -0.22 | 0.22 | 0.22 | 1.70x | 1.70x | -0.50 | 0.13 |
| Urgent care & emergency | 20,588 | -0.16 | 0.08 | 0.08 | 0.87x | 0.87x | -0.30 | 0.20 |
| Imaging & lab | 20,588 | -0.25 | 0.12 | 0.12 | 1.19x | 1.19x | -0.44 | 0.29 |
| Pharmacy | 20,588 | -0.01 | 0.12 | 0.12 | 1.15x | 1.15x | -0.22 | 0.20 |
| Home health & in-home care | 20,588 | -0.14 | 0.04 | 0.04 | 0.91x | 0.91x | -0.27 | 0.23 |
| Nursing & assisted living | 20,588 | -0.07 | 0.07 | 0.07 | 0.89x | 0.89x | -0.20 | 0.25 |
| Medical equipment & supplies | 20,588 | -0.15 | 0.13 | 0.13 | 1.21x | 1.21x | -0.35 | 0.27 |
| Hearing & audiology | 20,588 | -0.17 | 0.22 | 0.22 | 1.60x | 1.60x | -0.46 | 0.12 |
| Behavior therapy (ABA) | 20,588 | -0.30 | 0.22 | 0.22 | n/a | n/a | -0.59 | 0.22 |
| Care coordination & community health | 20,588 | -0.23 | 0.05 | 0.05 | 0.93x | 0.93x | -0.38 | 0.18 |
| General surgery | 20,588 | -0.23 | 0.17 | 0.17 | 1.46x | 1.46x | -0.47 | 0.21 |
| Infectious disease | 20,588 | -0.28 | 0.05 | 0.05 | n/a | n/a | -0.45 | 0.21 |
| Genetics & genetic counseling | 20,588 | -0.35 | 0.14 | 0.14 | n/a | n/a | -0.74 | 0.25 |
| Hospice & palliative care | 20,588 | -0.26 | 0.07 | 0.07 | 1.10x | 1.10x | -0.40 | 0.23 |

### 2b. Payer yield by the specialty's patients' ages (dry run, 2026-11-24)

The same yield, built from Census coverage in three age bands (signals.cov_age) weighted toward the ages each specialty sees (PROFILES age measures: 1 + 4 x the weight, or that band alone at weight 1). Compared on the same ZIPs with the one-figure yield.

| Specialty | ZIPs | One yield (same ZIPs) | Yield by age | By age: top vs bottom fifth |
|---|---|---|---|---|
| Primary care / family doctor | 20,587 | 0.12 | 0.11 | 1.16x |
| Pediatrics (children) | 20,563 | 0.15 | 0.14 | n/a |
| Women's health / OB-GYN | 20,586 | 0.17 | 0.17 | n/a |
| Mental health & counseling | 20,587 | 0.18 | 0.18 | 1.29x |
| Dental | 20,587 | 0.16 | 0.16 | 1.26x |
| Eye care | 20,587 | 0.14 | 0.13 | 1.25x |
| Chiropractic | 20,587 | 0.27 | 0.27 | 2.00x |
| Physical & occupational therapy | 20,587 | 0.30 | 0.29 | 1.55x |
| Orthopedics & sports injury | 20,587 | 0.18 | 0.18 | 1.44x |
| Heart / cardiology | 20,587 | 0.09 | 0.08 | 1.24x |
| Skin / dermatology | 20,587 | 0.16 | 0.15 | n/a |
| Allergy & immunology | 20,587 | 0.05 | 0.05 | 1.73x |
| Lung, breathing & sleep | 20,587 | 0.11 | 0.11 | 0.86x |
| Digestive / gastroenterology | 20,587 | 0.07 | 0.06 | 1.34x |
| Kidney / nephrology | 20,587 | 0.05 | 0.05 | 1.04x |
| Diabetes & hormones | 20,587 | 0.09 | 0.09 | 1.14x |
| Cancer care / oncology | 20,587 | 0.10 | 0.09 | 1.24x |
| Arthritis / rheumatology | 20,587 | 0.04 | 0.04 | 1.41x |
| Brain & nerves / neurology | 20,587 | 0.18 | 0.17 | 1.93x |
| Ear, nose & throat | 20,587 | 0.06 | 0.06 | 1.52x |
| Urology | 20,587 | 0.06 | 0.04 | 1.25x |
| Foot & ankle / podiatry | 20,587 | 0.14 | 0.13 | 1.28x |
| Pain management | 20,587 | 0.11 | 0.11 | 1.84x |
| Plastic & reconstructive surgery | 20,587 | 0.07 | 0.07 | n/a |
| Speech & language therapy | 20,587 | 0.25 | 0.24 | 1.57x |
| Nutrition & dietitian | 20,587 | 0.27 | 0.27 | 1.75x |
| Acupuncture, massage & naturopathy | 20,587 | 0.22 | 0.22 | 1.70x |
| Urgent care & emergency | 20,587 | 0.08 | 0.08 | 0.87x |
| Imaging & lab | 20,587 | 0.12 | 0.10 | 1.16x |
| Pharmacy | 20,587 | 0.12 | 0.12 | 1.15x |
| Home health & in-home care | 20,587 | 0.04 | 0.02 | 0.84x |
| Nursing & assisted living | 20,433 | 0.07 | 0.00 | 0.80x |
| Medical equipment & supplies | 20,587 | 0.13 | 0.11 | 1.17x |
| Hearing & audiology | 20,587 | 0.22 | 0.21 | 1.56x |
| Behavior therapy (ABA) | 20,563 | 0.22 | 0.20 | n/a |
| Care coordination & community health | 20,587 | 0.05 | 0.05 | 0.93x |
| General surgery | 20,587 | 0.17 | 0.15 | 1.39x |
| Infectious disease | 20,587 | 0.05 | 0.05 | n/a |
| Genetics & genetic counseling | 20,587 | 0.14 | 0.14 | n/a |
| Hospice & palliative care | 20,433 | 0.06 | -0.05 | 0.88x |

## 3. For reference: patients need care here vs entry (the first run's finding)

Negative means new clinicians went where supply was already dense, not where the need score pointed.

| Specialty | ZIPs | Need score | Need alone | Access alone | Top vs bottom fifth |
|---|---|---|---|---|---|
| Primary care / family doctor | 20,281 | -0.68 | -0.27 | -0.84 | 0.29x |
| Pediatrics (children) | 0 | n/a | n/a | n/a | n/a |
| Women's health / OB-GYN | 0 | n/a | n/a | n/a | n/a |
| Mental health & counseling | 20,281 | -0.67 | -0.00 | -0.88 | 0.25x |
| Dental | 21,427 | -0.49 | -0.25 | -0.66 | 0.35x |
| Eye care | 20,281 | -0.40 | -0.14 | -0.55 | 0.34x |
| Chiropractic | 20,281 | -0.57 | -0.39 | -0.56 | 0.17x |
| Physical & occupational therapy | 20,281 | -0.70 | -0.48 | -0.76 | 0.32x |
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
| Foot & ankle / podiatry | 20,281 | -0.53 | -0.32 | -0.53 | 0.13x |
| Pain management | 20,281 | -0.46 | -0.36 | -0.42 | 0.06x |
| Plastic & reconstructive surgery | 0 | n/a | n/a | n/a | n/a |
| Speech & language therapy | 20,281 | -0.58 | -0.36 | -0.62 | 0.32x |
| Nutrition & dietitian | 20,281 | -0.68 | -0.55 | -0.64 | 0.17x |
| Acupuncture, massage & naturopathy | 20,281 | -0.68 | -0.45 | -0.71 | 0.14x |
| Urgent care & emergency | 20,281 | -0.29 | 0.10 | -0.55 | 0.24x |
| Imaging & lab | 20,281 | -0.65 | -0.51 | -0.59 | 0.07x |
| Pharmacy | 20,281 | -0.42 | -0.18 | -0.56 | 0.49x |
| Home health & in-home care | 20,281 | -0.26 | 0.05 | -0.53 | 0.05x |
| Nursing & assisted living | 20,281 | -0.05 | -0.01 | -0.10 | 0.34x |
| Medical equipment & supplies | 20,281 | -0.36 | -0.13 | -0.38 | 0.33x |
| Hearing & audiology | 20,281 | -0.61 | -0.30 | -0.66 | 0.15x |
| Behavior therapy (ABA) | 0 | n/a | n/a | n/a | n/a |
| Care coordination & community health | 20,281 | -0.60 | -0.07 | -0.80 | 0.10x |
| General surgery | 20,281 | -0.71 | -0.48 | -0.69 | 0.04x |
| Infectious disease | 0 | n/a | n/a | n/a | n/a |
| Genetics & genetic counseling | 0 | n/a | n/a | n/a | n/a |
| Hospice & palliative care | 20,281 | -0.42 | -0.39 | -0.31 | 0.20x |

## 4. Confidence, controls and holdout (2026-11-25)

Added for citation. Units are counties for 4a to 4c and ZIPs for 4d. "95% CI" is the analytic interval for Spearman's rho (Fisher z with the Bonett and Wright 2000 standard error); "p" is two-sided from the t approximation with n-2 degrees of freedom. "Score - HPSA" is a paired bootstrap over the same counties (500 resamples, seed 1): the 95% interval of the difference in rho, and the share of resamples where the score's rho was higher. Score and HPSA use exactly the same counties here (those with an HPSA match), so n can differ slightly from section 1. With thousands of units even small correlations are statistically significant; the interval is the useful figure.

### 4a. Preventable hospital stays: score vs HPSA

| Specialty | Counties | Score rho | 95% CI | p | HPSA rho | 95% CI | p | Score - HPSA, 95% CI | Resamples score > HPSA |
|---|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 2,874 | 0.28 | [0.25, 0.32] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.07, 0.16] | 100% |
| Mental health & counseling | 2,874 | 0.31 | [0.28, 0.35] | <0.001 | 0.06 | [0.02, 0.09] | 0.002 | [0.20, 0.30] | 100% |
| Dental | 2,978 | 0.43 | [0.40, 0.46] | <0.001 | 0.13 | [0.09, 0.16] | <0.001 | [0.26, 0.35] | 100% |
| Eye care | 2,874 | 0.31 | [0.28, 0.34] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.10, 0.18] | 100% |
| Chiropractic | 2,874 | 0.34 | [0.30, 0.37] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.13, 0.21] | 100% |
| Physical & occupational therapy | 2,874 | 0.27 | [0.23, 0.30] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.05, 0.14] | 100% |
| Orthopedics & sports injury | 2,874 | 0.23 | [0.19, 0.26] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.01, 0.10] | 99% |
| Heart / cardiology | 2,874 | 0.16 | [0.13, 0.20] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.06, 0.04] | 34% |
| Allergy & immunology | 2,874 | 0.07 | [0.03, 0.10] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.15, -0.06] | 0% |
| Lung, breathing & sleep | 2,978 | 0.21 | [0.18, 0.25] | <0.001 | 0.17 | [0.14, 0.21] | <0.001 | [-0.01, 0.08] | 94% |
| Digestive / gastroenterology | 2,978 | 0.20 | [0.17, 0.24] | <0.001 | 0.17 | [0.14, 0.21] | <0.001 | [-0.02, 0.08] | 87% |
| Kidney / nephrology | 2,874 | 0.14 | [0.11, 0.18] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.08, 0.02] | 14% |
| Diabetes & hormones | 2,874 | 0.30 | [0.26, 0.33] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.08, 0.18] | 100% |
| Cancer care / oncology | 2,874 | -0.04 | [-0.08, -0.01] | 0.017 | 0.17 | [0.13, 0.20] | <0.001 | [-0.27, -0.16] | 0% |
| Arthritis / rheumatology | 2,874 | 0.11 | [0.07, 0.14] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.11, -0.01] | 1% |
| Brain & nerves / neurology | 2,874 | 0.22 | [0.19, 0.26] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.01, 0.10] | 99% |
| Ear, nose & throat | 2,874 | 0.05 | [0.01, 0.09] | 0.007 | 0.17 | [0.13, 0.20] | <0.001 | [-0.17, -0.07] | 0% |
| Urology | 2,874 | 0.22 | [0.19, 0.26] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.01, 0.10] | 99% |
| Foot & ankle / podiatry | 2,874 | 0.26 | [0.22, 0.29] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.04, 0.14] | 100% |
| Pain management | 2,874 | 0.12 | [0.09, 0.16] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.10, 0.00] | 3% |
| Speech & language therapy | 2,874 | 0.19 | [0.15, 0.23] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.02, 0.07] | 75% |
| Nutrition & dietitian | 2,874 | 0.33 | [0.29, 0.36] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.11, 0.21] | 100% |
| Acupuncture, massage & naturopathy | 2,874 | 0.37 | [0.34, 0.40] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.16, 0.25] | 100% |
| Urgent care & emergency | 2,874 | -0.18 | [-0.21, -0.14] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.40, -0.30] | 0% |
| Imaging & lab | 2,874 | -0.05 | [-0.09, -0.01] | 0.008 | 0.17 | [0.13, 0.20] | <0.001 | [-0.27, -0.16] | 0% |
| Pharmacy | 2,874 | 0.29 | [0.25, 0.32] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.07, 0.16] | 100% |
| Home health & in-home care | 2,874 | 0.17 | [0.14, 0.21] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.05, 0.05] | 49% |
| Nursing & assisted living | 2,874 | 0.24 | [0.20, 0.27] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.02, 0.11] | 100% |
| Medical equipment & supplies | 2,874 | 0.17 | [0.14, 0.21] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.05, 0.05] | 55% |
| Hearing & audiology | 2,874 | 0.12 | [0.08, 0.15] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.10, -0.00] | 2% |
| Care coordination & community health | 2,874 | 0.23 | [0.19, 0.26] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [0.01, 0.11] | 99% |
| General surgery | 2,874 | 0.14 | [0.10, 0.17] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.09, 0.02] | 11% |
| Hospice & palliative care | 2,874 | 0.10 | [0.06, 0.13] | <0.001 | 0.17 | [0.13, 0.20] | <0.001 | [-0.13, -0.02] | 1% |

### 4b. ER visits and readmissions: score vs HPSA

| Specialty | Counties | ER: score rho [CI] | ER: HPSA rho [CI] | ER: score - HPSA, 95% CI | Readmissions: score rho [CI] | Readmissions: HPSA rho [CI] |
|---|---|---|---|---|---|---|
| Primary care / family doctor | 2,903 | 0.27 [0.24, 0.31] | 0.18 [0.14, 0.22] | [0.05, 0.15] | 0.12 [0.08, 0.15] | 0.19 [0.16, 0.23] |
| Mental health & counseling | 2,903 | 0.24 [0.20, 0.27] | 0.10 [0.06, 0.14] | [0.08, 0.19] | 0.10 [0.06, 0.14] | 0.09 [0.06, 0.13] |
| Dental | 3,007 | 0.35 [0.31, 0.38] | 0.14 [0.11, 0.18] | [0.16, 0.25] | 0.22 [0.18, 0.25] | 0.17 [0.14, 0.21] |
| Eye care | 2,903 | 0.27 [0.24, 0.31] | 0.18 [0.14, 0.22] | [0.05, 0.14] | 0.17 [0.13, 0.20] | 0.19 [0.16, 0.23] |
| Chiropractic | 2,903 | 0.34 [0.30, 0.37] | 0.18 [0.14, 0.22] | [0.11, 0.20] | 0.22 [0.19, 0.26] | 0.19 [0.16, 0.23] |
| Physical & occupational therapy | 2,903 | 0.31 [0.28, 0.34] | 0.18 [0.14, 0.22] | [0.09, 0.17] | 0.10 [0.06, 0.13] | 0.19 [0.16, 0.23] |
| Orthopedics & sports injury | 2,903 | 0.23 [0.19, 0.26] | 0.18 [0.14, 0.22] | [0.01, 0.09] | 0.06 [0.02, 0.10] | 0.19 [0.16, 0.23] |
| Heart / cardiology | 2,903 | 0.21 [0.17, 0.24] | 0.18 [0.14, 0.22] | [-0.01, 0.08] | -0.04 [-0.07, -0.00] | 0.19 [0.16, 0.23] |
| Allergy & immunology | 2,903 | 0.26 [0.22, 0.29] | 0.18 [0.14, 0.22] | [0.03, 0.12] | -0.02 [-0.06, 0.01] | 0.19 [0.16, 0.23] |
| Lung, breathing & sleep | 3,007 | 0.28 [0.25, 0.31] | 0.19 [0.15, 0.22] | [0.05, 0.14] | 0.00 [-0.03, 0.04] | 0.19 [0.16, 0.23] |
| Digestive / gastroenterology | 3,007 | 0.20 [0.16, 0.23] | 0.19 [0.15, 0.22] | [-0.04, 0.05] | -0.03 [-0.06, 0.01] | 0.19 [0.16, 0.23] |
| Kidney / nephrology | 2,903 | 0.17 [0.13, 0.20] | 0.18 [0.14, 0.22] | [-0.06, 0.04] | -0.04 [-0.08, -0.01] | 0.19 [0.16, 0.23] |
| Diabetes & hormones | 2,903 | 0.29 [0.25, 0.32] | 0.18 [0.14, 0.22] | [0.06, 0.15] | 0.08 [0.04, 0.12] | 0.19 [0.16, 0.23] |
| Cancer care / oncology | 2,903 | 0.05 [0.01, 0.09] | 0.18 [0.14, 0.22] | [-0.18, -0.08] | -0.19 [-0.22, -0.15] | 0.19 [0.16, 0.23] |
| Arthritis / rheumatology | 2,903 | 0.18 [0.14, 0.21] | 0.18 [0.14, 0.22] | [-0.05, 0.04] | -0.07 [-0.10, -0.03] | 0.19 [0.16, 0.23] |
| Brain & nerves / neurology | 2,903 | 0.28 [0.25, 0.31] | 0.18 [0.14, 0.22] | [0.06, 0.14] | 0.02 [-0.02, 0.06] | 0.19 [0.16, 0.23] |
| Ear, nose & throat | 2,903 | 0.13 [0.09, 0.16] | 0.18 [0.14, 0.22] | [-0.10, -0.00] | -0.12 [-0.16, -0.09] | 0.19 [0.16, 0.23] |
| Urology | 2,903 | 0.23 [0.19, 0.26] | 0.18 [0.14, 0.22] | [0.00, 0.09] | 0.03 [-0.00, 0.07] | 0.19 [0.16, 0.23] |
| Foot & ankle / podiatry | 2,903 | 0.24 [0.20, 0.27] | 0.18 [0.14, 0.22] | [0.01, 0.10] | 0.04 [0.01, 0.08] | 0.19 [0.16, 0.23] |
| Pain management | 2,903 | 0.22 [0.18, 0.25] | 0.18 [0.14, 0.22] | [-0.01, 0.08] | -0.05 [-0.08, -0.01] | 0.19 [0.16, 0.23] |
| Speech & language therapy | 2,903 | 0.24 [0.20, 0.27] | 0.18 [0.14, 0.22] | [0.02, 0.10] | 0.01 [-0.02, 0.05] | 0.19 [0.16, 0.23] |
| Nutrition & dietitian | 2,903 | 0.31 [0.28, 0.34] | 0.18 [0.14, 0.22] | [0.09, 0.17] | 0.15 [0.12, 0.19] | 0.19 [0.16, 0.23] |
| Acupuncture, massage & naturopathy | 2,903 | 0.29 [0.25, 0.32] | 0.18 [0.14, 0.22] | [0.06, 0.15] | 0.14 [0.10, 0.17] | 0.19 [0.16, 0.23] |
| Urgent care & emergency | 2,903 | -0.18 [-0.21, -0.14] | 0.18 [0.14, 0.22] | [-0.42, -0.31] | -0.12 [-0.16, -0.09] | 0.19 [0.16, 0.23] |
| Imaging & lab | 2,903 | 0.06 [0.02, 0.10] | 0.18 [0.14, 0.22] | [-0.17, -0.07] | -0.18 [-0.22, -0.14] | 0.19 [0.16, 0.23] |
| Pharmacy | 2,903 | 0.29 [0.25, 0.32] | 0.18 [0.14, 0.22] | [0.06, 0.15] | 0.14 [0.10, 0.17] | 0.19 [0.16, 0.23] |
| Home health & in-home care | 2,903 | 0.21 [0.17, 0.24] | 0.18 [0.14, 0.22] | [-0.02, 0.07] | 0.03 [-0.01, 0.06] | 0.19 [0.16, 0.23] |
| Nursing & assisted living | 2,903 | 0.24 [0.20, 0.27] | 0.18 [0.14, 0.22] | [0.02, 0.10] | 0.22 [0.18, 0.25] | 0.19 [0.16, 0.23] |
| Medical equipment & supplies | 2,903 | 0.25 [0.21, 0.28] | 0.18 [0.14, 0.22] | [0.03, 0.11] | 0.04 [0.01, 0.08] | 0.19 [0.16, 0.23] |
| Hearing & audiology | 2,903 | 0.13 [0.10, 0.17] | 0.18 [0.14, 0.22] | [-0.09, 0.01] | -0.08 [-0.11, -0.04] | 0.19 [0.16, 0.23] |
| Care coordination & community health | 2,903 | 0.12 [0.08, 0.16] | 0.18 [0.14, 0.22] | [-0.11, -0.01] | 0.08 [0.04, 0.11] | 0.19 [0.16, 0.23] |
| General surgery | 2,903 | 0.14 [0.10, 0.17] | 0.18 [0.14, 0.22] | [-0.09, 0.01] | -0.05 [-0.08, -0.01] | 0.19 [0.16, 0.23] |
| Hospice & palliative care | 2,903 | 0.12 [0.08, 0.16] | 0.18 [0.14, 0.22] | [-0.11, -0.01] | 0.01 [-0.03, 0.04] | 0.19 [0.16, 0.23] |

### 4c. With controls, and on held-out counties

Partial Spearman: score and outcome each adjusted (on ranks, by least squares) for county adults (log), adult-weighted median household income and share 65+. Holdout: counties split in two by a hash of the FIPS code; the weight rule (rho 0.15+ full, 0.05 to 0.15 half, under 0.05 none) and the caution rule (score under 0.10) are read on half A and checked on half B.

| Specialty | Counties with controls | Preventable stays: score partial rho | HPSA partial rho | Half A / B counties | Score rho A / B | Access weight A -> B same? | Need weight A -> B same? | Caution A / B |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 2,871 | 0.21 | 0.01 | 1426 / 1448 | 0.30 / 0.26 | no | yes | no / no |
| Mental health & counseling | 2,871 | 0.22 | -0.04 | 1426 / 1448 | 0.31 / 0.31 | yes | yes | no / no |
| Dental | 2,975 | 0.31 | -0.02 | 1475 / 1503 | 0.45 / 0.41 | yes | yes | no / no |
| Eye care | 2,871 | 0.19 | 0.01 | 1426 / 1448 | 0.33 / 0.29 | yes | yes | no / no |
| Chiropractic | 2,871 | 0.21 | 0.01 | 1426 / 1448 | 0.35 / 0.33 | yes | yes | no / no |
| Physical & occupational therapy | 2,871 | 0.18 | 0.01 | 1426 / 1448 | 0.28 / 0.25 | no | yes | no / no |
| Orthopedics & sports injury | 2,871 | 0.20 | 0.01 | 1426 / 1448 | 0.24 / 0.21 | yes | yes | no / no |
| Heart / cardiology | 2,871 | 0.17 | 0.01 | 1426 / 1448 | 0.18 / 0.14 | yes | yes | no / no |
| Allergy & immunology | 2,871 | -0.00 | 0.01 | 1426 / 1448 | 0.07 / 0.07 | yes | yes | yes / yes |
| Lung, breathing & sleep | 2,975 | 0.17 | 0.01 | 1475 / 1503 | 0.23 / 0.19 | yes | yes | no / no |
| Digestive / gastroenterology | 2,975 | 0.13 | 0.01 | 1475 / 1503 | 0.23 / 0.18 | yes | yes | no / no |
| Kidney / nephrology | 2,871 | 0.14 | 0.01 | 1426 / 1448 | 0.16 / 0.12 | yes | yes | no / no |
| Diabetes & hormones | 2,871 | 0.25 | 0.01 | 1426 / 1448 | 0.31 / 0.28 | yes | yes | no / no |
| Cancer care / oncology | 2,871 | 0.03 | 0.01 | 1426 / 1448 | -0.06 / -0.03 | yes | yes | yes / yes |
| Arthritis / rheumatology | 2,871 | 0.10 | 0.01 | 1426 / 1448 | 0.12 / 0.10 | yes | no | no / yes |
| Brain & nerves / neurology | 2,871 | 0.15 | 0.01 | 1426 / 1448 | 0.25 / 0.20 | yes | yes | no / no |
| Ear, nose & throat | 2,871 | 0.04 | 0.01 | 1426 / 1448 | 0.06 / 0.04 | yes | no | yes / yes |
| Urology | 2,871 | 0.17 | 0.01 | 1426 / 1448 | 0.24 / 0.21 | yes | yes | no / no |
| Foot & ankle / podiatry | 2,871 | 0.22 | 0.01 | 1426 / 1448 | 0.28 / 0.24 | no | yes | no / no |
| Pain management | 2,871 | 0.10 | 0.01 | 1426 / 1448 | 0.14 / 0.11 | yes | yes | no / no |
| Speech & language therapy | 2,871 | 0.09 | 0.01 | 1426 / 1448 | 0.19 / 0.19 | yes | yes | no / no |
| Nutrition & dietitian | 2,871 | 0.25 | 0.01 | 1426 / 1448 | 0.34 / 0.32 | yes | yes | no / no |
| Acupuncture, massage & naturopathy | 2,871 | 0.31 | 0.01 | 1426 / 1448 | 0.39 / 0.35 | yes | yes | no / no |
| Urgent care & emergency | 2,871 | -0.14 | 0.01 | 1426 / 1448 | -0.15 / -0.20 | no | yes | yes / yes |
| Imaging & lab | 2,871 | 0.02 | 0.01 | 1426 / 1448 | -0.05 / -0.05 | yes | yes | yes / yes |
| Pharmacy | 2,871 | 0.20 | 0.01 | 1426 / 1448 | 0.31 / 0.27 | yes | yes | no / no |
| Home health & in-home care | 2,871 | 0.02 | 0.01 | 1426 / 1448 | 0.19 / 0.15 | yes | yes | no / no |
| Nursing & assisted living | 2,871 | 0.07 | 0.01 | 1426 / 1448 | 0.24 / 0.24 | yes | yes | no / no |
| Medical equipment & supplies | 2,871 | 0.11 | 0.01 | 1426 / 1448 | 0.19 / 0.17 | yes | yes | no / no |
| Hearing & audiology | 2,871 | 0.11 | 0.01 | 1426 / 1448 | 0.13 / 0.11 | yes | yes | no / no |
| Care coordination & community health | 2,871 | 0.14 | 0.01 | 1426 / 1448 | 0.24 / 0.22 | no | yes | no / no |
| General surgery | 2,871 | 0.18 | 0.01 | 1426 / 1448 | 0.16 / 0.12 | yes | yes | no / no |
| Hospice & palliative care | 2,871 | 0.11 | 0.01 | 1426 / 1448 | 0.11 / 0.08 | yes | yes | no / yes |

Holdout agreement: access weight class same on both halves in 28 of 33 specialties, need weight class in 31 of 33, caution flag in 31 of 33.

### 4d. Clinician entry 2021 to 2025 (ZIPs): payer yield vs insured rate and HPSA

Same ZIPs for all three measures (those with yield, insured rate and an HPSA match). Paired bootstrap over ZIPs, 200 resamples (seed 2 and 3).

| Specialty | ZIPs | Payer yield rho [CI] | Insured rate rho [CI] | HPSA rho [CI] | Yield - insured, 95% CI | Resamples yield > insured | Yield - HPSA, 95% CI | Competition rho [CI], ZIPs |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 20,458 | 0.12 [0.11, 0.14] | 0.06 [0.04, 0.07] | 0.22 [0.20, 0.23] | [0.06, 0.07] | 100% | [-0.12, -0.08] | -0.18 [-0.19, -0.17], 21,552 |
| Pediatrics (children) | 20,458 | 0.15 [0.14, 0.16] | 0.08 [0.06, 0.09] | 0.22 [0.20, 0.23] | [0.07, 0.08] | 100% | [-0.09, -0.05] | -0.42 [-0.43, -0.41], 21,552 |
| Women's health / OB-GYN | 20,458 | 0.17 [0.15, 0.18] | 0.10 [0.09, 0.12] | 0.16 [0.14, 0.17] | [0.06, 0.07] | 100% | [-0.00, 0.03] | -0.43 [-0.44, -0.42], 21,552 |
| Mental health & counseling | 20,458 | 0.18 [0.17, 0.19] | 0.11 [0.10, 0.13] | 0.19 [0.18, 0.20] | [0.06, 0.07] | 100% | [-0.03, 0.01] | -0.30 [-0.31, -0.28], 21,552 |
| Dental | 20,458 | 0.16 [0.14, 0.17] | 0.09 [0.08, 0.11] | 0.28 [0.26, 0.29] | [0.06, 0.07] | 100% | [-0.14, -0.10] | -0.26 [-0.27, -0.25], 21,552 |
| Eye care | 20,458 | 0.14 [0.13, 0.16] | 0.09 [0.07, 0.10] | 0.16 [0.15, 0.18] | [0.05, 0.07] | 100% | [-0.04, -0.00] | -0.30 [-0.31, -0.29], 21,552 |
| Chiropractic | 20,458 | 0.27 [0.26, 0.28] | 0.20 [0.19, 0.21] | 0.06 [0.05, 0.08] | [0.06, 0.08] | 100% | [0.19, 0.22] | -0.26 [-0.28, -0.25], 21,552 |
| Physical & occupational therapy | 20,458 | 0.30 [0.29, 0.31] | 0.21 [0.20, 0.22] | 0.05 [0.04, 0.06] | [0.08, 0.10] | 100% | [0.23, 0.27] | -0.26 [-0.28, -0.25], 21,552 |
| Orthopedics & sports injury | 20,458 | 0.18 [0.16, 0.19] | 0.11 [0.09, 0.12] | 0.04 [0.02, 0.05] | [0.06, 0.08] | 100% | [0.12, 0.15] | -0.31 [-0.32, -0.30], 21,552 |
| Heart / cardiology | 20,458 | 0.09 [0.08, 0.10] | 0.03 [0.01, 0.04] | 0.25 [0.23, 0.26] | [0.05, 0.07] | 100% | [-0.18, -0.14] | -0.47 [-0.49, -0.46], 21,552 |
| Skin / dermatology | 20,458 | 0.16 [0.15, 0.18] | 0.10 [0.08, 0.11] | 0.22 [0.21, 0.23] | [0.06, 0.07] | 100% | [-0.08, -0.04] | -0.55 [-0.56, -0.54], 21,552 |
| Allergy & immunology | 20,458 | 0.05 [0.04, 0.06] | 0.01 [-0.00, 0.02] | 0.17 [0.15, 0.18] | [0.03, 0.05] | 100% | [-0.14, -0.09] | -0.40 [-0.41, -0.39], 21,552 |
| Lung, breathing & sleep | 20,458 | 0.11 [0.10, 0.13] | 0.07 [0.05, 0.08] | 0.25 [0.24, 0.26] | [0.04, 0.05] | 100% | [-0.15, -0.11] | -0.47 [-0.48, -0.46], 21,552 |
| Digestive / gastroenterology | 20,458 | 0.07 [0.05, 0.08] | 0.01 [0.00, 0.03] | 0.20 [0.19, 0.22] | [0.05, 0.06] | 100% | [-0.15, -0.11] | -0.44 [-0.45, -0.43], 21,552 |
| Kidney / nephrology | 20,458 | 0.05 [0.03, 0.06] | -0.00 [-0.02, 0.01] | 0.24 [0.23, 0.26] | [0.05, 0.06] | 100% | [-0.21, -0.17] | -0.40 [-0.41, -0.38], 21,552 |
| Diabetes & hormones | 20,458 | 0.09 [0.08, 0.11] | 0.03 [0.02, 0.04] | 0.18 [0.17, 0.19] | [0.06, 0.07] | 100% | [-0.11, -0.06] | -0.48 [-0.49, -0.47], 21,552 |
| Cancer care / oncology | 20,458 | 0.10 [0.09, 0.12] | 0.05 [0.03, 0.06] | 0.22 [0.21, 0.24] | [0.05, 0.06] | 100% | [-0.14, -0.09] | -0.49 [-0.50, -0.48], 21,552 |
| Arthritis / rheumatology | 20,458 | 0.04 [0.02, 0.05] | -0.01 [-0.03, 0.00] | 0.20 [0.19, 0.22] | [0.04, 0.05] | 100% | [-0.19, -0.14] | -0.46 [-0.47, -0.45], 21,552 |
| Brain & nerves / neurology | 20,458 | 0.18 [0.17, 0.20] | 0.11 [0.09, 0.12] | 0.22 [0.21, 0.24] | [0.07, 0.08] | 100% | [-0.06, -0.02] | -0.60 [-0.61, -0.59], 21,552 |
| Ear, nose & throat | 20,458 | 0.06 [0.04, 0.07] | 0.01 [-0.00, 0.02] | 0.23 [0.22, 0.25] | [0.04, 0.05] | 100% | [-0.20, -0.16] | -0.44 [-0.45, -0.43], 21,552 |
| Urology | 20,458 | 0.06 [0.05, 0.08] | 0.01 [0.00, 0.03] | 0.18 [0.17, 0.19] | [0.04, 0.06] | 100% | [-0.13, -0.10] | -0.45 [-0.46, -0.44], 21,552 |
| Foot & ankle / podiatry | 20,458 | 0.14 [0.13, 0.15] | 0.08 [0.07, 0.10] | 0.17 [0.16, 0.19] | [0.05, 0.06] | 100% | [-0.05, -0.01] | -0.47 [-0.48, -0.46], 21,552 |
| Pain management | 20,458 | 0.11 [0.10, 0.13] | 0.06 [0.05, 0.08] | 0.18 [0.17, 0.19] | [0.05, 0.06] | 100% | [-0.08, -0.05] | -0.41 [-0.42, -0.40], 21,552 |
| Plastic & reconstructive surgery | 20,458 | 0.07 [0.06, 0.09] | 0.02 [0.01, 0.04] | 0.25 [0.23, 0.26] | [0.05, 0.06] | 100% | [-0.19, -0.15] | -0.48 [-0.49, -0.47], 21,552 |
| Speech & language therapy | 20,458 | 0.25 [0.23, 0.26] | 0.16 [0.15, 0.18] | 0.15 [0.14, 0.16] | [0.08, 0.09] | 100% | [0.07, 0.12] | -0.33 [-0.34, -0.32], 21,552 |
| Nutrition & dietitian | 20,458 | 0.27 [0.26, 0.29] | 0.18 [0.17, 0.20] | 0.14 [0.12, 0.15] | [0.08, 0.10] | 100% | [0.12, 0.16] | -0.46 [-0.47, -0.45], 21,552 |
| Acupuncture, massage & naturopathy | 20,458 | 0.22 [0.21, 0.23] | 0.14 [0.13, 0.16] | 0.13 [0.12, 0.14] | [0.07, 0.08] | 100% | [0.07, 0.11] | -0.50 [-0.51, -0.49], 21,552 |
| Urgent care & emergency | 20,458 | 0.08 [0.07, 0.10] | 0.02 [0.01, 0.04] | 0.20 [0.19, 0.22] | [0.05, 0.07] | 100% | [-0.14, -0.10] | -0.30 [-0.32, -0.29], 21,552 |
| Imaging & lab | 20,458 | 0.12 [0.10, 0.13] | 0.06 [0.05, 0.07] | 0.29 [0.28, 0.30] | [0.05, 0.06] | 100% | [-0.19, -0.16] | -0.44 [-0.45, -0.43], 21,552 |
| Pharmacy | 20,458 | 0.12 [0.10, 0.13] | 0.08 [0.06, 0.09] | 0.20 [0.19, 0.22] | [0.03, 0.05] | 100% | [-0.10, -0.07] | -0.22 [-0.23, -0.21], 21,552 |
| Home health & in-home care | 20,458 | 0.04 [0.02, 0.05] | 0.02 [0.01, 0.03] | 0.23 [0.22, 0.24] | [0.01, 0.02] | 100% | [-0.21, -0.17] | -0.27 [-0.28, -0.25], 21,552 |
| Nursing & assisted living | 20,458 | 0.07 [0.06, 0.08] | 0.04 [0.03, 0.06] | 0.25 [0.24, 0.27] | [0.02, 0.03] | 100% | [-0.20, -0.17] | -0.20 [-0.21, -0.19], 21,552 |
| Medical equipment & supplies | 20,458 | 0.13 [0.11, 0.14] | 0.08 [0.06, 0.09] | 0.28 [0.26, 0.29] | [0.05, 0.06] | 100% | [-0.17, -0.13] | -0.35 [-0.36, -0.34], 21,552 |
| Hearing & audiology | 20,458 | 0.22 [0.21, 0.23] | 0.16 [0.14, 0.17] | 0.13 [0.11, 0.14] | [0.05, 0.07] | 100% | [0.07, 0.11] | -0.46 [-0.47, -0.45], 21,552 |
| Behavior therapy (ABA) | 20,458 | 0.22 [0.20, 0.23] | 0.15 [0.13, 0.16] | 0.23 [0.21, 0.24] | [0.07, 0.08] | 100% | [-0.03, 0.01] | -0.59 [-0.60, -0.58], 21,552 |
| Care coordination & community health | 20,458 | 0.05 [0.03, 0.06] | 0.01 [-0.00, 0.02] | 0.18 [0.16, 0.19] | [0.03, 0.04] | 100% | [-0.15, -0.11] | -0.38 [-0.39, -0.36], 21,552 |
| General surgery | 20,458 | 0.16 [0.15, 0.18] | 0.09 [0.08, 0.10] | 0.21 [0.20, 0.23] | [0.07, 0.08] | 100% | [-0.07, -0.03] | -0.47 [-0.48, -0.46], 21,552 |
| Infectious disease | 20,458 | 0.05 [0.04, 0.07] | 0.01 [-0.00, 0.02] | 0.21 [0.20, 0.22] | [0.04, 0.05] | 100% | [-0.18, -0.13] | -0.45 [-0.47, -0.44], 21,552 |
| Genetics & genetic counseling | 20,458 | 0.14 [0.13, 0.15] | 0.06 [0.05, 0.08] | 0.25 [0.23, 0.26] | [0.07, 0.08] | 100% | [-0.13, -0.08] | -0.74 [-0.75, -0.74], 21,552 |
| Hospice & palliative care | 20,458 | 0.07 [0.05, 0.08] | 0.02 [0.01, 0.04] | 0.23 [0.22, 0.25] | [0.04, 0.05] | 100% | [-0.19, -0.15] | -0.40 [-0.41, -0.39], 21,552 |
