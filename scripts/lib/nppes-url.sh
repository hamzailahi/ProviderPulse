# Sourced by the NPPES backfill jobs. nppes_monthly_url prints the URL of the
# newest NPPES monthly full file, or fails with what it saw. The download page
# link is tried first; if the page has none (its layout or naming changed: the
# phone job's first dry run, 2026-10-24, stopped here with no message because
# an empty grep ended the script under pipefail), the standard file names for
# this month and the two before are checked directly.
nppes_monthly_url() {
  local page=https://download.cms.gov/nppes/NPI_Files.html html file m y name
  html=$(curl -fsSL --retry 2 "$page" 2>/dev/null || true)
  file=$( { echo "$html" | grep -oE 'NPPES_Data_Dissemination_[A-Za-z]+_20[0-9]{2}(_V2)?\.zip' || true; } | sort -u \
    | awk '/_V2/ {v2=$0} {any=$0} END {print (v2 ? v2 : any)}')
  if [ -n "$file" ]; then echo "https://download.cms.gov/nppes/$file"; return 0; fi
  echo "NPPES page gave no monthly link ($( [ -n "$html" ] && echo "$(echo "$html" | wc -c) bytes" || echo unreachable )). Links seen:" >&2
  { echo "$html" | grep -oiE 'href="[^"]*\.zip"' || true; } | head -12 >&2
  for back in 0 1 2; do
    m=$(date -u -d "$(date -u +%Y-%m-15) -$back month" +%B); y=$(date -u -d "$(date -u +%Y-%m-15) -$back month" +%Y)
    for name in "NPPES_Data_Dissemination_${m}_${y}_V2.zip" "NPPES_Data_Dissemination_${m}_${y}.zip"; do
      if curl -fsI --retry 1 "https://download.cms.gov/nppes/$name" > /dev/null 2>&1; then
        echo "Using $name (found by name)" >&2; echo "https://download.cms.gov/nppes/$name"; return 0
      fi
    done
  done
  return 1
}
