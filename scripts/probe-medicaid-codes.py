#!/usr/bin/env python3
"""Read-only probe of HHS's raw Medicaid Provider Spending file for a list of
codes: why a code is or is not in medicaid_procedures. For each code, every
year's rows, claim lines and providers; the newest year by state (the NPI's
state in our directory); what Texas (or --state) bills in the same code range
instead; and the smallest patient count HHS publishes, which is its
suppression threshold. Nothing is written to the database.

Run by .github/workflows/medicaid-code-probe.yml (needs SUPABASE_DB_URL for a
read-only export of NPI -> state). Writes supabase/reference/procedure-sources/code-probe.md.
"""
import argparse, os, re, subprocess, sys, time, urllib.request
import duckdb

ap = argparse.ArgumentParser()
ap.add_argument('--codes', default='59400,59409,59410,59510,59514,59515,59610,59612,59614,59618,59620,59622')
ap.add_argument('--state', default='TX')
ap.add_argument('--range', default='59', help='code prefix for "what this state bills instead"')
ap.add_argument('--work', default=os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'probe'))
ap.add_argument('--out', default='supabase/reference/procedure-sources/code-probe.md')
ap.add_argument('--medicaid'); ap.add_argument('--directory')
args = ap.parse_args()
os.makedirs(args.work, exist_ok=True)
codes = [c.strip().upper() for c in args.codes.split(',') if c.strip()]
UA = {'User-Agent': 'ProviderPulse-probe'}
out = ['<!-- Written by scripts/probe-medicaid-codes.py. Read only. -->',
       f"# Medicaid code probe, {time.strftime('%Y-%m-%d %H:%M', time.gmtime())} UTC", '']
def say(*lines):
    for s in (lines or ('',)): out.append(s); print(s, flush=True)
def lit(p): return "'" + p.replace("'", "''") + "'"

med = args.medicaid
if not med:
    page = urllib.request.urlopen(urllib.request.Request('https://opendata.hhs.gov/datasets/medicaid-provider-spending', headers=UA), timeout=120).read().decode('utf-8', 'replace')
    hits = sorted(set(u for u in re.findall(r'https?://[^"\'\s<>\\]+', page) if u.lower().endswith('.parquet')))
    if not hits: sys.exit('no Parquet link on the HHS dataset page')
    url = hits[-1]; med = os.path.join(args.work, 'medicaid.parquet'); t = time.time()
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=900) as r, open(med, 'wb') as f:
        while True:
            b = r.read(8 << 20)
            if not b: break
            f.write(b)
    say(f'Source: {url} ({os.path.getsize(med)/1e6:,.0f} MB in {time.time()-t:.0f}s)')

directory = args.directory
if not directory:
    directory = os.path.join(args.work, 'dir.csv')
    sql = ("\\copy (select npi::text as npi, state::text as state from public.clinics where npi is not null "
           "union all select npi::text, state::text from public.provider_individuals where npi is not null) to '" + directory + "' with (format csv, header true)")
    r = subprocess.run(['psql', os.environ['SUPABASE_DB_URL'], '-v', 'ON_ERROR_STOP=1', '-q', '-X', '-c', 'set default_transaction_read_only = on;', '-c', sql], capture_output=True, text=True)
    if r.returncode: sys.exit('directory export failed: ' + r.stderr[-300:])

con = duckdb.connect()
con.execute(f"""CREATE TABLE m AS SELECT substr(CLAIM_FROM_MONTH, 1, 4) AS yr, upper(trim(HCPCS_CODE)) AS code,
  trim(COALESCE(SERVICING_PROVIDER_NPI_NUM, '')) AS snpi, trim(COALESCE(BILLING_PROVIDER_NPI_NUM, '')) AS bnpi,
  TOTAL_PATIENTS AS pts, TOTAL_CLAIM_LINES AS claims, TOTAL_PAID AS paid
  FROM read_parquet({lit(med)}) WHERE upper(trim(HCPCS_CODE)) LIKE {lit(args.range.upper() + '%')} OR upper(trim(HCPCS_CODE)) IN ({','.join(lit(c) for c in codes)})""")
con.execute(f"CREATE TABLE d AS SELECT npi, any_value(upper(state)) AS state FROM read_csv({lit(directory)}, header=true, all_varchar=true) GROUP BY npi")
con.execute("""CREATE TABLE mm AS SELECT m.*, COALESCE(ds.state, db.state) AS state,
  CASE WHEN ds.state IS NOT NULL THEN 'servicing' WHEN db.state IS NOT NULL THEN 'billing' END AS placed_by
  FROM m LEFT JOIN d ds ON ds.npi = m.snpi LEFT JOIN d db ON db.npi = m.bnpi""")
newest = con.execute(f"SELECT max(substr(CLAIM_FROM_MONTH, 1, 4)) FROM read_parquet({lit(med)})").fetchone()[0]
mins = con.execute(f"SELECT min(TOTAL_PATIENTS), count(*) FILTER (WHERE TOTAL_PATIENTS < 12) FROM read_parquet({lit(med)}) WHERE substr(CLAIM_FROM_MONTH,1,4) = {lit(newest)}").fetchone()
say(f'Newest year {newest}. Smallest patient count on any {newest} row: {mins[0]}; rows under 12 patients: {mins[1]:,} (HHS withholds any provider, code and month below its threshold).')

say('', '## Each code, every year (all states)', '', '| code | year | rows | claim lines | paid | providers |', '|---|---|---|---|---|---|')
for c in codes:
    rows = con.execute(f"SELECT yr, count(*), sum(claims), sum(paid), count(DISTINCT COALESCE(NULLIF(snpi,''), bnpi)) FROM mm WHERE code = {lit(c)} GROUP BY 1 ORDER BY 1").fetchall()
    if not rows: say(f'| {c} | any | 0 | 0 | 0 | 0 |')
    for r in rows: say(f'| {c} | {r[0]} | {r[1]:,} | {int(r[2] or 0):,} | ${r[3] or 0:,.0f} | {r[4]:,} |')

say('', f'## {newest}, by state of the NPI in our directory', '')
for c in codes:
    rows = con.execute(f"SELECT COALESCE(state, '(not in directory)'), count(*), sum(claims) FROM mm WHERE code = {lit(c)} AND yr = {lit(newest)} GROUP BY 1 ORDER BY 3 DESC").fetchall()
    st = next((r for r in rows if r[0] == args.state), None)
    say(f"- {c}: {len(rows)} states; {args.state} {('%s rows, %s claim lines' % (f'{st[1]:,}', f'{int(st[2] or 0):,}')) if st else 'none'}; top: " +
        ', '.join(f'{r[0]} {int(r[2] or 0):,}' for r in rows[:8]))

say('', f'## What {args.state} bills in {args.range}xxx, {newest}', '')
for r in con.execute(f"SELECT code, count(*), sum(claims), sum(paid), count(DISTINCT COALESCE(NULLIF(snpi,''), bnpi)), min(pts) FROM mm WHERE state = {lit(args.state)} AND yr = {lit(newest)} GROUP BY 1 ORDER BY 3 DESC LIMIT 30").fetchall():
    say(f'- {r[0]}: {r[1]:,} rows, {int(r[2] or 0):,} claim lines, ${r[3] or 0:,.0f}, {r[4]:,} providers, smallest patient count {r[5]}')

say('', f'## {args.state} rows per provider and month for the asked codes, all years', '')
for r in con.execute(f"SELECT code, yr, count(*), sum(claims) FROM mm WHERE state = {lit(args.state)} AND code IN ({','.join(lit(c) for c in codes)}) GROUP BY 1, 2 ORDER BY 1, 2").fetchall():
    say(f'- {r[0]} {r[1]}: {r[2]:,} rows, {int(r[3] or 0):,} claim lines')

os.makedirs(os.path.dirname(args.out), exist_ok=True)
open(args.out, 'w').write('\n'.join(out) + '\n')
