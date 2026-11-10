# Nominatim (OpenStreetMap) pass over unpinned listings

Updated 2026-11-10 21:56 UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.

- Listings to check (ArcGIS found a building, but the pin failed the strict cut): 17119
- Checked so far: **3000**; still to do: 14119
- OpenStreetMap has an object with the same house number and ZIP: 977 (32.6%)
- ... and it is within 50 m of the ArcGIS point (two sources agree): **339** (11.3%)
- ... leaving out bare "house" matches on a street way, which may be estimates: **299**
- Only the street or a wider area: 368; another house number: 10; the right number in another ZIP: 503; a street estimate: 0; no result: 1142

Agreeing matches by kind of OpenStreetMap object:

- amenity/hospital: 97
- place/house: 60
- building/hospital: 41
- building/yes: 33
- amenity/clinic: 19
- building/commercial: 14
- building/university: 10
- amenity/doctors: 6
- amenity/library: 6
- amenity/post_office: 3
- amenity/pharmacy: 3
- building/office: 3
- building/apartments: 3
- amenity/restaurant: 3
- amenity/research_institute: 2

Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).
