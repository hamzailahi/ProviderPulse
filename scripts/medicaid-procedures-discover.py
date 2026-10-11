#!/usr/bin/env python3
"""Read-only discovery of HHS's Medicaid Provider Spending by HCPCS file
(T-MSIS, released February 2026). The HHS Open Data page was down at the
time, so this reads HHS's own Hugging Face copy as Parquet, in place, with
DuckDB: nothing is downloaded whole and nothing is written to the database.

It records the Parquet files, the schema, row counts, the month range, how
many rows and providers the newest year has, whether CPT (5-digit) codes
appear beside HCPCS Level II codes, the smallest patient counts (to see how
small cells are hidden), and sample rows, in
supabase/reference/procedure-sources/medicaid.md.

Run: python3 scripts/medicaid-procedures-discover.py [outdir]
"""
import json, os, sys, time, urllib.request
import duckdb

OUT = sys.argv[1] if len(sys.argv) > 1 else 'supabase/reference/procedure-sources'
os.makedirs(OUT, exist_ok=True)
REPO = 'HHS-Official/medicaid-provider-spending'
lines = ['<!-- Written by scripts/medicaid-procedures-discover.py. Read only. -->',
         '# Medicaid procedure source, ' + time.strftime('%Y-%m-%d %H:%M', time.gmtime()) + ' UTC', '']
def note(s=''):
    lines.append(s); print(s, flush=True)

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ProviderPulse discovery'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def done(code=0):
    open(os.path.join(OUT, 'medicaid.md'), 'w').write('\n'.join(lines) + '\n')
    sys.exit(code)

# Is the official page back?
for u in ['https://opendata.hhs.gov/datasets/medicaid-provider-spending', 'https://opendata.hhs.gov/data.json']:
    try:
        b = get(u); note(f'- {u}: HTTP 200, {len(b):,} bytes')
    except Exception as e:
        note(f'- {u}: {e}')

note('\n## HHS Open Data dataset page\n')
allurls = []
import re
try:
    page = get('https://opendata.hhs.gov/datasets/medicaid-provider-spending').decode('utf-8', 'replace')
    note('- page scripts: ' + ', '.join(sorted(set(re.findall(r'src="([^"]+)"', page)))[:20]))
    allurls = sorted(set(re.findall(r'https?:(?:\\\\)?/(?:\\\\)?/[^"\'\s<>\\]+', page)))
    note('- every URL in the page: ' + ', '.join(allurls[:80]))
except Exception as e:
    note(f'- page: {e}')
# The page embeds its file list; the Parquet artifact is what DuckDB reads.
urls = [u for u in allurls if u.lower().split('?')[0].endswith('.parquet')][:1]
note('\n(Hugging Face copy skipped: HHS-Official/medicaid-provider-spending answered 401, gated, on 2026-10-11.)')
if not urls:
    note('**no parquet URLs found**'); done(1)
note(f'\n{len(urls)} parquet file(s):\n')
for u in urls: note(f'- {u}')

con = duckdb.connect()
reader = 'read_parquet' if urls[0].lower().split('?')[0].endswith('.parquet') else 'read_csv_auto'
if urls[0].lower().split('?')[0].endswith('.zip'):
    note('**the HCPCS file is a zip; download and unzip before DuckDB (next step)**'); done(1)
local = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'medicaid-provider-spending.parquet')
t0 = time.time()
req = urllib.request.Request(urls[0], headers={'User-Agent': 'ProviderPulse discovery'})
with urllib.request.urlopen(req, timeout=600) as r, open(local, 'wb') as f:
    while True:
        chunk = r.read(8 << 20)
        if not chunk: break
        f.write(chunk)
note(f'- downloaded {os.path.getsize(local)/1e9:.2f} GB in {time.time()-t0:.0f}s')
src = reader + "('" + local + "')"
def q(sql):
    return con.execute(sql.replace('SRC', src)).fetchall()
def cols_of():
    return con.execute(f'DESCRIBE SELECT * FROM {src}').fetchall()

try:
    schema = cols_of()
    note('\n### Schema\n')
    for c in schema: note(f'- `{c[0]}` {c[1]}')
    names = [c[0] for c in schema]
    def pick(*cands):
        for n in names:
            if n.upper() in cands: return n
        return None
    month = pick('CLAIM_FROM_MONTH', 'MONTH', 'CLAIM_MONTH')
    hcpcs = pick('HCPCS_CODE', 'HCPCS')
    pts = pick('TOTAL_PATIENTS', 'TOTAL_UNIQUE_BENEFICIARIES', 'BENEFICIARIES')
    paid = pick('TOTAL_PAID', 'TOTAL_PAID_AMOUNT')
    serv = pick('SERVICING_PROVIDER_NPI_NUM', 'SERVICING_NPI', 'SERVICING_PROVIDER_NPI')
    bill = pick('BILLING_PROVIDER_NPI_NUM', 'BILLING_NPI', 'BILLING_PROVIDER_NPI')
    note(f'\nColumns used below: month={month} hcpcs={hcpcs} patients={pts} paid={paid} servicing={serv} billing={bill}')

    t = time.time()
    note('\n### Size and range\n')
    r = q(f'SELECT count(*), min({month}), max({month}) FROM SRC')[0]
    note(f'- rows {r[0]:,}; months {r[1]} to {r[2]} ({time.time()-t:.0f}s)')
    note('\n### Rows per year\n')
    for y in q(f"SELECT substr(CAST({month} AS VARCHAR),1,4) y, count(*), count(DISTINCT {serv}), count(DISTINCT {hcpcs}), sum({paid}) FROM SRC GROUP BY 1 ORDER BY 1"):
        note(f'- {y[0]}: {y[1]:,} rows, {y[2]:,} servicing NPIs, {y[3]:,} codes, paid ${y[4]:,.0f}')
    note('\n### Code shapes (newest year)\n')
    last = q(f"SELECT max(substr(CAST({month} AS VARCHAR),1,4)) FROM SRC")[0][0]
    for s in q(f"""SELECT CASE WHEN regexp_matches({hcpcs}, '^[0-9]{{4}}[0-9]$') THEN 'CPT Category I (5 digits)'
                     WHEN regexp_matches({hcpcs}, '^[0-9]{{4}}[FTU]$') THEN 'CPT Category II/III'
                     WHEN regexp_matches({hcpcs}, '^[A-V][0-9]{{4}}$') THEN 'HCPCS Level II'
                     WHEN {hcpcs} IS NULL THEN 'null' ELSE 'other' END k, count(*), sum({paid})
                   FROM SRC WHERE substr(CAST({month} AS VARCHAR),1,4)='{last}' GROUP BY 1 ORDER BY 2 DESC"""):
        note(f'- {s[0]}: {s[1]:,} rows, paid ${s[2] or 0:,.0f}')
    note('\n### Smallest patient counts (newest year), to see suppression\n')
    for s in q(f"SELECT {pts}, count(*) FROM SRC WHERE substr(CAST({month} AS VARCHAR),1,4)='{last}' GROUP BY 1 ORDER BY 1 NULLS FIRST LIMIT 15"):
        note(f'- patients={s[0]}: {s[1]:,} rows')
    note('\n### Servicing NPI missing or equal to billing (newest year)\n')
    for s in q(f"SELECT {serv} IS NULL, {serv} = {bill}, count(*) FROM SRC WHERE substr(CAST({month} AS VARCHAR),1,4)='{last}' GROUP BY 1,2 ORDER BY 3 DESC"):
        note(f'- servicing null={s[0]}, equals billing={s[1]}: {s[2]:,} rows')
    note('\n### Top codes by paid (newest year)\n')
    for s in q(f"SELECT {hcpcs}, sum({pts}), sum({paid}) FROM SRC WHERE substr(CAST({month} AS VARCHAR),1,4)='{last}' GROUP BY 1 ORDER BY 3 DESC LIMIT 15"):
        note(f'- {s[0]}: patients {s[1] or 0:,.0f}, paid ${s[2] or 0:,.0f}')
    note('\n### Sample rows\n\n```')
    for s in q('SELECT * FROM SRC LIMIT 8'): note(str(s))
    note('```')
except Exception as e:
    note(f'**query failed:** {e}'); done(1)
done(0)
