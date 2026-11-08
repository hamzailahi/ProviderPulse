"""Stricter accuracy cut for the ArcGIS points already loaded (2026-11-08,
the user's request: keep only points that are exactly the location; anything
even a little off comes out and goes back to the user as a CSV).

A loaded point stays only when both hold:
  - ArcGIS scored the match 100 (a perfect match of the address as written);
  - the point lies inside the 2020 Census ZIP area (ZCTA, full-resolution
    TIGER polygon, no tolerance) of the listing's own ZIP.
A ZIP with no Census area (a PO-box or single-institution ZIP) cannot be
confirmed, so its rows come out too.

Usage: python3 arcgis-strict.py LOADED.csv ZCTA.shp OUT_DROP.csv
LOADED has tbl, npi, parent_npi, address, city, state, zip, lat, lng,
addr_type, score. OUT_DROP gets the same columns plus reason.
Needs pyshp and shapely.
"""
import csv, sys, collections
import shapefile
from shapely.geometry import shape, Point
from shapely.prepared import prep

loaded, shp, out = sys.argv[1:4]
rows = list(csv.DictReader(open(loaded, newline='')))
need = {r['zip'].zfill(5) for r in rows}
sf = shapefile.Reader(shp)
fields = [f[0] for f in sf.fields[1:]]
zf = next(f for f in fields if f.upper().startswith('ZCTA5CE'))
zi = fields.index(zf)
polys = {}
for i, rec in enumerate(sf.iterRecords()):
    z = rec[zi]
    if z in need:
        polys[z] = prep(shape(sf.shape(i).__geo_interface__))
print(f'{len(rows)} rows, {len(need)} ZIPs, {len(polys)} with a Census area')

drop, why = [], collections.Counter()
for r in rows:
    z = r['zip'].zfill(5)
    if float(r['score'] or 0) < 100:
        reason = 'score_below_100'
    elif z not in polys:
        reason = 'zip_has_no_census_area'
    elif not polys[z].contains(Point(float(r['lng']), float(r['lat']))):
        reason = 'outside_own_zip_area'
    else:
        continue
    why[reason] += 1
    drop.append({**r, 'reason': reason})
w = csv.DictWriter(open(out, 'w', newline=''), fieldnames=list(rows[0].keys()) + ['reason'], lineterminator='\n')
w.writeheader(); w.writerows(drop)
print(f'keep {len(rows) - len(drop)}, take out {len(drop)}: {dict(why)}')
