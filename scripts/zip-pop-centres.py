#!/usr/bin/env python3
"""Population-weighted ZIP centres from 2020 Census blocks (read only on the
web; writes a CSV). Usage: zip-pop-centres.py WORKDIR OUT.csv
Blocks with population 0 add nothing; a ZCTA whose blocks are all empty
falls back to the unweighted mean of its block points (pop 0 in the output)."""
import csv, io, os, sys, urllib.request, zipfile, time
import pyogrio

W, OUT = sys.argv[1], sys.argv[2]
UA = {'User-Agent': 'Mozilla/5.0 (ProviderPulse data job)'}
STATES = ['01','02','04','05','06','08','09','10','11','12','13','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','44','45','46','47','48','49','50','51','53','54','55','56','72']

def get(url, path):
    for t in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r, open(path, 'wb') as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            return
        except Exception as e:
            print(f'  retry {t + 1} {url}: {e}', flush=True); time.sleep(20 * (t + 1))
    raise SystemExit(f'download failed: {url}')

rel = os.path.join(W, 'rel.txt')
get('https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_tabblock20_natl.txt', rel)
block_zip = {}
with open(rel, encoding='utf-8-sig') as f:
    r = csv.reader(f, delimiter='|'); head = next(r); print('relationship header:', head, flush=True)
    iz, ib = head.index('GEOID_ZCTA5_20'), head.index('GEOID_TABBLOCK_20')
    for row in r:
        if row[iz] and row[ib]: block_zip[row[ib]] = row[iz]
print(f'blocks with a ZCTA: {len(block_zip):,}', flush=True)
if len(block_zip) < 5_000_000: raise SystemExit('too few blocks in the relationship file')

acc = {}   # zcta -> [sum pop*lat, sum pop*lon, pop, blocks, sum lat, sum lon]
total_pop = 0
for st in STATES:
    z = os.path.join(W, f'b{st}.zip')
    get(f'https://www2.census.gov/geo/tiger/TIGER2020/TABBLOCK20/tl_2020_{st}_tabblock20.zip', z)
    with zipfile.ZipFile(z) as zf: zf.extractall(os.path.join(W, st))
    shp = [n for n in os.listdir(os.path.join(W, st)) if n.endswith('.shp')][0]
    df = pyogrio.read_dataframe(os.path.join(W, st, shp), read_geometry=False, columns=['GEOID20', 'POP20', 'INTPTLAT20', 'INTPTLON20'])
    n = 0
    for g, p, la, lo in zip(df['GEOID20'], df['POP20'], df['INTPTLAT20'], df['INTPTLON20']):
        zc = block_zip.get(g)
        if not zc: continue
        la, lo, p = float(la), float(lo), int(p or 0)
        a = acc.setdefault(zc, [0.0, 0.0, 0, 0, 0.0, 0.0])
        a[0] += p * la; a[1] += p * lo; a[2] += p; a[3] += 1; a[4] += la; a[5] += lo
        n += 1; total_pop += p
    print(f'  state {st}: {len(df):,} blocks, {n:,} in a ZCTA', flush=True)
    os.remove(z)
    for x in os.listdir(os.path.join(W, st)): os.remove(os.path.join(W, st, x))

with open(OUT, 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['zip', 'lat', 'lon', 'pop', 'blocks'])
    for zc, (sla, slo, p, nb, ula, ulo) in sorted(acc.items()):
        lat, lon = (sla / p, slo / p) if p > 0 else (ula / nb, ulo / nb)
        w.writerow([zc, f'{lat:.6f}', f'{lon:.6f}', p, nb])
print(f'ZCTAs: {len(acc):,}; population placed: {total_pop:,}', flush=True)
if len(acc) < 30000 or total_pop < 300_000_000: raise SystemExit('implausibly few ZCTAs or people')
