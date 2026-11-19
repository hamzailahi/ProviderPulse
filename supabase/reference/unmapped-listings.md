# Unmapped listings, 2026-11-19

Listings with no coordinates are never drawn on a map. This pass places them only by a Census match of the same house number and street in the same ZIP: exact, or written another way (a direction word, an ordinal, a state route, a space).

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 6435 | 6435 |
| provider_individuals | 41781 | 41781 |
| clinic_secondary_locations | 2416 | 2416 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 41,781 | 0 | 41,781 | 0 |
| clinics | 6,435 | 2 | 6,433 | 0 |
| clinic_secondary_locations | 2,416 | 0 | 2,416 | 0 |

Census exact 2, Census same address written another way 0 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 37,452, a fuzzy (non-exact) match 12,186, matched in another ZIP 0, several equal matches 992.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 1713-19 RALPH AVENUE, BROOKLYN, NY 11236 | 1713 RALPH AVE, BROOKLYN, NY, 11236 |
| non_exact | 1903 W MICHIGAN AVE, KALAMAZOO, MI 49008 | 1903 W MICHIGAN AVE, KALAMAZOO, MI, 49006 |
| non_exact | 1736 WESTPARK CTR DR, FENTON, MO 63026 | 1736 W PARK CTR DR, FENTON, MO, 63026 |
| non_exact | 90 S MAPLE ST, AKRON, OH 44302 | 90 S MAPLE ST, AKRON, OH, 44303 |
| non_exact | 530 NE GLEN OAK AVE, PEORIA, IL 61637 | 530 NE GLEN OAK AVE, PEORIA, IL, 61603 |
| non_exact | 1959 NE PACIFIC ST MAIN HOSPITAL, SEATTLE, WA 98195 | 1959 NE PACIFIC ST, SEATTLE, WA, 98195 |
| non_exact | 22811 GREATER MACK, ST. CLAIRE SHORES, MI 48080 | 22811 GREATER MACK AVE, SAINT CLAIR SHORES, MI, 48080 |
| non_exact | 4755 OGLETOWN STANTON RD, NEWARK, DE 19718 | 4755 OGLETOWN STANTON RD, NEWARK, DE, 19713 |
| non_exact | 17335 PAGONIA DR, CLERMONT, FL 34711 | 17335 PAGONIA RD, CLERMONT, FL, 34711 |
| non_exact | 464099 SR-200 W STE 2, YULEE, FL 32097 | 464099 STATE RD 200, YULEE, FL, 32097 |
| non_exact | 1083 Bloom Rd, Danville, PA 17821 | 1083 BLOOM ST, DANVILLE, PA, 17821 |
| non_exact | UW HOSPITALS & CLINICS 600 HIGHLAND AVENUE, MADISON, WI 53792 | 600 HIGHLAND AVE, MADISON, WI, 53792 |

Written: clinics=2 provider_individuals=0 clinic_secondary_locations=0 
