<!-- Written by scripts/taxonomy-backfill.sh. -->
Run: 2026-10-08 21:43 UTC, mode **dry_run**, NPPES file NPPES_Data_Dissemination_September_2026_V2.zip.

NPPES extract: `{"rows":9798758,"primary":9443429,"first":0,"none":355329,"deactivated_blank":355329}` (nppes_first = no primary flag, first listed code used).

## Size check

- clinic_secondary_locations: 0.48 GB
- clinics: 0.77 GB
- provider_individuals: 1.83 GB
- Estimated extra disk needed for the backfill: **4.9 GB** (all three tables rewritten once, plus about 1.5 GB of staging)
- Free disk entered: not given

# Taxonomy backfill summary

NPPES NPIs with a taxonomy: 9,443,429. NUCC codes known: 883.

| Table | Rows | NPPES primary | NPPES first (no flag) | Display name | Exceptions | Stored name agrees with code | Rows to write |
|---|---|---|---|---|---|---|---|
| clinics | 1,901,933 | 1,898,344 | 0 | 3,565 | 24 | 99.60% | 1,901,909 |
| individuals | 7,147,610 | 7,132,455 | 0 | 14,315 | 840 | 98.67% | 7,146,770 |
| secondary | 1,126,160 | 1,125,402 | 0 | 742 | 16 | 98.51% | 1,126,144 |

Coverage: 99.99% of 10,175,703 rows have a code; 880 are exceptions.

## NPPES codes missing from this NUCC release

| Code | Rows |
|---|---|
| 246ZS0400X | 2 |

## Exceptions by stored name and reason (top 50)

| Stored name | Reason | Rows |
|---|---|---|
| Pharmacist | not in NPPES; stored name matches more than one NUCC code | 551 |
| Psychologist | not in NPPES; stored name matches more than one NUCC code | 239 |
| Podiatrist | not in NPPES; stored name matches more than one NUCC code | 61 |
| Clinical Neuropsychologist | not in NPPES; stored name matches more than one NUCC code | 19 |
| Military Hospital | not in NPPES; stored name matches more than one NUCC code | 3 |
| Counselor, Professional | not in NPPES; stored name is not a NUCC display name | 2 |
| 246ZS0400X | NPPES code 246ZS0400X is not in this NUCC release; stored name is not a NUCC display name | 2 |
| Counselor, Mental Health | not in NPPES; stored name is not a NUCC display name | 1 |
| Social Worker, Clinical | not in NPPES; stored name is not a NUCC display name | 1 |
| Dietetic Technician, Registered | not in NPPES; stored name is not a NUCC display name | 1 |
