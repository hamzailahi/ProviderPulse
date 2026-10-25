# Unmapped listings, 2026-10-25 (dry run: nothing written)

Listings with no coordinates are never drawn on a map. This pass places them only by an exact Census match in the same ZIP.

| Table | Without coordinates | With an address to try |
|---|---|---|
| clinics | 100 | 100 |
| provider_individuals | 763 | 763 |
| clinic_secondary_locations | 80 | 80 |

## Geocoding

| Table | Tried | Placed (exact) | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| provider_individuals | 258 | 42 | 216 | 0 |
| clinics | 23 | 8 | 15 | 0 |
| clinic_secondary_locations | 19 | 0 | 19 | 0 |

Census exact 50, Google 0 (off unless a key is passed); an address without an exact match keeps no coordinates.

Why the rest were not placed: no match 236, a fuzzy (non-exact) match 9, matched in another ZIP 0, several equal matches 5.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 6244 MS-305, OLIVE BRANCH, MS 38654 | 6244 HWY 305 N, OLIVE BRANCH, MS, 38654 |
| tie | 1201 BROAD ROCK BLVD, RICHMOND, VA 23249 |  |
| non_exact | 9200 UNIVERSITY BLVD, NORTH CHARLESTON, SC 29423 | 9200 UNIVERSITY BLVD, NORTH CHARLESTON, SC, 29406 |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| tie | 1201 BROAD BLVD, RICHMOND, VA 23249 |  |
| tie | 1155 UNIVERSITY BLVD, ALBUQUERQUE, NM 87131 |  |
| tie | 1201 BROAD ROCK BLVD, RICHMOND, VA 23249 |  |
| tie | 1201 BROAD ROCK BLVD, RICHMOND, VA 23249 |  |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |
| non_exact | 1031 RIVERSIDE DR I, FRANKLIN, TN, FRANKLIN, TN 37064 | 1031 RIVERSIDE DR, FRANKLIN, TN, 37064 |
| non_exact | 1155 LANERE DR, OLIVE BRANCH, MS 38654 | 1155 LANERE COVE, OLIVE BRANCH, MS, 38654 |
| non_exact | 110 S MAIN ST, BOILING SPRINGS, NC 28017 | 110 N MAIN ST, BOILING SPRINGS, NC, 28017 |

