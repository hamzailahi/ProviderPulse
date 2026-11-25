# Drive time vs 10-mile count, and site weighting, nationally

Run 2026-11-25 by scripts/access-national.mjs (exports: scripts/access-national.sh). Read only.

- ZIPs with a centre: 33,295; drive-time figures read from access_e2sfca (the stored, site-weighted E2SFCA per 1,000 adults).
- 10-mile count: every ZIP centre within 10 straight-line miles of the ZIP's population-weighted centre, else the 10 nearest out to 25 miles, at most 60 (the rule in scripts/lib/e2sfca.mjs crudeRatio and the back-test). Both figures go through the model's access factor (100 = none, 50 = the national rate).
- 95% CI: Fisher z with the Bonett and Wright (2000) standard error; p two-sided from the t approximation.

## 1. Rank agreement across all ZIPs

| Specialty | ZIPs | Spearman rho | 95% CI | p |
|---|---|---|---|---|
| Primary care / family doctor | 33,295 | 0.62 | [0.61, 0.63] | <0.001 |
| Pediatrics (children) | 33,295 | 0.81 | [0.81, 0.82] | <0.001 |
| Women's health / OB-GYN | 33,295 | 0.76 | [0.75, 0.76] | <0.001 |
| Mental health & counseling | 33,295 | 0.76 | [0.76, 0.77] | <0.001 |
| Dental | 33,295 | 0.69 | [0.68, 0.70] | <0.001 |
| Eye care | 33,295 | 0.67 | [0.67, 0.68] | <0.001 |
| Chiropractic | 33,295 | 0.69 | [0.69, 0.70] | <0.001 |
| Physical & occupational therapy | 33,295 | 0.71 | [0.70, 0.71] | <0.001 |
| Orthopedics & sports injury | 33,295 | 0.70 | [0.69, 0.71] | <0.001 |
| Heart / cardiology | 33,295 | 0.76 | [0.75, 0.76] | <0.001 |
| Skin / dermatology | 33,295 | 0.78 | [0.78, 0.79] | <0.001 |
| Allergy & immunology | 33,295 | 0.77 | [0.76, 0.77] | <0.001 |
| Lung, breathing & sleep | 33,295 | 0.77 | [0.76, 0.77] | <0.001 |
| Digestive / gastroenterology | 33,295 | 0.78 | [0.77, 0.78] | <0.001 |
| Kidney / nephrology | 33,295 | 0.71 | [0.70, 0.72] | <0.001 |
| Diabetes & hormones | 33,295 | 0.75 | [0.75, 0.76] | <0.001 |
| Cancer care / oncology | 33,295 | 0.60 | [0.59, 0.60] | <0.001 |
| Arthritis / rheumatology | 33,295 | 0.76 | [0.76, 0.77] | <0.001 |
| Brain & nerves / neurology | 33,295 | 0.79 | [0.78, 0.79] | <0.001 |
| Ear, nose & throat | 33,295 | 0.70 | [0.70, 0.71] | <0.001 |
| Urology | 33,295 | 0.70 | [0.69, 0.71] | <0.001 |
| Foot & ankle / podiatry | 33,295 | 0.76 | [0.75, 0.76] | <0.001 |
| Pain management | 33,295 | 0.77 | [0.77, 0.78] | <0.001 |
| Plastic & reconstructive surgery | 33,295 | 0.69 | [0.68, 0.70] | <0.001 |
| Speech & language therapy | 33,295 | 0.73 | [0.73, 0.74] | <0.001 |
| Nutrition & dietitian | 33,295 | 0.74 | [0.74, 0.75] | <0.001 |
| Acupuncture, massage & naturopathy | 33,295 | 0.81 | [0.81, 0.82] | <0.001 |
| Urgent care & emergency | 33,295 | 0.60 | [0.59, 0.61] | <0.001 |
| Imaging & lab | 33,295 | 0.74 | [0.73, 0.74] | <0.001 |
| Pharmacy | 33,295 | 0.60 | [0.59, 0.61] | <0.001 |
| Home health & in-home care | 33,295 | 0.79 | [0.78, 0.79] | <0.001 |
| Nursing & assisted living | 33,295 | 0.72 | [0.71, 0.72] | <0.001 |
| Medical equipment & supplies | 33,295 | 0.71 | [0.70, 0.71] | <0.001 |
| Hearing & audiology | 33,295 | 0.69 | [0.68, 0.70] | <0.001 |
| Behavior therapy (ABA) | 33,295 | 0.86 | [0.86, 0.86] | <0.001 |
| Care coordination & community health | 33,295 | 0.77 | [0.77, 0.78] | <0.001 |
| General surgery | 33,295 | 0.68 | [0.67, 0.69] | <0.001 |
| Infectious disease | 33,295 | 0.68 | [0.67, 0.69] | <0.001 |
| Genetics & genetic counseling | 33,295 | 0.63 | [0.63, 0.64] | <0.001 |
| Hospice & palliative care | 33,295 | 0.72 | [0.72, 0.73] | <0.001 |

## 2. Site weighting: ZIPs above the national rate (10-mile count)

"Before": every listing counts 1, against the plain national rate. "After": a clinician with several sites counts 0.6 at the main office, against the site-weighted national rate (the pair market-score uses since 2026-11-24). "Fell below" and "rose above" count ZIPs that cross the national rate between the two. The last column is weighted supply against the plain rate, for comparison.

| Specialty | ZIPs | Plain rate per 1k | Weighted rate per 1k | Above before | Above after | Fell below | Rose above | Above (weighted supply, plain rate) |
|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 33,295 | 4.9267 | 4.3013 | 10,158 | 10,172 | 419 | 433 | 6,698 |
| Pediatrics (children) | 33,295 | 1.1747 | 1.1141 | 6,761 | 6,906 | 68 | 213 | 6,355 |
| Women's health / OB-GYN | 33,295 | 0.5807 | 0.5282 | 8,999 | 9,049 | 223 | 273 | 7,603 |
| Mental health & counseling | 33,295 | 7.5092 | 7.2022 | 9,397 | 9,408 | 69 | 80 | 8,772 |
| Dental | 33,295 | 1.6866 | 1.6535 | 9,027 | 9,056 | 76 | 105 | 8,563 |
| Eye care | 33,295 | 0.665 | 0.6183 | 11,406 | 11,406 | 352 | 352 | 9,452 |
| Chiropractic | 33,295 | 0.6466 | 0.6318 | 12,053 | 11,992 | 184 | 123 | 11,599 |
| Physical & occupational therapy | 33,295 | 2.8307 | 2.6983 | 11,040 | 11,150 | 152 | 262 | 9,994 |
| Orthopedics & sports injury | 33,295 | 0.4244 | 0.3863 | 10,724 | 10,838 | 284 | 398 | 9,218 |
| Heart / cardiology | 33,295 | 0.2845 | 0.2376 | 8,379 | 8,396 | 298 | 315 | 6,335 |
| Skin / dermatology | 33,295 | 0.1052 | 0.0924 | 8,215 | 8,410 | 276 | 471 | 6,894 |
| Allergy & immunology | 33,295 | 0.0351 | 0.0313 | 8,492 | 8,635 | 258 | 401 | 7,509 |
| Lung, breathing & sleep | 33,295 | 0.1461 | 0.1304 | 7,906 | 7,831 | 363 | 288 | 6,467 |
| Digestive / gastroenterology | 33,295 | 0.1311 | 0.1108 | 7,911 | 8,058 | 243 | 390 | 6,236 |
| Kidney / nephrology | 33,295 | 0.1191 | 0.1077 | 9,965 | 10,302 | 310 | 647 | 8,658 |
| Diabetes & hormones | 33,295 | 0.069 | 0.0606 | 8,087 | 8,220 | 302 | 435 | 6,916 |
| Cancer care / oncology | 33,295 | 0.1816 | 0.1536 | 7,098 | 7,181 | 266 | 349 | 5,534 |
| Arthritis / rheumatology | 33,295 | 0.0427 | 0.0367 | 8,196 | 8,237 | 365 | 406 | 6,760 |
| Brain & nerves / neurology | 33,295 | 0.247 | 0.2161 | 6,438 | 6,400 | 224 | 186 | 5,405 |
| Ear, nose & throat | 33,295 | 0.0761 | 0.0661 | 9,058 | 9,336 | 301 | 579 | 7,653 |
| Urology | 33,295 | 0.0848 | 0.0725 | 10,002 | 10,143 | 413 | 554 | 8,065 |
| Foot & ankle / podiatry | 33,295 | 0.1614 | 0.1458 | 9,863 | 9,698 | 511 | 346 | 7,921 |
| Pain management | 33,295 | 0.0942 | 0.0852 | 8,801 | 8,739 | 354 | 292 | 7,531 |
| Plastic & reconstructive surgery | 33,295 | 0.0726 | 0.0661 | 7,310 | 7,219 | 283 | 192 | 6,455 |
| Speech & language therapy | 33,295 | 0.9244 | 0.9008 | 9,583 | 9,566 | 152 | 135 | 9,079 |
| Nutrition & dietitian | 33,295 | 0.3417 | 0.3304 | 9,457 | 9,516 | 140 | 199 | 8,979 |
| Acupuncture, massage & naturopathy | 33,295 | 0.5274 | 0.5193 | 6,015 | 6,035 | 47 | 67 | 5,893 |
| Urgent care & emergency | 33,295 | 0.5171 | 0.4676 | 11,252 | 11,539 | 308 | 595 | 9,614 |
| Imaging & lab | 33,295 | 0.5643 | 0.494 | 7,433 | 7,576 | 229 | 372 | 5,906 |
| Pharmacy | 33,295 | 1.74 | 1.7234 | 10,809 | 10,795 | 99 | 85 | 10,476 |
| Home health & in-home care | 33,295 | 1.6124 | 1.6062 | 5,582 | 5,554 | 39 | 11 | 5,536 |
| Nursing & assisted living | 33,295 | 0.3871 | 0.3866 | 14,737 | 14,747 | 13 | 23 | 14,722 |
| Medical equipment & supplies | 33,295 | 0.3612 | 0.3607 | 10,157 | 10,173 | 10 | 26 | 10,139 |
| Hearing & audiology | 33,295 | 0.2011 | 0.1904 | 11,708 | 11,794 | 213 | 299 | 10,907 |
| Behavior therapy (ABA) | 33,295 | 2.9198 | 2.8759 | 4,983 | 4,968 | 37 | 22 | 4,882 |
| Care coordination & community health | 33,295 | 1.6652 | 1.6349 | 8,998 | 9,005 | 40 | 47 | 8,853 |
| General surgery | 33,295 | 0.4011 | 0.3465 | 8,689 | 8,782 | 293 | 386 | 6,835 |
| Infectious disease | 33,295 | 0.0579 | 0.0499 | 6,281 | 6,312 | 245 | 276 | 5,362 |
| Genetics & genetic counseling | 33,295 | 0.0353 | 0.0338 | 4,977 | 4,962 | 71 | 56 | 4,835 |
| Hospice & palliative care | 33,295 | 0.0906 | 0.0873 | 8,462 | 8,482 | 252 | 272 | 8,012 |
