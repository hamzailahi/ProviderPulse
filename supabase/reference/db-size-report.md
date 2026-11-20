# Database size report

Read-only snapshot, 2026-11-20 16:10 UTC, by scripts/db-size-report.sh.

## Database

| database_size | server |
|---|---|
| 13 GB | PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit |

## Write-ahead log

| wal_size | wal_files |
|---|---|
| 1088 MB | 69 |

## Index usage counted since

| index_stats_since |
|---|
|  |

## Largest tables (top 40)

| schema | table_name | total | heap | toast | indexes | live_rows | dead_rows | dead_pct | last_vacuum |
|---|---|---|---|---|---|---|---|---|---|
| public | cms_procedures_full | 4041 MB | 3553 MB | 8192 bytes | 488 MB | 0 | 0 |  |  |
| public | provider_individuals | 3148 MB | 1806 MB | 8192 bytes | 1341 MB | 7554531 | 315075 | 4.0 | 2026-11-16 |
| public | medicare_procedures_zip | 1182 MB | 912 MB | 8192 bytes | 270 MB | 4128906 | 0 | 0.0 | 2026-11-04 |
| public | clinics | 1022 MB | 437 MB | 8192 bytes | 584 MB | 1994908 | 1582 | 0.1 | 2026-11-16 |
| public | clinic_secondary_locations | 556 MB | 292 MB | 8192 bytes | 264 MB | 1140523 | 1090 | 0.1 | 2026-10-09 |
| public | cdc_places | 546 MB | 295 MB | 8192 bytes | 251 MB | 0 | 0 |  |  |
| public | medicaid_procedures | 520 MB | 299 MB | 8192 bytes | 221 MB | 3083819 | 0 | 0.0 | 2026-10-12 |
| public | npi_activity | 472 MB | 270 MB | 8192 bytes | 203 MB | 2328614 | 73629 | 3.1 | 2026-11-12 |
| public | listing_counts_zip | 407 MB | 196 MB | 8192 bytes | 211 MB | 1883409 | 0 | 0.0 | 2026-11-19 |
| public | clinician_status | 242 MB | 193 MB | 8192 bytes | 49 MB | 1640076 | 0 | 0.0 | 2026-11-19 |
| public | clinician_medicare_sites | 179 MB | 108 MB | 8192 bytes | 71 MB | 1002333 | 0 | 0.0 | 2026-11-20 |
| public | access_e2sfca | 169 MB | 91 MB | 8192 bytes | 77 MB | 1175680 | 0 | 0.0 | 2026-11-19 |
| public | census_acs_zcta | 108 MB | 105 MB | 8192 bytes | 2240 kB | 33772 | 0 | 0.0 | 2026-11-19 |
| public | clinician_weight | 105 MB | 54 MB | 8192 bytes | 50 MB | 1273119 | 0 | 0.0 | 2026-11-19 |
| public | medicare_hospital_procedures | 48 MB | 35 MB | 8192 bytes | 12 MB | 208246 | 0 | 0.0 | 2026-10-12 |
| public | leie_exclusions | 33 MB | 21 MB | 8192 bytes | 12 MB | 0 | 0 |  |  |
| public | zip_county_crosswalk | 17 MB | 8392 kB | 8192 bytes | 8544 kB | 54247 | 0 | 0.0 | 2026-10-25 |
| public | demographics_raw | 11 MB | 9488 kB | 8192 bytes | 1800 kB | 0 | 0 |  |  |
| public | hpsa_designations | 9448 kB | 7680 kB | 8192 bytes | 1728 kB | 0 | 0 |  |  |
| public | procedure_codes | 1088 kB | 848 kB | 8192 bytes | 200 kB | 6218 | 0 | 0.0 | 2026-10-12 |
| public | medicare_county_enrollment | 888 kB | 608 kB | 8192 bytes | 240 kB | 3278 | 0 | 0.0 | 2026-11-18 |
| public | cms_county_utilization | 848 kB | 480 kB | 8192 bytes | 328 kB | 3197 | 0 | 0.0 | 2026-11-19 |
| public | insurance_payers | 512 kB | 208 kB | 8192 bytes | 264 kB | 1471 | 0 | 0.0 | 2026-10-22 |
| public | medicare_hospitals | 448 kB | 304 kB | 8192 bytes | 104 kB | 3084 | 0 | 0.0 | 2026-10-12 |
| public | sahie_county | 408 kB | 280 kB | 8192 bytes | 88 kB | 0 | 0 |  |  |
| public | taxonomy_map | 296 kB | 208 kB | 8192 bytes | 56 kB | 883 | 0 | 0.0 |  |
| public | county_preventable_stays | 288 kB | 160 kB | 8192 bytes | 88 kB | 3069 | 0 | 0.0 | 2026-11-20 |
| auth | users | 256 kB | 8192 bytes | 8192 bytes | 208 kB | 5 | 14 | 73.7 | 2026-11-01 |
| auth | refresh_tokens | 168 kB | 16 kB | 8192 bytes | 112 kB | 10 | 3 | 23.1 | 2026-11-01 |
| public | zip_centres | 144 kB | 72 kB | 8192 bytes | 40 kB | 775 | 0 | 0.0 |  |
| public | audit_findings | 144 kB | 64 kB | 8192 bytes | 48 kB | 0 | 0 |  |  |
| auth | one_time_tokens | 144 kB | 8192 bytes | 8192 bytes | 128 kB | 0 | 2 | 100.0 |  |
| public | market_benchmarks | 128 kB | 56 kB | 8192 bytes | 32 kB | 140 | 0 | 0.0 | 2026-10-27 |
| auth | sessions | 128 kB | 8192 bytes | 8192 bytes | 80 kB | 9 | 29 | 76.3 | 2026-10-25 |
| public | cms_provider_cache | 104 kB | 32 kB | 8192 bytes | 32 kB | 26 | 0 | 0.0 |  |
| public | demand_log | 104 kB | 16 kB | 8192 bytes | 56 kB | 42 | 0 | 0.0 |  |
| public | provider_locations | 96 kB | 8192 bytes | 8192 bytes | 80 kB | 0 | 0 |  |  |
| auth | scim_users | 88 kB | 0 bytes | 8192 bytes | 80 kB | 0 | 0 |  |  |
| storage | objects | 88 kB | 0 bytes | 8192 bytes | 80 kB | 0 | 0 |  |  |
| auth | identities | 80 kB | 8192 bytes | 8192 bytes | 64 kB | 3 | 3 | 50.0 |  |

## Largest indexes (top 40)

| schema | table_name | index_name | size | times_used | unique_or_pk |
|---|---|---|---|---|---|
| public | provider_individuals | provider_individuals_geo_idx | 336 MB | 1479 |  |
| public | provider_individuals | provider_individuals_pkey | 334 MB | 16231020 | yes |
| public | provider_individuals | provider_individuals_name_trgm_idx | 297 MB | 17 |  |
| public | medicare_procedures_zip | medicare_procedures_zip_pkey | 270 MB | 942 | yes |
| public | medicaid_procedures | medicaid_procedures_pkey | 221 MB | 9118 | yes |
| public | cms_procedures_full | cms_procedures_full_pkey | 210 MB | 0 | yes |
| public | cms_procedures_full | idx_cpf_npi | 132 MB | 9 |  |
| public | npi_activity | npi_activity_pkey | 132 MB | 4619195 | yes |
| public | clinics | clinics_geo_idx | 126 MB | 831 |  |
| public | clinics | clinics_npi_unique | 118 MB | 14431791 | yes |
| public | listing_counts_zip | listing_counts_zip_zip_idx | 116 MB | 1021 |  |
| public | clinics | clinics_name_trgm_idx | 115 MB | 12 |  |
| public | cdc_places | cdc_places_latlon_idx | 103 MB | 865 |  |
| public | listing_counts_zip | listing_counts_zip_pkey | 95 MB | 0 | yes |
| public | clinic_secondary_locations | clinic_secondary_locations_parent_npi_address_zip_key | 91 MB | 25769 | yes |
| public | clinics | clinics_pkey | 85 MB | 0 | yes |
| public | cms_procedures_full | idx_cpf_zip | 84 MB | 47300 |  |
| public | provider_individuals | provider_individuals_zip_idx | 82 MB | 68787 |  |
| public | access_e2sfca | access_e2sfca_pkey | 77 MB | 25 | yes |
| public | provider_individuals | provider_individuals_state_city_idx | 76 MB | 5189 |  |
| public | cdc_places | cdc_places_pkey | 76 MB | 7139 | yes |
| public | provider_individuals | provider_individuals_city_idx | 74 MB | 620 |  |
| public | cdc_places | cdc_places_measure_idx | 73 MB | 33323 |  |
| public | provider_individuals | provider_individuals_taxonomy_idx | 72 MB | 0 |  |
| public | npi_activity | npi_activity_refreshed_idx | 71 MB | 0 |  |
| public | clinician_medicare_sites | clinician_medicare_sites_pkey | 71 MB | 1002366 | yes |
| public | provider_individuals | provider_individuals_taxonomy_code_idx | 70 MB | 2129 |  |
| public | cms_procedures_full | idx_cpf_specialty | 62 MB | 174 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_geo_idx | 51 MB | 509 |  |
| public | clinician_weight | clinician_weight_pkey | 50 MB | 91286 | yes |
| public | clinician_status | clinician_status_pkey | 49 MB | 0 | yes |
| public | clinics | idx_clinics_state | 47 MB | 1086 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_pkey | 46 MB | 0 | yes |
| public | clinic_secondary_locations | clinic_secondary_locations_parent_npi_idx | 39 MB | 20515 |  |
| public | clinics | idx_clinics_city | 38 MB | 1643 |  |
| public | clinics | idx_clinics_zip | 34 MB | 8814 |  |
| public | clinics | clinics_taxonomy_code_idx | 20 MB | 418 |  |
| public | clinic_secondary_locations | clinic_secondary_locations_zip_idx | 12 MB | 628 |  |
| public | medicare_hospital_procedures | medicare_hospital_procedures_pkey | 11 MB | 1845 | yes |
| public | clinic_secondary_locations | clinic_secondary_locations_state_city_idx | 8472 kB | 1203 |  |
