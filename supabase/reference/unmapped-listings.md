# Unmapped listings, 2026-11-12

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 6025 | 6025 |
| provider_individuals | 39888 | 39888 |
| clinic_secondary_locations | 1147 | 1147 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 39,888 | 0 | 39,888 | 0 |
| clinics | 6,025 | 0 | 6,025 | 0 |
| clinic_secondary_locations | 1,147 | 0 | 1,147 | 0 |

Census exact 0, Census same address written another way 0 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 34,972, a fuzzy (non-exact) match 11,239, matched in another ZIP 0, several equal matches 849.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 156 EXT BETANCES SUITE 2, VEGA BAJA, PR 00693 | 156 CLL EXT BETANCES, VEGA BAJA, PR, 00693 |
| non_exact | 2960 AUBURN RD UNIT 215121, AUBURN HILLS, MI 48321 | 2960 AUBURN RD, AUBURN HILLS, MI, 48326 |
| non_exact | 4800 COLLINS RD UNIT 22062, LANSING, MI 48924 | 4800 COLLINS RD, LANSING, MI, 48910 |
| non_exact | 1200 N STATE ST STE A7D, LOS ANGELES, CA 90089 | 1200 N STATE ST, LOS ANGELES, CA, 90033 |
| non_exact | 15601 SH 71 WEST STE 200, AUSTIN, TX 78738 | 15601 W HWY 71, AUSTIN, TX, 78738 |
| tie | 1713 6TH AVE S, BIRMINGHAM, AL 35294 |  |
| non_exact | 3869 MIRAMAR ST # 2208, LA JOLLA, CA 92092 | 3869 MIRAMAR ST, LA JOLLA, CA, 92037 |
| non_exact | 2085 A1A S STE 206, ST AUGUSTINE BEACH, FL 32080 | 2085 STATE RD A1A, ST AUGUSTINE BEACH, FL, 32080 |
| non_exact | 1750 W OGDEN AVE UNIT 2332, NAPERVILLE, IL 60567 | 1750 W OGDEN AVE, NAPERVILLE, IL, 60540 |
| non_exact | 400 HARBORSIDE DR, GALVESTON, TX 77555 | 400 HARBORSIDE DR, GALVESTON, TX, 77550 |
| non_exact | 200 UCLA MEDICAL PLZ STE 440, LOS ANGELES, CA 90095 | 200 MEDICAL PLZ, LOS ANGELES, CA, 90095 |
| non_exact | 16350 BRUCE B DOWNS BLVD # 44654, TAMPA, FL 33646 | 16350 BRUCE B DOWNS BLVD, TAMPA, FL, 33647 |

Written: nothing to write
