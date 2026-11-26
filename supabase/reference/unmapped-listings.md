# Unmapped listings, 2026-11-26

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 7176 | 7176 |
| provider_individuals | 58051 | 58051 |
| clinic_secondary_locations | 1999 | 1999 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 51,782 | 112 | 51,670 | 0 |
| clinic_secondary_locations | 1,813 | 10 | 1,803 | 0 |
| clinics | 6,405 | 46 | 6,359 | 0 |

Census exact 159, Census same address written another way 9 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 42,022, a fuzzy (non-exact) match 16,444, matched in another ZIP 0, several equal matches 1,366.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 4821 BUTLER RD STE 2A, GLYNDON, MD 21136 | 4821 BUTLER RD, GLYNDON, MD, 21071 |
| non_exact | 1415 W OAK ST UNIT 421407, KISSIMMEE, FL 34742 | 1415 W OAK ST, KISSIMMEE, FL, 34741 |
| non_exact | 530 NE GLEN OAK AVE, PEORIA, IL 61637 | 530 NE GLEN OAK AVE, PEORIA, IL, 61603 |
| non_exact | 759 CHESTNUT ST, SPRINGFIELD, MA 01199 | 759 CHESTNUT ST, SPRINGFIELD, MA, 01107 |
| non_exact | 6431 FANNIN ST STE JJL 308S, HOUSTON, TX 77030 | 6431 FANNIN ST, HOUSTON, TX, 77030 |
| non_exact | 2730 S MOODY AVE, PORTLAND, OR 97201 | 2730 SW MOODY AVE, PORTLAND, OR, 97201 |
| non_exact | 1850 E 250 S, SALT LAKE CITY, UT 84112 | 250 S 1850 E, SALT LAKE CITY, UT, 84112 |
| non_exact | 316 HADDON AVENUE, COLLINGSWOOD, NJ 80108 | 316 HADDON AVE, COLLINGSWOOD, NJ, 08108 |
| non_exact | 83 W MILLER ST, ORLANDO, FL 32806 | 83 W MILLER AVE, ORLANDO, FL, 32806 |
| non_exact | 1000 S CLEVELAND MASSILLON RD STE 1, FAIRLAWN, OH 44333 | 1000 N CLEVELAND MASSILLON RD, FAIRLAWN, OH, 44333 |
| non_exact | 7501 RIVERSIDE PKWY, TULSA, OK 74136 | 7501 RIVERSIDE DR, TULSA, OK, 74136 |
| non_exact | 4401 CRENSHAW BLVD. SITE 215, LOS ANGELES, CA 90043 | 4401 S CRENSHAW BLVD, LOS ANGELES, CA, 90043 |

Written: clinics=46 provider_individuals=112 clinic_secondary_locations=10 
