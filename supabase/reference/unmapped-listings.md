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

