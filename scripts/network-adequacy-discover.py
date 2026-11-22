# Step 8 discovery (2026-11-22): CMS Medicare Advantage network adequacy
# standards (the HSD Reference File: county designation and the maximum time
# and distance per specialty type). Read only. Finds the file links on CMS's
# pages (live, else the Internet Archive's copy), downloads them, and records
# every sheet's header and sample rows to
# supabase/reference/network-adequacy/discovery.md so the parser is written
# against the real layout.
import re, os, io, zipfile, subprocess, datetime, urllib.parse
PAGES = [
  'https://www.cms.gov/medicare/enrollment-renewal/health-plans/network-adequacy',
  'https://www.cms.gov/medicare/health-plan-network-adequacy',
  'https://www.cms.gov/Medicare/Medicare-Advantage/MedicareAdvantageApps',
]
UA = 'Mozilla/5.0 (compatible; ProviderPulse-loader)'
out = ['# CMS Medicare Advantage network adequacy: discovery', '', f'Run {datetime.date.today()} by scripts/network-adequacy-discover.py. Read only.', '']
links = []
def get(u):
  try: return subprocess.run(['curl', '-sSL', '--max-time', '60', '-A', UA, u], capture_output=True).stdout
  except Exception: return b''
for p in PAGES:
  for src in (p, 'https://web.archive.org/web/2026/' + p):
    t = get(src).decode('utf8', 'ignore')
    found = [urllib.parse.urljoin(src, m) for m in re.findall(r'href="([^"]+\.(?:xlsx|xls|zip|csv|pdf))"', t, re.I)]
    found = [re.sub(r'^https?://web\.archive\.org/web/\d+(id_)?/', '', f) for f in found]
    out.append(f'- {src}: {len(t)} bytes, {len(found)} file links')
    keep = [f for f in found if re.search(r'hsd|reference|time|distance|adequacy|criteria', f, re.I)]
    links += [f for f in keep if f not in links]
    if found: break
out += ['', '## Candidate files', ''] + ['- ' + l for l in links] + ['']
os.makedirs('/tmp/na', exist_ok=True)
import openpyxl
for l in links:
  if l.lower().endswith('.pdf'): continue
  b = get(l)
  if len(b) < 1000 or b[:200].lower().find(b'<html') >= 0:
    b = get('https://web.archive.org/web/2026id_/' + l)
  if len(b) < 1000: out.append('download failed: ' + l); continue
  out += [f'## {l.split("/")[-1]}', '', f'- bytes: {len(b)}']
  blobs = []
  if l.lower().endswith('.zip'):
    try:
      z = zipfile.ZipFile(io.BytesIO(b))
      blobs = [(n, z.read(n)) for n in z.namelist() if n.lower().endswith(('.xlsx', '.csv'))]
    except Exception as e: out.append('unzip failed: ' + str(e))
  else: blobs = [(l.split('/')[-1], b)]
  for name, data in blobs:
    if name.lower().endswith('.csv'):
      lines = data.decode('utf8', 'ignore').splitlines()
      out += [f'### {name}', '', f'- rows: {len(lines)}', '```'] + lines[:6] + ['```', '']
      continue
    try: wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    except Exception as e: out.append(f'{name}: not readable ({e})'); continue
    for ws in wb.worksheets:
      rows = list(ws.iter_rows(max_row=12, values_only=True))
      out += [f'### {name} / {ws.title}', '', f'- rows: {ws.max_row}', '```'] + [' | '.join('' if v is None else str(v) for v in r) for r in rows] + ['```', '']
os.makedirs('supabase/reference/network-adequacy', exist_ok=True)
open('supabase/reference/network-adequacy/discovery.md', 'w').write('\n'.join(out) + '\n')
print('\n'.join(out[:40]))
