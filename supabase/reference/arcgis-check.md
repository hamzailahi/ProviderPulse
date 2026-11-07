# ArcGIS points: accuracy check

Run 2026-11-07 20:19 UTC by scripts/arcgis-check.py. Read only; nothing was written.

Points checked: 71,085 (the user's ArcGIS run, already filtered to PointAddress, Subaddress or StreetAddress, score 90+, ArcGIS ZIP equal to the listing's).

## Distance to the ZIP's official centre (every row)

| Match type | Rows | With a centre | Median mi | 90th pct mi | 99th pct mi | Over 10 mi | Over 25 mi |
|---|---|---|---|---|---|---|---|
| PointAddress | 49,288 | 44,422 | 1.6 | 5.2 | 13.2 | 930 | 93 |
| Subaddress | 17,192 | 16,815 | 1.6 | 4.5 | 12.0 | 251 | 16 |
| StreetAddress | 4,605 | 3,537 | 1.8 | 5.5 | 14.0 | 57 | 14 |

## Is the point inside the listing's own ZIP area? (Census, by coordinates)

A ZIP is a mail route and its Census area (ZCTA) only approximates it, so a few points just across a boundary are normal; a high miss rate is not.

| Match type | Sampled | Answered | Same ZIP area | Neighbouring or other ZIP area | Outside any ZIP area |
|---|---|---|---|---|---|
| PointAddress | 400 | 400 | 351 (87.8%) | 48 | 1 |
| Subaddress | 400 | 400 | 367 (91.8%) | 33 | 0 |
| StreetAddress | 400 | 400 | 295 (73.8%) | 104 | 1 |

Examples in another ZIP area:

- 113 LIELMANIS AVE, HURLBURT FIELD, FL 32544: point in ZIP area 32547, 2.3 mi from the ZIP centre
- 530 NE GLEN OAK AVE: point in 61603
- 263 FARMINGTON AVE: point in 06032
- 1901 SW 172ND AVE FL 33029, MIRAMAR, FL 33029: point in ZIP area 33027, 1.3 mi from the ZIP centre
- 200 1ST ST SW: point in 55902
- 4755 OGLETOWN STANTON RD: point in 19713
- 530 NE GLEN OAK AVE: point in 61603
- 200 1ST ST SW: point in 55902
- 200 1ST ST SW: point in 55902
- 1200 N STATE ST RM 1001, LOS ANGELES, CA 90089: point in ZIP area 90033, 5.1 mi from the ZIP centre
- 740 S LIMESTONE: point in 40508
- 1830 E. MONUMENT ST.: point in 21205

## Agreement with the Census geocoder on the same address

Sampled 3,000; the Census matched 1,411 (these addresses had failed the Census before, so few matches are expected).

| Census match | Pairs | Median m | 90th pct m | 99th pct m | Over 500 m |
|---|---|---|---|---|---|
| Non_Exact | 1,411 | 99 | 668 | 8777 | 164 |

