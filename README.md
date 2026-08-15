# ProviderPulse

[![LEIE import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/leie-import.yml/badge.svg)](.github/workflows/leie-import.yml)
[![Medicare activity import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-activity-import.yml/badge.svg)](.github/workflows/medicare-activity-import.yml)
[![CDC PLACES import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/cdc-places-import.yml/badge.svg)](.github/workflows/cdc-places-import.yml)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)](LICENSE)

A healthcare provider directory with two distinct user experiences on one
map: patients get an AI-assisted care navigator, providers get
self-registration, screening, and market data. Live at
**https://providerpulse-v2.netlify.app**.

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scheduled data imports](#scheduled-data-imports)
- [Tests](#tests)
- [What I'd improve next](#what-id-improve-next)
- [License](#license)

## What it does

- **Patient care navigator** — a chat and specialty browser backed by
  Claude that maps a patient's conditions/intent to NPPES taxonomy terms,
  ranks nearby providers by ZIP proximity, and plots them on a Leaflet map.
  A claimed listing is only recommended if it actually practises the
  searched specialty — the model reasons over a pre-filtered candidate
  list rather than raw data.
- **Provider self-registration** — providers verify their NPI against the
  NPPES registry (Luhn checksum, deactivated-NPI rejection), are screened
  against the HHS OIG exclusion list (LEIE), and get a listing with
  multiple practice locations, accepted insurance, and a live
  supply/shortage snapshot of their market before they sign up.
- **Directory Accuracy audit engine** — scores existing listings for
  staleness with a logistic model over several signals (deactivated NPPES
  status, CMS claims activity, PECOS enrollment) instead of a pass/fail
  rule, and writes a human-readable rationale per finding.
- **Analyst dashboard** — a market-sizing tool with an AI "market memo"
  agent that plans its own read-only queries against an explicit
  table/column allowlist, so the model can never see or guess at PHI
  tables.
- **Cached CMS enrichment on map popups** — clicking a provider pin looks
  up their Medicare participation/credentials from CMS's live datastore
  API and caches the result in Supabase for 90 days (a `found:false`
  answer is refetched sooner, in case CMS's own coverage is still
  catching up on a given NPI), so the same popup doesn't re-hit an
  external API on every open.
- **National NPPES coverage** — beyond the original organization-level
  import, a separate bulk-load pipeline merged in individual physicians
  (NPI-1) and secondary practice locations from the full NPPES
  dissemination file. **All 50 states + DC are loaded as of 2026-08-15**,
  bringing the map to roughly **9 million** providers (~1.9M
  organizations + ~7.15M individual physicians), both rendered live with
  marker clustering and source filters (clinics / individual physicians /
  secondary locations) to keep the added density readable. The "X
  providers mapped" figures on the login and provider-signup pages read
  this count live from Supabase rather than a hardcoded number.
- **Map search handles real-world spelling variance** — the same city is
  often stored under several literal spellings at once (e.g. `PORT SAINT
  LUCIE` / `PORT ST LUCIE` / `PORT ST. LUCIE` as separate, all-populated
  rows), so city search expands whatever the user types across every
  common abbreviation pair (St/Saint, Ft/Fort, Mt/Mount, N/North, S/South,
  E/East, W/West, Ste/Sainte) and casing convention before querying,
  including cities that combine two of them (`E St Louis`). The dashboard
  also batches map markers into a single bulk add instead of one Leaflet
  call per marker, since unfiltered individual-physician volume can now
  reach into the thousands for a single search.

## Architecture

Static HTML/JS frontends (no build step, no framework, no `npm install`)
served by Netlify, backed by Netlify Functions and Supabase (Postgres,
auth, row-level security). AI features use Anthropic's Claude models —
Haiku for latency-sensitive paths, Sonnet for longer-form generation.
Public data sources: NPPES, CMS Physician & Other Practitioners PUF, PECOS
Order & Referring, CDC PLACES, HHS OIG LEIE.

```
v2/                          the product (patients, providers, analyst dashboard)
v2/netlify/functions/        backend: auth, matching, scoring, screening, audits
v2/netlify/functions/lib/    pure scoring/query-planning logic, unit-tested
supabase/migrations/         schema history, applied by hand via the SQL editor
scripts/                     data imports (LEIE, Medicare, CDC PLACES) + tests
.github/workflows/           scheduled import jobs (see below)
```

## Getting started

There is no build step and no `package.json` — the frontend is plain
HTML/CSS/JS. To run it locally you need the [Netlify CLI](https://docs.netlify.com/cli/get-started/)
(for the functions) and a Supabase project (for the database).

```bash
npm install -g netlify-cli
git clone https://github.com/hamzailahi/ProviderPulse.git
cd ProviderPulse/v2
# create .env with the variables below
netlify dev
```

Apply the schema by running each file in `supabase/migrations/` in order,
by hand, in the Supabase SQL editor — there is no migration runner.

## Environment variables

| Variable | Required for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | every function |
| `ANTHROPIC_API_KEY` | care navigator, market memo, audit narration, report generation |
| `ADMIN_PASSWORD` | the OIG review queue (`admin-review.html`) |
| `AUDIT_ADMIN_KEY` | the Directory Accuracy audit engine (`audit-run`, `audit-narrate`, `report-generate` in audit mode) |
| `PATIENT_SIGNUP_ENABLED` | patient registration kill switch (defaults closed — no Supabase BAA yet) |
| `DOCUMENT_UPLOAD_ENABLED` | patient document upload endpoints |

## Scheduled data imports

Three GitHub Actions keep the backing data fresh, each runnable manually
via `workflow_dispatch`:

| Workflow | Cadence | Source |
|---|---|---|
| `leie-import.yml` | monthly, 8th | HHS OIG exclusion list (full refresh) |
| `medicare-activity-import.yml` | monthly, 12th | CMS PUF + PECOS Order & Referring (upsert) |
| `cdc-places-import.yml` | see workflow file | CDC PLACES |
| `npi-zip-enrich.yml` | hourly | NPPES backfill for ZIPs actually searched (separate from the state-by-state national bulk-load pipeline, which is run by hand and isn't in this repo) |

## Tests

No test runner or dependencies — plain Node scripts that print a pass/fail
count and exit non-zero on failure:

```bash
node scripts/test-accuracy-signals.mjs    # scoring engine
node scripts/test-query-plan.mjs          # market-memo query allowlist
node scripts/test-claimed-relevance.mjs   # specialty gating of claimed listings
```

## What I'd improve next

`clinics.primary_taxonomy` currently holds three different vocabularies
for the same specialties depending on which import batch a row came from
(e.g. `Family Medicine` vs. `Family Medicine Physician`), so every place
that matches on it carries the same word-boundary matching rule
independently instead of relying on one normalized value. I'd move that
normalization into the database layer — the two production bugs this
caused (a search returning zero results, and a ZIP silently showing every
clinic on the map with blank KPIs) both trace back to the inconsistency.

## License

All Rights Reserved — see [LICENSE](LICENSE). Source is public for
portfolio/evaluation purposes; reuse requires permission.
