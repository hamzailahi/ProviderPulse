<!-- Written by scripts/fax-backfill.sh. -->
Run: 2026-11-16 19:00 UTC, mode **apply**, source: NPPES file NPPES_Data_Dissemination_November_2026_V2.zip.

NPPES extract: `{"rows":9891116,"individuals":7540866,"organizations":1990237,"with_fax":3543185,"bad_fax":4417,"deactivated":19376}`

## Size check

- clinics: 0.95 GB
- provider_individuals: 2.84 GB
- Tables this run writes: provider_individuals
- Estimated extra disk needed: **5.4 GB** (those tables rewritten once, staging and WAL)
- Free disk entered: 5.89
- fax columns (migration 047): clinics present, provider_individuals present

## clinics faxes

- clinics rows: 1,992,043
- with a fax in NPPES: 1,051,651 (52.8%)
- already right: 1,051,651
- to write: **0**
- no NPPES fax (deactivated, missing from the file, no usable number, or NPPES simply has none on file): 940,392

## provider_individuals faxes

- provider_individuals rows: 7,546,513
- with a fax in NPPES: 2,490,990 (33.0%)
- already right: 0
- to write: **2,490,990**
- no NPPES fax (deactivated, missing from the file, no usable number, or NPPES simply has none on file): 5,055,523
- clinics with a fax: 1051651 of 1992043
- provider_individuals with a fax: 2490990 of 7546513
