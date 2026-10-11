<!-- Written by scripts/medicaid-procedures-discover.py. Read only. -->
# Medicaid procedure source, 2026-10-11 20:56 UTC

- https://opendata.hhs.gov/datasets/medicaid-provider-spending: HTTP 200, 27,805 bytes
- https://opendata.hhs.gov/data.json: HTTP 200, 22,938 bytes

## HHS Open Data dataset page

- page scripts: /_next/static/chunks/173-612faaf36529d211.js, /_next/static/chunks/4bd1b696-d01d525ddc465c01.js, /_next/static/chunks/507-f85945db39928704.js, /_next/static/chunks/517-e90ec3310139a0b0.js, /_next/static/chunks/708-365158ec2258c74a.js, /_next/static/chunks/78-0a3095c147967759.js, /_next/static/chunks/app/datasets/%5Bslug%5D/page-32a56e3a25b1acf7.js, /_next/static/chunks/app/layout-5f952530d146977e.js, /_next/static/chunks/main-app-f8b48c13f823c184.js, /_next/static/chunks/polyfills-42372ed130431b0a.js, /_next/static/chunks/webpack-97f598895b7bc15e.js, /pixel-flag.svg
- every URL in the page: http://www.w3.org/2000/svg, https://opendata.hhs.gov/, https://opendata.hhs.gov/datasets/medicaid-provider-spending/, https://opendata.hhs.gov/opengraph-image.png?51d6105915ccf6e6, https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.csv, https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.csv.zip, https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.duckdb, https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.parquet, https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.vortex, https://www.medicaid.gov/dq-atlas/welcome

(Hugging Face copy skipped: HHS-Official/medicaid-provider-spending answered 401, gated, on 2026-10-11.)

1 parquet file(s):

- https://stopendataprod.blob.core.windows.net/datasets/medicaid-provider-spending/2026-02-09/dataset/medicaid-provider-spending.parquet
- downloaded 3.07 GB in 26s

### Schema

- `BILLING_PROVIDER_NPI_NUM` VARCHAR
- `SERVICING_PROVIDER_NPI_NUM` VARCHAR
- `HCPCS_CODE` VARCHAR
- `CLAIM_FROM_MONTH` VARCHAR
- `TOTAL_PATIENTS` BIGINT
- `TOTAL_CLAIM_LINES` BIGINT
- `TOTAL_PAID` DOUBLE

Columns used below: month=CLAIM_FROM_MONTH hcpcs=HCPCS_CODE patients=TOTAL_PATIENTS paid=TOTAL_PAID servicing=SERVICING_PROVIDER_NPI_NUM billing=BILLING_PROVIDER_NPI_NUM

### Size and range

- rows 238,015,729; months 2018-01 to 2024-12 (2s)

### Rows per year

- 2018: 28,571,776 rows, 766,860 servicing NPIs, 8,457 codes, paid $20,383,877,394,620
- 2019: 31,015,879 rows, 831,705 servicing NPIs, 8,634 codes, paid $222,929,227,068
- 2020: 28,995,632 rows, 883,467 servicing NPIs, 8,653 codes, paid $182,725,957,403
- 2021: 36,832,518 rows, 970,988 servicing NPIs, 8,766 codes, paid $220,840,385,816
- 2022: 38,430,374 rows, 1,004,476 servicing NPIs, 8,814 codes, paid $244,655,272,048
- 2023: 39,723,704 rows, 1,045,855 servicing NPIs, 8,982 codes, paid $276,433,297,242
- 2024: 34,445,846 rows, 1,009,984 servicing NPIs, 8,699 codes, paid $267,938,154,374

### Code shapes (newest year)

- CPT Category I (5 digits): 22,875,732 rows, paid $60,009,232,537
- HCPCS Level II: 9,170,049 rows, paid $156,148,278,039
- CPT Category II/III: 2,232,867 rows, paid $247,860,306
- other: 167,198 rows, paid $51,532,783,493

### Smallest patient counts (newest year), to see suppression

- patients=12: 2,753,499 rows
- patients=13: 2,385,300 rows
- patients=14: 2,087,220 rows
- patients=15: 1,837,915 rows
- patients=16: 1,632,398 rows
- patients=17: 1,456,739 rows
- patients=18: 1,309,814 rows
- patients=19: 1,180,737 rows
- patients=20: 1,072,936 rows
- patients=21: 974,104 rows
- patients=22: 892,466 rows
- patients=23: 815,290 rows
- patients=24: 751,799 rows
- patients=25: 691,734 rows
- patients=26: 641,038 rows

### Servicing NPI missing or equal to billing (newest year)

- servicing null=False, equals billing=False: 22,901,512 rows
- servicing null=False, equals billing=True: 9,734,912 rows
- servicing null=True, equals billing=None: 942,311 rows
- servicing null=False, equals billing=None: 867,111 rows

### Top codes by paid (newest year)

- T1019: patients 11,585,702, paid $29,995,511,874
- Z9525: patients 8,645,671, paid $20,539,952,083
- T1015: patients 35,645,310, paid $8,612,868,731
- S5125: patients 4,163,564, paid $8,529,555,863
- T2016: patients 903,150, paid $8,261,656,760
- W1793: patients 1,307,019, paid $6,783,842,716
- 99214: patients 69,529,918, paid $5,203,251,715
- 99213: patients 89,330,418, paid $4,944,135,105
- H2016: patients 922,277, paid $4,622,464,642
- 99284: patients 24,930,035, paid $3,479,100,967
- S5130: patients 2,445,471, paid $3,216,936,975
- S5140: patients 581,388, paid $2,823,339,180
- 90837: patients 10,261,849, paid $2,755,486,222
- 99283: patients 15,908,298, paid $2,572,896,842
- 99285: patients 13,869,707, paid $2,398,878,088

### Sample rows

```
(None, '5200000300', '20', '2018-06', 915, 8403, 7469333333258.64)
(None, '5200000300', '20', '2018-01', 874, 7368, 6549333333267.84)
(None, '5200000300', '20', '2018-02', 878, 6962, 6188444444382.56)
(None, '5200000300', '20', '2019-10', 1161, 12022, 14222639332.01)
(None, '5200000300', '20', '2018-08', 933, 9265, 8000320099.16)
(None, '5200000300', '20', '2019-11', 1119, 10717, 6222605122.45)
(None, '5200000300', '20', '2019-12', 1048, 10641, 5333705522.27)
(None, '5200000300', '20', '2019-06', 1036, 10129, 5333678366.19)
```
