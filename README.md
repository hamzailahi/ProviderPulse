# ProviderPulse

[![Tests](https://github.com/hamzailahi/ProviderPulse/actions/workflows/tests.yml/badge.svg)](.github/workflows/tests.yml)
[![LEIE import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/leie-import.yml/badge.svg)](.github/workflows/leie-import.yml)
[![Medicare activity import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-activity-import.yml/badge.svg)](.github/workflows/medicare-activity-import.yml)
[![Medicare county enrollment import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-enrollment-import.yml/badge.svg)](.github/workflows/medicare-enrollment-import.yml)
[![Medicare Advantage payers import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-advantage-payers-import.yml/badge.svg)](.github/workflows/medicare-advantage-payers-import.yml)
[![ZIP-county crosswalk import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/zip-county-crosswalk-import.yml/badge.svg)](.github/workflows/zip-county-crosswalk-import.yml)
[![CDC PLACES import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/cdc-places-import.yml/badge.svg)](.github/workflows/cdc-places-import.yml)
[![Market benchmarks](https://github.com/hamzailahi/ProviderPulse/actions/workflows/market-benchmarks.yml/badge.svg)](.github/workflows/market-benchmarks.yml)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)](LICENSE)

Live at **https://providerpulse-v2.netlify.app**

*Last updated 2026-10-09. See the [Changelog](#changelog) for what changed and when.*

## Contents

- [Background](#background)
- [What's in the product](#whats-in-the-product)
- [The market opportunity model](#the-market-opportunity-model)
- [Data](#data)
- [How the AI pieces are scoped](#how-the-ai-pieces-are-scoped)
- [Access control](#access-control)
- [Architecture](#architecture)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [Scheduled jobs](#scheduled-jobs)
- [Tests](#tests)
- [Known limitations](#known-limitations)
- [Changelog](#changelog)
- [License](#license)

## Background

Provider directories, the kind an insurer or a search tool hands a patient
to find a doctor, are notoriously out of date. A listing can carry an
address the practice moved out of two years ago, a specialty that's no
longer accurate, or an NPI that's been excluded from federal healthcare
programs entirely. Patients act on the listing anyway, because there's
usually no way to tell which entries are trustworthy from the outside.

ProviderPulse is built around that problem from two directions at once.
Think of it as a better Zocdoc with a real map. Patients search for care
near them and request an appointment. Providers get a portal that gives
them a reason to keep their own listing current, plus a market dashboard
that shows where their specialty is underserved. Underneath both sits a
scoring engine that flags listings likely to be stale, using behavioral
signals (Medicare claims activity, PECOS enrollment) rather than trusting
whatever the registry says.

It's a solo project, built end to end: data pipeline, backend, all three
frontends, and the review tooling for the OIG screening step.

## What's in the product

The product has two sides with separate homes. Patients land on `/`
(`app.html`). Providers land on `/portal` after signing in, and the market
dashboard lives at `/dashboard`. The dashboard is provider-only (plus a
staff allowlist for demos), so patients never see market data.

**Patient side: search-first.** A patient types what they need, either a
specialty or plain symptoms, and a ZIP code. Results appear as cards next
to a full-size map, limited to the chosen radius (5, 10, 25 or 50 miles).
Filters narrow by insurance, open now, and verified listings. Each result
opens a detail sheet with hours, accepted insurance, and Medicare
credentials pulled live from CMS for individual clinicians (organizations
are recognized from the NPPES enumeration type and told apart honestly,
since Medicare does not publish those details for them). An AI helper is
available as an optional side panel, not the main way in. Signed-in
patients can request an appointment with any claimed listing and track
their requests in one place.

The helper maps symptoms and conditions to NPPES taxonomy terms and ranks
by proximity. If the patient has insurance on file, it promotes listings
that have confirmed they take that plan *and* actually practice the
specialty being searched. That second check matters more than it sounds;
see [Data](#data) for what happened before it existed.

**Provider registration.** Registration validates the NPI with a Luhn
checksum, looks it up against the live NPPES registry, rejects deactivated
NPIs outright (NPPES never removes them, it just marks them inactive), and
requires the name on the form to match the registry record. From there it
runs OIG exclusion screening (below). The registration page itself is now
a pitch only; a signed-in provider is sent straight to the portal.

**Provider portal (`/portal`).** A sidebar app with six sections:

- *Overview*, the home screen: listing completeness, pending appointment
  requests, and a snapshot of the local market.
- *Appointments*: an inbox of patient requests. Providers confirm (and can
  set the time when they do), decline, or mark complete.
- *My listing*: hours, accepted insurance, and profile details, with a
  live count of what's filled in.
- *Locations*: multiple practice addresses, one of them primary.
- *Competition*: nearby listings in the same specialty on a map, and how
  many of them are missing hours or insurance.
- *Market*: a link into the dashboard, opened on the provider's own ZIP
  and specialty.

**Appointment requests and pre-visit briefings.** Each side can only move
a request in the direction that's theirs to move: a patient cancels, a
provider confirms, declines or completes. That's enforced in code, not
left to row-level security to guess at. Requests are made by NPI, and the
response names the other party without ever exposing internal provider
ids. Once a request is confirmed, the provider gets a short pre-visit
briefing assembled from the patient's profile and, if they've uploaded
and approved anything, the specific facts pulled from those documents.
Nothing the patient hasn't explicitly signed off on is used. The briefing
is organized, not diagnosed, and its non-diagnostic disclaimer is checked
twice: once in the prompt, and again on the way out, so a model that drops
it doesn't get the last word.

**OIG exclusion screening.** NPPES will tell you an NPI exists; it won't
tell you whether that provider has been excluded from Medicare and
Medicaid. That list comes from a separate HHS OIG dataset (LEIE), which
has a real limitation worth stating plainly: only about 10.5% of its
83,000+ records carry a usable NPI. So there are two checks, deliberately
different in severity. An NPI match is a hard block. A name-and-state
match is a flag, not a block. Five different providers named Maria
Hernandez practicing in Florida is a real thing that happens, and
autoblocking on a name collision would lock out legitimate providers. A
flagged listing goes into a review queue where a human compares it
against the matching LEIE record and clears or blocks it. Every decision
is logged.

**Directory Accuracy audit engine.** This is the scoring layer behind the
"is this listing still accurate" question. It's a hand-weighted, explained
model, not a black box. It combines a handful of signals (deactivated
NPPES status, last year of Medicare claims activity, PECOS enrollment)
through a logistic function rather than a clamped sum, because a clamped
sum turned out to discard most of the evidence on well-corroborated
providers. Two findings override the arithmetic outright: a deactivated
NPI always caps at "likely inactive," and an open OIG flag always forces
"unverifiable pending review." A missing input is never treated as a clean
signal. It's recorded as `unknown` and shown in the narrative. Findings
feed a written rationale generated separately from the scoring pass, so a
single audit can't be read two different ways depending on which model
wrote which part.

**Market dashboard (`/dashboard`).** A map plus an insight panel, in two
modes:

- *My market* opens on the signed-in provider's ZIP and specialty.
- *Explore* lets a provider, or staff running a demo for a prospective
  client, look at any ZIP, city or state.

Filters stay off the map until asked for, and a specialty picker replaces
hundreds of raw taxonomy codes (the codes are still there under "Exact
taxonomies"). Dots are colored by six specialty groups with a matching
key. The **Insights** tab comes first and carries the market opportunity
model described next. Demographics, health data and procedures are all
still there as tabs. **Reports** is a builder on top of the assistant
below: pick a market memo, expansion one-pager or client pitch, the
specialty, optional ZIPs to compare, who it is for and what it must
answer, and the assistant writes it. Every document from the session
collects there for copying, downloading or printing.

**Ask AI: the market assistant.** A chat tab beside Insights that answers
from the same data. It remembers the conversation, suggests questions
about the market on screen, and shows what it is doing as it works
("Scoring 38017 for cardiology"). It can:

- explain a market with the opportunity model (archetype, factors,
  confidence, caveats), citing the numbers;
- compare two to four ZIPs for a specialty side by side;
- count and list nearby providers of a specialty within a radius;
- answer statewide or cross-market counts through the query-plan allowlist
  described below;
- move the map and set the specialty filter ("show me dermatologists
  near 38138");
- write a market memo, expansion one-pager or pitch summary for a
  prospective client, as a card that can be copied, downloaded or printed
  to PDF.

## The market opportunity model

The Insights tab classifies every one of 33 patient-facing specialties in
the area around a ZIP (up to 25 miles). It lives in
`v2/assets/market-model.js`, runs inside `market-score.js`, and is covered
by `scripts/test-market-model.mjs`.

Each specialty is scored 0 to 100 from five factors:

| Factor | Weight | What it measures |
|---|---|---|
| Health need | 30% | How common the conditions this specialty treats are locally (CDC PLACES measures chosen per specialty, e.g. heart disease, blood pressure and stroke for cardiology), plus the age mix it serves, against national percentiles |
| Access gap | 30% | Clinicians per 1,000 adults in the catchment vs the national rate for that specialty |
| Ability to pay | 20% | Insured rate (70%) and household income (30%), ranked within the state. Income is median household income, the share of households at $100k+ and low poverty when the Census detail is loaded, else the share at $75k+ |
| Federal shortage | 10% | HRSA shortage-area (HPSA) score for the matching discipline, using the ZIP's own county when it can be matched |
| Room from competitors | 10% | Distance to the nearest same-specialty listing |

The score then maps to an archetype with a one-line strategy: **Prime
expansion**, **Safety-net opportunity**, **Latent demand**, **Crowded
premium market**, **Saturated**, **Balanced**, **Unserved**, or **Not
enough data**.

Three rules keep it honest:

1. **Unknown is never average.** A missing factor is left out and the
   weights are renormalized. It is never filled with 50.
2. **Every fallback is disclosed.** If a specialty has to be compared at
   the broad-group level, or the shortage score falls back to the state
   median, it shows up in that specialty's data notes and lowers its
   confidence (high, medium or low).
3. **Every score explains itself.** The three factors that moved it most
   are written out in plain English, and every factor bar shows the
   evidence behind it.

The provider's own listing is never counted as their competitor. National
benchmarks (percentiles per health measure, listings per 1,000 adults per
specialty) are built by a quarterly job into `market_benchmarks`.

## Data

The map runs on the NPPES national provider registry (organizations and
individual practitioners), CMS's Physician & Other Practitioners dataset
and PECOS Order & Referring file for claims and enrollment activity, CMS
Medicare enrollment and Medicare Advantage contract data, HUD's ZIP-county
crosswalk, CDC PLACES for health measures, HRSA shortage designations,
Census demographics, and the HHS OIG exclusion list. All 50 states plus DC
are loaded: roughly 1.9 million organizations and 7.15 million individual
physicians, around 9 million providers in total. They were loaded through
a one-time national bulk-load pipeline (run by hand, state by state, from
the raw NPPES dissemination file), layered under an hourly incremental job
that backfills whichever ZIP codes actually get searched.

Addresses are geocoded server-side by Google's Geocoding API, with
OpenStreetMap's Nominatim as the free fallback. Map tiles come from
MapTiler: "Streets" on the patient app and portal, and a light
data-visualization style on the dashboard so the colored dots stand out.

The least glamorous and most consequential problem in this codebase is
that the same specialty is described three different ways depending on
which import batch a row came from. NPPES calls it "Family Medicine," one
import batch calls it "Family Medicine Physician," and another calls it
just "Facility / Clinic" with no discipline attached at all. Matching
"Family Medicine" against only the long-form vocabulary returned zero
results in production. Expanding to only the long-form terms then hid an
entire ZIP's worth of clinics from the opposite direction, and the map
showed "0 Providers" while pins were still visibly on screen. The fix is
to always match the bare term alongside its expansions, normalized and
compared at word boundaries rather than as a naive substring. The browser
side now shares one implementation (`assets/directory.js`), though the
server functions still carry their own copies. A partial database-level
normalization pass cleaned up part of this (roughly 8,500 rows
mechanically remapped, verified by row-count shift). The "category form"
vocabulary, bucket labels like "Facility / Clinic" that don't correspond
to any real specialty code, was deliberately left alone rather than
guessed at.

City-name search had a related problem: the same city can be stored under
several genuinely different spellings at once. Port St. Lucie, Florida
shows up as `PORT SAINT LUCIE`, `PORT ST LUCIE`, and `PORT ST. LUCIE`.
These aren't typos. All three are real, separately populated rows (675,
302 and 23 in one table alone). The same split shows up for Fort/Ft,
Mount/Mt, North/N, South/S, East/E, West/W, and Sainte/Ste, and some
cities combine two of them (East St. Louis resolves six different ways).
Search now expands whatever a user types across every combination before
querying, rather than trusting an exact match on one spelling.

One more thing worth naming because it shaped a real recommendation bug:
claimed provider listings used to be injected into the care navigator's
candidate list without checking whether they actually practiced the
searched specialty. The one registered family-medicine practice in a ZIP
got recommended for dermatology and cardiology searches alike. The model
wasn't hallucinating; it was reasoning correctly over a candidate list
that had been corrupted before it ever saw it. The fix was upstream of the
prompt: gate the injection on specialty match, and treat an unknown
specialty as a non-match rather than a permissive default.

The dashboard's market-opportunity score had a similar bug, found the same
way: checking live counts rather than trusting the code's own assumption.
It computed provider density from organization-level NPPES records only,
while individual physicians live in a separate table and, in most ZIPs,
outnumber the organizations they might practice at. In one ZIP used to
verify this, 217 organizations were counted and 544 individual physicians
silently excluded, so the score was working from roughly a quarter of the
real supply. Fixing it moved that ZIP from underserved to well served.
That's the more consequential kind of bug: a confidently wrong business
answer rather than a crash. Both tables are now merged at every level the
score computes, and the UI shows the organization/individual split so the
total is something a reader can check.

PostgREST caps every response at 1,000 rows no matter what `limit` says,
so every query that could exceed that pages explicitly (keyset on a
unique key, or offset where no unique key exists), and the response says
when a count is a floor rather than a total.

## How the AI pieces are scoped

Every AI feature in this product is built around one rule: constrain what
the model can see and do, don't just instruct it not to misbehave. A
system prompt is advisory, and a determined-enough input can talk a model
out of it. An absent database table or a pre-filtered candidate list
can't be bypassed that way.

The clearest example is the dashboard assistant's database tool. The model
never writes a query; it proposes a single JSON query plan, and a separate,
non-AI allowlist decides whether that plan is even allowed to run before
anything touches the database. The
model never sees credentials, never writes SQL, and cannot name a table
outside four specific ones (none of which hold patient data, provider
contact information, or audit logs), because those tables aren't in the
allowlist's vocabulary at all. `select *` is rejected outright, so a
future column added to an allowed table doesn't silently start leaking
through an old query plan. This was tested against adversarial phrasings,
including a plan that tried to smuggle in a raw `SELECT`.

The assistant as a whole follows the same rule. Its instructions live on
the server, not in the browser, and every tool it has is read-only over
public aggregate data: the market score, the provider directory, and the
allowlisted tables. Moving the map and writing a document are handed back
to the browser to perform; nothing the model does writes to the database.
Netlify stops a function at 26 seconds, so the assistant works in steps:
a model call only starts when it has close to the whole clock (about 18
seconds), so a long answer such as a one-pager is written at the start of a
fresh call and never squeezed into the tail of one that spent its time on
lookups. Otherwise the step is handed back and the browser continues from
there. The conversation is echoed back exactly as the API
returned it, never edited.

The care navigator only ever sees that patient's own profile, and only
sees candidate providers already filtered to the searched specialty. The
audit engine's narration step sees the decomposed scoring signals and
nothing else, so it can't state a fact the scorer didn't record. If the
model's output fails to parse, the system falls back to a deterministic,
template-built rationale rather than failing the audit or guessing. The
pre-visit briefing follows the same pattern one layer further into PHI:
the model only sees facts the patient has already approved, never the
source documents, with the same deterministic fallback.

Every JSON-producing call (document extraction, audit narration, the
assistant's tool inputs) is constrained with the API's own schema enforcement
rather than a prompt asking nicely for "JSON only, no prose." The earlier
approach mostly worked and occasionally didn't, in a way that was hard to
tell apart from a real parsing bug until it happened in production. A
guarded parse is still kept everywhere, because a refusal or a token-limit
cutoff can produce a response that never reaches the schema check.

The market assistant requires a signed-in provider (or an allowlisted
staff account); it is not an open endpoint.

## Access control

Everything sits behind Postgres row-level security, with the service role
reserved for the handful of operations that legitimately need to bypass
it: writing audit logs, creating profile rows, and publishing the one
intentionally public overlay of registered provider data. Patient health
information is self-only. A signed-in patient's token can read and write
their own profile row and nothing else. There's no self-insert policy at
all (rows are created server-side under the service role), and PHI is
never logged. An audit record for a profile update stores which field
names changed, never the values.

Roles are decided server-side. Supabase `user_metadata` is writable by the
user, so it is never trusted as a role: someone is a provider only if a
`provider_profiles` row exists for them. Demo access for staff comes from
the `STAFF_EMAILS` environment variable, checked on the server.

The functions that publish anything unauthenticated are the places worth
double-checking before adding a field: the public provider lookup (an
explicit column allowlist, only listings whose review status is clear,
never the internal auth id), the aggregate search-demand endpoint (which
suppresses any group small enough to be re-identifying; a single search
for a rare specialty in a small ZIP is a fingerprint, not an aggregate),
the market score (public aggregate data only), and the query-plan
allowlist described above.

One access-control bug shipped and was later found and fixed: two provider
tables were briefly readable by anyone with the public API key, including
the internal auth user id and OIG review status, because a cleanup query
filtered on the wrong string value and silently matched nothing while
still reporting success. The lesson that stuck: verify a policy fix with
the same credentials a real client would use, not with a query built the
same way as the thing you're trying to verify.

A full audit on 2026-09-28 closed several more gaps, including unescaped
values in the dashboard, unauthenticated access to the AI endpoints,
missing input validation on appointment and document endpoints, and
briefings being available for unconfirmed appointments.

## Architecture

Static HTML and vanilla JavaScript on the frontend: no framework, no build
step, no `npm install` to serve the pages. The functions have exactly one
dependency, Anthropic's SDK (`v2/package.json`), which Netlify installs
and bundles on deploy. The backend is Netlify
Functions calling Supabase's REST API directly (no ORM), with Postgres,
authentication and row-level security handled by Supabase. Maps are
Leaflet with MapTiler tiles. AI features run on Anthropic's Claude models,
split by latency and task weight: the fastest model for anything in the
critical path of a patient request, a larger one for longer-form
generation, and Claude Opus 5.5 at low effort for the dashboard assistant,
where reasoning across several tools matters most.

```
v2/app.html                  patient app (search, map, booking)
v2/portal.html               provider portal
v2/index.html                market dashboard (/dashboard)
v2/auth.html                 sign-in, routes each role to its home
v2/register-*.html           registration flows
v2/admin-review.html         OIG review queue
v2/assets/                   shared browser modules, several also loaded by functions:
                               directory.js       map, search and taxonomy helpers
                               taxonomy-groups.js the six specialty groups and their colors
                               specialties.js     the 33 patient-facing specialties
                               health-demand.js   CDC PLACES need model by group
                               market-model.js    the market opportunity model
v2/netlify/functions/        backend: auth, matching, scoring, screening, audits, appointments
v2/netlify/functions/lib/    pure logic (scoring, query planning, auth, geocoding)
supabase/migrations/         schema history, applied by hand through the SQL editor
scripts/                     scheduled data imports, the benchmark builder, and test scripts
.github/workflows/           the scheduled jobs and the test workflow
```

Netlify Functions have a hard 26-second ceiling, so anything that chains
external calls (NPPES lookup, geocoding, an Anthropic call) is budgeted
deliberately. `patient-match`, for example, spends roughly 15 seconds
across NPPES, geocoding and the model call, with each step on its own
timeout, so a slow external service returns a clean error instead of the
whole function getting killed mid-response. Anything too large for that
budget, like the national NPPES bulk load or the market benchmarks, runs
as a script instead.

## Running it locally

No build step for the frontend (the `package.json` in `v2/` is for the functions only); it's served as
static files. You need the [Netlify CLI](https://docs.netlify.com/cli/get-started/)
for the functions and a Supabase project for the database.

```bash
npm install -g netlify-cli
git clone https://github.com/hamzailahi/ProviderPulse.git
cd ProviderPulse/v2
npm ci          # the functions' one dependency (Anthropic's SDK)
# create .env with the variables below
netlify dev
```

Schema changes live in `supabase/migrations/` but aren't applied
automatically, and Supabase keeps no history of what was run in its editor,
so these files and `supabase/schema/public.sql` (a weekly snapshot of the
live schema) are the only record. To build a fresh project, run
`supabase/schema/public.sql` once it exists; otherwise the migrations, after
the core tables. `supabase/migrations/README.md` lists every file's status. There's no migration runner: run each file in order, by
hand, in the Supabase SQL editor. The latest is
`033_abandon_procedures_summary.sql`; 031 and 032 are marked do-not-run.

## Environment variables

| Variable | Required for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | every function |
| `ANTHROPIC_API_KEY` | care navigator, market assistant (including reports), audit narration, briefings. This is the project's own Anthropic API account, separate from any personal account, so all AI usage bills there |
| `GOOGLE_GEOCODING_KEY` | primary geocoder; without it, geocoding falls back to Nominatim |
| `STAFF_EMAILS` | comma-separated emails allowed into the dashboard for demos without a provider profile |
| `ADMIN_PASSWORD` | the OIG review queue (`admin-review.html`) |
| `AUDIT_ADMIN_KEY` | the Directory Accuracy audit engine (`audit-run`, `audit-narrate`, and `report-generate`, which now only renders audits) |
| `PATIENT_SIGNUP_ENABLED` | opens patient registration. **Closed unless set to exactly `true`**, since patient PHI storage isn't live until a Supabase BAA is in place. Existing patients can still sign in |
| `DOCUMENT_UPLOAD_ENABLED` | patient document upload endpoints |
| `CENSUS_API_KEY` | `import-census-acs.yml` and `import-sahie.yml`; a free Census API key (https://api.census.gov/data/key_signup.html, activate it from the email) stored as a GitHub secret. Required: the Census answers data requests without one with "Missing Key" |
| `SUPABASE_DB_URL` | `schema-snapshot.yml`, `taxonomy-inventory.yml`, `taxonomy-backfill.yml` and `db-size-report.yml` only; the Session pooler connection string from Supabase's Connect button (port 5432, with the database password), stored as a GitHub secret. The direct connection string won't work from GitHub's runners |
| `HUD_API_TOKEN` | `zip-county-crosswalk-import.yml` only; a free HUD USER token stored as a GitHub secret, not a Netlify variable |

The MapTiler key is public by design and restricted to the site's domain
in the MapTiler console.

## Scheduled jobs

GitHub Actions keep the backing data current. Every job can also be run
by hand from the Actions tab (`workflow_dispatch`).

| Workflow | Cadence | Source |
|---|---|---|
| `leie-import.yml` | monthly, the 8th | HHS OIG exclusion list; a full refresh, not an upsert, so a reinstated provider actually disappears from the table |
| `medicare-activity-import.yml` | monthly, the 12th | CMS Physician & Other Practitioners PUF + PECOS Order & Referring |
| `medicare-enrollment-import.yml` | monthly, the 18th | CMS Medicare Monthly Enrollment, newest month only, overwriting the table rather than accumulating history |
| `medicare-advantage-payers-import.yml` | monthly, the 22nd | CMS MA enrollment by state joined to the MA Contract Directory, so plans show the brand name patients recognize rather than the legal entity |
| `zip-county-crosswalk-import.yml` | quarterly, the 25th of Jan/Apr/Jul/Oct | HUD USPS ZIP Code Crosswalk API: which county each ZIP falls in, weighted by residential addresses |
| `train-demand-model.yml` | manual only (parked 2026-10-06, see the changelog) | trains the learned demand model from the CMS Medicare claims-by-provider file, the Census detail and CDC PLACES; dry run first |
| `import-sahie.yml` | yearly, September 10 (SAHIE trails by about two years) | Census SAHIE county uninsured estimates for people under 65 into `sahie_county` |
| `import-census-acs.yml` | yearly, January 15 (the ACS 5-year release lands each December) | ACS 5-year detail by ZIP into `census_acs_zcta`: household income in 16 bands, median income, poverty, age by sex, race and ethnicity, education |
| `market-benchmarks.yml` | quarterly, the 27th of Jan/Apr/Jul/Oct | builds the market model's benchmarks from CDC PLACES and the provider tables: national health-measure percentiles, national listings per specialty, and each state's listings per 1,000 residents |
| `cdc-places-import.yml` | yearly, September 20 | CDC PLACES health measures by ZCTA |
| `npi-zip-enrich.yml` | hourly | incremental NPPES backfill, limited to ZIPs someone has actually searched |
| `taxonomy-inventory.yml` | manual only | lists every taxonomy name stored in the directory tables with row counts, plus the newest official NUCC code set and the CMS Medicare specialty crosswalk, in `supabase/reference/`, and rebuilds the taxonomy map from them; read only against the database |
| `db-size-report.yml` | manual only | read-only report of table, index and write-ahead-log sizes and dead rows, written to `supabase/reference/db-size-report.md` |
| `taxonomy-backfill.yml` | manual only | gives every listing its official NUCC taxonomy code from the NPPES monthly file and loads the `taxonomy_map` table. `dry_run` writes nothing and reports coverage and exceptions; `apply` refuses unless the free disk entered covers the rewrite |
| `schema-snapshot.yml` | weekly, Mondays | dumps the live database's structure (tables, indexes, policies, grants; no data) to `supabase/schema/public.sql` and commits it only when it changed, so every such commit records a schema change |
| `tests.yml` | every pull request and push to main | syntax check, loading every function, and the test scripts below |

## Tests

No test runner and no dependencies: plain Node scripts that print a
pass/fail count and exit non-zero on failure. All of them run in CI on
every pull request and push to main.

```bash
node scripts/test-accuracy-signals.mjs    # the directory-accuracy scoring engine
node scripts/test-query-plan.mjs          # the query-plan allowlist behind the assistant's database tool
node scripts/test-claimed-relevance.mjs   # specialty gating on claimed listings
node scripts/test-market-model.mjs        # the market opportunity model
node scripts/test-demand-model.mjs        # the learned demand model, its trainer, and how scoring uses it
node scripts/test-sahie.mjs               # Census county uninsured estimates and how Insights reports them
node scripts/test-acs.mjs                 # the Census detail import, and the richer income ranking
node scripts/test-scenario.mjs            # the what-if re-score changes supply only
node scripts/test-answer-check.mjs        # assistant figures must trace to tool results
node scripts/test-density-benchmark.mjs   # the state comparison is like for like, and honest when unavailable
node scripts/test-signup-gate.mjs         # patient sign-up is closed unless explicitly opened
node scripts/test-market-assistant.mjs    # the assistant: steps, tools, history rules (needs npm ci in v2/)
node scripts/test-taxonomy-map.mjs        # the NUCC taxonomy map: no default bucket, primary-code choice, exact-name fallback, the reviewed ambiguous-name list
```

The frontends are checked by driving them in a headless browser against
mocked data before each release, but those harnesses aren't in the repo
yet.

Passing tests haven't been a reliable signal of correctness on their own
here. A couple of real production bugs (a coercion bug that misread every
missing claims-activity year as year zero, and two scoring overrides that
were quietly outvoted by the arithmetic around them) shipped with every
test green, and only surfaced from reading the rendered output a user
would see. Worth keeping in mind before trusting a passing suite over
looking at real output.

## Known limitations

`clinics.primary_taxonomy` still holds three vocabularies for the same
specialty depending on the import batch, and matching is done with the
same word-boundary rule in several places rather than against one
normalized stored value. A partial database cleanup has happened, but the
real fix belongs in the schema.

Individual-physician-to-clinic affiliation is inferred live in the browser
from shared coordinates rather than read from a stored link. The pipeline
stage meant to produce that link produced no rows in production, so the
map falls back to a same-coordinate guess.

The Medicare Advantage mix is ZIP-level via `zip_county_crosswalk`, which
uses HUD's residential-address ratio rather than land area. The free
Census ZCTA relationship file was tried first and rejected: ZIP 38017 is
91% Shelby County / 9% Fayette County by address count, but a misleading
43%/57% by land area. When the crosswalk has no rows for a ZIP, the figure
falls back to the state-wide number, and both levels are labeled.

The HRSA shortage score in the market model now uses the ZIP's own county
when its name can be matched to `hpsa_designations` (which strips the
"County"/"Parish"/"Borough" suffix, so both sides are normalized the same
way). The match hasn't been verified across every suffix variant in live
data yet. Where it fails, the model uses the state median and says so in
the data notes.

CDC PLACES as imported has no kidney-disease measure, so nephrology and
urology need is scored from diabetes, blood pressure and age instead.

The appointment and briefing flows are verified by hand and in the
browser harness, but don't yet have dedicated scripts in `scripts/`.

## Changelog

### 2026-10-09

- **Procedures summary tried and dropped.** Shrinking the 4 GB Medicare
  procedures table into a ZIP-level summary turned out too slow and too heavy
  for the database's disk, and briefly broke the Procedures panel while it
  ran. It is cancelled and cleaned up (migration 033); the panel reads the
  original table again, exactly as before. The disk was grown to 18 GB, which
  makes room for the taxonomy backfill instead.
- **Ambiguous taxonomy names get their general code.** Listings whose name
  NUCC uses for two codes (Pharmacist, Psychologist, Podiatrist, Clinical
  Neuropsychologist, Military Hospital) get the general code from a short
  reviewed list, rather than being left without one.
- **Database size report.** A new manual, read-only job lists where the
  database's disk goes (each table's data and indexes, dead rows left by
  updates, unused indexes, write-ahead log), so decisions about compacting
  or growing the disk start from numbers.
### 2026-10-08

- **Official taxonomy codes, phase 1 of 3.** Listings are moving from
  keyword-based groups to the official NUCC classification. This step adds
  the groundwork only; the map and search behave exactly as before. A
  `taxonomy_map` table holds every NUCC code with its official grouping,
  classification and specialization, the matching Medicare specialty, and
  whether it shows on the map (students are hidden). Every listing gets a
  `taxonomy_code` taken from NPPES by NPI, through a new manual job that
  first checks there is enough database disk for the rewrite (tables,
  staging and write-ahead log). Anything it
  cannot place goes to an exceptions file with a reason, never into a
  default group. New hourly backfill rows get their code too. Next:
  phase 2 colors the map by the official groupings, and phase 3 rebuilds
  patient specialty search on codes after a review of every assignment.
Newest first. Every change pushed to `main` gets an entry here.

### 2026-10-06
- **Taxonomy inventory.** First run: 909 distinct taxonomy names over
  about 10.2 million listings, 893 of them official NUCC names. A new manual job records every taxonomy name the
  directory stores, how many listings carry it, and the official NUCC code
  list, so naming and grouping can be reviewed against the real data. The
  directory itself stores names only, not NUCC codes.
- **Security fix applied: migration 028.** The first schema snapshot showed
  that two tables left over from the retired v1 site, `access_requests`
  (names, emails, organizations) and `access_codes` (emails and access
  codes), could be read by anyone with the site's public key. Nothing uses
  them any more. 028 removes the public rules and privileges and keeps the
  rows. It is applied, and the next snapshot confirmed the public access is
  gone. The snapshot also confirmed migration 016 is applied and found three
  CMS tables made in the dashboard that are now documented.
- **The database structure is now kept in git.** Supabase doesn't save SQL
  run in its editor, and the core tables were made by clicking in the
  dashboard, so nothing recorded them. A new weekly job dumps the live
  structure (tables, indexes, security policies, grants; never data) to
  `supabase/schema/public.sql` and commits only when it changed. It refuses
  to write a dump that looks incomplete or contains a credential. Needs the
  GitHub secret `SUPABASE_DB_URL`. For a one-off copy without the secret,
  `supabase/schema-snapshot.sql` is a read-only query for the SQL editor.
  The migrations README now lists all 27 files with their status.
- **Census signals and SAHIE are live.** Migrations 026 and 027 are applied
  and both imports ran. ZIP 38017 now shows growth since 2019 (+3.2%),
  disability (9.4%), coverage by type (employer 72.3%, individual 16.1%,
  TRICARE 2.8%, VA 1.8%) and seniors living alone (22.5% of people 65+).
  Its county, Shelby, reads 12.6% uninsured under 65 (SAHIE 2024, plus or
  minus 0.8). That is higher than the ZIP's own 6.2% because it covers a
  whole county and only people under 65.
- **County uninsured rate from Census SAHIE.** Insights now shows the
  uninsured rate for people under 65 in the county where most of the ZIP's
  homes are, with its margin of error and year. SAHIE is the Census Bureau's
  model-based estimate, which blends survey and administrative records and is
  steadier than survey data alone for small counties. To switch it on, apply
  migration 027 and run "Import Census SAHIE" once.
- **More Census signals by ZIP.** The Census detail block on the Demographics
  tab now also shows population change over five years, the share of people
  with a disability, employer, individual-purchase, TRICARE and VA insurance,
  and the share of people 65 and over who live alone. Insurance types overlap,
  so those shares are not meant to add up. A signal is only shown when every
  ZIP in view has it, and a five-year change above 50% is hidden because it
  usually means the ZIP's boundary changed in 2020. To switch it on, apply
  migration 026 and run "Import Census ACS detail" again.
- **Learned demand model parked; health need stays hand-weighted.** The
  reworked model's dry run found no specialty where population (age, income,
  insurance, education, CDC health measures) predicts Medicare use beyond what
  local supply already explains. Supply and urbanity alone explained 40 to 78
  percent of the variation; population added under 3 points, and the one
  near-pass (eye care) had diabetes pointing the wrong way. This is the
  well-known pattern that Medicare use follows where doctors are. Health need
  keeps its CDC-and-age score, the training workflow is now manual only, and
  migration 025 does not need to be applied.
- **Demand model reworked before switching it on.** The first training run
  showed the model mostly learning where doctors cluster, not where patients
  need care: older and sicker areas came out as low demand, because Medicare
  counts patients where the doctor practises and people travel to hubs. Each
  training area is now a county plus everything within 25 miles; local supply
  and urbanity are accounted for during training and held at average when
  scoring; a model must add accuracy beyond supply alone; and a specialty's
  own conditions must push demand the right way (more heart disease cannot
  mean less cardiology). The kidney measure, which has no data, no longer
  knocks out Kidney and Urology. Nothing is live yet: run "Train demand
  model" as a dry run again first.

### 2026-10-05
- **CMS file lookup fixed for both Medicare jobs.** The CMS data catalog now
  adds a release date to the end of dataset titles, so the lookup for the
  Medicare claims file found nothing and the first demand-model training run
  stopped. Titles are now matched without that date, which also keeps the
  monthly Medicare activity import working. "Train demand model" also accepts
  a direct link to the file as a fallback.
- **A learned demand model.** For each specialty, a model now learns how many
  Medicare patients its doctors actually see per 1,000 Medicare enrollees in a
  county, from real CMS claims, and what about the local population predicts
  that: age, income, poverty, insurance, education and the CDC health measures
  for that specialty. It is tested on whole states it never saw, and only
  specialties that pass replace the hand-weighted "health need" factor. Where
  it is used, Insights says "learned from Medicare use", shows the expected
  patients per 1,000 enrollees and the three inputs that drove it, and notes
  that it only sees traditional Medicare. Children's care, OB-GYN and dental
  are never trained this way. To switch it on, apply migration 025, then run
  "Train demand model" (use the dry run first to read each specialty's score).
- **Census insurance import fixed.** The first run skipped Medicare and
  Medicaid because the Census does not publish the detailed Medicare table for
  ZIPs in the 2024 release. The import now falls back to the Census's collapsed
  tables and keeps whichever figures it finds instead of dropping all three.

### 2026-10-01
- **Insurance from the Census, including Medicare and Medicaid.** The Census
  detail block now shows how many people are uninsured, on Medicare and on
  Medicaid, each with its share, from the American Community Survey. The
  Uninsured and Insured Rate boxes at the top use the Census's own uninsured
  count when it covers everything in view, instead of subtracting the older
  insured figure from total population. Medicare and Medicaid overlap (people
  with both appear in each), so the two must not be added. To switch it on,
  apply migration 024, then run "Import Census ACS detail" again.
- **Demographics tab trimmed.** The two older charts that the Census detail
  now covers better (age distribution and household income, both capped at
  coarse bands) are gone. The insurance-rate charts by age, income and race
  stay, because the detailed Census data has no insurance figures.
- **The Census import needs a free API key.** The first runs failed because
  the Census refuses data requests without one ("Missing Key"). The workflow
  now checks for the `CENSUS_API_KEY` secret up front and says how to get one.
- **The Census import now explains and survives a bad API key.** The Census
  answers an invalid or not-yet-activated key with a web page rather than data,
  which made the first import run crash with a confusing error. It now prints
  what the Census said and retries without the key.
- **Detailed Census data by ZIP.** The Demographics tab has a new "Census
  detail" block: household income in eight bands up to $200k+ (the Census
  stores sixteen), median household income, poverty rate, the share of
  households at $100k and $200k and over, age by sex in 18 five-year bands,
  race and ethnicity, and education. For a selected ZIP it is exact; for an
  area it sums the ZIPs in view. The Census does not publish ZIP-level
  household income above $200,000, so there is no $200-500k split, and it
  does not publish insurance by income beyond $100k+, so the existing
  insurance-by-income chart is unchanged. To switch it on, apply migration
  023, then run "Import Census ACS detail" once.
- **Ability to pay uses the richer income.** Where the new data is loaded,
  the income half of that factor is median household income, the share of
  households at $100k and over, and low poverty, each ranked within the
  state. Scores for those ZIPs can move. Without the data it falls back to the
  share at $75k and over, as before, and the evidence line says which was used.

### 2026-09-30
- **Tidied the "Opportunity by specialty group" card on Insights.** It used to
  run the group names into their labels in one unstyled block. Each group now
  has its own row with a name, a bar for the score and a coloured label. The
  explanatory sentence lost its dash too.
- **"What if?" on Insights and in Ask AI.** Under the score breakdown, pick
  "1 more", "2 more" or "3 more" to see how the chosen specialty would score
  in this ZIP if that many clinicians opened at its centre: score, type,
  clinicians nearby, listings per 1,000 adults, room from competitors and
  access. Ask AI answers "what if I open here" the same way. Only supply
  changes; payer mix, practice size and capacity are not modelled, and the
  result says so. If you are signed in, your own listing is left out of "Now".
- **State benchmarks are live.** The benchmark build completed after migration 022 and wrote 114 rows, including a listings-per-1,000 figure for every state. Insights now compares a market with its own state's average.
- **Fixed the state benchmark build failing on save.** The first run computed
  every state's listings per 1,000 residents but the database refused to store
  them, because the table only allowed two kinds of row. Migration 022 widens
  it. Run it in the Supabase SQL editor, then re-run "Build market benchmarks".
- **The Ask AI assistant now checks its own numbers.** Every figure in an
  answer or a generated document has to come from a market lookup made in that
  conversation, or be a sum, difference, ratio or percent change shown beside
  the figures it comes from. An answer with an untraceable figure is sent back
  for one rewrite before you see it. A document that cannot be fixed is still
  issued, with the figures flagged on its card. Answers show "N figures checked
  against the data". Figures written as words ("two cardiologists") are not
  checked.
- **Assistant usage is now measured.** The function logs record, per step, how
  long each model call and lookup took, token counts, an estimated cost and how
  many figures failed the check. They never contain the question, the answer,
  a document or who asked.
- **Long assistant answers no longer time out.** Asking for a document
  (an expansion one-pager, for example) ended in "That took too long"
  whenever the assistant had spent its first seconds on lookups, because the
  write started with only about 11 seconds left. A model call now starts only
  when it has close to a full clock, and the step is handed back to continue
  with a fresh one otherwise. Documents are also asked to stay under 450
  words. If it still says it took too long, try a narrower question.
- **"Provider supply" now compares a market with its own state.** Insights
  used to compare listings per 1,000 residents with one hard-coded national
  figure (5.8) that counted organizations only, while the local number also
  counted individual clinicians, so nearly every market looked well
  supplied. The comparison is now this state's listings per 1,000 residents,
  built from the same tables and the same counting rule, and the text says
  which state ("42% below the TN average of 24.9"). The whole-area score
  (40% of it is this comparison) and its label change accordingly. If a
  state's benchmark has not been built, the comparison is left out and the
  score rests on payer mix and shortage, rather than assuming an average.
  **Run the "Build market benchmarks" workflow once to create the state
  figures** (it is the same job as before and reads the same tables).
- **Patient sign-up is now closed by default.** It previously stayed open
  unless `PATIENT_SIGNUP_ENABLED` was set to `false`, contrary to the docs,
  so an unset variable allowed health information to be collected before the
  Supabase BAA. It now opens only when the variable is exactly `true`, the
  same rule the document endpoints use. Sign-in for existing accounts and
  provider registration are unaffected, and the sign-up form tells visitors
  they can still search for care without an account.
- **Neighboring ZIPs fixed.** "Add Neighbors" on the dashboard now adds
  only ZIPs that share a border with the selected one, instead of every ZIP
  whose bounding box overlaps it. Clicking again adds the next ring out.
  A double click no longer ends in a false "No neighboring ZIPs found", and
  when every bordering ZIP is already loaded it says so. Area totals now
  cover every ZIP loaded, not just the latest ring.
- **Filters survive loading neighbors.** A specialty or taxonomy filter
  used to reset to "everything" when neighboring ZIPs loaded. It now stays;
  taxonomies that appear for the first time join it only if they match the
  chosen specialty, and every new taxonomy gets its checkbox.

### 2026-09-29
- **Reports runs on the assistant.** The Reports tab is now a builder:
  choose a market memo, expansion one-pager or client pitch, the specialty,
  ZIPs to compare, the audience and a focus question, and the assistant
  writes it from the market model. Documents collect in the tab for copy,
  download and print. The old single-shot report writer, which only saw
  clinics loaded in the browser, is retired.
- Documented that the Anthropic API key belongs to the project's own
  account, separate from personal accounts.
- **Market assistant.** Ask AI on the dashboard is rebuilt as a
  conversational assistant that uses the market model, compares ZIPs,
  finds nearby providers, moves the map, and writes memos, one-pagers and
  client pitches you can copy, download or print. It replaces the old
  single-question chat and the separate Memo button, which only saw the
  clinics loaded in the browser. The functions now carry one dependency,
  Anthropic's SDK, which Netlify installs on deploy.
- The map's zoom buttons no longer sit under the dashboard sidebar.
- **Engineering notes restored.** The project's `CLAUDE.md` (architecture
  rules, security boundaries, data gotchas, incident history) is back in the
  repo, updated for this week's changes. Secrets and local machine details
  were left out, since the repo is public.
- **National benchmarks built.** The first full run wrote benchmarks for 29
  health measures and all 33 specialties, so the Insights tab now compares
  each specialty against its own national rate. The builder's log
  undercounted rows read (a race between parallel workers); the saved
  benchmarks were unaffected, and the count and its sanity floor are fixed.
- **Market opportunity model.** The Insights tab now classifies all 33
  specialties with a score, archetype, strategy, confidence, reasons and
  data notes (see [above](#the-market-opportunity-model)). Adds
  `market_benchmarks` (migration 021), `scripts/build-market-benchmarks.mjs`
  and the quarterly `market-benchmarks.yml` job. The benchmark builder
  counts specialties by paging through the provider tables on their NPI
  index, after a first version timed out on unindexed text searches.
- **Market dashboard redesign.** My market and Explore modes, Insights
  first, collapsible filters with a specialty picker, six-group map colors
  with a key, a lighter map style, and a layout matching the portal.
  Staff demo access through `STAFF_EMAILS`.
- **Provider portal.** New `/portal` with Overview, Appointments, My
  listing, Locations, Competition and Market. Providers can set the
  appointment time when confirming. The registration page became a pitch
  that sends signed-in providers to the portal.
- **Patient side redesign.** Search-first layout with a full-size map,
  5/10/25/50-mile radius, filters, detail sheets and an optional AI helper.
- **Medicare credentials on detail sheets.** Fixed "Credential lookup is
  unavailable" (a client timeout shorter than the server's, and CMS errors
  being cached as misses). Organizations are now recognized from the
  NPPES enumeration type rather than the table a row came from.

### 2026-09-28
- **Patient and provider sides split.** Patients get a request-to-book
  flow; the dashboard became provider-only; roles are checked against
  `provider_profiles`, never user-editable metadata.
- **Full audit.** Security and correctness fixes across functions,
  frontend and migrations (escaping, auth on AI endpoints, input
  validation, 1,000-row paging, briefing access). Removed the dead
  `map.html`.
- **CI.** Added `tests.yml`, running on every pull request and push to main.

### 2026-09-17
- **Google geocoding.** Consolidated three copies of the geocoding chain
  into `lib/geocode.js`, with Google as the primary geocoder and Nominatim
  as fallback.
- A 3D Google Maps view was added to the dashboard and reverted the same
  day.

### 2026-09-16
- **Map tiles.** Moved from CARTO to Esri Canvas, then to MapTiler.

### 2026-08-19
- **Medicare Advantage payers.** Monthly import of MA plan brands per state
  from CMS.
- **ZIP-level Medicare mix.** Added the HUD ZIP-county crosswalk and used
  it to make the Medicare mix ZIP-level.

## License

All Rights Reserved; see [LICENSE](LICENSE). The source is public for
portfolio and evaluation purposes; reuse requires permission.
