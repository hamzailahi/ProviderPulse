# ProviderPulse

[![LEIE import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/leie-import.yml/badge.svg)](.github/workflows/leie-import.yml)
[![Medicare activity import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-activity-import.yml/badge.svg)](.github/workflows/medicare-activity-import.yml)
[![Medicare county enrollment import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/medicare-enrollment-import.yml/badge.svg)](.github/workflows/medicare-enrollment-import.yml)
[![CDC PLACES import](https://github.com/hamzailahi/ProviderPulse/actions/workflows/cdc-places-import.yml/badge.svg)](.github/workflows/cdc-places-import.yml)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)](LICENSE)

Live at **https://providerpulse-v2.netlify.app**

## Contents

- [Background](#background)
- [What's in the product](#whats-in-the-product)
- [Data](#data)
- [How the AI pieces are scoped](#how-the-ai-pieces-are-scoped)
- [Access control](#access-control)
- [Architecture](#architecture)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [Scheduled jobs](#scheduled-jobs)
- [Tests](#tests)
- [Known limitations](#known-limitations)
- [License](#license)

## Background

Provider directories — the kind an insurer or a search tool hands a patient
to find a doctor — are notoriously out of date. A listing can carry an
address the practice moved out of two years ago, a specialty that's no
longer accurate, or an NPI that's been excluded from federal healthcare
programs entirely. Patients act on the listing anyway, because there's
usually no way to tell which entries are trustworthy from the outside.

ProviderPulse is built around that specific problem, from two directions
at once. Patients get a map and an AI-assisted navigator to actually find
care. Providers get a reason to keep their own listing current — a
self-service registration flow that checks their NPI against the federal
registry and exclusion list, and shows them, live, what an accurate
listing gets them (payer mix, shortage designations, how many competing
listings in their ZIP are missing basic information). Underneath both,
there's a scoring engine that flags listings likely to be stale, using
behavioral signals (Medicare claims activity, PECOS enrollment) rather
than just trusting whatever the registry says.

It's a solo project, built end to end — data pipeline, backend, both
frontends, and the review tooling for the OIG screening step.

## What's in the product

**Patient side.** A map-first app where a patient either browses by
specialty or describes what's wrong in a chat window. The chat maps
symptoms and conditions to NPPES taxonomy terms and searches by ZIP,
ranking results by proximity and, if the patient is signed in and has
insurance on file, promoting listings that have confirmed they take that
plan *and* actually practice the specialty being searched. That last part
turned out to matter more than it sounds — see [Data](#data) below for
what happened before that check existed.

**Provider side.** Registration validates the NPI with a Luhn checksum,
looks it up against the live NPPES registry, rejects deactivated NPIs
outright (NPPES never removes them, it just marks them inactive), and
requires the name on the form to match the registry record. From there
it runs OIG exclusion screening (below) and, once verified, gives the
provider a listing they can attach multiple practice locations to, list
accepted insurance for, and see a live market snapshot for before they
even finish signing up — supply per 1,000 residents against the national
benchmark, HRSA shortage scoring, and how many other listings in their
ZIP are missing hours or insurance information. No demand numbers are
shown on that pitch, deliberately — the search-volume log the product
collects is too new to support a claim like "searches up 34%," so the
page sticks to figures that are independently checkable today.

**Appointment requests and pre-visit briefings.** A patient can request an
appointment with a claimed listing directly; the provider confirms or
declines, and each side can only move the status in the direction that's
theirs to move (a patient cancels, a provider confirms/declines/completes —
enforced in code, not left to row-level security to guess at). Once
requested, the provider gets a short pre-visit briefing assembled from what
the patient's profile already says and, if they've uploaded and approved
anything, the specific facts pulled from those documents — never anything
the patient hasn't explicitly signed off on. The briefing is organized, not
diagnosed: same rule as document extraction below, enforced the same way,
with the same non-diagnostic disclaimer checked twice — once in the prompt,
once again on the way out, so a model that drops it doesn't get the last
word.

**OIG exclusion screening.** NPPES will tell you an NPI exists; it won't
tell you whether that provider has been excluded from Medicare and
Medicaid. That list comes from a separate HHS OIG dataset (LEIE), which
has a real limitation worth stating plainly: only about 10.5% of its
83,000+ records carry a usable NPI. So there are two checks, deliberately
different in severity. An NPI match is a hard block. A name-and-state
match is a flag, not a block — five different providers named Maria
Hernandez practicing in Florida is a real thing that happens, and
autoblocking on a name collision would lock out legitimate providers. A
flagged listing goes into a review queue where a human compares it
against the matching LEIE record and clears or blocks it; every decision
is logged.

**Directory Accuracy audit engine.** This is the scoring layer behind the
"is this listing still accurate" question. It's a hand-weighted, explained
model — not a black box — combining a handful of signals (deactivated
NPPES status, last year of Medicare claims activity, PECOS enrollment)
through a logistic function rather than a clamped sum, because a clamped
sum turned out to discard most of the evidence on well-corroborated
providers. Two findings override the arithmetic outright regardless of
score: a deactivated NPI always caps at "likely inactive," and an open OIG
flag always forces "unverifiable pending review." A missing input is never
treated as a clean signal — it's recorded as `unknown` and shown in the
narrative, not silently dropped. Findings feed a written rationale
generated separately from the scoring pass itself, so a single audit
can't be read two different ways depending on which model wrote which
part.

**Analyst dashboard.** A market-sizing tool for someone deciding where to
expand or invest — ZIP- and city-level supply/demand, shortage
designations, payer mix — plus an AI "market memo" feature that takes a
plain-language question, turns it into a query plan, and writes a memo
over the results. The interesting part isn't the memo, it's the plan: see
below.

## Data

The map runs on the NPPES national provider registry (organizations and
individual practitioners), CMS's Physician & Other Practitioners dataset
and PECOS Order & Referring file for claims/enrollment activity, CDC
PLACES for health measures, and the HHS OIG exclusion list. All 50 states
plus DC are loaded as of this writing — roughly 1.9 million organizations
and 7.15 million individual physicians, around 9 million providers total,
loaded through a one-time national bulk-load pipeline (run by hand,
state by state, from the raw NPPES dissemination file) layered on top of
an hourly incremental job that backfills whichever ZIP codes actually get
searched.

The least glamorous and most consequential problem in this codebase is
that the same specialty is described three different ways depending on
which import batch a row came from — NPPES calls it "Family Medicine,"
one import batch calls it "Family Medicine Physician," another calls it
just "Facility / Clinic" with no discipline attached at all. Matching
"Family Medicine" against only the long-form vocabulary returned zero
results in production. Expanding to only the long-form terms then hid an
entire ZIP's worth of clinics from the opposite direction, and the map
showed "0 Providers" while pins were still visibly on screen. The fix —
always match the bare term alongside its expansions, normalized and
compared with word-boundary matching rather than a naive substring check
— is now implemented identically in four separate places across the
codebase rather than centralized, which is its own liability; a partial
database-level normalization pass has cleaned up part of this (roughly
8,500 rows mechanically remapped, verified by row-count shift), but the
"category form" vocabulary — bucket labels like "Facility / Clinic" that
don't correspond to any real specialty code — was deliberately left
alone rather than guessed at.

City-name search had a related problem: the same city can be stored under
several genuinely different spellings simultaneously. Port St. Lucie,
Florida shows up in the data as `PORT SAINT LUCIE`, `PORT ST LUCIE`, and
`PORT ST. LUCIE` — not typos, all three are real, separately populated
rows (675 / 302 / 23 in one table alone). The same split shows up for
Fort/Ft, Mount/Mt, North/N, South/S, East/E, West/W, and Sainte/Ste, and
some cities combine two of them at once (East St. Louis resolves six
different ways). Search now expands whatever a user types across every
combination of these before querying, rather than trusting an exact match
on one spelling.

One more thing worth naming because it shaped a real recommendation bug:
claimed provider listings used to be injected into the care navigator's
candidate list without checking whether they actually practiced the
searched specialty, so the one registered family-medicine practice in a
ZIP got recommended for dermatology and cardiology searches alike. The
model wasn't hallucinating — it was reasoning correctly over a candidate
list that had already been corrupted before it ever saw it. The fix was
upstream of the prompt: gate the injection on specialty match, and treat
an unknown specialty as a non-match rather than a permissive default.

The analyst dashboard's market-opportunity score had a similar shape of
bug, found the same way: checking live counts rather than trusting the
code's own assumption. It computed provider density from one table only,
organization-level NPPES records, while individual physicians live in a
separate table populated by a later pipeline and, in most ZIPs, outnumber
the organizations they might practice at. One ZIP used to verify this: 217
organizations counted, 544 individual physicians silently excluded, so the
score was computing "how underserved is this market" from roughly a
quarter of the real supply. Fixing it moved that ZIP's verdict from
underserved to well served — the more consequential kind of bug, a
confidently wrong business answer rather than a crash. The fix merges both
tables at every level the score computes and shows the org/individual
split explicitly in the UI now, so the total is something a reader can
check rather than a number to trust blindly.

## How the AI pieces are scoped

Every AI feature in this product is built around one rule: constrain what
the model can see and do, don't just instruct it not to misbehave. A
system prompt is advisory and a determined-enough input can talk a model
out of it; an absent database table or a pre-filtered candidate list
isn't optional to bypass.

The clearest example is the market-memo feature on the analyst dashboard.
It's a two-step process — one model call turns a natural-language
question into a single JSON query plan, and a separate, non-AI allowlist
decides whether that plan is even allowed to run before anything touches
the database. The model never sees credentials, never writes SQL, and
literally cannot name a table outside four specific ones (none of which
hold patient data, provider contact information, or audit logs) because
those tables aren't in the allowlist's vocabulary at all. `select *` is
rejected outright, so a future column added to an allowed table doesn't
silently start leaking through an old query plan. This was tested against
a handful of adversarial phrasings, including a plan that just tried to
smuggle in a raw `SELECT`.

The care navigator that talks to patients only ever sees that patient's
own profile, and only sees candidate providers that have already been
filtered to the searched specialty — never the full unfiltered set. The
audit engine's narration step sees the decomposed scoring signals and
nothing else, so it's structurally impossible for it to state a fact the
scorer didn't actually record; if the model's output fails to parse
correctly, the system falls back to a deterministic, template-built
rationale rather than failing the audit or guessing. The pre-visit
briefing feature follows the identical pattern one layer further into
PHI: the model only ever sees facts the patient has already approved, not
the source documents themselves, and the same deterministic-fallback
discipline applies if it produces something unusable.

Every JSON-producing call in the product — document extraction, audit
narration, the market-memo planner — is now constrained with the API's
own schema enforcement rather than a prompt instruction asking nicely for
"JSON only, no prose." That earlier approach mostly worked and
occasionally didn't, in a way that was hard to distinguish from a real
parsing bug until it happened in production; schema enforcement moves
that failure mode from "sometimes" to "structurally can't," though a
guarded parse is still kept everywhere, because a refusal or a
token-limit cutoff can produce a response that never reaches the schema
check at all.

## Access control

Everything sits behind Postgres row-level security, with the service role
reserved for the handful of operations that legitimately need to bypass
it — writing audit logs, seeding a new profile row, and publishing the
one intentionally-public overlay of registered provider data. Patient
health information is self-only: a signed-in patient's token can read and
write their own profile row and nothing else, there's no self-insert
policy at all (rows are created server-side, under the service role, at
registration), and PHI is never logged — an audit record for a profile
update stores which field names changed, never the values.

The three functions that publish anything unauthenticated are the three
places worth double-checking before adding a field to any of them: the
public provider lookup (an explicit allowlist of which columns are safe
to publish — never the internal auth id, never anything patient-related),
the aggregate search-demand endpoint (which suppresses any group small
enough to be re-identifying — a single search for a rare specialty in a
small ZIP is not an aggregate, it's a fingerprint), and the query-plan
allowlist described above.

One access-control bug shipped and was later found and fixed: two provider
tables were briefly readable by anyone with the public API key, including
the internal auth user id and OIG review status, because a cleanup query
filtered on the wrong string value and silently matched nothing while
still reporting success. It's mentioned here because the fix that matters
more than the bug is the one now standing in for the original mistake —
verify a policy fix directly with the same credentials a real client
would use, not with a query built the same way as the thing you're trying
to verify.

## Architecture

Static HTML and vanilla JavaScript on the frontend — no framework, no
build step, no `npm install` to serve the pages. The backend is Netlify
Functions calling Supabase's REST API directly (no ORM), with Postgres,
authentication, and row-level security all handled by Supabase. AI
features run on Anthropic's Claude models, split by latency and task
weight rather than using one model everywhere — Haiku for anything in the
critical path of a user request, Sonnet for longer-form generation where
a few extra seconds doesn't matter.

```
v2/                          the product itself — patient app, provider pages, analyst dashboard
v2/netlify/functions/        backend: auth, matching, scoring, screening, audits
v2/netlify/functions/lib/    pure scoring and query-planning logic, unit-tested independently
supabase/migrations/         schema history, applied by hand through the SQL editor
scripts/                     scheduled data imports (LEIE, Medicare/PECOS, CDC PLACES) and test scripts
.github/workflows/           the scheduled jobs that run those scripts
```

Netlify Functions carry a hard 26-second execution ceiling, so anything
that chains multiple external calls — NPPES lookup, geocoding, an
Anthropic call — is budgeted deliberately rather than left to find out at
runtime. `patient-match`, for example, is built to spend roughly 15
seconds across NPPES, two geocoding attempts, and the model call, with
each step carrying its own explicit timeout, so a slow external service
returns a clean error instead of the whole function getting killed
mid-response. Anything too large for that budget — the national NPPES
bulk load, in particular — doesn't run as a function at all; it runs as a
batched, hand-triggered script.

## Running it locally

No build step and no `package.json` for the frontend — it's served as
static files. You need the [Netlify CLI](https://docs.netlify.com/cli/get-started/)
for the functions and a Supabase project for the database.

```bash
npm install -g netlify-cli
git clone https://github.com/hamzailahi/ProviderPulse.git
cd ProviderPulse/v2
# create .env with the variables below
netlify dev
```

Schema changes live in `supabase/migrations/` but aren't applied
automatically — there's no migration runner. Run each file in order, by
hand, in the Supabase SQL editor.

## Environment variables

| Variable | Required for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | every function |
| `ANTHROPIC_API_KEY` | care navigator, market memo, audit narration, report generation |
| `ADMIN_PASSWORD` | the OIG review queue (`admin-review.html`) |
| `AUDIT_ADMIN_KEY` | the Directory Accuracy audit engine (`audit-run`, `audit-narrate`, `report-generate` in audit mode) |
| `PATIENT_SIGNUP_ENABLED` | patient registration kill switch — defaults closed, since patient PHI storage isn't live until a Supabase BAA is in place |
| `DOCUMENT_UPLOAD_ENABLED` | patient document upload endpoints |

## Scheduled jobs

Four GitHub Actions keep the backing data current. Each can also be
triggered manually through `workflow_dispatch`.

| Workflow | Cadence | Source |
|---|---|---|
| `leie-import.yml` | monthly, the 8th | HHS OIG exclusion list — full refresh, not an upsert, so a reinstated provider actually disappears from the table |
| `medicare-activity-import.yml` | monthly, the 12th | CMS Physician & Other Practitioners PUF + PECOS Order & Referring |
| `medicare-enrollment-import.yml` | monthly, the 18th | CMS Medicare Monthly Enrollment — current month only; the source file is CMS's full history back to 2013, so this keeps just the newest month and overwrites the table rather than accumulating one |
| `cdc-places-import.yml` | see workflow file | CDC PLACES health measures |
| `npi-zip-enrich.yml` | hourly | incremental NPPES backfill, limited to ZIPs someone has actually searched (the full state-by-state national load is a separate, hand-run process not included in this repo) |

## Tests

No test runner, no dependencies — plain Node scripts that print a
pass/fail count and exit non-zero on failure:

```bash
node scripts/test-accuracy-signals.mjs    # the scoring engine
node scripts/test-query-plan.mjs          # the market-memo query allowlist
node scripts/test-claimed-relevance.mjs   # specialty gating on claimed listings
```

Passing tests haven't been a reliable signal of correctness on their own
in this codebase — a couple of real production bugs (a coercion bug that
misread every missing claims-activity year as year zero, and two scoring
overrides that were quietly getting outvoted by the arithmetic around
them) shipped with every test green, and only surfaced from reading the
actual rendered output a user would see. Worth keeping in mind before
trusting a passing suite over looking at real output.

## Known limitations

`clinics.primary_taxonomy` still holds three different vocabularies for
the same underlying specialty depending on which import batch a row came
from, and every place that matches against it re-implements the same
word-boundary matching rule independently rather than relying on one
normalized value stored once. A partial database-level cleanup has
happened, but the fix belongs at the schema level, not copy-pasted across
four call sites.

Individual-physician-to-clinic affiliation (which clinic a given
physician most likely practices at) is inferred live in the browser from
shared coordinates rather than read from a stored, precomputed link — the
pipeline stage that was supposed to produce that link produced no rows in
production, so the map falls back to a same-coordinate guess at render
time instead of a confirmed fact.

The new Medicare Advantage payer-mix figure is state-level, not ZIP-level
— there's no ZIP-to-county crosswalk in this schema, which is the same
reason the HRSA shortage score falls back to a state median rather than
matching the exact county a ZIP sits in. Both are honest about the
precision they actually have rather than presenting a state figure as if
it were specific to the ZIP being viewed.

The appointment-request/briefing flow and the market-opportunity fix
described above don't have dedicated automated test coverage yet, unlike
the three areas listed under Tests — verified by hand against live data
before shipping (see the bug writeup in Data), but not yet pinned down
the way the scoring engine, the query planner, and claimed-listing
gating are.

## License

All Rights Reserved — see [LICENSE](LICENSE). The source is public for
portfolio and evaluation purposes; reuse requires permission.
