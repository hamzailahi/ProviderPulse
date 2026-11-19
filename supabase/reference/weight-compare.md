# Site weighting: before and after

Run 2026-11-19 by scripts/live/weight-compare.mjs (read only). "Before" counts every clinician as 1; "after" counts a clinician with several sites as 0.6 at the main address. National rates are still unweighted here, and where drive-time access is stored (every state now) the access factor reads that stored figure, which was computed unweighted; it changes only after the benchmark rebuild and the drive-time rerun. So this compares the 10-mile supply rate, before and after.

## 38017

11 ZIPs within 11.8 mi, 229789 adults

| Specialty | Clinicians | 10-mile per 1k before | after | US per 1k | Access factor (current basis) | Score | Verdict |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 1328 | 5.78 | 4.93 | 4.78 | e2sfca 70 | 63 | Latent demand |
| Heart / cardiology | 104 | 0.45 | 0.35 | 0.28 | e2sfca 54 | 56 | Balanced |
| Digestive / gastroenterology | 36 | 0.16 | 0.13 | 0.13 | e2sfca 66 | 64 | Latent demand |

## 76104

30 ZIPs within 9.5 mi, 640328 adults

| Specialty | Clinicians | 10-mile per 1k before | after | US per 1k | Access factor (current basis) | Score | Verdict |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 3240 | 5.06 | 4.37 | 4.78 | e2sfca 28 | 35 | Saturated |
| Heart / cardiology | 204 | 0.32 | 0.27 | 0.28 | e2sfca 58 | 38 | Balanced |
| Digestive / gastroenterology | 99 | 0.15 | 0.13 | 0.13 | e2sfca 50 | 45 | Balanced |

## 59601

11 ZIPs within 21.8 mi, 59128 adults

| Specialty | Clinicians | 10-mile per 1k before | after | US per 1k | Access factor (current basis) | Score | Verdict |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 317 | 5.36 | 4.76 | 4.78 | e2sfca 0 | 37 | Crowded premium market |
| Heart / cardiology | 9 | 0.15 | 0.14 | 0.28 | e2sfca 65 | 58 | Latent demand |
| Digestive / gastroenterology | 3 | 0.05 | 0.05 | 0.13 | e2sfca 82 | 67 | Latent demand |

## 10001

36 ZIPs within 2.9 mi, 1005577 adults (capped: counts are floors)

| Specialty | Clinicians | 10-mile per 1k before | after | US per 1k | Access factor (current basis) | Score | Verdict |
|---|---|---|---|---|---|---|---|
| Primary care / family doctor | n/a | | | | | |  | |
| Heart / cardiology | n/a | | | | | |  | |
| Digestive / gastroenterology | n/a | | | | | |  | |

