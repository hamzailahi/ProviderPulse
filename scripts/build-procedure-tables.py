#!/usr/bin/env python3
"""Builds the Procedures panel's new sources (migration 036) and, in apply
mode, loads them. Runs in GitHub Actions ("Procedure tables" workflow).

  medicaid_procedures           HHS Medicaid Provider Spending by HCPCS
                                (T-MSIS Parquet, read with DuckDB), newest
                                year, per ZIP x specialty x code.
  medicare_hospital_procedures  CMS Medicare Outpatient (APC) and Inpatient
                                (DRG) Hospitals by Provider and Service,
                                newest year.
  procedure_codes               descriptions for the Medicaid codes, from
                                CMS's Physician & Other Practitioners by
                                Geography and Service file (CPT and HCPCS
                                codes Medicare pays) and, when it can be
                                found, CMS's HCPCS Level II file.

Columns are the ones recorded by the discovery job in
supabase/reference/procedure-sources/ (2026-10-11).

Medicaid rows: the servicing NPI when it is a valid 10-digit NPI, else the
billing NPI when that is; placed at that NPI's
ZIP and specialty in our own directory (clinics + provider_individuals), so
the panel matches the map. Specialty is the CMS specialty for the NPI's NUCC
code (supabase/reference/taxonomy_map.csv), else the NUCC classification.
Dropped and counted, never guessed: malformed codes, malformed NPIs, negative
or impossible amounts (more than MAX_PAID_PER_LINE per claim line: the 2018
file carries trillions), and NPIs not in the directory.

Modes: dry_run (default) builds the CSVs and writes a summary; apply also
loads them, refusing unless --disk-free-gb covers the estimate.

Run: python3 scripts/build-procedure-tables.py [--mode dry_run|apply]
       [--disk-free-gb N] [--out DIR] [--work DIR]
       [--medicaid PATH_OR_URL] [--outpatient ..] [--inpatient ..]
       [--physician-geo ..] [--directory CSV] [--taxonomy-map CSV]
"""
import argparse, csv, json, os, re, subprocess, sys, time, urllib.request
import duckdb

MAX_PAID_PER_LINE = 250_000          # a single claim line above this is a data error
CODE_RE = r'^([0-9]{4}[0-9FTU]|[A-V][0-9]{4})$'
NPI_RE = r'^[0-9]{10}$'
UA = {'User-Agent': 'ProviderPulse procedure tables (github.com/hamzailahi/ProviderPulse)'}

ap = argparse.ArgumentParser()
ap.add_argument('--mode', default='dry_run', choices=['dry_run', 'apply'])
ap.add_argument('--disk-free-gb', type=float, default=None)
ap.add_argument('--out', default='supabase/reference/procedure-sources')
ap.add_argument('--work', default=os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'proc'))
ap.add_argument('--medicaid'); ap.add_argument('--outpatient'); ap.add_argument('--inpatient')
ap.add_argument('--physician-geo'); ap.add_argument('--hcpcs-l2')
ap.add_argument('--directory'); ap.add_argument('--taxonomy-map', default='supabase/reference/taxonomy_map.csv')
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True); os.makedirs(args.work, exist_ok=True)

summary = ['<!-- Written by scripts/build-procedure-tables.py. -->',
           f"# Procedure tables ({args.mode}), {time.strftime('%Y-%m-%d %H:%M', time.gmtime())} UTC", '']
def say(s=''):
    summary.append(s); print(s, flush=True)
def finish(code=0):
    open(os.path.join(args.out, 'build-summary.md'), 'w').write('\n'.join(summary) + '\n')
    sys.exit(code)
def fail(msg):
    say(f'\n**Failed:** {msg}'); print(f'::error::{msg}'); finish(1)

def get(url, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()
def download(url, name):
    if not re.match(r'^https?:', url): return url          # local file (tests)
    path = os.path.join(args.work, name)
    t = time.time()
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=900) as r, open(path, 'wb') as f:
        while True:
            b = r.read(8 << 20)
            if not b: break
            f.write(b)
    say(f'- downloaded {name}: {os.path.getsize(path)/1e6:,.0f} MB in {time.time()-t:.0f}s')
    return path

# ---------------------------------------------------------------- sources --
def medicaid_url():
    page = get('https://opendata.hhs.gov/datasets/medicaid-provider-spending').decode('utf-8', 'replace')
    hits = sorted(set(u for u in re.findall(r'https?://[^"\'\s<>\\]+', page) if u.lower().endswith('.parquet')))
    if not hits: fail('no Parquet link on the HHS dataset page')
    return hits[-1]

_cat = None
def cms(title_re, label):
    """Newest CSV of a data.cms.gov dataset whose title (without its release stamp) matches."""
    global _cat
    if _cat is None:
        j = json.loads(get('https://data.cms.gov/data.json', 300))
        _cat = j.get('dataset', j)
    best = None
    for d in _cat:
        t = re.sub(r'\s*:\s*(19|20)\d{2}(-\d{2}(-\d{2})?)?\s*$', '', str(d.get('title', '')).strip())
        if not re.search(title_re, t, re.I): continue
        for x in d.get('distribution', []):
            u = x.get('downloadURL') or ''
            if not re.search(r'\.csv($|\?)', u, re.I): continue
            ys = [int(y) for y in re.findall(r'(20\d{2})', (x.get('title') or '') + ' ' + u)]
            y = max(ys) if ys else 0
            if best is None or y > best[0]: best = (y, u)
    if not best: fail(f'{label}: no CSV in the CMS catalog for /{title_re}/')
    say(f'- {label}: {best[0] or "?"} {best[1]}')
    return best[1]

def hcpcs_l2_url():
    """Best effort: the newest alpha-numeric HCPCS zip linked from CMS's quarterly page."""
    try:
        page = get('https://www.cms.gov/medicare/coding-billing/healthcare-common-procedure-system/quarterly-update').decode('utf-8', 'replace')
        links = [l for l in re.findall(r'href="([^"]+\.zip)"', page) if re.search(r'alpha|anweb|hcpc', l, re.I)]
        links = ['https://www.cms.gov' + l if l.startswith('/') else l for l in links]
        if not links: return None
        def key(l):
            y = re.findall(r'(20\d{2})', l); m = re.search(r'(jan|apr|jul|oct)', l, re.I)
            return (int(y[-1]) if y else 0, ['jan', 'apr', 'jul', 'oct'].index(m.group(1).lower()) if m else -1)
        return sorted(links, key=key)[-1]
    except Exception as e:
        say(f'- HCPCS Level II page: {e}'); return None

say('## Sources\n')
med = args.medicaid or medicaid_url(); say(f'- Medicaid: {med}')
outp = args.outpatient or cms(r'^Medicare Outpatient Hospitals\s*-?\s*by Provider and Service$', 'Outpatient hospitals')
inp = args.inpatient or cms(r'^Medicare Inpatient Hospitals\s*-?\s*by Provider and Service$', 'Inpatient hospitals')
geo = args.physician_geo or cms(r'^Medicare Physician & Other Practitioners\s*-?\s*by Geography and Service$', 'Physician by geography')
l2 = args.hcpcs_l2 if args.hcpcs_l2 is not None else hcpcs_l2_url()
say(f'- HCPCS Level II: {l2 or "not found (Medicaid-only codes such as T1019 will show without a description)"}')

say('\n## Downloads\n')
med = download(med, 'medicaid.parquet'); outp = download(outp, 'outpatient.csv')
inp = download(inp, 'inpatient.csv'); geo = download(geo, 'physician-geo.csv')

# ---------------------------------------------------------------- directory --
if args.directory:
    directory = args.directory
else:
    db = os.environ.get('SUPABASE_DB_URL')
    if not db: fail('SUPABASE_DB_URL is not set (needed to place NPIs at a ZIP and specialty)')
    directory = os.path.join(args.work, 'directory.csv')
    sql = ("\\copy (select npi::text as npi, zip::text as zip, coalesce(taxonomy_code,'') as taxonomy_code from public.clinics "
           "where npi is not null and zip is not null union all select npi, zip, coalesce(taxonomy_code,'') "
           "from public.provider_individuals where zip is not null) to '" + directory + "' with (format csv, header true)")
    t = time.time()
    r = subprocess.run(['psql', db, '-v', 'ON_ERROR_STOP=1', '-q', '-X', '-c', 'set default_transaction_read_only = on;', '-c', sql],
                       capture_output=True, text=True)
    if r.returncode: fail('reading the directory: ' + r.stderr.strip()[-300:])
    say(f'- directory: {os.path.getsize(directory)/1e6:,.0f} MB in {time.time()-t:.0f}s')

con = duckdb.connect(os.path.join(args.work, 'build.duckdb'))
con.execute("SET preserve_insertion_order = false")
def one(sql): return con.execute(sql).fetchone()
def lit(p): return "'" + p.replace("'", "''") + "'"

# ---------------------------------------------------------------- Medicaid --
say('\n## Medicaid\n')
year = one(f"SELECT max(substr(CLAIM_FROM_MONTH, 1, 4)) FROM read_parquet({lit(med)})")[0]
say(f'- newest year: {year}')
con.execute(f"""CREATE OR REPLACE TABLE raw AS
  SELECT CASE WHEN regexp_matches(trim(COALESCE(SERVICING_PROVIDER_NPI_NUM, '')), '{NPI_RE}') THEN trim(SERVICING_PROVIDER_NPI_NUM)
              WHEN regexp_matches(trim(COALESCE(BILLING_PROVIDER_NPI_NUM, '')), '{NPI_RE}') THEN trim(BILLING_PROVIDER_NPI_NUM) END AS npi,
         upper(trim(HCPCS_CODE)) AS code, TOTAL_PATIENTS AS patients, TOTAL_CLAIM_LINES AS claims, TOTAL_PAID AS paid
  FROM read_parquet({lit(med)}) WHERE substr(CLAIM_FROM_MONTH, 1, 4) = '{year}'""")
con.execute(f"""CREATE OR REPLACE TABLE checked AS SELECT *,
  CASE WHEN code IS NULL OR NOT regexp_matches(code, '{CODE_RE}') THEN 'malformed code'
       WHEN npi IS NULL THEN 'no valid servicing or billing NPI'
       WHEN claims IS NULL OR claims <= 0 OR paid IS NULL OR paid < 0 THEN 'no claims or negative paid'
       WHEN paid / claims > {MAX_PAID_PER_LINE} THEN 'paid per claim line over {MAX_PAID_PER_LINE:,}'
       ELSE NULL END AS drop_reason FROM raw""")
tot = one('SELECT count(*), sum(paid) FROM checked')
say(f'- rows {tot[0]:,}, paid ${tot[1] or 0:,.0f}')
for r in con.execute("SELECT drop_reason, count(*), sum(paid) FROM checked WHERE drop_reason IS NOT NULL GROUP BY 1 ORDER BY 2 DESC").fetchall():
    say(f'- dropped, {r[0]}: {r[1]:,} rows, ${r[2] or 0:,.0f}')

con.execute(f"""CREATE OR REPLACE TABLE dir AS
  SELECT npi, any_value(lpad(substr(zip, 1, 5), 5, '0')) AS zip, any_value(taxonomy_code) AS taxonomy_code
  FROM read_csv({lit(directory)}, header=true, all_varchar=true) WHERE npi IS NOT NULL AND zip IS NOT NULL GROUP BY npi""")
con.execute(f"""CREATE OR REPLACE TABLE tmap AS
  SELECT nucc_code, COALESCE(NULLIF(split_part(cms_specialty_name, '; ', 1), ''), NULLIF(classification, '')) AS specialty
  FROM read_csv({lit(args.taxonomy_map)}, header=true, all_varchar=true)""")
con.execute("""CREATE OR REPLACE TABLE placed AS
  SELECT c.npi, c.code, c.patients, c.claims, c.paid, d.zip, COALESCE(t.specialty, 'Specialty not recorded') AS specialty
  FROM checked c LEFT JOIN dir d USING (npi) LEFT JOIN tmap t ON t.nucc_code = d.taxonomy_code
  WHERE c.drop_reason IS NULL""")
miss = one('SELECT count(*), sum(paid), count(DISTINCT npi) FROM placed WHERE zip IS NULL')
say(f'- dropped, NPI not in our directory: {miss[0]:,} rows, ${miss[1] or 0:,.0f}, {miss[2]:,} NPIs')
con.execute(f"""CREATE OR REPLACE TABLE medicaid_out AS
  SELECT zip, specialty, code, sum(claims) AS claims, sum(patients) AS patient_months,
         round(sum(paid), 2) AS paid, count(DISTINCT npi) AS providers, {int(year)} AS year
  FROM placed WHERE zip IS NOT NULL AND regexp_matches(zip, '^[0-9]{{5}}$')
  GROUP BY 1, 2, 3""")
kept = one('SELECT count(*), sum(paid), sum(claims), count(DISTINCT zip) FROM medicaid_out')
say(f'- kept: {kept[0]:,} ZIP x specialty x code rows, ${kept[1] or 0:,.0f} paid, {kept[2] or 0:,} claim lines, {kept[3]:,} ZIPs')
say(f'- share of valid {year} spending placed: {100*(kept[1] or 0)/max(1, one("SELECT sum(paid) FROM checked WHERE drop_reason IS NULL")[0] or 1):.1f}%')
say('\nTop specialties by paid:\n')
for r in con.execute('SELECT specialty, sum(paid), sum(claims) FROM medicaid_out GROUP BY 1 ORDER BY 2 DESC LIMIT 12').fetchall():
    say(f'- {r[0]}: ${r[1]:,.0f}, {r[2]:,} claim lines')

# ---------------------------------------------------------------- hospitals --
say('\n## Medicare hospitals\n')
def num(c): return f"TRY_CAST(NULLIF(trim(CAST({c} AS VARCHAR)), '') AS DOUBLE)"
hyear_o = re.findall(r'DY(\d{2})', os.path.basename(outp)); hyear_i = re.findall(r'DY(\d{2})', os.path.basename(inp))
con.execute(f"""CREATE OR REPLACE TABLE hosp_out AS
  SELECT 'outpatient' AS setting, trim(Rndrng_Prvdr_CCN) AS ccn, trim(Rndrng_Prvdr_Org_Name) AS hospital,
         lpad(trim(CAST(Rndrng_Prvdr_Zip5 AS VARCHAR)), 5, '0') AS zip, trim(CAST(APC_Cd AS VARCHAR)) AS code,
         trim(APC_Desc) AS description, CAST({num('Bene_Cnt')} AS INTEGER) AS patients,
         CAST({num('CAPC_Srvcs')} AS INTEGER) AS services, round({num('Avg_Tot_Sbmtd_Chrgs')}, 2) AS avg_charge,
         round({num('Avg_Mdcr_Alowd_Amt')}, 2) AS avg_allowed, round({num('Avg_Mdcr_Pymt_Amt')}, 2) AS avg_paid
  FROM read_csv({lit(outp)}, header=true, all_varchar=true)
  UNION ALL
  SELECT 'inpatient', trim(Rndrng_Prvdr_CCN), trim(Rndrng_Prvdr_Org_Name),
         lpad(trim(CAST(Rndrng_Prvdr_Zip5 AS VARCHAR)), 5, '0'), trim(CAST(DRG_Cd AS VARCHAR)), trim(DRG_Desc),
         CAST({num('Tot_Dschrgs')} AS INTEGER), NULL, round({num('Avg_Submtd_Cvrd_Chrg')}, 2),
         round({num('Avg_Tot_Pymt_Amt')}, 2), round({num('Avg_Mdcr_Pymt_Amt')}, 2)
  FROM read_csv({lit(inp)}, header=true, all_varchar=true)""")
hy = 2000 + int((hyear_o or hyear_i)[0]) if (hyear_o or hyear_i) else int(year)   # file names carry DY24 = data year 2024
con.execute(f"""CREATE OR REPLACE TABLE hospital_out AS SELECT *, {hy} AS year FROM hosp_out
  WHERE ccn <> '' AND code <> '' AND patients IS NOT NULL AND regexp_matches(zip, '^[0-9]{{5}}$')
  QUALIFY row_number() OVER (PARTITION BY setting, ccn, code ORDER BY patients DESC) = 1""")
for r in con.execute("SELECT setting, count(*), count(DISTINCT ccn), sum(patients) FROM hospital_out GROUP BY 1 ORDER BY 1").fetchall():
    say(f'- {r[0]}: {r[1]:,} rows, {r[2]:,} hospitals, {r[3]:,} {"discharges" if r[0] == "inpatient" else "patients"} ({hy})')
skipped = one("SELECT count(*) FROM hosp_out") [0] - one("SELECT count(*) FROM hospital_out")[0]
say(f'- skipped (suppressed counts, missing ZIP or duplicates): {skipped:,}')

# ---------------------------------------------------------------- codes ----
say('\n## Code descriptions\n')
con.execute(f"""CREATE OR REPLACE TABLE codes AS
  SELECT upper(trim(HCPCS_Cd)) AS code, any_value(trim(HCPCS_Desc)) AS description, 'CMS physician by geography' AS source
  FROM read_csv({lit(geo)}, header=true, all_varchar=true)
  WHERE HCPCS_Cd IS NOT NULL AND HCPCS_Desc IS NOT NULL AND trim(HCPCS_Desc) <> '' GROUP BY 1""")
if l2:
    try:
        import zipfile, io
        z = zipfile.ZipFile(io.BytesIO(get(l2, 300)) if re.match(r'^https?:', l2) else l2)
        names = z.namelist(); say(f'- HCPCS Level II zip: {", ".join(names[:10])}')
        xl = [n for n in names if n.lower().endswith('.xlsx')]
        rows = []
        if xl:
            import openpyxl
            ws = openpyxl.load_workbook(io.BytesIO(z.read(xl[0])), read_only=True).worksheets[0]
            it = ws.iter_rows(values_only=True); head = [str(h or '').strip().upper() for h in next(it)]
            ci = next((i for i, h in enumerate(head) if h in ('HCPC', 'HCPCS', 'HCPCS CODE')), None)
            di = next((i for i, h in enumerate(head) if 'LONG' in h and 'DESC' in h), None)
            if ci is None or di is None: raise ValueError(f'columns not found in {head[:12]}')
            for r in it:
                c, d = (str(r[ci] or '').strip().upper(), str(r[di] or '').strip())
                if re.match(r'^[A-V][0-9]{4}$', c) and d: rows.append((c, d))
        else:
            raise ValueError('no .xlsx inside')
        con.execute('CREATE OR REPLACE TABLE l2 (code VARCHAR, description VARCHAR)')
        con.executemany('INSERT INTO l2 VALUES (?, ?)', list({c: d for c, d in rows}.items()))
        con.execute("""INSERT INTO codes SELECT code, description, 'CMS HCPCS Level II' FROM l2
                       WHERE code NOT IN (SELECT code FROM codes)""")
        say(f'- HCPCS Level II descriptions: {len(rows):,}')
    except Exception as e:
        say(f'- HCPCS Level II not used: {e}')
con.execute("""CREATE OR REPLACE TABLE codes_out AS
  SELECT c.code, left(c.description, 300) AS description, c.source FROM codes c
  WHERE c.code IN (SELECT DISTINCT code FROM medicaid_out) AND regexp_matches(c.code, '^.{5}$')""")
cov = one("""SELECT count(*), sum(CASE WHEN c.code IS NULL THEN 0 ELSE m.paid END) / sum(m.paid)
             FROM (SELECT code, sum(paid) paid FROM medicaid_out GROUP BY 1) m LEFT JOIN codes_out c USING (code)""")
say(f'- {one("SELECT count(*) FROM codes_out")[0]:,} Medicaid codes described, covering {100*(cov[1] or 0):.1f}% of Medicaid paid')

# ---------------------------------------------------------------- outputs --
files = {}
for t, cols in [('medicaid_out', 'zip, specialty, code, claims, patient_months, paid, providers, year'),
                ('hospital_out', 'setting, ccn, hospital, zip, code, description, patients, services, avg_charge, avg_allowed, avg_paid, year'),
                ('codes_out', 'code, description, source')]:
    p = os.path.join(args.work, t + '.csv')
    con.execute(f"COPY (SELECT {cols} FROM {t}) TO {lit(p)} (HEADER, DELIMITER ',')")
    files[t] = p
csv_gb = sum(os.path.getsize(p) for p in files.values()) / 1e9
need_gb = round(csv_gb * 2.5 + 1.0, 1)      # heap + primary key index + staging copy, plus WAL headroom
say(f'\n## Size\n\n- CSVs: {csv_gb:.2f} GB; estimated database need while loading: {need_gb} GB')

if args.mode == 'dry_run':
    say('\nDry run: nothing written to the database.'); finish(0)

# ---------------------------------------------------------------- apply ----
say('\n## Apply\n')
if args.disk_free_gb is None or args.disk_free_gb < need_gb:
    fail(f'apply needs --disk-free-gb of at least {need_gb} (given {args.disk_free_gb})')
db = os.environ.get('SUPABASE_DB_URL')
if not db: fail('SUPABASE_DB_URL is not set')
script = f"""
\\set ON_ERROR_STOP on
drop table if exists public.proc_stage_medicaid, public.proc_stage_hospital, public.proc_stage_codes;
create unlogged table public.proc_stage_medicaid (like public.medicaid_procedures);
create unlogged table public.proc_stage_hospital (like public.medicare_hospital_procedures);
create unlogged table public.proc_stage_codes (like public.procedure_codes);
\\copy public.proc_stage_medicaid from '{files['medicaid_out']}' with (format csv, header true)
\\copy public.proc_stage_hospital from '{files['hospital_out']}' with (format csv, header true)
\\copy public.proc_stage_codes from '{files['codes_out']}' with (format csv, header true)
begin;
truncate public.medicaid_procedures, public.medicare_hospital_procedures, public.procedure_codes;
insert into public.medicaid_procedures select * from public.proc_stage_medicaid;
insert into public.medicare_hospital_procedures select * from public.proc_stage_hospital;
insert into public.procedure_codes select * from public.proc_stage_codes;
commit;
drop table public.proc_stage_medicaid, public.proc_stage_hospital, public.proc_stage_codes;
analyze public.medicaid_procedures; analyze public.medicare_hospital_procedures; analyze public.procedure_codes;
select 'medicaid_procedures', count(*) from public.medicaid_procedures
union all select 'medicare_hospital_procedures', count(*) from public.medicare_hospital_procedures
union all select 'procedure_codes', count(*) from public.procedure_codes;
"""
t = time.time()
r = subprocess.run(['psql', db, '-X', '-q', '-At', '-F', ': '], input=script, capture_output=True, text=True)
if r.returncode:
    subprocess.run(['psql', db, '-X', '-q', '-c', 'drop table if exists public.proc_stage_medicaid, public.proc_stage_hospital, public.proc_stage_codes;'])
    fail('load: ' + r.stderr.strip()[-400:])
for line in r.stdout.strip().splitlines(): say(f'- {line}')
say(f'- loaded in {time.time()-t:.0f}s')
finish(0)
