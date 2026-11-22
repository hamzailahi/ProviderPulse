#!/usr/bin/env bash
# Records the directory page's structure and the site's terms. No search is run
# and no practitioner record is saved.
set -uo pipefail
OUT=supabase/reference/menopause/discovery.md
mkdir -p "$(dirname "$OUT")"
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
T=$(mktemp -d)
get() { curl -sSL -A "$UA" --max-time 40 -o "$T/$2" -w '%{http_code} %{url_effective}' "$1" 2>&1 || true; }
text() { python3 -c "import re,sys,html;s=open(sys.argv[1],errors='ignore').read();s=re.sub(r'(?is)<(script|style).*?</\1>',' ',s);s=html.unescape(re.sub(r'<[^>]+>',' ',s));print(re.sub(r'\s+',' ',s).strip()[:int(sys.argv[2])])" "$1" "$2"; }
{
echo "# Menopause Society directory discovery"; echo; echo "Run $(date -u +%F) by scripts/menopause-directory-discover.sh. Read only; no practitioner records saved."; echo
for u in "https://portal.menopause.org/NAMS/NAMS/Directory/Menopause-Practitioner.aspx|dir.html" "https://portal.menopause.org/robots.txt|probots.txt" "https://menopause.org/robots.txt|robots.txt" "https://menopause.org/terms-of-use|terms.html" "https://menopause.org/privacy-policy|privacy.html" "https://menopause.org/for-women/whats-an-ncmp|ncmp.html"; do
  url=${u%%|*}; f=${u##*|}; st=$(get "$url" "$f")
  echo "## $url"; echo; echo "Status: \`$st\`"; echo
  [ -s "$T/$f" ] || { echo "(empty)"; echo; continue; }
  case $f in
    *.txt) echo '```'; head -60 "$T/$f"; echo '```';;
    dir.html)
      echo "### Form fields"; echo
      grep -oiE '<(input|select|label)[^>]*>' "$T/$f" | grep -viE 'type="hidden"' | sed -E 's/^/- `/; s/$/`/' | head -60; echo
      echo "### Links mentioning terms, privacy, copyright or login"; echo
      grep -oiE 'href="[^"]*(term|privacy|copyright|login|signin|legal)[^"]*"' "$T/$f" | sort -u | sed 's/^/- /' | head -20; echo
      echo "### Page text (first 3,000 characters)"; echo; text "$T/$f" 3000;;
    *) echo "### Text (first 6,000 characters)"; echo; text "$T/$f" 6000;;
  esac
  echo
done
} > "$OUT"
cat "$OUT" | head -80
