# CLAUDE.md

Healthcare provider directory ("ProviderPulse"), deployed on Netlify with
Supabase as the auth and database backend. Static HTML frontends, Netlify
Functions backend, no build step. The functions have one npm dependency,
`@anthropic-ai/sdk`, declared in `v2/package.json` with a committed lockfile;
Netlify installs it on deploy and CI runs `npm ci --prefix v2`. Keep it the
only one unless there's a strong reason.

**This repository is public.** Nothing secret goes in this file or anywhere
else in git: no keys, no passwords, no service-role tokens. Secrets live in
Netlify environment variables and GitHub Actions secrets only.

## Keep the README current

Every change that lands on `main` must update `README.md` in the same push:

1. Add a bullet under the current date in the **Changelog** section (newest
   date first; create the date heading if it doesn't exist). Say what changed
   for a user or operator, not which files moved.
2. Update any section the change makes stale: product description, the
   market model, environment variables, scheduled jobs, tests, known
   limitations, the latest migration named under "Running it locally".
3. Bump the "Last updated" date near the top.

Keep this file current too. When a change makes a section below wrong, fix
the section in the same commit.

## Writing style for docs and user-facing text

No em dashes. Vary sentence structure.

## One site, one deploy

`v2/` **is** the product: `providerpulse-v2.netlify.app`. Pages:

| Page | Who | What |
|---|---|---|
| `app.html` | patients | search-first find-care app with map, booking, optional AI helper |
| `portal.html` | providers | Overview, Appointments, My listing, Locations, Competition, Market |
| `index.html` | providers + staff | market dashboard (`/dashboard`) |
| `auth.html` | both | the only sign-in / sign-up surface |
| `register-provider.html` | prospects | pitch page only; signed-in providers are sent to `/portal` |
| `admin-review.html` | operator | OIG review queue |
| `404.html` | everyone | explicit not-found page |

All functions live in `v2/netlify/functions/`.

The repo root used to deploy a second Netlify site (`medicalpracticemap`), a
v1 B2B access-request flow. **That site is retired.** The root holds only a
forwarding `index.html` and a minimal `netlify.toml`; once that Netlify site is
deleted in the dashboard, both can go. The old rule about keeping identical
copies of shared functions in two folders is **gone**. Do not reintroduce a
second copy. The `access_requests` table still holds v1's data.

### Routing (`v2/netlify.toml` `[[redirects]]`)

| URL | Serves |
|---|---|
| `/` | `app.html`. Needs `force = true`, or Netlify serves the static `index.html` and the rule never fires |
| `/dashboard` | `index.html` |
| `/index.html` | `index.html`. **Must stay at this exact path**: it is the target of map deep links built relatively |
| `/portal` | `portal.html` |
| `/register-patient.html` | 301 to `app.html` (the URL was shared externally) |
| `/signin`, `/join` | `auth.html` as **rewrites (200), not redirects**, so the typed URL survives. `mode()` reads the path *and* the hash, because a rewrite arrives with no hash |
| `/map.html` | 301 to `/dashboard`. The file is deleted but the URL is out in the wild |
| `/*` | `404.html` (status 404). **Must stay last**; a catch-all above any rule swallows it |

### Stylesheets and shared scripts (`v2/assets/`)

| File | Used by |
|---|---|
| `tokens.css` | every page: palette, both themes, reset, `.sr-only`, `.hidden` |
| `patient.css`, `find.css`, `patient.js` | `app.html` |
| `portal.css`, `portal.js` | `portal.html` |
| `dashboard.css`, `dashboard-v3.css`, `dashboard-v3.js` | `index.html` (v3 files layer the redesign over the original dashboard) |
| `forms.css` | `register-provider.html`, `auth.html`, `admin-review.html`, `404.html` |
| `directory.js` | shared browser helpers: Supabase URL/key, `loadLeaflet`, `taxNorm`/`taxMatches`, `specialtyCodes`/`codeFilter`, paged `tableQuery`/`providerRowsQuery` (selects `taxonomy_code`), `milesBetween`, MapTiler key, ZIP centroid lookup |
| `specialties.js` | the 44 patient-facing specialties (see taxonomy section); `.SCORED` (42: all but `NOT_SCORED`, Hospital-based clinicians and Other health services) is what `market-score.js`, the assistant, the benchmark builder and the demand trainer score |
| `taxonomy-groups.js` | six specialty groups; `market-score.js` counts supply with it and the dashboard's Insights tab names them. The map no longer uses it (NUCC phase 2). **Being replaced** by `taxonomy-map.js` |
| `taxonomy-map.js` | the dashboard map's classifier since 2026-10-09, and `codesFor(label)` (the reviewed patient-specialty table, visible codes only) behind patient search, portal Competition and the dashboard specialty filter; **generated** by `scripts/build-taxonomy-map.mjs`: every NUCC code to its official Grouping / Classification / Specialization, `show_on_map`, patient specialties. No default: an unknown code logs and returns null, `groupingOf()` throws. Never edit by hand |
| `health-demand.js` | CDC PLACES need model per group; browser + `require` |
| `market-model.js` | the per-specialty market opportunity model; browser + `require` |
| `demand-model.js` | the learned demand model (ridge regression per specialty, state-held-out validation, `addAcs`/`addPlaces` area builders shared by trainer and scorer); browser + `require` |

Shared modules are **dual-exported**: `window.X` in the browser and
`module.exports` under Node. Keep both when editing.

Tokens live in `tokens.css` only. The old `app.css` was duplicated inline
across two pages and drifted; it is deleted, do not reference it.

Document endpoints (`doc-upload-url`, `doc-extract`, `doc-confirm`,
`doc-delete`, `doc-list`) are gated behind `DOCUMENT_UPLOAD_ENABLED`, except
`doc-delete`/`doc-list`, which stay reachable so patients can always remove
documents already uploaded.

## Timeouts

Netlify Functions have a **26-second hard timeout**, and the *default* is 10s.
`netlify.toml` raises everything that chains external calls: 26s for
`market-assistant`, `report-generate`, `patient-match`, `auth-register-provider`,
`doc-extract`, `provider-locations`, `audit-run`, `audit-narrate`; 20s for
`cms-provider`, `appointment-briefing` and `market-score`. Each entry carries a
comment naming the chain that justifies it. Keep those comments current: an
unexplained ceiling is indistinguishable from a copy-paste.

`patient-match` is the cautionary case. It inherited the 10s default while
chaining NPPES 6s + geocoding 5s + Anthropic 15s, so it returned 502s for work
that was about to succeed.

Because 26s is a hard kill, functions should **target about 15s of work**.
External calls carry explicit `AbortSignal.timeout(...)` budgets (NPPES 6-8s,
geocoding 5s per attempt, Supabase 5-8s, Anthropic 12-15s), so the function
returns a clean error instead of being killed mid-flight.

**Client timeouts must exceed server timeouts.** The patient detail sheet once
gave up on `cms-provider` after 10s while the server was still working for up
to 18s, so users saw "Credential lookup is unavailable" for lookups that were
succeeding. It now waits 22s.

Anything bigger than the budget does not belong in a function. The LEIE
import, the Medicare imports and the market benchmarks all run in GitHub
Actions for that reason.

## PostgREST returns at most 1,000 rows

Every response is capped at 1,000 rows no matter what `limit` says. Any query
that could exceed that must page:

- **Keyset** (`key=gt.<last>&order=key`) only on a **unique** key. Keyset on a
  non-unique key silently drops rows that share the boundary value.
- **Offset** (`offset=`) where no unique key exists (e.g. tables keyed by
  `provider_id`).
- Report truncation. `providerRowsQuery` sets `.truncated`, `market-score`
  carries `truncated`, and the market model lowers confidence and adds a
  caveat. A count that hit a cap is a floor, never a total.

`count=exact` on `clinics` or `provider_individuals` times out at this size
(error `57014`). Use `count=planned` for estimates, or page on `npi` and count
client-side (see `scripts/build-market-benchmarks.mjs`).
`primary_taxonomy` has **no index**, so an `ilike` over a whole table times out
too.

## Access model: patients, providers, staff

- **Roles are decided server-side.** Supabase `user_metadata` is writable by
  the account holder, so it is never a trust boundary. `lib/auth.js`:
  `getUser()` validates the JWT; `isProvider()` checks that a
  `provider_profiles` row exists for the user (service role);
  `isStaff()` checks the email against `STAFF_EMAILS`, and staff count as
  providers.
- **The dashboard is provider-only.** `market-assistant` requires
  `isProvider`. `index.html`'s `requireSession()` also sends patients back to
  `/` unless the session is staff; that redirect is the UX half, the function
  checks are the enforcement half.
- `auth-login` / `auth-refresh` return `role` and `staff`, and `auth.html`
  routes by what the **server** returns: patients to `/`, providers to
  `/portal`, staff to `/dashboard`.
- The dashboard still ships the publishable Supabase key and reads public
  tables (`clinics`, `demographics_raw`, ...) directly. Those tables are public
  data. Do not describe the redirect as protecting them.

## v2 function modules (`v2/netlify/functions/`)

All use raw `fetch` against Supabase REST/auth endpoints (no SDK).

- **auth-register-provider.js**: provider self-registration. Luhn-checks the NPI
  (80840 prefix constant 24), looks it up in NPPES, rejects **deactivated** NPIs
  (`basic.status === 'D'`; these stay in the registry forever, so existence is
  not validity), requires the submitted name to match the registry (NPI-1:
  provider name; NPI-2: authorized official), runs OIG screening (below), and
  rejects already-claimed NPIs (409). Creates the auth user, a
  `provider_profiles` row seeded from NPPES via the service role, and
  `provider_insurance` rows (max 50).
- **auth-register-patient.js**: stores PHI (DOB, conditions, concern) in
  `patient_profiles`. **Closed by default**: it runs only when `PATIENT_SIGNUP_ENABLED` is exactly
  `true`, otherwise 503 (this was an opt-out until 2026-09-30, which left it
  open when unset; keep it opt-in, like `DOCUMENT_UPLOAD_ENABLED`). Do not
  enable in production until a Supabase BAA is in place. Passwords are at
  least 12 characters on both flows.
- **auth-login.js**: password grant proxied through the server. Generic 401 so
  email existence isn't leaked. Returns tokens, `role` and `staff`.
- **auth-refresh.js**: Supabase **rotates the refresh token on every exchange**
  and invalidates the old one, so the client must store what comes back.
- **auth-logout.js**: revokes server-side. Clearing browser storage alone left
  the JWT valid until expiry.
- **admin-review.js**: OIG review queue. Gated by `ADMIN_PASSWORD` with a
  length-independent `safeEqual`. A shared secret, not an account; keep it off
  public nav.
- **profile.js**: GET/PUT own profile under the **caller's JWT**, so RLS is the
  enforcement layer. PUT whitelists fields (`PROVIDER_FIELDS` /
  `PATIENT_FIELDS`) and verifies the PATCH touched a row. It **does not** create
  a missing provider row (that would let any account become a provider).
- **providers-public.js**: public, unauthenticated lookup of claimed listings by
  NPI (`?npis=`) or all (`?all=1`, capped). **`PUBLIC_COLUMNS` is the security
  boundary**: it runs under the service role, so every field it returns is
  published. Never add `id`, email or anything patient-related. `provider_id`
  is stripped from `locations[]`. Only `review_status=eq.clear` listings are
  returned; it falls back without the filter only on a 400 (column missing),
  never on other errors. `address_line` is published deliberately (it is
  already public in NPPES). Fails soft with `{providers:{}, degraded:true}`.
- **provider-locations.js**: CRUD on a provider's own practice sites under the
  caller's JWT. Geocodes on save via `lib/geocode.js`. **`verified` is not
  writable.** Making a location primary demotes the previous primary first.
  Returns `{locations: [], unavailable: true}` if the table is missing.
- **appointment-request.js**: the request-to-book flow (migration 018).
  Patients create by **NPI**; the function resolves the claimed provider.
  Reads/writes run under the caller's JWT. Status transitions are whitelisted
  **in code** per role (patient: cancel; provider: confirm, decline,
  complete), because RLS decides *who* may touch a row, not *which* value they
  may set. A provider may set `requested_time` when confirming. GET names the
  other party but **never returns `provider_id`**. IDs are UUID-validated.
- **appointment-briefing.js**: physician-facing pre-visit briefing, only for
  **confirmed or completed** appointments. Organizes facts the patient supplied
  or approved; never diagnoses, interprets values or suggests treatment.
  Authorization is a re-select of the appointment under the caller's JWT.
  After that it runs under the service role, and **`BRIEFING_FIELDS` is the
  security boundary**. Document facts only when `DOCUMENT_UPLOAD_ENABLED`, the
  table exists, and `status = 'accepted'`. Structured Outputs, 12s abort,
  deterministic fallback, disclaimer enforced twice (prompt and write-back).
- **audit-run.js**: Directory Accuracy audit over explicit `npis[]` (max 25).
  `x-audit-key` against `AUDIT_ADMIN_KEY`; an **unset** key returns 503. NPPES
  at concurrency 6, batched `in.()` reads, geocoding skipped when the address
  already matches NPPES. The audit row is written `pending` first and only
  marked `complete` when every NPI has a finding; leftovers come back in
  `remaining`.
- **audit-narrate.js**: rationale per finding, separate from `audit-run` for
  budget reasons. One call per audit. The model sees the `signals` array and
  nothing else. Deterministic fallback on parse failure; the response says
  which path ran.
- **report-generate.js**: only `{type:'directory_audit', audit_id}` now, which
  renders a stored audit as one self-contained HTML document (no external
  assets; it gets printed and forwarded), behind `x-audit-key`. Anything else
  returns 410: the dashboard's market reports moved to the assistant
  (2026-09-29), and the Reports tab is a builder that sends it a brief.
- **market-score.js**: public. The ZIP opportunity verdict plus, since
  2026-09-29, the per-specialty **`model`** (see "Market opportunity model").
  ZIP-level score is `40% under-supply + 30% payer mix + 30% shortage`, with
  `WEIGHTS` in the file. Supply counts `clinics` (NPI-2) **and**
  `provider_individuals` (NPI-1), merged; before 2026-08-19 it counted clinics
  alone and undercounted 2-10x (ZIP 38017: 544 individuals vs 217 clinics).
  `clinic_secondary_locations` is excluded from counts (extra sites of an NPI
  already counted). The whole-area density is compared with **its
  state's** listings per 1,000 residents (`market_benchmarks`, kind
  `state_density`, built by the benchmark job), never a national constant: the
  old hard-coded 5.8 came from organizations only while the local count
  included individuals, so almost every market read as well supplied.
  Numerator and denominator must stay like for like (every `clinics` +
  `provider_individuals` row over Census population). No benchmark means the
  supply term is dropped and the score re-weights over payer and shortage;
  `metrics.benchmark_per_1k` is `null`, with `benchmark_scope: 'state'`. `hpsa_designations` stores **full** state names while
  `clinics` stores codes; the mapping is in the file. The `medicare` field is
  ZIP-level via `zip_county_crosswalk` (`level: 'zip'`), falling back to the
  state aggregate (`level: 'state'`). Accepts `?specialty=` (model headline) and
  `?npi=` (the viewer's own listing is not a competitor), and `?add=1..5`
  ("what if I open here": re-scores the same catchment with N extra listings of
  that specialty at the ZIP centre and returns `model.scenario` with before,
  after and assumptions; supply only, need, payers and shortage are held fixed). Returns
  `available:false` with a reason rather than a synthesized score.
- **demand-stats.js**: public aggregate read of `demand_log` with suppression
  (see demand logging).
- **market-assistant.js**: provider-only (staff included). The dashboard's
  Ask AI. See "The market assistant" below. (It replaced `ai-query.js` on
  2026-09-29; that endpoint accepted a client-written system prompt and only
  saw clinics loaded in the browser.)
- **patient-match.js**: AI care navigator, signed-in patients only. Maps
  conditions and chat keywords to NPPES taxonomy terms
  (`CONDITION_TAXONOMY` / `KEYWORD_TAXONOMY`; chat intent overrides profile
  conditions) or takes an explicit `specialty`. Searches NPPES by ZIP, ranks by
  closeness, promotes claimed listings that accept the patient's payer **and
  practise the searched specialty**, keeps the top 3, geocodes, then Claude
  (15s abort) presents them. `mode:'log'` records a directory search in
  `demand_log` without running the AI. Returns
  `{ reply, providers, zip, taxonomies, map_taxonomies }`.
- **cms-provider.js**, **nppes-lookup.js**: read-only lookups for the detail
  sheet (`patient.js` calls both) and dashboard popups. `cms-provider` is
  backed by `cms_provider_cache` (90-day TTL). **Only a 2xx response with a
  `results` array is an answer**; CMS 4xx/5xx responses are never cached as
  "not found". The CMS API returns **lowercase snake_case** keys
  (`provider_first_name`), not the Data Dictionary's display names; this broke
  every field silently until 2026-08-13. Verify field names against a live
  query. Medicare publishes these details for **individual clinicians only**:
  the patient sheet decides person vs organization from the NPPES
  `enumeration_type` (NPI-1 vs NPI-2), **not** from which table the row came
  from.
- **payers.js**: public list of insurance plans for a state (`?state=` or
  `?zip=`).
- **provider-count.js**: count helper using `count=planned`.
- **zip-enrich-request.js**: public; queues a ZIP for the background NPPES
  backfill. Does not call NPPES itself.
- **lib/auth.js**: `getUser`, `isProvider`, `isStaff` (see access model).
- **lib/geocode.js**: the one geocoding chain. Google Geocoding
  (`GOOGLE_GEOCODING_KEY`) first, Nominatim as the free fallback. Photon was
  dropped so worst-case latency stayed within budget. Its `console.log` lines
  print the queried address; patient searches can contain home addresses, so
  trim or remove that logging.
- **lib/accuracy-signals.js**, **lib/query-plan.js**, **lib/audit-report.js**,
  **lib/zip-enrichment.js**, **lib/answer-check.js**: pure logic, see their sections.

## The taxonomy vocabularies (the single biggest source of bugs here)

**`clinics.primary_taxonomy` contains two vocabularies** depending on the
import batch, and NPPES uses a third. They describe the same specialty
differently and are **not interchangeable**:

| Source | Example |
|---|---|
| NPPES registry search | `Internal Medicine`, `Family Medicine` |
| `clinics` long form | `Internal Medicine Physician`, `General Practice Dentistry`, `Primary Care Clinic/Center` |
| `clinics` category form | `Internal Medicine`, `Dentistry`, `Vision & Eye Care`, `Psychiatry & Mental Health`, `Facility / Clinic` |

Two production bugs came from this:

1. Searching `Family Medicine` matched **zero** long-form rows, so the map fell
   back to showing all 289 clinics in the ZIP.
2. Expanding to long-form-only terms then matched **zero** category-form rows;
   in ZIP 38017 every clinic was hidden, the map read "0 Providers" while pins
   were visible, and all KPIs went blank.

**The rule that fixes both:** always include the **bare** term alongside its
expansions. Matching is prefix-at-a-word-boundary, so the short form matches
both `Family Medicine` and `Family Medicine Physician`. `mapTaxonomies()` in
`patient-match.js` does this unconditionally; do not optimize the bare term
out.

The tables that bridge the vocabularies:

- `MAP_TAXONOMY` in `patient-match.js`, exposed as `map_taxonomies`. **A map
  link must use `map_taxonomies`, not `taxonomies`.**
- `SPECIALTIES` in `assets/specialties.js`: 44 entries of
  `[label, mapTerms, nppesTerm]` (33 until 2026-10-09; see NUCC codes phase
  3). Patient-facing search finds a label's listings by **code**
  (`TaxonomyMap.codesFor`); `mapTerms` still serve claimed listings'
  self-reported specialty, `#tax=` deep links, the navigator and My
  market's guess at a provider's own specialty (`specFor`, from
  `taxonomy_desc`). The market side matches by code too since 2026-10-11.
  `mapTerms` match `clinics.primary_taxonomy`;
  `nppesTerm` goes to the NPPES API. Every `nppesTerm` was verified live
  (NPPES says `Dietitian`, not `Registered Dietitian`). Frozen, hand-verified
  data. Note that "Orthopedics & sports injury" includes the bare term
  `Surgery`, which also matches general surgeons (about 193k listings
  nationally); tightening it changes patient search too.
- `assets/taxonomy-groups.js`: collapses the live values into **six** groups:
  `primary`, `specialty`, `surgical`, `dental`, `behavioral`, `facility`.
  Rules are **ordered, and discipline wins over venue**: a `Dental
  Clinic/Center` is dental. `facility` is only for entities with **no**
  clinical discipline, so no clinician is ever classified as a facility.
  `market-score.js` still uses it for the ZIP-level verdict's clinician
  count, the per-group access and need fallbacks, the shortage discipline
  and Insights' group names; the map moved to NUCC groupings on 2026-10-09
  and per-specialty supply to codes on 2026-10-11. Do not add a second
  clinician/facility split anywhere.

**Matching rule.** Normalize both sides (lowercase, `&`→`and`, punctuation to
spaces, trim), then require `(' ' + stored).includes(' ' + term)`. The leading
space is load-bearing: without it `Urology Physician` matches
"Ne*urology Physician*". Never simplify it to a plain `includes`.

Copies of that rule: `assets/directory.js` (shared by `patient.js` and
`portal.js`), `index.html` and `dashboard-v3.js`, `demand-stats.js`,
`market-score.js`, `scripts/build-market-benchmarks.mjs`, and
`patient-match.js`'s `practisesAny` (which also checks reverse containment).
Copy it verbatim; do not re-derive it.

Normalizing `clinics.primary_taxonomy` in the database would remove this bug
class. **Partially done 2026-08-10** in the external bulk-load pipeline: of 923
distinct values, 855 were already exact NUCC names, 10 were mechanically
mapped (a " Physician" suffix, 8,584 rows), verified by row-count shift. **58
category-form values (54,987 rows) were left alone on purpose**; nothing in
NUCC fits a bucket like `Facility / Clinic`, and guessing was rejected. The
three-way rule still has to exist.

**Live inventory, 2026-10-06** (`supabase/reference/taxonomy-inventory.csv`,
NUCC 26.1): 909 distinct names over 10,175,703 rows (1.90M `clinics`, 7.15M
`provider_individuals`, 1.13M secondary). 893 match an official NUCC name
(871 exactly by display name); only **16 names on 133 rows** match nothing
(`Facility / Clinic`, `Therapy & Rehabilitation`, a raw code `246ZS0400X`, a
typo `Biostatiscian`, ...), so the category form is now nearly gone. 347
clinician names (2.42M rows) fall under no patient specialty, led by
`Behavior Technician` (562,631 rows), which `taxonomy-groups.js` also files
under Specialty Medicine rather than Behavioral Health. Three `mapTerms`
match nothing stored: `Podiatry`, `Speech & Hearing`, `Alternative Medicine`.
Being acted on: see NUCC codes below.

### NUCC codes (replacing keyword groups; phase 1 shipped 2026-10-08)

The spec: classify every listing by its own NUCC code and the official
hierarchy (Grouping, then Classification, then Specialization), with **no
keyword matching and no default bucket**. Three phases, each gated:

1. **Data (done 2026-10-09).** Migration 029 adds `taxonomy_map` and
   `taxonomy_code` / `taxonomy_code_source` on `clinics`,
   `provider_individuals`, `clinic_secondary_locations`. The
   `taxonomy-backfill.yml` job (`scripts/taxonomy-backfill.sh`) takes each
   NPI's code from the NPPES monthly file: the slot flagged primary, else the
   first listed (`nppes_first`, counted), else, for an NPI NPPES lacks or a
   code missing from the NUCC release, an **exact** display-name match
   (`display_name`). A name NUCC gives two codes (Pharmacist, Psychologist,
   Podiatrist, Clinical Neuropsychologist, Military Hospital: 873 rows in the
   first dry run) resolves only through the reviewed list
   `supabase/reference/taxonomy-name-overrides.csv` to its general code
   (`display_name_reviewed`; the user's choice, 2026-10-09); the parser refuses
   rows whose name is not ambiguous or whose code does not carry the name. Everything else goes to `supabase/reference/taxonomy-exceptions.csv`
   with a reason. Secondary rows take their parent NPI's code. Decisions live
   in one tested place (`scripts/lib/taxonomy-map.mjs`, `taxonomy-assign.mjs`);
   dry run and apply share them. Apply refuses unless the `disk_free_gb` input
   covers ~1.1x the three tables' size plus 1.5 GB staging and 2 GB of WAL
   (an UPDATE writes a new row version; the first dry run, 2026-10-08, measured
   the tables at 3.1 GB, so about 6.9 GB, against 2.9 GB free on a 12 GB disk). Updates run per 4-digit NPI prefix, each its own
   transaction, VACUUM every 250, skipping rows already right, so a rerun
   resumes. Then migration 030 (indexes, concurrently). The hourly enrichment
   writes `taxonomy_code` (`nppes_api`) once the column exists.
   **Applied 2026-10-09** (NPPES September 2026 file, 3h01m on an 18 GB disk):
   10,175,696 of 10,175,703 rows coded; 9,443,429 NPPES NPIs carried a
   taxonomy and every one was flagged primary (`nppes_first` 0); 18,622 rows
   by exact display name, 873 by the reviewed name list; **7 exceptions**
   (reversed legacy labels such as `Counselor, Professional`, and the retired
   code `246ZS0400X`) in `supabase/reference/taxonomy-exceptions.csv`. The
   stored name agreed with the NPPES code on 98.5 to 99.6% of rows; the rest
   changed taxonomy between the March load and September, and the code is the
   newer fact.
2. **Map (done 2026-10-09).** The dashboard selects `taxonomy_code` with
   every row and classifies it through `TaxonomyMap.get`: map groups are the
   NUCC `Grouping` strings verbatim (29 names; `Other Service Providers`
   exists in both sections, so groups are keyed `I|name` / `O|name`, 30
   pairs). Individual groupings take a vivid palette and organizational ones
   a muted palette (square dots in the key), assigned by position in
   `TaxonomyMap.groupings`, so a new NUCC release needs no code change. The
   map key (`dashboard-v3.js`, fed by `window.onGroupingCounts` after each
   `renderMap`) lists groupings present with a checkbox and a count of what
   passes every other filter; unchecking calls `setGroupingVisible`. Popups
   and single-pin tooltips show Grouping › Classification › Specialization
   plus the code. `show_on_map=false` codes are left off silently. A missing
   or unknown code is **hidden and reported**: `console.error` once per code
   (or per NPI when the code is missing) and "N listings hidden: unknown
   taxonomy code" in the key. Never reassigned. Rows with no `_src`
   (navigator injections) are never hidden by grouping. The **Exact
   taxonomies** dropdown and the specialty filter still match stored
   **names** until phase 3; their dots borrow the grouping colour.
   `market-score.js` and Insights still use the six groups.
3. **Patient specialties (after review).** The 33 specialties re-keyed on
   codes; every visible Individual code (698 in v26.1) must belong to at least
   one, explicitly, in `supabase/reference/taxonomy-overrides.csv`
   (`patient_specialties`, `;`-separated). Hospital-only NPs (Acute Care,
   Critical Care, Neonatal) go to a new **Hospital-based clinicians**
   specialty (the user's choice). The full table goes to the user as a
   spreadsheet for approval before search switches; benchmarks are rebuilt
   after. **Approved by the user 2026-10-09 as proposed** and written into
   `taxonomy-overrides.csv` (790 codes with specialties, plus Student
   hidden); `test-taxonomy-map.mjs` enforces the coverage rule and that every
   label is on `patient-specialties-list.json`. Search does not read it yet.
   The proposal was drafted 2026-10-09:
   `scripts/propose-patient-specialties.mjs` (rules keyed on NUCC
   Classification, then Specialization; exits non-zero if a visible
   Individual code gets no specialty) writes
   `supabase/reference/patient-specialties-proposal.csv` and
   `patient-specialties-list.json`. It proposes 45 specialties: the 33
   labels kept (benchmarks and My market are keyed by label), "Speech &
   hearing" renamed "Speech & language therapy", and 11 new (Hearing &
   audiology, Behavior therapy (ABA), Nursing (RN, LPN), Physician assistant,
   Care coordination & community health, Hospital-based clinicians, General
   surgery, Infectious disease, Genetics & genetic counseling, Hospice &
   palliative care, Other health services): 44 in all. 45 codes were
   flagged for a decision. The rules are a drafting aid: the overrides CSV is now the
   source of truth, edited per code; do not regenerate it from the script.
   **3a, patient-facing, shipped 2026-10-09** (the user's choice of order):
   patient search (`runProviderSearch` / `buildResults`), portal Competition
   and the dashboard specialty select query `taxonomy_code=in.(...)` and
   keep a row only if its code is in the set; a label that is not a
   specialty (a navigator suggestion, a description with no match) falls
   back to name terms. The dashboard keeps `specialtyCodeSet` beside the
   name-keyed `selectedTaxonomies`; `#tax=` deep links stay name-based.
   `resolveQuery` matches label words as **whole words** (a substring test
   sent "hearing" to ENT), lets a partial word match the start of a label
   word only when it is 4+ letters and not generic (`GENERIC_QUERY`:
   physician, hospital, doctor, ...), and matches the registry term only
   from its start ("Surgery" as a whole word took "knee surgery"). Hints
   for the new categories sit in `CONDITION_HINTS` (hearing, speech and ABA
   first, before ENT and mental health); hints read the raw lowercased text.
   Covered by `scripts/test-patient-query.mjs` (it lifts the code out of
   `patient.js`). The 11 new labels' `nppesTerm`s are NUCC classification
   names **not verified live** (NPPES was unreachable): check them before
   relying on the navigator for those categories.
   **3b, market side, shipped 2026-10-11.** `MarketModel.score` takes
   `codesFor(label)` and buckets each catchment listing by `taxonomy_code`
   (one lookup per listing; a code in several specialties counts in each;
   no code counts in none); without it, it falls back to `taxMatches` on
   names (old callers and tests). `market-score` selects `taxonomy_code`,
   scores `SPECIALTIES.SCORED` (42), and a what-if listing carries a code
   that belongs to that specialty alone where one exists. The assistant's
   `find_providers` filters by code; insights, compare and scenario offer
   the 42 scored labels, find_providers and update_map all 44. The
   benchmark builder tallies `taxonomy_code` per NPI slice and sums each
   specialty's codes (`scripts/test-market-benchmarks.mjs` runs it end to
   end against a fake database); state density still counts every row,
   coded or not. The parked demand trainer reads `taxonomy_code` too. The
   frozen 33-label list and its alias are gone. Nine new scored labels got
   **provisional** `PROFILES` (only measures already imported; ABA,
   infectious disease and genetics have no defensible measure);
   "Speech & hearing" became "Speech & language therapy" (stroke, under 18)
   and hearing kept the old hearing-loss profile. **Benchmarks rebuilt by
   code 2026-10-11** (dry run then write, 123 rows, ~16 min each): 9,049,543
   listings read, 7 without a code (the backfill's exceptions); e.g. primary
   care 1,234,150 (4.78/1k adults), ABA 665,583, orthopedics 107,315 (0.42,
   general surgeons now counted under General surgery, 101,262). The old
   "Speech & hearing" row lingers unused (the job upserts and never
   deletes).

`taxonomy-groups.js` remains the classifier for the ZIP-level verdict, the group fallbacks and Insights' group names (see the taxonomy-groups bullet); replacing it is the remaining step.
`show_on_map` and patient specialties are data in the overrides CSV, never
code; the only hidden code is `390200000X` (Student, Health Care).
`taxonomy-map.js` and `supabase/reference/taxonomy_map.csv` are generated
from `nucc_taxonomy.csv` + `cms_taxonomy_crosswalk.csv` + the overrides; CI
runs `build-taxonomy-map.mjs --check`, so a hand edit or stale file fails.

## Insurance payers are state-specific

`insurance_payers` (migration 003) holds national carriers (`state is null`)
plus each state's plans, because Medicaid is rebranded per state (TennCare,
ARKids First, ...) and Blue Cross is a federation of state licensees. Medicare
Advantage brands per state are imported monthly from CMS (see scheduled
jobs), using the **marketing name** from the MA Contract Directory, not the
legal entity name patients don't recognize.

`payers.js` resolves ZIP to state from `clinics` and returns national + local
plans. **Every surface reads from this one endpoint.** `patient-match` compares
a patient's payer to a provider's list by exact string, so two vocabularies
would make every insurance match silently fail. It degrades to a national list
if the table is missing.

## Maps

Leaflet everywhere, tiles from **MapTiler** (`streets-v2` on the patient app
and portal, a light dataviz style on the dashboard). The MapTiler key is public
by design and domain-restricted in the MapTiler console. History: CARTO, then
Esri Canvas, then MapTiler (2026-09-16). A Google 3D view was tried and
reverted the same day (2026-09-17).

Leaflet panes carry their own z-index. Any overlay that must sit above a map
needs the map container isolated (`z-index:0; isolation:isolate`), and sheets
must be opaque.

A map fitted while hidden has zero size. When a hidden map becomes visible,
call `invalidateSize()` and refit.

### Patient map (`patient.js`)

Search-first: what (specialty or plain-language condition), where (ZIP), how
far (**5, 10, 25 or 50 miles**, default 10) and insurance. A specialty's
listings are found by NUCC code (see NUCC codes phase 3). Results come
straight from the directory tables through the publishable key, so search
never waits on the AI and still works if functions are down. Claimed listings
are overlaid from `providers-public`. One circle marker per listed result
(results are paged, so density stays bounded). The AI navigator is an optional
helper that only fills in the search. There is no Directions button; restore it
only when directions are built in-app.

### Dashboard (`index.html` + `dashboard-v3.js`)

Two modes, remembered in `localStorage` (`pp.dash.mode`): **My market** opens on
the signed-in provider's ZIP and specialty via `#zip=…&tax=…`; **Explore** is
any ZIP, city or state. Filters collapse off the map; a specialty select
drives `applyNavigatorTaxonomyFilter`. **Insights** is the first tab. The
dashboard loads **every** adjacent ZIP on demand for market sizing; the patient
side deliberately does not. Keep those separate.

**Neighboring ZIPs** (`loadNeighboringZips` / `addNeighborRing` in
`index.html`): "neighbor" means **shares a border**, tested by
`touchingZips()` (a vertex of one ZCTA within ~80 m of an edge of the other,
both directions, grid-indexed). Never go back to bounding-box intersection: an
L-shaped or large ZIP's box covers ZIPs that don't touch it. Each click adds
one ring around the whole loaded area; one run at a time. Loading neighbors
must **not** reset `selectedTaxonomies`: an unfiltered map stays unfiltered,
a filtered one keeps its selection, and a first-seen taxonomy joins only if it
matches the active specialty (`activeSpecialtyTerms()`). Rebuild the checkbox
list after new taxonomies arrive.

`dashboard-v3.js` overrides `window.renderVerdict`. For a city or county
search there is no single ZIP, so it anchors the score on the most populous
loaded ZIP and says so.

### Deep links into `index.html`

The handler runs on whichever of `DOMContentLoaded`/`load` fires first,
guarded to run once, and re-runs on `hashchange`. **Do not bind it to `load`
alone**; a slow CDN script delayed it for seconds and a bfcache restore skipped
it. Hash forms:

- `#goto=<address>`: geocode and drop a pin
- `#pin=<lat>,<lng>,<name>`: exact coordinates
- `#zip=<zip>&tax=<terms>&rec=<npis>&pins=<lat,lng,npi,name|…>`: navigator form
- `#zip=<zip>&tax=<terms>`: specialty browse (also My market's autoload)

The area form waits for the async loads (polls `groupedData`, ~21s budget),
narrows `selectedTaxonomies`, and plots every matching clinic. `rec=` NPIs get
an amber ring and a ★. `pins=` carries recommended providers' coordinates
because **they come from NPPES and may have no `clinics` row**.
`drawRecommendedPins()` is called inside `renderMap()` because `renderMap`
clears markers on every filter change.

**Empty result:** if nothing matches, hide unrelated clinics via a NUL-prefixed `no-match`
sentinel (written `'\u0000no-match'` in source, never a raw NUL byte) in `selectedTaxonomies` (an *empty* set means "no filter") and say so
in `dbStatus`. Never render a blank map, and never silently show everything.

## Claimed listings

`clinics` is bulk NPPES data and can never say whether a practice takes new
patients or which payers it accepts. Registered providers supply that. Their
data is joined **by NPI at render time as an overlay; `clinics` is never
mutated.**

Marker rings, in priority order: amber 20px = recommended by the navigator;
teal **solid** 17px = claimed at its NPPES-verified address; teal **hollow**
15px = claimed at a **self-reported** address; none = plain NPPES listing.

### Practice locations (`provider_locations`, migrations 006/007)

One account, many sites, self-only RLS, one primary enforced by a partial
unique index. **`verified` is never writable by providers.** NPPES issues an
NPI per location, so only the address tied to the registered NPI is verified.
Migration 006's backfill got this wrong and 007 re-derives the flag from
`clinics`. Coordinates are stored at save; a failed geocode saves as
`geocoded:false` and **a location with no coordinates is never drawn**. Both
maps scope these pins to what's on screen; an unscoped loop scatters pins
nationwide.

"Claim this listing" links in dashboard popups go to
`register-provider.html#npi=<npi>`, but nothing reads that hash any more, so
the NPI has to be retyped. Wire `#npi=` through to `auth.html` or stop
advertising the prefill.

The navigator may say a provider takes the patient's insurance only when the
provider confirmed it. **Never let the model imply unknown means accepted.**

### A claimed listing must practise what was searched

Claimed listings used to be injected into the navigator's candidates with no
specialty check, so the one registered Family Medicine practice was
recommended for everything. The model reasoned correctly over a list we had
corrupted. **When an AI answer looks wrong, check what was put in front of it
before touching the prompt.** `practisesAny` now gates the injection, and an
unknown specialty is never a match. Covered by
`scripts/test-claimed-relevance.mjs`.

## OIG exclusion screening

NPPES proves an NPI exists; it says nothing about exclusion from federal
programs. That's the OIG LEIE list, and **only ~10.5% of LEIE records carry a
usable NPI** (8,586 of 83,665). This is screening for a human, **not a
compliance guarantee**; never describe it as one.

- **NPI match → hard block** (403).
- **Name + state match → flag, not block.** `last + first + state` collides for
  1,120 real combinations. A hit sets `review_status = 'pending'`, which hides
  the listing from the map and the navigator. Organizations match on
  `business_name + state`.

LEIE stores names uppercase and writes the literal string `"NULL"` for unknown
names; never treat that as a surname.

**Fail closed.** A missing `leie_exclusions` table or review columns means
*unknown*, never *cleared*. A **flagged** provider when the review columns are
absent fails registration rather than inserting an unflagged row.

`admin-review.html` + `admin-review.js` are the queue. `ADMIN_PASSWORD` is a
**different secret from `AUDIT_ADMIN_KEY`**; neither should inherit the other's
blast radius. Every decision writes to `audit_log`.

## Supabase schema

Base tables were created in the dashboard; everything since is in
`supabase/migrations/`, applied **by hand in the SQL editor**. There is no
migration runner, so a file in that folder is not necessarily applied.
**Supabase keeps no history of editor SQL**: any SQL the user is asked to run
must first exist as a numbered migration file in git. The live structure is
recorded in `supabase/schema/public.sql`, dumped weekly by
`schema-snapshot.yml` (`scripts/dump-schema.sh`, needs the `SUPABASE_DB_URL`
secret, Session pooler string; it strips pg_dump's per-run `\restrict` token
so the file only changes with the schema, and refuses dumps that are short,
lack `clinics`, or contain a credential). A snapshot commit no migration
explains is hand-made drift: write the migration. `supabase/schema-snapshot.sql`
is the read-only SQL-editor equivalent (round-trip tested: a database rebuilt
from its output snapshots identically). Status per file is in
`supabase/migrations/README.md`; keep it current.

Applied as of 2026-09-30: `001`, `003` through `015`, `017` through `022`. `023` applied (`census_acs_zcta`). `024` applied (insurance columns). `025` (allows `demand_model` in `market_benchmarks`) is written but **not applied and not needed** while the demand model is parked. `026` and `027` applied 2026-10-06. `029` (taxonomy codes) applied 2026-10-08, backfilled 2026-10-09; `030` (its indexes) applied 2026-10-09 by `taxonomy-indexes.yml` in 57s, all three valid (clinics 13 MB, individuals 48 MB, secondary 8 MB). **Phase 1 is complete.** `031`/`032` (procedures summary) **abandoned, do not run**; `033` ends a stuck 031 build and drops the summary table.
`016` is applied (the first snapshot shows `clinics_npi_unique`). `028` (closes
public reads of v1's `access_requests` / `access_codes`) applied 2026-10-06,
confirmed by the next snapshot (policies and anon/authenticated grants gone). Held back: `002`
(patient documents) pending a Supabase BAA, so briefings are profile-only.
Migrations use `drop policy if exists` before `create policy` so a re-run is
safe.

`011`/`012` closed a live leak: `provider_profiles` and `provider_insurance`
were readable with the anon key. `011`'s cleanup filtered
`pg_policies.cmd = 'r'`, but that column holds `'SELECT'`, so it matched
nothing while reporting success. **Verify a policy fix with the anon key
directly**, not with a query built the same way as the policy code.

Tables:

- `clinics`: bulk NPPES NPI-2 organizations; the map's primary source.
- `provider_individuals`: NPI-1 individuals (migration 013), kept separate so
  org-only assumptions hold. `affiliated_clinic_npi` (015) is NULL everywhere
  in production.
- `clinic_secondary_locations`: NPPES secondary practice addresses for both
  entity types (014), keyed `(parent_npi, address, zip)`. Never inherits the
  parent's verified ring.
- `demographics_raw`: Census columns by ZIP (`"Total Population"`,
  `"Insured Population"`, age bands like `"Total: 65 to 74 years"`, income
  bands, `"Total: HH Income Pop"`). Column names contain spaces and colons;
  URL-encode them.
- `hpsa_designations`: HRSA shortage areas. Full state names; county names
  with the suffix stripped.
- `provider_profiles`, `provider_insurance`, `provider_locations`: claimed
  listings. `review_status` / `review_reason` from 004.
- `patient_profiles`: **PHI**. Self-only.
- `patient_documents` / `patient_document_facts`: **PHI**, migration 002, not
  applied.
- `audit_log`: service role only.
- `access_requests`, `access_codes`: v1 leftovers (names, emails, one-time
  codes). Unused by any code. Until 028 they had `USING (true)` select
  policies, readable with the publishable key; 028 drops them and revokes
  anon/authenticated privileges.
- `cms_county_utilization` (ER visits, stays, readmissions by county FIPS):
  made in the dashboard, public read, read directly by `index.html`.
  `cms_zip_procedures` is public read and unused by any code.
- `cms_procedures_full`: CMS by-provider-and-service rows (9.8M rows, 28
  columns, **4.0 GB, half the database** on 2026-10-09), made in the dashboard
  by hand; no import script exists. Read directly by `index.html`'s Procedures
  panel, which adds rows up by specialty and code. **A ZIP-level summary was
  tried and abandoned (2026-10-09, migrations 031/032 marked do-not-run, 033
  cleans up):** one GROUP BY over 9.8M rows ran out of disk (temporary sort
  files and WAL, 2.9 GB free); batching by ZIP prefix then crawled, because
  each batch reads a scattered 1% of the table from a small gp3 disk, and the
  build's exclusive lock broke the panel while it ran. The user chose to keep
  the table. If this is revisited: build it outside the live table's path
  (e.g. stream the CMS source file in GitHub Actions and load the summary),
  and **budget scratch space and I/O for any large rewrite, not just the size
  of the result.**
- `insurance_payers`: national + per-state plans, public read.
- `leie_exclusions`: `id` primary key (**not** NPI: most rows have none, and
  177 NPIs repeat). Service role only.
- `npi_activity`: last Medicare claims year, services, PECOS enrollment per NPI
  (008). **Upsert, not full refresh**: absence means unknown, not inactive.
- `directory_audits` / `audit_findings`: audit runs and per-NPI findings (008).
- `demand_log`: what was searched, never who (008).
- `zip_enrichment_queue`: ZIPs due for an NPPES backfill (013).
- `cdc_places`: PLACES measures by ZCTA (`zip`, `measureid`, `value`,
  `pop_18plus`, centroid `lat`/`lon`; 009/010). No `KIDNEY` measure in the
  import.
- `cms_provider_cache`: per-NPI CMS lookups, 90-day TTL (017).
- `appointment_requests`, `appointment_briefings`: booking and briefings (018).
  Two-party RLS; no delete policy (cancellation is a status). Briefings have no
  write policy at all; only a function under the service role writes them.
- `medicare_county_enrollment`: current-month Medicare counts per county (019),
  including `county` name. No history by design.
- `zip_county_crosswalk`: HUD ZIP-to-county with residential-address ratio
  (020). ZIP 38017 is 91% Shelby / 9% Fayette by address count vs a misleading
  43%/57% by the Census land-area file; that is why HUD was chosen.
- `census_acs_zcta`: ACS 5-year detail by ZCTA (023), built by
  `scripts/import-census-acs.mjs`: `income_bands` (16 household income bands,
  Under $10k to $200k+; the Census top-codes ZIP income at $200,000 or more, so
  no finer split exists), `median_hh_income`, poverty, `age_male`/`age_female`
  (18 five-year bands), `race`, `education`. `state` is copied from
  `demographics_raw` so `market-score` can rank within a state. Suppressed
  Census values are `null`, never 0. Public read, service-role write. It sits
  beside `demographics_raw`, which is untouched (its income stops at "$100,000
  and over", and its insurance-by-income cut cannot be made finer: ACS does not
  publish it). Migration 024 adds `ins_universe`, `ins_uninsured`, `ins_medicare`,
  `ins_medicaid` (ACS B27001, and the collapsed C27006 / C27007 since the 2024
  5-year ZCTA release has no B27006 / B27007: civilian noninstitutionalized
  population; first loaded 2026-10-05, 38017: 56,456 covered, 3,490 uninsured,
  9,331 Medicare, 2,489 Medicaid; Medicare and Medicaid overlap, never add them). The import finds
  those cells by Census label at run time (`pickInsuranceVars`), trying the
  detailed B table then the collapsed C table for each figure (the 2024 5-year
  ZCTA release returned 404 for `B27006`), and leaves a figure null, with a log
  line, when neither has it. Migration 026 adds `pop_prior`/`pop_prior_year`
  (B01003 from the release five years earlier, for growth; pre-2021 releases
  use 2010 ZCTAs, so the dashboard hides swings above 50%) and `signals` jsonb
  `{key: {n, of}}` for `disability`, `employer`, `direct`, `tricare`, `va`,
  `seniors_alone` (`SIGNAL_RULES` in `scripts/lib/acs.mjs`, found by label with
  the same B-then-C fallback; seniors' universe is people 65+ in households).
  Coverage types overlap: never add them. The dashboard shows a signal only when
  every ZIP in view has it. First load 2026-10-06: every B27004/5/8/9 table
  404'd at ZCTA and the C tables were used (6 cells each); disability from
  B18101 (12 cells); growth baseline ACS 2019 for 33,120 ZCTAs. 38017: population
  55,073 to 56,826 (+3.2%), disability 9.4%, employer 72.3%, direct-purchase
  16.1% (includes Medigap, so it runs high), TRICARE 2.8%, VA 1.8%, seniors
  living alone 22.5% of 65+.
- `sahie_county`: Census SAHIE county uninsured estimates (027), **under 65
  only** (the default slice; 65+ is nearly all Medicare), with margin of error
  and year. `market-score` returns `sahie` for the county holding most of the
  ZIP's homes (largest `res_ratio`) and `available:false` when there is no row
  or rate; Insights labels it "under 65" with its source. Public read. First
  load 2026-10-06: SAHIE 2024 (2025 not yet published), 3,144 counties, one
  without a rate; Shelby County TN 12.6% +/-0.8 of 732,633 under 65. Note it
  differs from the ZIP's ACS uninsured share (38017: 6.2%, all ages): different
  area and different ages, both correct.
- `taxonomy_map` (029): one row per NUCC code, loaded from
  `supabase/reference/taxonomy_map.csv` by the backfill job (never by a
  migration, so a NUCC release needs none): official `grouping`,
  `classification`, `specialization`, `display_name`, `section`, CMS
  `cms_specialty_code` / `cms_specialty_name` (several joined with `; `),
  `patient_specialties text[]`, `show_on_map`, `nucc_version`. Public read.
- `market_benchmarks`: benchmarks for the market model (021), keyed
  `(kind, key)`: `measure`, `specialty`, and `state_density` (the last needs 022's widened check constraint; first written 2026-09-30, 114 rows). Public read,
  service-role write.

**Migration 008's four tables (`npi_activity`, `directory_audits`,
`audit_findings`, `demand_log`) have RLS enabled and NO policies.** That is the
access model: anon and authenticated are denied, the service role bypasses.
Do not "fix the missing policies"; a policy on `demand_log` would publish
search behavior.

## PHI handling rules

- Never log PHI values. Profile-update audit rows record **field names** only.
- Patient data flows only to the patient's own session and their own
  navigator prompt. On a specialty browse, health history is omitted from the
  prompt entirely.
- Roles are checked server-side (see access model), never read from
  `user_metadata`.
- The published surface, to re-read before shipping any change to it:
  `providers-public.js` (`PUBLIC_COLUMNS`), `demand-stats.js` (`MIN_GROUP`),
  `lib/query-plan.js` (`TABLES`), `appointment-briefing.js`
  (`BRIEFING_FIELDS`), `market-score.js` (aggregate public data only), and
  `market-assistant.js` (`TOOLS`: anything a tool returns reaches the model
  and then the user).
- All API values placed in the DOM go through `textContent` (the `h()` / `el()`
  builders), never `innerHTML`. Where the dashboard still builds HTML strings,
  values must be escaped.

## Frontend conventions

- Stylesheets: `tokens.css` plus the page's own sheets, as listed above.
- `app.html`, the portal and the dashboard are forced to the light theme.
- Every page has a `max-width: 640px` breakpoint with 16px inputs (stops iOS
  zoom on focus), visible `:focus-visible` rings, and a
  `prefers-reduced-motion` block.
- Registration forms use `<fieldset class="fs">`, which needs `min-width: 0` or
  the grids inside will not shrink.
- DOM is built with small `h()` / `el()` helpers that set text via
  `textContent` and skip `null` children.

## One session key everywhere

`pp.session.v1` = `{access_token, refresh_token, role, staff, expiresAt}`.
`sessionStorage` by default; `localStorage` only on an explicit "stay signed
in", because `patient_profiles` is PHI and shared devices are common.
`patient.js` still *reads* the legacy `pp.patient.v1` key; nothing writes it.
Sign-out clears every key.

Refresh tokens rotate on every exchange. `patient.js` keeps a single in-flight
`refreshing` promise so concurrent 401s don't each spend a token.
`auth-logout` revokes server-side.

`auth.html` is the only sign-in / sign-up surface. The role tabs choose which
**sign-up** form appears; on sign-in the destination comes from the role the
server returns. Neither registration endpoint returns a session (both need
email confirmation), so signup ends on "check your email".

Not built, because the backend cannot honor them: guest navigator chat
(`patient-match` requires a token; directory search itself needs no sign-in)
and Google/Apple SSO (`auth-login` is a password grant).

## The provider pitch is scarcity-led, never demand-led

Every figure on `register-provider.html` is a live count or a live
`market-score` / `providers-public` response. **Never claim patient demand.**
`demand_log` started empty on 2026-08-04, so a trend ("searches up 34%") is
unsupportable. Reinstate a demand figure only when the log supports the exact
sentence, read through `demand-stats`. When `market-score` returns
`available: false`, print the reason; do not synthesize a verdict.

## Demand logging records the search, never the searcher

One `demand_log` row per search: ZIP, taxonomy terms, payer, source, match
count. **No user id, no JWT subject, no free text, no IP.** Fire-and-forget
with a 3s budget.

`demand-stats.js` is public. **`MIN_GROUP = 5` over `WINDOW_DAYS = 90` is not
optional**: below it a group returns `{suppressed:true}` with no count, the
total is withheld when it could reconstruct them, and suppression runs
**before** sorting so the ranking can't leak. Every extra dimension slices the
same rows thinner; re-derive the threshold before adding one.

## The market assistant (`market-assistant.js`)

A manual tool-use loop on Claude Opus 5.5 (`effort: low`), called by the Ask
AI tab in `dashboard-v3.js`.

- **Stepped, because of the 26s ceiling.** An invocation stops starting model
  calls once fewer than 18s remain (`MODEL_MIN_BUDGET_MS`, so past ~5.5s in)
  and tool runs after 16s; every model call and tool races a 23.5s deadline.
  It then returns `done:false` with the conversation, and the browser posts
  `{continue:true, messages}` until `done:true` (up to 8 hops). Pending
  `tool_use` blocks carry across steps. **A model call that writes a
  document needs 15 to 20s, so it must never start late.** Until 2026-09-30 a
  call could start at 12s with the leftover ~11s, and every one-pager that
  followed tool lookups timed out with "That took too long". If a later call
  in an invocation times out anyway, the step is handed back to retry with a
  fresh clock; a first call that times out returns 504.
- **History is append-only and echoed verbatim.** The browser stores the API
  messages exactly as returned (thinking blocks included) and sends them back.
  Never edit or reorder earlier turns: that invalidates preserved thinking.
  Only `user`/`assistant` roles are accepted from the client; a new question
  is refused (409) while an assistant turn still has unanswered tool calls.
- **The system prompt is the server's.** Per-turn context (mode, ZIP,
  specialty) rides in a `<dashboard>` text block at the start of the user
  turn, so the cached prefix (tools + system) never changes.
- **Tools** (all read-only): `get_market_insights`, `compare_markets` and
  `run_scenario` (1 to 5 more clinicians; before/after; capped server-side)
  (call `market-score.js`'s handler in-process, cached 10 min per warm
  instance), `find_providers` (clinics + provider_individuals around a ZIP,
  word-boundary taxonomy match, distance filter), `query_database` (a plan
  through `lib/query-plan.js`), and two browser effects: `update_map`
  (returned as `actions`) and `create_deliverable` (returned as
  `deliverables`, rendered as a document card). All but `query_database` use
  `strict: true`.
- **Stop reasons:** `refusal` drops the declined question from history;
  `max_tokens` with a cut-off tool call answers it with an error result and
  never runs it; `pause_turn` continues.
- **Degrades instead of breaking.** Requests opt into strict schemas and
  server-side refusal fallbacks (`fallbacks: "default"`); a 400 on that
  request shape retries once without them and stays plain for the instance.
- **Rendering:** the browser draws model output with a small markdown-to-DOM
  renderer (text nodes only). Never `innerHTML` model text.

**Figure checking (`lib/answer-check.js`).** Every digit-written figure in a
final answer and in a `create_deliverable` body must trace to a tool result
from the conversation (display rounding allowed: 13.9 for 13.904, 88% for
0.88, 4.2M for 4,213,000; a 5-digit number such as a ZIP must match exactly),
or be derived from two traced figures shown on the same line (sum, difference,
ratio, percent change, share), or appear in the system prompt or the user's own
words. Exempt: list markers, "top 3", the unit in "per 1,000", structure counts
("3 reasons"), years, "of 100". Spelled-out numbers are not checked (known
limit). Error results are never a source.

- **Answers:** one automatic repair round. The draft is never shown; a
  synthetic user turn starting `[automatic check]` names the untraced figures
  and the model answers again. `roundsSinceQuestion` and `alreadyRepaired`
  treat that turn as part of the same question. If it still fails, the answer
  ships with `verification.unverified` and the browser shows an amber note.
- **Documents:** refused at the tool call (is_error, figures named) up to twice
  per question; the third attempt is issued with `doc.unverified`, shown on its
  card. Clean answers cost no extra model call.
- The browser shows "N figures checked against the data" from `verification`.

**Tracing.** One `[assistant-trace]` JSON line per model call, tool run, check
and invocation (`ev: model | tool | check | step | model_error`) in the function
logs: timings, stop reason, token counts, estimated USD at list prices
(`PRICES`, an estimate, not a bill), outcome, and how many figures failed. It
**never** records the question, answer, document text, a ZIP or who asked. `cid`
is a random per-chat id from the browser, only to group one chat's steps; it is
validated against `/^[A-Za-z0-9_-]{8,64}$/` and reset by New chat. Keep it that
way: do not add fields that carry content.

Covered by `scripts/test-market-assistant.mjs` (fake client, no network) and
`scripts/test-answer-check.mjs`.

## The query plan is the boundary

The assistant's `query_database` tool: Claude proposes **one JSON query
plan**; `lib/query-plan.js` decides whether it may run; the server executes
it and returns **pre-summarized** results.

**The model never touches the database.** Only `clinics`, `demographics_raw`,
`hpsa_designations` and `npi_activity` (aggregates) are reachable. Patient,
provider-profile, document, audit and demand tables are absent **by
construction**. `select *` is never permitted.

Two things that broke it:

- **The planner invented vocabulary** (a `Primary Care` category with zero rows
  in Tennessee). The `query_database` tool description carries the real
  values and the vocabulary warning; keep them there.
- **The filtered column must be selected.** The builder force-adds the taxonomy
  column and pushes an `ilike` prefilter into PostgREST so the filter isn't
  applied after the row limit.

Covered by `scripts/test-query-plan.mjs`.

## Which model runs where, and what it sees

| Surface | Model | What reaches the prompt |
|---|---|---|
| `patient-match.js` navigator | `claude-haiku-4-5-20251001` | the patient's own profile and **only specialty-relevant** providers |
| `market-assistant.js` | `claude-opus-5-5`, effort `low` | the conversation, the dashboard context, and read-only tool results (market score, directory listings, allowlisted query summaries) |
| `audit-narrate.js` | `claude-haiku-4-5-20251001` | the `signals` array only |
| `doc-extract.js` | `claude-sonnet-5` | an uploaded document. **PHI**, BAA-gated, off |
| `appointment-briefing.js` | `claude-haiku-4-5-20251001` | concern, conditions, and patient-**approved** facts |
| `report-generate.js` audit | none | renders stored rows |

JSON-producing calls use Structured Outputs (`output_config.format`) plus a
guarded parse. JSON Schema can't express dynamic keys, so use arrays of
objects, not objects keyed by id.

**Constrain the input, not just the instructions.** Every AI bug found here so
far was a bad input faithfully reported.

## Market opportunity model (`assets/market-model.js`)

Runs inside `market-score.js` over a catchment of the ZIP plus nearby ZCTAs
within 25 miles (by centroid). For each of the 42 scored specialties
(`SPECIALTIES.SCORED`), with listings assigned by NUCC code:

| Factor | Weight | Input |
|---|---|---|
| need | .30 | PLACES measures per specialty (`PROFILES`) as national percentiles, plus age-mix percentiles within the state. (A learned replacement exists but is **parked**: no usable models, see below.) |
| access | .30 | `100 - per1k / nationalRate * 50`; **zero clinicians = 100** |
| pay | .20 | insured rate (70%) and income (30%) percentiles within the state. Income is ACS median household income (50%), share of households at $100k+ (25%) and low poverty (25%) when `census_acs_zcta` has this ZIP and at least 30 in its state; else the `demographics_raw` share at $75k+. `evidence.pay.income_basis` says which (`acs` or `census75`) |
| shortage | .10 | HPSA score / 25 for the matching discipline (behavioral → mental, dental → dental, else primary) |
| competition | .10 | nearest same-specialty listing: ≤1 mi → 30, ≥10 mi → 90, none → 95 |

Rules that must hold:

- **Unknown is never average.** A missing factor is dropped and weights
  renormalized; it is never filled with 50.
- **Fallbacks are disclosed and cost confidence.** Group-level need or access
  (no benchmark yet) and a state-median shortage each add a caveat. Confidence
  is the data-backed weight share minus penalties (group basis −0.15 each,
  truncated counts −0.1, under 5,000 adults −0.15); high ≥ 0.8, medium ≥ 0.55.
- **Archetypes** (`classify`): insufficient if low confidence and < 3 factors;
  unserved if 0 clinicians; access ≥ 60 and need ≥ 60 → safety-net if pay < 50,
  else prime; access ≥ 60 and need < 55 → latent; access < 40 → crowded
  premium if pay ≥ 60, else saturated; otherwise balanced.
- **Reasons** are the top 3 factors by distance from 50 × weight, in words.

HPSA county matching: `countyKey()` strips suffixes (County, Parish, Borough,
City, Census Area, Municipality) and normalizes "St." on both sides. It reports
`basis: 'county'` or `'state'`; it has not been verified against every suffix
variant in live data.

Benchmarks come from `market_benchmarks`, built by
`scripts/build-market-benchmarks.mjs` (quarterly workflow, or run by hand).
Measure anchors are unweighted national ZCTA percentiles; specialty rates are
listings per 1,000 US adults, counted by paging both provider tables on `npi`
in 20 NPI-prefix slices, tallying per `taxonomy_code` and summing each
specialty's codes (by name until 2026-10-11). First full run
2026-09-29: 29 measures and 33 specialties written. That run's log reported
1.8M rows read out of roughly 9M, because parallel workers raced on the
running total; the per-taxonomy tallies were unaffected, and the total is now
computed correctly with a 5M sanity floor.

**Learned need (`assets/demand-model.js`).** Per specialty, ridge regression of
log(1 + Medicare patients per 1,000 FFS enrollees) on standardized inputs:
share 65+, share under 18, log median income, poverty, uninsured, Medicaid,
bachelor's-plus, and that specialty's `PROFILES` PLACES measures **that have
data** (no `KIDNEY` rows, which once zeroed Kidney and Urology). **Claims are
counted where the doctor practises**, so the first run (2026-10-05, dry) learned
geography: bachelor's-plus led almost everywhere, primary care had share 65+ at
-0.55, cardiology CHD -0.30, oncology CANCER -0.20. Fixes, all required: each
training row is a county **pooled with every county within 25 miles** (label
and inputs, `mergeArea`); **supply and urbanity are controls**
(`c_supply` = log1p clinicians per 1,000 enrollees within reach, `c_logpop`),
fitted then held at their training mean in `apply`, never shown as drivers;
`usable` needs held-out R² >= 0.15 **and** at least 0.02 more than a
controls-only model (`r2_gain`) **and** every profile measure's coefficient on
the expected side (inverted measures negative). Areas with no clinicians of the
specialty are excluded. Validation holds out whole states (pooled areas can
cross state lines, a small leak).

**Status: parked (2026-10-06).** The second dry run, with all fixes, found **0 of
33 usable**: held-out R² 0.37 to 0.79 overall, but supply and urbanity alone
scored 0.38 to 0.78 and population inputs added -0.014 to +0.033 (eye care, the
only one above 0.02, failed the direction gate on DIABETES). Medicare FFS use
follows supply (the Dartmouth Atlas finding), so claims cannot label need. The
code paths stay (market-score applies a model only if one is stored and
usable; none is), `train-demand-model.yml` is manual only, and 025 is unneeded.
Do not lower `MIN_GAIN` or drop the direction gate to make models pass: that
reintroduces the geography-as-need bug. A future attempt needs a different
label (e.g. use by patient residence), not looser gates. The strong
supply-to-volume relationship could instead power an expected-patient-volume
estimate for the What if? panel (not built). Pediatrics, OB-GYN
and dental are never trained (not Medicare business). In `market-score`, the
catchment is built with the same `addAcs`/`addPlaces` helpers; any unknown input
means no learned value, and the hand-weighted need stays (`evidence.need.basis`
is `learned` only when the model applied). Learned need does not take the
group-basis confidence penalty and adds a Medicare-FFS-only caveat.

Tests: `scripts/test-market-model.mjs`, `scripts/test-demand-model.mjs`.

## Scheduled imports

All in `.github/workflows/`, each with `workflow_dispatch`:

- **LEIE** (`import-leie.mjs`, monthly 8th): **full refresh**, not upsert, so
  reinstated providers disappear. Imports all ~83k records. Aborts under
  50,000 parsed rows.
- **Medicare activity** (`import-medicare-activity.mjs`, monthly 12th): feeds
  `npi_activity` from the Physician & Other Practitioners PUF and PECOS Order &
  Referring. **Dataset URLs are resolved from the CMS DCAT catalog at run time**
  because CMS mints a new UUID per year. The title pattern **excludes** "by
  Provider and Service" / "by Geography and Service" (one row per HCPCS code).
  O&R is republished weekly with the same year, so snapshots sort by full date.
  The 2024 PUF sits under a `/2026-05/` path, so the year is read from the
  title **before** the URL. Volume floors: 500k PUF NPIs, 1M O&R.
- **Medicare enrollment** (`import-medicare-enrollment.mjs`, monthly 18th):
  the source is CMS's **full 2013-to-present history**; the script keeps the
  newest month and **upserts by `fips`**. Suppressed cells are the string
  `"*"`: map to `null`, never 0. Floor: 2,500 counties.
- **Medicare Advantage payers** (`import-medicare-advantage-payers.mjs`,
  monthly 22nd): MA enrollment by state joined to the Contract Directory's
  marketing names; Local/Regional CCP only.
- **ZIP-county crosswalk** (`import-zip-county-crosswalk.mjs`, quarterly 25th):
  HUD API, 51 state-level calls; `year`/`quarter` are siblings of `results[]`,
  not per-row fields. Needs `HUD_API_TOKEN`.
- **Demand model** (`train-demand-model.mjs`, **manual only, parked**): streams the CMS
  by-Provider PUF (`Rndrng_NPI`, `Rndrng_Prvdr_Zip5`, `Tot_Benes`), takes each
  clinician's specialty from `provider_individuals` by NPI (their
  `taxonomy_code` through the reviewed table), places ZIPs in their majority county (HUD crosswalk), and learns
  patients per 1,000 **original-Medicare** enrollees from county aggregates of
  `census_acs_zcta` and `cdc_places`. Writes `market_benchmarks` kind
  `demand_model` (migration 025). Catalog lookup shared with the activity import
  via `scripts/lib/cms-catalog.mjs`, which matches titles **without** the
  trailing " : YYYY-MM-DD" release stamp data.cms.gov began appending by
  2026-10 (it broke every `$`-anchored pattern). The workflow takes an optional
  `puf_url` input to bypass the catalog. Floor: 500k clinicians.
- **Census ACS detail** (`import-census-acs.mjs`, yearly Jan 15): the newest
  ACS 5-year by ZCTA into `census_acs_zcta`. The script resolves the year at
  run time, checks every variable's Census label against `EXPECTED_LABELS`
  (`scripts/lib/acs.mjs`) and refuses to write if one moved, requires 30,000
  ZCTAs and bands that add up on 99% of rows. `CENSUS_API_KEY` is **required** (free; the data API answers "Missing Key" without it, while the metadata calls work without one).
- **Census SAHIE** (`import-sahie.mjs`, yearly Sept 10): newest year found by
  trying back from last year, county slice `AGECAT=0&RACECAT=0&SEXCAT=0&IPRCAT=0`,
  column check before parsing, floor 3,000 counties. Needs `CENSUS_API_KEY`.
- **Market benchmarks** (`build-market-benchmarks.mjs`, quarterly 27th):
  measure percentiles, per-specialty national rates, and per-state density
  (`state_density`). Run it by hand after changing what it computes.
- **CDC PLACES** (`import-cdc-places.mjs`, yearly Sept 20).
- **NPI ZIP enrichment** (`enrich-npi-zips.mjs`, hourly): see below.
- **Schema snapshot** (`schema-snapshot.yml`, weekly Mondays): see Supabase
  schema. It commits to `main` itself (`[skip netlify]`); those bot commits
  are the one exception to the README-per-push rule.
- **Taxonomy inventory** (`taxonomy-inventory.yml`, manual only,
  `scripts/taxonomy-inventory.sh`): one read-only GROUP BY over `clinics`,
  `provider_individuals` and `clinic_secondary_locations` (session forced
  `default_transaction_read_only`), written with the newest NUCC CSV (link
  scraped from nucc.org, highest version) to `supabase/reference/`. Commits to
  `main` like the snapshot. It also fetches the CMS taxonomy crosswalk (a
  warning, not a failure, if CMS is down) and rebuilds `taxonomy-map.js`, so a
  new NUCC release flows through. Until the backfill runs, the directory tables
  store taxonomy **names only**.
- **Taxonomy backfill** (`taxonomy-backfill.yml`, manual only): see NUCC
  codes. Inputs `mode` (`dry_run` / `apply`), `disk_free_gb`, `nppes_url`.
  Commits `taxonomy-backfill-summary.md` and `taxonomy-exceptions.csv` (capped
  at 200,000 rows). The NPPES file is about 1 GB zipped, 9M rows; NPPES_MIN_ROWS
  exists only for tests.
- **Taxonomy code indexes** (`taxonomy-indexes.yml`, manual,
  `scripts/taxonomy-indexes.sh`): applies 030 through psql, because the SQL
  editor wraps a pasted script in one transaction and `CREATE INDEX
  CONCURRENTLY` refuses that (error 25001, 2026-10-09). Drops invalid leftovers
  first; fails unless all three indexes are valid. Use the same pattern for any
  future concurrent index migration.
- **Database size report** (`db-size-report.yml`, manual, `scripts/db-size-report.sh`):
  read-only sizes of every table and index, dead rows, index use, WAL, to
  `supabase/reference/db-size-report.md`. Run it before any disk decision.
- **Tests** (`tests.yml`): every pull request and push to main.

Shared helpers live in `scripts/lib/bulk.mjs`; `import-leie.mjs` is
deliberately not rewired onto them.

## Accuracy scoring (`lib/accuracy-signals.js`)

Hand-weighted and explainable: every number must survive "why did you flag my
provider?". Evidence combines through a **logistic**, not a clamped sum (a
clamped sum discarded most evidence and let a deactivated NPI move the score
not at all).

**Unknown is never clean.** A missing input contributes zero weight and is
listed in `signals` as `unknown`.

**Two findings override the arithmetic**: a deactivated NPI forces
`likely_inactive`; an open OIG name+state flag forces `unverifiable`.

**`Number(null)` is `0` and `Number.isFinite(0)` is `true`.** Check presence
*before* coercion. Getting this backwards aged every NULL claims year 2026
years and graded 43% of `npi_activity` `likely_inactive`. Tests were green
throughout.

## NPI-1 vs NPI-2 decides whether the accuracy engine can say anything

`clinics` is entirely NPI-2 organizations. The behavioral sources (PUF
`Rndrng_NPI`, PECOS O&R) are individuals, and **organizations do not render
services**, so `npi_activity` never joins to an organizational NPI.

| Input | Mean confidence | Verdicts |
|---|---|---|
| Organizations from `clinics` | 0.35 | 5/5 `unverifiable` |
| Individuals from NPPES | 0.66 | 4 `likely_accurate`, 1 `likely_inactive` |

An all-`unverifiable` audit almost always means the wrong **input**. That's why
`audit-run.js` takes explicit `npis[]` only; a sampling mode that drew from
`clinics` was removed.

## NPI ZIP enrichment (hourly backfill)

A search queues its ZIP (`zip-enrich-request.js`, `lib/zip-enrichment.js`,
30-day freshness) instead of pulling NPPES inline, because an exhaustive pull
doesn't fit a search's budget. `scripts/enrich-npi-zips.mjs` fetches NPI-1 and
NPI-2 per queued ZIP, drops deactivated NPIs, diffs, and inserts what's
missing: NPI-2 into `clinics`, NPI-1 into `provider_individuals`. **No
geocoding here**; rows without coordinates are never drawn.

## Individual physicians and secondary locations on the map

Both maps read `clinics`, `provider_individuals` and
`clinic_secondary_locations`, tagging rows `_src: 'clinic' | 'individual' |
'secondary'`.

- **Secondary rows never wear the verified ring** (they're aliased to the
  parent NPI).
- **Affiliation is a live same-coordinate guess** in the dashboard popup ("May
  practice at …"), because `affiliated_clinic_npi` is NULL in production. A
  hint, never a fact.

Density fixes on the dashboard (2026-08-12): popups scroll via CSS
(`.leaflet-popup-content { max-height: 360px; overflow-y: auto; }`), because
Leaflet's `maxHeight` is measured once before async enrichment lands;
clustering stays on at every zoom with spiderfy; a Provider Source filter hides
noisy layers.

## National NPPES bulk-load pipeline (outside this repo)

A one-time national extract from the March 2026 NPPES dissemination file, run
by hand, state by state, on the founder's machine. Not in git, not deployed.
Stages: extract by entity type (dropping deactivated rows); geocode (Census
batch, ZIP-centroid fallback, ArcGIS retry; `geocode_precision` records the
tier); link affiliations by coordinates rounded to ~1m, address-precision only,
ambiguous buildings left unmatched (DC pilot linked ~9.7%, but the output never
reached production); upload by upsert. Credentials come from environment
variables only.

**All 50 states + DC were loaded by 2026-08-15** (spot-checked per state with
`count=planned`). An automated sweep that reported half the states empty was
rate-limiting, not a real gap; verify with spaced-out requests before trusting
a coverage hole. Territories and PR are not loaded.

## Credentials

`ANTHROPIC_API_KEY` (Netlify, Functions scope) belongs to the **project's own
Anthropic API account**, separate from the founder's personal account. Every
model call in `v2/netlify/functions/` bills there; cost and rate-limit
questions are about that account.

`AUDIT_ADMIN_KEY` gates `audit-run`, `audit-narrate` and `report-generate` in
audit mode. Founder-only; **no frontend may ever reference it**. It is a Netlify
secret scoped to Functions, and functions only pick up new env vars on a
**redeploy**. An unset key returns 503. It is separate from `ADMIN_PASSWORD`.
Never write either value into this repo.

## Tests

Plain Node scripts, no runner, each printing `N passed, M failed` and exiting
non-zero on failure. All run in CI (`tests.yml`) after a syntax check of every
function, asset and script and a `require` of every function.

```bash
node scripts/test-accuracy-signals.mjs    # 76: scoring, incl. the Number(null) case
node scripts/test-query-plan.mjs          # 61: the market-memo allowlist
node scripts/test-claimed-relevance.mjs   # 37: specialty gating (imports the real practisesAny)
node scripts/test-market-model.mjs        # 33: the market opportunity model, incl. bucketing by code
node scripts/test-demand-model.mjs        # 45: the learned demand model, trainer end to end, and scoring
node scripts/test-sahie.mjs               # 14: SAHIE parsing, importer, and market-score's county pick
node scripts/test-acs.mjs                 # 46: the ACS import and the richer income ranking
node scripts/test-scenario.mjs            # 14: the what-if re-score changes supply only
node scripts/test-market-assistant.mjs    # 59: the assistant, figure repair, tracing (needs npm ci in v2/)
node scripts/test-answer-check.mjs        # 38: which figures count as traced
node scripts/test-signup-gate.mjs         # 9: patient sign-up is closed unless "true"
node scripts/test-density-benchmark.mjs   # 13: the state density comparison is like for like
node scripts/test-market-benchmarks.mjs   # 7: the benchmark builder end to end, specialty rates by code
node scripts/test-taxonomy-map.mjs        # 71: NUCC map, no default bucket, primary-code choice, exact-name fallback, reviewed ambiguous names, patient specialty coverage
node scripts/test-patient-query.mjs       # 92: typed words to specialties (whole words, generic words, new categories), codesFor per label, the frozen market list
```

Frontends are verified in headless Chromium (Playwright) against mocked
Supabase and function responses before shipping; those harnesses are not in
the repo yet.

**Green tests are not sufficient here.** The `Number(null)` bug and both
verdict-override bugs were green throughout. When changing scoring or matching,
look at the output a human would see.

## Verify against real data, not assumptions

Both taxonomy bugs, the LEIE coverage limit, the CMS field names, and the
benchmark timeouts were found by querying live data. The publishable key
allows read-only probing:

```bash
curl -s "$SUPABASE_URL/rest/v1/clinics?select=primary_taxonomy&limit=1000" -H "apikey: $PUBLISHABLE_KEY"
```

`200` with `[]` means the table exists but RLS hid the rows; `404` means the
table is missing; `400` means a column is.
