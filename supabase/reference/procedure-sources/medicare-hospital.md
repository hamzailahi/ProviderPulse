<!-- Written by scripts/procedure-sources-discover.mjs. Read only. -->
# Medicare hospital procedure sources, 2026-10-11 20:53 UTC


## Outpatient hospitals by provider and service

- dataset: Medicare Outpatient Hospitals - by Provider and Service : 2024-01-01
- year: 2024; url: https://data.cms.gov/sites/default/files/2026-06/794975f5-e335-4cbf-8e87-982c834a9639/MUP_OUT_RY26_P04_V10_DY24_Prov_Svc.csv
- size: unknown

Columns:

`Rndrng_Prvdr_CCN`, `Rndrng_Prvdr_Org_Name`, `Rndrng_Prvdr_St`, `Rndrng_Prvdr_City`, `Rndrng_Prvdr_State_Abrvtn`, `Rndrng_Prvdr_State_FIPS`, `Rndrng_Prvdr_Zip5`, `Rndrng_Prvdr_RUCA`, `Rndrng_Prvdr_RUCA_Desc`, `APC_Cd`, `APC_Desc`, `Bene_Cnt`, `CAPC_Srvcs`, `Avg_Tot_Sbmtd_Chrgs`, `Avg_Mdcr_Alowd_Amt`, `Avg_Mdcr_Pymt_Amt`, `Outlier_Srvcs`, `Avg_Mdcr_Outlier_Amt`

Sample rows:

```
010001,Southeast Health Medical Center,1108 Ross Clark Circle,Dothan,AL,01,36301,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",5072,Level 2 Excision/ Biopsy/ Incision and Drainage,175,188,9637.66409574467,1365.37026595745,1080.95037234042,0,0
010001,Southeast Health Medical Center,1108 Ross Clark Circle,Dothan,AL,01,36301,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",5073,Level 3 Excision/ Biopsy/ Incision and Drainage,37,42,18612.7754761904,2337.1619047619,1854.25023809523,0,0
010001,Southeast Health Medical Center,1108 Ross Clark Circle,Dothan,AL,01,36301,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",5091,Level 1 Breast/Lymphatic Surgery and Related Procedures,25,25,26989.9507999999,3264.91,2601.30999999999,0,0
010001,Southeast Health Medical Center,1108 Ross Clark Circle,Dothan,AL,01,36301,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",5092,Level 2 Breast/Lymphatic Surgery and Related Procedures,32,34,42898.8099999999,5585.6,4450.32,0,0
010001,Southeast Health Medical Center,1108 Ross Clark Circle,Dothan,AL,01,36301,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",5112,Level 2 Musculoskeletal Procedures,,,,,,,
```

## Inpatient hospitals by provider and service

- dataset: Medicare Inpatient Hospitals - by Provider and Service : 2024-01-01
- year: 2024; url: https://data.cms.gov/sites/default/files/2026-04/828defb5-c9e6-4442-8c1b-f27bc0799daf/MUP_INP_RY26_P03_V10_DY24_PrvSvc.CSV
- size: unknown

Columns:

`Rndrng_Prvdr_CCN`, `Rndrng_Prvdr_Org_Name`, `Rndrng_Prvdr_City`, `Rndrng_Prvdr_St`, `Rndrng_Prvdr_State_FIPS`, `Rndrng_Prvdr_Zip5`, `Rndrng_Prvdr_State_Abrvtn`, `Rndrng_Prvdr_RUCA`, `Rndrng_Prvdr_RUCA_Desc`, `DRG_Cd`, `DRG_Desc`, `Tot_Dschrgs`, `Avg_Submtd_Cvrd_Chrg`, `Avg_Tot_Pymt_Amt`, `Avg_Mdcr_Pymt_Amt`

Sample rows:

```
010001,Southeast Health Medical Center,Dothan,1108 Ross Clark Circle,01,36301,AL,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",003,"ECMO OR TRACHEOSTOMY WITH MV >96 HOURS OR PRINCIPAL DIAGNOSIS EXCEPT FACE, MOUTH AND NEC",11,738478.63636,103236.27273,91218.181818
010001,Southeast Health Medical Center,Dothan,1108 Ross Clark Circle,01,36301,AL,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",023,CRANIOTOMY WITH MAJOR DEVICE IMPLANT OR ACUTE COMPLEX CNS PRINCIPAL DIAGNOSIS WITH MCC O,23,173562.08696,40220.217391,37634.565217
010001,Southeast Health Medical Center,Dothan,1108 Ross Clark Circle,01,36301,AL,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",024,CRANIOTOMY WITH MAJOR DEVICE IMPLANT OR ACUTE COMPLEX CNS PRINCIPAL DIAGNOSIS WITHOUT MC,13,95613.307692,27305.461538,25644.307692
010001,Southeast Health Medical Center,Dothan,1108 Ross Clark Circle,01,36301,AL,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",025,CRANIOTOMY AND ENDOVASCULAR INTRACRANIAL PROCEDURES WITH MCC,22,182831.40909,31420.954545,23270.863636
010001,Southeast Health Medical Center,Dothan,1108 Ross Clark Circle,01,36301,AL,2,"Metropolitan area high commuting: primary flow 30% or more to a urbanized area of 50,000 and greater",038,EXTRACRANIAL PROCEDURES WITH CC,27,111318.55556,12183.925926,10532.222222
```

## Outpatient hospitals by geography and service

- dataset: Medicare Outpatient Hospitals - by Geography and Service : 2024-01-01
- year: 2024; url: https://data.cms.gov/sites/default/files/2026-06/32491150-3e8f-4feb-95e4-3f66a355951a/MUP_OUT_RY26_P04_V10_DY24_Geo.csv
- size: unknown

Columns:

`Rndrng_Prvdr_Geo_Lvl`, `Rndrng_Prvdr_Geo_Cd`, `Rndrng_Prvdr_Geo_Desc`, `Srvc_Lvl`, `APC_Cd`, `APC_Desc`, `HCPCS_Cd`, `HCPCS_Desc`, `Bene_Cnt`, `CAPC_Srvcs`, `Avg_Tot_Sbmtd_Chrgs`, `Avg_Mdcr_Alowd_Amt`, `Avg_Mdcr_Pymt_Amt`, `Outlier_Srvcs`, `Avg_Mdcr_Outlier_Amt`

Sample rows:

```
National,,National,APC,5072,Level 2 Excision/ Biopsy/ Incision and Drainage,,,309183,326549,11340.0317002655,1538.43981941454,1219.33395208682,1887,5052.62049475358
National,,National,APC,5073,Level 3 Excision/ Biopsy/ Incision and Drainage,,,118307,132541,21074.7698398231,2695.01542730173,2139.97440791905,3532,4442.31692893544
National,,National,APC,5091,Level 1 Breast/Lymphatic Surgery and Related Procedures,,,49481,51576,27836.1389016209,3679.09023945246,2922.43431344036,1163,3713.9825883061
National,,National,APC,5092,Level 2 Breast/Lymphatic Surgery and Related Procedures,,,49415,49643,46717.7568964405,6253.91101041436,4974.8655327035,3457,3387.30472241828
National,,National,APC,5093,Level 3 Breast/Lymphatic Surgery and Related Procedures,,,4639,4771,71543.6997275204,9049.71843009851,7421.04356948228,844,4565.21515189573
```

## Inpatient hospitals by geography and service

- dataset: Medicare Inpatient Hospitals - by Geography and Service : 2024-01-01
- year: 2024; url: https://data.cms.gov/sites/default/files/2026-04/4517a6a1-adeb-4345-9f3d-a95391a470db/MUP_INP_RY26_P03_V10_DY24_Geo.CSV
- size: unknown

Columns:

`Rndrng_Prvdr_Geo_Lvl`, `Rndrng_Prvdr_Geo_Cd`, `Rndrng_Prvdr_Geo_Desc`, `DRG_Cd`, `DRG_Desc`, `Tot_Dschrgs`, `Avg_Submtd_Cvrd_Chrg`, `Avg_Tot_Pymt_Amt`, `Avg_Mdcr_Pymt_Amt`

Sample rows:

```
National,,National,001,HEART TRANSPLANT OR IMPLANT OF HEART ASSIST SYSTEM WITH MCC,2726,1466966.9637,321958.43654,275303.33529
National,,National,002,HEART TRANSPLANT OR IMPLANT OF HEART ASSIST SYSTEM WITHOUT MCC,52,689203.96154,142775.82692,109182.30769
National,,National,003,"ECMO OR TRACHEOSTOMY WITH MV >96 HOURS OR PRINCIPAL DIAGNOSIS EXCEPT FACE, MOUTH AND NEC",9991,1053024.0991,223605.97518,192566.54149
National,,National,004,"TRACHEOSTOMY WITH MV >96 HOURS OR PRINCIPAL DIAGNOSIS EXCEPT FACE, MOUTH AND NECK WITHOU",8390,613612.50751,125490.71907,110951.02324
National,,National,005,LIVER TRANSPLANT WITH MCC OR INTESTINAL TRANSPLANT,1302,822215.94009,152447.25192,115258.15438
```
