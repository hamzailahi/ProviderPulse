#!/usr/bin/env bash
# Read only (nad-status-discover.yml): what USDOT publishes about which parts
# of the National Address Database are public domain, to decide which
# counties of the partly public states (CO, IL, KS, MD, MN, ND, SC, SD) an
# NAD apply may use. Saves the NAD page's text and every layer of USDOT's NAD
# status map (ArcGIS), attributes only, to supabase/reference/nad-status/.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=supabase/reference/nad-status; mkdir -p "$OUT"; rm -f "$OUT"/*.jsonl "$OUT"/*.json "$OUT"/*.tsv
UA="ProviderPulse NAD status check"
get() { curl -sSL --fail --retry 3 --retry-delay 10 -A "$UA" "$@"; }

echo "== USDOT NAD pages (live, else the Internet Archive's latest copy)"
for u in https://www.transportation.gov/gis/national-address-database \
         https://www.transportation.gov/gis/national-address-database/national-address-database-0 \
         https://www.transportation.gov/gis/national-address-database/national-address-database-nad-disclaimer \
         https://www.transportation.gov/gis/national-address-database/nad-faqs \
         https://www.transportation.gov/gis/national-address-database/nad-partners; do
  f="$OUT/page-$(basename "$u").txt"
  if get "$u" -o "$f.html" 2>/dev/null || get "https://web.archive.org/web/2026id_/$u" -o "$f.html"; then
    python3 - "$f.html" "$f" "$u" <<'PY'
import html, re, sys
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
links = sorted(set(re.findall(r'href="([^"]+)"', s)))
s = re.sub(r'(?is)<(script|style|nav|footer|header).*?</\1>', ' ', s)
t = html.unescape(re.sub(r'<[^>]+>', ' ', s))
t = re.sub(r'[ \t]+', ' ', t)
t = re.sub(r'\n\s*\n+', '\n', t)
keep = [l for l in links if any(k in l.lower() for k in ('arcgis', 'national-address', 'nad', '.pdf', '.xlsx', '.csv', 'data.transportation'))]
open(sys.argv[2], 'w').write('# ' + sys.argv[3] + '\n\n' + t.strip() + '\n\n## links\n' + '\n'.join(keep) + '\n')
PY
    rm -f "$f.html"; echo "saved $f ($(wc -c < "$f") bytes)"
  else echo "::warning::could not fetch $u (live or archived)"; rm -f "$f.html"; fi
done

echo "== ArcGIS Online items about the NAD and its status"
for q in 'title:"National Address Database"' 'NAD public domain status' 'National Address Database status'; do
  get --get "https://www.arcgis.com/sharing/rest/search" --data-urlencode "q=$q" --data-urlencode "num=100" --data-urlencode "f=json" -o "$OUT/search.json" || continue
  python3 - "$OUT/search.json" >> "$OUT/arcgis-items.tsv" <<'PY'
import json, sys
for r in json.load(open(sys.argv[1])).get('results', []):
    print(r.get('id'), r.get('type'), r.get('owner'), (r.get('title') or '').replace('\t', ' '), r.get('url') or '', sep='\t')
PY
done
rm -f "$OUT/search.json"
sort -u "$OUT/arcgis-items.tsv" -o "$OUT/arcgis-items.tsv" 2>/dev/null || true
echo "$(wc -l < "$OUT/arcgis-items.tsv" 2>/dev/null || echo 0) ArcGIS items"; cat "$OUT/arcgis-items.tsv" 2>/dev/null | head -60

# USDOT's own status layers, found by that search (owner jason.ford_usdot /
# iftach.pearlman_usdot): NAD County Participation Status, and the layers of
# the "NAD Coverage & Data Currentness" web map. Fields, counts, and every
# row when a layer holds at most 20,000 (one row per county).
dump_service() {
  local svc="$1" tag="$2"
  get "$svc?f=json" -o "$OUT/svc.json" || return 0
  python3 - "$OUT/svc.json" <<'PY' > "$OUT/svc-layers.txt"
import json, sys
d = json.load(open(sys.argv[1]))
for l in d.get('layers', []) + d.get('tables', []): print(l['id'], l.get('name', ''), sep='\t')
PY
  while IFS=$'\t' read -r id name; do
    get "$svc/$id?f=json" -o "$OUT/$tag-$id-fields.json" || continue
    cnt=$(get "$svc/$id/query?where=1%3D1&returnCountOnly=true&f=json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("count", -1))' || echo -1)
    echo "$tag layer $id ($name): $cnt rows"
    if [ "$cnt" -ge 0 ] && [ "$cnt" -le 20000 ]; then
      off=0; : > "$OUT/$tag-$id.jsonl"
      while [ "$off" -lt "$cnt" ]; do
        get "$svc/$id/query?where=1%3D1&outFields=*&returnGeometry=false&resultOffset=$off&resultRecordCount=1000&f=json" -o "$OUT/page.json" || break
        python3 -c 'import json,sys; [print(json.dumps(x.get("attributes",{}),sort_keys=True)) for x in json.load(open(sys.argv[1])).get("features",[])]' "$OUT/page.json" >> "$OUT/$tag-$id.jsonl"
        off=$((off + 1000))
      done
    fi
  done < "$OUT/svc-layers.txt"
  rm -f "$OUT/svc.json" "$OUT/svc-layers.txt" "$OUT/page.json"
}
dump_service https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NAD_County_Participation_Status/FeatureServer county-status
echo "== Web map: NAD Coverage & Data Currentness"
if get "https://www.arcgis.com/sharing/rest/content/items/7063814b21304c3dbcd1b7ae0a72fca8/data?f=json" -o "$OUT/webmap-coverage.json"; then
  python3 - "$OUT/webmap-coverage.json" > "$OUT/webmap-coverage-layers.tsv" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
def walk(ls):
    for l in ls:
        yield l
        yield from walk(l.get('layers', []))
for l in walk(d.get('operationalLayers', [])):
    print(l.get('title', ''), l.get('url', ''), l.get('itemId', ''), sep='\t')
PY
  cat "$OUT/webmap-coverage-layers.tsv"
  i=0
  while IFS=$'\t' read -r title url item; do
    case "$url" in *FeatureServer*) ;; *) continue;; esac
    case "$url" in *Address_Points_from_National_Address_Database*) echo "skip address points: $url"; continue;; esac
    i=$((i + 1)); svc="${url%/[0-9]*}"; [ "$svc" != "$url" ] || svc="$url"
    dump_service "$svc" "coverage-$i"
  done < "$OUT/webmap-coverage-layers.tsv"
fi

echo "== The status map found earlier: fields and counts only (layer 3 is the address points)"
dump_service https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/National_Address_Database_WFL1/FeatureServer wfl1 || true
rm -f "$OUT"/wfl1-*.jsonl "$OUT"/wfl1-[0-2]-fields.json
