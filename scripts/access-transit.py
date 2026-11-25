"""Transit travel times for the access pilot (2026-11-25, the user's ask:
"for households without a car, maybe we should also look at public transit").

Reads the region's ZIP centres (zips.csv from access-dry-run.sh), the clipped
OpenStreetMap roads (region.osm.pbf) and every GTFS feed the Mobility Database
catalog lists inside the region's box, and writes from,to,minutes for every
ZIP pair reachable by public transit plus walking within MAX_MIN minutes,
leaving at a fixed weekday mid-morning time (the median over a 60-minute
window, so one missed bus does not decide a pair). Pairs not reachable are left
out; the scorer then uses walking for them.

Usage: python3 -I access-transit.py ZIPS PBF FEEDDIR OUT BBOX
"""
import csv, datetime, io, json, os, sys, urllib.request, zipfile

zips_csv, pbf, feeddir, out, bbox = sys.argv[1:6]
MAX_MIN = 120
minlon, minlat, maxlon, maxlat = map(float, bbox.split(','))
os.makedirs(feeddir, exist_ok=True)

# ---- feeds: the Mobility Database catalog (no key), GTFS whose box overlaps ours
CATALOGS = ['https://files.mobilitydatabase.org/feeds_v2.csv', 'https://share.mobilitydata.org/catalogs-csv']
text = None
for u in CATALOGS:
    try:
        text = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'providerpulse-access-pilot'}), timeout=120).read().decode('utf-8', 'replace')
        print('catalog', u); break
    except Exception as e:
        print('catalog failed', u, e)
if not text: sys.exit('no Mobility Database catalog reachable')
rows = list(csv.DictReader(io.StringIO(text)))
col = lambda *parts: next((k for k in rows[0] if all(p in k for p in parts)), None)
c_type, c_status, c_url = col('data_type'), col('status'), col('urls', 'latest')
c_prov, c_id = col('provider'), col('id')
c_b = {k: col('bounding_box', k) for k in ('minimum_latitude', 'maximum_latitude', 'minimum_longitude', 'maximum_longitude')}
feeds = []
for r in rows:
    if r.get(c_type) != 'gtfs' or (r.get(c_status) or '') in ('deprecated', 'inactive'): continue
    try: b = {k: float(r[v]) for k, v in c_b.items()}
    except (TypeError, ValueError): continue
    if b['maximum_longitude'] < minlon or b['minimum_longitude'] > maxlon or b['maximum_latitude'] < minlat or b['minimum_latitude'] > maxlat: continue
    # Skip national or multi-state feeds (intercity coaches, Amtrak): a box wider than 6 degrees.
    if b['maximum_longitude'] - b['minimum_longitude'] > 6 or b['maximum_latitude'] - b['minimum_latitude'] > 6: continue
    if r.get(c_url): feeds.append((r.get(c_id), r.get(c_prov), r[c_url]))
print(len(feeds), 'GTFS feeds overlap the box')
paths, used = [], []
for fid, prov, url in feeds:
    p = os.path.join(feeddir, f'{fid}.zip')
    try:
        urllib.request.urlretrieve(url, p)
        with zipfile.ZipFile(p) as z:
            names = set(z.namelist())
        if not {'stops.txt', 'stop_times.txt', 'trips.txt'} <= names: raise ValueError('not a full GTFS feed')
        paths.append(p); used.append((fid, prov))
    except Exception as e:
        print('skip feed', fid, prov, e)
if not paths: sys.exit('no usable GTFS feed in the box')
json.dump([{'id': f, 'provider': p} for f, p in used], open(out + '.feeds.json', 'w'), indent=1)

# ---- departure: the next Wednesday, 10:00 local (mid-morning weekday, when
# clinics are open; an assumption, stated in the report)
d = datetime.date.today()
d += datetime.timedelta(days=(2 - d.weekday()) % 7 or 7)
dep = datetime.datetime(d.year, d.month, d.day, 10, 0)
open(out + '.departure', 'w').write(dep.isoformat())

sys.argv[1:] = ['--max-memory', os.environ.get('R5_MEMORY', '12G')]
import geopandas as gpd, r5py
from shapely.geometry import Point
pts = [r for r in csv.DictReader(open(zips_csv))]
gdf = gpd.GeoDataFrame({'id': [r['zip'] for r in pts]}, geometry=[Point(float(r['lon']), float(r['lat'])) for r in pts], crs='EPSG:4326')
net = r5py.TransportNetwork(pbf, paths)
kw = dict(origins=gdf, destinations=gdf, departure=dep, departure_time_window=datetime.timedelta(minutes=60),
          transport_modes=[r5py.TransportMode.TRANSIT, r5py.TransportMode.WALK], max_time=datetime.timedelta(minutes=MAX_MIN))
if hasattr(r5py, 'TravelTimeMatrix'):
    tt = r5py.TravelTimeMatrix(net, **kw)
else:
    tt = r5py.TravelTimeMatrixComputer(net, **kw).compute_travel_times()
tt = tt.dropna()
tt = tt[tt.from_id != tt.to_id]
tt.rename(columns={'from_id': 'from', 'to_id': 'to', 'travel_time': 'minutes'})[['from', 'to', 'minutes']].to_csv(out, index=False)
print(len(tt), 'reachable ZIP pairs by transit over', len(pts), 'ZIPs;', len(paths), 'feeds; departure', dep)
