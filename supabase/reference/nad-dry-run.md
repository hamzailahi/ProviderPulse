# National Address Database: dry run

Run 2026-11-06 16:35 UTC by scripts/nad-dry-run.sh. Nothing was written to the database.

Rule: the same ZIP, the same house number, and the same street or one of the placement job's one-word differences (scripts/lib/nad-match.mjs). Several matching points count as one place only within 100 m of each other.

NAD file: NAD_r24.txt from https://data.transportation.gov/download/fc2s-wawr/application/x-zip-compressed (8477543836 bytes zipped)

## Listings with no pin

- Listings tried: **107,340**
- Would be placed: **8,020** (7.5%), of which 7,977 are in states USDOT marks partly not public domain (CO, IL, KS, MD, MN, ND, SC, SD); their sources need checking before an apply
- An apply may write: **7,789** (wholly public states, plus 7,747 in public counties of partly public states)
- In partly public states but not applied: 230 (county not public domain or split, 0 with no single NAD county)
- Matched but left out, because the state is not public domain in the NAD (HI, MI, NH, OR): 1,237
- Several matching points far apart (left unplaced): 2,243
- NAD has this house number in the ZIP, but on another street: 18,052
- NAD has nothing at this house number in the ZIP: 60,776
- The address has no house number (PO box, building name): 17,012

| Table | Tried | Would be placed |
|---|---|---|
| clinic_secondary_locations | 80 | 0 (0.0%) |
| provider_individuals | 91,248 | 6,614 (7.2%) |
| clinics | 16,012 | 1,406 (8.8%) |

How NAD placed the points it matched (its own `Placement` field):

| Placement | Listings |
|---|---|
| Unknown | 5,926 |
| Structure - Rooftop | 1,212 |
| Parcel - Other | 751 |
| Structure - Rooftop; Structure - Interior | 46 |
| Structure - Interior | 29 |
| Structure - Entrance | 24 |
| Unknown; Parcel - Other | 9 |
| Property Access | 5 |
| Site | 4 |
| Other | 3 |
| Linear Geocode | 3 |
| Structure - Interior; Structure - Rooftop | 3 |
| Structure - Entrance; Structure - Rooftop | 1 |
| Other; Parcel - Other | 1 |
| Parcel - Other; Structure - Rooftop | 1 |
| Parcel - Centroid | 1 |
| Structure - Rooftop; Parcel - Other | 1 |

## Partly public states by county check

| State | Matched | In public counties |
|---|---|---|
| IL | 2,054 | 2,054 |
| MN | 1,870 | 1,870 |
| MD | 1,840 | 1,670 |
| CO | 1,098 | 1,098 |
| KS | 557 | 557 |
| ND | 408 | 408 |
| SC | 89 | 89 |
| SD | 61 | 1 |

## By state (most unplaced first)

| State | Unplaced | Would be placed | Note |
|---|---|---|---|
| CA | 13,897 | 0 (0.0%) |  |
| FL | 8,482 | 0 (0.0%) |  |
| TX | 7,454 | 0 (0.0%) |  |
| GA | 4,150 | 0 (0.0%) |  |
| IL | 4,146 | 2,054 (49.5%) | partly not public domain |
| PA | 3,621 | 0 (0.0%) |  |
| MI | 3,565 | 2 (0.1%) | not public domain: skipped |
| AE | 3,444 | 0 (0.0%) |  |
| PR | 3,239 | 0 (0.0%) |  |
| MN | 3,225 | 1,870 (58.0%) | partly not public domain |
| MD | 2,904 | 1,840 (63.4%) | partly not public domain |
| NY | 2,903 | 0 (0.0%) |  |
| AP | 2,595 | 0 (0.0%) |  |
| NC | 2,535 | 0 (0.0%) |  |
| CO | 2,473 | 1,098 (44.4%) | partly not public domain |
| MO | 1,907 | 0 (0.0%) |  |
| SC | 1,883 | 89 (4.7%) | partly not public domain |
| OH | 1,550 | 0 (0.0%) |  |
| OR | 1,547 | 1,235 (79.8%) | not public domain: skipped |
| NJ | 1,518 | 0 (0.0%) |  |
| KY | 1,474 | 0 (0.0%) |  |
| LA | 1,307 | 0 (0.0%) |  |
| VI | 1,218 | 0 (0.0%) |  |
| VA | 1,177 | 0 (0.0%) |  |
| AL | 1,171 | 0 (0.0%) |  |
| WV | 1,118 | 0 (0.0%) |  |
| OK | 1,115 | 0 (0.0%) |  |
| NM | 1,056 | 1 (0.1%) |  |
| MA | 1,049 | 0 (0.0%) |  |
| NV | 1,026 | 0 (0.0%) |  |
| MS | 1,025 | 0 (0.0%) |  |
| NE | 1,008 | 0 (0.0%) |  |
| GU | 1,001 | 0 (0.0%) |  |
| WA | 985 | 1 (0.1%) |  |
| KS | 969 | 557 (57.5%) | partly not public domain |
| ID | 941 | 0 (0.0%) |  |
| IN | 877 | 0 (0.0%) |  |
| WI | 874 | 0 (0.0%) |  |
| BA | 824 | 0 (0.0%) |  |
| TN | 788 | 0 (0.0%) |  |
| UT | 758 | 1 (0.1%) |  |
| AZ | 745 | 5 (0.7%) |  |
| CT | 718 | 0 (0.0%) |  |
| NH | 682 | 0 (0.0%) | not public domain: skipped |
| ND | 550 | 408 (74.2%) | partly not public domain |
| AR | 533 | 0 (0.0%) |  |
| AA | 400 | 0 (0.0%) |  |
| HI | 348 | 0 (0.0%) | not public domain: skipped |
| MP | 324 | 0 (0.0%) |  |
| PU | 323 | 0 (0.0%) |  |
| DE | 305 | 0 (0.0%) |  |
| SD | 259 | 61 (23.6%) | partly not public domain |
| AS | 234 | 0 (0.0%) |  |
| AK | 230 | 32 (13.9%) |  |
| IA | 197 | 0 (0.0%) |  |
| RI | 177 | 0 (0.0%) |  |
| CH | 170 | 0 (0.0%) |  |
| WY | 160 | 2 (1.3%) |  |
| DC | 157 | 0 (0.0%) |  |
| ME | 152 | 0 (0.0%) |  |
| MT | 142 | 0 (0.0%) |  |
| BC | 140 | 0 (0.0%) |  |
| RH | 79 | 0 (0.0%) |  |
| JA | 76 | 0 (0.0%) |  |
| SO | 75 | 0 (0.0%) |  |
| GE | 74 | 0 (0.0%) |  |
| CE | 74 | 0 (0.0%) |  |
| VT | 69 | 0 (0.0%) |  |
| TA | 64 | 0 (0.0%) |  |
| IS | 57 | 0 (0.0%) |  |
| SA | 51 | 0 (0.0%) |  |
| SI | 45 | 0 (0.0%) |  |
| KA | 44 | 0 (0.0%) |  |
| AM | 36 | 0 (0.0%) |  |
| HE | 28 | 0 (0.0%) |  |
| YA | 26 | 0 (0.0%) |  |
| BE | 25 | 0 (0.0%) |  |
| NA | 25 | 0 (0.0%) |  |
| TE | 24 | 0 (0.0%) |  |
| QU | 24 | 0 (0.0%) |  |
| SE | 22 | 0 (0.0%) |  |
| NO | 19 | 0 (0.0%) |  |
| GY | 19 | 0 (0.0%) |  |
| TO | 19 | 0 (0.0%) |  |
| HA | 17 | 0 (0.0%) |  |
| B. | 17 | 0 (0.0%) |  |
| SH | 16 | 0 (0.0%) |  |
| US | 15 | 0 (0.0%) |  |
| ST | 14 | 0 (0.0%) |  |
| DO | 13 | 0 (0.0%) |  |
| EA | 13 | 0 (0.0%) |  |
| JE | 12 | 0 (0.0%) |  |
| RE | 12 | 0 (0.0%) |  |
| N/ | 11 | 1 (9.1%) |  |
| FM | 11 | 0 (0.0%) |  |
| KO | 11 | 0 (0.0%) |  |
| UN | 11 | 0 (0.0%) |  |
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
| VE | 8 | 0 (0.0%) |  |
| P. | 8 | 0 (0.0%) |  |
| KE | 8 | 0 (0.0%) |  |
| MX | 8 | 0 (0.0%) |  |
| PN | 8 | 0 (0.0%) |  |
| KI | 8 | 0 (0.0%) |  |
| PI | 8 | 0 (0.0%) |  |
| FR | 7 | 0 (0.0%) |  |
| ZZ | 7 | 0 (0.0%) |  |
| AV | 7 | 0 (0.0%) |  |
| RO | 7 | 0 (0.0%) |  |
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
| LO | 4 | 0 (0.0%) |  |
| EU | 4 | 0 (0.0%) |  |
| BU | 4 | 0 (0.0%) |  |
| OS | 4 | 0 (0.0%) |  |
| CR | 4 | 0 (0.0%) |  |
| SW | 4 | 0 (0.0%) |  |
| FU | 4 | 0 (0.0%) |  |
| RP | 4 | 0 (0.0%) |  |
| AU | 3 | 0 (0.0%) |  |
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
| MH | 2 | 0 (0.0%) |  |
| FI | 2 | 0 (0.0%) |  |
| SL | 2 | 0 (0.0%) |  |
| YU | 2 | 0 (0.0%) |  |
| OA | 2 | 0 (0.0%) |  |
| PY | 2 | 0 (0.0%) |  |
| BI | 2 | 0 (0.0%) |  |
| KW | 2 | 0 (0.0%) |  |
| IW | 2 | 0 (0.0%) |  |
| SU | 2 | 0 (0.0%) |  |
| NR | 2 | 0 (0.0%) |  |
| RJ | 2 | 0 (0.0%) |  |
| BW | 2 | 0 (0.0%) |  |
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
| CN | 1 | 0 (0.0%) |  |
| LU | 1 | 0 (0.0%) |  |
| JP | 1 | 0 (0.0%) |  |
| LB | 1 | 0 (0.0%) |  |
| ER | 1 | 0 (0.0%) |  |
| A. | 1 | 0 (0.0%) |  |
| GT | 1 | 0 (0.0%) |  |
| AH | 1 | 0 (0.0%) |  |
| ON | 1 | 0 (0.0%) |  |
| RS | 1 | 0 (0.0%) |  |
| XI | 1 | 0 (0.0%) |  |
| D. | 1 | 0 (0.0%) |  |
| S | 1 | 0 (0.0%) |  |
| DH | 1 | 0 (0.0%) |  |
| EH | 1 | 0 (0.0%) |  |
| VO | 1 | 0 (0.0%) |  |
| (M | 1 | 0 (0.0%) |  |
| KH | 1 | 0 (0.0%) |  |
| VR | 1 | 0 (0.0%) |  |
| GO | 1 | 0 (0.0%) |  |
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
| DA | 1 | 0 (0.0%) |  |
| PE | 1 | 0 (0.0%) |  |

## Agreement with the Census

Of 3,000 listings the Census already placed exactly, NAD matched 1,516. Distance from the Census pin to the NAD point: median 66 m, 75th percentile 120 m, 90th percentile 209 m, 99th percentile 537 m; 18 more than 500 m apart.

## Examples (public listing addresses)

Another street at the same number:

- 15436 BEL-RED RD, REDMOND, WA 98052
- 9300 DEWITT LOOP, FORT BELVOIR, VA 22060
- 4249 N SAINT PETERS PKWY STE B, SAINT PETERS, MO 63304
- 1 VILLAGE SQ STE 7, HAZELWOOD, MO 63042
- 500 N KOBAYASHI STE A, WEBSTER, TX 77598
- 500 N KOBAYASHI STE A, WEBSTER, TX 77598
- 2435 VETERANS WAY, GREENWOOD, AR 72936
- 9300 DEWITT LOOP, FORT BELVOIR, VA 22060
- 1728 W MARINE VIEW DR STE 221, SEATTLE, WA 98134
- 12834 OLD U.S. 169, OOLOGAH, OK 74053

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
