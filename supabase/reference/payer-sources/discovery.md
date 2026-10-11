<!-- Written by scripts/payer-sources-discover.mjs. Read only. -->
# Payer source discovery, 2026-10-11 19:37 UTC

## 1. Medical Loss Ratio public use files (cms.gov)

- read https://www.cms.gov/marketplace/resources/data/medical-loss-ratio-data-systems-resources (205,994 bytes)
- read https://www.cms.gov/CCIIO/Resources/Data-Resources/mlr (205,994 bytes)
- read https://www.cms.gov/cciio/resources/data-resources/mlr (205,994 bytes)

Zip links found (13):

- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20121127.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr-2012-public-use-file-puf.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20140630.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20151118.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20161019.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20171019.zip
- https://www.cms.gov/cciio/resources/data-resources/downloads/mlr_datafilespuf_20181205.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2019.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2020.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2021.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2022.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2023.zip
- https://www.cms.gov/files/zip/mlr-public-use-file-2024.zip

Newest (by the year in its name): **https://www.cms.gov/files/zip/mlr-public-use-file-2024.zip**
Downloaded 7.3 MB.

Files inside:

```
Archive:  /tmp/payers-EhXqwY/mlr.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
    59649  2025-09-12 03:36   MR_Submission_Row_Lookup.csv
      347  2025-09-12 03:36   MR_Submission_Sheet_Lookup.csv
   511088  2025-09-12 03:36   MR_Submission_Template_Header.csv
 50983998  2025-09-12 03:36   Part1_2_Summary_Data_Premium_Claims.csv
 15145709  2025-09-12 03:36   Part3_MLR_Rebate_Calculation.csv
   672093  2025-09-12 03:36   Part4_Rebate_Disbursement_Notes.csv
  3710620  2025-09-12 03:36   Part4_Rebate_Disbursement.csv
    70107  2025-09-12 03:36   Part5_Additional_Responses1.csv
  6334820  2025-09-12 03:36   Part5_Additional_Responses2.csv
 29774920  2025-09-12 03:36   Part6_Expense_Allocation.csv
   420202  2025-09-12 03:36   MLR_DataDictionaryPUF.pdf
---------                     -------
107683553                     11 files
```

#### MR_Submission_Row_Lookup.csv

363 data rows. Columns:

`lookup_cat_code`, `lookup_code`, `lookup_name`, `lookup_description`, `sort_order`, `reporting_year`, `formula_calc`

Sample rows:

```
"PART1","COST_CONTAINMENT_EXP_NOT_INCL","Cost containment expenses not included in quality improvement expenses in Section 4","5.1 Cost containment expenses not included in quality improvement expenses in Section 4",330,"2024",0
"PART1","ALL_OTHER_CLAIMS_ADJ_EXPENSES","All other claims adjustment expenses","5.2 All other claims adjustment expenses",340,"2024",0
"PART1","DIR_SALES_SALARIES_AND_BENEFITS","Direct sales salaries and benefits","5.3 Direct sales salaries and benefits",350,"2024",0
"PART1","AGNTS_AND_BROKERS_FEES_COMMS","Agents and brokers fees and commissions","5.4 Agents and brokers fees and commissions",360,"2024",0
"PART1","STATE_TAXES_ASSMTS_NOT_EXC_PREM","Taxes and assessments","5.5a Taxes and assessments (exclude amounts reported in Section 3 or Lines 5.5c or 9)",370,"2024",0
```

#### MR_Submission_Sheet_Lookup.csv

7 data rows. Columns:

`reporting_year`, `lookup_cat_code`, `lookup_cat_name`

Sample rows:

```
"2024","HEADER","Company Information"
"2024","PART1","Pt 1 Summary of Data"
"2024","PART2","Pt 2 Premium and Claims"
"2024","PART4","Pt 6 Expense Allocation"
"2024","PART5","Pt 3 MLR and Rebate Calculation"
```

#### MR_Submission_Template_Header.csv

2,194 data rows. Columns:

`mr_submission_template_id`, `business_state`, `group_affiliation`, `company_pk`, `hios_issuer_id`, `company_name`, `company_address`, `domiciliary_state`, `naic_group_code`, `naic_company_code`, `federal_ein`, `am_best_number`, `dba_marketing_name`, `not_for_profit`, `created_date`, `merge_markets_ind_small_grp`, `fit_exempt`

Sample rows:

```
197114,"UT",,,"42261","University of Utah Health Insurance Plans","6056 Fashion Square Drive, Suite 3104 Murray, Utah 84107","UT",,"15648","472293857",,"University of Utah Health Insurance Plans",1,"2025-07-01 16:51:02",0,0
197115,"Grand Total",,,,"University of Utah Health Insurance Plans","6056 Fashion Square Drive, Suite 3104 Murray, Utah 84107","UT",,"15648","472293857",,"University of Utah Health Insurance Plans",1,"2025-07-01 16:51:11",0,0
197124,"ND",,,"37160","Blue Cross Blue Shield of North Dakota","4510 13th Ave S Fargo, North Dakota 58121-0001","ND",,"55891","450173185","068581","Blue Cross Blue Shield of North Dakota",1,"2025-07-02 16:18:02",0,0
197125,"Grand Total",,,,"Blue Cross Blue Shield of North Dakota","4510 13th Ave S Fargo, North Dakota 58121-0001","ND",,"55891","450173185","068581","Blue Cross Blue Shield of North Dakota",1,"2025-07-02 16:18:11",0,0
197128,"AZ",,,"70904","WMI Mutual Insurance Company","PO Box 572450 Salt Lake City, Utah 84157-2450","UT",,"68420","870455184",,"WMI Mutual Insurance Company",0,"2025-07-03 13:39:02",0,0
```

#### Part1_2_Summary_Data_Premium_Claims.csv

206,236 data rows. Columns:

`mr_submission_template_id`, `row_lookup_code`, `cmm_individual_yearly`, `cmm_individual_q1`, `cmm_individual_deferred_py`, `cmm_individual_deferred_cy`, `cmm_individual_total`, `cmm_small_group_yearly`, `cmm_small_group_q1`, `cmm_small_group_deferred_py`, `cmm_small_group_deferred_cy`, `cmm_small_group_total`, `cmm_large_group_yearly`, `cmm_large_group_q1`, `cmm_large_group_deferred_py`, `cmm_large_group_deferred_cy`, `cmm_large_group_total`, `mini_med_individual_yearly`, `mini_med_individual_q1`, `mini_med_small_group_yearly`, `mini_med_small_group_q1`, `mini_med_large_group_yearly`, `mini_med_large_group_q1`, `expat_small_group_yearly`, `expat_small_group_q1`, `expat_small_group_deferred_py`, `expat_small_group_deferred_cy`, `expat_small_group_total`, `expat_large_group_yearly`, `expat_large_group_q1`, `expat_large_group_deferred_py`, `expat_large_group_deferred_cy`, `expat_large_group_total`, `government_prog_plans_yearly`, `other_health_business_yearly`, `aggregate_2percent_rule_yearly`, `uninsured_plans_yearly`, `grand_total`, `created_date`, `cmm_individual_dual_cont`, `cmm_small_group_dual_cont`, `cmm_large_group_dual_cont`, `mini_med_individual_dual_cont`, `mini_med_small_group_dual_cont`, `mini_med_large_group_dual_cont`, `expat_small_group_dual_cont`, `expat_large_group_dual_cont`, `shp_individual_yearly`, `shp_individual_q1`, `shp_individual_dual_cont`, `shp_individual_deferred_py`, `shp_individual_deferred_cy`, `cmm_individual_rc`, `cmm_small_group_rc`, `mdcr_mlr_busns_yrly_qty`

Sample rows:

```
197114,"ACA_9010_FEE",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:08",,,,,,,,,,,,,,,,
197114,"ACC_MED_INC_POOLS_BON_CURR_YR",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:08",,,,,,,,,,,,,,,,
197114,"ACC_MED_INC_POOLS_BON_PRIOR_YR",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:08",,,,,,,,,,,,,,,,
197114,"ACTIVITES_TO_PREVENT_HOSP_READM",0.000000000000000,0.000000000000000,,,,,,,,,0.000000000000000,0.000000000000000,,,,,,,,,,,,,,,,,,,,,,,0.000000000000000,,"2025-07-01 16:51:08",,,,,,,,,,,,,,,,0.000000000000000
197114,"AGNTS_AND_BROKERS_FEES_COMMS",1910991.000000000000000,1910991.000000000000000,,,,,,,,,1317498.000000000000000,1317498.000000000000000,,,,,,,,,,,,,,,,,,,,,,,13833.000000000000000,,"2025-07-01 16:51:08",,,,,,,,,,,,,,,,1605.000000000000000
```

#### Part3_MLR_Rebate_Calculation.csv

81,178 data rows. Columns:

`mr_submission_template_id`, `row_lookup_code`, `cmm_individual_py2`, `cmm_individual_py1`, `cmm_individual_cy`, `cmm_individual_total`, `cmm_small_group_py2`, `cmm_small_group_py1`, `cmm_small_group_cy`, `cmm_small_group_total`, `cmm_large_group_py2`, `cmm_large_group_py1`, `cmm_large_group_cy`, `cmm_large_group_total`, `mini_med_individual_py2`, `mini_med_individual_py1`, `mini_med_individual_cy`, `mini_med_individual_total`, `mini_med_small_group_py2`, `mini_med_small_group_py1`, `mini_med_small_group_cy`, `mini_med_small_group_total`, `mini_med_large_group_py2`, `mini_med_large_group_py1`, `mini_med_large_group_cy`, `mini_med_large_group_total`, `expatriate_small_group_py2`, `expatriate_small_group_py1`, `expatriate_small_group_cy`, `expatriate_small_group_total`, `expatriate_large_group_py2`, `expatriate_large_group_py1`, `expatriate_large_group_cy`, `expatriate_large_group_total`, `created_date`, `shp_individual_py2`, `shp_individual_py1`, `shp_individual_cy`, `shp_individual_total`, `cmm_individual_rc`, `cmm_small_group_rc`

Sample rows:

```
197114,"ADJ_EARNED_PREMIUM_LIC_REG_FEE",,,,73645163.560000000000000,,,,,,,,25584542.000000000000000,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:09",,,,,,
197114,"ADJ_INCURRED_CLAIMS",85757167.000000000000000,79530031.000000000000000,,,,,,,24320189.000000000000000,18794626.000000000000000,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:09",,,,,,
197114,"ADJ_INCURRED_CLAIMS_RESTATED_Q1",83492799.770000000000000,77799282.550000000000000,82447101.870000000000000,243739184.190000000000000,,,,,22367784.940000000000000,18797469.720000000000000,23368706.770000000000000,64533961.429999990000000,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:09",,,,,,
197114,"ADVANCE_PAYMENTS_CSR",0.000000000000000,0.000000000000000,0.000000000000000,0.000000000000000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:09",,,,,,
197114,"AVERAGE_DEDUCTIBLE",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,"2025-07-01 16:51:09",,,,,,
```

#### Part4_Rebate_Disbursement.csv

37,298 data rows. Columns:

`mr_submission_template_id`, `row_lookup_code`, `cmm_individual`, `cmm_small_group`, `cmm_large_group`, `mini_med_individual`, `mini_med_small_group`, `mini_med_large_group`, `expatriate_small_group`, `expatriate_large_group`, `created_date`, `shp_individual`

Sample rows:

```
197114,"AMT_OF_DE_MINIMIS_REBATES",,,,,,,,,"2025-07-01 16:51:09",
197114,"AMT_OWED_REBATE_PRIOR_REP_YR",,,,,,,,,"2025-07-01 16:51:09",
197114,"AMT_PAID_REBATE_PRIOR_REP_YR",,,,,,,,,"2025-07-01 16:51:09",
197114,"AMT_REBATES_PAID_BY_PREM_CREDIT",,,,,,,,,"2025-07-01 16:51:09",
197114,"AMT_REBATES_PAID_LUMP_SUM_REIMB",,,,,,,,,"2025-07-01 16:51:09",
```

#### Part4_Rebate_Disbursement_Notes.csv

2,194 data rows. Columns:

`mr_submission_template_id`, `desc_locate_plcy_hlers_sub`, `desc_disb_pri_rep_unclm_reb`, `created_date`

Sample rows:

```
197114,"University of Utah Health Insurance Plans (UUHIP) sent out individual letters to policyholders notifying them that they had an uncashed check, included a notification with subsequent bills, and made phone calls trying to reach the policyholders.","After attempting to contact policyholders who have not cashed their check, UUHIP sent the unclaimed rebates to escheatment with the State of Uta
197115,"University of Utah Health Insurance Plans (UUHIP) sent out individual letters to policyholders notifying them that they had an uncashed check, included a notification with subsequent bills, and made phone calls trying to reach the policyholders.","After attempting to contact policyholders who have not cashed their check, UUHIP sent the unclaimed rebates to escheatment with the State of Uta
197124,,,"2025-07-02 16:18:09"
197125,,,"2025-07-02 16:18:18"
197128,,,"2025-07-03 13:39:09"
```

#### Part5_Additional_Responses1.csv

2,194 data rows. Columns:

`mr_submission_template_id`, `tax_rate`, `created_date`

Sample rows:

```
197690,,"2025-07-18 08:57:09"
197691,,"2025-07-18 08:57:18"
200616,,"2025-08-02 11:00:04"
200617,,"2025-08-02 11:00:07"
197114,,"2025-07-01 16:51:09"
```

#### Part5_Additional_Responses2.csv

100,924 data rows. Columns:

`mr_submission_template_id`, `row_lookup_code`, `name_of_affiliate_entity`, `effective_date`, `created_date`

Sample rows:

```
197690,"AFFILIATE_NAME_BLEND_RATE_ADJ_1",,,"2025-07-18 08:57:09"
197690,"AFFILIATE_NAME_BLEND_RATE_ADJ_5",,,"2025-07-18 08:57:09"
197690,"AFFILIATE_NAME_BLEND_RATE_ADJ_9",,,"2025-07-18 08:57:09"
197690,"AFFILIATE_NAME_BLEND_RATE_ADJ_2",,,"2025-07-18 08:57:09"
197690,"AFFILIATE_NAME_BLEND_RATE_ADJ_6",,,"2025-07-18 08:57:09"
```

#### Part6_Expense_Allocation.csv

359,816 data rows. Columns:

`mr_submission_template_id`, `row_lookup_code`, `desc_of_exp_element_by_type`, `is_new`, `det_desc_of_exp_alloc_methods`, `created_date`

Sample rows:

```
197114,"ACT_PREVENT_HOSP_READM_1","Salaries",0,"Salary expense includes the portion of the overall salary expenses that are attributable to personnel involved in activities such as discharge planning and post-discharge counseling. This expense is allocated to specific product lines using an employee time usage study that has every employee report the percentage of their time that they have spent o
197114,"ACT_PREVENT_HOSP_READM_10",,,,"2025-07-01 16:51:09"
197114,"ACT_PREVENT_HOSP_READM_2",,,,"2025-07-01 16:51:09"
197114,"ACT_PREVENT_HOSP_READM_3",,,,"2025-07-01 16:51:09"
197114,"ACT_PREVENT_HOSP_READM_4",,,,"2025-07-01 16:51:09"
```

## 2. Medicaid managed care enrollment (data.medicaid.gov)

Datasets whose title mentions managed care and plan or program (12):

- **Managed Care Enrollment by Program and Plan** (modified 2026-02-11T13:23:00+00:00, id 0bef7b8a-c663-5b14-9a46-0b5c2b86b0fe): https://download.medicaid.gov/data/managed-care-enrollment-by-program-and-plan2024-table4.csv
- **Managed Care Enrollment by Program and Population (All)** (modified 2026-02-12T03:11:00+00:00, id e2ce0d2f-07c5-5213-947a-31e19bc649f6): https://download.medicaid.gov/data/managed-care-enrollment-by-program-and-population-all-2024-table2.csv
- **2017 Managed Care Programs by State** (modified 2025-10-17T20:44:00+00:00, id 8f39b637-9bb1-5894-9062-2c4f2ad70fba): https://download.medicaid.gov/data/2017-managed-care-programs-by-state.hc9x-7kex101725.csv
- **2018 Managed Care Programs By State** (modified 2025-10-17T14:00:00+00:00, id b7cf4576-a930-59b4-86c8-c8685aaa5c2c): https://download.medicaid.gov/data/2018-manged-care-programs-by-state_310172025.csv
- **Managed Care Enrollment by Program and Population (Duals)** (modified 2026-02-11T12:49:00+00:00, id 8e7be65b-97ba-5ecf-8394-ca8e6f63685a): https://download.medicaid.gov/data/managed-care-enrollment-by-program-and-population-duals-2024-table3.csv
- **Managed Care Programs by State** (modified 2025-10-17T20:42:00+00:00, id 0e112ea8-8e8e-5dee-a7e2-7ed551c3baa4): https://download.medicaid.gov/data/managed-care-programs-by-state.p9c7-tuup-updated-100825-101725.csv
- **2019 Managed Care Programs By State** (modified 2022-06-13T15:45:14+00:00, id 72135da5-f8b4-475b-b602-91621f4205d9): https://download.medicaid.gov/data/2019_Table9_10_updated.csv
- **2020 Managed Care Programs By State** (modified 2025-10-17T12:22:00+00:00, id 8483cef4-972a-4c39-8290-c9d19bead88d): https://download.medicaid.gov/data/2020-Table9_06132022_2_100825-10172025.csv
- **2021 Managed Care Programs By State** (modified 2023-07-21T16:59:15+00:00, id 7459d190-e592-42e0-9b66-6f4e7e05eb9b): https://download.medicaid.gov/data/2021-Table9_07212023_2.csv
- **2022 Managed Care Programs By State** (modified 2024-10-16T20:22:18+00:00, id ac74549c-a621-4f6b-a42d-1a05bc0eb5a3): https://data.medicaid.gov/sites/default/files/uploaded_resources/2022-Managed-care-prgrm-features-by-state.csv
- **2023 Managed Care Programs By State** (modified 2026-02-12T19:57:15+00:00, id a760aac0-5148-43e9-900a-bb128e667218): https://download.medicaid.gov/data/managed-care-program-by-state-2023.csv
- **2024 Managed Care Programs By State** (modified 2026-02-11T19:48:14+00:00, id ef16c490-861a-4b1f-9e6d-f321abdcaab1): https://download.medicaid.gov/data/managed-care-program-by-state-2024.csv

Using **Managed Care Enrollment by Program and Plan**: https://download.medicaid.gov/data/managed-care-enrollment-by-program-and-plan2024-table4.csv

#### Managed Care Enrollment by Program and Plan

7,807 data rows. Columns:

`State`, `Notes`, `Program Name`, `Plan Name`, `Geographic Region`, `Medicaid-Only Enrollment `, `Dual Enrollment`, `Total Enrollment`, `Year`, `Parent Organization`

Sample rows:

```
Texas,,STAR (Comprehensive MCO),Aetna,"Bexar SDA, Tarrant SDA",72966,0,72966,2016,
New Mexico,,Centennial Care (Comprehensive MCO + MLTSS),Molina Healthcare of New Mexico Inc,Statewide,225105,7597,232702,2016,
California,,County Organized Health Systems (COHS) Model (Comprehensive MCO + MLTSS),Gold Coast Health Plan,Ventura,187408,21624,209032,2016,
New York,,Managed Long Term Care (MLTSS only (PIHP and/or PAHP)),VNA Homecare Options,48 counties.,140,2369,2509,2016,
New York,,Managed Long Term Care (MLTSS only (PIHP and/or PAHP)),Metroplus,New York City,477,728,1205,2016,
```
