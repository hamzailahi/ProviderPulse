# Nominatim (OpenStreetMap) test on listings with no pin

Run 2026-11-10 20:22 UTC by scripts/nominatim-sample.mjs: a sample, one request a second, read only. Nothing was written to the database and no coordinates were kept.

- Listings sent: 500; answered: **500**; requests that failed: 0
- A building in OpenStreetMap with the same house number and ZIP: **132** (26.4%)
- Same house number and ZIP, but only an estimate along the street (TIGER ranges): 0 (0.0%)
- Only the street, or a wider area: 75 (15.0%)
- A different house number: 1 (0.2%)
- The right number in another ZIP: 53 (10.6%)
- No result: 239 (47.8%)

Building matches that also have an ArcGIS point (132): distance between the two, median 121 m, 75th percentile 234 m, 90th percentile 442 m; 41 within 50 m, 11 more than 500 m apart.

Kinds of OpenStreetMap object matched:

- amenity/hospital: 42
- place/house: 28
- amenity/library: 14
- building/hospital: 7
- amenity/clinic: 6
- amenity/university: 5
- building/commercial: 4
- building/university: 4
- amenity/research_institute: 4
- railway/tram_stop: 3
- amenity/restaurant: 2
- building/house: 1
