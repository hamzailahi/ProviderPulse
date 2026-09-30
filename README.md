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

*Last updated 2026-09-30. See the [Changelog](#changelog) for what changed and when.*

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
| Ability to pay | 20% | Insured rate and share of $75k+ households, ranked within the state |
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
each call does what fits in about 12 seconds and returns, and the browser
continues from there. The conversation is echoed back exactly as the API
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
automatically. There's no migration runner: run each file in order, by
hand, in the Supabase SQL editor. The latest is
`021_market_benchmarks.sql`.

## Environment variables

| Variable | Required for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | every function |
| `ANTHROPIC_API_KEY` | care navigator, market assistant (including reports), audit narration, briefings. This is the project's own Anthropic API account, separate from any personal account, so all AI usage bills there |
| `GOOGLE_GEOCODING_KEY` | primary geocoder; without it, geocoding falls back to Nominatim |
| `STAFF_EMAILS` | comma-separated emails allowed into the dashboard for demos without a provider profile |
| `ADMIN_PASSWORD` | the OIG review queue (`admin-review.html`) |
| `AUDIT_ADMIN_KEY` | the Directory Accuracy audit engine (`audit-run`, `audit-narrate`, and `report-generate`, which now only renders audits) |
| `PATIENT_SIGNUP_ENABLED` | patient registration kill switch; defaults closed, since patient PHI storage isn't live until a Supabase BAA is in place |
| `DOCUMENT_UPLOAD_ENABLED` | patient document upload endpoints |
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
| `market-benchmarks.yml` | quarterly, the 27th of Jan/Apr/Jul/Oct | builds national benchmarks for the market model from CDC PLACES and the provider tables |
| `cdc-places-import.yml` | yearly, September 20 | CDC PLACES health measures by ZCTA |
| `npi-zip-enrich.yml` | hourly | incremental NPPES backfill, limited to ZIPs someone has actually searched |
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
node scripts/test-market-assistant.mjs    # the assistant: steps, tools, history rules (needs npm ci in v2/)
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

Newest first. Every change pushed to `main` gets an entry here.

### 2026-09-30
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
