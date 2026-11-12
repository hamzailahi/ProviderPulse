# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-12 12:43 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **9000**; still to do: 8119
- OpenStreetMap has an object with the same house number and ZIP: 3032 (33.7%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **1019** (11.3%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **893**
- Only the street or a wider area: 1064; another house number: 23; the right number in another ZIP: 1573; a street estimate: 0; no result: 3308

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 302
- place/house: 174
- building/hospital: 107
- building/yes: 85
- amenity/clinic: 80
- building/commercial: 35
- building/university: 24
- office/lawyer: 17
- amenity/library: 15
- amenity/restaurant: 15
- amenity/doctors: 13
- building/retail: 10
- amenity/post_office: 9
- building/apartments: 8
- building/office: 7

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
