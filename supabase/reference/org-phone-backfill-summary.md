<!-- Written by scripts/org-phone-backfill.sh. -->
Run: 2026-10-24 19:59 UTC, mode **dry_run**, source: the NPI Registry API.

NPPES extract: `{"zips":27633,"zips_done":27633,"zips_failed":0,"zips_not_reached":0,"overflow_zips":12,"split_failed_zips":0,"still_full_zips":0,"queries":32285,"single_lookups":204,"single_failed":0,"single_skipped_cap":0,"records":1984459,"with_phone":1980787,"no_phone":282,"bad_phone":3390,"deactivated":0,"single_not_reached":0,"requests":32490,"retries":0,"minutes":91.1,"address_purpose":"PRIMARY","zip_limit":null,"refusals":0,"pauses":0,"blocked":false,"final_rate":6}`

## Size check

- clinics: 0.87 GB
- Estimated extra disk needed: **3.3 GB** (the table rewritten once, staging and WAL)
- Free disk entered: not given
- clinics.phone column (migration 040): not yet; apply adds it

## Organization phones

- clinics rows: 1,901,951
- with a phone in NPPES: 1,894,376 (99.6%)
- already right: 0
- to write: **1,894,376**
- no NPPES phone (deactivated, missing from the file, or no usable number): 7,575

## NPI Registry API

- ZIPs queried: 27,633 of 27,633; failed 0, not reached in the time budget 0
- requests: 32,490 (0 retries), 91.1 minutes, address_purpose PRIMARY; refused 0 times (0 pauses), pace at the end 6 a second
- organizations returned: 1,984,459; with a usable phone 1,980,787, none listed 282, unusable 3,390, deactivated 0
- ZIPs over the 1,200-record ceiling: 12 (ZIP+4 split refused in 0, still over in 0); looked up one by one: 204, failed 0, over the cap 0
- overflowing ZIPs: 33155, 33012, 33186, 77036, 33144, 33166, 48075, 75093, 10016, 11235, 33016, 33134
- Complete: every ZIP answered.
