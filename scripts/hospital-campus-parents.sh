#!/usr/bin/env bash
# Read only (hospital-campus-candidates.yml, step "parents"). For each
# shortlisted campus in supabase/reference/hospital-campus-shortlist.csv, the
# hospital-coded organizations within about 20 miles, nearest first, so a
# reviewer can see which hospital NPI the campus most likely bills under.
# Nothing is added from this: a campus goes into hospital-campuses.csv only
# after its own website confirms it.
# Env: SUPABASE_DB_URL. Writes supabase/reference/hospital-campus-parents.csv.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
REF=supabase/reference; WORK=$(mktemp -d)
codes=$(node -e "const T=require('./v2/assets/taxonomy-map.js');console.log(T.codesForCare('Emergency rooms & hospitals').map(c=>\"'\"+c+\"'\").join(','))")
# The shortlist as a VALUES list (id, lat, lng); ids are row numbers.
vals=$(python3 - "$REF/hospital-campus-shortlist.csv" <<'PY'
import csv, sys
rows = list(csv.DictReader(open(sys.argv[1])))
print(',\n'.join(f"({i},{float(r['latitude'])},{float(r['longitude'])})" for i, r in enumerate(rows, 1)))
PY
)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X > /dev/null <<SQL
begin transaction read only;
set local statement_timeout = '20min';
\\copy (with s(id, lat, lng) as (values $vals) select s.id, h.npi::text as npi, h.name, h.address, h.city, h.state, h.zip, h.taxonomy_code, round((3959 * acos(least(1, cos(radians(s.lat)) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians(s.lng)) + sin(radians(s.lat)) * sin(radians(h.latitude)))))::numeric, 2) as miles from s join public.clinics h on h.taxonomy_code in ($codes) and h.latitude between s.lat - 0.3 and s.lat + 0.3 and h.longitude between s.lng - 0.38 and s.lng + 0.38 order by s.id, miles) to '$WORK/parents.csv' with (format csv, header true)
commit;
SQL
cp "$WORK/parents.csv" "$REF/hospital-campus-parents.csv"
echo "$(($(wc -l < "$WORK/parents.csv") - 1)) hospital listings near $(($(wc -l < "$REF/hospital-campus-shortlist.csv") - 1)) shortlisted campuses"
