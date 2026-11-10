# ArcGIS points, hospital distance check: dry_run

Run 2026-11-10 17:46 UTC by scripts/arcgis-anchor.sh. For points taken back on 2026-11-08 because their ZIP has no Census area: a point goes back on the map only when another listing at the same street address in the same ZIP already has a pin from another source (a point no other address shares) and the ArcGIS point is within 150 m of it. Dry run: rolled back, nothing written.

- Rows checked: 1326
- Pinned listings read in those ZIPs: 43212; addresses with a usable pin: 560
- Within 150 m of the pin at the same address: **155** (median 0 m)
- Not put back, no other pin at this address: 1116
- Not put back, over 150 m from the pin at the same address: 55

| ZIP | Rows | Within 150 m |
|---|---:|---:|
| 94143 | 323 | 21 |
| 06030 | 197 | 0 |
| 19718 | 178 | 0 |
| 61637 | 122 | 0 |
| 84148 | 67 | 0 |
| 11242 | 55 | 0 |
| 76019 | 44 | 42 |
| 48670 | 42 | 0 |
| 27710 | 34 | 3 |
| 06349 | 25 | 0 |
| 70827 | 20 | 0 |
| 37996 | 17 | 14 |
| 37236 | 15 | 0 |
| 15240 | 14 | 0 |
| 18711 | 11 | 11 |
| 84048 | 10 | 4 |
| 20993 | 9 | 0 |
| 32611 | 8 | 5 |
| 79430 | 8 | 0 |
| 18766 | 6 | 6 |
| 44195 | 6 | 0 |
| 65211 | 6 | 3 |
| 65212 | 6 | 0 |
| 38157 | 5 | 5 |
| 20374 | 4 | 0 |
| 68583 | 4 | 4 |
| 84132 | 4 | 0 |
| 95532 | 4 | 0 |
| 06504 | 4 | 4 |
| 23529 | 3 | 0 |
| 33082 | 3 | 0 |
| 38137 | 3 | 0 |
| 40506 | 3 | 3 |
| 50011 | 3 | 0 |
| 90714 | 3 | 3 |
| 15289 | 2 | 0 |
| 37235 | 2 | 2 |
| 48090 | 2 | 2 |
| 64160 | 2 | 0 |
| 68198 | 2 | 2 |
| 76508 | 2 | 0 |
| 80639 | 2 | 0 |
| 85288 | 2 | 0 |
| 91729 | 2 | 0 |
| 92152 | 2 | 0 |
| 97286 | 2 | 0 |
| 10122 | 1 | 0 |
| 10151 | 1 | 1 |
| 10155 | 1 | 0 |
| 11241 | 1 | 1 |
| 17932 | 1 | 1 |
| 20226 | 1 | 1 |
| 21282 | 1 | 1 |
| 33017 | 1 | 1 |
| 33195 | 1 | 0 |
| 33199 | 1 | 0 |
| 33320 | 1 | 1 |
| 33454 | 1 | 1 |
| 37240 | 1 | 0 |
| 40292 | 1 | 1 |
| 40621 | 1 | 0 |
| 52498 | 1 | 0 |
| 70150 | 1 | 1 |
| 75799 | 1 | 0 |
| 76300 | 1 | 0 |
| 80201 | 1 | 1 |
| 83724 | 1 | 0 |
| 84190 | 1 | 1 |
| 85372 | 1 | 1 |
| 88000 | 1 | 0 |
| 90406 | 1 | 1 |
| 92200 | 1 | 0 |
| 92615 | 1 | 1 |
| 92619 | 1 | 0 |
| 92623 | 1 | 1 |
| 92652 | 1 | 1 |
| 92654 | 1 | 1 |
| 92658 | 1 | 0 |
| 92781 | 1 | 1 |
| 92812 | 1 | 0 |
| 92842 | 1 | 1 |
| 92863 | 1 | 1 |
| 98393 | 1 | 0 |
| 00936 | 1 | 0 |

## Write


- Rows offered: 155
- Left out, more than 25 miles from the ZIP's centre: 0
- Left out, pinned or address changed since the export: 0
- clinic_secondary_locations=1
- clinics=10
- provider_individuals=144
- type PointAddress=145
- type Subaddress=10
- Rows that would be written: **155**
