<!-- Written by scripts/fax-backfill.sh. -->
Run: 2026-11-16 18:17 UTC, mode **dry_run**, source: NPPES file NPPES_Data_Dissemination_November_2026_V2.zip.

NPPES extract: `{"rows":9891116,"individuals":7540866,"organizations":1990237,"with_fax":3543185,"bad_fax":4417,"deactivated":19376}`

## Size check

- clinics: 0.91 GB
- provider_individuals: 2.84 GB
- Estimated extra disk needed: **6.4 GB** (both tables rewritten once, staging and WAL)
- Free disk entered: not given
- fax columns (migration 047): clinics not yet; apply adds it, provider_individuals not yet; apply adds it

## clinics faxes

- clinics rows: 1,992,043
- with a fax in NPPES: 1,051,651 (52.8%)
- already right: 0
- to write: **1,051,651**
- no NPPES fax (deactivated, missing from the file, no usable number, or NPPES simply has none on file): 940,392

## provider_individuals faxes

- provider_individuals rows: 7,546,513
- with a fax in NPPES: 2,490,990 (33.0%)
- already right: 0
- to write: **2,490,990**
- no NPPES fax (deactivated, missing from the file, no usable number, or NPPES simply has none on file): 5,055,523
