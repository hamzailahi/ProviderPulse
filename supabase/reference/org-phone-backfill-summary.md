<!-- Written by scripts/org-phone-backfill.sh. -->
Run: 2026-10-24 18:13 UTC, mode **dry_run**, source: the NPI Registry API (sample: the 150 largest ZIPs).

NPPES extract: `{"zips":150,"zips_done":150,"zips_failed":0,"zips_not_reached":0,"overflow_zips":12,"split_failed_zips":0,"still_full_zips":0,"queries":894,"single_lookups":277,"single_failed":0,"single_skipped_cap":0,"records":136674,"with_phone":136401,"no_phone":20,"bad_phone":253,"deactivated":0,"single_not_reached":0,"requests":1172,"retries":0,"minutes":0.8,"address_purpose":"PRIMARY","zip_limit":150}`

## Size check

- clinics: 0.87 GB
- Estimated extra disk needed: **3.3 GB** (the table rewritten once, staging and WAL)
- Free disk entered: not given
- clinics.phone column (migration 040): not yet; apply adds it

## Organization phones

- clinics rows: 1,901,951
- with a phone in NPPES: 130,640 (6.9%)
- already right: 0
- to write: **130,640**
- no NPPES phone (deactivated, missing from the file, or no usable number): 1,771,311

## NPI Registry API

- ZIPs queried: 150 of 150 (a sample of the 150 largest); failed 0, not reached in the time budget 0
- requests: 1,172 (0 retries), 0.8 minutes, address_purpose PRIMARY
- organizations returned: 136,674; with a usable phone 136,401, none listed 20, unusable 253, deactivated 0
- ZIPs over the 1,200-record ceiling: 12 (ZIP+4 split refused in 0, still over in 0); looked up one by one: 277, failed 0, over the cap 0
- overflowing ZIPs: 77036, 33186, 33155, 33144, 33012, 33166, 75093, 10016, 48075, 33134, 11235, 33016
- Complete: every ZIP answered.
