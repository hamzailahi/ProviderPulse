#!/usr/bin/env python3
"""End-to-end test of scripts/build-procedure-tables.py on small fixture
files shaped like the real ones (columns from supabase/reference/
procedure-sources/, 2026-10-11). No network, no database: dry_run mode.

Run: python3 scripts/test-procedure-tables.py   (needs duckdb)
"""
import csv, os, subprocess, sys, tempfile
import duckdb

passed = failed = 0
def ok(cond, label):
    global passed, failed
    if cond: passed += 1; print(f'  PASS  {label}')
    else: failed += 1; print(f'  FAIL  {label}')

w = tempfile.mkdtemp(prefix='proctest-')
P = lambda n: os.path.join(w, n)

# Medicaid: servicing NPI preferred, billing as fallback; junk rows of every kind.
con = duckdb.connect()
con.execute("""CREATE TABLE m (BILLING_PROVIDER_NPI_NUM VARCHAR, SERVICING_PROVIDER_NPI_NUM VARCHAR, HCPCS_CODE VARCHAR,
  CLAIM_FROM_MONTH VARCHAR, TOTAL_PATIENTS BIGINT, TOTAL_CLAIM_LINES BIGINT, TOTAL_PAID DOUBLE)""")
rows = [
  ('1111111111', '2222222222', '99213', '2024-01', 20, 30, 1500.0),   # servicing NPI, a cardiologist in 38017
  ('1111111111', '2222222222', '99213', '2024-02', 15, 18, 900.0),    # second month, same cell
  ('1111111111', None,         '99213', '2024-03', 12, 12, 600.0),    # no servicing: billing NPI (a clinic in 38018)
  ('1111111111', '3333333333', 'T1019', '2024-05', 40, 400, 20000.0), # HCPCS Level II, home health
  ('1111111111', '2222222222', '20',    '2024-04', 900, 9000, 5e12),  # malformed code (the real file has these)
  ('1111111111', 'ABC',        '99214', '2024-04', 12, 12, 100.0),    # malformed servicing NPI: falls back to the billing NPI
  (None,         'XYZ',        '99214', '2024-04', 12, 12, 100.0),    # neither NPI valid: dropped
  ('1111111111', '2222222222', '99214', '2024-06', 12, 1, 900000.0),  # impossible paid per line
  ('1111111111', '9999999999', '99214', '2024-06', 12, 12, 700.0),    # NPI not in the directory
  ('1111111111', '2222222222', '99213', '2023-12', 99, 99, 99999.0),  # older year: ignored
]
con.executemany('INSERT INTO m VALUES (?,?,?,?,?,?,?)', rows)
con.execute(f"COPY m TO '{P('m.parquet')}' (FORMAT parquet)")

with open(P('dir.csv'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(['npi', 'zip', 'taxonomy_code'])
    c.writerow(['2222222222', '38017', '207RC0000X'])   # Internal Medicine, Cardiovascular Disease
    c.writerow(['1111111111', '380181234', '261QM1300X'])  # ZIP+4 is cut to 5; multi-specialty clinic
    c.writerow(['3333333333', '38017', '251E00000X'])   # Home Health
with open(P('tmap.csv'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(['nucc_code', 'classification', 'cms_specialty_name'])
    c.writerow(['207RC0000X', 'Internal Medicine', 'Cardiology; Interventional Cardiology'])
    c.writerow(['261QM1300X', 'Clinic/Center', ''])
    c.writerow(['251E00000X', 'Home Health', 'Home Health Agency (HHA)'])

out_cols = ['Rndrng_Prvdr_CCN', 'Rndrng_Prvdr_Org_Name', 'Rndrng_Prvdr_St', 'Rndrng_Prvdr_City', 'Rndrng_Prvdr_State_Abrvtn',
            'Rndrng_Prvdr_State_FIPS', 'Rndrng_Prvdr_Zip5', 'Rndrng_Prvdr_RUCA', 'Rndrng_Prvdr_RUCA_Desc', 'APC_Cd', 'APC_Desc',
            'Bene_Cnt', 'CAPC_Srvcs', 'Avg_Tot_Sbmtd_Chrgs', 'Avg_Mdcr_Alowd_Amt', 'Avg_Mdcr_Pymt_Amt', 'Outlier_Srvcs', 'Avg_Mdcr_Outlier_Amt']
with open(P('MUP_OUT_RY26_P04_V10_DY24_Prov_Svc.csv'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(out_cols)
    c.writerow(['440001', 'Memphis General', '1 Main', 'Memphis', 'TN', '47', '38017', '1', 'Metro', '5072', 'Level 2 Excision', '175', '188', '9637.66', '1365.37', '1080.95', '0', '0'])
    c.writerow(['440001', 'Memphis General', '1 Main', 'Memphis', 'TN', '47', '38017', '1', 'Metro', '5112', 'Level 2 Musculoskeletal', '', '', '', '', '', '', ''])  # suppressed
inp_cols = ['Rndrng_Prvdr_CCN', 'Rndrng_Prvdr_Org_Name', 'Rndrng_Prvdr_City', 'Rndrng_Prvdr_St', 'Rndrng_Prvdr_State_FIPS',
            'Rndrng_Prvdr_Zip5', 'Rndrng_Prvdr_State_Abrvtn', 'Rndrng_Prvdr_RUCA', 'Rndrng_Prvdr_RUCA_Desc', 'DRG_Cd', 'DRG_Desc',
            'Tot_Dschrgs', 'Avg_Submtd_Cvrd_Chrg', 'Avg_Tot_Pymt_Amt', 'Avg_Mdcr_Pymt_Amt']
with open(P('MUP_INP_RY26_P03_V10_DY24_PrvSvc.CSV'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(inp_cols)
    c.writerow(['440001', 'Memphis General', 'Memphis', '1 Main', '47', '38017', 'TN', '1', 'Metro', '003', 'ECMO OR TRACHEOSTOMY, WITH MV', '11', '738478.63', '103236.27', '91218.18'])
with open(P('centroids.csv'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(['zip', 'lat', 'lon']); c.writerow(['38017', '35.04', '-89.66'])
with open(P('geo.csv'), 'w', newline='') as f:
    c = csv.writer(f); c.writerow(['Rndrng_Prvdr_Geo_Lvl', 'HCPCS_Cd', 'HCPCS_Desc'])
    c.writerow(['National', '99213', 'Established patient office or other outpatient visit'])
    c.writerow(['National', '99214', 'Established patient visit, moderate'])

r = subprocess.run([sys.executable, 'scripts/build-procedure-tables.py', '--mode', 'dry_run', '--out', P('out'), '--work', P('work'),
                    '--medicaid', P('m.parquet'), '--outpatient', P('MUP_OUT_RY26_P04_V10_DY24_Prov_Svc.csv'),
                    '--inpatient', P('MUP_INP_RY26_P03_V10_DY24_PrvSvc.CSV'), '--physician-geo', P('geo.csv'), '--hcpcs-l2', '',
                    '--directory', P('dir.csv'), '--taxonomy-map', P('tmap.csv'), '--centroids', P('centroids.csv')], capture_output=True, text=True)
ok(r.returncode == 0, 'dry run succeeds' + ('' if r.returncode == 0 else ': ' + r.stdout[-800:] + r.stderr[-800:]))
if r.returncode:
    print(f'\n{passed} passed, {failed} failed'); sys.exit(1)

def read(n): return list(csv.DictReader(open(os.path.join(P('work'), n))))
med = read('medicaid_out.csv'); hosp = read('hospital_out.csv'); codes = read('codes_out.csv')
summary = open(os.path.join(P('out'), 'build-summary.md')).read()
key = {(m['zip'], m['specialty'], m['code']): m for m in med}

c = key.get(('38017', 'Cardiology', '99213'))
ok(c is not None, 'servicing NPI placed at its ZIP with the CMS specialty for its code (first of several)')
ok(c and c['claims'] == '48' and float(c['paid']) == 2400.0 and c['patient_months'] == '35', 'months of one cell add up (claims 48, paid 2,400, patient-months 35)')
ok(c and c['year'] == '2024' and c['providers'] == '1', 'newest year only; one provider')
k = key.get(('38018', 'Clinic/Center', '99213'))
ok(k is not None and k['claims'] == '12', 'billing NPI used when there is no servicing NPI; ZIP+4 cut to 5; NUCC classification when CMS has no specialty')
ok(('38017', 'Home Health Agency (HHA)', 'T1019') in key, 'HCPCS Level II codes kept')
ok(not any(m['code'] == '20' for m in med), 'malformed code dropped')
ok(not any(float(m['paid']) > 100000 for m in med), 'impossible paid per claim line dropped')
ok(len(med) == 4, f'exactly four cells survive (got {len(med)})')
k2 = key.get(('38018', 'Clinic/Center', '99214'))
ok(k2 is not None and k2['claims'] == '12', 'a malformed servicing NPI falls back to a valid billing NPI')
ok('no valid servicing or billing NPI: 1 rows' in summary, 'a row with no valid NPI at all is dropped and counted')
ok('NPI not in our directory: 1 rows' in summary, 'NPI outside the directory dropped and counted')
ok('malformed code: 1 rows' in summary and 'paid per claim line over' in summary, 'every drop reason reported')

o = [h for h in hosp if h['setting'] == 'outpatient']; i = [h for h in hosp if h['setting'] == 'inpatient']
ok(len(o) == 1 and o[0]['code'] == '5072' and o[0]['patients'] == '175' and float(o[0]['avg_paid']) == 1080.95, 'outpatient row with suppressed counts skipped; the rest mapped')
ok(len(i) == 1 and i[0]['code'] == '003' and i[0]['patients'] == '11' and i[0]['services'] == '', 'inpatient DRG keeps its leading zero; discharges as patients; no services')
ok(i and i[0]['description'] == 'ECMO OR TRACHEOSTOMY, WITH MV' and i[0]['year'] == '2024', 'quoted description with a comma survives; data year from the file name')
ok({c['code'] for c in codes} == {'99213', '99214'}, 'descriptions only for codes the Medicaid table uses (T1019 has none in the fixture)')
hs = read('hospitals_out.csv')
ok(len(hs) == 1 and hs[0]['ccn'] == '440001' and hs[0]['zip'] == '38017' and float(hs[0]['lat']) == 35.04, 'one row per hospital, placed at its ZIP centre')
ok('Dry run: nothing written' in summary, 'dry run writes nothing')

r = subprocess.run([sys.executable, 'scripts/build-procedure-tables.py', '--mode', 'apply', '--disk-free-gb', '0', '--out', P('out2'), '--work', P('work2'),
                    '--medicaid', P('m.parquet'), '--outpatient', P('MUP_OUT_RY26_P04_V10_DY24_Prov_Svc.csv'),
                    '--inpatient', P('MUP_INP_RY26_P03_V10_DY24_PrvSvc.CSV'), '--physician-geo', P('geo.csv'), '--hcpcs-l2', '',
                    '--directory', P('dir.csv'), '--taxonomy-map', P('tmap.csv'), '--centroids', P('centroids.csv')], capture_output=True, text=True)
ok(r.returncode != 0 and 'apply needs --disk-free-gb' in r.stdout, 'apply refuses without enough disk')

print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
