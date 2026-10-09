<!-- Written by scripts/taxonomy-backfill.sh. -->
Run: 2026-10-09 16:06 UTC, mode **apply**, NPPES file NPPES_Data_Dissemination_September_2026_V2.zip.

NPPES extract: `{"rows":9798758,"primary":9443429,"first":0,"none":355329,"deactivated_blank":355329}` (nppes_first = no primary flag, first listed code used).

## Size check

- clinic_secondary_locations: 0.48 GB
- clinics: 0.77 GB
- provider_individuals: 1.83 GB
- Estimated extra disk needed for the backfill: **6.9 GB** (all three tables rewritten once, about 1.5 GB of staging and 2 GB of WAL)
- Free disk entered: 7.9

# Taxonomy backfill summary

NPPES NPIs with a taxonomy: 9,443,429. NUCC codes known: 883.

| Table | Rows | NPPES primary | NPPES first (no flag) | Display name | Reviewed name rule | Exceptions | Stored name agrees with code | Rows to write |
|---|---|---|---|---|---|---|---|---|
| clinics | 1,901,933 | 1,898,344 | 0 | 3,565 | 22 | 2 | 99.60% | 1,901,931 |
| individuals | 7,147,610 | 7,132,455 | 0 | 14,315 | 835 | 5 | 98.67% | 7,147,605 |
| secondary | 1,126,160 | 1,125,402 | 0 | 742 | 16 | 0 | 98.51% | 1,126,160 |

Coverage: 100.00% of 10,175,703 rows have a code; 7 are exceptions.

## NPPES codes missing from this NUCC release

| Code | Rows |
|---|---|
| 246ZS0400X | 2 |

## Exceptions by stored name and reason (top 50)

| Stored name | Reason | Rows |
|---|---|---|
| Counselor, Professional | not in NPPES; stored name is not a NUCC display name | 2 |
| 246ZS0400X | NPPES code 246ZS0400X is not in this NUCC release; stored name is not a NUCC display name | 2 |
| Counselor, Mental Health | not in NPPES; stored name is not a NUCC display name | 1 |
| Social Worker, Clinical | not in NPPES; stored name is not a NUCC display name | 1 |
| Dietetic Technician, Registered | not in NPPES; stored name is not a NUCC display name | 1 |

## After apply

| Table | Rows without a code | Rows |
|---|---|---|
| clinics | 2 | 1901933 |
| individuals | 5 | 7147610 |
| secondary | 0 | 1126160 |
