# Fax via organization: dry run

Run 2026-11-16 by scripts/fax-via-org.sh. Read only; nothing written to the database.

Rule (the user's, 2026-11-16): a clinician with no fax of their own gets an organization's fax only when Medicare's reassignment list says they bill through that organization **and** their own NPPES practice address is the organization's address (same ZIP, house number and street; suite ignored). Shown labelled with the organization's name.

- Clinicians with no fax: 5,055,523
- ... reassigned in Medicare to a group that is one of our organizations with a fax: 720,479
- ... at that organization's own address: 179,070
- ... skipped, several such organizations with different faxes: 28,954
- **Would get a fax via their organization: 150,116**

Sources: https://data.cms.gov/sites/default/files/2026-09/b840a66b-6781-4630-9238-d056ecd633ce/PPEF_Enrollment_Extract_2026.09.29.csv (3,030,022 rows), https://data.cms.gov/sites/default/files/2026-11/5c295827-b56c-428f-81d6-0c673e3cc866/revalidation_group_reassignment_pa_xref.csv (3,672,532 rows).

## Organizations supplying the most

| Organization | Clinicians |
|---|---|
| MAYO CLINIC | 5,502 |
| STANFORD HEALTH CARE | 2,687 |
| MASSACHUSETTS GENERAL PHYSICIANS ORGANIZATION INC | 2,087 |
| MAYO CLINIC JACKSONVILLE | 1,491 |
| THE UNIVERSITY OF CHICAGO MEDICAL CENTER | 1,427 |
| UNIVERSITY PHYSICIANS INCORPORATED | 1,298 |
| FLORIDA CLINICAL PRACTICE ASSOCIATION INC | 1,030 |
| REGENTS OF THE UNIVERSITY OF CALIFORNIA | 886 |
| UNIVERSITY OF TEXAS SOUTHWESTERN MEDICAL CENTER AT DALLAS | 788 |
| UNIVERSITY OF PITTSBURGH PHYSICIANS | 757 |
| UNIVERSITY OF VERMONT MEDICAL CENTER INC | 597 |
| TRUSTEES OF COLUMBIA UNIVERSITY IN THE CITY OF NEW YORK | 581 |
| USC CARE MEDICAL GROUP, INC | 580 |
| MCHS HOSPITALS INC | 549 |
| ALLINA HEALTH SYSTEM | 538 |
| GUNDERSEN CLINIC LTD | 512 |
| THE BOARD OF TRUSTEES OF THE UNIVERSITY OF ILLINOIS | 506 |
| MAINEHEALTH | 498 |
| THE DULUTH CLINIC, LTD. | 484 |
| CHILDREN'S HOSPITAL MEDICAL CENTER | 481 |
