# Sourced by the NPPES backfill jobs. nppes_monthly_url prints the URL of the
# newest NPPES monthly full file, or fails with what it saw. The download page
# link is tried first; if the page has none (its layout or naming changed: the
# phone job's first dry run, 2026-10-24, stopped here with no message because
# an empty grep ended the script under pipefail), the standard file names for
# this month and the two before are checked directly.
nppes_monthly_url() {
  local page=https://download.cms.gov/nppes/NPI_Files.html html file m y name code
  html=$(curl -fsSL --retry 2 "$page" 2>/dev/null || true)
  file=$( { echo "$html" | grep -oE 'NPPES_Data_Dissemination_[A-Za-z]+_20[0-9]{2}(_V2)?\.zip' || true; } | sort -u \
    | awk '/_V2/ {v2=$0} {any=$0} END {print (v2 ? v2 : any)}')
  if [ -n "$file" ]; then echo "https://download.cms.gov/nppes/$file"; return 0; fi
  echo "NPPES page gave no monthly link ($( [ -n "$html" ] && echo "$(echo "$html" | wc -c) bytes" || echo unreachable )). Links seen:" >&2
  { echo "$html" | grep -oiE 'href="[^"]*\.zip"' || true; } | head -12 >&2
  # The second phone dry run got a 2,642-byte page with no links at all; show
  # its text so a bot check or a moved page is visible in the log.
  echo "Page text:" >&2
  echo "$html" | sed -e 's/<[^>]*>/ /g' | tr -s ' \t\r\n' ' ' | cut -c1-1500 >&2; echo >&2
  # A one-byte ranged GET, not HEAD: some file servers refuse HEAD.
  for back in 0 1 2; do
    m=$(date -u -d "$(date -u +%Y-%m-15) -$back month" +%B); y=$(date -u -d "$(date -u +%Y-%m-15) -$back month" +%Y)
    for name in "NPPES_Data_Dissemination_${m}_${y}_V2.zip" "NPPES_Data_Dissemination_${m}_${y}.zip"; do
      code=$(curl -sS -r 0-0 -o /dev/null -w '%{http_code}' --retry 1 "https://download.cms.gov/nppes/$name" 2>/dev/null || true)
      echo "  $name: HTTP ${code:-none}" >&2
      case "$code" in 200|206)
        echo "Using $name (found by name)" >&2; echo "https://download.cms.gov/nppes/$name"; return 0 ;;
      esac
    done
  done
  return 1
}

# nppes_weekly_names prints the weekly increment file names on offer, one per
# line (NPPES_Data_Dissemination_MMDDYY_MMDDYY_Weekly[_V2].zip, Monday to
# Sunday), or nothing when the download site has none. The page is read
# first; if it lists none, the names for the last eight weeks are checked
# directly, the way nppes_monthly_url falls back.
nppes_weekly_names() {
  local page=https://download.cms.gov/nppes/NPI_Files.html html found back sun mon name code
  html=$(curl -fsSL --retry 2 "$page" 2>/dev/null || true)
  found=$( { echo "$html" | grep -oiE 'NPPES_Data_Dissemination_[0-9]{6}_[0-9]{6}_Weekly(_V2)?\.zip' || true; } | sort -u)
  if [ -n "$found" ]; then echo "$found"; return 0; fi
  echo "NPPES page listed no weekly files ($( [ -n "$html" ] && echo "$(echo "$html" | wc -c) bytes" || echo unreachable )); checking names directly" >&2
  for back in 0 1 2 3 4 5 6 7; do
    # The Sunday that ends each of the last eight weeks.
    sun=$(date -u -d "last sunday -$back week" +%Y-%m-%d)
    mon=$(date -u -d "$sun -6 day" +%m%d%y)
    for name in "NPPES_Data_Dissemination_${mon}_$(date -u -d "$sun" +%m%d%y)_Weekly_V2.zip" \
                "NPPES_Data_Dissemination_${mon}_$(date -u -d "$sun" +%m%d%y)_Weekly.zip"; do
      code=$(curl -sS -r 0-0 -o /dev/null -w '%{http_code}' --retry 1 "https://download.cms.gov/nppes/$name" 2>/dev/null || true)
      echo "  $name: HTTP ${code:-none}" >&2
      case "$code" in 200|206) echo "$name"; break ;; esac
    done
  done
}
