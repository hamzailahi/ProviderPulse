# AHRQ Compendium of U.S. Health Systems: discovery

Run 2026-11-20 by scripts/ahrq-discover.mjs. Read only.

- https://www.ahrq.gov/chsp/data-resources/compendium.html: HTTP 202, 0 file links
- https://web.archive.org/web/2026/https://www.ahrq.gov/chsp/data-resources/compendium.html: HTTP 200, 0 file links
- https://www.ahrq.gov/chsp/data-resources/compendium-2023.html: HTTP 202, 0 file links
- https://web.archive.org/web/2026/https://www.ahrq.gov/chsp/data-resources/compendium-2023.html: HTTP 200, 9 file links
- https://www.ahrq.gov/chsp/data-resources/compendium-2022.html: HTTP 202, 0 file links
- https://web.archive.org/web/2026/https://www.ahrq.gov/chsp/data-resources/compendium-2022.html: HTTP 403, 0 file links

## Files linked

- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-compendium-2023-rev.csv
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-compendium-2023-rev.xlsx
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hospital-linkage-2023.xlsx
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hospital-linkage-2023.csv
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-os-linkage-2023.xlsx
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-nh-linkage-2023.xlsx
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-nh-linkage-2023.csv
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hhco-linkage-2023.xlsx
- https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hhco-linkage-2023.csv

downloaded: https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-compendium-2023-rev.csv
downloaded: https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hospital-linkage-2023.csv
downloaded: https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-nh-linkage-2023.csv
downloaded: https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hhco-linkage-2023.csv
## chsp-compendium-2023-rev.csv

- rows: 640
- columns: health_sys_id,health_sys_name,health_sys_city,health_sys_state,in_onekey,in_aha,onekey_id,aha_sysid,total_mds,prim_care_mds,total_nps,total_pas,grp_cnt,grp_cnt_restricted,hosp_cnt,acutehosp_cnt,nh_cnt,nh_cnt_restricted,hhco_cnt,hhco_cnt_restricted,sys_multistate,sys_beds,sys_dsch,sys_res,deg_children,sys_incl_majteachhosp,sys_incl_vmajteachhosp,sys_teachint,sys_incl_highdpphosp,sys_highucburden,sys_incl_highuchosp,sys_anyins_product,sys_mcare_adv,sys_mcaid_mngcare,sys_healthins_mktplc,sys_ma_plan_contracts,sys_ma_plan_enroll,sys_ownership,hos_net_revenue,hos_total_revenue

```
HSI00000008,Adena Health System,Chillicothe,OH,1,1,17780403,0895,336,126,147,20,53,51,4,4,0,0,2,1,1,298,10856,35.45,0,0,0,1,0,0,1,0,,,,,,1,601769408,2262405323
HSI00000010,AdventHealth,Altamonte Springs,FL,1,1,17773293,4165,3580,1308,1935,705,745,681,42,41,2,1,18,15,3,8809,457153,343.68,0,0,0,1,1,0,1,1,1,1,1,,,2,15573277510,82666491855
HSI00000011,Adventist Health,Roseville,CA,1,1,17773620,0235,1658,657,471,350,349,308,28,25,4,4,14,13,3,2976,124014,139.16,0,1,0,1,1,0,1,1,1,1,1,,,2,5264286719,26614819756
```

## chsp-hospital-linkage-2023.csv

- rows: 6801
- columns: compendium_hospital_id,ccn,hospital_name,hospital_street,hospital_city,hospital_state,hospital_zip,acutehosp_flag,health_sys_id,health_sys_name,health_sys_city,health_sys_state,corp_parent_id,corp_parent_name,corp_parent_type,hos_beds,hos_dsch,hos_res,hos_children,hos_majteach,hos_vmajteach,hos_teachint,hos_highdpp,hos_ucburden,hos_highuc,hos_ownership,hos_net_revenue,hos_total_revenue

```
CHSP00000003,390163,Armstrong County Memorial,One Nolte Drive,Kittanning,PA,16201,1,HSI00000051,Armstrong County Memorial Hospital,Kittanning,PA,18155944,ARMSTRONG COUNTY MEMORIAL HOSPITAL,INTEGRATED DELIVERY NETWORK (IDN),95,2833,0,0,0,0,0,0,0.0352827479,0,1,119911605,463759916
CHSP00000004,050226,Anaheim Regional Medical Center,1111 West La Palma Avenue,Anaheim,CA,92801,1,,,,,18146292,AHMC HEALTHCARE INC,INTEGRATED DELIVERY NETWORK (IDN),223,6708,0,0,0,0,0,1,0.1046410145,1,5,158212291,958154036
CHSP00000006,292007,Las Vegas Amg Specialty Hospital,4015 Mcleod Drive,Las Vegas,NV,89121,0,,,,,17882581,AMG INTEGRATED HEALTHCARE MANAGEMENT,INTEGRATED DELIVERY NETWORK (IDN),24,132,0,0,0,0,0,0,,0,5,8659055,16020587
```

## chsp-nh-linkage-2023.csv

- rows: 14821
- columns: compendium_nh_id,onekey_id,ccn,nursing_home_name,nursing_home_street,nursing_home_city,nursing_home_state,nursing_home_zip,health_sys_id,health_sys_name,health_sys_city,health_sys_state,corp_parent_id,corp_parent_name,corp_parent_type

```
NHI00000001,17795177,056376,A GRACE SUB ACUTE AND SKILLED CARE,1250 S WINCHESTER BLVD,SAN JOSE,CA,95128,,,,,.,,
NHI00000002,18961723,335023,A HOLLY PATTERSON EXTENDED CARE FACILITY,875 JERUSALEM AVE,UNIONDALE,NY,11553,HSI00000767,Northwell Health,New Hyde Park,NY,17773329,NORTHWELL HEALTH,INTEGRATED DELIVERY NETWORK (IDN)
NHI00000003,17797291,075410,AARON MANOR NURSING AND REHABILITATION CENTER,3 S WIG HILL RD,CHESTER,CT,06412,,,,,18156318,RYDERS HEALTH MANAGEMENT,CORPORATE OWNER
```

## chsp-hhco-linkage-2023.csv

- rows: 12810
- columns: compendium_hh_id,onekey_id,ccn,home_health_care_org_type,home_health_care_org_name,home_health_care_org_street,home_health_care_org_city,home_health_care_org_state,home_health_care_org_zip,health_sys_id,health_sys_name,health_sys_city,health_sys_state,corp_parent_id,corp_parent_name,corp_parent_type

```
HHI00000001,18323591,679422,Home health,1 STOP HEALTHCARE SERVICES,10615 ROCKLEY RD,HOUSTON,TX,77099,,,,,.,,
HHI00000002,18244750,747123,Home health,1ST ACCURATE HOME HEALTH SERVICE,8650 KEMPWOOD DR,HOUSTON,TX,77080,,,,,.,,
HHI00000003,18244233,747129,Home health,1ST AID HOME HEALTH SERVICES,4604 PUTNAM DR,PLANO,TX,75024,,,,,.,,
```
