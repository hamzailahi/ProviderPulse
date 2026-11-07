#!/usr/bin/env python3
"""Accuracy check of the user's ArcGIS points before any are written
(arcgis-check.yml, read only). Three independent tests:

  1. For a sample of points stratified by ArcGIS match type, ask the Census
     geographies service which 2020 ZCTA the point lies in, and whether it is
     the listing's own ZIP.
  2. For a sample, geocode the same address with the Census batch geocoder
     and measure the distance between the two points where the Census finds
     one (Exact or Non_Exact).
  3. For every row, the distance to its ZIP's centre (cdc_places, read only).

  python3 scripts/arcgis-check.py --load load.csv --centroids zc.csv --out report.md
"""
import argparse, collections, csv, io, json, math, random, statistics, time, urllib.parse, urllib.request

CENSUS = 'https://geocoding.geo.census.gov/geocoder'
UA = {'User-Agent': 'ProviderPulse accuracy check'}


def miles(a, b, c, d):
    return 69.0 * math.hypot(a - c, (b - d) * math.cos(math.radians((a + c) / 2)))


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(p * len(xs)))] if xs else None


def zcta_of(lat, lng):
    q = urllib.parse.urlencode({'x': lng, 'y': lat, 'benchmark': 'Public_AR_Current',
                                'vintage': 'Current_Current', 'layers': 'all', 'format': 'json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(f'{CENSUS}/geographies/coordinates?{q}', headers=UA), timeout=30) as r:
                g = json.load(r)['result']['geographies']
            for k, v in g.items():
                if 'ZIP Code Tabulation' in k and v:
                    z = v[0]
                    return z.get('ZCTA5') or z.get('ZCTA5CE20') or z.get('BASENAME') or z.get('GEOID')
            return 'none'
        except Exception:
            time.sleep(3 * (attempt + 1))
    return None


def census_batch(rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    for i, r in enumerate(rows):
        w.writerow([i, r['address'], r['city'], r['state'], r['zip']])
    boundary = 'ppbound'
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="benchmark"\r\n\r\nPublic_AR_Current\r\n'
            f'--{boundary}\r\nContent-Disposition: form-data; name="addressFile"; filename="a.csv"\r\n'
            f'Content-Type: text/csv\r\n\r\n{buf.getvalue()}\r\n--{boundary}--\r\n').encode()
    req = urllib.request.Request(f'{CENSUS}/locations/addressbatch', data=body, headers={
        **UA, 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                text = r.read().decode('utf-8', 'replace')
            out = {}
            for row in csv.reader(io.StringIO(text)):
                if len(row) >= 6 and row[2] == 'Match' and row[5]:
                    lng, lat = map(float, row[5].split(','))
                    out[int(row[0])] = (row[3], lat, lng)
            return out
        except Exception:
            time.sleep(30 * (attempt + 1))
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--load', required=True); ap.add_argument('--centroids', required=True)
    ap.add_argument('--out', required=True); ap.add_argument('--zcta-per-type', type=int, default=400)
    ap.add_argument('--census-sample', type=int, default=3000)
    a = ap.parse_args()
    rows = list(csv.DictReader(open(a.load)))
    for r in rows:
        r['lat'] = float(r['lat']); r['lng'] = float(r['lng'])
    zc = {r['zip']: (float(r['clat']), float(r['clon'])) for r in csv.DictReader(open(a.centroids))}
    rnd = random.Random(7)
    L = ['# ArcGIS points: accuracy check', '',
         f'Run {time.strftime("%Y-%m-%d %H:%M", time.gmtime())} UTC by scripts/arcgis-check.py. Read only; nothing was written.', '',
         f'Points checked: {len(rows):,} (the user\'s ArcGIS run, already filtered to PointAddress, Subaddress or StreetAddress, score 90+, ArcGIS ZIP equal to the listing\'s).', '']

    # 3. distance to the ZIP's centre, every row
    L += ['## Distance to the ZIP\'s official centre (every row)', '', '| Match type | Rows | With a centre | Median mi | 90th pct mi | 99th pct mi | Over 10 mi | Over 25 mi |', '|---|---|---|---|---|---|---|---|']
    by = collections.defaultdict(list)
    for r in rows:
        c = zc.get(r['zip'])
        r['dz'] = miles(r['lat'], r['lng'], *c) if c else None
        by[r['addr_type']].append(r)
    for t, l in sorted(by.items(), key=lambda kv: -len(kv[1])):
        d = [x['dz'] for x in l if x['dz'] is not None]
        L.append(f'| {t} | {len(l):,} | {len(d):,} | {pct(d,.5):.1f} | {pct(d,.9):.1f} | {pct(d,.99):.1f} | {sum(x>10 for x in d):,} | {sum(x>25 for x in d):,} |')
    L.append('')

    # 1. point inside the listing's own ZCTA
    L += ['## Is the point inside the listing\'s own ZIP area? (Census, by coordinates)', '',
          'A ZIP is a mail route and its Census area (ZCTA) only approximates it, so a few points just across a boundary are normal; a high miss rate is not.', '',
          '| Match type | Sampled | Answered | Same ZIP area | Neighbouring or other ZIP area | Outside any ZIP area |', '|---|---|---|---|---|---|']
    examples = []
    for t, l in sorted(by.items(), key=lambda kv: -len(kv[1])):
        s = rnd.sample(l, min(a.zcta_per_type, len(l)))
        res = []
        for r in s:
            z = zcta_of(r['lat'], r['lng']); res.append((r, z)); time.sleep(0.15)
        ans = [(r, z) for r, z in res if z is not None]
        same = sum(1 for r, z in ans if z == r['zip'][:5])
        none = sum(1 for r, z in ans if z == 'none')
        other = len(ans) - same - none
        for r, z in ans:
            if z not in (r['zip'][:5], 'none') and len(examples) < 12:
                examples.append(f'{r["address"]}, {r["city"]}, {r["state"]} {r["zip"]}: point in ZIP area {z}, {r["dz"]:.1f} mi from the ZIP centre' if r['dz'] is not None else f'{r["address"]}: point in {z}')
        L.append(f'| {t} | {len(s):,} | {len(ans):,} | {same:,} ({100*same/max(1,len(ans)):.1f}%) | {other:,} | {none:,} |')
    L += ['', 'Examples in another ZIP area:', ''] + [f'- {e}' for e in examples] + ['']

    # 2. agreement with the Census geocoder on the same address
    s = rnd.sample(rows, min(a.census_sample, len(rows)))
    got = census_batch(s)
    L += ['## Agreement with the Census geocoder on the same address', '']
    if got is None:
        L.append('The Census batch geocoder did not answer; this part is missing.')
    else:
        L += [f'Sampled {len(s):,}; the Census matched {len(got):,} (these addresses had failed the Census before, so few matches are expected).', '',
              '| Census match | Pairs | Median m | 90th pct m | 99th pct m | Over 500 m |', '|---|---|---|---|---|---|']
        for kind in ('Exact', 'Non_Exact'):
            d = [miles(s[i]['lat'], s[i]['lng'], lat, lng) * 1609.34 for i, (k, lat, lng) in got.items() if k == kind]
            if d:
                L.append(f'| {kind} | {len(d):,} | {pct(d,.5):.0f} | {pct(d,.9):.0f} | {pct(d,.99):.0f} | {sum(x>500 for x in d):,} |')
        L.append('')
    open(a.out, 'w').write('\n'.join(L) + '\n')
    print('\n'.join(L))


if __name__ == '__main__':
    main()
