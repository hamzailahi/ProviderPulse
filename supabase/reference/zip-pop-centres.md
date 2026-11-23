# Population-weighted ZIP centres

Run 2026-11-23 (apply) by scripts/zip-pop-centres.sh.

Each ZIP's point is the mean of its 2020 Census blocks' internal points weighted by block population. The drive-time job starts trips here instead of at the middle of the ZIP's shape (CDC PLACES centroid or Census Gazetteer point, `zip_geo`).

- ZCTAs built: 33,774; with a `zip_geo` point to compare: 33,295; in `zip_geo` with no block centre: 0
- How far the start point moves: median 0.92 mi, 90th percentile 3.62 mi, 99th 12.24 mi, largest 276.9 mi

## Largest moves

| ZIP | Miles moved | Population | Blocks |
|---|---|---|---|
| 99503 | 276.9 | 13,550 | 257 |
| 99701 | 183.6 | 18,357 | 688 |
| 99557 | 127.8 | 698 | 82 |
| 83611 | 76.2 | 2,596 | 765 |
| 99740 | 75.5 | 428 | 91 |
| 99574 | 73.4 | 2,691 | 368 |
| 99768 | 65.3 | 148 | 39 |
| 93042 | 63.4 | 17 | 40 |
| 99640 | 57.0 | 122 | 19 |
| 99588 | 53.4 | 815 | 111 |
| 99780 | 53.4 | 1,516 | 163 |
| 83716 | 52.0 | 21,583 | 750 |
| 99627 | 51.8 | 305 | 53 |
| 83539 | 50.7 | 1,835 | 308 |
| 99738 | 50.3 | 172 | 91 |
| 89049 | 48.5 | 2,499 | 316 |
| 99712 | 47.6 | 13,309 | 433 |
| 99752 | 46.1 | 3,276 | 173 |
| 89406 | 46.0 | 25,204 | 1126 |
| 99613 | 44.5 | 375 | 73 |
| 99737 | 42.6 | 4,808 | 342 |
| 99827 | 38.2 | 2,165 | 170 |
| 97721 | 36.7 | 217 | 182 |
| 99615 | 36.0 | 12,495 | 378 |
| 79843 | 35.6 | 2,275 | 611 |
- Loaded into `zip_pop_centres`: 33774 rows.
