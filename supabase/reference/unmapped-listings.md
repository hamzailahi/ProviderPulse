# Unmapped listings, 2026-11-04

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 24907 | 24907 |
| provider_individuals | 134877 | 134877 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 51,030 | 9,347 | 41,683 | 0 |
| clinics | 8,934 | 2,087 | 6,847 | 0 |
| clinic_secondary_locations | 36 | 0 | 36 | 0 |

Census exact 1,664, Census same address written another way 9,770 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 33,809, a fuzzy (non-exact) match 13,380, matched in another ZIP 0, several equal matches 1,377.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 747 N LA SALLE DR STE 700, CHICAGO, IL 60654 | 747 N LASALLE ST, CHICAGO, IL, 60654 |
| non_exact | 780 ROSE ST, LEXINGTON, KY 40536 | 780 ROSE ST, LEXINGTON, KY, 40506 |
| non_exact | 4701 TROUSDALE DR STE 211A, NASHVILLE, TN 37220 | 4701 TROUSDALE DR, NASHVILLE, TN, 37211 |
| non_exact | 13544 HIGHWAY 43 N UNIT 3, NORTHPORT, AL 35475 | 13544 US HWY 43, NORTHPORT, AL, 35475 |
| non_exact | 504 SNAKE RIVER DR. B1, ALPINE, WY 83128 | 504 SNAKE RIVER DR, ALPINE, WY, 83128 |
| non_exact | 909 FULTON ST SE, MINNEAPOLIS, MN 55455 | 909 FULTON ST SE, MINNEAPOLIS, MN, 55414 |
| non_exact | 800 LAKESHORE DR, BIRMINGHAM, AL 35229 | 800 LAKESHORE DR, BIRMINGHAM, AL, 35209 |
| tie | 1 PARK ST, NEW HAVEN, CT 06504 |  |
| non_exact | 500 VILAGE SQUARE CROSSING, PALM BEACH GARDENS, FL 33410 | 500 VILLAGE SQUARE CROSSING, PALM BEACH GARDENS, FL, 33410 |
| non_exact | 80 SEYMOUR ST, HARTFORD, CT 06102 | 80 SEYMOUR ST, HARTFORD, CT, 06106 |
| non_exact | 16114 NC HIGHWAY 50 N, GARNER, NC 27529 | 16114 STATE HWY 50, GARNER, NC, 27529 |
| non_exact | 1045 12TH AVE, EAST MOLINE, IL 61244 | 1045 12TH AVE, MOLINE, IL, 61265 |

Written: clinics=2087 provider_individuals=9347 clinic_secondary_locations=0 
