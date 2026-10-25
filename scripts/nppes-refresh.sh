#!/usr/bin/env bash
# The weekly NPPES refresh, run by nppes-refresh.yml. MODE:
#   auto   every weekly file published since the last one applied (state in
#          supabase/reference/nppes-refresh/state.json); the NPI Registry API
#          sweep when the download site offers none
#   weekly the same, but fail instead of falling back
#   full   the monthly full file (a one-time catch-up; large)
#   api    the API sweep only
# DRY_RUN=true plans and geocodes a sample, writes nothing, keeps the state.
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/lib/nppes-url.sh

MODE=${MODE:-auto}; DRY_RUN=${DRY_RUN:-false}
OUT=supabase/reference/nppes-refresh
STATE=$OUT/state.json
WORK=$(mktemp -d)
mkdir -p "$OUT"
SUMMARY=$OUT/latest.md
: > "$WORK/summary.md"
DRY=(); [ "$DRY_RUN" = true ] && DRY=(--dry-run)
STATE_ARGS=(--state "$STATE"); [ "$DRY_RUN" = true ] && STATE_ARGS=()
finish() { [ -s "$WORK/summary.md" ] && cp "$WORK/summary.md" "$SUMMARY"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$WORK/summary.md" >> "$GITHUB_STEP_SUMMARY" || true; }
trap finish EXIT
note() { echo "$*" | tee -a "$WORK/summary.md"; }

download() {   # url -> $WORK/nppes.zip
  rm -f "$WORK/nppes.zip"
  curl -fsSL --retry 3 -o "$WORK/nppes.zip" "$1"
  echo "downloaded $(basename "$1"): $(du -h "$WORK/nppes.zip" | cut -f1)"
}
member() { unzip -Z1 "$WORK/nppes.zip" | grep -iE "^$1_.*\.csv$" | grep -vi fileheader | head -1; }

run_file() {   # name week_end [--full]
  local name=$1 end=$2 extra=${3:-} np pl
  np=$(member npidata_pfile); [ -n "$np" ] || { note "No npidata_pfile inside $name"; return 1; }
  pl=$(member pl_pfile || true)
  PL=(); if [ -n "$pl" ] && [ -z "$extra" ]; then unzip -p "$WORK/nppes.zip" "$pl" > "$WORK/pl.csv"; PL=(--pl "$WORK/pl.csv"); fi
  local WEEK=(); [ -n "$end" ] && WEEK=(--week-end "$end")
  local rc=0
  unzip -p "$WORK/nppes.zip" "$np" | node --max-old-space-size=6144 scripts/nppes-refresh.mjs --mode file --npidata /dev/stdin \
    ${PL[@]+"${PL[@]}"} $extra ${DRY[@]+"${DRY[@]}"} ${STATE_ARGS[@]+"${STATE_ARGS[@]}"} ${WEEK[@]+"${WEEK[@]}"} \
    --file-name "$name" --summary "$WORK/one.md" --history "$OUT/history.csv" --plan "$WORK/plan.jsonl" || rc=$?
  if [ -f "$WORK/one.md" ]; then cat "$WORK/one.md" >> "$WORK/summary.md"; rm -f "$WORK/one.md"; fi
  return $rc
}

run_api() {
  node scripts/nppes-refresh.mjs --mode api ${DRY[@]+"${DRY[@]}"} --state "$STATE" --budget-min "${API_BUDGET_MIN:-240}" \
    --summary "$WORK/one.md" --history "$OUT/history.csv" --plan "$WORK/plan.jsonl" || { [ -f "$WORK/one.md" ] && cat "$WORK/one.md" >> "$WORK/summary.md"; return 1; }
  cat "$WORK/one.md" >> "$WORK/summary.md"
}

case "$MODE" in
  full)
    url=$(nppes_monthly_url) || { note "The monthly NPPES file could not be found; nothing done."; exit 1; }
    download "$url"
    run_file "$(basename "$url")" "" --full
    ;;
  api) run_api ;;
  auto|weekly)
    names=$(nppes_weekly_names || true)
    if [ -z "$names" ]; then
      if [ "$MODE" = weekly ]; then note "No NPPES weekly file could be found; nothing done."; exit 1; fi
      note "No NPPES weekly file could be downloaded; using the NPI Registry API sweep instead."
      run_api; exit 0
    fi
    last=$( [ -f "$STATE" ] && node -e "console.log(JSON.parse(require('fs').readFileSync('$STATE','utf8')).last_week_end||'')" || true)
    plan=$(NAMES="$names" LAST="$last" node --input-type=module -e "
      import { weeksToApply } from './scripts/lib/nppes-refresh.mjs';
      const { todo, gap } = weeksToApply(process.env.NAMES.split('\n'), process.env.LAST || null);
      if (gap) console.log('GAP');
      for (const w of todo) console.log(w.name + ' ' + w.end);")
    if echo "$plan" | grep -q '^GAP$'; then
      note "Warning: the weekly files on offer start after the last applied week (${last}). The weeks between are no longer published; run this job once with mode full to catch up."
    fi
    todo=$(echo "$plan" | grep -v '^GAP$' | grep . || true)
    if [ -z "$todo" ]; then note "Nothing new: the last applied week ends ${last:-never}, and no later weekly file is out yet."; exit 0; fi
    [ -z "$last" ] && note "First run: applying every weekly file NPPES still offers ($(echo "$todo" | wc -l)). Changes from before the oldest of them are not covered; a one-time mode full run covers them."
    while read -r name end; do
      echo "== $name (week ending $end)"
      download "https://download.cms.gov/nppes/$name"
      run_file "$name" "$end"
    done <<< "$todo"
    ;;
  *) echo "unknown MODE $MODE" >&2; exit 2 ;;
esac
