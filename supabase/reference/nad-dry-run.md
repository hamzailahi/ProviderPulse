# National Address Database: dry run

Run 2026-11-04 18:07 UTC by scripts/nad-dry-run.sh. Nothing was written to the database.

Rule: the same ZIP, the same house number, and the same street or one of the placement job's one-word differences (scripts/lib/nad-match.mjs). Several matching points count as one place only within 100 m of each other.

NAD file: NAD_r24.txt from https://data.transportation.gov/download/fc2s-wawr/application/x-zip-compressed (8477543836 bytes zipped)

## Listings with no pin

- Listings tried: **144,896**
- Would be placed: **45,020** (31.1%), of which 8,110 are in states USDOT marks partly not public domain (CO, IL, KS, MD, MN, ND, SC, SD); their sources need checking before an apply
- Matched but left out, because the state is not public domain in the NAD (HI, MI, NH, OR): 1,247
- Several matching points far apart (left unplaced): 2,251
- NAD has this house number in the ZIP, but on another street: 18,136
- NAD has nothing at this house number in the ZIP: 61,230
- The address has no house number (PO box, building name): 17,012

| Table | Tried | Would be placed |
|---|---|---|
| clinic_secondary_locations | 80 | 0 (0.0%) |
| provider_individuals | 122,737 | 37,657 (30.7%) |
| clinics | 22,079 | 7,363 (33.3%) |

How NAD placed the points it matched (its own `Placement` field):

| Placement | Listings |
|---|---|
| Unknown | 32,463 |
| Structure - Rooftop | 9,078 |
| Parcel - Other | 1,460 |
| Structure - Entrance | 607 |
| Structure - Interior | 281 |
| Parcel - Centroid | 196 |
| Site | 180 |
| Other | 171 |
| Property Access | 166 |
| Structure - Entrance; Structure - Interior | 54 |
| Structure - Rooftop; Unknown | 54 |
| Structure - Rooftop; Structure - Interior | 46 |
| Structure - Entrance; Unknown | 42 |
| Unknown; Structure - Rooftop | 33 |
| Parcel - Centroid; Structure - Rooftop | 22 |
| Structure - Rooftop; Site | 21 |
| Structure - Rooftop; Parcel - Other | 19 |
| Unknown; Parcel - Other | 19 |
| Parcel - Other; Unknown | 14 |
| Structure - Rooftop; Parcel - Centroid | 12 |
| Linear Geocode | 12 |
| Parcel - Other; Structure - Rooftop | 11 |
| Parcel - Centroid; Parcel - Other | 10 |
| Structure - Interior; Structure - Entrance | 9 |
| Structure - Rooftop; Property Access | 6 |
| Site; Structure - Rooftop | 5 |
| Structure - Rooftop; Site; Parcel - Other | 3 |
| Site; Unknown | 3 |
| Structure - Rooftop; Structure - Entrance | 3 |
| Structure - Interior; Structure - Rooftop | 3 |
| Other; Unknown; Structure - Rooftop | 2 |
| Property Access; Structure - Rooftop | 2 |
| Parcel - Other; Site | 2 |
| Structure - Entrance; Structure - Rooftop | 1 |
| Other; Structure - Rooftop | 1 |
| Structure - Rooftop; Parcel - Other; Parcel - Centroid | 1 |
| Structure - Rooftop; Other; Structure - Entrance | 1 |
| Parcel - Centroid; Structure - Rooftop; Property Access | 1 |
| Structure - Rooftop; Structure - Entrance; Other | 1 |
| Other; Parcel - Other | 1 |
| Structure - Rooftop; Other | 1 |
| Unknown; Structure - Entrance | 1 |
| Other; Unknown; Parcel - Other | 1 |
| Unknown; Site | 1 |

## By state (most unplaced first)

| State | Unplaced | Would be placed | Note |
|---|---|---|---|
| CA | 15,875 | 1,845 (11.6%) |  |
| TX | 11,820 | 4,329 (36.6%) |  |
| FL | 8,570 | 9 (0.1%) |  |
| NY | 5,352 | 2,445 (45.7%) |  |
| GA | 4,956 | 766 (15.5%) |  |
| NC | 4,863 | 2,322 (47.7%) |  |
| OH | 4,303 | 2,747 (63.8%) |  |
| IL | 4,189 | 2,091 (49.9%) | partly not public domain |
| PA | 3,951 | 313 (7.9%) |  |
| MI | 3,596 | 2 (0.1%) | not public domain: skipped |
| AE | 3,444 | 0 (0.0%) |  |
| MN | 3,262 | 1,907 (58.5%) | partly not public domain |
| PR | 3,239 | 0 (0.0%) |  |
| VA | 3,176 | 1,997 (62.9%) |  |
| NJ | 3,157 | 1,632 (51.7%) |  |
| MD | 2,939 | 1,874 (63.8%) | partly not public domain |
| WV | 2,718 | 1,598 (58.8%) |  |
| WA | 2,675 | 1,689 (63.1%) |  |
| AP | 2,599 | 4 (0.2%) |  |
| MO | 2,540 | 625 (24.6%) |  |
| CO | 2,507 | 1,111 (44.3%) | partly not public domain |
| UT | 2,478 | 1,719 (69.4%) |  |
| KY | 2,421 | 944 (39.0%) |  |
| MA | 2,340 | 1,288 (55.0%) |  |
| IN | 2,309 | 1,426 (61.8%) |  |
| TN | 2,028 | 1,237 (61.0%) |  |
| AL | 2,010 | 833 (41.4%) |  |
| AZ | 1,936 | 1,193 (61.6%) |  |
| SC | 1,900 | 91 (4.8%) | partly not public domain |
| OK | 1,872 | 752 (40.2%) |  |
| WI | 1,741 | 863 (49.6%) |  |
| NM | 1,668 | 602 (36.1%) |  |
| LA | 1,659 | 340 (20.5%) |  |
| OR | 1,558 | 1,245 (79.9%) | not public domain: skipped |
| AR | 1,402 | 867 (61.8%) |  |
| NE | 1,336 | 321 (24.0%) |  |
| VI | 1,223 | 5 (0.4%) |  |
| CT | 1,066 | 347 (32.6%) |  |
| NV | 1,038 | 0 (0.0%) |  |
| MS | 1,034 | 0 (0.0%) |  |
| GU | 1,003 | 0 (0.0%) |  |
| KS | 977 | 560 (57.3%) | partly not public domain |
| ID | 974 | 25 (2.6%) |  |
| BA | 824 | 0 (0.0%) |  |
| NH | 690 | 0 (0.0%) | not public domain: skipped |
| IA | 649 | 452 (69.6%) |  |
| ND | 558 | 415 (74.4%) | partly not public domain |
| DE | 533 | 225 (42.2%) |  |
| AA | 416 | 16 (3.8%) |  |
| ME | 404 | 251 (62.1%) |  |
| DC | 394 | 236 (59.9%) |  |
| MT | 359 | 217 (60.4%) |  |
| HI | 350 | 0 (0.0%) | not public domain: skipped |
| MP | 325 | 1 (0.3%) |  |
| PU | 323 | 0 (0.0%) |  |
| RI | 318 | 141 (44.3%) |  |
| AK | 315 | 117 (37.1%) |  |
| SD | 262 | 61 (23.3%) | partly not public domain |
| AS | 234 | 0 (0.0%) |  |
| WY | 229 | 68 (29.7%) |  |
| CH | 170 | 0 (0.0%) |  |
| VT | 147 | 77 (52.4%) |  |
| BC | 140 | 0 (0.0%) |  |
| RH | 79 | 0 (0.0%) |  |
| JA | 76 | 0 (0.0%) |  |
| SO | 75 | 0 (0.0%) |  |
| GE | 74 | 0 (0.0%) |  |
| CE | 74 | 0 (0.0%) |  |
| TA | 64 | 0 (0.0%) |  |
| IS | 57 | 0 (0.0%) |  |
| SA | 51 | 0 (0.0%) |  |
| SI | 45 | 0 (0.0%) |  |
| KA | 44 | 0 (0.0%) |  |
| AM | 37 | 1 (2.7%) |  |
| TE | 32 | 8 (25.0%) |  |
| HE | 28 | 0 (0.0%) |  |
| YA | 26 | 0 (0.0%) |  |
| BE | 25 | 0 (0.0%) |  |
| NA | 25 | 0 (0.0%) |  |
| QU | 24 | 0 (0.0%) |  |
| US | 22 | 7 (31.8%) |  |
| SE | 22 | 0 (0.0%) |  |
| NO | 19 | 0 (0.0%) |  |
| GY | 19 | 0 (0.0%) |  |
| TO | 19 | 0 (0.0%) |  |
| HA | 17 | 0 (0.0%) |  |
| B. | 17 | 0 (0.0%) |  |
| SH | 16 | 0 (0.0%) |  |
| ST | 14 | 0 (0.0%) |  |
| DO | 13 | 0 (0.0%) |  |
| FM | 13 | 2 (15.4%) |  |
| EA | 13 | 0 (0.0%) |  |
| JE | 12 | 0 (0.0%) |  |
| RE | 12 | 0 (0.0%) |  |
| UN | 12 | 1 (8.3%) |  |
| N/ | 11 | 1 (9.1%) |  |
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
| AN | 8 | 0 (0.0%) |  |
| LI | 8 | 0 (0.0%) |  |
| RA | 8 | 0 (0.0%) |  |
| RO | 8 | 1 (12.5%) |  |
| VE | 8 | 0 (0.0%) |  |
| LO | 8 | 3 (37.5%) |  |
| P. | 8 | 0 (0.0%) |  |
| KE | 8 | 0 (0.0%) |  |
| MX | 8 | 0 (0.0%) |  |
| PN | 8 | 0 (0.0%) |  |
| KI | 8 | 0 (0.0%) |  |
| PI | 8 | 0 (0.0%) |  |
| FR | 7 | 0 (0.0%) |  |
| ZZ | 7 | 0 (0.0%) |  |
| AV | 7 | 0 (0.0%) |  |
| FP | 7 | 0 (0.0%) |  |
| ES | 6 | 0 (0.0%) |  |
| TI | 6 | 0 (0.0%) |  |
| DI | 6 | 0 (0.0%) |  |
| YO | 6 | 0 (0.0%) |  |
| BO | 5 | 0 (0.0%) |  |
| NU | 5 | 0 (0.0%) |  |
| PH | 5 | 0 (0.0%) |  |
| U. | 5 | 0 (0.0%) |  |
| KU | 5 | 0 (0.0%) |  |
| SN | 5 | 0 (0.0%) |  |
| TH | 5 | 0 (0.0%) |  |
| RM | 5 | 0 (0.0%) |  |
| NS | 4 | 0 (0.0%) |  |
| RL | 4 | 0 (0.0%) |  |
| UA | 4 | 0 (0.0%) |  |
| SP | 4 | 0 (0.0%) |  |
| EU | 4 | 0 (0.0%) |  |
| BU | 4 | 0 (0.0%) |  |
| OS | 4 | 0 (0.0%) |  |
| CR | 4 | 0 (0.0%) |  |
| SW | 4 | 0 (0.0%) |  |
| FU | 4 | 0 (0.0%) |  |
| RP | 4 | 0 (0.0%) |  |
| AU | 3 | 0 (0.0%) |  |
| MH | 3 | 1 (33.3%) |  |
| AF | 3 | 0 (0.0%) |  |
| AO | 3 | 0 (0.0%) |  |
| TU | 3 | 0 (0.0%) |  |
| FO | 3 | 0 (0.0%) |  |
| ZA | 3 | 0 (0.0%) |  |
| KR | 2 | 0 (0.0%) |  |
| CI | 2 | 0 (0.0%) |  |
| ZU | 2 | 0 (0.0%) |  |
| JO | 2 | 0 (0.0%) |  |
| -- | 2 | 0 (0.0%) |  |
| UK | 2 | 0 (0.0%) |  |
| NI | 2 | 0 (0.0%) |  |
| FI | 2 | 0 (0.0%) |  |
| SL | 2 | 0 (0.0%) |  |
| YU | 2 | 0 (0.0%) |  |
| OA | 2 | 0 (0.0%) |  |
| PY | 2 | 0 (0.0%) |  |
| KW | 2 | 0 (0.0%) |  |
| BI | 2 | 0 (0.0%) |  |
| IW | 2 | 0 (0.0%) |  |
| SU | 2 | 0 (0.0%) |  |
| NR | 2 | 0 (0.0%) |  |
| BW | 2 | 0 (0.0%) |  |
| RJ | 2 | 0 (0.0%) |  |
| GI | 2 | 0 (0.0%) |  |
| CL | 2 | 0 (0.0%) |  |
| OT | 2 | 0 (0.0%) |  |
| 20 | 1 | 0 (0.0%) |  |
| 22 | 1 | 0 (0.0%) |  |
| 29 | 1 | 0 (0.0%) |  |
| 32 | 1 | 0 (0.0%) |  |
| 65 | 1 | 0 (0.0%) |  |
| 70 | 1 | 0 (0.0%) |  |
| EL | 1 | 0 (0.0%) |  |
| IC | 1 | 0 (0.0%) |  |
| HY | 1 | 0 (0.0%) |  |
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
| EN | 1 | 0 (0.0%) |  |
| WC | 1 | 0 (0.0%) |  |
| LS | 1 | 0 (0.0%) |  |
| EO | 1 | 0 (0.0%) |  |
| EG | 1 | 0 (0.0%) |  |
| LU | 1 | 0 (0.0%) |  |
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
| (M | 1 | 0 (0.0%) |  |
| KH | 1 | 0 (0.0%) |  |
| GO | 1 | 0 (0.0%) |  |
| VR | 1 | 0 (0.0%) |  |
| IR | 1 | 0 (0.0%) |  |
| IB | 1 | 0 (0.0%) |  |
| PL | 1 | 0 (0.0%) |  |
| BR | 1 | 0 (0.0%) |  |
| SG | 1 | 0 (0.0%) |  |
| UP | 1 | 0 (0.0%) |  |
| OM | 1 | 0 (0.0%) |  |
| NP | 1 | 0 (0.0%) |  |
| UR | 1 | 0 (0.0%) |  |
| ? | 1 | 0 (0.0%) |  |
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
| FE | 1 | 0 (0.0%) |  |
| IO | 1 | 1 (100.0%) |  |
| DA | 1 | 0 (0.0%) |  |
| PE | 1 | 0 (0.0%) |  |

## Agreement with the Census

Of 3,000 listings the Census already placed exactly, NAD matched 1,507. Distance from the Census pin to the NAD point: median 73 m, 75th percentile 127 m, 90th percentile 213 m, 99th percentile 638 m; 30 more than 500 m apart.

## Examples (public listing addresses)

Another street at the same number:

- 103 CAMELIA ST NW, ROYAL CITY, WA 99357
- 15436 BEL-RED RD, REDMOND, WA 98052
- 9300 DEWITT LOOP, FORT BELVOIR, VA 22060
- 4249 N SAINT PETERS PKWY STE B, SAINT PETERS, MO 63304
- 1 VILLAGE SQ STE 7, HAZELWOOD, MO 63042
- 500 N KOBAYASHI STE A, WEBSTER, TX 77598
- 500 N KOBAYASHI STE A, WEBSTER, TX 77598
- 2435 VETERANS WAY, GREENWOOD, AR 72936
- 9300 DEWITT LOOP, FORT BELVOIR, VA 22060
- 1728 W MARINE VIEW DR STE 221, SEATTLE, WA 98134

Points far apart:

- 1201 S MILLER ST, WENATCHEE, WA 98801
- 2505 E MAIN APT A203, PUYALLUP, WA 98372
- 1201 S MILLER ST, WENATCHEE, WA 98801
- 1201 S MILLER ST, WENATCHEE, WA 98801
- 2451 UNIVERSITY HOSPITAL DR, MOBILE, AL 36617
- 1201 S MILLER ST, WENATCHEE, WA 98801
- 8901 ROCKVILLE PIKE, BETHESDA, MD 20889
- 8901 ROCKVILLE PIKE, BETHESDA, MD 20889
- 975 PORT WASHINGTON RD, GRAFTON, WI 53024
- 975 PORT WASHINGTON RD, GRAFTON, WI 53024
