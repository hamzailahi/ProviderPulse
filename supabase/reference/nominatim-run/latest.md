# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-16 11:34 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **17119**; still to do: 0
- OpenStreetMap has an object with the same house number and ZIP: 5751 (33.6%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **1811** (10.6%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **1594**
- Only the street or a wider area: 2030; another house number: 45; the right number in another ZIP: 3021; a street estimate: 0; no result: 6272

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 482
- place/house: 311
- amenity/clinic: 172
- building/yes: 171
- building/hospital: 167
- building/commercial: 64
- office/lawyer: 46
- building/university: 42
- amenity/library: 23
- amenity/post_office: 22
- building/retail: 22
- amenity/doctors: 21
- amenity/restaurant: 21
- building/office: 18
- amenity/dentist: 13

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
