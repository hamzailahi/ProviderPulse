<!-- Written by scripts/build-procedure-tables.py. -->
# Procedure tables (dry_run), 2026-10-11 21:09 UTC

## Sources

- Medicaid: https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.parquet
- Outpatient hospitals: 2026 https://data.cms.gov/sites/default/files/2026-06/794975f5-e335-4cbf-8e87-982c834a9639/MUP_OUT_RY26_P04_V10_DY24_Prov_Svc.csv
- Inpatient hospitals: 2026 https://data.cms.gov/sites/default/files/2026-04/828defb5-c9e6-4442-8c1b-f27bc0799daf/MUP_INP_RY26_P03_V10_DY24_PrvSvc.CSV
- Physician by geography: 2026 https://data.cms.gov/sites/default/files/2026-05/e534c74b-79b8-4892-8a95-5a17e2dfec9f/MUP_PHY_R26_P05_V10_D24_Geo.csv
- HCPCS Level II: https://www.cms.gov/files/zip/october-2026-alpha-numeric-hcpcs-file.zip

## Downloads

- downloaded medicaid.parquet: 3,073 MB in 25s
- downloaded outpatient.csv: 28 MB in 0s
- downloaded inpatient.csv: 38 MB in 0s
- downloaded physician-geo.csv: 42 MB in 0s
- directory: 253 MB in 18s

## Medicaid

- newest year: 2024
- rows 34,445,846, paid $267,938,154,374
- dropped, malformed code: 167,198 rows, $51,532,783,493
- dropped, no valid servicing or billing NPI: 29,584 rows, $25,774,349,840
- dropped, no claims or negative paid: 501 rows, $-272,802
- dropped, NPI not in our directory: 145,058 rows, $1,727,376,272, 5,112 NPIs
- kept: 3,083,819 ZIP x specialty x code rows, $188,903,917,571 paid, 2,858,452,763 claim lines, 21,013 ZIPs
- share of valid 2024 spending placed: 99.1%

Top specialties by paid:

- Home Health Agency: $28,397,042,287, 215,583,782 claim lines
- Hospital-General: $12,359,084,552, 267,857,156 claim lines
- Community/Behavioral Health: $12,274,299,535, 69,633,011 claim lines
- Dentist: $8,523,260,526, 213,800,052 claim lines
- In Home Supportive Care: $6,519,677,830, 53,023,115 claim lines
- Clinic/Center: $6,469,970,819, 87,502,815 claim lines
- Physician/Pediatric Medicine: $5,485,259,386, 147,650,784 claim lines
- Nurse Practitioner: $5,473,469,089, 135,143,401 claim lines
- Case Management: $5,163,585,886, 26,312,666 claim lines
- Community Based Residential Treatment Facility, Intellectual and/or Developmental Disabilities: $4,262,526,134, 14,902,357 claim lines
- Day Training, Developmentally Disabled Services: $4,048,362,171, 19,265,080 claim lines
- Physician/Family Practice: $4,041,387,213, 108,605,490 claim lines

## Medicare hospitals

- inpatient: 145,879 rows, 2,906 hospitals, 4,952,481 discharges (2024)
- outpatient: 62,367 rows, 2,987 hospitals, 4,725,270 patients (2024)
- skipped (suppressed counts, missing ZIP or duplicates): 53,815

## Code descriptions

- HCPCS Level II zip: HCPC2026_OCT_ANWEB_09232026.txt, HCPC2026_OCT_ANWEB_09232026.xlsx, HCPC2026_OCT_ANWEB_Transaction Report_09262026.xlsx, HCPC2026_OCT_Corrections_09232026.xlsx, HCPC2026_recordlayout.txt, NOC codes_OCT2026.xlsx, proc_notes_OCT2026.txt
- HCPCS Level II descriptions: 8,770
- 6,218 Medicaid codes described, covering 92.7% of Medicaid paid

## Size

- CSVs: 0.21 GB; estimated database need while loading: 1.5 GB

Dry run: nothing written to the database.
