# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-11 12:13 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **6000**; still to do: 11119
- OpenStreetMap has an object with the same house number and ZIP: 1971 (32.9%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **651** (10.8%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **576**
- Only the street or a wider area: 717; another house number: 18; the right number in another ZIP: 1065; a street estimate: 0; no result: 2229

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 194
- place/house: 103
- building/hospital: 70
- building/yes: 62
- amenity/clinic: 47
- building/commercial: 23
- building/university: 19
- amenity/doctors: 12
- amenity/restaurant: 10
- amenity/library: 9
- office/company: 6
- building/apartments: 6
- amenity/cafe: 6
- amenity/post_office: 5
- building/office: 5

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
