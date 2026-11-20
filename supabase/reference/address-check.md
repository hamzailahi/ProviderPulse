# Clinician address check (dry run)

Run 2026-11-20 by scripts/address-check.mjs. Read only; nothing in the directory changed.

Our clinician listings (NPPES NPI-1) compared with CMS Doctors and Clinicians (Medicare enrollment), release 2026-10-30. Only Medicare-enrolled clinicians can be checked; absence from the CMS file never means inactive.

| Result | Clinicians | Share of all | Share of those in Medicare |
|---|---|---|---|
| confirmed zip | 973,245 | 12.9% | 59.3% |
| same state other zip | 527,868 | 7.0% | 32.2% |
| other state only | 119,952 | 1.6% | 7.3% |
| other state but nppes lists it | 18,918 | 0.3% | 1.2% |
| not in medicare file | 5,914,377 | 78.3% |  |

"other state only": every Medicare enrollment address is in a state our listing does not show, and NPPES lists no secondary site there. These are the likeliest moves.

## By listed state (other state only, share of those in Medicare)

| State | In Medicare | Other state only | Share |
|---|---|---|---|
| NY | 114,449 | 9,563 | 8.4% |
| PA | 75,490 | 6,976 | 9.2% |
| FL | 107,015 | 6,712 | 6.3% |
| CA | 146,315 | 6,581 | 4.5% |
| TX | 109,281 | 6,397 | 5.9% |
| IL | 65,048 | 5,208 | 8.0% |
| OH | 63,895 | 4,333 | 6.8% |
| MA | 50,957 | 3,862 | 7.6% |
| MI | 57,110 | 3,855 | 6.8% |
| VA | 40,669 | 3,734 | 9.2% |
| NJ | 48,139 | 3,681 | 7.6% |
| NC | 54,951 | 3,647 | 6.6% |
| MD | 33,212 | 3,388 | 10.2% |
| GA | 43,981 | 3,351 | 7.6% |
| MO | 31,130 | 2,839 | 9.1% |
| WA | 37,684 | 2,803 | 7.4% |
| TN | 35,273 | 2,790 | 7.9% |
| CO | 32,214 | 2,553 | 7.9% |
| AZ | 32,638 | 2,519 | 7.7% |
| MN | 39,327 | 2,259 | 5.7% |
| CT | 24,392 | 2,137 | 8.8% |
| SC | 24,534 | 2,070 | 8.4% |
| IN | 32,027 | 1,976 | 6.2% |
| WI | 33,863 | 1,919 | 5.7% |
| KY | 23,618 | 1,759 | 7.4% |
| OR | 22,429 | 1,693 | 7.5% |
| DC | 5,473 | 1,649 | 30.1% |
| LA | 21,245 | 1,484 | 7.0% |
| AL | 20,875 | 1,399 | 6.7% |
| NV | 12,081 | 1,185 | 9.8% |
| IA | 16,213 | 1,171 | 7.2% |
| KS | 15,009 | 1,169 | 7.8% |
| OK | 16,902 | 1,057 | 6.3% |
| UT | 14,265 | 1,041 | 7.3% |
| NM | 9,365 | 972 | 10.4% |
| MS | 12,085 | 932 | 7.7% |
| NH | 9,048 | 922 | 10.2% |
| RI | 7,602 | 920 | 12.1% |
| WV | 9,355 | 788 | 8.4% |
| AR | 13,337 | 770 | 5.8% |
| NE | 11,234 | 720 | 6.4% |
| DE | 5,975 | 701 | 11.7% |
| ME | 9,709 | 681 | 7.0% |
| ID | 9,125 | 584 | 6.4% |
| HI | 5,827 | 495 | 8.5% |
| ND | 5,298 | 486 | 9.2% |
| MT | 6,494 | 385 | 5.9% |
| SD | 5,593 | 372 | 6.7% |
| WY | 2,883 | 308 | 10.7% |
| VT | 4,106 | 298 | 7.3% |
| AK | 3,975 | 290 | 7.3% |
| PR | 6,482 | 253 | 3.9% |
| AE | 127 | 107 | 84.3% |
| AP | 94 | 81 | 86.2% |
| GU | 217 | 29 | 13.4% |
| AA | 27 | 21 | 77.8% |
| VI | 189 | 20 | 10.6% |
| PU | 18 | 8 | 44.4% |
| MP | 45 | 6 | 13.3% |
| JA | 5 | 5 | 100.0% |
| IS | 4 | 4 | 100.0% |
| WE | 3 | 3 | 100.0% |
| RH | 3 | 2 | 66.7% |
| YA | 2 | 2 | 100.0% |
| BA | 2 | 2 | 100.0% |
| NA | 2 | 2 | 100.0% |
| FR | 2 | 2 | 100.0% |
| NO | 2 | 1 | 50.0% |
| RE | 1 | 1 | 100.0% |
| AB | 3 | 1 | 33.3% |
| BE | 2 | 1 | 50.0% |
| TO | 1 | 1 | 100.0% |
| KA | 1 | 1 | 100.0% |
| HA | 1 | 1 | 100.0% |
| US | 4 | 1 | 25.0% |
| AV | 1 | 1 | 100.0% |
| ST | 2 | 1 | 50.0% |
| N/ | 1 | 1 | 100.0% |
| RA | 1 | 1 | 100.0% |
| VE | 1 | 1 | 100.0% |
| GR | 1 | 1 | 100.0% |
| PN | 1 | 1 | 100.0% |
| PY | 1 | 1 | 100.0% |
| CL | 1 | 1 | 100.0% |
| PI | 1 | 1 | 100.0% |
| LU | 1 | 1 | 100.0% |
| KU | 1 | 1 | 100.0% |
| UP | 1 | 1 | 100.0% |
| P. | 0 | 0 | n/a |
| SE | 0 | 0 | n/a |
| GE | 0 | 0 | n/a |
| SI | 0 | 0 | n/a |
| SA | 2 | 0 | 0.0% |
| CH | 0 | 0 | n/a |
| SH | 0 | 0 | n/a |
| AS | 5 | 0 | 0.0% |
| HE | 0 | 0 | n/a |
| CE | 0 | 0 | n/a |
| DA | 0 | 0 | n/a |
| GY | 0 | 0 | n/a |
| B. | 0 | 0 | n/a |
| SO | 0 | 0 | n/a |
| JE | 0 | 0 | n/a |
| AT | 0 | 0 | n/a |
| TA | 0 | 0 | n/a |
| CU | 0 | 0 | n/a |
| PE | 0 | 0 | n/a |
| 20 | 0 | 0 | n/a |
| BO | 0 | 0 | n/a |
| ZZ | 0 | 0 | n/a |
| HO | 0 | 0 | n/a |
| EL | 0 | 0 | n/a |
| 32 | 0 | 0 | n/a |
| AM | 4 | 0 | 0.0% |
| IC | 0 | 0 | n/a |
| PO | 0 | 0 | n/a |
| KR | 0 | 0 | n/a |
| OL | 0 | 0 | n/a |
| TE | 2 | 0 | 0.0% |
| DU | 0 | 0 | n/a |
| DO | 0 | 0 | n/a |
| AN | 0 | 0 | n/a |
| CI | 0 | 0 | n/a |
| OC | 0 | 0 | n/a |
| BS | 0 | 0 | n/a |
| ZU | 0 | 0 | n/a |
| NS | 0 | 0 | n/a |
| ES | 0 | 0 | n/a |
| FM | 1 | 0 | 0.0% |
| 29 | 0 | 0 | n/a |
| NU | 0 | 0 | n/a |
| RL | 0 | 0 | n/a |
| LI | 0 | 0 | n/a |
| PH | 0 | 0 | n/a |
| UA | 0 | 0 | n/a |
| DR | 0 | 0 | n/a |
| JO | 0 | 0 | n/a |
| RO | 0 | 0 | n/a |
| ZO | 0 | 0 | n/a |
| SP | 0 | 0 | n/a |
| -- | 0 | 0 | n/a |
| AU | 0 | 0 | n/a |
| IT | 0 | 0 | n/a |
| RP | 0 | 0 | n/a |
| LO | 0 | 0 | n/a |
| DI | 0 | 0 | n/a |
| NI | 0 | 0 | n/a |
| BU | 0 | 0 | n/a |
| KE | 0 | 0 | n/a |
| KW | 0 | 0 | n/a |
| BI | 0 | 0 | n/a |
| TH | 0 | 0 | n/a |
| KI | 0 | 0 | n/a |
| WC | 0 | 0 | n/a |
| LS | 0 | 0 | n/a |
| UN | 0 | 0 | n/a |
| TU | 1 | 0 | 0.0% |
| IO | 1 | 0 | 0.0% |
| RM | 0 | 0 | n/a |
| FO | 1 | 0 | 0.0% |
| FE | 0 | 0 | n/a |
| FU | 0 | 0 | n/a |
| HY | 0 | 0 | n/a |
| OA | 0 | 0 | n/a |
| TI | 0 | 0 | n/a |
| MX | 0 | 0 | n/a |
| EO | 0 | 0 | n/a |
| IW | 0 | 0 | n/a |
| SU | 0 | 0 | n/a |
| EA | 0 | 0 | n/a |
| FP | 0 | 0 | n/a |
| YO | 0 | 0 | n/a |
| OS | 0 | 0 | n/a |
| KO | 0 | 0 | n/a |
| EG | 0 | 0 | n/a |
| CR | 0 | 0 | n/a |
| UK | 0 | 0 | n/a |
| U. | 0 | 0 | n/a |
| CN | 0 | 0 | n/a |
| JP | 0 | 0 | n/a |
| AF | 0 | 0 | n/a |
| LB | 0 | 0 | n/a |
| BC | 0 | 0 | n/a |
| NR | 0 | 0 | n/a |
| ER | 0 | 0 | n/a |
| EU | 0 | 0 | n/a |
| A. | 0 | 0 | n/a |
| SW | 0 | 0 | n/a |
| QU | 0 | 0 | n/a |
| GT | 0 | 0 | n/a |
| AH | 0 | 0 | n/a |
| 70 | 0 | 0 | n/a |
| ZA | 0 | 0 | n/a |
| ON | 0 | 0 | n/a |
| RS | 0 | 0 | n/a |
| D. | 0 | 0 | n/a |
| S | 0 | 0 | n/a |
| BW | 0 | 0 | n/a |
| XI | 0 | 0 | n/a |
| RJ | 0 | 0 | n/a |
| DH | 0 | 0 | n/a |
| EH | 0 | 0 | n/a |
| VO | 0 | 0 | n/a |
| GI | 0 | 0 | n/a |
| (M | 0 | 0 | n/a |
| KH | 0 | 0 | n/a |
| VR | 0 | 0 | n/a |
| GO | 0 | 0 | n/a |
| IR | 0 | 0 | n/a |
| IB | 0 | 0 | n/a |
| PL | 0 | 0 | n/a |
| BR | 0 | 0 | n/a |
| AO | 0 | 0 | n/a |
| SG | 0 | 0 | n/a |
| OM | 0 | 0 | n/a |
| NP | 0 | 0 | n/a |
| UR | 0 | 0 | n/a |
| OT | 0 | 0 | n/a |
| 11 | 0 | 0 | n/a |
| JU | 0 | 0 | n/a |
| TR | 0 | 0 | n/a |
| OU | 0 | 0 | n/a |
| SL | 0 | 0 | n/a |
| IM | 0 | 0 | n/a |
| 10 | 0 | 0 | n/a |
| 6T | 0 | 0 | n/a |
| QA | 0 | 0 | n/a |
| HU | 0 | 0 | n/a |
| JJ | 0 | 0 | n/a |
| RN | 0 | 0 | n/a |
| KL | 0 | 0 | n/a |
| 1  | 0 | 0 | n/a |
| MH | 0 | 0 | n/a |

## By specialty

| Specialty | In Medicare | Confirmed ZIP | Other ZIP same state | Other state only |
|---|---|---|---|---|
| Primary care / family doctor | 421,395 | 60.6% | 33.1% | 5.5% |
| Mental health & counseling | 219,373 | 51.4% | 41.2% | 6.7% |
| Hospital-based clinicians | 157,612 | 54.1% | 33.8% | 10.1% |
| Physician assistant | 137,592 | 60.1% | 32.7% | 6.1% |
| Physical & occupational therapy | 122,175 | 53.5% | 37.2% | 8.5% |
| Eye care | 55,349 | 69.0% | 25.4% | 5.1% |
| Imaging & lab | 51,161 | 56.3% | 29.3% | 11.6% |
| Women's health / OB-GYN | 45,522 | 62.2% | 29.9% | 6.4% |
| Urgent care & emergency | 44,779 | 39.2% | 39.6% | 18.8% |
| Chiropractic | 39,917 | 78.3% | 17.7% | 3.9% |
| Heart / cardiology | 34,089 | 72.4% | 20.3% | 5.7% |
| Orthopedics & sports injury | 29,318 | 71.5% | 21.5% | 5.7% |
| General surgery | 25,440 | 67.1% | 21.8% | 9.1% |
| Brain & nerves / neurology | 25,056 | 68.6% | 22.0% | 7.3% |
| Cancer care / oncology | 22,488 | 71.2% | 21.1% | 6.2% |
| Digestive / gastroenterology | 17,960 | 71.3% | 22.0% | 5.2% |
| Pediatrics (children) | 17,321 | 60.5% | 27.9% | 10.0% |
| Foot & ankle / podiatry | 16,049 | 69.5% | 24.9% | 5.2% |
| Skin / dermatology | 14,120 | 71.9% | 22.3% | 5.0% |
| Lung, breathing & sleep | 13,372 | 72.5% | 20.8% | 5.2% |
| (no specialty) | 11,044 | 20.9% | 44.9% | 32.9% |
| Kidney / nephrology | 10,447 | 74.8% | 20.2% | 4.3% |
| Urology | 10,195 | 67.8% | 24.2% | 6.4% |
| Ear, nose & throat | 9,833 | 71.8% | 20.3% | 6.7% |
| Hearing & audiology | 9,300 | 64.7% | 28.6% | 6.1% |
| Speech & language therapy | 8,593 | 36.4% | 46.8% | 16.3% |
| Care coordination & community health | 8,301 | 44.2% | 47.6% | 7.8% |
| Pain management | 7,613 | 68.2% | 26.3% | 4.5% |
| Infectious disease | 7,494 | 71.2% | 22.1% | 5.3% |
| Diabetes & hormones | 7,469 | 71.3% | 23.7% | 4.1% |
| Nutrition & dietitian | 6,964 | 49.7% | 35.8% | 13.9% |
| Other health services | 6,726 | 68.4% | 27.8% | 3.5% |
| Arthritis / rheumatology | 5,678 | 73.5% | 21.2% | 4.2% |
| Nursing (RN, LPN) | 4,692 | 49.4% | 42.4% | 7.6% |
| Plastic & reconstructive surgery | 4,554 | 71.3% | 20.8% | 6.6% |
| Allergy & immunology | 3,528 | 73.6% | 23.4% | 2.4% |
| Dental | 3,459 | 59.2% | 29.9% | 10.1% |
| Hospice & palliative care | 2,733 | 65.3% | 26.6% | 6.5% |
| Genetics & genetic counseling | 628 | 71.5% | 20.7% | 5.4% |
