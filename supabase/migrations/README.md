# Supabase migrations

Supabase keeps no history of SQL run in its editor. **This folder, plus the
schema snapshot, is the only record of the database's structure.** If SQL
is run anywhere else, save it here as the next numbered file first.

## Two records, and why both exist

| Record | What it is | How it's kept |
|---|---|---|
| `supabase/migrations/NNN_*.sql` | every change since the start, in order, with the reasoning in comments | written with each change, by hand |
| `supabase/schema/public.sql` | what the live database actually is today, including the core tables made by clicking in the dashboard | the **Schema snapshot** GitHub Action dumps it weekly (Mondays) and commits it only when something changed |

The core tables (`clinics`, `demographics_raw`, `hpsa_designations`,
`provider_profiles`, `provider_insurance`, `patient_profiles`, `audit_log`,
`access_requests`, `access_codes`, and the CMS tables `cms_county_utilization`,
`cms_procedures_full`, `cms_zip_procedures`) were created in the dashboard and have no migration file.
The snapshot is their record. A snapshot commit that no migration explains
means someone changed the database by hand: write the matching migration.

Setting the snapshot up needs one GitHub secret, `SUPABASE_DB_URL`: in
Supabase, click **Connect**, choose **Session pooler**, copy the string, put
the database password in it, and save it under GitHub, Settings, Secrets and
variables, Actions. (The "Direct connection" string will not work: GitHub's
runners have no IPv6.) Without the secret, `supabase/schema-snapshot.sql` is
a read-only query that produces the same record from the SQL editor.

## How to run a migration

Supabase dashboard, **SQL Editor**, **New query**, paste the whole file,
**Run**. Files are written to be re-runnable (`if not exists`,
`drop policy if exists` before `create policy`). Some wrap their work in
`begin` / `commit`: run those as one execution.

## Order and status

Status as of 2026-10-06, checked against the first schema snapshot.

| # | File | What it adds | Status |
|---|---|---|---|
| 001 | `001_leie_exclusions.sql` | OIG exclusion list for registration screening | applied |
| 002 | `002_patient_documents.sql` | patient document upload and extracted facts (PHI) | **held back** until BAAs are in place, see below |
| 003 | `003_insurance_payers.sql` | insurance plans by state | applied |
| 004 | `004_provider_review_status.sql` | review flag for name-based exclusion matches | applied |
| 005 | `005_provider_availability.sql` | opening hours and appointment settings | applied |
| 006 | `006_provider_locations.sql` | one account, many practice sites | applied |
| 007 | `007_fix_location_verified.sql` | corrects 006's `verified` backfill | applied |
| 008 | `008_directory_audits.sql` | Medicare activity, audit runs, findings, demand log (RLS on, no policies, on purpose) | applied |
| 009 | `009_cdc_places.sql` | CDC PLACES health measures by ZIP | applied |
| 010 | `010_cdc_places_centroids.sql` | ZIP centroids on `cdc_places` | applied |
| 011 | `011_lock_provider_profiles_select.sql` | security fix: closes anon reads of provider profiles | applied |
| 012 | `012_fix_011_cmd_filter.sql` | makes 011's cleanup actually match | applied |
| 013 | `013_npi_zip_enrichment.sql` | `provider_individuals` and the enrichment queue | applied 2026-08-10 |
| 014 | `014_clinic_secondary_locations.sql` | secondary practice addresses (needs 013) | applied 2026-08-10 |
| 015 | `015_provider_individuals_affiliation.sql` | `affiliated_clinic_npi` | applied |
| 016 | `016_clinics_npi_unique.sql` | `unique(npi)` on `clinics` after a dedupe | applied (the snapshot shows `clinics_npi_unique`) |
| 017 | `017_cms_provider_cache.sql` | 90-day cache of CMS lookups | applied |
| 018 | `018_appointments.sql` | appointment requests and briefings | applied |
| 019 | `019_medicare_county_enrollment.sql` | Medicare enrollment by county | applied |
| 020 | `020_zip_county_crosswalk.sql` | HUD ZIP to county crosswalk | applied |
| 021 | `021_market_benchmarks.sql` | market model benchmarks | applied |
| 022 | `022_market_benchmarks_state_density.sql` | allows the `state_density` kind | applied |
| 023 | `023_census_acs_zcta.sql` | ACS 5-year detail by ZIP | applied |
| 024 | `024_census_acs_insurance.sql` | insurance columns on `census_acs_zcta` | applied |
| 025 | `025_demand_model.sql` | allows the `demand_model` kind | not applied, not needed while the demand model is parked |
| 026 | `026_census_acs_signals.sql` | growth and market signals on `census_acs_zcta` | applied 2026-10-06 |
| 027 | `027_sahie_county.sql` | Census SAHIE county uninsured estimates | applied 2026-10-06 |
| 028 | `028_lock_v1_access_tables.sql` | **security fix**: closes public reads of v1's `access_requests` and `access_codes` (names, emails, access codes) | applied 2026-10-06, confirmed by the snapshot |
| 029 | `029_taxonomy_codes.sql` | `taxonomy_map` table, and `taxonomy_code` / `taxonomy_code_source` on the three directory tables (nullable, no rewrite) | written, **run before the taxonomy backfill** |
| 030 | `030_taxonomy_code_indexes.sql` | indexes on `taxonomy_code`, built concurrently (no begin/commit) | written, **run only after the backfill finishes in apply mode** |
| 031 | `031_cms_procedures_by_zip.sql` | ZIP-level summary of `cms_procedures_full` for the Procedures panel (same figures, far fewer rows) | written, **run now** (creates a table, drops nothing) |
| 032 | `032_drop_cms_procedures_full.sql` | drops the 4 GB per-provider procedures table and an unused 44 MB index; guarded | written, **run only after the Procedures summary check reports MATCH**; not reversible except by re-importing from CMS |

Only 014 depends on another file (013). Everything else is creation order.

## Why 002 is held back

`002` creates storage for uploaded medical records, the most sensitive PHI
this system would hold. Do not run it in production until BAAs are in place
with **both** Supabase (Team plan or above) and Anthropic, on the API account
`doc-extract.js` uses, since document contents leave our infrastructure when
they are read. The code is gated behind `DOCUMENT_UPLOAD_ENABLED`, so the
feature stays dark either way. Running `002` in a dev project is fine.

## Adding an insurance plan

No code change needed. `state = null` means national, shown in every state.

```sql
insert into public.insurance_payers (name, state, category, sort_order)
values ('Some Regional Plan', 'TN', 'commercial', 60);
```

Plan names, Medicaid brands and Blue Cross licensees change. A missing plan
degrades gracefully (both forms offer "Other"), but a wrong name looks worse
than a missing one, so review the list before launch.
