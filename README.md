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

*Last updated 2026-10-25. See the [Changelog](#changelog) for what changed and when.*

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

**Patient side: search-first.** A patient picks a kind of care (13
"doors": doctors and clinics, urgent care, emergency rooms and hospitals,
pharmacies, labs and imaging, mental health and addiction, dental, therapy,
home and senior care, equipment, rides, community services, surgery
centers) or types what they need, a specialty or plain symptoms, and a ZIP
code. Results appear as cards next to a full-size map, limited to the
chosen radius (5, 10, 25 or 50 miles), in "best match" order: the
specialty's own clinicians and places first, sites only some people can
use (VA, military, tribal) last. Listings at one street address fold into
one card. Typing a procedure ("colonoscopy", "cataract surgery") ranks who
nearby billed Medicare for it most in 2024. Filters narrow by low-cost clinics (FQHCs, community and rural
health clinics, health departments), insurance and verified listings. Each result
opens a detail sheet with hours, accepted insurance, and Medicare
credentials pulled live from CMS for individual clinicians (organizations
are recognized from the NPPES enumeration type and told apart honestly,
since Medicare does not publish those details for them). An AI helper is
available as an optional side panel, not the main way in. Nobody has to
sign in to search, open a listing or call. An account is needed only to
request an appointment with a claimed listing, track requests, keep a
profile, or use the AI helper.

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

**Provider portal (`/portal`).** A sidebar app with seven sections:

- *Overview*, the home screen: listing completeness, pending appointment
  requests, and a snapshot of the local market.
- *Appointments*: an inbox of patient requests. Providers confirm (and can
  set the time when they do), decline, or mark complete.
- *My listing*: hours, accepted insurance, and profile details, with a
  live count of what's filled in.
- *Locations*: multiple practice addresses, one of them primary.
- *Competition*: nearby listings in the same specialty on a map, and how
  many of them are missing hours or insurance.
- *My NPIs*: add the NPIs of other offices or clinicians, each verified
  against the registry (live at once when the registry lists the account
  holder, otherwise after review) and each with its own listing.
- *Listing accuracy check* (on Overview): the Directory Accuracy engine run
  on the provider's own listing, with what to fix.
- *Medicare footprint* (on Overview): the provider's own top Medicare codes
  for 2024, with services, patients and average payment, beside the same
  codes within 10 miles: how many others bill them, the provider's share,
  and the doctor's fee and the facility's fee shown apart.
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

**Market dashboard (`/dashboard`).** A map plus an insight panel. For a
provider it opens on their own ZIP and specialty, and they can search any
ZIP, city or state from the same screen; the panel keeps reading the area
against their specialty, and a *My market* button goes back home. Staff
running a demo for a prospective client get the same dashboard without the
personal parts.

Filters stay off the map until asked for, and a specialty picker replaces
hundreds of raw taxonomy codes (the codes are still there under "Exact
taxonomies"). Dots are colored by the official NUCC groupings (vivid
colors for individual clinicians, muted ones for organizations), and the
map key doubles as a filter: each grouping in view has a checkbox and a
count. A provider's popup shows its full classification and code. The **Insights** tab comes first and carries the market opportunity
model described next. Demographics, health data and procedures are all
still there as tabs; **Procedures** switches between Medicare clinicians
(Part B), Medicare hospital outpatient, Medicare hospital inpatient and
Medicaid, and remembers the choice. **Reports** is a builder on top of the assistant
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
- profile the whole area on the map: every loaded ZIP (at least 8; the
  nearest are added when the map holds fewer), with Census demographics,
  the CDC health survey measures from the Health tab and Medicare and
  Medicaid procedures, as area totals plus a line per ZIP;
- compare two to four ZIPs for a specialty side by side;
- count and list nearby providers of a specialty within a radius;
- report procedure volumes and payments nearby (top CPT/HCPCS codes,
  patients, services, average Medicare allowed and paid, Medicaid claims
  and dollars, hospital APC and DRG groups), with each source's limits;
- answer statewide or cross-market counts through the query-plan allowlist
  described below;
- move the map and set the specialty filter ("show me dermatologists
  near 38138");
- write a market memo, expansion one-pager or pitch summary for a
  prospective client, as a card that can be copied, downloaded or printed
  to PDF. Reports from the Reports tab run to about 1,200 words, written
  in two or three parts that join into one document, with an area
  profile, a "Health of the area" section and procedures.

## The market opportunity model

The Insights tab classifies 40 of the 44 patient-facing specialties in
the area around a ZIP. Four are searchable but not scored: nobody opens a
practice in Hospital-based clinicians or Other health services, nurses are
almost always employed, and physician assistants already count toward
primary care. A listing
belongs to a specialty by its official NUCC code, the same table patient
search uses. The area is every ZIP whose centre is within 10 miles (at least
the 10 nearest, out to 25 miles in rural areas; at most 60 ZIPs or about 1
million adults in dense cores). It lives in
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
2. **Every fallback is disclosed.** If the shortage score falls back to
   the state median, or a factor has no data, it shows up in that
   specialty's data notes and lowers its confidence (high, medium or low).
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
                               taxonomy-map.js    NUCC code to official grouping (generated)
                               specialties.js     the 44 patient-facing specialties (40 scored by the market model)
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
`044_provider_npis.sql` (run by the "Apply migration" job, or in the editor, after `043_column_grants.sql`); 031 and 032 are marked do-not-run, and `030_taxonomy_code_indexes.sql` runs after the taxonomy backfill.

## Environment variables

| Variable | Required for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | every function |
| `ANTHROPIC_API_KEY` | care navigator, market assistant (including reports), audit narration, briefings. This is the project's own Anthropic API account, separate from any personal account, so all AI usage bills there |
| `GOOGLE_GEOCODING_KEY` | primary geocoder; without it, geocoding falls back to Nominatim. |
| `STAFF_EMAILS` | comma-separated emails allowed into the dashboard for demos without a provider profile |
| `ADMIN_PASSWORD` | the OIG review queue (`admin-review.html`) |
| `AUDIT_ADMIN_KEY` | the Directory Accuracy audit engine (`audit-run`, `audit-narrate`, and `report-generate`, which now only renders audits) |
| `PATIENT_SIGNUP_ENABLED` | opens patient registration. **Closed unless set to exactly `true`**, since patient PHI storage isn't live until a Supabase BAA is in place. Existing patients can still sign in |
| `DOCUMENT_UPLOAD_ENABLED` | patient document upload endpoints |
| `CENSUS_API_KEY` | `import-census-acs.yml` and `import-sahie.yml`; a free Census API key (https://api.census.gov/data/key_signup.html, activate it from the email) stored as a GitHub secret. Required: the Census answers data requests without one with "Missing Key" |
| `SUPABASE_DB_URL` | `schema-snapshot.yml`, `taxonomy-inventory.yml`, `taxonomy-backfill.yml`, `taxonomy-indexes.yml` and `db-size-report.yml` only; the Session pooler connection string from Supabase's Connect button (port 5432, with the database password), stored as a GitHub secret. The direct connection string won't work from GitHub's runners |
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
| `payer-sources.yml` | manual, read only | finds the CMS insurer filings (MLR) and Medicaid managed care plan files the expanded plan list is built from, and records their columns and samples |
| `zip-county-crosswalk-import.yml` | quarterly, the 25th of Jan/Apr/Jul/Oct | HUD USPS ZIP Code Crosswalk API: which county each ZIP falls in, weighted by residential addresses |
| `train-demand-model.yml` | manual only (parked 2026-10-06, see the changelog) | trains the learned demand model from the CMS Medicare claims-by-provider file, the Census detail and CDC PLACES; dry run first |
| `import-sahie.yml` | yearly, September 10 (SAHIE trails by about two years) | Census SAHIE county uninsured estimates for people under 65 into `sahie_county` |
| `import-census-acs.yml` | yearly, January 15 (the ACS 5-year release lands each December) | ACS 5-year detail by ZIP into `census_acs_zcta`: household income in 16 bands, median income, poverty, age by sex, race and ethnicity, education |
| `market-benchmarks.yml` | quarterly, the 27th of Jan/Apr/Jul/Oct | builds the market model's benchmarks from CDC PLACES and the provider tables: national health-measure percentiles, national listings per specialty, and each state's listings per 1,000 residents |
| `cdc-places-import.yml` | yearly, September 20 | CDC PLACES health measures by ZCTA |
| `nppes-refresh.yml` | weekly, Wednesdays | NPPES weekly files: adds new organizations, clinicians and secondary sites, updates moved or changed listings, and removes deactivated NPIs across the directory. New and moved addresses are placed only by an exact Census match; anything else is stored unplaced, never at a guessed point (a Google tier is built in but off). Falls back to the NPI Registry API when CMS's download site is down, refuses to write when a week's totals look abnormal, and commits its summary to `supabase/reference/nppes-refresh/`. a daily check starts the one-time March-to-now catch-up from the monthly file the day CMS offers it again (`mode: full` runs it by hand) |
| `place-unmapped.yml` | weekly, Thursdays | gives listings that have no map coordinates an exact location from the Census geocoder (up to 60,000 a week), filling in only what is missing; an address without an exact match stays off the map |
| `hospital-campus-candidates.yml` | manual, read only | lists likely hospital campuses missing from patient search (a hospital-named organization under a pharmacy, lab or similar code, no hospital listing nearby) for review before any are added |
| `npi-zip-enrich.yml` | hourly | incremental NPPES backfill, limited to ZIPs someone has actually searched |
| `taxonomy-inventory.yml` | manual only | lists every taxonomy name stored in the directory tables with row counts, plus the newest official NUCC code set and the CMS Medicare specialty crosswalk, in `supabase/reference/`, and rebuilds the taxonomy map from them; read only against the database |
| `taxonomy-indexes.yml` | manual only | builds the `taxonomy_code` indexes (migration 030) without locking the tables, then checks all three are valid |
| `procedure-sources.yml` | manual, read only | describes the Medicaid provider spending file (HHS) and the Medicare hospital outpatient and inpatient files (CMS) the Procedures panel's extra sources are built from |
| `procedure-tables.yml` | manual, yearly once HHS and CMS publish a new year | builds the Procedures panel's Medicaid table (per ZIP, specialty and procedure code) and the Medicare hospital tables (per hospital and payment group) from those files; `dry_run` writes nothing and reports what was dropped and how big it is; `apply` refuses unless the free disk entered covers the load |
| `concurrent-indexes.yml` | manual | builds a migration's indexes without locking the tables (038, location indexes), dropping failed leftovers first and failing unless every index ends valid |
| `live-dashboard-audit.yml` | manual, read only | drives the live dashboard in a headless browser (ZIP, city, state, several ZIPs, specialty filter, neighbors, every tab, and a provider's home with a mocked profile) and reports every failed or slow request, console error and screenshot |
| `code-area-report.yml` | manual, read only | pulls a list of procedure codes within a radius of one ZIP (Medicare by clinician, Medicaid by ZIP and specialty, Medicare hospital outpatient GI and endoscopy groups) and uploads the CSVs as a run artifact for a spreadsheet; optionally pushes them to a throwaway `tmp/` branch, deleted after use |
| `tmp-branch-cleanup.yml` | manual | deletes every `tmp/` branch (the throwaway data branches above) |
| `procedures-panel-check.yml` | manual, read only | replays the dashboard's Medicare procedures requests for one city and compares what loads with direct queries for one specialty and a list of codes |
| `medicaid-code-probe.yml` | manual, read only | looks codes up in HHS's raw Medicaid file: every year, by state, what one state bills instead, and the suppression threshold |
| `procedure-codes-reference.yml` | manual | saves CMS's plain-language procedure descriptions to `supabase/reference/procedure-codes.csv`, the text the panel's word search is tested against |
| `public-query-check.yml` | manual, read only | runs one directory query exactly as the browser does (publishable key) and prints status, time and rows, to tell an empty result from a failed one |
| `procedure-tables-check.yml` | manual, read only | shows what the Procedures panel gets for one ZIP through the public key, beside direct counts and the tables' policies |
| `nppes-terms-check.yml` | manual, read only | sends every specialty's registry search term to NPPES and records what comes back |
| `db-size-report.yml` | manual only | read-only report of table, index and write-ahead-log sizes and dead rows, written to `supabase/reference/db-size-report.md` |
| `live-patient-audit.yml` | manual, read only | drives the deployed patient app on desktop and phone with real searches and records timings, results, accessibility (axe-core) and layout problems; `push_branch` (tmp/ only) copies the results for a cloud session |
| `apply-migration.yml` | manual only | runs one ordinary migration from a fixed list through psql and prints what it made, then checks the public key cannot read a private table (041) |
| `org-phone-backfill.yml` | manual only | fills organizations' phone numbers from the NPPES monthly file (`source: file`) or the NPI Registry API, ZIP by ZIP (`source: api`, while CMS's download site is down). `dry_run` writes nothing and reports how many would change; `apply` adds the column (migration 040), writes in batches and refuses unless the free disk entered covers the rewrite; `from_run` reuses an api dry run's results |
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
node scripts/test-claimed-relevance.mjs   # specialty gating on claimed listings and NPPES results
node scripts/test-market-model.mjs        # the market opportunity model
node scripts/test-demand-model.mjs        # the learned demand model, its trainer, and how scoring uses it
node scripts/test-sahie.mjs               # Census county uninsured estimates and how Insights reports them
node scripts/test-acs.mjs                 # the Census detail import, and the richer income ranking
node scripts/test-scenario.mjs            # the what-if re-score changes supply only
node scripts/test-answer-check.mjs        # assistant figures must trace to tool results
node scripts/test-density-benchmark.mjs   # the state comparison is like for like, and honest when unavailable
node scripts/test-market-benchmarks.mjs   # the benchmark builder counts each specialty's listings by code
node scripts/test-signup-gate.mjs         # patient sign-up is closed unless explicitly opened
node scripts/test-market-assistant.mjs    # the assistant: steps, tools, history rules (needs npm ci in v2/)
node scripts/test-payers.mjs              # the insurance plan proposal: names, members, Medicaid plans, the cutoff
python3 scripts/test-procedure-tables.py  # the Medicaid and Medicare hospital procedure builder, end to end on small files (needs duckdb)
node scripts/test-taxonomy-map.mjs        # the NUCC taxonomy map: no default bucket, primary-code choice, exact-name fallback, the reviewed ambiguous-name list, specialty coverage
node scripts/test-patient-query.mjs       # what a patient's typed words resolve to, and that every specialty finds listings by code
node scripts/test-providers-near.mjs      # the assistant's competitor lookup: codes in a location box, clinicians and organizations, failures never "none"
node scripts/test-catchment.mjs           # the market score's area: every ZIP within 10 miles, ZIP groups, a failed load refuses to score
node scripts/test-provider-npis.mjs        # one account, many NPIs: checks, review, own rows only, publishing and booking
node scripts/test-self-check.mjs           # a provider's own listing check: their NPI only, nothing written
node scripts/test-listing-report.mjs       # report a wrong listing: only the NPI and issue are stored, repeats throttled
node scripts/test-address-fit.mjs          # typed addresses only match places that fit what was typed
node scripts/test-hospital-campuses.mjs     # the reviewed hospital campus list and how patient search shows it
node scripts/test-nppes-refresh.mjs        # weekly NPPES refresh: new, changed and deactivated NPIs, accurate geocoding only, limits, a rerun writes nothing
node scripts/test-npi-activity.mjs         # the public Medicare-activity lookup: published columns only, unknown never "inactive"
node scripts/test-procedure-finder.mjs     # the patient procedure finder: real CMS codes, words to procedures, per-clinician counts
node scripts/test-display-names.mjs       # listing names and cities as patients see them
node scripts/test-org-phones.mjs          # organization phones from NPPES: usable numbers, which rows change, the parser end to end, the API pass on a fake API
node scripts/test-procedures-tool.mjs     # the assistant's procedures tool on a fake database: averages, word search, failures reported, hospitals
node scripts/test-area-zips.mjs           # stray ZIPs a city search leaves out
node scripts/test-code-list.mjs           # Procedures tab code lists: what counts as a list, the by-code, by-clinician and by-ZIP summaries
node scripts/test-area-profile.mjs        # the assistant's area profile: the map's ZIPs, topped up to 8, counts add up, health weighted by adults, failures never zero
node scripts/test-procedure-search.mjs    # the procedures search: words like "colonoscopy" find CMS's own wording, checked against real descriptions
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

The weekly NPPES refresh only covers weeks NPPES still offers. The
directory was loaded from the March 2026 file; the changes since then come
from the monthly file in a one-time catch-up, which a daily check starts as
soon as CMS's download site (down for maintenance since 2026-10-24) offers
it again. A
listing the Census could not match exactly (Google geocoding is built in
but switched off for now) is stored without
coordinates and stays off the map until its address changes.

The appointment and briefing flows are verified by hand and in the
browser harness, but don't yet have dedicated scripts in `scripts/`.

## Changelog

### 2026-10-25

- **A typed address no longer jumps to a random place.** The map service
  always offers some match, so nonsense text once moved a search to a
  street in Oklahoma. Typed text now has to fit the match (house number,
  ZIP, and street or town names); otherwise the patient is asked to pick
  from the suggestions or enter a ZIP.
  A number that is not a 5-digit ZIP ("1234") now says so instead of
  searching around some street number.
- **Baptist Memorial Hospital-Collierville now appears under Emergency rooms
  & hospitals.** Some hospital campuses have no registry entry of their own:
  they bill under a parent hospital's number at another address, so the
  federal registry lists the site only as, say, its pharmacy. A short
  reviewed list adds those campuses to patient search, each with a note that
  it bills under its parent. A new read-only job lists likely campuses for
  review before any more are added.
  The live patient app audit now also searches the hospitals door at 38017,
  searches by street address, and tries an address that cannot be found.
- **Listings that never appeared on the map now get placed.** A weekly job
  finds directory listings stored without coordinates (mostly ones added by
  the searched-ZIP backfill) and gives each an exact location from the
  Census geocoder, up to 60,000 a week. Addresses with no exact match stay
  off the map rather than at a guessed point. Each run's summary says why
  the rest did not match (no match, a fuzzy match, another ZIP).
- **The server no longer writes searched addresses into its logs.** The
  geocoder used to log the address it looked up, and patient searches can
  contain a home address. It now logs only which service answered.
- **Rejecting an added NPI in admin review now takes it off the account.**
  Before, a rejected NPI stayed attached as blocked, so the real practice
  could never claim it. The rejection and its reason are kept in the audit
  log, and the confirmation says what will happen.
- **The retired medicalpracticemap site no longer rebuilds.** It was disabled
  in Netlify, and its build settings now skip every build, so pushes to the
  repo only deploy providerpulse-v2.
- **My NPIs reads more clearly.** The add form and its result now sit inside
  their card, and a listing held for review says plainly whose name the
  registry shows and whose name the account is in.
- **The directory now refreshes itself from NPPES every week.** A new
  scheduled job reads NPPES's weekly files and adds new organizations,
  clinicians and secondary sites, updates listings that moved or changed
  name, phone or specialty, and removes NPIs that NPPES deactivated. New and
  moved addresses get coordinates only from an exact Census match; an
  address the Census cannot match exactly is kept off the map rather than
  pinned at a guess. When CMS's download site is down it falls
  back to the NPI Registry API, it refuses to write a week whose numbers look
  abnormal, and each run's summary is committed to the repo.
- **The directory will catch up on everything since March as soon as CMS's
  NPPES download site is back.** It has been down for maintenance since
  2026-10-24. A daily check notices the monthly file the morning it returns
  and applies every new, changed and deactivated NPI since the March load,
  continuing across runs until done.
- **Patients can search from a street address or their current location.**
  The Near box now takes a ZIP, an address (with suggestions as you type) or
  the location button. Distances on results and in the detail sheet are
  measured from that point in straight-line miles. The address stays in the
  browser for this visit only; our servers see the ZIP and nothing else.
- **One provider account can now hold many NPIs.** A practice with several
  offices, a pharmacy chain or a group with several clinicians adds each
  NPI on the portal's new My NPIs page. We check each one against the
  federal registry and the OIG exclusion list like a new sign-up. It goes
  live at once when the registry lists the account holder (as the clinician,
  or the organization's authorized official); otherwise it waits in the
  admin review queue with the reason shown. Each NPI keeps its own listing
  (hours, insurance, availability), edited in My listing through a switcher,
  shows on the patient map as a verified listing once approved, and can be
  booked; the provider sees which NPI each request was for. New tables
  `provider_npis` and `provider_npi_insurance` (migration 044, applied
  the same day, so adding NPIs is switched on).
- **Security fix: signed-in users could change columns the app never lets
  them change.** Through the database's public API, a provider could clear
  their own OIG review hold or change their NPI, mark a location verified,
  and a patient could confirm their own appointment request. Migration 043
  limits signed-in users to the exact columns the app writes and checks
  appointment status changes in the database by who is asking. Nothing the
  app does changed.

- **The start screen no longer lists care twice.** Under the 13 kinds of
  care, a second grid repeated dental, mental health and urgent care. It is
  now one line of specialties no door already covers (primary care, skin,
  eyes, children, heart, orthopedics, women's health) plus a link to all 44.

- **Search understands more of what patients type.** Misspelled specialties
  ("dermotologist", "cardiolgist") now find the right one, as do
  "obstetrician", "midwife", "opthamologist", pharmacy names such as
  Walgreens and CVS, "covid test" (urgent care) and "help at home" (home and
  senior care). Result cards no longer repeat the city when a listing
  stores its whole address in the street line. Found by today's live audit,
  which also confirmed "knee pain" now leads with orthopedic and sports
  medicine physicians, "pharmacy" with pharmacies and "urgent care" with
  urgent care clinics.

- **Market Insights shows the places patients go.** A new card counts the
  pharmacies, urgent cares, hospitals, labs, home and senior care agencies,
  equipment suppliers, low-cost clinics and other facilities in the same
  area the market score uses, per 10,000 adults, against the national rate,
  and flags what is thin or missing ("Thin or missing here: urgent care,
  low-cost clinics"), with the nearest site for each. Ask AI reads the same
  figures. The national rates come from the quarterly benchmark job (new
  migration 042; first written today, 101,251 pharmacies nationally, 3.9
  per 10,000 adults). Live for Haltom City (76117): pharmacies typical (322),
  labs above the US rate, mental health and addiction below, low-cost
  clinics thin (25 sites, 0.32 per 10,000 adults against 1.57).
- **Market scores reflect the re-filed care types.** Benchmarks were rebuilt
  after the change, so urgent care no longer counts surgery centers and
  ambulances, and pharmacy no longer counts pharmacies the public cannot use.

- **Providers can check their own listing's accuracy.** A "Listing accuracy
  check" card on the portal Overview runs the same engine as the Directory
  Accuracy audit on the provider's own NPI and address: the federal
  registry, Medicare activity, saved locations and patient reports. It
  shows a plain verdict and what to fix, such as adding the registered
  address as a location or updating NPPES after a move. Nothing is saved,
  and nobody can check another provider's listing.

- **Providers see their Medicare footprint.** The portal's Overview now
  lists a provider's top Medicare codes for 2024 (services, patients,
  average payment) next to the same codes within 10 miles: how many other
  clinicians and centers bill them, the provider's share, and what doctors
  and facilities were paid nearby, shown separately because a blended
  figure mixes the two. If the nearby figures fail to load, only the
  provider's own are shown.

- **Patients can report a wrong listing.** Every provider's detail sheet has
  "Report a wrong listing": one tap says it is closed, moved, has the wrong
  phone or specialty, or is not taking patients. Nothing else is collected
  (no text, no account, no IP address). The Directory Accuracy audit now
  counts the last year's reports as weak evidence, never a verdict on its
  own. New table `listing_reports` (migration 041), applied by a new manual
  "Apply migration" job.

- **Searching a condition offers the rest of the care that goes with it.**
  "Diabetes" still lists diabetes specialists, with a row of one-tap
  searches under the count: primary care, dietitians, a diabetic eye exam,
  foot care, pharmacies and supplies. Fifteen conditions have one (heart
  health, recovery from addiction, pregnancy, cancer, back and joint pain,
  breathing, memory, kidney care, autism, stroke and others), and the row
  stays while the patient works through it. Fixed in the same change:
  switching from a specialty search to a procedure search could stop the
  results from drawing.

- **Provider pages say whether a clinician still sees Medicare patients.**
  The detail sheet now shows "Billed Medicare in 2024 (812 services)" or
  "Last billed Medicare in 2019 ... call to check", and whether they are
  enrolled in Medicare, from CMS's public claims and enrollment files. A new
  public lookup, `npi-activity`, returns only those fields; a clinician with
  no record shows nothing rather than "inactive".

- **Patients can search by procedure.** Typing "colonoscopy", "cataract
  surgery", "mammogram", "knee replacement" or about 25 other procedures
  lists the clinicians and centers nearby who billed traditional Medicare
  for it in 2024, the busiest first ("Billed Medicare 468 times in 2024, at
  least 98 patients"). A note says what the numbers leave out (mostly 65
  and over; CMS hides anyone under 11 patients for a code) and links to the
  whole specialty. Nearest first is one tap away.

- **Patients start from what they need.** The start screen leads with 13
  kinds of care, and typed words go to them: "pharmacy" now lists
  pharmacies instead of individual pharmacists, "urgent care" lists urgent
  care centers instead of emergency doctors and surgery centers, "x-ray"
  and "blood test" list labs and imaging centers. "Doctors & clinics" opens
  the specialty list. Results are in "best match" order, so "knee pain"
  leads with orthopedic and sports medicine physicians rather than athletic
  trainers; "Nearest first" is one tap away. Listings at one address fold
  into one card ("+5 more at this address"). A **Low-cost clinics** filter
  appears whenever a search finds FQHCs, community or rural health clinics
  or health departments, and "free clinic" or "no insurance" turns it on.
  Emergency and ambulance searches say to call 911. A ZIP typed into the
  search bar now counts when a tile is tapped.

- **Every listing type now has a care type ("door"), approved from the
  care-types spreadsheet.** Thirteen doors, from Doctors & clinics to Rides &
  transport, each built from official NUCC codes, with a low-cost flag on
  FQHCs, community, migrant and rural health clinics, health departments and
  charities, and a note on who can use VA, military and tribal sites. 21
  specialty assignments changed with it: surgery centers and ambulances are
  no longer "urgent care" (an urgent care search had returned about 13,900
  surgery centers), four pharmacy types the public cannot walk into left
  Pharmacy, and 13 facility types that belonged nowhere (adult mental health
  clinics, birth centers, MRI centers, pain clinics and others) now have a
  specialty. The benchmarks were rebuilt the same day.

- **The monthly Medicare enrollment import works again.** CMS started adding
  a release date to its dataset titles, so the import could no longer find
  "Medicare Monthly Enrollment" and its October 18 run failed. It now ignores
  the date, as the other CMS imports already did.
### 2026-10-24

- **Pharmacies, urgent cares, clinics and hospitals now show a phone
  number.** The organization phone job ran: 1,894,376 of 1,901,951
  organizations (99.6%) got their practice phone from the federal NPI
  Registry, and patient search shows it with a Call button on phones.
- **Busy areas load instead of timing out.** In dense places such as
  Manhattan or central Fort Worth, a 10-mile search could exceed the
  database's 3-second limit on one part of the directory, so results came
  back incomplete or not at all. A part that times out is now asked again
  as four smaller areas, then sixteen, then 64, for up to about seven
  seconds; after that the list shows what loaded as "At least N". Only what still
  fails after that is reported as missing. The portal's Competition tab
  uses the same search.
- **Provider details show who else is at the same address.** Opening a
  listing now lists the other registry entries at that spot, places first,
  with their type and phone number, and says they may be separate
  practices, since the registry doesn't record who works where. The
  details also show the official type name instead of the stored text.
- **Map pins match the list.** The results on screen get numbered pins that
  match their cards, teal for places (clinics, pharmacies, hospitals) and
  indigo for individual clinicians, with a key in the corner. Results
  further down the list are small dots. Hovering a card raises its pin.
- **On phones the search folds away after you search.** The form, which
  used to fill two thirds of the screen above the results, folds into one
  line ("Dental · 76117 · 10 mi"). Tap it to change the search. The first
  result now starts near the top of the screen.
- **Compact result cards.** A desktop screen now holds about six results
  instead of three and a half. Cards drop the initials circle, show the
  official name of what each provider is ("General Practice Dentistry",
  "Urgent Care Clinic"), and put the phone number in the details line. On
  phones a Call button carries it. A colored left edge tells places (teal)
  from individual clinicians (indigo).
- **Anyone can search for care without signing in.** The find-care app used
  to open on a sign-in card, and with patient sign-up closed a visitor
  could not get past it. Now search, results, provider details and phone
  numbers are open to everyone. Requesting an appointment, viewing
  requests, the account page and the AI helper ask you to sign in. Searches
  by visitors who are not signed in are not added to the demand log.
- **Search results say what they really know.** The "Accepting new
  patients", insurance, telehealth and verified filters only work on
  practices that have claimed their listing, so they now appear only when a
  search finds some, each showing how many it would keep. When part of the
  directory doesn't answer, the count reads "At least N" and the note offers
  Try again.
- **Listing names read like names, not legal filings.** Results and the
  portal's Competition list drop suffixes such as PLLC, Inc. and P.A.
  ("Haltom Dental, P.A." shows as "Haltom Dental"), keep acronyms like CVS
  in capitals, and write "FT WORTH" as Fort Worth.
- **On phones the Map button no longer covers results.** It used to float
  over the list and sat on the first result's Call button. It now sits in
  the results count row, which stays pinned under the header while you
  scroll. On the map it still floats at the bottom, where nothing is under it.
- **The find-care app is easier to use with a keyboard, a screen reader or a
  thumb.** Each page now has a main heading, and the results count is a
  heading too. The sign-in card's "Create an account" link and the
  initials circles meet contrast standards. Filter chips and result cards
  show a focus ring, and Enter or Space on a focused card selects it. On
  phones, buttons and chips are at least 44px tall. The sign-up form's
  labels grew from 11px to 12.5px.
- **Phones no longer zoom in when you tap a search field.** The find-care
  search bar, the sort menu and the "Not sure who to see?" box used text
  smaller than 16px, so iPhones zoomed the page on every tap. They are 16px
  on phones and small tablets now.
- **A live audit of the patient app.** A new manual job, "Live patient app
  audit", opens the deployed find-care app as a visitor and as a placeholder
  patient, on a desktop and on a phone (once on slow 4G). It runs about a
  dozen real searches and opens provider details, then records timings,
  result counts, phone coverage, accessibility problems and phone layout
  issues. It writes nothing: search logging and the AI helper are answered
  locally.
- **A job to give organizations a phone number.** Pharmacies, urgent cares,
  hospitals and other organizations have no phone in the directory. The new
  "Organization phone backfill" job reads each one's practice phone from the
  NPPES monthly file. Run `dry_run` first: it writes nothing and reports how
  many would get a number. `apply` adds the column (migration 040) and fills
  it in batches, and it refuses unless the free disk you enter covers the
  rewrite. Patient search shows organization phones once it has run.
  Both NPPES jobs now find the monthly file more reliably: when the download
  page offers no recognizable link, they print the page's text, then try the
  standard file names for the last three months and log each answer, instead
  of stopping without a message.
- **Organization phones can come from the NPI Registry API.** CMS's NPPES
  download site is down for maintenance, and every monthly file returns "not
  found". The phone job now has a `source` choice: `api` asks the federal NPI
  Registry for every ZIP in the directory instead (a few hours). Large ZIPs
  are split so none is cut off at the API's 1,200-result limit, and a ZIP
  that fails is reported, never counted as having no organizations. A full
  `api` dry run keeps its results for a week, so `apply` can reuse them with
  `from_run` instead of asking again. `zip_limit` tries the largest ZIPs
  only, as a quick test. The registry turned the first full pass away for
  asking too fast, so the job now paces itself (about 4 requests a second)
  and backs off whenever it is refused.
- **Patient search shows clinicians' phone numbers.** Results now carry the
  practice phone from the federal registry for individual clinicians, with a
  tap-to-call link; before, only claimed listings showed one. Organizations
  have no phone in the data yet.
- **"Claim this listing" fills in the NPI.** The dashboard's claim link opens
  the pitch page, and its sign-up button now opens the provider form with the
  NPI already entered (it still has to pass the registry check).
- **Competitor counts list every ZIP.** Ask AI's competitor lookup showed
  only the 20 ZIPs with the most listings, so a report read ZIPs missing from
  that list as having no GI listings. Every ZIP is now listed; on a map
  search each map ZIP appears, with 0 only when the lookup completed and
  "unknown" when it did not.
### 2026-10-22

- **"Missed screening" figures now show the share that missed.** For colon
  screening, checkups and dental visits, low uptake is what signals need, so
  the model labels them "missed colon screening" and so on, but it reported
  the share who were screened. A Haltom City report said 58.8% of adults had
  missed colon screening when 58.8% were screened (about 41% missed). The
  model now reports the share missing with the uptake beside it, and Insights
  no longer reads "low missed colon screening".
- **The opportunity score now counts every ZIP within 10 miles.** It used to
  count the ZIP and its 10 nearest ZIPs, which in a city span only a few
  miles, while Insights and Ask AI called the area "within 25 miles". A Haltom
  City report put 9 GI clinicians in "the 25-mile catchment" while listing 62
  in Fort Worth's medical district 6 miles away. Now the score counts every
  ZIP within 10 miles (at least the 10 nearest, out to 25 miles in rural
  areas; at most 60 ZIPs or about 1 million adults in dense cores), and
  Insights and Ask AI describe it by its real reach. Every specialty's score
  can move. Haltom City GI: 36 ZIPs within 9.9 miles, 122 clinicians, score 45
  (saturated), where it read 9 clinicians and 60 (balanced). A listing load
  that fails even after a retry now refuses to score instead of undercounting
  competitors. Measured live: 0.8 to 2.5 seconds for Haltom City, Fort Worth,
  Collierville and Helena, 13 seconds for Manhattan (capped, with a caveat).
  The procedures panel check runs this score live for five ZIPs.
- **Competitor lists no longer read a failed lookup as "no practices".** One
  failed request for organizations made a report say no GI practices or
  surgery centers came back. A failed page is now retried once, and if it
  still fails the organization count is reported as unknown, not zero.
- **The organization side of a Medicare fee is labelled by who billed it.**
  For scopes it is the surgery center's facility fee, but for pathology it is
  labs and for ultrasound imaging centers. The assistant now gets those
  biller types, plus a note that these averages run below the fee schedule
  (Medicare pays 80% after sequestration, and a second scope in a session is
  paid less).
- **Each report starts a fresh conversation.** The Reports tab used to write
  into whatever Ask AI chat was open, so a new report inherited the old
  chat's tool calls and notes (one repeated an earlier chat's batched code
  lookups and its stale "the list exceeded the query length" note). Write it
  now sends no earlier messages; the old chat stays on screen above a divider.
- **Capped incomes read "$250,000 or more".** The Census caps a ZIP's median
  household income and stores the cap as 250,001, which a report printed as
  "$250,001" for Southlake (76092). The Demographics tab, Insights and Ask AI
  now say "$250,000+", and an area average that includes a capped ZIP says it
  is a floor.
- **The live dashboard audit's report scenario records which brief is
  live**: whether the deployed report brief checks codes against the lookup's
  echo, and how many earlier chat messages a report sends. Its neighbor ring
  steps still time out (no ZIP is selected after a city search); a first
  attempt to click 76117 before them hung the run and was taken out.
- **City searches keep ZIPs with no official centre.** A ZIP that Census
  maps do not place, such as a PO-box ZIP like 76199 in Fort Worth, stays
  in the area rather than being treated as a stray. A few mistyped ZIPs on
  listings stay too (26109, 75179 and 76100 in a Fort Worth search), which
  is the price of never dropping real ones.
- **Doctor fee and facility fee are shown apart.** A procedure done in a
  surgery center is billed twice: the physician's professional fee and the
  center's facility fee. The blended average mixed them (colonoscopy with
  biopsy, 45380, read $236 while the doctor's own fee was about $103). The
  Procedures tab's code list now has Doctor fee and Facility fee columns, the
  Excel download adds both averages and both estimated totals, and Ask AI and
  reports quote the clinician's fee for what a physician is paid.
- **A pasted code list reaches Ask AI whole.** The assistant's procedure
  lookup cut its search text at 80 characters, about 13 codes, so a 46-code
  list arrived chopped mid-code and the AI split it into chunks, then
  misreported which codes it had asked for. A list of up to 100 codes now
  goes through in one call per source, and the result echoes the codes
  requested, those with rows and those without, so the AI checks gaps against
  that list. A code list sent to a hospital source is refused with advice to
  search by words, since hospitals report payment groups.
- **Competitor lists in Ask AI and reports are now complete.** The lookup
  used to load every listing nearby, stop at 4,000 per table and only then
  pick the specialty, so around Fort Worth it named 9 GI organizations and
  no gastroenterologist, and a 25-mile search that timed out read as "none
  found". It now asks only for the specialty's codes, covers a radius or
  every ZIP on the map, lists practices and surgery centers separately from
  individual clinicians with counts per ZIP, and says when a lookup was
  incomplete instead of calling the area empty.
- **Medicaid amounts per claim come with a warning.** A Medicaid claim line
  can carry several units, so paid per claim line is not a price per
  service. Where it runs more than three times Medicare's local average for
  the same code (an ECG showed $205.76 per claim line against about $10),
  the AI, the code-list view and the Excel file flag it as unreliable.

- **Reports cover the whole map and everything you ask.** Four fixes after
  a Haltom City report came back thin. Clicking one ZIP to see its numbers
  no longer shrinks the AI's area to that ZIP; the search and every neighbor
  ring always count, and the Report builder now says "N ZIPs on the map".
  The Focus box takes 2,000 characters with a counter (it silently kept only
  the first 400, which dropped half of that request). Procedures are read
  across the map's ZIPs instead of within 10 miles, and a pasted list of
  codes is reported code by code, naming the ones with no data. Reports gain
  a Medicare population section: the Medicare-eligible age bands (60-64, then
  65-69 up to 85 and over) and the Health tab's county Medicare figures
  (traditional vs Medicare Advantage enrollment, ER visits, hospital stays,
  readmissions, nursing facility, home health and hospice use). The live
  area-profile check prints both.

- **The live dashboard audit can run one diagnostic on its own.** Its new
  `only: report-context` option searches "haltom city, tx", adds two
  neighbor rings, presses Write it on the Reports tab and records which ZIPs
  the request tells the AI are on the map. It was added after a Haltom City
  report covered 8 ZIPs while the map held many more.

### 2026-10-21

- **Download all for a code list.** With codes pasted into the Procedures
  tab, a Download all (Excel) button saves one spreadsheet: notes, Medicare
  by code, by clinician (everyone, not just the top 200) and every raw row,
  Medicaid by code and by row, totals by ZIP, and the hospital outpatient and
  inpatient payment groups at the nearest hospitals that match your codes'
  topics (GI codes bring the Upper, Lower and Complex GI groups and the GI
  inpatient groups, for example). Hospitals report payment groups rather
  than CPT codes, so the hospital toggles now say why a code list shows
  Medicare clinicians and Medicaid. Copy as CSV still copies the view on
  screen.

- **City searches no longer pull in far-off ZIPs.** A few mis-addressed
  listings used to drag distant ZIPs onto the map: "Fort Worth, TX" brought
  in an Austin ZIP, one in West Virginia and Stephenville, and they flowed
  into Demographics, Health, Procedures and the AI's area (Austin's ZIP was
  the third busiest in a Fort Worth code list). Most were mistyped ZIPs on
  listings that really are in Fort Worth. A ZIP with under 1% of the
  listings whose official centre lies more than 25 miles from every main ZIP
  of the search is now kept out of Demographics, Health, Procedures and the
  AI's area; the listings stay on the map where their addresses are, and
  only listings that are themselves far away are removed. The map says
  which. ZIP and state searches are unchanged, and searches of several
  cities keep each city whole.

- **Paste a list of codes into the Procedures tab.** Type or paste two or
  more CPT or HCPCS codes into the Procedures search box (commas, spaces or a
  column straight from a spreadsheet) and the tab switches to a code list for
  every ZIP on the map: by code (Medicare billers, patients, services, office
  vs facility, average allowed and paid, estimated Medicare paid, then
  Medicaid claim lines and paid), by clinician (who bills them, ranked by
  estimated Medicare paid) and by ZIP, each with a Copy as CSV button. Codes
  with no rows are named with the reason. It loads only those codes, so it is
  quicker than the full procedures load. A single code or a word works as
  before.
- **The live dashboard audit now tries a code list.** It searches Fort
  Worth, pastes a GI practice's 46 codes into the Procedures tab and records
  each view, its timing and every request.

- **Procedure codes around a ZIP, as a spreadsheet.** A new manual job
  pulls any list of CPT or HCPCS codes within a chosen radius of a ZIP:
  traditional Medicare by clinician (patients, services, average allowed
  and paid, office or facility), Medicaid by ZIP and specialty, and the
  gastrointestinal and endoscopy payment groups at nearby hospitals. It
  reads only and leaves its CSVs on the run. First used for a GI code set
  around Haltom City and Fort Worth.

### 2026-10-20

- **Longer reports, with a health section.** Reports now run to about
  1,200 words instead of 450. Writing that much at once would hit the
  server's time limit, so the AI writes a report in two or three parts
  and they join into one document card (it says "the rest is on its way"
  until the last part lands). Every report also gets a "Health of the
  area" section from the CDC health survey on the Health tab: the
  measures behind the specialty's need score first, then diabetes,
  obesity, high blood pressure, depression, heart disease and COPD, each
  as a share of adults and an estimated number of adults for the area.
  Memos asked for in chat stay short.
- **Ask AI and reports look at the whole area, not one ZIP.** A new
  area profile reads every ZIP loaded on the map (the search plus any
  neighbor rings). When the map holds fewer than 8, the nearest ZIPs are
  added and named. It returns people, households, income, poverty, age,
  insurance coverage, education and population change; every CDC PLACES
  health survey measure as a share of adults and an estimated count; and
  Medicare and Medicaid procedure totals and top codes. Each comes as
  area totals plus a line per ZIP, so an answer can say which neighbor is
  oldest, least insured or busiest. Market questions and every report now
  use it, and reports gain an "Area profile" section. A failed read is
  reported as incomplete, never as zero. The procedures tool can also
  search the map's ZIPs instead of a radius.
- **Procedures on the Market tab.** The Insights view that the portal's
  Market tab opens on now has a "Procedures and reimbursement" card for the
  specialty in focus: how many of its clinicians on the map billed
  traditional Medicare, their services, about what Medicare paid, the top
  five codes with patients and average payment, and a Medicaid line where
  Medicaid pays that specialty here, with links to the full Procedures tab
  and to Ask AI. Clinicians are matched by their own NPI and specialty code,
  the same definition the map and the scores use.
- **Ask AI and reports can read procedure data.** The assistant used to
  say ProviderPulse had no procedure volumes or reimbursement. It now has a
  procedures tool over the same four sources as the Procedures tab (Medicare
  clinicians, Medicaid, Medicare hospital outpatient and inpatient), so it
  can answer "what do gastroenterologists bill within 10 miles of 76104 and
  what does Medicare pay?" with real codes, patients, services and average
  payments (43239, 2,762 patients, $60.65 average Medicare payment), and it
  carries each source's limits (traditional Medicare only, small counts
  withheld). Reports now include a "Procedures and reimbursement" section.
  Commercial insurance rates are still not available.
- **Why Fort Worth shows no Medicaid deliveries under 59400.** Texas
  Medicaid does not bill the global delivery codes (59400, 59510, 59610) at
  all. Providers bill the parts separately: 59409 (vaginal delivery only,
  28,202 claim lines statewide in 2024), 59514 (cesarean delivery only),
  59430 (postpartum care) and 59025 (fetal non-stress test). In Fort Worth's 58
  ZIPs that is 627 claim lines for 59409, 70 for 59514 and 1,273 for 59430.
  Those are floors: HHS withholds any provider, code and month with fewer
  than 12 patients, and most obstetricians deliver fewer than 12 Medicaid
  babies a month, so much of the volume never reaches the public file.
  Nationally only 32 states bill 59400 at all (15,083 claim lines in 2024). Search those
  codes, or "delivery" or "postpartum" (now understood too), to see Texas
  deliveries. A new read-only probe job
  looks codes up in HHS's raw file.
- **The demographics tab leads with numbers.** Every box now shows a count
  first (52,966 insured, 3,490 uninsured, 13,050 households at $100k or
  more, 20,000 adults with a bachelor's degree) with its share in small
  type underneath, and the charts count people and households instead of
  percentages; hovering a bar shows its share.
- **One market dashboard instead of two modes.** The My market / Explore
  switch is gone. A provider's dashboard opens on their own ZIP and
  specialty as before, and searching anywhere else now happens on the same
  screen: the Insights tab keeps showing where they stand in their
  specialty for whatever area is scored, and a *My market* button in the
  top bar brings them back. A specialty picked in the filters now carries
  over to the next search instead of the map quietly showing everything
  under a filter that still named one specialty.
- **The procedures search understands the words clinicians use.** CMS
  writes its own plain-language descriptions, so a colonoscopy reads
  "Biopsy of large bowel using a flexible endoscope" and searching
  "colonoscopy" found almost nothing, although Fort Worth gastroenterologists
  bill thousands of them to Medicare. Common words (colonoscopy, EGD, ERCP,
  Pap smear, mammogram, pregnancy ultrasound, delivery, echo, EKG, knee
  replacement and others) now reach CMS's wording, and every one is tested
  against CMS's real descriptions.
- **One search covers every procedure source.** Searching in any source now
  adds a line saying how many matching codes the other sources hold for the
  same area (Medicare clinicians, hospital outpatient, hospital inpatient,
  Medicaid), and one click switches source with the search kept. Medicaid
  now loads 50 ZIPs per request, so a state search no longer fails.
- **An empty search says why.** Traditional Medicare covers people 65 and
  older, and CMS drops any code a clinician billed for fewer than 11
  Medicare patients, so pregnancy care barely appears there: Fort Worth has
  no Medicare rows for deliveries or pregnancy ultrasounds, while Medicaid
  holds thousands of ultrasound claims. The panel now says this, and notes
  that hospital sources list payment groups rather than CPT codes.
- **A check for missing procedure data.** A manual, read-only job replays
  the Medicare procedures panel for a city and compares what it loads with
  the table itself and with CMS's own file. For Fort Worth the panel loaded
  every row the table holds (266 OB-GYN rows from 57 clinicians, all the GI
  codes), and the table matches CMS's 2024 release exactly.
- **The dashboard's address follows the search.** After each search the
  link names the area and specialty, so a refresh, a bookmark or a shared
  link reopens the same view, and the browser's Back button returns to the
  previous search. Bordering ZIPs added on top are not part of the link.
- **Explore searches by city or state show every provider again.** A live
  audit of the dashboard found that searching a city ("Collierville, TN",
  "Memphis") or a state ("RI") loaded organizations only: the individual
  clinician and secondary-address tables had no city or state index, timed
  out, and the map said "Loaded" anyway (Collierville showed 221 listings
  against 988 for its ZIP). Migration 039 adds those indexes. When part of
  the directory does not answer, a notice on the map now says what is
  missing, and very large areas stop at 25,000 listings per table with a
  note instead of paging without end.
- **The Medicare procedures panel no longer hammers the database on large
  areas.** For a state it asked for every ZIP at once, timed out, and then
  retried without end because it read the error as data. It now asks ten
  ZIPs at a time, stops on an error and says what did not load.
- **Health measures load for large areas.** The Health tab asked CDC for a
  whole state's ZIPs in one request (1,381 for Texas), which the browser
  refused. It now asks 100 ZIPs at a time and notes any group that did not
  answer.
- **City scores anchor on the city itself.** A city search also picks up
  listings filed under the same city name elsewhere, and the score could
  land on one of those ZIPs ("Memphis" was scored on 37066, Gallatin). The
  anchor is now the most populous ZIP among those holding at least 1% of
  the listings on the map.
- **ZIP outlines for big states retry once.** Texas's outline file is large
  and its download was seen cutting off, leaving nothing to click; the map
  now tries a second time.
- **A live audit of the dashboard.** A manual, read-only job drives the
  deployed dashboard through every kind of search and tab, plus a
  provider's home with a stand-in profile, and reports what failed or ran
  slow.

### 2026-10-13

- **Competition and patient search no longer show "none nearby" by
  mistake.** Searching an area for a specialty asked the database for every
  listing in a map box, and with no location index on the two main provider
  tables that query ran past the database's 3-second limit. The page read
  the failure as zero results, so the portal's Competition tab showed no
  primary care doctors within any distance of 38017. Migration 038 adds the
  missing location indexes (applied; the same query now answers in under
  2 seconds with 980 primary care listings within 10 miles of 38017), and
  both pages now say when the directory did not answer instead of
  claiming there is nobody there.
- **A check for directory queries.** A manual, read-only job runs one query
  as the browser does and shows whether it returned nothing or failed.

### 2026-10-12

- **Hospital procedures now show the nearest hospitals.** The Medicare
  hospital outpatient and inpatient views came up empty for most ZIPs
  (Collierville, 38017, had none), because each hospital is listed only at
  the address it bills Medicare under, often a system's main campus. They
  now list hospitals within 25 miles of the area in view (50 if none),
  closest first, each with its distance (3,084 hospitals loaded, 2,977 of
  them placed on the map). A new read-only check job shows what the
  panel receives for any ZIP.

### 2026-10-11

- **Procedures now cover Medicaid and Medicare hospitals.** The Procedures
  tab has a switch: Medicare clinicians (what it showed before), Medicare
  hospital outpatient (by payment group), Medicare hospital inpatient (by
  diagnosis group) and Medicaid. Medicaid comes from the provider spending
  file HHS released in February 2026, newest year (2024), placed at each
  provider's ZIP and specialty in our directory, with claims, total paid and
  paid per claim. HHS withholds small cells (under 12 patients), and its
  monthly patient counts cannot be added into a head count, so the panel
  shows "patient-months" and says why. Junk rows in the source (malformed
  codes, impossible amounts) are dropped and counted, never shown. Private
  insurance has no public equivalent: insurers publish prices, not volumes.
  Loaded 2026-10-11: 3.1 million Medicaid rows covering $189B of 2024
  spending across 21,013 ZIPs, and 208,000 hospital rows from about 3,000
  hospitals.
- **Procedure data beyond Medicare Part B, step one.** A new manual,
  read-only job describes the files the Procedures panel will add: the
  Medicaid provider spending by procedure that HHS released in February
  2026, and Medicare's hospital outpatient and inpatient files. It records
  their columns, sizes and quirks so the importers are written against the
  real files. Nothing is loaded yet.
- **Insurance list cleanup.** A second read of the newly loaded plans found
  a few that slipped through review: "Banner|Aetna" in Arizona showed with a
  stray bar (now "Banner Aetna"), four entries were not plan names at all
  (a reinsurer, a counseling program, a placeholder and an unrecognisable
  legal name) and five plans appeared twice under slightly different names
  in one state (CDPHP, The Health Plan of West Virginia, Baylor Scott &
  White, Fallon Health, HealthPartners). Migration 035 fixes them; anyone
  who already picked a renamed plan keeps it under the new name. (Its first
  version failed harmlessly in the Supabase SQL editor and changed nothing;
  it now runs as one block, and is applied.)
- **Which new insurance plans were already listed.** A read-only query,
  `supabase/queries/034_overlaps.sql`, lists the plans from the October
  insurance load whose name was already in that state's list under another
  type (mostly Medicare Advantage brands), so the load left them as they
  were.
- **Mental health searches no longer suggest neurologists.** The national
  registry files psychiatrists and neurologists under one board, "Psychiatry
  & Neurology", so the care navigator's search for a psychiatrist also
  returned neurologists (about a quarter of results in a live check), and a
  neurology search returned psychiatrists. Those results are now dropped
  before the navigator sees them, and the search widens to nearby ZIPs when
  too few remain.
- **Checking the registry search terms.** A new manual, read-only job sends
  every specialty's registry search term to the live NPPES API, the way the
  care navigator does, and records how many providers come back and whether
  they really practise that specialty. First run: all 44 terms pass,
  including the 11 categories added in October, which could not be checked
  when they were written.
- **Insurance plan list approved.** The review removed carriers that are
  not medical plans (Reliance Standard Life, Nippon Life, State Farm, and
  TennCare's dental and pharmacy managers) and merged duplicate names, so
  each plan appears once per state under the name on the member card: state
  suffixes are gone ("Molina Healthcare of Texas" is "Molina Healthcare"),
  Medicaid plans read UnitedHealthcare Community Plan, Aetna Better Health,
  Humana Healthy Horizons and so on, and regional variants fold together
  (Partnership HealthPlan, WellSense, Kaiser Permanente). A migration
  generated from the approved list (390 new state plans: 150 commercial,
  33 marketplace-only, 207 Medicaid) is applied, so they are in every plan
  picker now; 271 more were already listed.
- **More insurance plans, step one.** A new manual, read-only job finds
  the official CMS files listing every company selling private, employer
  and marketplace health insurance in each state, and every Medicaid
  managed care plan, and records what they contain. The expanded plan list
  will be built from them, shown as card brand names, limited to insurers
  with at least 1,000 members in a state, and reviewed as a spreadsheet
  before it reaches the plan pickers. Medicare Advantage plans already load
  monthly from CMS. The first proposal covers 760 state plans (private,
  employer, marketplace and Medicaid managed care) and is out for review.
- **Health-need profiles for the new categories reviewed.** Hospice now
  weighs cognitive disability (dementia is its leading diagnosis), as does
  speech therapy; care coordination is driven by social need (no insurance,
  food insecurity, no reliable transport, diabetes) instead of frailty.
  Nursing and Physician assistant are no longer scored as markets, since
  nurses are employed and most PAs already count toward primary care; both
  stay fully searchable. The model now scores 40 categories. The national
  benchmarks were rebuilt so the three new measures have national
  percentiles (food insecurity and transport are published for about
  24,000 of 30,000 areas; elsewhere those parts are left out, never
  guessed).
- **The old six provider groups are retired.** The opportunity panels no
  longer score Primary care, Specialty, Surgical, Dental and Behavioral as
  broad groups (their national rates were counted from organizations only
  and understated supply). Everything now comes from the per-specialty
  model: Insights shows where a provider's own specialty stands, the
  biggest openings among specialties already present, and which ones have
  no listing nearby; the pitch page lists the six strongest openings and how
  many specialties are absent. Clinician counts follow each listing's
  official classification, and the federal shortage score used for each
  specialty is chosen per specialty. No keyword-based classifier is left.
- **Market scores count providers by their official code.** The market
  model, the AI assistant's provider lookups, the national benchmark job
  and the (parked) demand trainer now decide a listing's specialty from its
  NUCC code through the approved table, the same way patient search does.
  The model now scores 42 categories: the 33 it scored before (speech
  therapy under its new name) and nine of the new ones, each with a
  provisional health-need profile. Hospital-based clinicians and Other
  health services stay searchable but are not scored.
- **National benchmarks rebuilt by code.** The "Build market benchmarks"
  job reran on all 9 million listings, so every scored category, new ones
  included, is compared against a national rate counted the same way as
  the local one (for example primary care 4.78 listings per 1,000 adults,
  orthopedics 0.42 now that general surgeons count under General surgery).

### 2026-10-09

- **Patient search finds providers by their official code.** Picking or
  typing a specialty now finds every listing whose NUCC code belongs to it,
  per the approved table, instead of matching words in the taxonomy name.
  Eleven new categories are searchable (among them Hearing & audiology,
  Behavior therapy (ABA), Nursing, Physician assistant and General surgery),
  and "Speech & hearing" is now "Speech & language therapy". The same
  change covers the provider portal's Competition tab and the dashboard's
  specialty filter. Typed searches match whole words: "primary care doctor"
  works as before, "hearing" now finds audiologists instead of ear, nose
  and throat doctors, "knee surgery" stays with orthopedics, and generic
  words such as "physician" or "hospital" go to the AI helper rather than a
  wrong category. Market scores still use the previous 33 categories until
  their benchmarks are rebuilt on codes.
- **Patient specialties by official code approved.** The reviewed table
  is now the record of which search category each code belongs to, and a
  test fails if any visible clinician code is left without one. Patient
  search switches over in the next step, together with a fix so that
  typing "hearing" no longer lands on Ear, nose & throat.
- **Patient specialties by official code: proposal ready for review.** A
  draft assigns every one of the 883 NUCC codes to patient search
  categories, so that every visible individual clinician can be found
  (today about 3.3 million listings belong to no category). It keeps the
  existing categories, splits hearing out of speech therapy, and adds
  eleven, including Behavior therapy (ABA), Nursing, Physician assistant,
  Care coordination, Hospital-based clinicians and General surgery. 45
  codes are flagged for a decision. Patient search does not change until
  the proposal is approved.
- **The map now groups providers by their official classification.** Dots
  are colored by the NUCC grouping of each listing's own taxonomy code,
  read from the code rather than guessed from the name: vivid colors for
  individual clinicians, muted ones for organizations. The map key lists
  every grouping in view with a count and a checkbox to hide or show it.
  Popups and tooltips show the full path (for example Ambulatory Health
  Care Facilities › Clinic/Center › Primary Care) and the code. Students
  are left off the map. A listing with a missing or unrecognized code is
  hidden and counted in the key rather than dropped into a catch-all
  group. Search by specialty and the market scores are unchanged for now;
  they move to codes in phase 3, after review.
- **Every listing now carries its official taxonomy code.** The backfill
  gave 10,175,696 of 10,175,703 listings their NUCC code from the September
  NPPES file (7 remain, all old labels with no exact NUCC match, listed for
  review), and the code columns are indexed. Nothing on the map or in search
  changes yet; the next step colors the map by the official NUCC groupings.
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
