"""Pins outside their own ZIP (2026-11-24, the user's report: a search of
38017 drew listings well away from it; the user's rules: a pin counts as away
when it lies more than MARGIN miles outside the listing's own 2020 Census ZIP
area (ZCTA, full-resolution TIGER polygon); such a listing is geocoded again
and keeps a new point only if that point passes the same test, else it loses
its pin). A ZIP with no Census area (PO-box or single-institution ZIPs) cannot
be judged and is left alone.

  python3 pin-zip-check.py flag  ROWS.csv ZCTA.shp OUT.csv STATS.json MARGIN_MI
      ROWS: tbl,key,address,city,state,zip,lat,lng (streamed). OUT gets the
      flagged rows plus miles (distance from the pin to the ZIP area).
  python3 pin-zip-check.py check NEW.csv ZCTA.shp OUT.csv MARGIN_MI
      NEW: tbl,key,zip,lat,lng (re-geocoded points). OUT gets the rows whose
      new point passes, plus miles.
Needs pyshp and shapely.
"""
import csv, json, math, sys, collections
import shapefile
from shapely.geometry import shape, Point
from shapely.ops import nearest_points
from shapely.prepared import prep

csv.field_size_limit(10**7)


def miles(a, b):
    """Great-circle miles between two (lng, lat) points."""
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    d = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(math.radians(b[0] - a[0]) / 2) ** 2
    return 3958.8 * 2 * math.asin(min(1, math.sqrt(d)))


def load(shp, need=None):
    sf = shapefile.Reader(shp)
    fields = [f[0] for f in sf.fields[1:]]
    zi = fields.index(next(f for f in fields if f.upper().startswith('ZCTA5CE')))
    polys = {}
    for i, rec in enumerate(sf.iterRecords()):
        z = rec[zi]
        if need is None or z in need:
            g = shape(sf.shape(i).__geo_interface__)
            polys[z] = (g, prep(g))
    return polys


def away(polys, z, lat, lng):
    """None = cannot judge; else miles outside the ZIP area (0 = inside)."""
    p = polys.get(z)
    if p is None:
        return None
    pt = Point(lng, lat)
    if p[1].contains(pt):
        return 0.0
    q = nearest_points(p[0], pt)[0]
    return miles((q.x, q.y), (lng, lat))


def main():
    cmd = sys.argv[1]
    if cmd == 'flag':
        rows, shp, out, stats_path, margin = sys.argv[2:7]
        margin = float(margin)
        polys = load(shp)
        print(f'{len(polys)} ZIP areas loaded', flush=True)
        st = collections.Counter()
        by_state, by_tbl, dist = collections.Counter(), collections.Counter(), collections.Counter()
        with open(rows, newline='') as f, open(out, 'w', newline='') as g:
            r = csv.DictReader(f)
            w = csv.DictWriter(g, fieldnames=r.fieldnames + ['miles'], lineterminator='\n')
            w.writeheader()
            for row in r:
                st['rows'] += 1
                try:
                    lat, lng = float(row['lat']), float(row['lng'])
                except ValueError:
                    st['bad_point'] += 1
                    continue
                z = (row['zip'] or '')[:5].zfill(5)
                m = away(polys, z, lat, lng)
                if m is None:
                    st['no_zip_area'] += 1
                elif m <= margin:
                    st['ok'] += 1
                else:
                    st['away'] += 1
                    by_state[row['state']] += 1
                    by_tbl[row['tbl']] += 1
                    dist['0.5-2 mi' if m < 2 else '2-10 mi' if m < 10 else '10-50 mi' if m < 50 else '50+ mi'] += 1
                    w.writerow({**row, 'miles': f'{m:.2f}'})
                if st['rows'] % 1000000 == 0:
                    print(f"{st['rows']:,} rows, {st['away']:,} away", flush=True)
        json.dump({'counts': st, 'by_state': by_state.most_common(), 'by_table': by_tbl, 'distance': dist}, open(stats_path, 'w'))
        print(json.dumps(st))
    elif cmd == 'check':
        new, shp, out, margin = sys.argv[2:6]
        margin = float(margin)
        rows = list(csv.DictReader(open(new, newline='')))
        polys = load(shp, {(r['zip'] or '')[:5].zfill(5) for r in rows})
        good = 0
        with open(out, 'w', newline='') as g:
            w = csv.DictWriter(g, fieldnames=['tbl', 'key', 'lat', 'lng', 'miles'], lineterminator='\n')
            w.writeheader()
            for r in rows:
                m = away(polys, (r['zip'] or '')[:5].zfill(5), float(r['lat']), float(r['lng']))
                if m is not None and m <= margin:
                    good += 1
                    w.writerow({'tbl': r['tbl'], 'key': r['key'], 'lat': r['lat'], 'lng': r['lng'], 'miles': f'{m:.2f}'})
        print(f'{len(rows)} re-geocoded, {good} inside their ZIP area')


main()
