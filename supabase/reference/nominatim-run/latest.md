# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-13 12:14 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **12000**; still to do: 5119
- OpenStreetMap has an object with the same house number and ZIP: 4032 (33.6%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **1297** (10.8%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **1137**
- Only the street or a wider area: 1439; another house number: 33; the right number in another ZIP: 2076; a street estimate: 0; no result: 4420

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 371
- place/house: 228
- building/hospital: 125
- building/yes: 114
- amenity/clinic: 107
- building/commercial: 41
- building/university: 31
- office/lawyer: 28
- amenity/doctors: 17
- amenity/library: 17
- amenity/restaurant: 17
- building/retail: 15
- amenity/post_office: 13
- building/office: 10
- amenity/cafe: 10

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
