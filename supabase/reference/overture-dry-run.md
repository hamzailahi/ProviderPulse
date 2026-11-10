# Overture Maps addresses: dry run

Run 2026-11-10 19:52 UTC by scripts/overture-dry-run.sh. Nothing was written to the database.

Source: Overture Maps Foundation, addresses theme, release 2026-10-21.0 (public S3 bucket, free, no account). Each record names its source dataset and licence; a licence must be checked before any point is stored.

Rule: the same ZIP, the same house number, and the same street or one of the placement job's one-word differences. Several matching points count as one place only within 100 m of each other. Overture rows with no postcode cannot match.

## Listings with no pin

- Listings tried: **43,873**
- Would be placed: **740** (1.7%)
- Several matching points far apart: 151
- This house number is in the ZIP, but on another street: 8,338
- Nothing at this house number in the ZIP: 17,632
- The address has no house number (PO box, building name): 17,012

| Table | Tried | Would be placed |
|---|---|---|
| clinic_secondary_locations | 80 | 1 (1.3%) |
| provider_individuals | 38,133 | 615 (1.6%) |
| clinics | 5,660 | 124 (2.2%) |

## By source dataset and licence

| Source dataset, licence | Listings |
|---|---|
| us/fl/orange / LicenseRef-Proprietary | 98 |
| us/fl/miami-dade / LicenseRef-Public-Domain-US-FL-Law | 71 |
| us/ca/los_angeles / LicenseRef-Proprietary | 59 |
| us/ca/san_diego / LicenseRef-Public-Domain-US-CA-Law | 51 |
| us/ca/santa_clara / LicenseRef-Public-Domain-US-CA-Law | 44 |
| us/ca/orange / LicenseRef-Public-Domain-US-CA-Law | 37 |
| NAD / LicenseRef-Public-Domain-US | 30 |
| us/fl/okaloosa / LicenseRef-Public-Domain-US-FL-Law | 26 |
| us/fl/palm_beach / LicenseRef-Proprietary | 22 |
| us/fl/duval / LicenseRef-Public-Domain-US-FL-Law | 22 |
| us/ca/contra_costa / LicenseRef-Public-Domain-US-CA-Law | 20 |
| us/fl/pasco / LicenseRef-Public-Domain-US-FL-Law | 20 |
| us/fl/sarasota / LicenseRef-Public-Domain-US-FL-Law | 18 |
| us/fl/alachua / LicenseRef-Public-Domain-US-FL-Law | 17 |
| us/fl/hillsborough / CC-BY-4.0 | 12 |
| us/fl/lee / LicenseRef-Public-Domain-US-FL-Law | 12 |
| us/or/statewide / LicenseRef-Proprietary | 12 |
| us/ca/riverside / LicenseRef-Public-Domain-US-CA-Law | 10 |
| us/ca/san_francisco / PDDL-1.0 | 10 |
| us/fl/sumter / LicenseRef-Public-Domain-US-FL-Law | 10 |
| us/fl/brevard / LicenseRef-Public-Domain-US-FL-Law | 9 |
| us/fl/manatee / CC-BY-4.0 | 9 |
| us/ca/san_mateo / LicenseRef-Public-Domain-US-CA-Law | 8 |
| us/fl/polk / LicenseRef-Public-Domain-US-FL-Law | 7 |
| us/fl/indian_river / LicenseRef-Public-Domain-US-FL-Law | 7 |
| us/fl/volusia / LicenseRef-Public-Domain-US-FL-Law | 6 |
| us/fl/pinellas / LicenseRef-Public-Domain-US-FL-Law | 6 |
| us/ny/city_of_new_york / LicenseRef-Proprietary | 6 |
| us/fl/leon / LicenseRef-Public-Domain-US-FL-Law | 5 |
| us/fl/st-johns / LicenseRef-Public-Domain-US-FL-Law | 4 |
| us/ga/dekalb / CC-BY-4.0 | 4 |
| us/ga/clarke / CC-BY-4.0 | 4 |
| us/fl/charlotte / LicenseRef-Public-Domain-US-FL-Law | 3 |
| us/fl/walton / LicenseRef-Public-Domain-US-FL-Law | 3 |
| us/fl/seminole / LicenseRef-Public-Domain-US-FL-Law | 3 |
| us/ca/san_bernardino / LicenseRef-Public-Domain-US-CA-Law | 3 |
| us/ca/stanislaus / LicenseRef-Public-Domain-US-CA-Law | 3 |
| us/fl/hernando / LicenseRef-Public-Domain-US-FL-Law | 3 |
| us/ca/santa_barbara / LicenseRef-Public-Domain-US-CA-Law | 2 |
| us/fl/union / LicenseRef-Public-Domain-US-FL-Law | 2 |
| us/fl/broward / LicenseRef-Public-Domain-US-FL-Law | 2 |
| us/co/statewide / LicenseRef-Proprietary | 2 |
| us/mi/oakland / LicenseRef-Proprietary | 2 |
| us/fl/lake / LicenseRef-Public-Domain-US-FL-Law | 2 |
| us/ca/madera / LicenseRef-Public-Domain-US-CA-Law | 2 |
| us/ca/sonoma / LicenseRef-Public-Domain-US-CA-Law | 2 |
| us/ca/tulare / LicenseRef-Public-Domain-US-CA-Law | 2 |
| us/fl/bradford / LicenseRef-Public-Domain-US-FL-Law | 2 |
| us/ms/alcorn / LicenseRef-Proprietary | 2 |
| us/ms/rankin / LicenseRef-Proprietary | 2 |
| us/fl/santa_rosa / LicenseRef-Public-Domain-US-FL-Law | 2 |
| us/ca/yuba / LicenseRef-Public-Domain-US-CA-Law | 2 |
| us/ms/statewide-west / LicenseRef-Proprietary | 1 |
| us/fl/marion / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/ca/trinity / LicenseRef-Public-Domain-US-CA-Law | 1 |
| us/ca/san_luis_obispo / LicenseRef-Public-Domain-US-CA-Law | 1 |
| us/fl/bay / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/ca/san_joaquin / LicenseRef-Public-Domain-US-CA-Law | 1 |
| us/id/ada / CC-BY-4.0 | 1 |
| us/ca/imperial / LicenseRef-Public-Domain-US-CA-Law | 1 |
| us/fl/hamilton / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/ms/simpson / LicenseRef-Proprietary | 1 |
| us/mn/statewide / LicenseRef-Proprietary | 1 |
| us/fl/citrus / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/fl/columbia / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/ma/statewide / LicenseRef-Proprietary | 1 |
| us/mi/kent / LicenseRef-Proprietary | 1 |
| us/fl/osceola / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/fl/hendry / LicenseRef-Public-Domain-US-FL-Law | 1 |
| us/fl/escambia / LicenseRef-Public-Domain-US-FL-Law | 1 |

## By state (most unplaced first)

| State | Unplaced | Would be placed | Note |
|---|---|---|---|
| CA | 3,761 | 257 (6.8%) |  |
| AE | 3,444 | 0 (0.0%) |  |
| AP | 2,592 | 1 (0.0%) |  |
| PR | 2,533 | 0 (0.0%) |  |
| TX | 2,265 | 2 (0.1%) |  |
| NY | 1,891 | 6 (0.3%) |  |
| FL | 1,593 | 410 (25.7%) |  |
| NC | 1,363 | 0 (0.0%) |  |
| VI | 1,211 | 0 (0.0%) |  |
| PA | 1,155 | 0 (0.0%) |  |
| MN | 999 | 1 (0.1%) | NAD rows here are public only in some counties |
| BA | 824 | 0 (0.0%) |  |
| MI | 795 | 3 (0.4%) | NAD rows here are not public domain |
| GU | 790 | 0 (0.0%) |  |
| MO | 777 | 0 (0.0%) |  |
| VA | 703 | 0 (0.0%) |  |
| MD | 696 | 0 (0.0%) | NAD rows here are public only in some counties |
| GA | 675 | 8 (1.2%) |  |
| NJ | 635 | 0 (0.0%) |  |
| IL | 623 | 0 (0.0%) | NAD rows here are public only in some counties |
| MA | 618 | 1 (0.2%) |  |
| WV | 591 | 0 (0.0%) |  |
| NE | 586 | 0 (0.0%) |  |
| OH | 584 | 0 (0.0%) |  |
| NM | 558 | 0 (0.0%) |  |
| TN | 539 | 0 (0.0%) |  |
| CT | 538 | 0 (0.0%) |  |
| WA | 522 | 1 (0.2%) |  |
| SC | 506 | 0 (0.0%) | NAD rows here are public only in some counties |
| LA | 462 | 0 (0.0%) |  |
| KY | 455 | 0 (0.0%) |  |
| AL | 455 | 0 (0.0%) |  |
| UT | 435 | 1 (0.2%) |  |
| NH | 414 | 0 (0.0%) | NAD rows here are not public domain |
| AA | 391 | 2 (0.5%) |  |
| AZ | 389 | 3 (0.8%) |  |
| OK | 371 | 0 (0.0%) |  |
| WI | 346 | 0 (0.0%) |  |
| CO | 328 | 2 (0.6%) | NAD rows here are public only in some counties |
| MP | 323 | 0 (0.0%) |  |
| MS | 322 | 6 (1.9%) |  |
| PU | 321 | 0 (0.0%) |  |
| IN | 252 | 0 (0.0%) |  |
| DE | 250 | 0 (0.0%) |  |
| AS | 233 | 0 (0.0%) |  |
| OR | 190 | 12 (6.3%) | NAD rows here are not public domain |
| AR | 190 | 0 (0.0%) |  |
| ID | 172 | 1 (0.6%) |  |
| CH | 170 | 0 (0.0%) |  |
| HI | 169 | 0 (0.0%) | NAD rows here are not public domain |
| AK | 154 | 21 (13.6%) |  |
| NV | 149 | 0 (0.0%) |  |
| DC | 148 | 0 (0.0%) |  |
| BC | 140 | 0 (0.0%) |  |
| KS | 137 | 0 (0.0%) | NAD rows here are public only in some counties |
| ME | 112 | 0 (0.0%) |  |
| IA | 106 | 0 (0.0%) |  |
| MT | 95 | 0 (0.0%) |  |
| RH | 79 | 0 (0.0%) |  |
| ND | 77 | 0 (0.0%) | NAD rows here are public only in some counties |
| JA | 76 | 0 (0.0%) |  |
| SO | 75 | 0 (0.0%) |  |
| CE | 74 | 0 (0.0%) |  |
| SD | 74 | 0 (0.0%) | NAD rows here are public only in some counties |
| RI | 74 | 0 (0.0%) |  |
| GE | 72 | 0 (0.0%) |  |
| TA | 63 | 0 (0.0%) |  |
| WY | 59 | 2 (3.4%) |  |
| IS | 57 | 0 (0.0%) |  |
| SA | 51 | 0 (0.0%) |  |
| SI | 45 | 0 (0.0%) |  |
| KA | 43 | 0 (0.0%) |  |
| VT | 38 | 0 (0.0%) |  |
| AM | 36 | 0 (0.0%) |  |
| HE | 28 | 0 (0.0%) |  |
| YA | 26 | 0 (0.0%) |  |
| BE | 25 | 0 (0.0%) |  |
| NA | 25 | 0 (0.0%) |  |
| QU | 24 | 0 (0.0%) |  |
| SE | 22 | 0 (0.0%) |  |
| TE | 22 | 0 (0.0%) |  |
| GY | 19 | 0 (0.0%) |  |
| TO | 19 | 0 (0.0%) |  |
| NO | 18 | 0 (0.0%) |  |
| B. | 17 | 0 (0.0%) |  |
| HA | 16 | 0 (0.0%) |  |
| SH | 16 | 0 (0.0%) |  |
| US | 14 | 0 (0.0%) |  |
| ST | 14 | 0 (0.0%) |  |
| DO | 13 | 0 (0.0%) |  |
| EA | 13 | 0 (0.0%) |  |
| JE | 12 | 0 (0.0%) |  |
| RE | 12 | 0 (0.0%) |  |
| KO | 11 | 0 (0.0%) |  |
| GR | 11 | 0 (0.0%) |  |
| AB | 11 | 0 (0.0%) |  |
| WE | 10 | 0 (0.0%) |  |
| DU | 10 | 0 (0.0%) |  |
| IT | 10 | 0 (0.0%) |  |
| AT | 10 | 0 (0.0%) |  |
| HO | 9 | 0 (0.0%) |  |
| PO | 9 | 0 (0.0%) |  |
| CU | 9 | 0 (0.0%) |  |
| UN | 9 | 0 (0.0%) |  |
| AN | 8 | 0 (0.0%) |  |
| FM | 8 | 0 (0.0%) |  |
| LI | 8 | 0 (0.0%) |  |
| RA | 8 | 0 (0.0%) |  |
| VE | 8 | 0 (0.0%) |  |
| P. | 8 | 0 (0.0%) |  |
| MX | 8 | 0 (0.0%) |  |
| PN | 8 | 0 (0.0%) |  |
| KI | 8 | 0 (0.0%) |  |
| PI | 8 | 0 (0.0%) |  |
| FR | 7 | 0 (0.0%) |  |
| ZZ | 7 | 0 (0.0%) |  |
| AV | 7 | 0 (0.0%) |  |
| N/ | 7 | 0 (0.0%) |  |
| RO | 7 | 0 (0.0%) |  |
| KE | 7 | 0 (0.0%) |  |
| FP | 7 | 0 (0.0%) |  |
| ES | 6 | 0 (0.0%) |  |
| TI | 6 | 0 (0.0%) |  |
| DI | 6 | 0 (0.0%) |  |
| YO | 6 | 0 (0.0%) |  |
| BO | 5 | 0 (0.0%) |  |
| NU | 5 | 0 (0.0%) |  |
| PH | 5 | 0 (0.0%) |  |
| KU | 5 | 0 (0.0%) |  |
| SN | 5 | 0 (0.0%) |  |
| TH | 5 | 0 (0.0%) |  |
| RM | 5 | 0 (0.0%) |  |
| NS | 4 | 0 (0.0%) |  |
| RL | 4 | 0 (0.0%) |  |
| UA | 4 | 0 (0.0%) |  |
| SP | 4 | 0 (0.0%) |  |
| LO | 4 | 0 (0.0%) |  |
| EU | 4 | 0 (0.0%) |  |
| U. | 4 | 0 (0.0%) |  |
| BU | 4 | 0 (0.0%) |  |
| FU | 4 | 0 (0.0%) |  |
| OS | 4 | 0 (0.0%) |  |
| CR | 4 | 0 (0.0%) |  |
| SW | 4 | 0 (0.0%) |  |
| RP | 4 | 0 (0.0%) |  |
| AU | 3 | 0 (0.0%) |  |
| AF | 3 | 0 (0.0%) |  |
| AO | 3 | 0 (0.0%) |  |
| FO | 3 | 0 (0.0%) |  |
| TU | 3 | 0 (0.0%) |  |
| ZA | 3 | 0 (0.0%) |  |
| KR | 2 | 0 (0.0%) |  |
| CI | 2 | 0 (0.0%) |  |
| ZU | 2 | 0 (0.0%) |  |
| JO | 2 | 0 (0.0%) |  |
| -- | 2 | 0 (0.0%) |  |
| UK | 2 | 0 (0.0%) |  |
| NI | 2 | 0 (0.0%) |  |
| MH | 2 | 0 (0.0%) |  |
| FI | 2 | 0 (0.0%) |  |
| SL | 2 | 0 (0.0%) |  |
| YU | 2 | 0 (0.0%) |  |
| PY | 2 | 0 (0.0%) |  |
| KW | 2 | 0 (0.0%) |  |
| BI | 2 | 0 (0.0%) |  |
| CL | 2 | 0 (0.0%) |  |
| IW | 2 | 0 (0.0%) |  |
| SU | 2 | 0 (0.0%) |  |
| NR | 2 | 0 (0.0%) |  |
| BW | 2 | 0 (0.0%) |  |
| RJ | 2 | 0 (0.0%) |  |
| GI | 2 | 0 (0.0%) |  |
| OT | 2 | 0 (0.0%) |  |
| 20 | 1 | 0 (0.0%) |  |
| 22 | 1 | 0 (0.0%) |  |
| 29 | 1 | 0 (0.0%) |  |
| 32 | 1 | 0 (0.0%) |  |
| 65 | 1 | 0 (0.0%) |  |
| 70 | 1 | 0 (0.0%) |  |
| EL | 1 | 0 (0.0%) |  |
| IC | 1 | 0 (0.0%) |  |
| OL | 1 | 0 (0.0%) |  |
| OC | 1 | 0 (0.0%) |  |
| BS | 1 | 0 (0.0%) |  |
| DR | 1 | 0 (0.0%) |  |
| ZO | 1 | 0 (0.0%) |  |
| SM | 1 | 0 (0.0%) |  |
| QR | 1 | 0 (0.0%) |  |
| ZH | 1 | 0 (0.0%) |  |
| Q. | 1 | 0 (0.0%) |  |
| CD | 1 | 0 (0.0%) |  |
| OA | 1 | 0 (0.0%) |  |
| EN | 1 | 0 (0.0%) |  |
| LS | 1 | 0 (0.0%) |  |
| WC | 1 | 0 (0.0%) |  |
| FE | 1 | 0 (0.0%) |  |
| HY | 1 | 0 (0.0%) |  |
| EO | 1 | 0 (0.0%) |  |
| EG | 1 | 0 (0.0%) |  |
| LU | 1 | 0 (0.0%) |  |
| CN | 1 | 0 (0.0%) |  |
| JP | 1 | 0 (0.0%) |  |
| LB | 1 | 0 (0.0%) |  |
| ER | 1 | 0 (0.0%) |  |
| A. | 1 | 0 (0.0%) |  |
| GT | 1 | 0 (0.0%) |  |
| AH | 1 | 0 (0.0%) |  |
| ON | 1 | 0 (0.0%) |  |
| RS | 1 | 0 (0.0%) |  |
| D. | 1 | 0 (0.0%) |  |
| S | 1 | 0 (0.0%) |  |
| XI | 1 | 0 (0.0%) |  |
| DH | 1 | 0 (0.0%) |  |
| EH | 1 | 0 (0.0%) |  |
| VO | 1 | 0 (0.0%) |  |
| (M | 1 | 0 (0.0%) |  |
| KH | 1 | 0 (0.0%) |  |
| VR | 1 | 0 (0.0%) |  |
| GO | 1 | 0 (0.0%) |  |
| IR | 1 | 0 (0.0%) |  |
| PL | 1 | 0 (0.0%) |  |
| IB | 1 | 0 (0.0%) |  |
| BR | 1 | 0 (0.0%) |  |
| SG | 1 | 0 (0.0%) |  |
| UP | 1 | 0 (0.0%) |  |
| OM | 1 | 0 (0.0%) |  |
| NP | 1 | 0 (0.0%) |  |
| ? | 1 | 0 (0.0%) |  |
| UR | 1 | 0 (0.0%) |  |
| TR | 1 | 0 (0.0%) |  |
| OU | 1 | 0 (0.0%) |  |
| IM | 1 | 0 (0.0%) |  |
| 6T | 1 | 0 (0.0%) |  |
| QA | 1 | 0 (0.0%) |  |
| HU | 1 | 0 (0.0%) |  |
| JJ | 1 | 0 (0.0%) |  |
| RN | 1 | 0 (0.0%) |  |
| KL | 1 | 0 (0.0%) |  |
| 1  | 1 | 0 (0.0%) |  |
| DA | 1 | 0 (0.0%) |  |
| PE | 1 | 0 (0.0%) |  |
