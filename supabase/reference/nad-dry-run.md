# National Address Database: dry run

Run 2026-11-22 19:33 UTC by scripts/nad-dry-run.sh. Nothing was written to the database.

Rule: the same ZIP, the same house number, and the same street or one of the placement job's one-word differences (scripts/lib/nad-match.mjs). Several matching points count as one place only within 100 m of each other.

NAD file: NAD_r24.txt from https://data.transportation.gov/download/fc2s-wawr/application/x-zip-compressed (8477543836 bytes zipped)

## Listings with no pin

- Listings tried: **71,883**
- Would be placed: **9,892** (13.8%), of which 1,628 are in states USDOT marks partly not public domain (CO, IL, KS, MD, MN, ND, SC, SD); their sources need checking before an apply
- An apply may write: **9,880** (wholly public states, plus 1,616 in public counties of partly public states)
- In partly public states but not applied: 12 (county not public domain or split, 0 with no single NAD county)
- Matched but left out, because the state is not public domain in the NAD (HI, MI, NH, OR): 261
- Several matching points far apart (left unplaced): 530
- NAD has this house number in the ZIP, but on another street: 11,533
- NAD has nothing at this house number in the ZIP: 32,035
- The address has no house number (PO box, building name): 17,632

| Table | Tried | Would be placed |
|---|---|---|
| clinic_secondary_locations | 2,416 | 894 (37.0%) |
| provider_individuals | 63,034 | 8,677 (13.8%) |
| clinics | 6,433 | 321 (5.0%) |

How NAD placed the points it matched (its own `Placement` field):

| Placement | Listings |
|---|---|
| Unknown | 6,564 |
| Structure - Rooftop | 2,664 |
| Parcel - Other | 232 |
| Structure - Entrance | 104 |
| Parcel - Centroid | 80 |
| Structure - Interior | 78 |
| Site | 66 |
| Property Access | 33 |
| Structure - Rooftop; Unknown | 15 |
| Other | 13 |
| Parcel - Centroid; Structure - Rooftop | 8 |
| Structure - Entrance; Structure - Interior | 7 |
| Structure - Rooftop; Parcel - Centroid | 6 |
| Parcel - Centroid; Parcel - Other | 4 |
| Structure - Entrance; Unknown | 3 |
| Structure - Rooftop; Structure - Interior | 3 |
| Parcel - Other; Structure - Rooftop | 3 |
| Unknown; Structure - Rooftop | 3 |
| Structure - Rooftop; Parcel - Other | 2 |
| Other; Structure - Rooftop | 2 |
| Linear Geocode | 1 |
| Structure - Interior; Structure - Entrance | 1 |

## Partly public states by county check

| State | Matched | In public counties | Held back, by NAD county |
|---|---|---|---|
| MD | 391 | 391 |  |
| CO | 366 | 366 |  |
| IL | 325 | 325 |  |
| MN | 300 | 300 |  |
| KS | 140 | 140 |  |
| ND | 63 | 63 |  |
| SC | 31 | 31 |  |
| SD | 12 | 0 | MINNEHAHA 7, LINCOLN 5 |

## By state (most unplaced first)

| State | Unplaced | Would be placed | Note |
|---|---|---|---|
| CA | 5,728 | 109 (1.9%) |  |
| TX | 4,387 | 747 (17.0%) |  |
| AE | 3,321 | 0 (0.0%) |  |
| FL | 3,175 | 6 (0.2%) |  |
| NY | 3,068 | 630 (20.5%) |  |
| PR | 2,730 | 0 (0.0%) |  |
| AP | 2,506 | 0 (0.0%) |  |
| NC | 2,435 | 390 (16.0%) |  |
| PA | 2,096 | 108 (5.2%) |  |
| VA | 1,832 | 770 (42.0%) |  |
| NJ | 1,825 | 650 (35.6%) |  |
| GA | 1,781 | 116 (6.5%) |  |
| MO | 1,548 | 141 (9.1%) |  |
| IL | 1,517 | 325 (21.4%) | partly not public domain |
| TN | 1,511 | 802 (53.1%) |  |
| MN | 1,499 | 300 (20.0%) | partly not public domain |
| MD | 1,471 | 391 (26.6%) | partly not public domain |
| MA | 1,313 | 264 (20.1%) |  |
| MI | 1,280 | 0 (0.0%) | not public domain: skipped |
| VI | 1,277 | 0 (0.0%) |  |
| OH | 1,237 | 321 (25.9%) |  |
| AZ | 1,085 | 395 (36.4%) |  |
| CO | 1,054 | 366 (34.7%) | partly not public domain |
| WV | 1,012 | 318 (31.4%) |  |
| WA | 982 | 288 (29.3%) |  |
| AL | 937 | 159 (17.0%) |  |
| CT | 908 | 165 (18.2%) |  |
| IN | 906 | 429 (47.4%) |  |
| GU | 906 | 0 (0.0%) |  |
| SC | 899 | 31 (3.4%) | partly not public domain |
| NE | 890 | 24 (2.7%) |  |
| NM | 873 | 110 (12.6%) |  |
| UT | 854 | 236 (27.6%) |  |
| KY | 837 | 136 (16.2%) |  |
| BA | 823 | 0 (0.0%) |  |
| LA | 789 | 46 (5.8%) |  |
| WI | 740 | 117 (15.8%) |  |
| OK | 731 | 113 (15.5%) |  |
| MS | 639 | 0 (0.0%) |  |
| NH | 634 | 0 (0.0%) | not public domain: skipped |
| DE | 572 | 144 (25.2%) |  |
| OR | 559 | 261 (46.7%) | not public domain: skipped |
| ID | 400 | 11 (2.8%) |  |
| AA | 380 | 0 (0.0%) |  |
| MP | 379 | 0 (0.0%) |  |
| KS | 353 | 140 (39.7%) | partly not public domain |
| AR | 344 | 108 (31.4%) |  |
| PU | 314 | 0 (0.0%) |  |
| AK | 300 | 58 (19.3%) |  |
| HI | 286 | 0 (0.0%) | not public domain: skipped |
| ME | 269 | 66 (24.5%) |  |
| MT | 241 | 91 (37.8%) |  |
| IA | 241 | 86 (35.7%) |  |
| NV | 238 | 0 (0.0%) |  |
| SD | 235 | 12 (5.1%) | partly not public domain |
| AS | 233 | 0 (0.0%) |  |
| DC | 217 | 54 (24.9%) |  |
| CH | 173 | 0 (0.0%) |  |
| ND | 152 | 63 (41.4%) | partly not public domain |
| WY | 149 | 30 (20.1%) |  |
| BC | 140 | 0 (0.0%) |  |
| RI | 114 | 12 (10.5%) |  |
| VT | 84 | 14 (16.7%) |  |
| RH | 78 | 0 (0.0%) |  |
| SO | 78 | 0 (0.0%) |  |
| CE | 74 | 0 (0.0%) |  |
| GE | 72 | 0 (0.0%) |  |
| JA | 72 | 0 (0.0%) |  |
| TA | 63 | 0 (0.0%) |  |
| IS | 53 | 0 (0.0%) |  |
| SA | 51 | 0 (0.0%) |  |
| SI | 45 | 0 (0.0%) |  |
| KA | 44 | 0 (0.0%) |  |
| AM | 36 | 0 (0.0%) |  |
| HE | 28 | 0 (0.0%) |  |
| YA | 24 | 0 (0.0%) |  |
| BE | 24 | 0 (0.0%) |  |
| QU | 24 | 0 (0.0%) |  |
| NA | 23 | 0 (0.0%) |  |
| SE | 22 | 0 (0.0%) |  |
| TE | 22 | 0 (0.0%) |  |
| GY | 19 | 0 (0.0%) |  |
| TO | 18 | 0 (0.0%) |  |
| NO | 17 | 0 (0.0%) |  |
| B. | 17 | 0 (0.0%) |  |
| SH | 16 | 0 (0.0%) |  |
| HA | 15 | 0 (0.0%) |  |
| US | 14 | 0 (0.0%) |  |
| DO | 13 | 0 (0.0%) |  |
| ST | 13 | 0 (0.0%) |  |
| EA | 13 | 0 (0.0%) |  |
| JE | 12 | 0 (0.0%) |  |
| KO | 11 | 0 (0.0%) |  |
| GR | 11 | 0 (0.0%) |  |
| AT | 10 | 0 (0.0%) |  |
| DU | 10 | 0 (0.0%) |  |
| RE | 10 | 0 (0.0%) |  |
| IT | 10 | 0 (0.0%) |  |
| CU | 9 | 0 (0.0%) |  |
| HO | 9 | 0 (0.0%) |  |
| PO | 9 | 0 (0.0%) |  |
| LI | 9 | 0 (0.0%) |  |
| UN | 9 | 0 (0.0%) |  |
| P. | 8 | 0 (0.0%) |  |
| AB | 8 | 0 (0.0%) |  |
| AN | 8 | 0 (0.0%) |  |
| FM | 8 | 0 (0.0%) |  |
| MX | 8 | 0 (0.0%) |  |
| KI | 8 | 0 (0.0%) |  |
| WE | 7 | 0 (0.0%) |  |
| ZZ | 7 | 0 (0.0%) |  |
| RA | 7 | 0 (0.0%) |  |
| RO | 7 | 0 (0.0%) |  |
| VE | 7 | 0 (0.0%) |  |
| KE | 7 | 0 (0.0%) |  |
| PN | 7 | 0 (0.0%) |  |
| FP | 7 | 0 (0.0%) |  |
| PI | 7 | 0 (0.0%) |  |
| AV | 6 | 0 (0.0%) |  |
| ES | 6 | 0 (0.0%) |  |
| N/ | 6 | 0 (0.0%) |  |
| TI | 6 | 0 (0.0%) |  |
| DI | 6 | 0 (0.0%) |  |
| YO | 6 | 0 (0.0%) |  |
| FR | 5 | 0 (0.0%) |  |
| BO | 5 | 0 (0.0%) |  |
| NU | 5 | 0 (0.0%) |  |
| PH | 5 | 0 (0.0%) |  |
| SN | 5 | 0 (0.0%) |  |
| RP | 5 | 0 (0.0%) |  |
| TH | 5 | 0 (0.0%) |  |
| RM | 5 | 0 (0.0%) |  |
| NS | 4 | 0 (0.0%) |  |
| RL | 4 | 0 (0.0%) |  |
| UA | 4 | 0 (0.0%) |  |
| SP | 4 | 0 (0.0%) |  |
| LO | 4 | 0 (0.0%) |  |
| EU | 4 | 0 (0.0%) |  |
| KU | 4 | 0 (0.0%) |  |
| U. | 4 | 0 (0.0%) |  |
| BU | 4 | 0 (0.0%) |  |
| FU | 4 | 0 (0.0%) |  |
| OS | 4 | 0 (0.0%) |  |
| CR | 4 | 0 (0.0%) |  |
| SW | 4 | 0 (0.0%) |  |
| AF | 3 | 0 (0.0%) |  |
| AU | 3 | 0 (0.0%) |  |
| AO | 3 | 0 (0.0%) |  |
| FO | 3 | 0 (0.0%) |  |
| ZA | 3 | 0 (0.0%) |  |
| PE | 2 | 0 (0.0%) |  |
| IC | 2 | 0 (0.0%) |  |
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
| KW | 2 | 0 (0.0%) |  |
| BI | 2 | 0 (0.0%) |  |
| IW | 2 | 0 (0.0%) |  |
| SU | 2 | 0 (0.0%) |  |
| TU | 2 | 0 (0.0%) |  |
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
| DA | 1 | 0 (0.0%) |  |
| EL | 1 | 0 (0.0%) |  |
| OL | 1 | 0 (0.0%) |  |
| OC | 1 | 0 (0.0%) |  |
| BS | 1 | 0 (0.0%) |  |
| DR | 1 | 0 (0.0%) |  |
| ZO | 1 | 0 (0.0%) |  |
| CD | 1 | 0 (0.0%) |  |
| SM | 1 | 0 (0.0%) |  |
| QR | 1 | 0 (0.0%) |  |
| ZH | 1 | 0 (0.0%) |  |
| Q. | 1 | 0 (0.0%) |  |
| OA | 1 | 0 (0.0%) |  |
| EN | 1 | 0 (0.0%) |  |
| PY | 1 | 0 (0.0%) |  |
| WC | 1 | 0 (0.0%) |  |
| LS | 1 | 0 (0.0%) |  |
| FE | 1 | 0 (0.0%) |  |
| HY | 1 | 0 (0.0%) |  |
| EO | 1 | 0 (0.0%) |  |
| EG | 1 | 0 (0.0%) |  |
| CN | 1 | 0 (0.0%) |  |
| JP | 1 | 0 (0.0%) |  |
| LB | 1 | 0 (0.0%) |  |
| ER | 1 | 0 (0.0%) |  |
| A. | 1 | 0 (0.0%) |  |
| AH | 1 | 0 (0.0%) |  |
| GT | 1 | 0 (0.0%) |  |
| ON | 1 | 0 (0.0%) |  |
| RS | 1 | 0 (0.0%) |  |
| D. | 1 | 0 (0.0%) |  |
| S | 1 | 0 (0.0%) |  |
| XI | 1 | 0 (0.0%) |  |
| DH | 1 | 0 (0.0%) |  |
| EH | 1 | 0 (0.0%) |  |
| VO | 1 | 0 (0.0%) |  |
| KH | 1 | 0 (0.0%) |  |
| (M | 1 | 0 (0.0%) |  |
| VR | 1 | 0 (0.0%) |  |
| GO | 1 | 0 (0.0%) |  |
| IB | 1 | 0 (0.0%) |  |
| IR | 1 | 0 (0.0%) |  |
| PL | 1 | 0 (0.0%) |  |
| BR | 1 | 0 (0.0%) |  |
| SG | 1 | 0 (0.0%) |  |
| OM | 1 | 0 (0.0%) |  |
| NP | 1 | 0 (0.0%) |  |
| UR | 1 | 0 (0.0%) |  |
| ? | 1 | 0 (0.0%) |  |
| JU | 1 | 0 (0.0%) |  |
| OU | 1 | 0 (0.0%) |  |
| TR | 1 | 0 (0.0%) |  |
| IM | 1 | 0 (0.0%) |  |
| 6T | 1 | 0 (0.0%) |  |
| QA | 1 | 0 (0.0%) |  |
| HU | 1 | 0 (0.0%) |  |
| JJ | 1 | 0 (0.0%) |  |
| RN | 1 | 0 (0.0%) |  |
| 1  | 1 | 0 (0.0%) |  |
| CL | 1 | 0 (0.0%) |  |
| KL | 1 | 0 (0.0%) |  |

## Agreement with the Census

Of 3,000 listings the Census already placed exactly, NAD matched 1,601. Distance from the Census pin to the NAD point: median 66 m, 75th percentile 110 m, 90th percentile 200 m, 99th percentile 576 m; 22 more than 500 m apart.

## Examples (public listing addresses)

Another street at the same number:

- 155 WELLNESS WAY, STATE COLLEGE, PA 16803
- 501 W 14TH ST WILMINGTON HOSPITAL HEALTH CENTE, WILMINGTON, DE 19801
- 169 RIVERIDE DR, BINGHAMTON, NY 13905
- 116 WASHINGTON CROSSING RD, PENNINGTON, NJ 08534
- 1450 CHAPEL ST B, NEW HAVEN, CT 06511
- 69 HADDONFIELD BERLIN RD, CHERRY HILL, NJ 08034
- 2740 TX-360 STE 100, GRAND PRAIRIE, TX 75050
- 2870 PEACHTREE RD NW STE 243, ATLANTA, GA 30305
- 3800 RESERVOIR RD NW MEDSTAR GEORGETOWN UNIVERSITY HOSP, WASHINGTON, DC 20007
- 46 B THOMAS JOHNSON DR, FREDERICK, MD 21702

Points far apart:

- 1 QUALITY DR, VACAVILLE, CA 95688
- 100 MADISON AVE, MORRISTOWN, NJ 07960
- 100 MADISON AVE, MORRISTOWN, NJ 07960
- 1 QUALITY DR, VACAVILLE, CA 95688
- 1 QUALITY DR, VACAVILLE, CA 95688
- 401 NJ-73, MARLTON, NJ 08053
- 1705 TARBORO ST SW, WILSON, NC 27893
- 100 MADISON AVE, MORRISTOWN, NJ 07960
- 1 UNIVERSITY AVE, MECHANICSBURG, PA 17055
- 100 MADISON AVE, MORRISTOWN, NJ 07960
