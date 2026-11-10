# Unmapped listings, 2026-11-10

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 6149 | 6149 |
| provider_individuals | 39874 | 39874 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 39,874 | 1,741 | 38,133 | 0 |
| clinics | 6,149 | 489 | 5,660 | 0 |
| clinic_secondary_locations | 80 | 0 | 80 | 0 |

Census exact 1,035, Census same address written another way 1,195 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 32,757, a fuzzy (non-exact) match 10,362, matched in another ZIP 0, several equal matches 754.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 500 FOOTHILL BLVD BLDG 16, SALT LAKE CITY, UT 84148 | 500 FOOTHILL DR, SALT LAKE CITY, UT, 84113 |
| non_exact | 950 W 52ND AVE CT F2, GREELEY, CO 80634 | 950 52ND AVE CT, GREELEY, CO, 80634 |
| tie | 1 MAPLE COMMONS DR STE 110, SARATOGA SPRINGS, NY 12866 |  |
| non_exact | 506 LENOX AVENUE-HARLEM HOSPITAL CENTRE, NEW YORK, NY 10037 | 506 LENOX AVE, NEW YORK, NY, 10037 |
| non_exact | 20 S. SPRING STREET, CAPE GIRARDEAU, MO 63703 | 20 S SPRIGG ST, CAPE GIRARDEAU, MO, 63703 |
| non_exact | 1001 COVINGTON ST, ST ELIZABETH INTERNAL MEDICINE, YOUNGSTOWN, OH 44510 | 1001 COVINGTON ST, YOUNGSTOWN, OH, 44510 |
| non_exact | 6 CHATEAU LN, BARBOURSVILLE, WV 25504 | 6 CHATEAU GROVE LN, BARBOURSVILLE, WV, 25504 |
| non_exact | 300 UCLA MEDICAL PLZ STE 2200, LOS ANGELES, CA 90095 | 300 MEDICAL PLZ, LOS ANGELES, CA, 90095 |
| non_exact | 2216 NC E HWY 54, DURHAM, NC 27713 | 2216 E STATE HWY 54, DURHAM, NC, 27713 |
| non_exact | 2335 COUNTY HILLS DR., ANTIOCH, CA 94509 | 2335 COUNTRY HILLS DR, ANTIOCH, CA, 94509 |
| non_exact | 10460 W FON DU LAC, MILWAUKEE, WI 53224 | 10460 W FOND DU LAC AVE, MILWAUKEE, WI, 53224 |
| non_exact | 304 SOUTHBRIDGE BLVD., S. CHARLESTON, WV 25309 | 304 SOUTHRIDGE BLVD, S CHARLESTON, WV, 25309 |

Written: clinics=489 provider_individuals=1741 clinic_secondary_locations=0 
