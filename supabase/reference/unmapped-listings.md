# Unmapped listings, 2026-10-29

Listings with no coordinates are never drawn on a map. This pass places them only by an exact Census match in the same ZIP.

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 123 | 123 |
| provider_individuals | 786 | 786 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed (exact) | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 786 | 155 | 631 | 0 |
| clinics | 123 | 59 | 64 | 0 |
| clinic_secondary_locations | 80 | 0 | 80 | 0 |

Census exact 214, Google 0 (off unless a key is passed); an address without an exact match keeps no coordinates.

Why the rest were not placed: no match 716, a fuzzy (non-exact) match 30, matched in another ZIP 0, several equal matches 29.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| tie | 675 18TH STREET, SAN FRANCISCO, CA 94143 |  |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| tie | 1201 BROAD ROCK BLVD, RICHMOND, VA 23249 |  |
| tie | 1201 BROAD ROCK BLVD, RICHMOND, VA 23249 |  |
| tie | 675 18TH ST, SAN FRANCISCO, CA 94143 |  |
| non_exact | 3615 S HOUSTON LEVEE RD STE 110, COLLIERVILLE, TN 38017 | 3615 HOUSTON LEVEE RD, COLLIERVILLE, TN, 38017 |
| non_exact | 440 W US HIGHWAY 72 STE 2, COLLIERVILLE, TN 38017 | 440 US HWY 72, COLLIERVILLE, TN, 38017 |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| non_exact | 1304 N WASHINGTON ST, Coatopa, AL 35470, COATOPA, AL 35470 | 1304 N WASHINGTON ST, COATOPA, AL, 35470 |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| non_exact | 1155 LANERE DR, OLIVE BRANCH, MS 38654 | 1155 LANERE COVE, OLIVE BRANCH, MS, 38654 |

Written: clinics=59 provider_individuals=155 clinic_secondary_locations=0 
