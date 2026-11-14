# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-14 11:43 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **15000**; still to do: 2119
- OpenStreetMap has an object with the same house number and ZIP: 5006 (33.4%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **1598** (10.7%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **1408**
- Only the street or a wider area: 1807; another house number: 41; the right number in another ZIP: 2662; a street estimate: 0; no result: 5484

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 433
- place/house: 274
- building/hospital: 155
- building/yes: 153
- amenity/clinic: 139
- building/commercial: 55
- building/university: 38
- office/lawyer: 38
- amenity/library: 21
- amenity/doctors: 20
- amenity/restaurant: 19
- amenity/post_office: 18
- building/retail: 18
- building/office: 14
- amenity/dentist: 11

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
