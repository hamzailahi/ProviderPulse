#!/usr/bin/env bash
# Read only (nad-status-discover.yml): what USDOT publishes about which parts
# of the National Address Database are public domain, to decide which
# counties of the partly public states (CO, IL, KS, MD, MN, ND, SC, SD) an
# NAD apply may use. Saves the NAD page's text and every layer of USDOT's NAD
# status map (ArcGIS), attributes only, to supabase/reference/nad-status/.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=supabase/reference/nad-status; mkdir -p "$OUT"
UA="ProviderPulse NAD status check"
get() { curl -sSL --fail --retry 3 --retry-delay 10 -A "$UA" "$@"; }

echo "== USDOT NAD pages"
for u in https://www.transportation.gov/gis/national-address-database \
         https://www.transportation.gov/gis/national-address-database/national-address-database-0 \
         https://www.transportation.gov/gis/national-address-database/national-address-database-nad-disclaimer; do
  f="$OUT/page-$(basename "$u").txt"
  if get "$u" -o "$f.html"; then
    python3 - "$f.html" "$f" <<'PY'
import html, re, sys
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
links = sorted(set(re.findall(r'href="([^"]+)"', s)))
s = re.sub(r'(?is)<(script|style).*?</\1>', ' ', s)
t = html.unescape(re.sub(r'<[^>]+>', ' ', s))
t = re.sub(r'[ \t]+', ' ', t)
t = re.sub(r'\n\s*\n+', '\n', t)
open(sys.argv[2], 'w').write(t.strip() + '\n\n## links\n' + '\n'.join(l for l in links if any(k in l.lower() for k in ('arcgis', 'nad', 'address', '.pdf', '.xlsx', '.csv'))) + '\n')
PY
    rm -f "$f.html"; echo "saved $f ($(wc -c < "$f") bytes)"
  else echo "::warning::could not fetch $u"; fi
done

echo "== NAD status map layers"
SVC=https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/National_Address_Database_WFL1/FeatureServer
get "$SVC/layers?f=json" -o "$OUT/layers.json" || { echo "::error::status map not reachable"; exit 1; }
python3 - "$OUT/layers.json" > "$OUT/layer-ids.txt" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
for l in d.get('layers', []) + d.get('tables', []):
    print(l['id'], l.get('name', ''), sep='\t')
PY
cat "$OUT/layer-ids.txt"
while IFS=$'\t' read -r id name; do
  off=0; : > "$OUT/layer-$id.jsonl"
  while :; do
    get "$SVC/$id/query?where=1%3D1&outFields=*&returnGeometry=false&resultOffset=$off&resultRecordCount=1000&f=json" -o "$OUT/page.json"
    n=$(python3 - "$OUT/page.json" "$OUT/layer-$id.jsonl" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
if 'error' in d: print(-1); sys.exit()
with open(sys.argv[2], 'a') as f:
    for x in d.get('features', []): f.write(json.dumps(x.get('attributes', {}), sort_keys=True) + '\n')
print(len(d.get('features', [])))
PY
)
    [ "$n" -gt 0 ] || break
    off=$((off + n)); [ "$n" -ge 1000 ] || break
  done
  echo "layer $id ($name): $(wc -l < "$OUT/layer-$id.jsonl") rows"
done < "$OUT/layer-ids.txt"
rm -f "$OUT/page.json"
