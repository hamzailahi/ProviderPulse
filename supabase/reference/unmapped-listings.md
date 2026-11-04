# Unmapped listings, 2026-11-04

Listings with no coordinates are never drawn on a map. This pass places them only by an exact Census match in the same ZIP.

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 27262 | 27262 |
| provider_individuals | 142549 | 142549 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed (exact) | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 50,234 | 18 | 50,216 | 0 |
| clinics | 9,733 | 13 | 9,720 | 0 |
| clinic_secondary_locations | 33 | 0 | 33 | 0 |

Census exact 31, Google 0 (off unless a key is passed); an address without an exact match keeps no coordinates.

Why the rest were not placed: no match 28,859, a fuzzy (non-exact) match 29,908, matched in another ZIP 0, several equal matches 1,202.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 1325 N LITCHFIELD RD STE 130, GOODYEAR, AZ 85395 | 1325 N LITCHFIELD RD, GOODYEAR, AZ, 85338 |
| non_exact | 331 W HARWOOD RD STE A, HURST, TX 76054 | 331 W HARWOOD RD, HURST, TX, 76054 |
| non_exact | 2853 CANDLER RD SIDE, DECATUR, GA 30037 | 2853 CANDLER RD, DECATUR, GA, 30034 |
| non_exact | 1225 W GUADALUPE RD # ED, MESA, AZ 85202 | 1225 W GUADALUPE RD, MESA, AZ, 85202 |
| non_exact | 225 PRINCE COLLINS ST, HOUMA, LA 70364 | 225 PRINCE COLLINS AVE, HOUMA, LA, 70364 |
| tie | 3450 CENTRE LAKE DR, ONTARIO, CA 91761 |  |
| non_exact | 517 OAK ST STE B, COPIAGUE, NY 11726 | 517 OAK ST, COPIAGUE, NY, 11726 |
| non_exact | 909 NE INTERSTATE 410 LOOP, SAN ANTONIO, TX 78209 | 909 NE LOOP 410, SAN ANTONIO, TX, 78209 |
| non_exact | 500 MEMORIAL CIR STE C, ORMOND BEACH, FL 32174 | 500 MEMORIAL CIR, ORMOND BEACH, FL, 32174 |
| tie | 254 COHASSET RD # 100, CHICO, CA 95926 |  |
| non_exact | 759 CHESTNUT ST, SPRINGFIELD, MA 01199 | 759 CHESTNUT ST, SPRINGFIELD, MA, 01107 |
| non_exact | 500 E VETERANS ST, TOMAH, WI 54660 | 500 W VETERANS ST, TOMAH, WI, 54660 |

Written: clinics=13 provider_individuals=18 clinic_secondary_locations=0 
