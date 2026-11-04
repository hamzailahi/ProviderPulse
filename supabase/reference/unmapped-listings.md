# Unmapped listings, 2026-11-04

Listings with no coordinates are never drawn on a map. This pass places them only by an exact Census match in the same ZIP.

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 27249 | 27249 |
| provider_individuals | 142531 | 142531 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed (exact) | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 50,244 | 7,654 | 42,590 | 0 |
| clinics | 9,723 | 2,342 | 7,381 | 0 |
| clinic_secondary_locations | 33 | 0 | 33 | 0 |

Census exact 9,996, Google 0 (off unless a key is passed); an address without an exact match keeps no coordinates.

Why the rest were not placed: no match 28,950, a fuzzy (non-exact) match 19,874, matched in another ZIP 0, several equal matches 1,180.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 9330 FL-54, TRINITY, FL 34655 | 9330 STATE RD 54, TRINITY, FL, 34655 |
| non_exact | 710 N TURNER AVE, HASTINGS, NE 68901 | 710 TURNER AVE, HASTINGS, NE, 68901 |
| non_exact | 510 UPPER CHESAPEKE DR PAVILLION III, BEL AIR, MD 21014 | 510 UPPER CHESAPEAKE DR, BEL AIR, MD, 21014 |
| non_exact | 175 WESTFIELD BLVD STE 120, TEMPLE, TX 76502 | 175 WESTFIELD, TEMPLE, TX, 76502 |
| non_exact | 1 GUSTAVE LEVY PLACE, BOX 1149, NEW YORK, NY 10029 | 1 GUSTAVE L LEVY PL, NEW YORK, NY, 10029 |
| tie | 538 MAIN STREET, CAMBRIDGE, MN 55008 |  |
| non_exact | 273 NEW CREEK HWY, KEYSER, WV 26726 | 273 NEW CREEK DR, KEYSER, WV, 26726 |
| non_exact | 575 N SIOUX POINT ROAD, DAKOTA DUNES, SD 57049 | 575 SIOUX POINT RD, DAKOTA DUNES, SD, 57049 |
| non_exact | 5165 S STATE ROAD 7, LAKE WORTH, FL 33449 | 5165 STATE HWY 7, LAKE WORTH, FL, 33449 |
| non_exact | 111 E 210 ST, NEW YORK, NY 10467 | 111 E 210TH ST, BRONX, NY, 10467 |
| non_exact | 99 ROUTE 37 W, TOMS RIVER, NJ 08755 | 99 STATE RTE 37, TOMS RIVER, NJ, 08755 |
| non_exact | 8880 BASE LINE RD, RANCHO CUCAMONGA, CA 91701 | 8880 BASELINE RD, RANCHO CUCAMONGA, CA, 91701 |

Written: clinics=2342 provider_individuals=7654 clinic_secondary_locations=0 
