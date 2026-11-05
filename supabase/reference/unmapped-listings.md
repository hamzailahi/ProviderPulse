# Unmapped listings, 2026-11-05

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 22079 | 22079 |
| provider_individuals | 122737 | 122737 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 51,433 | 885 | 50,548 | 0 |
| clinics | 8,525 | 200 | 8,325 | 0 |
| clinic_secondary_locations | 42 | 0 | 42 | 0 |

Census exact 613, Census same address written another way 472 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 41,053, a fuzzy (non-exact) match 16,211, matched in another ZIP 0, several equal matches 1,651.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 1325 N LITCHFIELD RD STE 130, GOODYEAR, AZ 85395 | 1325 N LITCHFIELD RD, GOODYEAR, AZ, 85338 |
| non_exact | 2853 CANDLER RD SIDE, DECATUR, GA 30037 | 2853 CANDLER RD, DECATUR, GA, 30034 |
| non_exact | 225 PRINCE COLLINS ST, HOUMA, LA 70364 | 225 PRINCE COLLINS AVE, HOUMA, LA, 70364 |
| tie | 3450 CENTRE LAKE DR, ONTARIO, CA 91761 |  |
| non_exact | 909 NE INTERSTATE 410 LOOP, SAN ANTONIO, TX 78209 | 909 NE LOOP 410, SAN ANTONIO, TX, 78209 |
| tie | 254 COHASSET RD # 100, CHICO, CA 95926 |  |
| non_exact | 759 CHESTNUT ST, SPRINGFIELD, MA 01199 | 759 CHESTNUT ST, SPRINGFIELD, MA, 01107 |
| non_exact | 500 E VETERANS ST, TOMAH, WI 54660 | 500 W VETERANS ST, TOMAH, WI, 54660 |
| non_exact | 229 S DAVID RD STE 900, LAGRANGE, GA 30241 | 229 S DAVIS RD, LAGRANGE, GA, 30241 |
| non_exact | 219 PARKWAY DR, WHEATON, IL 60187 | 219 E PARKWAY DR, WHEATON, IL, 60187 |
| non_exact | 10753 FALLS RD PAVILION II STE 145, LUTHERVILLE, MD 21093 | 10753 FALLS RD, LUTHERVILLE, MD, 21093 |
| non_exact | 202 INDUSTRIAL PARK, JACKSON, MN 56143 | 202 INDUSTRIAL PKWY, JACKSON, MN, 56143 |

Written: clinics=200 provider_individuals=885 clinic_secondary_locations=0 
