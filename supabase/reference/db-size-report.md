# Database size report

Read-only snapshot, 2026-10-09 15:00 UTC, by scripts/db-size-report.sh.

## Database

| database_size | server |
|---|---|
| 8126 MB | PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit |

## Write-ahead log

| wal_size | wal_files |
|---|---|
| 1024 MB | 65 |

## Index usage counted since

| index_stats_since |
|---|
| 2026-05-07 |

## Largest tables (top 40)

| schema | table_name | total | heap | toast | indexes | live_rows | dead_rows | dead_pct | last_vacuum |
|---|---|---|---|---|---|---|---|---|---|
| public | cms_procedures_full | 4041 MB | 3553 MB | 8192 bytes | 488 MB | 9779577 | 0 | 0.0 | 2026-05-25 |
| public | provider_individuals | 1748 MB | 1352 MB | 8192 bytes | 395 MB | 7132497 | 0 | 0.0 | 2026-08-15 |
| public | clinics | 738 MB | 430 MB | 8192 bytes | 307 MB | 1900334 | 237353 | 11.1 | 2026-08-15 |
| public | cdc_places | 546 MB | 295 MB | 8192 bytes | 251 MB | 1173231 | 115966 | 9.0 | 2026-09-20 |
| public | clinic_secondary_locations | 454 MB | 235 MB | 8192 bytes | 218 MB | 1126160 | 1 | 0.0 | 2026-08-15 |
| public | npi_activity | 423 MB | 259 MB | 8192 bytes | 163 MB | 2300952 | 414759 | 15.3 | 2026-09-12 |
| public | census_acs_zcta | 93 MB | 90 MB | 8192 bytes | 2200 kB | 33772 | 0 | 0.0 | 2026-10-06 |
| public | leie_exclusions | 33 MB | 21 MB | 8192 bytes | 12 MB | 84001 | 0 | 0.0 | 2026-10-08 |
| public | zip_county_crosswalk | 15 MB | 6984 kB | 8192 bytes | 8512 kB | 54234 | 0 | 0.0 | 2026-08-19 |
| public | demographics_raw | 11 MB | 9488 kB | 8192 bytes | 1800 kB | 27877 | 190 | 0.7 | 2026-05-14 |
| public | hpsa_designations | 9448 kB | 7680 kB | 8192 bytes | 1728 kB | 49147 | 0 | 0.0 | 2026-06-09 |
| public | medicare_county_enrollment | 880 kB | 600 kB | 8192 bytes | 240 kB | 3278 | 0 | 0.0 | 2026-09-18 |
| public | cms_county_utilization | 712 kB | 480 kB | 8192 bytes | 192 kB | 3197 | 0 | 0.0 | 2026-05-22 |
| public | insurance_payers | 432 kB | 176 kB | 8192 bytes | 216 kB | 1153 | 0 | 0.0 | 2026-09-22 |
| public | sahie_county | 408 kB | 280 kB | 8192 bytes | 88 kB | 3144 | 0 | 0.0 | 2026-10-06 |
| auth | users | 248 kB | 8192 bytes | 8192 bytes | 200 kB | 4 | 4 | 50.0 | 2026-10-01 |
| auth | refresh_tokens | 168 kB | 16 kB | 8192 bytes | 112 kB | 41 | 12 | 22.6 | 2026-09-29 |
| public | audit_findings | 144 kB | 64 kB | 8192 bytes | 48 kB | 26 | 8 | 23.5 |  |
| auth | sessions | 128 kB | 8192 bytes | 8192 bytes | 80 kB | 7 | 20 | 74.1 | 2026-09-29 |
| auth | one_time_tokens | 112 kB | 8192 bytes | 8192 bytes | 96 kB | 0 | 2 | 100.0 |  |
| public | market_benchmarks | 104 kB | 48 kB | 8192 bytes | 16 kB | 114 | 0 | 0.0 | 2026-09-30 |
| public | cms_provider_cache | 96 kB | 24 kB | 8192 bytes | 32 kB | 81 | 24 | 22.9 | 2026-08-14 |
| public | provider_locations | 96 kB | 8192 bytes | 8192 bytes | 80 kB | 1 | 13 | 92.9 |  |
| auth | scim_users | 88 kB | 0 bytes | 8192 bytes | 80 kB | 0 | 0 |  |  |
| auth | mfa_amr_claims | 80 kB | 8192 bytes | 8192 bytes | 32 kB | 7 | 20 | 74.1 | 2026-09-17 |
| public | provider_insurance | 80 kB | 8192 bytes | 8192 bytes | 32 kB | 4 | 44 | 91.7 | 2026-08-17 |
| auth | identities | 80 kB | 8192 bytes | 8192 bytes | 64 kB | 4 | 9 | 69.2 |  |
| public | provider_profiles | 72 kB | 8192 bytes | 8192 bytes | 56 kB | 1 | 4 | 80.0 |  |
| public | demand_log | 72 kB | 8192 bytes | 8192 bytes | 56 kB | 18 | 0 | 0.0 |  |
| storage | objects | 72 kB | 0 bytes | 8192 bytes | 64 kB | 0 | 0 |  |  |
| public | audit_log | 72 kB | 24 kB | 8192 bytes | 16 kB | 72 | 0 | 0.0 |  |
| auth | custom_oauth_providers | 56 kB | 0 bytes | 8192 bytes | 48 kB | 0 | 0 |  |  |
| auth | mfa_factors | 56 kB | 0 bytes | 8192 bytes | 48 kB | 0 | 0 |  |  |
| auth | scim_tokens | 48 kB | 0 bytes | 8192 bytes | 40 kB | 0 | 0 |  |  |
| public | zip_enrichment_queue | 48 kB | 8192 bytes | 8192 bytes | 32 kB | 2 | 5 | 71.4 |  |
| public | directory_audits | 48 kB | 8192 bytes | 8192 bytes | 32 kB | 6 | 6 | 50.0 |  |
| auth | oauth_consents | 48 kB | 0 bytes | 8192 bytes | 40 kB | 0 | 0 |  |  |
| auth | flow_state | 40 kB | 0 bytes | 8192 bytes | 32 kB | 0 | 0 |  |  |
| auth | saml_relay_states | 40 kB | 0 bytes | 8192 bytes | 32 kB | 0 | 0 |  |  |
| storage | migrations | 40 kB | 8192 bytes | 0 bytes | 32 kB | 73 | 0 | 0.0 |  |

## Largest indexes (top 40)

| schema | table_name | index_name | size | times_used | unique_or_pk |
|---|---|---|---|---|---|
| public | provider_individuals | provider_individuals_pkey | 282 MB | 7190163 | yes |
| public | cms_procedures_full | cms_procedures_full_pkey | 210 MB | 0 | yes |
| public | cms_procedures_full | idx_cpf_npi | 132 MB | 0 |  |
| public | npi_activity | npi_activity_pkey | 119 MB | 6852898 | yes |
| public | clinics | clinics_npi_unique | 114 MB | 1906728 | yes |
| public | cdc_places | cdc_places_latlon_idx | 103 MB | 194 |  |
| public | cms_procedures_full | idx_cpf_zip | 84 MB | 82689 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_parent_npi_address_zip_key | 83 MB | 1127269 | yes |
| public | clinics | clinics_pkey | 82 MB | 0 | yes |
| public | cdc_places | cdc_places_pkey | 76 MB | 3516702 | yes |
| public | cdc_places | cdc_places_measure_idx | 73 MB | 5600 |  |
| public | provider_individuals | provider_individuals_zip_idx | 66 MB | 3978 |  |
| public | cms_procedures_full | idx_cpf_specialty | 62 MB | 683 |  |
| public | provider_individuals | provider_individuals_taxonomy_idx | 47 MB | 6 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_geo_idx | 46 MB | 244 |  |
| public | npi_activity | npi_activity_refreshed_idx | 44 MB | 0 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_pkey | 43 MB | 1 | yes |
| public | clinics | idx_clinics_state | 40 MB | 915 |  |
| public | clinics | idx_clinics_city | 37 MB | 1364 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_parent_npi_idx | 36 MB | 1 |  |
| public | clinics | idx_clinics_zip | 34 MB | 10161 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_zip_idx | 10 MB | 221 |  |
| public | leie_exclusions | leie_name_idx | 5664 kB | 0 |  |
| public | leie_exclusions | leie_exclusions_pkey | 5536 kB | 4 | yes |
| public | zip_county_crosswalk | zip_county_crosswalk_zip_fips_key | 3136 kB | 108468 | yes |
| public | zip_county_crosswalk | zip_county_crosswalk_pkey | 2392 kB | 112 | yes |
| public | zip_county_crosswalk | zip_county_crosswalk_zip_idx | 1992 kB | 76 |  |
| public | census_acs_zcta | census_acs_zcta_pkey | 1496 kB | 135238 | yes |
| public | hpsa_designations | hpsa_designations_pkey | 1096 kB | 204 | yes |
| public | zip_county_crosswalk | zip_county_crosswalk_fips_idx | 992 kB | 2 |  |
| public | demographics_raw | idx_demographics_raw_zip | 888 kB | 3344 |  |
| public | census_acs_zcta | census_acs_zcta_state_idx | 680 kB | 8 |  |
| public | demographics_raw | demographics_raw_pkey | 648 kB | 0 | yes |
| public | hpsa_designations | idx_hpsa_county | 632 kB | 524 |  |
| public | leie_exclusions | leie_npi_idx | 592 kB | 22 |  |
| public | demographics_raw | idx_demographics_raw_state | 264 kB | 305 |  |
| public | medicare_county_enrollment | medicare_county_enrollment_pkey | 168 kB | 6640 | yes |
| public | insurance_payers | insurance_payers_name_state_key | 104 kB | 3089 | yes |
| public | cms_county_utilization | idx_cms_county_fips | 104 kB | 359 |  |
| public | cms_county_utilization | cms_county_utilization_pkey | 88 kB | 0 | yes |
