# Market concentration (HHI): dry run

Run 2026-11-20 by scripts/hhi-dry-run.mjs. Read only; nothing written to the database.

- Clinicians: CMS Doctors and Clinicians (released 2026-10-30), Medicare-enrolled only, placed in an area by any practice address there.
- Group: the clinician's most frequent Medicare group (org_pac_id) in the area; no group means a solo practice, its own firm.
- System: the AHRQ 2023 Compendium system of the clinician's affiliated hospitals (CMS Facility Affiliation, released 2026-10-30; 2,280,232 rows, 23,756 hospital links for these clinicians); no system falls back to the group.
- HHI is the sum of squared percentage shares of clinicians (0 to 10,000). DOJ/FTC 2023 guidelines: over 1,800 highly concentrated, 1,000 to 1,800 moderate. Specialties with fewer than 20 clinicians are left out.

## Memphis (ZIP3 380, 381)

6,264 clinicians; 3,487 (56%) tied to a health system through a hospital.

| Specialty | Clinicians | HHI by group | HHI by system | Largest systems or groups (share) |
|---|---|---|---|---|
| NURSE PRACTITIONER | 1718 | 130 (unconcentrated) | 630 (unconcentrated) | Baptist Memorial Health Care Corporation 20%; Methodist Le Bonheur Healthcare 11%; West Tennessee Healthcare 6% |
| INTERNAL MEDICINE | 409 | 844 (unconcentrated) | 2597 (high) | Baptist Memorial Health Care Corporation 46%; Methodist Le Bonheur Healthcare 20%; Regional One Health 4% |
| PHYSICAL THERAPIST IN PRIVATE PRACTICE | 389 | 1540 (moderate) | 1540 (moderate) | AGILITAS USA, INC 33%; MSK GROUP PC 14%; CAMPBELL CLINIC, PC 10% |
| CERTIFIED REGISTERED NURSE ANESTHETIST (CRNA) | 376 | 1199 (moderate) | 1312 (moderate) | Baptist Memorial Health Care Corporation 27%; Methodist Le Bonheur Healthcare 19%; Regional One Health 9% |
| PHYSICIAN ASSISTANT | 287 | 344 (unconcentrated) | 682 (unconcentrated) | Baptist Memorial Health Care Corporation 20%; Methodist Le Bonheur Healthcare 12%; Regional One Health 5% |
| FAMILY PRACTICE | 271 | 390 (unconcentrated) | 2094 (high) | Baptist Memorial Health Care Corporation 44%; Methodist Le Bonheur Healthcare 9%; West Tennessee Healthcare 7% |
| DIAGNOSTIC RADIOLOGY | 214 | 1100 (moderate) | 1425 (moderate) | Baptist Memorial Health Care Corporation 31%; Methodist Le Bonheur Healthcare 18%; West Tennessee Healthcare 8% |
| EMERGENCY MEDICINE | 185 | 1865 (high) | 1448 (moderate) | Baptist Memorial Health Care Corporation 30%; Methodist Le Bonheur Healthcare 21%; Tenet Healthcare 6% |
| OPTOMETRY | 178 | 1200 (moderate) | 1200 (moderate) | SOUTHERN COLLEGE OF OPTOMETRY 31%; MYEYEDR OPTOMETRY OF TENNESSEE LLC 11%; VRF EYE SPECIALTY GROUP, PLC 4% |
| ANESTHESIOLOGY | 153 | 1632 (moderate) | 1331 (moderate) | Baptist Memorial Health Care Corporation 29%; Methodist Le Bonheur Healthcare 15%; Regional One Health 12% |
| OBSTETRICS/GYNECOLOGY | 120 | 1272 (moderate) | 3283 (high) | Baptist Memorial Health Care Corporation 55%; Regional One Health 13%; Methodist Le Bonheur Healthcare 5% |
| CLINICAL SOCIAL WORKER | 117 | 348 (unconcentrated) | 348 (unconcentrated) | STEP UP CARE OF TENNESSEE LLC 14%; ALLIANCE HEALTHCARE SERVICES 4%; PATHWAYS OF TENNESSEE INC 4% |
| ORTHOPEDIC SURGERY | 108 | 2515 (high) | 2263 (high) | Baptist Memorial Health Care Corporation 44%; Methodist Le Bonheur Healthcare 13%; Tenet Healthcare 9% |
| NEUROLOGY | 96 | 948 (unconcentrated) | 2253 (high) | Baptist Memorial Health Care Corporation 44%; Methodist Le Bonheur Healthcare 15%; Atlantic Health System 7% |
| GENERAL SURGERY | 96 | 1706 (moderate) | 1942 (high) | Baptist Memorial Health Care Corporation 30%; Methodist Le Bonheur Healthcare 26%; Regional One Health 17% |
| MENTAL HEALTH COUNSELOR | 91 | 322 (unconcentrated) | 325 (unconcentrated) | STEP UP CARE OF TENNESSEE LLC 11%; ALLIANCE HEALTHCARE SERVICES 5%; FAMILY CARE CENTER LLC 4% |
| PEDIATRIC MEDICINE | 79 | 4901 (high) | 3527 (high) | UT LEBONHEUR PEDIATRIC SPECIALISTS, INC. 58%; Methodist Le Bonheur Healthcare 9%; UT MEDICAL GROUP INC 4% |
| CARDIOVASCULAR DISEASE (CARDIOLOGY) | 76 | 1350 (moderate) | 2593 (high) | Baptist Memorial Health Care Corporation 42%; Methodist Le Bonheur Healthcare 25%; West Tennessee Healthcare 11% |
| HOSPITALIST | 71 | 3537 (high) | 3184 (high) | Methodist Le Bonheur Healthcare 54%; Baptist Memorial Health Care Corporation 14%; Regional One Health 7% |
| PATHOLOGY | 70 | 1967 (high) | 1473 (moderate) | Baptist Memorial Health Care Corporation 26%; Methodist Le Bonheur Healthcare 21%; Regional One Health 14% |
| PSYCHIATRY | 70 | 1041 (moderate) | 473 (unconcentrated) | Baptist Memorial Health Care Corporation 14%; BAPTIST MEMORIAL MEDICAL GROUP, INC. 9%; UT MEDICAL GROUP INC 6% |
| CLINICAL PSYCHOLOGIST | 69 | 368 (unconcentrated) | 372 (unconcentrated) | BROWNSVILLE MEDICAL CLINIC, P.A. 10%; BH SERVICES SOUTHEAST 1 PC 7%; CHRIST COMMUNITY HEALTH SERVICES INC. 6% |
| CHIROPRACTIC | 63 | 285 (unconcentrated) | 285 (unconcentrated) | THE CHIRO PLACE OF COLLIERVILLE PLLC 8%; COLE CHIROPRACTIC CENTER OF BARTLETT 8%; LAUNCH CHIROPRACTIC LLC 3% |
| OPHTHALMOLOGY | 62 | 1015 (moderate) | 786 (unconcentrated) | Baptist Memorial Health Care Corporation 16%; Methodist Le Bonheur Healthcare 13%; CHARLES RETINA INSTITUTE PC 10% |
| OCCUPATIONAL THERAPIST IN PRIVATE PRACTICE | 62 | 2810 (high) | 2810 (high) | AEGIS GROUP PRACTICE LLC 45%; MSK GROUP PC 26%; STATE OF TENNESSEE 6% |
| GASTROENTEROLOGY | 55 | 2635 (high) | 2562 (high) | Baptist Memorial Health Care Corporation 47%; Methodist Le Bonheur Healthcare 15%; BJC Healthcare 5% |
| HEMATOLOGY/ONCOLOGY | 48 | 2396 (high) | 3759 (high) | Baptist Memorial Health Care Corporation 58%; Methodist Le Bonheur Healthcare 13%; Regional One Health 13% |
| NEPHROLOGY | 47 | 991 (unconcentrated) | 3155 (high) | Baptist Memorial Health Care Corporation 51%; Methodist Le Bonheur Healthcare 21%; UT LEBONHEUR PEDIATRIC SPECIALISTS, INC. 6% |
| PULMONARY DISEASE | 42 | 2959 (high) | 3560 (high) | Baptist Memorial Health Care Corporation 55%; Methodist Le Bonheur Healthcare 21%; Regional One Health 7% |
| INTERVENTIONAL CARDIOLOGY | 41 | 4123 (high) | 3135 (high) | Baptist Memorial Health Care Corporation 41%; Methodist Le Bonheur Healthcare 37%; Cookeville Regional Health System 5% |
| INFECTIOUS DISEASE | 36 | 1343 (moderate) | 1543 (moderate) | Baptist Memorial Health Care Corporation 31%; Methodist Le Bonheur Healthcare 19%; Regional One Health 8% |
| DERMATOLOGY | 33 | 964 (unconcentrated) | 872 (unconcentrated) | LEVY DERMATOLOGY, PC 15%; Regional One Health 15%; MEMPHIS DERMATOLOGY CLINIC PA 12% |
| PODIATRY | 31 | 656 (unconcentrated) | 676 (unconcentrated) | Tenet Healthcare 16%; Baptist Memorial Health Care Corporation 10%; UT MEDICAL GROUP INC 10% |
| QUALIFIED SPEECH LANGUAGE PATHOLOGIST | 30 | 2622 (high) | 2622 (high) | AEGIS GROUP PRACTICE LLC 43%; THE UNIVERSITY OF MEMPHIS 23%; HEALTHPRO HERITAGE REHAB AND FITNESS LLC 10% |
| UROLOGY | 30 | 2422 (high) | 3889 (high) | Baptist Memorial Health Care Corporation 57%; Methodist Le Bonheur Healthcare 23%; Tenet Healthcare 10% |
| OTOLARYNGOLOGY | 29 | 1486 (moderate) | 5077 (high) | Baptist Memorial Health Care Corporation 66%; Methodist Le Bonheur Healthcare 28% |
| NEUROSURGERY | 29 | 5886 (high) | 6409 (high) | Baptist Memorial Health Care Corporation 79%; SEMMES-MURPHEY CLINIC PC 7%; Tenet Healthcare 7% |
| QUALIFIED AUDIOLOGIST | 28 | 1837 (high) | 1837 (high) | MID-SOUTH EAR NOSE AND THROAT PC 32%; THE UNIVERSITY OF MEMPHIS 21%; Methodist Le Bonheur Healthcare 11% |
| ENDOCRINOLOGY | 26 | 2249 (high) | 2840 (high) | Baptist Memorial Health Care Corporation 46%; Methodist Le Bonheur Healthcare 23%; Regional One Health 8% |
| PHYSICAL MEDICINE AND REHABILITATION | 26 | 858 (unconcentrated) | 3136 (high) | Baptist Memorial Health Care Corporation 54%; Regional One Health 8%; EMG CLINICS OF TENNESSEE, PLLC 8% |
| INTERVENTIONAL RADIOLOGY | 22 | 1033 (moderate) | 1033 (moderate) | Baptist Memorial Health Care Corporation 23%; Methodist Le Bonheur Healthcare 14%; UT LEBONHEUR PEDIATRIC SPECIALISTS, INC. 9% |

## Fort Worth (ZIP3 760, 761)

12,511 clinicians; 6,760 (54%) tied to a health system through a hospital.

| Specialty | Clinicians | HHI by group | HHI by system | Largest systems or groups (share) |
|---|---|---|---|---|
| NURSE PRACTITIONER | 2185 | 177 (unconcentrated) | 248 (unconcentrated) | Texas Health Resources 9%; JPS Health Network 7%; Baylor Scott and White Health 6% |
| PHYSICIAN ASSISTANT | 1100 | 357 (unconcentrated) | 487 (unconcentrated) | Texas Health Resources 13%; Baylor Scott and White Health 11%; HCA Healthcare 9% |
| INTERNAL MEDICINE | 900 | 580 (unconcentrated) | 1172 (moderate) | Texas Health Resources 23%; HCA Healthcare 17%; Baylor Scott and White Health 16% |
| PHYSICAL THERAPIST IN PRIVATE PRACTICE | 893 | 1166 (moderate) | 1166 (moderate) | TEXAS LUNA CARE PHYSICAL THERAPY LLC 32%; IDEAL PHYSICAL THERAPY OF TEXAS LLC 6%; SPORTHERAPY LLC 5% |
| CERTIFIED REGISTERED NURSE ANESTHETIST (CRNA) | 781 | 1148 (moderate) | 928 (unconcentrated) | Baylor Scott and White Health 21%; Texas Health Resources 15%; HCA Healthcare 12% |
| FAMILY PRACTICE | 769 | 474 (unconcentrated) | 772 (unconcentrated) | HCA Healthcare 16%; Texas Health Resources 13%; Baylor Scott and White Health 12% |
| DIAGNOSTIC RADIOLOGY | 560 | 1993 (high) | 774 (unconcentrated) | Texas Health Resources 19%; HCA Healthcare 11%; Baylor Scott and White Health 9% |
| EMERGENCY MEDICINE | 439 | 1480 (moderate) | 1250 (moderate) | Texas Health Resources 27%; Methodist Health System 14%; Baylor Scott and White Health 13% |
| ANESTHESIOLOGY | 405 | 1308 (moderate) | 879 (unconcentrated) | Baylor Scott and White Health 20%; Texas Health Resources 14%; HCA Healthcare 12% |
| OPTOMETRY | 315 | 403 (unconcentrated) | 403 (unconcentrated) | MED SOUTHWEST PLLC 14%; AEG TEXAS PROFESSIONAL PLLC 10%; JEFFREY L. MORER, OD, PA 4% |
| OBSTETRICS/GYNECOLOGY | 274 | 663 (unconcentrated) | 726 (unconcentrated) | HCA Healthcare 17%; Texas Health Resources 12%; Baylor Scott and White Health 9% |
| MENTAL HEALTH COUNSELOR | 236 | 138 (unconcentrated) | 138 (unconcentrated) | TEXAS HEALTH VIRTUAL CARE 6%; MY HEALTH MY RESOURCES OF TARRANT COUNTY 3%; GEODE HEALTH OF TEXAS, PLLC 3% |
| CHIROPRACTIC | 222 | 113 (unconcentrated) | 113 (unconcentrated) | CURIS FUNCTIONAL HEALTH 7%; OPTIMAL ALIGNMENT CORP 2%; WHITE INTEGRATED HEALTH CLINICS, PLLC 2% |
| ORTHOPEDIC SURGERY | 206 | 834 (unconcentrated) | 1354 (moderate) | Texas Health Resources 24%; Tenet Healthcare 17%; HCA Healthcare 13% |
| CLINICAL SOCIAL WORKER | 188 | 187 (unconcentrated) | 187 (unconcentrated) | TEXAS HEALTH VIRTUAL CARE 9%; HEALTHDRIVE MEDICAL SERVICES OF TEXAS LLC 4%; SENIOR PSYCHOLOGICAL CARE DALLAS I LLC 4% |
| GENERAL SURGERY | 183 | 692 (unconcentrated) | 1398 (moderate) | Texas Health Resources 22%; Baylor Scott and White Health 20%; HCA Healthcare 20% |
| NEUROLOGY | 165 | 1315 (moderate) | 1021 (moderate) | Baylor Scott and White Health 20%; Texas Health Resources 19%; HCA Healthcare 10% |
| PEDIATRIC MEDICINE | 164 | 5197 (high) | 3047 (high) | COOK CHILDRENS PHYSICIAN NETWORK 51%; Cook Childrens Health Care System 20%; JPS Health Network 1% |
| PSYCHIATRY | 145 | 657 (unconcentrated) | 440 (unconcentrated) | JPS Health Network 15%; Baylor Scott and White Health 7%; MY HEALTH MY RESOURCES OF TARRANT COUNTY 6% |
| CARDIOVASCULAR DISEASE (CARDIOLOGY) | 138 | 1255 (moderate) | 2214 (high) | Baylor Scott and White Health 39%; Texas Health Resources 20%; Parkland Health and Hospital System 14% |
| GASTROENTEROLOGY | 129 | 2570 (high) | 1682 (moderate) | Texas Health Resources 30%; Baylor Scott and White Health 23%; HCA Healthcare 11% |
| PODIATRY | 128 | 496 (unconcentrated) | 774 (unconcentrated) | HEALTHDRIVE PODIATRY GROUP PA 17%; Texas Health Resources 13%; Baylor Scott and White Health 9% |
| OPHTHALMOLOGY | 119 | 568 (unconcentrated) | 423 (unconcentrated) | Parkland Health and Hospital System 12%; OPHTHALMIC PARTNERS , PA 8%; Tenet Healthcare 5% |
| NEPHROLOGY | 104 | 1158 (moderate) | 2040 (high) | Texas Health Resources 36%; Baylor Scott and White Health 21%; HCA Healthcare 15% |
| CLINICAL PSYCHOLOGIST | 96 | 204 (unconcentrated) | 178 (unconcentrated) | JPS Health Network 4%; MY HEALTH MY RESOURCES OF TARRANT COUNTY 4%; VITALITY CLINICAL SERVICES PLLC 3% |
| UROLOGY | 95 | 2177 (high) | 1639 (moderate) | HCA Healthcare 32%; Texas Health Resources 17%; Baylor Scott and White Health 14% |
| PATHOLOGY | 93 | 1143 (moderate) | 1183 (moderate) | Texas Health Resources 19%; TEXAS DIGESTIVE DISEASE CONSULTANTS, PLLC 16%; HCA Healthcare 15% |
| OCCUPATIONAL THERAPIST IN PRIVATE PRACTICE | 89 | 1036 (moderate) | 1036 (moderate) | FOX REHABILITATION SERVICES TX LLC 27%; ENDEAVOR REHAB CENTER INC 9%; HEALTHPRO HERITAGE REHAB AND FITNESS LLC 8% |
| DERMATOLOGY | 86 | 411 (unconcentrated) | 373 (unconcentrated) | EPIPHANY DERMATOLOGY PA 10%; OLIVER STREET 5.01(A) INC 9%; DERMATOLOGY SPECIALISTS OF FORT WORTH PLLC 5% |
| INTERVENTIONAL CARDIOLOGY | 70 | 1437 (moderate) | 2649 (high) | Texas Health Resources 36%; Baylor Scott and White Health 33%; HCA Healthcare 14% |
| PULMONARY DISEASE | 69 | 1262 (moderate) | 1897 (high) | Texas Health Resources 33%; Baylor Scott and White Health 25%; HCA Healthcare 9% |
| PHYSICAL MEDICINE AND REHABILITATION | 69 | 338 (unconcentrated) | 561 (unconcentrated) | HCA Healthcare 13%; Texas Health Resources 9%; Baylor Scott and White Health 9% |
| INFECTIOUS DISEASE | 66 | 904 (unconcentrated) | 1396 (moderate) | Texas Health Resources 23%; Baylor Scott and White Health 20%; HCA Healthcare 18% |
| QUALIFIED AUDIOLOGIST | 63 | 935 (unconcentrated) | 920 (unconcentrated) | TEXAS HEALTH CARE PLLC 25%; CITYVIEW AUDIOLOGY AND HEARING AIDS, INC. 6%; HEARD IT THROUGH THE GRAPEVINE AUDIOLOGY, PC 5% |
| OTOLARYNGOLOGY | 62 | 1519 (moderate) | 1379 (moderate) | Baylor Scott and White Health 29%; Texas Health Resources 13%; Methodist Health System 11% |
| HEMATOLOGY/ONCOLOGY | 60 | 3500 (high) | 1750 (moderate) | Baylor Scott and White Health 27%; Texas Health Resources 25%; HCA Healthcare 15% |
| QUALIFIED SPEECH LANGUAGE PATHOLOGIST | 55 | 413 (unconcentrated) | 413 (unconcentrated) | DICKS BIGHEART LLC 7%; TEXAS HEALTH CARE PLLC 7%; SYNERGY CARE SOUTHEAST LLC 7% |
| HOSPITALIST | 46 | 1975 (high) | 983 (unconcentrated) | Texas Health Resources 20%; JPS Health Network 15%; HCA Healthcare 11% |
| NEUROSURGERY | 46 | 1172 (moderate) | 1749 (moderate) | Texas Health Resources 30%; Baylor Scott and White Health 17%; HCA Healthcare 13% |
| INTERVENTIONAL RADIOLOGY | 46 | 3459 (high) | 1248 (moderate) | Texas Health Resources 26%; Baylor Scott and White Health 13%; Methodist Health System 11% |
| PLASTIC AND RECONSTRUCTIVE SURGERY | 46 | 539 (unconcentrated) | 1021 (moderate) | Texas Health Resources 17%; HCA Healthcare 17%; Baylor Scott and White Health 15% |
| ENDOCRINOLOGY | 44 | 795 (unconcentrated) | 1498 (moderate) | Baylor Scott and White Health 25%; Texas Health Resources 23%; HCA Healthcare 11% |
| RHEUMATOLOGY | 43 | 1866 (high) | 957 (unconcentrated) | RHEUMATOLOGY ASSOCIATES AND SUBSIDIARY 21%; HCA Healthcare 16%; Baylor Scott and White Health 9% |
| VASCULAR SURGERY | 41 | 1124 (moderate) | 1755 (moderate) | Baylor Scott and White Health 29%; Texas Health Resources 24%; HCA Healthcare 12% |
| REGISTERED DIETITIAN OR NUTRITION PROFESSIONAL | 37 | 504 (unconcentrated) | 504 (unconcentrated) | PRACTICAL NUTRITION LLC 11%; DALLAS NEPHROLOGY ASSOCIATES 11%; HEALTHTEXAS PROVIDER NETWORK 8% |
| CRITICAL CARE (INTENSIVISTS) | 34 | 1782 (moderate) | 1176 (moderate) | Baylor Scott and White Health 21%; HCA Healthcare 18%; Texas Health Resources 12% |
| CARDIAC ELECTROPHYSIOLOGY | 31 | 1634 (moderate) | 3840 (high) | Baylor Scott and White Health 58%; Texas Health Resources 16%; HCA Healthcare 13% |
| MEDICAL ONCOLOGY | 29 | 4839 (high) | 2271 (high) | Texas Health Resources 31%; HCA Healthcare 24%; Baylor Scott and White Health 24% |
| PAIN MANAGEMENT | 27 | 590 (unconcentrated) | 892 (unconcentrated) | Baylor Scott and White Health 15%; AdventHealth 15%; Texas Health Resources 11% |
| COLORECTAL SURGERY (PROCTOLOGY) | 25 | 2224 (high) | 2384 (high) | Baylor Scott and White Health 32%; Texas Health Resources 28%; HCA Healthcare 20% |
| RADIATION ONCOLOGY | 22 | 4421 (high) | 1818 (high) | Texas Health Resources 32%; TEXAS ONCOLOGY PA 23%; Baylor Scott and White Health 9% |
| THORACIC SURGERY | 21 | 1202 (moderate) | 930 (unconcentrated) | Texas Health Resources 14%; Baylor Scott and White Health 14%; AdventHealth 10% |
| INTERVENTIONAL PAIN MANAGEMENT | 21 | 748 (unconcentrated) | 1293 (moderate) | Tenet Healthcare 29%; AdventHealth 14%; MEDICAL SPECIALTY GROUP PLLC 5% |

